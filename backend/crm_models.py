"""
Salesforce-like CRM Models for Khairat Al Ardh
Complete CRM system with Leads, Accounts, Contacts, Opportunities, Cases, and Campaigns
"""

from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone
from enum import Enum
from models import CompanyBaseModel


# ============================================================================
# LEAD MANAGEMENT
# ============================================================================

class LeadStatus(str, Enum):
    NEW = "new"
    CONTACTED = "contacted"
    QUALIFIED = "qualified"
    UNQUALIFIED = "unqualified"
    CONVERTED = "converted"
    LOST = "lost"

class LeadSource(str, Enum):
    WEBSITE = "website"
    REFERRAL = "referral"
    COLD_CALL = "cold_call"
    EMAIL_CAMPAIGN = "email_campaign"
    SOCIAL_MEDIA = "social_media"
    TRADE_SHOW = "trade_show"
    OTHER = "other"

class Lead(CompanyBaseModel):
    """Lead/Prospect Management"""
    lead_number: str = Field(..., description="Unique lead number")
    first_name: str
    last_name: str
    full_name: str = Field(default="")
    company: Optional[str] = None
    title: Optional[str] = None
    
    # Contact Information
    email: str
    phone: Optional[str] = None
    mobile: Optional[str] = None
    website: Optional[str] = None
    
    # Address
    street: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    country: str = Field(default="Saudi Arabia")
    postal_code: Optional[str] = None
    
    # Lead Details
    status: LeadStatus = LeadStatus.NEW
    source: LeadSource
    rating: Optional[str] = Field(None, description="Hot/Warm/Cold")
    industry: Optional[str] = None
    annual_revenue: Optional[float] = None
    number_of_employees: Optional[int] = None
    
    # Sales Info
    assigned_to: Optional[str] = None  # User ID
    assigned_to_name: Optional[str] = None
    estimated_value: Optional[float] = None
    expected_close_date: Optional[datetime] = None
    
    # Conversion
    is_converted: bool = False
    converted_date: Optional[datetime] = None
    converted_account_id: Optional[str] = None
    converted_contact_id: Optional[str] = None
    converted_opportunity_id: Optional[str] = None
    
    # Tracking
    last_contacted: Optional[datetime] = None
    next_follow_up: Optional[datetime] = None
    notes: Optional[str] = None

class LeadCreate(BaseModel):
    first_name: str
    last_name: str
    email: str
    company: Optional[str] = None
    phone: Optional[str] = None
    source: LeadSource
    status: Optional[LeadStatus] = LeadStatus.NEW
    assigned_to: Optional[str] = None
    estimated_value: Optional[float] = None


# ============================================================================
# ACCOUNTS & CONTACTS
# ============================================================================

class AccountType(str, Enum):
    PROSPECT = "prospect"
    CUSTOMER = "customer"
    PARTNER = "partner"
    COMPETITOR = "competitor"
    OTHER = "other"

class Account(CompanyBaseModel):
    """Account/Organization Management"""
    account_number: str
    account_name: str
    account_name_ar: Optional[str] = None
    account_type: AccountType = AccountType.PROSPECT
    
    # Company Information
    industry: Optional[str] = None
    annual_revenue: Optional[float] = None
    number_of_employees: Optional[int] = None
    website: Optional[str] = None
    
    # Contact Information
    phone: Optional[str] = None
    email: Optional[str] = None
    
    # Address
    billing_street: Optional[str] = None
    billing_city: Optional[str] = None
    billing_state: Optional[str] = None
    billing_country: str = Field(default="Saudi Arabia")
    billing_postal_code: Optional[str] = None
    
    shipping_street: Optional[str] = None
    shipping_city: Optional[str] = None
    shipping_state: Optional[str] = None
    shipping_country: str = Field(default="Saudi Arabia")
    shipping_postal_code: Optional[str] = None
    
    # Relationship
    parent_account_id: Optional[str] = None
    owner_id: Optional[str] = None
    owner_name: Optional[str] = None
    
    # Financial
    credit_limit: Optional[float] = None
    payment_terms: Optional[str] = None
    
    # Status
    is_active: bool = True
    description: Optional[str] = None
    notes: Optional[str] = None

