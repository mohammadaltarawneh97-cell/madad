"""
CSV Import/Export API Routes
Bulk data import and export functionality for all modules
"""

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from fastapi.responses import StreamingResponse
from typing import List, Optional, Dict, Any
from datetime import datetime, timezone
import csv
import io
import uuid

from server import get_current_user, db
from models import User

router = APIRouter(prefix="/api/csv", tags=["csv"])


# ============================================================================
# HELPER FUNCTIONS
# ============================================================================

def prepare_csv_row(data: dict, fields: List[str]) -> List[str]:
    """Prepare a row for CSV export"""
    row = []
    for field in fields:
        value = data.get(field, "")
        if isinstance(value, datetime):
            value = value.isoformat()
        elif value is None:
            value = ""
        row.append(str(value))
    return row


async def import_csv_data(
    file_content: bytes,
    collection_name: str,
    company_id: str,
    user_id: str,
    field_mapping: Dict[str, str]
) -> Dict[str, Any]:
    """Import CSV data into a collection"""
    try:
        # Decode CSV content
        csv_content = file_content.decode('utf-8')
        csv_reader = csv.DictReader(io.StringIO(csv_content))
        
        imported_count = 0
        errors = []
        
        for row_num, row in enumerate(csv_reader, start=2):  # Start at 2 (header is 1)
            try:
                # Map CSV fields to database fields
                doc = {
                    "id": str(uuid.uuid4()),
                    "company_id": company_id,
                    "created_by": user_id,
                    "created_at": datetime.now(timezone.utc)
                }
                
                for csv_field, db_field in field_mapping.items():
                    if csv_field in row and row[csv_field]:
                        # Try to convert to appropriate type
                        value = row[csv_field].strip()
                        
                        # Handle numeric fields
                        if db_field in ['amount', 'price', 'quantity', 'balance', 'value']:
                            try:
                                value = float(value)
                            except ValueError:
                                value = 0.0
                        
                        doc[db_field] = value
                
                # Insert into database
                await db[collection_name].insert_one(doc)
                imported_count += 1
                
            except Exception as e:
                errors.append(f"Row {row_num}: {str(e)}")
        
        return {
            "success": True,
            "imported_count": imported_count,
            "errors": errors if errors else None
        }
    
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }


# ============================================================================
# ACCOUNTING MODULE EXPORTS
# ============================================================================

@router.get("/export/accounts")
async def export_chart_of_accounts(
    current_user: User = Depends(get_current_user)
):
    """Export Chart of Accounts to CSV"""
    if not current_user.has_permission("accounting", "read"):
        raise HTTPException(status_code=403, detail="No permission")
    
    accounts = await db.accounts.find({"company_id": current_user.current_company_id}).to_list(length=None)
    
    # Define CSV fields
    fields = ['account_code', 'account_name', 'account_name_ar', 'account_type', 'parent_account_code', 'balance', 'currency', 'is_active']
    
    # Create CSV
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(fields)  # Header
    
    for account in accounts:
        writer.writerow(prepare_csv_row(account, fields))
    
    # Return as downloadable file
    output.seek(0)
    return StreamingResponse(
        io.BytesIO(output.getvalue().encode('utf-8')),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=chart_of_accounts.csv"}
    )


@router.get("/export/vendors")
async def export_vendors(
    current_user: User = Depends(get_current_user)
):
    """Export Vendors to CSV"""
    if not current_user.has_permission("accounting", "read"):
        raise HTTPException(status_code=403, detail="No permission")
    
    vendors = await db.vendors.find({"company_id": current_user.current_company_id}).to_list(length=None)
    
    fields = ['vendor_code', 'vendor_name', 'vendor_name_ar', 'email', 'phone', 'tax_id', 'payment_terms', 'currency', 'balance']
    
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(fields)
    
    for vendor in vendors:
        writer.writerow(prepare_csv_row(vendor, fields))
    
    output.seek(0)
    return StreamingResponse(
        io.BytesIO(output.getvalue().encode('utf-8')),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=vendors.csv"}
    )


