#!/usr/bin/env python3
"""
Script to create test social data for the travel app
Creates test trips and users for social features testing
"""

import firebase_admin
from firebase_admin import credentials, firestore
import random
from datetime import datetime, timedelta
import uuid

# Initialize Firebase
try:
    cred = credentials.Certificate("trip-planner-c26a1-firebase-adminsdk-fbsvc-2335655c89.json")
    firebase_admin.initialize_app(cred)
    db = firestore.client()
    print("✅ Firebase initialized successfully")
except Exception as e:
    print(f"❌ Firebase initialization failed: {e}")
    exit(1)

def create_test_trip(user_id, destination, start_date, end_date, travel_style, budget, interests):
    """Create a test trip for a user"""
    try:
        trip_data = {
            "destination": destination,
            "start_date": start_date,
            "end_date": end_date,
            "travel_style": travel_style,
            "budget": budget,
            "interests": interests,
            "created_at": datetime.now().isoformat(),
            "status": "active"
        }
        
        trip_ref = db.collection("users").document(user_id).collection("trips").add(trip_data)
        trip_id = trip_ref[1].id
        
        print(f"✅ Created trip for {user_id}: {destination} ({start_date} to {end_date})")
        return trip_id
        
    except Exception as e:
        print(f"❌ Error creating trip for {user_id}: {e}")
        return None

def create_test_user(user_id, name, email, interests, travel_style):
    """Create a test user profile"""
    try:
        user_data = {
            "name": name,
            "email": email,
            "interests": interests,
            "travel_style": travel_style,
            "created_at": datetime.now().isoformat(),
            "profile_complete": True
        }
        
        db.collection("users").document(user_id).set(user_data)
        print(f"✅ Created user: {name} ({email})")
        return True
        
    except Exception as e:
        print(f"❌ Error creating user {user_id}: {e}")
        return False

def create_similar_travelers():
    """Create test users with similar trips for social matching"""
    
    # Test destinations and dates
    destinations = [
        ("Paris", "2024-03-15", "2024-03-20"),
        ("Tokyo", "2024-04-10", "2024-04-15"),
        ("Rome", "2024-05-05", "2024-05-10"),
        ("Barcelona", "2024-06-01", "2024-06-06"),
        ("Amsterdam", "2024-07-15", "2024-07-20")
    ]
    
    # Test users
    test_users = [
        {
            "id": "test_user_1",
            "name": "Alice Johnson",
            "email": "alice@example.com",
            "interests": ["photography", "food", "art"],
            "travel_style": "cultural"
        },
        {
            "id": "test_user_2", 
            "name": "Bob Smith",
            "email": "bob@example.com",
            "interests": ["adventure", "hiking", "nature"],
            "travel_style": "adventure"
        },
        {
            "id": "test_user_3",
            "name": "Carol Davis",
            "email": "carol@example.com", 
            "interests": ["food", "shopping", "nightlife"],
            "travel_style": "luxury"
        },
        {
            "id": "test_user_4",
            "name": "David Wilson",
            "email": "david@example.com",
            "interests": ["history", "museums", "architecture"],
            "travel_style": "cultural"
        },
        {
            "id": "test_user_5",
            "name": "Eva Brown",
            "email": "eva@example.com",
            "interests": ["photography", "nature", "wellness"],
            "travel_style": "relaxation"
        }
    ]
    
    # Create users and their trips
    for i, user in enumerate(test_users):
        # Create user profile
        create_test_user(
            user["id"],
            user["name"], 
            user["email"],
            user["interests"],
            user["travel_style"]
        )
        
        # Create 2-3 trips for each user
        for j in range(random.randint(2, 3)):
            dest, start, end = random.choice(destinations)
            budget = random.randint(20000, 100000)
            
            create_test_trip(
                user["id"],
                dest,
                start,
                end,
                user["travel_style"],
                budget,
                user["interests"]
            )

def create_meetup_requests():
    """Create some test meetup requests"""
    try:
        # Create meetup requests between test users
        meetup_requests = [
            {
                "requester_id": "test_user_1",
                "destination": "Paris",
                "date": "2024-03-16",
                "activity": "City tour and photography walk",
                "max_participants": 4,
                "description": "Let's explore Paris together! Looking for fellow photography enthusiasts.",
                "status": "pending",
                "created_at": datetime.now().isoformat()
            },
            {
                "requester_id": "test_user_2", 
                "destination": "Tokyo",
                "date": "2024-04-12",
                "activity": "Adventure activities and local food",
                "max_participants": 3,
                "description": "Adventure seekers wanted! Let's try some exciting activities in Tokyo.",
                "status": "pending",
                "created_at": datetime.now().isoformat()
            },
            {
                "requester_id": "test_user_3",
                "destination": "Rome", 
                "date": "2024-05-07",
                "activity": "Food tour and shopping",
                "max_participants": 5,
                "description": "Food lovers unite! Let's discover the best local cuisine in Rome.",
                "status": "pending",
                "created_at": datetime.now().isoformat()
            }
        ]
        
        for request in meetup_requests:
            # Add to each test user's meetup requests
            for user_id in ["test_user_1", "test_user_2", "test_user_3", "test_user_4", "test_user_5"]:
                if user_id != request["requester_id"]:
                    db.collection("users").document(user_id).collection("meetup_requests").add(request)
        
        print("✅ Created test meetup requests")
        
    except Exception as e:
        print(f"❌ Error creating meetup requests: {e}")

def main():
    """Main function to create all test data"""
    print("🚀 Creating test social data...")
    
    # Create test users and trips
    create_similar_travelers()
    
    # Create meetup requests
    create_meetup_requests()
    
    print("✅ Test social data creation completed!")
    print("\n📋 Test Users Created:")
    print("1. Alice Johnson (alice@example.com) - Cultural traveler")
    print("2. Bob Smith (bob@example.com) - Adventure traveler") 
    print("3. Carol Davis (carol@example.com) - Luxury traveler")
    print("4. David Wilson (david@example.com) - Cultural traveler")
    print("5. Eva Brown (eva@example.com) - Relaxation traveler")
    print("\n🎯 You can now test social features with these users!")

if __name__ == "__main__":
    main()
