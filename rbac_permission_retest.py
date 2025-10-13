#!/usr/bin/env python3
"""
RBAC Permission Re-verification Test
Tests the 3 specific permission fixes made in models.py ROLE_PERMISSIONS
"""

import requests
import sys
import json
from datetime import datetime, timezone
from typing import Dict, Any, Optional

class RBACPermissionRetest:
    def __init__(self, base_url: str = "https://company-dashboard-5.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.tests_run = 0
        self.tests_passed = 0
        self.failed_tests = []
        self.user_tokens = {}
        
        # Test users for the specific scenarios
        self.test_users = {
            "accountant_fatima": {"role": "accountant", "password": "password123"},
            "foreman_ahmed": {"role": "foreman", "password": "password123"}
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
            
            success = response.status_code == expected_status
            
            try:
                response_data = response.json()
            except:
                response_data = {"raw_response": response.text}
            
            if not success:
                error_detail = f"Status: {response.status_code}, Expected: {expected_status}, Response: {response.text[:200]}"
                return False, {"error": error_detail, "status_code": response.status_code}
            
            return True, response_data
            
        except requests.exceptions.RequestException as e:
            return False, {"error": f"Request failed: {str(e)}"}
    
    def authenticate_users(self):
        """Authenticate the required test users"""
        print("🔐 Authenticating test users...")
        
        for username, user_info in self.test_users.items():
            login_data = {
                "username": username,
                "password": user_info["password"]
            }
            
            success, data = self.make_request('POST', 'login', login_data, 200)
            if success and data.get('access_token'):
                self.user_tokens[username] = data['access_token']
                print(f"✅ {username} ({user_info['role']}) authenticated successfully")
            else:
                print(f"❌ {username} ({user_info['role']}) authentication failed: {data.get('error', 'Unknown error')}")
                return False
        
        return len(self.user_tokens) == len(self.test_users)
    
    def test_equipment_accountant_denied(self):
        """Test 1: Equipment - Accountant should now be DENIED (403)"""
        print("\n🚛 Test 1: Equipment GET - Accountant (should be DENIED)")
        
        if "accountant_fatima" not in self.user_tokens:
            self.log_result("Equipment GET - Accountant", False, "User not authenticated")
            return
        
        success, data = self.make_request('GET', 'equipment', 
                                        expected_status=403, 
                                        token=self.user_tokens["accountant_fatima"])
        
        if success:
            self.log_result("Equipment GET - Accountant DENIED", True, 
                           "✓ Correctly denied access (403 Forbidden)")
        else:
            actual_status = data.get('status_code', 'Unknown')
            self.log_result("Equipment GET - Accountant DENIED", False, 
                           f"✗ Expected 403 but got {actual_status}: {data.get('error', '')}")
    
    def test_equipment_foreman_create(self):
        """Test 2: Equipment - Foreman CREATE should now SUCCEED (200)"""
        print("\n🚛 Test 2: Equipment POST - Foreman (should SUCCEED)")
        
        if "foreman_ahmed" not in self.user_tokens:
            self.log_result("Equipment POST - Foreman", False, "User not authenticated")
            return
        
        equipment_data = {
            "name": "Test Equipment",
            "type": "Excavator", 
            "model": "CAT 320",
            "status": "active"
        }
        
        success, data = self.make_request('POST', 'equipment', equipment_data,
                                        expected_status=200,
                                        token=self.user_tokens["foreman_ahmed"])
        
        if success:
            equipment_id = data.get('id', 'Unknown')
            self.log_result("Equipment POST - Foreman CREATE", True, 
                           f"✓ Successfully created equipment: {equipment_id}")
        else:
            actual_status = data.get('status_code', 'Unknown')
            self.log_result("Equipment POST - Foreman CREATE", False, 
                           f"✗ Expected 200 but got {actual_status}: {data.get('error', '')}")
    
    def test_attendance_accountant_create(self):
        """Test 3: Attendance - Accountant CREATE should now SUCCEED (200)"""
        print("\n👥 Test 3: Attendance POST - Accountant (should SUCCEED)")
        
        if "accountant_fatima" not in self.user_tokens:
            self.log_result("Attendance POST - Accountant", False, "User not authenticated")
            return
        
        attendance_data = {
            "employee_name": "Test Employee",
            "date": "2025-01-11",
            "status": "present"
        }
        
        success, data = self.make_request('POST', 'attendance', attendance_data,
                                        expected_status=200,
                                        token=self.user_tokens["accountant_fatima"])
        
        if success:
            attendance_id = data.get('id', 'Unknown')
            self.log_result("Attendance POST - Accountant CREATE", True, 
                           f"✓ Successfully created attendance: {attendance_id}")
        else:
            actual_status = data.get('status_code', 'Unknown')
            self.log_result("Attendance POST - Accountant CREATE", False, 
                           f"✗ Expected 200 but got {actual_status}: {data.get('error', '')}")
    
    def run_permission_retest(self):
        """Run the 3 specific permission re-verification tests"""
        print("🔄 RBAC Permission Re-verification Test")
        print("=" * 60)
        print("Testing 3 specific permission fixes:")
        print("1. Equipment - Accountant (should now FAIL)")
        print("2. Equipment - Foreman Create (should now SUCCEED)")
        print("3. Attendance - Accountant Create (should now SUCCEED)")
        print("=" * 60)
        
        # Authenticate users
        if not self.authenticate_users():
            print("❌ Authentication failed. Cannot proceed with tests.")
            return False
        
        # Run the 3 specific tests
        self.test_equipment_accountant_denied()
        self.test_equipment_foreman_create()
        self.test_attendance_accountant_create()
        
        # Print results
        print("\n" + "=" * 60)
        print("📋 PERMISSION RE-VERIFICATION RESULTS")
        print("=" * 60)
        print(f"✅ Tests Passed: {self.tests_passed}/{self.tests_run}")
        print(f"❌ Tests Failed: {len(self.failed_tests)}/{self.tests_run}")
        
        if self.failed_tests:
            print("\n❌ FAILED TESTS:")
            for i, failure in enumerate(self.failed_tests, 1):
                print(f"{i}. {failure['test']}: {failure['details']}")
        else:
            print("\n🎉 All permission fixes verified successfully!")
        
        return len(self.failed_tests) == 0

def main():
    """Main test execution"""
    tester = RBACPermissionRetest()
    
    try:
        success = tester.run_permission_retest()
        return 0 if success else 1
    except Exception as e:
        print(f"\n💥 CRITICAL ERROR: {str(e)}")
        return 1

if __name__ == "__main__":
    sys.exit(main())