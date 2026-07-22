import datetime

from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from .models import LeaveRequest

User = get_user_model()


class LeaveManagementTestCase(APITestCase):
    def setUp(self):
        self.manager = User.objects.create_user(
            username="mgr", password="pass12345", role=User.Role.MANAGER
        )
        self.employee = User.objects.create_user(
            username="emp", password="pass12345", role=User.Role.EMPLOYEE, manager=self.manager
        )
        self.other_employee = User.objects.create_user(
            username="emp2", password="pass12345", role=User.Role.EMPLOYEE, manager=self.manager
        )

    def _login(self, username, password="pass12345"):
        url = reverse("token_obtain_pair")
        response = self.client.post(url, {"username": username, "password": password})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        token = response.data["access"]
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")

    def test_employee_can_apply_for_leave(self):
        self._login("emp")
        url = reverse("leave-request-list")
        today = datetime.date.today()
        payload = {
            "start_date": str(today + datetime.timedelta(days=5)),
            "end_date": str(today + datetime.timedelta(days=7)),
            "reason": "Personal work",
        }
        response = self.client.post(url, payload)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED, response.data)
        self.assertEqual(response.data["status"], "PENDING")

    def test_cannot_apply_for_past_dates(self):
        self._login("emp")
        url = reverse("leave-request-list")
        today = datetime.date.today()
        payload = {
            "start_date": str(today - datetime.timedelta(days=2)),
            "end_date": str(today),
            "reason": "Should fail",
        }
        response = self.client.post(url, payload)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_end_date_before_start_date_rejected(self):
        self._login("emp")
        url = reverse("leave-request-list")
        today = datetime.date.today()
        payload = {
            "start_date": str(today + datetime.timedelta(days=10)),
            "end_date": str(today + datetime.timedelta(days=5)),
            "reason": "Should fail",
        }
        response = self.client.post(url, payload)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_cannot_exceed_annual_quota(self):
        self._login("emp")
        url = reverse("leave-request-list")
        today = datetime.date.today()
        payload = {
            "start_date": str(today + datetime.timedelta(days=5)),
            "end_date": str(today + datetime.timedelta(days=30)),  # 26 days > 20
            "reason": "Too long",
        }
        response = self.client.post(url, payload)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_manager_can_approve_leave(self):
        leave = LeaveRequest.objects.create(
            employee=self.employee,
            start_date=datetime.date.today() + datetime.timedelta(days=1),
            end_date=datetime.date.today() + datetime.timedelta(days=2),
            reason="Trip",
        )
        self._login("mgr")
        url = reverse("leave-request-decision", args=[leave.id])
        response = self.client.post(url, {"status": "APPROVED", "manager_comment": "Enjoy!"})
        self.assertEqual(response.status_code, status.HTTP_200_OK, response.data)
        leave.refresh_from_db()
        self.assertEqual(leave.status, "APPROVED")
        self.assertEqual(leave.decided_by, self.manager)

    def test_employee_cannot_approve_own_leave(self):
        leave = LeaveRequest.objects.create(
            employee=self.employee,
            start_date=datetime.date.today() + datetime.timedelta(days=1),
            end_date=datetime.date.today() + datetime.timedelta(days=2),
            reason="Trip",
        )
        self._login("emp")
        url = reverse("leave-request-decision", args=[leave.id])
        response = self.client.post(url, {"status": "APPROVED"})
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_employee_can_cancel_pending_leave(self):
        leave = LeaveRequest.objects.create(
            employee=self.employee,
            start_date=datetime.date.today() + datetime.timedelta(days=1),
            end_date=datetime.date.today() + datetime.timedelta(days=2),
            reason="Trip",
        )
        self._login("emp")
        url = reverse("leave-request-detail", args=[leave.id])
        response = self.client.delete(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        leave.refresh_from_db()
        self.assertEqual(leave.status, "CANCELLED")

    def test_employee_cannot_see_others_leave(self):
        leave = LeaveRequest.objects.create(
            employee=self.other_employee,
            start_date=datetime.date.today() + datetime.timedelta(days=1),
            end_date=datetime.date.today() + datetime.timedelta(days=2),
            reason="Trip",
        )
        self._login("emp")
        url = reverse("leave-request-list")
        response = self.client.get(url)
        ids = [item["id"] for item in response.data["results"]]
        self.assertNotIn(leave.id, ids)

    def test_overlapping_approved_leave_rejected(self):
        today = datetime.date.today()
        LeaveRequest.objects.create(
            employee=self.employee,
            start_date=today + datetime.timedelta(days=5),
            end_date=today + datetime.timedelta(days=8),
            reason="Existing",
            status=LeaveRequest.Status.APPROVED,
        )
        self._login("emp")
        url = reverse("leave-request-list")
        payload = {
            "start_date": str(today + datetime.timedelta(days=7)),
            "end_date": str(today + datetime.timedelta(days=9)),
            "reason": "Overlaps",
        }
        response = self.client.post(url, payload)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
