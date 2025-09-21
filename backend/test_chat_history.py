#!/usr/bin/env python3
"""
Test script to verify chat history functionality
"""

import requests
import json
import time

# Test configuration
BASE_URL = "http://localhost:8000"
TEST_SESSION_ID = "test-session-123"
TEST_USER_ID = "test-user-123"

def test_chat_history():
    """Test the chat history functionality"""
    print("🧪 Testing Chat History Functionality")
    print("=" * 50)
    
    # Test 1: Send a message
    print("\n1. Sending first message...")
    try:
        response = requests.post(f"{BASE_URL}/chat", 
            json={
                "message": "Hello, I want to plan a trip to Ooty",
                "session_id": TEST_SESSION_ID
            },
            headers={"Authorization": "Bearer test-token"}
        )
        print(f"   Status: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"   Response: {data.get('response', 'No response')[:100]}...")
            print(f"   Session ID: {data.get('session_id', 'No session ID')}")
        else:
            print(f"   Error: {response.text}")
    except Exception as e:
        print(f"   Error: {e}")
    
    # Wait a bit
    time.sleep(2)
    
    # Test 2: Send another message
    print("\n2. Sending second message...")
    try:
        response = requests.post(f"{BASE_URL}/chat", 
            json={
                "message": "What are the best places to visit in Ooty?",
                "session_id": TEST_SESSION_ID
            },
            headers={"Authorization": "Bearer test-token"}
        )
        print(f"   Status: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"   Response: {data.get('response', 'No response')[:100]}...")
        else:
            print(f"   Error: {response.text}")
    except Exception as e:
        print(f"   Error: {e}")
    
    # Test 3: Get chat history
    print("\n3. Getting chat history...")
    try:
        response = requests.get(f"{BASE_URL}/chat/history/{TEST_SESSION_ID}",
            headers={"Authorization": "Bearer test-token"}
        )
        print(f"   Status: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            messages = data.get('messages', [])
            print(f"   Found {len(messages)} messages in history")
            for i, msg in enumerate(messages):
                print(f"   Message {i+1}: {msg.get('role', 'unknown')} - {msg.get('content', 'no content')[:50]}...")
        else:
            print(f"   Error: {response.text}")
    except Exception as e:
        print(f"   Error: {e}")
    
    # Test 4: Get chat sessions
    print("\n4. Getting chat sessions...")
    try:
        response = requests.get(f"{BASE_URL}/chat/sessions",
            headers={"Authorization": "Bearer test-token"}
        )
        print(f"   Status: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            sessions = data.get('sessions', [])
            print(f"   Found {len(sessions)} chat sessions")
            for i, session in enumerate(sessions):
                print(f"   Session {i+1}: {session.get('id', 'no id')} - {len(session.get('messages', []))} messages")
        else:
            print(f"   Error: {response.text}")
    except Exception as e:
        print(f"   Error: {e}")
    
    print("\n✅ Chat history test completed!")

if __name__ == "__main__":
    test_chat_history()

