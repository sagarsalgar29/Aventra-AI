import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { API_ENDPOINTS } from '../config/api';
import { 
  Star, 
  Users, 
  MessageSquare, 
  Calendar, 
  CheckCircle, 
  XCircle, 
  Building, 
  TrendingUp, 
  DollarSign, 
  Clock,
  MapPin,
  Phone,
  Mail,
  Settings,
  BarChart3,
  Award,
  Shield
} from 'lucide-react';
import { toast } from 'react-hot-toast';

function HotelDashboard() {
  const { user } = useAuth();
  const [hotelData, setHotelData] = useState(null);
  const [customers, setCustomers] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [ratingForm, setRatingForm] = useState({
    customer_id: '',
    customer_name: '',
    booking_id: '',
    rating: 5,
    comment: '',
    punctuality: 5,
    communication: 5,
    cleanliness: 5,
    respectfulness: 5,
    payment_behavior: 5,
    tags: []
  });

  useEffect(() => {
    fetchHotelData();
    fetchCustomers();
  }, []);

  const fetchHotelData = async () => {
    try {
      const response = await fetch(API_ENDPOINTS.HOTEL_PROFILE, {
        headers: {
          'Authorization': `Bearer ${await user.getIdToken()}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setHotelData(data);
      }
    } catch (error) {
      console.error('Error fetching hotel data:', error);
    }
  };

  const fetchCustomers = async () => {
    try {
      const response = await fetch(API_ENDPOINTS.HOTEL_CUSTOMERS, {
        headers: {
          'Authorization': `Bearer ${await user.getIdToken()}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setCustomers(data.customers || []);
      }
    } catch (error) {
      console.error('Error fetching customers:', error);
      toast.error('Failed to fetch customers');
    }
  };

  const handleRateCustomer = async (customer) => {
    setSelectedCustomer(customer);
    setRatingForm({
      customer_id: customer.id,
      customer_name: customer.name,
      booking_id: customer.booking_id || '',
      rating: 5,
      comment: '',
      punctuality: 5,
      communication: 5,
      cleanliness: 5,
      respectfulness: 5,
      payment_behavior: 5,
      tags: []
    });
  };

  const handleSubmitRating = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch('http://localhost:8000/hotel-rate-customer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await user.getIdToken()}`
        },
        body: JSON.stringify(ratingForm)
      });

      if (response.ok) {
        toast.success('Customer rated successfully!');
        setSelectedCustomer(null);
        fetchCustomers(); // Refresh the list
      } else {
        throw new Error('Failed to rate customer');
      }
    } catch (error) {
      console.error('Error rating customer:', error);
      toast.error('Failed to rate customer');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setRatingForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const renderStars = (value, onChange) => {
    return (
      <div className="flex space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            className={`text-2xl ${
              star <= value ? 'text-yellow-400' : 'text-gray-300'
            } hover:text-yellow-400 transition-colors`}
          >
            ★
          </button>
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <div className="max-w-7xl mx-auto p-6">
        {/* Hotel Header */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <div className="w-20 h-20 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center">
                <Building className="h-10 w-10 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  {hotelData?.hotel_name || 'Your Hotel'}
                </h1>
                <p className="text-gray-600 flex items-center mt-2">
                  <MapPin className="h-4 w-4 mr-2" />
                  {hotelData?.location || 'Hotel Location'}
                </p>
                <div className="flex items-center space-x-4 mt-3">
                  <div className="flex items-center text-sm text-gray-600">
                    <Star className="h-4 w-4 mr-1 text-yellow-500" />
                    {hotelData?.rating || '4.5'} • {hotelData?.reviews_count || '0'} reviews
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <Shield className="h-4 w-4 mr-1 text-green-500" />
                    Verified Partner
                  </div>
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-green-600">
                ₹{hotelData?.revenue || '0'}
              </div>
              <div className="text-sm text-gray-600">This Month</div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-white rounded-xl shadow-sm p-2 mb-8">
          <div className="flex space-x-1">
            {[
              { id: 'overview', name: 'Overview', icon: BarChart3 },
              { id: 'customers', name: 'Customers', icon: Users },
              { id: 'ratings', name: 'Rate Customers', icon: Star },
              { id: 'analytics', name: 'Analytics', icon: TrendingUp },
              { id: 'settings', name: 'Settings', icon: Settings }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex items-center justify-center py-3 px-4 rounded-lg transition-all duration-200 ${
                  activeTab === tab.id
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <tab.icon className="h-5 w-5 mr-2" />
                {tab.name}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Bookings</p>
                  <p className="text-2xl font-bold text-gray-900">{hotelData?.total_bookings || '0'}</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Calendar className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Revenue</p>
                  <p className="text-2xl font-bold text-gray-900">₹{hotelData?.revenue || '0'}</p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <DollarSign className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Average Rating</p>
                  <p className="text-2xl font-bold text-gray-900">{hotelData?.rating || '4.5'}</p>
                </div>
                <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <Star className="h-6 w-6 text-yellow-600" />
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Occupancy Rate</p>
                  <p className="text-2xl font-bold text-gray-900">{hotelData?.occupancy_rate || '85'}%</p>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'customers' && (
          <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
              <Users className="h-6 w-6 mr-2" />
              Recent Customers
            </h2>
            
            {customers.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {customers.map((customer) => (
                  <div key={customer.id} className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">{customer.name}</h3>
                        <p className="text-sm text-gray-600">Booking: {customer.booking_id}</p>
                        <p className="text-sm text-gray-500">
                          Stay: {customer.check_in} - {customer.check_out}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        {customer.rated ? (
                          <span className="flex items-center text-green-600 text-sm">
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Rated
                          </span>
                        ) : (
                          <span className="flex items-center text-orange-600 text-sm">
                            <XCircle className="h-4 w-4 mr-1" />
                            Pending
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <div className="space-y-2 mb-4">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Room Type:</span>
                        <span className="font-medium">{customer.room_type}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Total Amount:</span>
                        <span className="font-medium">{customer.currency} {customer.amount}</span>
                      </div>
                    </div>
                    
                    <button
                      onClick={() => handleRateCustomer(customer)}
                      disabled={customer.rated}
                      className={`w-full py-2 px-4 rounded-lg font-medium transition-all duration-200 ${
                        customer.rated
                          ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                          : 'bg-gradient-to-r from-orange-500 to-red-500 text-white hover:from-orange-600 hover:to-red-600'
                      }`}
                    >
                      {customer.rated ? 'Already Rated' : 'Rate Customer'}
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-200 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <Users className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Customers Yet</h3>
                <p className="text-gray-500">Customer ratings will appear here after bookings</p>
              </div>
            )}
          </div>
        )}

        {/* Rating Modal */}
        {selectedCustomer && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-2xl font-bold text-gray-900">Rate Customer</h3>
                  <button
                    onClick={() => setSelectedCustomer(null)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    ✕
                  </button>
                </div>

                <form onSubmit={handleSubmitRating} className="space-y-6">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-semibold text-gray-900 mb-2">{selectedCustomer.name}</h4>
                    <p className="text-sm text-gray-600">Booking ID: {selectedCustomer.booking_id}</p>
                  </div>

                  {/* Overall Rating */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Overall Rating
                    </label>
                    {renderStars(ratingForm.rating, (value) => handleInputChange('rating', value))}
                  </div>

                  {/* Detailed Ratings */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Punctuality
                      </label>
                      {renderStars(ratingForm.punctuality, (value) => handleInputChange('punctuality', value))}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Communication
                      </label>
                      {renderStars(ratingForm.communication, (value) => handleInputChange('communication', value))}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Cleanliness
                      </label>
                      {renderStars(ratingForm.cleanliness, (value) => handleInputChange('cleanliness', value))}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Respectfulness
                      </label>
                      {renderStars(ratingForm.respectfulness, (value) => handleInputChange('respectfulness', value))}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Payment Behavior
                      </label>
                      {renderStars(ratingForm.payment_behavior, (value) => handleInputChange('payment_behavior', value))}
                    </div>
                  </div>

                  {/* Comment */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Comments
                    </label>
                    <textarea
                      value={ratingForm.comment}
                      onChange={(e) => handleInputChange('comment', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                      rows={3}
                      placeholder="Share your experience with this customer..."
                    />
                  </div>

                  {/* Submit Button */}
                  <div className="flex space-x-4">
                    <button
                      type="button"
                      onClick={() => setSelectedCustomer(null)}
                      className="flex-1 py-3 px-4 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all duration-200"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="flex-1 py-3 px-4 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-lg hover:from-orange-600 hover:to-red-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isLoading ? 'Submitting...' : 'Submit Rating'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default HotelDashboard;