"""
Oracle-like Accounting Models for Khair it Al Ardh
Comprehensive accounting system with GL, AP, AR, Fixed Assets, Tax Engine, and Multi-currency support
"""

from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone
from enum import Enum
from models import CompanyBaseModel


# ============================================================================
# CHART OF ACCOUNTS & GENERAL LEDGER
# ============================================================================

class AccountType(str, Enum):
    ASSET = "asset"
    LIABILITY = "liability"
    EQUITY = "equity"
    REVENUE = "revenue"
    EXPENSE = "expense"

class AccountSubType(str, Enum):
    # Assets
    CURRENT_ASSET = "current_asset"
    FIXED_ASSET = "fixed_asset"
    INTANGIBLE_ASSET = "intangible_asset"
    OTHER_ASSET = "other_asset"
    
    # Liabilities
    CURRENT_LIABILITY = "current_liability"
    LONG_TERM_LIABILITY = "long_term_liability"
    
    # Equity
    OWNER_EQUITY = "owner_equity"
    RETAINED_EARNINGS = "retained_earnings"
    
    # Revenue
    OPERATING_REVENUE = "operating_revenue"
    NON_OPERATING_REVENUE = "non_operating_revenue"
    
    # Expense
    OPERATING_EXPENSE = "operating_expense"
    COST_OF_GOODS_SOLD = "cost_of_goods_sold"
    DEPRECIATION = "depreciation"
    INTEREST_EXPENSE = "interest_expense"

class Account(CompanyBaseModel):
    """Chart of Accounts - Account definition"""
    account_code: str = Field(..., description="Unique account code (e.g., 1000, 1100)")
    account_name: str = Field(..., description="Account name in English")
    account_name_ar: str = Field(..., description="Account name in Arabic")
    account_type: AccountType
    account_subtype: AccountSubType
    parent_account_id: Optional[str] = Field(None, description="For sub-accounts")
    level: int = Field(default=1, description="Account hierarchy level")
    is_active: bool = True
    is_header: bool = Field(default=False, description="Header accounts cannot have transactions")
    currency: str = Field(default="SAR", description="Default currency")
    opening_balance: float = Field(default=0.0)
    current_balance: float = Field(default=0.0)
    description: Optional[str] = None
    description_ar: Optional[str] = None
    tax_applicable: bool = Field(default=False)
    default_tax_rate: Optional[float] = None

class AccountCreate(BaseModel):
    account_code: str
    account_name: str
    account_name_ar: str
    account_type: AccountType
    account_subtype: AccountSubType
    parent_account_id: Optional[str] = None
    level: Optional[int] = 1
    is_header: Optional[bool] = False
    currency: Optional[str] = "SAR"
    opening_balance: Optional[float] = 0.0
    description: Optional[str] = None
    description_ar: Optional[str] = None
    tax_applicable: Optional[bool] = False
    default_tax_rate: Optional[float] = None

class EntryType(str, Enum):
    DEBIT = "debit"
    CREDIT = "credit"

class JournalEntryStatus(str, Enum):
    DRAFT = "draft"
    POSTED = "posted"
    REVERSED = "reversed"

class JournalEntryLine(BaseModel):
    """Individual line in a journal entry"""
    account_id: str
    account_code: str
    account_name: str
    entry_type: EntryType
    amount: float
    currency: str = "SAR"
    exchange_rate: float = 1.0
    amount_base_currency: float  # Amount in base currency
    description: Optional[str] = None
    tax_amount: Optional[float] = 0.0
    cost_center_id: Optional[str] = None
    project_id: Optional[str] = None

class JournalEntry(CompanyBaseModel):
    """General Ledger Entry"""
    entry_number: str = Field(..., description="Unique entry number")
    entry_date: datetime
    posting_date: Optional[datetime] = None
    reference_type: Optional[str] = Field(None, description="e.g., 'invoice', 'payment', 'manual'")
    reference_id: Optional[str] = None
    reference_number: Optional[str] = None
    description: str
    description_ar: Optional[str] = None
    status: JournalEntryStatus = JournalEntryStatus.DRAFT
    lines: List[JournalEntryLine] = Field(default_factory=list)
    total_debit: float = 0.0
    total_credit: float = 0.0
    created_by: str
    posted_by: Optional[str] = None
    reversed_by: Optional[str] = None
    reversal_date: Optional[datetime] = None
    reversal_entry_id: Optional[str] = None
    notes: Optional[str] = None

class JournalEntryCreate(BaseModel):
    entry_date: datetime
    reference_type: Optional[str] = None
    reference_id: Optional[str] = None
    reference_number: Optional[str] = None
    description: str
    description_ar: Optional[str] = None
    lines: List[JournalEntryLine]
    notes: Optional[str] = None


# ============================================================================
# ACCOUNTS PAYABLE (AP)
# ============================================================================

