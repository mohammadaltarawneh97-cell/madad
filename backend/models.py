from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone
from enum import Enum

class CompanyStatus(str, Enum):
    ACTIVE = "ACTIVE"
    SUSPENDED = "SUSPENDED"
    TRIAL = "TRIAL"

class UserRole(str, Enum):
    SUPERADMIN = "superadmin"      # Platform level admin
    OWNER = "owner"                # Company owner - full access
    MANAGER = "manager"            # Operations manager
    ACCOUNTANT = "accountant"      # Financial operations
    FOREMAN = "foreman"            # Production supervisor
    DRIVER = "driver"              # Field worker
    GUARD = "guard"                # Security personnel

# Role permissions mapping
ROLE_PERMISSIONS = {
    UserRole.SUPERADMIN: {
        "companies": ["create", "read", "update", "delete"],
        "users": ["create", "read", "update", "delete"],
        "equipment": ["create", "read", "update", "delete"],
        "production": ["create", "read", "update", "delete"],
        "expenses": ["create", "read", "update", "delete"],
        "invoices": ["create", "read", "update", "delete"],
        "attendance": ["create", "read", "update", "delete"],
        "costing_centers": ["create", "read", "update", "delete"],
        "dashboard": ["read"],
        "reports": ["read", "export"],
    },
    UserRole.OWNER: {
        "users": ["create", "read", "update", "delete"],
        "equipment": ["create", "read", "update", "delete"],
        "production": ["create", "read", "update", "delete"],
        "expenses": ["create", "read", "update", "delete"],
        "invoices": ["create", "read", "update", "delete"],
        "attendance": ["create", "read", "update", "delete"],
        "costing_centers": ["create", "read", "update", "delete"],
        "dashboard": ["read"],
        "reports": ["read", "export"],
    },
    UserRole.MANAGER: {
        "users": ["read"],
        "equipment": ["create", "read", "update"],
        "production": ["create", "read", "update"],
        "expenses": ["read"],
        "invoices": ["read"],
        "attendance": ["create", "read", "update"],
        "costing_centers": ["read"],
        "dashboard": ["read"],
        "reports": ["read", "export"],
    },
    UserRole.ACCOUNTANT: {
        "users": ["read"],
        "production": ["read"],
        "expenses": ["create", "read", "update", "delete"],
        "invoices": ["create", "read", "update", "delete"],
        "attendance": ["create", "read"],
        "costing_centers": ["read"],
        "dashboard": ["read"],
        "reports": ["read", "export"],
    },
    UserRole.FOREMAN: {
        "users": ["read"],
        "equipment": ["read", "update"],
        "production": ["create", "read", "update"],
        "expenses": ["read"],
        "invoices": ["read"],
        "attendance": ["create", "read", "update"],
        "costing_centers": ["read"],
        "dashboard": ["read"],
        "reports": ["read"],
    },
    UserRole.DRIVER: {
        "equipment": ["read"],
        "production": ["read"],
        "attendance": ["create", "read"],
        "dashboard": ["read"],
    },
    UserRole.GUARD: {
        "attendance": ["create", "read"],
    },
}

