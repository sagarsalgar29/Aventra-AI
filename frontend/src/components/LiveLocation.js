import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import MapIntegration from './MapIntegration';
import { 
  MapPin, 
  Users, 
  Clock, 
  AlertTriangle, 
  CheckCircle,
  Navigation,
  Camera,
  Star,
  Bell,
  X
} from 'lucide-react';
import toast from 'react-hot-toast';
import { API_ENDPOINTS } from '../config/api';

function LiveLocation() {
  const { user } = useAuth();
  const [currentLocation, setCurrentLocation] = useState(null);
  const [locationAlert, setLocationAlert] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [watchId, setWatchId] = useState(null);
  const [currentLocationName, setCurrentLocationName] = useState('');
  const [showNotification, setShowNotification] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState('');

  useEffect(() => {
    getCurrentLocation();
    return () => {
      if (watchId) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, []);

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by this browser');
      return;
    }

    setIsLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setCurrentLocation({ latitude, longitude });
        await getLocationAlert(latitude, longitude);
        setIsLoading(false);
      },
      (error) => {
        console.error('Error getting location:', error);
        toast.error('Unable to get your location');
        setIsLoading(false);
      }
    );
  };

  const getLocationAlert = async (latitude, longitude) => {
    try {
      const response = await fetch(`API_ENDPOINTS.LIVE_LOCATION-alert/${latitude}/${longitude}`, {
        headers: {
          'Authorization': `Bearer ${await user.getIdToken()}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setLocationAlert(data.alert);
        setCurrentLocationName(data.alert?.location || 'Current Location');
        
        // Show notification for crowd alerts
        if (data.alert && data.alert.crowd_level) {
          const crowdLevel = data.alert.crowd_level;
          let message = '';
          let notificationType = 'info';
          
          if (crowdLevel === 'high') {
            message = `🚨 High crowd alert at ${data.alert.location}! Wait time: ${data.alert.estimated_wait_time} minutes`;
            notificationType = 'error';
          } else if (crowdLevel === 'moderate') {
            message = `⚠️ Moderate crowd at ${data.alert.location}. Wait time: ${data.alert.estimated_wait_time} minutes`;
            notificationType = 'warning';
          } else if (crowdLevel === 'low') {
            message = `✅ Low crowd at ${data.alert.location}. Good time to visit!`;
            notificationType = 'success';
          }
          
          if (message) {
            setNotificationMessage(message);
            setShowNotification(true);
            
            // Show toast notification
            if (notificationType === 'error') {
              toast.error(message);
            } else if (notificationType === 'warning') {
              toast(message, { icon: '⚠️' });
            } else if (notificationType === 'success') {
              toast.success(message);
            }
            
            // Auto-hide notification after 10 seconds
            setTimeout(() => {
              setShowNotification(false);
            }, 10000);
          }
        }
      }
    } catch (error) {
      console.error('Error getting location alert:', error);
    }
  };

  const getDirectionsToPlace = (placeName) => {
    console.log('Getting directions to:', placeName);
    
    // Use Google Maps URL (more reliable than API)
    const directionsUrl = `https://www.google.com/maps/dir/${currentLocation.latitude},${currentLocation.longitude}/${encodeURIComponent(placeName)}`;
    window.open(directionsUrl, '_blank');
    toast.success(`Opening directions to ${placeName}`);
  };

  const getCrowdLevelColor = (level) => {
    switch (level) {
      case 'low': return 'text-green-600 bg-green-100';
      case 'moderate': return 'text-yellow-600 bg-yellow-100';
      case 'high': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getCrowdLevelIcon = (level) => {
    switch (level) {
      case 'low': return <CheckCircle className="h-5 w-5" />;
      case 'moderate': return <Users className="h-5 w-5" />;
      case 'high': return <AlertTriangle className="h-5 w-5" />;
      default: return <Users className="h-5 w-5" />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Crowd Alert Notification */}
      {showNotification && (
        <div className="fixed top-4 right-4 z-50 max-w-md">
          <div className="bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden animate-in slide-in-from-right duration-300">
            <div className="bg-gradient-to-r from-red-50 to-orange-50 px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="bg-red-100 p-2 rounded-lg">
                    <Bell className="h-5 w-5 text-red-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Crowd Alert</h3>
                    <p className="text-sm text-gray-600">Real-time crowd information</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowNotification(false)}
                  className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="h-4 w-4 text-gray-500" />
                </button>
              </div>
            </div>
            <div className="p-6">
              <p className="text-gray-800 leading-relaxed">{notificationMessage}</p>
              <div className="mt-4 flex space-x-3">
                <button
                  onClick={() => setShowNotification(false)}
                  className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
                >
                  Dismiss
                </button>
                <button
                  onClick={() => {
                    setShowNotification(false);
                    // Scroll to crowd level alert section
                    const alertSection = document.querySelector('[data-crowd-alert]');
                    if (alertSection) {
                      alertSection.scrollIntoView({ behavior: 'smooth' });
                    }
                  }}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                >
                  View Details
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      <div className="max-w-6xl mx-auto p-6">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-6">
            <div className="bg-gradient-to-r from-green-600 to-blue-600 p-4 rounded-2xl shadow-lg">
              <Navigation className="h-10 w-10 text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Explore & Navigate</h1>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Discover nearby places, get real-time directions, and explore your surroundings with interactive maps and AI-powered recommendations
          </p>
        </div>

        {/* Current Location Card */}
        {currentLocation && (
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden mb-8">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-8 py-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="bg-blue-100 p-3 rounded-xl">
                    <MapPin className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">Current Location</h2>
                    <p className="text-gray-600">Your precise coordinates</p>
                  </div>
                </div>
                <button
                  onClick={getCurrentLocation}
                  className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all duration-200 font-medium shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                >
                  Refresh Location
                </button>
              </div>
            </div>
            
            <div className="p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-gray-50 rounded-xl p-6">
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="bg-green-100 p-2 rounded-lg">
                      <span className="text-green-600 font-bold text-sm">LAT</span>
                    </div>
                    <p className="text-sm text-gray-600 font-medium">Latitude</p>
                  </div>
                  <p className="text-2xl font-bold text-gray-900 font-mono">{currentLocation.latitude.toFixed(6)}</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-6">
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="bg-purple-100 p-2 rounded-lg">
                      <span className="text-purple-600 font-bold text-sm">LNG</span>
                    </div>
                    <p className="text-sm text-gray-600 font-medium">Longitude</p>
                  </div>
                  <p className="text-2xl font-bold text-gray-900 font-mono">{currentLocation.longitude.toFixed(6)}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Location Alert */}
        {locationAlert && (
          <div className="space-y-6">
                {/* Crowd Level Alert */}
                <div className="bg-white rounded-xl shadow-sm p-6" data-crowd-alert>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Crowd Level Alert</h3>
                <div className={`flex items-center space-x-2 px-3 py-1 rounded-full ${getCrowdLevelColor(locationAlert.crowd_level)}`}>
                  {getCrowdLevelIcon(locationAlert.crowd_level)}
                  <span className="font-medium capitalize">{locationAlert.crowd_level}</span>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center space-x-3">
                  <Clock className="h-5 w-5 text-gray-500" />
                  <div>
                    <p className="text-sm text-gray-600">Wait Time</p>
                    <p className="font-semibold text-gray-900">{locationAlert.estimated_wait_time} min</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Star className="h-5 w-5 text-gray-500" />
                  <div>
                    <p className="text-sm text-gray-600">Best Time</p>
                    <p className="font-semibold text-gray-900">{locationAlert.best_time_to_visit}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* AI Recommendations */}
            {locationAlert.ai_recommendations && locationAlert.ai_recommendations.length > 0 && (
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <div className="w-6 h-6 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center mr-2">
                    <span className="text-white text-xs font-bold">AI</span>
                  </div>
                  Smart Recommendations
                </h3>
                <div className="space-y-2">
                  {locationAlert.ai_recommendations.map((recommendation, index) => (
                    <div key={index} className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                      <p className="text-gray-700">{recommendation}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Nearby Alternatives */}
            {locationAlert.nearby_alternatives && locationAlert.nearby_alternatives.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Nearby Alternatives</h3>
                <div className="responsive-grid">
                  {locationAlert.nearby_alternatives.map((alternative, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-all duration-200 dynamic-width overflow-hidden card-overflow">
                      <div className="flex items-start justify-between mb-2 gap-2">
                        <h4 className="font-semibold text-gray-900 emergency-contain flex-1 min-w-0">{alternative.name}</h4>
                        <div className="flex items-center space-x-1 flex-shrink-0">
                          <Star className="h-4 w-4 text-yellow-500" />
                          <span className="text-sm text-gray-600">{alternative.rating || 'N/A'}</span>
                        </div>
                      </div>
                      <p className="address-text mb-2 emergency-contain">{alternative.address}</p>
                      <button 
                        onClick={() => getDirectionsToPlace(alternative.name)}
                        className="w-full px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-200 text-sm"
                      >
                        Get Directions
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Interactive Map */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Interactive Map & Navigation</h3>
            <MapIntegration 
              key={`map-${currentLocationName || locationAlert?.location || 'current'}`}
              destination={currentLocationName || locationAlert?.location || 'Current Location'}
              onLocationSelect={(place) => {
                console.log('Selected place:', place);
                toast.success(`Selected: ${place.name}`);
              }}
            />
            </div>
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Getting your location and crowd data...</p>
          </div>
        )}

        {/* Map for Current Location (when no alert) */}
        {currentLocation && !locationAlert && (
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Explore Your Area</h3>
            <MapIntegration 
              key={`map-${currentLocation.latitude}-${currentLocation.longitude}`}
              destination={`${currentLocation.latitude},${currentLocation.longitude}`}
              onLocationSelect={(place) => {
                console.log('Selected place:', place);
                toast.success(`Selected: ${place.name}`);
              }}
            />
          </div>
        )}

        {/* No Location State */}
        {!currentLocation && !isLoading && (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center">
            <Navigation className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Enable Location Services</h3>
            <p className="text-gray-500 mb-4">
              Allow location access to explore nearby places and get directions
            </p>
            <button
              onClick={getCurrentLocation}
              className="px-6 py-3 bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-lg font-semibold hover:from-green-700 hover:to-blue-700 transition-all duration-200"
            >
              Get My Location
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default LiveLocation;
