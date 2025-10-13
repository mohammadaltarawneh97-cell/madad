"""
Enhanced Accounting Models
Payment Processing, Bank Reconciliation, Expense Claims, and Budget Management
"""

from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone
from enum import Enum
from models import CompanyBaseModel


# ============================================================================
# PAYMENT PROCESSING
# ============================================================================

class PaymentStatus(str, Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"

class PaymentBatch(CompanyBaseModel):
    """Payment Batch for processing multiple payments"""
    batch_number: str
    batch_date: datetime
    payment_type: str  # vendor_payment, customer_refund, salary, etc.
    
    payment_method: str
    bank_account_id: Optional[str] = None
    
    total_amount: float = 0.0
    currency: str = "SAR"
    
    payments: List[Dict[str, Any]] = Field(default_factory=list)
    
    status: PaymentStatus = PaymentStatus.PENDING
    processed_by: Optional[str] = None
    processed_date: Optional[datetime] = None
    
    notes: Optional[str] = None

class PaymentBatchCreate(BaseModel):
    batch_date: datetime
    payment_type: str
    payment_method: str
    bank_account_id: Optional[str] = None
    payments: List[Dict[str, Any]]
    notes: Optional[str] = None


# ============================================================================
# BANK ACCOUNTS & RECONCILIATION
# ============================================================================

class BankAccountType(str, Enum):
    CHECKING = "checking"
    SAVINGS = "savings"
    CREDIT_CARD = "credit_card"
    LINE_OF_CREDIT = "line_of_credit"

class BankAccount(CompanyBaseModel):
    """Bank Account Master"""
    account_number: str
    account_name: str
    account_name_ar: Optional[str] = None
    account_type: BankAccountType
    
    bank_name: str
    bank_name_ar: Optional[str] = None
    branch: Optional[str] = None
    swift_code: Optional[str] = None
    iban: Optional[str] = None
    
    currency: str = "SAR"
    opening_balance: float = 0.0
    current_balance: float = 0.0
    
    gl_account_id: str  # Link to Chart of Accounts
    
    is_active: bool = True

class BankAccountCreate(BaseModel):
    account_number: str
    account_name: str
    account_name_ar: Optional[str] = None
    account_type: BankAccountType
    bank_name: str
    bank_name_ar: Optional[str] = None
    currency: Optional[str] = "SAR"
    opening_balance: Optional[float] = 0.0
    gl_account_id: str

class BankStatementLine(BaseModel):
    """Bank Statement Line Item"""
    transaction_date: datetime
    description: str
    reference: Optional[str] = None
    debit: float = 0.0
    credit: float = 0.0
    balance: float = 0.0

class BankStatement(CompanyBaseModel):
    """Bank Statement"""
    statement_number: str
    bank_account_id: str
    bank_account_name: str
    statement_date: datetime
    from_date: datetime
    to_date: datetime
    
    opening_balance: float
    closing_balance: float
    
    lines: List[BankStatementLine] = Field(default_factory=list)
    
    is_reconciled: bool = False
    reconciled_by: Optional[str] = None
    reconciled_date: Optional[datetime] = None

class BankStatementCreate(BaseModel):
    bank_account_id: str
    statement_date: datetime
    from_date: datetime
    to_date: datetime
    opening_balance: float
    closing_balance: float
    lines: List[BankStatementLine]

class ReconciliationStatus(str, Enum):
    UNMATCHED = "unmatched"
    MATCHED = "matched"
    SUGGESTED = "suggested"

class BankReconciliationItem(BaseModel):
    """Individual reconciliation item"""
    statement_line_id: Optional[str] = None
    gl_transaction_id: Optional[str] = None
    status: ReconciliationStatus
    amount: float
    date: datetime
    description: str

class BankReconciliation(CompanyBaseModel):
    """Bank Reconciliation"""
    reconciliation_number: str
    bank_account_id: str
    statement_id: str
    reconciliation_date: datetime
    
    statement_balance: float
    gl_balance: float
    difference: float
    
    unmatched_bank_items: List[BankReconciliationItem] = Field(default_factory=list)
    unmatched_gl_items: List[BankReconciliationItem] = Field(default_factory=list)
    matched_items: List[BankReconciliationItem] = Field(default_factory=list)
    
    is_reconciled: bool = False
    reconciled_by: Optional[str] = None
    notes: Optional[str] = None


# ============================================================================
# EXPENSE CLAIMS & APPROVALS
# ============================================================================

class ExpenseClaimStatus(str, Enum):
    DRAFT = "draft"
    SUBMITTED = "submitted"
    APPROVED = "approved"
    REJECTED = "rejected"
    PAID = "paid"

class ExpenseClaimLine(BaseModel):
    """Expense Claim Line Item"""
    line_number: int
    expense_date: datetime
    expense_category: str
    description: str
    amount: float
    tax_amount: float = 0.0
    receipt_attached: bool = False
    receipt_url: Optional[str] = None

class ExpenseClaim(CompanyBaseModel):
    """Employee Expense Claim"""
    claim_number: str
    claim_date: datetime
    employee_id: str
    employee_name: str
    department_id: Optional[str] = None
    
    lines: List[ExpenseClaimLine] = Field(default_factory=list)
    
    total_amount: float = 0.0
    tax_amount: float = 0.0
    net_amount: float = 0.0
    
    status: ExpenseClaimStatus = ExpenseClaimStatus.DRAFT
    
    submitted_date: Optional[datetime] = None
    approved_by: Optional[str] = None
    approved_date: Optional[datetime] = None
    rejection_reason: Optional[str] = None
    
    payment_id: Optional[str] = None
    paid_date: Optional[datetime] = None
    
    notes: Optional[str] = None

class ExpenseClaimCreate(BaseModel):
    claim_date: datetime
    employee_id: str
    lines: List[ExpenseClaimLine]
    notes: Optional[str] = None


# ============================================================================
# BUDGET MANAGEMENT
# ============================================================================

class BudgetType(str, Enum):
    ANNUAL = "annual"
    QUARTERLY = "quarterly"
    MONTHLY = "monthly"
    PROJECT = "project"

class BudgetLine(BaseModel):
    """Budget Line Item"""
    account_id: str
    account_code: str
    account_name: str
    budgeted_amount: float
    actual_amount: float = 0.0
    variance: float = 0.0
    variance_percentage: float = 0.0

class Budget(CompanyBaseModel):
    """Budget"""
    budget_number: str
    budget_name: str
    budget_name_ar: Optional[str] = None
    budget_type: BudgetType
    
    fiscal_year: int
    period: Optional[str] = None  # Q1, Q2, Q3, Q4 or Jan, Feb, etc.
    
    start_date: datetime
    end_date: datetime
    
    department_id: Optional[str] = None
    cost_center_id: Optional[str] = None
    project_id: Optional[str] = None
    
    lines: List[BudgetLine] = Field(default_factory=list)
    
    total_budget: float = 0.0
    total_actual: float = 0.0
    total_variance: float = 0.0
    
    status: str = "draft"  # draft, approved, active, closed
    
    created_by: str
    approved_by: Optional[str] = None
    approved_date: Optional[datetime] = None
    
    notes: Optional[str] = None

class BudgetCreate(BaseModel):
    budget_name: str
    budget_name_ar: Optional[str] = None
    budget_type: BudgetType
    fiscal_year: int
    period: Optional[str] = None
    start_date: datetime
    end_date: datetime
    department_id: Optional[str] = None
    cost_center_id: Optional[str] = None
    lines: List[BudgetLine]
    notes: Optional[str] = None

class BudgetVsActual(BaseModel):
    """Budget vs Actual Report"""
    budget_id: str
    report_date: datetime
    lines: List[BudgetLine] = Field(default_factory=list)
    total_budget: float = 0.0
    total_actual: float = 0.0
    total_variance: float = 0.0


# ============================================================================
# COST CENTER REPORTING
# ============================================================================

class CostCenterReport(BaseModel):
    """Cost Center Financial Report"""
    cost_center_id: str
    cost_center_name: str
    from_date: datetime
    to_date: datetime
    
    revenue: float = 0.0
    expenses: float = 0.0
    net_income: float = 0.0
    
    expense_breakdown: Dict[str, float] = Field(default_factory=dict)
    revenue_breakdown: Dict[str, float] = Field(default_factory=dict)
    
    budget_comparison: Optional[Dict[str, Any]] = None


# ============================================================================
# PAYMENT TERMS & SCHEDULES
# ============================================================================

class PaymentTerm(CompanyBaseModel):
    """Payment Terms Master"""
    term_code: str
    term_name: str
    term_name_ar: Optional[str] = None
    days: int  # Net days
    discount_percentage: float = 0.0
    discount_days: int = 0
    description: Optional[str] = None
    is_active: bool = True

class PaymentTermCreate(BaseModel):
    term_code: str
    term_name: str
    term_name_ar: Optional[str] = None
    days: int
    discount_percentage: Optional[float] = 0.0
    discount_days: Optional[int] = 0

class PaymentSchedule(CompanyBaseModel):
    """Payment Schedule for installments"""
    schedule_number: str
    related_to_type: str  # invoice, contract, etc.
    related_to_id: str
    
    total_amount: float
    currency: str = "SAR"
    
    installments: List[Dict[str, Any]] = Field(default_factory=list)  # installment_number, due_date, amount, paid
    
    created_by: str
    notes: Optional[str] = None
