"""
Enhanced Accounting API Routes
Payment Processing, Bank Reconciliation, Expense Claims, and Budget Management
"""

from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Optional
from motor.motor_asyncio import AsyncIOMotorDatabase
from datetime import datetime, timezone
import uuid

from server import get_current_user, db, serialize_datetime
from models import User
from accounting_enhanced_models import (
    PaymentBatch, PaymentBatchCreate, PaymentStatus,
    BankAccount, BankAccountCreate,
    BankStatement, BankStatementCreate,
    BankReconciliation,
    ExpenseClaim, ExpenseClaimCreate, ExpenseClaimStatus,
    Budget, BudgetCreate, BudgetVsActual, BudgetLine,
    PaymentTerm, PaymentTermCreate
)

router = APIRouter(prefix="/api/accounting", tags=["accounting-enhanced"])


# ============================================================================
# HELPER FUNCTIONS
# ============================================================================

def prepare_for_mongo(data: dict) -> dict:
    """Prepare data for MongoDB storage by converting dates to ISO strings"""
    if isinstance(data.get('batch_date'), datetime):
        data['batch_date'] = data['batch_date'].isoformat()
    if isinstance(data.get('processed_date'), datetime):
        data['processed_date'] = data['processed_date'].isoformat()
    if isinstance(data.get('claim_date'), datetime):
        data['claim_date'] = data['claim_date'].isoformat()
    if isinstance(data.get('submitted_date'), datetime):
        data['submitted_date'] = data['submitted_date'].isoformat()
    if isinstance(data.get('approved_date'), datetime):
        data['approved_date'] = data['approved_date'].isoformat()
    if isinstance(data.get('paid_date'), datetime):
        data['paid_date'] = data['paid_date'].isoformat()
    if isinstance(data.get('reconciled_date'), datetime):
        data['reconciled_date'] = data['reconciled_date'].isoformat()
    if isinstance(data.get('statement_date'), datetime):
        data['statement_date'] = data['statement_date'].isoformat()
    if isinstance(data.get('from_date'), datetime):
        data['from_date'] = data['from_date'].isoformat()
    if isinstance(data.get('to_date'), datetime):
        data['to_date'] = data['to_date'].isoformat()
    if isinstance(data.get('reconciliation_date'), datetime):
        data['reconciliation_date'] = data['reconciliation_date'].isoformat()
    if isinstance(data.get('start_date'), datetime):
        data['start_date'] = data['start_date'].isoformat()
    if isinstance(data.get('end_date'), datetime):
        data['end_date'] = data['end_date'].isoformat()
    
    # Handle nested lines
    if 'lines' in data and isinstance(data['lines'], list):
        for line in data['lines']:
            if isinstance(line.get('expense_date'), datetime):
                line['expense_date'] = line['expense_date'].isoformat()
            if isinstance(line.get('transaction_date'), datetime):
                line['transaction_date'] = line['transaction_date'].isoformat()
            if isinstance(line.get('date'), datetime):
                line['date'] = line['date'].isoformat()
    
    # Handle payment batch payments
    if 'payments' in data and isinstance(data['payments'], list):
        for payment in data['payments']:
            if isinstance(payment.get('payment_date'), datetime):
                payment['payment_date'] = payment['payment_date'].isoformat()
    
    # Handle reconciliation items
    for field in ['unmatched_bank_items', 'unmatched_gl_items', 'matched_items']:
        if field in data and isinstance(data[field], list):
            for item in data[field]:
                if isinstance(item.get('date'), datetime):
                    item['date'] = item['date'].isoformat()
    
    return data


async def get_next_number(db: AsyncIOMotorDatabase, company_id: str, prefix: str, collection_name: str) -> str:
    """Generate next sequential number for documents"""
    last_doc = await db[collection_name].find_one(
        {"company_id": company_id},
        sort=[("created_at", -1)]
    )
    
    if last_doc and last_doc.get(f"{prefix.lower()}_number"):
        last_number = int(last_doc[f"{prefix.lower()}_number"].split("-")[1])
        next_number = last_number + 1
    else:
        next_number = 1
    
    return f"{prefix}-{next_number:06d}"


# ============================================================================
# BANK ACCOUNTS
# ============================================================================

@router.post("/bank-accounts", response_model=BankAccount)
async def create_bank_account(
    account: BankAccountCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
    _: bool = Depends(require_permission("accounting.write"))
):
    """Create a new bank account"""
    account_data = BankAccount(
        id=str(uuid.uuid4()),
        company_id=current_user.company_id,
        **account.dict(),
        current_balance=account.opening_balance,
        created_by=current_user.id,
        created_at=datetime.now(timezone.utc)
    )
    
    account_dict = account_data.dict()
    await db.bank_accounts.insert_one(account_dict)
    
    return account_data


