#!/usr/bin/env python3
"""
Test only CRM Enhanced Features
"""

import requests
import sys
import json
from datetime import datetime, timezone, timedelta
from typing import Dict, Any, Optional

class CRMTester:
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
    
    def test_user_authentication(self):
        """Test authentication for CRM users"""
        print("\n🔐 Testing CRM User Authentication...")
        
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

    def run_crm_tests(self):
        """Run CRM test suite"""
        print("🎯 Starting CRM Enhanced Features Testing")
        print("=" * 60)
        
        self.test_user_authentication()
        self.test_crm_tasks()
        self.test_crm_activities()
        self.test_crm_contracts()
        
        # Print final results
        print("\n" + "=" * 60)
        print("📋 CRM TESTING FINAL RESULTS")
        print("=" * 60)
        print(f"✅ Tests Passed: {self.tests_passed}/{self.tests_run}")
        print(f"❌ Tests Failed: {len(self.failed_tests)}/{self.tests_run}")
        print(f"📊 Success Rate: {(self.tests_passed/self.tests_run)*100:.1f}%")
        
        if self.failed_tests:
            print("\n❌ FAILED TESTS:")
            for i, failure in enumerate(self.failed_tests, 1):
                print(f"{i}. {failure['test']}: {failure['details']}")
        
        return self.tests_passed == self.tests_run

def main():
    """Main test execution"""
    tester = CRMTester()
    
    try:
        success = tester.run_crm_tests()
        return 0 if success else 1
    except Exception as e:
        print(f"\n💥 CRITICAL ERROR: {str(e)}")
        return 1

if __name__ == "__main__":
    sys.exit(main())