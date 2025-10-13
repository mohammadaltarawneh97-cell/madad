"""
Enhanced CRM Models
Tasks, Activities, Product Catalog, Contracts, Email Integration, and Sales Forecasting
"""

from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone
from enum import Enum
from models import CompanyBaseModel


# ============================================================================
# TASKS & ACTIVITIES
# ============================================================================

class TaskStatus(str, Enum):
    NOT_STARTED = "not_started"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    DEFERRED = "deferred"
    CANCELLED = "cancelled"

class TaskPriority(str, Enum):
    LOW = "low"
    NORMAL = "normal"
    HIGH = "high"
    URGENT = "urgent"

class Task(CompanyBaseModel):
    """Task Management"""
    task_number: str
    subject: str
    description: Optional[str] = None
    
    # Assignment
    assigned_to: str
    assigned_to_name: str
    assigned_by: str
    assigned_by_name: str
    
    # Related To
    related_to_type: Optional[str] = None  # Lead, Account, Contact, Opportunity, Case
    related_to_id: Optional[str] = None
    related_to_name: Optional[str] = None
    
    # Scheduling
    due_date: Optional[datetime] = None
    start_date: Optional[datetime] = None
    reminder_date: Optional[datetime] = None
    
    # Status
    status: TaskStatus = TaskStatus.NOT_STARTED
    priority: TaskPriority = TaskPriority.NORMAL
    
    completion_date: Optional[datetime] = None
    completion_notes: Optional[str] = None

class TaskCreate(BaseModel):
    subject: str
    description: Optional[str] = None
    assigned_to: str
    related_to_type: Optional[str] = None
    related_to_id: Optional[str] = None
    due_date: Optional[datetime] = None
    priority: Optional[TaskPriority] = TaskPriority.NORMAL

class ActivityType(str, Enum):
    CALL = "call"
    MEETING = "meeting"
    EMAIL = "email"
    DEMO = "demo"
    PRESENTATION = "presentation"
    SITE_VISIT = "site_visit"
    OTHER = "other"

class Activity(CompanyBaseModel):
    """Activity Log"""
    activity_number: str
    activity_type: ActivityType
    subject: str
    description: Optional[str] = None
    
    # Related To
    related_to_type: str  # Lead, Account, Contact, Opportunity, Case
    related_to_id: str
    related_to_name: str
    
    # Scheduling
    activity_date: datetime
    duration_minutes: Optional[int] = None
    
    # Participants
    owner_id: str
    owner_name: str
    attendees: List[str] = Field(default_factory=list)
    
    # Outcome
    outcome: Optional[str] = None
    next_step: Optional[str] = None
    
    is_completed: bool = False
    completed_date: Optional[datetime] = None

class ActivityCreate(BaseModel):
    activity_type: ActivityType
    subject: str
    description: Optional[str] = None
    related_to_type: str
    related_to_id: str
    activity_date: datetime
    duration_minutes: Optional[int] = None
    outcome: Optional[str] = None
    next_step: Optional[str] = None


# ============================================================================
# PRODUCT CATALOG FOR CRM
# ============================================================================

class PriceListType(str, Enum):
    STANDARD = "standard"
    PROMOTIONAL = "promotional"
    VOLUME = "volume"
    CUSTOMER_SPECIFIC = "customer_specific"

class CRMProduct(CompanyBaseModel):
    """Product Catalog for Sales"""
    product_code: str
    product_name: str
    product_name_ar: Optional[str] = None
    product_family: Optional[str] = None
    
    description: Optional[str] = None
    description_ar: Optional[str] = None
    
    unit_of_measure: str = "piece"
    list_price: float
    cost_price: Optional[float] = None
    currency: str = "SAR"
    
    is_active: bool = True
    is_taxable: bool = True
    tax_rate: float = 0.15
    
    # Sales Information
    sales_description: Optional[str] = None
    recommended_quantity: Optional[float] = None
    
    # Images and Documents
    image_url: Optional[str] = None
    datasheet_url: Optional[str] = None
    
    # Linked to Warehouse (optional)
    warehouse_product_id: Optional[str] = None

