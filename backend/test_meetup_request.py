#!/usr/bin/env python3

import requests
import json

# Test creating a meetup request
def test_meetup_request():
    url = "http://localhost:8000/meetup-request"
    
    # Test data
    meetup_data = {
        "destination": "Ooty",
        "date": "2024-04-20",
        "activity": "Test meetup with Priya",
        "max_participants": 4,
        "description": "Testing meetup request creation",
        "target_traveler_id": "rygARPffENMF9VUCzLnS"  # Priya's user ID from the logs
    }
    
    headers = {
        "Content-Type": "application/json",
        "Authorization": "Bearer test_token"  # This will fail auth, but we can see the structure
    }
    
    try:
        response = requests.post(url, json=meetup_data, headers=headers)
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.text}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_meetup_request()

