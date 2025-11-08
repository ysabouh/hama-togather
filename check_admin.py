#!/usr/bin/env python3
"""
Check if admin user exists and create if needed
"""

import asyncio
import os
from motor.motor_asyncio import AsyncIOMotorClient
from passlib.context import CryptContext
from datetime import datetime, timezone
import uuid

# MongoDB connection
mongo_url = "mongodb://localhost:27017"
client = AsyncIOMotorClient(mongo_url)
db = client["tabni_platform"]

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

async def check_and_create_admin():
    """Check if admin user exists, create if not"""
    
    # Check if admin user exists
    admin_user = await db.users.find_one({"email": "admin@test.com"})
    
    if admin_user:
        print("✅ Admin user already exists")
        print(f"   Email: {admin_user['email']}")
        print(f"   Role: {admin_user['role']}")
        return True
    else:
        print("❌ Admin user not found, creating...")
        
        # Create admin user
        hashed_password = pwd_context.hash("admin123")
        
        admin_doc = {
            "id": str(uuid.uuid4()),
            "email": "admin@test.com",
            "full_name": "Admin User",
            "role": "admin",
            "password": hashed_password,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        
        await db.users.insert_one(admin_doc)
        print("✅ Admin user created successfully")
        print(f"   Email: admin@test.com")
        print(f"   Password: admin123")
        print(f"   Role: admin")
        return True

async def check_hero_content():
    """Check current hero content structure"""
    print("\n📖 Checking current hero content...")
    
    content = await db.hero_content.find_one({"id": "hero_content"}, {"_id": 0})
    
    if content:
        print("✅ Hero content exists in database")
        print(f"   Title: {content.get('title', 'N/A')}")
        print(f"   Has background_image: {'background_image' in content}")
        print(f"   Has video_url: {'video_url' in content}")
        print(f"   Has video_title: {'video_title' in content}")
        print(f"   Quotes count: {len(content.get('quotes', []))}")
        
        # Check for missing fields
        required_fields = [
            'title', 'subtitle', 'cta_text', 'cta_link', 
            'background_image', 'quotes', 'video_url', 
            'video_title', 'video_description', 'video_subtitle'
        ]
        
        missing_fields = [field for field in required_fields if field not in content]
        if missing_fields:
            print(f"⚠️  Missing fields in database: {missing_fields}")
        else:
            print("✅ All required fields present in database")
            
    else:
        print("❌ No hero content found in database")
    
    return content

async def main():
    """Main execution"""
    print("🔍 Checking Admin User and Hero Content...")
    print("=" * 50)
    
    await check_and_create_admin()
    await check_hero_content()
    
    client.close()

if __name__ == "__main__":
    asyncio.run(main())