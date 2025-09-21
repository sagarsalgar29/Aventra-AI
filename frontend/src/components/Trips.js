import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import MapIntegration from './MapIntegration';
import { API_ENDPOINTS } from '../config/api';
import { 
  Plus, 
  MapPin, 
  Calendar, 
  DollarSign, 
  Edit, 
  Trash2, 
  Eye,
  Star,
  Clock,
  Users,
  Plane
} from 'lucide-react';

function Trips() {
  const { user } = useAuth();
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newTrip, setNewTrip] = useState({
    destination: '',
    source_location: '',
    start_date: '',
    end_date: '',
    budget: '',
    currency: 'INR',
    travel_style: '',
    interests: [],
    transport_preference: '',
    category_allocations: {
      accommodation: '',
      food: '',
      transport: '',
      activities: '',
      shopping: '',
      other: ''
    },
    daily_allowance: ''
  });
  const [isFromDiscover, setIsFromDiscover] = useState(false);

  const loadTrips = async () => {
    try {
      const response = await fetch('API_ENDPOINTS.TRIPS', {
        headers: {
          'Authorization': `Bearer ${await user.getIdToken()}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setTrips(data.trips || []);
      }
    } catch (error) {
      console.error('Error loading trips:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTrips();
    
    // Check for data from Discover page
    const discoverData = localStorage.getItem('discoverTripData');
    if (discoverData) {
      try {
        const tripData = JSON.parse(discoverData);
        
        // Pre-fill the form with discover data
        setNewTrip(prevTrip => ({
          ...prevTrip,
          destination: tripData.destination || '',
          travel_style: tripData.mood || '',
          interests: tripData.interests || [],
          budget: tripData.budget || ''
        }));
        
        // Set flag to show discover indicator
        setIsFromDiscover(true);
        
        // Show the create form automatically
        setShowCreateForm(true);
        
        // Clear the discover data
        localStorage.removeItem('discoverTripData');
        
        // Show success message
        console.log('Pre-filled trip form with discover data:', tripData);
      } catch (error) {
        console.error('Error parsing discover data:', error);
      }
    }
  }, []);

  const handleCreateTrip = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('API_ENDPOINTS.TRIPS', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await user.getIdToken()}`
        },
        body: JSON.stringify(newTrip)
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Trip created successfully:', data);
        
        // If budget is set, also create budget allocation
        if (newTrip.budget && newTrip.budget > 0) {
          try {
            const budgetResponse = await fetch('API_ENDPOINTS.BUDGET_ALLOCATION', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${await user.getIdToken()}`
              },
              body: JSON.stringify({
                trip_id: data.trip_id,
                total_budget: parseFloat(newTrip.budget),
                currency: newTrip.currency,
                daily_allowance: newTrip.daily_allowance ? parseFloat(newTrip.daily_allowance) : null,
                category_allocations: Object.fromEntries(
                  Object.entries(newTrip.category_allocations).map(([key, value]) => [
                    key, 
                    value ? parseFloat(value) : 0
                  ])
                )
              })
            });
            
            if (budgetResponse.ok) {
              console.log('Budget allocation created successfully');
            }
          } catch (budgetError) {
            console.error('Error creating budget allocation:', budgetError);
          }
        }
        
        // Refresh trips list
        loadTrips();
        setShowCreateForm(false);
        setIsFromDiscover(false);
        setNewTrip({
          destination: '',
          start_date: '',
          end_date: '',
          budget: '',
          currency: 'INR',
          travel_style: '',
          interests: [],
          category_allocations: {
            accommodation: '',
            food: '',
            transport: '',
            activities: '',
            shopping: '',
            other: ''
          },
          daily_allowance: ''
        });
      } else {
        console.error('Failed to create trip');
      }
    } catch (error) {
      console.error('Error creating trip:', error);
    }
  };

  const handleDeleteTrip = async (tripId) => {
    try {
      const response = await fetch(`${API_ENDPOINTS.TRIPS}/${tripId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${await user.getIdToken()}`
        }
      });

      if (response.ok) {
        console.log('Trip deleted successfully');
        // Refresh trips list
        loadTrips();
      } else {
        console.error('Failed to delete trip');
      }
    } catch (error) {
      console.error('Error deleting trip:', error);
    }
  };

  const travelStyles = [
    { value: 'budget', label: 'Budget Travel', icon: DollarSign },
    { value: 'luxury', label: 'Luxury Travel', icon: Star },
    { value: 'adventure', label: 'Adventure', icon: Plane },
    { value: 'cultural', label: 'Cultural', icon: MapPin },
    { value: 'relaxation', label: 'Relaxation', icon: Clock }
  ];

  const interests = [
    'Food & Dining',
    'History & Culture',
    'Nature & Outdoors',
    'Nightlife',
    'Shopping',
    'Art & Museums',
    'Adventure Sports',
    'Photography',
    'Music & Entertainment',
    'Wellness & Spa'
  ];

  const currencies = [
    { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
    { code: 'USD', symbol: '$', name: 'US Dollar' },
    { code: 'EUR', symbol: '€', name: 'Euro' },
    { code: 'GBP', symbol: '£', name: 'British Pound' },
    { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
    { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar' },
    { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
    { code: 'CNY', symbol: '¥', name: 'Chinese Yuan' },
    { code: 'KRW', symbol: '₩', name: 'South Korean Won' },
    { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar' }
  ];

  const expenseCategories = [
    { id: 'accommodation', name: 'Accommodation', icon: '🏨' },
    { id: 'food', name: 'Food & Dining', icon: '🍽️' },
    { id: 'transport', name: 'Transportation', icon: '🚗' },
    { id: 'activities', name: 'Activities', icon: '🎯' },
    { id: 'shopping', name: 'Shopping', icon: '🛍️' },
    { id: 'other', name: 'Other', icon: '📝' }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Trips</h1>
          <p className="text-gray-600 mt-1">Plan and manage your travel adventures</p>
        </div>
        <button
          onClick={() => setShowCreateForm(true)}
          className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 font-medium"
        >
          <Plus className="h-5 w-5" />
          <span>New Trip</span>
        </button>
      </div>

      {/* Create Trip Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Create New Trip</h2>
                  <p className="text-gray-600 mt-1">Tell us about your travel plans</p>
                </div>
                {isFromDiscover && (
                  <div className="bg-gradient-to-r from-purple-50 to-pink-50 px-4 py-2 rounded-lg border border-purple-200">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></div>
                      <span className="text-sm font-medium text-purple-700">From Discover</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            <form onSubmit={handleCreateTrip} className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Source Location *
                  </label>
                  <input
                    type="text"
                    value={newTrip.source_location}
                    onChange={(e) => setNewTrip({...newTrip, source_location: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Where are you traveling from?"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Destination *
                  </label>
                  <input
                    type="text"
                    value={newTrip.destination}
                    onChange={(e) => setNewTrip({...newTrip, destination: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Where do you want to go?"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Transport Preference
                  </label>
                  <select
                    value={newTrip.transport_preference}
                    onChange={(e) => setNewTrip({...newTrip, transport_preference: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select transport preference</option>
                    <option value="flight">Flight</option>
                    <option value="train">Train</option>
                    <option value="bus">Bus</option>
                    <option value="car">Car</option>
                    <option value="any">Any</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Total Budget
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={newTrip.budget}
                    onChange={(e) => setNewTrip({...newTrip, budget: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="10000"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Currency
                  </label>
                  <select
                    value={newTrip.currency}
                    onChange={(e) => setNewTrip({...newTrip, currency: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {currencies.map((currency) => (
                      <option key={currency.code} value={currency.code}>
                        {currency.symbol} {currency.name} ({currency.code})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Start Date *
                  </label>
                  <input
                    type="date"
                    value={newTrip.start_date}
                    onChange={(e) => setNewTrip({...newTrip, start_date: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    End Date *
                  </label>
                  <input
                    type="date"
                    value={newTrip.end_date}
                    onChange={(e) => setNewTrip({...newTrip, end_date: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Travel Style
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {travelStyles.map((style) => (
                    <button
                      key={style.value}
                      type="button"
                      onClick={() => setNewTrip({...newTrip, travel_style: style.value})}
                      className={`flex items-center space-x-2 p-3 rounded-lg border transition-all duration-200 ${
                        newTrip.travel_style === style.value
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      <style.icon className="h-4 w-4" />
                      <span className="text-sm font-medium">{style.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Interests (select multiple)
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {interests.map((interest) => (
                    <label key={interest} className="flex items-center space-x-2 p-2 hover:bg-gray-50 rounded-lg cursor-pointer">
                      <input
                        type="checkbox"
                        checked={newTrip.interests.includes(interest)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setNewTrip({...newTrip, interests: [...newTrip.interests, interest]});
                          } else {
                            setNewTrip({...newTrip, interests: newTrip.interests.filter(i => i !== interest)});
                          }
                        }}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">{interest}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Budget Allocation Section */}
              {newTrip.budget && (
                <div className="border-t border-gray-200 pt-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <DollarSign className="h-5 w-5 mr-2 text-green-500" />
                    Budget Allocation
                  </h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Allocate your budget across different categories (optional)
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {expenseCategories.map((category) => (
                      <div key={category.id}>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          {category.icon} {category.name}
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={newTrip.category_allocations[category.id] || ''}
                          onChange={(e) => setNewTrip({
                            ...newTrip,
                            category_allocations: {
                              ...newTrip.category_allocations,
                              [category.id]: e.target.value
                            }
                          })}
                          placeholder="0"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    ))}
                  </div>

                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Daily Allowance (Optional)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={newTrip.daily_allowance}
                      onChange={(e) => setNewTrip({...newTrip, daily_allowance: e.target.value})}
                      placeholder="500"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              )}

              {/* Maps Integration */}
        {newTrip.destination && (
          <div className="border-t border-gray-200 pt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <MapPin className="h-5 w-5 mr-2 text-blue-500" />
              Location & Maps
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Explore your destination with interactive maps and nearby places
            </p>
            
            <MapIntegration 
              key={`map-${newTrip.destination}`}
              destination={newTrip.destination}
              onLocationSelect={(place) => {
                console.log('Selected place:', place);
                // You can add logic here to save selected places
              }}
            />
          </div>
        )}

              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateForm(false);
                    setIsFromDiscover(false);
                  }}
                  className="px-6 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors duration-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 font-medium"
                >
                  Create Trip
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Trips List */}
      {trips.length === 0 ? (
        <div className="text-center py-12">
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
            <MapPin className="h-8 w-8 text-white" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No trips yet</h3>
          <p className="text-gray-600 mb-6">Start planning your first adventure!</p>
          <button
            onClick={() => setShowCreateForm(true)}
            className="inline-flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 font-medium"
          >
            <Plus className="h-5 w-5" />
            <span>Create Your First Trip</span>
          </button>
        </div>
      ) : (
        <div className="flex flex-wrap gap-6 justify-start">
          {trips.map((trip) => (
            <div key={trip.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-lg transition-all duration-300 w-80 flex-shrink-0 card-overflow">
              <div className="p-6">
                <div className="flex items-start justify-between mb-4 gap-2">
                  <div className="flex items-center space-x-3 flex-1 min-w-0">
                    <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
                      <MapPin className="h-5 w-5 text-white" />
                    </div>
                    <div className="min-w-0 flex-1 overflow-hidden">
                      <h3 className="text-lg font-semibold text-gray-900 emergency-contain">{trip.destination}</h3>
                      <p className="text-sm text-gray-600 emergency-contain">{trip.travel_style}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors duration-200">
                      <Edit className="h-4 w-4" />
                    </button>
                    <button 
                      onClick={() => handleDeleteTrip(trip.id)}
                      className="p-2 text-gray-400 hover:text-red-600 transition-colors duration-200"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <Calendar className="h-4 w-4" />
                    <span>{trip.start_date} - {trip.end_date}</span>
                  </div>
                  
                  {trip.budget && (
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <DollarSign className="h-4 w-4" />
                      <span>Budget: ${trip.budget}</span>
                    </div>
                  )}

                  {trip.interests && trip.interests.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {trip.interests.slice(0, 3).map((interest, index) => (
                        <span key={index} className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                          {interest}
                        </span>
                      ))}
                      {trip.interests.length > 3 && (
                        <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                          +{trip.interests.length - 3} more
                        </span>
                      )}
                    </div>
                  )}
                </div>

                <div className="mt-4 pt-4 border-t border-gray-200">
                  <button className="w-full flex items-center justify-center space-x-2 py-2 text-blue-600 hover:text-blue-700 font-medium transition-colors duration-200">
                    <Eye className="h-4 w-4" />
                    <span>View Details</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Trips;

