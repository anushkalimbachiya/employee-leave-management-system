from rest_framework import permissions


class IsManager(permissions.BasePermission):
    """Grants access only to users with the MANAGER role."""

    message = "Only managers can perform this action."

    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.is_manager)


class IsEmployee(permissions.BasePermission):
    """Grants access only to users with the EMPLOYEE role."""

    message = "Only employees can perform this action."

    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.is_employee)


class IsOwnerOrManager(permissions.BasePermission):
    """
    Object-level permission: the employee who owns the leave request, or
    any manager, may view/act on it. Only the owning employee may edit it
    (and only while pending); only a manager may approve/reject.
    """

    def has_object_permission(self, request, view, obj):
        user = request.user
        if user.is_manager:
            return True
        return obj.employee_id == user.id
