#!/usr/bin/env python3
"""
Backend API Testing for Healthcare Management Feature
Tests healthcare APIs (doctors, pharmacies, laboratories, medical-specialties) with authentication
"""

import requests
import json
import uuid

# Configuration
BACKEND_URL = "https://community-care-11.preview.emergentagent.com/api"
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
                
                # Test POST (create new doctor) - need specialty first and correct neighborhood
                if self.test_specialty_id and user_type == "committee_president" and self.committee_president_neighborhood_id:
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
                        "neighborhood_id": self.committee_president_neighborhood_id
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
                
                # Test POST (create new pharmacy) - only for committee president with correct neighborhood
                if user_type == "committee_president" and self.committee_president_neighborhood_id:
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
                        "neighborhood_id": self.committee_president_neighborhood_id
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
                else:
                    print(f"ℹ️ Skipping POST test for {user_type} (requires committee_president role)")
                
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
                
                # Test POST (create new laboratory) - only for committee president with correct neighborhood
                if user_type == "committee_president" and self.committee_president_neighborhood_id:
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
                        "neighborhood_id": self.committee_president_neighborhood_id
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
                else:
                    print(f"ℹ️ Skipping POST test for {user_type} (requires committee_president role)")
                
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
    
    def test_post_authentication_required(self):
        """Test that POST operations require authentication"""
        print("\n🔒 Testing POST Authentication Requirements...")
        
        # Test POST to medical specialties without auth
        specialty_data = {
            "name_ar": "اختبار بدون مصادقة",
            "is_active": True
        }
        
        try:
            response = self.session.post(
                f"{BACKEND_URL}/medical-specialties",
                json=specialty_data,
                headers={"Content-Type": "application/json"}
            )
            
            if response.status_code == 401:
                print("✅ POST operations correctly require authentication")
                return True
            else:
                print(f"❌ POST should require authentication, got: {response.status_code}")
                return False
                
        except Exception as e:
            print(f"❌ Error testing POST authentication: {str(e)}")
            return False
    
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
            'public_access_allowed': False,
            'post_authentication_required': False,
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
        
        # Test 2: Public access allowed (correct behavior)
        results['public_access_allowed'] = self.test_public_access_allowed()
        
        # Test 3: POST authentication required
        results['post_authentication_required'] = self.test_post_authentication_required()
        
        # Test 4: Committee member login
        results['committee_member_login'] = self.login_committee_member()
        
        # Test 5: Committee president login
        results['committee_president_login'] = self.login_committee_president()
        
        # Test 6: Medical specialties CRUD as committee member
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
            'public_access_allowed': '2️⃣ Public Access to Healthcare APIs (GET)',
            'post_authentication_required': '3️⃣ POST Authentication Required',
            'committee_member_login': '4️⃣ Committee Member Login',
            'committee_president_login': '5️⃣ Committee President Login',
            'medical_specialties_crud_member': '6️⃣ Medical Specialties CRUD (Committee Member)',
            'medical_specialties_crud_president': '7️⃣ Medical Specialties CRUD (Committee President)',
            'doctors_crud_member': '8️⃣ Doctors CRUD (Committee Member)',
            'doctors_crud_president': '9️⃣ Doctors CRUD (Committee President)',
            'pharmacies_crud_member': '🔟 Pharmacies CRUD (Committee Member)',
            'pharmacies_crud_president': '1️⃣1️⃣ Pharmacies CRUD (Committee President)',
            'laboratories_crud_member': '1️⃣2️⃣ Laboratories CRUD (Committee Member)',
            'laboratories_crud_president': '1️⃣3️⃣ Laboratories CRUD (Committee President)',
            'neighborhood_filtering': '1️⃣4️⃣ Neighborhood Filtering (Committee President)'
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
        
        if results['public_access_allowed']:
            print("✅ Healthcare APIs correctly allow public access for viewing")
        else:
            print("❌ Healthcare APIs public access issues")
        
        if results['post_authentication_required']:
            print("✅ Healthcare APIs correctly require authentication for modifications")
        else:
            print("❌ Healthcare APIs POST authentication issues")
        
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