@router.get("/export/customers")
async def export_customers(
    current_user: User = Depends(get_current_user)
):
    """Export Customers to CSV"""
    if not current_user.has_permission("accounting", "read"):
        raise HTTPException(status_code=403, detail="No permission")
    
    customers = await db.customers.find({"company_id": current_user.current_company_id}).to_list(length=None)
    
    fields = ['customer_code', 'customer_name', 'customer_name_ar', 'email', 'phone', 'tax_id', 'payment_terms', 'currency', 'balance']
    
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(fields)
    
    for customer in customers:
        writer.writerow(prepare_csv_row(customer, fields))
    
    output.seek(0)
    return StreamingResponse(
        io.BytesIO(output.getvalue().encode('utf-8')),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=customers.csv"}
    )


@router.get("/export/expense-claims")
async def export_expense_claims(
    current_user: User = Depends(get_current_user)
):
    """Export Expense Claims to CSV"""
    if not current_user.has_permission("accounting", "read"):
        raise HTTPException(status_code=403, detail="No permission")
    
    claims = await db.expense_claims.find({"company_id": current_user.current_company_id}).to_list(length=None)
    
    fields = ['claim_number', 'employee_name', 'claim_date', 'total_amount', 'tax_amount', 'net_amount', 'status']
    
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(fields)
    
    for claim in claims:
        writer.writerow(prepare_csv_row(claim, fields))
    
    output.seek(0)
    return StreamingResponse(
        io.BytesIO(output.getvalue().encode('utf-8')),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=expense_claims.csv"}
    )


# ============================================================================
# CRM MODULE EXPORTS
# ============================================================================

@router.get("/export/leads")
async def export_leads(
    current_user: User = Depends(get_current_user)
):
    """Export Leads to CSV"""
    if not current_user.has_permission("leads", "read"):
        raise HTTPException(status_code=403, detail="No permission")
    
    leads = await db.leads.find({"company_id": current_user.current_company_id}).to_list(length=None)
    
    fields = ['name', 'company', 'email', 'phone', 'lead_source', 'status', 'rating', 'estimated_value', 'owner_name']
    
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(fields)
    
    for lead in leads:
        writer.writerow(prepare_csv_row(lead, fields))
    
    output.seek(0)
    return StreamingResponse(
        io.BytesIO(output.getvalue().encode('utf-8')),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=leads.csv"}
    )


@router.get("/export/contacts")
async def export_contacts(
    current_user: User = Depends(get_current_user)
):
    """Export Contacts to CSV"""
    if not current_user.has_permission("crm_contacts", "read"):
        raise HTTPException(status_code=403, detail="No permission")
    
    contacts = await db.contacts.find({"company_id": current_user.current_company_id}).to_list(length=None)
    
    fields = ['name', 'account_name', 'email', 'phone', 'title', 'department', 'owner_name']
    
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(fields)
    
    for contact in contacts:
        writer.writerow(prepare_csv_row(contact, fields))
    
    output.seek(0)
    return StreamingResponse(
        io.BytesIO(output.getvalue().encode('utf-8')),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=contacts.csv"}
    )


@router.get("/export/opportunities")
async def export_opportunities(
    current_user: User = Depends(get_current_user)
):
    """Export Opportunities to CSV"""
    if not current_user.has_permission("opportunities", "read"):
        raise HTTPException(status_code=403, detail="No permission")
    
    opportunities = await db.opportunities.find({"company_id": current_user.current_company_id}).to_list(length=None)
    
    fields = ['name', 'account_name', 'stage', 'amount', 'probability', 'close_date', 'owner_name']
    
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(fields)
    
    for opp in opportunities:
        writer.writerow(prepare_csv_row(opp, fields))
    
    output.seek(0)
    return StreamingResponse(
        io.BytesIO(output.getvalue().encode('utf-8')),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=opportunities.csv"}
    )


@router.get("/export/tasks")
async def export_tasks(
    current_user: User = Depends(get_current_user)
):
    """Export Tasks to CSV"""
    if not current_user.has_permission("tasks", "read"):
        raise HTTPException(status_code=403, detail="No permission")
    
    tasks = await db.tasks.find({"company_id": current_user.current_company_id}).to_list(length=None)
    
    fields = ['task_number', 'subject', 'assigned_to_name', 'due_date', 'priority', 'status']
    
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(fields)
    
    for task in tasks:
        writer.writerow(prepare_csv_row(task, fields))
    
    output.seek(0)
    return StreamingResponse(
        io.BytesIO(output.getvalue().encode('utf-8')),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=tasks.csv"}
    )


# ============================================================================
# WAREHOUSE MODULE EXPORTS
# ============================================================================

