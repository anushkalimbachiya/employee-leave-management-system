from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import EmployeeDashboardView, LeaveRequestViewSet, ManagerDashboardView

router = DefaultRouter()
router.register("requests", LeaveRequestViewSet, basename="leave-request")

urlpatterns = [
    path("dashboard/employee/", EmployeeDashboardView.as_view(), name="employee-dashboard"),
    path("dashboard/manager/", ManagerDashboardView.as_view(), name="manager-dashboard"),
    path("", include(router.urls)),
]
