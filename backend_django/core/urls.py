from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)
from . import views
from .s3_views import S3PresignedUploadView
from .auth_views import RegisterView, UserProfileView

router = DefaultRouter()
router.register(r'users', views.UserViewSet)
router.register(r'groups', views.GroupViewSet)
router.register(r'costing-centers', views.CostingCenterViewSet)
router.register(r'equipment', views.EquipmentViewSet)
router.register(r'production-records', views.ProductionRecordViewSet)
router.register(r'expenses', views.ExpenseViewSet)
router.register(r'invoices', views.InvoiceViewSet)
router.register(r'licenses', views.LicenseViewSet)
router.register(r'insurance-policies', views.InsurancePolicyViewSet)
router.register(r'company-certificates', views.CompanyCertificateViewSet)
router.register(r'mous', views.MOUViewSet)
router.register(r'financial-statements', views.FinancialStatementViewSet)
router.register(r'attendance', views.AttendanceViewSet)

urlpatterns = [
    # Authentication
    path('auth/login/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('auth/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('auth/register/', RegisterView.as_view(), name='register'),
    path('auth/me/', UserProfileView.as_view(), name='user_profile'),
    
    # S3 Presigned URLs
    path('s3/presign/', S3PresignedUploadView.as_view(), name='s3_presign'),
    
    # API routes
    path('', include(router.urls)),
]