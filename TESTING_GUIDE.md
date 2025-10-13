# 🧪 COMPLETE TESTING GUIDE - Khairit System

## 📋 Table of Contents
1. [Spec Generator Tool Testing](#spec-generator)
2. [Main Application Testing](#main-app)
3. [Test User Accounts](#test-accounts)
4. [API Testing](#api-testing)
5. [Troubleshooting](#troubleshooting)

---

## 1️⃣ SPEC GENERATOR TOOL TESTING

### Access Information
- **URL:** http://localhost:3001
- **Port:** 3001
- **Tech:** React + TypeScript + Vite

### How to Test

#### Step 1: Start the Spec Generator
```bash
cd /app/spec-generator
npm run dev
```

#### Step 2: Open in Browser
Navigate to: **http://localhost:3001**

#### Step 3: Test Oracle-like Accounting Tab

1. **Check Pre-filled Data:**
   - Organization Name: Silca Factor & Mining Company
   - Regions: Jordan, Saudi Arabia, GCC
   - Legal Entities: 4
   - Currencies: JOD, SAR, USD
   - Verticals: Silica Mining, Glass, Agriculture, Retail

2. **Select Features:**
   - ✅ Click checkboxes for features you want:
     - General Ledger
     - Accounts Payable
     - Accounts Receivable
     - Fixed Assets
     - Tax Engine
     - etc.

3. **Add Integrations:**
   - Primary: Banking APIs, WhatsApp, Email
   - Secondary: ERP, POS, e-Invoicing

4. **Generate Spec:**
   - Click "Generate Specification" button
   - Verify specification appears below
   - Check it shows selected features count

5. **Download:**
   - Click "Download Markdown" - saves `.md` file
   - Click "Download JSON" - saves `.json` file
   - Open files to verify content

#### Step 4: Test Salesforce-like CRM Tab

1. **Switch Tab:**
   - Click "🎫 Salesforce-like CRM" tab

2. **Select CRM Features:**
   - Leads (capture, scoring, assignment)
   - Accounts & Contacts
   - Opportunities
   - Activities
   - Cases/Tickets
   - Knowledge Base

3. **Edit Pipeline Stages:**
   - Modify stages field: "Lead, Qualified, Discovery, Proposal, Negotiation, Closed Won, Closed Lost"

4. **Generate & Download:**
   - Same process as accounting tab
   - Verify different content for CRM

### Expected Results ✅
- ✅ Both tabs load without errors
- ✅ Checkboxes work correctly
- ✅ Form inputs are editable
- ✅ Generate button creates specification
- ✅ Download buttons create files
- ✅ Markdown has proper formatting
- ✅ JSON is valid and contains all data

---

## 2️⃣ MAIN APPLICATION TESTING

### Access Information
- **URL:** https://company-dashboard-5.preview.emergentagent.com
- **Port:** 3000 (local: http://localhost:3000)
- **Tech:** React + FastAPI + MongoDB

### Quick Test - All 6 Role Dashboards

Use these credentials (all passwords: `password123`):

| Role | Username | Dashboard |
|------|----------|-----------|
| **Owner** | chairman_board | Full AdvancedDashboard |
| **Manager** | general_manager | ManagerDashboard |
| **Accountant** | finance_manager | AccountantDashboard |
| **Foreman** | factory_manager | ForemanDashboard |
| **Driver** | driver1 | DriverDashboard |
| **Guard** | security_guard1 | GuardDashboard |

### Testing Steps

#### Test 1: Login & Dashboard
```bash
1. Go to: https://company-dashboard-5.preview.emergentagent.com
2. Enter username: chairman_board
3. Enter password: password123
4. Click تسجيل الدخول (Login)
5. Verify AdvancedDashboard loads with charts
```

#### Test 2: Navigation Menu
```bash
1. Check sidebar menu items
2. Verify role badge shows: "رئيس مجلس الإدارة"
3. Test switching between modules:
   - Dashboard
   - Companies
   - Projects
   - Equipment
   - Production
   - Expenses
   - Invoices
   - Attendance
```

#### Test 3: Multi-Company Switching
```bash
1. Look for company dropdown (if visible)
2. Check if company name displays: "شركة خيرات الأرض للمحاجر"
3. Verify data is filtered per company
```

#### Test 4: Test Each Role

**Owner (chairman_board):**
- ✅ Sees all navigation items
- ✅ Advanced dashboard with analytics
- ✅ Can access Companies module
- ✅ Full permissions

**Manager (general_manager):**
- ✅ ManagerDashboard with 5 metric cards
- ✅ Active projects section
- ✅ Equipment status
- ✅ Team overview
- ✅ Quick actions work

**Accountant (finance_manager):**
- ✅ AccountantDashboard with financial focus
- ✅ 4 summary cards (Expenses, Invoices, Salaries, Investments)
- ✅ Recent expenses/invoices
- ✅ Quick action links to financial modules

**Foreman (factory_manager):**
- ✅ ForemanDashboard with operations focus
- ✅ Production metrics
- ✅ Equipment status
- ✅ Worker attendance
- ✅ Limited navigation (Equipment, Production, Attendance)

**Driver (driver1):**
- ✅ DriverDashboard - highly restricted
- ✅ Personal salary information only
- ✅ Assigned vehicle details
- ✅ GPS location (if available)
- ✅ Minimal navigation

**Guard (security_guard1):**
- ✅ GuardDashboard - attendance focused
- ✅ Today's attendance summary
- ✅ Attendance records table
- ✅ Only Attendance module visible

### Expected Results ✅
- ✅ All roles login successfully
- ✅ Each role sees correct dashboard
- ✅ Navigation filtered per permissions
- ✅ Arabic RTL layout works
- ✅ No JavaScript errors in console
- ✅ All data loads properly

---

## 3️⃣ TEST USER ACCOUNTS

### All 37 Test Accounts

**Password for ALL accounts:** `password123`

#### Quick Access (One per Role)
```
chairman_board       - Owner (رئيس مجلس الإدارة)
general_manager      - Manager (المدير العام)
finance_manager      - Accountant (المدير المالي)
factory_manager      - Foreman (مدير المصنع)
driver1              - Driver (السائق)
security_guard1      - Guard (حارس الأمن)
```

#### All Departments (37 users total)

**Executive (3):**
- chairman_board, deputy_chairman, general_manager

**Marketing (3):**
- marketing_head, planning_dev, design_advertising

**Sales (4):**
- sales_head, sales_staff1, customer_service, sales_rep1

**Legal (3):**
- legal_auditor, contracts_manager, lawyer1

**Operations (4):**
- operations_manager, logistics_manager, driver1, driver2

**Procurement (3):**
- procurement_head, supplies_officer, warehouse_keeper1

**HR (2):**
- hr_manager, employee_affairs

**Finance (4):**
- financial_auditor, finance_manager, accountant1, treasurer

**Manufacturing (7):**
- factory_manager, engineering_supervisor, safety_officer, quality_control, maintenance_tech, production_worker1, production_worker2

**Services & IT (4):**
- security_guard1, security_guard2, it_security, software_dev

---

## 4️⃣ API TESTING

### Backend Health Check
```bash
# Test backend is running
curl https://company-dashboard-5.preview.emergentagent.com/

# Test login endpoint
curl -X POST https://company-dashboard-5.preview.emergentagent.com/api/login \
  -H "Content-Type: application/json" \
  -d '{"username":"chairman_board","password":"password123"}'

# Test equipment API (requires auth)
curl https://company-dashboard-5.preview.emergentagent.com/api/equipment
```

### Database Check
```bash
cd /app/backend
python -c "
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

async def check():
    client = AsyncIOMotorClient('mongodb://localhost:27017')
    db = client['test_database']
    users = await db.users.count_documents({})
    companies = await db.companies.count_documents({})
    print(f'Users: {users}')
    print(f'Companies: {companies}')

asyncio.run(check())
"
```

---

## 5️⃣ TROUBLESHOOTING

### Problem: Spec Generator not loading

**Solution:**
```bash
cd /app/spec-generator
npm install
npm run dev
# Wait for "ready in X ms"
# Open http://localhost:3001
```

### Problem: Main app not loading

**Solution:**
```bash
# Check supervisor status
sudo supervisorctl status

# Restart services
sudo supervisorctl restart frontend
sudo supervisorctl restart backend

# Check logs
tail -50 /var/log/supervisor/frontend.out.log
tail -50 /var/log/supervisor/backend.out.log
```

### Problem: Login fails

**Solution:**
```bash
# Verify user exists
cd /app/backend
python -c "
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

async def check():
    client = AsyncIOMotorClient('mongodb://localhost:27017')
    db = client['test_database']
    user = await db.users.find_one({'username': 'chairman_board'})
    print(f'User found: {user is not None}')
    if user:
        print(f'Role: {user.get(\"role\")}')

asyncio.run(check())
"
```

### Problem: Dashboard not showing data

**Solution:**
- This is expected - some APIs not implemented yet
- Dashboards gracefully show empty states
- Use testing protocol to verify structure works

### Problem: Port conflicts

**Solution:**
```bash
# Check what's using ports
lsof -i :3000  # Frontend
lsof -i :3001  # Spec generator
lsof -i :8001  # Backend

# Kill if needed
kill -9 <PID>
```

---

## 6️⃣ AUTOMATED TESTING

### Frontend Testing
```bash
# Use the frontend testing agent
# (call via ask_human or auto_frontend_testing_agent)
```

### Backend Testing
```bash
# Use the backend testing agent
# (call via deep_testing_backend_v2)
```

---

## ✅ COMPLETE TEST CHECKLIST

### Spec Generator
- [ ] Opens on port 3001
- [ ] Oracle tab loads
- [ ] CRM tab loads
- [ ] Features can be selected
- [ ] Form inputs work
- [ ] Generate button works
- [ ] Download Markdown works
- [ ] Download JSON works

### Main Application
- [ ] Login page loads
- [ ] All 6 roles login
- [ ] Each dashboard displays correctly
- [ ] Navigation menus filtered per role
- [ ] Arabic RTL working
- [ ] Role badges show
- [ ] Logout works
- [ ] No console errors

### Backend
- [ ] All services running
- [ ] MongoDB connected
- [ ] 54+ users in database
- [ ] APIs responding
- [ ] Auth working

---

## 📊 EXPECTED STATUS

**Spec Generator:** ✅ Fully working
**Main App:** ✅ Fully working (basic features)
**Extended Models:** ✅ Created (not yet integrated)
**APIs:** ⏳ Basic APIs working, extended APIs pending

---

**For help, check:**
- `/app/COMPLETE_TEST_ACCOUNTS.md` - All user credentials
- `/app/test_result.md` - Testing protocols
- `/app/backend/models_extended.py` - New data models
- `/app/spec-generator/` - Spec generator source

**Last Updated:** $(date +%Y-%m-%d)
