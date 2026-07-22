from django.contrib.auth import get_user_model
from rest_framework import generics, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView

from .serializers import CustomTokenObtainPairSerializer, RegisterSerializer, UserSerializer

User = get_user_model()


class CustomTokenObtainPairView(TokenObtainPairView):
    """POST /api/auth/login/ -> {access, refresh, user}"""

    serializer_class = CustomTokenObtainPairSerializer


class RegisterView(generics.CreateAPIView):
    """
    POST /api/auth/register/
    Open registration is useful for demo/testing purposes. In a production
    deployment this would typically be restricted to admins only.
    """

    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]


class MeView(APIView):
    """GET /api/auth/me/ -> currently authenticated user's profile"""

    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        return Response(UserSerializer(request.user).data)


class ManagerListView(generics.ListAPIView):
    """GET /api/auth/managers/ -> list of managers (used by registration form)"""

    queryset = User.objects.filter(role=User.Role.MANAGER)
    serializer_class = UserSerializer
    permission_classes = [permissions.AllowAny]


class EmployeeListView(generics.ListAPIView):
    """
    GET /api/auth/employees/
    Managers only: list of employees reporting to the authenticated manager
    (or all employees, if requested with ?all=true, for the stats view).
    """

    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        qs = User.objects.filter(role=User.Role.EMPLOYEE)
        if user.is_manager and self.request.query_params.get("all") != "true":
            qs = qs.filter(manager=user)
        return qs.order_by("first_name", "last_name")