@router.get("/bank-accounts", response_model=List[BankAccount])
async def get_bank_accounts(
    current_user: User = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
    _: bool = Depends(require_permission("accounting.read"))
):
    """Get all bank accounts for the company"""
    accounts = await db.bank_accounts.find(
        {"company_id": current_user.company_id}
    ).to_list(length=None)
    
    return [BankAccount(**account) for account in accounts]


@router.get("/bank-accounts/{account_id}", response_model=BankAccount)
async def get_bank_account(
    account_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
    _: bool = Depends(require_permission("accounting.read"))
):
    """Get a specific bank account"""
    account = await db.bank_accounts.find_one({
        "id": account_id,
        "company_id": current_user.company_id
    })
    
    if not account:
        raise HTTPException(status_code=404, detail="Bank account not found")
    
    return BankAccount(**account)


# ============================================================================
# BANK STATEMENTS
# ============================================================================

@router.post("/bank-statements", response_model=BankStatement)
async def create_bank_statement(
    statement: BankStatementCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
    _: bool = Depends(require_permission("accounting.write"))
):
    """Upload a new bank statement"""
    # Get bank account
    bank_account = await db.bank_accounts.find_one({
        "id": statement.bank_account_id,
        "company_id": current_user.company_id
    })
    
    if not bank_account:
        raise HTTPException(status_code=404, detail="Bank account not found")
    
    # Generate statement number
    statement_number = await get_next_number(db, current_user.company_id, "STMT", "bank_statements")
    
    statement_data = BankStatement(
        id=str(uuid.uuid4()),
        company_id=current_user.company_id,
        statement_number=statement_number,
        bank_account_name=bank_account['account_name'],
        **statement.dict(),
        created_by=current_user.id,
        created_at=datetime.now(timezone.utc)
    )
    
    statement_dict = prepare_for_mongo(statement_data.dict())
    await db.bank_statements.insert_one(statement_dict)
    
    return statement_data


@router.get("/bank-statements", response_model=List[BankStatement])
async def get_bank_statements(
    bank_account_id: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
    _: bool = Depends(require_permission("accounting.read"))
):
    """Get all bank statements for the company"""
    query = {"company_id": current_user.company_id}
    if bank_account_id:
        query["bank_account_id"] = bank_account_id
    
    statements = await db.bank_statements.find(query).to_list(length=None)
    
    return [BankStatement(**stmt) for stmt in statements]


# ============================================================================
# BANK RECONCILIATION
# ============================================================================

@router.post("/bank-reconciliations", response_model=BankReconciliation)
async def create_bank_reconciliation(
    statement_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
    _: bool = Depends(require_permission("accounting.write"))
):
    """Create a new bank reconciliation from a statement"""
    # Get statement
    statement = await db.bank_statements.find_one({
        "id": statement_id,
        "company_id": current_user.company_id
    })
    
    if not statement:
        raise HTTPException(status_code=404, detail="Bank statement not found")
    
    # Generate reconciliation number
    recon_number = await get_next_number(db, current_user.company_id, "RECON", "bank_reconciliations")
    
    # For MVP, we'll create basic reconciliation structure
    # In production, this would fetch GL transactions and match them
    recon_data = BankReconciliation(
        id=str(uuid.uuid4()),
        company_id=current_user.company_id,
        reconciliation_number=recon_number,
        bank_account_id=statement['bank_account_id'],
        statement_id=statement_id,
        reconciliation_date=datetime.now(timezone.utc),
        statement_balance=statement['closing_balance'],
        gl_balance=0.0,  # Would be fetched from GL in production
        difference=statement['closing_balance'],
        created_by=current_user.id,
        created_at=datetime.now(timezone.utc)
    )
    
    recon_dict = prepare_for_mongo(recon_data.dict())
    await db.bank_reconciliations.insert_one(recon_dict)
    
    return recon_data


@router.get("/bank-reconciliations", response_model=List[BankReconciliation])
async def get_bank_reconciliations(
    bank_account_id: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
    _: bool = Depends(require_permission("accounting.read"))
):
    """Get all bank reconciliations"""
    query = {"company_id": current_user.company_id}
    if bank_account_id:
        query["bank_account_id"] = bank_account_id
    
    reconciliations = await db.bank_reconciliations.find(query).to_list(length=None)
    
    return [BankReconciliation(**recon) for recon in reconciliations]


