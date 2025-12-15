#!/usr/bin/env python3
"""
Backend API Testing for Healthcare Management Feature
Tests healthcare APIs (doctors, pharmacies, laboratories, medical-specialties) with authentication
"""

import requests
import json
import uuid

# Configuration
BACKEND_URL = "https://hama-community.preview.emergentagent.com/api"
ADMIN_EMAIL = "admin@example.com"
ADMIN_PASSWORD = "admin"

# Healthcare test credentials
COMMITTEE_MEMBER_PHONE = "0933333333"
COMMITTEE_MEMBER_PASSWORD = "committee123"
COMMITTEE_PRESIDENT_PHONE = "0944444444"
COMMITTEE_PRESIDENT_PASSWORD = "test123"

class HealthcareManagementTester:
    def __init__(self):
        self.session = requests.Session()
        self.admin_token = None
        self.committee_member_token = None
        self.committee_president_token = None
        self.test_neighborhood_id = None
        self.test_specialty_id = None
        self.test_doctor_id = None
        self.test_pharmacy_id = None
        self.test_laboratory_id = None
        
    def login_committee_member(self):
        """Login as committee member and get authentication token"""
        print("🔐 Testing Committee Member Login...")
        
        login_data = {
            "username": COMMITTEE_MEMBER_PHONE,
            "password": COMMITTEE_MEMBER_PASSWORD
        }
        
        try:
            response = self.session.post(
                f"{BACKEND_URL}/auth/login",
                data=login_data,
                headers={"Content-Type": "application/x-www-form-urlencoded"}
            )
            
            if response.status_code == 200:
                data = response.json()
                self.committee_member_token = data["access_token"]
                print(f"✅ Committee member login successful")
                print(f"   Token: {self.committee_member_token[:20]}...")
                print(f"   User: {data['user']['phone']} ({data['user']['role']})")
                print(f"   Neighborhood: {data['user'].get('neighborhood_id', 'N/A')}")
                return True
            else:
                print(f"❌ Committee member login failed: {response.status_code}")
                print(f"   Response: {response.text}")
                return False
                
        except Exception as e:
            print(f"❌ Committee member login error: {str(e)}")
            return False
    
    def login_committee_president(self):
        """Login as committee president and get authentication token"""
        print("🔐 Testing Committee President Login...")
        
        login_data = {
            "username": COMMITTEE_PRESIDENT_PHONE,
            "password": COMMITTEE_PRESIDENT_PASSWORD
        }
        
        try:
            response = self.session.post(
                f"{BACKEND_URL}/auth/login",
                data=login_data,
                headers={"Content-Type": "application/x-www-form-urlencoded"}
            )
            
            if response.status_code == 200:
                data = response.json()
                self.committee_president_token = data["access_token"]
                print(f"✅ Committee president login successful")
                print(f"   Token: {self.committee_president_token[:20]}...")
                print(f"   User: {data['user']['phone']} ({data['user']['role']})")
                print(f"   Neighborhood: {data['user'].get('neighborhood_id', 'N/A')}")
                return True
            else:
                print(f"❌ Committee president login failed: {response.status_code}")
                print(f"   Response: {response.text}")
                return False
                
        except Exception as e:
            print(f"❌ Committee president login error: {str(e)}")
            return False
    
    def get_neighborhoods(self):
        """Get neighborhoods for testing"""
        print("\n🏘️ Getting Neighborhoods...")
        
        try:
            response = self.session.get(f"{BACKEND_URL}/public/neighborhoods")
            
            if response.status_code == 200:
                data = response.json()
                if data:
                    self.test_neighborhood_id = data[0].get('id')
                    print(f"✅ Got neighborhoods, using: {data[0].get('name')} (ID: {self.test_neighborhood_id})")
                    return True
                else:
                    print("❌ No neighborhoods found")
                    return False
            else:
                print(f"❌ Failed to get neighborhoods: {response.status_code}")
                return False
                
        except Exception as e:
            print(f"❌ Get neighborhoods error: {str(e)}")
            return False
    
    def test_medical_specialties_crud(self, token, user_type):
        """Test CRUD operations for medical specialties"""
        print(f"\n🩺 Testing Medical Specialties CRUD as {user_type}...")
        
        if not token:
            print(f"❌ No {user_type} token available")
            return False
        
        headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
        
        try:
            # Test GET medical specialties
            response = self.session.get(f"{BACKEND_URL}/medical-specialties", headers=headers)
            
            if response.status_code == 200:
                specialties = response.json()
                print(f"✅ GET medical specialties successful - Found {len(specialties)} specialties")
                
                # Test POST (create new specialty) - only for admin/committee users
                if user_type in ["committee_member", "committee_president"]:
                    specialty_data = {
                        "name_ar": "طب الأطفال - اختبار",
                        "name_en": "Pediatrics - Test",
                        "description": "تخصص طب الأطفال للاختبار",
                        "is_active": True
                    }
                    
                    create_response = self.session.post(
                        f"{BACKEND_URL}/medical-specialties",
                        json=specialty_data,
                        headers=headers
                    )
                    
                    if create_response.status_code == 200:
                        created_specialty = create_response.json()
                        self.test_specialty_id = created_specialty['id']
                        print(f"✅ POST medical specialty successful - Created: {created_specialty['name_ar']}")
                        
                        # Test PUT (update specialty)
                        update_data = {
                            "name_ar": "طب الأطفال - محدث",
                            "description": "تخصص طب الأطفال المحدث للاختبار"
                        }
                        
                        update_response = self.session.put(
                            f"{BACKEND_URL}/medical-specialties/{self.test_specialty_id}",
                            json=update_data,
                            headers=headers
                        )
                        
                        if update_response.status_code == 200:
                            print("✅ PUT medical specialty successful")
                        else:
                            print(f"❌ PUT medical specialty failed: {update_response.status_code}")
                            print(f"   Response: {update_response.text}")
                    else:
                        print(f"❌ POST medical specialty failed: {create_response.status_code}")
                        print(f"   Response: {create_response.text}")
                
                return True
            else:
                print(f"❌ GET medical specialties failed: {response.status_code}")
                print(f"   Response: {response.text}")
                return False
                
        except Exception as e:
            print(f"❌ Medical specialties CRUD error: {str(e)}")
            return False
    
    def test_doctors_crud(self, token, user_type):
        """Test CRUD operations for doctors"""
        print(f"\n👨‍⚕️ Testing Doctors CRUD as {user_type}...")
        
        if not token or not self.test_neighborhood_id:
            print(f"❌ Missing {user_type} token or neighborhood ID")
            return False
        
        headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
        
        try:
            # Test GET doctors
            response = self.session.get(f"{BACKEND_URL}/doctors", headers=headers)
            
            if response.status_code == 200:
                doctors = response.json()
                print(f"✅ GET doctors successful - Found {len(doctors)} doctors")
                
                # Test POST (create new doctor) - need specialty first
                if self.test_specialty_id:
                    doctor_data = {
                        "full_name": "د. أحمد محمد علي",
                        "specialty_id": self.test_specialty_id,
                        "specialty_description": "خبرة 10 سنوات في طب الأطفال",
                        "landline": "0112345678",
                        "mobile": "0501234567",
                        "address": "شارع الملك فهد، الرياض",
                        "working_hours": {
                            "saturday": {"is_open": True, "opening_time": "09:00", "closing_time": "17:00"},
                            "sunday": {"is_open": True, "opening_time": "09:00", "closing_time": "17:00"},
                            "monday": {"is_open": True, "opening_time": "09:00", "closing_time": "17:00"},
                            "tuesday": {"is_open": True, "opening_time": "09:00", "closing_time": "17:00"},
                            "wednesday": {"is_open": True, "opening_time": "09:00", "closing_time": "17:00"},
                            "thursday": {"is_open": True, "opening_time": "09:00", "closing_time": "17:00"},
                            "friday": {"is_open": False}
                        },
                        "is_active": True,
                        "participates_in_solidarity": True,
                        "neighborhood_id": self.test_neighborhood_id
                    }
                    
                    create_response = self.session.post(
                        f"{BACKEND_URL}/doctors",
                        json=doctor_data,
                        headers=headers
                    )
                    
                    if create_response.status_code == 200:
                        created_doctor = create_response.json()
                        self.test_doctor_id = created_doctor['id']
                        print(f"✅ POST doctor successful - Created: {created_doctor['full_name']}")
                        
                        # Test PUT (update doctor)
                        update_data = {
                            "full_name": "د. أحمد محمد علي المحدث",
                            "specialty_description": "خبرة 15 سنة في طب الأطفال"
                        }
                        
                        update_response = self.session.put(
                            f"{BACKEND_URL}/doctors/{self.test_doctor_id}",
                            json=update_data,
                            headers=headers
                        )
                        
                        if update_response.status_code == 200:
                            print("✅ PUT doctor successful")
                        else:
                            print(f"❌ PUT doctor failed: {update_response.status_code}")
                    else:
                        print(f"❌ POST doctor failed: {create_response.status_code}")
                        print(f"   Response: {create_response.text}")
                
                return True
            else:
                print(f"❌ GET doctors failed: {response.status_code}")
                print(f"   Response: {response.text}")
                return False
                
        except Exception as e:
            print(f"❌ Doctors CRUD error: {str(e)}")
            return False
    
    def test_pharmacies_crud(self, token, user_type):
        """Test CRUD operations for pharmacies"""
        print(f"\n💊 Testing Pharmacies CRUD as {user_type}...")
        
        if not token or not self.test_neighborhood_id:
            print(f"❌ Missing {user_type} token or neighborhood ID")
            return False
        
        headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
        
        try:
            # Test GET pharmacies
            response = self.session.get(f"{BACKEND_URL}/pharmacies", headers=headers)
            
            if response.status_code == 200:
                pharmacies = response.json()
                print(f"✅ GET pharmacies successful - Found {len(pharmacies)} pharmacies")
                
                # Test POST (create new pharmacy)
                pharmacy_data = {
                    "name": "صيدلية النهضة - اختبار",
                    "owner_full_name": "محمد أحمد السعد",
                    "description": "صيدلية شاملة تقدم جميع الأدوية والمستلزمات الطبية",
                    "landline": "0112345679",
                    "mobile": "0501234568",
                    "address": "شارع العليا، الرياض",
                    "working_hours": {
                        "saturday": {"is_open": True, "opening_time": "08:00", "closing_time": "22:00"},
                        "sunday": {"is_open": True, "opening_time": "08:00", "closing_time": "22:00"},
                        "monday": {"is_open": True, "opening_time": "08:00", "closing_time": "22:00"},
                        "tuesday": {"is_open": True, "opening_time": "08:00", "closing_time": "22:00"},
                        "wednesday": {"is_open": True, "opening_time": "08:00", "closing_time": "22:00"},
                        "thursday": {"is_open": True, "opening_time": "08:00", "closing_time": "22:00"},
                        "friday": {"is_open": True, "opening_time": "14:00", "closing_time": "22:00"}
                    },
                    "is_active": True,
                    "participates_in_solidarity": True,
                    "neighborhood_id": self.test_neighborhood_id
                }
                
                create_response = self.session.post(
                    f"{BACKEND_URL}/pharmacies",
                    json=pharmacy_data,
                    headers=headers
                )
                
                if create_response.status_code == 200:
                    created_pharmacy = create_response.json()
                    self.test_pharmacy_id = created_pharmacy['id']
                    print(f"✅ POST pharmacy successful - Created: {created_pharmacy['name']}")
                    
                    # Test PUT (update pharmacy)
                    update_data = {
                        "name": "صيدلية النهضة المحدثة - اختبار",
                        "description": "صيدلية شاملة محدثة تقدم جميع الأدوية"
                    }
                    
                    update_response = self.session.put(
                        f"{BACKEND_URL}/pharmacies/{self.test_pharmacy_id}",
                        json=update_data,
                        headers=headers
                    )
                    
                    if update_response.status_code == 200:
                        print("✅ PUT pharmacy successful")
                    else:
                        print(f"❌ PUT pharmacy failed: {update_response.status_code}")
                else:
                    print(f"❌ POST pharmacy failed: {create_response.status_code}")
                    print(f"   Response: {create_response.text}")
                
                return True
            else:
                print(f"❌ GET pharmacies failed: {response.status_code}")
                print(f"   Response: {response.text}")
                return False
                
        except Exception as e:
            print(f"❌ Pharmacies CRUD error: {str(e)}")
            return False
    
    def test_laboratories_crud(self, token, user_type):
        """Test CRUD operations for laboratories"""
        print(f"\n🔬 Testing Laboratories CRUD as {user_type}...")
        
        if not token or not self.test_neighborhood_id:
            print(f"❌ Missing {user_type} token or neighborhood ID")
            return False
        
        headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
        
        try:
            # Test GET laboratories
            response = self.session.get(f"{BACKEND_URL}/laboratories", headers=headers)
            
            if response.status_code == 200:
                laboratories = response.json()
                print(f"✅ GET laboratories successful - Found {len(laboratories)} laboratories")
                
                # Test POST (create new laboratory)
                laboratory_data = {
                    "name": "مختبر الدقة الطبي - اختبار",
                    "owner_full_name": "سعد محمد الأحمد",
                    "description": "مختبر طبي شامل للتحاليل والفحوصات",
                    "landline": "0112345680",
                    "mobile": "0501234569",
                    "address": "شارع الأمير محمد بن عبدالعزيز، الرياض",
                    "working_hours": {
                        "saturday": {"is_open": True, "opening_time": "07:00", "closing_time": "20:00"},
                        "sunday": {"is_open": True, "opening_time": "07:00", "closing_time": "20:00"},
                        "monday": {"is_open": True, "opening_time": "07:00", "closing_time": "20:00"},
                        "tuesday": {"is_open": True, "opening_time": "07:00", "closing_time": "20:00"},
                        "wednesday": {"is_open": True, "opening_time": "07:00", "closing_time": "20:00"},
                        "thursday": {"is_open": True, "opening_time": "07:00", "closing_time": "20:00"},
                        "friday": {"is_open": False}
                    },
                    "is_active": True,
                    "participates_in_solidarity": False,
                    "neighborhood_id": self.test_neighborhood_id
                }
                
                create_response = self.session.post(
                    f"{BACKEND_URL}/laboratories",
                    json=laboratory_data,
                    headers=headers
                )
                
                if create_response.status_code == 200:
                    created_laboratory = create_response.json()
                    self.test_laboratory_id = created_laboratory['id']
                    print(f"✅ POST laboratory successful - Created: {created_laboratory['name']}")
                    
                    # Test PUT (update laboratory)
                    update_data = {
                        "name": "مختبر الدقة الطبي المحدث - اختبار",
                        "description": "مختبر طبي شامل محدث للتحاليل والفحوصات المتقدمة"
                    }
                    
                    update_response = self.session.put(
                        f"{BACKEND_URL}/laboratories/{self.test_laboratory_id}",
                        json=update_data,
                        headers=headers
                    )
                    
                    if update_response.status_code == 200:
                        print("✅ PUT laboratory successful")
                    else:
                        print(f"❌ PUT laboratory failed: {update_response.status_code}")
                else:
                    print(f"❌ POST laboratory failed: {create_response.status_code}")
                    print(f"   Response: {create_response.text}")
                
                return True
            else:
                print(f"❌ GET laboratories failed: {response.status_code}")
                print(f"   Response: {response.text}")
                return False
                
        except Exception as e:
            print(f"❌ Laboratories CRUD error: {str(e)}")
            return False
    
    def test_authentication_required(self):
        """Test that healthcare APIs require authentication"""
        print("\n🚫 Testing Authentication Requirements...")
        
        endpoints = [
            "/doctors",
            "/pharmacies", 
            "/laboratories",
            "/medical-specialties"
        ]
        
        all_protected = True
        
        for endpoint in endpoints:
            try:
                response = self.session.get(f"{BACKEND_URL}{endpoint}")
                if response.status_code == 401:
                    print(f"✅ {endpoint} correctly requires authentication")
                else:
                    print(f"❌ {endpoint} should require authentication, got: {response.status_code}")
                    all_protected = False
            except Exception as e:
                print(f"❌ Error testing {endpoint}: {str(e)}")
                all_protected = False
        
        return all_protected
    
    def test_neighborhood_filtering(self):
        """Test that committee president sees only their neighborhood data"""
        print("\n🏘️ Testing Neighborhood Filtering for Committee President...")
        
        if not self.committee_president_token:
            print("❌ No committee president token available")
            return False
        
        headers = {"Authorization": f"Bearer {self.committee_president_token}"}
        
        try:
            # Test doctors filtering
            response = self.session.get(f"{BACKEND_URL}/doctors", headers=headers)
            if response.status_code == 200:
                doctors = response.json()
                print(f"✅ Committee president can access doctors - Found {len(doctors)} doctors")
                
                # Check if filtering is applied (all doctors should be from same neighborhood)
                if doctors:
                    neighborhoods = set(doc.get('neighborhood_id') for doc in doctors if doc.get('neighborhood_id'))
                    if len(neighborhoods) <= 1:
                        print("✅ Neighborhood filtering working for doctors")
                    else:
                        print(f"⚠️ Multiple neighborhoods found in doctors: {len(neighborhoods)}")
                
                return True
            else:
                print(f"❌ Committee president doctors access failed: {response.status_code}")
                return False
                
        except Exception as e:
            print(f"❌ Neighborhood filtering test error: {str(e)}")
            return False
    
    def cleanup_test_data(self):
        """Clean up test data created during testing"""
        print("\n🧹 Cleaning up test data...")
        
        # Only cleanup if we have committee member token (has delete permissions)
        if not self.committee_member_token:
            print("⚠️ No committee member token for cleanup")
            return
        
        headers = {"Authorization": f"Bearer {self.committee_member_token}"}
        
        # Delete test entities (if they were created)
        entities_to_delete = [
            (self.test_doctor_id, "doctors", "doctor"),
            (self.test_pharmacy_id, "pharmacies", "pharmacy"),
            (self.test_laboratory_id, "laboratories", "laboratory"),
            (self.test_specialty_id, "medical-specialties", "medical specialty")
        ]
        
        for entity_id, endpoint, entity_type in entities_to_delete:
            if entity_id:
                try:
                    response = self.session.delete(f"{BACKEND_URL}/{endpoint}/{entity_id}", headers=headers)
                    if response.status_code in [200, 204]:
                        print(f"✅ Deleted test {entity_type}")
                    else:
                        print(f"⚠️ Could not delete test {entity_type}: {response.status_code}")
                except Exception as e:
                    print(f"⚠️ Error deleting test {entity_type}: {str(e)}")
    
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
