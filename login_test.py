#!/usr/bin/env python3
"""
Quick Login API Test
Tests the login API and checks if admin user exists in database
"""

import requests
import json
import sys

# Configuration - using the same URL from existing backend_test.py
BACKEND_URL = "https://solidarity-hub-7.preview.emergentagent.com/api"
ADMIN_EMAIL = "admin@test.com"
ADMIN_PASSWORD = "admin123"

def test_login_api():
    """Test 1: Login API - POST /api/auth/login"""
    print("🔐 Testing Login API...")
    print(f"   URL: {BACKEND_URL}/auth/login")
    print(f"   Credentials: {ADMIN_EMAIL} / {ADMIN_PASSWORD}")
    
    login_data = {
        "username": ADMIN_EMAIL,
        "password": ADMIN_PASSWORD
    }
    
    try:
        response = requests.post(
            f"{BACKEND_URL}/auth/login",
            data=login_data,
            headers={"Content-Type": "application/x-www-form-urlencoded"},
            timeout=10
        )
        
        print(f"   Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print("✅ Login API Test PASSED")
            print(f"   Token received: {data['access_token'][:20]}...")
            print(f"   User: {data['user']['email']} (role: {data['user']['role']})")
            return True, data
        else:
            print("❌ Login API Test FAILED")
            print(f"   Response: {response.text}")
            return False, None
            
    except Exception as e:
        print("❌ Login API Test FAILED")
        print(f"   Error: {str(e)}")
        return False, None

def check_admin_user_exists():
    """Test 2: Check if admin user exists by attempting login"""
    print("\n👤 Checking if admin user exists...")
    
    # Try to login - if successful, user exists
    success, data = test_login_api()
    
    if success:
        print("✅ Admin user EXISTS in database")
        print(f"   User ID: {data['user']['id']}")
        print(f"   Full Name: {data['user']['full_name']}")
        print(f"   Role: {data['user']['role']}")
        return True
    else:
        print("❌ Admin user does NOT exist in database")
        return False

def create_admin_user():
    """Create admin user if it doesn't exist"""
    print("\n🔧 Creating admin user...")
    
    user_data = {
        "email": ADMIN_EMAIL,
        "password": ADMIN_PASSWORD,
        "full_name": "مدير النظام",
        "role": "admin"
    }
    
    try:
        response = requests.post(
            f"{BACKEND_URL}/auth/register",
            json=user_data,
            headers={"Content-Type": "application/json"},
            timeout=10
        )
        
        print(f"   Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print("✅ Admin user created successfully")
            print(f"   User ID: {data['user']['id']}")
            print(f"   Email: {data['user']['email']}")
            print(f"   Role: {data['user']['role']}")
            return True
        else:
            print("❌ Failed to create admin user")
            print(f"   Response: {response.text}")
            return False
            
    except Exception as e:
        print("❌ Failed to create admin user")
        print(f"   Error: {str(e)}")
        return False

def main():
    """Main test execution"""
    print("=" * 60)
    print("🚀 Quick Login API Test")
    print("=" * 60)
    
    # Test 2: Check if admin user exists
    admin_exists = check_admin_user_exists()
    
    # If admin doesn't exist, create it
    if not admin_exists:
        print("\n📝 Admin user not found. Creating admin user...")
        created = create_admin_user()
        
        if created:
            print("\n🔄 Retesting login after user creation...")
            admin_exists = check_admin_user_exists()
        else:
            print("\n❌ Could not create admin user. Login test cannot proceed.")
            return False
    
    # Final summary
    print("\n" + "=" * 60)
    print("📊 TEST SUMMARY")
    print("=" * 60)
    
    if admin_exists:
        print("✅ Login API: WORKING")
        print("✅ Admin User: EXISTS")
        print("✅ Credentials: admin@test.com / admin123")
        print("✅ Role: admin")
        print("\n🎉 All tests PASSED!")
        return True
    else:
        print("❌ Login API: FAILED")
        print("❌ Admin User: NOT FOUND")
        print("\n⚠️  Tests FAILED!")
        return False

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)