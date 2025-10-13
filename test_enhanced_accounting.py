#!/usr/bin/env python3
"""
Focused test for Phase 1 Enhanced Accounting Features
"""

import requests
import sys
import json
from datetime import datetime, timezone, timedelta

class EnhancedAccountingTester:
    def __init__(self, base_url: str = "https://erp-khairit.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.tests_run = 0
        self.tests_passed = 0
        self.failed_tests = []
        self.user_tokens = {}
        
        # Test users
        self.test_users = {
            "owner_ali": {"role": "owner", "password": "password123"},
            "accountant_fatima": {"role": "accountant", "password": "password123"},
            "manager_mohammad": {"role": "manager", "password": "password123"},
            "driver_khalid": {"role": "driver", "password": "password123"}
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
    
    def make_request(self, method: str, endpoint: str, data=None, expected_status: int = 200, token: str = None):
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
                return False, {"error": error_detail}
            
            return True, response_data
            
        except requests.exceptions.RequestException as e:
            return False, {"error": f"Request failed: {str(e)}"}
    
    def authenticate_users(self):
        """Authenticate test users"""
        print("🔐 Authenticating test users...")
        
        for username, user_info in self.test_users.items():
            login_data = {
                "username": username,
                "password": user_info["password"]
            }
            
            success, data = self.make_request('POST', 'login', login_data, 200)
            if success and data.get('access_token'):
                self.user_tokens[username] = data['access_token']
                self.log_result(f"Login {username}", True, f"Token received")
            else:
                self.log_result(f"Login {username}", False, data.get('error', 'Login failed'))
    
    def test_bank_accounts(self):
        """Test Bank Accounts functionality"""
        print("\n🏦 Testing Bank Accounts...")
        
        # Test with Owner
        if "owner_ali" not in self.user_tokens:
            self.log_result("Bank Accounts - No Owner Token", False, "owner_ali not authenticated")
            return None
        
        token = self.user_tokens["owner_ali"]
        
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
        
        success, response = self.make_request('POST', 'accounting/bank-accounts', bank_account_data, token=token)
        if success:
            bank_account_id = response.get('id')
            account_name = response.get('account_name')
            self.log_result("Create Bank Account (Owner)", True, f"Account '{account_name}' created")
            
            # Test with Accountant
            if "accountant_fatima" in self.user_tokens:
                acc_token = self.user_tokens["accountant_fatima"]
                success, data = self.make_request('GET', 'accounting/bank-accounts', token=acc_token)
                if success:
                    self.log_result("Get Bank Accounts (Accountant)", True, f"Retrieved {len(data)} accounts")
                else:
                    self.log_result("Get Bank Accounts (Accountant)", False, data.get('error', ''))
            
            return bank_account_id
        else:
            self.log_result("Create Bank Account (Owner)", False, response.get('error', ''))
            return None
    
    def test_expense_claims(self):
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
                }
            ],
            "notes": "Test expense claim"
        }
        
        success, response = self.make_request('POST', 'accounting/expense-claims', expense_claim_data, token=token)
        if success:
            claim_id = response.get('id')
            claim_number = response.get('claim_number')
            self.log_result("Create Expense Claim", True, f"Claim {claim_number} created")
            
            # Submit and approve
            if claim_id:
                success, _ = self.make_request('POST', f'accounting/expense-claims/{claim_id}/submit', token=token)
                if success:
                    self.log_result("Submit Expense Claim", True, "Claim submitted")
                    
                    # Test approval with Manager
                    if "manager_mohammad" in self.user_tokens:
                        mgr_token = self.user_tokens["manager_mohammad"]
                        success, _ = self.make_request('POST', f'accounting/expense-claims/{claim_id}/approve', token=mgr_token)
                        if success:
                            self.log_result("Approve Expense Claim (Manager)", True, "Claim approved")
                        else:
                            self.log_result("Approve Expense Claim (Manager)", False, "Manager should be able to approve")
                else:
                    self.log_result("Submit Expense Claim", False, "Failed to submit")
            
            return claim_id
        else:
            self.log_result("Create Expense Claim", False, response.get('error', ''))
            return None
    
    def test_budgets(self):
        """Test Budget Management functionality"""
        print("\n📊 Testing Budget Management...")
        
        if "accountant_fatima" not in self.user_tokens:
            self.log_result("Budgets - No Token", False, "accountant_fatima not authenticated")
            return None
        
        token = self.user_tokens["accountant_fatima"]
        
        # Create budget
        budget_data = {
            "budget_name": "Test Budget 2025",
            "budget_name_ar": "ميزانية اختبار 2025",
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
                }
            ],
            "notes": "Test budget"
        }
        
        success, response = self.make_request('POST', 'accounting/budgets', budget_data, token=token)
        if success:
            budget_id = response.get('id')
            budget_number = response.get('budget_number')
            self.log_result("Create Budget", True, f"Budget {budget_number} created")
            
            # Test budget vs actual
            if budget_id:
                success, vs_actual = self.make_request('GET', f'accounting/budgets/{budget_id}/vs-actual', token=token)
                if success:
                    self.log_result("Budget vs Actual Report", True, "Report generated")
                else:
                    self.log_result("Budget vs Actual Report", False, vs_actual.get('error', ''))
            
            return budget_id
        else:
            self.log_result("Create Budget", False, response.get('error', ''))
            return None
    
    def test_rbac_permissions(self):
        """Test RBAC permissions for enhanced accounting"""
        print("\n🔐 Testing RBAC Permissions...")
        
        # Test unauthorized access (Driver should get 403)
        if "driver_khalid" in self.user_tokens:
            token = self.user_tokens["driver_khalid"]
            
            success, data = self.make_request('GET', 'accounting/bank-accounts', expected_status=403, token=token)
            if success:  # success means we got expected 403
                self.log_result("Driver Denied Bank Accounts", True, "Driver correctly denied access")
            else:
                self.log_result("Driver Denied Bank Accounts", False, "Driver should be denied access")
    
    def run_tests(self):
        """Run all enhanced accounting tests"""
        print("🚀 Testing Phase 1: Enhanced Accounting Features")
        print("=" * 60)
        
        self.authenticate_users()
        
        print("\n💎 ENHANCED ACCOUNTING FEATURES TESTING")
        print("💎" * 40)
        
        self.test_bank_accounts()
        self.test_expense_claims()
        self.test_budgets()
        self.test_rbac_permissions()
        
        # Print results
        print("\n" + "=" * 60)
        print("📋 ENHANCED ACCOUNTING TEST RESULTS")
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
    tester = EnhancedAccountingTester()
    
    try:
        success = tester.run_tests()
        return 0 if success else 1
    except Exception as e:
        print(f"\n💥 CRITICAL ERROR: {str(e)}")
        return 1

if __name__ == "__main__":
    sys.exit(main())