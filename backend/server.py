from fastapi import FastAPI, APIRouter, HTTPException, Depends, status, Query
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone, timedelta
from passlib.context import CryptContext
import jwt

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Security setup
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()
JWT_SECRET_KEY = os.environ['JWT_SECRET_KEY']  # Must be set in .env
JWT_ALGORITHM = os.environ.get('JWT_ALGORITHM', 'HS256')
JWT_EXPIRE_MINUTES = int(os.environ.get('JWT_EXPIRE_MINUTES', 60))

# Import models
from models import *

# Create the main app
app = FastAPI(title="Khairat Multi-Company Operations API", version="2.0.0")
api_router = APIRouter(prefix="/api")

# Utility functions
def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=JWT_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, JWT_SECRET_KEY, algorithm=JWT_ALGORITHM)
    return encoded_jwt

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        token = credentials.credentials
        payload = jwt.decode(token, JWT_SECRET_KEY, algorithms=[JWT_ALGORITHM])
        username = payload.get("sub")
        company_id = payload.get("company_id")
        
        if username is None:
            raise HTTPException(status_code=401, detail="Invalid token")
        
        user_doc = await db.users.find_one({"username": username}, {"_id": 0})
        if user_doc is None:
            raise HTTPException(status_code=401, detail="User not found")
        
        # Convert datetime strings back to datetime objects
        for field in ['created_at', 'last_login']:
            if field in user_doc and isinstance(user_doc[field], str):
                try:
                    user_doc[field] = datetime.fromisoformat(user_doc[field])
                except:
                    pass
        
        user = User(**user_doc)
        # Add current company context to user
        user.current_company_id = company_id
        return user
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

async def get_user_company(user: User = Depends(get_current_user)):
    """Get the current company context for the user"""
    if hasattr(user, 'current_company_id') and user.current_company_id:
        company_doc = await db.companies.find_one({"id": user.current_company_id}, {"_id": 0})
        if company_doc:
            # Convert datetime strings
            for field in ['created_at', 'updated_at']:
                if field in company_doc and isinstance(company_doc[field], str):
                    try:
                        company_doc[field] = datetime.fromisoformat(company_doc[field])
                    except:
                        pass
            return Company(**company_doc)
    return None

def serialize_datetime(obj):
    """Convert datetime objects to ISO strings for MongoDB storage"""
    if isinstance(obj, dict):
        for key, value in obj.items():
            if isinstance(value, datetime):
                obj[key] = value.isoformat()
            elif isinstance(value, dict):
                serialize_datetime(value)
            elif isinstance(value, list):
                for item in value:
                    if isinstance(item, dict):
                        serialize_datetime(item)
    return obj

def deserialize_datetime(obj, datetime_fields):
    """Convert ISO string timestamps back to datetime objects"""
    if isinstance(obj, dict):
        for field in datetime_fields:
            if field in obj and isinstance(obj[field], str):
                try:
                    obj[field] = datetime.fromisoformat(obj[field])
                except:
                    pass
    return obj

# Permission checking decorator
def require_permission(resource: str, action: str):
    """Decorator to check if user has permission for a resource and action"""
    async def permission_checker(user: User = Depends(get_current_user)):
        if not user.has_permission(resource, action):
            raise HTTPException(
                status_code=403, 
                detail=f"You don't have permission to {action} {resource}"
            )
        return user
    return permission_checker

# Role checking decorator
def require_role(allowed_roles: List[str]):
    """Decorator to check if user has one of the allowed roles"""
    async def role_checker(user: User = Depends(get_current_user)):
        if user.role not in allowed_roles and user.role != UserRole.SUPERADMIN:
            raise HTTPException(
                status_code=403, 
                detail=f"Access denied. Required roles: {', '.join(allowed_roles)}"
            )
        return user
    return role_checker

# Company management routes
@api_router.post("/companies", response_model=Company)
async def create_company(company_data: CompanyCreate, user: User = Depends(get_current_user)):
    """Create a new company (Super admin only)"""
    if user.role != UserRole.SUPERADMIN:
        raise HTTPException(status_code=403, detail="Super admin access required")
    
    company_obj = Company(**company_data.model_dump())
    doc = company_obj.model_dump()
    serialize_datetime(doc)
    
    await db.companies.insert_one(doc)
    return company_obj

@api_router.get("/companies", response_model=List[Company])
async def list_companies(user: User = Depends(get_current_user)):
    """List companies (Super admin sees all, users see their companies)"""
    if user.role == UserRole.SUPERADMIN:
        companies_list = await db.companies.find({}, {"_id": 0}).to_list(1000)
    else:
        # Users see only companies they have access to
        company_ids = user.companies if user.companies else ([user.company_id] if user.company_id else [])
        companies_list = await db.companies.find({"id": {"$in": company_ids}}, {"_id": 0}).to_list(1000)
    
    for company in companies_list:
        deserialize_datetime(company, ['created_at', 'updated_at'])
    
    return companies_list

@api_router.get("/companies/{company_id}", response_model=Company)
async def get_company(company_id: str, user: User = Depends(get_current_user)):
    """Get company details"""
    # Check access rights
    if user.role != UserRole.SUPERADMIN and company_id not in (user.companies or []) and company_id != user.company_id:
        raise HTTPException(status_code=403, detail="Access denied to this company")
    
    company_doc = await db.companies.find_one({"id": company_id}, {"_id": 0})
    if not company_doc:
        raise HTTPException(status_code=404, detail="Company not found")
    
    deserialize_datetime(company_doc, ['created_at', 'updated_at'])
    return Company(**company_doc)

