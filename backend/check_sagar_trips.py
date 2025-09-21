#!/usr/bin/env python3
"""
Script to check Sagar's trips specifically
"""

import firebase_admin
from firebase_admin import credentials, firestore
import json

# Initialize Firebase Admin
cred = credentials.Certificate("trip-planner-c26a1-firebase-adminsdk-fbsvc-2335655c89.json")
firebase_admin.initialize_app(cred)
db = firestore.client()

def check_sagar_trips():
    """Check Sagar's trips"""
    print("🔍 Checking Sagar Salgar's trips...")
    print("=" * 50)
    
    sagar_id = "Z6FWsZgkQMMONkIEuf0UM2KXXB12"
    
    try:
        # Get Sagar's user data
        user_doc = db.collection("users").document(sagar_id).get()
        if user_doc.exists:
            user_data = user_doc.to_dict()
            print(f"👤 User: {user_data.get('name', 'Unknown')}")
            print(f"📧 Email: {user_data.get('email', 'Unknown')}")
            print(f"🏷️  Type: {user_data.get('user_type', 'unknown')}")
            print(f"🎯 Travel Style: {user_data.get('travel_style', 'unknown')}")
            print(f"❤️  Interests: {user_data.get('interests', [])}")
            print()
        else:
            print("❌ Sagar not found!")
            return
        
        # Check Sagar's trips
        trips_ref = db.collection("users").document(sagar_id).collection("trips")
        trips = trips_ref.stream()
        
        trips_list = []
        for trip in trips:
            trip_data = trip.to_dict()
            trip_data["trip_id"] = trip.id
            trips_list.append(trip_data)
        
        print(f"📅 Total trips: {len(trips_list)}")
        
        if trips_list:
            print("\n🗺️  SAGAR'S TRIPS:")
            print("-" * 50)
            for i, trip in enumerate(trips_list, 1):
                print(f"{i}. Destination: {trip.get('destination', 'Unknown')}")
                print(f"   Dates: {trip.get('start_date', 'N/A')} to {trip.get('end_date', 'N/A')}")
                print(f"   Budget: ₹{trip.get('budget', 'N/A')}")
                print(f"   Style: {trip.get('travel_style', 'N/A')}")
                print(f"   Interests: {trip.get('interests', [])}")
                print()
        else:
            print("❌ No trips found for Sagar!")
            print("💡 Sagar needs to create a trip to Ooty to appear in social recommendations")
        
        # Check specifically for Ooty trips
        ooty_trips_ref = db.collection("users").document(sagar_id).collection("trips")
        ooty_trips = ooty_trips_ref.where("destination", "==", "Ooty").stream()
        
        ooty_count = 0
        for trip in ooty_trips:
            ooty_count += 1
        
        print(f"🏔️  Ooty trips: {ooty_count}")
        
        if ooty_count == 0:
            print("\n💡 SOLUTION:")
            print("1. Sagar needs to create a trip to 'Ooty' in the app")
            print("2. Or you can add a sample Ooty trip for Sagar")
            
            choice = input("\n🤔 Do you want to add a sample Ooty trip for Sagar? (y/n): ").lower().strip()
            if choice == 'y' or choice == 'yes':
                add_ooty_trip_for_sagar(sagar_id)
        
    except Exception as e:
        print(f"❌ Error checking Sagar's trips: {e}")

def add_ooty_trip_for_sagar(sagar_id):
    """Add a sample Ooty trip for Sagar"""
    try:
        trip_data = {
            "destination": "Ooty",
            "start_date": "2024-04-22",
            "end_date": "2024-04-26",
            "budget": 25000,
            "currency": "INR",
            "travel_style": "cultural",
            "interests": ["photography", "nature", "food", "history"],
            "planned_activities": ["Tea plantation visit", "Botanical garden", "Local food tour"]
        }
        
        # Add trip to Sagar's trips collection
        trip_ref = db.collection("users").document(sagar_id).collection("trips").document()
        trip_ref.set(trip_data)
        
        print("✅ Added Ooty trip for Sagar!")
        print("🔄 Now Sagar should appear in social recommendations for Ooty")
        
    except Exception as e:
        print(f"❌ Error adding trip for Sagar: {e}")

if __name__ == "__main__":
    print("🚀 Aventra AI - Sagar's Trip Checker")
    print("=" * 50)
    
    check_sagar_trips()
    
    print("\n✅ Script completed!")
