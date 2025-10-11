"""
Seed script to create users with different roles for RBAC testing
"""
import asyncio
import os
from motor.motor_asyncio import AsyncIOMotorClient
from passlib.context import CryptContext
from datetime import datetime, timezone
import uuid
from dotenv import load_dotenv
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

async def create_test_users():
    """Create test users with different roles"""
    
    # Create a test company first
    company_id = str(uuid.uuid4())
    company = {
        "id": company_id,
        "name": "شركة خيرات الأرض للمحاجر",
        "name_en": "Khairat Al Ardh Quarries Company",
        "commercial_register": "1234567890",
        "tax_number": "300123456789003",
        "phone": "+966501234567",
        "email": "info@khairat.com",
        "address": "الرياض، المملكة العربية السعودية",
        "city": "الرياض",
        "country": "Saudi Arabia",
        "status": "ACTIVE",
        "subscription_plan": "enterprise",
        "max_users": 50,
        "max_equipment": 100,
        "features": ["equipment", "production", "expenses", "invoices", "attendance"],
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    
    # Check if company exists
    existing_company = await db.companies.find_one({"name": company["name"]})
    if not existing_company:
        await db.companies.insert_one(company)
        print(f"✅ Created company: {company['name']}")
    else:
        company_id = existing_company['id']
        print(f"ℹ️  Company already exists: {company['name']}")
    
    # Define test users with different roles
    test_users = [
        {
            "username": "owner_ali",
            "email": "owner@khairat.com",
            "full_name": "علي المالك",
            "password": "password123",
            "role": "owner",
            "employee_id": "EMP-001",
            "department": "Management",
        },
        {
            "username": "manager_mohammad",
            "email": "manager@khairat.com",
            "full_name": "محمد المدير",
            "password": "password123",
            "role": "manager",
            "employee_id": "EMP-002",
            "department": "Operations",
        },
        {
            "username": "accountant_fatima",
            "email": "accountant@khairat.com",
            "full_name": "فاطمة المحاسبة",
            "password": "password123",
            "role": "accountant",
            "employee_id": "EMP-003",
            "department": "Finance",
        },
        {
            "username": "foreman_ahmed",
            "email": "foreman@khairat.com",
            "full_name": "أحمد المشرف",
            "password": "password123",
            "role": "foreman",
            "employee_id": "EMP-004",
            "department": "Production",
        },
        {
            "username": "driver_khalid",
            "email": "driver@khairat.com",
            "full_name": "خالد السائق",
            "password": "password123",
            "role": "driver",
            "employee_id": "EMP-005",
            "department": "Transport",
        },
        {
            "username": "guard_omar",
            "email": "guard@khairat.com",
            "full_name": "عمر الحارس",
            "password": "password123",
            "role": "guard",
            "employee_id": "EMP-006",
            "department": "Security",
        },
    ]
    
    created_count = 0
    for user_data in test_users:
        # Check if user exists
        existing_user = await db.users.find_one({"username": user_data["username"]})
        if existing_user:
            print(f"⚠️  User already exists: {user_data['username']} ({user_data['full_name']})")
            continue
        
        # Create user
        user = {
            "id": str(uuid.uuid4()),
            "username": user_data["username"],
            "email": user_data["email"],
            "full_name": user_data["full_name"],
            "hashed_password": pwd_context.hash(user_data["password"]),
            "company_id": company_id,
            "companies": [company_id],
            "role": user_data["role"],
            "is_active": True,
            "phone": None,
            "department": user_data.get("department"),
            "employee_id": user_data.get("employee_id"),
            "avatar_url": None,
            "last_login": None,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        
        await db.users.insert_one(user)
        created_count += 1
        print(f"✅ Created user: {user['username']} ({user['full_name']}) - Role: {user['role']}")
    
    print(f"\n🎉 Successfully created {created_count} test users!")
    print(f"\nTest credentials (all passwords: password123):")
    print("=" * 60)
    for user_data in test_users:
        print(f"  👤 {user_data['role'].upper():12} | {user_data['username']:20} | {user_data['full_name']}")
    print("=" * 60)
    print(f"\n🏢 Company: {company['name']}")
    print(f"🆔 Company ID: {company_id}")

if __name__ == "__main__":
    asyncio.run(create_test_users())
