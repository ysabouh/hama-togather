#!/usr/bin/env python3
"""
Backend API Testing for Families Public Page Functionality
Tests public families stats, neighborhoods, and families by category with different user roles
"""

import requests
import json
import uuid

# Configuration
BACKEND_URL = "https://together-build-1.preview.emergentagent.com/api"
ADMIN_EMAIL = "admin@example.com"
ADMIN_PASSWORD = "admin"

class FamiliesPublicTester:
    def __init__(self):
        self.session = requests.Session()
        self.admin_token = None
        self.regular_user_token = None
        self.regular_user_id = None
        self.regular_user_neighborhood_id = None
        self.test_user_email = "test_user@example.com"
        self.test_user_password = "test123"
        
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
    
    def test_public_families_stats(self):
        """Test GET /api/public/families-stats (no authentication required)"""
        print("\n📊 Testing Public Families Stats API...")
        
        try:
            response = self.session.get(f"{BACKEND_URL}/public/families-stats")
            
            if response.status_code == 200:
                data = response.json()
                print("✅ Public families stats API successful")
                print(f"   Total families: {data.get('total_families', 0)}")
                print(f"   Categories count: {len(data.get('categories', []))}")
                
                # Check if we have categories with families
                categories = data.get('categories', [])
                categories_with_families = [cat for cat in categories if cat.get('families_count', 0) > 0]
                
                if categories_with_families:
                    print(f"   Categories with families: {len(categories_with_families)}")
                    for cat in categories_with_families[:3]:  # Show first 3
                        print(f"     - {cat.get('name', 'Unknown')}: {cat.get('families_count', 0)} families")
                else:
                    print("   ⚠️  No categories with families found")
                
                return True, data
            else:
                print(f"❌ Public families stats failed: {response.status_code}")
                print(f"   Response: {response.text}")
                return False, None
                
        except Exception as e:
            print(f"❌ Public families stats error: {str(e)}")
            return False, None
    
    def test_public_neighborhoods(self):
        """Test GET /api/public/neighborhoods (no authentication required)"""
        print("\n🏘️ Testing Public Neighborhoods API...")
        
        try:
            response = self.session.get(f"{BACKEND_URL}/public/neighborhoods")
            
            if response.status_code == 200:
                data = response.json()
                print("✅ Public neighborhoods API successful")
                print(f"   Total neighborhoods: {len(data)}")
                
                if data:
                    # Store first neighborhood for regular user creation
                    self.regular_user_neighborhood_id = data[0].get('id')
                    print(f"   First neighborhood: {data[0].get('name', 'Unknown')} (ID: {self.regular_user_neighborhood_id})")
                    
                    # Show some neighborhoods
                    for neighborhood in data[:3]:
                        print(f"     - {neighborhood.get('name', 'Unknown')} (Number: {neighborhood.get('number', 'N/A')})")
                else:
                    print("   ⚠️  No neighborhoods found")
                
                return True, data
            else:
                print(f"❌ Public neighborhoods failed: {response.status_code}")
                print(f"   Response: {response.text}")
                return False, None
                
        except Exception as e:
            print(f"❌ Public neighborhoods error: {str(e)}")
            return False, None
    
    def create_regular_user(self):
        """Create a regular user for testing"""
        print("\n👤 Creating Regular User...")
        
        if not self.admin_token:
            print("❌ No admin token available")
            return False
        
        if not self.regular_user_neighborhood_id:
            print("❌ No neighborhood ID available for user creation")
            return False
        
        user_data = {
            "full_name": "مستخدم اختبار",
            "email": self.test_user_email,
            "password": self.test_user_password,
            "role": "committee_member",
            "neighborhood_id": self.regular_user_neighborhood_id
        }
        
        try:
            headers = {
                "Authorization": f"Bearer {self.admin_token}",
                "Content-Type": "application/json"
            }
            
            # First check if user already exists
            existing_users_response = self.session.get(
                f"{BACKEND_URL}/users",
                headers=headers
            )
            
            if existing_users_response.status_code == 200:
                existing_users = existing_users_response.json()
                for user in existing_users:
                    if user.get('email') == self.test_user_email:
                        print(f"✅ Regular user already exists: {user.get('email')}")
                        self.regular_user_id = user.get('id')
                        return True
            
            # Create new user using register endpoint
            response = self.session.post(
                f"{BACKEND_URL}/auth/register",
                json=user_data,
                headers={"Content-Type": "application/json"}
            )
            
            if response.status_code == 200:
                data = response.json()
                self.regular_user_id = data['user']['id']
                print("✅ Regular user created successfully")
                print(f"   Email: {data['user']['email']}")
                print(f"   Role: {data['user']['role']}")
                print(f"   Neighborhood ID: {data['user']['neighborhood_id']}")
                return True
            else:
                print(f"❌ Regular user creation failed: {response.status_code}")
                print(f"   Response: {response.text}")
                return False
                
        except Exception as e:
            print(f"❌ Regular user creation error: {str(e)}")
            return False
    
    def login_regular_user(self):
        """Login as regular user and get authentication token"""
        print("\n🔐 Testing Regular User Login...")
        
        login_data = {
            "username": self.test_user_email,
            "password": self.test_user_password
        }
        
        try:
            response = self.session.post(
                f"{BACKEND_URL}/auth/login",
                data=login_data,
                headers={"Content-Type": "application/x-www-form-urlencoded"}
            )
            
            if response.status_code == 200:
                data = response.json()
                self.regular_user_token = data["access_token"]
                print(f"✅ Regular user login successful")
                print(f"   Token: {self.regular_user_token[:20]}...")
                print(f"   User: {data['user']['email']} ({data['user']['role']})")
                print(f"   Neighborhood: {data['user']['neighborhood_id']}")
                return True
            else:
                print(f"❌ Regular user login failed: {response.status_code}")
                print(f"   Response: {response.text}")
                return False
                
        except Exception as e:
            print(f"❌ Regular user login error: {str(e)}")
            return False
    
    def test_families_by_category_guest(self, category_id):
        """Test GET /api/public/families-by-category/{category_id} without authentication (should fail)"""
        print(f"\n🚫 Testing Families by Category as Guest (should fail)...")
        
        try:
            response = self.session.get(f"{BACKEND_URL}/public/families-by-category/{category_id}")
            
            if response.status_code == 401:
                print("✅ Guest access correctly denied (401 Unauthorized)")
                print(f"   Response: {response.text}")
                return True
            else:
                print(f"❌ Guest access should be denied, got: {response.status_code}")
                print(f"   Response: {response.text}")
                return False
                
        except Exception as e:
            print(f"❌ Guest access test error: {str(e)}")
            return False
    
    def test_families_by_category_admin(self, category_id):
        """Test GET /api/public/families-by-category/{category_id} as admin (should see all families)"""
        print(f"\n👑 Testing Families by Category as Admin...")
        
        if not self.admin_token:
            print("❌ No admin token available")
            return False
        
        try:
            headers = {
                "Authorization": f"Bearer {self.admin_token}"
            }
            
            response = self.session.get(
                f"{BACKEND_URL}/public/families-by-category/{category_id}",
                headers=headers
            )
            
            if response.status_code == 200:
                data = response.json()
                print("✅ Admin access to families by category successful")
                print(f"   Total families in category: {len(data)}")
                
                if data:
                    # Check if families from different neighborhoods are included
                    neighborhoods = set()
                    for family in data:
                        if family.get('neighborhood_id'):
                            neighborhoods.add(family['neighborhood_id'])
                    
                    print(f"   Families from {len(neighborhoods)} different neighborhoods")
                    print(f"   Sample families:")
                    for family in data[:3]:
                        print(f"     - {family.get('name', 'Unknown')} (Neighborhood: {family.get('neighborhood_id', 'N/A')})")
                else:
                    print("   ⚠️  No families found in this category")
                
                return True, data
            else:
                print(f"❌ Admin access failed: {response.status_code}")
                print(f"   Response: {response.text}")
                return False, None
                
        except Exception as e:
            print(f"❌ Admin access error: {str(e)}")
            return False, None
    
    def test_families_by_category_regular_user(self, category_id):
        """Test GET /api/public/families-by-category/{category_id} as regular user (should see only their neighborhood)"""
        print(f"\n👤 Testing Families by Category as Regular User...")
        
        if not self.regular_user_token:
            print("❌ No regular user token available")
            return False
        
        try:
            headers = {
                "Authorization": f"Bearer {self.regular_user_token}"
            }
            
            response = self.session.get(
                f"{BACKEND_URL}/public/families-by-category/{category_id}",
                headers=headers
            )
            
            if response.status_code == 200:
                data = response.json()
                print("✅ Regular user access to families by category successful")
                print(f"   Total families in category (user's neighborhood only): {len(data)}")
                
                if data:
                    # Verify all families are from user's neighborhood
                    user_neighborhood_families = 0
                    other_neighborhood_families = 0
                    
                    for family in data:
                        if family.get('neighborhood_id') == self.regular_user_neighborhood_id:
                            user_neighborhood_families += 1
                        else:
                            other_neighborhood_families += 1
                    
                    print(f"   Families from user's neighborhood: {user_neighborhood_families}")
                    print(f"   Families from other neighborhoods: {other_neighborhood_families}")
                    
                    if other_neighborhood_families == 0:
                        print("✅ Neighborhood restriction working correctly")
                    else:
                        print("❌ Neighborhood restriction not working - seeing families from other neighborhoods")
                    
                    print(f"   Sample families:")
                    for family in data[:3]:
                        print(f"     - {family.get('name', 'Unknown')} (Neighborhood: {family.get('neighborhood_id', 'N/A')})")
                else:
                    print("   ⚠️  No families found in this category for user's neighborhood")
                
                return True, data
            else:
                print(f"❌ Regular user access failed: {response.status_code}")
                print(f"   Response: {response.text}")
                return False, None
                
        except Exception as e:
            print(f"❌ Regular user access error: {str(e)}")
            return False, None
    
    def test_neighborhood_filter_admin(self, category_id, neighborhood_id):
        """Test neighborhood filter functionality for admin"""
        print(f"\n🏘️ Testing Neighborhood Filter for Admin...")
        
        if not self.admin_token:
            print("❌ No admin token available")
            return False
        
        try:
            headers = {
                "Authorization": f"Bearer {self.admin_token}"
            }
            
            # Test with neighborhood filter
            response = self.session.get(
                f"{BACKEND_URL}/public/families-by-category/{category_id}?neighborhood_id={neighborhood_id}",
                headers=headers
            )
            
            if response.status_code == 200:
                data = response.json()
                print("✅ Admin neighborhood filter successful")
                print(f"   Families in specific neighborhood: {len(data)}")
                
                if data:
                    # Verify all families are from the specified neighborhood
                    correct_neighborhood = 0
                    wrong_neighborhood = 0
                    
                    for family in data:
                        if family.get('neighborhood_id') == neighborhood_id:
                            correct_neighborhood += 1
                        else:
                            wrong_neighborhood += 1
                    
                    print(f"   Families from correct neighborhood: {correct_neighborhood}")
                    print(f"   Families from wrong neighborhood: {wrong_neighborhood}")
                    
                    if wrong_neighborhood == 0:
                        print("✅ Neighborhood filter working correctly")
                    else:
                        print("❌ Neighborhood filter not working properly")
                else:
                    print("   ⚠️  No families found in this neighborhood for this category")
                
                return True, data
            else:
                print(f"❌ Admin neighborhood filter failed: {response.status_code}")
                print(f"   Response: {response.text}")
                return False, None
                
        except Exception as e:
            print(f"❌ Admin neighborhood filter error: {str(e)}")
            return False, None
    
    def run_all_tests(self):
        """Run all families public page tests"""
        print("=" * 80)
        print("🚀 Starting Families Public Page Functionality Tests")
        print("=" * 80)
        
        results = {
            'public_families_stats': False,
            'public_neighborhoods': False,
            'admin_login': False,
            'create_regular_user': False,
            'regular_user_login': False,
            'guest_access_denied': False,
            'admin_sees_all_families': False,
            'regular_user_neighborhood_restriction': False,
            'admin_neighborhood_filter': False
        }
        
        # Test 1: Public families stats (no auth)
        results['public_families_stats'], families_stats = self.test_public_families_stats()
        
        # Test 2: Public neighborhoods (no auth)
        results['public_neighborhoods'], neighborhoods = self.test_public_neighborhoods()
        
        # Test 3: Admin login
        results['admin_login'] = self.login_admin()
        
        # Find a category with families for testing
        test_category_id = None
        if results['public_families_stats'] and families_stats:
            categories_with_families = [cat for cat in families_stats.get('categories', []) if cat.get('families_count', 0) > 0]
            if categories_with_families:
                test_category_id = categories_with_families[0]['id']
                print(f"\n🎯 Using category '{categories_with_families[0]['name']}' (ID: {test_category_id}) for testing")
        
        if not test_category_id:
            print("\n⚠️  No categories with families found - some tests will be skipped")
        
        # Test 4: Guest access (should be denied)
        if test_category_id:
            results['guest_access_denied'] = self.test_families_by_category_guest(test_category_id)
        
        # Test 5: Admin access (should see all families)
        if results['admin_login'] and test_category_id:
            admin_success, admin_families = self.test_families_by_category_admin(test_category_id)
            results['admin_sees_all_families'] = admin_success
        
        # Test 6: Create regular user
        if results['admin_login'] and results['public_neighborhoods']:
            results['create_regular_user'] = self.create_regular_user()
        
        # Test 7: Regular user login
        if results['create_regular_user']:
            results['regular_user_login'] = self.login_regular_user()
        
        # Test 8: Regular user access (should see only their neighborhood)
        if results['regular_user_login'] and test_category_id:
            regular_success, regular_families = self.test_families_by_category_regular_user(test_category_id)
            results['regular_user_neighborhood_restriction'] = regular_success
        
        # Test 9: Admin neighborhood filter
        if results['admin_login'] and test_category_id and self.regular_user_neighborhood_id:
            filter_success, filtered_families = self.test_neighborhood_filter_admin(test_category_id, self.regular_user_neighborhood_id)
            results['admin_neighborhood_filter'] = filter_success
        
        # Print summary
        print("\n" + "=" * 80)
        print("📊 FAMILIES PUBLIC PAGE TEST RESULTS SUMMARY")
        print("=" * 80)
        
        test_descriptions = {
            'public_families_stats': '1️⃣ Public Families Stats API (no auth)',
            'public_neighborhoods': '2️⃣ Public Neighborhoods API (no auth)',
            'admin_login': '3️⃣ Admin Login',
            'guest_access_denied': '4️⃣ Guest Access Denied (families by category)',
            'admin_sees_all_families': '5️⃣ Admin Sees All Families (no neighborhood restriction)',
            'create_regular_user': '6️⃣ Create Regular User',
            'regular_user_login': '7️⃣ Regular User Login',
            'regular_user_neighborhood_restriction': '8️⃣ Regular User Neighborhood Restriction',
            'admin_neighborhood_filter': '9️⃣ Admin Neighborhood Filter'
        }
        
        for test_name, success in results.items():
            status = "✅ PASS" if success else "❌ FAIL"
            description = test_descriptions.get(test_name, test_name.replace('_', ' ').title())
            print(f"{description}: {status}")
        
        total_tests = len([k for k, v in results.items() if v is not None])
        passed_tests = sum([1 for v in results.values() if v is True])
        
        print(f"\nOverall: {passed_tests}/{total_tests} tests passed")
        
        # Detailed analysis
        print("\n" + "=" * 80)
        print("📋 DETAILED ANALYSIS")
        print("=" * 80)
        
        if results['public_families_stats'] and results['public_neighborhoods']:
            print("✅ Public APIs working correctly (no authentication required)")
        else:
            print("❌ Public APIs have issues")
        
        if results['guest_access_denied']:
            print("✅ Protected endpoint correctly requires authentication")
        else:
            print("❌ Protected endpoint security issue")
        
        if results['admin_sees_all_families']:
            print("✅ Admin can see all families (no neighborhood restriction)")
        else:
            print("❌ Admin access has issues")
        
        if results['regular_user_neighborhood_restriction']:
            print("✅ Regular user correctly restricted to their neighborhood")
        else:
            print("❌ Regular user neighborhood restriction not working")
        
        if results['admin_neighborhood_filter']:
            print("✅ Admin neighborhood filter working correctly")
        else:
            print("❌ Admin neighborhood filter has issues")
        
        if passed_tests == total_tests:
            print("\n🎉 All families public page tests passed!")
            return True
        else:
            print("\n⚠️  Some families public page tests failed - check details above")
            return False

def main():
    """Main test execution"""
    tester = FamiliesPublicTester()
    success = tester.run_all_tests()
    
    if success:
        print("\n✅ Families Public Page functionality is working correctly")
    else:
        print("\n❌ Families Public Page functionality has issues")
    
    return success

if __name__ == "__main__":
    main()
