"""
Seed script to create the complete organizational structure from the org chart
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

async def create_organizational_structure():
    """Create complete org structure with 8 main departments"""
    
    # Get company
    company = await db.companies.find_one({"name": "شركة خيرات الأرض للمحاجر"})
    if not company:
        print("❌ Company not found")
        return
    
    company_id = company['id']
    print(f"✅ Found company: {company['name']}")
    
    # Clear existing departments
    await db.departments.delete_many({"company_id": company_id})
    await db.positions.delete_many({"company_id": company_id})
    print("🗑️  Cleared existing org structure")
    
    # Main departments with sub-departments
    departments_structure = [
        {
            "name": "Marketing",
            "name_ar": "التسويق",
            "code": "MKT",
            "level": 1,
            "sub_departments": [
                {"name": "Planning & Development", "name_ar": "التخطيط والتطوير", "code": "MKT-PLAN"},
                {"name": "Design & Advertising", "name_ar": "التصميم والدعاية", "code": "MKT-DES"},
                {"name": "After-Sales Services", "name_ar": "خدمات ما بعد البيع", "code": "MKT-AFS"},
                {"name": "Public Relations", "name_ar": "العلاقات العامة", "code": "MKT-PR"},
            ]
        },
        {
            "name": "Sales",
            "name_ar": "المبيعات",
            "code": "SLS",
            "level": 1,
            "sub_departments": [
                {"name": "Sales Department Head", "name_ar": "رئيس قسم المبيعات", "code": "SLS-HEAD"},
                {"name": "Sales Staff", "name_ar": "موظفي المبيعات", "code": "SLS-STAFF"},
                {"name": "Sales Representatives", "name_ar": "مندوب المبيعات", "code": "SLS-REP"},
            ]
        },
        {
            "name": "Legal Affairs",
            "name_ar": "الشؤون القانونية",
            "code": "LEG",
            "level": 1,
            "sub_departments": [
                {"name": "Legal Auditor", "name_ar": "المدقق القانوني", "code": "LEG-AUD"},
                {"name": "Claims Management", "name_ar": "ادارة التعاقدات", "code": "LEG-CLM"},
                {"name": "Lawyers", "name_ar": "المحامين", "code": "LEG-LAW"},
                {"name": "Legal Follow-up", "name_ar": "المعقب القانوني", "code": "LEG-FLW"},
            ]
        },
        {
            "name": "Operations",
            "name_ar": "العمليات",
            "code": "OPS",
            "level": 1,
            "sub_departments": [
                {"name": "Operations Manager", "name_ar": "مدير العمليات والحركة", "code": "OPS-MGR"},
                {"name": "Shipping & Logistics", "name_ar": "الشحن واللوجستية", "code": "OPS-LOG"},
                {"name": "Clearance & Shipping", "name_ar": "موظف تخليص وشحن", "code": "OPS-CLR"},
                {"name": "Drivers", "name_ar": "السائقين", "code": "OPS-DRV"},
            ]
        },
        {
            "name": "Procurement",
            "name_ar": "المشتريات",
            "code": "PRC",
            "level": 1,
            "sub_departments": [
                {"name": "Procurement Head", "name_ar": "رئيس قسم المشتريات", "code": "PRC-HEAD"},
                {"name": "Supplies Officer", "name_ar": "مسؤول اللوازم", "code": "PRC-SUP"},
                {"name": "Warehouse Keeper", "name_ar": "أمين المستودعات", "code": "PRC-WH"},
                {"name": "Procurement Staff", "name_ar": "موظف مشتريات", "code": "PRC-STAFF"},
            ]
        },
        {
            "name": "Human Resources",
            "name_ar": "الموارد البشرية",
            "code": "HR",
            "level": 1,
            "sub_departments": [
                {"name": "HR Manager", "name_ar": "مدير الموارد البشرية", "code": "HR-MGR"},
                {"name": "Employee Affairs", "name_ar": "شؤون العاملين", "code": "HR-EMP"},
                {"name": "Administrative Development", "name_ar": "التطوير الاداري", "code": "HR-DEV"},
            ]
        },
        {
            "name": "Finance",
            "name_ar": "المالية",
            "code": "FIN",
            "level": 1,
            "sub_departments": [
                {"name": "Financial Auditor", "name_ar": "المدقق المالي", "code": "FIN-AUD"},
                {"name": "Finance Manager", "name_ar": "المدير المالي", "code": "FIN-MGR"},
                {"name": "Accountants", "name_ar": "المحاسبين", "code": "FIN-ACC"},
                {"name": "Treasury", "name_ar": "أمين الصندوق", "code": "FIN-TRE"},
                {"name": "Collection & Follow-up", "name_ar": "التحصيل والمتابعة", "code": "FIN-COL"},
            ]
        },
        {
            "name": "Manufacturing",
            "name_ar": "المصنع",
            "code": "MFG",
            "level": 1,
            "sub_departments": [
                {"name": "Production Manager", "name_ar": "مدير المصنع", "code": "MFG-MGR"},
                {"name": "Engineering Supervision", "name_ar": "الاشراف الهندسي", "code": "MFG-ENG"},
                {"name": "Safety & Health", "name_ar": "السلامة العامة", "code": "MFG-SFT"},
                {"name": "Quality Control", "name_ar": "ضبط الجودة", "code": "MFG-QC"},
                {"name": "Maintenance", "name_ar": "الصيانة", "code": "MFG-MNT"},
                {"name": "Attendance Supervisors", "name_ar": "مراقب الدوام", "code": "MFG-ATT"},
                {"name": "Production Staff", "name_ar": "موظفي الانتاج", "code": "MFG-PROD"},
            ]
        },
    ]
    
    # Add IT Department
    it_dept = {
        "name": "IT & Technical Support",
        "name_ar": "الدعم الفني والتقني",
        "code": "IT",
        "level": 1,
        "sub_departments": [
            {"name": "IT Security", "name_ar": "أمن المعلومات", "code": "IT-SEC"},
            {"name": "Equipment Maintenance", "name_ar": "صيانة الاجهزة", "code": "IT-MNT"},
            {"name": "Software Development", "name_ar": "تطوير البرمجيات", "code": "IT-DEV"},
        ]
    }
    departments_structure.append(it_dept)
    
    dept_count = 0
    subdept_count = 0
    
    # Create departments
    for dept_data in departments_structure:
        dept_id = str(uuid.uuid4())
        
        department = {
            "id": dept_id,
            "company_id": company_id,
            "name": dept_data["name"],
            "name_ar": dept_data["name_ar"],
            "code": dept_data["code"],
            "parent_department_id": None,
            "level": 1,
            "is_active": True,
            "employee_count": 0,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        }
        
        await db.departments.insert_one(department)
        dept_count += 1
        print(f"✅ Created department: {department['name_ar']}")
        
        # Create sub-departments
        for sub_dept_data in dept_data.get("sub_departments", []):
            sub_dept_id = str(uuid.uuid4())
            
            sub_department = {
                "id": sub_dept_id,
                "company_id": company_id,
                "name": sub_dept_data["name"],
                "name_ar": sub_dept_data["name_ar"],
                "code": sub_dept_data["code"],
                "parent_department_id": dept_id,
                "level": 2,
                "is_active": True,
                "employee_count": 0,
                "created_at": datetime.now(timezone.utc).isoformat(),
                "updated_at": datetime.now(timezone.utc).isoformat()
            }
            
            await db.departments.insert_one(sub_department)
            subdept_count += 1
    
    print("\n" + "="*60)
    print("🎉 ORGANIZATIONAL STRUCTURE CREATED!")
    print("="*60)
    print(f"📊 Main Departments: {dept_count}")
    print(f"📋 Sub-Departments: {subdept_count}")
    print(f"📈 Total: {dept_count + subdept_count} departments")
    print("\n💼 Departments:")
    print("   1. التسويق (Marketing)")
    print("   2. المبيعات (Sales)")
    print("   3. الشؤون القانونية (Legal Affairs)")
    print("   4. العمليات (Operations)")
    print("   5. المشتريات (Procurement)")
    print("   6. الموارد البشرية (Human Resources)")
    print("   7. المالية (Finance)")
    print("   8. المصنع (Manufacturing)")
    print("   9. الدعم الفني والتقني (IT & Technical Support)")
    print("="*60)

if __name__ == "__main__":
    asyncio.run(create_organizational_structure())
