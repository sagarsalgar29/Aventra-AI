import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { 
  Users, 
  MapPin, 
  Calendar, 
  Clock, 
  UserPlus, 
  MessageCircle, 
  Star,
  Heart,
  Filter,
  Search,
  Plus
} from 'lucide-react';
import toast from 'react-hot-toast';
import { API_ENDPOINTS } from '../config/api';

function Social() {
  const { user } = useAuth();
  const [similarTravelers, setSimilarTravelers] = useState([]);
  const [meetups, setMeetups] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('travelers');
  const [searchDestination, setSearchDestination] = useState('');
  const [travelStyle, setTravelStyle] = useState('cultural');
  const [interests, setInterests] = useState(['Photography', 'Local Culture']);

  const travelStyles = [
    { id: 'cultural', name: 'Cultural Explorer', icon: '🏛️' },
    { id: 'adventure', name: 'Adventure Seeker', icon: '🏔️' },
    { id: 'relaxation', name: 'Relaxation', icon: '🏖️' },
    { id: 'food', name: 'Food & Dining', icon: '🍽️' },
    { id: 'family', name: 'Family Fun', icon: '👨‍👩‍👧‍👦' },
    { id: 'solo', name: 'Solo Traveler', icon: '🧳' }
  ];

  const interestOptions = [
    'Photography', 'Art & Museums', 'Music', 'Sports', 'Shopping',
    'Nightlife', 'Beaches', 'Mountains', 'Cities', 'Villages',
    'Local Culture', 'Street Food', 'Fine Dining', 'Hiking', 'Swimming'
  ];

  const findSimilarTravelers = async () => {
    if (!searchDestination.trim()) {
      toast.error('Please enter a destination');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('API_ENDPOINTS/find-travelers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await user.getIdToken()}`
        },
        body: JSON.stringify({
          destination: searchDestination,
          travel_style: travelStyle,
          interests: interests
        })
      });

      if (!response.ok) {
        throw new Error('Failed to find travelers');
      }

      const data = await response.json();
      setSimilarTravelers(data.similar_travelers || []);
      toast.success(`Found ${data.similar_travelers?.length || 0} similar travelers!`);
    } catch (error) {
      console.error('Error finding travelers:', error);
      toast.error('Failed to find similar travelers');
    } finally {
      setIsLoading(false);
    }
  };

  const createMeetupRequest = async (travelerId) => {
    try {
      const response = await fetch('API_ENDPOINTS/meetup-request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await user.getIdToken()}`
        },
        body: JSON.stringify({
          destination: searchDestination,
          date: new Date().toISOString().split('T')[0],
          activity: 'City tour and local food experience',
          max_participants: 4,
          description: `Let's explore ${searchDestination} together!`
        })
      });

      if (!response.ok) {
        throw new Error('Failed to create meetup request');
      }

      toast.success('Meetup request sent successfully!');
    } catch (error) {
      console.error('Error creating meetup:', error);
      toast.error('Failed to send meetup request');
    }
  };

  const handleInterestToggle = (interest) => {
    setInterests(prev => 
      prev.includes(interest) 
        ? prev.filter(i => i !== interest)
        : [...prev, interest]
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="bg-gradient-to-r from-green-600 to-blue-600 p-3 rounded-full">
              <Users className="h-8 w-8 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Connect with Fellow Travelers</h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Find like-minded travelers, create meetups, and make your trips more social and memorable
          </p>
        </div>

        {/* Tabs */}
        <div className="flex space-x-1 bg-white rounded-lg p-1 mb-6 max-w-md mx-auto">
          <button
            onClick={() => setActiveTab('travelers')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all duration-200 ${
              activeTab === 'travelers'
                ? 'bg-blue-600 text-white'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Find Travelers
          </button>
          <button
            onClick={() => setActiveTab('meetups')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all duration-200 ${
              activeTab === 'meetups'
                ? 'bg-blue-600 text-white'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            My Meetups
          </button>
        </div>

        {activeTab === 'travelers' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Search Panel */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-xl shadow-sm p-6 space-y-6">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  <Search className="h-5 w-5 mr-2 text-blue-500" />
                  Find Travelers
                </h3>

                {/* Destination */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Destination
                  </label>
                  <input
                    type="text"
                    value={searchDestination}
                    onChange={(e) => setSearchDestination(e.target.value)}
                    placeholder="e.g., Paris, Tokyo, Bali"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Travel Style */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Travel Style
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {travelStyles.map((style) => (
                      <button
                        key={style.id}
                        onClick={() => setTravelStyle(style.id)}
                        className={`p-2 rounded-lg border-2 transition-all duration-200 text-left ${
                          travelStyle === style.id
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <span className="text-lg mr-2">{style.icon}</span>
                        <span className="text-xs font-medium text-gray-700">{style.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Interests */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Shared Interests
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {interestOptions.map((interest) => (
                      <button
                        key={interest}
                        onClick={() => handleInterestToggle(interest)}
                        className={`px-2 py-1 rounded-full text-xs transition-all duration-200 ${
                          interests.includes(interest)
                            ? 'bg-green-500 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {interest}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  onClick={findSimilarTravelers}
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-green-600 to-blue-600 text-white py-3 rounded-lg font-semibold hover:from-green-700 hover:to-blue-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                >
                  {isLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Searching...</span>
                    </>
                  ) : (
                    <>
                      <Search className="h-4 w-4" />
                      <span>Find Travelers</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Results */}
            <div className="lg:col-span-2">
              {similarTravelers.length > 0 ? (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Similar Travelers in {searchDestination}
                    <span className="ml-2 text-sm font-normal text-green-600 bg-green-100 px-2 py-1 rounded-full">
                      Live Database Results
                    </span>
                  </h3>
                  {similarTravelers.map((traveler, index) => (
                    <div key={index} className="bg-white rounded-xl shadow-sm p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-4">
                          <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-blue-500 rounded-full flex items-center justify-center">
                            <span className="text-white font-bold text-lg">
                              {traveler.name?.charAt(0) || 'T'}
                            </span>
                          </div>
                          <div className="flex-1">
                            <h4 className="text-lg font-semibold text-gray-900">{traveler.name}</h4>
                            <p className="text-sm text-gray-600 mb-2">
                              {traveler.travel_style} • {Math.round(traveler.matching_score * 100)}% match
                            </p>
                            <div className="flex flex-wrap gap-1 mb-3">
                              {traveler.interests?.slice(0, 3).map((interest, i) => (
                                <span key={i} className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                                  {interest}
                                </span>
                              ))}
                            </div>
                            <div className="text-sm text-gray-500">
                              <p className="font-medium mb-1">Planned Activities:</p>
                              <ul className="list-disc list-inside space-y-1">
                                {traveler.planned_activities?.map((activity, i) => (
                                  <li key={i}>{activity}</li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => createMeetupRequest(traveler.user_id)}
                            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all duration-200 flex items-center space-x-2"
                          >
                            <UserPlus className="h-4 w-4" />
                            <span>Meet Up</span>
                          </button>
                          <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all duration-200 flex items-center space-x-2">
                            <MessageCircle className="h-4 w-4" />
                            <span>Message</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-white rounded-xl shadow-sm p-12 text-center">
                  <div className="w-16 h-16 bg-gradient-to-r from-gray-400 to-gray-500 rounded-full mx-auto mb-4 flex items-center justify-center">
                    <Users className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Find Your Travel Companions</h3>
                  <p className="text-gray-500">
                    Enter a destination and your preferences to find like-minded travelers
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'meetups' && (
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gradient-to-r from-gray-400 to-gray-500 rounded-full mx-auto mb-4 flex items-center justify-center">
                <Calendar className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Meetups Yet</h3>
              <p className="text-gray-500 mb-4">
                Start connecting with travelers to create your first meetup
              </p>
              <button
                onClick={() => setActiveTab('travelers')}
                className="px-6 py-3 bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-lg font-semibold hover:from-green-700 hover:to-blue-700 transition-all duration-200 flex items-center space-x-2 mx-auto"
              >
                <Plus className="h-4 w-4" />
                <span>Find Travelers</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Social;
