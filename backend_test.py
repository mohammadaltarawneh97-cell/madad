#!/usr/bin/env python3
"""
Comprehensive Backend API Testing for Khairat Al Ardh Operations Management System
Tests RBAC and Oracle-like Accounting System with comprehensive financial modules.
"""

import requests
import sys
import json
from datetime import datetime, timezone, timedelta
from typing import Dict, Any, Optional

class ComprehensiveAPITester:
    def __init__(self, base_url: str = "https://erp-khairit.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.tests_run = 0
        self.tests_passed = 0
        self.failed_tests = []
        self.user_tokens = {}
        self.company_id = None
        
        # Test users with different roles (all passwords: password123)
        self.test_users = {
            "owner_ali": {"role": "owner", "full_name": "علي المالك"},
            "manager_mohammad": {"role": "manager", "full_name": "محمد المدير"},
            "accountant_fatima": {"role": "accountant", "full_name": "فاطمة المحاسبة"},
            "foreman_ahmed": {"role": "foreman", "full_name": "أحمد المشرف"},
            "driver_khalid": {"role": "driver", "full_name": "خالد السائق"},
            "guard_omar": {"role": "guard", "full_name": "عمر الحارس"}
        }
        
    def log_result(self, test_name: str, success: bool, details: str = ""):
        """Log test results"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {test_name} - PASSED {details}")
        else:
            self.failed_tests.append({"test": test_name, "details": details})
            print(f"❌ {test_name} - FAILED {details}")
    
    def make_request(self, method: str, endpoint: str, data: Optional[Dict] = None, 
                    expected_status: int = 200, token: str = None) -> tuple[bool, Dict]:
        """Make HTTP request with error handling"""
        url = f"{self.api_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'}
        
        if token:
            headers['Authorization'] = f'Bearer {token}'
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, timeout=10)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, timeout=10)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers, timeout=10)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers, timeout=10)
            
            success = response.status_code == expected_status
            
            try:
                response_data = response.json()
            except:
                response_data = {"raw_response": response.text}
            
            if not success:
                error_detail = f"Status: {response.status_code}, Expected: {expected_status}, Response: {response.text[:200]}"
                return False, {"error": error_detail}
            
            return True, response_data
            
        except requests.exceptions.RequestException as e:
            return False, {"error": f"Request failed: {str(e)}"}
    
    def test_health_check(self):
        """Test basic API health"""
        print("\n🔍 Testing API Health...")
        
        # Test root endpoint
        success, data = self.make_request('GET', '')
        self.log_result("API Root Endpoint", success, 
                       f"Message: {data.get('message', 'No message')}" if success else data.get('error', ''))
        
        # Test health endpoint
        success, data = self.make_request('GET', 'health')
        self.log_result("Health Check Endpoint", success,
                       f"Status: {data.get('status', 'Unknown')}" if success else data.get('error', ''))
    
    def test_user_authentication(self):
        """Test authentication for all RBAC users"""
        print("\n🔐 Testing RBAC User Authentication...")
        
        for username, user_info in self.test_users.items():
            login_data = {
                "username": username,
                "password": "password123"
            }
            
            success, data = self.make_request('POST', 'login', login_data, 200)
            if success and data.get('access_token'):
                self.user_tokens[username] = data['access_token']
                if not self.company_id and data.get('company', {}).get('id'):
                    self.company_id = data['company']['id']
                
                self.log_result(f"Login {username} ({user_info['role']})", True, 
                               f"Token received for {user_info['full_name']}")
            else:
                self.log_result(f"Login {username} ({user_info['role']})", False, 
                               data.get('error', 'Login failed'))
    
    def test_user_permissions_context(self):
        """Test /api/me endpoint returns correct permissions for each role"""
        print("\n👤 Testing User Permission Context...")
        
        for username, user_info in self.test_users.items():
            if username not in self.user_tokens:
                continue
                
            success, data = self.make_request('GET', 'me', token=self.user_tokens[username])
            if success:
                user_data = data.get('user', {})
                permissions = data.get('permissions', {})
                role = data.get('role')
                
                # Verify role matches
                role_match = role == user_info['role']
                self.log_result(f"Role verification for {username}", role_match,
                               f"Expected: {user_info['role']}, Got: {role}")
                
                # Verify permissions structure exists
                has_permissions = isinstance(permissions, dict) and len(permissions) > 0
                self.log_result(f"Permissions context for {username}", has_permissions,
                               f"Permissions count: {len(permissions)}")
            else:
                self.log_result(f"Get user context for {username}", False, data.get('error', ''))
    
    def test_equipment_permissions(self):
        """Test equipment endpoint permissions for all roles"""
        print("\n🚛 Testing Equipment Permissions...")
        
        # Equipment test data
        equipment_data = {
            "name": "Test Excavator CAT 320D",
            "type": "EX",
            "model": "CAT 320D",
            "serial_number": "EX001",
            "hours_operated": 1250.5,
            "maintenance_notes": "Regular maintenance required"
        }
        
        # Expected permissions based on ROLE_PERMISSIONS
        expected_get_success = ["owner_ali", "manager_mohammad", "foreman_ahmed", "driver_khalid"]
        expected_get_fail = ["accountant_fatima", "guard_omar"]
        expected_post_success = ["owner_ali", "manager_mohammad", "foreman_ahmed"]
        expected_post_fail = ["accountant_fatima", "driver_khalid", "guard_omar"]
        
        # Test GET /api/equipment
        for username in self.test_users.keys():
            if username not in self.user_tokens:
                continue
                
            success, data = self.make_request('GET', 'equipment', token=self.user_tokens[username])
            
            if username in expected_get_success:
                expected_status = success
                result_msg = f"✓ Allowed access" if success else f"✗ Should have access but got: {data.get('error', '')}"
            else:
                expected_status = not success
                result_msg = f"✓ Correctly denied access" if not success else f"✗ Should be denied access"
            
            self.log_result(f"Equipment GET - {username} ({self.test_users[username]['role']})", 
                           expected_status, result_msg)
        
        # Test POST /api/equipment (only test with users who should succeed)
        for username in expected_post_success:
            if username not in self.user_tokens:
                continue
                
            success, data = self.make_request('POST', 'equipment', equipment_data, 
                                            token=self.user_tokens[username])
            self.log_result(f"Equipment POST - {username} ({self.test_users[username]['role']})", 
                           success, f"Created equipment: {data.get('id', 'Unknown')}" if success else data.get('error', ''))
        
        # Test POST /api/equipment (test users who should fail)
        for username in expected_post_fail:
            if username not in self.user_tokens:
                continue
                
            success, data = self.make_request('POST', 'equipment', equipment_data, 
                                            expected_status=403, token=self.user_tokens[username])
            self.log_result(f"Equipment POST Denied - {username} ({self.test_users[username]['role']})", 
                           success, "✓ Correctly denied access" if success else f"✗ Should be denied: {data.get('error', '')}")
    
    def test_production_permissions(self):
        """Test production endpoint permissions for all roles"""
        print("\n⚡ Testing Production Permissions...")
        
        # Production test data
        production_data = {
            "date": datetime.now(timezone.utc).isoformat(),
            "activity_type": "SCREENING",
            "actual_qty": 850.0,
            "contract_qty": 1000.0,
            "equipment_ids": [],
            "notes": "Test production record"
        }
        
        # Expected permissions
        expected_get_success = ["owner_ali", "manager_mohammad", "accountant_fatima", "foreman_ahmed", "driver_khalid"]
        expected_get_fail = ["guard_omar"]
        expected_post_success = ["owner_ali", "manager_mohammad", "foreman_ahmed"]
        expected_post_fail = ["accountant_fatima", "driver_khalid", "guard_omar"]
        
        # Test GET /api/production
        for username in self.test_users.keys():
            if username not in self.user_tokens:
                continue
                
            success, data = self.make_request('GET', 'production', token=self.user_tokens[username])
            
            if username in expected_get_success:
                expected_status = success
                result_msg = f"✓ Allowed access" if success else f"✗ Should have access: {data.get('error', '')}"
            else:
                expected_status = not success
                result_msg = f"✓ Correctly denied access" if not success else f"✗ Should be denied access"
            
            self.log_result(f"Production GET - {username} ({self.test_users[username]['role']})", 
                           expected_status, result_msg)
        
        # Test POST /api/production (users who should succeed)
        for username in expected_post_success:
            if username not in self.user_tokens:
                continue
                
            success, data = self.make_request('POST', 'production', production_data, 
                                            token=self.user_tokens[username])
            self.log_result(f"Production POST - {username} ({self.test_users[username]['role']})", 
                           success, f"Created production: {data.get('id', 'Unknown')}" if success else data.get('error', ''))
        
        # Test POST /api/production (users who should fail)
        for username in expected_post_fail:
            if username not in self.user_tokens:
                continue
                
            success, data = self.make_request('POST', 'production', production_data, 
                                            expected_status=403, token=self.user_tokens[username])
            self.log_result(f"Production POST Denied - {username} ({self.test_users[username]['role']})", 
                           success, "✓ Correctly denied access" if success else f"✗ Should be denied: {data.get('error', '')}")
    
    def test_expenses_permissions(self):
        """Test expenses endpoint permissions for all roles"""
        print("\n💰 Testing Expenses Permissions...")
        
        # Expense test data
        expense_data = {
            "date": datetime.now(timezone.utc).isoformat(),
            "category": "FUEL",
            "subcategory": "ديزل",
            "amount": 1500.75,
            "description": "Fuel for excavator operations",
            "receipt_number": "RCP001"
        }
        
        # Expected permissions
        expected_get_success = ["owner_ali", "manager_mohammad", "accountant_fatima", "foreman_ahmed"]
        expected_get_fail = ["driver_khalid", "guard_omar"]
        expected_post_success = ["owner_ali", "accountant_fatima"]
        expected_post_fail = ["manager_mohammad", "foreman_ahmed", "driver_khalid", "guard_omar"]
        
        # Test GET /api/expenses
        for username in self.test_users.keys():
            if username not in self.user_tokens:
                continue
                
            success, data = self.make_request('GET', 'expenses', token=self.user_tokens[username])
            
            if username in expected_get_success:
                expected_status = success
                result_msg = f"✓ Allowed access" if success else f"✗ Should have access: {data.get('error', '')}"
            else:
                expected_status = not success
                result_msg = f"✓ Correctly denied access" if not success else f"✗ Should be denied access"
            
            self.log_result(f"Expenses GET - {username} ({self.test_users[username]['role']})", 
                           expected_status, result_msg)
        
        # Test POST /api/expenses (users who should succeed)
        for username in expected_post_success:
            if username not in self.user_tokens:
                continue
                
            success, data = self.make_request('POST', 'expenses', expense_data, 
                                            token=self.user_tokens[username])
            self.log_result(f"Expenses POST - {username} ({self.test_users[username]['role']})", 
                           success, f"Created expense: {data.get('id', 'Unknown')}" if success else data.get('error', ''))
        
        # Test POST /api/expenses (users who should fail)
        for username in expected_post_fail:
            if username not in self.user_tokens:
                continue
                
            success, data = self.make_request('POST', 'expenses', expense_data, 
                                            expected_status=403, token=self.user_tokens[username])
            self.log_result(f"Expenses POST Denied - {username} ({self.test_users[username]['role']})", 
                           success, "✓ Correctly denied access" if success else f"✗ Should be denied: {data.get('error', '')}")
    
    def test_invoices_permissions(self):
        """Test invoices endpoint permissions for all roles"""
        print("\n📄 Testing Invoices Permissions...")
        
        # Invoice test data
        invoice_data = {
            "date": datetime.now(timezone.utc).isoformat(),
            "invoice_number": f"INV-{datetime.now().strftime('%Y%m%d%H%M%S')}",
            "type": "SCREENING",
            "client_name": "Al Rajhi Construction Company",
            "amount": 25000.00,
            "quantity": 1000.0,
            "unit_price": 25.0,
            "status": "PENDING",
            "notes": "Screening services for construction project"
        }
        
        # Expected permissions
        expected_get_success = ["owner_ali", "manager_mohammad", "accountant_fatima", "foreman_ahmed"]
        expected_get_fail = ["driver_khalid", "guard_omar"]
        expected_post_success = ["owner_ali", "accountant_fatima"]
        expected_post_fail = ["manager_mohammad", "foreman_ahmed", "driver_khalid", "guard_omar"]
        
        # Test GET /api/invoices
        for username in self.test_users.keys():
            if username not in self.user_tokens:
                continue
                
            success, data = self.make_request('GET', 'invoices', token=self.user_tokens[username])
            
            if username in expected_get_success:
                expected_status = success
                result_msg = f"✓ Allowed access" if success else f"✗ Should have access: {data.get('error', '')}"
            else:
                expected_status = not success
                result_msg = f"✓ Correctly denied access" if not success else f"✗ Should be denied access"
            
            self.log_result(f"Invoices GET - {username} ({self.test_users[username]['role']})", 
                           expected_status, result_msg)
        
        # Test POST /api/invoices (users who should succeed)
        for username in expected_post_success:
            if username not in self.user_tokens:
                continue
                
            success, data = self.make_request('POST', 'invoices', invoice_data, 
                                            token=self.user_tokens[username])
            self.log_result(f"Invoices POST - {username} ({self.test_users[username]['role']})", 
                           success, f"Created invoice: {data.get('invoice_number', 'Unknown')}" if success else data.get('error', ''))
        
        # Test POST /api/invoices (users who should fail)
        for username in expected_post_fail:
            if username not in self.user_tokens:
                continue
                
            success, data = self.make_request('POST', 'invoices', invoice_data, 
                                            expected_status=403, token=self.user_tokens[username])
            self.log_result(f"Invoices POST Denied - {username} ({self.test_users[username]['role']})", 
                           success, "✓ Correctly denied access" if success else f"✗ Should be denied: {data.get('error', '')}")
    
    def test_attendance_permissions(self):
        """Test attendance endpoint permissions for all roles"""
        print("\n👥 Testing Attendance Permissions...")
        
        # Attendance test data
        attendance_data = {
            "employee_name": "محمد العامل",
            "employee_id": "EMP-007",
            "department": "Operations",
            "date": datetime.now(timezone.utc).isoformat(),
            "check_in": datetime.now(timezone.utc).replace(hour=8, minute=0).isoformat(),
            "check_out": datetime.now(timezone.utc).replace(hour=17, minute=0).isoformat(),
            "hours_worked": 8.0,
            "overtime_hours": 1.0,
            "notes": "Regular work day with overtime"
        }
        
        # Expected permissions - All roles should have access to attendance
        expected_success_all = list(self.test_users.keys())
        
        # Test GET /api/attendance
        for username in self.test_users.keys():
            if username not in self.user_tokens:
                continue
                
            success, data = self.make_request('GET', 'attendance', token=self.user_tokens[username])
            self.log_result(f"Attendance GET - {username} ({self.test_users[username]['role']})", 
                           success, f"✓ Access granted" if success else f"✗ Should have access: {data.get('error', '')}")
        
        # Test POST /api/attendance - All roles should be able to create attendance
        for username in expected_success_all:
            if username not in self.user_tokens:
                continue
                
            success, data = self.make_request('POST', 'attendance', attendance_data, 
                                            token=self.user_tokens[username])
            self.log_result(f"Attendance POST - {username} ({self.test_users[username]['role']})", 
                           success, f"Created attendance: {data.get('id', 'Unknown')}" if success else data.get('error', ''))
    
    def test_dashboard_permissions(self):
        """Test dashboard stats endpoint permissions for all roles"""
        print("\n📊 Testing Dashboard Permissions...")
        
        # Expected permissions - All roles except guard should have dashboard access
        expected_success = ["owner_ali", "manager_mohammad", "accountant_fatima", "foreman_ahmed", "driver_khalid"]
        expected_fail = ["guard_omar"]
        
        # Test GET /api/dashboard/stats
        for username in self.test_users.keys():
            if username not in self.user_tokens:
                continue
                
            success, data = self.make_request('GET', 'dashboard/stats', token=self.user_tokens[username])
            
            if username in expected_success:
                expected_status = success
                result_msg = f"✓ Allowed access" if success else f"✗ Should have access: {data.get('error', '')}"
            else:
                expected_status = not success
                result_msg = f"✓ Correctly denied access" if not success else f"✗ Should be denied access"
            
            self.log_result(f"Dashboard GET - {username} ({self.test_users[username]['role']})", 
                           expected_status, result_msg)
            
            # Validate dashboard data structure for successful requests
            if success and username in expected_success:
                required_keys = ['production', 'expenses', 'equipment_count', 'invoices', 'month']
                missing_keys = [key for key in required_keys if key not in data]
                
                if not missing_keys:
                    self.log_result(f"Dashboard Data Structure - {username}", True, "All required keys present")
                else:
                    self.log_result(f"Dashboard Data Structure - {username}", False, f"Missing keys: {missing_keys}")
    
    def test_accounting_chart_of_accounts(self):
        """Test Chart of Accounts functionality"""
        print("\n📊 Testing Chart of Accounts...")
        
        if "accountant_fatima" not in self.user_tokens:
            self.log_result("Chart of Accounts - No Token", False, "accountant_fatima not authenticated")
            return
        
        token = self.user_tokens["accountant_fatima"]
        
        # Test accounts to create
        test_accounts = [
            {
                "account_code": "1000",
                "account_name": "Cash",
                "account_name_ar": "النقد",
                "account_type": "asset",
                "account_subtype": "current_asset",
                "opening_balance": 10000
            },
            {
                "account_code": "2000",
                "account_name": "Accounts Payable",
                "account_name_ar": "حسابات الدفع",
                "account_type": "liability",
                "account_subtype": "current_liability",
                "opening_balance": 0
            },
            {
                "account_code": "3000",
                "account_name": "Capital",
                "account_name_ar": "رأس المال",
                "account_type": "equity",
                "account_subtype": "owner_equity",
                "opening_balance": 10000
            },
            {
                "account_code": "4000",
                "account_name": "Sales Revenue",
                "account_name_ar": "إيرادات المبيعات",
                "account_type": "revenue",
                "account_subtype": "operating_revenue",
                "opening_balance": 0
            },
            {
                "account_code": "5000",
                "account_name": "Office Expenses",
                "account_name_ar": "مصاريف المكتب",
                "account_type": "expense",
                "account_subtype": "operating_expense",
                "opening_balance": 0
            }
        ]
        
        created_accounts = []
        
        # Create accounts
        for account_data in test_accounts:
            success, data = self.make_request('POST', 'accounting/chart-of-accounts', account_data, token=token)
            if success:
                created_accounts.append(data)
                self.log_result(f"Create Account {account_data['account_code']}", True, 
                               f"Account '{account_data['account_name']}' created successfully")
            else:
                self.log_result(f"Create Account {account_data['account_code']}", False, data.get('error', ''))
        
        # Get all accounts
        success, data = self.make_request('GET', 'accounting/chart-of-accounts', token=token)
        if success:
            accounts_count = len(data)
            self.log_result("Get Chart of Accounts", True, f"Retrieved {accounts_count} accounts")
            
            # Verify created accounts exist
            account_codes = [acc.get('account_code') for acc in data]
            for test_acc in test_accounts:
                if test_acc['account_code'] in account_codes:
                    self.log_result(f"Verify Account {test_acc['account_code']}", True, "Account found in chart")
                else:
                    self.log_result(f"Verify Account {test_acc['account_code']}", False, "Account not found")
        else:
            self.log_result("Get Chart of Accounts", False, data.get('error', ''))
        
        return created_accounts

    def test_accounting_journal_entries(self, created_accounts):
        """Test Journal Entries functionality"""
        print("\n📝 Testing Journal Entries...")
        
        if "accountant_fatima" not in self.user_tokens:
            self.log_result("Journal Entries - No Token", False, "accountant_fatima not authenticated")
            return
        
        token = self.user_tokens["accountant_fatima"]
        
        if not created_accounts or len(created_accounts) < 2:
            self.log_result("Journal Entries - No Accounts", False, "Need created accounts for testing")
            return
        
        # Find cash and revenue accounts
        cash_account = next((acc for acc in created_accounts if acc.get('account_code') == '1000'), None)
        revenue_account = next((acc for acc in created_accounts if acc.get('account_code') == '4000'), None)
        
        if not cash_account or not revenue_account:
            self.log_result("Journal Entries - Missing Accounts", False, "Cash or Revenue account not found")
            return
        
        # Create journal entry
        journal_entry_data = {
            "entry_date": datetime.now(timezone.utc).isoformat(),
            "description": "Test sales transaction",
            "lines": [
                {
                    "account_id": cash_account['id'],
                    "account_code": cash_account['account_code'],
                    "account_name": cash_account['account_name'],
                    "entry_type": "debit",
                    "amount": 5000,
                    "amount_base_currency": 5000,
                    "currency": "SAR",
                    "exchange_rate": 1.0
                },
                {
                    "account_id": revenue_account['id'],
                    "account_code": revenue_account['account_code'],
                    "account_name": revenue_account['account_name'],
                    "entry_type": "credit",
                    "amount": 5000,
                    "amount_base_currency": 5000,
                    "currency": "SAR",
                    "exchange_rate": 1.0
                }
            ]
        }
        
        # Create journal entry
        success, data = self.make_request('POST', 'accounting/journal-entries', journal_entry_data, token=token)
        if success:
            entry_id = data.get('id')
            entry_number = data.get('entry_number')
            self.log_result("Create Journal Entry", True, f"Entry {entry_number} created in DRAFT status")
            
            # Post the journal entry
            if entry_id:
                success, post_data = self.make_request('POST', f'accounting/journal-entries/{entry_id}/post', token=token)
                if success:
                    self.log_result("Post Journal Entry", True, "Entry posted successfully, balances updated")
                else:
                    self.log_result("Post Journal Entry", False, post_data.get('error', ''))
        else:
            self.log_result("Create Journal Entry", False, data.get('error', ''))
        
        # Get journal entries
        success, data = self.make_request('GET', 'accounting/journal-entries', token=token)
        if success:
            entries_count = len(data)
            self.log_result("Get Journal Entries", True, f"Retrieved {entries_count} journal entries")
        else:
            self.log_result("Get Journal Entries", False, data.get('error', ''))

    def test_accounting_vendors_and_bills(self):
        """Test Vendors and Vendor Bills functionality"""
        print("\n🏪 Testing Vendors & AP Bills...")
        
        if "accountant_fatima" not in self.user_tokens:
            self.log_result("Vendors - No Token", False, "accountant_fatima not authenticated")
            return
        
        token = self.user_tokens["accountant_fatima"]
        
        # Create vendor
        vendor_data = {
            "vendor_code": "V001",
            "vendor_name": "Test Supplier",
            "vendor_type": "supplier",
            "payment_terms_days": 30
        }
        
        success, vendor_response = self.make_request('POST', 'accounting/vendors', vendor_data, token=token)
        if success:
            vendor_id = vendor_response.get('id')
            self.log_result("Create Vendor", True, f"Vendor {vendor_data['vendor_code']} created")
            
            # Get vendors
            success, data = self.make_request('GET', 'accounting/vendors', token=token)
            if success:
                vendors_count = len(data)
                self.log_result("Get Vendors", True, f"Retrieved {vendors_count} vendors")
            else:
                self.log_result("Get Vendors", False, data.get('error', ''))
            
            # Create vendor bill if vendor created successfully
            if vendor_id:
                bill_data = {
                    "vendor_id": vendor_id,
                    "bill_date": datetime.now(timezone.utc).isoformat(),
                    "lines": [
                        {
                            "line_number": 1,
                            "description": "Office supplies",
                            "account_id": "dummy_account_id",
                            "account_code": "5000",
                            "quantity": 1.0,
                            "unit_price": 1000.0,
                            "amount": 1000.0,
                            "tax_rate": 0.15,
                            "tax_amount": 150.0,
                            "total_amount": 1150.0
                        }
                    ]
                }
                
                success, bill_response = self.make_request('POST', 'accounting/vendor-bills', bill_data, token=token)
                if success:
                    bill_number = bill_response.get('bill_number')
                    total_amount = bill_response.get('total_amount')
                    self.log_result("Create Vendor Bill", True, f"Bill {bill_number} created, Total: {total_amount}")
                else:
                    self.log_result("Create Vendor Bill", False, bill_response.get('error', ''))
                
                # Get vendor bills
                success, data = self.make_request('GET', 'accounting/vendor-bills', token=token)
                if success:
                    bills_count = len(data)
                    self.log_result("Get Vendor Bills", True, f"Retrieved {bills_count} vendor bills")
                else:
                    self.log_result("Get Vendor Bills", False, data.get('error', ''))
        else:
            self.log_result("Create Vendor", False, vendor_response.get('error', ''))

    def test_accounting_customers_and_invoices(self):
        """Test Customers and AR Invoices functionality"""
        print("\n👥 Testing Customers & AR Invoices...")
        
        if "accountant_fatima" not in self.user_tokens:
            self.log_result("Customers - No Token", False, "accountant_fatima not authenticated")
            return
        
        token = self.user_tokens["accountant_fatima"]
        
        # Create customer
        customer_data = {
            "customer_code": "C001",
            "customer_name": "Test Customer",
            "customer_type": "company",
            "payment_terms_days": 30
        }
        
        success, customer_response = self.make_request('POST', 'accounting/customers', customer_data, token=token)
        if success:
            customer_id = customer_response.get('id')
            self.log_result("Create Customer", True, f"Customer {customer_data['customer_code']} created")
            
            # Get customers
            success, data = self.make_request('GET', 'accounting/customers', token=token)
            if success:
                customers_count = len(data)
                self.log_result("Get Customers", True, f"Retrieved {customers_count} customers")
            else:
                self.log_result("Get Customers", False, data.get('error', ''))
            
            # Create AR invoice if customer created successfully
            if customer_id:
                invoice_data = {
                    "customer_id": customer_id,
                    "invoice_date": datetime.now(timezone.utc).isoformat(),
                    "lines": [
                        {
                            "line_number": 1,
                            "description": "Consulting services",
                            "account_id": "dummy_account_id",
                            "account_code": "4000",
                            "quantity": 1.0,
                            "unit_price": 5000.0,
                            "amount": 5000.0,
                            "tax_rate": 0.15,
                            "tax_amount": 750.0,
                            "total_amount": 5750.0
                        }
                    ]
                }
                
                success, invoice_response = self.make_request('POST', 'accounting/ar-invoices', invoice_data, token=token)
                if success:
                    invoice_number = invoice_response.get('invoice_number')
                    total_amount = invoice_response.get('total_amount')
                    self.log_result("Create AR Invoice", True, f"Invoice {invoice_number} created, Total: {total_amount}")
                else:
                    self.log_result("Create AR Invoice", False, invoice_response.get('error', ''))
                
                # Get AR invoices
                success, data = self.make_request('GET', 'accounting/ar-invoices', token=token)
                if success:
                    invoices_count = len(data)
                    self.log_result("Get AR Invoices", True, f"Retrieved {invoices_count} AR invoices")
                else:
                    self.log_result("Get AR Invoices", False, data.get('error', ''))
        else:
            self.log_result("Create Customer", False, customer_response.get('error', ''))

    def test_accounting_fixed_assets(self, created_accounts):
        """Test Fixed Assets functionality"""
        print("\n🏗️ Testing Fixed Assets...")
        
        if "accountant_fatima" not in self.user_tokens:
            self.log_result("Fixed Assets - No Token", False, "accountant_fatima not authenticated")
            return
        
        token = self.user_tokens["accountant_fatima"]
        
        if not created_accounts or len(created_accounts) < 3:
            self.log_result("Fixed Assets - No Accounts", False, "Need created accounts for testing")
            return
        
        # Find required accounts
        asset_account = next((acc for acc in created_accounts if acc.get('account_type') == 'asset'), None)
        liability_account = next((acc for acc in created_accounts if acc.get('account_type') == 'liability'), None)
        expense_account = next((acc for acc in created_accounts if acc.get('account_type') == 'expense'), None)
        
        if not all([asset_account, liability_account, expense_account]):
            self.log_result("Fixed Assets - Missing Account Types", False, "Need asset, liability, and expense accounts")
            return
        
        # Create fixed asset
        asset_data = {
            "asset_code": "FA001",
            "asset_name": "Office Equipment",
            "asset_category": "furniture",
            "purchase_price": 50000,
            "useful_life_years": 5,
            "salvage_value": 5000,
            "depreciation_method": "straight_line",
            "purchase_date": "2025-01-01T00:00:00Z",
            "asset_account_id": asset_account['id'],
            "depreciation_account_id": liability_account['id'],
            "expense_account_id": expense_account['id']
        }
        
        success, asset_response = self.make_request('POST', 'accounting/fixed-assets', asset_data, token=token)
        if success:
            asset_code = asset_response.get('asset_code')
            net_book_value = asset_response.get('net_book_value')
            self.log_result("Create Fixed Asset", True, f"Asset {asset_code} created, NBV: {net_book_value}")
        else:
            self.log_result("Create Fixed Asset", False, asset_response.get('error', ''))
        
        # Get fixed assets
        success, data = self.make_request('GET', 'accounting/fixed-assets', token=token)
        if success:
            assets_count = len(data)
            self.log_result("Get Fixed Assets", True, f"Retrieved {assets_count} fixed assets")
        else:
            self.log_result("Get Fixed Assets", False, data.get('error', ''))

    def test_accounting_tax_configuration(self, created_accounts):
        """Test Tax Configuration functionality"""
        print("\n💰 Testing Tax Configuration...")
        
        if "accountant_fatima" not in self.user_tokens:
            self.log_result("Tax Config - No Token", False, "accountant_fatima not authenticated")
            return
        
        token = self.user_tokens["accountant_fatima"]
        
        if not created_accounts:
            self.log_result("Tax Config - No Accounts", False, "Need created accounts for testing")
            return
        
        # Find liability account for tax payable
        liability_account = next((acc for acc in created_accounts if acc.get('account_type') == 'liability'), None)
        
        if not liability_account:
            self.log_result("Tax Config - No Liability Account", False, "Need liability account for tax payable")
            return
        
        # Create VAT configuration
        tax_data = {
            "tax_code": "VAT15",
            "tax_name": "VAT 15%",
            "tax_name_ar": "ضريبة القيمة المضافة",
            "tax_type": "vat",
            "tax_rate": 15,
            "effective_from": "2025-01-01T00:00:00Z",
            "tax_payable_account_id": liability_account['id']
        }
        
        success, tax_response = self.make_request('POST', 'accounting/tax-configuration', tax_data, token=token)
        if success:
            tax_code = tax_response.get('tax_code')
            tax_rate = tax_response.get('tax_rate')
            self.log_result("Create Tax Config", True, f"Tax {tax_code} created, Rate: {tax_rate}%")
        else:
            self.log_result("Create Tax Config", False, tax_response.get('error', ''))
        
        # Get tax configurations
        success, data = self.make_request('GET', 'accounting/tax-configuration', token=token)
        if success:
            tax_count = len(data)
            self.log_result("Get Tax Configurations", True, f"Retrieved {tax_count} tax configurations")
        else:
            self.log_result("Get Tax Configurations", False, data.get('error', ''))

    def test_accounting_exchange_rates(self):
        """Test Exchange Rates functionality"""
        print("\n💱 Testing Exchange Rates...")
        
        if "accountant_fatima" not in self.user_tokens:
            self.log_result("Exchange Rates - No Token", False, "accountant_fatima not authenticated")
            return
        
        token = self.user_tokens["accountant_fatima"]
        
        # Create USD to SAR exchange rate
        rate_data = {
            "from_currency": "USD",
            "to_currency": "SAR",
            "rate": 3.75,
            "effective_date": "2025-01-01T00:00:00Z"
        }
        
        success, rate_response = self.make_request('POST', 'accounting/exchange-rates', rate_data, token=token)
        if success:
            from_currency = rate_response.get('from_currency')
            to_currency = rate_response.get('to_currency')
            rate = rate_response.get('rate')
            self.log_result("Create Exchange Rate", True, f"Rate {from_currency}/{to_currency}: {rate}")
        else:
            self.log_result("Create Exchange Rate", False, rate_response.get('error', ''))
        
        # Get exchange rates
        success, data = self.make_request('GET', 'accounting/exchange-rates', token=token)
        if success:
            rates_count = len(data)
            self.log_result("Get Exchange Rates", True, f"Retrieved {rates_count} exchange rates")
        else:
            self.log_result("Get Exchange Rates", False, data.get('error', ''))

    def test_accounting_financial_reports(self):
        """Test Financial Reports functionality"""
        print("\n📈 Testing Financial Reports...")
        
        if "accountant_fatima" not in self.user_tokens:
            self.log_result("Financial Reports - No Token", False, "accountant_fatima not authenticated")
            return
        
        token = self.user_tokens["accountant_fatima"]
        
        # Test Trial Balance
        success, trial_balance = self.make_request('GET', 'accounting/reports/trial-balance', token=token)
        if success:
            total_debit = trial_balance.get('total_debit', 0)
            total_credit = trial_balance.get('total_credit', 0)
            balanced = trial_balance.get('balanced', False)
            accounts_count = len(trial_balance.get('accounts', []))
            self.log_result("Trial Balance Report", True, 
                           f"Accounts: {accounts_count}, Debits: {total_debit}, Credits: {total_credit}, Balanced: {balanced}")
        else:
            self.log_result("Trial Balance Report", False, trial_balance.get('error', ''))
        
        # Test Balance Sheet
        success, balance_sheet = self.make_request('GET', 'accounting/reports/balance-sheet', token=token)
        if success:
            total_assets = balance_sheet.get('total_assets', 0)
            total_liabilities = balance_sheet.get('total_liabilities', 0)
            total_equity = balance_sheet.get('total_equity', 0)
            balanced = balance_sheet.get('balanced', False)
            self.log_result("Balance Sheet Report", True, 
                           f"Assets: {total_assets}, Liabilities: {total_liabilities}, Equity: {total_equity}, Balanced: {balanced}")
        else:
            self.log_result("Balance Sheet Report", False, balance_sheet.get('error', ''))
        
        # Test Income Statement
        from_date = "2025-01-01T00:00:00Z"
        to_date = "2025-12-31T23:59:59Z"
        success, income_statement = self.make_request('GET', f'accounting/reports/income-statement?from_date={from_date}&to_date={to_date}', token=token)
        if success:
            total_revenue = income_statement.get('total_revenue', 0)
            total_expenses = income_statement.get('total_expenses', 0)
            net_income = income_statement.get('net_income', 0)
            self.log_result("Income Statement Report", True, 
                           f"Revenue: {total_revenue}, Expenses: {total_expenses}, Net Income: {net_income}")
        else:
            self.log_result("Income Statement Report", False, income_statement.get('error', ''))

    def test_accounting_rbac_permissions(self):
        """Test RBAC permissions for accounting endpoints"""
        print("\n🔐 Testing Accounting RBAC Permissions...")
        
        # Test with manager (should have read access only)
        if "manager_mohammad" in self.user_tokens:
            token = self.user_tokens["manager_mohammad"]
            
            # Manager should be able to read chart of accounts
            success, data = self.make_request('GET', 'accounting/chart-of-accounts', token=token)
            if success:
                self.log_result("Manager Read Chart of Accounts", True, "Manager has read access")
            else:
                self.log_result("Manager Read Chart of Accounts", False, data.get('error', ''))
        
        # Test with driver (should get 403 Forbidden)
        if "driver_khalid" in self.user_tokens:
            token = self.user_tokens["driver_khalid"]
            
            # Driver should be denied access to accounting
            success, data = self.make_request('GET', 'accounting/chart-of-accounts', expected_status=403, token=token)
            if success:  # success means we got expected 403
                self.log_result("Driver Denied Accounting Access", True, "Driver correctly denied access")
            else:
                self.log_result("Driver Denied Accounting Access", False, "Driver should be denied access")

    def test_enhanced_accounting_bank_accounts(self):
        """Test Bank Accounts functionality"""
        print("\n🏦 Testing Bank Accounts...")
        
        if "accountant_fatima" not in self.user_tokens:
            self.log_result("Bank Accounts - No Token", False, "accountant_fatima not authenticated")
            return None
        
        token = self.user_tokens["accountant_fatima"]
        
        # Create bank account
        bank_account_data = {
            "account_number": "SA1234567890",
            "account_name": "Main Operating Account",
            "account_name_ar": "الحساب التشغيلي الرئيسي",
            "account_type": "checking",
            "bank_name": "Al Rajhi Bank",
            "bank_name_ar": "مصرف الراجحي",
            "currency": "SAR",
            "opening_balance": 100000.00,
            "gl_account_id": "test-gl-001"
        }
        
        success, bank_response = self.make_request('POST', 'accounting/bank-accounts', bank_account_data, token=token)
        if success:
            bank_account_id = bank_response.get('id')
            account_name = bank_response.get('account_name')
            opening_balance = bank_response.get('opening_balance')
            self.log_result("Create Bank Account", True, f"Account '{account_name}' created with balance: {opening_balance}")
            
            # Get bank accounts
            success, data = self.make_request('GET', 'accounting/bank-accounts', token=token)
            if success:
                accounts_count = len(data)
                self.log_result("Get Bank Accounts", True, f"Retrieved {accounts_count} bank accounts")
            else:
                self.log_result("Get Bank Accounts", False, data.get('error', ''))
            
            return bank_account_id
        else:
            self.log_result("Create Bank Account", False, bank_response.get('error', ''))
            return None

    def test_enhanced_accounting_bank_statements(self, bank_account_id):
        """Test Bank Statements functionality"""
        print("\n📄 Testing Bank Statements...")
        
        if "accountant_fatima" not in self.user_tokens:
            self.log_result("Bank Statements - No Token", False, "accountant_fatima not authenticated")
            return None
        
        if not bank_account_id:
            self.log_result("Bank Statements - No Bank Account", False, "Need bank account for testing")
            return None
        
        token = self.user_tokens["accountant_fatima"]
        
        # Create bank statement
        statement_data = {
            "bank_account_id": bank_account_id,
            "statement_date": datetime.now(timezone.utc).isoformat(),
            "from_date": (datetime.now(timezone.utc) - timedelta(days=30)).isoformat(),
            "to_date": datetime.now(timezone.utc).isoformat(),
            "opening_balance": 100000.00,
            "closing_balance": 105000.00,
            "lines": [
                {
                    "transaction_date": datetime.now(timezone.utc).isoformat(),
                    "description": "Customer payment received",
                    "reference": "TXN001",
                    "debit": 5000.00,
                    "credit": 0.00,
                    "balance": 105000.00
                }
            ]
        }
        
        success, statement_response = self.make_request('POST', 'accounting/bank-statements', statement_data, token=token)
        if success:
            statement_id = statement_response.get('id')
            statement_number = statement_response.get('statement_number')
            closing_balance = statement_response.get('closing_balance')
            self.log_result("Create Bank Statement", True, f"Statement {statement_number} created, Closing Balance: {closing_balance}")
            
            # Get bank statements
            success, data = self.make_request('GET', 'accounting/bank-statements', token=token)
            if success:
                statements_count = len(data)
                self.log_result("Get Bank Statements", True, f"Retrieved {statements_count} bank statements")
            else:
                self.log_result("Get Bank Statements", False, data.get('error', ''))
            
            return statement_id
        else:
            self.log_result("Create Bank Statement", False, statement_response.get('error', ''))
            return None

    def test_enhanced_accounting_bank_reconciliation(self, statement_id):
        """Test Bank Reconciliation functionality"""
        print("\n🔄 Testing Bank Reconciliation...")
        
        if "accountant_fatima" not in self.user_tokens:
            self.log_result("Bank Reconciliation - No Token", False, "accountant_fatima not authenticated")
            return
        
        if not statement_id:
            self.log_result("Bank Reconciliation - No Statement", False, "Need bank statement for testing")
            return
        
        token = self.user_tokens["accountant_fatima"]
        
        # Create bank reconciliation
        success, recon_response = self.make_request('POST', f'accounting/bank-reconciliations?statement_id={statement_id}', token=token)
        if success:
            recon_id = recon_response.get('id')
            recon_number = recon_response.get('reconciliation_number')
            difference = recon_response.get('difference')
            self.log_result("Create Bank Reconciliation", True, f"Reconciliation {recon_number} created, Difference: {difference}")
            
            # Get bank reconciliations
            success, data = self.make_request('GET', 'accounting/bank-reconciliations', token=token)
            if success:
                recons_count = len(data)
                self.log_result("Get Bank Reconciliations", True, f"Retrieved {recons_count} reconciliations")
            else:
                self.log_result("Get Bank Reconciliations", False, data.get('error', ''))
            
            # Complete reconciliation (test with Owner role for approve permission)
            if "owner_ali" in self.user_tokens and recon_id:
                owner_token = self.user_tokens["owner_ali"]
                success, complete_data = self.make_request('POST', f'accounting/bank-reconciliations/{recon_id}/complete', token=owner_token)
                if success:
                    self.log_result("Complete Bank Reconciliation", True, "Reconciliation completed successfully")
                else:
                    self.log_result("Complete Bank Reconciliation", False, complete_data.get('error', ''))
        else:
            self.log_result("Create Bank Reconciliation", False, recon_response.get('error', ''))

    def test_enhanced_accounting_expense_claims(self):
        """Test Expense Claims functionality"""
        print("\n💳 Testing Expense Claims...")
        
        if "accountant_fatima" not in self.user_tokens:
            self.log_result("Expense Claims - No Token", False, "accountant_fatima not authenticated")
            return None
        
        token = self.user_tokens["accountant_fatima"]
        
        # Create expense claim
        expense_claim_data = {
            "claim_date": datetime.now(timezone.utc).isoformat(),
            "employee_id": "emp-001",
            "lines": [
                {
                    "line_number": 1,
                    "expense_date": datetime.now(timezone.utc).isoformat(),
                    "expense_category": "travel",
                    "description": "Business trip to Riyadh",
                    "amount": 1500.00,
                    "tax_amount": 225.00,
                    "receipt_attached": True
                },
                {
                    "line_number": 2,
                    "expense_date": datetime.now(timezone.utc).isoformat(),
                    "expense_category": "meals",
                    "description": "Client dinner",
                    "amount": 300.00,
                    "tax_amount": 45.00,
                    "receipt_attached": True
                }
            ],
            "notes": "Monthly expense claim"
        }
        
        success, claim_response = self.make_request('POST', 'accounting/expense-claims', expense_claim_data, token=token)
        if success:
            claim_id = claim_response.get('id')
            claim_number = claim_response.get('claim_number')
            net_amount = claim_response.get('net_amount')
            self.log_result("Create Expense Claim", True, f"Claim {claim_number} created, Net Amount: {net_amount}")
            
            # Get expense claims
            success, data = self.make_request('GET', 'accounting/expense-claims', token=token)
            if success:
                claims_count = len(data)
                self.log_result("Get Expense Claims", True, f"Retrieved {claims_count} expense claims")
            else:
                self.log_result("Get Expense Claims", False, data.get('error', ''))
            
            # Submit expense claim
            if claim_id:
                success, submit_data = self.make_request('POST', f'accounting/expense-claims/{claim_id}/submit', token=token)
                if success:
                    self.log_result("Submit Expense Claim", True, "Claim submitted for approval")
                    
                    # Approve expense claim (test with Manager role)
                    if "manager_mohammad" in self.user_tokens:
                        manager_token = self.user_tokens["manager_mohammad"]
                        success, approve_data = self.make_request('POST', f'accounting/expense-claims/{claim_id}/approve', token=manager_token)
                        if success:
                            self.log_result("Approve Expense Claim", True, "Claim approved successfully")
                        else:
                            self.log_result("Approve Expense Claim", False, approve_data.get('error', ''))
                else:
                    self.log_result("Submit Expense Claim", False, submit_data.get('error', ''))
            
            return claim_id
        else:
            self.log_result("Create Expense Claim", False, claim_response.get('error', ''))
            return None

    def test_enhanced_accounting_budgets(self):
        """Test Budget Management functionality"""
        print("\n📊 Testing Budget Management...")
        
        if "accountant_fatima" not in self.user_tokens:
            self.log_result("Budgets - No Token", False, "accountant_fatima not authenticated")
            return None
        
        token = self.user_tokens["accountant_fatima"]
        
        # Create budget
        budget_data = {
            "budget_name": "Annual Operations Budget 2025",
            "budget_name_ar": "ميزانية العمليات السنوية 2025",
            "budget_type": "annual",
            "fiscal_year": 2025,
            "start_date": "2025-01-01T00:00:00Z",
            "end_date": "2025-12-31T23:59:59Z",
            "lines": [
                {
                    "account_id": "acc-001",
                    "account_code": "5000",
                    "account_name": "Office Expenses",
                    "budgeted_amount": 120000.00,
                    "actual_amount": 0.00,
                    "variance": 0.00,
                    "variance_percentage": 0.00
                },
                {
                    "account_id": "acc-002",
                    "account_code": "5100",
                    "account_name": "Travel Expenses",
                    "budgeted_amount": 50000.00,
                    "actual_amount": 0.00,
                    "variance": 0.00,
                    "variance_percentage": 0.00
                }
            ],
            "notes": "Annual budget for operations department"
        }
        
        success, budget_response = self.make_request('POST', 'accounting/budgets', budget_data, token=token)
        if success:
            budget_id = budget_response.get('id')
            budget_number = budget_response.get('budget_number')
            total_budget = budget_response.get('total_budget')
            self.log_result("Create Budget", True, f"Budget {budget_number} created, Total: {total_budget}")
            
            # Get budgets
            success, data = self.make_request('GET', 'accounting/budgets', token=token)
            if success:
                budgets_count = len(data)
                self.log_result("Get Budgets", True, f"Retrieved {budgets_count} budgets")
            else:
                self.log_result("Get Budgets", False, data.get('error', ''))
            
            # Get specific budget
            if budget_id:
                success, budget_detail = self.make_request('GET', f'accounting/budgets/{budget_id}', token=token)
                if success:
                    budget_name = budget_detail.get('budget_name')
                    self.log_result("Get Budget Detail", True, f"Retrieved budget: {budget_name}")
                else:
                    self.log_result("Get Budget Detail", False, budget_detail.get('error', ''))
                
                # Get budget vs actual report
                success, vs_actual = self.make_request('GET', f'accounting/budgets/{budget_id}/vs-actual', token=token)
                if success:
                    total_budget = vs_actual.get('total_budget')
                    total_actual = vs_actual.get('total_actual')
                    self.log_result("Budget vs Actual Report", True, f"Budget: {total_budget}, Actual: {total_actual}")
                else:
                    self.log_result("Budget vs Actual Report", False, vs_actual.get('error', ''))
                
                # Approve budget (test with Owner role)
                if "owner_ali" in self.user_tokens:
                    owner_token = self.user_tokens["owner_ali"]
                    success, approve_data = self.make_request('POST', f'accounting/budgets/{budget_id}/approve', token=owner_token)
                    if success:
                        self.log_result("Approve Budget", True, "Budget approved successfully")
                    else:
                        self.log_result("Approve Budget", False, approve_data.get('error', ''))
            
            return budget_id
        else:
            self.log_result("Create Budget", False, budget_response.get('error', ''))
            return None

    def test_enhanced_accounting_rbac_permissions(self):
        """Test RBAC permissions for enhanced accounting endpoints"""
        print("\n🔐 Testing Enhanced Accounting RBAC Permissions...")
        
        # Test Owner access (should have full access)
        if "owner_ali" in self.user_tokens:
            token = self.user_tokens["owner_ali"]
            
            success, data = self.make_request('GET', 'accounting/bank-accounts', token=token)
            if success:
                self.log_result("Owner Access Bank Accounts", True, "Owner has full access")
            else:
                self.log_result("Owner Access Bank Accounts", False, data.get('error', ''))
        
        # Test Accountant access (should have full access)
        if "accountant_fatima" in self.user_tokens:
            token = self.user_tokens["accountant_fatima"]
            
            success, data = self.make_request('GET', 'accounting/expense-claims', token=token)
            if success:
                self.log_result("Accountant Access Expense Claims", True, "Accountant has full access")
            else:
                self.log_result("Accountant Access Expense Claims", False, data.get('error', ''))
        
        # Test unauthorized access (Driver should get 403)
        if "driver_khalid" in self.user_tokens:
            token = self.user_tokens["driver_khalid"]
            
            success, data = self.make_request('GET', 'accounting/budgets', expected_status=403, token=token)
            if success:  # success means we got expected 403
                self.log_result("Driver Denied Enhanced Accounting", True, "Driver correctly denied access")
            else:
                self.log_result("Driver Denied Enhanced Accounting", False, "Driver should be denied access")

    def test_crm_tasks(self):
        """Test CRM Tasks functionality"""
        print("\n📋 Testing CRM Tasks...")
        
        if "owner_ali" not in self.user_tokens:
            self.log_result("CRM Tasks - No Token", False, "owner_ali not authenticated")
            return None
        
        token = self.user_tokens["owner_ali"]
        
        # Create task
        task_data = {
            "subject": "Follow up with lead",
            "description": "Call customer to discuss proposal",
            "assigned_to": "owner_ali",
            "related_to_type": "lead",
            "related_to_id": "test-lead-001",
            "due_date": "2025-02-01T00:00:00Z",
            "priority": "high"
        }
        
        success, task_response = self.make_request('POST', 'crm/tasks', task_data, token=token)
        if success:
            task_id = task_response.get('id')
            task_number = task_response.get('task_number')
            self.log_result("Create CRM Task", True, f"Task {task_number} created successfully")
            
            # Get tasks
            success, data = self.make_request('GET', 'crm/tasks', token=token)
            if success:
                tasks_count = len(data)
                self.log_result("Get CRM Tasks", True, f"Retrieved {tasks_count} tasks")
            else:
                self.log_result("Get CRM Tasks", False, data.get('error', ''))
            
            # Get specific task
            if task_id:
                success, task_detail = self.make_request('GET', f'crm/tasks/{task_id}', token=token)
                if success:
                    subject = task_detail.get('subject')
                    self.log_result("Get CRM Task Detail", True, f"Retrieved task: {subject}")
                else:
                    self.log_result("Get CRM Task Detail", False, task_detail.get('error', ''))
                
                # Complete task
                success, complete_data = self.make_request('POST', f'crm/tasks/{task_id}/complete?completion_notes=Task completed successfully', token=token)
                if success:
                    self.log_result("Complete CRM Task", True, "Task marked as completed")
                else:
                    self.log_result("Complete CRM Task", False, complete_data.get('error', ''))
            
            return task_id
        else:
            self.log_result("Create CRM Task", False, task_response.get('error', ''))
            return None

    def test_crm_activities(self):
        """Test CRM Activities functionality"""
        print("\n📞 Testing CRM Activities...")
        
        if "owner_ali" not in self.user_tokens:
            self.log_result("CRM Activities - No Token", False, "owner_ali not authenticated")
            return None
        
        token = self.user_tokens["owner_ali"]
        
        # Create activity
        activity_data = {
            "activity_type": "call",
            "subject": "Sales call with prospect",
            "description": "Discussed pricing and features",
            "related_to_type": "lead",
            "related_to_id": "test-lead-001",
            "activity_date": "2025-01-15T10:00:00Z",
            "duration_minutes": 30,
            "outcome": "Positive response",
            "next_step": "Send proposal"
        }
        
        success, activity_response = self.make_request('POST', 'crm/activities', activity_data, token=token)
        if success:
            activity_id = activity_response.get('id')
            activity_number = activity_response.get('activity_number')
            self.log_result("Create CRM Activity", True, f"Activity {activity_number} created successfully")
            
            # Get activities
            success, data = self.make_request('GET', 'crm/activities', token=token)
            if success:
                activities_count = len(data)
                self.log_result("Get CRM Activities", True, f"Retrieved {activities_count} activities")
            else:
                self.log_result("Get CRM Activities", False, data.get('error', ''))
            
            # Test filtering by activity type
            success, filtered_data = self.make_request('GET', 'crm/activities?activity_type=call', token=token)
            if success:
                filtered_count = len(filtered_data)
                self.log_result("Filter CRM Activities by Type", True, f"Retrieved {filtered_count} call activities")
            else:
                self.log_result("Filter CRM Activities by Type", False, filtered_data.get('error', ''))
            
            return activity_id
        else:
            self.log_result("Create CRM Activity", False, activity_response.get('error', ''))
            return None

    def test_crm_products(self):
        """Test CRM Products functionality"""
        print("\n🛍️ Testing CRM Products...")
        
        if "owner_ali" not in self.user_tokens:
            self.log_result("CRM Products - No Token", False, "owner_ali not authenticated")
            return None
        
        token = self.user_tokens["owner_ali"]
        
        # Create product
        product_data = {
            "product_code": "PROD-001",
            "product_name": "Enterprise License",
            "product_name_ar": "رخصة مؤسسية",
            "product_family": "Software",
            "description": "Annual enterprise software license",
            "list_price": 10000.00,
            "unit_of_measure": "license"
        }
        
        success, product_response = self.make_request('POST', 'crm/products', product_data, token=token)
        if success:
            product_id = product_response.get('id')
            product_code = product_response.get('product_code')
            self.log_result("Create CRM Product", True, f"Product {product_code} created successfully")
            
            # Get products
            success, data = self.make_request('GET', 'crm/products', token=token)
            if success:
                products_count = len(data)
                self.log_result("Get CRM Products", True, f"Retrieved {products_count} products")
            else:
                self.log_result("Get CRM Products", False, data.get('error', ''))
            
            # Test duplicate validation - try creating same product code again
            success, duplicate_response = self.make_request('POST', 'crm/products', product_data, expected_status=400, token=token)
            if success:  # success means we got expected 400
                self.log_result("CRM Product Duplicate Validation", True, "Duplicate product code correctly rejected")
            else:
                self.log_result("CRM Product Duplicate Validation", False, "Should reject duplicate product code")
            
            return product_id
        else:
            self.log_result("Create CRM Product", False, product_response.get('error', ''))
            return None

    def test_crm_contracts(self):
        """Test CRM Contracts functionality"""
        print("\n📄 Testing CRM Contracts...")
        
        if "owner_ali" not in self.user_tokens:
            self.log_result("CRM Contracts - No Token", False, "owner_ali not authenticated")
            return None
        
        token = self.user_tokens["owner_ali"]
        
        # Create contract
        contract_data = {
            "contract_name": "Software License Agreement 2025",
            "contract_name_ar": "اتفاقية ترخيص البرمجيات 2025",
            "contract_type": "subscription",
            "account_id": "test-account-001",
            "start_date": "2025-01-01T00:00:00Z",
            "end_date": "2025-12-31T23:59:59Z",
            "contract_value": 120000.00,
            "billing_frequency": "monthly",
            "owner_id": "owner_ali"
        }
        
        success, contract_response = self.make_request('POST', 'crm/contracts', contract_data, token=token)
        if success:
            contract_id = contract_response.get('id')
            contract_number = contract_response.get('contract_number')
            self.log_result("Create CRM Contract", True, f"Contract {contract_number} created successfully")
            
            # Get contracts
            success, data = self.make_request('GET', 'crm/contracts', token=token)
            if success:
                contracts_count = len(data)
                self.log_result("Get CRM Contracts", True, f"Retrieved {contracts_count} contracts")
            else:
                self.log_result("Get CRM Contracts", False, data.get('error', ''))
            
            # Activate contract
            if contract_id:
                success, activate_data = self.make_request('POST', f'crm/contracts/{contract_id}/activate', token=token)
                if success:
                    self.log_result("Activate CRM Contract", True, "Contract activated successfully")
                else:
                    self.log_result("Activate CRM Contract", False, activate_data.get('error', ''))
            
            return contract_id
        else:
            self.log_result("Create CRM Contract", False, contract_response.get('error', ''))
            return None

    def test_crm_email_templates(self):
        """Test CRM Email Templates functionality"""
        print("\n📧 Testing CRM Email Templates...")
        
        if "owner_ali" not in self.user_tokens:
            self.log_result("CRM Email Templates - No Token", False, "owner_ali not authenticated")
            return None
        
        token = self.user_tokens["owner_ali"]
        
        # Create email template
        template_data = {
            "template_code": "welcome_email",
            "template_name": "Welcome Email Template",
            "subject": "Welcome to our platform!",
            "body_html": "<html><body><h1>Welcome {{customer_name}}!</h1></body></html>",
            "available_merge_fields": ["customer_name", "company_name"]
        }
        
        success, template_response = self.make_request('POST', 'crm/email-templates', template_data, token=token)
        if success:
            template_id = template_response.get('id')
            template_code = template_response.get('template_code')
            self.log_result("Create Email Template", True, f"Template {template_code} created successfully")
            
            # Get email templates
            success, data = self.make_request('GET', 'crm/email-templates', token=token)
            if success:
                templates_count = len(data)
                self.log_result("Get Email Templates", True, f"Retrieved {templates_count} templates")
            else:
                self.log_result("Get Email Templates", False, data.get('error', ''))
            
            return template_id
        else:
            self.log_result("Create Email Template", False, template_response.get('error', ''))
            return None

    def test_crm_emails(self):
        """Test CRM Email Logging functionality"""
        print("\n📨 Testing CRM Email Logging...")
        
        if "owner_ali" not in self.user_tokens:
            self.log_result("CRM Emails - No Token", False, "owner_ali not authenticated")
            return None
        
        token = self.user_tokens["owner_ali"]
        
        # Create/log email
        email_data = {
            "to_email": "customer@example.com",
            "to_name": "Test Customer",
            "subject": "Welcome to our platform",
            "body_html": "<html><body>Welcome!</body></html>",
            "related_to_type": "lead",
            "related_to_id": "test-lead-001"
        }
        
        success, email_response = self.make_request('POST', 'crm/emails', email_data, token=token)
        if success:
            email_id = email_response.get('id')
            email_number = email_response.get('email_number')
            self.log_result("Create CRM Email Log", True, f"Email {email_number} logged successfully")
            
            # Get emails
            success, data = self.make_request('GET', 'crm/emails', token=token)
            if success:
                emails_count = len(data)
                self.log_result("Get CRM Emails", True, f"Retrieved {emails_count} email logs")
            else:
                self.log_result("Get CRM Emails", False, data.get('error', ''))
            
            return email_id
        else:
            self.log_result("Create CRM Email Log", False, email_response.get('error', ''))
            return None

    def test_crm_forecasts(self):
        """Test CRM Sales Forecasting functionality"""
        print("\n📈 Testing CRM Sales Forecasting...")
        
        if "owner_ali" not in self.user_tokens:
            self.log_result("CRM Forecasts - No Token", False, "owner_ali not authenticated")
            return None
        
        token = self.user_tokens["owner_ali"]
        
        # Create forecast
        forecast_data = {
            "forecast_name": "Q1 2025 Sales Forecast",
            "fiscal_year": 2025,
            "period": "quarterly",
            "period_name": "Q1 2025",
            "start_date": "2025-01-01T00:00:00Z",
            "end_date": "2025-03-31T23:59:59Z",
            "owner_id": "owner_ali",
            "territory": "KSA",
            "pipeline_amount": 500000.00,
            "best_case": 400000.00,
            "commit": 300000.00,
            "most_likely": 350000.00,
            "opportunities": []
        }
        
        success, forecast_response = self.make_request('POST', 'crm/forecasts', forecast_data, token=token)
        if success:
            forecast_id = forecast_response.get('id')
            forecast_number = forecast_response.get('forecast_number')
            self.log_result("Create CRM Forecast", True, f"Forecast {forecast_number} created successfully")
            
            # Get forecasts
            success, data = self.make_request('GET', 'crm/forecasts', token=token)
            if success:
                forecasts_count = len(data)
                self.log_result("Get CRM Forecasts", True, f"Retrieved {forecasts_count} forecasts")
            else:
                self.log_result("Get CRM Forecasts", False, data.get('error', ''))
            
            # Get specific forecast
            if forecast_id:
                success, forecast_detail = self.make_request('GET', f'crm/forecasts/{forecast_id}', token=token)
                if success:
                    forecast_name = forecast_detail.get('forecast_name')
                    self.log_result("Get CRM Forecast Detail", True, f"Retrieved forecast: {forecast_name}")
                else:
                    self.log_result("Get CRM Forecast Detail", False, forecast_detail.get('error', ''))
            
            # Test filtering by fiscal year
            success, filtered_data = self.make_request('GET', 'crm/forecasts?fiscal_year=2025', token=token)
            if success:
                filtered_count = len(filtered_data)
                self.log_result("Filter CRM Forecasts by Year", True, f"Retrieved {filtered_count} forecasts for 2025")
            else:
                self.log_result("Filter CRM Forecasts by Year", False, filtered_data.get('error', ''))
            
            return forecast_id
        else:
            self.log_result("Create CRM Forecast", False, forecast_response.get('error', ''))
            return None

    def test_crm_rbac_permissions(self):
        """Test RBAC permissions for CRM enhanced endpoints"""
        print("\n🔐 Testing CRM Enhanced RBAC Permissions...")
        
        # Test Owner access (should have full access)
        if "owner_ali" in self.user_tokens:
            token = self.user_tokens["owner_ali"]
            
            success, data = self.make_request('GET', 'crm/tasks', token=token)
            if success:
                self.log_result("Owner Access CRM Tasks", True, "Owner has full access")
            else:
                self.log_result("Owner Access CRM Tasks", False, data.get('error', ''))
        
        # Test Manager access (should have full access)
        if "manager_mohammad" in self.user_tokens:
            token = self.user_tokens["manager_mohammad"]
            
            success, data = self.make_request('GET', 'crm/activities', token=token)
            if success:
                self.log_result("Manager Access CRM Activities", True, "Manager has full access")
            else:
                self.log_result("Manager Access CRM Activities", False, data.get('error', ''))
        
        # Test Accountant access (should have read-only access)
        if "accountant_fatima" in self.user_tokens:
            token = self.user_tokens["accountant_fatima"]
            
            success, data = self.make_request('GET', 'crm/products', token=token)
            if success:
                self.log_result("Accountant Read CRM Products", True, "Accountant has read access")
            else:
                self.log_result("Accountant Read CRM Products", False, data.get('error', ''))
            
            # Accountant should not be able to create
            test_task = {
                "subject": "Test task",
                "description": "Test description",
                "assigned_to": "accountant_fatima",
                "priority": "normal"
            }
            success, data = self.make_request('POST', 'crm/tasks', test_task, expected_status=403, token=token)
            if success:  # success means we got expected 403
                self.log_result("Accountant Denied CRM Task Creation", True, "Accountant correctly denied write access")
            else:
                self.log_result("Accountant Denied CRM Task Creation", False, "Accountant should be denied write access")

    def test_file_upload_download(self):
        """Test File Upload and Download functionality"""
        print("\n📁 Testing File Upload & Download...")
        
        if "owner_ali" not in self.user_tokens:
            self.log_result("File Upload - No Token", False, "owner_ali not authenticated")
            return None
        
        token = self.user_tokens["owner_ali"]
        
        # Create a test file content
        test_file_content = "This is a test file for upload functionality.\nLine 2 of test content."
        test_filename = "test_document.txt"
        
        # Prepare multipart form data for file upload
        files = {
            'file': (test_filename, test_file_content, 'text/plain')
        }
        data = {
            'related_to_type': 'expense_claim',
            'related_to_id': 'test-claim-001'
        }
        
        # Upload file
        url = f"{self.api_url}/files/upload"
        headers = {'Authorization': f'Bearer {token}'}
        
        try:
            import requests
            response = requests.post(url, files=files, data=data, headers=headers, timeout=10)
            
            if response.status_code == 200:
                upload_data = response.json()
                file_id = upload_data.get('file_id')
                filename = upload_data.get('filename')
                file_size = upload_data.get('file_size')
                
                self.log_result("File Upload", True, f"File '{filename}' uploaded, ID: {file_id}, Size: {file_size}")
                
                # Test file listing
                success, list_data = self.make_request('GET', 'files/', token=token)
                if success:
                    files_count = len(list_data)
                    self.log_result("File Listing", True, f"Retrieved {files_count} files")
                else:
                    self.log_result("File Listing", False, list_data.get('error', ''))
                
                # Test file metadata retrieval
                if file_id:
                    success, meta_data = self.make_request('GET', f'files/{file_id}', token=token)
                    if success:
                        original_filename = meta_data.get('original_filename')
                        self.log_result("File Metadata", True, f"Retrieved metadata for: {original_filename}")
                    else:
                        self.log_result("File Metadata", False, meta_data.get('error', ''))
                    
                    # Test file download
                    download_url = f"{self.api_url}/files/{file_id}/download"
                    download_response = requests.get(download_url, headers=headers, timeout=10)
                    
                    if download_response.status_code == 200:
                        downloaded_content = download_response.text
                        content_match = downloaded_content.strip() == test_file_content.strip()
                        self.log_result("File Download", content_match, 
                                       "Downloaded content matches uploaded content" if content_match 
                                       else "Content mismatch")
                    else:
                        self.log_result("File Download", False, f"Download failed: {download_response.status_code}")
                    
                    # Test file deletion (soft delete)
                    success, delete_data = self.make_request('DELETE', f'files/{file_id}', token=token)
                    if success:
                        self.log_result("File Deletion", True, "File marked as deleted")
                    else:
                        self.log_result("File Deletion", False, delete_data.get('error', ''))
                
                return file_id
            else:
                self.log_result("File Upload", False, f"Upload failed: {response.status_code} - {response.text}")
                return None
                
        except Exception as e:
            self.log_result("File Upload", False, f"Upload error: {str(e)}")
            return None

    def test_csv_export_endpoints(self):
        """Test CSV Export functionality"""
        print("\n📊 Testing CSV Export Endpoints...")
        
        if "accountant_fatima" not in self.user_tokens:
            self.log_result("CSV Export - No Token", False, "accountant_fatima not authenticated")
            return
        
        token = self.user_tokens["accountant_fatima"]
        
        # Test accounting exports
        accounting_exports = [
            ('accounts', 'Chart of Accounts'),
            ('vendors', 'Vendors'),
            ('customers', 'Customers'),
            ('expense-claims', 'Expense Claims')
        ]
        
        for endpoint, description in accounting_exports:
            url = f"{self.api_url}/csv/export/{endpoint}"
            headers = {'Authorization': f'Bearer {token}'}
            
            try:
                import requests
                response = requests.get(url, headers=headers, timeout=10)
                
                if response.status_code == 200:
                    content_type = response.headers.get('content-type', '')
                    is_csv = 'text/csv' in content_type
                    has_content = len(response.content) > 0
                    
                    self.log_result(f"CSV Export {description}", is_csv and has_content,
                                   f"CSV file generated, Size: {len(response.content)} bytes" if is_csv and has_content
                                   else f"Invalid response: {content_type}")
                else:
                    self.log_result(f"CSV Export {description}", False, 
                                   f"Export failed: {response.status_code}")
            except Exception as e:
                self.log_result(f"CSV Export {description}", False, f"Export error: {str(e)}")
        
        # Test CRM exports (if user has permissions)
        crm_exports = [
            ('leads', 'Leads'),
            ('contacts', 'Contacts'),
            ('opportunities', 'Opportunities'),
            ('tasks', 'Tasks')
        ]
        
        for endpoint, description in crm_exports:
            url = f"{self.api_url}/csv/export/{endpoint}"
            headers = {'Authorization': f'Bearer {token}'}
            
            try:
                response = requests.get(url, headers=headers, timeout=10)
                
                if response.status_code == 200:
                    content_type = response.headers.get('content-type', '')
                    is_csv = 'text/csv' in content_type
                    self.log_result(f"CSV Export {description}", is_csv,
                                   f"CSV file generated" if is_csv else f"Invalid content type: {content_type}")
                elif response.status_code == 403:
                    self.log_result(f"CSV Export {description}", True, "Correctly denied access (403)")
                else:
                    self.log_result(f"CSV Export {description}", False, 
                                   f"Unexpected status: {response.status_code}")
            except Exception as e:
                self.log_result(f"CSV Export {description}", False, f"Export error: {str(e)}")
        
        # Test warehouse exports
        warehouse_exports = [
            ('products', 'Products'),
            ('stock-balance', 'Stock Balance')
        ]
        
        for endpoint, description in warehouse_exports:
            url = f"{self.api_url}/csv/export/{endpoint}"
            headers = {'Authorization': f'Bearer {token}'}
            
            try:
                response = requests.get(url, headers=headers, timeout=10)
                
                if response.status_code == 200:
                    content_type = response.headers.get('content-type', '')
                    is_csv = 'text/csv' in content_type
                    self.log_result(f"CSV Export {description}", is_csv,
                                   f"CSV file generated" if is_csv else f"Invalid content type: {content_type}")
                elif response.status_code == 403:
                    self.log_result(f"CSV Export {description}", True, "Correctly denied access (403)")
                else:
                    self.log_result(f"CSV Export {description}", False, 
                                   f"Unexpected status: {response.status_code}")
            except Exception as e:
                self.log_result(f"CSV Export {description}", False, f"Export error: {str(e)}")

    def test_csv_import_endpoints(self):
        """Test CSV Import functionality"""
        print("\n📥 Testing CSV Import Endpoints...")
        
        if "accountant_fatima" not in self.user_tokens:
            self.log_result("CSV Import - No Token", False, "accountant_fatima not authenticated")
            return
        
        token = self.user_tokens["accountant_fatima"]
        
        # Test vendor import
        vendor_csv_content = """vendor_code,vendor_name,email,phone
V002,Test Vendor Import,vendor@test.com,+966501234567
V003,Another Vendor,vendor2@test.com,+966501234568"""
        
        self._test_csv_import('vendors', 'Vendors', vendor_csv_content, token)
        
        # Test customer import
        customer_csv_content = """customer_code,customer_name,email,phone
C002,Test Customer Import,customer@test.com,+966501234569
C003,Another Customer,customer2@test.com,+966501234570"""
        
        self._test_csv_import('customers', 'Customers', customer_csv_content, token)
        
        # Test leads import
        leads_csv_content = """name,company,email,phone,lead_source,status
John Doe,ABC Company,john@abc.com,+966501234571,website,new
Jane Smith,XYZ Corp,jane@xyz.com,+966501234572,referral,qualified"""
        
        self._test_csv_import('leads', 'Leads', leads_csv_content, token)
        
        # Test products import
        products_csv_content = """sku,name,category,unit_price,cost_price
PROD-002,Test Product Import,electronics,1000.00,800.00
PROD-003,Another Product,furniture,500.00,400.00"""
        
        self._test_csv_import('products', 'Products', products_csv_content, token)

    def _test_csv_import(self, endpoint: str, description: str, csv_content: str, token: str):
        """Helper method to test CSV import"""
        url = f"{self.api_url}/csv/import/{endpoint}"
        headers = {'Authorization': f'Bearer {token}'}
        
        files = {
            'file': (f'{endpoint}.csv', csv_content, 'text/csv')
        }
        
        try:
            import requests
            response = requests.post(url, files=files, headers=headers, timeout=10)
            
            if response.status_code == 200:
                result = response.json()
                success = result.get('success', False)
                imported_count = result.get('imported_count', 0)
                errors = result.get('errors', [])
                
                if success and imported_count > 0:
                    self.log_result(f"CSV Import {description}", True, 
                                   f"Imported {imported_count} records successfully")
                else:
                    error_msg = f"Import failed: {errors}" if errors else "No records imported"
                    self.log_result(f"CSV Import {description}", False, error_msg)
            elif response.status_code == 403:
                self.log_result(f"CSV Import {description}", True, "Correctly denied access (403)")
            else:
                self.log_result(f"CSV Import {description}", False, 
                               f"Import failed: {response.status_code} - {response.text}")
        except Exception as e:
            self.log_result(f"CSV Import {description}", False, f"Import error: {str(e)}")

    def test_file_csv_rbac_permissions(self):
        """Test RBAC permissions for file and CSV operations"""
        print("\n🔐 Testing File & CSV RBAC Permissions...")
        
        # Test with different roles
        test_cases = [
            ("owner_ali", "Owner", True),
            ("accountant_fatima", "Accountant", True),
            ("manager_mohammad", "Manager", True),
            ("driver_khalid", "Driver", False)  # Should be denied
        ]
        
        for username, role_name, should_have_access in test_cases:
            if username not in self.user_tokens:
                continue
            
            token = self.user_tokens[username]
            
            # Test file listing access
            success, data = self.make_request('GET', 'files/', 
                                            expected_status=200 if should_have_access else 403, 
                                            token=token)
            
            if should_have_access:
                result_msg = "✓ Has file access" if success else f"✗ Should have access: {data.get('error', '')}"
            else:
                result_msg = "✓ Correctly denied file access" if success else f"✗ Should be denied access"
            
            self.log_result(f"File Access - {role_name}", 
                           success if should_have_access else success, result_msg)
            
            # Test CSV export access (accounting)
            success, data = self.make_request('GET', 'csv/export/accounts',
                                            expected_status=200 if should_have_access else 403,
                                            token=token)
            
            if should_have_access:
                result_msg = "✓ Has CSV export access" if success else f"✗ Should have access: {data.get('error', '')}"
            else:
                result_msg = "✓ Correctly denied CSV access" if success else f"✗ Should be denied access"
            
            self.log_result(f"CSV Export Access - {role_name}", 
                           success if should_have_access else success, result_msg)

    def run_all_tests(self):
        """Run comprehensive test suite including RBAC, Accounting, and CRM"""
        print("🚀 Starting Comprehensive Backend API Testing for Khairat Al Ardh Operations Management System")
        print("=" * 100)
        print("Testing RBAC System + Oracle-like Accounting System + Enhanced Accounting + Enhanced CRM Features")
        print("=" * 100)
        print("Testing 7 different roles with specific permissions:")
        for username, user_info in self.test_users.items():
            print(f"  👤 {user_info['role'].upper():12} | {username:20} | {user_info['full_name']}")
        print("=" * 100)
        
        # Run RBAC tests first
        self.test_health_check()
        self.test_user_authentication()
        self.test_user_permissions_context()
        
        # Run comprehensive accounting system tests
        print("\n" + "🏦" * 50)
        print("ORACLE-LIKE ACCOUNTING SYSTEM TESTING")
        print("🏦" * 50)
        
        created_accounts = self.test_accounting_chart_of_accounts()
        self.test_accounting_journal_entries(created_accounts)
        self.test_accounting_vendors_and_bills()
        self.test_accounting_customers_and_invoices()
        self.test_accounting_fixed_assets(created_accounts)
        self.test_accounting_tax_configuration(created_accounts)
        self.test_accounting_exchange_rates()
        self.test_accounting_financial_reports()
        self.test_accounting_rbac_permissions()
        
        # Run Phase 1 Enhanced Accounting Features tests
        print("\n" + "💎" * 50)
        print("PHASE 1: ENHANCED ACCOUNTING FEATURES TESTING")
        print("💎" * 50)
        
        bank_account_id = self.test_enhanced_accounting_bank_accounts()
        statement_id = self.test_enhanced_accounting_bank_statements(bank_account_id)
        self.test_enhanced_accounting_bank_reconciliation(statement_id)
        self.test_enhanced_accounting_expense_claims()
        self.test_enhanced_accounting_budgets()
        self.test_enhanced_accounting_rbac_permissions()
        
        # Run Phase 2 Enhanced CRM Features tests
        print("\n" + "🎯" * 50)
        print("PHASE 2: ENHANCED CRM FEATURES TESTING")
        print("🎯" * 50)
        
        self.test_crm_tasks()
        self.test_crm_activities()
        self.test_crm_products()
        self.test_crm_contracts()
        self.test_crm_email_templates()
        self.test_crm_emails()
        self.test_crm_forecasts()
        self.test_crm_rbac_permissions()
        
        # Run File Upload & CSV Import/Export tests
        print("\n" + "📁" * 50)
        print("FILE UPLOAD & CSV IMPORT/EXPORT TESTING")
        print("📁" * 50)
        
        self.test_file_upload_download()
        self.test_csv_export_endpoints()
        self.test_csv_import_endpoints()
        self.test_file_csv_rbac_permissions()
        
        # Run remaining RBAC tests
        print("\n" + "🔐" * 50)
        print("RBAC SYSTEM TESTING")
        print("🔐" * 50)
        
        self.test_equipment_permissions()
        self.test_production_permissions()
        self.test_expenses_permissions()
        self.test_invoices_permissions()
        self.test_attendance_permissions()
        self.test_dashboard_permissions()
        
        # Print final results
        print("\n" + "=" * 100)
        print("📋 COMPREHENSIVE TESTING FINAL RESULTS")
        print("=" * 100)
        print(f"✅ Tests Passed: {self.tests_passed}/{self.tests_run}")
        print(f"❌ Tests Failed: {len(self.failed_tests)}/{self.tests_run}")
        print(f"📊 Success Rate: {(self.tests_passed/self.tests_run)*100:.1f}%")
        
        if self.failed_tests:
            print("\n❌ FAILED TESTS:")
            for i, failure in enumerate(self.failed_tests, 1):
                print(f"{i}. {failure['test']}: {failure['details']}")
        
        print(f"\n🏢 Company ID: {self.company_id}")
        print(f"🔑 Authenticated Users: {len(self.user_tokens)}/{len(self.test_users)}")
        
        return self.tests_passed == self.tests_run

def main():
    """Main test execution"""
    tester = ComprehensiveAPITester()
    
    try:
        success = tester.run_all_tests()
        return 0 if success else 1
    except Exception as e:
        print(f"\n💥 CRITICAL ERROR: {str(e)}")
        return 1

if __name__ == "__main__":
    sys.exit(main())