class CRMProductCreate(BaseModel):
    product_code: str
    product_name: str
    product_name_ar: Optional[str] = None
    product_family: Optional[str] = None
    description: Optional[str] = None
    list_price: float
    unit_of_measure: Optional[str] = "piece"

class PriceList(CompanyBaseModel):
    """Price Lists"""
    price_list_code: str
    price_list_name: str
    price_list_name_ar: Optional[str] = None
    price_list_type: PriceListType
    
    effective_from: datetime
    effective_to: Optional[datetime] = None
    
    currency: str = "SAR"
    
    items: List[Dict[str, Any]] = Field(default_factory=list)  # product_id, price, discount
    
    is_active: bool = True

class PriceListCreate(BaseModel):
    price_list_code: str
    price_list_name: str
    price_list_type: PriceListType
    effective_from: datetime
    effective_to: Optional[datetime] = None
    items: List[Dict[str, Any]]

class OpportunityProduct(BaseModel):
    """Product line items in Opportunity"""
    line_number: int
    product_id: str
    product_code: str
    product_name: str
    quantity: float
    unit_price: float
    discount: float = 0.0
    tax_rate: float = 0.15
    tax_amount: float
    total_amount: float


# ============================================================================
# CONTRACTS
# ============================================================================

class ContractStatus(str, Enum):
    DRAFT = "draft"
    PENDING_APPROVAL = "pending_approval"
    ACTIVE = "active"
    EXPIRED = "expired"
    TERMINATED = "terminated"

class ContractType(str, Enum):
    SERVICE_AGREEMENT = "service_agreement"
    MAINTENANCE = "maintenance"
    SUBSCRIPTION = "subscription"
    SUPPLY_AGREEMENT = "supply_agreement"
    NDA = "nda"
    OTHER = "other"

class Contract(CompanyBaseModel):
    """Contracts"""
    contract_number: str
    contract_name: str
    contract_name_ar: Optional[str] = None
    contract_type: ContractType
    
    account_id: str
    account_name: str
    contact_id: Optional[str] = None
    contact_name: Optional[str] = None
    
    start_date: datetime
    end_date: datetime
    
    contract_value: float
    currency: str = "SAR"
    
    billing_frequency: Optional[str] = None  # monthly, quarterly, annually
    payment_terms: Optional[str] = None
    
    status: ContractStatus = ContractStatus.DRAFT
    
    auto_renewal: bool = False
    renewal_notice_days: Optional[int] = None
    
    terms_and_conditions: Optional[str] = None
    
    signed_date: Optional[datetime] = None
    signed_by_customer: Optional[str] = None
    signed_by_company: Optional[str] = None
    
    document_url: Optional[str] = None
    
    owner_id: str
    owner_name: str
    
    notes: Optional[str] = None

class ContractCreate(BaseModel):
    contract_name: str
    contract_name_ar: Optional[str] = None
    contract_type: ContractType
    account_id: str
    contact_id: Optional[str] = None
    start_date: datetime
    end_date: datetime
    contract_value: float
    billing_frequency: Optional[str] = None
    owner_id: str


# ============================================================================
# EMAIL INTEGRATION
# ============================================================================

class EmailStatus(str, Enum):
    DRAFT = "draft"
    SENT = "sent"
    FAILED = "failed"
    BOUNCED = "bounced"

class EmailTemplate(CompanyBaseModel):
    """Email Templates"""
    template_code: str
    template_name: str
    template_name_ar: Optional[str] = None
    
    subject: str
    body_html: str
    body_text: Optional[str] = None
    
    # Merge Fields
    available_merge_fields: List[str] = Field(default_factory=list)
    
    is_active: bool = True

class EmailTemplateCreate(BaseModel):
    template_code: str
    template_name: str
    subject: str
    body_html: str
    available_merge_fields: Optional[List[str]] = []

class Email(CompanyBaseModel):
    """Email Log"""
    email_number: str
    
    # Recipient
    to_email: str
    to_name: Optional[str] = None
    cc_emails: List[str] = Field(default_factory=list)
    bcc_emails: List[str] = Field(default_factory=list)
    
    # Related To
    related_to_type: Optional[str] = None
    related_to_id: Optional[str] = None
    related_to_name: Optional[str] = None
    
    # Content
    subject: str
    body_html: str
    body_text: Optional[str] = None
    
    # Template
    template_id: Optional[str] = None
    
    # Status
    status: EmailStatus = EmailStatus.DRAFT
    sent_date: Optional[datetime] = None
    sent_by: str
    
    # Tracking
    opened_count: int = 0
    clicked_count: int = 0
    last_opened: Optional[datetime] = None
    last_clicked: Optional[datetime] = None
    
    # Attachments
    attachments: List[str] = Field(default_factory=list)
    
    error_message: Optional[str] = None

