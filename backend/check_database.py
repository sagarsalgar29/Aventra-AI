#!/usr/bin/env python3
"""
Script to check database for user 'sagar' and their trips
"""

import firebase_admin
from firebase_admin import credentials, firestore
import json

# Initialize Firebase
try:
    cred = credentials.Certificate("trip-planner-c26a1-firebase-adminsdk-fbsvc-2335655c89.json")
    firebase_admin.initialize_app(cred)
    db = firestore.client()
    print("✅ Firebase initialized successfully")
except Exception as e:
    print(f"❌ Firebase initialization failed: {e}")
    exit(1)

def check_user_sagar():
    """Check for user 'sagar' and their trips"""
    try:
        # Get all users
        users_ref = db.collection("users")
        users = users_ref.stream()
        
        print("🔍 Searching for user 'sagar'...")
        sagar_found = False
        
        for user in users:
            user_data = user.to_dict()
            user_id = user.id
            
            # Check if this is sagar (by name or email)
            if (user_data.get('name', '').lower() == 'sagar' or 
                user_data.get('email', '').lower() == 'sagar' or
                'sagar' in user_data.get('name', '').lower()):
                
                sagar_found = True
                print(f"\n✅ Found user 'sagar':")
                print(f"   User ID: {user_id}")
                print(f"   Name: {user_data.get('name', 'N/A')}")
                print(f"   Email: {user_data.get('email', 'N/A')}")
                print(f"   Travel Style: {user_data.get('travel_style', 'N/A')}")
                print(f"   Interests: {user_data.get('interests', [])}")
                
                # Get their trips
                trips_ref = db.collection("users").document(user_id).collection("trips")
                trips = trips_ref.stream()
                
                print(f"\n📅 {user_data.get('name', 'User')}'s Trips:")
                trip_count = 0
                for trip in trips:
                    trip_data = trip.to_dict()
                    trip_count += 1
                    print(f"   {trip_count}. {trip_data.get('destination', 'Unknown')}")
                    print(f"      Dates: {trip_data.get('start_date', 'N/A')} to {trip_data.get('end_date', 'N/A')}")
                    print(f"      Style: {trip_data.get('travel_style', 'N/A')}")
                    print(f"      Budget: ₹{trip_data.get('budget', 0)}")
                    print(f"      Interests: {trip_data.get('interests', [])}")
                    print(f"      Trip ID: {trip.id}")
                    print()
                
                if trip_count == 0:
                    print("   No trips found for this user")
                
                return user_id, user_data
                
        if not sagar_found:
            print("❌ User 'sagar' not found")
            print("\n📋 All users in database:")
            users_ref = db.collection("users")
            users = users_ref.stream()
            for user in users:
                user_data = user.to_dict()
                print(f"   - {user_data.get('name', 'Unknown')} ({user_data.get('email', 'No email')})")
        
        return None, None
        
    except Exception as e:
        print(f"❌ Error checking user sagar: {e}")
        return None, None

def create_test_user_for_ooty():
    """Create another user with a trip to Ooty to test social features"""
    try:
        test_user_data = {
            "name": "Alice Johnson",
            "email": "alice@example.com",
            "travel_style": "cultural",
            "interests": ["photography", "nature", "history"],
            "created_at": "2024-01-15T10:00:00Z",
            "profile_complete": True
        }
        
        # Create user
        user_ref = db.collection("users").add(test_user_data)
        user_id = user_ref[1].id
        
        print(f"✅ Created test user: {test_user_data['name']} (ID: {user_id})")
        
        # Create Ooty trip for this user
        ooty_trip_data = {
            "destination": "Ooty",
            "start_date": "2024-03-20",
            "end_date": "2024-03-25",
            "travel_style": "cultural",
            "budget": 30000,
            "interests": ["photography", "nature", "history"],
            "created_at": "2024-01-15T10:00:00Z",
            "status": "active"
        }
        
        trip_ref = db.collection("users").document(user_id).collection("trips").add(ooty_trip_data)
        trip_id = trip_ref[1].id
        
        print(f"✅ Created Ooty trip for {test_user_data['name']}:")
        print(f"   Destination: {ooty_trip_data['destination']}")
        print(f"   Dates: {ooty_trip_data['start_date']} to {ooty_trip_data['end_date']}")
        print(f"   Budget: ₹{ooty_trip_data['budget']}")
        print(f"   Trip ID: {trip_id}")
        
        return user_id, trip_id
        
    except Exception as e:
        print(f"❌ Error creating test user: {e}")
        return None, None

def main():
    """Main function to check database and create test data"""
    print("🔍 Checking database for user 'sagar' and their trips...")
    
    # Check for sagar
    sagar_user_id, sagar_data = check_user_sagar()
    
    if sagar_user_id:
        print(f"\n🎯 Found sagar! Now creating another user with Ooty trip for testing...")
        
        # Create test user with Ooty trip
        test_user_id, test_trip_id = create_test_user_for_ooty()
        
        if test_user_id:
            print(f"\n✅ Test setup complete!")
            print(f"   - Sagar's user ID: {sagar_user_id}")
            print(f"   - Test user ID: {test_user_id}")
            print(f"   - Test trip ID: {test_trip_id}")
            print(f"\n🎉 You can now test social features:")
            print(f"   1. Login as Sagar")
            print(f"   2. Go to Social tab")
            print(f"   3. Select Ooty trip")
            print(f"   4. You should see Alice Johnson as a similar traveler!")
        else:
            print("❌ Failed to create test user")
    else:
        print("\n❌ Sagar not found. Please create a user named 'sagar' first.")

if __name__ == "__main__":
    main()

