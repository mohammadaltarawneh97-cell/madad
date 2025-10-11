from fastapi import FastAPI, APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone, timedelta
from passlib.context import CryptContext
import jwt
from enum import Enum

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Security setup
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()
JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY', 'khairat-secret-key')
JWT_ALGORITHM = os.environ.get('JWT_ALGORITHM', 'HS256')
JWT_EXPIRE_MINUTES = int(os.environ.get('JWT_EXPIRE_MINUTES', 60))

# Create the main app
app = FastAPI(title="Khairat Al Ardh Operations API", version="1.0.0")
api_router = APIRouter(prefix="/api")

# Enums
class EquipmentType(str, Enum):
    DT = "DT"  # Dump Truck
    PC = "PC"  # Excavator (Power Cabin)
    WL = "WL"  # Wheel Loader
    GR = "GR"  # Grader
    RL = "RL"  # Roller
    PLANT = "PLANT"  # Plant Equipment

class CostingCenterName(str, Enum):
    SCREENING = "SCREENING"
    CRUSHING = "CRUSHING"
    HAULING = "HAULING"
    FEEDING = "FEEDING"
    WASHING = "WASHING"
    OTHER = "OTHER"

class InvoiceType(str, Enum):
    SCREENING = "SCREENING"
    FEEDING = "FEEDING"
    CRUSHING = "CRUSHING"
    HAULING = "HAULING"

class ExpenseCategory(str, Enum):
    FUEL = "FUEL"
    MAINTENANCE = "MAINTENANCE"
    LABOR = "LABOR"
    MATERIALS = "MATERIALS"
    OTHER = "OTHER"

