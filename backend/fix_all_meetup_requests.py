#!/usr/bin/env python3
"""
Script to fix all existing meetup requests that weren't properly stored in target users' collections
"""

import firebase_admin
from firebase_admin import credentials, firestore
import json

# Initialize Firebase Admin
cred = credentials.Certificate("trip-planner-c26a1-firebase-adminsdk-fbsvc-2335655c89.json")
firebase_admin.initialize_app(cred)
db = firestore.client()

def fix_all_meetup_requests():
    """Fix all existing meetup requests"""
    print("🔧 Fixing all existing meetup requests...")
    print("=" * 60)
    
    try:
        # Get all meetup requests from global collection
        meetups_ref = db.collection("meetups")
        meetups = meetups_ref.stream()
        
        fixed_count = 0
        total_count = 0
        
        for meetup in meetups:
            meetup_data = meetup.to_dict()
            meetup_id = meetup.id
            target_traveler_id = meetup_data.get("target_traveler_id")
            
            total_count += 1
            
            if target_traveler_id:
                print(f"📋 Processing meetup {meetup_id}: {meetup_data.get('activity', 'Unknown')}")
                print(f"   Target: {meetup_data.get('target_traveler_name', 'Unknown')} (ID: {target_traveler_id})")
                
                # Check if it's already in target user's collection
                target_meetup_ref = db.collection("users").document(target_traveler_id).collection("meetup_requests").document(meetup_id)
                target_meetup_doc = target_meetup_ref.get()
                
                if not target_meetup_doc.exists:
                    # Store it in target user's meetup_requests collection
                    target_meetup_ref.set(meetup_data)
                    print(f"   ✅ Fixed - stored in target user's collection")
                    fixed_count += 1
                else:
                    print(f"   ✅ Already exists in target user's collection")
            else:
                print(f"📋 Skipping meetup {meetup_id} - no target traveler")
        
        print(f"\n📊 Summary:")
        print(f"   Total meetup requests: {total_count}")
        print(f"   Fixed: {fixed_count}")
        print(f"   Already correct: {total_count - fixed_count}")
        
        return True
        
    except Exception as e:
        print(f"❌ Error fixing meetup requests: {e}")
        return False

if __name__ == "__main__":
    print("🚀 Fix All Meetup Requests")
    print("=" * 60)
    
    fix_all_meetup_requests()
    
    print("\n✅ Script completed!")
