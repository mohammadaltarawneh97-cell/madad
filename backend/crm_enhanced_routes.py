"""
Enhanced CRM API Routes
Tasks, Activities, Products, Contracts, Email Templates, and Sales Forecasting
"""

from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Optional
from datetime import datetime, timezone
import uuid

from server import get_current_user, db, serialize_datetime
from models import User
from crm_enhanced_models import (
    Task, TaskCreate, TaskStatus, TaskPriority,
    Activity, ActivityCreate, ActivityType,
    CRMProduct, CRMProductCreate,
    Contract, ContractCreate, ContractStatus,
    EmailTemplate, EmailTemplateCreate,
    Email, EmailCreate, EmailStatus,
    SalesForecast, SalesForecastCreate, ForecastPeriod
)

router = APIRouter(prefix="/api/crm", tags=["crm-enhanced"])


# ============================================================================
# HELPER FUNCTIONS
# ============================================================================

def prepare_for_mongo(data: dict) -> dict:
    """Prepare data for MongoDB storage by converting dates to ISO strings"""
    datetime_fields = [
        'due_date', 'start_date', 'reminder_date', 'completion_date',
        'activity_date', 'completed_date', 'start_date', 'end_date',
        'signed_date', 'sent_date', 'last_opened', 'last_clicked',
        'effective_from', 'effective_to'
    ]
    
    for field in datetime_fields:
        if field in data and isinstance(data[field], datetime):
            data[field] = data[field].isoformat()
    
    return data


async def get_next_number(company_id: str, prefix: str, collection_name: str) -> str:
    """Generate next sequential number for documents"""
    last_doc = await db[collection_name].find_one(
        {"company_id": company_id},
        sort=[("created_at", -1)]
    )
    
    field_name = f"{prefix.lower()}_number"
    if last_doc and last_doc.get(field_name):
        last_number = int(last_doc[field_name].split("-")[1])
        next_number = last_number + 1
    else:
        next_number = 1
    
    return f"{prefix}-{next_number:06d}"


# ============================================================================
# TASKS
# ============================================================================

@router.post("/tasks", response_model=Task)
async def create_task(
    task: TaskCreate,
    current_user: User = Depends(get_current_user)
):
    """Create a new task"""
    if not current_user.has_permission("tasks", "create"):
        raise HTTPException(status_code=403, detail="You don't have permission to create tasks")
    
    # Generate task number
    task_number = await get_next_number(current_user.current_company_id, "TASK", "tasks")
    
    # Get assigned user name
    assigned_user = await db.users.find_one({"id": task.assigned_to})
    assigned_to_name = assigned_user['full_name'] if assigned_user else "Unknown"
    
    # Get related record name if provided
    related_to_name = None
    if task.related_to_type and task.related_to_id:
        collection_map = {
            "lead": "leads",
            "account": "accounts",
            "contact": "contacts",
            "opportunity": "opportunities",
            "case": "cases"
        }
        collection = collection_map.get(task.related_to_type.lower())
        if collection:
            related_record = await db[collection].find_one({"id": task.related_to_id})
            if related_record:
                related_to_name = related_record.get('name') or related_record.get('subject')
    
    task_data = Task(
        id=str(uuid.uuid4()),
        company_id=current_user.current_company_id,
        task_number=task_number,
        assigned_to_name=assigned_to_name,
        assigned_by=current_user.id,
        assigned_by_name=current_user.full_name,
        related_to_name=related_to_name,
        **task.dict(),
        created_by=current_user.id,
        created_at=datetime.now(timezone.utc)
    )
    
    task_dict = prepare_for_mongo(task_data.dict())
    await db.tasks.insert_one(task_dict)
    
    return task_data


@router.get("/tasks", response_model=List[Task])
async def get_tasks(
    assigned_to: Optional[str] = None,
    status: Optional[TaskStatus] = None,
    related_to_type: Optional[str] = None,
    related_to_id: Optional[str] = None,
    current_user: User = Depends(get_current_user)
):
    """Get all tasks"""
    if not current_user.has_permission("tasks", "read"):
        raise HTTPException(status_code=403, detail="You don't have permission to view tasks")
    
    query = {"company_id": current_user.company_id}
    if assigned_to:
        query["assigned_to"] = assigned_to
    if status:
        query["status"] = status.value
    if related_to_type:
        query["related_to_type"] = related_to_type
    if related_to_id:
        query["related_to_id"] = related_to_id
    
    tasks = await db.tasks.find(query).to_list(length=None)
    
    return [Task(**task) for task in tasks]


