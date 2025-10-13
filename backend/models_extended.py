"""
Extended Models for Oracle-like Accounting & Salesforce-like CRM
Foundation models for comprehensive ERP/CRM functionality
"""

from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Dict, Any
from datetime import datetime, date
from enum import Enum
import uuid

# ==========================================
# ENUMS & CONSTANTS
# ==========================================

class AccountType(str, Enum):
    """Chart of Accounts types"""
    ASSET = "asset"
    LIABILITY = "liability"
    EQUITY = "equity"
    REVENUE = "revenue"
    EXPENSE = "expense"

class TransactionType(str, Enum):
    """Journal Entry types"""
    STANDARD = "standard"
    ADJUSTING = "adjusting"
    CLOSING = "closing"
    REVERSING = "reversing"

class PaymentStatus(str, Enum):
    """Payment tracking"""
    PENDING = "pending"
    PARTIALLY_PAID = "partially_paid"
    PAID = "paid"
    OVERDUE = "overdue"
    CANCELLED = "cancelled"

class LeadStatus(str, Enum):
    """CRM Lead lifecycle"""
    NEW = "new"
    CONTACTED = "contacted"
    QUALIFIED = "qualified"
    UNQUALIFIED = "unqualified"
    CONVERTED = "converted"

class OpportunityStage(str, Enum):
    """Sales pipeline stages"""
    PROSPECTING = "prospecting"
    QUALIFICATION = "qualification"
    PROPOSAL = "proposal"
    NEGOTIATION = "negotiation"
    CLOSED_WON = "closed_won"
    CLOSED_LOST = "closed_lost"

class CaseStatus(str, Enum):
    """Support case lifecycle"""
    NEW = "new"
    IN_PROGRESS = "in_progress"
    PENDING_CUSTOMER = "pending_customer"
    RESOLVED = "resolved"
    CLOSED = "closed"

class CasePriority(str, Enum):
    """Support priority levels"""
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"

class ActivityType(str, Enum):
    """CRM Activity types"""
    CALL = "call"
    EMAIL = "email"
    MEETING = "meeting"
    TASK = "task"
    NOTE = "note"

class DepreciationMethod(str, Enum):
    """Asset depreciation methods"""
    STRAIGHT_LINE = "straight_line"
    DECLINING_BALANCE = "declining_balance"
    UNITS_OF_PRODUCTION = "units_of_production"

class TaxType(str, Enum):
    """Tax calculation types"""
    VAT = "vat"
    SALES_TAX = "sales_tax"
    WITHHOLDING_TAX = "withholding_tax"
    EXEMPT = "exempt"


# ==========================================
# ACCOUNTING MODELS (Oracle-like)
# ==========================================

class ChartOfAccounts(BaseModel):
    """General Ledger Chart of Accounts"""
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    company_id: str
    account_code: str  # e.g., "1000", "2100"
    account_name: str
    account_name_ar: Optional[str] = None
    account_type: AccountType
    parent_account_id: Optional[str] = None  # For hierarchical accounts
    level: int = 1  # Account hierarchy level
    is_active: bool = True
    is_header: bool = False  # Header/summary account
    currency: str = "JOD"
    opening_balance: float = 0.0
    current_balance: float = 0.0
    description: Optional[str] = None
    tax_category: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    
    model_config = ConfigDict(from_attributes=True)


class JournalEntry(BaseModel):
    """Journal Entry Header"""
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    company_id: str
    journal_number: str  # Auto-generated: JE-2024-0001
    entry_date: date
    posting_date: date
    period: str  # e.g., "2024-01"
    fiscal_year: int
    transaction_type: TransactionType
    reference: Optional[str] = None  # External reference
    description: str
    description_ar: Optional[str] = None
    source_module: Optional[str] = None  # e.g., "AP", "AR", "FA"
    source_document_id: Optional[str] = None
    is_posted: bool = False
    posted_by: Optional[str] = None
    posted_at: Optional[datetime] = None
    is_reversed: bool = False
    reversed_entry_id: Optional[str] = None
    total_debit: float = 0.0
    total_credit: float = 0.0
    created_by: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    
    model_config = ConfigDict(from_attributes=True)


