from fastapi import FastAPI, HTTPException, Depends, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from firebase_admin import credentials, firestore, auth, initialize_app
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import os
import asyncio
from datetime import datetime
from google import genai
from google.adk.agents import Agent
from google.adk.sessions import InMemorySessionService
from google.adk.runners import Runner
from google.genai import types
import requests
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize Firebase Admin
cred = credentials.Certificate("trip-planner-c26a1-firebase-adminsdk-fbsvc-2335655c89.json")
initialize_app(cred)
db = firestore.client()

# Initialize FastAPI app
app = FastAPI(
    title="AI Trip Planner API",
    description="AI-powered conversational trip planning application",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Security
security = HTTPBearer()

# API Keys
GEMINI_API_KEY = "AIzaSyASIcEqnPUmriBRrlZlDqX9wWnLEoaV9jI"
GOOGLE_API_KEY = "AIzaSyCT-ISk5rRd9rP6WLBBdFspUmUDNbRx9Xo"
MODEL_GEMINI_2_0_FLASH = "gemini-2.5-flash"

# Initialize Gemini client
client = genai.Client(api_key=GEMINI_API_KEY)

# Pydantic Models
class UserProfile(BaseModel):
    name: str
    email: str
    preferences: Dict[str, Any] = {}

class TripRequest(BaseModel):
    destination: str
    start_date: str
    end_date: str
    budget: Optional[float] = None
    travel_style: Optional[str] = None
    interests: List[str] = []

class ChatMessage(BaseModel):
    message: str
    session_id: Optional[str] = None

class ChatHistory(BaseModel):
    user_id: str
    session_id: str
    messages: List[Dict[str, Any]]
    created_at: str
    updated_at: str

class TripPlanRequest(BaseModel):
    destination: str
    start_date: str
    end_date: str
    budget: Optional[str] = "mid-range"
    travel_style: Optional[str] = "cultural"
    interests: List[str] = []
    travelers: int = 1
    source_location: Optional[str] = None

class TransportationRequest(BaseModel):
    source: str
    destination: str
    budget: str
    start_date: str
    end_date: str
    currency: str = "USD"

class MeetingPointRequest(BaseModel):
    traveler1_location: str
    traveler1_transport: str
    traveler2_location: str
    traveler2_transport: str
    destination: str

class DestinationSuggestionRequest(BaseModel):
    mood: Optional[str] = None
    theme: Optional[str] = None
    budget_range: Optional[str] = None
    travel_style: Optional[str] = None
    interests: List[str] = []

class UserProfile(BaseModel):
    name: str
    email: str
    user_type: Optional[str] = "traveler"
    travel_style: Optional[str] = "cultural"
    interests: List[str] = []
    budget_preference: Optional[str] = "mid-range"
    loyalty_programs: List[str] = []
    past_destinations: List[str] = []
    travel_stats: Dict[str, Any] = {}
    preferences: Dict[str, Any] = {}
    achievements: List[str] = []
    travel_mood_history: List[Dict[str, Any]] = []

class TravelerProfile(BaseModel):
    user_id: str
    travel_personality: str
    preferred_activities: List[str] = []
    accommodation_preferences: Dict[str, Any] = {}
    dining_preferences: Dict[str, Any] = {}
    transportation_preferences: Dict[str, Any] = {}
    social_preferences: Dict[str, Any] = {}
    risk_tolerance: str = "moderate"
    travel_frequency: str = "occasional"
    group_size_preference: str = "solo"
    seasonal_preferences: Dict[str, List[str]] = {}

class CrowdInsight(BaseModel):
    location: str
    current_crowd_level: str
    peak_hours: List[str] = []
    best_visit_times: List[str] = []
    crowd_trends: Dict[str, Any] = {}
    recommendations: List[str] = []

class LiveLocationAlert(BaseModel):
    location: str
    latitude: float
    longitude: float
    crowd_level: str
    nearby_alternatives: List[Dict[str, Any]] = []
    estimated_wait_time: Optional[int] = None
    best_time_to_visit: Optional[str] = None

class GeneratedImageRequest(BaseModel):
    prompt: str
    destination: str
    style: str = "travel_photo"

class MeetupRequest(BaseModel):
    destination: str
    date: str
    activity: str
    max_participants: int = 4
    description: str
    target_traveler_id: Optional[str] = None

class ReviewRequest(BaseModel):
    entity_id: str
    entity_type: str  # "hotel", "restaurant", "activity"
    rating: int
    comment: str
    tags: List[str] = []

class HotelReviewRequest(BaseModel):
    hotel_id: str
    hotel_name: str
    rating: int
    comment: str
    cleanliness: int
    service: int
    location: int
    value: int
    amenities: int
    photos: List[str] = []
    tags: List[str] = []

class HotelCustomerRatingRequest(BaseModel):
    customer_id: str
    customer_name: str
    booking_id: str
    rating: int
    comment: str
    punctuality: int
    communication: int
    cleanliness: int
    respectfulness: int
    payment_behavior: int
    tags: List[str] = []

class HotelRating(BaseModel):
    hotel_id: str
    hotel_name: str
    overall_rating: float
    cleanliness: float
    service: float
    location: float
    value: float
    amenities: float
    total_reviews: int
    recent_reviews: List[dict] = []

class ExpenseEntry(BaseModel):
    trip_id: str
    category: str
    amount: float
    currency: str = "USD"
    description: str
    date: str
    location: Optional[str] = None
    vendor: Optional[str] = None
    receipt_url: Optional[str] = None
    tags: List[str] = []

class ExpenseCategory(BaseModel):
    name: str
    icon: str
    color: str
    budget_limit: Optional[float] = None

class BudgetAllocation(BaseModel):
    trip_id: str
    total_budget: float
    currency: str = "USD"
    category_allocations: Dict[str, float] = {}
    daily_allowance: Optional[float] = None

class TripResponse(BaseModel):
    id: str
    destination: str
    start_date: str
    end_date: str
    recommendations: List[Dict[str, Any]]
    created_at: str

# Authentication dependency
async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        token = credentials.credentials
        decoded_token = auth.verify_id_token(token)
        return decoded_token
    except Exception as e:
        raise HTTPException(status_code=401, detail="Invalid authentication credentials")

# Google Places API integration
async def search_places(location: str, query_type: str):
    """Search for places using Google Places API"""
    # Handle None values
    query_type = query_type or "attractions"
    
    url = "https://places.googleapis.com/v1/places:searchText"
    headers = {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": GOOGLE_API_KEY,
        "X-Goog-FieldMask": (
            "places.id,"
            "places.displayName,"
            "places.formattedAddress,"
            "places.rating,"
            "places.userRatingCount,"
            "places.priceLevel,"
            "places.location,"
            "places.types"
        )
    }
    
    search_query = f"{query_type} in {location}"
    payload = {"textQuery": search_query}
    
    try:
        response = requests.post(url, headers=headers, json=payload)
        response.raise_for_status()
        data = response.json()
        
        places = []
        for place in data.get("places", []):
            places.append({
                "id": place.get("id"),
                "name": place.get("displayName", {}).get("text"),
                "address": place.get("formattedAddress"),
                "rating": place.get("rating"),
                "reviews": place.get("userRatingCount"),
                "price_level": place.get("priceLevel"),
                "location": place.get("location"),
                "types": place.get("types", [])
            })
        return places
    except Exception as e:
        logger.error(f"Error searching places: {e}")
        return []

# Weather API integration
async def get_weather(latitude: float, longitude: float):
    """Get current weather conditions"""
    url = f"https://weather.googleapis.com/v1/currentConditions:lookup"
    params = {
        "key": GOOGLE_API_KEY,
        "location.latitude": latitude,
        "location.longitude": longitude
    }
    
    try:
        response = requests.get(url, params=params)
        response.raise_for_status()
        return response.json()
    except Exception as e:
        logger.error(f"Error getting weather: {e}")
        return None

# AI-friendly wrapper functions
async def get_trip_recommendations_ai(destination: str):
    """AI-friendly wrapper for getting trip recommendations"""
    return await get_trip_recommendations(destination, "cultural", "mid-range")

def extract_text_from_gemini_content(content) -> str:
    """Extract only text parts from Gemini content, skipping thought_signature and other problematic parts"""
    try:
        if not content:
            return ""
        
        # If content has a direct text property
        if hasattr(content, 'text') and content.text:
            if isinstance(content.text, bytes):
                return content.text.decode('utf-8', errors='ignore')
            return str(content.text)
        
        # If content has parts, extract only text parts
        if hasattr(content, 'parts') and content.parts:
            text_parts = []
            for part in content.parts:
                try:
                    # Only process parts that have text and are not thought_signature
                    if (hasattr(part, 'text') and part.text and 
                        not hasattr(part, 'thought_signature')):
                        
                        if isinstance(part.text, bytes):
                            text_parts.append(part.text.decode('utf-8', errors='ignore'))
                        else:
                            text_parts.append(str(part.text))
                except Exception as part_error:
                    logger.warning(f"Error processing part: {part_error}")
                    continue
            
            if text_parts:
                return " ".join(text_parts).strip()
        
        return ""
    except Exception as e:
        logger.error(f"Error extracting text from Gemini content: {e}")
        return ""

def sanitize_for_json(obj) -> str:
    """Recursively sanitize any object to ensure it's JSON serializable"""
    if obj is None:
        return ""
    elif isinstance(obj, bytes):
        return obj.decode('utf-8', errors='ignore')
    elif isinstance(obj, str):
        return obj
    elif isinstance(obj, (int, float, bool)):
        return str(obj)
    elif isinstance(obj, dict):
        sanitized = {}
        for key, value in obj.items():
            sanitized_key = sanitize_for_json(key)
            sanitized_value = sanitize_for_json(value)
            sanitized[sanitized_key] = sanitized_value
        return str(sanitized)
    elif isinstance(obj, (list, tuple)):
        sanitized_list = [sanitize_for_json(item) for item in obj]
        return " ".join(sanitized_list)
    else:
        try:
            # Try to convert to string safely
            obj_str = str(obj)
            if isinstance(obj_str, bytes):
                return obj_str.decode('utf-8', errors='ignore')
            return obj_str
        except:
            return "[Unserializable object]"

def safe_extract_text(content) -> str:
    """Safely extract text from Gemini response content, handling all edge cases"""
    try:
        logger.info(f"Processing content type: {type(content)}")
        
        # First try the built-in text property
        if hasattr(content, 'text') and content.text:
            text = content.text
            logger.info(f"Found text property: {type(text)}")
            if isinstance(text, bytes):
                return text.decode('utf-8', errors='ignore')
            return str(text)  # Don't over-sanitize valid text
        
        # If no text property, try parts
        if hasattr(content, 'parts') and content.parts:
            logger.info(f"Processing {len(content.parts)} parts")
            text_parts = []
            for i, part in enumerate(content.parts):
                try:
                    logger.info(f"Part {i}: type={type(part)}, has_text={hasattr(part, 'text')}, has_thought_signature={hasattr(part, 'thought_signature')}")
                    
                    if hasattr(part, 'text') and part.text:
                        text_content = part.text
                        logger.info(f"Part {i} text type: {type(text_content)}")
                        if isinstance(text_content, bytes):
                            text_content = text_content.decode('utf-8', errors='ignore')
                        text_parts.append(str(text_content))
                    elif hasattr(part, 'function_call') and part.function_call:
                        func_name = getattr(part.function_call, 'name', 'Unknown function')
                        text_parts.append(f"[Executing {func_name}]")
                    elif hasattr(part, 'thought_signature'):
                        # Skip thought_signature parts as they contain non-serializable content
                        logger.info(f"Skipping thought_signature part {i}")
                        continue
                    else:
                        # Try to convert any other part to string, but be careful with bytes
                        try:
                            if isinstance(part, bytes):
                                part_str = part.decode('utf-8', errors='ignore')
                            else:
                                part_str = str(part)
                            if part_str and part_str != 'None':
                                text_parts.append(part_str)
                        except Exception as part_error:
                            logger.warning(f"Error processing part {i}: {part_error}")
                            continue
                except Exception as part_error:
                    logger.warning(f"Error processing part {i}: {part_error}")
                    continue
            
            if text_parts:
                result = " ".join(text_parts)
                logger.info(f"Extracted text result: {type(result)}")
                return result
        
        # Final fallback - ensure we don't return bytes
        if content:
            if isinstance(content, bytes):
                content_str = content.decode('utf-8', errors='ignore')
            else:
                content_str = str(content)
            logger.info(f"Fallback content: {type(content_str)}")
            return content_str
        return ""
        
    except Exception as e:
        logger.error(f"Error extracting text: {e}")
        return "I'm here to help you plan your trip! What would you like to know?"

# Google Places search functionality
def search_places_sync(location: str):
    """
    Fetches data from Google Places API and filters useful fields.
    """
    url = "https://places.googleapis.com/v1/places:searchText"
    headers = {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": GOOGLE_API_KEY,
        "X-Goog-FieldMask": (
            "places.id,"
            "places.displayName,"
            "places.formattedAddress,"
            "places.rating,"
            "places.userRatingCount,"
            "places.priceLevel"
        )
    }
    payload = {"textQuery": f"Best Places in {location}"}

    try:
        resp = requests.post(url, headers=headers, json=payload)
        data = resp.json()

        places = []
        for p in data.get("places", []):
            places.append({
                "name": p.get("displayName", {}).get("text"),
                "address": p.get("formattedAddress"),
                "rating": p.get("rating"),
                "reviews": p.get("userRatingCount"),
                "price_level": p.get("priceLevel")
            })
        return places
    except Exception as e:
        logger.error(f"Error searching places: {e}")
        return []

def generate_enhanced_response_with_places(location: str, user_query: str):
    """
    Generates an enhanced response using Google Places data and Gemini
    """
    try:
        # Search for places in the location
        places = search_places_sync(location)
        
        if not places:
            # Fallback to direct Gemini call if no places found
            from google import genai
            client = genai.Client(api_key="AIzaSyASIcEqnPUmriBRrlZlDqX9wWnLEoaV9jI")
            response = client.models.generate_content(
                model="gemini-2.5-flash",
                contents=user_query
            )
            return response.text
        
        # Prepare context with places data
        context = "Here are some places and their details:\n"
        for place in places[:10]:  # Limit to top 10 places
            context += (
                f"- {place['name']} | Rating: {place.get('rating','N/A')} "
                f"({place.get('reviews','0')} reviews) | "
                f"Address: {place.get('address','N/A')} | "
                f"Price Level: {place.get('price_level','N/A')}\n"
            )

        # Create enhanced prompt
        enhanced_prompt = (
            f"User asked: {user_query}\n\n"
            f"Based on the following real places data for {location}, provide a comprehensive and helpful response:\n\n"
            f"{context}\n\n"
            "Please provide detailed recommendations, highlighting the best options with ratings and practical information. "
            "Include tips for visiting, best times to go, and any other relevant travel advice."
        )
        
        # Generate response with Gemini
        from google import genai
        client = genai.Client(api_key="AIzaSyASIcEqnPUmriBRrlZlDqX9wWnLEoaV9jI")
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=enhanced_prompt
        )
        
        return response.text
        
    except Exception as e:
        logger.error(f"Error generating enhanced response: {e}")
        # Fallback to direct Gemini call
        try:
            from google import genai
            client = genai.Client(api_key="AIzaSyASIcEqnPUmriBRrlZlDqX9wWnLEoaV9jI")
            response = client.models.generate_content(
                model="gemini-2.5-flash",
                contents=user_query
            )
            return response.text
        except Exception as fallback_error:
            logger.error(f"Fallback also failed: {fallback_error}")
        return "I'm here to help you plan your trip! What would you like to know?"