class VendorType(str, Enum):
    SUPPLIER = "supplier"
    CONTRACTOR = "contractor"
    SERVICE_PROVIDER = "service_provider"
    CONSULTANT = "consultant"
    OTHER = "other"

class Vendor(CompanyBaseModel):
    """Vendor/Supplier Master"""
    vendor_code: str = Field(..., description="Unique vendor code")
    vendor_name: str
    vendor_name_ar: Optional[str] = None
    vendor_type: Optional[VendorType] = VendorType.SUPPLIER  # Made optional with default
    tax_id: Optional[str] = None
    commercial_register: Optional[str] = None
    contact_person: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    country: str = Field(default="Saudi Arabia")
    payment_terms_days: int = Field(default=30)
    credit_limit: Optional[float] = None
    current_balance: float = Field(default=0.0)
    currency: str = Field(default="SAR")
    is_active: bool = True
    notes: Optional[str] = None

class VendorCreate(BaseModel):
    vendor_code: str
    vendor_name: str
    vendor_name_ar: Optional[str] = None
    vendor_type: VendorType
    tax_id: Optional[str] = None
    contact_person: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    payment_terms_days: Optional[int] = 30
    currency: Optional[str] = "SAR"

class BillStatus(str, Enum):
    DRAFT = "draft"
    APPROVED = "approved"
    PARTIALLY_PAID = "partially_paid"
    PAID = "paid"
    CANCELLED = "cancelled"

class BillLine(BaseModel):
    """Line item in vendor bill"""
    line_number: int
    description: str
    account_id: str
    account_code: str
    quantity: float = 1.0
    unit_price: float
    amount: float
    tax_rate: float = 0.15
    tax_amount: float
    total_amount: float
    cost_center_id: Optional[str] = None
    project_id: Optional[str] = None

class VendorBill(CompanyBaseModel):
    """Accounts Payable - Vendor Bill"""
    bill_number: str = Field(..., description="Internal bill number")
    vendor_bill_number: Optional[str] = Field(None, description="Vendor's invoice number")
    vendor_id: str
    vendor_name: str
    vendor_code: str
    bill_date: datetime
    due_date: datetime
    payment_terms_days: int = 30
    currency: str = "SAR"
    exchange_rate: float = 1.0
    
    lines: List[BillLine] = Field(default_factory=list)
    
    subtotal: float = 0.0
    tax_amount: float = 0.0
    total_amount: float = 0.0
    amount_paid: float = 0.0
    amount_due: float = 0.0
    
    status: BillStatus = BillStatus.DRAFT
    
    gl_entry_id: Optional[str] = None  # Link to journal entry
    
    approved_by: Optional[str] = None
    approved_date: Optional[datetime] = None
    
    notes: Optional[str] = None
    attachments: List[str] = Field(default_factory=list)

class VendorBillCreate(BaseModel):
    vendor_id: str
    vendor_bill_number: Optional[str] = None
    bill_date: datetime
    due_date: Optional[datetime] = None
    payment_terms_days: Optional[int] = 30
    currency: Optional[str] = "SAR"
    exchange_rate: Optional[float] = 1.0
    lines: List[BillLine]
    notes: Optional[str] = None

class PaymentMethod(str, Enum):
    CASH = "cash"
    BANK_TRANSFER = "bank_transfer"
    CHECK = "check"
    CREDIT_CARD = "credit_card"

class VendorPayment(CompanyBaseModel):
    """Payment to Vendor"""
    payment_number: str
    vendor_id: str
    vendor_name: str
    payment_date: datetime
    payment_method: PaymentMethod
    amount: float
    currency: str = "SAR"
    exchange_rate: float = 1.0
    amount_base_currency: float
    
    bank_account_id: Optional[str] = None
    check_number: Optional[str] = None
    reference_number: Optional[str] = None
    
    bills_paid: List[Dict[str, Any]] = Field(default_factory=list, description="List of {bill_id, amount_paid}")
    
    gl_entry_id: Optional[str] = None
    
    notes: Optional[str] = None

class VendorPaymentCreate(BaseModel):
    vendor_id: str
    payment_date: datetime
    payment_method: PaymentMethod
    amount: float
    currency: Optional[str] = "SAR"
    exchange_rate: Optional[float] = 1.0
    bank_account_id: Optional[str] = None
    check_number: Optional[str] = None
    reference_number: Optional[str] = None
    bills_paid: List[Dict[str, Any]]
    notes: Optional[str] = None


# ============================================================================
# ACCOUNTS RECEIVABLE (AR)
# ============================================================================

class CustomerType(str, Enum):
    INDIVIDUAL = "individual"
    COMPANY = "company"
    GOVERNMENT = "government"
    OTHER = "other"