class JournalLine(BaseModel):
    """Journal Entry Line Items"""
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    journal_entry_id: str
    line_number: int
    account_id: str  # FK to ChartOfAccounts
    account_code: str
    account_name: str
    debit: float = 0.0
    credit: float = 0.0
    currency: str = "JOD"
    exchange_rate: float = 1.0
    description: Optional[str] = None
    # Dimensions for analysis
    cost_center_id: Optional[str] = None
    project_id: Optional[str] = None
    department_id: Optional[str] = None
    location_id: Optional[str] = None
    # Tax tracking
    tax_code: Optional[str] = None
    tax_amount: Optional[float] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    
    model_config = ConfigDict(from_attributes=True)


class AccountsPayable(BaseModel):
    """AP Invoice Header"""
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    company_id: str
    invoice_number: str
    vendor_id: str  # FK to CRM Account (type=vendor)
    vendor_name: str
    invoice_date: date
    due_date: date
    payment_terms: Optional[str] = None  # e.g., "Net 30"
    currency: str = "JOD"
    exchange_rate: float = 1.0
    subtotal: float = 0.0
    tax_amount: float = 0.0
    discount_amount: float = 0.0
    total_amount: float = 0.0
    amount_paid: float = 0.0
    amount_due: float = 0.0
    status: PaymentStatus = PaymentStatus.PENDING
    payment_status: str = "unpaid"  # unpaid, partially_paid, paid
    description: Optional[str] = None
    # Three-way match
    purchase_order_id: Optional[str] = None
    goods_receipt_id: Optional[str] = None
    matched: bool = False
    # GL Integration
    journal_entry_id: Optional[str] = None
    gl_posted: bool = False
    # Approval workflow
    approved: bool = False
    approved_by: Optional[str] = None
    approved_at: Optional[datetime] = None
    created_by: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    
    model_config = ConfigDict(from_attributes=True)


class AccountsReceivable(BaseModel):
    """AR Invoice Header"""
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    company_id: str
    invoice_number: str
    customer_id: str  # FK to CRM Account (type=customer)
    customer_name: str
    opportunity_id: Optional[str] = None  # Link to CRM opportunity
    invoice_date: date
    due_date: date
    payment_terms: Optional[str] = None
    currency: str = "JOD"
    exchange_rate: float = 1.0
    subtotal: float = 0.0
    tax_amount: float = 0.0
    discount_amount: float = 0.0
    total_amount: float = 0.0
    amount_paid: float = 0.0
    amount_due: float = 0.0
    status: PaymentStatus = PaymentStatus.PENDING
    payment_status: str = "unpaid"
    description: Optional[str] = None
    # GL Integration
    journal_entry_id: Optional[str] = None
    gl_posted: bool = False
    # Collections
    days_overdue: int = 0
    last_reminder_date: Optional[date] = None
    collection_notes: Optional[str] = None
    created_by: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    
    model_config = ConfigDict(from_attributes=True)


class Payment(BaseModel):
    """Payment Transaction (AP or AR)"""
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    company_id: str
    payment_number: str
    payment_date: date
    payment_type: str  # "payment_made" (AP) or "payment_received" (AR)
    payee_id: str  # Vendor or Customer ID
    payee_name: str
    payment_method: str  # cash, check, bank_transfer, credit_card
    reference_number: Optional[str] = None  # Check number, transfer ref
    bank_account_id: Optional[str] = None
    amount: float
    currency: str = "JOD"
    exchange_rate: float = 1.0
    description: Optional[str] = None
    # GL Integration
    journal_entry_id: Optional[str] = None
    gl_posted: bool = False
    # Applied invoices
    applied_to_invoices: List[Dict[str, Any]] = []  # [{invoice_id, amount_applied}]
    created_by: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    
    model_config = ConfigDict(from_attributes=True)


class FixedAsset(BaseModel):
    """Fixed Assets Register"""
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    company_id: str
    asset_number: str
    asset_name: str
    asset_name_ar: Optional[str] = None
    asset_category: str  # building, vehicle, equipment, furniture
    description: Optional[str] = None
    location: Optional[str] = None
    acquisition_date: date
    acquisition_cost: float
    salvage_value: float = 0.0
    useful_life_years: int
    depreciation_method: DepreciationMethod
    gl_asset_account_id: str
    gl_depreciation_account_id: str
    gl_accumulated_depreciation_account_id: str
    accumulated_depreciation: float = 0.0
    net_book_value: float = 0.0
    is_active: bool = True
    disposed: bool = False
    disposal_date: Optional[date] = None
    disposal_amount: Optional[float] = None
    disposal_journal_entry_id: Optional[str] = None
    created_by: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    
    model_config = ConfigDict(from_attributes=True)


