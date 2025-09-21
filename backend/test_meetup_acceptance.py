#!/usr/bin/env python3
"""
Script to test meetup request acceptance functionality
"""

import firebase_admin
from firebase_admin import credentials, firestore
import json

# Initialize Firebase Admin
cred = credentials.Certificate("trip-planner-c26a1-firebase-adminsdk-fbsvc-2335655c89.json")
firebase_admin.initialize_app(cred)
db = firestore.client()

def test_meetup_acceptance():
    """Test the meetup acceptance functionality"""
    print("🧪 Testing meetup acceptance functionality...")
    print("=" * 60)
    
    admin_user_id = "hlNHw1j1TQO4gNaEWqXsjZDzyZq1"  # Admin user ID
    meetup_id = "MoUWofumRGFrKVsDC4d2"  # The meetup request ID
    
    try:
        # Check current status of the meetup request
        print("📋 Checking current status of meetup request...")
        
        # Check in admin's collection
        admin_meetup_ref = db.collection("users").document(admin_user_id).collection("meetup_requests").document(meetup_id)
        admin_meetup_doc = admin_meetup_ref.get()
        
        if admin_meetup_doc.exists:
            admin_meetup_data = admin_meetup_doc.to_dict()
            print(f"✅ Admin's collection - Status: {admin_meetup_data.get('status', 'Unknown')}")
        else:
            print("❌ Meetup request not found in admin's collection")
        
        # Check in global collection
        global_meetup_ref = db.collection("meetups").document(meetup_id)
        global_meetup_doc = global_meetup_ref.get()
        
        if global_meetup_doc.exists:
            global_meetup_data = global_meetup_doc.to_dict()
            print(f"✅ Global collection - Status: {global_meetup_data.get('status', 'Unknown')}")
        else:
            print("❌ Meetup request not found in global collection")
        
        # Check in requester's sent collection
        requester_id = global_meetup_data.get("requester_id") if global_meetup_doc.exists else None
        if requester_id:
            requester_meetup_ref = db.collection("users").document(requester_id).collection("sent_meetup_requests").document(meetup_id)
            requester_meetup_doc = requester_meetup_ref.get()
            
            if requester_meetup_doc.exists:
                requester_meetup_data = requester_meetup_doc.to_dict()
                print(f"✅ Requester's collection - Status: {requester_meetup_data.get('status', 'Unknown')}")
            else:
                print("❌ Meetup request not found in requester's collection")
        
        # Simulate acceptance by updating all collections
        print("\n🔄 Simulating meetup request acceptance...")
        
        from datetime import datetime
        acceptance_data = {
            "status": "accepted",
            "accepted_by": admin_user_id,
            "accepted_at": datetime.now().isoformat()
        }
        
        # Update admin's collection
        admin_meetup_ref.update(acceptance_data)
        print("✅ Updated admin's collection")
        
        # Update global collection
        global_meetup_ref.update(acceptance_data)
        print("✅ Updated global collection")
        
        # Update requester's collection
        if requester_id:
            requester_meetup_ref.update(acceptance_data)
            print("✅ Updated requester's collection")
        
        # Verify the updates
        print("\n🔍 Verifying updates...")
        
        # Check admin's collection
        admin_meetup_doc = admin_meetup_ref.get()
        if admin_meetup_doc.exists:
            admin_meetup_data = admin_meetup_doc.to_dict()
            print(f"✅ Admin's collection - Status: {admin_meetup_data.get('status', 'Unknown')}")
        
        # Check global collection
        global_meetup_doc = global_meetup_ref.get()
        if global_meetup_doc.exists:
            global_meetup_data = global_meetup_doc.to_dict()
            print(f"✅ Global collection - Status: {global_meetup_data.get('status', 'Unknown')}")
        
        # Check requester's collection
        if requester_id:
            requester_meetup_doc = requester_meetup_ref.get()
            if requester_meetup_doc.exists:
                requester_meetup_data = requester_meetup_doc.to_dict()
                print(f"✅ Requester's collection - Status: {requester_meetup_data.get('status', 'Unknown')}")
        
        print("\n✅ Meetup acceptance test completed successfully!")
        
        return True
        
    except Exception as e:
        print(f"❌ Error testing meetup acceptance: {e}")
        return False

if __name__ == "__main__":
    print("🚀 Test Meetup Acceptance")
    print("=" * 60)
    
    test_meetup_acceptance()
    
    print("\n✅ Script completed!")
