from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView

from .views import (
    CustomTokenObtainPairView,
    EmployeeListView,
    ManagerListView,
    MeView,
    RegisterView,
)

urlpatterns = [
    path("login/", CustomTokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("login/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    path("register/", RegisterView.as_view(), name="register"),
    path("me/", MeView.as_view(), name="me"),
    path("managers/", ManagerListView.as_view(), name="managers-list"),
    path("employees/", EmployeeListView.as_view(), name="employees-list"),
]
