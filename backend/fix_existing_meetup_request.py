#!/usr/bin/env python3
"""
Script to fix existing meetup request that wasn't properly stored in admin's collection
"""

import firebase_admin
from firebase_admin import credentials, firestore
import json

# Initialize Firebase Admin
cred = credentials.Certificate("trip-planner-c26a1-firebase-adminsdk-fbsvc-2335655c89.json")
firebase_admin.initialize_app(cred)
db = firestore.client()

def fix_existing_meetup_request():
    """Fix the existing meetup request from Sagar to admin"""
    print("🔧 Fixing existing meetup request...")
    print("=" * 60)
    
    admin_user_id = "hlNHw1j1TQO4gNaEWqXsjZDzyZq1"  # Admin user ID
    meetup_id = "MoUWofumRGFrKVsDC4d2"  # The meetup request ID we found
    
    try:
        # Get the meetup request from global collection
        meetup_ref = db.collection("meetups").document(meetup_id)
        meetup_doc = meetup_ref.get()
        
        if meetup_doc.exists:
            meetup_data = meetup_doc.to_dict()
            print(f"✅ Found meetup request: {meetup_data.get('activity', 'Unknown')}")
            print(f"   Requester: {meetup_data.get('requester_name', 'Unknown')}")
            print(f"   Target: {meetup_data.get('target_traveler_name', 'Unknown')}")
            
            # Store it in admin's meetup_requests collection
            admin_meetup_ref = db.collection("users").document(admin_user_id).collection("meetup_requests").document(meetup_id)
            admin_meetup_ref.set(meetup_data)
            
            print(f"✅ Successfully stored meetup request in admin's collection")
            
            # Verify it was stored
            admin_meetup_doc = admin_meetup_ref.get()
            if admin_meetup_doc.exists:
                print(f"✅ Verification successful - meetup request is now in admin's collection")
            else:
                print(f"❌ Verification failed - meetup request not found in admin's collection")
                
        else:
            print(f"❌ Meetup request {meetup_id} not found in global collection")
            
        return True
        
    except Exception as e:
        print(f"❌ Error fixing meetup request: {e}")
        return False

if __name__ == "__main__":
    print("🚀 Fix Existing Meetup Request")
    print("=" * 60)
    
    fix_existing_meetup_request()
    
    print("\n✅ Script completed!")
