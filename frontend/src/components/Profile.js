import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { 
  User, 
  Mail, 
  MapPin, 
  Heart, 
  Star, 
  Plane, 
  Camera, 
  Music, 
  Utensils,
  Save,
  Edit,
  Check,
  DollarSign
} from 'lucide-react';

function Profile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState({
    name: user?.displayName || '',
    email: user?.email || '',
    bio: '',
    location: '',
    travel_style: '',
    interests: [],
    budget_range: '',
    favorite_destinations: []
  });
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);

  const travelStyles = [
    { value: 'budget', label: 'Budget Traveler', icon: DollarSign, color: 'green' },
    { value: 'luxury', label: 'Luxury Traveler', icon: Star, color: 'yellow' },
    { value: 'adventure', label: 'Adventure Seeker', icon: Plane, color: 'blue' },
    { value: 'cultural', label: 'Culture Enthusiast', icon: MapPin, color: 'purple' },
    { value: 'relaxation', label: 'Relaxation Lover', icon: Heart, color: 'pink' }
  ];

  const interests = [
    { value: 'food', label: 'Food & Dining', icon: Utensils, color: 'orange' },
    { value: 'photography', label: 'Photography', icon: Camera, color: 'blue' },
    { value: 'music', label: 'Music & Entertainment', icon: Music, color: 'purple' },
    { value: 'nature', label: 'Nature & Outdoors', icon: MapPin, color: 'green' },
    { value: 'history', label: 'History & Culture', icon: Star, color: 'yellow' },
    { value: 'nightlife', label: 'Nightlife', icon: Heart, color: 'pink' }
  ];

  const budgetRanges = [
    { value: 'budget', label: 'Budget ($0-100/day)' },
    { value: 'mid-range', label: 'Mid-range ($100-300/day)' },
    { value: 'luxury', label: 'Luxury ($300+/day)' }
  ];

  const handleSave = async () => {
    setLoading(true);
    try {
      // Here you would call the API to save the profile
      console.log('Saving profile:', profile);
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
      setIsEditing(false);
    } catch (error) {
      console.error('Error saving profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInterestToggle = (interest) => {
    setProfile(prev => ({
      ...prev,
      interests: prev.interests.includes(interest)
        ? prev.interests.filter(i => i !== interest)
        : [...prev.interests, interest]
    }));
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Profile Settings</h1>
            <p className="text-gray-600 mt-1">Customize your travel preferences</p>
          </div>
          <button
            onClick={() => setIsEditing(!isEditing)}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
              isEditing
                ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                : 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700'
            }`}
          >
            {isEditing ? (
              <>
                <Check className="h-4 w-4" />
                <span>Done</span>
              </>
            ) : (
              <>
                <Edit className="h-4 w-4" />
                <span>Edit Profile</span>
              </>
            )}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Profile Info */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="text-center">
              <div className="w-24 h-24 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-white text-2xl font-bold">
                  {profile.name.charAt(0).toUpperCase()}
                </span>
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-1">{profile.name}</h2>
              <p className="text-gray-600 mb-4">{profile.email}</p>
              
              {profile.bio && (
                <p className="text-sm text-gray-700 mb-4">{profile.bio}</p>
              )}
              
              {profile.location && (
                <div className="flex items-center justify-center space-x-2 text-sm text-gray-600">
                  <MapPin className="h-4 w-4" />
                  <span>{profile.location}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Profile Form */}
        <div className="lg:col-span-2">
          <div className="space-y-6">
            {/* Basic Info */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={profile.name}
                    onChange={(e) => setProfile({...profile, name: e.target.value})}
                    disabled={!isEditing}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Bio
                  </label>
                  <textarea
                    value={profile.bio}
                    onChange={(e) => setProfile({...profile, bio: e.target.value})}
                    disabled={!isEditing}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
                    placeholder="Tell us about yourself..."
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Location
                  </label>
                  <input
                    type="text"
                    value={profile.location}
                    onChange={(e) => setProfile({...profile, location: e.target.value})}
                    disabled={!isEditing}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
                    placeholder="Where are you based?"
                  />
                </div>
              </div>
            </div>

            {/* Travel Preferences */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Travel Preferences</h3>
              
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Travel Style
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {travelStyles.map((style) => (
                    <button
                      key={style.value}
                      type="button"
                      onClick={() => setProfile({...profile, travel_style: style.value})}
                      disabled={!isEditing}
                      className={`flex items-center space-x-3 p-3 rounded-lg border transition-all duration-200 ${
                        profile.travel_style === style.value
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-300 hover:border-gray-400'
                      } ${!isEditing ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
                    >
                      <style.icon className={`h-5 w-5 text-${style.color}-600`} />
                      <span className="font-medium">{style.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Budget Range
                </label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {budgetRanges.map((range) => (
                    <button
                      key={range.value}
                      type="button"
                      onClick={() => setProfile({...profile, budget_range: range.value})}
                      disabled={!isEditing}
                      className={`p-3 rounded-lg border transition-all duration-200 ${
                        profile.budget_range === range.value
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-300 hover:border-gray-400'
                      } ${!isEditing ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
                    >
                      <span className="font-medium">{range.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Interests
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {interests.map((interest) => (
                    <button
                      key={interest.value}
                      type="button"
                      onClick={() => handleInterestToggle(interest.value)}
                      disabled={!isEditing}
                      className={`flex items-center space-x-2 p-3 rounded-lg border transition-all duration-200 ${
                        profile.interests.includes(interest.value)
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-300 hover:border-gray-400'
                      } ${!isEditing ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
                    >
                      <interest.icon className={`h-4 w-4 text-${interest.color}-600`} />
                      <span className="text-sm font-medium">{interest.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Save Button */}
            {isEditing && (
              <div className="flex justify-end">
                <button
                  onClick={handleSave}
                  disabled={loading}
                  className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      <span>Save Changes</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Profile;

