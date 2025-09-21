#!/usr/bin/env python3
"""
Script to test hotel user type functionality
"""

import firebase_admin
from firebase_admin import credentials, firestore
import json

# Initialize Firebase Admin
cred = credentials.Certificate("trip-planner-c26a1-firebase-adminsdk-fbsvc-2335655c89.json")
firebase_admin.initialize_app(cred)
db = firestore.client()

def test_hotel_user_type():
    """Test hotel user type functionality"""
    print("🏨 Testing Hotel User Type Functionality")
    print("=" * 60)
    
    try:
        # Check all users and their types
        users_ref = db.collection("users")
        users = users_ref.stream()
        
        print("📋 All users and their types:")
        print("-" * 40)
        
        for user_doc in users:
            user_data = user_doc.to_dict()
            user_id = user_doc.id
            user_type = user_data.get("user_type", "unknown")
            name = user_data.get("name", "Unknown")
            email = user_data.get("email", "Unknown")
            
            print(f"👤 {name}")
            print(f"   Email: {email}")
            print(f"   ID: {user_id}")
            print(f"   Type: {user_type}")
            print()
        
        # Check if there are any hotel users
        hotel_users = []
        users_ref = db.collection("users")
        users = users_ref.stream()
        
        for user_doc in users:
            user_data = user_doc.to_dict()
            if user_data.get("user_type") == "hotel":
                hotel_users.append({
                    "id": user_doc.id,
                    "name": user_data.get("name", "Unknown"),
                    "email": user_data.get("email", "Unknown")
                })
        
        print(f"🏨 Hotel users found: {len(hotel_users)}")
        for hotel_user in hotel_users:
            print(f"   - {hotel_user['name']} ({hotel_user['email']})")
        
        # Create a test hotel user if none exist
        if len(hotel_users) == 0:
            print("\n🔧 Creating test hotel user...")
            test_hotel_data = {
                "name": "Test Hotel Partner",
                "email": "hotel@test.com",
                "user_type": "hotel",
                "travel_style": "luxury",
                "interests": ["hospitality", "tourism"],
                "budget_preference": "high-end"
            }
            
            hotel_ref = db.collection("users").add(test_hotel_data)
            hotel_id = hotel_ref[1].id
            
            print(f"✅ Created test hotel user: {test_hotel_data['name']} (ID: {hotel_id})")
        
        return True
        
    except Exception as e:
        print(f"❌ Error testing hotel user type: {e}")
        return False

if __name__ == "__main__":
    print("🚀 Hotel User Type Test")
    print("=" * 60)
    
    test_hotel_user_type()
    
    print("\n✅ Script completed!")
