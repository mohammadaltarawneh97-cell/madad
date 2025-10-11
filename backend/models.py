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
        "projects": ["create", "read", "update", "delete"],
        "feasibility_studies": ["create", "read", "update", "delete"],
        "investments": ["create", "read", "update", "delete"],
        "financial_projections": ["create", "read", "update", "delete"],
        "documents": ["create", "read", "update", "delete"],
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
        "projects": ["create", "read", "update", "delete"],
        "feasibility_studies": ["create", "read", "update", "delete"],
        "investments": ["create", "read", "update", "delete"],
        "financial_projections": ["create", "read", "update", "delete"],
        "documents": ["create", "read", "update", "delete"],
        "employees": ["create", "read", "update", "delete"],
        "salary": ["create", "read", "update", "delete"],
        "leave": ["create", "read", "update", "delete", "approve"],
        "vehicles": ["create", "read", "update", "delete"],
        "vehicle_location": ["read", "update"],
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
        "projects": ["create", "read", "update"],
        "feasibility_studies": ["read", "update"],
        "investments": ["read"],
        "financial_projections": ["read"],
        "documents": ["create", "read"],
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
        "projects": ["read"],
        "feasibility_studies": ["read"],
        "investments": ["create", "read", "update", "delete"],
        "financial_projections": ["create", "read", "update", "delete"],
        "documents": ["read"],
        "dashboard": ["read"],
        "reports": ["read", "export"],
    },
    UserRole.FOREMAN: {
        "users": ["read"],
        "equipment": ["create", "read", "update"],
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
        "employees": ["read_own"],  # Can only see their own profile
        "salary": ["read_own"],  # Can only see their own salary
        "vehicles": ["read_assigned"],  # Can only see assigned vehicle
        "vehicle_location": ["read", "update"],  # Can update GPS location
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


# Project Management Models
class ProjectStatus(str, Enum):
    PLANNING = "planning"
    IN_PROGRESS = "in_progress"
    ON_HOLD = "on_hold"
    COMPLETED = "completed"
    CANCELLED = "cancelled"

class ProjectPriority(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"

class Project(CompanyBaseModel):
    name: str
    name_ar: str
    description: Optional[str] = None
    status: ProjectStatus = ProjectStatus.PLANNING
    priority: ProjectPriority = ProjectPriority.MEDIUM
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    estimated_budget: Optional[float] = None
    actual_cost: Optional[float] = None
    completion_percentage: float = 0.0
    project_manager: Optional[str] = None
    team_members: List[str] = Field(default_factory=list)
    location: Optional[str] = None
    objectives: Optional[str] = None
    deliverables: List[str] = Field(default_factory=list)
    tags: List[str] = Field(default_factory=list)
    documents: List[str] = Field(default_factory=list)  # Document IDs

class ProjectCreate(BaseModel):
    name: str
    name_ar: str
    description: Optional[str] = None
    status: Optional[ProjectStatus] = ProjectStatus.PLANNING
    priority: Optional[ProjectPriority] = ProjectPriority.MEDIUM
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    estimated_budget: Optional[float] = None
    project_manager: Optional[str] = None
    location: Optional[str] = None
    objectives: Optional[str] = None

# Feasibility Study Models
class StudyPhaseStatus(str, Enum):
    NOT_STARTED = "not_started"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    DELAYED = "delayed"

class FeasibilityPhase(BaseModel):
    phase_number: int
    phase_name: str
    phase_name_ar: str
    description: Optional[str] = None
    status: StudyPhaseStatus = StudyPhaseStatus.NOT_STARTED
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    duration_weeks: Optional[int] = None
    deliverables: List[str] = Field(default_factory=list)
    completion_percentage: float = 0.0
    notes: Optional[str] = None

class FeasibilityStudy(CompanyBaseModel):
    project_id: str  # Link to Project
    study_name: str
    study_name_ar: str
    consultant: Optional[str] = None
    study_cost: Optional[float] = None
    currency: str = "JOD"
    total_duration_weeks: Optional[int] = None
    start_date: Optional[datetime] = None
    expected_end_date: Optional[datetime] = None
    actual_end_date: Optional[datetime] = None
    overall_status: StudyPhaseStatus = StudyPhaseStatus.NOT_STARTED
    phases: List[FeasibilityPhase] = Field(default_factory=list)
    findings: Optional[str] = None
    recommendations: Optional[str] = None
    documents: List[str] = Field(default_factory=list)

class FeasibilityStudyCreate(BaseModel):
    project_id: str
    study_name: str
    study_name_ar: str
    consultant: Optional[str] = None
    study_cost: Optional[float] = None
    total_duration_weeks: Optional[int] = None
    start_date: Optional[datetime] = None

# Investment & Financial Tracking Models
class InvestmentType(str, Enum):
    EQUITY = "equity"
    DEBT = "debt"
    GRANT = "grant"
    INTERNAL = "internal"

class Investment(CompanyBaseModel):
    project_id: str  # Link to Project
    investor_name: str
    investment_type: InvestmentType
    amount: float
    currency: str = "JOD"
    investment_date: datetime
    expected_return_percentage: Optional[float] = None
    maturity_date: Optional[datetime] = None
    terms: Optional[str] = None
    status: str = "active"
    notes: Optional[str] = None

class InvestmentCreate(BaseModel):
    project_id: str
    investor_name: str
    investment_type: InvestmentType
    amount: float
    currency: Optional[str] = "JOD"
    investment_date: datetime
    expected_return_percentage: Optional[float] = None
    maturity_date: Optional[datetime] = None
    terms: Optional[str] = None

class FinancialProjection(CompanyBaseModel):
    project_id: str
    year: int
    capex: Optional[float] = None  # Capital Expenditure
    opex: Optional[float] = None  # Operational Expenditure
    revenue: Optional[float] = None
    gross_profit: Optional[float] = None
    net_profit: Optional[float] = None
    cash_flow: Optional[float] = None
    roi: Optional[float] = None  # Return on Investment
    npv: Optional[float] = None  # Net Present Value
    irr: Optional[float] = None  # Internal Rate of Return
    payback_period: Optional[float] = None  # In years
    notes: Optional[str] = None

class FinancialProjectionCreate(BaseModel):
    project_id: str
    year: int
    capex: Optional[float] = None
    opex: Optional[float] = None
    revenue: Optional[float] = None
    notes: Optional[str] = None

# Document Management Models
class DocumentType(str, Enum):
    CONTRACT = "contract"
    FEASIBILITY_REPORT = "feasibility_report"
    TECHNICAL_SPEC = "technical_spec"
    FINANCIAL_REPORT = "financial_report"
    PROPOSAL = "proposal"
    PRESENTATION = "presentation"
    OTHER = "other"

class Document(CompanyBaseModel):
    name: str
    name_ar: Optional[str] = None
    document_type: DocumentType
    project_id: Optional[str] = None
    file_url: str
    file_size: Optional[int] = None  # In bytes
    mime_type: Optional[str] = None
    version: str = "1.0"
    uploaded_by: Optional[str] = None
    description: Optional[str] = None
    tags: List[str] = Field(default_factory=list)
    is_public: bool = False

class DocumentCreate(BaseModel):
    name: str
    name_ar: Optional[str] = None
    document_type: DocumentType
    project_id: Optional[str] = None
    file_url: str
    file_size: Optional[int] = None
    mime_type: Optional[str] = None
    description: Optional[str] = None
    tags: List[str] = Field(default_factory=list)


# HR Management Models (Oracle-style)
class EmploymentStatus(str, Enum):
    ACTIVE = "active"
    ON_LEAVE = "on_leave"
    SUSPENDED = "suspended"
    TERMINATED = "terminated"

class ContractType(str, Enum):
    FULL_TIME = "full_time"
    PART_TIME = "part_time"
    CONTRACT = "contract"
    TEMPORARY = "temporary"

class Employee(CompanyBaseModel):
    user_id: str  # Link to User
    employee_number: str
    full_name: str
    full_name_ar: str
    national_id: Optional[str] = None
    passport_number: Optional[str] = None
    date_of_birth: Optional[datetime] = None
    gender: Optional[str] = None
    nationality: Optional[str] = None
    
    # Contact
    phone: str
    emergency_contact: Optional[str] = None
    emergency_phone: Optional[str] = None
    address: Optional[str] = None
    
    # Employment
    employment_status: EmploymentStatus = EmploymentStatus.ACTIVE
    contract_type: ContractType = ContractType.FULL_TIME
    department: str
    position: str
    position_ar: str
    hire_date: datetime
    termination_date: Optional[datetime] = None
    
    # Salary (RESTRICTED - only owner/accountant/employee can see)
    base_salary: float
    currency: str = "JOD"
    
    # Manager
    manager_id: Optional[str] = None
    
    # Documents
    documents: List[str] = Field(default_factory=list)
    
    # Notes (NOT visible to employee)
    notes: Optional[str] = None

class EmployeeCreate(BaseModel):
    user_id: str
    employee_number: str
    full_name: str
    full_name_ar: str
    phone: str
    department: str
    position: str
    position_ar: str
    hire_date: datetime
    base_salary: float
    contract_type: Optional[ContractType] = ContractType.FULL_TIME

class SalaryPayment(CompanyBaseModel):
    employee_id: str
    employee_name: str
    month: int  # 1-12
    year: int
    base_salary: float
    bonuses: float = 0.0
    deductions: float = 0.0
    overtime_pay: float = 0.0
    net_salary: float
    currency: str = "JOD"
    payment_date: Optional[datetime] = None
    payment_method: Optional[str] = None  # bank_transfer, cash, check
    status: str = "pending"  # pending, paid, cancelled
    notes: Optional[str] = None

class SalaryPaymentCreate(BaseModel):
    employee_id: str
    month: int
    year: int
    base_salary: float
    bonuses: Optional[float] = 0.0
    deductions: Optional[float] = 0.0
    overtime_pay: Optional[float] = 0.0

class Leave(CompanyBaseModel):
    employee_id: str
    employee_name: str
    leave_type: str  # annual, sick, unpaid, emergency
    start_date: datetime
    end_date: datetime
    days: int
    reason: Optional[str] = None
    status: str = "pending"  # pending, approved, rejected
    approved_by: Optional[str] = None
    approved_date: Optional[datetime] = None
    notes: Optional[str] = None

class LeaveCreate(BaseModel):
    employee_id: str
    leave_type: str
    start_date: datetime
    end_date: datetime
    reason: Optional[str] = None

# Vehicle & GPS Tracking (for Drivers)
class VehicleStatus(str, Enum):
    ACTIVE = "active"
    MAINTENANCE = "maintenance"
    OUT_OF_SERVICE = "out_of_service"

class Vehicle(CompanyBaseModel):
    vehicle_number: str
    vehicle_type: str  # truck, excavator, loader, etc
    make: str
    model: str
    year: Optional[int] = None
    license_plate: str
    vin: Optional[str] = None
    status: VehicleStatus = VehicleStatus.ACTIVE
    
    # Assignment
    assigned_driver_id: Optional[str] = None
    assigned_driver_name: Optional[str] = None
    
    # GPS Data
    last_location_lat: Optional[float] = None
    last_location_lng: Optional[float] = None
    last_location_address: Optional[str] = None
    last_location_update: Optional[datetime] = None
    
    # Maintenance
    last_maintenance_date: Optional[datetime] = None
    next_maintenance_date: Optional[datetime] = None
    odometer: Optional[float] = None  # km
    
    notes: Optional[str] = None

class VehicleCreate(BaseModel):
    vehicle_number: str
    vehicle_type: str
    make: str
    model: str
    license_plate: str
    year: Optional[int] = None

class VehicleLocationUpdate(BaseModel):
    vehicle_id: str
    latitude: float
    longitude: float
    address: Optional[str] = None