class Company(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str = Field(..., description="Company name in Arabic")
    name_en: Optional[str] = Field(None, description="Company name in English")
    commercial_register: Optional[str] = Field(None, description="Commercial registration number")
    tax_number: Optional[str] = Field(None, description="Tax identification number")
    phone: Optional[str] = None
    email: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    country: str = Field(default="Saudi Arabia")
    logo_url: Optional[str] = None
    primary_color: str = Field(default="#2563eb")
    secondary_color: str = Field(default="#f3f4f6")
    status: CompanyStatus = Field(default=CompanyStatus.TRIAL)
    subscription_plan: str = Field(default="basic")
    max_users: int = Field(default=5)
    max_equipment: int = Field(default=10)
    features: List[str] = Field(default_factory=lambda: ["equipment", "production", "expenses", "invoices"])
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class User(BaseModel):
    model_config = ConfigDict(extra="allow")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    username: str
    email: str
    full_name: str
    company_id: Optional[str] = None  # Main company association
    companies: List[str] = Field(default_factory=list)  # Multiple company access
    role: UserRole = Field(default=UserRole.DRIVER)  # User role
    is_active: bool = True
    phone: Optional[str] = None
    department: Optional[str] = None
    employee_id: Optional[str] = None
    avatar_url: Optional[str] = None
    last_login: Optional[datetime] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    
    def has_permission(self, resource: str, action: str) -> bool:
        """Check if user has permission for a resource and action"""
        if self.role == UserRole.SUPERADMIN:
            return True
        
        permissions = ROLE_PERMISSIONS.get(self.role, {})
        resource_permissions = permissions.get(resource, [])
        return action in resource_permissions

class UserCreate(BaseModel):
    username: str
    email: str
    full_name: str
    password: str
    company_id: Optional[str] = None
    role: Optional[UserRole] = UserRole.DRIVER
    phone: Optional[str] = None
    department: Optional[str] = None
    employee_id: Optional[str] = None

class UserLogin(BaseModel):
    username: str
    password: str

class CompanyCreate(BaseModel):
    name: str
    name_en: Optional[str] = None
    commercial_register: Optional[str] = None
    tax_number: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None

class CompanySwitch(BaseModel):
    company_id: str

# Base model for company-specific entities
class CompanyBaseModel(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    company_id: str = Field(..., description="Company ID this record belongs to")
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class CostingCenter(CompanyBaseModel):
    
    name: str = Field(..., description="Costing center name")
    name_ar: str = Field(..., description="Arabic name")
    description: Optional[str] = None
    is_active: bool = True

class CostingCenterCreate(BaseModel):
    name: str
    name_ar: str
    description: Optional[str] = None

class Equipment(CompanyBaseModel):
    
    name: str
    type: str
    model: str
    serial_number: Optional[str] = None
    hours_operated: float = 0.0
    maintenance_notes: Optional[str] = None
    purchase_date: Optional[datetime] = None
    purchase_price: Optional[float] = None
    current_value: Optional[float] = None
    is_active: bool = True

class EquipmentCreate(BaseModel):
    name: str
    type: str
    model: str
    serial_number: Optional[str] = None
    hours_operated: float = 0.0
    maintenance_notes: Optional[str] = None
    purchase_date: Optional[datetime] = None
    purchase_price: Optional[float] = None

class Production(CompanyBaseModel):
    date: datetime
    activity_type: str
    actual_qty: float
    contract_qty: float
    completion_rate: float = Field(default=0.0)
    equipment_ids: List[str] = []
    supervisor: Optional[str] = None
    shift: Optional[str] = None
    notes: Optional[str] = None

class ProductionCreate(BaseModel):
    date: datetime
    activity_type: str
    actual_qty: float
    contract_qty: float
    equipment_ids: List[str] = []
    supervisor: Optional[str] = None
    shift: Optional[str] = None
    notes: Optional[str] = None

class Expense(CompanyBaseModel):
    
    date: datetime
    category: str
    subcategory: Optional[str] = None
    amount: float
    description: str
    equipment_id: Optional[str] = None
    costing_center_id: Optional[str] = None
    receipt_number: Optional[str] = None
    supplier: Optional[str] = None
    approved_by: Optional[str] = None

class ExpenseCreate(BaseModel):
    date: datetime
    category: str
    subcategory: Optional[str] = None
    amount: float
    description: str
    equipment_id: Optional[str] = None
    costing_center_id: Optional[str] = None
    receipt_number: Optional[str] = None
    supplier: Optional[str] = None

class Invoice(CompanyBaseModel):
    
    date: datetime
    invoice_number: str
    type: str
    client_name: str
    client_contact: Optional[str] = None
    amount: float
    quantity: Optional[float] = None
    unit_price: Optional[float] = None
    vat_amount: Optional[float] = None
    total_amount: Optional[float] = None
    status: str = "DRAFT"
    due_date: Optional[datetime] = None
    payment_date: Optional[datetime] = None
    notes: Optional[str] = None

class InvoiceCreate(BaseModel):
    date: datetime
    invoice_number: str
    type: str
    client_name: str
    client_contact: Optional[str] = None
    amount: float
    quantity: Optional[float] = None
    unit_price: Optional[float] = None
    status: str = "DRAFT"
    due_date: Optional[datetime] = None
    notes: Optional[str] = None

class Attendance(CompanyBaseModel):
    employee_name: str
    employee_id: Optional[str] = None
    department: Optional[str] = None
    date: datetime
    check_in: Optional[datetime] = None
    check_out: Optional[datetime] = None
    hours_worked: Optional[float] = None
    overtime_hours: Optional[float] = None
    break_hours: Optional[float] = None
    notes: Optional[str] = None

class AttendanceCreate(BaseModel):
    employee_name: str
    employee_id: Optional[str] = None
    department: Optional[str] = None
    date: datetime
    check_in: Optional[datetime] = None
    check_out: Optional[datetime] = None
    hours_worked: Optional[float] = None
    overtime_hours: Optional[float] = None
    break_hours: Optional[float] = None
    notes: Optional[str] = None

class License(CompanyBaseModel):
    name: str
    license_number: str
    issuing_authority: str
    issue_date: datetime
    expiry_date: datetime
    license_type: str
    file_url: Optional[str] = None
    notes: Optional[str] = None
    is_active: bool = True

class LicenseCreate(BaseModel):
    name: str
    license_number: str
    issuing_authority: str
    issue_date: datetime
    expiry_date: datetime
    license_type: str
    notes: Optional[str] = None

class Token(BaseModel):
    access_token: str
    token_type: str
    expires_in: int
    user: User
    company: Optional[Company] = None