@api_router.post("/switch-company")
async def switch_company(switch_data: CompanySwitch, user: User = Depends(get_current_user)):
    """Switch user's active company context"""
    company_id = switch_data.company_id
    
    # Verify user has access to this company
    if user.role != UserRole.SUPERADMIN and company_id not in (user.companies or []) and company_id != user.company_id:
        raise HTTPException(status_code=403, detail="Access denied to this company")
    
    # Verify company exists
    company_doc = await db.companies.find_one({"id": company_id}, {"_id": 0})
    if not company_doc:
        raise HTTPException(status_code=404, detail="Company not found")
    
    # Create new token with company context
    token_data = {"sub": user.username, "company_id": company_id}
    access_token = create_access_token(token_data)
    
    company = Company(**company_doc)
    deserialize_datetime(company.model_dump(), ['created_at', 'updated_at'])
    
    return Token(
        access_token=access_token,
        token_type="bearer",
        expires_in=JWT_EXPIRE_MINUTES * 60,
        user=user,
        company=company
    )

# Authentication routes
@api_router.post("/register", response_model=User)
async def register_user(user_data: UserCreate):
    # Check if user exists
    existing_user = await db.users.find_one({"$or": [{"username": user_data.username}, {"email": user_data.email}]})
    if existing_user:
        raise HTTPException(status_code=400, detail="User already exists")
    
    # If company_id provided, verify it exists
    if user_data.company_id:
        company_doc = await db.companies.find_one({"id": user_data.company_id})
        if not company_doc:
            raise HTTPException(status_code=400, detail="Company not found")
        companies = [user_data.company_id]
    else:
        companies = []
    
    # Create new user
    hashed_password = hash_password(user_data.password)
    user_dict = user_data.model_dump()
    del user_dict['password']
    
    user_obj = User(**user_dict, companies=companies)
    doc = user_obj.model_dump()
    doc['hashed_password'] = hashed_password
    serialize_datetime(doc)
    
    await db.users.insert_one(doc)
    return user_obj

