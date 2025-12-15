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
        self.committee_president_neighborhood_id = None
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
                self.committee_president_neighborhood_id = data['user'].get('neighborhood_id')
                print(f"✅ Committee president login successful")
                print(f"   Token: {self.committee_president_token[:20]}...")
                print(f"   User: {data['user']['phone']} ({data['user']['role']})")
                print(f"   Neighborhood: {self.committee_president_neighborhood_id}")
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
    
    def test_public_access_allowed(self):
        """Test that healthcare GET APIs are publicly accessible (correct behavior)"""
        print("\n🌐 Testing Public Access to Healthcare APIs...")
        
        endpoints = [
            "/doctors",
            "/pharmacies", 
            "/laboratories",
            "/medical-specialties"
        ]
        
        all_public = True
        
        for endpoint in endpoints:
            try:
                response = self.session.get(f"{BACKEND_URL}{endpoint}")
                if response.status_code == 200:
                    data = response.json()
                    print(f"✅ {endpoint} publicly accessible - Found {len(data)} items")
                else:
                    print(f"❌ {endpoint} should be publicly accessible, got: {response.status_code}")
                    all_public = False
            except Exception as e:
                print(f"❌ Error testing {endpoint}: {str(e)}")
                all_public = False
        
        return all_public
    
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
        """Run all healthcare management tests"""
        print("=" * 80)
        print("🚀 Starting Healthcare Management API Tests")
        print("=" * 80)
        
        results = {
            'get_neighborhoods': False,
            'authentication_required': False,
            'committee_member_login': False,
            'committee_president_login': False,
            'medical_specialties_crud_member': False,
            'medical_specialties_crud_president': False,
            'doctors_crud_member': False,
            'doctors_crud_president': False,
            'pharmacies_crud_member': False,
            'pharmacies_crud_president': False,
            'laboratories_crud_member': False,
            'laboratories_crud_president': False,
            'neighborhood_filtering': False
        }
        
        # Test 1: Get neighborhoods for testing
        results['get_neighborhoods'] = self.get_neighborhoods()
        
        # Test 2: Authentication requirements
        results['authentication_required'] = self.test_authentication_required()
        
        # Test 3: Committee member login
        results['committee_member_login'] = self.login_committee_member()
        
        # Test 4: Committee president login
        results['committee_president_login'] = self.login_committee_president()
        
        # Test 5: Medical specialties CRUD as committee member
        if results['committee_member_login']:
            results['medical_specialties_crud_member'] = self.test_medical_specialties_crud(
                self.committee_member_token, "committee_member"
            )
        
        # Test 6: Medical specialties CRUD as committee president
        if results['committee_president_login']:
            results['medical_specialties_crud_president'] = self.test_medical_specialties_crud(
                self.committee_president_token, "committee_president"
            )
        
        # Test 7: Doctors CRUD as committee member
        if results['committee_member_login'] and self.test_specialty_id:
            results['doctors_crud_member'] = self.test_doctors_crud(
                self.committee_member_token, "committee_member"
            )
        
        # Test 8: Doctors CRUD as committee president
        if results['committee_president_login'] and self.test_specialty_id:
            results['doctors_crud_president'] = self.test_doctors_crud(
                self.committee_president_token, "committee_president"
            )
        
        # Test 9: Pharmacies CRUD as committee member
        if results['committee_member_login']:
            results['pharmacies_crud_member'] = self.test_pharmacies_crud(
                self.committee_member_token, "committee_member"
            )
        
        # Test 10: Pharmacies CRUD as committee president
        if results['committee_president_login']:
            results['pharmacies_crud_president'] = self.test_pharmacies_crud(
                self.committee_president_token, "committee_president"
            )
        
        # Test 11: Laboratories CRUD as committee member
        if results['committee_member_login']:
            results['laboratories_crud_member'] = self.test_laboratories_crud(
                self.committee_member_token, "committee_member"
            )
        
        # Test 12: Laboratories CRUD as committee president
        if results['committee_president_login']:
            results['laboratories_crud_president'] = self.test_laboratories_crud(
                self.committee_president_token, "committee_president"
            )
        
        # Test 13: Neighborhood filtering for committee president
        if results['committee_president_login']:
            results['neighborhood_filtering'] = self.test_neighborhood_filtering()
        
        # Cleanup test data
        self.cleanup_test_data()
        
        # Print summary
        print("\n" + "=" * 80)
        print("📊 HEALTHCARE MANAGEMENT TEST RESULTS SUMMARY")
        print("=" * 80)
        
        test_descriptions = {
            'get_neighborhoods': '1️⃣ Get Neighborhoods',
            'authentication_required': '2️⃣ Authentication Required for Healthcare APIs',
            'committee_member_login': '3️⃣ Committee Member Login',
            'committee_president_login': '4️⃣ Committee President Login',
            'medical_specialties_crud_member': '5️⃣ Medical Specialties CRUD (Committee Member)',
            'medical_specialties_crud_president': '6️⃣ Medical Specialties CRUD (Committee President)',
            'doctors_crud_member': '7️⃣ Doctors CRUD (Committee Member)',
            'doctors_crud_president': '8️⃣ Doctors CRUD (Committee President)',
            'pharmacies_crud_member': '9️⃣ Pharmacies CRUD (Committee Member)',
            'pharmacies_crud_president': '🔟 Pharmacies CRUD (Committee President)',
            'laboratories_crud_member': '1️⃣1️⃣ Laboratories CRUD (Committee Member)',
            'laboratories_crud_president': '1️⃣2️⃣ Laboratories CRUD (Committee President)',
            'neighborhood_filtering': '1️⃣3️⃣ Neighborhood Filtering (Committee President)'
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
        
        if results['authentication_required']:
            print("✅ Healthcare APIs correctly require authentication")
        else:
            print("❌ Healthcare APIs authentication issues")
        
        if results['committee_member_login'] and results['committee_president_login']:
            print("✅ Committee user authentication working")
        else:
            print("❌ Committee user authentication issues")
        
        crud_tests = [
            'medical_specialties_crud_member', 'medical_specialties_crud_president',
            'doctors_crud_member', 'doctors_crud_president',
            'pharmacies_crud_member', 'pharmacies_crud_president',
            'laboratories_crud_member', 'laboratories_crud_president'
        ]
        
        crud_passed = sum([1 for test in crud_tests if results.get(test, False)])
        crud_total = len([test for test in crud_tests if results.get(test) is not None])
        
        if crud_passed == crud_total and crud_total > 0:
            print("✅ All healthcare CRUD operations working")
        else:
            print(f"❌ Healthcare CRUD operations issues: {crud_passed}/{crud_total} passed")
        
        if results['neighborhood_filtering']:
            print("✅ Neighborhood filtering working for committee president")
        else:
            print("❌ Neighborhood filtering issues")
        
        if passed_tests == total_tests:
            print("\n🎉 All healthcare management tests passed!")
            return True
        else:
            print("\n⚠️ Some healthcare management tests failed - check details above")
            return False

def main():
    """Main test execution"""
    tester = HealthcareManagementTester()
    success = tester.run_all_tests()
    
    if success:
        print("\n✅ Healthcare Management functionality is working correctly")
    else:
        print("\n❌ Healthcare Management functionality has issues")
    
    return success

if __name__ == "__main__":
    main()
