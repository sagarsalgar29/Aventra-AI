// API Configuration
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000';

export const API_ENDPOINTS = {
  // Authentication
  AUTH_VERIFY: `${API_BASE_URL}/auth/verify`,
  
  // Profile
  PROFILE: `${API_BASE_URL}/profile`,
  
  // Trips
  TRIPS: `${API_BASE_URL}/trips`,
  BUDGET_ALLOCATION: `${API_BASE_URL}/budget-allocation`,
  
  // Chat
  CHAT: `${API_BASE_URL}/chat`,
  CHAT_HISTORY: `${API_BASE_URL}/chat-history`,
  
  // Social & Meetups
  SOCIAL_INFO: (destination) => `${API_BASE_URL}/chat-social-info/${destination}`,
  MEETUP_REQUEST: `${API_BASE_URL}/meetup-request`,
  ACCEPT_MEETUP: (requestId) => `${API_BASE_URL}/meetup-request/${requestId}/accept`,
  REJECT_MEETUP: (requestId) => `${API_BASE_URL}/meetup-request/${requestId}/reject`,
  CANCEL_MEETUP: (requestId) => `${API_BASE_URL}/meetup-request/${requestId}/cancel`,
  ACCEPTED_MEETUP_SUGGESTIONS: (meetupId) => `${API_BASE_URL}/accepted-meetup-suggestions/${meetupId}`,
  MEETUP_CHAT: (chatSessionId) => `${API_BASE_URL}/meetup-chat/${chatSessionId}`,
  
  // Hotel
  HOTEL_PROFILE: `${API_BASE_URL}/hotel-profile`,
  HOTEL_CUSTOMERS: `${API_BASE_URL}/hotel-customers`,
  
  // Travel Mood
  TRAVEL_MOOD: `${API_BASE_URL}/travel-mood-detection`,
  
  // Reviews
  REVIEWS: `${API_BASE_URL}/reviews`,
  
  // Analytics
  ANALYTICS: `${API_BASE_URL}/analytics`,
  
  // Expenses
  EXPENSES: `${API_BASE_URL}/expenses`,
  
  // Live Location
  LIVE_LOCATION: `${API_BASE_URL}/live-location`
};

export default API_BASE_URL;