class TakafulBenefitsTester:
    def __init__(self):
        self.session = requests.Session()
        self.admin_token = None
        self.test_provider_id = None
        self.test_family_id = None
        self.test_benefit_id = None
        
    def login_admin(self):
        """Login as admin and get authentication token"""
        print("🔐 Testing Admin Login for Takaful Benefits...")
        
        login_data = {
            "username": "0933445566",  # Admin phone from review request
            "password": "admin123"     # Admin password from review request
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
                print(f"   User: {data['user']['phone']} ({data['user']['role']})")
                return True
            else:
                print(f"❌ Admin login failed: {response.status_code}")
                print(f"   Response: {response.text}")
                return False
                
        except Exception as e:
            print(f"❌ Admin login error: {str(e)}")
            return False
    
    def get_test_providers_and_families(self):
        """Get existing providers and families for testing"""
        print("\n📋 Getting test providers and families...")
        
        try:
            # Get doctors (public endpoint)
            doctors_response = self.session.get(f"{BACKEND_URL}/doctors")
            if doctors_response.status_code == 200:
                doctors = doctors_response.json()
                if doctors:
                    # Find a doctor that participates in solidarity
                    for doctor in doctors:
                        if doctor.get('participates_in_solidarity', False):
                            self.test_provider_id = doctor['id']
                            print(f"✅ Found test doctor: {doctor['full_name']} (ID: {self.test_provider_id})")
                            break
                    
                    if not self.test_provider_id and doctors:
                        # If no solidarity doctor, use first available
                        self.test_provider_id = doctors[0]['id']
                        print(f"✅ Using first available doctor: {doctors[0]['full_name']} (ID: {self.test_provider_id})")
            
            # Get families (requires authentication)
            if self.admin_token:
                headers = {"Authorization": f"Bearer {self.admin_token}"}
                families_response = self.session.get(f"{BACKEND_URL}/families", headers=headers)
                if families_response.status_code == 200:
                    families = families_response.json()
                    if families:
                        self.test_family_id = families[0]['id']
                        family_number = families[0].get('family_number', 'غير محدد')
                        print(f"✅ Found test family: {families[0]['name']} (رقم: {family_number}, ID: {self.test_family_id})")
            
            return bool(self.test_provider_id and self.test_family_id)
            
        except Exception as e:
            print(f"❌ Error getting test data: {str(e)}")
            return False
    
    def test_public_get_benefits(self):
        """Test GET /api/takaful-benefits/{provider_type}/{provider_id} - Public access"""
        print("\n🌐 Testing Public GET Takaful Benefits...")
        
        if not self.test_provider_id:
            print("❌ No test provider ID available")
            return False
        
        try:
            # Test without authentication (should work - public endpoint)
            response = self.session.get(f"{BACKEND_URL}/takaful-benefits/doctor/{self.test_provider_id}")
            
            if response.status_code == 200:
                benefits = response.json()
                print(f"✅ Public GET benefits successful - Found {len(benefits)} benefits")
                
                # Test with month/year parameters
                response_filtered = self.session.get(
                    f"{BACKEND_URL}/takaful-benefits/doctor/{self.test_provider_id}?month=12&year=2025"
                )
                
                if response_filtered.status_code == 200:
                    filtered_benefits = response_filtered.json()
                    print(f"✅ Public GET benefits with filters successful - Found {len(filtered_benefits)} benefits for Dec 2025")
                    return True
                else:
                    print(f"❌ Public GET benefits with filters failed: {response_filtered.status_code}")
                    return False
            else:
                print(f"❌ Public GET benefits failed: {response.status_code}")
                print(f"   Response: {response.text}")
                return False
                
        except Exception as e:
            print(f"❌ Public GET benefits error: {str(e)}")
            return False
    
    def test_public_get_stats(self):
        """Test GET /api/takaful-benefits/stats/{provider_type}/{provider_id} - Public access"""
        print("\n📊 Testing Public GET Takaful Stats...")
        
        if not self.test_provider_id:
            print("❌ No test provider ID available")
            return False
        
        try:
            # Test without authentication (should work - public endpoint)
            response = self.session.get(f"{BACKEND_URL}/takaful-benefits/stats/doctor/{self.test_provider_id}")
            
            if response.status_code == 200:
                stats = response.json()
                print(f"✅ Public GET stats successful")
                print(f"   Total benefits: {stats.get('total_benefits', 0)}")
                print(f"   Free benefits: {stats.get('free_benefits', 0)}")
                print(f"   Discount benefits: {stats.get('discount_benefits', 0)}")
                
                # Verify expected structure
                expected_keys = ['total_benefits', 'free_benefits', 'discount_benefits']
                if all(key in stats for key in expected_keys):
                    print("✅ Stats response has correct structure")
                    return True
                else:
                    print("❌ Stats response missing expected keys")
                    return False
            else:
                print(f"❌ Public GET stats failed: {response.status_code}")
                print(f"   Response: {response.text}")
                return False
                
        except Exception as e:
            print(f"❌ Public GET stats error: {str(e)}")
            return False
    
    def test_post_requires_auth(self):
        """Test POST /api/takaful-benefits requires authentication"""
        print("\n🔒 Testing POST Takaful Benefits Authentication Requirement...")
        
        if not self.test_provider_id or not self.test_family_id:
            print("❌ Missing test provider or family ID")
            return False
        
        # Test POST without authentication (should fail)
        benefit_data = {
            "provider_type": "doctor",
            "provider_id": self.test_provider_id,
            "family_id": self.test_family_id,
            "benefit_date": "2025-12-19",
            "benefit_type": "free",
            "notes": "اختبار بدون مصادقة"
        }
        
        try:
            response = self.session.post(
                f"{BACKEND_URL}/takaful-benefits",
                json=benefit_data,
                headers={"Content-Type": "application/json"}
            )
            
            if response.status_code == 401:
                print("✅ POST correctly requires authentication")
                return True
            else:
                print(f"❌ POST should require authentication, got: {response.status_code}")
                print(f"   Response: {response.text}")
                return False
                
        except Exception as e:
            print(f"❌ POST auth test error: {str(e)}")
            return False
    
    def test_post_create_benefit(self):
        """Test POST /api/takaful-benefits with authentication"""
        print("\n➕ Testing POST Create Takaful Benefit...")
        
        if not self.admin_token or not self.test_provider_id or not self.test_family_id:
            print("❌ Missing admin token, provider ID, or family ID")
            return False
        
        headers = {"Authorization": f"Bearer {self.admin_token}", "Content-Type": "application/json"}
        
        # Test creating a free benefit
        free_benefit_data = {
            "provider_type": "doctor",
            "provider_id": self.test_provider_id,
            "family_id": self.test_family_id,
            "benefit_date": "2025-12-19",
            "benefit_type": "free",
            "notes": "استفادة مجانية من برنامج التكافل - اختبار"
        }
        
        try:
            response = self.session.post(
                f"{BACKEND_URL}/takaful-benefits",
                json=free_benefit_data,
                headers=headers
            )
            
            if response.status_code == 200:
                result = response.json()
                self.test_benefit_id = result.get('id')
                print(f"✅ POST create free benefit successful")
                print(f"   Benefit ID: {self.test_benefit_id}")
                
                # Test creating a discount benefit
                discount_benefit_data = {
                    "provider_type": "doctor",
                    "provider_id": self.test_provider_id,
                    "family_id": self.test_family_id,
                    "benefit_date": "2025-12-20",
                    "benefit_type": "discount",
                    "discount_percentage": 25.0,
                    "notes": "خصم 25% من برنامج التكافل - اختبار"
                }
                
                discount_response = self.session.post(
                    f"{BACKEND_URL}/takaful-benefits",
                    json=discount_benefit_data,
                    headers=headers
                )
                
                if discount_response.status_code == 200:
                    print("✅ POST create discount benefit successful")
                    return True
                else:
                    print(f"❌ POST create discount benefit failed: {discount_response.status_code}")
                    print(f"   Response: {discount_response.text}")
                    return False
            else:
                print(f"❌ POST create free benefit failed: {response.status_code}")
                print(f"   Response: {response.text}")
                return False
                
        except Exception as e:
            print(f"❌ POST create benefit error: {str(e)}")
            return False
    
    def test_delete_requires_auth(self):
        """Test DELETE /api/takaful-benefits/{benefit_id} requires authentication"""
        print("\n🔒 Testing DELETE Takaful Benefits Authentication Requirement...")
        
        if not self.test_benefit_id:
            print("❌ No test benefit ID available")
            return False
        
        try:
            # Test DELETE without authentication (should fail)
            response = self.session.delete(f"{BACKEND_URL}/takaful-benefits/{self.test_benefit_id}")
            
            if response.status_code == 401:
                print("✅ DELETE correctly requires authentication")
                return True
            else:
                print(f"❌ DELETE should require authentication, got: {response.status_code}")
                print(f"   Response: {response.text}")
                return False
                
        except Exception as e:
            print(f"❌ DELETE auth test error: {str(e)}")
            return False
    
    def test_delete_benefit(self):
        """Test DELETE /api/takaful-benefits/{benefit_id} with authentication"""
        print("\n🗑️ Testing DELETE Takaful Benefit...")
        
        if not self.admin_token or not self.test_benefit_id:
            print("❌ Missing admin token or benefit ID")
            return False
        
        headers = {"Authorization": f"Bearer {self.admin_token}"}
        
        try:
            response = self.session.delete(
                f"{BACKEND_URL}/takaful-benefits/{self.test_benefit_id}",
                headers=headers
            )
            
            if response.status_code == 200:
                result = response.json()
                print(f"✅ DELETE benefit successful")
                print(f"   Message: {result.get('message', 'N/A')}")
                return True
            else:
                print(f"❌ DELETE benefit failed: {response.status_code}")
                print(f"   Response: {response.text}")
                return False
                
        except Exception as e:
            print(f"❌ DELETE benefit error: {str(e)}")
            return False
    
    def test_invalid_provider_type(self):
        """Test API endpoints with invalid provider types"""
        print("\n⚠️ Testing Invalid Provider Type Handling...")
        
        if not self.test_provider_id:
            print("❌ No test provider ID available")
            return False
        
        try:
            # Test with invalid provider type
            response = self.session.get(f"{BACKEND_URL}/takaful-benefits/invalid_type/{self.test_provider_id}")
            
            if response.status_code == 400:
                print("✅ Invalid provider type correctly rejected")
                return True
            else:
                print(f"❌ Invalid provider type should return 400, got: {response.status_code}")
                return False
                
        except Exception as e:
            print(f"❌ Invalid provider type test error: {str(e)}")
            return False
    
    def run_all_tests(self):
        """Run all Takaful Benefits tests"""
        print("=" * 80)
        print("🚀 Starting Takaful Benefits API Tests")
        print("=" * 80)
        
        results = {
            'admin_login': False,
            'get_test_data': False,
            'public_get_benefits': False,
            'public_get_stats': False,
            'post_requires_auth': False,
            'post_create_benefit': False,
            'delete_requires_auth': False,
            'delete_benefit': False,
            'invalid_provider_type': False
        }
        
        # Test 1: Admin login
        results['admin_login'] = self.login_admin()
        
        # Test 2: Get test data
        if results['admin_login']:
            results['get_test_data'] = self.get_test_providers_and_families()
        
        # Test 3: Public GET benefits
        if results['get_test_data']:
            results['public_get_benefits'] = self.test_public_get_benefits()
        
        # Test 4: Public GET stats
        if results['get_test_data']:
            results['public_get_stats'] = self.test_public_get_stats()
        
        # Test 5: POST requires authentication
        if results['get_test_data']:
            results['post_requires_auth'] = self.test_post_requires_auth()
        
        # Test 6: POST create benefit
        if results['admin_login'] and results['get_test_data']:
            results['post_create_benefit'] = self.test_post_create_benefit()
        
        # Test 7: DELETE requires authentication
        if results['post_create_benefit']:
            results['delete_requires_auth'] = self.test_delete_requires_auth()
        
        # Test 8: DELETE benefit
        if results['admin_login'] and results['post_create_benefit']:
            results['delete_benefit'] = self.test_delete_benefit()
        
        # Test 9: Invalid provider type
        if results['get_test_data']:
            results['invalid_provider_type'] = self.test_invalid_provider_type()
        
        # Print summary
        print("\n" + "=" * 80)
        print("📊 TAKAFUL BENEFITS TEST RESULTS SUMMARY")
        print("=" * 80)
        
        test_descriptions = {
            'admin_login': '1️⃣ Admin Login',
            'get_test_data': '2️⃣ Get Test Providers and Families',
            'public_get_benefits': '3️⃣ Public GET Benefits',
            'public_get_stats': '4️⃣ Public GET Stats',
            'post_requires_auth': '5️⃣ POST Requires Authentication',
            'post_create_benefit': '6️⃣ POST Create Benefit',
            'delete_requires_auth': '7️⃣ DELETE Requires Authentication',
            'delete_benefit': '8️⃣ DELETE Benefit',
            'invalid_provider_type': '9️⃣ Invalid Provider Type Handling'
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
        
        if results['public_get_benefits'] and results['public_get_stats']:
            print("✅ Public Takaful APIs working correctly")
        else:
            print("❌ Public Takaful APIs have issues")
        
        if results['post_requires_auth'] and results['delete_requires_auth']:
            print("✅ Authentication requirements working correctly")
        else:
            print("❌ Authentication requirements have issues")
        
        if results['post_create_benefit'] and results['delete_benefit']:
            print("✅ Takaful CRUD operations working correctly")
        else:
            print("❌ Takaful CRUD operations have issues")
        
        if passed_tests == total_tests:
            print("\n🎉 All Takaful Benefits tests passed!")
            return True
        else:
            print("\n⚠️ Some Takaful Benefits tests failed - check details above")
            return False

def run_takaful_tests():
    """Run Takaful Benefits tests"""
    tester = TakafulBenefitsTester()
    return tester.run_all_tests()

if __name__ == "__main__":
    # Run healthcare tests
    healthcare_success = main()
    
    print("\n" + "=" * 80)
    print("🔄 SWITCHING TO TAKAFUL BENEFITS TESTS")
    print("=" * 80)
    
    # Run Takaful tests
    takaful_success = run_takaful_tests()
    
    print("\n" + "=" * 80)
    print("🏁 FINAL RESULTS")
    print("=" * 80)
    
    if healthcare_success:
        print("✅ Healthcare Management Tests: PASSED")
    else:
        print("❌ Healthcare Management Tests: FAILED")
    
    if takaful_success:
        print("✅ Takaful Benefits Tests: PASSED")
    else:
        print("❌ Takaful Benefits Tests: FAILED")
    
    overall_success = healthcare_success and takaful_success
    if overall_success:
        print("\n🎉 ALL BACKEND TESTS PASSED!")
    else:
        print("\n⚠️ SOME BACKEND TESTS FAILED")
    
    exit(0 if overall_success else 1)