class TaxRate(BaseModel):
    """Tax Configuration"""
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    company_id: str
    tax_code: str  # e.g., "VAT16", "WHT5"
    tax_name: str
    tax_name_ar: Optional[str] = None
    tax_type: TaxType
    rate: float  # Percentage
    is_inclusive: bool = False  # Tax included in price
    gl_tax_payable_account_id: Optional[str] = None
    gl_tax_receivable_account_id: Optional[str] = None
    is_active: bool = True
    effective_from: date
    effective_to: Optional[date] = None
    description: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    
    model_config = ConfigDict(from_attributes=True)


class BankAccount(BaseModel):
    """Bank Account Master"""
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    company_id: str
    account_name: str
    account_name_ar: Optional[str] = None
    bank_name: str
    account_number: str
    iban: Optional[str] = None
    swift_code: Optional[str] = None
    currency: str = "JOD"
    opening_balance: float = 0.0
    current_balance: float = 0.0
    gl_account_id: str  # FK to ChartOfAccounts
    is_active: bool = True
    description: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    
    model_config = ConfigDict(from_attributes=True)


class BankReconciliation(BaseModel):
    """Bank Reconciliation Records"""
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    company_id: str
    bank_account_id: str
    statement_date: date
    statement_balance: float
    gl_balance: float
    reconciled_balance: float
    difference: float = 0.0
    is_reconciled: bool = False
    reconciled_by: Optional[str] = None
    reconciled_at: Optional[datetime] = None
    notes: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    
    model_config = ConfigDict(from_attributes=True)


# ==========================================
# CRM MODELS (Salesforce-like)
# ==========================================

class CRMAccount(BaseModel):
    """CRM Account (Customer/Vendor/Partner)"""
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    company_id: str
    account_number: str  # Auto-generated: ACC-0001
    account_name: str
    account_name_ar: Optional[str] = None
    account_type: str  # customer, vendor, partner, prospect
    industry: Optional[str] = None
    website: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    # Address
    billing_street: Optional[str] = None
    billing_city: Optional[str] = None
    billing_state: Optional[str] = None
    billing_country: Optional[str] = None
    billing_postal_code: Optional[str] = None
    shipping_street: Optional[str] = None
    shipping_city: Optional[str] = None
    shipping_state: Optional[str] = None
    shipping_country: Optional[str] = None
    shipping_postal_code: Optional[str] = None
    # Business details
    tax_id: Optional[str] = None
    payment_terms: Optional[str] = None
    credit_limit: Optional[float] = None
    # Hierarchy
    parent_account_id: Optional[str] = None
    # Ownership
    owner_id: str  # Assigned user
    # Status
    is_active: bool = True
    rating: Optional[str] = None  # Hot, Warm, Cold
    annual_revenue: Optional[float] = None
    number_of_employees: Optional[int] = None
    description: Optional[str] = None
    notes: Optional[str] = None
    created_by: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    
    model_config = ConfigDict(from_attributes=True)


class Contact(BaseModel):
    """CRM Contact Person"""
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    company_id: str
    account_id: str  # FK to CRMAccount
    first_name: str
    last_name: str
    full_name: str
    full_name_ar: Optional[str] = None
    title: Optional[str] = None  # Job title
    department: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    mobile: Optional[str] = None
    # Address
    mailing_street: Optional[str] = None
    mailing_city: Optional[str] = None
    mailing_state: Optional[str] = None
    mailing_country: Optional[str] = None
    mailing_postal_code: Optional[str] = None
    # Relationship
    is_primary: bool = False
    role: Optional[str] = None  # Decision Maker, Influencer, User
    reports_to_id: Optional[str] = None  # FK to another Contact
    # Ownership
    owner_id: str
    # Status
    is_active: bool = True
    do_not_call: bool = False
    email_opt_out: bool = False
    description: Optional[str] = None
    created_by: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    
    model_config = ConfigDict(from_attributes=True)


