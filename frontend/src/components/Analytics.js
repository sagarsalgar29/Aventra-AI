import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { 
  BarChart3, 
  TrendingUp, 
  DollarSign, 
  MapPin, 
  Calendar, 
  Star,
  Award,
  PieChart,
  Activity,
  Target,
  Zap
} from 'lucide-react';
import toast from 'react-hot-toast';
import { API_ENDPOINTS } from '../config/api';

function Analytics() {
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState(null);
  const [selectedTrip, setSelectedTrip] = useState('');
  const [trips, setTrips] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchUserTrips();
  }, []);

  const fetchUserTrips = async () => {
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
      console.error('Error fetching trips:', error);
    }
  };

  const fetchTripAnalytics = async (tripId) => {
    if (!tripId) return;

    setIsLoading(true);
    try {
      const response = await fetch(`API_ENDPOINTS/trip-analytics/${tripId}`, {
        headers: {
          'Authorization': `Bearer ${await user.getIdToken()}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch analytics');
      }

      const data = await response.json();
      setAnalytics(data.analytics);
      toast.success('Analytics loaded successfully!');
    } catch (error) {
      console.error('Error fetching analytics:', error);
      toast.error('Failed to load trip analytics');
    } finally {
      setIsLoading(false);
    }
  };

  const getExpensePercentage = (amount, total) => {
    if (total === 0) return 0;
    return Math.round((amount / total) * 100);
  };

  const getExpenseColor = (category) => {
    const colors = {
      accommodation: 'from-blue-500 to-blue-600',
      food: 'from-green-500 to-green-600',
      activities: 'from-purple-500 to-purple-600',
      transport: 'from-orange-500 to-orange-600'
    };
    return colors[category] || 'from-gray-500 to-gray-600';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-3 rounded-full">
              <BarChart3 className="h-8 w-8 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Trip Analytics & Insights</h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Get AI-powered insights about your travel patterns, spending, and experiences
          </p>
        </div>

        {/* Trip Selection */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Calendar className="h-5 w-5 mr-2 text-blue-500" />
            Select Trip for Analytics
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {trips.map((trip) => (
              <button
                key={trip.id}
                onClick={() => {
                  setSelectedTrip(trip.id);
                  fetchTripAnalytics(trip.id);
                }}
                className={`p-4 rounded-lg border-2 transition-all duration-200 text-left ${
                  selectedTrip === trip.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                    <MapPin className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">{trip.destination}</h4>
                    <p className="text-sm text-gray-500">
                      {new Date(trip.start_date).toLocaleDateString()} - {new Date(trip.end_date).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Analytics Display */}
        {isLoading ? (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center">
            <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Loading analytics...</p>
          </div>
        ) : analytics ? (
          <div className="space-y-6">
            {/* Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Spent</p>
                    <p className="text-2xl font-bold text-gray-900">${analytics.total_spent}</p>
                  </div>
                  <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-green-600 rounded-full flex items-center justify-center">
                    <DollarSign className="h-6 w-6 text-white" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Trip Duration</p>
                    <p className="text-2xl font-bold text-gray-900">{analytics.duration_days} days</p>
                  </div>
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                    <Calendar className="h-6 w-6 text-white" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Daily Average</p>
                    <p className="text-2xl font-bold text-gray-900">
                      ${Math.round(analytics.total_spent / analytics.duration_days)}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-purple-600 rounded-full flex items-center justify-center">
                    <TrendingUp className="h-6 w-6 text-white" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Badges Earned</p>
                    <p className="text-2xl font-bold text-gray-900">{analytics.badges_earned?.length || 0}</p>
                  </div>
                  <div className="w-12 h-12 bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-full flex items-center justify-center">
                    <Award className="h-6 w-6 text-white" />
                  </div>
                </div>
              </div>
            </div>

            {/* Expense Breakdown */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
                <PieChart className="h-5 w-5 mr-2 text-green-500" />
                Expense Breakdown
              </h3>
              <div className="space-y-4">
                {Object.entries(analytics.expense_breakdown).map(([category, amount]) => (
                  <div key={category} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`w-4 h-4 bg-gradient-to-r ${getExpenseColor(category)} rounded-full`}></div>
                      <span className="font-medium text-gray-700 capitalize">{category}</span>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="w-32 bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 bg-gradient-to-r ${getExpenseColor(category)} rounded-full`}
                          style={{ width: `${getExpensePercentage(amount, analytics.total_spent)}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-semibold text-gray-900 w-16 text-right">
                        ${amount}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* AI Insights */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
                <Zap className="h-5 w-5 mr-2 text-yellow-500" />
                AI-Powered Insights
              </h3>
              <div className="space-y-4">
                {analytics.insights?.map((insight, index) => (
                  <div key={index} className="flex items-start space-x-3 p-4 bg-blue-50 rounded-lg">
                    <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-white text-xs font-bold">{index + 1}</span>
                    </div>
                    <p className="text-gray-700">{insight}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Badges Earned */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
                <Award className="h-5 w-5 mr-2 text-yellow-500" />
                Badges Earned
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {analytics.badges_earned?.map((badge, index) => (
                  <div key={index} className="flex items-center space-x-3 p-4 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg border border-yellow-200">
                    <div className="w-10 h-10 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full flex items-center justify-center">
                      <Award className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">{badge}</h4>
                      <p className="text-sm text-gray-600">Achievement unlocked!</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center">
            <div className="w-16 h-16 bg-gradient-to-r from-gray-400 to-gray-500 rounded-full mx-auto mb-4 flex items-center justify-center">
              <BarChart3 className="h-8 w-8 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Analytics Available</h3>
            <p className="text-gray-500">
              Select a trip from above to view detailed analytics and insights
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default Analytics;
