"""
Oracle-like Accounting API Routes
Comprehensive accounting endpoints for GL, AP, AR, Fixed Assets, Tax, Multi-currency, and Reporting
"""

from fastapi import APIRouter, HTTPException, Depends, Query
from typing import List, Optional, Dict, Any
from datetime import datetime, timezone, timedelta
from motor.motor_asyncio import AsyncIOMotorDatabase

from accounting_models import *
from models import User, UserRole
from server import get_current_user, db, serialize_datetime, deserialize_datetime

# Create accounting router
accounting_router = APIRouter(prefix="/api/accounting", tags=["Accounting"])


# ============================================================================
# CHART OF ACCOUNTS ROUTES
# ============================================================================

@accounting_router.post("/chart-of-accounts", response_model=Account)
async def create_account(account_data: AccountCreate, user: User = Depends(get_current_user)):
    """Create a new account in the chart of accounts"""
    if not user.has_permission("chart_of_accounts", "create"):
        raise HTTPException(status_code=403, detail="You don't have permission to create accounts")
    
    if not hasattr(user, 'current_company_id') or not user.current_company_id:
        raise HTTPException(status_code=400, detail="No company context")
    
    # Check if account code already exists
    existing = await db.accounts.find_one({
        "company_id": user.current_company_id,
        "account_code": account_data.account_code
    })
    if existing:
        raise HTTPException(status_code=400, detail="Account code already exists")
    
    account_obj = Account(**account_data.model_dump(), company_id=user.current_company_id)
    account_obj.current_balance = account_obj.opening_balance
    
    doc = account_obj.model_dump()
    serialize_datetime(doc)
    
    await db.accounts.insert_one(doc)
    return account_obj

@accounting_router.get("/chart-of-accounts", response_model=List[Account])
async def get_chart_of_accounts(
    account_type: Optional[AccountType] = None,
    is_active: Optional[bool] = None,
    user: User = Depends(get_current_user)
):
    """Get chart of accounts"""
    if not user.has_permission("chart_of_accounts", "read"):
        raise HTTPException(status_code=403, detail="You don't have permission to view chart of accounts")
    
    if not hasattr(user, 'current_company_id') or not user.current_company_id:
        raise HTTPException(status_code=400, detail="No company context")
    
    query = {"company_id": user.current_company_id}
    if account_type:
        query["account_type"] = account_type
    if is_active is not None:
        query["is_active"] = is_active
    
    accounts_list = await db.accounts.find(query, {"_id": 0}).sort("account_code", 1).to_list(1000)
    
    for account in accounts_list:
        deserialize_datetime(account, ['created_at', 'updated_at'])
    
    return accounts_list

@accounting_router.get("/chart-of-accounts/{account_id}", response_model=Account)
async def get_account(account_id: str, user: User = Depends(get_current_user)):
    """Get account details"""
    if not user.has_permission("chart_of_accounts", "read"):
        raise HTTPException(status_code=403, detail="You don't have permission to view accounts")
    
    account_doc = await db.accounts.find_one({
        "id": account_id,
        "company_id": user.current_company_id
    }, {"_id": 0})
    
    if not account_doc:
        raise HTTPException(status_code=404, detail="Account not found")
    
    deserialize_datetime(account_doc, ['created_at', 'updated_at'])
    return Account(**account_doc)

@accounting_router.put("/chart-of-accounts/{account_id}", response_model=Account)
async def update_account(account_id: str, account_data: dict, user: User = Depends(get_current_user)):
    """Update account"""
    if not user.has_permission("chart_of_accounts", "update"):
        raise HTTPException(status_code=403, detail="You don't have permission to update accounts")
    
    account_doc = await db.accounts.find_one({
        "id": account_id,
        "company_id": user.current_company_id
    })
    
    if not account_doc:
        raise HTTPException(status_code=404, detail="Account not found")
    
    account_data['updated_at'] = datetime.now(timezone.utc).isoformat()
    serialize_datetime(account_data)
    
    await db.accounts.update_one({"id": account_id}, {"$set": account_data})
    
    updated_doc = await db.accounts.find_one({"id": account_id}, {"_id": 0})
    deserialize_datetime(updated_doc, ['created_at', 'updated_at'])
    return Account(**updated_doc)


# ============================================================================
# JOURNAL ENTRIES ROUTES
# ============================================================================

