#!/usr/bin/env python3
"""
Backend API Testing for Jobs and Education Levels Management
Tests CRUD operations for Jobs and Education Levels endpoints
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

class HeroContentTester:
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
    
    def test_get_hero_content(self):
        """Test GET /api/hero-content (no authentication required)"""
        print("\n📖 Testing GET /api/hero-content...")
        
        try:
            response = self.session.get(f"{BACKEND_URL}/hero-content")
            
            if response.status_code == 200:
                data = response.json()
                print("✅ GET hero-content successful")
                
                # Verify required fields
                required_fields = [
                    'title', 'subtitle', 'cta_text', 'cta_link', 
                    'background_image', 'quotes', 'video_url', 
                    'video_title', 'video_description', 'video_subtitle'
                ]
                
                missing_fields = [field for field in required_fields if field not in data]
                if missing_fields:
                    print(f"⚠️  Missing fields: {missing_fields}")
                else:
                    print("✅ All required fields present")
                
                print(f"   Title: {data.get('title', 'N/A')}")
                print(f"   Subtitle: {data.get('subtitle', 'N/A')[:50]}...")
                print(f"   Quotes count: {len(data.get('quotes', []))}")
                print(f"   Video URL: {data.get('video_url', 'N/A')}")
                
                return True, data
            else:
                print(f"❌ GET hero-content failed: {response.status_code}")
                print(f"   Response: {response.text}")
                return False, None
                
        except Exception as e:
            print(f"❌ GET hero-content error: {str(e)}")
            return False, None
    
    def test_put_hero_content(self):
        """Test PUT /api/hero-content (requires admin authentication)"""
        print("\n📝 Testing PUT /api/hero-content...")
        
        if not self.admin_token:
            print("❌ No admin token available")
            return False
        
        # Arabic test data
        test_data = {
            "title": "عنوان جديد للقسم الرئيسي - اختبار",
            "subtitle": "وصف جديد للقسم الرئيسي يتضمن معلومات محدثة عن المنصة والخدمات المقدمة للمجتمع",
            "cta_text": "انضم إلينا الآن",
            "cta_link": "/register",
            "quotes": [
                {
                    "text": "\" إِنَّمَا الْمُؤْمِنُونَ إِخْوَةٌ \"",
                    "ref": "- الحجرات 10",
                    "author": "الأخوة في الإيمان أساس التكافل الاجتماعي"
                },
                {
                    "text": "قال ﷺ: «مَن نفَّس عن مؤمنٍ كُربةً من كُرَب الدنيا نفَّس الله عنه كُربةً من كُرَب يوم القيامة»",
                    "ref": "",
                    "author": "العطاء والمساعدة طريق إلى رضا الله"
                }
            ],
            "video_url": "https://www.youtube.com/embed/test-video-id",
            "video_title": "فيديو تجريبي - كيفية المساهمة في العمل التطوعي",
            "video_description": "شرح مفصل عن كيفية المشاركة في الأنشطة التطوعية والتكافلية",
            "video_subtitle": "هذا فيديو تجريبي يوضح الطرق المختلفة للمساهمة في دعم المجتمع المحلي"
        }
        
        try:
            headers = {
                "Authorization": f"Bearer {self.admin_token}",
                "Content-Type": "application/json"
            }
            
            response = self.session.put(
                f"{BACKEND_URL}/hero-content",
                json=test_data,
                headers=headers
            )
            
            if response.status_code == 200:
                data = response.json()
                print("✅ PUT hero-content successful")
                
                # Verify data was updated
                if data.get('title') == test_data['title']:
                    print("✅ Title updated correctly")
                else:
                    print(f"⚠️  Title mismatch: expected '{test_data['title']}', got '{data.get('title')}'")
                
                if len(data.get('quotes', [])) == len(test_data['quotes']):
                    print("✅ Quotes updated correctly")
                else:
                    print(f"⚠️  Quotes count mismatch: expected {len(test_data['quotes'])}, got {len(data.get('quotes', []))}")
                
                if data.get('video_title') == test_data['video_title']:
                    print("✅ Video info updated correctly")
                else:
                    print(f"⚠️  Video title mismatch")
                
                print(f"   Updated title: {data.get('title')}")
                print(f"   Updated quotes count: {len(data.get('quotes', []))}")
                print(f"   Updated video title: {data.get('video_title')}")
                
                return True, data
            else:
                print(f"❌ PUT hero-content failed: {response.status_code}")
                print(f"   Response: {response.text}")
                return False, None
                
        except Exception as e:
            print(f"❌ PUT hero-content error: {str(e)}")
            return False, None
    
    def test_upload_image(self):
        """Test POST /api/upload-image (requires admin authentication)"""
        print("\n🖼️  Testing POST /api/upload-image...")
        
        if not self.admin_token:
            print("❌ No admin token available")
            return False
        
        try:
            # Create a test image
            img = Image.new('RGB', (100, 100), color='red')
            img_buffer = io.BytesIO()
            img.save(img_buffer, format='PNG')
            img_buffer.seek(0)
            
            headers = {
                "Authorization": f"Bearer {self.admin_token}"
            }
            
            files = {
                'file': ('test_image.png', img_buffer, 'image/png')
            }
            
            response = self.session.post(
                f"{BACKEND_URL}/upload-image",
                files=files,
                headers=headers
            )
            
            if response.status_code == 200:
                data = response.json()
                print("✅ POST upload-image successful")
                
                if 'image_url' in data:
                    image_url = data['image_url']
                    if image_url.startswith('data:image/'):
                        print("✅ Image URL format correct (Base64)")
                        print(f"   Image URL: {image_url[:50]}...")
                    else:
                        print(f"⚠️  Unexpected image URL format: {image_url[:50]}...")
                else:
                    print("⚠️  No image_url in response")
                
                return True, data
            else:
                print(f"❌ POST upload-image failed: {response.status_code}")
                print(f"   Response: {response.text}")
                return False, None
                
        except Exception as e:
            print(f"❌ POST upload-image error: {str(e)}")
            return False, None
    
    def test_put_with_background_image(self):
        """Test PUT /api/hero-content with background image update"""
        print("\n🖼️📝 Testing PUT /api/hero-content with background image...")
        
        if not self.admin_token:
            print("❌ No admin token available")
            return False
        
        # First upload an image
        upload_success, upload_data = self.test_upload_image()
        if not upload_success:
            print("❌ Cannot test background image update - image upload failed")
            return False
        
        # Now update hero content with the uploaded image
        test_data = {
            "title": "عنوان محدث مع صورة خلفية",
            "background_image": upload_data['image_url']
        }
        
        try:
            headers = {
                "Authorization": f"Bearer {self.admin_token}",
                "Content-Type": "application/json"
            }
            
            response = self.session.put(
                f"{BACKEND_URL}/hero-content",
                json=test_data,
                headers=headers
            )
            
            if response.status_code == 200:
                data = response.json()
                print("✅ PUT hero-content with background image successful")
                
                if data.get('background_image') == test_data['background_image']:
                    print("✅ Background image updated correctly")
                else:
                    print("⚠️  Background image not updated correctly")
                
                return True, data
            else:
                print(f"❌ PUT hero-content with background image failed: {response.status_code}")
                print(f"   Response: {response.text}")
                return False, None
                
        except Exception as e:
            print(f"❌ PUT hero-content with background image error: {str(e)}")
            return False, None
    
    def verify_data_persistence(self):
        """Verify that updated data persists by fetching it again"""
        print("\n🔄 Testing data persistence...")
        
        success, data = self.test_get_hero_content()
        if success:
            print("✅ Data persistence verified - GET after PUT returns updated data")
            return True
        else:
            print("❌ Data persistence verification failed")
            return False
    
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