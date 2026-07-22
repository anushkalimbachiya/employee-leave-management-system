import datetime

from django.conf import settings
from django.db.models import Q
from rest_framework import serializers

from .models import LeaveRequest


class LeaveEmployeeMiniSerializer(serializers.Serializer):
    """Small nested representation of the employee on a leave request."""

    id = serializers.IntegerField()
    username = serializers.CharField()
    full_name = serializers.SerializerMethodField()
    department = serializers.CharField()

    def get_full_name(self, obj):
        return obj.get_full_name() or obj.username


class LeaveRequestSerializer(serializers.ModelSerializer):
    """
    Used for listing/retrieving leave requests. Read-only, richly nested.
    """

    employee = LeaveEmployeeMiniSerializer(read_only=True)
    decided_by_name = serializers.CharField(
        source="decided_by.get_full_name", read_only=True, default=""
    )
    number_of_days = serializers.IntegerField(read_only=True)

    class Meta:
        model = LeaveRequest
        fields = (
            "id",
            "employee",
            "start_date",
            "end_date",
            "number_of_days",
            "reason",
            "status",
            "applied_on",
            "updated_on",
            "decided_by",
            "decided_by_name",
            "decided_on",
            "manager_comment",
        )
        read_only_fields = fields


class LeaveRequestCreateSerializer(serializers.ModelSerializer):
    """
    Used when an employee applies for leave. Enforces every rule from the
    spec:
      * cannot apply for past dates
      * end date cannot be before start date
      * cannot overlap with an existing APPROVED leave
      * cannot exceed the annual leave quota (default 20)
    """

    class Meta:
        model = LeaveRequest
        fields = ("id", "start_date", "end_date", "reason", "status")
        read_only_fields = ("id", "status")

    def validate(self, attrs):
        start_date = attrs["start_date"]
        end_date = attrs["end_date"]
        today = datetime.date.today()
        request = self.context["request"]
        employee = request.user

        if start_date < today:
            raise serializers.ValidationError(
                {"start_date": "Cannot apply for leave on a past date."}
            )

        if end_date < start_date:
            raise serializers.ValidationError(
                {"end_date": "End date cannot be before start date."}
            )

        overlap_qs = LeaveRequest.objects.filter(
            employee=employee,
            status=LeaveRequest.Status.APPROVED,
        ).filter(
            Q(start_date__lte=end_date) & Q(end_date__gte=start_date)
        )
        if overlap_qs.exists():
            raise serializers.ValidationError(
                "This leave request overlaps with an existing approved leave."
            )

        requested_days = (end_date - start_date).days + 1
        year = start_date.year
        used_days = self._approved_days_used_in_year(employee, year)
        max_leaves = getattr(settings, "MAX_ANNUAL_LEAVES", 20)

        if used_days + requested_days > max_leaves:
            remaining = max(max_leaves - used_days, 0)
            raise serializers.ValidationError(
                f"Insufficient leave balance. You have {remaining} day(s) remaining "
                f"out of {max_leaves} annual leaves for {year}."
            )

        return attrs

    @staticmethod
    def _approved_days_used_in_year(employee, year):
        approved = LeaveRequest.objects.filter(
            employee=employee,
            status=LeaveRequest.Status.APPROVED,
            start_date__year=year,
        )
        return sum(lr.number_of_days for lr in approved)

    def create(self, validated_data):
        validated_data["employee"] = self.context["request"].user
        validated_data["status"] = LeaveRequest.Status.PENDING
        return super().create(validated_data)


class LeaveDecisionSerializer(serializers.Serializer):
    """Used by a manager to approve or reject a pending leave request."""

    status = serializers.ChoiceField(
        choices=[LeaveRequest.Status.APPROVED, LeaveRequest.Status.REJECTED]
    )
    manager_comment = serializers.CharField(max_length=500, required=False, allow_blank=True)

    def validate(self, attrs):
        leave = self.context["leave"]
        if leave.status != LeaveRequest.Status.PENDING:
            raise serializers.ValidationError(
                f"This leave request has already been {leave.status.lower()} and cannot be modified."
            )

        if attrs["status"] == LeaveRequest.Status.APPROVED:
            overlap_qs = LeaveRequest.objects.filter(
                employee=leave.employee,
                status=LeaveRequest.Status.APPROVED,
            ).filter(
                Q(start_date__lte=leave.end_date) & Q(end_date__gte=leave.start_date)
            )
            if overlap_qs.exists():
                raise serializers.ValidationError(
                    "Cannot approve: overlaps with another already-approved leave for this employee."
                )
        return attrs
