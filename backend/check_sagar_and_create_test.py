#!/usr/bin/env python3
"""
Script to check for user 'sagar' with email sagar.salgar@tekditechnologies.com
and create test data for social features
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
    """Check for user 'sagar' with the specific email"""
    try:
        # Get all users
        users_ref = db.collection("users")
        users = users_ref.stream()
        
        print("🔍 Searching for user 'sagar' with email sagar.salgar@tekditechnologies.com...")
        sagar_found = False
        
        for user in users:
            user_data = user.to_dict()
            user_id = user.id
            
            # Check if this is sagar by email
            if user_data.get('email', '').lower() == 'sagar.salgar@tekditechnologies.com':
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
                
                print(f"\n📅 Sagar's Trips:")
                trip_count = 0
                ooty_trip_found = False
                
                for trip in trips:
                    trip_data = trip.to_dict()
                    trip_count += 1
                    print(f"   {trip_count}. {trip_data.get('destination', 'Unknown')}")
                    print(f"      Dates: {trip_data.get('start_date', 'N/A')} to {trip_data.get('end_date', 'N/A')}")
                    print(f"      Style: {trip_data.get('travel_style', 'N/A')}")
                    print(f"      Budget: ₹{trip_data.get('budget', 0)}")
                    print(f"      Interests: {trip_data.get('interests', [])}")
                    print(f"      Trip ID: {trip.id}")
                    
                    if trip_data.get('destination', '').lower() == 'ooty':
                        ooty_trip_found = True
                        print(f"      🎯 This is the Ooty trip!")
                    print()
                
                if trip_count == 0:
                    print("   No trips found for Sagar")
                elif not ooty_trip_found:
                    print("   ⚠️  No Ooty trip found for Sagar")
                
                return user_id, user_data, ooty_trip_found
                
        if not sagar_found:
            print("❌ User 'sagar' with email sagar.salgar@tekditechnologies.com not found")
            print("\n📋 All users in database:")
            users_ref = db.collection("users")
            users = users_ref.stream()
            for user in users:
                user_data = user.to_dict()
                print(f"   - {user_data.get('name', 'Unknown')} ({user_data.get('email', 'No email')})")
        
        return None, None, False
        
    except Exception as e:
        print(f"❌ Error checking user sagar: {e}")
        return None, None, False

def create_ooty_trip_for_sagar(user_id):
    """Create an Ooty trip for Sagar if he doesn't have one"""
    try:
        ooty_trip_data = {
            "destination": "Ooty",
            "start_date": "2024-04-15",
            "end_date": "2024-04-20",
            "travel_style": "adventure",
            "budget": 25000,
            "interests": ["nature", "photography", "hiking"],
            "created_at": "2024-01-15T10:00:00Z",
            "status": "active"
        }
        
        trip_ref = db.collection("users").document(user_id).collection("trips").add(ooty_trip_data)
        trip_id = trip_ref[1].id
        
        print(f"✅ Created Ooty trip for Sagar:")
        print(f"   Destination: {ooty_trip_data['destination']}")
        print(f"   Dates: {ooty_trip_data['start_date']} to {ooty_trip_data['end_date']}")
        print(f"   Budget: ₹{ooty_trip_data['budget']}")
        print(f"   Trip ID: {trip_id}")
        
        return trip_id
        
    except Exception as e:
        print(f"❌ Error creating Ooty trip for Sagar: {e}")
        return None

def create_test_user_for_ooty():
    """Create another user with a trip to Ooty to test social features"""
    try:
        test_user_data = {
            "name": "Priya Sharma",
            "email": "priya@example.com",
            "travel_style": "cultural",
            "interests": ["photography", "nature", "food"],
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
            "start_date": "2024-04-18",
            "end_date": "2024-04-22",
            "travel_style": "cultural",
            "budget": 35000,
            "interests": ["photography", "nature", "food", "history"],
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
    """Main function to check Sagar and create test data"""
    print("🔍 Checking for Sagar (sagar.salgar@tekditechnologies.com) and their trips...")
    
    # Check for sagar
    sagar_user_id, sagar_data, has_ooty_trip = check_user_sagar()
    
    if sagar_user_id:
        print(f"\n🎯 Found Sagar! User ID: {sagar_user_id}")
        
        # Create Ooty trip for Sagar if he doesn't have one
        if not has_ooty_trip:
            print(f"\n📅 Creating Ooty trip for Sagar...")
            sagar_trip_id = create_ooty_trip_for_sagar(sagar_user_id)
        else:
            print(f"\n✅ Sagar already has an Ooty trip!")
            sagar_trip_id = "existing"
        
        print(f"\n👥 Creating another user with Ooty trip for testing social features...")
        
        # Create test user with Ooty trip
        test_user_id, test_trip_id = create_test_user_for_ooty()
        
        if test_user_id:
            print(f"\n✅ Test setup complete!")
            print(f"   - Sagar's user ID: {sagar_user_id}")
            print(f"   - Sagar's Ooty trip: {'Created' if sagar_trip_id != 'existing' else 'Already exists'}")
            print(f"   - Test user ID: {test_user_id}")
            print(f"   - Test trip ID: {test_trip_id}")
            print(f"\n🎉 You can now test social features:")
            print(f"   1. Login as Sagar (sagar.salgar@tekditechnologies.com)")
            print(f"   2. Go to Social tab")
            print(f"   3. Select Ooty trip")
            print(f"   4. You should see Priya Sharma as a similar traveler!")
            print(f"   5. You can create meetup requests and see AI suggestions for Ooty!")
        else:
            print("❌ Failed to create test user")
    else:
        print("\n❌ Sagar not found. Please make sure the user is logged in with sagar.salgar@tekditechnologies.com")

if __name__ == "__main__":
    main()

