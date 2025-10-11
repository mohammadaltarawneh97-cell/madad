from django.db import models
from django.contrib.auth.models import User
from django.core.validators import MinValueValidator, MaxValueValidator
import uuid

class BaseModel(models.Model):
    """Base model with common fields"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        abstract = True

class CostingCenter(BaseModel):
    """Costing Centers for operations"""
    COSTING_CHOICES = [
        ('SCREENING', 'غربلة'),
        ('CRUSHING', 'كسارة'),
        ('HAULING', 'نقل'),
        ('FEEDING', 'تغذية'),
        ('WASHING', 'غسيل'),
        ('OTHER', 'أخرى'),
    ]
    
    name = models.CharField(max_length=20, choices=COSTING_CHOICES, unique=True)
    description = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)
    
    class Meta:
        verbose_name = 'مركز التكلفة'
        verbose_name_plural = 'مراكز التكلفة'
        
    def __str__(self):
        return self.get_name_display()

class Equipment(BaseModel):
    """Equipment management"""
    EQUIPMENT_TYPES = [
        ('DT', 'شاحنة قلاب'),
        ('PC', 'حفارة'),
        ('WL', 'محمل'),
        ('GR', 'جريدر'),
        ('RL', 'رولر'),
        ('PLANT', 'معدات المصنع'),
    ]
    
    name = models.CharField(max_length=200, verbose_name='اسم المعدة')
    type = models.CharField(max_length=10, choices=EQUIPMENT_TYPES, verbose_name='نوع المعدة')
    model = models.CharField(max_length=200, verbose_name='الموديل')
    serial_number = models.CharField(max_length=100, blank=True, verbose_name='الرقم التسلسلي')
    hours_operated = models.FloatField(default=0, validators=[MinValueValidator(0)], verbose_name='ساعات التشغيل')
    maintenance_notes = models.TextField(blank=True, verbose_name='ملاحظات الصيانة')
    is_active = models.BooleanField(default=True, verbose_name='نشط')
    
    class Meta:
        verbose_name = 'معدة'
        verbose_name_plural = 'المعدات'
        
    def __str__(self):
        return f"{self.name} ({self.get_type_display()})"

class ProductionRecord(BaseModel):
    """Production tracking with completion rates"""
    ACTIVITY_CHOICES = CostingCenter.COSTING_CHOICES
    
    date = models.DateField(verbose_name='التاريخ')
    activity_type = models.CharField(max_length=20, choices=ACTIVITY_CHOICES, verbose_name='نوع النشاط')
    actual_qty = models.FloatField(validators=[MinValueValidator(0)], verbose_name='الكمية الفعلية')
    contract_qty = models.FloatField(validators=[MinValueValidator(0)], verbose_name='الكمية المتعاقد عليها')
    completion_rate = models.FloatField(editable=False, verbose_name='معدل الإنجاز')
    equipment = models.ManyToManyField(Equipment, blank=True, verbose_name='المعدات المستخدمة')
    notes = models.TextField(blank=True, verbose_name='ملاحظات')
    
    class Meta:
        verbose_name = 'سجل إنتاج'
        verbose_name_plural = 'سجلات الإنتاج'
        ordering = ['-date']
    
    def save(self, *args, **kwargs):
        # Auto-calculate completion rate
        if self.contract_qty > 0:
            self.completion_rate = (self.actual_qty / self.contract_qty) * 100
        else:
            self.completion_rate = 0
        super().save(*args, **kwargs)
        
    def __str__(self):
        return f"{self.get_activity_type_display()} - {self.date}"

class Expense(BaseModel):
    """Expense management with categories"""
    EXPENSE_CATEGORIES = [
        ('FUEL', 'وقود'),
        ('MAINTENANCE', 'صيانة'),
        ('LABOR', 'عمالة'),
        ('MATERIALS', 'مواد'),
        ('OTHER', 'أخرى'),
    ]
    
    date = models.DateField(verbose_name='التاريخ')
    category = models.CharField(max_length=20, choices=EXPENSE_CATEGORIES, verbose_name='التصنيف')
    subcategory = models.CharField(max_length=100, blank=True, verbose_name='التصنيف الفرعي')
    amount = models.DecimalField(max_digits=12, decimal_places=2, validators=[MinValueValidator(0)], verbose_name='المبلغ')
    description = models.TextField(verbose_name='الوصف')
    equipment = models.ForeignKey(Equipment, on_delete=models.SET_NULL, null=True, blank=True, verbose_name='المعدة')
    costing_center = models.ForeignKey(CostingCenter, on_delete=models.SET_NULL, null=True, blank=True, verbose_name='مركز التكلفة')
    receipt_number = models.CharField(max_length=100, blank=True, verbose_name='رقم الإيصال')
    
    class Meta:
        verbose_name = 'مصروف'
        verbose_name_plural = 'المصروفات'
        ordering = ['-date']
        
    def __str__(self):
        return f"{self.get_category_display()} - {self.amount} ر.س - {self.date}"

class Invoice(BaseModel):
    """Invoice management with client tracking"""
    INVOICE_TYPES = CostingCenter.COSTING_CHOICES
    STATUS_CHOICES = [
        ('PENDING', 'معلقة'),
        ('PAID', 'مدفوعة'),
        ('CANCELLED', 'ملغاة'),
    ]
    
    date = models.DateField(verbose_name='التاريخ')
    invoice_number = models.CharField(max_length=100, unique=True, verbose_name='رقم الفاتورة')
    type = models.CharField(max_length=20, choices=INVOICE_TYPES, verbose_name='نوع النشاط')
    client_name = models.CharField(max_length=200, verbose_name='اسم العميل')
    amount = models.DecimalField(max_digits=12, decimal_places=2, validators=[MinValueValidator(0)], verbose_name='المبلغ')
    quantity = models.FloatField(null=True, blank=True, validators=[MinValueValidator(0)], verbose_name='الكمية')
    unit_price = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True, validators=[MinValueValidator(0)], verbose_name='سعر الوحدة')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING', verbose_name='الحالة')
    notes = models.TextField(blank=True, verbose_name='ملاحظات')
    
    class Meta:
        verbose_name = 'فاتورة'
        verbose_name_plural = 'الفواتير'
        ordering = ['-date']
        
    def __str__(self):
        return f"{self.invoice_number} - {self.client_name}"

class License(BaseModel):
    """License management with file uploads"""
    name = models.CharField(max_length=200, verbose_name='اسم الترخيص')
    license_number = models.CharField(max_length=100, unique=True, verbose_name='رقم الترخيص')
    issuing_authority = models.CharField(max_length=200, verbose_name='الجهة المصدرة')
    issue_date = models.DateField(verbose_name='تاريخ الإصدار')
    expiry_date = models.DateField(verbose_name='تاريخ الانتهاء')
    file = models.FileField(upload_to='licenses/', blank=True, verbose_name='الملف')
    notes = models.TextField(blank=True, verbose_name='ملاحظات')
    is_active = models.BooleanField(default=True, verbose_name='نشط')
    
    class Meta:
        verbose_name = 'ترخيص'
        verbose_name_plural = 'التراخيص'
        ordering = ['expiry_date']
        
    def __str__(self):
        return f"{self.name} - {self.license_number}"

class InsurancePolicy(BaseModel):
    """Insurance policies management"""
    INSURANCE_TYPES = [
        ('EQUIPMENT', 'تأمين المعدات'),
        ('EMPLOYEE', 'تأمين الموظفين'),
        ('LIABILITY', 'تأمين المسؤولية'),
        ('OTHER', 'أخرى'),
    ]
    
    name = models.CharField(max_length=200, verbose_name='اسم البوليصة')
    type = models.CharField(max_length=20, choices=INSURANCE_TYPES, verbose_name='نوع التأمين')
    policy_number = models.CharField(max_length=100, unique=True, verbose_name='رقم البوليصة')
    insurance_company = models.CharField(max_length=200, verbose_name='شركة التأمين')
    coverage_amount = models.DecimalField(max_digits=12, decimal_places=2, validators=[MinValueValidator(0)], verbose_name='مبلغ التغطية')
    start_date = models.DateField(verbose_name='تاريخ البداية')
    end_date = models.DateField(verbose_name='تاريخ النهاية')
    file = models.FileField(upload_to='insurance/', blank=True, verbose_name='الملف')
    notes = models.TextField(blank=True, verbose_name='ملاحظات')
    is_active = models.BooleanField(default=True, verbose_name='نشط')
    
    class Meta:
        verbose_name = 'بوليصة تأمين'
        verbose_name_plural = 'بوائص التأمين'
        ordering = ['end_date']
        
    def __str__(self):
        return f"{self.name} - {self.policy_number}"

class CompanyCertificate(BaseModel):
    """Company certificates management"""
    CERTIFICATE_TYPES = [
        ('COMMERCIAL_REGISTER', 'السجل التجاري'),
        ('CLASSIFICATION', 'شهادة التصنيف'),
        ('ISO', 'شهادة الأيزو'),
        ('CAREER_LICENSE', 'ترخيص مهني'),
        ('OTHER', 'أخرى'),
    ]
    
    name = models.CharField(max_length=200, verbose_name='اسم الشهادة')
    type = models.CharField(max_length=30, choices=CERTIFICATE_TYPES, verbose_name='نوع الشهادة')
    certificate_number = models.CharField(max_length=100, verbose_name='رقم الشهادة')
    issuing_authority = models.CharField(max_length=200, verbose_name='الجهة المصدرة')
    issue_date = models.DateField(verbose_name='تاريخ الإصدار')
    expiry_date = models.DateField(null=True, blank=True, verbose_name='تاريخ الانتهاء')
    file = models.FileField(upload_to='certificates/', blank=True, verbose_name='الملف')
    notes = models.TextField(blank=True, verbose_name='ملاحظات')
    is_active = models.BooleanField(default=True, verbose_name='نشط')
    
    class Meta:
        verbose_name = 'شهادة الشركة'
        verbose_name_plural = 'شهادات الشركة'
        ordering = ['expiry_date']
        
    def __str__(self):
        return f"{self.name} - {self.certificate_number}"

class MOU(BaseModel):
    """MOUs management"""
    title = models.CharField(max_length=200, verbose_name='عنوان المذكرة')
    party_name = models.CharField(max_length=200, verbose_name='اسم الطرف الآخر')
    mou_number = models.CharField(max_length=100, unique=True, verbose_name='رقم المذكرة')
    signing_date = models.DateField(verbose_name='تاريخ التوقيع')
    expiry_date = models.DateField(null=True, blank=True, verbose_name='تاريخ الانتهاء')
    value = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True, validators=[MinValueValidator(0)], verbose_name='القيمة')
    file = models.FileField(upload_to='mous/', blank=True, verbose_name='الملف')
    description = models.TextField(blank=True, verbose_name='الوصف')
    is_active = models.BooleanField(default=True, verbose_name='نشط')
    
    class Meta:
        verbose_name = 'مذكرة تفاهم'
        verbose_name_plural = 'مذكرات التفاهم'
        ordering = ['-signing_date']
        
    def __str__(self):
        return f"{self.title} - {self.party_name}"

class FinancialStatement(BaseModel):
    """Financial statements management"""
    STATEMENT_TYPES = [
        ('BALANCE_SHEET', 'الميزانية العمومية'),
        ('INCOME_STATEMENT', 'قائمة الدخل'),
        ('CASH_FLOW', 'قائمة التدفق النقدي'),
        ('BUDGET', 'الميزانية'),
        ('OTHER', 'أخرى'),
    ]
    
    name = models.CharField(max_length=200, verbose_name='اسم القائمة')
    type = models.CharField(max_length=20, choices=STATEMENT_TYPES, verbose_name='نوع القائمة')
    period_start = models.DateField(verbose_name='بداية الفترة')
    period_end = models.DateField(verbose_name='نهاية الفترة')
    file = models.FileField(upload_to='financial_statements/', verbose_name='الملف')
    notes = models.TextField(blank=True, verbose_name='ملاحظات')
    
    class Meta:
        verbose_name = 'قائمة مالية'
        verbose_name_plural = 'القوائم المالية'
        ordering = ['-period_end']
        
    def __str__(self):
        return f"{self.get_type_display()} - {self.period_start} إلى {self.period_end}"

class Attendance(BaseModel):
    """Employee attendance management"""
    employee_name = models.CharField(max_length=200, verbose_name='اسم الموظف')
    date = models.DateField(verbose_name='التاريخ')
    check_in = models.TimeField(null=True, blank=True, verbose_name='وقت الحضور')
    check_out = models.TimeField(null=True, blank=True, verbose_name='وقت الانصراف')
    hours_worked = models.FloatField(null=True, blank=True, validators=[MinValueValidator(0)], verbose_name='ساعات العمل')
    overtime_hours = models.FloatField(null=True, blank=True, validators=[MinValueValidator(0)], verbose_name='الساعات الإضافية')
    notes = models.TextField(blank=True, verbose_name='ملاحظات')
    
    class Meta:
        verbose_name = 'حضور'
        verbose_name_plural = 'سجلات الحضور'
        ordering = ['-date']
        unique_together = ['employee_name', 'date']
        
    def __str__(self):
        return f"{self.employee_name} - {self.date}"