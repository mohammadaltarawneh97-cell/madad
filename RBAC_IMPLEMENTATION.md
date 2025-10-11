# Role-Based Access Control (RBAC) Implementation

## Overview
This document describes the comprehensive RBAC system implemented for the Khairat Al Ardh multi-company operations management platform.

## Roles & Permissions

### 1. SuperAdmin (مدير النظام)
**Full System Access**
- Companies: Create, Read, Update, Delete
- Users: Create, Read, Update, Delete
- Equipment: Full Access
- Production: Full Access
- Expenses: Full Access
- Invoices: Full Access
- Attendance: Full Access
- Costing Centers: Full Access
- Dashboard: Read
- Reports: Read, Export

### 2. Owner (المالك)
**Full Company Access**
- Users: Create, Read, Update, Delete
- Equipment: Full Access
- Production: Full Access
- Expenses: Full Access
- Invoices: Full Access
- Attendance: Full Access
- Costing Centers: Full Access
- Dashboard: Read
- Reports: Read, Export

### 3. Manager (مدير)
**Operations Management**
- Users: Read
- Equipment: Create, Read, Update
- Production: Create, Read, Update
- Expenses: Read
- Invoices: Read
- Attendance: Create, Read, Update
- Costing Centers: Read
- Dashboard: Read
- Reports: Read, Export

### 4. Accountant (محاسب)
**Financial Operations**
- Users: Read
- Equipment: Read
- Production: Read
- Expenses: Create, Read, Update, Delete
- Invoices: Create, Read, Update, Delete
- Attendance: Read
- Costing Centers: Read
- Dashboard: Read
- Reports: Read, Export

### 5. Foreman (مشرف)
**Production Supervisor**
- Users: Read
- Equipment: Read, Update
- Production: Create, Read, Update
- Expenses: Read
- Invoices: Read
- Attendance: Create, Read, Update
- Costing Centers: Read
- Dashboard: Read
- Reports: Read

### 6. Driver (سائق)
**Field Worker**
- Equipment: Read
- Production: Read
- Attendance: Create, Read
- Dashboard: Read

### 7. Guard (حارس)
**Security Personnel**
- Attendance: Create, Read

## Test Accounts

All test accounts use password: `password123`

| Role | Username | Full Name | Employee ID |
|------|----------|-----------|-------------|
| Owner | owner_ali | علي المالك | EMP-001 |
| Manager | manager_mohammad | محمد المدير | EMP-002 |
| Accountant | accountant_fatima | فاطمة المحاسبة | EMP-003 |
| Foreman | foreman_ahmed | أحمد المشرف | EMP-004 |
| Driver | driver_khalid | خالد السائق | EMP-005 |
| Guard | guard_omar | عمر الحارس | EMP-006 |

## Implementation Details

### Backend (FastAPI)

#### Permission System (`/app/backend/models.py`)
- `UserRole` enum defines all available roles
- `ROLE_PERMISSIONS` dictionary maps roles to resource permissions
- `User.has_permission(resource, action)` method for permission checks

#### Permission Middleware (`/app/backend/server.py`)
- `require_permission(resource, action)` decorator
- `require_role(allowed_roles)` decorator
- All API endpoints protected with permission checks

#### API Endpoints Protection
All endpoints check permissions before processing:
```python
if not user.has_permission("equipment", "create"):
    raise HTTPException(status_code=403, detail="Permission denied")
```

### Frontend (React)

#### Permission Context (`/app/frontend/src/components/MultiCompanyApp.js`)
- AppContext includes `permissions` and `userRole`
- Permissions fetched from `/api/me` endpoint
- Dynamic menu filtering based on permissions

#### Role-Based Navigation
- Menu items filtered based on user permissions
- Each navigation item requires specific resource+action permission
- Guards see only "Attendance", Drivers see limited modules, etc.

#### Role Badge Display
- Color-coded role badges in sidebar
- Arabic role names displayed
- Visual hierarchy: SuperAdmin (purple), Owner (blue), Manager (green), etc.

## Key Features

### 1. Multi-Company Context
- Users can belong to multiple companies
- Company switching maintains permission context
- Data isolation per company

### 2. Permission-Based UI
- Menu items appear only if user has permission
- Buttons/actions hidden for unauthorized operations
- Clean, intuitive user experience

### 3. Secure Backend
- All API endpoints validate permissions
- JWT tokens include company context
- Failed permission checks return HTTP 403

### 4. Arabic RTL Support
- All role names in Arabic
- Right-to-left interface
- Culturally appropriate design

## Testing

### Manual Testing
1. Login with different role accounts
2. Verify navigation menu shows only permitted modules
3. Test API access with different roles
4. Verify permission errors for unauthorized actions

### Seed Script
Run `/app/backend/seed_rbac_users.py` to create test users:
```bash
cd /app/backend
python seed_rbac_users.py
```

## API Permission Examples

### Equipment Access
- **Create**: Owner, Manager, Foreman
- **Read**: All roles except Guard
- **Update**: Owner, Manager, Foreman
- **Delete**: Owner only

### Expenses Access
- **Create**: Owner, Accountant
- **Read**: Owner, Manager, Accountant, Foreman
- **Update**: Owner, Accountant
- **Delete**: Owner, Accountant

### Attendance Access
- **Create**: All roles
- **Read**: All roles
- **Update**: Owner, Manager, Foreman
- **Delete**: Owner only

## Future Enhancements
1. Custom role creation
2. Granular permission assignment
3. Role hierarchy and inheritance
4. Audit logs for permission changes
5. Time-based permissions
6. IP-based access restrictions