class Customer(CompanyBaseModel):
    """Customer Master"""
    customer_code: str
    customer_name: str
    customer_name_ar: Optional[str] = None
    customer_type: CustomerType
    tax_id: Optional[str] = None
    commercial_register: Optional[str] = None
    contact_person: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    country: str = Field(default="Saudi Arabia")
    payment_terms_days: int = Field(default=30)
    credit_limit: Optional[float] = None
    current_balance: float = Field(default=0.0)
    currency: str = Field(default="SAR")
    is_active: bool = True
    notes: Optional[str] = None

class CustomerCreate(BaseModel):
    customer_code: str
    customer_name: str
    customer_name_ar: Optional[str] = None
    customer_type: CustomerType
    tax_id: Optional[str] = None
    contact_person: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    payment_terms_days: Optional[int] = 30
    currency: Optional[str] = "SAR"

class ARInvoiceStatus(str, Enum):
    DRAFT = "draft"
    SENT = "sent"
    PARTIALLY_PAID = "partially_paid"
    PAID = "paid"
    CANCELLED = "cancelled"
    OVERDUE = "overdue"

class ARInvoiceLine(BaseModel):
    """Line item in AR invoice"""
    line_number: int
    description: str
    description_ar: Optional[str] = None
    account_id: str  # Revenue account
    account_code: str
    quantity: float = 1.0
    unit_price: float
    amount: float
    tax_rate: float = 0.15
    tax_amount: float
    total_amount: float
    cost_center_id: Optional[str] = None
    project_id: Optional[str] = None

class ARInvoice(CompanyBaseModel):
    """Accounts Receivable - Customer Invoice"""
    invoice_number: str
    customer_id: str
    customer_name: str
    customer_code: str
    invoice_date: datetime
    due_date: datetime
    payment_terms_days: int = 30
    currency: str = "SAR"
    exchange_rate: float = 1.0
    
    lines: List[ARInvoiceLine] = Field(default_factory=list)
    
    subtotal: float = 0.0
    tax_amount: float = 0.0
    total_amount: float = 0.0
    amount_paid: float = 0.0
    amount_due: float = 0.0
    
    status: ARInvoiceStatus = ARInvoiceStatus.DRAFT
    
    gl_entry_id: Optional[str] = None
    
    sent_date: Optional[datetime] = None
    
    notes: Optional[str] = None
    attachments: List[str] = Field(default_factory=list)

class ARInvoiceCreate(BaseModel):
    customer_id: str
    invoice_date: datetime
    due_date: Optional[datetime] = None
    payment_terms_days: Optional[int] = 30
    currency: Optional[str] = "SAR"
    exchange_rate: Optional[float] = 1.0
    lines: List[ARInvoiceLine]
    notes: Optional[str] = None

class CustomerPayment(CompanyBaseModel):
    """Payment from Customer"""
    payment_number: str
    customer_id: str
    customer_name: str
    payment_date: datetime
    payment_method: PaymentMethod
    amount: float
    currency: str = "SAR"
    exchange_rate: float = 1.0
    amount_base_currency: float
    
    bank_account_id: Optional[str] = None
    check_number: Optional[str] = None
    reference_number: Optional[str] = None
    
    invoices_paid: List[Dict[str, Any]] = Field(default_factory=list, description="List of {invoice_id, amount_paid}")
    
    gl_entry_id: Optional[str] = None
    
    notes: Optional[str] = None

class CustomerPaymentCreate(BaseModel):
    customer_id: str
    payment_date: datetime
    payment_method: PaymentMethod
    amount: float
    currency: Optional[str] = "SAR"
    exchange_rate: Optional[float] = 1.0
    bank_account_id: Optional[str] = None
    check_number: Optional[str] = None
    reference_number: Optional[str] = None
    invoices_paid: List[Dict[str, Any]]
    notes: Optional[str] = None


# ============================================================================
# FIXED ASSETS
# ============================================================================

class AssetCategory(str, Enum):
    LAND = "land"
    BUILDING = "building"
    MACHINERY = "machinery"
    VEHICLES = "vehicles"
    FURNITURE = "furniture"
    COMPUTER_EQUIPMENT = "computer_equipment"
    OTHER = "other"

class DepreciationMethod(str, Enum):
    STRAIGHT_LINE = "straight_line"
    DECLINING_BALANCE = "declining_balance"
    UNITS_OF_PRODUCTION = "units_of_production"
    NO_DEPRECIATION = "no_depreciation"

class AssetStatus(str, Enum):
    ACTIVE = "active"
    DISPOSED = "disposed"
    UNDER_MAINTENANCE = "under_maintenance"
    INACTIVE = "inactive"

