#!/usr/bin/env python3
"""
Script to add test user data for testing the solo planner functionality
"""

import asyncio
import json
from datetime import datetime, timedelta
import firebase_admin
from firebase_admin import credentials, firestore

# Initialize Firebase
cred = credentials.Certificate("path/to/your/firebase-credentials.json")  # You'll need to add your Firebase credentials
firebase_admin.initialize_app(cred)
db = firestore.client()

async def add_test_user_data():
    """Add comprehensive test data for a solo traveler"""
    
    # Test user ID (you can change this)
    user_id = "test_user_123"
    
    # Test trips data
    trips_data = [
        {
            "destination": "Mumbai, Maharashtra",
            "start_date": "2024-02-15",
            "end_date": "2024-02-18",
            "budget": 15000,
            "currency": "INR",
            "travel_style": "solo",
            "interests": ["culture", "food", "photography"],
            "created_at": datetime.now(),
            "status": "upcoming"
        },
        {
            "destination": "Goa, India",
            "start_date": "2024-03-10",
            "end_date": "2024-03-15",
            "budget": 20000,
            "currency": "INR",
            "travel_style": "solo",
            "interests": ["beach", "relaxation", "adventure"],
            "created_at": datetime.now(),
            "status": "planning"
        }
    ]
    
    # Test expenses data
    expenses_data = [
        {
            "trip_id": "trip_1",
            "category": "accommodation",
            "amount": 4500,
            "currency": "INR",
            "description": "Hotel booking for 3 nights",
            "date": "2024-02-15",
            "location": "Mumbai",
            "vendor": "Hotel Taj Palace"
        },
        {
            "trip_id": "trip_1",
            "category": "food",
            "amount": 1200,
            "currency": "INR",
            "description": "Street food tour",
            "date": "2024-02-16",
            "location": "Mumbai",
            "vendor": "Local Street Vendors"
        },
        {
            "trip_id": "trip_1",
            "category": "transport",
            "amount": 800,
            "currency": "INR",
            "description": "Local transport",
            "date": "2024-02-16",
            "location": "Mumbai",
            "vendor": "Uber/Ola"
        }
    ]
    
    # Test budget allocations
    budget_data = [
        {
            "trip_id": "trip_1",
            "total_budget": 15000,
            "currency": "INR",
            "daily_allowance": 2000,
            "category_allocations": {
                "accommodation": 6000,
                "food": 3000,
                "transport": 2000,
                "activities": 2500,
                "shopping": 1000,
                "other": 500
            },
            "created_at": datetime.now()
        }
    ]
    
    try:
        # Add trips
        for i, trip in enumerate(trips_data):
            trip_id = f"trip_{i+1}"
            trip["trip_id"] = trip_id
            db.collection("users").document(user_id).collection("trips").document(trip_id).set(trip)
            print(f"✅ Added trip: {trip['destination']}")
        
        # Add expenses
        for expense in expenses_data:
            db.collection("users").document(user_id).collection("expenses").add(expense)
            print(f"✅ Added expense: {expense['description']}")
        
        # Add budget allocations
        for budget in budget_data:
            db.collection("users").document(user_id).collection("budgets").add(budget)
            print(f"✅ Added budget allocation for trip: {budget['trip_id']}")
        
        print(f"\n🎉 Successfully added test data for user: {user_id}")
        print("📊 Test data includes:")
        print("   - 2 trips (Mumbai & Goa)")
        print("   - 3 expenses with different categories")
        print("   - 1 budget allocation")
        print("   - Solo travel preferences")
        
    except Exception as e:
        print(f"❌ Error adding test data: {e}")

if __name__ == "__main__":
    print("🚀 Adding test user data for solo planner...")
    asyncio.run(add_test_user_data())