@accounting_router.post("/journal-entries", response_model=JournalEntry)
async def create_journal_entry(entry_data: JournalEntryCreate, user: User = Depends(get_current_user)):
    """Create a journal entry"""
    if not user.has_permission("journal_entries", "create"):
        raise HTTPException(status_code=403, detail="You don't have permission to create journal entries")
    
    if not hasattr(user, 'current_company_id') or not user.current_company_id:
        raise HTTPException(status_code=400, detail="No company context")
    
    # Validate that debits equal credits
    total_debit = sum(line.amount for line in entry_data.lines if line.entry_type == EntryType.DEBIT)
    total_credit = sum(line.amount for line in entry_data.lines if line.entry_type == EntryType.CREDIT)
    
    if abs(total_debit - total_credit) > 0.01:  # Allow small rounding differences
        raise HTTPException(status_code=400, detail=f"Debits ({total_debit}) must equal credits ({total_credit})")
    
    # Generate entry number
    count = await db.journal_entries.count_documents({"company_id": user.current_company_id})
    entry_number = f"JE-{count + 1:06d}"
    
    entry_obj = JournalEntry(
        **entry_data.model_dump(),
        company_id=user.current_company_id,
        entry_number=entry_number,
        created_by=user.username,
        total_debit=total_debit,
        total_credit=total_credit
    )
    
    doc = entry_obj.model_dump()
    serialize_datetime(doc)
    
    await db.journal_entries.insert_one(doc)
    return entry_obj

@accounting_router.get("/journal-entries", response_model=List[JournalEntry])
async def get_journal_entries(
    status: Optional[JournalEntryStatus] = None,
    from_date: Optional[datetime] = None,
    to_date: Optional[datetime] = None,
    user: User = Depends(get_current_user)
):
    """Get journal entries"""
    if not user.has_permission("journal_entries", "read"):
        raise HTTPException(status_code=403, detail="You don't have permission to view journal entries")
    
    if not hasattr(user, 'current_company_id') or not user.current_company_id:
        raise HTTPException(status_code=400, detail="No company context")
    
    query = {"company_id": user.current_company_id}
    if status:
        query["status"] = status
    if from_date:
        query["entry_date"] = {"$gte": from_date.isoformat()}
    if to_date:
        if "entry_date" in query:
            query["entry_date"]["$lte"] = to_date.isoformat()
        else:
            query["entry_date"] = {"$lte": to_date.isoformat()}
    
    entries_list = await db.journal_entries.find(query, {"_id": 0}).sort("entry_date", -1).to_list(1000)
    
    for entry in entries_list:
        deserialize_datetime(entry, ['entry_date', 'posting_date', 'reversal_date', 'created_at', 'updated_at'])
    
    return entries_list