class FixedAsset(CompanyBaseModel):
    """Fixed Asset Register"""
    asset_code: str
    asset_name: str
    asset_name_ar: Optional[str] = None
    asset_category: AssetCategory
    description: Optional[str] = None
    
    # Purchase information
    purchase_date: datetime
    purchase_price: float
    currency: str = "SAR"
    vendor_id: Optional[str] = None
    vendor_name: Optional[str] = None
    
    # Depreciation
    depreciation_method: DepreciationMethod
    useful_life_years: float
    salvage_value: float = 0.0
    depreciation_start_date: Optional[datetime] = None
    
    # Current values
    accumulated_depreciation: float = 0.0
    net_book_value: float = 0.0
    
    # Location and assignment
    location: Optional[str] = None
    assigned_to: Optional[str] = None
    department_id: Optional[str] = None
    
    # Status
    status: AssetStatus = AssetStatus.ACTIVE
    disposal_date: Optional[datetime] = None
    disposal_amount: Optional[float] = None
    
    # Accounting
    asset_account_id: str  # Fixed Asset Account
    depreciation_account_id: str  # Accumulated Depreciation Account
    expense_account_id: str  # Depreciation Expense Account
    
    # Maintenance
    last_maintenance_date: Optional[datetime] = None
    next_maintenance_date: Optional[datetime] = None
    
    notes: Optional[str] = None
    attachments: List[str] = Field(default_factory=list)

class FixedAssetCreate(BaseModel):
    asset_code: str
    asset_name: str
    asset_name_ar: Optional[str] = None
    asset_category: AssetCategory
    description: Optional[str] = None
    purchase_date: datetime
    purchase_price: float
    currency: Optional[str] = "SAR"
    vendor_id: Optional[str] = None
    depreciation_method: DepreciationMethod
    useful_life_years: float
    salvage_value: Optional[float] = 0.0
    depreciation_start_date: Optional[datetime] = None
    asset_account_id: str
    depreciation_account_id: str
    expense_account_id: str
    location: Optional[str] = None
    department_id: Optional[str] = None


# ============================================================================
# TAX ENGINE
# ============================================================================

class TaxType(str, Enum):
    VAT = "vat"
    INCOME_TAX = "income_tax"
    WITHHOLDING_TAX = "withholding_tax"
    ZAKAT = "zakat"
    CUSTOM_DUTY = "custom_duty"
    OTHER = "other"

class TaxConfiguration(CompanyBaseModel):
    """Tax Configuration"""
    tax_code: str
    tax_name: str
    tax_name_ar: str
    tax_type: TaxType
    tax_rate: float  # Percentage
    effective_from: datetime
    effective_to: Optional[datetime] = None
    
    # GL Accounts
    tax_payable_account_id: str
    tax_expense_account_id: Optional[str] = None
    
    is_active: bool = True
    description: Optional[str] = None
    description_ar: Optional[str] = None

class TaxConfigurationCreate(BaseModel):
    tax_code: str
    tax_name: str
    tax_name_ar: str
    tax_type: TaxType
    tax_rate: float
    effective_from: datetime
    effective_to: Optional[datetime] = None
    tax_payable_account_id: str
    tax_expense_account_id: Optional[str] = None


# ============================================================================
# MULTI-CURRENCY
# ============================================================================

class Currency(CompanyBaseModel):
    """Currency Master"""
    currency_code: str = Field(..., description="ISO currency code (SAR, USD, EUR)")
    currency_name: str
    currency_name_ar: str
    symbol: str
    is_base_currency: bool = False
    is_active: bool = True

class ExchangeRate(CompanyBaseModel):
    """Exchange Rates"""
    from_currency: str
    to_currency: str
    rate: float
    effective_date: datetime
    source: Optional[str] = Field(None, description="e.g., 'manual', 'api', 'central_bank'")

class ExchangeRateCreate(BaseModel):
    from_currency: str
    to_currency: str
    rate: float
    effective_date: datetime
    source: Optional[str] = None


# ============================================================================
# FINANCIAL REPORTING
# ============================================================================

class ReportType(str, Enum):
    BALANCE_SHEET = "balance_sheet"
    INCOME_STATEMENT = "income_statement"
    CASH_FLOW = "cash_flow"
    TRIAL_BALANCE = "trial_balance"
    GENERAL_LEDGER = "general_ledger"
    AGED_PAYABLES = "aged_payables"
    AGED_RECEIVABLES = "aged_receivables"
    TAX_REPORT = "tax_report"
    CUSTOM = "custom"

class FinancialReport(CompanyBaseModel):
    """Financial Report Definition"""
    report_code: str
    report_name: str
    report_name_ar: str
    report_type: ReportType
    parameters: Dict[str, Any] = Field(default_factory=dict)
    generated_date: datetime
    from_date: datetime
    to_date: datetime
    data: Dict[str, Any] = Field(default_factory=dict)
    generated_by: str
    format: str = Field(default="json", description="json, pdf, excel")
    file_url: Optional[str] = None