@router.get("/export/products")
async def export_products(
    current_user: User = Depends(get_current_user)
):
    """Export Warehouse Products to CSV"""
    if not current_user.has_permission("products", "read"):
        raise HTTPException(status_code=403, detail="No permission")
    
    products = await db.products.find({"company_id": current_user.current_company_id}).to_list(length=None)
    
    fields = ['sku', 'name', 'name_ar', 'category', 'unit_price', 'cost_price', 'quantity_in_stock', 'reorder_level', 'is_active']
    
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(fields)
    
    for product in products:
        writer.writerow(prepare_csv_row(product, fields))
    
    output.seek(0)
    return StreamingResponse(
        io.BytesIO(output.getvalue().encode('utf-8')),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=warehouse_products.csv"}
    )


@router.get("/export/stock-balance")
async def export_stock_balance(
    current_user: User = Depends(get_current_user)
):
    """Export Stock Balance to CSV"""
    if not current_user.has_permission("stock_balance", "read"):
        raise HTTPException(status_code=403, detail="No permission")
    
    stock_items = await db.stock_balance.find({"company_id": current_user.current_company_id}).to_list(length=None)
    
    fields = ['product_name', 'warehouse_name', 'quantity_on_hand', 'quantity_reserved', 'quantity_available', 'last_updated']
    
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(fields)
    
    for item in stock_items:
        writer.writerow(prepare_csv_row(item, fields))
    
    output.seek(0)
    return StreamingResponse(
        io.BytesIO(output.getvalue().encode('utf-8')),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=stock_balance.csv"}
    )


# ============================================================================
# CSV IMPORT ENDPOINTS
# ============================================================================

@router.post("/import/vendors")
async def import_vendors(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user)
):
    """Import Vendors from CSV"""
    if not current_user.has_permission("accounting", "write"):
        raise HTTPException(status_code=403, detail="No permission")
    
    file_content = await file.read()
    
    field_mapping = {
        'vendor_code': 'vendor_code',
        'vendor_name': 'vendor_name',
        'vendor_name_ar': 'vendor_name_ar',
        'email': 'email',
        'phone': 'phone',
        'tax_id': 'tax_id',
        'payment_terms': 'payment_terms',
        'currency': 'currency'
    }
    
    result = await import_csv_data(
        file_content,
        'vendors',
        current_user.current_company_id,
        current_user.id,
        field_mapping
    )
    
    return result


@router.post("/import/customers")
async def import_customers(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user)
):
    """Import Customers from CSV"""
    if not current_user.has_permission("accounting", "write"):
        raise HTTPException(status_code=403, detail="No permission")
    
    file_content = await file.read()
    
    field_mapping = {
        'customer_code': 'customer_code',
        'customer_name': 'customer_name',
        'customer_name_ar': 'customer_name_ar',
        'email': 'email',
        'phone': 'phone',
        'tax_id': 'tax_id',
        'payment_terms': 'payment_terms',
        'currency': 'currency'
    }
    
    result = await import_csv_data(
        file_content,
        'customers',
        current_user.current_company_id,
        current_user.id,
        field_mapping
    )
    
    return result


@router.post("/import/leads")
async def import_leads(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user)
):
    """Import Leads from CSV"""
    if not current_user.has_permission("leads", "create"):
        raise HTTPException(status_code=403, detail="No permission")
    
    file_content = await file.read()
    
    field_mapping = {
        'name': 'name',
        'company': 'company',
        'email': 'email',
        'phone': 'phone',
        'lead_source': 'lead_source',
        'status': 'status'
    }
    
    result = await import_csv_data(
        file_content,
        'leads',
        current_user.current_company_id,
        current_user.id,
        field_mapping
    )
    
    return result


@router.post("/import/products")
async def import_products(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user)
):
    """Import Warehouse Products from CSV"""
    if not current_user.has_permission("products", "create"):
        raise HTTPException(status_code=403, detail="No permission")
    
    file_content = await file.read()
    
    field_mapping = {
        'sku': 'sku',
        'name': 'name',
        'name_ar': 'name_ar',
        'category': 'category',
        'unit_price': 'unit_price',
        'cost_price': 'cost_price',
        'reorder_level': 'reorder_level'
    }
    
    result = await import_csv_data(
        file_content,
        'products',
        current_user.current_company_id,
        current_user.id,
        field_mapping
    )
    
    return result
