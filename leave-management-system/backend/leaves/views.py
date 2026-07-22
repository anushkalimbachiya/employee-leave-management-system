import datetime

import django_filters
from django.conf import settings
from django.utils import timezone
from rest_framework import viewsets, permissions, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import LeaveRequest
from .notifications import notify_leave_applied, notify_leave_decision
from .permissions import IsEmployee, IsOwnerOrManager
from .serializers import (
    LeaveDecisionSerializer,
    LeaveRequestCreateSerializer,
    LeaveRequestSerializer,
)


class LeaveRequestFilter(django_filters.FilterSet):
    status = django_filters.ChoiceFilter(choices=LeaveRequest.Status.choices)
    start_date_after = django_filters.DateFilter(field_name="start_date", lookup_expr="gte")
    start_date_before = django_filters.DateFilter(field_name="start_date", lookup_expr="lte")

    class Meta:
        model = LeaveRequest
        fields = ["status", "employee"]


class LeaveRequestViewSet(viewsets.ModelViewSet):
    """
    Central API for leave applications.

    * Employees see and manage only their own leave requests.
    * Managers see every employee's leave requests, filterable by status,
      and can approve/reject via the `decision` action.
    * Supports search (?search=employee name) and ordering.
    """

    permission_classes = [permissions.IsAuthenticated, IsOwnerOrManager]
    filterset_class = LeaveRequestFilter
    search_fields = ["employee__first_name", "employee__last_name", "employee__username", "reason"]
    ordering_fields = ["applied_on", "start_date", "end_date", "status"]
    ordering = ["-applied_on"]

    def get_queryset(self):
        user = self.request.user
        qs = LeaveRequest.objects.select_related("employee", "decided_by")
        if user.is_manager:
            # Managers view leave requests for their direct reports by default.
            team_ids = list(user.team_members.values_list("id", flat=True))
            if self.request.query_params.get("all") == "true":
                return qs
            return qs.filter(employee_id__in=team_ids)
        return qs.filter(employee=user)

    def get_serializer_class(self):
        if self.action == "create":
            return LeaveRequestCreateSerializer
        return LeaveRequestSerializer

    def get_permissions(self):
        if self.action == "create":
            return [permissions.IsAuthenticated(), IsEmployee()]
        return super().get_permissions()

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        leave = serializer.save()
        notify_leave_applied(leave)
        output = LeaveRequestSerializer(leave)
        return Response(output.data, status=status.HTTP_201_CREATED)

    def destroy(self, request, *args, **kwargs):
        """Cancelling a *pending* leave request. Only the owning employee may do this."""
        leave = self.get_object()
        if leave.employee_id != request.user.id:
            return Response(
                {"detail": "You can only cancel your own leave requests."},
                status=status.HTTP_403_FORBIDDEN,
            )
        if leave.status != LeaveRequest.Status.PENDING:
            return Response(
                {"detail": "Only pending leave requests can be cancelled."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        leave.status = LeaveRequest.Status.CANCELLED
        leave.save(update_fields=["status", "updated_on"])
        return Response(LeaveRequestSerializer(leave).data, status=status.HTTP_200_OK)

    @action(detail=True, methods=["post"], permission_classes=[permissions.IsAuthenticated])
    def decision(self, request, pk=None):
        """POST /api/leaves/requests/{id}/decision/  {status, manager_comment}"""
        leave = self.get_object()
        if not request.user.is_manager:
            return Response(
                {"detail": "Only managers can approve or reject leave requests."},
                status=status.HTTP_403_FORBIDDEN,
            )
        if leave.employee.manager_id != request.user.id:
            return Response(
                {"detail": "You can only decide on leave requests for your own direct reports."},
                status=status.HTTP_403_FORBIDDEN,
            )
        serializer = LeaveDecisionSerializer(data=request.data, context={"leave": leave})
        serializer.is_valid(raise_exception=True)

        leave.status = serializer.validated_data["status"]
        leave.manager_comment = serializer.validated_data.get("manager_comment", "")
        leave.decided_by = request.user
        leave.decided_on = timezone.now()
        leave.save()

        notify_leave_decision(leave)
        return Response(LeaveRequestSerializer(leave).data, status=status.HTTP_200_OK)


class EmployeeDashboardView(APIView):
    """GET /api/leaves/dashboard/employee/"""

    permission_classes = [permissions.IsAuthenticated, IsEmployee]

    def get(self, request):
        user = request.user
        year = datetime.date.today().year
        qs = LeaveRequest.objects.filter(employee=user, start_date__year=year)

        approved = qs.filter(status=LeaveRequest.Status.APPROVED)
        pending = qs.filter(status=LeaveRequest.Status.PENDING)

        approved_days = sum(lr.number_of_days for lr in approved)
        max_leaves = getattr(settings, "MAX_ANNUAL_LEAVES", 20)

        return Response(
            {
                "year": year,
                "max_annual_leaves": max_leaves,
                "approved_leaves_taken": approved_days,
                "remaining_leaves": max(max_leaves - approved_days, 0),
                "pending_leaves_count": pending.count(),
                "approved_leaves_count": approved.count(),
                "recent_requests": LeaveRequestSerializer(
                    qs.order_by("-applied_on")[:5], many=True
                ).data,
            }
        )


class ManagerDashboardView(APIView):
    """GET /api/leaves/dashboard/manager/"""

    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        if not user.is_manager:
            return Response({"detail": "Only managers can view this dashboard."}, status=403)

        today = datetime.date.today()
        team_ids = list(user.team_members.values_list("id", flat=True))
        team_qs = LeaveRequest.objects.filter(employee_id__in=team_ids)

        pending_requests = team_qs.filter(status=LeaveRequest.Status.PENDING)
        approved_today = team_qs.filter(
            status=LeaveRequest.Status.APPROVED, decided_on__date=today
        )
        total_employees = len(team_ids)

        return Response(
            {
                "pending_requests_count": pending_requests.count(),
                "approved_today_count": approved_today.count(),
                "total_employees": total_employees,
                "pending_requests": LeaveRequestSerializer(
                    pending_requests.order_by("-applied_on")[:10], many=True
                ).data,
            }
        )