@accounting_router.post("/journal-entries/{entry_id}/post")
async def post_journal_entry(entry_id: str, user: User = Depends(get_current_user)):
    """Post a journal entry to the general ledger"""
    if not user.has_permission("journal_entries", "post"):
        raise HTTPException(status_code=403, detail="You don't have permission to post journal entries")
    
    entry_doc = await db.journal_entries.find_one({
        "id": entry_id,
        "company_id": user.current_company_id
    })
    
    if not entry_doc:
        raise HTTPException(status_code=404, detail="Journal entry not found")
    
    if entry_doc['status'] != JournalEntryStatus.DRAFT:
        raise HTTPException(status_code=400, detail="Only draft entries can be posted")
    
    # Update account balances
    for line in entry_doc['lines']:
        account = await db.accounts.find_one({"id": line['account_id']})
        if not account:
            continue
        
        # Calculate new balance based on account type and entry type
        balance_change = line['amount_base_currency']
        if account['account_type'] in [AccountType.ASSET, AccountType.EXPENSE]:
            # Debit increases, Credit decreases
            if line['entry_type'] == EntryType.DEBIT:
                new_balance = account['current_balance'] + balance_change
            else:
                new_balance = account['current_balance'] - balance_change
        else:  # LIABILITY, EQUITY, REVENUE
            # Credit increases, Debit decreases
            if line['entry_type'] == EntryType.CREDIT:
                new_balance = account['current_balance'] + balance_change
            else:
                new_balance = account['current_balance'] - balance_change
        
        await db.accounts.update_one(
            {"id": line['account_id']},
            {"$set": {"current_balance": new_balance, "updated_at": datetime.now(timezone.utc).isoformat()}}
        )
    
    # Update entry status
    await db.journal_entries.update_one(
        {"id": entry_id},
        {"$set": {
            "status": JournalEntryStatus.POSTED,
            "posting_date": datetime.now(timezone.utc).isoformat(),
            "posted_by": user.username,
            "updated_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    return {"success": True, "message": "Journal entry posted successfully"}


# ============================================================================
# VENDORS ROUTES
# ============================================================================

@accounting_router.post("/vendors", response_model=Vendor)
async def create_vendor(vendor_data: VendorCreate, user: User = Depends(get_current_user)):
    """Create a new vendor"""
    if not user.has_permission("vendors", "create"):
        raise HTTPException(status_code=403, detail="You don't have permission to create vendors")
    
    if not hasattr(user, 'current_company_id') or not user.current_company_id:
        raise HTTPException(status_code=400, detail="No company context")
    
    # Check if vendor code exists
    existing = await db.vendors.find_one({
        "company_id": user.current_company_id,
        "vendor_code": vendor_data.vendor_code
    })
    if existing:
        raise HTTPException(status_code=400, detail="Vendor code already exists")
    
    vendor_obj = Vendor(**vendor_data.model_dump(), company_id=user.current_company_id)
    doc = vendor_obj.model_dump()
    serialize_datetime(doc)
    
    await db.vendors.insert_one(doc)
    return vendor_obj

@accounting_router.get("/vendors", response_model=List[Vendor])
async def get_vendors(
    is_active: Optional[bool] = None,
    vendor_type: Optional[VendorType] = None,
    user: User = Depends(get_current_user)
):
    """Get vendors list"""
    if not user.has_permission("vendors", "read"):
        raise HTTPException(status_code=403, detail="You don't have permission to view vendors")
    
    if not hasattr(user, 'current_company_id') or not user.current_company_id:
        raise HTTPException(status_code=400, detail="No company context")
    
    query = {"company_id": user.current_company_id}
    if is_active is not None:
        query["is_active"] = is_active
    if vendor_type:
        query["vendor_type"] = vendor_type
    
    vendors_list = await db.vendors.find(query, {"_id": 0}).sort("vendor_name", 1).to_list(1000)
    
    for vendor in vendors_list:
        deserialize_datetime(vendor, ['created_at', 'updated_at'])
    
    return vendors_list


# ============================================================================
# VENDOR BILLS ROUTES
# ============================================================================

@accounting_router.post("/vendor-bills", response_model=VendorBill)
async def create_vendor_bill(bill_data: VendorBillCreate, user: User = Depends(get_current_user)):
    """Create a vendor bill"""
    if not user.has_permission("vendor_bills", "create"):
        raise HTTPException(status_code=403, detail="You don't have permission to create vendor bills")
    
    if not hasattr(user, 'current_company_id') or not user.current_company_id:
        raise HTTPException(status_code=400, detail="No company context")
    
    # Get vendor info
    vendor = await db.vendors.find_one({"id": bill_data.vendor_id})
    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor not found")
    
    # Generate bill number
    count = await db.vendor_bills.count_documents({"company_id": user.current_company_id})
    bill_number = f"BILL-{count + 1:06d}"
    
    # Calculate totals
    subtotal = sum(line.amount for line in bill_data.lines)
    tax_amount = sum(line.tax_amount for line in bill_data.lines)
    total_amount = subtotal + tax_amount
    
    # Calculate due date if not provided
    due_date = bill_data.due_date or (bill_data.bill_date + timedelta(days=bill_data.payment_terms_days or 30))
    
    bill_obj = VendorBill(
        **bill_data.model_dump(),
        company_id=user.current_company_id,
        bill_number=bill_number,
        vendor_name=vendor['vendor_name'],
        vendor_code=vendor['vendor_code'],
        due_date=due_date,
        subtotal=subtotal,
        tax_amount=tax_amount,
        total_amount=total_amount,
        amount_due=total_amount
    )
    
    doc = bill_obj.model_dump()
    serialize_datetime(doc)
    
    await db.vendor_bills.insert_one(doc)
    return bill_obj

@accounting_router.get("/vendor-bills", response_model=List[VendorBill])
async def get_vendor_bills(
    vendor_id: Optional[str] = None,
    status: Optional[BillStatus] = None,
    user: User = Depends(get_current_user)
):
    """Get vendor bills"""
    if not user.has_permission("vendor_bills", "read"):
        raise HTTPException(status_code=403, detail="You don't have permission to view vendor bills")
    
    if not hasattr(user, 'current_company_id') or not user.current_company_id:
        raise HTTPException(status_code=400, detail="No company context")
    
    query = {"company_id": user.current_company_id}
    if vendor_id:
        query["vendor_id"] = vendor_id
    if status:
        query["status"] = status
    
    bills_list = await db.vendor_bills.find(query, {"_id": 0}).sort("bill_date", -1).to_list(1000)
    
    for bill in bills_list:
        deserialize_datetime(bill, ['bill_date', 'due_date', 'approved_date', 'created_at', 'updated_at'])
    
    return bills_list


# ============================================================================
# CUSTOMERS ROUTES
# ============================================================================

@accounting_router.post("/customers", response_model=Customer)
async def create_customer(customer_data: CustomerCreate, user: User = Depends(get_current_user)):
    """Create a new customer"""
    if not user.has_permission("customers", "create"):
        raise HTTPException(status_code=403, detail="You don't have permission to create customers")
    
    if not hasattr(user, 'current_company_id') or not user.current_company_id:
        raise HTTPException(status_code=400, detail="No company context")
    
    # Check if customer code exists
    existing = await db.customers.find_one({
        "company_id": user.current_company_id,
        "customer_code": customer_data.customer_code
    })
    if existing:
        raise HTTPException(status_code=400, detail="Customer code already exists")
    
    customer_obj = Customer(**customer_data.model_dump(), company_id=user.current_company_id)
    doc = customer_obj.model_dump()
    serialize_datetime(doc)
    
    await db.customers.insert_one(doc)
    return customer_obj

@accounting_router.get("/customers", response_model=List[Customer])
async def get_customers(
    is_active: Optional[bool] = None,
    customer_type: Optional[CustomerType] = None,
    user: User = Depends(get_current_user)
):
    """Get customers list"""
    if not user.has_permission("customers", "read"):
        raise HTTPException(status_code=403, detail="You don't have permission to view customers")
    
    if not hasattr(user, 'current_company_id') or not user.current_company_id:
        raise HTTPException(status_code=400, detail="No company context")
    
    query = {"company_id": user.current_company_id}
    if is_active is not None:
        query["is_active"] = is_active
    if customer_type:
        query["customer_type"] = customer_type
    
    customers_list = await db.customers.find(query, {"_id": 0}).sort("customer_name", 1).to_list(1000)
    
    for customer in customers_list:
        deserialize_datetime(customer, ['created_at', 'updated_at'])
    
    return customers_list


# ============================================================================
# AR INVOICES ROUTES
# ============================================================================

@accounting_router.post("/ar-invoices", response_model=ARInvoice)
async def create_ar_invoice(invoice_data: ARInvoiceCreate, user: User = Depends(get_current_user)):
    """Create an AR invoice"""
    if not user.has_permission("ar_invoices", "create"):
        raise HTTPException(status_code=403, detail="You don't have permission to create AR invoices")
    
    if not hasattr(user, 'current_company_id') or not user.current_company_id:
        raise HTTPException(status_code=400, detail="No company context")
    
    # Get customer info
    customer = await db.customers.find_one({"id": invoice_data.customer_id})
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    
    # Generate invoice number
    count = await db.ar_invoices.count_documents({"company_id": user.current_company_id})
    invoice_number = f"INV-{count + 1:06d}"
    
    # Calculate totals
    subtotal = sum(line.amount for line in invoice_data.lines)
    tax_amount = sum(line.tax_amount for line in invoice_data.lines)
    total_amount = subtotal + tax_amount
    
    # Calculate due date if not provided
    due_date = invoice_data.due_date or (invoice_data.invoice_date + timedelta(days=invoice_data.payment_terms_days or 30))
    
    invoice_obj = ARInvoice(
        **invoice_data.model_dump(),
        company_id=user.current_company_id,
        invoice_number=invoice_number,
        customer_name=customer['customer_name'],
        customer_code=customer['customer_code'],
        due_date=due_date,
        subtotal=subtotal,
        tax_amount=tax_amount,
        total_amount=total_amount,
        amount_due=total_amount
    )
    
    doc = invoice_obj.model_dump()
    serialize_datetime(doc)
    
    await db.ar_invoices.insert_one(doc)
    return invoice_obj

@accounting_router.get("/ar-invoices", response_model=List[ARInvoice])
async def get_ar_invoices(
    customer_id: Optional[str] = None,
    status: Optional[ARInvoiceStatus] = None,
    user: User = Depends(get_current_user)
):
    """Get AR invoices"""
    if not user.has_permission("ar_invoices", "read"):
        raise HTTPException(status_code=403, detail="You don't have permission to view AR invoices")
    
    if not hasattr(user, 'current_company_id') or not user.current_company_id:
        raise HTTPException(status_code=400, detail="No company context")
    
    query = {"company_id": user.current_company_id}
    if customer_id:
        query["customer_id"] = customer_id
    if status:
        query["status"] = status
    
    invoices_list = await db.ar_invoices.find(query, {"_id": 0}).sort("invoice_date", -1).to_list(1000)
    
    for invoice in invoices_list:
        deserialize_datetime(invoice, ['invoice_date', 'due_date', 'sent_date', 'created_at', 'updated_at'])
    
    return invoices_list


# ============================================================================
# FIXED ASSETS ROUTES
# ============================================================================

@accounting_router.post("/fixed-assets", response_model=FixedAsset)
async def create_fixed_asset(asset_data: FixedAssetCreate, user: User = Depends(get_current_user)):
    """Create a fixed asset"""
    if not user.has_permission("fixed_assets", "create"):
        raise HTTPException(status_code=403, detail="You don't have permission to create fixed assets")
    
    if not hasattr(user, 'current_company_id') or not user.current_company_id:
        raise HTTPException(status_code=400, detail="No company context")
    
    # Check if asset code exists
    existing = await db.fixed_assets.find_one({
        "company_id": user.current_company_id,
        "asset_code": asset_data.asset_code
    })
    if existing:
        raise HTTPException(status_code=400, detail="Asset code already exists")
    
    # Calculate initial net book value
    net_book_value = asset_data.purchase_price - asset_data.salvage_value
    
    asset_obj = FixedAsset(
        **asset_data.model_dump(),
        company_id=user.current_company_id,
        net_book_value=net_book_value
    )
    
    doc = asset_obj.model_dump()
    serialize_datetime(doc)
    
    await db.fixed_assets.insert_one(doc)
    return asset_obj

@accounting_router.get("/fixed-assets", response_model=List[FixedAsset])
async def get_fixed_assets(
    status: Optional[AssetStatus] = None,
    category: Optional[AssetCategory] = None,
    user: User = Depends(get_current_user)
):
    """Get fixed assets"""
    if not user.has_permission("fixed_assets", "read"):
        raise HTTPException(status_code=403, detail="You don't have permission to view fixed assets")
    
    if not hasattr(user, 'current_company_id') or not user.current_company_id:
        raise HTTPException(status_code=400, detail="No company context")
    
    query = {"company_id": user.current_company_id}
    if status:
        query["status"] = status
    if category:
        query["asset_category"] = category
    
    assets_list = await db.fixed_assets.find(query, {"_id": 0}).sort("asset_code", 1).to_list(1000)
    
    for asset in assets_list:
        deserialize_datetime(asset, [
            'purchase_date', 'depreciation_start_date', 'disposal_date',
            'last_maintenance_date', 'next_maintenance_date', 'created_at', 'updated_at'
        ])
    
    return assets_list


# ============================================================================
# TAX CONFIGURATION ROUTES
# ============================================================================

@accounting_router.post("/tax-configuration", response_model=TaxConfiguration)
async def create_tax_config(tax_data: TaxConfigurationCreate, user: User = Depends(get_current_user)):
    """Create tax configuration"""
    if not user.has_permission("tax_configuration", "create"):
        raise HTTPException(status_code=403, detail="You don't have permission to create tax configuration")
    
    if not hasattr(user, 'current_company_id') or not user.current_company_id:
        raise HTTPException(status_code=400, detail="No company context")
    
    tax_obj = TaxConfiguration(**tax_data.model_dump(), company_id=user.current_company_id)
    doc = tax_obj.model_dump()
    serialize_datetime(doc)
    
    await db.tax_configuration.insert_one(doc)
    return tax_obj

@accounting_router.get("/tax-configuration", response_model=List[TaxConfiguration])
async def get_tax_configurations(
    is_active: Optional[bool] = None,
    user: User = Depends(get_current_user)
):
    """Get tax configurations"""
    if not user.has_permission("tax_configuration", "read"):
        raise HTTPException(status_code=403, detail="You don't have permission to view tax configuration")
    
    if not hasattr(user, 'current_company_id') or not user.current_company_id:
        raise HTTPException(status_code=400, detail="No company context")
    
    query = {"company_id": user.current_company_id}
    if is_active is not None:
        query["is_active"] = is_active
    
    tax_list = await db.tax_configuration.find(query, {"_id": 0}).to_list(100)
    
    for tax in tax_list:
        deserialize_datetime(tax, ['effective_from', 'effective_to', 'created_at', 'updated_at'])
    
    return tax_list


# ============================================================================
# EXCHANGE RATES ROUTES
# ============================================================================

@accounting_router.post("/exchange-rates", response_model=ExchangeRate)
async def create_exchange_rate(rate_data: ExchangeRateCreate, user: User = Depends(get_current_user)):
    """Create exchange rate"""
    if not user.has_permission("exchange_rates", "create"):
        raise HTTPException(status_code=403, detail="You don't have permission to create exchange rates")
    
    if not hasattr(user, 'current_company_id') or not user.current_company_id:
        raise HTTPException(status_code=400, detail="No company context")
    
    rate_obj = ExchangeRate(**rate_data.model_dump(), company_id=user.current_company_id)
    doc = rate_obj.model_dump()
    serialize_datetime(doc)
    
    await db.exchange_rates.insert_one(doc)
    return rate_obj

@accounting_router.get("/exchange-rates", response_model=List[ExchangeRate])
async def get_exchange_rates(
    from_currency: Optional[str] = None,
    to_currency: Optional[str] = None,
    user: User = Depends(get_current_user)
):
    """Get exchange rates"""
    if not user.has_permission("exchange_rates", "read"):
        raise HTTPException(status_code=403, detail="You don't have permission to view exchange rates")
    
    if not hasattr(user, 'current_company_id') or not user.current_company_id:
        raise HTTPException(status_code=400, detail="No company context")
    
    query = {"company_id": user.current_company_id}
    if from_currency:
        query["from_currency"] = from_currency
    if to_currency:
        query["to_currency"] = to_currency
    
    rates_list = await db.exchange_rates.find(query, {"_id": 0}).sort("effective_date", -1).to_list(1000)
    
    for rate in rates_list:
        deserialize_datetime(rate, ['effective_date', 'created_at', 'updated_at'])
    
    return rates_list


# ============================================================================
# FINANCIAL REPORTS ROUTES
# ============================================================================

@accounting_router.get("/reports/trial-balance")
async def get_trial_balance(
    as_of_date: Optional[datetime] = None,
    user: User = Depends(get_current_user)
):
    """Generate trial balance report"""
    if not user.has_permission("financial_reports", "generate"):
        raise HTTPException(status_code=403, detail="You don't have permission to generate reports")
    
    if not hasattr(user, 'current_company_id') or not user.current_company_id:
        raise HTTPException(status_code=400, detail="No company context")
    
    # Get all accounts with their current balances
    accounts = await db.accounts.find({
        "company_id": user.current_company_id,
        "is_active": True,
        "is_header": False
    }, {"_id": 0}).sort("account_code", 1).to_list(1000)
    
    total_debit = 0.0
    total_credit = 0.0
    trial_balance = []
    
    for account in accounts:
        balance = account.get('current_balance', 0.0)
        
        # Determine if balance is debit or credit based on account type
        if account['account_type'] in [AccountType.ASSET, AccountType.EXPENSE]:
            debit = balance if balance >= 0 else 0
            credit = abs(balance) if balance < 0 else 0
        else:  # LIABILITY, EQUITY, REVENUE
            credit = balance if balance >= 0 else 0
            debit = abs(balance) if balance < 0 else 0
        
        total_debit += debit
        total_credit += credit
        
        trial_balance.append({
            "account_code": account['account_code'],
            "account_name": account['account_name'],
            "account_name_ar": account.get('account_name_ar'),
            "account_type": account['account_type'],
            "debit": debit,
            "credit": credit
        })
    
    return {
        "report_type": "trial_balance",
        "as_of_date": as_of_date or datetime.now(timezone.utc),
        "company_id": user.current_company_id,
        "accounts": trial_balance,
        "total_debit": total_debit,
        "total_credit": total_credit,
        "balanced": abs(total_debit - total_credit) < 0.01
    }

@accounting_router.get("/reports/balance-sheet")
async def get_balance_sheet(
    as_of_date: Optional[datetime] = None,
    user: User = Depends(get_current_user)
):
    """Generate balance sheet report"""
    if not user.has_permission("financial_reports", "generate"):
        raise HTTPException(status_code=403, detail="You don't have permission to generate reports")
    
    if not hasattr(user, 'current_company_id') or not user.current_company_id:
        raise HTTPException(status_code=400, detail="No company context")
    
    # Get all accounts
    accounts = await db.accounts.find({
        "company_id": user.current_company_id,
        "is_active": True,
        "is_header": False,
        "account_type": {"$in": [AccountType.ASSET, AccountType.LIABILITY, AccountType.EQUITY]}
    }, {"_id": 0}).to_list(1000)
    
    assets = []
    liabilities = []
    equity = []
    total_assets = 0.0
    total_liabilities = 0.0
    total_equity = 0.0
    
    for account in accounts:
        balance = account.get('current_balance', 0.0)
        account_data = {
            "account_code": account['account_code'],
            "account_name": account['account_name'],
            "account_name_ar": account.get('account_name_ar'),
            "balance": balance
        }
        
        if account['account_type'] == AccountType.ASSET:
            assets.append(account_data)
            total_assets += balance
        elif account['account_type'] == AccountType.LIABILITY:
            liabilities.append(account_data)
            total_liabilities += balance
        elif account['account_type'] == AccountType.EQUITY:
            equity.append(account_data)
            total_equity += balance
    
    return {
        "report_type": "balance_sheet",
        "as_of_date": as_of_date or datetime.now(timezone.utc),
        "company_id": user.current_company_id,
        "assets": assets,
        "total_assets": total_assets,
        "liabilities": liabilities,
        "total_liabilities": total_liabilities,
        "equity": equity,
        "total_equity": total_equity,
        "total_liabilities_and_equity": total_liabilities + total_equity,
        "balanced": abs(total_assets - (total_liabilities + total_equity)) < 0.01
    }

@accounting_router.get("/reports/income-statement")
async def get_income_statement(
    from_date: datetime,
    to_date: datetime,
    user: User = Depends(get_current_user)
):
    """Generate income statement report"""
    if not user.has_permission("financial_reports", "generate"):
        raise HTTPException(status_code=403, detail="You don't have permission to generate reports")
    
    if not hasattr(user, 'current_company_id') or not user.current_company_id:
        raise HTTPException(status_code=400, detail="No company context")
    
    # Get revenue and expense accounts
    accounts = await db.accounts.find({
        "company_id": user.current_company_id,
        "is_active": True,
        "is_header": False,
        "account_type": {"$in": [AccountType.REVENUE, AccountType.EXPENSE]}
    }, {"_id": 0}).to_list(1000)
    
    revenues = []
    expenses = []
    total_revenue = 0.0
    total_expenses = 0.0
    
    for account in accounts:
        balance = account.get('current_balance', 0.0)
        account_data = {
            "account_code": account['account_code'],
            "account_name": account['account_name'],
            "account_name_ar": account.get('account_name_ar'),
            "balance": balance
        }
        
        if account['account_type'] == AccountType.REVENUE:
            revenues.append(account_data)
            total_revenue += balance
        elif account['account_type'] == AccountType.EXPENSE:
            expenses.append(account_data)
            total_expenses += balance
    
    net_income = total_revenue - total_expenses
    
    return {
        "report_type": "income_statement",
        "from_date": from_date,
        "to_date": to_date,
        "company_id": user.current_company_id,
        "revenues": revenues,
        "total_revenue": total_revenue,
        "expenses": expenses,
        "total_expenses": total_expenses,
        "net_income": net_income
    }