# Pydantic Models
class User(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    username: str
    email: str
    full_name: str
    is_active: bool = True
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class UserCreate(BaseModel):
    username: str
    email: str
    full_name: str
    password: str

class UserLogin(BaseModel):
    username: str
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str
    expires_in: int

class Equipment(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    type: EquipmentType
    model: str
    serial_number: Optional[str] = None
    hours_operated: float = 0.0
    maintenance_notes: Optional[str] = None
    is_active: bool = True
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class EquipmentCreate(BaseModel):
    name: str
    type: EquipmentType
    model: str
    serial_number: Optional[str] = None
    hours_operated: float = 0.0
    maintenance_notes: Optional[str] = None

class CostingCenter(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: CostingCenterName
    description: Optional[str] = None
    is_active: bool = True
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class CostingCenterCreate(BaseModel):
    name: CostingCenterName
    description: Optional[str] = None

class Production(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    date: datetime
    activity_type: CostingCenterName
    actual_qty: float
    contract_qty: float
    completion_rate: float = Field(default=0.0)
    equipment_ids: List[str] = []
    notes: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ProductionCreate(BaseModel):
    date: datetime
    activity_type: CostingCenterName
    actual_qty: float
    contract_qty: float
    equipment_ids: List[str] = []
    notes: Optional[str] = None

class Expense(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    date: datetime
    category: ExpenseCategory
    subcategory: Optional[str] = None
    amount: float
    description: str
    equipment_id: Optional[str] = None
    costing_center_id: Optional[str] = None
    receipt_number: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ExpenseCreate(BaseModel):
    date: datetime
    category: ExpenseCategory
    subcategory: Optional[str] = None
    amount: float
    description: str
    equipment_id: Optional[str] = None
    costing_center_id: Optional[str] = None
    receipt_number: Optional[str] = None

class Invoice(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    date: datetime
    invoice_number: str
    type: InvoiceType
    client_name: str
    amount: float
    quantity: Optional[float] = None
    unit_price: Optional[float] = None
    status: str = "PENDING"  # PENDING, PAID, CANCELLED
    notes: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class InvoiceCreate(BaseModel):
    date: datetime
    invoice_number: str
    type: InvoiceType
    client_name: str
    amount: float
    quantity: Optional[float] = None
    unit_price: Optional[float] = None
    status: str = "PENDING"
    notes: Optional[str] = None

class Attendance(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    employee_name: str
    date: datetime
    check_in: Optional[datetime] = None
    check_out: Optional[datetime] = None
    hours_worked: Optional[float] = None
    overtime_hours: Optional[float] = None
    notes: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class AttendanceCreate(BaseModel):
    employee_name: str
    date: datetime
    check_in: Optional[datetime] = None
    check_out: Optional[datetime] = None
    hours_worked: Optional[float] = None
    overtime_hours: Optional[float] = None
    notes: Optional[str] = None

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
        if username is None:
            raise HTTPException(status_code=401, detail="Invalid token")
        
        user_doc = await db.users.find_one({"username": username}, {"_id": 0})
        if user_doc is None:
            raise HTTPException(status_code=401, detail="User not found")
        
        # Convert datetime strings back to datetime objects
        if isinstance(user_doc.get('created_at'), str):
            user_doc['created_at'] = datetime.fromisoformat(user_doc['created_at'])
        
        return User(**user_doc)
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

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

# Authentication routes
@api_router.post("/register", response_model=User)
async def register_user(user_data: UserCreate):
    # Check if user exists
    existing_user = await db.users.find_one({"$or": [{"username": user_data.username}, {"email": user_data.email}]})
    if existing_user:
        raise HTTPException(status_code=400, detail="User already exists")
    
    # Create new user
    hashed_password = hash_password(user_data.password)
    user_dict = user_data.model_dump()
    del user_dict['password']
    
    user_obj = User(**user_dict)
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
    
    access_token = create_access_token(data={"sub": user_doc["username"]})
    return Token(
        access_token=access_token,
        token_type="bearer",
        expires_in=JWT_EXPIRE_MINUTES * 60
    )

@api_router.get("/me", response_model=User)
async def get_current_user_info(current_user: User = Depends(get_current_user)):
    return current_user

# Equipment routes
@api_router.post("/equipment", response_model=Equipment)
async def create_equipment(equipment_data: EquipmentCreate, current_user: User = Depends(get_current_user)):
    equipment_obj = Equipment(**equipment_data.model_dump())
    doc = equipment_obj.model_dump()
    serialize_datetime(doc)
    
    await db.equipment.insert_one(doc)
    return equipment_obj

@api_router.get("/equipment", response_model=List[Equipment])
async def get_equipment(current_user: User = Depends(get_current_user)):
    equipment_list = await db.equipment.find({"is_active": True}, {"_id": 0}).to_list(1000)
    
    for equipment in equipment_list:
        deserialize_datetime(equipment, ['created_at', 'updated_at'])
    
    return equipment_list

@api_router.get("/equipment/{equipment_id}", response_model=Equipment)
async def get_equipment_by_id(equipment_id: str, current_user: User = Depends(get_current_user)):
    equipment_doc = await db.equipment.find_one({"id": equipment_id}, {"_id": 0})
    if not equipment_doc:
        raise HTTPException(status_code=404, detail="Equipment not found")
    
    deserialize_datetime(equipment_doc, ['created_at', 'updated_at'])
    return Equipment(**equipment_doc)

@api_router.put("/equipment/{equipment_id}", response_model=Equipment)
async def update_equipment(equipment_id: str, equipment_data: EquipmentCreate, current_user: User = Depends(get_current_user)):
    update_doc = equipment_data.model_dump()
    update_doc['updated_at'] = datetime.now(timezone.utc)
    serialize_datetime(update_doc)
    
    result = await db.equipment.update_one({"id": equipment_id}, {"$set": update_doc})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Equipment not found")
    
    updated_doc = await db.equipment.find_one({"id": equipment_id}, {"_id": 0})
    deserialize_datetime(updated_doc, ['created_at', 'updated_at'])
    return Equipment(**updated_doc)

# Production routes
@api_router.post("/production", response_model=Production)
async def create_production(production_data: ProductionCreate, current_user: User = Depends(get_current_user)):
    production_dict = production_data.model_dump()
    # Calculate completion rate
    if production_dict['contract_qty'] > 0:
        production_dict['completion_rate'] = (production_dict['actual_qty'] / production_dict['contract_qty']) * 100
    
    production_obj = Production(**production_dict)
    doc = production_obj.model_dump()
    serialize_datetime(doc)
    
    await db.production.insert_one(doc)
    return production_obj

@api_router.get("/production", response_model=List[Production])
async def get_production(current_user: User = Depends(get_current_user)):
    production_list = await db.production.find({}, {"_id": 0}).sort("date", -1).to_list(1000)
    
    for production in production_list:
        deserialize_datetime(production, ['date', 'created_at', 'updated_at'])
    
    return production_list

# Expense routes
@api_router.post("/expenses", response_model=Expense)
async def create_expense(expense_data: ExpenseCreate, current_user: User = Depends(get_current_user)):
    expense_obj = Expense(**expense_data.model_dump())
    doc = expense_obj.model_dump()
    serialize_datetime(doc)
    
    await db.expenses.insert_one(doc)
    return expense_obj

@api_router.get("/expenses", response_model=List[Expense])
async def get_expenses(current_user: User = Depends(get_current_user)):
    expenses_list = await db.expenses.find({}, {"_id": 0}).sort("date", -1).to_list(1000)
    
    for expense in expenses_list:
        deserialize_datetime(expense, ['date', 'created_at', 'updated_at'])
    
    return expenses_list

# Invoice routes
@api_router.post("/invoices", response_model=Invoice)
async def create_invoice(invoice_data: InvoiceCreate, current_user: User = Depends(get_current_user)):
    invoice_obj = Invoice(**invoice_data.model_dump())
    doc = invoice_obj.model_dump()
    serialize_datetime(doc)
    
    await db.invoices.insert_one(doc)
    return invoice_obj

@api_router.get("/invoices", response_model=List[Invoice])
async def get_invoices(current_user: User = Depends(get_current_user)):
    invoices_list = await db.invoices.find({}, {"_id": 0}).sort("date", -1).to_list(1000)
    
    for invoice in invoices_list:
        deserialize_datetime(invoice, ['date', 'created_at', 'updated_at'])
    
    return invoices_list

# Costing Centers routes
@api_router.post("/costing-centers", response_model=CostingCenter)
async def create_costing_center(center_data: CostingCenterCreate, current_user: User = Depends(get_current_user)):
    # Check if costing center already exists
    existing_center = await db.costing_centers.find_one({"name": center_data.name})
    if existing_center:
        raise HTTPException(status_code=400, detail="Costing center already exists")
    
    center_obj = CostingCenter(**center_data.model_dump())
    doc = center_obj.model_dump()
    serialize_datetime(doc)
    
    await db.costing_centers.insert_one(doc)
    return center_obj

@api_router.get("/costing-centers", response_model=List[CostingCenter])
async def get_costing_centers(current_user: User = Depends(get_current_user)):
    centers_list = await db.costing_centers.find({"is_active": True}, {"_id": 0}).to_list(1000)
    
    for center in centers_list:
        deserialize_datetime(center, ['created_at'])
    
    return centers_list

# Attendance routes
@api_router.post("/attendance", response_model=Attendance)
async def create_attendance(attendance_data: AttendanceCreate, current_user: User = Depends(get_current_user)):
    attendance_obj = Attendance(**attendance_data.model_dump())
    doc = attendance_obj.model_dump()
    serialize_datetime(doc)
    
    await db.attendance.insert_one(doc)
    return attendance_obj

@api_router.get("/attendance", response_model=List[Attendance])
async def get_attendance(current_user: User = Depends(get_current_user)):
    attendance_list = await db.attendance.find({}, {"_id": 0}).sort("date", -1).to_list(1000)
    
    for attendance in attendance_list:
        deserialize_datetime(attendance, ['date', 'check_in', 'check_out', 'created_at', 'updated_at'])
    
    return attendance_list

# Dashboard Analytics routes
@api_router.get("/dashboard/stats")
async def get_dashboard_stats(current_user: User = Depends(get_current_user)):
    # Get current month statistics
    today = datetime.now(timezone.utc)
    month_start = today.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    
    # Production stats
    production_pipeline = [
        {"$match": {"date": {"$gte": month_start.isoformat()}}},
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
        {"$match": {"date": {"$gte": month_start.isoformat()}}},
        {"$group": {
            "_id": "$category",
            "total_amount": {"$sum": "$amount"},
            "count": {"$sum": 1}
        }}
    ]
    expense_stats = await db.expenses.aggregate(expense_pipeline).to_list(100)
    
    # Equipment count
    equipment_count = await db.equipment.count_documents({"is_active": True})
    
    # Invoice stats
    invoice_pipeline = [
        {"$match": {"date": {"$gte": month_start.isoformat()}}},
        {"$group": {
            "_id": "$status",
            "total_amount": {"$sum": "$amount"},
            "count": {"$sum": 1}
        }}
    ]
    invoice_stats = await db.invoices.aggregate(invoice_pipeline).to_list(100)
    
    return {
        "production": production_stats[0] if production_stats else {"total_actual": 0, "total_contract": 0, "avg_completion": 0},
        "expenses": expense_stats,
        "equipment_count": equipment_count,
        "invoices": invoice_stats,
        "month": month_start.strftime("%B %Y")
    }

# Health check
@api_router.get("/")
async def root():
    return {"message": "Khairat Al Ardh Operations API is running"}

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