@router.post("/bank-reconciliations/{recon_id}/complete")
async def complete_reconciliation(
    recon_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
    _: bool = Depends(require_permission("accounting.approve"))
):
    """Mark reconciliation as complete"""
    result = await db.bank_reconciliations.update_one(
        {"id": recon_id, "company_id": current_user.company_id},
        {
            "$set": {
                "is_reconciled": True,
                "reconciled_by": current_user.id,
                "reconciled_date": datetime.now(timezone.utc).isoformat()
            }
        }
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Reconciliation not found")
    
    return {"message": "Reconciliation completed successfully"}


# ============================================================================
# EXPENSE CLAIMS
# ============================================================================

@router.post("/expense-claims", response_model=ExpenseClaim)
async def create_expense_claim(
    claim: ExpenseClaimCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
    _: bool = Depends(require_permission("accounting.write"))
):
    """Create a new expense claim"""
    # Generate claim number
    claim_number = await get_next_number(db, current_user.company_id, "EXP", "expense_claims")
    
    # Calculate totals
    total_amount = sum(line.amount for line in claim.lines)
    tax_amount = sum(line.tax_amount for line in claim.lines)
    net_amount = total_amount + tax_amount
    
    # Get employee name
    employee = await db.users.find_one({"id": claim.employee_id})
    employee_name = employee['name'] if employee else "Unknown"
    
    claim_data = ExpenseClaim(
        id=str(uuid.uuid4()),
        company_id=current_user.company_id,
        claim_number=claim_number,
        employee_name=employee_name,
        **claim.dict(),
        total_amount=total_amount,
        tax_amount=tax_amount,
        net_amount=net_amount,
        created_by=current_user.id,
        created_at=datetime.now(timezone.utc)
    )
    
    claim_dict = prepare_for_mongo(claim_data.dict())
    await db.expense_claims.insert_one(claim_dict)
    
    return claim_data


@router.get("/expense-claims", response_model=List[ExpenseClaim])
async def get_expense_claims(
    employee_id: Optional[str] = None,
    status: Optional[ExpenseClaimStatus] = None,
    current_user: User = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
    _: bool = Depends(require_permission("accounting.read"))
):
    """Get all expense claims"""
    query = {"company_id": current_user.company_id}
    if employee_id:
        query["employee_id"] = employee_id
    if status:
        query["status"] = status.value
    
    claims = await db.expense_claims.find(query).to_list(length=None)
    
    return [ExpenseClaim(**claim) for claim in claims]


@router.get("/expense-claims/{claim_id}", response_model=ExpenseClaim)
async def get_expense_claim(
    claim_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
    _: bool = Depends(require_permission("accounting.read"))
):
    """Get a specific expense claim"""
    claim = await db.expense_claims.find_one({
        "id": claim_id,
        "company_id": current_user.company_id
    })
    
    if not claim:
        raise HTTPException(status_code=404, detail="Expense claim not found")
    
    return ExpenseClaim(**claim)


@router.post("/expense-claims/{claim_id}/submit")
async def submit_expense_claim(
    claim_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
    _: bool = Depends(require_permission("accounting.write"))
):
    """Submit an expense claim for approval"""
    result = await db.expense_claims.update_one(
        {"id": claim_id, "company_id": current_user.company_id, "status": ExpenseClaimStatus.DRAFT.value},
        {
            "$set": {
                "status": ExpenseClaimStatus.SUBMITTED.value,
                "submitted_date": datetime.now(timezone.utc).isoformat()
            }
        }
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Expense claim not found or already submitted")
    
    return {"message": "Expense claim submitted successfully"}


@router.post("/expense-claims/{claim_id}/approve")
async def approve_expense_claim(
    claim_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
    _: bool = Depends(require_permission("accounting.approve"))
):
    """Approve an expense claim"""
    result = await db.expense_claims.update_one(
        {"id": claim_id, "company_id": current_user.company_id, "status": ExpenseClaimStatus.SUBMITTED.value},
        {
            "$set": {
                "status": ExpenseClaimStatus.APPROVED.value,
                "approved_by": current_user.id,
                "approved_date": datetime.now(timezone.utc).isoformat()
            }
        }
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Expense claim not found or not in submitted status")
    
    return {"message": "Expense claim approved successfully"}


@router.post("/expense-claims/{claim_id}/reject")
async def reject_expense_claim(
    claim_id: str,
    reason: str,
    current_user: User = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
    _: bool = Depends(require_permission("accounting.approve"))
):
    """Reject an expense claim"""
    result = await db.expense_claims.update_one(
        {"id": claim_id, "company_id": current_user.company_id, "status": ExpenseClaimStatus.SUBMITTED.value},
        {
            "$set": {
                "status": ExpenseClaimStatus.REJECTED.value,
                "rejection_reason": reason,
                "approved_by": current_user.id,
                "approved_date": datetime.now(timezone.utc).isoformat()
            }
        }
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Expense claim not found or not in submitted status")
    
    return {"message": "Expense claim rejected"}


# ============================================================================
# BUDGETS
# ============================================================================

@router.post("/budgets", response_model=Budget)
async def create_budget(
    budget: BudgetCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
    _: bool = Depends(require_permission("accounting.write"))
):
    """Create a new budget"""
    # Generate budget number
    budget_number = await get_next_number(db, current_user.company_id, "BUD", "budgets")
    
    # Calculate totals
    total_budget = sum(line.budgeted_amount for line in budget.lines)
    
    budget_data = Budget(
        id=str(uuid.uuid4()),
        company_id=current_user.company_id,
        budget_number=budget_number,
        **budget.dict(),
        total_budget=total_budget,
        created_by=current_user.id,
        created_at=datetime.now(timezone.utc)
    )
    
    budget_dict = prepare_for_mongo(budget_data.dict())
    await db.budgets.insert_one(budget_dict)
    
    return budget_data


@router.get("/budgets", response_model=List[Budget])
async def get_budgets(
    fiscal_year: Optional[int] = None,
    department_id: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
    _: bool = Depends(require_permission("accounting.read"))
):
    """Get all budgets"""
    query = {"company_id": current_user.company_id}
    if fiscal_year:
        query["fiscal_year"] = fiscal_year
    if department_id:
        query["department_id"] = department_id
    
    budgets = await db.budgets.find(query).to_list(length=None)
    
    return [Budget(**budget) for budget in budgets]


@router.get("/budgets/{budget_id}", response_model=Budget)
async def get_budget(
    budget_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
    _: bool = Depends(require_permission("accounting.read"))
):
    """Get a specific budget"""
    budget = await db.budgets.find_one({
        "id": budget_id,
        "company_id": current_user.company_id
    })
    
    if not budget:
        raise HTTPException(status_code=404, detail="Budget not found")
    
    return Budget(**budget)


@router.get("/budgets/{budget_id}/vs-actual", response_model=BudgetVsActual)
async def get_budget_vs_actual(
    budget_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
    _: bool = Depends(require_permission("accounting.read"))
):
    """Get budget vs actual analysis"""
    # Get budget
    budget = await db.budgets.find_one({
        "id": budget_id,
        "company_id": current_user.company_id
    })
    
    if not budget:
        raise HTTPException(status_code=404, detail="Budget not found")
    
    # For MVP, return the budget data
    # In production, this would calculate actual amounts from GL
    report = BudgetVsActual(
        budget_id=budget_id,
        report_date=datetime.now(timezone.utc),
        lines=budget['lines'],
        total_budget=budget['total_budget'],
        total_actual=budget.get('total_actual', 0.0),
        total_variance=budget.get('total_variance', 0.0)
    )
    
    return report


@router.post("/budgets/{budget_id}/approve")
async def approve_budget(
    budget_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
    _: bool = Depends(require_permission("accounting.approve"))
):
    """Approve a budget"""
    result = await db.budgets.update_one(
        {"id": budget_id, "company_id": current_user.company_id, "status": "draft"},
        {
            "$set": {
                "status": "approved",
                "approved_by": current_user.id,
                "approved_date": datetime.now(timezone.utc).isoformat()
            }
        }
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Budget not found or already approved")
    
    return {"message": "Budget approved successfully"}


# ============================================================================
# PAYMENT TERMS
# ============================================================================

@router.post("/payment-terms", response_model=PaymentTerm)
async def create_payment_term(
    term: PaymentTermCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
    _: bool = Depends(require_permission("accounting.write"))
):
    """Create a new payment term"""
    term_data = PaymentTerm(
        id=str(uuid.uuid4()),
        company_id=current_user.company_id,
        **term.dict(),
        created_by=current_user.id,
        created_at=datetime.now(timezone.utc)
    )
    
    term_dict = term_data.dict()
    await db.payment_terms.insert_one(term_dict)
    
    return term_data


@router.get("/payment-terms", response_model=List[PaymentTerm])
async def get_payment_terms(
    current_user: User = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
    _: bool = Depends(require_permission("accounting.read"))
):
    """Get all payment terms"""
    terms = await db.payment_terms.find(
        {"company_id": current_user.company_id, "is_active": True}
    ).to_list(length=None)
    
    return [PaymentTerm(**term) for term in terms]