class EmailCreate(BaseModel):
    to_email: str
    to_name: Optional[str] = None
    subject: str
    body_html: str
    related_to_type: Optional[str] = None
    related_to_id: Optional[str] = None
    template_id: Optional[str] = None
    cc_emails: Optional[List[str]] = []
    attachments: Optional[List[str]] = []


# ============================================================================
# SALES FORECASTING
# ============================================================================

class ForecastPeriod(str, Enum):
    MONTHLY = "monthly"
    QUARTERLY = "quarterly"
    ANNUAL = "annual"

class SalesForecast(CompanyBaseModel):
    """Sales Forecast"""
    forecast_number: str
    forecast_name: str
    fiscal_year: int
    period: ForecastPeriod
    period_name: str  # Q1 2025, Jan 2025, etc.
    
    start_date: datetime
    end_date: datetime
    
    # Owner
    owner_id: Optional[str] = None
    owner_name: Optional[str] = None
    
    # Territory/Region
    territory: Optional[str] = None
    region: Optional[str] = None
    
    # Forecast Amounts
    pipeline_amount: float = 0.0
    best_case: float = 0.0
    commit: float = 0.0
    most_likely: float = 0.0
    closed_won: float = 0.0
    
    # Opportunities included
    opportunities: List[Dict[str, Any]] = Field(default_factory=list)
    
    notes: Optional[str] = None
    created_by: str

class SalesForecastCreate(BaseModel):
    forecast_name: str
    fiscal_year: int
    period: ForecastPeriod
    period_name: str
    start_date: datetime
    end_date: datetime
    owner_id: Optional[str] = None
    territory: Optional[str] = None


# ============================================================================
# SALES TERRITORY & QUOTA
# ============================================================================

class SalesTerritory(CompanyBaseModel):
    """Sales Territory"""
    territory_code: str
    territory_name: str
    territory_name_ar: Optional[str] = None
    
    parent_territory_id: Optional[str] = None
    
    manager_id: Optional[str] = None
    manager_name: Optional[str] = None
    
    # Geographic
    countries: List[str] = Field(default_factory=list)
    states: List[str] = Field(default_factory=list)
    cities: List[str] = Field(default_factory=list)
    
    is_active: bool = True

class SalesTerritoryCreate(BaseModel):
    territory_code: str
    territory_name: str
    territory_name_ar: Optional[str] = None
    parent_territory_id: Optional[str] = None
    manager_id: Optional[str] = None

class SalesQuota(CompanyBaseModel):
    """Sales Quota"""
    quota_number: str
    fiscal_year: int
    period: str  # Q1, Q2, Jan, Feb, etc.
    
    sales_person_id: str
    sales_person_name: str
    
    territory_id: Optional[str] = None
    
    quota_amount: float
    actual_amount: float = 0.0
    achievement_percentage: float = 0.0
    
    start_date: datetime
    end_date: datetime

class SalesQuotaCreate(BaseModel):
    fiscal_year: int
    period: str
    sales_person_id: str
    quota_amount: float
    start_date: datetime
    end_date: datetime
    territory_id: Optional[str] = None


# ============================================================================
# COMPETITOR TRACKING
# ============================================================================

class Competitor(CompanyBaseModel):
    """Competitor Information"""
    competitor_code: str
    competitor_name: str
    competitor_name_ar: Optional[str] = None
    
    website: Optional[str] = None
    
    strengths: Optional[str] = None
    weaknesses: Optional[str] = None
    
    products: List[str] = Field(default_factory=list)
    
    is_active: bool = True

class CompetitorCreate(BaseModel):
    competitor_code: str
    competitor_name: str
    competitor_name_ar: Optional[str] = None
    website: Optional[str] = None
    strengths: Optional[str] = None
    weaknesses: Optional[str] = None