@api_router.post("/login", response_model=Token)
async def login_user(login_data: UserLogin):
    user_doc = await db.users.find_one({"username": login_data.username}, {"_id": 0})
    if not user_doc or not verify_password(login_data.password, user_doc["hashed_password"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    # Convert datetime fields
    for field in ['created_at', 'last_login']:
        if field in user_doc and isinstance(user_doc[field], str):
            try:
                user_doc[field] = datetime.fromisoformat(user_doc[field])
            except:
                pass
    
    user = User(**user_doc)
    
    # Determine default company for token
    default_company_id = user.company_id or (user.companies[0] if user.companies else None)
    
    # Get company details if available
    company = None
    if default_company_id:
        company_doc = await db.companies.find_one({"id": default_company_id}, {"_id": 0})
        if company_doc:
            deserialize_datetime(company_doc, ['created_at', 'updated_at'])
            company = Company(**company_doc)
    
    # Update last login
    await db.users.update_one(
        {"username": login_data.username},
        {"$set": {"last_login": datetime.now(timezone.utc).isoformat()}}
    )
    
    # Create token with company context
    token_data = {"sub": user.username}
    if default_company_id:
        token_data["company_id"] = default_company_id
    
    access_token = create_access_token(token_data)
    
    return Token(
        access_token=access_token,
        token_type="bearer",
        expires_in=JWT_EXPIRE_MINUTES * 60,
        user=user,
        company=company
    )

@api_router.get("/me")
async def get_current_user_info(user: User = Depends(get_current_user), company: Company = Depends(get_user_company)):
    # Get user permissions based on role
    permissions = ROLE_PERMISSIONS.get(user.role, {})
    return {
        "user": user, 
        "company": company,
        "permissions": permissions,
        "role": user.role
    }

# Equipment routes (company-specific)
@api_router.post("/equipment", response_model=Equipment)
async def create_equipment(equipment_data: EquipmentCreate, user: User = Depends(get_current_user)):
    # Check permission
    if not user.has_permission("equipment", "create"):
        raise HTTPException(status_code=403, detail="You don't have permission to create equipment")
    
    if not hasattr(user, 'current_company_id') or not user.current_company_id:
        raise HTTPException(status_code=400, detail="No company context")
    
    equipment_obj = Equipment(**equipment_data.model_dump(), company_id=user.current_company_id)
    doc = equipment_obj.model_dump()
    serialize_datetime(doc)
    
    await db.equipment.insert_one(doc)
    return equipment_obj

@api_router.get("/equipment", response_model=List[Equipment])
async def get_equipment(user: User = Depends(get_current_user)):
    # Check permission
    if not user.has_permission("equipment", "read"):
        raise HTTPException(status_code=403, detail="You don't have permission to view equipment")
    
    if not hasattr(user, 'current_company_id') or not user.current_company_id:
        raise HTTPException(status_code=400, detail="No company context")
    
    equipment_list = await db.equipment.find(
        {"company_id": user.current_company_id, "is_active": True}, 
        {"_id": 0}
    ).to_list(1000)
    
    for equipment in equipment_list:
        deserialize_datetime(equipment, ['created_at', 'updated_at', 'purchase_date'])
    
    return equipment_list

# Production routes (company-specific)
@api_router.post("/production", response_model=Production)
async def create_production(production_data: ProductionCreate, user: User = Depends(get_current_user)):
    if not user.has_permission("production", "create"):
        raise HTTPException(status_code=403, detail="You don't have permission to create production records")
    
    if not hasattr(user, 'current_company_id') or not user.current_company_id:
        raise HTTPException(status_code=400, detail="No company context")
    
    production_dict = production_data.model_dump()
    # Calculate completion rate
    if production_dict['contract_qty'] > 0:
        production_dict['completion_rate'] = (production_dict['actual_qty'] / production_dict['contract_qty']) * 100
    
    production_obj = Production(**production_dict, company_id=user.current_company_id)
    doc = production_obj.model_dump()
    serialize_datetime(doc)
    
    await db.production.insert_one(doc)
    return production_obj

@api_router.get("/production", response_model=List[Production])
async def get_production(user: User = Depends(get_current_user)):
    if not user.has_permission("production", "read"):
        raise HTTPException(status_code=403, detail="You don't have permission to view production records")
    
    if not hasattr(user, 'current_company_id') or not user.current_company_id:
        raise HTTPException(status_code=400, detail="No company context")
    
    production_list = await db.production.find(
        {"company_id": user.current_company_id}, 
        {"_id": 0}
    ).sort("date", -1).to_list(1000)
    
    for production in production_list:
        deserialize_datetime(production, ['date', 'created_at', 'updated_at'])
    
    return production_list

# Expenses routes (company-specific)
@api_router.post("/expenses", response_model=Expense)
async def create_expense(expense_data: ExpenseCreate, user: User = Depends(get_current_user)):
    if not user.has_permission("expenses", "create"):
        raise HTTPException(status_code=403, detail="You don't have permission to create expenses")
    
    if not hasattr(user, 'current_company_id') or not user.current_company_id:
        raise HTTPException(status_code=400, detail="No company context")
    
    expense_obj = Expense(**expense_data.model_dump(), company_id=user.current_company_id)
    doc = expense_obj.model_dump()
    serialize_datetime(doc)
    
    await db.expenses.insert_one(doc)
    return expense_obj

@api_router.get("/expenses", response_model=List[Expense])
async def get_expenses(user: User = Depends(get_current_user)):
    if not user.has_permission("expenses", "read"):
        raise HTTPException(status_code=403, detail="You don't have permission to view expenses")
    
    if not hasattr(user, 'current_company_id') or not user.current_company_id:
        raise HTTPException(status_code=400, detail="No company context")
    
    expenses_list = await db.expenses.find(
        {"company_id": user.current_company_id}, 
        {"_id": 0}
    ).sort("date", -1).to_list(1000)
    
    for expense in expenses_list:
        deserialize_datetime(expense, ['date', 'created_at', 'updated_at'])
    
    return expenses_list

# Invoices routes (company-specific)
@api_router.post("/invoices", response_model=Invoice)
async def create_invoice(invoice_data: InvoiceCreate, user: User = Depends(get_current_user)):
    if not user.has_permission("invoices", "create"):
        raise HTTPException(status_code=403, detail="You don't have permission to create invoices")
    
    if not hasattr(user, 'current_company_id') or not user.current_company_id:
        raise HTTPException(status_code=400, detail="No company context")
    
    invoice_dict = invoice_data.model_dump()
    # Calculate VAT and total if needed
    if invoice_dict.get('quantity') and invoice_dict.get('unit_price'):
        base_amount = invoice_dict['quantity'] * invoice_dict['unit_price']
        vat_amount = base_amount * 0.15  # 15% VAT for Saudi Arabia
        invoice_dict['vat_amount'] = vat_amount
        invoice_dict['total_amount'] = base_amount + vat_amount
    
    invoice_obj = Invoice(**invoice_dict, company_id=user.current_company_id)
    doc = invoice_obj.model_dump()
    serialize_datetime(doc)
    
    await db.invoices.insert_one(doc)
    return invoice_obj

@api_router.get("/invoices", response_model=List[Invoice])
async def get_invoices(user: User = Depends(get_current_user)):
    if not user.has_permission("invoices", "read"):
        raise HTTPException(status_code=403, detail="You don't have permission to view invoices")
    
    if not hasattr(user, 'current_company_id') or not user.current_company_id:
        raise HTTPException(status_code=400, detail="No company context")
    
    invoices_list = await db.invoices.find(
        {"company_id": user.current_company_id}, 
        {"_id": 0}
    ).sort("date", -1).to_list(1000)
    
    for invoice in invoices_list:
        deserialize_datetime(invoice, ['date', 'due_date', 'payment_date', 'created_at', 'updated_at'])
    
    return invoices_list

# Attendance routes (company-specific)
@api_router.post("/attendance", response_model=Attendance)
async def create_attendance(attendance_data: AttendanceCreate, user: User = Depends(get_current_user)):
    if not user.has_permission("attendance", "create"):
        raise HTTPException(status_code=403, detail="You don't have permission to create attendance records")
    
    if not hasattr(user, 'current_company_id') or not user.current_company_id:
        raise HTTPException(status_code=400, detail="No company context")
    
    attendance_obj = Attendance(**attendance_data.model_dump(), company_id=user.current_company_id)
    doc = attendance_obj.model_dump()
    serialize_datetime(doc)
    
    await db.attendance.insert_one(doc)
    return attendance_obj

@api_router.get("/attendance", response_model=List[Attendance])
async def get_attendance(user: User = Depends(get_current_user)):
    if not user.has_permission("attendance", "read"):
        raise HTTPException(status_code=403, detail="You don't have permission to view attendance records")
    
    if not hasattr(user, 'current_company_id') or not user.current_company_id:
        raise HTTPException(status_code=400, detail="No company context")
    
    attendance_list = await db.attendance.find(
        {"company_id": user.current_company_id}, 
        {"_id": 0}
    ).sort("date", -1).to_list(1000)
    
    for attendance in attendance_list:
        deserialize_datetime(attendance, ['date', 'check_in', 'check_out', 'created_at', 'updated_at'])
    
    return attendance_list


# Costing Centers routes (company-specific)
@api_router.post("/costing-centers", response_model=CostingCenter)
async def create_costing_center(center_data: CostingCenterCreate, user: User = Depends(get_current_user)):
    if not user.has_permission("costing_centers", "create"):
        raise HTTPException(status_code=403, detail="You don't have permission to create costing centers")
    
    if not hasattr(user, 'current_company_id') or not user.current_company_id:
        raise HTTPException(status_code=400, detail="No company context")
    
    center_obj = CostingCenter(**center_data.model_dump(), company_id=user.current_company_id)
    doc = center_obj.model_dump()
    serialize_datetime(doc)
    
    await db.costing_centers.insert_one(doc)
    return center_obj

@api_router.get("/costing-centers", response_model=List[CostingCenter])
async def get_costing_centers(user: User = Depends(get_current_user)):
    if not user.has_permission("costing_centers", "read"):
        raise HTTPException(status_code=403, detail="You don't have permission to view costing centers")
    
    if not hasattr(user, 'current_company_id') or not user.current_company_id:
        raise HTTPException(status_code=400, detail="No company context")
    
    centers_list = await db.costing_centers.find(
        {"company_id": user.current_company_id, "is_active": True}, 
        {"_id": 0}
    ).to_list(1000)
    
    for center in centers_list:
        deserialize_datetime(center, ['created_at', 'updated_at'])
    
    return centers_list

# Dashboard Analytics routes (company-specific)
@api_router.get("/dashboard/stats")
async def get_dashboard_stats(user: User = Depends(get_current_user)):
    if not user.has_permission("dashboard", "read"):
        raise HTTPException(status_code=403, detail="You don't have permission to view dashboard")
    
    if not hasattr(user, 'current_company_id') or not user.current_company_id:
        raise HTTPException(status_code=400, detail="No company context")
    
    company_id = user.current_company_id
    
    # Get current month statistics
    today = datetime.now(timezone.utc)
    month_start = today.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    
    # Production stats
    production_pipeline = [
        {"$match": {"company_id": company_id, "date": {"$gte": month_start.isoformat()}}},
        {"$group": {
            "_id": None,
            "total_actual": {"$sum": "$actual_qty"},
            "total_contract": {"$sum": "$contract_qty"},
            "avg_completion": {"$avg": "$completion_rate"}
        }}
    ]
    production_stats = await db.production.aggregate(production_pipeline).to_list(1)
    
    # Expense stats
    expense_pipeline = [
        {"$match": {"company_id": company_id, "date": {"$gte": month_start.isoformat()}}},
        {"$group": {
            "_id": "$category",
            "total_amount": {"$sum": "$amount"},
            "count": {"$sum": 1}
        }}
    ]
    expense_stats = await db.expenses.aggregate(expense_pipeline).to_list(100)
    
    # Equipment count
    equipment_count = await db.equipment.count_documents({"company_id": company_id, "is_active": True})
    
    # Invoice stats
    invoice_pipeline = [
        {"$match": {"company_id": company_id, "date": {"$gte": month_start.isoformat()}}},
        {"$group": {
            "_id": "$status",
            "total_amount": {"$sum": "$total_amount"},
            "count": {"$sum": 1}
        }}
    ]
    invoice_stats = await db.invoices.aggregate(invoice_pipeline).to_list(100)
    
    return {
        "production": production_stats[0] if production_stats else {"total_actual": 0, "total_contract": 0, "avg_completion": 0},
        "expenses": expense_stats,
        "equipment_count": equipment_count,
        "invoices": invoice_stats,
        "month": month_start.strftime("%B %Y"),
        "company_id": company_id
    }


# Project Management Routes
@api_router.post("/projects", response_model=Project)
async def create_project(project_data: ProjectCreate, user: User = Depends(get_current_user)):
    if not user.has_permission("projects", "create"):
        raise HTTPException(status_code=403, detail="You don't have permission to create projects")
    
    if not hasattr(user, 'current_company_id') or not user.current_company_id:
        raise HTTPException(status_code=400, detail="No company context")
    
    project_obj = Project(**project_data.model_dump(), company_id=user.current_company_id)
    doc = project_obj.model_dump()
    serialize_datetime(doc)
    
    await db.projects.insert_one(doc)
    return project_obj

@api_router.get("/projects", response_model=List[Project])
async def get_projects(user: User = Depends(get_current_user)):
    if not user.has_permission("projects", "read"):
        raise HTTPException(status_code=403, detail="You don't have permission to view projects")
    
    if not hasattr(user, 'current_company_id') or not user.current_company_id:
        raise HTTPException(status_code=400, detail="No company context")
    
    projects_list = await db.projects.find(
        {"company_id": user.current_company_id}, 
        {"_id": 0}
    ).to_list(1000)
    
    for project in projects_list:
        deserialize_datetime(project, ['created_at', 'updated_at', 'start_date', 'end_date'])
    
    return projects_list

@api_router.get("/projects/{project_id}", response_model=Project)
async def get_project(project_id: str, user: User = Depends(get_current_user)):
    if not user.has_permission("projects", "read"):
        raise HTTPException(status_code=403, detail="You don't have permission to view projects")
    
    project_doc = await db.projects.find_one({"id": project_id, "company_id": user.current_company_id}, {"_id": 0})
    if not project_doc:
        raise HTTPException(status_code=404, detail="Project not found")
    
    deserialize_datetime(project_doc, ['created_at', 'updated_at', 'start_date', 'end_date'])
    return Project(**project_doc)

@api_router.put("/projects/{project_id}", response_model=Project)
async def update_project(project_id: str, project_data: dict, user: User = Depends(get_current_user)):
    if not user.has_permission("projects", "update"):
        raise HTTPException(status_code=403, detail="You don't have permission to update projects")
    
    project_doc = await db.projects.find_one({"id": project_id, "company_id": user.current_company_id}, {"_id": 0})
    if not project_doc:
        raise HTTPException(status_code=404, detail="Project not found")
    
    project_data['updated_at'] = datetime.now(timezone.utc).isoformat()
    serialize_datetime(project_data)
    
    await db.projects.update_one({"id": project_id}, {"$set": project_data})
    
    updated_doc = await db.projects.find_one({"id": project_id}, {"_id": 0})
    deserialize_datetime(updated_doc, ['created_at', 'updated_at', 'start_date', 'end_date'])
    return Project(**updated_doc)

# Feasibility Studies Routes
@api_router.post("/feasibility-studies", response_model=FeasibilityStudy)
async def create_feasibility_study(study_data: FeasibilityStudyCreate, user: User = Depends(get_current_user)):
    if not user.has_permission("feasibility_studies", "create"):
        raise HTTPException(status_code=403, detail="You don't have permission to create feasibility studies")
    
    if not hasattr(user, 'current_company_id') or not user.current_company_id:
        raise HTTPException(status_code=400, detail="No company context")
    
    study_obj = FeasibilityStudy(**study_data.model_dump(), company_id=user.current_company_id)
    doc = study_obj.model_dump()
    serialize_datetime(doc)
    
    await db.feasibility_studies.insert_one(doc)
    return study_obj

@api_router.get("/feasibility-studies", response_model=List[FeasibilityStudy])
async def get_feasibility_studies(project_id: Optional[str] = None, user: User = Depends(get_current_user)):
    if not user.has_permission("feasibility_studies", "read"):
        raise HTTPException(status_code=403, detail="You don't have permission to view feasibility studies")
    
    if not hasattr(user, 'current_company_id') or not user.current_company_id:
        raise HTTPException(status_code=400, detail="No company context")
    
    query = {"company_id": user.current_company_id}
    if project_id:
        query["project_id"] = project_id
    
    studies_list = await db.feasibility_studies.find(query, {"_id": 0}).to_list(1000)
    
    for study in studies_list:
        deserialize_datetime(study, ['created_at', 'updated_at', 'start_date', 'expected_end_date', 'actual_end_date'])
    
    return studies_list

@api_router.get("/feasibility-studies/{study_id}", response_model=FeasibilityStudy)
async def get_feasibility_study(study_id: str, user: User = Depends(get_current_user)):
    if not user.has_permission("feasibility_studies", "read"):
        raise HTTPException(status_code=403, detail="You don't have permission to view feasibility studies")
    
    study_doc = await db.feasibility_studies.find_one({"id": study_id, "company_id": user.current_company_id}, {"_id": 0})
    if not study_doc:
        raise HTTPException(status_code=404, detail="Feasibility study not found")
    
    deserialize_datetime(study_doc, ['created_at', 'updated_at', 'start_date', 'expected_end_date', 'actual_end_date'])
    return FeasibilityStudy(**study_doc)

# Investment Routes
@api_router.post("/investments", response_model=Investment)
async def create_investment(investment_data: InvestmentCreate, user: User = Depends(get_current_user)):
    if not user.has_permission("investments", "create"):
        raise HTTPException(status_code=403, detail="You don't have permission to create investments")
    
    if not hasattr(user, 'current_company_id') or not user.current_company_id:
        raise HTTPException(status_code=400, detail="No company context")
    
    investment_obj = Investment(**investment_data.model_dump(), company_id=user.current_company_id)
    doc = investment_obj.model_dump()
    serialize_datetime(doc)
    
    await db.investments.insert_one(doc)
    return investment_obj

@api_router.get("/investments", response_model=List[Investment])
async def get_investments(project_id: Optional[str] = None, user: User = Depends(get_current_user)):
    if not user.has_permission("investments", "read"):
        raise HTTPException(status_code=403, detail="You don't have permission to view investments")
    
    if not hasattr(user, 'current_company_id') or not user.current_company_id:
        raise HTTPException(status_code=400, detail="No company context")
    
    query = {"company_id": user.current_company_id}
    if project_id:
        query["project_id"] = project_id
    
    investments_list = await db.investments.find(query, {"_id": 0}).to_list(1000)
    
    for investment in investments_list:
        deserialize_datetime(investment, ['created_at', 'updated_at', 'investment_date', 'maturity_date'])
    
    return investments_list

# Financial Projections Routes
@api_router.post("/financial-projections", response_model=FinancialProjection)
async def create_financial_projection(projection_data: FinancialProjectionCreate, user: User = Depends(get_current_user)):
    if not user.has_permission("financial_projections", "create"):
        raise HTTPException(status_code=403, detail="You don't have permission to create financial projections")
    
    if not hasattr(user, 'current_company_id') or not user.current_company_id:
        raise HTTPException(status_code=400, detail="No company context")
    
    projection_obj = FinancialProjection(**projection_data.model_dump(), company_id=user.current_company_id)
    doc = projection_obj.model_dump()
    serialize_datetime(doc)
    
    await db.financial_projections.insert_one(doc)
    return projection_obj

@api_router.get("/financial-projections", response_model=List[FinancialProjection])
async def get_financial_projections(project_id: Optional[str] = None, user: User = Depends(get_current_user)):
    if not user.has_permission("financial_projections", "read"):
        raise HTTPException(status_code=403, detail="You don't have permission to view financial projections")
    
    if not hasattr(user, 'current_company_id') or not user.current_company_id:
        raise HTTPException(status_code=400, detail="No company context")
    
    query = {"company_id": user.current_company_id}
    if project_id:
        query["project_id"] = project_id
    
    projections_list = await db.financial_projections.find(query, {"_id": 0}).sort("year", 1).to_list(1000)
    
    for projection in projections_list:
        deserialize_datetime(projection, ['created_at', 'updated_at'])
    
    return projections_list

# Document Management Routes
@api_router.post("/documents", response_model=Document)
async def create_document(document_data: DocumentCreate, user: User = Depends(get_current_user)):
    if not user.has_permission("documents", "create"):
        raise HTTPException(status_code=403, detail="You don't have permission to create documents")
    
    if not hasattr(user, 'current_company_id') or not user.current_company_id:
        raise HTTPException(status_code=400, detail="No company context")
    
    document_obj = Document(**document_data.model_dump(), company_id=user.current_company_id, uploaded_by=user.username)
    doc = document_obj.model_dump()
    serialize_datetime(doc)
    
    await db.documents.insert_one(doc)
    return document_obj

@api_router.get("/documents", response_model=List[Document])
async def get_documents(project_id: Optional[str] = None, document_type: Optional[str] = None, user: User = Depends(get_current_user)):
    if not user.has_permission("documents", "read"):
        raise HTTPException(status_code=403, detail="You don't have permission to view documents")
    
    if not hasattr(user, 'current_company_id') or not user.current_company_id:
        raise HTTPException(status_code=400, detail="No company context")
    
    query = {"company_id": user.current_company_id}
    if project_id:
        query["project_id"] = project_id
    if document_type:
        query["document_type"] = document_type
    
    documents_list = await db.documents.find(query, {"_id": 0}).sort("created_at", -1).to_list(1000)
    
    for document in documents_list:
        deserialize_datetime(document, ['created_at', 'updated_at'])
    
    return documents_list

# Health check
@api_router.get("/")
async def root():
    return {"message": "Khairat Multi-Company Operations API is running", "version": "2.0.0"}

@api_router.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.now(timezone.utc).isoformat()}

# Include router in app
app.include_router(api_router)

# Import and include accounting routes
from accounting_routes import accounting_router
app.include_router(accounting_router)

# Import and include CRM routes
from crm_routes import crm_router
app.include_router(crm_router)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    pass

# HR Management Routes
@api_router.post("/employees", response_model=Employee)
async def create_employee(employee_data: EmployeeCreate, user: User = Depends(get_current_user)):
    if not user.has_permission("employees", "create"):
        raise HTTPException(status_code=403, detail="You don't have permission to create employees")
    
    if not hasattr(user, 'current_company_id') or not user.current_company_id:
        raise HTTPException(status_code=400, detail="No company context")
    
    employee_obj = Employee(**employee_data.model_dump(), company_id=user.current_company_id)
    doc = employee_obj.model_dump()
    serialize_datetime(doc)
    
    await db.employees.insert_one(doc)
    return employee_obj

@api_router.get("/employees", response_model=List[Employee])
async def get_employees(user: User = Depends(get_current_user)):
    if not user.has_permission("employees", "read") and not user.has_permission("employees", "read_own"):
        raise HTTPException(status_code=403, detail="You don't have permission to view employees")
    
    if not hasattr(user, 'current_company_id') or not user.current_company_id:
        raise HTTPException(status_code=400, detail="No company context")
    
    # Drivers can only see their own employee record
    if user.has_permission("employees", "read_own"):
        employees_list = await db.employees.find(
            {"company_id": user.current_company_id, "user_id": user.id}, 
            {"_id": 0}
        ).to_list(1)
    else:
        employees_list = await db.employees.find(
            {"company_id": user.current_company_id}, 
            {"_id": 0}
        ).to_list(1000)
    
    for employee in employees_list:
        deserialize_datetime(employee, ['created_at', 'updated_at', 'date_of_birth', 'hire_date', 'termination_date'])
    
    return employees_list

@api_router.get("/employees/me", response_model=Employee)
async def get_my_employee_profile(user: User = Depends(get_current_user)):
    """Get current user's employee profile"""
    employee_doc = await db.employees.find_one({"user_id": user.id, "company_id": user.current_company_id}, {"_id": 0})
    if not employee_doc:
        raise HTTPException(status_code=404, detail="Employee profile not found")
    
    deserialize_datetime(employee_doc, ['created_at', 'updated_at', 'date_of_birth', 'hire_date', 'termination_date'])
    return Employee(**employee_doc)

# Salary Routes
@api_router.post("/salary-payments", response_model=SalaryPayment)
async def create_salary_payment(payment_data: SalaryPaymentCreate, user: User = Depends(get_current_user)):
    if not user.has_permission("salary", "create"):
        raise HTTPException(status_code=403, detail="You don't have permission to create salary payments")
    
    if not hasattr(user, 'current_company_id') or not user.current_company_id:
        raise HTTPException(status_code=400, detail="No company context")
    
    # Get employee name
    employee = await db.employees.find_one({"id": payment_data.employee_id})
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")
    
    # Calculate net salary
    net_salary = (payment_data.base_salary + payment_data.bonuses + payment_data.overtime_pay - payment_data.deductions)
    
    payment_obj = SalaryPayment(
        **payment_data.model_dump(), 
        employee_name=employee['full_name'],
        net_salary=net_salary,
        company_id=user.current_company_id
    )
    doc = payment_obj.model_dump()
    serialize_datetime(doc)
    
    await db.salary_payments.insert_one(doc)
    return payment_obj

@api_router.get("/salary-payments", response_model=List[SalaryPayment])
async def get_salary_payments(employee_id: Optional[str] = None, user: User = Depends(get_current_user)):
    if not user.has_permission("salary", "read") and not user.has_permission("salary", "read_own"):
        raise HTTPException(status_code=403, detail="You don't have permission to view salary payments")
    
    if not hasattr(user, 'current_company_id') or not user.current_company_id:
        raise HTTPException(status_code=400, detail="No company context")
    
    query = {"company_id": user.current_company_id}
    
    # Drivers can only see their own salary
    if user.has_permission("salary", "read_own"):
        my_employee = await db.employees.find_one({"user_id": user.id})
        if my_employee:
            query["employee_id"] = my_employee['id']
    elif employee_id:
        query["employee_id"] = employee_id
    
    payments_list = await db.salary_payments.find(query, {"_id": 0}).sort("year", -1).sort("month", -1).to_list(1000)
    
    for payment in payments_list:
        deserialize_datetime(payment, ['created_at', 'updated_at', 'payment_date'])
    
    return payments_list

# Vehicle & GPS Routes
@api_router.post("/vehicles", response_model=Vehicle)
async def create_vehicle(vehicle_data: VehicleCreate, user: User = Depends(get_current_user)):
    if not user.has_permission("vehicles", "create"):
        raise HTTPException(status_code=403, detail="You don't have permission to create vehicles")
    
    if not hasattr(user, 'current_company_id') or not user.current_company_id:
        raise HTTPException(status_code=400, detail="No company context")
    
    vehicle_obj = Vehicle(**vehicle_data.model_dump(), company_id=user.current_company_id)
    doc = vehicle_obj.model_dump()
    serialize_datetime(doc)
    
    await db.vehicles.insert_one(doc)
    return vehicle_obj

@api_router.get("/vehicles", response_model=List[Vehicle])
async def get_vehicles(user: User = Depends(get_current_user)):
    if not user.has_permission("vehicles", "read") and not user.has_permission("vehicles", "read_assigned"):
        raise HTTPException(status_code=403, detail="You don't have permission to view vehicles")
    
    if not hasattr(user, 'current_company_id') or not user.current_company_id:
        raise HTTPException(status_code=400, detail="No company context")
    
    query = {"company_id": user.current_company_id}
    
    # Drivers can only see their assigned vehicle
    if user.has_permission("vehicles", "read_assigned"):
        query["assigned_driver_id"] = user.id
    
    vehicles_list = await db.vehicles.find(query, {"_id": 0}).to_list(1000)
    
    for vehicle in vehicles_list:
        deserialize_datetime(vehicle, ['created_at', 'updated_at', 'last_location_update', 'last_maintenance_date', 'next_maintenance_date'])
    
    return vehicles_list

@api_router.put("/vehicles/{vehicle_id}/location")
async def update_vehicle_location(vehicle_id: str, location_data: VehicleLocationUpdate, user: User = Depends(get_current_user)):
    if not user.has_permission("vehicle_location", "update"):
        raise HTTPException(status_code=403, detail="You don't have permission to update vehicle location")
    
    # Verify vehicle exists and belongs to company
    vehicle = await db.vehicles.find_one({"id": vehicle_id, "company_id": user.current_company_id})
    if not vehicle:
        raise HTTPException(status_code=404, detail="Vehicle not found")
    
    # Drivers can only update their assigned vehicle
    if user.role == UserRole.DRIVER and vehicle.get('assigned_driver_id') != user.id:
        raise HTTPException(status_code=403, detail="You can only update your assigned vehicle")
    
    update_data = {
        "last_location_lat": location_data.latitude,
        "last_location_lng": location_data.longitude,
        "last_location_address": location_data.address,
        "last_location_update": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.vehicles.update_one({"id": vehicle_id}, {"$set": update_data})
    
    return {"success": True, "message": "Location updated"}

@api_router.put("/vehicles/{vehicle_id}/assign")
async def assign_driver_to_vehicle(vehicle_id: str, driver_id: str, user: User = Depends(get_current_user)):
    if not user.has_permission("vehicles", "update"):
        raise HTTPException(status_code=403, detail="You don't have permission to assign vehicles")
    
    # Get driver info
    driver = await db.users.find_one({"id": driver_id})
    if not driver:
        raise HTTPException(status_code=404, detail="Driver not found")
    
    update_data = {
        "assigned_driver_id": driver_id,
        "assigned_driver_name": driver['full_name'],
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.vehicles.update_one({"id": vehicle_id}, {"$set": update_data})
    
    return {"success": True, "message": "Driver assigned to vehicle"}



# Department Management Routes
@api_router.post("/departments", response_model=Department)
async def create_department(dept_data: DepartmentCreate, user: User = Depends(get_current_user)):
    if not user.has_permission("departments", "create"):
        raise HTTPException(status_code=403, detail="You don't have permission to create departments")
    
    if not hasattr(user, 'current_company_id') or not user.current_company_id:
        raise HTTPException(status_code=400, detail="No company context")
    
    dept_obj = Department(**dept_data.model_dump(), company_id=user.current_company_id)
    doc = dept_obj.model_dump()
    serialize_datetime(doc)
    
    await db.departments.insert_one(doc)
    return dept_obj

@api_router.get("/departments", response_model=List[Department])
async def get_departments(user: User = Depends(get_current_user)):
    if not user.has_permission("departments", "read"):
        raise HTTPException(status_code=403, detail="You don't have permission to view departments")
    
    if not hasattr(user, 'current_company_id') or not user.current_company_id:
        raise HTTPException(status_code=400, detail="No company context")
    
    departments_list = await db.departments.find(
        {"company_id": user.current_company_id, "is_active": True}, 
        {"_id": 0}
    ).sort("level", 1).to_list(1000)
    
    for dept in departments_list:
        deserialize_datetime(dept, ['created_at', 'updated_at'])
    
    return departments_list

@api_router.get("/departments/tree")
async def get_department_tree(user: User = Depends(get_current_user)):
    """Get hierarchical department structure"""
    if not user.has_permission("org_chart", "read"):
        raise HTTPException(status_code=403, detail="You don't have permission to view org chart")
    
    if not hasattr(user, 'current_company_id') or not user.current_company_id:
        raise HTTPException(status_code=400, detail="No company context")
    
    departments = await db.departments.find(
        {"company_id": user.current_company_id, "is_active": True}, 
        {"_id": 0}
    ).to_list(1000)
    
    # Build tree structure
    dept_dict = {dept['id']: dept for dept in departments}
    tree = []
    
    for dept in departments:
        dept['children'] = []
        if dept.get('parent_department_id'):
            parent = dept_dict.get(dept['parent_department_id'])
            if parent:
                if 'children' not in parent:
                    parent['children'] = []
                parent['children'].append(dept)
        else:
            tree.append(dept)
    
    return tree

# Position Management Routes
@api_router.post("/positions", response_model=Position)
async def create_position(position_data: PositionCreate, user: User = Depends(get_current_user)):
    if not user.has_permission("positions", "create"):
        raise HTTPException(status_code=403, detail="You don't have permission to create positions")
    
    if not hasattr(user, 'current_company_id') or not user.current_company_id:
        raise HTTPException(status_code=400, detail="No company context")
    
    # Get department name
    dept = await db.departments.find_one({"id": position_data.department_id})
    if not dept:
        raise HTTPException(status_code=404, detail="Department not found")
    
    position_obj = Position(
        **position_data.model_dump(), 
        company_id=user.current_company_id,
        department_name=dept['name_ar']
    )
    doc = position_obj.model_dump()
    serialize_datetime(doc)
    
    await db.positions.insert_one(doc)
    return position_obj

@api_router.get("/positions", response_model=List[Position])
async def get_positions(department_id: Optional[str] = None, user: User = Depends(get_current_user)):
    if not user.has_permission("positions", "read"):
        raise HTTPException(status_code=403, detail="You don't have permission to view positions")
    
    if not hasattr(user, 'current_company_id') or not user.current_company_id:
        raise HTTPException(status_code=400, detail="No company context")
    
    query = {"company_id": user.current_company_id, "is_active": True}
    if department_id:
        query["department_id"] = department_id
    
    positions_list = await db.positions.find(query, {"_id": 0}).sort("level", 1).to_list(1000)
    
    for position in positions_list:
        deserialize_datetime(position, ['created_at', 'updated_at'])
    
    return positions_list

    client.close()