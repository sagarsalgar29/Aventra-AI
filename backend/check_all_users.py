#!/usr/bin/env python3
"""
Script to check all users in the database
"""

import firebase_admin
from firebase_admin import credentials, firestore
import json

# Initialize Firebase Admin
cred = credentials.Certificate("trip-planner-c26a1-firebase-adminsdk-fbsvc-2335655c89.json")
firebase_admin.initialize_app(cred)
db = firestore.client()

def check_all_users():
    """Check all users in the database"""
    print("🔍 Checking ALL users in database...")
    print("=" * 60)
    
    all_users = []
    
    try:
        # Get all users
        users_ref = db.collection("users")
        users = users_ref.stream()
        
        for user_doc in users:
            user_data = user_doc.to_dict()
            user_id = user_doc.id
            
            all_users.append({
                "user_id": user_id,
                "name": user_data.get("name", "Unknown"),
                "email": user_data.get("email", "Unknown"),
                "user_type": user_data.get("user_type", "unknown")
            })
        
        print(f"📊 Total users in database: {len(all_users)}")
        print("\n👥 ALL USERS:")
        print("-" * 60)
        
        for i, user in enumerate(all_users, 1):
            print(f"{i:2d}. {user['name']}")
            print(f"    Email: {user['email']}")
            print(f"    ID: {user['user_id']}")
            print(f"    Type: {user['user_type']}")
            print()
        
        # Check for specific user
        print("🔍 Looking for 'Sagar Salgar'...")
        sagar_found = False
        for user in all_users:
            if "sagar" in user['name'].lower() or "salgar" in user['name'].lower():
                print(f"✅ Found: {user['name']} ({user['email']})")
                sagar_found = True
        
        if not sagar_found:
            print("❌ 'Sagar Salgar' not found in database")
            print("💡 This means the user data is not being stored when they login")
        
    except Exception as e:
        print(f"❌ Error checking database: {e}")
        return False
    
    return True

if __name__ == "__main__":
    print("🚀 Aventra AI - All Users Checker")
    print("=" * 60)
    
    check_all_users()
    
    print("\n✅ Script completed!")