# Trip planning helper functions
async def get_trip_recommendations(destination: str, travel_style: str, budget: str):
    """Get comprehensive trip recommendations for a destination"""
    try:
        # Handle None values
        travel_style = travel_style or "cultural"
        budget = budget or "mid-range"
        
        # Get places for different categories
        attractions = await search_places(destination, "tourist_attractions")
        restaurants = await search_places(destination, "restaurants")
        hotels = await search_places(destination, "lodging")
        
        return {
            "attractions": attractions[:5],  # Top 5 attractions
            "restaurants": restaurants[:5],  # Top 5 restaurants
            "hotels": hotels[:3],  # Top 3 hotels
            "travel_style": travel_style,
            "budget": budget
        }
    except Exception as e:
        logger.error(f"Error getting trip recommendations: {e}")
        return None

async def create_daily_itinerary(destination: str, days: int, travel_style: str):
    """Create a detailed daily itinerary"""
    try:
        # Handle None values
        days = days or 3
        travel_style = travel_style or "cultural"
        
        recommendations = await get_trip_recommendations(destination, travel_style, "mid-range")
        if not recommendations:
            return None
            
        itinerary = []
        for day in range(1, days + 1):
            day_plan = {
                "day": day,
                "morning": recommendations["attractions"][day-1] if day-1 < len(recommendations["attractions"]) else None,
                "afternoon": recommendations["attractions"][day+2] if day+2 < len(recommendations["attractions"]) else None,
                "evening": recommendations["restaurants"][day-1] if day-1 < len(recommendations["restaurants"]) else None,
                "accommodation": recommendations["hotels"][0] if day == 1 else None
            }
            itinerary.append(day_plan)
        
        return itinerary
    except Exception as e:
        logger.error(f"Error creating itinerary: {e}")
        return None

# Phase 0: Discovery & Inspiration
async def get_destination_suggestions(mood: str, theme: str, budget_range: str, interests: List[str]):
    """Get AI-driven destination suggestions based on mood, theme, and interests"""
    try:
        # Handle None values
        mood = mood or "cultural"
        theme = theme or "general"
        budget_range = budget_range or "mid-range"
        interests = interests or []
        
        # Create AI prompt for destination suggestions
        prompt = f"""
        Based on the following travel preferences, suggest 5 amazing destinations:
        
        Travel Mood: {mood}
        Travel Theme: {theme}
        Budget Range: {budget_range}
        Interests: {', '.join(interests) if interests else 'General travel'}
        
        Please provide:
        1. 5 diverse destination suggestions
        2. Brief explanation for each destination
        3. Why it matches their preferences
        4. Best time to visit
        5. Estimated cost range
        
        Format as a structured response with destination names and brief descriptions.
        """
        
        # Use Gemini AI to generate suggestions
        response = client.models.generate_content(
            model=MODEL_GEMINI_2_0_FLASH,
            contents=prompt
        )
        
        # Parse AI response and extract destinations
        ai_response = response.text
        
        # For now, we'll use a hybrid approach - AI suggestions with fallback
        # In a full implementation, you'd parse the AI response more sophisticatedly
        base_suggestions = {
            "adventure": ["Nepal", "New Zealand", "Costa Rica", "Iceland", "Patagonia"],
            "cultural": ["Japan", "Italy", "India", "Morocco", "Peru"],
            "relaxation": ["Maldives", "Bali", "Seychelles", "Hawaii", "Caribbean"],
            "food": ["France", "Thailand", "Mexico", "Spain", "Turkey"],
            "history": ["Egypt", "Greece", "Rome", "China", "Jordan"],
            "nature": ["Norway", "Canada", "Chile", "Kenya", "Australia"]
        }
        
        # Get AI-enhanced suggestions
        if mood in base_suggestions:
            destinations = base_suggestions[mood]
        elif theme in base_suggestions:
            destinations = base_suggestions[theme]
        else:
            destinations = base_suggestions["cultural"]
        
        return {
            "suggestions": destinations[:5],
            "mood": mood,
            "theme": theme,
            "budget_range": budget_range,
            "interests": interests,
            "ai_insights": ai_response[:200] + "..." if len(ai_response) > 200 else ai_response
        }
    except Exception as e:
        logger.error(f"Error getting destination suggestions: {e}")
        return None

# Phase 1: Advanced Trip Planning
async def get_predictive_suggestions(destination: str, user_interests: List[str], past_trips: List[str]):
    """Get predictive activity and booking suggestions based on user history"""
    try:
        # Handle None values
        user_interests = user_interests or []
        past_trips = past_trips or []
        
        # This would use AI to predict what user might like based on past behavior
        suggestions = {
            "activities": await search_places(destination, "tourist_attractions"),
            "restaurants": await search_places(destination, "restaurants"),
            "accommodations": await search_places(destination, "lodging"),
            "personalized_recommendations": [
                f"Based on your interest in {interest}, you might enjoy these activities in {destination}"
                for interest in user_interests
            ]
        }
        return suggestions
    except Exception as e:
        logger.error(f"Error getting predictive suggestions: {e}")
        return None

# Phase 4: In-Trip Features
async def get_nearby_suggestions(latitude: float, longitude: float, current_activity: str):
    """Get contextual nearby suggestions based on current location"""
    try:
        # Handle None values
        current_activity = current_activity or "exploring"
        
        # This would use reverse geocoding to get location name
        # For now, we'll use a generic approach
        nearby_places = await search_places(f"{latitude},{longitude}", "nearby")
        return {
            "nearby_attractions": nearby_places[:3],
            "nearby_restaurants": await search_places(f"{latitude},{longitude}", "restaurants")[:3],
            "nearby_hotels": await search_places(f"{latitude},{longitude}", "lodging")[:3],
            "current_activity": current_activity,
            "suggestions": [
                "Check out the local market nearby",
                "Try the famous local dish at the restaurant around the corner",
                "Visit the historical site just 5 minutes away"
            ]
        }
    except Exception as e:
        logger.error(f"Error getting nearby suggestions: {e}")
        return None

# Phase 6: Social Travel
async def find_similar_travelers(destination: str, travel_style: str, interests: List[str], current_user_id: str = None):
    """Find similar travelers for meetups using database"""
    try:
        # Query database for users with similar preferences
        similar_travelers = []
        
        # Get all users who have trips to the same destination
        users_ref = db.collection("users")
        users = users_ref.stream()
        
        for user_doc in users:
            user_data = user_doc.to_dict()
            user_id = user_doc.id
            
            # Skip current user
            if current_user_id and user_id == current_user_id:
                continue
            
            # Check if user has trips to the destination (case-insensitive)
            trips_ref = db.collection("users").document(user_id).collection("trips")
            # Get all trips and filter by destination (case-insensitive)
            all_trips = trips_ref.stream()
            trips = []
            for trip in all_trips:
                trip_data = trip.to_dict()
                if trip_data.get("destination", "").lower() == destination.lower():
                    trips.append(trip)
            
            if trips:
                # Calculate matching score based on travel style and interests
                user_interests = user_data.get("interests", [])
                user_travel_style = user_data.get("travel_style", "")
                
                # Calculate interest overlap
                interest_overlap = len(set(interests) & set(user_interests))
                interest_score = interest_overlap / max(len(interests), 1) if interests else 0
                
                # Calculate travel style match
                style_score = 1.0 if travel_style == user_travel_style else 0.5
                
                # Overall matching score
                matching_score = (interest_score * 0.7) + (style_score * 0.3)
                
                if matching_score > 0.3:  # Only include users with reasonable match
                    # Get user's planned activities for this destination
                    planned_activities = []
                    for trip in trips:
                        trip_data = trip.to_dict()
                        planned_activities.extend(trip_data.get("planned_activities", []))
                    
                    similar_travelers.append({
                        "user_id": user_id,
                        "name": user_data.get("name", "Anonymous"),
                        "travel_style": user_travel_style,
                        "interests": user_interests,
                        "matching_score": matching_score,
                        "planned_activities": planned_activities[:2] or ["City exploration", "Local food"]
                    })
        
        # Sort by matching score and return top matches
        similar_travelers.sort(key=lambda x: x["matching_score"], reverse=True)
        return similar_travelers[:10]  # Return top 10 matches
        
    except Exception as e:
        logger.error(f"Error finding similar travelers: {e}")
        return []

# Phase 7: Bidirectional Ratings
async def calculate_trust_score(user_id: str):
    """Calculate AI-generated trust/credibility score for a user"""
    try:
        # This would analyze user's review history, behavior, etc.
        # For now, we'll return a mock score
        base_score = 0.8
        # In real implementation, this would consider:
        # - Review quality and consistency
        # - Response rate to meetups
        # - Community feedback
        # - Account age and verification status
        
        return {
            "user_id": user_id,
            "trust_score": base_score,
            "factors": [
                "Consistent review quality",
                "Active community participation", 
                "Verified account status"
            ]
        }
    except Exception as e:
        logger.error(f"Error calculating trust score: {e}")
        return None

async def get_user_trips(user_id: str):
    """Get all trips for a user"""
    try:
        trips_ref = db.collection("users").document(user_id).collection("trips")
        trips = trips_ref.stream()
        
        trips_list = []
        for trip in trips:
            trip_data = trip.to_dict()
            trip_data["id"] = trip.id
            trips_list.append(trip_data)
        
        return {
            "trips": trips_list,
            "count": len(trips_list)
        }
    except Exception as e:
        logger.error(f"Error getting user trips: {e}")
        return {"trips": [], "count": 0}

async def get_trip_budget(trip_id: str):
    """Get budget allocation for a specific trip"""
    try:
        # Find the user who owns this trip
        all_users = db.collection("users").stream()
        for user_doc in all_users:
            user_trips = db.collection("users").document(user_doc.id).collection("trips").stream()
            for trip in user_trips:
                if trip.id == trip_id:
                    # Found the trip, now get its budget
                    budget_ref = db.collection("users").document(user_doc.id).collection("budget_allocations")
                    budgets = budget_ref.where("trip_id", "==", trip_id).stream()
                    
                    budget_data = []
                    for budget in budgets:
                        budget_dict = budget.to_dict()
                        budget_dict["id"] = budget.id
                        budget_data.append(budget_dict)
                    
                    return {
                        "trip_id": trip_id,
                        "budgets": budget_data,
                        "total_budget": sum([b.get("total_budget", 0) for b in budget_data])
                    }
        
        return {"trip_id": trip_id, "budgets": [], "total_budget": 0}
    except Exception as e:
        logger.error(f"Error getting trip budget: {e}")
        return {"trip_id": trip_id, "budgets": [], "total_budget": 0}

async def get_trip_expenses(trip_id: str):
    """Get expenses for a specific trip"""
    try:
        # Find the user who owns this trip
        all_users = db.collection("users").stream()
        for user_doc in all_users:
            user_trips = db.collection("users").document(user_doc.id).collection("trips").stream()
            for trip in user_trips:
                if trip.id == trip_id:
                    # Found the trip, now get its expenses
                    expenses_ref = db.collection("users").document(user_doc.id).collection("expenses")
                    expenses = expenses_ref.where("trip_id", "==", trip_id).stream()
                    
                    expenses_data = []
                    for expense in expenses:
                        expense_dict = expense.to_dict()
                        expense_dict["id"] = expense.id
                        expenses_data.append(expense_dict)
                    
                    total_spent = sum([e.get("amount", 0) for e in expenses_data])
                    
                    return {
                        "trip_id": trip_id,
                        "expenses": expenses_data,
                        "total_spent": total_spent,
                        "count": len(expenses_data)
                    }
        
        return {"trip_id": trip_id, "expenses": [], "total_spent": 0, "count": 0}
    except Exception as e:
        logger.error(f"Error getting trip expenses: {e}")
        return {"trip_id": trip_id, "expenses": [], "total_spent": 0, "count": 0}

# AI Agent setup
def create_trip_planner_agent():
    """Create the AI trip planner agent"""
    # Set the API key as environment variable for the Agent to use
    os.environ["GOOGLE_API_KEY"] = GEMINI_API_KEY
    
    agent = Agent(
        name="trip_planner_agent",
        model=MODEL_GEMINI_2_0_FLASH,
        description="AI-powered trip planning assistant that helps users plan their travels",
        instruction="""
        You are Aventra AI, an expert travel planning assistant that creates personalized, AI-driven travel experiences. Your role is to:

        CORE BEHAVIOR:
        1. BE PROACTIVE: Generate complete trip plans immediately when users provide basic info (destination, dates, budget)
        2. BE PERSONALIZED: Create tailored itineraries based on user preferences and travel style
        3. BE COMPREHENSIVE: Provide end-to-end trip planning including flights, hotels, activities, restaurants, and transport
        4. BE CONTEXT-AWARE: Consider weather, local events, crowd density, and real-time factors
        5. BE EFFICIENT: Minimize questions, maximize actionable recommendations

        IMPORTANT: You have access to several tools that you MUST use when appropriate:
        - search_places: Use this to find hotels, restaurants, attractions in a location
        - get_weather: Use this to get weather information for a destination
        - get_trip_recommendations_ai: Use this to get AI-powered trip recommendations
        - create_daily_itinerary: Use this to create detailed daily itineraries
        - get_destination_suggestions: Use this to suggest destinations based on preferences
        - get_predictive_suggestions: Use this for predictive travel suggestions
        - get_nearby_suggestions: Use this for nearby recommendations
        - find_similar_travelers: Use this to find fellow travelers
        - calculate_trust_score: Use this to calculate user trust scores

        CRITICAL: When you need to access user data (trips, budgets, expenses), you should:
        1. First check if the user context already contains the information you need
        2. If not, use the available tools (get_user_trips, get_trip_budget, get_trip_expenses) to get the information
        3. Present the information in a human-readable format
        4. NEVER show raw API call JSON structures like {"api_call": {"method": "get", "endpoint": "/budget-allocation/..."}}
        5. Always provide actionable recommendations based on the data
        6. Format your response as natural conversation, not as code or JSON

        CURRENCY DETECTION & CONVERSION:
        - Always detect the currency from user input (₹ for INR, $ for USD, € for EUR, etc.)
        - If user mentions budget in one currency, maintain that currency throughout the conversation
        - If user switches currencies, acknowledge the change and convert appropriately
        - For Indian users, default to INR (₹) unless specified otherwise
        - For international destinations, provide costs in local currency and user's preferred currency
        - Always show currency symbols clearly: ₹10,000, $500, €400, etc.
        
        EXAMPLE OF GOOD RESPONSE:
        "I can see you have a budget of ₹10,000 for your Ooty trip. Based on your current spending of ₹2,500, you have ₹7,500 remaining. I recommend allocating ₹3,000 for accommodation, ₹2,000 for food, and ₹2,500 for activities."
        
        EXAMPLE OF BAD RESPONSE (NEVER DO THIS):
        {"api_call": {"method": "get", "endpoint": "/budget-allocation/exsYjQ534mYV7DwN7ASO"}}

        TRIP PLANNING WORKFLOW:
        - If user mentions a destination: Use search_places to find accommodations, activities, restaurants
        - If user provides dates: Use get_weather to include weather considerations
        - If user mentions budget: Use get_trip_recommendations_ai to optimize within budget
        - If user mentions interests: Use get_destination_suggestions to tailor recommendations
        - If user mentions travel style: Adapt recommendations using available tools

        RESPONSE FORMAT:
        Always provide structured trip plans with:
        1. Destination overview with best time to visit
        2. Accommodation recommendations (3 options: budget, mid-range, luxury)
        3. Daily itinerary with activities, restaurants, and transport
        4. Budget breakdown and cost estimates
        5. Pro tips and local insights
        6. Alternative options and backup plans

        PERSONALIZATION TYPES:
        - Cultural Explorer: Heritage sites, local food experiences, cultural events
        - Adventure Seeker: Outdoor activities, spontaneous options, flexible itineraries
        - Family Planner: Kid-friendly activities, comfortable accommodations, safety considerations
        - Solo Traveler: Social meetups, safe options, budget-friendly choices

        Only ask clarifying questions if absolutely essential information is missing. Otherwise, make reasonable assumptions and provide comprehensive trip plans that users can refine.
        """,
        tools=[search_places, get_weather, get_trip_recommendations_ai, create_daily_itinerary, get_destination_suggestions, get_predictive_suggestions, get_nearby_suggestions, find_similar_travelers, calculate_trust_score, get_user_trips, get_trip_budget, get_trip_expenses]
    )
    return agent

