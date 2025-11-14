#!/usr/bin/env python3
"""
Backend API Testing for Password Change Functionality
Tests password change scenarios with correct and incorrect current passwords
"""

import requests
import json
import base64
import io
from PIL import Image

# Configuration
BACKEND_URL = "https://togetherhama.preview.emergentagent.com/api"
ADMIN_EMAIL = "admin@example.com"
ADMIN_PASSWORD = "admin"

class PasswordChangeTester:
    def __init__(self):
        self.session = requests.Session()
        self.admin_token = None
        
    def login_admin(self):
        """Login as admin and get authentication token"""
        print("🔐 Testing Admin Login...")
        
        login_data = {
            "username": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        }
        
        try:
            response = self.session.post(
                f"{BACKEND_URL}/auth/login",
                data=login_data,
                headers={"Content-Type": "application/x-www-form-urlencoded"}
            )
            
            if response.status_code == 200:
                data = response.json()
                self.admin_token = data["access_token"]
                print(f"✅ Admin login successful")
                print(f"   Token: {self.admin_token[:20]}...")
                print(f"   User: {data['user']['email']} ({data['user']['role']})")
                return True
            else:
                print(f"❌ Admin login failed: {response.status_code}")
                print(f"   Response: {response.text}")
                return False
                
        except Exception as e:
            print(f"❌ Admin login error: {str(e)}")
            return False
    
    def test_change_password_correct(self):
        """Test PUT /api/users/change-password with correct current password"""
        print("\n🔐 Testing Password Change with Correct Current Password...")
        
        if not self.admin_token:
            print("❌ No admin token available")
            return False
        
        # Test data for password change
        password_data = {
            "current_password": ADMIN_PASSWORD,  # "admin"
            "new_password": "newpass123"
        }
        
        try:
            headers = {
                "Authorization": f"Bearer {self.admin_token}",
                "Content-Type": "application/json"
            }
            
            response = self.session.put(
                f"{BACKEND_URL}/users/change-password",
                json=password_data,
                headers=headers
            )
            
            if response.status_code == 200:
                data = response.json()
                print("✅ Password change with correct current password successful")
                
                if data.get('message') == "Password changed successfully":
                    print("✅ Correct success message returned")
                else:
                    print(f"⚠️  Unexpected message: {data.get('message')}")
                
                print(f"   Response: {data}")
                return True, data
            else:
                print(f"❌ Password change failed: {response.status_code}")
                print(f"   Response: {response.text}")
                return False, None
                
        except Exception as e:
            print(f"❌ Password change error: {str(e)}")
            return False, None
    
    def test_login_with_old_password(self):
        """Test login with old password (should fail after password change)"""
        print("\n🚫 Testing Login with Old Password (should fail)...")
        
        login_data = {
            "username": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD  # Old password "admin"
        }
        
        try:
            # Use a new session to avoid cached tokens
            new_session = requests.Session()
            response = new_session.post(
                f"{BACKEND_URL}/auth/login",
                data=login_data,
                headers={"Content-Type": "application/x-www-form-urlencoded"}
            )
            
            if response.status_code == 401:
                print("✅ Login with old password correctly failed (401)")
                print(f"   Response: {response.text}")
                return True
            elif response.status_code == 200:
                print("❌ Login with old password unexpectedly succeeded")
                print(f"   This indicates password was not changed properly")
                return False
            else:
                print(f"❌ Unexpected response code: {response.status_code}")
                print(f"   Response: {response.text}")
                return False
                
        except Exception as e:
            print(f"❌ Login test error: {str(e)}")
            return False
    
    def test_login_with_new_password(self):
        """Test login with new password (should succeed after password change)"""
        print("\n✅ Testing Login with New Password (should succeed)...")
        
        login_data = {
            "username": ADMIN_EMAIL,
            "password": "newpass123"  # New password
        }
        
        try:
            # Use a new session to avoid cached tokens
            new_session = requests.Session()
            response = new_session.post(
                f"{BACKEND_URL}/auth/login",
                data=login_data,
                headers={"Content-Type": "application/x-www-form-urlencoded"}
            )
            
            if response.status_code == 200:
                data = response.json()
                print("✅ Login with new password successful")
                print(f"   New token: {data['access_token'][:20]}...")
                print(f"   User: {data['user']['email']} ({data['user']['role']})")
                
                # Update our token for future tests
                self.admin_token = data["access_token"]
                return True, data
            else:
                print(f"❌ Login with new password failed: {response.status_code}")
                print(f"   Response: {response.text}")
                return False, None
                
        except Exception as e:
            print(f"❌ Login with new password error: {str(e)}")
            return False, None
    
    def test_change_password_back(self):
        """Change password back to original for cleanup"""
        print("\n🔄 Changing Password Back to Original...")
        
        if not self.admin_token:
            print("❌ No admin token available")
            return False
        
        # Change password back to "admin"
        password_data = {
            "current_password": "newpass123",  # Current new password
            "new_password": ADMIN_PASSWORD     # Back to "admin"
        }
        
        try:
            headers = {
                "Authorization": f"Bearer {self.admin_token}",
                "Content-Type": "application/json"
            }
            
            response = self.session.put(
                f"{BACKEND_URL}/users/change-password",
                json=password_data,
                headers=headers
            )
            
            if response.status_code == 200:
                data = response.json()
                print("✅ Password changed back to original successfully")
                print(f"   Response: {data}")
                return True, data
            else:
                print(f"❌ Password change back failed: {response.status_code}")
                print(f"   Response: {response.text}")
                return False, None
                
        except Exception as e:
            print(f"❌ Password change back error: {str(e)}")
            return False, None
    
    def test_change_password_incorrect(self):
        """Test PUT /api/users/change-password with incorrect current password"""
        print("\n🚫 Testing Password Change with Incorrect Current Password...")
        
        if not self.admin_token:
            print("❌ No admin token available")
            return False
        
        # Test data with wrong current password
        password_data = {
            "current_password": "wrongpassword",  # Incorrect current password
            "new_password": "newpass123"
        }
        
        try:
            headers = {
                "Authorization": f"Bearer {self.admin_token}",
                "Content-Type": "application/json"
            }
            
            response = self.session.put(
                f"{BACKEND_URL}/users/change-password",
                json=password_data,
                headers=headers
            )
            
            if response.status_code == 400:
                data = response.json()
                print("✅ Password change with incorrect current password correctly failed (400)")
                
                if data.get('detail') == "Current password is incorrect":
                    print("✅ Correct error message returned")
                else:
                    print(f"⚠️  Unexpected error message: {data.get('detail')}")
                
                print(f"   Response: {data}")
                return True, data
            else:
                print(f"❌ Password change with incorrect password should fail with 400, got: {response.status_code}")
                print(f"   Response: {response.text}")
                return False, None
                
        except Exception as e:
            print(f"❌ Password change with incorrect password error: {str(e)}")
            return False, None
    
    def run_all_tests(self):
        """Run all hero content API tests"""
        print("=" * 60)
        print("🚀 Starting Hero Content Management API Tests")
        print("=" * 60)
        
        results = {
            'admin_login': False,
            'get_hero_content': False,
            'put_hero_content': False,
            'upload_image': False,
            'put_with_image': False,
            'data_persistence': False
        }
        
        # Test admin login
        results['admin_login'] = self.login_admin()
        
        # Test GET endpoint (no auth required)
        results['get_hero_content'], _ = self.test_get_hero_content()
        
        # Test PUT endpoint (requires auth)
        if results['admin_login']:
            results['put_hero_content'], _ = self.test_put_hero_content()
            results['upload_image'], _ = self.test_upload_image()
            results['put_with_image'], _ = self.test_put_with_background_image()
            results['data_persistence'] = self.verify_data_persistence()
        else:
            print("\n⚠️  Skipping authenticated tests due to login failure")
        
        # Print summary
        print("\n" + "=" * 60)
        print("📊 TEST RESULTS SUMMARY")
        print("=" * 60)
        
        for test_name, success in results.items():
            status = "✅ PASS" if success else "❌ FAIL"
            print(f"{test_name.replace('_', ' ').title()}: {status}")
        
        total_tests = len(results)
        passed_tests = sum(results.values())
        
        print(f"\nOverall: {passed_tests}/{total_tests} tests passed")
        
        if passed_tests == total_tests:
            print("🎉 All tests passed!")
            return True
        else:
            print("⚠️  Some tests failed - check details above")
            return False

def main():
    """Main test execution"""
    tester = HeroContentTester()
    success = tester.run_all_tests()
    
    if success:
        print("\n✅ Hero Content Management APIs are working correctly")
    else:
        print("\n❌ Some Hero Content Management APIs have issues")
    
    return success

if __name__ == "__main__":
    main()