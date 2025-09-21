#!/usr/bin/env python3
"""
Script to fix user types for existing users
"""

import firebase_admin
from firebase_admin import credentials, firestore
import json

# Initialize Firebase Admin
cred = credentials.Certificate("trip-planner-c26a1-firebase-adminsdk-fbsvc-2335655c89.json")
firebase_admin.initialize_app(cred)
db = firestore.client()

def fix_user_types():
    """Fix user types for existing users"""
    print("🔧 Fixing User Types for Existing Users")
    print("=" * 60)
    
    try:
        # Get all users
        users_ref = db.collection("users")
        users = users_ref.stream()
        
        fixed_count = 0
        
        for user_doc in users:
            user_data = user_doc.to_dict()
            user_id = user_doc.id
            current_type = user_data.get("user_type", "unknown")
            
            # Skip if user type is already set properly
            if current_type in ["traveler", "hotel"]:
                print(f"✅ {user_data.get('name', 'Unknown')} - Type already set: {current_type}")
                continue
            
            # Determine user type based on email or name patterns
            email = user_data.get("email", "").lower()
            name = user_data.get("name", "").lower()
            
            new_type = "traveler"  # Default to traveler
            
            # Check for hotel indicators
            if any(keyword in email for keyword in ["hotel", "partner", "business"]):
                new_type = "hotel"
            elif any(keyword in name for keyword in ["hotel", "partner", "business"]):
                new_type = "hotel"
            elif "hoteluser" in email or "hoteluser" in name:
                new_type = "hotel"
            
            # Update user type
            user_doc.reference.update({"user_type": new_type})
            print(f"✅ Updated {user_data.get('name', 'Unknown')} ({email}) - Type: {new_type}")
            fixed_count += 1
        
        print(f"\n📊 Summary:")
        print(f"   Users fixed: {fixed_count}")
        
        # Verify the fixes
        print(f"\n🔍 Verification - All users and their types:")
        print("-" * 50)
        
        users_ref = db.collection("users")
        users = users_ref.stream()
        
        traveler_count = 0
        hotel_count = 0
        
        for user_doc in users:
            user_data = user_doc.to_dict()
            user_type = user_data.get("user_type", "unknown")
            name = user_data.get("name", "Unknown")
            email = user_data.get("email", "Unknown")
            
            print(f"👤 {name} ({email}) - Type: {user_type}")
            
            if user_type == "traveler":
                traveler_count += 1
            elif user_type == "hotel":
                hotel_count += 1
        
        print(f"\n📈 Final Counts:")
        print(f"   Travelers: {traveler_count}")
        print(f"   Hotels: {hotel_count}")
        
        return True
        
    except Exception as e:
        print(f"❌ Error fixing user types: {e}")
        return False

if __name__ == "__main__":
    print("🚀 Fix User Types")
    print("=" * 60)
    
    fix_user_types()
    
    print("\n✅ Script completed!")
