from rest_framework import serializers
from django.contrib.auth.models import User, Group
from .models import (
    CostingCenter, Equipment, ProductionRecord, Expense, Invoice,
    License, InsurancePolicy, CompanyCertificate, MOU, FinancialStatement, Attendance
)

class UserSerializer(serializers.ModelSerializer):
    groups = serializers.StringRelatedField(many=True, read_only=True)
    
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'groups', 'date_joined']

class GroupSerializer(serializers.ModelSerializer):
    class Meta:
        model = Group
        fields = ['id', 'name']

class CostingCenterSerializer(serializers.ModelSerializer):
    name_display = serializers.CharField(source='get_name_display', read_only=True)
    
    class Meta:
        model = CostingCenter
        fields = '__all__'

class EquipmentSerializer(serializers.ModelSerializer):
    type_display = serializers.CharField(source='get_type_display', read_only=True)
    
    class Meta:
        model = Equipment
        fields = '__all__'

class ProductionRecordSerializer(serializers.ModelSerializer):
    activity_type_display = serializers.CharField(source='get_activity_type_display', read_only=True)
    equipment_details = EquipmentSerializer(source='equipment', many=True, read_only=True)
    
    class Meta:
        model = ProductionRecord
        fields = '__all__'

class ExpenseSerializer(serializers.ModelSerializer):
    category_display = serializers.CharField(source='get_category_display', read_only=True)
    equipment_name = serializers.CharField(source='equipment.name', read_only=True)
    costing_center_name = serializers.CharField(source='costing_center.get_name_display', read_only=True)
    
    class Meta:
        model = Expense
        fields = '__all__'

class InvoiceSerializer(serializers.ModelSerializer):
    type_display = serializers.CharField(source='get_type_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    
    class Meta:
        model = Invoice
        fields = '__all__'

class LicenseSerializer(serializers.ModelSerializer):
    file_url = serializers.SerializerMethodField()
    
    class Meta:
        model = License
        fields = '__all__'
        
    def get_file_url(self, obj):
        if obj.file:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.file.url)
            return obj.file.url
        return None

class InsurancePolicySerializer(serializers.ModelSerializer):
    type_display = serializers.CharField(source='get_type_display', read_only=True)
    file_url = serializers.SerializerMethodField()
    
    class Meta:
        model = InsurancePolicy
        fields = '__all__'
        
    def get_file_url(self, obj):
        if obj.file:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.file.url)
            return obj.file.url
        return None

class CompanyCertificateSerializer(serializers.ModelSerializer):
    type_display = serializers.CharField(source='get_type_display', read_only=True)
    file_url = serializers.SerializerMethodField()
    
    class Meta:
        model = CompanyCertificate
        fields = '__all__'
        
    def get_file_url(self, obj):
        if obj.file:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.file.url)
            return obj.file.url
        return None

class MOUSerializer(serializers.ModelSerializer):
    file_url = serializers.SerializerMethodField()
    
    class Meta:
        model = MOU
        fields = '__all__'
        
    def get_file_url(self, obj):
        if obj.file:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.file.url)
            return obj.file.url
        return None

class FinancialStatementSerializer(serializers.ModelSerializer):
    type_display = serializers.CharField(source='get_type_display', read_only=True)
    file_url = serializers.SerializerMethodField()
    
    class Meta:
        model = FinancialStatement
        fields = '__all__'
        
    def get_file_url(self, obj):
        if obj.file:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.file.url)
            return obj.file.url
        return None

class AttendanceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Attendance
        fields = '__all__'