class Lead(BaseModel):
    """CRM Lead"""
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    company_id: str
    lead_number: str  # Auto-generated: LEAD-2024-0001
    first_name: Optional[str] = None
    last_name: str
    full_name: str
    company: Optional[str] = None  # Lead's company
    title: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    mobile: Optional[str] = None
    website: Optional[str] = None
    # Address
    street: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    country: Optional[str] = None
    postal_code: Optional[str] = None
    # Lead details
    lead_source: Optional[str] = None  # Web, Referral, Trade Show, etc.
    industry: Optional[str] = None
    status: LeadStatus = LeadStatus.NEW
    rating: Optional[str] = None  # Hot, Warm, Cold
    lead_score: int = 0  # 0-100
    annual_revenue: Optional[float] = None
    number_of_employees: Optional[int] = None
    # Assignment
    owner_id: str
    # Conversion
    is_converted: bool = False
    converted_date: Optional[datetime] = None
    converted_account_id: Optional[str] = None
    converted_contact_id: Optional[str] = None
    converted_opportunity_id: Optional[str] = None
    # Notes
    description: Optional[str] = None
    notes: Optional[str] = None
    created_by: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    
    model_config = ConfigDict(from_attributes=True)


class Opportunity(BaseModel):
    """CRM Opportunity/Deal"""
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    company_id: str
    opportunity_number: str  # OPP-2024-0001
    opportunity_name: str
    opportunity_name_ar: Optional[str] = None
    account_id: str  # FK to CRMAccount
    contact_id: Optional[str] = None  # Primary contact
    stage: OpportunityStage = OpportunityStage.PROSPECTING
    probability: int = 10  # Win probability %
    amount: float = 0.0
    currency: str = "JOD"
    expected_revenue: float = 0.0
    close_date: date
    # Source & Campaign
    lead_source: Optional[str] = None
    campaign_id: Optional[str] = None
    # Assignment
    owner_id: str
    # Type & Details
    opportunity_type: Optional[str] = None  # New Business, Upsell, Renewal
    description: Optional[str] = None
    next_step: Optional[str] = None
    # Competitors
    competitors: Optional[List[str]] = []
    # Forecast
    forecast_category: Optional[str] = None  # Pipeline, Best Case, Committed, Closed
    is_closed: bool = False
    is_won: bool = False
    closed_date: Optional[datetime] = None
    loss_reason: Optional[str] = None
    # Products/Services
    products: Optional[List[Dict[str, Any]]] = []
    created_by: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    
    model_config = ConfigDict(from_attributes=True)


class Quote(BaseModel):
    """CRM Quote/Proposal"""
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    company_id: str
    quote_number: str  # QUO-2024-0001
    quote_name: str
    opportunity_id: Optional[str] = None
    account_id: str
    contact_id: Optional[str] = None
    quote_date: date
    valid_until: date
    status: str = "draft"  # draft, sent, accepted, rejected, expired
    subtotal: float = 0.0
    discount_amount: float = 0.0
    tax_amount: float = 0.0
    total_amount: float = 0.0
    currency: str = "JOD"
    payment_terms: Optional[str] = None
    delivery_terms: Optional[str] = None
    description: Optional[str] = None
    terms_and_conditions: Optional[str] = None
    # Products/Services
    line_items: Optional[List[Dict[str, Any]]] = []
    # Approval
    approved: bool = False
    approved_by: Optional[str] = None
    approved_at: Optional[datetime] = None
    # Conversion
    converted_to_invoice: bool = False
    invoice_id: Optional[str] = None
    owner_id: str
    created_by: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    
    model_config = ConfigDict(from_attributes=True)


class Activity(BaseModel):
    """CRM Activity (Task/Event/Call/Email)"""
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    company_id: str
    activity_type: ActivityType
    subject: str
    description: Optional[str] = None
    # Related records
    related_to_type: Optional[str] = None  # Account, Contact, Lead, Opportunity, Case
    related_to_id: Optional[str] = None
    account_id: Optional[str] = None
    contact_id: Optional[str] = None
    lead_id: Optional[str] = None
    opportunity_id: Optional[str] = None
    case_id: Optional[str] = None
    # Scheduling
    due_date: Optional[datetime] = None
    completed_date: Optional[datetime] = None
    duration_minutes: Optional[int] = None
    # Status
    status: str = "not_started"  # not_started, in_progress, completed, cancelled
    priority: str = "normal"  # low, normal, high
    is_completed: bool = False
    # Assignment
    assigned_to_id: str
    created_by: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    
    model_config = ConfigDict(from_attributes=True)


