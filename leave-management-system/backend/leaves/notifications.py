from django.core.mail import send_mail


def notify_leave_applied(leave):
    manager = leave.employee.manager
    if not manager or not manager.email:
        return
    send_mail(
        subject=f"New leave request from {leave.employee.get_full_name() or leave.employee.username}",
        message=(
            f"{leave.employee.get_full_name() or leave.employee.username} has requested leave "
            f"from {leave.start_date} to {leave.end_date} ({leave.number_of_days} day(s)).\n\n"
            f"Reason: {leave.reason}"
        ),
        from_email=None,
        recipient_list=[manager.email],
        fail_silently=True,
    )


def notify_leave_decision(leave):
    employee = leave.employee
    if not employee.email:
        return
    send_mail(
        subject=f"Your leave request has been {leave.status.lower()}",
        message=(
            f"Your leave request from {leave.start_date} to {leave.end_date} has been "
            f"{leave.status.lower()} by {leave.decided_by.get_full_name() if leave.decided_by else 'your manager'}.\n\n"
            f"Comment: {leave.manager_comment or '(none)'}"
        ),
        from_email=None,
        recipient_list=[employee.email],
        fail_silently=True,
    )
