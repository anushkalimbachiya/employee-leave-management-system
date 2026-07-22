import datetime

from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model

from leaves.models import LeaveRequest

User = get_user_model()


class Command(BaseCommand):
    help = "Seeds the database with a demo manager, employees, and sample leave requests."

    def handle(self, *args, **options):
        if User.objects.filter(username="manager1").exists():
            self.stdout.write(self.style.WARNING("Demo data already exists. Skipping."))
            return

        manager = User.objects.create_superuser(
            username="manager1",
            email="manager1@technodha.com",
            password="Manager@123",
            first_name="Priya",
            last_name="Shah",
            role=User.Role.MANAGER,
            department="Engineering",
        )

        employees_data = [
            ("employee1", "Rahul", "Mehta"),
            ("employee2", "Sneha", "Patel"),
            ("employee3", "Arjun", "Nair"),
        ]
        employees = []
        for username, first, last in employees_data:
            emp = User.objects.create_user(
                username=username,
                email=f"{username}@technodha.com",
                password="Employee@123",
                first_name=first,
                last_name=last,
                role=User.Role.EMPLOYEE,
                manager=manager,
                department="Engineering",
                date_joined_company=datetime.date(2024, 1, 15),
            )
            employees.append(emp)

        today = datetime.date.today()
        LeaveRequest.objects.create(
            employee=employees[0],
            start_date=today + datetime.timedelta(days=10),
            end_date=today + datetime.timedelta(days=12),
            reason="Family function",
            status=LeaveRequest.Status.PENDING,
        )
        LeaveRequest.objects.create(
            employee=employees[1],
            start_date=today - datetime.timedelta(days=5),
            end_date=today - datetime.timedelta(days=3),
            reason="Medical appointment",
            status=LeaveRequest.Status.APPROVED,
            decided_by=manager,
            decided_on=today - datetime.timedelta(days=6),
        )

        self.stdout.write(self.style.SUCCESS("Demo data created successfully."))
        self.stdout.write("Manager login   -> username: manager1   password: Manager@123")
        self.stdout.write("Employee logins -> employee1/employee2/employee3  password: Employee@123")
