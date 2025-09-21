from fastapi import FastAPI, Request, HTTPException
from firebase_admin import credentials, firestore, auth, initialize_app
from pydantic import BaseModel

# -----------------------------
# Firebase Admin Initialization
# -----------------------------
cred = credentials.Certificate("trip-planner-c26a1-firebase-adminsdk-fbsvc-2335655c89.json")  # Your downloaded service account key
initialize_app(cred)
db = firestore.client()

# -----------------------------
# FastAPI App
# -----------------------------
app = FastAPI(title="AI Trip Planner API")

# -----------------------------
# Pydantic Models
# -----------------------------
class Trip(BaseModel):
    destination: str
    start_date: str
    end_date: str
    recommendations: list[str] = []

# -----------------------------
# Helper: Verify Firebase ID token
# -----------------------------
def verify_token(token: str):
    try:
        decoded_token = auth.verify_id_token(token)
        return decoded_token["uid"]
    except Exception:
        return None

# -----------------------------
# Add a trip
# -----------------------------
@app.post("/trips")
async def add_trip(request: Request, trip: Trip):
    token = request.headers.get("Authorization")
    if not token:
        raise HTTPException(status_code=401, detail="Missing Authorization token")

    uid = verify_token(token.replace("Bearer ", ""))
    if not uid:
        raise HTTPException(status_code=403, detail="Invalid token")

    db.collection("users").document(uid).collection("trips").add(trip.dict())
    return {"message": "Trip added successfully!"}

# -----------------------------
# Fetch all trips for authenticated user
# -----------------------------
@app.get("/trips")
async def get_trips(request: Request):
    token = request.headers.get("Authorization")
    if not token:
        raise HTTPException(status_code=401, detail="Missing Authorization token")

    uid = verify_token(token.replace("Bearer ", ""))
    if not uid:
        raise HTTPException(status_code=403, detail="Invalid token")

    trips_ref = db.collection("users").document(uid).collection("trips").stream()
    trips = []
    for trip in trips_ref:
        trip_data = trip.to_dict()
        trip_data["id"] = trip.id  # include Firestore document ID
        trips.append(trip_data)

    return {"trips": trips}

# -----------------------------
# Delete a specific trip
# -----------------------------
@app.delete("/trips/{trip_id}")
async def delete_trip(request: Request, trip_id: str):
    token = request.headers.get("Authorization")
    if not token:
        raise HTTPException(status_code=401, detail="Missing Authorization token")

    uid = verify_token(token.replace("Bearer ", ""))
    if not uid:
        raise HTTPException(status_code=403, detail="Invalid token")

    doc_ref = db.collection("users").document(uid).collection("trips").document(trip_id)
    if not doc_ref.get().exists:
        raise HTTPException(status_code=404, detail="Trip not found")

    doc_ref.delete()
    return {"message": "Trip deleted successfully!"}

# -----------------------------
# Run with: uvicorn main:app --reload
# -----------------------------
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
