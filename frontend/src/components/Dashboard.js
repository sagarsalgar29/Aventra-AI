import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { API_ENDPOINTS } from '../config/api';
import { 
  MessageCircle, 
  Calendar, 
  MapPin, 
  Sparkles, 
  TrendingUp, 
  Clock,
  Star,
  Heart,
  Plane,
  Hotel,
  Utensils,
  Camera,
  Users,
  BarChart3,
  Receipt,
  Compass,
  Brain,
  Target,
  Zap
} from 'lucide-react';
import toast from 'react-hot-toast';

function Dashboard() {
  const { user } = useAuth();
  const [recentTrips, setRecentTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalTrips: 0,
    totalExpenses: 0,
    destinations: 0,
    aiConversations: 0
  });
  const [travelMood, setTravelMood] = useState(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      // Load trips
      const tripsResponse = await fetch(API_ENDPOINTS.TRIPS, {
        headers: {
          'Authorization': `Bearer ${await user.getIdToken()}`
        }
      });
      if (tripsResponse.ok) {
        const tripsData = await tripsResponse.json();
        setRecentTrips(tripsData.trips?.slice(0, 3) || []);
        setStats(prev => ({ ...prev, totalTrips: tripsData.trips?.length || 0 }));
      }

      // Load travel mood
      const moodResponse = await fetch(API_ENDPOINTS.TRAVEL_MOOD, {
        headers: {
          'Authorization': `Bearer ${await user.getIdToken()}`
        }
      });
      if (moodResponse.ok) {
        const moodData = await moodResponse.json();
        setTravelMood(moodData);
      }

      setLoading(false);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      setLoading(false);
    }
  };

  const features = [
    {
      icon: MessageCircle,
      title: "AI Chat Assistant",
      description: "Get personalized travel recommendations through conversation",
      color: "from-blue-500 to-blue-600",
      href: "/chat",
      badge: "AI Powered"
    },
    {
      icon: Compass,
      title: "Discover",
      description: "AI-powered destination discovery based on your mood",
      color: "from-purple-500 to-purple-600",
      href: "/discover",
      badge: "New"
    },
    {
      icon: Calendar,
      title: "Trip Planning",
      description: "Plan and organize your trips with AI assistance",
      color: "from-green-500 to-green-600",
      href: "/trips"
    },
    {
      icon: Users,
      title: "Social Travel",
      description: "Connect with fellow travelers and create meetups",
      color: "from-orange-500 to-orange-600",
      href: "/social",
      badge: "Live"
    }
  ];

  const quickActions = [
    { 
      text: "Plan a weekend getaway", 
      icon: Plane, 
      color: "blue",
      action: () => window.location.href = "/chat?message=Plan a weekend getaway for me"
    },
    { 
      text: "Find romantic restaurants", 
      icon: Heart, 
      color: "pink",
      action: () => window.location.href = "/chat?message=Find romantic restaurants for a date night"
    },
    { 
      text: "Book accommodations", 
      icon: Hotel, 
      color: "green",
      action: () => window.location.href = "/chat?message=Help me find and book accommodations"
    },
    { 
      text: "Discover local food", 
      icon: Utensils, 
      color: "yellow",
      action: () => window.location.href = "/chat?message=Show me the best local food experiences"
    },
    { 
      text: "Photography spots", 
      icon: Camera, 
      color: "purple",
      action: () => window.location.href = "/chat?message=Find the best photography spots and scenic locations"
    }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Welcome Section */}
      <div className="mb-8">
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold mb-2">
                Welcome back, {user?.displayName || 'Traveler'}! ✈️
              </h1>
              <p className="text-blue-100">
                Ready to plan your next adventure? Let's make it amazing!
              </p>
              {travelMood && (
                <div className="mt-3 flex items-center space-x-2">
                  <Brain className="h-4 w-4" />
                  <span className="text-sm">
                    Your travel mood: <span className="font-semibold capitalize">{travelMood.detected_mood}</span>
                  </span>
                </div>
              )}
            </div>
            <div className="hidden md:block">
              <div className="bg-white bg-opacity-20 p-3 rounded-xl">
                <Sparkles className="h-8 w-8 text-white" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mb-8">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {features.map((feature, index) => (
            <Link
              key={index}
              to={feature.href}
              className="group bg-white rounded-xl p-5 shadow-sm hover:shadow-lg transition-all duration-300 border border-gray-200 hover:border-blue-300 relative"
            >
              {feature.badge && (
                <div className="absolute -top-2 -right-2 bg-gradient-to-r from-orange-500 to-red-500 text-white text-xs px-2 py-1 rounded-full font-medium">
                  {feature.badge}
                </div>
              )}
              <div className={`w-10 h-10 bg-gradient-to-r ${feature.color} rounded-lg flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-300`}>
                <feature.icon className="h-5 w-5 text-white" />
              </div>
              <h3 className="text-base font-semibold text-gray-900 mb-2">{feature.title}</h3>
              <p className="text-gray-600 text-sm">{feature.description}</p>
            </Link>
          ))}
        </div>
      </div>

      {/* Chat Interface Preview */}
      <div className="mb-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 px-6 py-4 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-2 rounded-lg">
                <MessageCircle className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">AI Travel Assistant</h3>
                <p className="text-sm text-gray-600">Start a conversation to plan your trip</p>
              </div>
            </div>
          </div>
          <div className="p-6">
            <div className="space-y-3">
              <div className="flex justify-start">
                <div className="flex items-start space-x-3 max-w-md">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-green-500 to-blue-500 flex items-center justify-center flex-shrink-0">
                    <MessageCircle className="h-4 w-4 text-white" />
                  </div>
                  <div className="bg-gray-100 px-4 py-3 rounded-2xl">
                    <p className="text-sm">Hi! I'm your AI travel assistant. Where would you like to go?</p>
                  </div>
                </div>
              </div>
              <div className="flex justify-end">
                <div className="flex items-start space-x-3 max-w-md ml-auto flex-row-reverse space-x-reverse">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center flex-shrink-0">
                    <div className="text-white text-xs font-medium">U</div>
                  </div>
                  <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-3 rounded-2xl">
                    <p className="text-sm">I want to visit Japan in spring!</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-6">
              <Link
                to="/chat"
                className="inline-flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 font-medium"
              >
                <MessageCircle className="h-4 w-4" />
                <span>Start Planning</span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Suggestions */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Popular Destinations</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {quickActions.map((action, index) => (
            <button
              key={index}
              onClick={action.action}
              className="group bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-all duration-300 border border-gray-200 hover:border-blue-300 text-left cursor-pointer"
            >
              <div className={`w-10 h-10 bg-${action.color}-100 rounded-lg flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-300`}>
                <action.icon className={`h-5 w-5 text-${action.color}-600`} />
              </div>
              <p className="text-sm font-medium text-gray-700 group-hover:text-gray-900">{action.text}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Stats and Recent Trips */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Stats */}
        <div className="lg:col-span-2">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Your Travel Stats</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Trips Planned</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalTrips}</p>
                </div>
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Calendar className="h-5 w-5 text-blue-600" />
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">AI Conversations</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.aiConversations}</p>
                </div>
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <MessageCircle className="h-5 w-5 text-green-600" />
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Destinations</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.destinations}</p>
                </div>
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <MapPin className="h-5 w-5 text-purple-600" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Trips */}
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Trips</h2>
          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200">
            {recentTrips.length > 0 ? (
              <div className="space-y-3">
                {recentTrips.map((trip, index) => (
                  <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                    <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                      <Plane className="h-4 w-4 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">{trip.destination}</p>
                      <p className="text-xs text-gray-500">{trip.start_date} - {trip.end_date}</p>
                    </div>
                  </div>
                ))}
                <Link
                  to="/trips"
                  className="block text-center text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  View all trips →
                </Link>
              </div>
            ) : (
              <div className="text-center py-6">
                <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 text-sm">No trips planned yet</p>
                <Link
                  to="/chat"
                  className="inline-block mt-2 text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  Start planning →
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;