class AccountCreate(BaseModel):
    account_name: str
    account_name_ar: Optional[str] = None
    account_type: AccountType
    industry: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    owner_id: Optional[str] = None

class Contact(CompanyBaseModel):
    """Contact/Person Management"""
    contact_number: str
    account_id: str
    account_name: str
    
    # Personal Information
    first_name: str
    last_name: str
    full_name: str = Field(default="")
    title: Optional[str] = None
    department: Optional[str] = None
    
    # Contact Information
    email: str
    phone: Optional[str] = None
    mobile: Optional[str] = None
    
    # Address
    mailing_street: Optional[str] = None
    mailing_city: Optional[str] = None
    mailing_state: Optional[str] = None
    mailing_country: str = Field(default="Saudi Arabia")
    mailing_postal_code: Optional[str] = None
    
    # Relationship
    reports_to_id: Optional[str] = None
    reports_to_name: Optional[str] = None
    owner_id: Optional[str] = None
    owner_name: Optional[str] = None
    
    # Status
    is_primary: bool = False
    is_active: bool = True
    date_of_birth: Optional[datetime] = None
    description: Optional[str] = None
    notes: Optional[str] = None

class ContactCreate(BaseModel):
    account_id: str
    first_name: str
    last_name: str
    email: str
    title: Optional[str] = None
    phone: Optional[str] = None
    mobile: Optional[str] = None
    owner_id: Optional[str] = None


# ============================================================================
# OPPORTUNITIES & PIPELINE
# ============================================================================

class OpportunityStage(str, Enum):
    PROSPECTING = "prospecting"
    QUALIFICATION = "qualification"
    PROPOSAL = "proposal"
    NEGOTIATION = "negotiation"
    CLOSED_WON = "closed_won"
    CLOSED_LOST = "closed_lost"

class Opportunity(CompanyBaseModel):
    """Sales Opportunity/Deal Management"""
    opportunity_number: str
    opportunity_name: str
    opportunity_name_ar: Optional[str] = None
    
    # Related Records
    account_id: str
    account_name: str
    contact_id: Optional[str] = None
    contact_name: Optional[str] = None
    
    # Opportunity Details
    stage: OpportunityStage = OpportunityStage.PROSPECTING
    amount: float
    currency: str = Field(default="SAR")
    probability: int = Field(default=10, ge=0, le=100)
    expected_revenue: float = Field(default=0.0)
    
    # Dates
    close_date: datetime
    next_step: Optional[str] = None
    
    # Assignment
    owner_id: Optional[str] = None
    owner_name: Optional[str] = None
    
    # Source & Competition
    lead_source: Optional[str] = None
    competitors: Optional[str] = None
    
    # Status
    is_closed: bool = False
    is_won: bool = False
    closed_date: Optional[datetime] = None
    loss_reason: Optional[str] = None
    
    description: Optional[str] = None
    notes: Optional[str] = None

class OpportunityCreate(BaseModel):
    opportunity_name: str
    opportunity_name_ar: Optional[str] = None
    account_id: str
    amount: float
    close_date: datetime
    stage: Optional[OpportunityStage] = OpportunityStage.PROSPECTING
    probability: Optional[int] = 10
    owner_id: Optional[str] = None


# ============================================================================
# CASES & SUPPORT TICKETS
# ============================================================================

class CaseStatus(str, Enum):
    NEW = "new"
    IN_PROGRESS = "in_progress"
    WAITING_CUSTOMER = "waiting_customer"
    ESCALATED = "escalated"
    RESOLVED = "resolved"
    CLOSED = "closed"

