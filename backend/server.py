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
JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY', 'khairat-operations-jwt-secret-key-production-2024')
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
    if not user.is_super_admin:
        raise HTTPException(status_code=403, detail="Super admin access required")
    
    company_obj = Company(**company_data.model_dump())
    doc = company_obj.model_dump()
    serialize_datetime(doc)
    
    await db.companies.insert_one(doc)
    return company_obj

@api_router.get("/companies", response_model=List[Company])
async def list_companies(user: User = Depends(get_current_user)):
    """List companies (Super admin sees all, users see their companies)"""
    if user.is_super_admin:
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
    if not user.is_super_admin and company_id not in (user.companies or []) and company_id != user.company_id:
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
    if not user.is_super_admin and company_id not in (user.companies or []) and company_id != user.company_id:
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
    if not hasattr(user, 'current_company_id') or not user.current_company_id:
        raise HTTPException(status_code=400, detail="No company context")
    
    attendance_obj = Attendance(**attendance_data.model_dump(), company_id=user.current_company_id)
    doc = attendance_obj.model_dump()
    serialize_datetime(doc)
    
    await db.attendance.insert_one(doc)
    return attendance_obj

@api_router.get("/attendance", response_model=List[Attendance])
async def get_attendance(user: User = Depends(get_current_user)):
    if not hasattr(user, 'current_company_id') or not user.current_company_id:
        raise HTTPException(status_code=400, detail="No company context")
    
    attendance_list = await db.attendance.find(
        {"company_id": user.current_company_id}, 
        {"_id": 0}
    ).sort("date", -1).to_list(1000)
    
    for attendance in attendance_list:
        deserialize_datetime(attendance, ['date', 'check_in', 'check_out', 'created_at', 'updated_at'])
    
    return attendance_list

# Dashboard Analytics routes (company-specific)
@api_router.get("/dashboard/stats")
async def get_dashboard_stats(user: User = Depends(get_current_user)):
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

# Health check
@api_router.get("/")
async def root():
    return {"message": "Khairat Multi-Company Operations API is running", "version": "2.0.0"}

@api_router.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.now(timezone.utc).isoformat()}

# Include router in app
app.include_router(api_router)

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
    client.close()