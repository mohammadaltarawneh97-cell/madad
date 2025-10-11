"""
Seed script to create a second company for testing multi-company switching
"""
import asyncio
import os
from motor.motor_asyncio import AsyncIOMotorClient
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

async def create_second_company():
    """Create a second test company and link owner to it"""
    
    # Create second company
    company_id = str(uuid.uuid4())
    company = {
        "id": company_id,
        "name": "شركة الأردن للمواد الإنشائية",
        "name_en": "Jordan Construction Materials Company",
        "commercial_register": "9876543210",
        "tax_number": "300987654321003",
        "phone": "+962791234567",
        "email": "info@jordan-construction.com",
        "address": "عمان، المملكة الأردنية الهاشمية",
        "city": "عمان",
        "country": "Jordan",
        "status": "ACTIVE",
        "subscription_plan": "professional",
        "max_users": 30,
        "max_equipment": 50,
        "features": ["equipment", "production", "expenses", "invoices", "attendance"],
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    
    # Check if company exists
    existing_company = await db.companies.find_one({"name": company["name"]})
    if existing_company:
        print(f"ℹ️  Company already exists: {company['name']}")
        company_id = existing_company['id']
    else:
        await db.companies.insert_one(company)
        print(f"✅ Created company: {company['name']}")
    
    # Update owner_ali to have access to both companies
    owner = await db.users.find_one({"username": "owner_ali"})
    if owner:
        # Get first company ID
        first_company = await db.companies.find_one({"name": "شركة خيرات الأرض للمحاجر"})
        
        if first_company:
            companies_list = [first_company['id'], company_id]
            await db.users.update_one(
                {"username": "owner_ali"},
                {"$set": {"companies": companies_list}}
            )
            print(f"✅ Updated owner_ali with access to both companies")
        else:
            print("⚠️  First company not found")
    else:
        print("⚠️  owner_ali not found")
    
    # Add some sample equipment for the second company
    equipment_id = str(uuid.uuid4())
    equipment = {
        "id": equipment_id,
        "company_id": company_id,
        "name": "Caterpillar D8T Bulldozer",
        "name_ar": "جرافة كاتربيلر D8T",
        "type": "Bulldozer",
        "model": "D8T",
        "manufacturer": "Caterpillar",
        "serial_number": "CAT-D8T-2024-001",
        "status": "active",
        "purchase_date": datetime(2024, 1, 15, tzinfo=timezone.utc).isoformat(),
        "purchase_price": 450000.0,
        "current_value": 420000.0,
        "hours_operated": 250.0,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    
    existing_equipment = await db.equipment.find_one({"serial_number": equipment["serial_number"]})
    if not existing_equipment:
        await db.equipment.insert_one(equipment)
        print(f"✅ Created equipment: {equipment['name']}")
    
    print("\n" + "="*60)
    print("🎉 SECOND COMPANY CREATED SUCCESSFULLY!")
    print("="*60)
    print(f"📊 Company: {company['name']}")
    print(f"📍 Location: {company['city']}")
    print(f"🆔 Company ID: {company_id}")
    print(f"\n👤 owner_ali now has access to 2 companies:")
    print(f"   1. شركة خيرات الأرض للمحاجر")
    print(f"   2. {company['name']}")
    print("\n💡 Login as owner_ali to see the company switcher button!")
    print("="*60)

if __name__ == "__main__":
    asyncio.run(create_second_company())
