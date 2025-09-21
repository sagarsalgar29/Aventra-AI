import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  Compass, 
  Sparkles, 
  MapPin, 
  Heart, 
  Mountain, 
  Utensils, 
  BookOpen, 
  TreePine,
  Plane,
  Search,
  Filter,
  DollarSign,
  Briefcase
} from 'lucide-react';
import toast from 'react-hot-toast';
import { API_ENDPOINTS } from '../config/api';

function Discover() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [selectedMood, setSelectedMood] = useState('');
  const [selectedTheme, setSelectedTheme] = useState('');
  const [budgetRange, setBudgetRange] = useState('');
  const [interests, setInterests] = useState([]);
  const [suggestions, setSuggestions] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [userPreferences, setUserPreferences] = useState(null);
  const [currentStep, setCurrentStep] = useState(1);

  // Function to handle plan trip button click
  const handlePlanTrip = (destination) => {
    // Store the selected destination and preferences in localStorage for the Trips component
    const tripData = {
      destination: destination,
      mood: selectedMood,
      theme: selectedTheme,
      budget: budgetRange,
      interests: interests,
      fromDiscover: true
    };
    
    localStorage.setItem('discoverTripData', JSON.stringify(tripData));
    
    // Navigate to trips page
    navigate('/trips');
    
    // Show success message
    toast.success(`Planning trip to ${destination}! Redirecting to trip planner...`);
  };

  // Dynamic data that would come from user profile and AI
  const [moods, setMoods] = useState([
    { id: 'adventure', name: 'Adventure', icon: Mountain, color: 'from-orange-500 to-red-500', description: 'Thrilling outdoor activities and adrenaline' },
    { id: 'cultural', name: 'Cultural', icon: BookOpen, color: 'from-purple-500 to-indigo-500', description: 'Museums, history, and local traditions' },
    { id: 'relaxation', name: 'Relaxation', icon: Heart, color: 'from-pink-500 to-rose-500', description: 'Peaceful retreats and wellness' },
    { id: 'food', name: 'Food & Dining', icon: Utensils, color: 'from-yellow-500 to-orange-500', description: 'Culinary experiences and local cuisine' },
    { id: 'history', name: 'History', icon: BookOpen, color: 'from-amber-500 to-yellow-500', description: 'Historical sites and ancient wonders' },
    { id: 'nature', name: 'Nature', icon: TreePine, color: 'from-green-500 to-emerald-500', description: 'National parks and natural beauty' }
  ]);

  const themes = [
    { id: 'romantic', name: 'Romantic Getaway', icon: Heart, description: 'Perfect for couples' },
    { id: 'family', name: 'Family Fun', icon: Heart, description: 'Kid-friendly destinations' },
    { id: 'solo', name: 'Solo Adventure', icon: Compass, description: 'Safe and social for solo travelers' },
    { id: 'luxury', name: 'Luxury Travel', icon: Sparkles, description: 'Premium experiences' },
    { id: 'budget', name: 'Budget Travel', icon: DollarSign, description: 'Affordable adventures' },
    { id: 'business', name: 'Business Trip', icon: Briefcase, description: 'Work-friendly locations' }
  ];

  const interestOptions = [
    'Photography', 'Art & Museums', 'Music', 'Sports', 'Shopping',
    'Nightlife', 'Beaches', 'Mountains', 'Cities', 'Villages',
    'Local Culture', 'Street Food', 'Fine Dining', 'Hiking', 'Swimming'
  ];

  const budgetRanges = [
    { id: 'budget', name: 'Budget', range: '50-150', description: '$50-150 per day', icon: '💰' },
    { id: 'mid-range', name: 'Mid-range', range: '150-300', description: '$150-300 per day', icon: '💳' },
    { id: 'luxury', name: 'Luxury', range: '300+', description: '$300+ per day', icon: '💎' }
  ];

  // Load user preferences on component mount
  React.useEffect(() => {
    loadUserPreferences();
  }, []);

  const loadUserPreferences = async () => {
    try {
      // Fetch real user profile data
      const response = await fetch('API_ENDPOINTS.PROFILE', {
        headers: {
          'Authorization': `Bearer ${await user.getIdToken()}`
        }
      });

      if (response.ok) {
        const profileData = await response.json();
        
        // Extract preferences from profile
        const userPrefs = {
          pastDestinations: profileData.past_destinations || [],
          favoriteMoods: profileData.travel_style ? [profileData.travel_style] : [],
          budgetPreference: profileData.budget_preference || 'mid-range',
          interests: profileData.interests || []
        };
        
        setUserPreferences(userPrefs);
        
        // Pre-select based on user history
        if (userPrefs.favoriteMoods.length > 0) {
          setSelectedMood(userPrefs.favoriteMoods[0]);
        }
        if (userPrefs.budgetPreference) {
          setBudgetRange(userPrefs.budgetPreference);
        }
        if (userPrefs.interests.length > 0) {
          setInterests(userPrefs.interests.slice(0, 3)); // Limit to 3
        }
      } else {
        // If no profile found, use empty preferences
        setUserPreferences({
          pastDestinations: [],
          favoriteMoods: [],
          budgetPreference: 'mid-range',
          interests: []
        });
      }
    } catch (error) {
      console.error('Error loading user preferences:', error);
      // Use empty preferences on error
      setUserPreferences({
        pastDestinations: [],
        favoriteMoods: [],
        budgetPreference: 'mid-range',
        interests: []
      });
    }
  };

  const handleInterestToggle = (interest) => {
    setInterests(prev => 
      prev.includes(interest) 
        ? prev.filter(i => i !== interest)
        : [...prev, interest]
    );
  };

  const getPersonalizedGreeting = () => {
    if (userPreferences?.pastDestinations?.length > 0) {
      return `Welcome back! I see you've been to ${userPreferences.pastDestinations.join(', ')}. Let's find your next adventure!`;
    }
    return "Let's discover your perfect destination! Tell me what you're in the mood for.";
  };

  const getSmartSuggestions = () => {
    if (!userPreferences) return [];
    
    const smartMoods = moods.filter(mood => 
      userPreferences.favoriteMoods?.includes(mood.id)
    );
    
    return smartMoods.length > 0 ? smartMoods : moods.slice(0, 3);
  };

  const handleDiscover = async () => {
    if (!selectedMood && !selectedTheme) {
      toast.error('Please select a mood or theme');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('API_ENDPOINTS/suggest-destinations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await user.getIdToken()}`
        },
        body: JSON.stringify({
          mood: selectedMood,
          theme: selectedTheme,
          budget_range: budgetRange,
          interests: interests
        })
      });

      if (!response.ok) {
        throw new Error('Failed to get suggestions');
      }

      const data = await response.json();
      setSuggestions(data.suggestions);
      toast.success('Found amazing destinations for you!');
    } catch (error) {
      console.error('Error getting suggestions:', error);
      toast.error('Failed to get destination suggestions');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-3 rounded-full">
              <Compass className="h-8 w-8 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Discover Your Next Adventure</h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            {getPersonalizedGreeting()}
          </p>
        </div>

        {/* Progress Steps */}
        <div className="flex justify-center mb-8">
          <div className="flex items-center space-x-4">
            {[1, 2, 3].map((step) => (
              <div key={step} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  currentStep >= step 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-200 text-gray-600'
                }`}>
                  {step}
                </div>
                {step < 3 && (
                  <div className={`w-16 h-1 mx-2 ${
                    currentStep > step ? 'bg-blue-600' : 'bg-gray-200'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Step 1: Mood Selection */}
        {currentStep === 1 && (
          <div className="bg-white rounded-xl shadow-sm p-8">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">What's your travel mood?</h2>
              <p className="text-gray-600">Choose what kind of experience you're looking for</p>
            </div>
            
            {/* Smart Suggestions */}
            {userPreferences && (
              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-700 mb-3">Based on your past trips:</h3>
                <div className="flex flex-wrap gap-2">
                  {getSmartSuggestions().map((mood) => (
                    <button
                      key={mood.id}
                      onClick={() => {
                        setSelectedMood(mood.id);
                        setCurrentStep(2);
                      }}
                      className="px-4 py-2 bg-blue-100 text-blue-700 rounded-full text-sm font-medium hover:bg-blue-200 transition-all duration-200"
                    >
                      {mood.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {moods.map((mood) => (
                <button
                  key={mood.id}
                  onClick={() => {
                    setSelectedMood(mood.id);
                    setCurrentStep(2);
                  }}
                  className={`p-6 rounded-xl border-2 transition-all duration-200 text-left ${
                    selectedMood === mood.id
                      ? 'border-blue-500 bg-blue-50 shadow-md'
                      : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
                  }`}
                >
                  <div className={`w-16 h-16 mb-4 bg-gradient-to-r ${mood.color} rounded-full flex items-center justify-center`}>
                    <mood.icon className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{mood.name}</h3>
                  <p className="text-sm text-gray-600">{mood.description}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 2: Budget & Theme */}
        {currentStep === 2 && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm p-8">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">What's your budget?</h2>
                <p className="text-gray-600">This helps us find the best value for your money</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {budgetRanges.map((budget) => (
                  <button
                    key={budget.id}
                    onClick={() => {
                      setBudgetRange(budget.id);
                      setCurrentStep(3);
                    }}
                    className={`p-6 rounded-xl border-2 transition-all duration-200 text-center ${
                      budgetRange === budget.id
                        ? 'border-green-500 bg-green-50 shadow-md'
                        : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
                    }`}
                  >
                    <div className="text-4xl mb-4">{budget.icon}</div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">{budget.name}</h3>
                    <p className="text-sm text-gray-600">{budget.description}</p>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Interests & Discover */}
        {currentStep === 3 && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm p-8">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">What interests you?</h2>
                <p className="text-gray-600">Select a few things you enjoy (optional)</p>
              </div>
              
              <div className="flex flex-wrap gap-3 mb-8">
                {interestOptions.map((interest) => (
                  <button
                    key={interest}
                    onClick={() => handleInterestToggle(interest)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                      interests.includes(interest)
                        ? 'bg-blue-500 text-white shadow-md'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {interest}
                  </button>
                ))}
              </div>

              <div className="text-center">
                <button
                  onClick={handleDiscover}
                  disabled={isLoading}
                  className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold text-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-3 mx-auto"
                >
                  {isLoading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Discovering...</span>
                    </>
                  ) : (
                    <>
                      <Search className="h-5 w-5" />
                      <span>Discover My Destinations</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Results */}
        {suggestions && (
          <div className="bg-white rounded-xl shadow-sm p-8">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Your Perfect Destinations</h2>
              <p className="text-gray-600">Based on your preferences, here are our AI-powered recommendations</p>
            </div>
            
            {/* AI Insights */}
            {suggestions.ai_insights && (
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6 mb-8">
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-white text-sm font-bold">AI</span>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">AI Travel Insights</h3>
                    <p className="text-gray-700 leading-relaxed">{suggestions.ai_insights}</p>
                  </div>
                </div>
              </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {suggestions.suggestions?.map((destination, index) => (
                <div key={index} className="p-6 border border-gray-200 rounded-xl hover:border-blue-300 hover:shadow-md transition-all duration-200">
                  <div className="flex items-center space-x-4 mb-4">
                    <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-lg font-bold">{index + 1}</span>
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">{destination}</h3>
                      <p className="text-sm text-gray-500">
                        {suggestions.mood && `Perfect for ${suggestions.mood} travel`}
                      </p>
                    </div>
                  </div>
                  
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center text-sm text-gray-600">
                      <span className="font-medium">Budget:</span>
                      <span className="ml-2">{budgetRanges.find(b => b.id === budgetRange)?.description}</span>
                    </div>
                    {interests.length > 0 && (
                      <div className="flex items-center text-sm text-gray-600">
                        <span className="font-medium">Interests:</span>
                        <span className="ml-2">{interests.slice(0, 2).join(', ')}</span>
                      </div>
                    )}
                  </div>
                  
                  <button 
                    onClick={() => handlePlanTrip(destination)}
                    className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-200 flex items-center justify-center space-x-2"
                  >
                    <Plane className="h-4 w-4" />
                    <span>Plan Trip to {destination}</span>
                  </button>
                </div>
              ))}
            </div>
            
            <div className="text-center mt-8">
              <button
                onClick={() => {
                  setSuggestions(null);
                  setCurrentStep(1);
                  setSelectedMood('');
                  setBudgetRange('');
                  setInterests([]);
                }}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-all duration-200"
              >
                Try Different Preferences
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Discover;
