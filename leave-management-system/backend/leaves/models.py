from django.conf import settings
from django.db import models


class LeaveRequest(models.Model):
    """
    Represents a single leave application submitted by an employee.
    Business rules (max annual leaves, no past dates, no overlaps, etc.)
    are enforced in the serializer so that validation errors are surfaced
    cleanly to the API consumer, but a couple of DB-level guards are added
    here too as a safety net.
    """

    class Status(models.TextChoices):
        PENDING = "PENDING", "Pending"
        APPROVED = "APPROVED", "Approved"
        REJECTED = "REJECTED", "Rejected"
        CANCELLED = "CANCELLED", "Cancelled"

    class LeaveType(models.TextChoices):
        ANNUAL = "ANNUAL", "Annual Leave"
        SICK = "SICK", "Sick Leave"
        CASUAL = "CASUAL", "Casual Leave"
        UNPAID = "UNPAID", "Unpaid Leave"

    employee = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="leave_requests",
    )
    leave_type = models.CharField(
        max_length=10,
        choices=LeaveType.choices,
        default=LeaveType.ANNUAL,
    )
    start_date = models.DateField()
    end_date = models.DateField()
    reason = models.TextField(max_length=1000)
    status = models.CharField(max_length=10, choices=Status.choices, default=Status.PENDING)

    applied_on = models.DateTimeField(auto_now_add=True)
    updated_on = models.DateTimeField(auto_now=True)

    decided_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="decisions_made",
    )
    decided_on = models.DateTimeField(null=True, blank=True)
    manager_comment = models.CharField(max_length=500, blank=True, default="")

    class Meta:
        ordering = ["-applied_on"]
        indexes = [
            models.Index(fields=["employee", "status"]),
            models.Index(fields=["start_date", "end_date"]),
        ]
        constraints = [
            models.CheckConstraint(
                check=models.Q(end_date__gte=models.F("start_date")),
                name="end_date_gte_start_date",
            )
        ]

    def __str__(self):
        return f"{self.employee} | {self.start_date} to {self.end_date} | {self.status}"

    @property
    def number_of_days(self):
        return (self.end_date - self.start_date).days + 1
