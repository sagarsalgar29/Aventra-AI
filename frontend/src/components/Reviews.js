import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { 
  Star, 
  MapPin, 
  Utensils, 
  Building, 
  Activity, 
  Plus,
  ThumbsUp,
  ThumbsDown,
  MessageCircle,
  Shield,
  TrendingUp
} from 'lucide-react';
import toast from 'react-hot-toast';
import { API_ENDPOINTS } from '../config/api';

function Reviews() {
  const { user } = useAuth();
  const [reviews, setReviews] = useState([]);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [selectedEntityType, setSelectedEntityType] = useState('hotel');
  const [newReview, setNewReview] = useState({
    entity_id: '',
    entity_type: 'hotel',
    rating: 5,
    comment: '',
    tags: []
  });
  const [trustScore, setTrustScore] = useState(null);

  const entityTypes = [
    { id: 'hotel', name: 'Hotels', icon: Building, color: 'from-blue-500 to-blue-600' },
    { id: 'restaurant', name: 'Restaurants', icon: Utensils, color: 'from-green-500 to-green-600' },
    { id: 'activity', name: 'Activities', icon: Activity, color: 'from-purple-500 to-purple-600' }
  ];

  const reviewTags = [
    'Excellent Service', 'Great Location', 'Good Value', 'Clean & Comfortable',
    'Friendly Staff', 'Amazing Food', 'Beautiful Views', 'Family Friendly',
    'Romantic', 'Adventure', 'Cultural Experience', 'Budget Friendly'
  ];

  useEffect(() => {
    fetchTrustScore();
  }, []);

  const fetchTrustScore = async () => {
    try {
      const response = await fetch(`API_ENDPOINTS/trust-score/${user.uid}`, {
        headers: {
          'Authorization': `Bearer ${await user.getIdToken()}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setTrustScore(data.trust_score);
      }
    } catch (error) {
      console.error('Error fetching trust score:', error);
    }
  };

  const handleTagToggle = (tag) => {
    setNewReview(prev => ({
      ...prev,
      tags: prev.tags.includes(tag)
        ? prev.tags.filter(t => t !== tag)
        : [...prev.tags, tag]
    }));
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    
    if (!newReview.entity_id.trim() || !newReview.comment.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      const response = await fetch('API_ENDPOINTS.REVIEWS', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await user.getIdToken()}`
        },
        body: JSON.stringify(newReview)
      });

      if (!response.ok) {
        throw new Error('Failed to submit review');
      }

      toast.success('Review submitted successfully!');
      setNewReview({
        entity_id: '',
        entity_type: 'hotel',
        rating: 5,
        comment: '',
        tags: []
      });
      setShowReviewForm(false);
    } catch (error) {
      console.error('Error submitting review:', error);
      toast.error('Failed to submit review');
    }
  };

  const renderStars = (rating, interactive = false, onRatingChange = null) => {
    return (
      <div className="flex space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            onClick={interactive ? () => onRatingChange(star) : undefined}
            className={`${interactive ? 'cursor-pointer' : 'cursor-default'}`}
          >
            <Star
              className={`h-5 w-5 ${
                star <= rating
                  ? 'text-yellow-400 fill-current'
                  : 'text-gray-300'
              }`}
            />
          </button>
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-yellow-50 to-orange-100">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-6">
            <div className="bg-gradient-to-r from-yellow-500 to-orange-500 p-4 rounded-2xl shadow-lg">
              <Star className="h-10 w-10 text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Reviews & Ratings</h1>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Share your experiences and discover trusted recommendations from fellow travelers. 
            Rate hotels, restaurants, and activities to help others make informed decisions.
          </p>
        </div>

        {/* Trust Score */}
        {trustScore && (
          <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-blue-500 rounded-full flex items-center justify-center">
                  <Shield className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Your Trust Score</h3>
                  <p className="text-sm text-gray-600">Based on your review quality and community participation</p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-gray-900">
                  {Math.round(trustScore.trust_score * 100)}%
                </div>
                <div className="flex items-center space-x-1 text-sm text-green-600">
                  <TrendingUp className="h-4 w-4" />
                  <span>Excellent</span>
                </div>
              </div>
            </div>
            <div className="mt-4">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-gradient-to-r from-green-500 to-blue-500 h-2 rounded-full"
                  style={{ width: `${trustScore.trust_score * 100}%` }}
                ></div>
              </div>
              <div className="mt-2 text-sm text-gray-600">
                <p className="font-medium mb-1">Trust factors:</p>
                <ul className="list-disc list-inside space-y-1">
                  {trustScore.factors?.map((factor, index) => (
                    <li key={index}>{factor}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Review Form */}
        {showReviewForm ? (
          <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
              <Plus className="h-5 w-5 mr-2 text-blue-500" />
              Write a Review
            </h3>
            
            <form onSubmit={handleSubmitReview} className="space-y-6">
              {/* Entity Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  What are you reviewing?
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {entityTypes.map((type) => (
                    <button
                      key={type.id}
                      type="button"
                      onClick={() => {
                        setNewReview(prev => ({ ...prev, entity_type: type.id }));
                        setSelectedEntityType(type.id);
                      }}
                      className={`p-3 rounded-lg border-2 transition-all duration-200 ${
                        newReview.entity_type === type.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <type.icon className="h-6 w-6 mx-auto mb-1 text-gray-600" />
                      <p className="text-sm font-medium text-gray-700">{type.name}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Entity ID */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {newReview.entity_type === 'hotel' ? 'Hotel Name' : 
                   newReview.entity_type === 'restaurant' ? 'Restaurant Name' : 
                   'Activity Name'}
                </label>
                <input
                  type="text"
                  value={newReview.entity_id}
                  onChange={(e) => setNewReview(prev => ({ ...prev, entity_id: e.target.value }))}
                  placeholder={`Enter ${newReview.entity_type} name`}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              {/* Rating */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Rating
                </label>
                {renderStars(newReview.rating, true, (rating) => 
                  setNewReview(prev => ({ ...prev, rating }))
                )}
              </div>

              {/* Comment */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Your Review
                </label>
                <textarea
                  value={newReview.comment}
                  onChange={(e) => setNewReview(prev => ({ ...prev, comment: e.target.value }))}
                  placeholder="Share your experience..."
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              {/* Tags */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tags (optional)
                </label>
                <div className="flex flex-wrap gap-2">
                  {reviewTags.map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => handleTagToggle(tag)}
                      className={`px-3 py-1 rounded-full text-sm transition-all duration-200 ${
                        newReview.tags.includes(tag)
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex space-x-4">
                <button
                  type="submit"
                  className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-200"
                >
                  Submit Review
                </button>
                <button
                  type="button"
                  onClick={() => setShowReviewForm(false)}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-all duration-200"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        ) : (
          <div className="text-center mb-6">
            <button
              onClick={() => setShowReviewForm(true)}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-200 flex items-center space-x-2 mx-auto"
            >
              <Plus className="h-4 w-4" />
              <span>Write a Review</span>
            </button>
          </div>
        )}

        {/* Reviews List */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
            <MessageCircle className="h-5 w-5 mr-2 text-blue-500" />
            Recent Reviews
          </h3>
          
          {reviews.length > 0 ? (
            <div className="space-y-4">
              {reviews.map((review, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                        <span className="text-white font-bold">
                          {user?.email?.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900">{review.entity_id}</h4>
                        <p className="text-sm text-gray-500 capitalize">{review.entity_type}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      {renderStars(review.rating)}
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(review.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <p className="text-gray-700 mb-3">{review.comment}</p>
                  {review.tags && review.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {review.tags.map((tag, tagIndex) => (
                        <span key={tagIndex} className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gradient-to-r from-gray-400 to-gray-500 rounded-full mx-auto mb-4 flex items-center justify-center">
                <Star className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Reviews Yet</h3>
              <p className="text-gray-500 mb-4">
                Start sharing your travel experiences to help other travelers
              </p>
              <button
                onClick={() => setShowReviewForm(true)}
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-200 flex items-center space-x-2 mx-auto"
              >
                <Plus className="h-4 w-4" />
                <span>Write Your First Review</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Reviews;