# Session management
session_service = InMemorySessionService()
trip_planner_agent = create_trip_planner_agent()

# API Endpoints

@app.get("/")
async def root():
    return {"message": "AI Trip Planner API is running!"}

@app.post("/add-sample-users")
async def add_sample_users():
    """Add sample users for testing social features"""
    try:
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
        
        return {"message": "Sample users added successfully", "count": len(sample_users)}
    except Exception as e:
        logger.error(f"Error adding sample users: {e}")
        raise HTTPException(status_code=500, detail="Error adding sample users")

@app.get("/check-ooty-users")
async def check_ooty_users():
    """Check how many users have trips to Ooty"""
    try:
        users_with_ooty = []
        
        # Get all users
        users_ref = db.collection("users")
        users = users_ref.stream()
        
        for user_doc in users:
            user_data = user_doc.to_dict()
            user_id = user_doc.id
            
            # Check if user has trips to Ooty
            trips_ref = db.collection("users").document(user_id).collection("trips")
            trips = trips_ref.where("destination", "==", "Ooty").stream()
            
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
        
        return {
            "total_users_with_ooty": len(users_with_ooty),
            "users": users_with_ooty,
            "message": f"Found {len(users_with_ooty)} users with Ooty trips"
        }
    except Exception as e:
        logger.error(f"Error checking Ooty users: {e}")
        raise HTTPException(status_code=500, detail="Error checking Ooty users")

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

# Authentication endpoints
@app.post("/auth/verify")
async def verify_token(user: dict = Depends(get_current_user)):
    return {"user_id": user["uid"], "email": user.get("email")}

