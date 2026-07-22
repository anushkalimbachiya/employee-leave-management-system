from django.contrib import admin

from .models import LeaveRequest


@admin.register(LeaveRequest)
class LeaveRequestAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "employee",
        "start_date",
        "end_date",
        "number_of_days",
        "status",
        "applied_on",
        "decided_by",
    )
    list_filter = ("status", "start_date")
    search_fields = ("employee__username", "employee__first_name", "employee__last_name", "reason")
    readonly_fields = ("applied_on", "updated_on")
