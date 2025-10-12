import asyncio
import os
from motor.motor_asyncio import AsyncIOMotorClient
from passlib.context import CryptContext
from datetime import datetime, timezone
import uuid

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# MongoDB connection
MONGO_URL = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
client = AsyncIOMotorClient(MONGO_URL)
db = client.silca_operations

async def seed_org_structure_users():
    """
    Seed users matching the complete organizational structure from the org chart.
    All users will belong to the main Silca company.
    """
    
    # Get the main company
    company = await db.companies.find_one({"name": {"$regex": "silca", "$options": "i"}})
    if not company:
        print("❌ No company found. Please run seed_rbac_users.py first to create the company.")
        return
    
    company_id = company['id']
    hashed_password = pwd_context.hash("password123")
    
    # Define all users based on organizational chart
    org_users = [
        # === EXECUTIVE LEVEL ===
        {
            "id": str(uuid.uuid4()),
            "username": "chairman_board",
            "email": "chairman@silca.com",
            "hashed_password": hashed_password,
            "company_id": company_id,
            "role": "owner",
            "full_name": "Ali Al-Tarawneh",
            "full_name_ar": "علي الطراونه",
            "phone": "+962-79-1234567",
            "is_active": True,
            "created_at": datetime.now(timezone.utc),
            "permissions": []
        },
        {
            "id": str(uuid.uuid4()),
            "username": "deputy_chairman",
            "email": "deputy.chairman@silca.com",
            "hashed_password": hashed_password,
            "company_id": company_id,
            "role": "owner",
            "full_name": "Mohammad Al-Tarawneh",
            "full_name_ar": "محمد الطراونه",
            "phone": "+962-79-1234568",
            "is_active": True,
            "created_at": datetime.now(timezone.utc),
            "permissions": []
        },
        {
            "id": str(uuid.uuid4()),
            "username": "general_manager",
            "email": "gm@silca.com",
            "hashed_password": hashed_password,
            "company_id": company_id,
            "role": "manager",
            "full_name": "Sara Al-Hassan",
            "full_name_ar": "سارة الحسن",
            "phone": "+962-79-2345678",
            "is_active": True,
            "created_at": datetime.now(timezone.utc),
            "permissions": []
        },
        
        # === MARKETING DEPARTMENT (التسويق) ===
        {
            "id": str(uuid.uuid4()),
            "username": "marketing_head",
            "email": "marketing.head@silca.com",
            "hashed_password": hashed_password,
            "company_id": company_id,
            "role": "manager",
            "full_name": "Layla Ibrahim",
            "full_name_ar": "ليلى إبراهيم",
            "phone": "+962-79-3456789",
            "department": "التسويق",
            "is_active": True,
            "created_at": datetime.now(timezone.utc),
            "permissions": []
        },
        {
            "id": str(uuid.uuid4()),
            "username": "planning_dev",
            "email": "planning.dev@silca.com",
            "hashed_password": hashed_password,
            "company_id": company_id,
            "role": "manager",
            "full_name": "Ahmad Saleh",
            "full_name_ar": "أحمد صالح",
            "phone": "+962-79-3456790",
            "department": "التسويق - التخطيط والتطوير",
            "is_active": True,
            "created_at": datetime.now(timezone.utc),
            "permissions": []
        },
        {
            "id": str(uuid.uuid4()),
            "username": "design_advertising",
            "email": "design.ads@silca.com",
            "hashed_password": hashed_password,
            "company_id": company_id,
            "role": "manager",
            "full_name": "Noor Khalil",
            "full_name_ar": "نور خليل",
            "phone": "+962-79-3456791",
            "department": "التسويق - التصميم والدعاية",
            "is_active": True,
            "created_at": datetime.now(timezone.utc),
            "permissions": []
        },
        
        # === SALES DEPARTMENT (المبيعات) ===
        {
            "id": str(uuid.uuid4()),
            "username": "sales_head",
            "email": "sales.head@silca.com",
            "hashed_password": hashed_password,
            "company_id": company_id,
            "role": "manager",
            "full_name": "Khaled Yousef",
            "full_name_ar": "خالد يوسف",
            "phone": "+962-79-4567890",
            "department": "المبيعات",
            "is_active": True,
            "created_at": datetime.now(timezone.utc),
            "permissions": []
        },
        {
            "id": str(uuid.uuid4()),
            "username": "sales_staff1",
            "email": "sales1@silca.com",
            "hashed_password": hashed_password,
            "company_id": company_id,
            "role": "foreman",
            "full_name": "Fatima Nasser",
            "full_name_ar": "فاطمة ناصر",
            "phone": "+962-79-4567891",
            "department": "المبيعات",
            "is_active": True,
            "created_at": datetime.now(timezone.utc),
            "permissions": []
        },
        {
            "id": str(uuid.uuid4()),
            "username": "customer_service",
            "email": "customer.service@silca.com",
            "hashed_password": hashed_password,
            "company_id": company_id,
            "role": "foreman",
            "full_name": "Rania Omar",
            "full_name_ar": "رانيا عمر",
            "phone": "+962-79-4567892",
            "department": "المبيعات - خدمة العملاء",
            "is_active": True,
            "created_at": datetime.now(timezone.utc),
            "permissions": []
        },
        {
            "id": str(uuid.uuid4()),
            "username": "sales_rep1",
            "email": "salesrep1@silca.com",
            "hashed_password": hashed_password,
            "company_id": company_id,
            "role": "driver",
            "full_name": "Tariq Ali",
            "full_name_ar": "طارق علي",
            "phone": "+962-79-4567893",
            "department": "المبيعات - مندوبي المبيعات",
            "is_active": True,
            "created_at": datetime.now(timezone.utc),
            "permissions": []
        },
        
        # === LEGAL AFFAIRS (الشؤون القانونية) ===
        {
            "id": str(uuid.uuid4()),
            "username": "legal_auditor",
            "email": "legal.auditor@silca.com",
            "hashed_password": hashed_password,
            "company_id": company_id,
            "role": "manager",
            "full_name": "Marwan Jaber",
            "full_name_ar": "مروان جابر",
            "phone": "+962-79-5678901",
            "department": "الشؤون القانونية",
            "is_active": True,
            "created_at": datetime.now(timezone.utc),
            "permissions": []
        },
        {
            "id": str(uuid.uuid4()),
            "username": "contracts_manager",
            "email": "contracts@silca.com",
            "hashed_password": hashed_password,
            "company_id": company_id,
            "role": "accountant",
            "full_name": "Yasmin Haddad",
            "full_name_ar": "ياسمين حداد",
            "phone": "+962-79-5678902",
            "department": "الشؤون القانونية - التعاقدات",
            "is_active": True,
            "created_at": datetime.now(timezone.utc),
            "permissions": []
        },
        {
            "id": str(uuid.uuid4()),
            "username": "lawyer1",
            "email": "lawyer1@silca.com",
            "hashed_password": hashed_password,
            "company_id": company_id,
            "role": "accountant",
            "full_name": "Sami Mahmoud",
            "full_name_ar": "سامي محمود",
            "phone": "+962-79-5678903",
            "department": "الشؤون القانونية - المحامين",
            "is_active": True,
            "created_at": datetime.now(timezone.utc),
            "permissions": []
        },
        
        # === OPERATIONS (العمليات) ===
        {
            "id": str(uuid.uuid4()),
            "username": "operations_manager",
            "email": "operations@silca.com",
            "hashed_password": hashed_password,
            "company_id": company_id,
            "role": "manager",
            "full_name": "Hassan Khalil",
            "full_name_ar": "حسان خليل",
            "phone": "+962-79-6789012",
            "department": "العمليات",
            "is_active": True,
            "created_at": datetime.now(timezone.utc),
            "permissions": []
        },
        {
            "id": str(uuid.uuid4()),
            "username": "logistics_manager",
            "email": "logistics@silca.com",
            "hashed_password": hashed_password,
            "company_id": company_id,
            "role": "foreman",
            "full_name": "Jamal Said",
            "full_name_ar": "جمال سعيد",
            "phone": "+962-79-6789013",
            "department": "العمليات - الشحن واللوجستية",
            "is_active": True,
            "created_at": datetime.now(timezone.utc),
            "permissions": []
        },
        {
            "id": str(uuid.uuid4()),
            "username": "driver1",
            "email": "driver1@silca.com",
            "hashed_password": hashed_password,
            "company_id": company_id,
            "role": "driver",
            "full_name": "Khaled Hussein",
            "full_name_ar": "خالد حسين",
            "phone": "+962-79-6789014",
            "department": "العمليات - السائقين",
            "is_active": True,
            "created_at": datetime.now(timezone.utc),
            "permissions": []
        },
        {
            "id": str(uuid.uuid4()),
            "username": "driver2",
            "email": "driver2@silca.com",
            "hashed_password": hashed_password,
            "company_id": company_id,
            "role": "driver",
            "full_name": "Ibrahim Majid",
            "full_name_ar": "إبراهيم ماجد",
            "phone": "+962-79-6789015",
            "department": "العمليات - السائقين",
            "is_active": True,
            "created_at": datetime.now(timezone.utc),
            "permissions": []
        },
        
        # === PROCUREMENT (المشتريات) ===
        {
            "id": str(uuid.uuid4()),
            "username": "procurement_head",
            "email": "procurement@silca.com",
            "hashed_password": hashed_password,
            "company_id": company_id,
            "role": "manager",
            "full_name": "Nabil Tamimi",
            "full_name_ar": "نبيل تميمي",
            "phone": "+962-79-7890123",
            "department": "المشتريات",
            "is_active": True,
            "created_at": datetime.now(timezone.utc),
            "permissions": []
        },
        {
            "id": str(uuid.uuid4()),
            "username": "supplies_officer",
            "email": "supplies@silca.com",
            "hashed_password": hashed_password,
            "company_id": company_id,
            "role": "foreman",
            "full_name": "Huda Mansour",
            "full_name_ar": "هدى منصور",
            "phone": "+962-79-7890124",
            "department": "المشتريات - اللوازم",
            "is_active": True,
            "created_at": datetime.now(timezone.utc),
            "permissions": []
        },
        {
            "id": str(uuid.uuid4()),
            "username": "warehouse_keeper1",
            "email": "warehouse1@silca.com",
            "hashed_password": hashed_password,
            "company_id": company_id,
            "role": "foreman",
            "full_name": "Fadi Qasem",
            "full_name_ar": "فادي قاسم",
            "phone": "+962-79-7890125",
            "department": "المشتريات - أمناء المستودعات",
            "is_active": True,
            "created_at": datetime.now(timezone.utc),
            "permissions": []
        },
        
        # === HUMAN RESOURCES (الموارد البشرية) ===
        {
            "id": str(uuid.uuid4()),
            "username": "hr_manager",
            "email": "hr@silca.com",
            "hashed_password": hashed_password,
            "company_id": company_id,
            "role": "manager",
            "full_name": "Rana Khoury",
            "full_name_ar": "رنا خوري",
            "phone": "+962-79-8901234",
            "department": "الموارد البشرية",
            "is_active": True,
            "created_at": datetime.now(timezone.utc),
            "permissions": []
        },
        {
            "id": str(uuid.uuid4()),
            "username": "employee_affairs",
            "email": "employee.affairs@silca.com",
            "hashed_password": hashed_password,
            "company_id": company_id,
            "role": "accountant",
            "full_name": "Dina Majali",
            "full_name_ar": "دينا المجالي",
            "phone": "+962-79-8901235",
            "department": "الموارد البشرية - شؤون العاملين",
            "is_active": True,
            "created_at": datetime.now(timezone.utc),
            "permissions": []
        },
        
        # === FINANCE (المالية) ===
        {
            "id": str(uuid.uuid4()),
            "username": "financial_auditor",
            "email": "financial.auditor@silca.com",
            "hashed_password": hashed_password,
            "company_id": company_id,
            "role": "accountant",
            "full_name": "Omer Rashid",
            "full_name_ar": "عمر راشد",
            "phone": "+962-79-9012345",
            "department": "المالية - المدقق المالي",
            "is_active": True,
            "created_at": datetime.now(timezone.utc),
            "permissions": []
        },
        {
            "id": str(uuid.uuid4()),
            "username": "finance_manager",
            "email": "finance@silca.com",
            "hashed_password": hashed_password,
            "company_id": company_id,
            "role": "accountant",
            "full_name": "Hana Shawkat",
            "full_name_ar": "هناء شوكت",
            "phone": "+962-79-9012346",
            "department": "المالية - المدير المالي",
            "is_active": True,
            "created_at": datetime.now(timezone.utc),
            "permissions": []
        },
        {
            "id": str(uuid.uuid4()),
            "username": "accountant1",
            "email": "accountant1@silca.com",
            "hashed_password": hashed_password,
            "company_id": company_id,
            "role": "accountant",
            "full_name": "Wael Habib",
            "full_name_ar": "وائل حبيب",
            "phone": "+962-79-9012347",
            "department": "المالية - المحاسبين",
            "is_active": True,
            "created_at": datetime.now(timezone.utc),
            "permissions": []
        },
        {
            "id": str(uuid.uuid4()),
            "username": "treasurer",
            "email": "treasurer@silca.com",
            "hashed_password": hashed_password,
            "company_id": company_id,
            "role": "accountant",
            "full_name": "Lina Badran",
            "full_name_ar": "لينا بدران",
            "phone": "+962-79-9012348",
            "department": "المالية - أمين الصندوق",
            "is_active": True,
            "created_at": datetime.now(timezone.utc),
            "permissions": []
        },
        
        # === MANUFACTURING/FACTORY (المصنع) ===
        {
            "id": str(uuid.uuid4()),
            "username": "factory_manager",
            "email": "factory@silca.com",
            "hashed_password": hashed_password,
            "company_id": company_id,
            "role": "foreman",
            "full_name": "Bassam Zuhair",
            "full_name_ar": "بسام زهير",
            "phone": "+962-79-0123456",
            "department": "المصنع",
            "is_active": True,
            "created_at": datetime.now(timezone.utc),
            "permissions": []
        },
        {
            "id": str(uuid.uuid4()),
            "username": "engineering_supervisor",
            "email": "engineering@silca.com",
            "hashed_password": hashed_password,
            "company_id": company_id,
            "role": "foreman",
            "full_name": "Kamal Adnan",
            "full_name_ar": "كمال عدنان",
            "phone": "+962-79-0123457",
            "department": "المصنع - الإشراف الهندسي",
            "is_active": True,
            "created_at": datetime.now(timezone.utc),
            "permissions": []
        },
        {
            "id": str(uuid.uuid4()),
            "username": "safety_officer",
            "email": "safety@silca.com",
            "hashed_password": hashed_password,
            "company_id": company_id,
            "role": "foreman",
            "full_name": "Ziad Fawzi",
            "full_name_ar": "زياد فوزي",
            "phone": "+962-79-0123458",
            "department": "المصنع - السلامة العامة",
            "is_active": True,
            "created_at": datetime.now(timezone.utc),
            "permissions": []
        },
        {
            "id": str(uuid.uuid4()),
            "username": "quality_control",
            "email": "quality@silca.com",
            "hashed_password": hashed_password,
            "company_id": company_id,
            "role": "foreman",
            "full_name": "Reem Nabil",
            "full_name_ar": "ريم نبيل",
            "phone": "+962-79-0123459",
            "department": "المصنع - ضبط الجودة",
            "is_active": True,
            "created_at": datetime.now(timezone.utc),
            "permissions": []
        },
        {
            "id": str(uuid.uuid4()),
            "username": "maintenance_tech",
            "email": "maintenance@silca.com",
            "hashed_password": hashed_password,
            "company_id": company_id,
            "role": "foreman",
            "full_name": "Tamer Daoud",
            "full_name_ar": "تامر داوود",
            "phone": "+962-79-0123460",
            "department": "المصنع - الصيانة",
            "is_active": True,
            "created_at": datetime.now(timezone.utc),
            "permissions": []
        },
        {
            "id": str(uuid.uuid4()),
            "username": "production_worker1",
            "email": "worker1@silca.com",
            "hashed_password": hashed_password,
            "company_id": company_id,
            "role": "driver",
            "full_name": "Saleh Amin",
            "full_name_ar": "صالح أمين",
            "phone": "+962-79-0123461",
            "department": "المصنع - موظفي الإنتاج",
            "is_active": True,
            "created_at": datetime.now(timezone.utc),
            "permissions": []
        },
        {
            "id": str(uuid.uuid4()),
            "username": "production_worker2",
            "email": "worker2@silca.com",
            "hashed_password": hashed_password,
            "company_id": company_id,
            "role": "driver",
            "full_name": "Mustafa Jamil",
            "full_name_ar": "مصطفى جميل",
            "phone": "+962-79-0123462",
            "department": "المصنع - موظفي الإنتاج",
            "is_active": True,
            "created_at": datetime.now(timezone.utc),
            "permissions": []
        },
        
        # === SERVICES & SUPPORT (قسم الخدمات والدعم) ===
        {
            "id": str(uuid.uuid4()),
            "username": "security_guard1",
            "email": "guard1@silca.com",
            "hashed_password": hashed_password,
            "company_id": company_id,
            "role": "guard",
            "full_name": "Omar Khalid",
            "full_name_ar": "عمر خالد",
            "phone": "+962-79-1122334",
            "department": "قسم الخدمات - حراس الأمن",
            "is_active": True,
            "created_at": datetime.now(timezone.utc),
            "permissions": []
        },
        {
            "id": str(uuid.uuid4()),
            "username": "security_guard2",
            "email": "guard2@silca.com",
            "hashed_password": hashed_password,
            "company_id": company_id,
            "role": "guard",
            "full_name": "Adel Fares",
            "full_name_ar": "عادل فارس",
            "phone": "+962-79-1122335",
            "department": "قسم الخدمات - حراس الأمن",
            "is_active": True,
            "created_at": datetime.now(timezone.utc),
            "permissions": []
        },
        {
            "id": str(uuid.uuid4()),
            "username": "it_security",
            "email": "it.security@silca.com",
            "hashed_password": hashed_password,
            "company_id": company_id,
            "role": "manager",
            "full_name": "Rami Khalaf",
            "full_name_ar": "رامي خلف",
            "phone": "+962-79-2233445",
            "department": "الدعم الفني - أمن المعلومات",
            "is_active": True,
            "created_at": datetime.now(timezone.utc),
            "permissions": []
        },
        {
            "id": str(uuid.uuid4()),
            "username": "software_dev",
            "email": "dev@silca.com",
            "hashed_password": hashed_password,
            "company_id": company_id,
            "role": "manager",
            "full_name": "Nadia Jabr",
            "full_name_ar": "نادية جبر",
            "phone": "+962-79-2233446",
            "department": "الدعم الفني - تطوير البرمجيات",
            "is_active": True,
            "created_at": datetime.now(timezone.utc),
            "permissions": []
        },
    ]
    
    # Insert all users
    inserted_count = 0
    updated_count = 0
    
    for user in org_users:
        # Check if user already exists
        existing = await db.users.find_one({"email": user["email"]})
        
        if existing:
            # Update existing user
            await db.users.update_one(
                {"email": user["email"]},
                {"$set": user}
            )
            updated_count += 1
            print(f"✅ Updated: {user['full_name_ar']} ({user['email']}) - Role: {user['role']}")
        else:
            # Insert new user
            await db.users.insert_one(user)
            inserted_count += 1
            print(f"✨ Created: {user['full_name_ar']} ({user['email']}) - Role: {user['role']}")
    
    print(f"\n{'='*80}")
    print(f"🎉 Organizational Structure Seeding Complete!")
    print(f"{'='*80}")
    print(f"✨ New users created: {inserted_count}")
    print(f"♻️  Existing users updated: {updated_count}")
    print(f"📊 Total users in org structure: {len(org_users)}")
    print(f"\n🔑 All users have password: password123")
    print(f"🏢 All users belong to company: {company['name']}")
    print(f"\n📋 Department Breakdown:")
    
    departments = {}
    for user in org_users:
        dept = user.get('department', 'Executive')
        departments[dept] = departments.get(dept, 0) + 1
    
    for dept, count in sorted(departments.items()):
        print(f"   • {dept}: {count} user(s)")

if __name__ == "__main__":
    print("🚀 Starting Organizational Structure User Seeding...")
    asyncio.run(seed_org_structure_users())
    print("\n✅ Seeding complete! You can now login with any of the created users.")
