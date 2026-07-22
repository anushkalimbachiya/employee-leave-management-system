from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from leaves.models import LeaveRequest
from datetime import date, timedelta

User = get_user_model()

class Command(BaseCommand):
    help = "Seeds initial sample data for Manager, Employee, and Leave Requests"

    def handle(self, *args, **options):
        self.stdout.write("Seeding sample data...")

        # 1. Create Manager
        manager, created = User.objects.get_or_create(
            username="manager1",
            defaults={
                "email": "manager1@example.com",
                "first_name": "Sarah",
                "last_name": "Connor",
                "role": User.Role.MANAGER,
                "department": "Engineering",
            }
        )
        if created:
            manager.set_password("password123")
            manager.save()
            self.stdout.write(self.style.SUCCESS("Created Manager: manager1 / password123"))
        else:
            self.stdout.write("Manager 'manager1' already exists.")

        # 2. Create Employee
        employee, created = User.objects.get_or_create(
            username="employee1",
            defaults={
                "email": "employee1@example.com",
                "first_name": "John",
                "last_name": "Doe",
                "role": User.Role.EMPLOYEE,
                "manager": manager,
                "department": "Engineering",
            }
        )
        if created:
            employee.set_password("password123")
            employee.save()
            self.stdout.write(self.style.SUCCESS("Created Employee: employee1 / password123"))
        else:
            self.stdout.write("Employee 'employee1' already exists.")

        # 3. Create Sample Leave Requests
        today = date.today()
        if not LeaveRequest.objects.filter(employee=employee).exists():
            LeaveRequest.objects.create(
                employee=employee,
                start_date=today + timedelta(days=5),
                end_date=today + timedelta(days=7),
                reason="Annual vacation with family.",
                status=LeaveRequest.Status.PENDING,
            )
            LeaveRequest.objects.create(
                employee=employee,
                start_date=today - timedelta(days=10),
                end_date=today - timedelta(days=9),
                reason="Doctor appointment and rest.",
                status=LeaveRequest.Status.APPROVED,
            )
            self.stdout.write(self.style.SUCCESS("Created sample leave requests for employee1."))

        self.stdout.write(self.style.SUCCESS("Successfully seeded sample data!"))
