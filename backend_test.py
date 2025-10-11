#!/usr/bin/env python3
"""
RBAC Backend API Testing for Khairat Al Ardh Operations Management System
Tests Role-Based Access Control with 7 different roles and their specific permissions.
"""

import requests
import sys
import json
from datetime import datetime, timezone
from typing import Dict, Any, Optional

class RBACAPITester:
    def __init__(self, base_url: str = "https://agriman.preview.emergentagent.com"):
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
    
    def test_costing_centers(self):
        """Test costing centers management"""
        print("\n🏭 Testing Costing Centers...")
        
        if not self.token:
            self.log_result("Costing Centers Tests", False, "No authentication token available")
            return
        
        # Test create costing center
        center_data = {
            "name": "SCREENING",
            "description": "Screening operations center"
        }
        
        success, data = self.make_request('POST', 'costing-centers', center_data, 200)
        self.log_result("Create Costing Center", success,
                       f"Center Name: {data.get('name', 'Unknown')}" if success else data.get('error', ''))
        
        if success:
            self.test_data['costing_center_id'] = data.get('id')
            
            # Test get all costing centers
            success, data = self.make_request('GET', 'costing-centers')
            self.log_result("Get All Costing Centers", success,
                           f"Count: {len(data) if isinstance(data, list) else 'Unknown'}" if success else data.get('error', ''))
    
    def test_attendance_management(self):
        """Test attendance CRUD operations"""
        print("\n👥 Testing Attendance Management...")
        
        if not self.token:
            self.log_result("Attendance Tests", False, "No authentication token available")
            return
        
        # Test create attendance record
        attendance_data = {
            "employee_name": "أحمد محمد",
            "date": datetime.now(timezone.utc).isoformat(),
            "check_in": datetime.now(timezone.utc).replace(hour=8, minute=0).isoformat(),
            "check_out": datetime.now(timezone.utc).replace(hour=17, minute=0).isoformat(),
            "hours_worked": 8.0,
            "overtime_hours": 1.0,
            "notes": "Regular work day with 1 hour overtime"
        }
        
        success, data = self.make_request('POST', 'attendance', attendance_data, 200)
        self.log_result("Create Attendance Record", success,
                       f"Employee: {data.get('employee_name', 'Unknown')}" if success else data.get('error', ''))
        
        if success:
            self.test_data['attendance_id'] = data.get('id')
            
            # Test get all attendance records
            success, data = self.make_request('GET', 'attendance')
            self.log_result("Get All Attendance Records", success,
                           f"Count: {len(data) if isinstance(data, list) else 'Unknown'}" if success else data.get('error', ''))
    
    def test_dashboard_analytics(self):
        """Test dashboard analytics endpoint"""
        print("\n📊 Testing Dashboard Analytics...")
        
        if not self.token:
            self.log_result("Dashboard Tests", False, "No authentication token available")
            return
        
        # Test dashboard stats
        success, data = self.make_request('GET', 'dashboard/stats')
        self.log_result("Dashboard Statistics", success,
                       f"Equipment Count: {data.get('equipment_count', 'Unknown')}" if success else data.get('error', ''))
        
        if success:
            # Validate dashboard data structure
            required_keys = ['production', 'expenses', 'equipment_count', 'invoices', 'month']
            missing_keys = [key for key in required_keys if key not in data]
            
            if not missing_keys:
                self.log_result("Dashboard Data Structure", True, "All required keys present")
            else:
                self.log_result("Dashboard Data Structure", False, f"Missing keys: {missing_keys}")
    
    def run_all_tests(self):
        """Run comprehensive test suite"""
        print("🚀 Starting Comprehensive Backend API Testing for Khairat Al Ardh Operations Management System")
        print("=" * 80)
        
        # Run all test categories
        self.test_health_check()
        self.test_authentication()
        self.test_equipment_management()
        self.test_costing_centers()
        self.test_production_management()
        self.test_expense_management()
        self.test_invoice_management()
        self.test_attendance_management()
        self.test_dashboard_analytics()
        
        # Print final results
        print("\n" + "=" * 80)
        print("📋 FINAL TEST RESULTS")
        print("=" * 80)
        print(f"✅ Tests Passed: {self.tests_passed}/{self.tests_run}")
        print(f"❌ Tests Failed: {len(self.failed_tests)}/{self.tests_run}")
        print(f"📊 Success Rate: {(self.tests_passed/self.tests_run)*100:.1f}%")
        
        if self.failed_tests:
            print("\n❌ FAILED TESTS:")
            for i, failure in enumerate(self.failed_tests, 1):
                print(f"{i}. {failure['test']}: {failure['details']}")
        
        print("\n🔍 Test Data Created:")
        for key, value in self.test_data.items():
            print(f"  - {key}: {value}")
        
        return self.tests_passed == self.tests_run

def main():
    """Main test execution"""
    tester = KhairatAPITester()
    
    try:
        success = tester.run_all_tests()
        return 0 if success else 1
    except Exception as e:
        print(f"\n💥 CRITICAL ERROR: {str(e)}")
        return 1

if __name__ == "__main__":
    sys.exit(main())