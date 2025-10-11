from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters
from django.contrib.auth.models import User, Group
from django.db.models import Sum, Avg, Count, Q
from django.http import HttpResponse
import csv
import io
from datetime import datetime, timedelta
import pandas as pd
from decimal import Decimal

from .models import (
    CostingCenter, Equipment, ProductionRecord, Expense, Invoice,
    License, InsurancePolicy, CompanyCertificate, MOU, FinancialStatement, Attendance
)
from .serializers import (
    UserSerializer, GroupSerializer, CostingCenterSerializer, EquipmentSerializer,
    ProductionRecordSerializer, ExpenseSerializer, InvoiceSerializer,
    LicenseSerializer, InsurancePolicySerializer, CompanyCertificateSerializer,
    MOUSerializer, FinancialStatementSerializer, AttendanceSerializer
)

class BaseViewSet(viewsets.ModelViewSet):
    """Base viewset with common functionality"""
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    
    @action(detail=False, methods=['get'])
    def template_csv(self, request):
        """Download CSV template with headers only"""
        model = self.get_queryset().model
        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = f'attachment; filename="{model._meta.verbose_name}_template.csv"'
        
        writer = csv.writer(response)
        # Get field names excluding auto fields
        field_names = [f.name for f in model._meta.fields if not f.auto_created and f.name != 'id']
        writer.writerow(field_names)
        
        return response
    
    @action(detail=False, methods=['get'])
    def sample_csv(self, request):
        """Download CSV with sample data"""
        queryset = self.get_queryset()[:5]  # First 5 records as sample
        model = queryset.model
        
        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = f'attachment; filename="{model._meta.verbose_name}_sample.csv"'
        
        writer = csv.writer(response)
        field_names = [f.name for f in model._meta.fields if not f.auto_created and f.name != 'id']
        writer.writerow(field_names)
        
        for obj in queryset:
            row = []
            for field_name in field_names:
                value = getattr(obj, field_name, '')
                if hasattr(value, 'strftime'):  # Date/DateTime field
                    value = value.strftime('%Y-%m-%d')
                row.append(str(value) if value is not None else '')
            writer.writerow(row)
        
        return response
    
    @action(detail=False, methods=['post'])
    def import_csv(self, request):
        """Import data from CSV file"""
        if 'file' not in request.FILES:
            return Response({'error': 'No file provided'}, status=status.HTTP_400_BAD_REQUEST)
        
        csv_file = request.FILES['file']
        if not csv_file.name.endswith('.csv'):
            return Response({'error': 'File must be CSV format'}, status=status.HTTP_400_BAD_REQUEST)
        
        # For now, return success message. Implementation can be added per model
        return Response({'message': 'CSV import functionality ready for implementation'}, status=status.HTTP_200_OK)

class UserViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

class GroupViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Group.objects.all()
    serializer_class = GroupSerializer
    permission_classes = [permissions.IsAuthenticated]

class CostingCenterViewSet(BaseViewSet):
    queryset = CostingCenter.objects.all()
    serializer_class = CostingCenterSerializer
    filterset_fields = ['name', 'is_active']
    search_fields = ['name', 'description']
    ordering_fields = ['name', 'created_at']

class EquipmentViewSet(BaseViewSet):
    queryset = Equipment.objects.all()
    serializer_class = EquipmentSerializer
    filterset_fields = ['type', 'is_active']
    search_fields = ['name', 'model', 'serial_number']
    ordering_fields = ['name', 'type', 'hours_operated', 'created_at']

class ProductionRecordViewSet(BaseViewSet):
    queryset = ProductionRecord.objects.all()
    serializer_class = ProductionRecordSerializer
    filterset_fields = ['activity_type', 'date']
    search_fields = ['notes']
    ordering_fields = ['date', 'completion_rate', 'created_at']
    
    @action(detail=False, methods=['get'])
    def completion_trend(self, request):
        """Get production completion trend over time"""
        days = int(request.query_params.get('days', 30))
        end_date = datetime.now().date()
        start_date = end_date - timedelta(days=days)
        
        records = self.get_queryset().filter(
            date__range=[start_date, end_date]
        ).order_by('date')
        
        trend_data = []
        for record in records:
            trend_data.append({
                'date': record.date,
                'activity_type': record.activity_type,
                'completion_rate': record.completion_rate,
                'actual_qty': record.actual_qty,
                'contract_qty': record.contract_qty
            })
        
        return Response(trend_data)

