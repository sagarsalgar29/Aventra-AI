import os
import asyncio
import requests
from google import genai
from google.adk.agents import Agent
from google.adk.sessions import InMemorySessionService
from google.adk.runners import Runner
from google.genai import types # For creating message Content/Parts


import warnings
# Ignore all warnings
warnings.filterwarnings("ignore")

import logging
logging.basicConfig(level=logging.ERROR)

print("Libraries imported.")

# -------------------------------------------------------------------
# 1. SETUP KEYS  (store securely in env variables in production)
# -------------------------------------------------------------------
GEMINI_API_KEY = "AIzaSyASIcEqnPUmriBRrlZlDqX9wWnLEoaV9jI"      # <-- Replace
GOOGLE_API_KEY = "AIzaSyCT-ISk5rRd9rP6WLBBdFspUmUDNbRx9Xo"             # <-- Replace
MODEL_GEMINI_2_0_FLASH = "gemini-2.5-flash"


# -------------------------------------------------------------------
# 2. GOOGLE PLACES TOOL
# -------------------------------------------------------------------
client = genai.Client(api_key=GEMINI_API_KEY)

# -------------------------------------------------------------------
# 2. GOOGLE PLACES TOOL
# -------------------------------------------------------------------
def search_places(location: str):
    """
    Fetches data from Google Places API and filters useful fields.
    """
    url = "https://places.googleapis.com/v1/places:searchText"
    headers = {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": GOOGLE_API_KEY,
        "X-Goog-FieldMask": (
            "places.id"
            "places.displayName,"
            "places.formattedAddress,"
            "places.rating,"
            "places.userRatingCount,"
            "places.priceLevel"
        )
    }
    payload = {"textQuery": f"Best Places in {location}"}

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


# -------------------------------------


def distance_means_of_transport(user_query: str):

    response = client.models.generate_content(
    model="gemini-2.5-flash",
    contents=user_query,
)

    return response

# -------------------------------------------------------------------
# 3. GEMINI GENERATION
# -------------------------------------------------------------------
def generate_answer(location: str):
    """
    Sends a concise places list to Gemini and asks for a helpful summary.
    """
    hotels = search_places(location)

    if not hotels:
        return f"Sorry, I couldn't find any hotels in {location}."

    # Prepare a short, clean context
    context = "Here are some places and their details:\n"
    for h in hotels:
        context += (
            f"- {h['name']} | Rating: {h.get('rating','N/A')} "
            f"({h.get('reviews','0')} reviews) | "
            f"Address: {h.get('address','N/A')} | "
            f"Price Level: {h.get('price_level','N/A')}\n"
        )

    prompt = (
        f"User asked for best places in {location}. "
        f"Based on the following data, provide a concise recommendation:\n\n"
        f"{context}\n"
        "List the top options and add a short comment on each."
    )

    response = client.models.generate_content(
        model="gemini-2.5-flash",  # ✅ new model
        contents=prompt
    )
    return response.text





#agent example:
trip_planner = Agent(
    name="trip_planner_agent",
    model=MODEL_GEMINI_2_0_FLASH, # Can be a string for Gemini or a LiteLlm object
    description="Provides trip itinerary information for user.",
    instruction=
    "You are a helpful and knowledgeable trip planning assistant. "
    "When the user asks for the weather in a specific city, "
    "use the 'get_weather' tool to retrieve the information. "
    "When the user asks for hotels, restaurants, or points of interest, "
    "use the 'search_hotels' or 'search_places' tool to get relevant results. "
    "If any tool returns an error, inform the user politely. "
    "If the tool is successful, present the information clearly and concisely, "
    "highlighting key details like names, ratings, addresses, prices, or opening hours. "
    "Provide actionable travel suggestions when appropriate, and ensure your response is easy to read for the user.",
    tools   =[search_places, distance_means_of_transport], # Pass the function directly
)

print(f"Agent '{trip_planner.name}' created using model '{MODEL_GEMINI_2_0_FLASH}'.")


# @title Setup Session Service and Runner

# --- Session Management ---
# Key Concept: SessionService stores conversation history & state.
# InMemorySessionService is simple, non-persistent storage for this tutorial.
session_service = InMemorySessionService()

# Define constants for identifying the interaction context
APP_NAME = "weather_tutorial_app"
USER_ID = "user_1"
SESSION_ID = "session_001" # Using a fixed ID for simplicity

# Create the specific session where the conversation will happen
async def setup_session():
    session = await session_service.create_session(
        app_name=APP_NAME,
        user_id=USER_ID,
        session_id=SESSION_ID
    )
    print(f"Session created: App='{APP_NAME}', User='{USER_ID}', Session='{SESSION_ID}'")
    return session

# --- Runner ---
# Key Concept: Runner orchestrates the agent execution loop.
runner = Runner(
    agent=trip_planner, # The agent we want to run (fixed reference)
    app_name=APP_NAME,   # Associates runs with our app
    session_service=session_service # Uses our session manager
)
print(f"Runner created for agent '{runner.agent.name}'.")


# @title Define Agent Interaction Function

from google.genai import types # For creating message Content/Parts

async def call_agent_async(query: str, runner, user_id, session_id):
  """Sends a query to the agent and prints the final response."""
  print(f"\n>>> User Query: {query}")

  # Prepare the user's message in ADK format
  content = types.Content(role='user', parts=[types.Part(text=query)])

  final_response_text = "Agent did not produce a final response." # Default

  # Key Concept: run_async executes the agent logic and yields Events.
  # We iterate through events to find the final answer.
  async for event in runner.run_async(user_id=user_id, session_id=session_id, new_message=content):
      # You can uncomment the line below to see *all* events during execution
      # print(f"  [Event] Author: {event.author}, Type: {type(event).__name__}, Final: {event.is_final_response()}, Content: {event.content}")

      # Key Concept: is_final_response() marks the concluding message for the turn.
      if event.is_final_response():
          if event.content and event.content.parts:
             # Assuming text response in the first part
             final_response_text = event.content.parts[0].text
          elif event.actions and event.actions.escalate: # Handle potential errors/escalations
             final_response_text = f"Agent escalated: {event.error_message or 'No specific message.'}"
          # Add more checks here if needed (e.g., specific error codes)
          break # Stop processing events once the final response is found

  print(f"<<< Agent Response: {final_response_text}")
  return final_response_text

# Main function to run the agent
async def main():
    """Main function to run the agent system"""
    try:
        # Setup session
        session = await setup_session()
        
        # Example usage
        query = "What are the best places to visit in Mumbai?"
        response = await call_agent_async(query, runner, USER_ID, SESSION_ID)
        return response
        
    except Exception as e:
        print(f"Error in main: {e}")
        return None

# Run the main function if this script is executed directly
if __name__ == "__main__":
    asyncio.run(main())