class Case(BaseModel):
    """CRM Support Case/Ticket"""
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    company_id: str
    case_number: str  # CASE-2024-0001
    subject: str
    description: Optional[str] = None
    account_id: Optional[str] = None
    contact_id: Optional[str] = None
    # Classification
    case_type: Optional[str] = None  # Question, Problem, Feature Request
    case_origin: Optional[str] = None  # Email, Phone, Web, Chat
    priority: CasePriority = CasePriority.MEDIUM
    status: CaseStatus = CaseStatus.NEW
    # SLA
    sla_id: Optional[str] = None
    response_due_date: Optional[datetime] = None
    resolution_due_date: Optional[datetime] = None
    first_response_time: Optional[datetime] = None
    resolution_time: Optional[datetime] = None
    # Assignment
    owner_id: str
    assigned_to_id: Optional[str] = None
    # Resolution
    is_escalated: bool = False
    escalated_to_id: Optional[str] = None
    is_closed: bool = False
    closed_date: Optional[datetime] = None
    resolution: Optional[str] = None
    satisfaction_rating: Optional[int] = None  # 1-5
    created_by: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    
    model_config = ConfigDict(from_attributes=True)


class KnowledgeArticle(BaseModel):
    """Knowledge Base Article"""
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    company_id: str
    article_number: str  # KB-0001
    title: str
    title_ar: Optional[str] = None
    content: str
    content_ar: Optional[str] = None
    summary: Optional[str] = None
    category: Optional[str] = None
    tags: Optional[List[str]] = []
    # Publishing
    status: str = "draft"  # draft, published, archived
    published_date: Optional[datetime] = None
    version: int = 1
    # Access
    is_internal: bool = False  # Internal vs customer-facing
    view_count: int = 0
    helpful_count: int = 0
    not_helpful_count: int = 0
    # SEO
    meta_description: Optional[str] = None
    keywords: Optional[List[str]] = []
    author_id: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    
    model_config = ConfigDict(from_attributes=True)


class Campaign(BaseModel):
    """Marketing Campaign"""
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    company_id: str
    campaign_name: str
    campaign_name_ar: Optional[str] = None
    campaign_type: Optional[str] = None  # Email, Social, Event, Webinar
    status: str = "planned"  # planned, in_progress, completed, cancelled
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    budget: float = 0.0
    actual_cost: float = 0.0
    expected_revenue: float = 0.0
    expected_response_rate: Optional[float] = None
    # Metrics
    num_sent: int = 0
    num_leads: int = 0
    num_opportunities: int = 0
    num_won_opportunities: int = 0
    total_revenue: float = 0.0
    # Details
    description: Optional[str] = None
    owner_id: str
    created_by: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    
    model_config = ConfigDict(from_attributes=True)


# ==========================================
# WORKFLOW & APPROVAL MODELS
# ==========================================

class ApprovalWorkflow(BaseModel):
    """Workflow Definition"""
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    company_id: str
    workflow_name: str
    workflow_name_ar: Optional[str] = None
    object_type: str  # invoice, expense, purchase_order, quote
    is_active: bool = True
    # Conditions
    conditions: Optional[Dict[str, Any]] = {}  # JSON rules
    # Approval steps
    steps: List[Dict[str, Any]] = []  # [{ step: 1, approver_id, condition }]
    created_by: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    
    model_config = ConfigDict(from_attributes=True)


class ApprovalRequest(BaseModel):
    """Approval Request Instance"""
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    company_id: str
    workflow_id: str
    object_type: str
    object_id: str  # Record being approved
    current_step: int = 1
    status: str = "pending"  # pending, approved, rejected, cancelled
    submitted_by: str
    submitted_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    completed_at: Optional[datetime] = None
    comments: Optional[str] = None
    
    model_config = ConfigDict(from_attributes=True)


class ApprovalStep(BaseModel):
    """Individual Approval Step"""
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    approval_request_id: str
    step_number: int
    approver_id: str
    status: str = "pending"  # pending, approved, rejected, reassigned
    comments: Optional[str] = None
    actioned_at: Optional[datetime] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    
    model_config = ConfigDict(from_attributes=True)


# ==========================================
# REPORTING & ANALYTICS
# ==========================================

class SavedReport(BaseModel):
    """User-saved reports"""
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    company_id: str
    report_name: str
    report_type: str  # financial_statement, pipeline, aging, etc.
    parameters: Dict[str, Any] = {}
    filters: Dict[str, Any] = {}
    created_by: str
    is_shared: bool = False
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    
    model_config = ConfigDict(from_attributes=True)