class ExpenseViewSet(BaseViewSet):
    queryset = Expense.objects.all()
    serializer_class = ExpenseSerializer
    filterset_fields = ['category', 'equipment', 'costing_center', 'date']
    search_fields = ['description', 'receipt_number']
    ordering_fields = ['date', 'amount', 'category', 'created_at']
    
    @action(detail=False, methods=['get'])
    def fuel_oil_daily(self, request):
        """Get daily fuel and oil expenses"""
        days = int(request.query_params.get('days', 30))
        end_date = datetime.now().date()
        start_date = end_date - timedelta(days=days)
        
        fuel_expenses = self.get_queryset().filter(
            category='FUEL',
            date__range=[start_date, end_date]
        ).values('date').annotate(
            total_amount=Sum('amount'),
            count=Count('id')
        ).order_by('date')
        
        return Response(list(fuel_expenses))

class InvoiceViewSet(BaseViewSet):
    queryset = Invoice.objects.all()
    serializer_class = InvoiceSerializer
    filterset_fields = ['type', 'status', 'date']
    search_fields = ['invoice_number', 'client_name']
    ordering_fields = ['date', 'amount', 'status', 'created_at']
    
    @action(detail=False, methods=['get'])
    def by_activity(self, request):
        """Get invoices grouped by activity type"""
        activity_stats = self.get_queryset().values('type').annotate(
            total_amount=Sum('amount'),
            count=Count('id'),
            paid_amount=Sum('amount', filter=Q(status='PAID')),
            pending_amount=Sum('amount', filter=Q(status='PENDING'))
        ).order_by('-total_amount')
        
        return Response(list(activity_stats))

class LicenseViewSet(BaseViewSet):
    queryset = License.objects.all()
    serializer_class = LicenseSerializer
    filterset_fields = ['is_active', 'expiry_date']
    search_fields = ['name', 'license_number', 'issuing_authority']
    ordering_fields = ['name', 'issue_date', 'expiry_date', 'created_at']
    
    @action(detail=True, methods=['get'])
    def file_preview(self, request, pk=None):
        """Get file preview information"""
        license = self.get_object()
        if license.file:
            return Response({
                'file_url': license.file.url,
                'file_name': license.file.name,
                'file_size': license.file.size if hasattr(license.file, 'size') else None
            })
        return Response({'error': 'No file attached'}, status=status.HTTP_404_NOT_FOUND)

class InsurancePolicyViewSet(BaseViewSet):
    queryset = InsurancePolicy.objects.all()
    serializer_class = InsurancePolicySerializer
    filterset_fields = ['type', 'is_active', 'end_date']
    search_fields = ['name', 'policy_number', 'insurance_company']
    ordering_fields = ['name', 'start_date', 'end_date', 'created_at']

class CompanyCertificateViewSet(BaseViewSet):
    queryset = CompanyCertificate.objects.all()
    serializer_class = CompanyCertificateSerializer
    filterset_fields = ['type', 'is_active', 'expiry_date']
    search_fields = ['name', 'certificate_number', 'issuing_authority']
    ordering_fields = ['name', 'issue_date', 'expiry_date', 'created_at']

class MOUViewSet(BaseViewSet):
    queryset = MOU.objects.all()
    serializer_class = MOUSerializer
    filterset_fields = ['is_active', 'signing_date', 'expiry_date']
    search_fields = ['title', 'party_name', 'mou_number']
    ordering_fields = ['title', 'signing_date', 'expiry_date', 'created_at']

class FinancialStatementViewSet(BaseViewSet):
    queryset = FinancialStatement.objects.all()
    serializer_class = FinancialStatementSerializer
    filterset_fields = ['type', 'period_start', 'period_end']
    search_fields = ['name', 'notes']
    ordering_fields = ['name', 'period_start', 'period_end', 'created_at']

class AttendanceViewSet(BaseViewSet):
    queryset = Attendance.objects.all()
    serializer_class = AttendanceSerializer
    filterset_fields = ['employee_name', 'date']
    search_fields = ['employee_name', 'notes']
    ordering_fields = ['employee_name', 'date', 'hours_worked', 'created_at']