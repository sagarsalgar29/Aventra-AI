#!/usr/bin/env python3
"""
Script to set up Ooty trips for testing social features
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

def create_ooty_trips_for_testing():
    """Create Ooty trips for multiple users to test social features"""
    try:
        # Create test users with Ooty trips
        test_users = [
            {
                "name": "Priya Sharma",
                "email": "priya@example.com",
                "travel_style": "cultural",
                "interests": ["photography", "nature", "food"],
                "ooty_trip": {
                    "destination": "Ooty",
                    "start_date": "2024-04-18",
                    "end_date": "2024-04-22",
                    "travel_style": "cultural",
                    "budget": 35000,
                    "interests": ["photography", "nature", "food", "history"]
                }
            },
            {
                "name": "Raj Kumar",
                "email": "raj@example.com", 
                "travel_style": "adventure",
                "interests": ["hiking", "nature", "photography"],
                "ooty_trip": {
                    "destination": "Ooty",
                    "start_date": "2024-04-20",
                    "end_date": "2024-04-25",
                    "travel_style": "adventure",
                    "budget": 28000,
                    "interests": ["hiking", "nature", "photography", "trekking"]
                }
            },
            {
                "name": "Meera Patel",
                "email": "meera@example.com",
                "travel_style": "relaxation",
                "interests": ["nature", "wellness", "photography"],
                "ooty_trip": {
                    "destination": "Ooty",
                    "start_date": "2024-04-15",
                    "end_date": "2024-04-20",
                    "travel_style": "relaxation",
                    "budget": 40000,
                    "interests": ["nature", "wellness", "photography", "spa"]
                }
            }
        ]
        
        created_users = []
        
        for user_data in test_users:
            # Create user profile
            user_profile = {
                "name": user_data["name"],
                "email": user_data["email"],
                "travel_style": user_data["travel_style"],
                "interests": user_data["interests"],
                "created_at": "2024-01-15T10:00:00Z",
                "profile_complete": True
            }
            
            user_ref = db.collection("users").add(user_profile)
            user_id = user_ref[1].id
            
            # Create Ooty trip
            trip_data = {
                **user_data["ooty_trip"],
                "created_at": "2024-01-15T10:00:00Z",
                "status": "active"
            }
            
            trip_ref = db.collection("users").document(user_id).collection("trips").add(trip_data)
            trip_id = trip_ref[1].id
            
            created_users.append({
                "user_id": user_id,
                "name": user_data["name"],
                "email": user_data["email"],
                "trip_id": trip_id,
                "destination": trip_data["destination"],
                "dates": f"{trip_data['start_date']} to {trip_data['end_date']}",
                "budget": trip_data["budget"]
            })
            
            print(f"✅ Created user: {user_data['name']}")
            print(f"   Email: {user_data['email']}")
            print(f"   Ooty Trip: {trip_data['start_date']} to {trip_data['end_date']}")
            print(f"   Budget: ₹{trip_data['budget']}")
            print(f"   Interests: {trip_data['interests']}")
            print()
        
        return created_users
        
    except Exception as e:
        print(f"❌ Error creating test users: {e}")
        return []

def create_meetup_requests():
    """Create some meetup requests for Ooty"""
    try:
        # Get all users with Ooty trips
        users_ref = db.collection("users")
        users = users_ref.stream()
        
        ooty_users = []
        for user in users:
            user_data = user.to_dict()
            user_trips = db.collection("users").document(user.id).collection("trips").stream()
            
            for trip in user_trips:
                trip_data = trip.to_dict()
                if trip_data.get('destination', '').lower() == 'ooty':
                    ooty_users.append({
                        "user_id": user.id,
                        "name": user_data.get('name', 'Unknown'),
                        "trip_id": trip.id
                    })
                    break
        
        if len(ooty_users) < 2:
            print("❌ Need at least 2 users with Ooty trips to create meetup requests")
            return
        
        # Create meetup requests
        meetup_requests = [
            {
                "destination": "Ooty",
                "date": "2024-04-20",
                "activity": "Photography walk in Botanical Gardens",
                "max_participants": 4,
                "description": "Let's explore the beautiful Botanical Gardens together and capture some amazing photos!",
                "requester_id": ooty_users[0]["user_id"],
                "requester_name": ooty_users[0]["name"],
                "status": "pending"
            },
            {
                "destination": "Ooty",
                "date": "2024-04-22",
                "activity": "Nature trek to Doddabetta Peak",
                "max_participants": 6,
                "description": "Join me for an adventurous trek to Doddabetta Peak for breathtaking views!",
                "requester_id": ooty_users[1]["user_id"] if len(ooty_users) > 1 else ooty_users[0]["user_id"],
                "requester_name": ooty_users[1]["name"] if len(ooty_users) > 1 else ooty_users[0]["name"],
                "status": "pending"
            }
        ]
        
        for request in meetup_requests:
            # Add to all other users' meetup requests
            for user in ooty_users:
                if user["user_id"] != request["requester_id"]:
                    db.collection("users").document(user["user_id"]).collection("meetup_requests").add(request)
            
            print(f"✅ Created meetup request: {request['activity']}")
            print(f"   By: {request['requester_name']}")
            print(f"   Date: {request['date']}")
            print(f"   Max participants: {request['max_participants']}")
            print()
        
    except Exception as e:
        print(f"❌ Error creating meetup requests: {e}")

def main():
    """Main function to set up Ooty social test data"""
    print("🎯 Setting up Ooty trips for social features testing...")
    
    # Create test users with Ooty trips
    created_users = create_ooty_trips_for_testing()
    
    if created_users:
        print(f"\n✅ Created {len(created_users)} users with Ooty trips:")
        for user in created_users:
            print(f"   - {user['name']} ({user['email']})")
            print(f"     Trip: {user['destination']} - {user['dates']}")
            print(f"     Budget: ₹{user['budget']}")
            print()
        
        # Create meetup requests
        print("📝 Creating meetup requests...")
        create_meetup_requests()
        
        print(f"\n🎉 Test setup complete!")
        print(f"\n📋 How to test social features:")
        print(f"   1. Login as Sagar (sagar.salgar@tekditechnologies.com)")
        print(f"   2. Create an Ooty trip in 'My Trips' if you don't have one")
        print(f"   3. Go to 'Social' tab")
        print(f"   4. Select your Ooty trip")
        print(f"   5. You should see:")
        print(f"      - Similar travelers: Priya Sharma, Raj Kumar, Meera Patel")
        print(f"      - Meetup requests for Ooty activities")
        print(f"      - AI suggestions for Ooty")
        print(f"   6. Try creating a meetup request")
        print(f"   7. Test accepting/rejecting meetup requests")
        
    else:
        print("❌ Failed to create test users")

if __name__ == "__main__":
    main()

