import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { API_ENDPOINTS } from '../config/api';

function UserRouter() {
  const { user } = useAuth();
  const [userType, setUserType] = useState('traveler');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkUserType = async () => {
      try {
        const response = await fetch(API_ENDPOINTS.PROFILE, {
          headers: {
            'Authorization': `Bearer ${await user.getIdToken()}`
          }
        });
        if (response.ok) {
          const data = await response.json();
          console.log('Profile data:', data);
          console.log('User type from profile:', data.user_type);
          setUserType(data.user_type || 'traveler');
        } else {
          console.log('Profile endpoint failed, defaulting to traveler');
          // If profile endpoint doesn't exist, default to traveler
          setUserType('traveler');
        }
      } catch (error) {
        console.error('Error checking user type:', error);
        // Default to traveler if there's an error
        setUserType('traveler');
      } finally {
        setLoading(false);
      }
    };
    
    if (user) {
      checkUserType();
    } else {
      setLoading(false);
    }
  }, [user]);

  if (loading) {
    return <div>Loading...</div>;
  }

  console.log('Current user type:', userType);
  console.log('Redirecting based on user type...');

  // Redirect based on user type
  if (userType === 'hotel') {
    console.log('Redirecting to hotel dashboard');
    return <Navigate to="/hotel-dashboard" />;
  } else {
    console.log('Redirecting to traveler dashboard');
    return <Navigate to="/dashboard" />;
  }
}

export default UserRouter;