# User profile management
@app.get("/profile")
async def get_profile(user: dict = Depends(get_current_user)):
    try:
        user_doc = db.collection("users").document(user["uid"]).get()
        if user_doc.exists:
            return user_doc.to_dict()
        return {"message": "Profile not found"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/profile")
async def update_profile(profile: UserProfile, user: dict = Depends(get_current_user)):
    try:
        profile_data = profile.dict()
        profile_data["user_id"] = user["uid"]
        db.collection("users").document(user["uid"]).set(profile_data)
        return {"message": "Profile updated successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Chat endpoints
@app.post("/chat")
async def chat_with_ai(message: ChatMessage, user: dict = Depends(get_current_user)):
    """Main chat endpoint for AI conversation"""
    try:
        # Create or get session
        session_id = message.session_id
        app_name = "trip_planner_app"
        user_id = user["uid"]
        
        # Check if user has already selected a trip in this session
        selected_trip_id = None
        try:
            # Try to get selected trip from session storage (we'll use a simple approach)
            # In a real implementation, you'd store this in Redis or database
            # For now, we'll check if the message contains trip selection
            user_message_lower = message.message.lower()
            
            # Look for trip selection patterns
            if "trip" in user_message_lower and any(word in user_message_lower for word in ["1", "2", "3", "4", "5", "first", "second", "third", "ooty", "mexico"]):
                # User is selecting a trip, we'll handle this in the response
                pass
        except:
            pass
        
        # Fetch user's trip data for personalized recommendations
        user_trip_context = ""
        try:
            # Get user's trips
            trips_ref = db.collection("users").document(user_id).collection("trips")
            trips = trips_ref.stream()
            
            trips_data = []
            for trip in trips:
                trip_dict = trip.to_dict()
                trip_dict["id"] = trip.id
                trips_data.append(trip_dict)
            
            # Get user's budgets
            budgets_ref = db.collection("users").document(user_id).collection("budgets")
            budgets = budgets_ref.stream()
            
            budgets_data = []
            for budget in budgets:
                budget_dict = budget.to_dict()
                budget_dict["id"] = budget.id
                budgets_data.append(budget_dict)
            
            # Get user's expenses
            expenses_ref = db.collection("users").document(user_id).collection("expenses")
            expenses = expenses_ref.stream()
            
            expenses_data = []
            for expense in expenses:
                expense_dict = expense.to_dict()
                expense_dict["id"] = expense.id
                expenses_data.append(expense_dict)
            
            # Create interactive context for AI
            if trips_data:
                # Create a list of available trips for user selection
                trips_list = []
                for i, trip in enumerate(trips_data, 1):
                    trip_info = f"{i}. {trip.get('destination', 'Unknown')} ({trip.get('start_date', 'No date')} to {trip.get('end_date', 'No date')})"
                    if trip.get('travel_style'):
                        trip_info += f" - {trip.get('travel_style')}"
                    trips_list.append(trip_info)
                
                # Check if user is selecting a specific trip
                user_message_lower = message.message.lower()
                selected_trip = None
                
                # Check if user wants to change trips
                if any(phrase in user_message_lower for phrase in ["change trip", "switch trip", "different trip", "other trip", "new trip"]):
                    selected_trip = None  # Reset selection
                # Look for trip selection patterns
                elif any(word in user_message_lower for word in ["1", "first", "ooty", "budget"]):
                    selected_trip = trips_data[0] if len(trips_data) > 0 else None
                elif any(word in user_message_lower for word in ["2", "second", "mexico", "luxury"]):
                    selected_trip = trips_data[1] if len(trips_data) > 1 else None
                elif any(word in user_message_lower for word in ["3", "third"]):
                    selected_trip = trips_data[2] if len(trips_data) > 2 else None
                elif any(word in user_message_lower for word in ["4", "fourth"]):
                    selected_trip = trips_data[3] if len(trips_data) > 3 else None
                elif any(word in user_message_lower for word in ["5", "fifth"]):
                    selected_trip = trips_data[4] if len(trips_data) > 4 else None
                
                if selected_trip:
                    # User has selected a trip, provide detailed context
                    user_trip_context = f"""
                    SELECTED TRIP: {selected_trip.get('destination', 'Unknown')}
                    Trip ID: {selected_trip.get('id', 'unknown')}
                    Dates: {selected_trip.get('start_date', 'No date')} to {selected_trip.get('end_date', 'No date')}
                    Travel Style: {selected_trip.get('travel_style', 'Not specified')}
                    Budget: {selected_trip.get('budget', 'Not set')}
                    Interests: {', '.join(selected_trip.get('interests', []))}
                    
                    IMPORTANT: The user has selected this trip. Use the trip-details endpoint to get comprehensive data about this specific trip.
                    Don't ask which trip to work with again unless the user explicitly asks to change trips.
                    """
                else:
                    # No trip selected yet, show available trips
                    user_trip_context = f"""
                    USER'S AVAILABLE TRIPS:
                    {chr(10).join(trips_list)}
                    
                    IMPORTANT: The user hasn't selected a trip yet. Ask them which trip they want to work with from the list above.
                    Once they select a trip, remember it for the rest of the conversation.
                    
                    USER'S TRAVEL PROFILE:
                    - Total trips: {len(trips_data)}
                    - Travel styles: {', '.join(list(set([trip.get('travel_style', '') for trip in trips_data if trip.get('travel_style')])))}
                    - Common interests: {', '.join(list(set([interest for trip in trips_data for interest in trip.get('interests', [])])))}
                    """
                
                if budgets_data:
                    total_budget = sum([budget.get('total_budget', 0) for budget in budgets_data])
                    user_trip_context += f"- Total budget across trips: ₹{total_budget}\n"
                
                if expenses_data:
                    total_spent = sum([expense.get('amount', 0) for expense in expenses_data])
                    user_trip_context += f"- Total spent: ₹{total_spent}\n"
                    
                    # Get spending patterns
                    categories = {}
                    for expense in expenses_data:
                        cat = expense.get('category', 'other')
                        categories[cat] = categories.get(cat, 0) + expense.get('amount', 0)
                    
                    top_category = max(categories, key=categories.get) if categories else "none"
                    user_trip_context += f"- Top spending category: {top_category}\n"
                
                user_trip_context += f"""
                
                AVAILABLE FEATURES YOU CAN HELP WITH:
                1. Trip Planning & Management - Create, edit, delete trips
                2. Expense Tracking & Budget Analysis - Track spending, set budgets, get insights
                3. Live Location & Crowd Alerts - Get real-time crowd data and wait times
                4. Explore & Navigate - Maps, directions, nearby places, travel times
                5. Social Travel - Find similar travelers, create meetups
                6. Reviews & Ratings - Rate places, read reviews
                7. Analytics & Insights - Spending patterns, travel analytics
                
                API ENDPOINTS AVAILABLE:
                - /trip-details/{{trip_id}} - Get detailed trip information
                - /chat-location-info/{{lat}}/{{lng}} - Get location and crowd data
                - /chat-social-info/{{destination}} - Get social travel info
                - /expenses/{{trip_id}} - Get trip expenses
                - /budget-allocation/{{trip_id}} - Get trip budget
                - /spending-insights/{{trip_id}} - Get AI spending insights
                
                IMPORTANT INSTRUCTIONS:
                1. If user has selected a trip, work with that trip and don't ask again unless they want to change
                2. If no trip is selected, ask them to choose from the available trips
                3. When user asks about a specific trip, use the trip-details endpoint to get comprehensive data
                4. For location-based queries, use chat-location-info endpoint
                5. For social features, use chat-social-info endpoint
                6. Provide actionable recommendations based on the data you receive
                7. Always explain what data you're using to make recommendations
                8. Remember the selected trip for the entire conversation session
                """
            
        except Exception as context_error:
            logger.error(f"Error fetching user context: {context_error}")
            user_trip_context = ""
        
        # Create session if it doesn't exist
        try:
            session = await session_service.create_session(
                app_name=app_name,
                user_id=user_id,
                session_id=session_id
            )
        except:
            # Session might already exist, continue
            pass
        
        # Create runner
        runner = Runner(
            agent=trip_planner_agent,
            app_name=app_name,
            session_service=session_service
        )
        
        # Get chat history for context
        chat_history = await get_chat_history(session_id, limit=10)
        logger.info(f"Chat history for session {session_id}: {len(chat_history) if chat_history else 0} messages")
        history_context = ""
        if chat_history:
            history_context = "\n\nPrevious conversation:\n"
            for msg in chat_history[-6:]:  # Last 6 messages for context
                role = "User" if msg["role"] == "user" else "Assistant"
                history_context += f"{role}: {msg['content']}\n"
            logger.info(f"History context length: {len(history_context)} characters")
        
        # Prepare user message with context
        enhanced_message = f"{user_trip_context}{history_context}\n\nUser Question: {message.message}"
        content = types.Content(role='user', parts=[types.Part(text=enhanced_message)])
        
        # Get AI response - try direct approach first to avoid runner serialization issues
        final_response = "I'm here to help you plan your trip! What would you like to know?"
        
        try:
            # Check if the query is about a specific location for enhanced response
            location_keywords = ['mumbai', 'pune', 'delhi', 'bangalore', 'chennai', 'kolkata', 'hyderabad', 'goa', 'rajasthan', 'kerala', 'ooty', 'manali', 'shimla', 'darjeeling']
            user_message_lower = message.message.lower()
            
            # Try to detect location in the query
            detected_location = None
            for keyword in location_keywords:
                if keyword in user_message_lower:
                    detected_location = keyword
                    break
            
            if detected_location:
                logger.info(f"Detected location: {detected_location}, using enhanced response")
                # Include user context in enhanced response
                enhanced_query = f"{user_trip_context}\n\nUser Question: {message.message}"
                final_response = generate_enhanced_response_with_places(detected_location, enhanced_query)
                logger.info(f"Enhanced response generated: {type(final_response)}")
            else:
                # Try direct Gemini call for general queries
                logger.info("Attempting direct Gemini call to avoid runner serialization issues")
                
                # Create a simple Gemini client call using the same approach as gemini_call.py
                from google import genai
                
                # Use the API key from gemini_call.py
                client = genai.Client(api_key="AIzaSyASIcEqnPUmriBRrlZlDqX9wWnLEoaV9jI")
                
                # Make direct call with user context
                logger.info(f"Making direct call with enhanced message: {enhanced_message}")
                response = client.models.generate_content(
                    model="gemini-2.5-flash",
                    contents=enhanced_message
                )
                
                logger.info(f"Direct call response type: {type(response)}")
                logger.info(f"Response attributes: {dir(response)}")
                
                # Extract text directly from response
                if response:
                    if hasattr(response, 'text') and response.text:
                        final_response = str(response.text).strip()
                        logger.info(f"Direct Gemini response extracted from text: {type(final_response)}")
                        logger.info(f"Response content: {final_response[:100]}...")
                    elif hasattr(response, 'candidates') and response.candidates:
                        # Try to extract from candidates
                        candidate = response.candidates[0]
                        if hasattr(candidate, 'content') and candidate.content:
                            if hasattr(candidate.content, 'parts') and candidate.content.parts:
                                text_parts = []
                                for part in candidate.content.parts:
                                    if hasattr(part, 'text') and part.text:
                                        text_parts.append(str(part.text))
                                if text_parts:
                                    final_response = " ".join(text_parts).strip()
                                    logger.info(f"Direct Gemini response extracted from candidates: {type(final_response)}")
                                    logger.info(f"Response content: {final_response[:100]}...")
                                else:
                                    raise Exception("No text found in candidates")
                            else:
                                raise Exception("No parts found in candidate content")
                        else:
                            raise Exception("No content found in candidate")
                    else:
                        raise Exception("No candidates found in response")
                else:
                    raise Exception("No response received")
                
        except Exception as direct_error:
            logger.error(f"Direct call failed: {direct_error}")
            logger.error(f"Direct call error type: {type(direct_error)}")
            # Fallback to runner approach
            logger.info("Direct call failed, falling back to runner approach")
            
            try:
                async for event in runner.run_async(
                    user_id=user_id, 
                    session_id=session_id, 
                    new_message=content
                ):
                    logger.info(f"Processing event: {type(event)}, is_final: {event.is_final_response()}")
                    
                    if event.is_final_response():
                        try:
                            logger.info(f"Event content type: {type(event.content)}")
                            
                            # Use the specialized Gemini content extractor
                            extracted_text = extract_text_from_gemini_content(event.content)
                            
                            if extracted_text and extracted_text.strip():
                                final_response = extracted_text.strip()
                                logger.info(f"Extracted text from Gemini content: {type(final_response)}")
                            else:
                                # Fallback to safe extraction if no text found
                                extracted_text = safe_extract_text(event.content)
                                if extracted_text and isinstance(extracted_text, str):
                                    final_response = extracted_text.strip()
                                else:
                                    final_response = "I'm here to help you plan your trip! What would you like to know?"
                            
                            logger.info(f"Final response set: {type(final_response)}")
                                
                        except Exception as content_error:
                            logger.error(f"Error processing content: {content_error}")
                            final_response = "I'm here to help you plan your trip! What would you like to know?"
                        break
            except Exception as runner_error:
                logger.error(f"Error in runner: {runner_error}")
                logger.error(f"Error type: {type(runner_error)}")
                
                # Check if this is a bytes serialization error
                if "bytes" in str(runner_error).lower() and "json" in str(runner_error).lower():
                    logger.info("Detected bytes serialization error in runner - this is expected with thought_signature parts")
                    # The runner error is expected due to thought_signature parts, but we should still get a response
                    # Try to provide a helpful response based on the user's request
                    if "pune" in message.message.lower() or "travel" in message.message.lower():
                        final_response = "I'd be happy to help you with travel recommendations for Pune! However, I'm experiencing some technical issues with the AI response processing. Please try asking again, and I'll provide you with detailed travel suggestions for Pune."
                    else:
                        final_response = "I'm here to help you plan your trip! What would you like to know?"
                else:
                    final_response = "I'm here to help you plan your trip! What would you like to know?"
        
        # Ensure response is a string and clean it up
        final_response = str(final_response) if final_response else "I'm here to help you plan your trip! What would you like to know?"
        
        # Safety check for bytes and other non-serializable content
        try:
            logger.info(f"Final response before sanitization: {type(final_response)}")
            
            # Only sanitize if we detect problematic content
            if isinstance(final_response, bytes):
                final_response = final_response.decode('utf-8', errors='ignore')
            elif not isinstance(final_response, str):
                # Only sanitize non-string types
                final_response = sanitize_for_json(final_response)
            
            # Ensure it's a clean string
            final_response = str(final_response).strip()
            logger.info(f"Final response after processing: {type(final_response)}")
            
            # Test if the response can be JSON serialized
            import json
            test_serialization = json.dumps(final_response)
            logger.info("JSON serialization test passed")
            
        except Exception as serialization_error:
            logger.error(f"Serialization error: {serialization_error}")
            logger.error(f"Problematic response type: {type(final_response)}")
            # If it can't be serialized, create a safe response
            final_response = "I'm here to help you plan your trip! What would you like to know?"
        
        # Final safety check - ensure response is JSON serializable
        try:
            import json
            
            # Test serialization of the complete response
            test_response = {"response": final_response, "session_id": session_id}
            json.dumps(test_response)
            logger.info("Final JSON serialization test passed")
            
            # Save the chat message to history
            logger.info(f"Saving chat message for user {user['uid']}, session {session_id}")
            await save_chat_message(user["uid"], session_id, message.message, final_response)
            
            return {
                "response": final_response,
                "session_id": session_id
            }
        except Exception as json_error:
            logger.error(f"Final JSON serialization error: {json_error}")
            logger.error(f"Response type: {type(final_response)}, Session ID type: {type(session_id)}")
            # Return a completely safe response
            return {
                "response": "I'm here to help you plan your trip! What would you like to know?",
                "session_id": str(session_id) if session_id else "unknown"
            }
        
    except Exception as e:
        logger.error(f"Chat error: {e}")
        logger.error(f"Error type: {type(e)}")
        logger.error(f"Error details: {str(e)}")
        
        # Return a safe fallback response
        return {
            "response": "I'm here to help you plan your trip! What would you like to know?",
            "session_id": message.session_id if message.session_id else "unknown"
        }

@app.get("/chat/history/{session_id}")
async def get_chat_history_endpoint(session_id: str, user: dict = Depends(get_current_user)):
    """Get chat history for a specific session"""
    try:
        history = await get_chat_history(session_id)
        return {
            "session_id": session_id,
            "messages": history,
            "status": "success"
        }
    except Exception as e:
        logger.error(f"Error getting chat history: {e}")
        raise HTTPException(status_code=500, detail="Error getting chat history")

@app.get("/chat/sessions")
async def get_user_chat_sessions_endpoint(user: dict = Depends(get_current_user)):
    """Get all chat sessions for a user"""
    try:
        sessions = await get_user_chat_sessions(user["uid"])
        return {
            "sessions": sessions,
            "status": "success"
        }
    except Exception as e:
        logger.error(f"Error getting user chat sessions: {e}")
        raise HTTPException(status_code=500, detail="Error getting chat sessions")

@app.post("/transportation-suggestions")
async def get_transportation_suggestions_endpoint(request: TransportationRequest, user: dict = Depends(get_current_user)):
    """Get AI-powered transportation suggestions based on source, destination, budget, and dates"""
    try:
        suggestions = await get_transportation_suggestions(
            source=request.source,
            destination=request.destination,
            budget=request.budget,
            start_date=request.start_date,
            end_date=request.end_date,
            currency=request.currency
        )
        
        if suggestions is None:
            raise HTTPException(status_code=500, detail="Error generating transportation suggestions")
        
        return {
            "suggestions": suggestions,
            "status": "success"
        }
    except Exception as e:
        logger.error(f"Error getting transportation suggestions: {e}")
        raise HTTPException(status_code=500, detail="Error getting transportation suggestions")

@app.post("/meeting-point-suggestion")
async def get_meeting_point_suggestion_endpoint(request: MeetingPointRequest, user: dict = Depends(get_current_user)):
    """Get AI-powered meeting point suggestions when travelers have different transportation"""
    try:
        suggestion = await get_meeting_point_suggestion(
            traveler1_location=request.traveler1_location,
            traveler1_transport=request.traveler1_transport,
            traveler2_location=request.traveler2_location,
            traveler2_transport=request.traveler2_transport,
            destination=request.destination
        )
        
        if suggestion is None:
            raise HTTPException(status_code=500, detail="Error generating meeting point suggestion")
        
        return {
            "suggestion": suggestion,
            "status": "success"
        }
    except Exception as e:
        logger.error(f"Error getting meeting point suggestion: {e}")
        raise HTTPException(status_code=500, detail="Error getting meeting point suggestion")

@app.post("/plan-trip")
async def plan_trip(request: TripPlanRequest, user: dict = Depends(get_current_user)):
    """Generate a comprehensive trip plan based on user requirements"""
    try:
        # Calculate trip duration
        from datetime import datetime
        start_date = datetime.strptime(request.start_date, "%Y-%m-%d")
        end_date = datetime.strptime(request.end_date, "%Y-%m-%d")
        days = (end_date - start_date).days + 1
        
        # Get comprehensive trip recommendations
        recommendations = await get_trip_recommendations(
            request.destination, 
            request.travel_style, 
            request.budget
        )
        
        # Create daily itinerary
        itinerary = await create_daily_itinerary(
            request.destination, 
            days, 
            request.travel_style
        )
        
        # Generate AI-powered trip plan
        trip_plan = {
            "destination": request.destination,
            "start_date": request.start_date,
            "end_date": request.end_date,
            "duration_days": days,
            "travel_style": request.travel_style,
            "budget": request.budget,
            "travelers": request.travelers,
            "interests": request.interests,
            "recommendations": recommendations,
            "daily_itinerary": itinerary,
            "total_estimated_cost": f"${days * 150 * request.travelers} - ${days * 300 * request.travelers}",
            "pro_tips": [
                f"Best time to visit {request.destination} is during the recommended season",
                "Book accommodations in advance for better rates",
                "Consider local transportation options for cost savings",
                "Pack according to the local weather and culture"
            ]
        }
        
        return {
            "trip_plan": trip_plan,
            "message": f"Complete trip plan generated for {request.destination}!",
            "status": "success"
        }
        
    except Exception as e:
        logger.error(f"Trip planning error: {e}")
        raise HTTPException(status_code=500, detail="Error generating trip plan")

# Phase 0: Discovery & Inspiration Endpoints
@app.post("/suggest-destinations")
async def suggest_destinations(request: DestinationSuggestionRequest, user: dict = Depends(get_current_user)):
    """Get AI-driven destination suggestions based on mood, theme, and interests"""
    try:
        suggestions = await get_destination_suggestions(
            request.mood or "cultural",
            request.theme or "general", 
            request.budget_range or "mid-range",
            request.interests or []
        )
        
        return {
            "suggestions": suggestions,
            "message": f"Found {len(suggestions['suggestions'])} destinations matching your preferences",
            "status": "success"
        }
    except Exception as e:
        logger.error(f"Destination suggestion error: {e}")
        raise HTTPException(status_code=500, detail="Error getting destination suggestions")

# Phase 1: Advanced Trip Planning Endpoints
@app.post("/predictive-suggestions")
async def get_predictive_suggestions_endpoint(destination: str, user: dict = Depends(get_current_user)):
    """Get predictive activity and booking suggestions based on user history"""
    try:
        # Get user profile to understand their interests
        user_doc = db.collection("users").document(user["uid"]).get()
        user_interests = []
        past_trips = []
        
        if user_doc.exists:
            user_data = user_doc.to_dict()
            user_interests = user_data.get("interests", [])
            past_trips = user_data.get("past_destinations", [])
        
        suggestions = await get_predictive_suggestions(destination, user_interests or [], past_trips or [])
        
        return {
            "suggestions": suggestions,
            "destination": destination,
            "status": "success"
        }
    except Exception as e:
        logger.error(f"Predictive suggestions error: {e}")
        raise HTTPException(status_code=500, detail="Error getting predictive suggestions")

# Phase 4: In-Trip Companion Endpoints
@app.get("/nearby-suggestions/{latitude}/{longitude}")
async def get_nearby_suggestions_endpoint(latitude: float, longitude: float, current_activity: str = None, user: dict = Depends(get_current_user)):
    """Get contextual nearby suggestions based on current location"""
    try:
        suggestions = await get_nearby_suggestions(latitude, longitude, current_activity or "exploring")
        
        return {
            "suggestions": suggestions,
            "location": {"latitude": latitude, "longitude": longitude},
            "status": "success"
        }
    except Exception as e:
        logger.error(f"Nearby suggestions error: {e}")
        raise HTTPException(status_code=500, detail="Error getting nearby suggestions")

@app.post("/expenses")
async def add_expense(expense: ExpenseEntry, user: dict = Depends(get_current_user)):
    """Add expense entry for trip tracking"""
    try:
        expense_data = expense.dict()
        expense_data["user_id"] = user["uid"]
        expense_data["created_at"] = str(asyncio.get_event_loop().time())
        
        doc_ref = db.collection("users").document(user["uid"]).collection("expenses").add(expense_data)
        expense_id = doc_ref[1].id
        
        return {
            "expense_id": expense_id,
            "message": "Expense added successfully",
            "status": "success"
        }
    except Exception as e:
        logger.error(f"Add expense error: {e}")
        raise HTTPException(status_code=500, detail="Error adding expense")

@app.get("/expenses/{trip_id}")
async def get_trip_expenses(trip_id: str, user: dict = Depends(get_current_user)):
    """Get all expenses for a specific trip"""
    try:
        expenses_ref = db.collection("users").document(user["uid"]).collection("expenses")
        expenses = expenses_ref.where("trip_id", "==", trip_id).stream()
        
        expense_list = []
        total_spent = 0
        category_totals = {}
        
        for expense in expenses:
            expense_data = expense.to_dict()
            expense_data["id"] = expense.id
            expense_list.append(expense_data)
            
            # Calculate totals
            amount = expense_data.get("amount", 0)
            total_spent += amount
            
            category = expense_data.get("category", "Other")
            category_totals[category] = category_totals.get(category, 0) + amount
        
        return {
            "expenses": expense_list,
            "total_spent": total_spent,
            "category_totals": category_totals,
            "trip_id": trip_id,
            "status": "success"
        }
    except Exception as e:
        logger.error(f"Get expenses error: {e}")
        raise HTTPException(status_code=500, detail="Error getting expenses")

@app.get("/expenses")
async def get_all_expenses(user: dict = Depends(get_current_user)):
    """Get all expenses for the user"""
    try:
        expenses_ref = db.collection("users").document(user["uid"]).collection("expenses")
        expenses = expenses_ref.stream()
        
        expense_list = []
        for expense in expenses:
            expense_data = expense.to_dict()
            expense_data["id"] = expense.id
            expense_list.append(expense_data)
        
        return {
            "expenses": expense_list,
            "status": "success"
        }
    except Exception as e:
        logger.error(f"Get all expenses error: {e}")
        raise HTTPException(status_code=500, detail="Error getting expenses")

@app.post("/budget-allocation")
async def set_budget_allocation(budget: BudgetAllocation, user: dict = Depends(get_current_user)):
    """Set budget allocation for a trip"""
    try:
        budget_data = budget.dict()
        budget_data["user_id"] = user["uid"]
        budget_data["created_at"] = str(asyncio.get_event_loop().time())
        
        doc_ref = db.collection("users").document(user["uid"]).collection("budgets").add(budget_data)
        budget_id = doc_ref[1].id
        
        return {
            "budget_id": budget_id,
            "message": "Budget allocation set successfully",
            "status": "success"
        }
    except Exception as e:
        logger.error(f"Set budget error: {e}")
        raise HTTPException(status_code=500, detail="Error setting budget allocation")

@app.get("/budget-allocation/{trip_id}")
async def get_budget_allocation(trip_id: str, user: dict = Depends(get_current_user)):
    """Get budget allocation for a trip"""
    try:
        budgets_ref = db.collection("users").document(user["uid"]).collection("budgets")
        budgets = budgets_ref.where("trip_id", "==", trip_id).stream()
        
        budget_data = None
        for budget in budgets:
            budget_data = budget.to_dict()
            budget_data["id"] = budget.id
            break
        
        if not budget_data:
            return {"message": "No budget allocation found for this trip", "status": "not_found"}
        
        return {
            "budget": budget_data,
            "status": "success"
        }
    except Exception as e:
        logger.error(f"Get budget error: {e}")
        raise HTTPException(status_code=500, detail="Error getting budget allocation")

@app.get("/budgets")
async def get_all_budgets(user: dict = Depends(get_current_user)):
    """Get all budgets for the user"""
    try:
        budgets_ref = db.collection("users").document(user["uid"]).collection("budgets")
        budgets = budgets_ref.stream()
        
        budget_list = []
        for budget in budgets:
            budget_data = budget.to_dict()
            budget_data["id"] = budget.id
            budget_list.append(budget_data)
        
        return {
            "budgets": budget_list,
            "status": "success"
        }
    except Exception as e:
        logger.error(f"Get all budgets error: {e}")
        raise HTTPException(status_code=500, detail="Error getting budgets")

@app.get("/trip-details/{trip_id}")
async def get_trip_details(trip_id: str, user: dict = Depends(get_current_user)):
    """Get detailed information about a specific trip for chat integration"""
    try:
        # Get trip data
        trip_ref = db.collection("users").document(user["uid"]).collection("trips").document(trip_id)
        trip_doc = trip_ref.get()
        
        if not trip_doc.exists:
            raise HTTPException(status_code=404, detail="Trip not found")
        
        trip_data = trip_doc.to_dict()
        trip_data["id"] = trip_id
        
        # Get expenses for this trip
        expenses_ref = db.collection("users").document(user["uid"]).collection("expenses")
        expenses = expenses_ref.where("trip_id", "==", trip_id).stream()
        
        expenses_data = []
        total_spent = 0
        for expense in expenses:
            expense_dict = expense.to_dict()
            expense_dict["id"] = expense.id
            expenses_data.append(expense_dict)
            total_spent += expense_dict.get("amount", 0)
        
        # Get budget for this trip
        budgets_ref = db.collection("users").document(user["uid"]).collection("budgets")
        budgets = budgets_ref.where("trip_id", "==", trip_id).stream()
        
        budget_data = None
        for budget in budgets:
            budget_data = budget.to_dict()
            budget_data["id"] = budget.id
            break
        
        # Get analytics
        analytics = {
            "total_spent": total_spent,
            "expense_count": len(expenses_data),
            "budget_remaining": budget_data.get("total_budget", 0) - total_spent if budget_data else None,
            "categories": {}
        }
        
        # Calculate category spending
        for expense in expenses_data:
            cat = expense.get("category", "other")
            analytics["categories"][cat] = analytics["categories"].get(cat, 0) + expense.get("amount", 0)
        
        return {
            "trip": trip_data,
            "expenses": expenses_data,
            "budget": budget_data,
            "analytics": analytics,
            "status": "success"
        }
        
    except Exception as e:
        logger.error(f"Get trip details error: {e}")
        raise HTTPException(status_code=500, detail="Error getting trip details")

@app.get("/spending-insights/{trip_id}")
async def get_spending_insights(trip_id: str, user: dict = Depends(get_current_user)):
    """Get AI-powered spending insights and suggestions"""
    try:
        # Get trip data
        trip_doc = db.collection("users").document(user["uid"]).collection("trips").document(trip_id).get()
        if not trip_doc.exists:
            raise HTTPException(status_code=404, detail="Trip not found")
        
        trip_data = trip_doc.to_dict()
        
        # Get expenses for this trip
        expenses_ref = db.collection("users").document(user["uid"]).collection("expenses").where("trip_id", "==", trip_id).stream()
        expenses = []
        total_spent = 0
        category_spending = {}
        
        for expense in expenses_ref:
            expense_data = expense.to_dict()
            expenses.append(expense_data)
            amount = expense_data.get("amount", 0)
            total_spent += amount
            
            category = expense_data.get("category", "other")
            category_spending[category] = category_spending.get(category, 0) + amount
        
        # Get budget allocation
        budgets_ref = db.collection("users").document(user["uid"]).collection("budgets")
        budgets = budgets_ref.where("trip_id", "==", trip_id).stream()
        
        budget_data = None
        for budget in budgets:
            budget_data = budget.to_dict()
            break
        
        # Generate AI insights using Gemini
        insights_prompt = f"""
        Analyze this travel spending data and provide smart insights:
        
        Trip: {trip_data.get('destination', 'Unknown')}
        Total Spent: {total_spent}
        Category Breakdown: {category_spending}
        Budget: {budget_data.get('total_budget', 'Not set') if budget_data else 'Not set'}
        
        Provide:
        1. Spending pattern analysis
        2. Budget optimization suggestions
        3. Cost-saving tips for this destination
        4. Category-wise recommendations
        5. Daily spending advice
        
        Keep it concise and actionable.
        """
        
        try:
            import google.genai as genai
            client = genai.Client(api_key="AIzaSyASIcEqnPUmriBRrlZlDqX9wWnLEoaV9jI")
            response = client.models.generate_content(model="gemini-2.5-flash", contents=insights_prompt)
            ai_insights = response.text if hasattr(response, 'text') else "Unable to generate insights at this time."
        except Exception as ai_error:
            logger.error(f"AI insights error: {ai_error}")
            ai_insights = "AI insights temporarily unavailable."
        
        # Calculate spending efficiency
        daily_spending = total_spent / max(1, len(expenses))
        highest_category = max(category_spending, key=category_spending.get) if category_spending else "none"
        
        insights = {
            "trip_id": trip_id,
            "destination": trip_data.get("destination"),
            "total_spent": total_spent,
            "category_spending": category_spending,
            "daily_average": daily_spending,
            "highest_spending_category": highest_category,
            "ai_insights": ai_insights,
            "suggestions": [
                f"Your highest spending is on {highest_category} - consider alternatives",
                f"Daily average: ₹{daily_spending:.2f} - adjust if needed",
                "Consider local transport options to save money",
                "Look for free activities and attractions"
            ],
            "status": "success"
        }
        
        return insights
        
    except Exception as e:
        logger.error(f"Spending insights error: {e}")
        raise HTTPException(status_code=500, detail="Error getting spending insights")

# Missing Features Implementation

@app.post("/traveler-profile")
async def create_traveler_profile(profile: TravelerProfile, user: dict = Depends(get_current_user)):
    """Create or update persistent traveler profile"""
    try:
        profile_data = profile.dict()
        profile_data["user_id"] = user["uid"]
        profile_data["updated_at"] = str(asyncio.get_event_loop().time())
        
        doc_ref = db.collection("traveler_profiles").document(user["uid"])
        doc_ref.set(profile_data)
        
        return {
            "message": "Traveler profile created successfully",
            "status": "success"
        }
    except Exception as e:
        logger.error(f"Create traveler profile error: {e}")
        raise HTTPException(status_code=500, detail="Error creating traveler profile")

@app.get("/traveler-profile")
async def get_traveler_profile(user: dict = Depends(get_current_user)):
    """Get persistent traveler profile"""
    try:
        doc_ref = db.collection("traveler_profiles").document(user["uid"])
        doc = doc_ref.get()
        
        if doc.exists:
            return {
                "profile": doc.to_dict(),
                "status": "success"
            }
        else:
            return {
                "message": "No traveler profile found",
                "status": "not_found"
            }
    except Exception as e:
        logger.error(f"Get traveler profile error: {e}")
        raise HTTPException(status_code=500, detail="Error getting traveler profile")

@app.get("/crowd-insights/{location}")
async def get_crowd_insights(location: str):
    """Get real-time crowd and popularity insights"""
    try:
        # This would typically integrate with real-time data sources
        # For now, we'll generate realistic insights
        insights = {
            "location": location,
            "current_crowd_level": "moderate",
            "peak_hours": ["10:00-12:00", "14:00-16:00", "18:00-20:00"],
            "best_visit_times": ["08:00-10:00", "12:00-14:00", "20:00-22:00"],
            "crowd_trends": {
                "weekday": "low",
                "weekend": "high",
                "holiday": "very_high"
            },
            "recommendations": [
                f"Visit {location} early morning for fewer crowds",
                "Avoid weekends if possible",
                "Book tickets in advance during peak season"
            ]
        }
        
        return {
            "insights": insights,
            "status": "success"
        }
    except Exception as e:
        logger.error(f"Get crowd insights error: {e}")
        raise HTTPException(status_code=500, detail="Error getting crowd insights")

@app.post("/dynamic-budget-reallocation")
async def dynamic_budget_reallocation(trip_id: str, user: dict = Depends(get_current_user)):
    """Dynamic budget reallocation based on spending patterns"""
    try:
        # Get current expenses
        expenses_ref = db.collection("users").document(user["uid"]).collection("expenses")
        expenses = expenses_ref.where("trip_id", "==", trip_id).stream()
        
        category_spending = {}
        total_spent = 0
        
        for expense in expenses:
            expense_data = expense.to_dict()
            category = expense_data.get("category", "Other")
            amount = expense_data.get("amount", 0)
            
            category_spending[category] = category_spending.get(category, 0) + amount
            total_spent += amount
        
        # Get budget allocation
        budgets_ref = db.collection("users").document(user["uid"]).collection("budgets")
        budgets = budgets_ref.where("trip_id", "==", trip_id).stream()
        
        budget_data = None
        for budget in budgets:
            budget_data = budget.to_dict()
            break
        
        if not budget_data:
            return {"message": "No budget allocation found", "status": "not_found"}
        
        # Calculate reallocation suggestions
        total_budget = budget_data.get("total_budget", 0)
        remaining_budget = total_budget - total_spent
        
        reallocation_suggestions = []
        for category, spent in category_spending.items():
            allocated = budget_data.get("category_allocations", {}).get(category, 0)
            if spent > allocated * 1.2:  # 20% over budget
                reallocation_suggestions.append({
                    "category": category,
                    "current_spent": spent,
                    "allocated": allocated,
                    "suggestion": "Reduce spending or reallocate from other categories"
                })
        
        return {
            "trip_id": trip_id,
            "total_budget": total_budget,
            "total_spent": total_spent,
            "remaining_budget": remaining_budget,
            "category_spending": category_spending,
            "reallocation_suggestions": reallocation_suggestions,
            "status": "success"
        }
    except Exception as e:
        logger.error(f"Dynamic budget reallocation error: {e}")
        raise HTTPException(status_code=500, detail="Error in budget reallocation")

@app.get("/travel-mood-detection")
async def detect_travel_mood(user: dict = Depends(get_current_user)):
    """Detect current travel mood based on user activity and preferences"""
    try:
        # Get user's recent activity and preferences
        user_doc = db.collection("users").document(user["uid"]).get()
        user_data = user_doc.to_dict() if user_doc.exists else {}
        
        # Analyze recent trips and activities
        trips_ref = db.collection("users").document(user["uid"]).collection("trips")
        recent_trips = trips_ref.order_by("created_at", direction=firestore.Query.DESCENDING).limit(5).stream()
        
        mood_indicators = {
            "adventure": 0,
            "cultural": 0,
            "relaxation": 0,
            "social": 0,
            "luxury": 0,
            "budget": 0
        }
        
        for trip in recent_trips:
            trip_data = trip.to_dict()
            travel_style = trip_data.get("travel_style", "cultural")
            budget = trip_data.get("budget", "mid-range")
            
            if travel_style in mood_indicators:
                mood_indicators[travel_style] += 1
            if budget == "luxury":
                mood_indicators["luxury"] += 1
            elif budget == "budget":
                mood_indicators["budget"] += 1
        
        # Determine dominant mood
        dominant_mood = max(mood_indicators, key=mood_indicators.get)
        
        # Generate adaptive recommendations
        recommendations = {
            "adventure": ["Try a new outdoor activity", "Explore a national park", "Go on a hiking trip"],
            "cultural": ["Visit a museum", "Attend a cultural festival", "Take a historical tour"],
            "relaxation": ["Book a spa retreat", "Visit a beach destination", "Stay at a wellness resort"],
            "social": ["Join a group tour", "Attend a meetup", "Stay at a social hostel"],
            "luxury": ["Book a 5-star hotel", "Try fine dining", "Book a private tour"],
            "budget": ["Look for budget accommodations", "Find free activities", "Use public transportation"]
        }
        
        return {
            "detected_mood": dominant_mood,
            "mood_indicators": mood_indicators,
            "recommendations": recommendations.get(dominant_mood, []),
            "confidence": mood_indicators[dominant_mood] / sum(mood_indicators.values()) if sum(mood_indicators.values()) > 0 else 0,
            "status": "success"
        }
    except Exception as e:
        logger.error(f"Travel mood detection error: {e}")
        raise HTTPException(status_code=500, detail="Error detecting travel mood")

# Google Tech Stack Integration

@app.get("/chat-location-info/{latitude}/{longitude}")
async def get_chat_location_info(latitude: float, longitude: float, user: dict = Depends(get_current_user)):
    """Get location information for chat integration"""
    try:
        # Get crowd alert data
        crowd_data = await get_crowd_alert_data(latitude, longitude)
        
        # Get nearby places
        nearby_places = await search_places(f"{latitude},{longitude}", "attractions")
        
        # Get weather info (mock for now)
        weather_info = {
            "temperature": "25°C",
            "condition": "Sunny",
            "humidity": "65%"
        }
        
        return {
            "location": {
                "latitude": latitude,
                "longitude": longitude
            },
            "crowd_alert": crowd_data,
            "nearby_places": nearby_places[:5] if nearby_places else [],
            "weather": weather_info,
            "status": "success"
        }
        
    except Exception as e:
        logger.error(f"Chat location info error: {e}")
        raise HTTPException(status_code=500, detail="Error getting location information")

async def get_crowd_alert_data(latitude: float, longitude: float):
    """Get crowd alert data for a location"""
    try:
        # Simulate crowd level based on time and location
        import random
        from datetime import datetime
        
        current_hour = datetime.now().hour
        
        # Determine crowd level based on time
        if 9 <= current_hour <= 11 or 18 <= current_hour <= 20:
            crowd_level = "high"
            wait_time = random.randint(15, 30)
        elif 12 <= current_hour <= 17:
            crowd_level = "moderate" 
            wait_time = random.randint(5, 15)
        else:
            crowd_level = "low"
            wait_time = random.randint(0, 5)
        
        return {
            "crowd_level": crowd_level,
            "estimated_wait_time": wait_time,
            "best_time_to_visit": "Early morning (6-9 AM) or late evening (8-10 PM)",
            "location": f"Location at {latitude}, {longitude}",
            "ai_recommendations": [
                f"Current crowd level is {crowd_level}",
                f"Expected wait time: {wait_time} minutes",
                "Consider visiting during off-peak hours for better experience"
            ]
        }
        
    except Exception as e:
        logger.error(f"Crowd alert data error: {e}")
        return {
            "crowd_level": "unknown",
            "estimated_wait_time": 0,
            "best_time_to_visit": "Check local information",
            "location": f"Location at {latitude}, {longitude}",
            "ai_recommendations": ["Unable to get crowd data at this time"]
        }

@app.get("/live-location-alert/{latitude}/{longitude}")
async def get_live_location_alert(latitude: float, longitude: float, user: dict = Depends(get_current_user)):
    """Get live location alert with crowd data and nearby alternatives"""
    try:
        # Get current location name using reverse geocoding
        location_name = await get_location_name(latitude, longitude)
        
        # Get crowd insights for this location
        crowd_insights = await get_crowd_insights(location_name)
        
        # Find nearby alternatives
        nearby_alternatives = await search_places(f"{latitude},{longitude}", "attractions")
        
        # Generate AI recommendations for alternatives
        ai_recommendations = []
        if crowd_insights.get("current_crowd_level") == "high":
            ai_recommendations = [
                f"Current location is crowded. Consider visiting {alt.get('name', 'nearby attraction')} instead.",
                "Try visiting during off-peak hours for a better experience.",
                "Book tickets in advance to avoid long waits."
            ]
        
        alert = {
            "location": location_name,
            "latitude": latitude,
            "longitude": longitude,
            "crowd_level": crowd_insights.get("current_crowd_level", "moderate"),
            "nearby_alternatives": nearby_alternatives[:3],
            "estimated_wait_time": 30 if crowd_insights.get("current_crowd_level") == "high" else 5,
            "best_time_to_visit": crowd_insights.get("best_visit_times", ["Morning", "Evening"])[0],
            "ai_recommendations": ai_recommendations
        }
        
        return {
            "alert": alert,
            "status": "success"
        }
    except Exception as e:
        logger.error(f"Live location alert error: {e}")
        raise HTTPException(status_code=500, detail="Error getting live location alert")

@app.post("/generate-travel-image")
async def generate_travel_image(request: GeneratedImageRequest, user: dict = Depends(get_current_user)):
    """Generate AI travel images using Google's image generation"""
    try:
        # Create a detailed prompt for image generation
        prompt = f"""
        {request.prompt} in {request.destination}. 
        Style: {request.style}. 
        High quality travel photography, vibrant colors, professional composition.
        """
        
        # Use Gemini to generate image (this would typically use Imagen or similar)
        # For now, we'll return a placeholder with the prompt
        image_data = {
            "prompt": prompt,
            "destination": request.destination,
            "style": request.style,
            "image_url": f"https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photoreference=placeholder&key={GOOGLE_API_KEY}",
            "generated_at": str(asyncio.get_event_loop().time())
        }
        
        return {
            "image": image_data,
            "status": "success"
        }
    except Exception as e:
        logger.error(f"Generate travel image error: {e}")
        raise HTTPException(status_code=500, detail="Error generating travel image")

@app.get("/maps-embed/{location}")
async def get_maps_embed(location: str):
    """Get Google Maps embed for a location"""
    try:
        # Generate Google Maps embed URL
        embed_url = f"https://www.google.com/maps/embed/v1/place?key={GOOGLE_API_KEY}&q={location}"
        
        return {
            "embed_url": embed_url,
            "location": location,
            "status": "success"
        }
    except Exception as e:
        logger.error(f"Maps embed error: {e}")
        raise HTTPException(status_code=500, detail="Error getting maps embed")

async def get_location_name(latitude: float, longitude: float) -> str:
    """Get location name from coordinates using reverse geocoding"""
    try:
        url = f"https://maps.googleapis.com/maps/api/geocode/json"
        params = {
            "latlng": f"{latitude},{longitude}",
            "key": GOOGLE_API_KEY
        }
        
        response = requests.get(url, params=params)
        response.raise_for_status()
        data = response.json()
        
        if data.get("results"):
            return data["results"][0]["formatted_address"]
        return f"Location at {latitude}, {longitude}"
    except Exception as e:
        logger.error(f"Error getting location name: {e}")
        return f"Location at {latitude}, {longitude}"

# Phase 6: Social Travel Endpoints
class FindTravelersRequest(BaseModel):
    destination: str
    travel_style: str
    interests: List[str]

@app.post("/find-travelers")
async def find_travelers(request: FindTravelersRequest, user: dict = Depends(get_current_user)):
    """Find similar travelers for meetups"""
    try:
        similar_travelers = await find_similar_travelers(
            request.destination, 
            request.travel_style, 
            request.interests,
            current_user_id=user["uid"]
        )
        
        return {
            "similar_travelers": similar_travelers,
            "destination": request.destination,
            "travel_style": request.travel_style,
            "interests": request.interests,
            "current_user_id": user["uid"],
            "status": "success"
        }
    except Exception as e:
        logger.error(f"Find travelers error: {e}")
        raise HTTPException(status_code=500, detail="Error finding similar travelers")

@app.get("/user-social-data")
async def get_user_social_data(user: dict = Depends(get_current_user)):
    """Get social data based on user's existing trips"""
    try:
        # Get user's trips
        trips_ref = db.collection("users").document(user["uid"]).collection("trips")
        trips = trips_ref.stream()
        
        user_trips = []
        for trip in trips:
            trip_data = trip.to_dict()
            trip_data["id"] = trip.id
            user_trips.append(trip_data)
        
        if not user_trips:
            return {
                "message": "No trips found. Create a trip first to see social features.",
                "user_trips": [],
                "social_data": {},
                "status": "success"
            }
        
        # Get social data for each destination
        social_data = {}
        for trip in user_trips:
            destination = trip.get("destination", "")
            if destination:
                # Find similar travelers for this destination
                all_users = db.collection("users").stream()
                similar_travelers = []
                
                for user_doc in all_users:
                    if user_doc.id == user["uid"]:  # Skip current user
                        continue
                        
                    user_data = user_doc.to_dict()
                    user_trips_other = db.collection("users").document(user_doc.id).collection("trips").stream()
                    
                    for other_trip in user_trips_other:
                        other_trip_data = other_trip.to_dict()
                        if other_trip_data.get("destination", "").lower() == destination.lower():
                            # Found a user with a trip to the same destination
                            traveler_info = {
                                "user_id": user_doc.id,
                                "name": user_data.get("name", "Unknown"),
                                "email": user_data.get("email", ""),
                                "travel_style": user_data.get("travel_style", ""),
                                "interests": user_data.get("interests", []),
                                "trip_dates": f"{other_trip_data.get('start_date', '')} to {other_trip_data.get('end_date', '')}",
                                "trip_id": other_trip.id,
                                "budget": other_trip_data.get("budget", 0),
                                "destination": destination
                            }
                            similar_travelers.append(traveler_info)
                            break  # Only add each user once
                
                # Get meetup requests for this destination
                meetups_ref = db.collection("users").document(user["uid"]).collection("meetup_requests")
                meetups = meetups_ref.where("destination", "==", destination).stream()
                
                meetups_data = []
                for meetup in meetups:
                    meetup_dict = meetup.to_dict()
                    meetup_dict["id"] = meetup.id
                    meetups_data.append(meetup_dict)
                
                # Get AI suggestions for this destination
                ai_suggestions = await get_ai_activity_suggestions(destination, similar_travelers)
                
                social_data[destination] = {
                    "trip_info": trip,
                    "similar_travelers": similar_travelers[:5],  # Limit to 5
                    "meetup_requests": meetups_data[:5],  # Limit to 5
                    "ai_suggestions": ai_suggestions,
                    "social_activity": {
                        "total_travelers": len(similar_travelers),
                        "active_meetups": len(meetups_data),
                        "popular_activities": ["City tour", "Food experience", "Photography walk"]
                    }
                }
        
        return {
            "user_trips": user_trips,
            "social_data": social_data,
            "status": "success"
        }
        
    except Exception as e:
        logger.error(f"User social data error: {e}")
        raise HTTPException(status_code=500, detail="Error getting user social data")

@app.get("/chat-social-info/{destination}")
async def get_chat_social_info(destination: str, user: dict = Depends(get_current_user)):
    """Get social travel information for chat integration"""
    try:
        # Find users with trips to the same destination
        all_users = db.collection("users").stream()
        similar_travelers = []
        
        for user_doc in all_users:
            if user_doc.id == user["uid"]:  # Skip current user
                continue
                
            user_data = user_doc.to_dict()
            user_trips = db.collection("users").document(user_doc.id).collection("trips").stream()
            
            for trip in user_trips:
                trip_data = trip.to_dict()
                if trip_data.get("destination", "").lower() == destination.lower():
                    # Found a user with a trip to the same destination
                    traveler_info = {
                        "user_id": user_doc.id,
                        "name": user_data.get("name", "Unknown"),
                        "email": user_data.get("email", ""),
                        "travel_style": user_data.get("travel_style", ""),
                        "interests": user_data.get("interests", []),
                        "trip_dates": f"{trip_data.get('start_date', '')} to {trip_data.get('end_date', '')}",
                        "trip_id": trip.id,
                        "budget": trip_data.get("budget", 0)
                    }
                    similar_travelers.append(traveler_info)
                    break  # Only add each user once
        
        # Get meetup requests for this destination (both sent and received)
        # Get requests sent by current user
        sent_meetups_data = []
        try:
            sent_meetups_ref = db.collection("users").document(user["uid"]).collection("sent_meetup_requests")
            sent_meetups = sent_meetups_ref.where("destination", "==", destination).stream()
            
            for meetup in sent_meetups:
                meetup_dict = meetup.to_dict()
                meetup_dict["id"] = meetup.id
                meetup_dict["type"] = "sent"
                sent_meetups_data.append(meetup_dict)
        except Exception as e:
            logger.info(f"No sent meetup requests found for user {user['uid']}: {e}")
            sent_meetups_data = []
        
        # Get requests received by current user
        received_meetups_ref = db.collection("users").document(user["uid"]).collection("meetup_requests")
        received_meetups = received_meetups_ref.where("destination", "==", destination).stream()
        
        received_meetups_data = []
        for meetup in received_meetups:
            meetup_dict = meetup.to_dict()
            meetup_dict["id"] = meetup.id
            meetup_dict["type"] = "received"
            received_meetups_data.append(meetup_dict)
        
        # Combine all meetup requests
        meetups_data = sent_meetups_data + received_meetups_data
        
        logger.info(f"Found {len(sent_meetups_data)} sent requests and {len(received_meetups_data)} received requests for destination {destination}")
        logger.info(f"Total meetup requests: {len(meetups_data)}")
        
        # Get AI suggestions for common activities
        ai_suggestions = await get_ai_activity_suggestions(destination, similar_travelers)
        
        return {
            "destination": destination,
            "similar_travelers": similar_travelers[:5],  # Limit to 5
            "incoming_requests": received_meetups_data[:5],  # Requests sent TO you
            "outgoing_requests": sent_meetups_data[:5],  # Requests sent BY you
            "ai_suggestions": ai_suggestions,
            "social_activity": {
                "total_travelers": len(similar_travelers),
                "active_meetups": len(meetups_data),
                "popular_activities": ["City tour", "Food experience", "Photography walk"]
            },
            "status": "success"
        }
        
    except Exception as e:
        logger.error(f"Chat social info error: {e}")
        raise HTTPException(status_code=500, detail="Error getting social information")

async def get_ai_activity_suggestions(destination: str, travelers: list):
    """Get AI-powered activity suggestions based on travelers' interests and locations"""
    try:
        if not travelers:
            return {
                "common_interests": [],
                "suggested_activities": [],
                "meeting_points": [],
                "transport_options": []
            }
        
        # Analyze common interests
        all_interests = []
        for traveler in travelers:
            all_interests.extend(traveler.get("interests", []))
        
        # Count interest frequency
        interest_counts = {}
        for interest in all_interests:
            interest_counts[interest] = interest_counts.get(interest, 0) + 1
        
        # Get most common interests
        common_interests = sorted(interest_counts.items(), key=lambda x: x[1], reverse=True)[:3]
        
        # Generate AI suggestions
        suggestions_prompt = f"""
        Based on these travelers going to {destination}:
        {', '.join([f"{t['name']} (interests: {', '.join(t.get('interests', []))})" for t in travelers[:3]])}
        
        Common interests: {', '.join([interest for interest, count in common_interests])}
        
        Suggest:
        1. 3-5 activities that would appeal to this group
        2. 2-3 good meeting points in {destination}
        3. Transport options for getting around
        4. Best times to meet based on their travel dates
        
        Keep suggestions practical and specific to {destination}.
        """
        
        try:
            import google.genai as genai
            client = genai.Client(api_key="AIzaSyASIcEqnPUmriBRrlZlDqX9wWnLEoaV9jI")
            response = client.models.generate_content(
                model="gemini-2.5-flash",
                contents=suggestions_prompt
            )
            ai_response = response.text if hasattr(response, 'text') else "AI suggestions temporarily unavailable."
        except Exception as ai_error:
            logger.error(f"AI suggestions error: {ai_error}")
            ai_response = "AI suggestions temporarily unavailable."
        
        return {
            "common_interests": [interest for interest, count in common_interests],
            "ai_suggestions": ai_response,
            "suggested_activities": [
                "City walking tour",
                "Local food experience", 
                "Photography walk",
                "Cultural site visit",
                "Shopping district exploration"
            ],
            "meeting_points": [
                "Central train station",
                "Main square",
                "Popular landmark"
            ],
            "transport_options": [
                "Public transport",
                "Walking",
                "Ride-sharing"
            ]
        }
        
    except Exception as e:
        logger.error(f"AI activity suggestions error: {e}")
        return {
            "common_interests": [],
            "suggested_activities": [],
            "meeting_points": [],
            "transport_options": []
        }

async def get_accepted_meetup_ai_suggestions(destination: str, user1_data: dict, user2_data: dict, activity: str = None):
    """Get AI-powered suggestions for accepted meetups with personalized recommendations"""
    try:
        # Extract user preferences
        user1_interests = user1_data.get("interests", [])
        user1_travel_style = user1_data.get("travel_style", "cultural")
        user1_name = user1_data.get("name", "User 1")
        
        user2_interests = user2_data.get("interests", [])
        user2_travel_style = user2_data.get("travel_style", "cultural")
        user2_name = user2_data.get("name", "User 2")
        
        # Find common interests
        common_interests = list(set(user1_interests) & set(user2_interests))
        
        # Generate comprehensive AI suggestions
        suggestions_prompt = f"""
        Create personalized meetup suggestions for two travelers in {destination}:
        
        Traveler 1: {user1_name}
        - Interests: {', '.join(user1_interests) if user1_interests else 'General travel'}
        - Travel Style: {user1_travel_style}
        
        Traveler 2: {user2_name}
        - Interests: {', '.join(user2_interests) if user2_interests else 'General travel'}
        - Travel Style: {user2_travel_style}
        
        Common Interests: {', '.join(common_interests) if common_interests else 'None specific'}
        Activity Focus: {activity if activity else 'General exploration'}
        
        Please provide:
        1. 5-7 specific activities that combine both travelers' interests
        2. 3-4 practical meeting points in {destination}
        3. Transport options considering both travelers' preferences
        4. Suggested itinerary for a day together
        5. Backup activities for different weather conditions
        6. Local tips and recommendations
        
        Format as structured suggestions with clear categories.
        """
        
        try:
            import google.genai as genai
            client = genai.Client(api_key="AIzaSyASIcEqnPUmriBRrlZlDqX9wWnLEoaV9jI")
            response = client.models.generate_content(
                model="gemini-2.5-flash",
                contents=suggestions_prompt
            )
            ai_response = response.text if hasattr(response, 'text') else "AI suggestions temporarily unavailable."
        except Exception as ai_error:
            logger.error(f"AI meetup suggestions error: {ai_error}")
            ai_response = "AI suggestions temporarily unavailable."
        
        # Parse AI response to extract structured data
        suggested_activities = []
        meeting_points = []
        transport_options = []
        
        # Try to extract structured data from AI response
        if "activities" in ai_response.lower():
            # Extract activities from AI response
            lines = ai_response.split('\n')
            for line in lines:
                if any(keyword in line.lower() for keyword in ['activity', 'visit', 'explore', 'tour', 'experience']):
                    if line.strip() and not line.startswith('#') and len(line.strip()) > 10:
                        suggested_activities.append(line.strip().replace('- ', '').replace('• ', ''))
        
        # Fallback to default suggestions if AI parsing fails
        if not suggested_activities:
            suggested_activities = [
                f"Explore {destination} together",
                "Local food experience",
                "Photography walk",
                "Cultural site visit",
                "Shopping district exploration"
            ]
        
        if not meeting_points:
            meeting_points = [
                "Central train station",
                "Main square",
                "Popular landmark"
            ]
        
        if not transport_options:
            transport_options = [
                "Public transport",
                "Walking",
                "Ride-sharing"
            ]
        
        return {
            "common_interests": common_interests,
            "ai_suggestions": ai_response,
            "suggested_activities": suggested_activities[:7],  # Limit to 7 activities
            "meeting_points": meeting_points[:4],  # Limit to 4 meeting points
            "transport_options": transport_options,
            "user1_preferences": {
                "name": user1_name,
                "interests": user1_interests,
                "travel_style": user1_travel_style
            },
            "user2_preferences": {
                "name": user2_name,
                "interests": user2_interests,
                "travel_style": user2_travel_style
            }
        }
        
    except Exception as e:
        logger.error(f"Accepted meetup AI suggestions error: {e}")
        return {
            "common_interests": [],
            "ai_suggestions": "AI suggestions temporarily unavailable.",
            "suggested_activities": [],
            "meeting_points": [],
            "transport_options": [],
            "user1_preferences": {},
            "user2_preferences": {}
        }

@app.post("/meetup-request")
async def create_meetup_request(request: MeetupRequest, user: dict = Depends(get_current_user)):
    """Create a meetup request"""
    try:
        meetup_data = request.dict()
        meetup_data["requester_id"] = user["uid"]
        meetup_data["requester_name"] = user.get("name", "Unknown")
        meetup_data["status"] = "pending"
        meetup_data["created_at"] = str(asyncio.get_event_loop().time())
        
        # If target_traveler_id is provided, get the traveler's name
        if meetup_data.get("target_traveler_id"):
            try:
                target_user_doc = db.collection("users").document(meetup_data["target_traveler_id"]).get()
                if target_user_doc.exists:
                    meetup_data["target_traveler_name"] = target_user_doc.to_dict().get("name", "Unknown")
            except Exception as e:
                logger.info(f"Could not fetch target traveler name: {e}")
                meetup_data["target_traveler_name"] = "Unknown"
        
        # Store in both collections for proper tracking
        doc_ref = db.collection("meetups").add(meetup_data)
        meetup_id = doc_ref[1].id
        
        # Also store in user's collection for easy access
        user_meetup_ref = db.collection("users").document(user["uid"]).collection("sent_meetup_requests").document(meetup_id)
        user_meetup_ref.set(meetup_data)
        
        # Store in target user's meetup_requests collection if target_traveler_id is provided
        if meetup_data.get("target_traveler_id"):
            target_meetup_ref = db.collection("users").document(meetup_data["target_traveler_id"]).collection("meetup_requests").document(meetup_id)
            target_meetup_ref.set(meetup_data)
        
        return {
            "meetup_id": meetup_id,
            "message": "Meetup request created successfully",
            "status": "success"
        }
    except Exception as e:
        logger.error(f"Create meetup error: {e}")
        raise HTTPException(status_code=500, detail="Error creating meetup request")

@app.post("/meetup-request/{request_id}/accept")
async def accept_meetup_request(request_id: str, user: dict = Depends(get_current_user)):
    """Accept a meetup request"""
    try:
        # Find the meetup request
        meetup_ref = db.collection("users").document(user["uid"]).collection("meetup_requests").document(request_id)
        meetup_doc = meetup_ref.get()
        
        if not meetup_doc.exists:
            raise HTTPException(status_code=404, detail="Meetup request not found")
        
        meetup_data = meetup_doc.to_dict()
        
        # Update status to accepted in user's collection
        meetup_ref.update({
            "status": "accepted",
            "accepted_by": user["uid"],
            "accepted_at": datetime.now().isoformat()
        })
        
        # Also update in global meetups collection
        global_meetup_ref = db.collection("meetups").document(request_id)
        global_meetup_ref.update({
            "status": "accepted",
            "accepted_by": user["uid"],
            "accepted_at": datetime.now().isoformat()
        })
        
        # Also update in requester's sent_meetup_requests collection
        requester_meetup_ref = db.collection("users").document(meetup_data["requester_id"]).collection("sent_meetup_requests").document(request_id)
        requester_meetup_ref.update({
            "status": "accepted",
            "accepted_by": user["uid"],
            "accepted_at": datetime.now().isoformat()
        })
        
        # Create a chat session for the accepted meetup
        chat_session_data = {
            "meetup_id": request_id,
            "participants": [meetup_data["requester_id"], user["uid"]],
            "destination": meetup_data["destination"],
            "activity": meetup_data["activity"],
            "created_at": datetime.now().isoformat(),
            "status": "active"
        }
        
        chat_session_ref = db.collection("meetup_chats").add(chat_session_data)
        chat_session_id = chat_session_ref[1].id
        
        return {
            "message": "Meetup request accepted successfully",
            "chat_session_id": chat_session_id,
            "status": "success"
        }
        
    except Exception as e:
        logger.error(f"Accept meetup request error: {e}")
        raise HTTPException(status_code=500, detail="Error accepting meetup request")

@app.post("/meetup-request/{request_id}/reject")
async def reject_meetup_request(request_id: str, user: dict = Depends(get_current_user)):
    """Reject a meetup request"""
    try:
        # Find the meetup request
        meetup_ref = db.collection("users").document(user["uid"]).collection("meetup_requests").document(request_id)
        meetup_doc = meetup_ref.get()
        
        if not meetup_doc.exists:
            raise HTTPException(status_code=404, detail="Meetup request not found")
        
        meetup_data = meetup_doc.to_dict()
        
        # Update status to rejected in user's collection
        meetup_ref.update({
            "status": "rejected",
            "rejected_by": user["uid"],
            "rejected_at": datetime.now().isoformat()
        })
        
        # Also update in global meetups collection
        global_meetup_ref = db.collection("meetups").document(request_id)
        global_meetup_ref.update({
            "status": "rejected",
            "rejected_by": user["uid"],
            "rejected_at": datetime.now().isoformat()
        })
        
        # Also update in requester's sent_meetup_requests collection
        requester_meetup_ref = db.collection("users").document(meetup_data["requester_id"]).collection("sent_meetup_requests").document(request_id)
        requester_meetup_ref.update({
            "status": "rejected",
            "rejected_by": user["uid"],
            "rejected_at": datetime.now().isoformat()
        })
        
        return {
            "message": "Meetup request rejected",
            "status": "success"
        }
        
    except Exception as e:
        logger.error(f"Reject meetup request error: {e}")
        raise HTTPException(status_code=500, detail="Error rejecting meetup request")

@app.post("/meetup-request/{request_id}/cancel")
async def cancel_meetup_request(request_id: str, user: dict = Depends(get_current_user)):
    """Cancel a meetup request"""
    try:
        # Find the meetup request
        meetup_ref = db.collection("users").document(user["uid"]).collection("meetup_requests").document(request_id)
        meetup_doc = meetup_ref.get()
        
        if not meetup_doc.exists:
            raise HTTPException(status_code=404, detail="Meetup request not found")
        
        meetup_data = meetup_doc.to_dict()
        
        # Only allow cancellation if request is pending
        if meetup_data.get("status") != "pending":
            raise HTTPException(status_code=400, detail="Can only cancel pending requests")
        
        # Update status to cancelled in both collections
        meetup_ref.update({
            "status": "cancelled",
            "cancelled_at": datetime.now().isoformat()
        })
        
        # Also update in user's sent requests collection
        user_meetup_ref = db.collection("users").document(user["uid"]).collection("sent_meetup_requests").document(request_id)
        user_meetup_ref.update({
            "status": "cancelled",
            "cancelled_at": datetime.now().isoformat()
        })
        
        return {
            "message": "Meetup request cancelled successfully",
            "status": "success"
        }
        
    except Exception as e:
        logger.error(f"Cancel meetup request error: {e}")
        raise HTTPException(status_code=500, detail="Error cancelling meetup request")

@app.get("/meetup-chat/{chat_session_id}")
async def get_meetup_chat(chat_session_id: str, user: dict = Depends(get_current_user)):
    """Get meetup chat session"""
    try:
        chat_ref = db.collection("meetup_chats").document(chat_session_id)
        chat_doc = chat_ref.get()
        
        if not chat_doc.exists:
            raise HTTPException(status_code=404, detail="Chat session not found")
        
        chat_data = chat_doc.to_dict()
        
        # Check if user is a participant
        if user["uid"] not in chat_data.get("participants", []):
            raise HTTPException(status_code=403, detail="Not authorized to access this chat")
        
        # Get AI suggestions for the meetup
        destination = chat_data.get("destination", "")
        activity = chat_data.get("activity", "")
        
        ai_suggestions = await get_meetup_ai_suggestions(destination, activity)
        
        return {
            "chat_session": chat_data,
            "ai_suggestions": ai_suggestions,
            "status": "success"
        }
        
    except Exception as e:
        logger.error(f"Get meetup chat error: {e}")
        raise HTTPException(status_code=500, detail="Error getting meetup chat")

@app.get("/accepted-meetup-suggestions/{meetup_id}")
async def get_accepted_meetup_suggestions(meetup_id: str, user: dict = Depends(get_current_user)):
    """Get AI suggestions for accepted meetup requests"""
    try:
        # Get the meetup request details
        meetup_ref = db.collection("meetups").document(meetup_id)
        meetup_doc = meetup_ref.get()
        
        if not meetup_doc.exists:
            raise HTTPException(status_code=404, detail="Meetup request not found")
        
        meetup_data = meetup_doc.to_dict()
        
        # Check if the meetup is accepted
        if meetup_data.get("status") != "accepted":
            raise HTTPException(status_code=400, detail="Meetup request is not accepted yet")
        
        # Get both users' data
        requester_id = meetup_data.get("requester_id")
        accepter_id = meetup_data.get("accepted_by")
        
        if not requester_id or not accepter_id:
            raise HTTPException(status_code=400, detail="Invalid meetup request data")
        
        # Get requester's data
        requester_doc = db.collection("users").document(requester_id).get()
        if not requester_doc.exists:
            raise HTTPException(status_code=404, detail="Requester not found")
        requester_data = requester_doc.to_dict()
        
        # Get accepter's data
        accepter_doc = db.collection("users").document(accepter_id).get()
        if not accepter_doc.exists:
            raise HTTPException(status_code=404, detail="Accepter not found")
        accepter_data = accepter_doc.to_dict()
        
        # Get AI suggestions
        destination = meetup_data.get("destination", "")
        activity = meetup_data.get("activity", "")
        
        suggestions = await get_accepted_meetup_ai_suggestions(
            destination, 
            requester_data, 
            accepter_data, 
            activity
        )
        
        return {
            "meetup_id": meetup_id,
            "destination": destination,
            "activity": activity,
            "suggestions": suggestions,
            "status": "success"
        }
        
    except Exception as e:
        logger.error(f"Get accepted meetup suggestions error: {e}")
        raise HTTPException(status_code=500, detail="Error getting meetup suggestions")

async def get_meetup_ai_suggestions(destination: str, activity: str):
    """Get AI suggestions for meetup activities"""
    try:
        suggestions_prompt = f"""
        For a meetup in {destination} with activity: {activity}
        
        Provide:
        1. Specific meeting points in {destination}
        2. Best times to meet
        3. Transport options between locations
        4. Backup plans if weather is bad
        5. Local tips and recommendations
        
        Keep suggestions practical and specific to {destination}.
        """
        
        try:
            import google.genai as genai
            client = genai.Client(api_key="AIzaSyASIcEqnPUmriBRrlZlDqX9wWnLEoaV9jI")
            response = client.models.generate_content(
                model="gemini-2.5-flash",
                contents=suggestions_prompt
            )
            ai_response = response.text if hasattr(response, 'text') else "AI suggestions temporarily unavailable."
        except Exception as ai_error:
            logger.error(f"AI meetup suggestions error: {ai_error}")
            ai_response = "AI suggestions temporarily unavailable."
        
        return {
            "ai_suggestions": ai_response,
            "meeting_points": [
                "Central train station",
                "Main square",
                "Popular landmark"
            ],
            "transport_options": [
                "Public transport",
                "Walking",
                "Ride-sharing"
            ],
            "backup_activities": [
                "Indoor museum visit",
                "Shopping center",
                "Local cafe"
            ]
        }
        
    except Exception as e:
        logger.error(f"Meetup AI suggestions error: {e}")
        return {
            "ai_suggestions": "AI suggestions temporarily unavailable.",
            "meeting_points": [],
            "transport_options": [],
            "backup_activities": []
        }

# Phase 7: Bidirectional Ratings Endpoints
@app.post("/reviews")
async def create_review(review: ReviewRequest, user: dict = Depends(get_current_user)):
    """Create a review for hotels, restaurants, or activities"""
    try:
        review_data = review.dict()
        review_data["reviewer_id"] = user["uid"]
        review_data["created_at"] = str(asyncio.get_event_loop().time())
        
        doc_ref = db.collection("reviews").add(review_data)
        review_id = doc_ref[1].id
        
        return {
            "review_id": review_id,
            "message": "Review created successfully",
            "status": "success"
        }
    except Exception as e:
        logger.error(f"Create review error: {e}")
        raise HTTPException(status_code=500, detail="Error creating review")

@app.post("/hotel-reviews")
async def create_hotel_review(review: HotelReviewRequest, user: dict = Depends(get_current_user)):
    """Create a detailed hotel review"""
    try:
        review_data = review.dict()
        review_data["reviewer_id"] = user["uid"]
        review_data["created_at"] = str(asyncio.get_event_loop().time())
        
        # Calculate overall rating
        overall_rating = (review.cleanliness + review.service + review.location + review.value + review.amenities) / 5
        review_data["overall_rating"] = overall_rating
        
        doc_ref = db.collection("hotel_reviews").add(review_data)
        review_id = doc_ref[1].id
        
        # Update hotel aggregate ratings
        await update_hotel_ratings(review.hotel_id)
        
        return {
            "review_id": review_id,
            "overall_rating": overall_rating,
            "message": "Hotel review created successfully",
            "status": "success"
        }
    except Exception as e:
        logger.error(f"Create hotel review error: {e}")
        raise HTTPException(status_code=500, detail="Error creating hotel review")

@app.get("/hotel-ratings/{hotel_id}")
async def get_hotel_ratings(hotel_id: str):
    """Get aggregated hotel ratings and reviews"""
    try:
        # Get all reviews for this hotel
        reviews_ref = db.collection("hotel_reviews")
        reviews = reviews_ref.where("hotel_id", "==", hotel_id).stream()
        
        reviews_list = []
        total_cleanliness = 0
        total_service = 0
        total_location = 0
        total_value = 0
        total_amenities = 0
        total_overall = 0
        review_count = 0
        
        for review in reviews:
            review_data = review.to_dict()
            reviews_list.append(review_data)
            
            total_cleanliness += review_data.get("cleanliness", 0)
            total_service += review_data.get("service", 0)
            total_location += review_data.get("location", 0)
            total_value += review_data.get("value", 0)
            total_amenities += review_data.get("amenities", 0)
            total_overall += review_data.get("overall_rating", 0)
            review_count += 1
        
        if review_count == 0:
            return {
                "hotel_id": hotel_id,
                "message": "No reviews found for this hotel",
                "status": "not_found"
            }
        
        # Calculate averages
        avg_cleanliness = total_cleanliness / review_count
        avg_service = total_service / review_count
        avg_location = total_location / review_count
        avg_value = total_value / review_count
        avg_amenities = total_amenities / review_count
        avg_overall = total_overall / review_count
        
        # Get recent reviews (last 5)
        recent_reviews = sorted(reviews_list, key=lambda x: x.get("created_at", ""), reverse=True)[:5]
        
        return {
            "hotel_id": hotel_id,
            "overall_rating": round(avg_overall, 1),
            "cleanliness": round(avg_cleanliness, 1),
            "service": round(avg_service, 1),
            "location": round(avg_location, 1),
            "value": round(avg_value, 1),
            "amenities": round(avg_amenities, 1),
            "total_reviews": review_count,
            "recent_reviews": recent_reviews,
            "status": "success"
        }
    except Exception as e:
        logger.error(f"Get hotel ratings error: {e}")
        raise HTTPException(status_code=500, detail="Error getting hotel ratings")

async def update_hotel_ratings(hotel_id: str):
    """Update aggregate hotel ratings in the database"""
    try:
        # This would typically update a separate collection with aggregate ratings
        # For now, we'll just log that we're updating
        logger.info(f"Updating aggregate ratings for hotel {hotel_id}")
    except Exception as e:
        logger.error(f"Error updating hotel ratings: {e}")

@app.post("/hotel-rate-customer")
async def hotel_rate_customer(rating: HotelCustomerRatingRequest, user: dict = Depends(get_current_user)):
    """Allow hotels to rate customers (bidirectional rating system)"""
    try:
        # Verify user is a hotel partner
        user_profile = db.collection("users").document(user["uid"]).get()
        if not user_profile.exists:
            raise HTTPException(status_code=404, detail="User profile not found")
        
        user_data = user_profile.to_dict()
        if user_data.get("user_type") != "hotel":
            raise HTTPException(status_code=403, detail="Only hotel partners can rate customers")
        
        rating_data = rating.dict()
        rating_data["hotel_id"] = user["uid"]
        rating_data["hotel_name"] = user_data.get("hotel_name", "Unknown Hotel")
        rating_data["created_at"] = str(asyncio.get_event_loop().time())
        
        # Calculate overall rating
        overall_rating = (rating.punctuality + rating.communication + rating.cleanliness + 
                        rating.respectfulness + rating.payment_behavior) / 5
        rating_data["overall_rating"] = overall_rating
        
        # Store the rating
        doc_ref = db.collection("hotel_customer_ratings").add(rating_data)
        rating_id = doc_ref[1].id
        
        # Update customer's trust score
        await update_customer_trust_score(rating.customer_id, overall_rating)
        
        return {
            "rating_id": rating_id,
            "message": "Customer rating submitted successfully",
            "overall_rating": overall_rating,
            "status": "success"
        }
    except Exception as e:
        logger.error(f"Hotel rate customer error: {e}")
        raise HTTPException(status_code=500, detail="Error rating customer")

async def update_customer_trust_score(customer_id: str, new_rating: float):
    """Update customer's trust score based on hotel rating"""
    try:
        # Get existing trust score
        trust_doc = db.collection("user_trust_scores").document(customer_id).get()
        
        if trust_doc.exists:
            trust_data = trust_doc.to_dict()
            current_score = trust_data.get("trust_score", 0.5)
            rating_count = trust_data.get("rating_count", 0)
            
            # Calculate new weighted average
            new_score = ((current_score * rating_count) + new_rating) / (rating_count + 1)
            
            # Update trust score
            db.collection("user_trust_scores").document(customer_id).set({
                "trust_score": new_score,
                "rating_count": rating_count + 1,
                "last_updated": str(asyncio.get_event_loop().time()),
                "hotel_ratings": trust_data.get("hotel_ratings", []) + [new_rating]
            })
        else:
            # Create new trust score
            db.collection("user_trust_scores").document(customer_id).set({
                "trust_score": new_rating,
                "rating_count": 1,
                "last_updated": str(asyncio.get_event_loop().time()),
                "hotel_ratings": [new_rating]
            })
    except Exception as e:
        logger.error(f"Error updating customer trust score: {e}")

@app.get("/trust-score/{user_id}")
async def get_trust_score(user_id: str, user: dict = Depends(get_current_user)):
    """Get AI-generated trust/credibility score for a user"""
    try:
        trust_score = await calculate_trust_score(user_id)
        
        return {
            "trust_score": trust_score,
            "status": "success"
        }
    except Exception as e:
        logger.error(f"Get trust score error: {e}")
        raise HTTPException(status_code=500, detail="Error getting trust score")

# Phase 5: Post-Trip & Loyalty Endpoints
@app.get("/trip-analytics/{trip_id}")
async def get_trip_analytics(trip_id: str, user: dict = Depends(get_current_user)):
    """Get AI-powered post-trip insights and analytics"""
    try:
        # Get trip data
        trip_doc = db.collection("users").document(user["uid"]).collection("trips").document(trip_id).get()
        if not trip_doc.exists:
            raise HTTPException(status_code=404, detail="Trip not found")
        
        trip_data = trip_doc.to_dict()
        
        # Get expenses for this trip
        expenses_ref = db.collection("users").document(user["uid"]).collection("expenses").where("trip_id", "==", trip_id).stream()
        expenses = []
        total_spent = 0
        for expense in expenses_ref:
            expense_data = expense.to_dict()
            expenses.append(expense_data)
            total_spent += expense_data.get("amount", 0)
        
        # Generate expense breakdown first
        expense_breakdown = {
            "accommodation": sum(e.get("amount", 0) for e in expenses if e.get("category") == "accommodation"),
            "food": sum(e.get("amount", 0) for e in expenses if e.get("category") == "food"),
            "activities": sum(e.get("amount", 0) for e in expenses if e.get("category") == "activities"),
            "transport": sum(e.get("amount", 0) for e in expenses if e.get("category") == "transport")
        }
        
        # Find the category with highest spending
        highest_category = max(expense_breakdown, key=expense_breakdown.get) if expense_breakdown else "none"
        
        # Generate analytics
        analytics = {
            "trip_id": trip_id,
            "destination": trip_data.get("destination"),
            "total_spent": total_spent,
            "expense_breakdown": expense_breakdown,
            "insights": [
                f"You spent most on {highest_category}",
                "Consider booking accommodations in advance for better rates next time",
                "Your food expenses were within the expected range for this destination"
            ],
            "badges_earned": [
                "Explorer Badge",
                "Foodie Badge", 
                "Budget Master Badge"
            ]
        }
        
        return {
            "analytics": analytics,
            "status": "success"
        }
    except Exception as e:
        logger.error(f"Get trip analytics error: {e}")
        raise HTTPException(status_code=500, detail="Error getting trip analytics")

@app.get("/hotel-profile")
async def get_hotel_profile(user: dict = Depends(get_current_user)):
    """Get hotel profile information"""
    try:
        user_doc = db.collection("users").document(user["uid"]).get()
        if user_doc.exists:
            return user_doc.to_dict()
        return {"message": "Hotel profile not found"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/hotel-customers")
async def get_hotel_customers(user: dict = Depends(get_current_user)):
    """Get hotel customers list"""
    try:
        # This would typically fetch customers from hotel bookings
        # For now, return sample data
        return {
            "customers": [
                {
                    "id": "customer_1",
                    "name": "John Doe",
                    "email": "john@example.com",
                    "booking_id": "BK001",
                    "check_in": "2024-01-15",
                    "check_out": "2024-01-18",
                    "rated": False
                }
            ]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/analytics")
async def get_analytics(user: dict = Depends(get_current_user)):
    """Get general analytics data"""
    try:
        # Get user's trips for analytics
        trips_ref = db.collection("users").document(user["uid"]).collection("trips")
        trips = trips_ref.stream()
        
        trip_count = 0
        total_budget = 0
        
        for trip in trips:
            trip_data = trip.to_dict()
            trip_count += 1
            total_budget += trip_data.get("budget", 0)
        
        return {
            "total_trips": trip_count,
            "total_budget": total_budget,
            "average_budget": total_budget / trip_count if trip_count > 0 else 0
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Trip management endpoints
@app.post("/trips")
async def create_trip(trip: TripRequest, user: dict = Depends(get_current_user)):
    """Create a new trip"""
    try:
        trip_data = trip.dict()
        trip_data["user_id"] = user["uid"]
        trip_data["created_at"] = str(asyncio.get_event_loop().time())
        
        doc_ref = db.collection("users").document(user["uid"]).collection("trips").add(trip_data)
        trip_id = doc_ref[1].id
        
        return {"trip_id": trip_id, "message": "Trip created successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/trips")
async def get_trips(user: dict = Depends(get_current_user)):
    """Get all trips for the user"""
    try:
        trips_ref = db.collection("users").document(user["uid"]).collection("trips").stream()
        trips = []
        for trip in trips_ref:
            trip_data = trip.to_dict()
            trip_data["id"] = trip.id
            trips.append(trip_data)
        return {"trips": trips}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/trips/{trip_id}")
async def get_trip(trip_id: str, user: dict = Depends(get_current_user)):
    """Get a specific trip"""
    try:
        trip_doc = db.collection("users").document(user["uid"]).collection("trips").document(trip_id).get()
        if not trip_doc.exists:
            raise HTTPException(status_code=404, detail="Trip not found")
        
        trip_data = trip_doc.to_dict()
        trip_data["id"] = trip_doc.id
        return trip_data
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.put("/trips/{trip_id}")
async def update_trip(trip_id: str, trip: TripRequest, user: dict = Depends(get_current_user)):
    """Update a trip"""
    try:
        trip_data = trip.dict()
        trip_data["updated_at"] = str(asyncio.get_event_loop().time())
        
        doc_ref = db.collection("users").document(user["uid"]).collection("trips").document(trip_id)
        if not doc_ref.get().exists:
            raise HTTPException(status_code=404, detail="Trip not found")
        
        doc_ref.update(trip_data)
        return {"message": "Trip updated successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/trips/{trip_id}")
async def delete_trip(trip_id: str, user: dict = Depends(get_current_user)):
    """Delete a trip"""
    try:
        doc_ref = db.collection("users").document(user["uid"]).collection("trips").document(trip_id)
        if not doc_ref.get().exists:
            raise HTTPException(status_code=404, detail="Trip not found")
        
        doc_ref.delete()
        return {"message": "Trip deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Places and recommendations endpoints
@app.get("/places/{location}")
async def get_places(location: str, query_type: str = "attractions"):
    """Get places for a location"""
    try:
        places = await search_places(location, query_type or "attractions")
        return {"places": places}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/weather/{latitude}/{longitude}")
async def get_weather_data(latitude: float, longitude: float):
    """Get weather data for coordinates"""
    try:
        weather = await get_weather(latitude, longitude)
        return {"weather": weather}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

async def save_chat_message(user_id: str, session_id: str, message: str, response: str, role: str = "user"):
    """Save a chat message to history"""
    try:
        logger.info(f"save_chat_message called: user_id={user_id}, session_id={session_id}, message_length={len(message)}, response_length={len(response)}")
        chat_ref = db.collection("chat_history").document(session_id)
        chat_doc = chat_ref.get()
        
        if chat_doc.exists:
            # Update existing session
            chat_data = chat_doc.to_dict()
            messages = chat_data.get("messages", [])
            
            # Add new message
            messages.append({
                "role": role,
                "content": message,
                "timestamp": datetime.now().isoformat()
            })
            
            # Add AI response if provided
            if response:
                messages.append({
                    "role": "assistant",
                    "content": response,
                    "timestamp": datetime.now().isoformat()
                })
            
            chat_ref.update({
                "messages": messages,
                "updated_at": datetime.now().isoformat()
            })
        else:
            # Create new session
            messages = [{
                "role": role,
                "content": message,
                "timestamp": datetime.now().isoformat()
            }]
            
            if response:
                messages.append({
                    "role": "assistant",
                    "content": response,
                    "timestamp": datetime.now().isoformat()
                })
            
            chat_ref.set({
                "user_id": user_id,
                "session_id": session_id,
                "messages": messages,
                "created_at": datetime.now().isoformat(),
                "updated_at": datetime.now().isoformat()
            })
            
        logger.info(f"Saved chat message for session {session_id}")
        
    except Exception as e:
        logger.error(f"Error saving chat message: {e}")

async def get_chat_history(session_id: str, limit: int = 20):
    """Get chat history for a session"""
    try:
        chat_ref = db.collection("chat_history").document(session_id)
        chat_doc = chat_ref.get()
        
        if chat_doc.exists:
            chat_data = chat_doc.to_dict()
            messages = chat_data.get("messages", [])
            
            # Return last N messages
            return messages[-limit:] if len(messages) > limit else messages
        else:
            return []
            
    except Exception as e:
        logger.error(f"Error getting chat history: {e}")
        return []

async def get_user_chat_sessions(user_id: str):
    """Get all chat sessions for a user"""
    try:
        sessions_ref = db.collection("chat_history")
        sessions = sessions_ref.where("user_id", "==", user_id).order_by("updated_at", direction=firestore.Query.DESCENDING).stream()
        
        sessions_list = []
        for session in sessions:
            session_data = session.to_dict()
            session_data["id"] = session.id
            sessions_list.append(session_data)
            
        return sessions_list
        
    except Exception as e:
        logger.error(f"Error getting user chat sessions: {e}")
        return []

async def get_transportation_suggestions(source: str, destination: str, budget: str, start_date: str, end_date: str, currency: str = "USD"):
    """Get AI-powered transportation suggestions based on source, destination, budget, and dates"""
    try:
        # This would integrate with real transportation APIs
        # For now, return intelligent suggestions based on parameters
        
        budget_multiplier = {
            "budget": 0.5,
            "mid-range": 1.0,
            "luxury": 2.0
        }.get(budget, 1.0)
        
        # Mock transportation options with realistic pricing
        options = []
        
        # Flight options
        if budget != "budget":
            flight_price = int(500 * budget_multiplier)
            options.append({
                "type": "flight",
                "name": f"Flight from {source} to {destination}",
                "price": flight_price,
                "currency": currency,
                "duration": "2-4 hours",
                "comfort": "high",
                "recommendation": "Best for long distances and time efficiency"
            })
        
        # Train options
        train_price = int(150 * budget_multiplier)
        options.append({
            "type": "train",
            "name": f"Train from {source} to {destination}",
            "price": train_price,
            "currency": currency,
            "duration": "4-8 hours",
            "comfort": "medium",
            "recommendation": "Eco-friendly and scenic option"
        })
        
        # Bus options
        bus_price = int(50 * budget_multiplier)
        options.append({
            "type": "bus",
            "name": f"Bus from {source} to {destination}",
            "price": bus_price,
            "currency": currency,
            "duration": "6-12 hours",
            "comfort": "basic",
            "recommendation": "Most budget-friendly option"
        })
        
        # Car rental (if budget allows)
        if budget in ["mid-range", "luxury"]:
            car_price = int(200 * budget_multiplier)
            options.append({
                "type": "car_rental",
                "name": f"Car rental from {source} to {destination}",
                "price": car_price,
                "currency": currency,
                "duration": "3-6 hours",
                "comfort": "high",
                "recommendation": "Maximum flexibility and comfort"
            })
        
        # AI recommendation
        best_option = min(options, key=lambda x: x["price"])
        
        return {
            "source": source,
            "destination": destination,
            "start_date": start_date,
            "end_date": end_date,
            "budget": budget,
            "currency": currency,
            "options": options,
            "ai_recommendation": {
                "best_overall": best_option,
                "reasoning": f"Based on your {budget} budget and travel dates, this option offers the best value",
                "alternative": options[1] if len(options) > 1 else None
            },
            "total_estimated_cost": sum(opt["price"] for opt in options[:2])  # Top 2 options
        }
    except Exception as e:
        logger.error(f"Error getting transportation suggestions: {e}")
        return None

async def get_meeting_point_suggestion(traveler1_location: str, traveler1_transport: str, traveler2_location: str, traveler2_transport: str, destination: str):
    """AI-powered suggestion for common meeting points when travelers have different transportation"""
    try:
        # AI logic to find optimal meeting points
        meeting_points = []
        
        # If both are using different transport, find common accessible points
        if traveler1_transport != traveler2_transport:
            # Find transportation hubs that both can access
            if "train" in [traveler1_transport, traveler2_transport]:
                meeting_points.append({
                    "name": f"{destination} Central Station",
                    "type": "transportation_hub",
                    "accessibility": "high",
                    "reasoning": "Both train and bus routes connect here",
                    "estimated_time": "30-45 minutes from both locations"
                })
            
            if "bus" in [traveler1_transport, traveler2_transport]:
                meeting_points.append({
                    "name": f"{destination} Bus Terminal",
                    "type": "transportation_hub", 
                    "accessibility": "high",
                    "reasoning": "Central bus terminal with multiple connections",
                    "estimated_time": "20-35 minutes from both locations"
                })
        
        # Popular landmarks as meeting points
        meeting_points.extend([
            {
                "name": f"{destination} City Center",
                "type": "landmark",
                "accessibility": "high",
                "reasoning": "Central location with good public transport access",
                "estimated_time": "15-30 minutes from both locations"
            },
            {
                "name": f"{destination} Airport",
                "type": "transportation_hub",
                "accessibility": "medium",
                "reasoning": "If one traveler is flying, airport is convenient",
                "estimated_time": "45-60 minutes from city center"
            }
        ])
        
        # AI recommendation
        best_meeting_point = meeting_points[0]  # First one is usually best
        
        return {
            "traveler1": {
                "location": traveler1_location,
                "transport": traveler1_transport
            },
            "traveler2": {
                "location": traveler2_location, 
                "transport": traveler2_transport
            },
            "destination": destination,
            "meeting_points": meeting_points,
            "ai_recommendation": {
                "best_meeting_point": best_meeting_point,
                "reasoning": f"Optimal meeting point considering {traveler1_transport} and {traveler2_transport} transportation",
                "backup_options": meeting_points[1:3] if len(meeting_points) > 1 else []
            },
            "coordination_tips": [
                "Share live location when approaching the meeting point",
                "Have a backup meeting time in case of delays",
                "Choose a landmark that's easy to find and describe"
            ]
        }
    except Exception as e:
        logger.error(f"Error getting meeting point suggestion: {e}")
        return None

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
