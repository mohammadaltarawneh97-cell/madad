from django.contrib import admin
from .models import (
    CostingCenter, Equipment, ProductionRecord, Expense, Invoice,
    License, InsurancePolicy, CompanyCertificate, MOU, FinancialStatement, Attendance
)

@admin.register(CostingCenter)
class CostingCenterAdmin(admin.ModelAdmin):
    list_display = ['name', 'description', 'is_active', 'created_at']
    list_filter = ['name', 'is_active']
    search_fields = ['name', 'description']

@admin.register(Equipment)
class EquipmentAdmin(admin.ModelAdmin):
    list_display = ['name', 'type', 'model', 'hours_operated', 'is_active', 'created_at']
    list_filter = ['type', 'is_active']
    search_fields = ['name', 'model', 'serial_number']

@admin.register(ProductionRecord)
class ProductionRecordAdmin(admin.ModelAdmin):
    list_display = ['date', 'activity_type', 'actual_qty', 'contract_qty', 'completion_rate']
    list_filter = ['activity_type', 'date']
    search_fields = ['notes']
    date_hierarchy = 'date'

@admin.register(Expense)
class ExpenseAdmin(admin.ModelAdmin):
    list_display = ['date', 'category', 'amount', 'description', 'equipment', 'receipt_number']
    list_filter = ['category', 'date']
    search_fields = ['description', 'receipt_number']
    date_hierarchy = 'date'

@admin.register(Invoice)
class InvoiceAdmin(admin.ModelAdmin):
    list_display = ['invoice_number', 'client_name', 'type', 'amount', 'status', 'date']
    list_filter = ['type', 'status', 'date']
    search_fields = ['invoice_number', 'client_name']
    date_hierarchy = 'date'

@admin.register(License)
class LicenseAdmin(admin.ModelAdmin):
    list_display = ['name', 'license_number', 'issuing_authority', 'issue_date', 'expiry_date', 'is_active']
    list_filter = ['is_active', 'issuing_authority']
    search_fields = ['name', 'license_number']
    date_hierarchy = 'expiry_date'

@admin.register(InsurancePolicy)
class InsurancePolicyAdmin(admin.ModelAdmin):
    list_display = ['name', 'type', 'policy_number', 'insurance_company', 'start_date', 'end_date', 'is_active']
    list_filter = ['type', 'is_active', 'insurance_company']
    search_fields = ['name', 'policy_number']
    date_hierarchy = 'end_date'

@admin.register(CompanyCertificate)
class CompanyCertificateAdmin(admin.ModelAdmin):
    list_display = ['name', 'type', 'certificate_number', 'issuing_authority', 'issue_date', 'expiry_date', 'is_active']
    list_filter = ['type', 'is_active', 'issuing_authority']
    search_fields = ['name', 'certificate_number']
    date_hierarchy = 'expiry_date'

@admin.register(MOU)
class MOUAdmin(admin.ModelAdmin):
    list_display = ['title', 'party_name', 'mou_number', 'signing_date', 'expiry_date', 'value', 'is_active']
    list_filter = ['is_active', 'signing_date']
    search_fields = ['title', 'party_name', 'mou_number']
    date_hierarchy = 'signing_date'

@admin.register(FinancialStatement)
class FinancialStatementAdmin(admin.ModelAdmin):
    list_display = ['name', 'type', 'period_start', 'period_end']
    list_filter = ['type', 'period_start']
    search_fields = ['name']
    date_hierarchy = 'period_end'

@admin.register(Attendance)
class AttendanceAdmin(admin.ModelAdmin):
    list_display = ['employee_name', 'date', 'check_in', 'check_out', 'hours_worked', 'overtime_hours']
    list_filter = ['date', 'employee_name']
    search_fields = ['employee_name']
    date_hierarchy = 'date'