class CasePriority(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    URGENT = "urgent"

class CaseType(str, Enum):
    QUESTION = "question"
    PROBLEM = "problem"
    FEATURE_REQUEST = "feature_request"
    COMPLAINT = "complaint"
    OTHER = "other"

class Case(CompanyBaseModel):
    """Customer Support Case/Ticket"""
    case_number: str
    subject: str
    description: str
    
    # Related Records
    account_id: Optional[str] = None
    account_name: Optional[str] = None
    contact_id: Optional[str] = None
    contact_name: Optional[str] = None
    
    # Case Details
    status: CaseStatus = CaseStatus.NEW
    priority: CasePriority = CasePriority.MEDIUM
    case_type: CaseType = CaseType.QUESTION
    
    # Assignment
    owner_id: Optional[str] = None
    owner_name: Optional[str] = None
    assigned_to: Optional[str] = None
    assigned_to_name: Optional[str] = None
    
    # SLA & Tracking
    opened_date: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    closed_date: Optional[datetime] = None
    response_due_date: Optional[datetime] = None
    resolution_due_date: Optional[datetime] = None
    
    # Resolution
    is_escalated: bool = False
    escalated_date: Optional[datetime] = None
    resolution: Optional[str] = None
    
    # Communication
    customer_email: Optional[str] = None
    customer_phone: Optional[str] = None
    
    notes: Optional[str] = None
    internal_comments: Optional[str] = None

class CaseCreate(BaseModel):
    subject: str
    description: str
    account_id: Optional[str] = None
    contact_id: Optional[str] = None
    priority: Optional[CasePriority] = CasePriority.MEDIUM
    case_type: Optional[CaseType] = CaseType.QUESTION
    customer_email: Optional[str] = None
    customer_phone: Optional[str] = None


# ============================================================================
# MARKETING CAMPAIGNS
# ============================================================================

class CampaignType(str, Enum):
    EMAIL = "email"
    WEBINAR = "webinar"
    CONFERENCE = "conference"
    TRADE_SHOW = "trade_show"
    DIRECT_MAIL = "direct_mail"
    TELEMARKETING = "telemarketing"
    SOCIAL_MEDIA = "social_media"
    OTHER = "other"

class CampaignStatus(str, Enum):
    PLANNED = "planned"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    ABORTED = "aborted"

class Campaign(CompanyBaseModel):
    """Marketing Campaign Management"""
    campaign_number: str
    campaign_name: str
    campaign_name_ar: Optional[str] = None
    
    # Campaign Details
    campaign_type: CampaignType
    status: CampaignStatus = CampaignStatus.PLANNED
    
    # Dates
    start_date: datetime
    end_date: Optional[datetime] = None
    
    # Budget & ROI
    budgeted_cost: float = 0.0
    actual_cost: float = 0.0
    expected_revenue: float = 0.0
    expected_response_rate: Optional[float] = None
    
    # Metrics
    num_sent: int = 0
    num_responses: int = 0
    num_leads: int = 0
    num_converted_leads: int = 0
    num_opportunities: int = 0
    num_won_opportunities: int = 0
    actual_revenue: float = 0.0
    
    # Assignment
    owner_id: Optional[str] = None
    owner_name: Optional[str] = None
    
    description: Optional[str] = None
    notes: Optional[str] = None

class CampaignCreate(BaseModel):
    campaign_name: str
    campaign_name_ar: Optional[str] = None
    campaign_type: CampaignType
    start_date: datetime
    end_date: Optional[datetime] = None
    budgeted_cost: Optional[float] = 0.0
    expected_revenue: Optional[float] = 0.0
    owner_id: Optional[str] = None


# ============================================================================
# ACTIVITIES & NOTES (Supporting Models)
# ============================================================================

class ActivityType(str, Enum):
    CALL = "call"
    EMAIL = "email"
    MEETING = "meeting"
    TASK = "task"
    NOTE = "note"

class Activity(CompanyBaseModel):
    """Activity/Interaction Log"""
    activity_type: ActivityType
    subject: str
    description: Optional[str] = None
    
    # Related To
    related_to_type: str  # Lead, Account, Contact, Opportunity, Case
    related_to_id: str
    related_to_name: str
    
    # Assignment
    owner_id: str
    owner_name: str
    
    # Scheduling
    due_date: Optional[datetime] = None
    is_completed: bool = False
    completed_date: Optional[datetime] = None
    
    # Priority
    priority: str = "medium"

class ActivityCreate(BaseModel):
    activity_type: ActivityType
    subject: str
    description: Optional[str] = None
    related_to_type: str
    related_to_id: str
    due_date: Optional[datetime] = None