@router.get("/tasks/{task_id}", response_model=Task)
async def get_task(
    task_id: str,
    current_user: User = Depends(get_current_user)
):
    """Get a specific task"""
    if not current_user.has_permission("tasks", "read"):
        raise HTTPException(status_code=403, detail="You don't have permission to view tasks")
    
    task = await db.tasks.find_one({
        "id": task_id,
        "company_id": current_user.company_id
    })
    
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    return Task(**task)


@router.post("/tasks/{task_id}/complete")
async def complete_task(
    task_id: str,
    completion_notes: Optional[str] = None,
    current_user: User = Depends(get_current_user)
):
    """Mark task as completed"""
    if not current_user.has_permission("tasks", "update"):
        raise HTTPException(status_code=403, detail="You don't have permission to update tasks")
    
    result = await db.tasks.update_one(
        {"id": task_id, "company_id": current_user.company_id},
        {
            "$set": {
                "status": TaskStatus.COMPLETED.value,
                "completion_date": datetime.now(timezone.utc).isoformat(),
                "completion_notes": completion_notes
            }
        }
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Task not found")
    
    return {"message": "Task marked as completed"}


# ============================================================================
# ACTIVITIES
# ============================================================================

@router.post("/activities", response_model=Activity)
async def create_activity(
    activity: ActivityCreate,
    current_user: User = Depends(get_current_user)
):
    """Create a new activity"""
    if not current_user.has_permission("activities", "create"):
        raise HTTPException(status_code=403, detail="You don't have permission to create activities")
    
    # Generate activity number
    activity_number = await get_next_number(current_user.company_id, "ACT", "activities")
    
    # Get related record name
    collection_map = {
        "lead": "leads",
        "account": "accounts",
        "contact": "contacts",
        "opportunity": "opportunities",
        "case": "cases"
    }
    collection = collection_map.get(activity.related_to_type.lower())
    related_to_name = "Unknown"
    
    if collection:
        related_record = await db[collection].find_one({"id": activity.related_to_id})
        if related_record:
            related_to_name = related_record.get('name') or related_record.get('subject')
    
    activity_data = Activity(
        id=str(uuid.uuid4()),
        company_id=current_user.current_company_id,
        activity_number=activity_number,
        related_to_name=related_to_name,
        owner_id=current_user.id,
        owner_name=current_user.full_name,
        **activity.dict(),
        created_by=current_user.id,
        created_at=datetime.now(timezone.utc)
    )
    
    activity_dict = prepare_for_mongo(activity_data.dict())
    await db.activities.insert_one(activity_dict)
    
    return activity_data


@router.get("/activities", response_model=List[Activity])
async def get_activities(
    related_to_type: Optional[str] = None,
    related_to_id: Optional[str] = None,
    activity_type: Optional[ActivityType] = None,
    current_user: User = Depends(get_current_user)
):
    """Get all activities"""
    if not current_user.has_permission("activities", "read"):
        raise HTTPException(status_code=403, detail="You don't have permission to view activities")
    
    query = {"company_id": current_user.company_id}
    if related_to_type:
        query["related_to_type"] = related_to_type
    if related_to_id:
        query["related_to_id"] = related_to_id
    if activity_type:
        query["activity_type"] = activity_type.value
    
    activities = await db.activities.find(query).to_list(length=None)
    
    return [Activity(**activity) for activity in activities]


# ============================================================================
# CRM PRODUCTS
# ============================================================================

@router.post("/products", response_model=CRMProduct)
async def create_product(
    product: CRMProductCreate,
    current_user: User = Depends(get_current_user)
):
    """Create a new product"""
    if not current_user.has_permission("products", "create"):
        raise HTTPException(status_code=403, detail="You don't have permission to create products")
    
    # Check for duplicate product code
    existing = await db.crm_products.find_one({
        "company_id": current_user.company_id,
        "product_code": product.product_code
    })
    if existing:
        raise HTTPException(status_code=400, detail="Product code already exists")
    
    product_data = CRMProduct(
        id=str(uuid.uuid4()),
        company_id=current_user.current_company_id,
        **product.dict(),
        created_by=current_user.id,
        created_at=datetime.now(timezone.utc)
    )
    
    product_dict = product_data.dict()
    await db.crm_products.insert_one(product_dict)
    
    return product_data


@router.get("/products", response_model=List[CRMProduct])
async def get_products(
    product_family: Optional[str] = None,
    is_active: Optional[bool] = True,
    current_user: User = Depends(get_current_user)
):
    """Get all CRM products"""
    if not current_user.has_permission("products", "read"):
        raise HTTPException(status_code=403, detail="You don't have permission to view products")
    
    query = {"company_id": current_user.company_id}
    if product_family:
        query["product_family"] = product_family
    if is_active is not None:
        query["is_active"] = is_active
    
    products = await db.crm_products.find(query).to_list(length=None)
    
    return [CRMProduct(**product) for product in products]


# ============================================================================
# CONTRACTS
# ============================================================================

@router.post("/contracts", response_model=Contract)
async def create_contract(
    contract: ContractCreate,
    current_user: User = Depends(get_current_user)
):
    """Create a new contract"""
    if not current_user.has_permission("contracts", "create"):
        raise HTTPException(status_code=403, detail="You don't have permission to create contracts")
    
    # Generate contract number
    contract_number = await get_next_number(current_user.company_id, "CONT", "contracts")
    
    # Get account name
    account = await db.accounts.find_one({"id": contract.account_id})
    account_name = account['name'] if account else "Unknown"
    
    # Get contact name if provided
    contact_name = None
    if contract.contact_id:
        contact = await db.contacts.find_one({"id": contract.contact_id})
        if contact:
            contact_name = contact.get('name')
    
    # Get owner name
    owner = await db.users.find_one({"id": contract.owner_id})
    owner_name = owner['full_name'] if owner else "Unknown"
    
    contract_data = Contract(
        id=str(uuid.uuid4()),
        company_id=current_user.current_company_id,
        contract_number=contract_number,
        account_name=account_name,
        contact_name=contact_name,
        owner_name=owner_name,
        **contract.dict(),
        created_by=current_user.id,
        created_at=datetime.now(timezone.utc)
    )
    
    contract_dict = prepare_for_mongo(contract_data.dict())
    await db.contracts.insert_one(contract_dict)
    
    return contract_data


@router.get("/contracts", response_model=List[Contract])
async def get_contracts(
    account_id: Optional[str] = None,
    status: Optional[ContractStatus] = None,
    current_user: User = Depends(get_current_user)
):
    """Get all contracts"""
    if not current_user.has_permission("contracts", "read"):
        raise HTTPException(status_code=403, detail="You don't have permission to view contracts")
    
    query = {"company_id": current_user.company_id}
    if account_id:
        query["account_id"] = account_id
    if status:
        query["status"] = status.value
    
    contracts = await db.contracts.find(query).to_list(length=None)
    
    return [Contract(**contract) for contract in contracts]


@router.post("/contracts/{contract_id}/activate")
async def activate_contract(
    contract_id: str,
    current_user: User = Depends(get_current_user)
):
    """Activate a contract"""
    if not current_user.has_permission("contracts", "update"):
        raise HTTPException(status_code=403, detail="You don't have permission to activate contracts")
    
    result = await db.contracts.update_one(
        {"id": contract_id, "company_id": current_user.company_id, "status": ContractStatus.DRAFT.value},
        {
            "$set": {
                "status": ContractStatus.ACTIVE.value,
                "signed_date": datetime.now(timezone.utc).isoformat(),
                "signed_by_company": current_user.full_name
            }
        }
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Contract not found or already activated")
    
    return {"message": "Contract activated successfully"}


# ============================================================================
# EMAIL TEMPLATES
# ============================================================================

@router.post("/email-templates", response_model=EmailTemplate)
async def create_email_template(
    template: EmailTemplateCreate,
    current_user: User = Depends(get_current_user)
):
    """Create a new email template"""
    if not current_user.has_permission("email_templates", "create"):
        raise HTTPException(status_code=403, detail="You don't have permission to create email templates")
    
    # Check for duplicate template code
    existing = await db.email_templates.find_one({
        "company_id": current_user.company_id,
        "template_code": template.template_code
    })
    if existing:
        raise HTTPException(status_code=400, detail="Template code already exists")
    
    template_data = EmailTemplate(
        id=str(uuid.uuid4()),
        company_id=current_user.current_company_id,
        **template.dict(),
        created_by=current_user.id,
        created_at=datetime.now(timezone.utc)
    )
    
    template_dict = template_data.dict()
    await db.email_templates.insert_one(template_dict)
    
    return template_data


@router.get("/email-templates", response_model=List[EmailTemplate])
async def get_email_templates(
    is_active: Optional[bool] = True,
    current_user: User = Depends(get_current_user)
):
    """Get all email templates"""
    if not current_user.has_permission("email_templates", "read"):
        raise HTTPException(status_code=403, detail="You don't have permission to view email templates")
    
    query = {"company_id": current_user.company_id}
    if is_active is not None:
        query["is_active"] = is_active
    
    templates = await db.email_templates.find(query).to_list(length=None)
    
    return [EmailTemplate(**template) for template in templates]


@router.post("/emails", response_model=Email)
async def create_email(
    email: EmailCreate,
    current_user: User = Depends(get_current_user)
):
    """Create/Log an email"""
    if not current_user.has_permission("emails", "create"):
        raise HTTPException(status_code=403, detail="You don't have permission to create emails")
    
    # Generate email number
    email_number = await get_next_number(current_user.company_id, "EMAIL", "emails")
    
    # Get related record name if provided
    related_to_name = None
    if email.related_to_type and email.related_to_id:
        collection_map = {
            "lead": "leads",
            "account": "accounts",
            "contact": "contacts",
            "opportunity": "opportunities",
            "case": "cases"
        }
        collection = collection_map.get(email.related_to_type.lower())
        if collection:
            related_record = await db[collection].find_one({"id": email.related_to_id})
            if related_record:
                related_to_name = related_record.get('name') or related_record.get('subject')
    
    email_data = Email(
        id=str(uuid.uuid4()),
        company_id=current_user.current_company_id,
        email_number=email_number,
        related_to_name=related_to_name,
        sent_by=current_user.id,
        **email.dict(),
        created_by=current_user.id,
        created_at=datetime.now(timezone.utc)
    )
    
    email_dict = prepare_for_mongo(email_data.dict())
    await db.emails.insert_one(email_dict)
    
    return email_data


@router.get("/emails", response_model=List[Email])
async def get_emails(
    related_to_type: Optional[str] = None,
    related_to_id: Optional[str] = None,
    current_user: User = Depends(get_current_user)
):
    """Get all emails"""
    if not current_user.has_permission("emails", "read"):
        raise HTTPException(status_code=403, detail="You don't have permission to view emails")
    
    query = {"company_id": current_user.company_id}
    if related_to_type:
        query["related_to_type"] = related_to_type
    if related_to_id:
        query["related_to_id"] = related_to_id
    
    emails = await db.emails.find(query).to_list(length=None)
    
    return [Email(**email) for email in emails]


# ============================================================================
# SALES FORECASTING
# ============================================================================

@router.post("/forecasts", response_model=SalesForecast)
async def create_forecast(
    forecast: SalesForecastCreate,
    current_user: User = Depends(get_current_user)
):
    """Create a new sales forecast"""
    if not current_user.has_permission("forecasts", "create"):
        raise HTTPException(status_code=403, detail="You don't have permission to create forecasts")
    
    # Generate forecast number
    forecast_number = await get_next_number(current_user.company_id, "FCST", "forecasts")
    
    # Get owner name if provided
    owner_name = None
    if forecast.owner_id:
        owner = await db.users.find_one({"id": forecast.owner_id})
        if owner:
            owner_name = owner.get('full_name')
    
    forecast_data = SalesForecast(
        id=str(uuid.uuid4()),
        company_id=current_user.current_company_id,
        forecast_number=forecast_number,
        owner_name=owner_name,
        **forecast.dict(),
        created_by=current_user.id,
        created_at=datetime.now(timezone.utc)
    )
    
    forecast_dict = prepare_for_mongo(forecast_data.dict())
    await db.forecasts.insert_one(forecast_dict)
    
    return forecast_data


@router.get("/forecasts", response_model=List[SalesForecast])
async def get_forecasts(
    fiscal_year: Optional[int] = None,
    period: Optional[ForecastPeriod] = None,
    current_user: User = Depends(get_current_user)
):
    """Get all sales forecasts"""
    if not current_user.has_permission("forecasts", "read"):
        raise HTTPException(status_code=403, detail="You don't have permission to view forecasts")
    
    query = {"company_id": current_user.company_id}
    if fiscal_year:
        query["fiscal_year"] = fiscal_year
    if period:
        query["period"] = period.value
    
    forecasts = await db.forecasts.find(query).to_list(length=None)
    
    return [SalesForecast(**forecast) for forecast in forecasts]


@router.get("/forecasts/{forecast_id}", response_model=SalesForecast)
async def get_forecast(
    forecast_id: str,
    current_user: User = Depends(get_current_user)
):
    """Get a specific forecast"""
    if not current_user.has_permission("forecasts", "read"):
        raise HTTPException(status_code=403, detail="You don't have permission to view forecasts")
    
    forecast = await db.forecasts.find_one({
        "id": forecast_id,
        "company_id": current_user.company_id
    })
    
    if not forecast:
        raise HTTPException(status_code=404, detail="Forecast not found")
    
    return SalesForecast(**forecast)
