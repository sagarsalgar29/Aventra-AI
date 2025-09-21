import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { API_ENDPOINTS } from '../config/api';
import { 
  Users, 
  MapPin, 
  Calendar, 
  MessageCircle, 
  CheckCircle, 
  XCircle, 
  Star,
  Clock,
  Navigation,
  Heart,
  Send,
  UserPlus,
  Activity,
  Map
} from 'lucide-react';
import toast from 'react-hot-toast';

function SocialTravel() {
  const { user } = useAuth();
  const [userTrips, setUserTrips] = useState([]);
  const [selectedTrip, setSelectedTrip] = useState(null);
  const [socialData, setSocialData] = useState(null);
  const [showCreateMeetup, setShowCreateMeetup] = useState(false);
  const [targetTraveler, setTargetTraveler] = useState(null);
  const [newMeetup, setNewMeetup] = useState({
    destination: '',
    date: '',
    activity: '',
    max_participants: 4,
    description: ''
  });
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('travelers'); // travelers, requests, my_requests, suggestions
  const [acceptedMeetupSuggestions, setAcceptedMeetupSuggestions] = useState(null);

  // Load user's trips only
  useEffect(() => {
    loadUserTrips();
  }, []);

  // Load social data when trip is selected
  useEffect(() => {
    if (selectedTrip) {
      loadSocialDataForTrip(selectedTrip.destination);
    }
  }, [selectedTrip]);

  const loadUserTrips = async () => {
    setLoading(true);
    try {
      const response = await fetch(API_ENDPOINTS.TRIPS, {
        headers: {
          'Authorization': `Bearer ${await user.getIdToken()}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setUserTrips(data.trips || []);
      } else {
        toast.error('Failed to load trips');
      }
    } catch (error) {
      console.error('Error loading trips:', error);
      toast.error('Error loading trips');
    } finally {
      setLoading(false);
    }
  };

  const loadSocialDataForTrip = async (destination) => {
    setLoading(true);
    try {
      const response = await fetch(API_ENDPOINTS.SOCIAL_INFO(destination), {
        headers: {
          'Authorization': `Bearer ${await user.getIdToken()}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setSocialData(data);
      } else {
        toast.error('Failed to load social data');
      }
    } catch (error) {
      console.error('Error loading social data:', error);
      toast.error('Error loading social data');
    } finally {
      setLoading(false);
    }
  };

  const loadAcceptedMeetupSuggestions = async (meetupId) => {
    setLoading(true);
    try {
      const response = await fetch(API_ENDPOINTS.ACCEPTED_MEETUP_SUGGESTIONS(meetupId), {
        headers: {
          'Authorization': `Bearer ${await user.getIdToken()}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setAcceptedMeetupSuggestions(data);
      } else {
        toast.error('Failed to load meetup suggestions');
      }
    } catch (error) {
      console.error('Error loading meetup suggestions:', error);
      toast.error('Error loading meetup suggestions');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateMeetup = async () => {
    if (!selectedTrip || !newMeetup.activity) {
      toast.error('Please select a trip and fill in the activity');
      return;
    }

    const meetupData = {
      ...newMeetup,
      destination: selectedTrip.destination,
      date: selectedTrip.start_date || newMeetup.date,
      target_traveler_id: targetTraveler?.user_id || null
    };

    setLoading(true);
    try {
      const response = await fetch(API_ENDPOINTS.MEETUP_REQUEST, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await user.getIdToken()}`
        },
        body: JSON.stringify(meetupData)
      });

      if (response.ok) {
        toast.success('Meetup request created successfully!');
        setShowCreateMeetup(false);
        setTargetTraveler(null);
        setNewMeetup({
          destination: '',
          date: '',
          activity: '',
          max_participants: 4,
          description: ''
        });
        // Reload social data
        loadSocialDataForTrip(selectedTrip.destination);
      } else {
        toast.error('Failed to create meetup request');
      }
    } catch (error) {
      console.error('Error creating meetup:', error);
      toast.error('Error creating meetup request');
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptMeetup = async (requestId) => {
    setLoading(true);
    try {
      const response = await fetch(API_ENDPOINTS.ACCEPT_MEETUP(requestId), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${await user.getIdToken()}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        toast.success('Meetup request accepted! Chat session created.');
        // Reload social data
        loadSocialDataForTrip(selectedTrip.destination);
      } else {
        toast.error('Failed to accept meetup request');
      }
    } catch (error) {
      console.error('Error accepting meetup:', error);
      toast.error('Error accepting meetup request');
    } finally {
      setLoading(false);
    }
  };

  const handleRejectMeetup = async (requestId) => {
    setLoading(true);
    try {
      const response = await fetch(API_ENDPOINTS.REJECT_MEETUP(requestId), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${await user.getIdToken()}`
        }
      });

      if (response.ok) {
        toast.success('Meetup request rejected');
        // Reload social data
        loadSocialDataForTrip(selectedTrip.destination);
      } else {
        toast.error('Failed to reject meetup request');
      }
    } catch (error) {
      console.error('Error rejecting meetup:', error);
      toast.error('Error rejecting meetup request');
    } finally {
      setLoading(false);
    }
  };

  const checkExistingRequest = (traveler) => {
    if (!socialData?.outgoing_requests) return null;
    
    // Check if there's already a request sent to this traveler
    const existingRequest = socialData.outgoing_requests.find(request => 
      request.target_traveler_id === traveler.user_id
    );
    
    return existingRequest;
  };

  const handleSendMeetupRequest = (traveler) => {
    if (!selectedTrip) {
      toast.error('Please select a trip first');
      return;
    }

    // Check if request already exists
    const existingRequest = checkExistingRequest(traveler);
    if (existingRequest) {
      toast.error(`You already have a ${existingRequest.status} request to ${traveler.name}`);
      return;
    }

    // Set target traveler
    setTargetTraveler(traveler);

    // Pre-fill the meetup form with traveler and trip information
    setNewMeetup({
      destination: selectedTrip.destination,
      date: selectedTrip.start_date,
      activity: `Meetup with ${traveler.name}`,
      max_participants: 4,
      description: `I'd like to meet up with ${traveler.name} during our trip to ${selectedTrip.destination}. We both share interests in ${traveler.interests.join(', ')}.`
    });
    
    setShowCreateMeetup(true);
    toast.success(`Opening meetup request form for ${traveler.name}`);
  };

  const handleCancelRequest = async (requestId) => {
    setLoading(true);
    try {
      const token = await user.getIdToken();
      const response = await fetch(API_ENDPOINTS.CANCEL_MEETUP(requestId), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        toast.success('Meetup request cancelled');
        loadSocialDataForTrip(selectedTrip.destination);
      } else {
        toast.error('Failed to cancel meetup request');
      }
    } catch (error) {
      console.error('Error cancelling meetup:', error);
      toast.error('Error cancelling meetup request');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                <Users className="h-8 w-8 mr-3 text-blue-600" />
                Social Travel
              </h1>
              <p className="text-gray-600 mt-2">Connect with fellow travelers and plan meetups</p>
            </div>
            <button
              onClick={() => {
                if (selectedTrip) {
                  setNewMeetup({
                    ...newMeetup,
                    destination: selectedTrip.destination,
                    date: selectedTrip.start_date
                  });
                  setShowCreateMeetup(true);
                } else {
                  toast.error('Please select a trip first');
                }
              }}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
            >
              <UserPlus className="h-5 w-5" />
              <span>Create Meetup</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {userTrips.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">No Trips Found</h2>
            <p className="text-gray-600 mb-6">Create a trip first to see social features and find fellow travelers.</p>
            <a 
              href="/trips" 
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors inline-flex items-center space-x-2"
            >
              <Calendar className="h-5 w-5" />
              <span>Create Your First Trip</span>
            </a>
          </div>
        ) : (
          <>
            {/* Trip Selection */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Select a Trip to Explore Social Features</h2>
              <p className="text-gray-600 mb-6">Choose one of your trips to find similar travelers, meetup requests, and AI suggestions.</p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {userTrips.map((trip) => (
                  <button
                    key={trip.id}
                    onClick={() => setSelectedTrip(trip)}
                    className={`p-4 rounded-lg border-2 transition-all text-left ${
                      selectedTrip && selectedTrip.id === trip.id
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center space-x-3 mb-2">
                      <MapPin className="h-5 w-5" />
                      <span className="font-medium">{trip.destination}</span>
                    </div>
                    <div className="text-sm text-gray-600">
                      <div className="flex items-center space-x-2">
                        <Calendar className="h-4 w-4" />
                        <span>{trip.start_date} to {trip.end_date}</span>
                      </div>
                      {trip.travel_style && (
                        <div className="mt-1">
                          <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
                            {trip.travel_style}
                          </span>
                        </div>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {selectedTrip && (
              <>
                {/* Tabs */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-8">
                  <div className="border-b border-gray-200">
                    <nav className="flex space-x-8 px-6">
                      {[
                        { id: 'travelers', label: 'Similar Travelers', icon: Users },
                        { id: 'requests', label: 'Meetup Requests', icon: MessageCircle },
                        { id: 'my_requests', label: 'My Requests', icon: Send },
                        { id: 'suggestions', label: 'AI Suggestions', icon: Star }
                      ].map((tab) => (
                        <button
                          key={tab.id}
                          onClick={() => setActiveTab(tab.id)}
                          className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                            activeTab === tab.id
                              ? 'border-blue-500 text-blue-600'
                              : 'border-transparent text-gray-500 hover:text-gray-700'
                          }`}
                        >
                          <tab.icon className="h-5 w-5" />
                          <span>{tab.label}</span>
                        </button>
                      ))}
                    </nav>
                  </div>

                  <div className="p-6">
                    {loading ? (
                      <div className="flex items-center justify-center py-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        <span className="ml-3 text-gray-600">Loading...</span>
                      </div>
                    ) : (
                      <>
                        {/* Similar Travelers Tab */}
                        {activeTab === 'travelers' && (
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">
                              Travelers going to {selectedTrip.destination}
                            </h3>
                            {socialData?.similar_travelers?.length > 0 ? (
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {socialData?.similar_travelers?.map((traveler, index) => (
                                  <div key={index} className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                                    <div className="flex items-center space-x-3 mb-4">
                                      <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                                        <Users className="h-6 w-6 text-blue-600" />
                                      </div>
                                      <div>
                                        <h4 className="font-semibold text-gray-900">{traveler.name}</h4>
                                        <p className="text-sm text-gray-600">{traveler.travel_style}</p>
                                      </div>
                                    </div>
                                    <div className="space-y-2 mb-4">
                                      <div className="flex items-center text-sm text-gray-600">
                                        <Calendar className="h-4 w-4 mr-2" />
                                        <span>{traveler.trip_dates}</span>
                                      </div>
                                      <div className="flex items-center text-sm text-gray-600">
                                        <Star className="h-4 w-4 mr-2" />
                                        <span>Budget: ₹{traveler.budget}</span>
                                      </div>
                                    </div>
                                    <div className="mb-4">
                                      <p className="text-sm text-gray-600 mb-2">Interests:</p>
                                      <div className="flex flex-wrap gap-2">
                                        {traveler.interests.map((interest, idx) => (
                                          <span
                                            key={idx}
                                            className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full"
                                          >
                                            {interest}
                                          </span>
                                        ))}
                                      </div>
                                    </div>
                                    {(() => {
                                      const existingRequest = checkExistingRequest(traveler);
                                      if (existingRequest) {
                                        return (
                                          <div className="space-y-2">
                                            <div className={`w-full py-2 px-4 rounded-lg text-center text-sm font-medium ${
                                              existingRequest.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                              existingRequest.status === 'accepted' ? 'bg-green-100 text-green-800' :
                                              'bg-red-100 text-red-800'
                                            }`}>
                                              {existingRequest.status === 'pending' && '⏳ Request Pending'}
                                              {existingRequest.status === 'accepted' && '✅ Request Accepted'}
                                              {existingRequest.status === 'rejected' && '❌ Request Rejected'}
                                            </div>
                                            {existingRequest.status === 'pending' && (
                                              <button 
                                                onClick={() => handleCancelRequest(existingRequest.id)}
                                                className="w-full bg-red-500 text-white py-2 px-4 rounded-lg hover:bg-red-600 transition-colors flex items-center justify-center space-x-2"
                                              >
                                                <XCircle className="h-4 w-4" />
                                                <span>Cancel Request</span>
                                              </button>
                                            )}
                                          </div>
                                        );
                                      } else {
                                        return (
                                          <button 
                                            onClick={() => handleSendMeetupRequest(traveler)}
                                            className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
                                          >
                                            <Send className="h-4 w-4" />
                                            <span>Send Meetup Request</span>
                                          </button>
                                        );
                                      }
                                    })()}
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="text-center py-12">
                                <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                                <p className="text-gray-600">No travelers found for {selectedTrip.destination}</p>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Meetup Requests Tab - Incoming Requests */}
                        {activeTab === 'requests' && (
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">
                              Meetup Requests for {selectedTrip.destination}
                            </h3>
                            <p className="text-gray-600 mb-6">Requests that other travelers have sent to you</p>
                        {socialData?.incoming_requests?.length > 0 ? (
                          <div className="space-y-4">
                            {socialData?.incoming_requests?.map((request, index) => (
                                  <div key={index} className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                                    <div className="flex items-start justify-between mb-4">
                                      <div>
                                        <h4 className="font-semibold text-gray-900">{request.activity}</h4>
                                        <p className="text-sm text-gray-600">by {request.requester_name}</p>
                                      </div>
                                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                                        request.status === 'pending' 
                                          ? 'bg-yellow-100 text-yellow-800'
                                          : request.status === 'accepted'
                                          ? 'bg-green-100 text-green-800'
                                          : 'bg-red-100 text-red-800'
                                      }`}>
                                        {request.status}
                                      </span>
                                    </div>
                                    <p className="text-gray-700 mb-4">{request.description}</p>
                                    <div className="flex items-center space-x-4 text-sm text-gray-600 mb-4">
                                      <div className="flex items-center">
                                        <Calendar className="h-4 w-4 mr-1" />
                                        <span>{request.date}</span>
                                      </div>
                                      <div className="flex items-center">
                                        <Users className="h-4 w-4 mr-1" />
                                        <span>Max {request.max_participants} people</span>
                                      </div>
                                    </div>
                                    {request.status === 'pending' && (
                                      <div className="flex space-x-3">
                                        <button
                                          onClick={() => handleAcceptMeetup(request.id)}
                                          className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center space-x-2"
                                        >
                                          <CheckCircle className="h-4 w-4" />
                                          <span>Accept</span>
                                        </button>
                                        <button
                                          onClick={() => handleRejectMeetup(request.id)}
                                          className="flex-1 bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center space-x-2"
                                        >
                                          <XCircle className="h-4 w-4" />
                                          <span>Reject</span>
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="text-center py-12">
                                <MessageCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                                <p className="text-gray-600">No meetup requests for {selectedTrip.destination}</p>
                              </div>
                            )}
                          </div>
                        )}

                        {/* My Requests Tab - Outgoing Requests */}
                        {activeTab === 'my_requests' && (
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">
                              My Meetup Requests for {selectedTrip.destination}
                            </h3>
                            <p className="text-gray-600 mb-6">Requests that you have sent to other travelers</p>
                            {socialData?.outgoing_requests?.length > 0 ? (
                              <div className="space-y-4">
                                {socialData?.outgoing_requests?.map((request, index) => (
                                  <div key={index} className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                                    <div className="flex items-start justify-between mb-4">
                                      <div>
                                        <h4 className="font-semibold text-gray-900">{request.activity}</h4>
                                        <p className="text-sm text-gray-600">To: {request.target_traveler_name || 'Unknown Traveler'}</p>
                                      </div>
                                      <span
                                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                                          request.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                          request.status === 'accepted' ? 'bg-green-100 text-green-800' :
                                          request.status === 'rejected' ? 'bg-red-100 text-red-800' :
                                          'bg-gray-100 text-gray-800'
                                        }`}
                                      >
                                        {request.status}
                                      </span>
                                    </div>
                                    <p className="text-gray-700 mb-4">{request.description}</p>
                                    <div className="flex items-center space-x-4 text-sm text-gray-600 mb-4">
                                      <p className="flex items-center space-x-2">
                                        <Calendar className="h-4 w-4" />
                                        <span>{request.date}</span>
                                      </p>
                                      <p className="flex items-center space-x-2">
                                        <Users className="h-4 w-4" />
                                        <span>Max {request.max_participants} participants</span>
                                      </p>
                                    </div>
                                    {request.status === 'pending' && (
                                      <div className="flex space-x-3">
                                        <button
                                          onClick={() => handleCancelRequest(request.id)}
                                          className="flex-1 bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors flex items-center justify-center space-x-2"
                                        >
                                          <XCircle className="h-4 w-4" />
                                          <span>Cancel Request</span>
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="text-center py-12">
                                <Send className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                                <p className="text-gray-600">No outgoing requests for {selectedTrip.destination}</p>
                                <p className="text-sm text-gray-500 mt-2">Send meetup requests to travelers you'd like to meet</p>
                              </div>
                            )}
                          </div>
                        )}

                        {/* AI Suggestions Tab */}
                        {activeTab === 'suggestions' && (
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">
                              AI-Powered Suggestions for {selectedTrip.destination}
                            </h3>
                            
                            {/* Check for accepted meetups first */}
                            {socialData?.incoming_requests?.some(request => request.status === 'accepted') ? (
                              <div className="mb-6">
                                <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                                  <h4 className="font-semibold text-green-800 mb-2">🎉 You have accepted meetups!</h4>
                                  <p className="text-green-700 text-sm">Get personalized AI suggestions for your meetups</p>
                                </div>
                                
                                {socialData?.incoming_requests
                                  ?.filter(request => request.status === 'accepted')
                                  ?.map((request, index) => (
                                    <div key={index} className="mb-4">
                                      <button
                                        onClick={() => loadAcceptedMeetupSuggestions(request.id)}
                                        className="w-full bg-gradient-to-r from-green-500 to-blue-500 text-white px-4 py-3 rounded-lg hover:from-green-600 hover:to-blue-600 transition-all duration-200 flex items-center justify-center space-x-2"
                                      >
                                        <Star className="h-5 w-5" />
                                        <span>Get AI Suggestions for meetup with {request.requester_name}</span>
                                      </button>
                                    </div>
                                  ))}
                              </div>
                            ) : null}
                            
                            {/* Display accepted meetup suggestions */}
                            {acceptedMeetupSuggestions ? (
                              <div className="space-y-6">
                                <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-xl p-6 border border-green-200">
                                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                                    <Star className="h-5 w-5 mr-2 text-green-600" />
                                    Personalized AI Recommendations
                                  </h4>
                                  <div className="prose prose-sm max-w-none text-gray-700">
                                    <ReactMarkdown 
                                      remarkPlugins={[remarkGfm]}
                                      components={{
                                        ul: ({ children }) => <ul className="list-disc list-inside space-y-1">{children}</ul>,
                                        li: ({ children }) => <li className="text-gray-700">{children}</li>,
                                        p: ({ children }) => <p className="text-gray-700 leading-relaxed mb-2">{children}</p>,
                                        strong: ({ children }) => <strong className="font-semibold text-gray-900">{children}</strong>
                                      }}
                                    >
                                      {acceptedMeetupSuggestions.suggestions?.ai_suggestions || 'No AI suggestions available'}
                                    </ReactMarkdown>
                                  </div>
                                </div>

                                {/* User Preferences */}
                                {acceptedMeetupSuggestions.suggestions?.user1_preferences && acceptedMeetupSuggestions.suggestions?.user2_preferences && (
                                  <div className="bg-white rounded-xl p-6 border border-gray-200">
                                    <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                                      <Users className="h-5 w-5 mr-2 text-blue-600" />
                                      Meetup Participants
                                    </h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                      <div className="bg-blue-50 rounded-lg p-4">
                                        <h5 className="font-medium text-blue-900 mb-2">{acceptedMeetupSuggestions.suggestions.user1_preferences.name}</h5>
                                        <p className="text-sm text-blue-700 mb-1">Travel Style: {acceptedMeetupSuggestions.suggestions.user1_preferences.travel_style}</p>
                                        <div className="flex flex-wrap gap-1">
                                          {acceptedMeetupSuggestions.suggestions.user1_preferences.interests?.map((interest, idx) => (
                                            <span key={idx} className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                                              {interest}
                                            </span>
                                          ))}
                                        </div>
                                      </div>
                                      <div className="bg-green-50 rounded-lg p-4">
                                        <h5 className="font-medium text-green-900 mb-2">{acceptedMeetupSuggestions.suggestions.user2_preferences.name}</h5>
                                        <p className="text-sm text-green-700 mb-1">Travel Style: {acceptedMeetupSuggestions.suggestions.user2_preferences.travel_style}</p>
                                        <div className="flex flex-wrap gap-1">
                                          {acceptedMeetupSuggestions.suggestions.user2_preferences.interests?.map((interest, idx) => (
                                            <span key={idx} className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
                                              {interest}
                                            </span>
                                          ))}
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                )}

                                {/* Common Interests */}
                                {acceptedMeetupSuggestions.suggestions?.common_interests && acceptedMeetupSuggestions.suggestions?.common_interests.length > 0 && (
                                  <div className="bg-white rounded-xl p-6 border border-gray-200">
                                    <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                                      <Heart className="h-5 w-5 mr-2 text-red-600" />
                                      Common Interests
                                    </h4>
                                    <div className="flex flex-wrap gap-2">
                                      {acceptedMeetupSuggestions.suggestions.common_interests.map((interest, index) => (
                                        <span
                                          key={index}
                                          className="px-3 py-1 bg-red-100 text-red-700 text-sm rounded-full"
                                        >
                                          {interest}
                                        </span>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                {/* Suggested Activities */}
                                {acceptedMeetupSuggestions.suggestions?.suggested_activities && (
                                  <div className="bg-white rounded-xl p-6 border border-gray-200">
                                    <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                                      <Activity className="h-5 w-5 mr-2 text-green-600" />
                                      Suggested Activities
                                    </h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                      {acceptedMeetupSuggestions.suggestions.suggested_activities.map((activity, index) => (
                                        <div key={index} className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
                                          <Activity className="h-5 w-5 text-green-600" />
                                          <span className="text-gray-700">{activity}</span>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                {/* Meeting Points */}
                                {acceptedMeetupSuggestions.suggestions?.meeting_points && (
                                  <div className="bg-white rounded-xl p-6 border border-gray-200">
                                    <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                                      <MapPin className="h-5 w-5 mr-2 text-blue-600" />
                                      Meeting Points
                                    </h4>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                      {acceptedMeetupSuggestions.suggestions.meeting_points.map((point, index) => (
                                        <div key={index} className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg">
                                          <MapPin className="h-5 w-5 text-blue-600" />
                                          <span className="text-gray-700">{point}</span>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                {/* Transport Options */}
                                {acceptedMeetupSuggestions.suggestions?.transport_options && (
                                  <div className="bg-white rounded-xl p-6 border border-gray-200">
                                    <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                                      <Navigation className="h-5 w-5 mr-2 text-orange-600" />
                                      Transport Options
                                    </h4>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                      {acceptedMeetupSuggestions.suggestions.transport_options.map((option, index) => (
                                        <div key={index} className="flex items-center space-x-3 p-3 bg-orange-50 rounded-lg">
                                          <Navigation className="h-5 w-5 text-orange-600" />
                                          <span className="text-gray-700">{option}</span>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            ) : socialData?.ai_suggestions ? (
                              <div className="space-y-6">
                                        {/* AI Suggestions */}
                                        <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl p-6 border border-purple-200">
                                          <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                                            <Star className="h-5 w-5 mr-2 text-purple-600" />
                                            AI Recommendations
                                          </h4>
                                          <div className="prose prose-sm max-w-none text-gray-700">
                                            <ReactMarkdown 
                                              remarkPlugins={[remarkGfm]}
                                              components={{
                                                ul: ({ children }) => <ul className="list-disc list-inside space-y-1">{children}</ul>,
                                                li: ({ children }) => <li className="text-gray-700">{children}</li>,
                                                p: ({ children }) => <p className="text-gray-700 leading-relaxed mb-2">{children}</p>,
                                                strong: ({ children }) => <strong className="font-semibold text-gray-900">{children}</strong>
                                              }}
                                            >
                                              {socialData?.ai_suggestions?.ai_suggestions || 'No AI suggestions available'}
                                            </ReactMarkdown>
                                          </div>
                                        </div>

                                {/* Common Interests */}
                                {socialData?.ai_suggestions?.common_interests && socialData?.ai_suggestions?.common_interests.length > 0 && (
                                  <div className="bg-white rounded-xl p-6 border border-gray-200">
                                    <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                                      <Heart className="h-5 w-5 mr-2 text-red-600" />
                                      Common Interests
                                    </h4>
                                    <div className="flex flex-wrap gap-2">
                                      {socialData?.ai_suggestions?.common_interests.map((interest, index) => (
                                        <span
                                          key={index}
                                          className="px-3 py-1 bg-red-100 text-red-700 text-sm rounded-full"
                                        >
                                          {interest}
                                        </span>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                {/* Suggested Activities */}
                                <div className="bg-white rounded-xl p-6 border border-gray-200">
                                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                                    <Activity className="h-5 w-5 mr-2 text-green-600" />
                                    Suggested Activities
                                  </h4>
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {socialData?.ai_suggestions?.suggested_activities.map((activity, index) => (
                                      <div key={index} className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
                                        <Activity className="h-5 w-5 text-green-600" />
                                        <span className="text-gray-700">{activity}</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>

                                {/* Meeting Points */}
                                <div className="bg-white rounded-xl p-6 border border-gray-200">
                                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                                    <MapPin className="h-5 w-5 mr-2 text-blue-600" />
                                    Meeting Points
                                  </h4>
                                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    {socialData?.ai_suggestions?.meeting_points.map((point, index) => (
                                      <div key={index} className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg">
                                        <MapPin className="h-5 w-5 text-blue-600" />
                                        <span className="text-gray-700">{point}</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>

                                {/* Transport Options */}
                                <div className="bg-white rounded-xl p-6 border border-gray-200">
                                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                                    <Navigation className="h-5 w-5 mr-2 text-orange-600" />
                                    Transport Options
                                  </h4>
                                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    {socialData?.ai_suggestions?.transport_options.map((option, index) => (
                                      <div key={index} className="flex items-center space-x-3 p-3 bg-orange-50 rounded-lg">
                                        <Navigation className="h-5 w-5 text-orange-600" />
                                        <span className="text-gray-700">{option}</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <div className="text-center py-12">
                                <Star className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                                <p className="text-gray-600">No AI suggestions available for {selectedTrip.destination}</p>
                              </div>
                            )}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </>
            )}
          </>
        )}
      </div>

      {/* Create Meetup Modal */}
      {showCreateMeetup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Create Meetup Request</h3>
            {targetTraveler && (
              <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-sm text-blue-700">
                  <strong>Target Traveler:</strong> {targetTraveler.name}
                </p>
                <p className="text-xs text-blue-600 mt-1">
                  Travel Style: {targetTraveler.travel_style} • Budget: ₹{targetTraveler.budget}
                </p>
              </div>
            )}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Destination</label>
                <input
                  type="text"
                  value={newMeetup.destination}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
                  readOnly
                />
                <p className="text-xs text-gray-500 mt-1">Destination is set from your selected trip</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
                <input
                  type="date"
                  value={newMeetup.date}
                  onChange={(e) => setNewMeetup({...newMeetup, date: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Activity</label>
                <input
                  type="text"
                  value={newMeetup.activity}
                  onChange={(e) => setNewMeetup({...newMeetup, activity: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., City tour, Food experience"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Max Participants</label>
                <input
                  type="number"
                  value={newMeetup.max_participants}
                  onChange={(e) => setNewMeetup({...newMeetup, max_participants: parseInt(e.target.value)})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  min="2"
                  max="10"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <textarea
                  value={newMeetup.description}
                  onChange={(e) => setNewMeetup({...newMeetup, description: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows="3"
                  placeholder="Describe your meetup idea..."
                />
              </div>
            </div>
            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowCreateMeetup(false);
                  setTargetTraveler(null);
                }}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateMeetup}
                disabled={loading}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {loading ? 'Creating...' : 'Create Meetup'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default SocialTravel;