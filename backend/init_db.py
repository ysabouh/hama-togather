#!/usr/bin/env python3
"""
Script to initialize the database with default data
"""
import asyncio
import os
from datetime import datetime, timezone
from motor.motor_asyncio import AsyncIOMotorClient
from passlib.context import CryptContext

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def get_password_hash(password):
    return pwd_context.hash(password)

async def init_database():
    # Connect to MongoDB
    MONGO_URL = os.getenv("MONGO_URL", "mongodb://localhost:27017/")
    DB_NAME = os.getenv("DB_NAME", "tabni_platform")
    
    client = AsyncIOMotorClient(MONGO_URL)
    db = client[DB_NAME]
    
    print(f"📊 Initializing database: {DB_NAME}")
    print("=" * 50)
    
    # 1. Create admin user if not exists
    print("\n1️⃣ Checking admin user...")
    admin_exists = await db.users.find_one({"email": "admin@example.com"})
    
    if not admin_exists:
        admin_user = {
            "id": "admin-001",
            "full_name": "Admin User",
            "email": "admin@example.com",
            "password": get_password_hash("admin"),
            "role": "admin",
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.users.insert_one(admin_user)
        print("   ✅ Created admin user: admin@example.com / admin")
    else:
        # Update password to ensure it's correct
        await db.users.update_one(
            {"email": "admin@example.com"},
            {"$set": {"password": get_password_hash("admin")}}
        )
        print("   ✅ Admin user exists, password updated")
    
    # 2. Create default positions
    print("\n2️⃣ Checking positions...")
    positions_count = await db.positions.count_documents({})
    
    if positions_count == 0:
        default_positions = [
            "رئيس اللجنة",
            "نائب الرئيس",
            "أمين الصندوق",
            "مسؤول التواصل",
            "مسؤول المشاريع",
            "مسؤول التوعية",
            "عضو لجنة"
        ]
        
        for i, title in enumerate(default_positions):
            position = {
                "id": f"pos-{i+1:03d}",
                "title": title,
                "created_at": datetime.now(timezone.utc).isoformat()
            }
            await db.positions.insert_one(position)
        print(f"   ✅ Created {len(default_positions)} positions")
    else:
        print(f"   ✅ Positions exist ({positions_count} positions)")
    
    # 3. Create sample neighborhoods if needed
    print("\n3️⃣ Checking neighborhoods...")
    neighborhoods_count = await db.neighborhoods.count_documents({})
    
    if neighborhoods_count < 3:
        print("   📝 Creating sample neighborhoods...")
        sample_neighborhoods = [
            {
                "id": "neigh-001",
                "name": "حي العزيزية",
                "number": "1",
                "families_count": 25,
                "population_count": 125,
                "is_active": True,
                "polygon_coordinates": None,
                "image": None,
                "logo": None,
                "created_at": datetime.now(timezone.utc).isoformat()
            },
            {
                "id": "neigh-002",
                "name": "حي الشهداء",
                "number": "2",
                "families_count": 30,
                "population_count": 150,
                "is_active": True,
                "polygon_coordinates": None,
                "image": None,
                "logo": None,
                "created_at": datetime.now(timezone.utc).isoformat()
            },
            {
                "id": "neigh-003",
                "name": "حي السلام",
                "number": "3",
                "families_count": 20,
                "population_count": 100,
                "is_active": True,
                "polygon_coordinates": None,
                "image": None,
                "logo": None,
                "created_at": datetime.now(timezone.utc).isoformat()
            }
        ]
        
        for neighborhood in sample_neighborhoods:
            # Check if already exists
            exists = await db.neighborhoods.find_one({"id": neighborhood["id"]})
            if not exists:
                await db.neighborhoods.insert_one(neighborhood)
        
        print(f"   ✅ Created 3 sample neighborhoods")
    else:
        print(f"   ✅ Neighborhoods exist ({neighborhoods_count} neighborhoods)")
    
    # 4. Summary
    print("\n" + "=" * 50)
    print("📊 Database Summary:")
    print(f"   • Users: {await db.users.count_documents({})}")
    print(f"   • Positions: {await db.positions.count_documents({})}")
    print(f"   • Neighborhoods: {await db.neighborhoods.count_documents({})}")
    print(f"   • Families: {await db.families.count_documents({})}")
    print(f"   • Health Cases: {await db.health_cases.count_documents({})}")
    print("\n✅ Database initialization complete!")
    print("\n🔐 Login credentials:")
    print("   Email: admin@example.com")
    print("   Password: admin")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(init_database())
