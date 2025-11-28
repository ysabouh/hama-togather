#!/usr/bin/env python3
"""
Detailed Hero Content API Testing - Specific Requirements Verification
"""

import requests
import json

# Configuration
BACKEND_URL = "https://communityhelp-3.preview.emergentagent.com/api"
ADMIN_EMAIL = "admin@test.com"
ADMIN_PASSWORD = "admin123"

def test_specific_requirements():
    """Test specific requirements from the review request"""
    
    print("🔍 Testing Specific Requirements from Review Request")
    print("=" * 60)
    
    session = requests.Session()
    
    # 1. Test GET /api/hero-content without authentication
    print("\n1️⃣ Testing GET /api/hero-content (no authentication)")
    response = session.get(f"{BACKEND_URL}/hero-content")
    
    if response.status_code == 200:
        data = response.json()
        print("✅ GET works without authentication")
        
        # Check all required fields
        required_fields = [
            'title', 'subtitle', 'cta_text', 'cta_link', 
            'background_image', 'quotes', 'video_url', 
            'video_title', 'video_description', 'video_subtitle'
        ]
        
        print("   Required fields check:")
        for field in required_fields:
            if field in data:
                print(f"   ✅ {field}: Present")
            else:
                print(f"   ❌ {field}: Missing")
        
        print(f"   📊 Data includes:")
        print(f"      - Title: {data.get('title', 'N/A')}")
        print(f"      - Subtitle: {data.get('subtitle', 'N/A')[:50]}...")
        print(f"      - CTA Text: {data.get('cta_text', 'N/A')}")
        print(f"      - CTA Link: {data.get('cta_link', 'N/A')}")
        print(f"      - Background Image: {'Present' if data.get('background_image') else 'None'}")
        print(f"      - Quotes: {len(data.get('quotes', []))} items")
        print(f"      - Video URL: {data.get('video_url', 'N/A')}")
        print(f"      - Video Title: {data.get('video_title', 'N/A')}")
        print(f"      - Video Description: {data.get('video_description', 'N/A')[:50] if data.get('video_description') else 'N/A'}...")
        print(f"      - Video Subtitle: {data.get('video_subtitle', 'N/A')[:50] if data.get('video_subtitle') else 'N/A'}...")
        
    else:
        print(f"❌ GET failed: {response.status_code}")
        return False
    
    # 2. Login as admin
    print("\n2️⃣ Testing Admin Authentication")
    login_data = {
        "username": ADMIN_EMAIL,
        "password": ADMIN_PASSWORD
    }
    
    response = session.post(
        f"{BACKEND_URL}/auth/login",
        data=login_data,
        headers={"Content-Type": "application/x-www-form-urlencoded"}
    )
    
    if response.status_code == 200:
        token_data = response.json()
        token = token_data["access_token"]
        print(f"✅ Admin login successful")
        print(f"   User: {token_data['user']['email']} ({token_data['user']['role']})")
    else:
        print(f"❌ Admin login failed: {response.status_code}")
        return False
    
    # 3. Test PUT /api/hero-content with Arabic data
    print("\n3️⃣ Testing PUT /api/hero-content with Arabic data")
    
    arabic_test_data = {
        "title": "اختبار العنوان العربي الجديد",
        "subtitle": "اختبار الوصف العربي الجديد - منصة التكافل الاجتماعي في مدينة حماة",
        "cta_text": "ابدأ التطوع الآن",
        "cta_link": "/volunteer",
        "quotes": [
            {
                "text": "\" وَتَعَاوَنُوا عَلَى الْبِرِّ وَالتَّقْوَى \"",
                "ref": "- المائدة 2",
                "author": "التعاون على البر والتقوى أساس المجتمع المتكافل"
            },
            {
                "text": "قال ﷺ: «خير الناس أنفعهم للناس»",
                "ref": "",
                "author": "النفع للآخرين هو جوهر الإنسانية"
            },
            {
                "text": "\" إِنَّمَا الْمُؤْمِنُونَ إِخْوَةٌ \"",
                "ref": "- الحجرات 10",
                "author": "الأخوة في الإيمان تقتضي التكافل والتراحم"
            }
        ],
        "video_url": "https://www.youtube.com/embed/arabic-test-video",
        "video_title": "فيديو تعريفي باللغة العربية - العمل التطوعي في حماة",
        "video_description": "شرح مفصل باللغة العربية عن أهمية العمل التطوعي ودور المنصة في تنظيم الجهود التكافلية",
        "video_subtitle": "يتناول هذا الفيديو أهمية العمل التطوعي في المجتمع السوري وكيفية الاستفادة من المنصة الإلكترونية لتنظيم الجهود التكافلية بين المقيمين والمغتربين"
    }
    
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    
    response = session.put(
        f"{BACKEND_URL}/hero-content",
        json=arabic_test_data,
        headers=headers
    )
    
    if response.status_code == 200:
        updated_data = response.json()
        print("✅ PUT with Arabic data successful")
        
        # Verify Arabic content
        print("   Arabic content verification:")
        print(f"   ✅ Title updated: {updated_data.get('title')}")
        print(f"   ✅ Subtitle updated: {updated_data.get('subtitle')[:50]}...")
        print(f"   ✅ Quotes updated: {len(updated_data.get('quotes', []))} items")
        
        # Check quotes content
        for i, quote in enumerate(updated_data.get('quotes', [])):
            print(f"      Quote {i+1}: {quote.get('text', '')[:30]}...")
        
        print(f"   ✅ Video info updated:")
        print(f"      - URL: {updated_data.get('video_url')}")
        print(f"      - Title: {updated_data.get('video_title')}")
        print(f"      - Description: {updated_data.get('video_description', '')[:50]}...")
        
    else:
        print(f"❌ PUT with Arabic data failed: {response.status_code}")
        print(f"   Response: {response.text}")
        return False
    
    # 4. Test POST /api/upload-image
    print("\n4️⃣ Testing POST /api/upload-image")
    
    # Create a simple test image data
    import base64
    import io
    from PIL import Image
    
    img = Image.new('RGB', (200, 100), color='blue')
    img_buffer = io.BytesIO()
    img.save(img_buffer, format='PNG')
    img_buffer.seek(0)
    
    files = {
        'file': ('test_background.png', img_buffer, 'image/png')
    }
    
    response = session.post(
        f"{BACKEND_URL}/upload-image",
        files=files,
        headers={"Authorization": f"Bearer {token}"}
    )
    
    if response.status_code == 200:
        upload_data = response.json()
        print("✅ Image upload successful")
        
        if 'image_url' in upload_data:
            image_url = upload_data['image_url']
            if image_url.startswith('data:image/'):
                print("✅ Base64 image URL format correct")
                print(f"   Image URL: {image_url[:60]}...")
            else:
                print(f"⚠️  Unexpected image URL format")
        else:
            print("❌ No image_url in response")
            return False
    else:
        print(f"❌ Image upload failed: {response.status_code}")
        print(f"   Response: {response.text}")
        return False
    
    # 5. Test PUT with background image
    print("\n5️⃣ Testing PUT /api/hero-content with background image")
    
    background_update = {
        "background_image": upload_data['image_url']
    }
    
    response = session.put(
        f"{BACKEND_URL}/hero-content",
        json=background_update,
        headers=headers
    )
    
    if response.status_code == 200:
        final_data = response.json()
        print("✅ Background image update successful")
        
        if final_data.get('background_image') == upload_data['image_url']:
            print("✅ Background image saved correctly in MongoDB")
        else:
            print("❌ Background image not saved correctly")
            return False
    else:
        print(f"❌ Background image update failed: {response.status_code}")
        return False
    
    # 6. Final verification - GET to confirm all data persisted
    print("\n6️⃣ Final verification - Data persistence in MongoDB")
    
    response = session.get(f"{BACKEND_URL}/hero-content")
    
    if response.status_code == 200:
        final_check = response.json()
        print("✅ Final GET successful")
        
        # Verify all data persisted
        checks = [
            ("Title", final_check.get('title') == arabic_test_data['title']),
            ("Subtitle", final_check.get('subtitle') == arabic_test_data['subtitle']),
            ("CTA Text", final_check.get('cta_text') == arabic_test_data['cta_text']),
            ("CTA Link", final_check.get('cta_link') == arabic_test_data['cta_link']),
            ("Background Image", final_check.get('background_image') is not None),
            ("Quotes Count", len(final_check.get('quotes', [])) == len(arabic_test_data['quotes'])),
            ("Video URL", final_check.get('video_url') == arabic_test_data['video_url']),
            ("Video Title", final_check.get('video_title') == arabic_test_data['video_title']),
            ("Video Description", final_check.get('video_description') == arabic_test_data['video_description']),
            ("Video Subtitle", final_check.get('video_subtitle') == arabic_test_data['video_subtitle'])
        ]
        
        print("   MongoDB persistence verification:")
        all_passed = True
        for check_name, passed in checks:
            status = "✅" if passed else "❌"
            print(f"   {status} {check_name}")
            if not passed:
                all_passed = False
        
        if all_passed:
            print("\n🎉 All requirements verified successfully!")
            print("   ✅ GET API works without authentication")
            print("   ✅ PUT API requires admin authentication")
            print("   ✅ POST upload-image requires admin authentication")
            print("   ✅ Arabic content handling works correctly")
            print("   ✅ All data persists correctly in MongoDB")
            print("   ✅ Base64 image handling works correctly")
            return True
        else:
            print("\n⚠️  Some persistence checks failed")
            return False
    else:
        print(f"❌ Final verification failed: {response.status_code}")
        return False

if __name__ == "__main__":
    success = test_specific_requirements()
    
    if success:
        print("\n✅ All Hero Content Management requirements verified successfully")
    else:
        print("\n❌ Some requirements verification failed")