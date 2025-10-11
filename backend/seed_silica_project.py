"""
Seed script to create the Silica Ecosystem Project data from the PDFs
"""
import asyncio
import os
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime, timezone, timedelta
import uuid
from dotenv import load_dotenv
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

async def seed_silica_project():
    """Create the Silica Ecosystem Project with all related data"""
    
    # Get the Khairat company
    company = await db.companies.find_one({"name": "شركة خيرات الأرض للمحاجر"})
    if not company:
        print("❌ Company not found. Please run seed_rbac_users.py first")
        return
    
    company_id = company['id']
    print(f"✅ Found company: {company['name']}")
    
    # Create main project
    project_id = str(uuid.uuid4())
    project = {
        "id": project_id,
        "company_id": company_id,
        "name": "Silica Ecosystem Development Project",
        "name_ar": "مشروع تطوير نظام السيليكا البيئي",
        "description": "Strategic initiative to establish a circular economy ecosystem in Jordan centered around high-purity silica. Transforming local silica resources into high-value products including advanced fertilizers, specialized glass, and materials for digital income units.",
        "status": "in_progress",
        "priority": "critical",
        "start_date": datetime(2025, 1, 1, tzinfo=timezone.utc).isoformat(),
        "end_date": datetime(2028, 1, 1, tzinfo=timezone.utc).isoformat(),
        "estimated_budget": 50000000.0,  # 50M JOD estimated
        "actual_cost": 0.0,
        "completion_percentage": 15.0,
        "project_manager": "owner_ali",
        "team_members": ["owner_ali", "manager_mohammad", "accountant_fatima", "foreman_ahmed"],
        "location": "Mareen Industrial Zone, Jordan",
        "objectives": "1. Create regional hub for silica production\n2. Generate 500+ jobs\n3. Export to GCC, Europe, North Africa\n4. Achieve sustainability (ESG) goals\n5. Integrate agriculture, clean energy, and digital infrastructure",
        "deliverables": [
            "Silica mining and processing facility",
            "Advanced fertilizer production line",
            "Specialized glass manufacturing",
            "Digital Income Units infrastructure",
            "Solar energy integration"
        ],
        "tags": ["silica", "circular-economy", "sustainability", "export", "jordan"],
        "documents": [],
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.projects.insert_one(project)
    print(f"✅ Created project: {project['name']}")
    
    # Create Feasibility Study
    study_id = str(uuid.uuid4())
    
    # Define the 5 phases
    phases = [
        {
            "phase_number": 1,
            "phase_name": "Kickoff & Data Collection",
            "phase_name_ar": "الانطلاق وجمع البيانات",
            "description": "Project initiation, stakeholder meetings, and comprehensive data collection",
            "status": "completed",
            "start_date": datetime(2025, 1, 1, tzinfo=timezone.utc).isoformat(),
            "end_date": datetime(2025, 1, 15, tzinfo=timezone.utc).isoformat(),
            "duration_weeks": 2,
            "deliverables": ["Project charter", "Stakeholder analysis", "Data collection report"],
            "completion_percentage": 100.0,
            "notes": "Successfully completed with all stakeholders engaged"
        },
        {
            "phase_number": 2,
            "phase_name": "Market Assessment & Technical Feasibility",
            "phase_name_ar": "تقييم السوق والجدوى الفنية",
            "description": "Market analysis, demand assessment, technical specifications, and plant design",
            "status": "in_progress",
            "start_date": datetime(2025, 1, 16, tzinfo=timezone.utc).isoformat(),
            "end_date": datetime(2025, 2, 13, tzinfo=timezone.utc).isoformat(),
            "duration_weeks": 4,
            "deliverables": ["Market analysis report", "Technical specifications", "Plant design"],
            "completion_percentage": 60.0,
            "notes": "Market analysis complete, working on technical specs"
        },
        {
            "phase_number": 3,
            "phase_name": "Financial Feasibility Model",
            "phase_name_ar": "نموذج الجدوى المالية",
            "description": "CAPEX/OPEX estimation, revenue projections, profitability analysis",
            "status": "not_started",
            "start_date": None,
            "end_date": None,
            "duration_weeks": 2,
            "deliverables": ["Financial model (5-7 years)", "Investment appraisal", "Sensitivity analysis"],
            "completion_percentage": 0.0,
            "notes": "Pending completion of Phase 2"
        },
        {
            "phase_number": 4,
            "phase_name": "Legal & Risk Analysis",
            "phase_name_ar": "التحليل القانوني وتحليل المخاطر",
            "description": "Regulatory compliance, permits, contracts, and risk mitigation",
            "status": "not_started",
            "start_date": None,
            "end_date": None,
            "duration_weeks": 1,
            "deliverables": ["Legal framework report", "Risk assessment matrix", "Mitigation strategies"],
            "completion_percentage": 0.0,
            "notes": "Awaiting Phase 3 completion"
        },
        {
            "phase_number": 5,
            "phase_name": "Final Report Deliverables & Presentation",
            "phase_name_ar": "التقرير النهائي والعرض التقديمي",
            "description": "Comprehensive feasibility study report and executive presentation",
            "status": "not_started",
            "start_date": None,
            "end_date": None,
            "duration_weeks": 1,
            "deliverables": ["Final feasibility report", "Executive summary", "Presentation deck"],
            "completion_percentage": 0.0,
            "notes": "Final synthesis of all phases"
        }
    ]
    
    feasibility_study = {
        "id": study_id,
        "company_id": company_id,
        "project_id": project_id,
        "study_name": "Silica Manufacturing Facility Feasibility Study",
        "study_name_ar": "دراسة جدوى منشأة تصنيع السيليكا",
        "consultant": "Milestones Masters (MM Advisory Services)",
        "study_cost": 10500.0,  # 10,500 JOD
        "currency": "JOD",
        "total_duration_weeks": 10,
        "start_date": datetime(2025, 1, 1, tzinfo=timezone.utc).isoformat(),
        "expected_end_date": datetime(2025, 3, 15, tzinfo=timezone.utc).isoformat(),
        "actual_end_date": None,
        "overall_status": "in_progress",
        "phases": phases,
        "findings": "High-purity silica reserves confirmed. Strong market demand in GCC, Europe. Competitive cost structure. Government support available.",
        "recommendations": "Proceed with phased implementation. Secure strategic partnerships. Focus on ESG compliance. Establish export channels early.",
        "documents": [],
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.feasibility_studies.insert_one(feasibility_study)
    print(f"✅ Created feasibility study with 5 phases")
    
    # Create Investment records
    investment1_id = str(uuid.uuid4())
    investment1 = {
        "id": investment1_id,
        "company_id": company_id,
        "project_id": project_id,
        "investor_name": "Jordanian Development Bank",
        "investment_type": "debt",
        "amount": 20000000.0,  # 20M JOD
        "currency": "JOD",
        "investment_date": datetime(2025, 1, 15, tzinfo=timezone.utc).isoformat(),
        "expected_return_percentage": 6.5,
        "maturity_date": datetime(2032, 1, 15, tzinfo=timezone.utc).isoformat(),
        "terms": "7-year loan with 2-year grace period. Interest rate: 6.5% annually",
        "status": "active",
        "notes": "Government-backed development loan for infrastructure",
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    
    investment2_id = str(uuid.uuid4())
    investment2 = {
        "id": investment2_id,
        "company_id": company_id,
        "project_id": project_id,
        "investor_name": "Regional Investment Fund (GCC)",
        "investment_type": "equity",
        "amount": 15000000.0,  # 15M JOD
        "currency": "JOD",
        "investment_date": datetime(2025, 2, 1, tzinfo=timezone.utc).isoformat(),
        "expected_return_percentage": 18.0,
        "maturity_date": datetime(2030, 2, 1, tzinfo=timezone.utc).isoformat(),
        "terms": "25% equity stake. Board representation. Exit options after 5 years",
        "status": "active",
        "notes": "Strategic partner with regional market access",
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.investments.insert_one(investment1)
    await db.investments.insert_one(investment2)
    print(f"✅ Created 2 investment records (Total: 35M JOD)")
    
    # Create Financial Projections (5-year model)
    projections = []
    base_year = 2025
    
    for year in range(5):
        year_num = base_year + year
        projection_id = str(uuid.uuid4())
        
        # Simplified financial model with growth
        if year == 0:  # Year 1: Setup year
            capex = 25000000.0
            opex = 3000000.0
            revenue = 0.0
        elif year == 1:  # Year 2: Ramp-up
            capex = 10000000.0
            opex = 5000000.0
            revenue = 8000000.0
        else:  # Years 3-5: Growth
            capex = 2000000.0
            opex = 6000000.0 * (1.1 ** (year - 1))
            revenue = 15000000.0 * (1.2 ** (year - 1))
        
        gross_profit = revenue - opex if revenue > 0 else -opex
        net_profit = gross_profit - (capex * 0.05)  # Simplified depreciation
        cash_flow = net_profit + (capex * 0.05)  # Add back depreciation
        
        projection = {
            "id": projection_id,
            "company_id": company_id,
            "project_id": project_id,
            "year": year_num,
            "capex": capex,
            "opex": opex,
            "revenue": revenue,
            "gross_profit": gross_profit,
            "net_profit": net_profit,
            "cash_flow": cash_flow,
            "roi": (net_profit / capex * 100) if capex > 0 else 0,
            "npv": None,  # To be calculated
            "irr": None,  # To be calculated
            "payback_period": None,  # To be calculated
            "notes": f"Year {year + 1} projections based on phased implementation",
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        }
        
        projections.append(projection)
        await db.financial_projections.insert_one(projection)
    
    print(f"✅ Created 5-year financial projections")
    
    # Create Documents
    doc1_id = str(uuid.uuid4())
    document1 = {
        "id": doc1_id,
        "company_id": company_id,
        "project_id": project_id,
        "name": "Investment - One Ecosystem Final",
        "name_ar": "الاستثمار - النظام البيئي الواحد النهائي",
        "document_type": "proposal",
        "file_url": "https://customer-assets.emergentagent.com/job_agriman/artifacts/n4cn1hr8_Investment%20-%20One%20Ecosystem%20Final.pdf.pdf",
        "file_size": None,
        "mime_type": "application/pdf",
        "version": "1.0",
        "uploaded_by": "owner_ali",
        "description": "Executive summary for the Silica Ecosystem project from MILESTONE MASTERS",
        "tags": ["investment", "ecosystem", "proposal", "executive-summary"],
        "is_public": False,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    
    doc2_id = str(uuid.uuid4())
    document2 = {
        "id": doc2_id,
        "company_id": company_id,
        "project_id": project_id,
        "name": "Silica Manufacturing Facility Feasibility Study Proposal",
        "name_ar": "مقترح دراسة جدوى منشأة تصنيع السيليكا",
        "document_type": "feasibility_report",
        "file_url": "https://customer-assets.emergentagent.com/job_agriman/artifacts/mrkpl0qr_Silica%20Manufacturing%20Facility%20Feasibility%20Study%20in%20Jordan%20%E2%80%93%20Technical%20%26%20Commercial%20Proposal%20%281%29.pdf",
        "file_size": None,
        "mime_type": "application/pdf",
        "version": "1.0",
        "uploaded_by": "manager_mohammad",
        "description": "Technical and commercial proposal from Milestones Masters for the feasibility study",
        "tags": ["feasibility-study", "technical", "commercial", "proposal"],
        "is_public": False,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.documents.insert_one(document1)
    await db.documents.insert_one(document2)
    print(f"✅ Created 2 project documents")
    
    # Update project with document IDs
    await db.projects.update_one(
        {"id": project_id},
        {"$set": {"documents": [doc1_id, doc2_id]}}
    )
    
    # Summary
    print("\n" + "="*60)
    print("🎉 SILICA ECOSYSTEM PROJECT SEEDED SUCCESSFULLY!")
    print("="*60)
    print(f"📊 Project: {project['name']}")
    print(f"📍 Location: {project['location']}")
    print(f"💰 Estimated Budget: {project['estimated_budget']:,.0f} JOD")
    print(f"📈 Progress: {project['completion_percentage']}%")
    print(f"\n📋 Feasibility Study: {feasibility_study['study_name']}")
    print(f"💵 Study Cost: {feasibility_study['study_cost']:,.0f} {feasibility_study['currency']}")
    print(f"⏱️  Duration: {feasibility_study['total_duration_weeks']} weeks")
    print(f"✅ Phases: {len(phases)}")
    print(f"\n💼 Investments: 2 records (Total: 35,000,000 JOD)")
    print(f"📊 Financial Projections: 5 years (2025-2029)")
    print(f"📄 Documents: 2 PDFs uploaded")
    print("="*60)

if __name__ == "__main__":
    asyncio.run(seed_silica_project())
