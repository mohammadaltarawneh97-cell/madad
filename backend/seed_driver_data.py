"""
Seed script to create employee profile, salary, and vehicle data for driver_khalid
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

async def seed_driver_data():
    """Create employee profile, salary payments, and vehicle for driver"""
    
    # Get company and driver user
    company = await db.companies.find_one({"name": "شركة خيرات الأرض للمحاجر"})
    driver_user = await db.users.find_one({"username": "driver_khalid"})
    
    if not company or not driver_user:
        print("❌ Company or driver user not found")
        return
    
    company_id = company['id']
    driver_id = driver_user['id']
    
    # Get Operations department
    ops_dept = await db.departments.find_one({"code": "OPS-DRV", "company_id": company_id})
    if not ops_dept:
        ops_dept = await db.departments.find_one({"code": "OPS", "company_id": company_id})
    
    if not ops_dept:
        print("❌ Operations department not found")
        return
    
    # Create Employee Profile for driver
    employee_id = str(uuid.uuid4())
    employee = {
        "id": employee_id,
        "company_id": company_id,
        "user_id": driver_id,
        "employee_number": "EMP-005",
        "full_name": "Khalid Al-Saiq",
        "full_name_ar": "خالد السائق",
        "national_id": "1234567890",
        "date_of_birth": datetime(1990, 5, 15, tzinfo=timezone.utc).isoformat(),
        "gender": "male",
        "nationality": "Jordanian",
        "phone": "+962791234567",
        "emergency_contact": "أحمد السائق",
        "emergency_phone": "+962791234568",
        "address": "عمان، الأردن",
        "employment_status": "active",
        "contract_type": "full_time",
        "department_id": ops_dept['id'],
        "department_name": ops_dept['name_ar'],
        "position_title": "Driver",
        "position_title_ar": "سائق",
        "hire_date": datetime(2023, 1, 1, tzinfo=timezone.utc).isoformat(),
        "base_salary": 800.0,  # 800 JOD
        "currency": "JOD",
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    
    existing_employee = await db.employees.find_one({"user_id": driver_id})
    if existing_employee:
        print(f"ℹ️  Employee already exists for {driver_user['username']}")
        employee_id = existing_employee['id']
    else:
        await db.employees.insert_one(employee)
        print(f"✅ Created employee profile: {employee['full_name_ar']}")
    
    # Create Salary Payments (last 3 months)
    months_data = [
        {"month": 10, "year": 2025, "bonuses": 100.0, "deductions": 50.0, "overtime_pay": 80.0},
        {"month": 9, "year": 2025, "bonuses": 150.0, "deductions": 30.0, "overtime_pay": 100.0},
        {"month": 8, "year": 2025, "bonuses": 80.0, "deductions": 40.0, "overtime_pay": 60.0},
    ]
    
    salary_count = 0
    for month_data in months_data:
        existing_salary = await db.salary_payments.find_one({
            "employee_id": employee_id,
            "month": month_data["month"],
            "year": month_data["year"]
        })
        
        if not existing_salary:
            net_salary = (800.0 + month_data["bonuses"] + month_data["overtime_pay"] - month_data["deductions"])
            
            salary_payment = {
                "id": str(uuid.uuid4()),
                "company_id": company_id,
                "employee_id": employee_id,
                "employee_name": "خالد السائق",
                "month": month_data["month"],
                "year": month_data["year"],
                "base_salary": 800.0,
                "bonuses": month_data["bonuses"],
                "deductions": month_data["deductions"],
                "overtime_pay": month_data["overtime_pay"],
                "net_salary": net_salary,
                "currency": "JOD",
                "payment_date": datetime(month_data["year"], month_data["month"], 25, tzinfo=timezone.utc).isoformat(),
                "payment_method": "bank_transfer",
                "status": "paid",
                "created_at": datetime.now(timezone.utc).isoformat(),
                "updated_at": datetime.now(timezone.utc).isoformat()
            }
            
            await db.salary_payments.insert_one(salary_payment)
            salary_count += 1
    
    print(f"✅ Created {salary_count} salary payment records")
    
    # Create Vehicle and assign to driver
    vehicle_id = str(uuid.uuid4())
    vehicle = {
        "id": vehicle_id,
        "company_id": company_id,
        "vehicle_number": "V-001",
        "vehicle_type": "Truck",
        "make": "Mercedes-Benz",
        "model": "Actros",
        "year": 2022,
        "license_plate": "JOR-12345",
        "vin": "WDB9634131L098765",
        "status": "active",
        "assigned_driver_id": driver_id,
        "assigned_driver_name": "خالد السائق",
        "last_location_lat": 31.9454,  # Amman coordinates
        "last_location_lng": 35.9284,
        "last_location_address": "شارع الملكة رانيا العبدالله، عمان، الأردن",
        "last_location_update": datetime.now(timezone.utc).isoformat(),
        "last_maintenance_date": datetime(2025, 9, 1, tzinfo=timezone.utc).isoformat(),
        "next_maintenance_date": datetime(2025, 12, 1, tzinfo=timezone.utc).isoformat(),
        "odometer": 45000.0,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    
    existing_vehicle = await db.vehicles.find_one({"assigned_driver_id": driver_id})
    if existing_vehicle:
        print(f"ℹ️  Vehicle already assigned to driver")
    else:
        await db.vehicles.insert_one(vehicle)
        print(f"✅ Created and assigned vehicle: {vehicle['vehicle_number']}")
    
    print("\n" + "="*60)
    print("🎉 DRIVER DATA SEEDED SUCCESSFULLY!")
    print("="*60)
    print(f"👤 Driver: {employee['full_name_ar']}")
    print(f"💰 Base Salary: {employee['base_salary']} {employee['currency']}")
    print(f"📅 Salary Records: {salary_count + len(months_data)} payments")
    print(f"🚗 Vehicle: {vehicle['vehicle_number']} - {vehicle['make']} {vehicle['model']}")
    print(f"📍 Location: {vehicle['last_location_address']}")
    print("\n🔐 Login credentials:")
    print(f"   Username: driver_khalid")
    print(f"   Password: password123")
    print("="*60)

if __name__ == "__main__":
    asyncio.run(seed_driver_data())
