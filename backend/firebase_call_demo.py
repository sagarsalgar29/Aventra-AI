import firebase_admin
from firebase_admin import credentials, firestore

# Path to your downloaded JSON key
cred = credentials.Certificate("trip-planner-c26a1-firebase-adminsdk-fbsvc-2335655c89.json")
firebase_admin.initialize_app(cred)

db = firestore.client()

# Test: Add a sample document
db.collection("users").add({"name": "Alice", "city": "Paris"})
print("✅ Connected to Firestore!")
