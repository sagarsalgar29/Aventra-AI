#!/usr/bin/env python3
"""
Script to check how many users are going to Ooty in the database
"""

import firebase_admin
from firebase_admin import credentials, firestore
import json

# Initialize Firebase Admin
cred = credentials.Certificate("trip-planner-c26a1-firebase-adminsdk-fbsvc-2335655c89.json")
firebase_admin.initialize_app(cred)
db = firestore.client()

def check_ooty_users():
    """Check how many users have trips to Ooty"""
    print("🔍 Checking database for users going to Ooty...")
    print("=" * 50)
    
    users_with_ooty = []
    total_users = 0
    
    try:
        # Get all users
        users_ref = db.collection("users")
        users = users_ref.stream()
        
        for user_doc in users:
            total_users += 1
            user_data = user_doc.to_dict()
            user_id = user_doc.id
            
            print(f"👤 Checking user: {user_data.get('name', 'Unknown')} ({user_id})")
            
            # Check if user has trips to Ooty (case-insensitive)
            trips_ref = db.collection("users").document(user_id).collection("trips")
            all_trips = trips_ref.stream()
            trips = []
            for trip in all_trips:
                trip_data = trip.to_dict()
                if trip_data.get("destination", "").lower() == "ooty":
                    trips.append(trip)
            
            ooty_trips = []
            for trip in trips:
                trip_data = trip.to_dict()
                ooty_trips.append(trip_data)
            
            if ooty_trips:
                users_with_ooty.append({
                    "user_id": user_id,
                    "name": user_data.get("name", "Unknown"),
                    "email": user_data.get("email", "Unknown"),
                    "user_type": user_data.get("user_type", "traveler"),
                    "ooty_trips": len(ooty_trips),
                    "trip_details": ooty_trips
                })
                print(f"  ✅ Has {len(ooty_trips)} Ooty trip(s)")
                for i, trip in enumerate(ooty_trips):
                    print(f"    Trip {i+1}: {trip.get('start_date', 'N/A')} to {trip.get('end_date', 'N/A')}")
                    print(f"    Budget: ₹{trip.get('budget', 'N/A')}")
                    print(f"    Style: {trip.get('travel_style', 'N/A')}")
            else:
                print(f"  ❌ No Ooty trips")
        
        print("\n" + "=" * 50)
        print(f"📊 SUMMARY:")
        print(f"Total users in database: {total_users}")
        print(f"Users with Ooty trips: {len(users_with_ooty)}")
        
        if users_with_ooty:
            print(f"\n🎯 Users going to Ooty:")
            for i, user in enumerate(users_with_ooty, 1):
                print(f"{i}. {user['name']} ({user['email']})")
                print(f"   User Type: {user['user_type']}")
                print(f"   Ooty Trips: {user['ooty_trips']}")
                for j, trip in enumerate(user['trip_details']):
                    print(f"   Trip {j+1}: {trip.get('start_date', 'N/A')} to {trip.get('end_date', 'N/A')}")
                    print(f"   Budget: ₹{trip.get('budget', 'N/A')}")
                    print(f"   Interests: {trip.get('interests', [])}")
                print()
        else:
            print("\n❌ No users found with Ooty trips!")
            print("💡 You may need to:")
            print("   1. Create a trip to Ooty in the app")
            print("   2. Add sample users using the /add-sample-users endpoint")
        
    except Exception as e:
        print(f"❌ Error checking database: {e}")
        return False
    
    return True

def add_sample_users():
    """Add sample users for testing"""
    print("\n🔧 Adding sample users...")
    
    sample_users = [
        {
            "name": "Raj Kumar",
            "email": "raj@example.com",
            "user_type": "traveler",
            "travel_style": "adventure",
            "interests": ["hiking", "nature", "photography"],
            "budget_preference": "mid-range"
        },
        {
            "name": "Meera Patel", 
            "email": "meera@example.com",
            "user_type": "traveler",
            "travel_style": "relaxation",
            "interests": ["nature", "wellness", "photography"],
            "budget_preference": "luxury"
        },
        {
            "name": "Priya Sharma",
            "email": "priya@example.com", 
            "user_type": "traveler",
            "travel_style": "cultural",
            "interests": ["photography", "nature", "food"],
            "budget_preference": "mid-range"
        }
    ]
    
    try:
        for user_data in sample_users:
            # Create user document
            user_ref = db.collection("users").document()
            user_ref.set(user_data)
            
            # Add sample trip for each user
            trip_data = {
                "destination": "Ooty",
                "start_date": "2024-04-20",
                "end_date": "2024-04-25",
                "budget": 28000,
                "currency": "INR",
                "travel_style": user_data["travel_style"],
                "interests": user_data["interests"],
                "planned_activities": ["Mountain hiking", "Tea plantation tour", "Botanical garden visit"]
            }
            
            # Add trip to user's trips collection
            trip_ref = user_ref.collection("trips").document()
            trip_ref.set(trip_data)
            
            print(f"✅ Added user: {user_data['name']}")
        
        print(f"🎉 Successfully added {len(sample_users)} sample users!")
        return True
        
    except Exception as e:
        print(f"❌ Error adding sample users: {e}")
        return False

if __name__ == "__main__":
    print("🚀 Aventra AI - Database Checker")
    print("=" * 50)
    
    # Check current users
    success = check_ooty_users()
    
    if success:
        print("\n" + "=" * 50)
        choice = input("🤔 Do you want to add sample users? (y/n): ").lower().strip()
        
        if choice == 'y' or choice == 'yes':
            add_sample_users()
            print("\n🔄 Re-checking database...")
            check_ooty_users()
    
    print("\n✅ Script completed!")
