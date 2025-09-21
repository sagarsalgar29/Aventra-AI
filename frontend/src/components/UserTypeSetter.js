import React, { useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { API_ENDPOINTS } from '../config/api';

function UserTypeSetter() {
  const { user } = useAuth();

  useEffect(() => {
    const setUserType = async () => {
      if (user) {
        const pendingUserType = localStorage.getItem('pendingUserType');
        console.log('Pending user type:', pendingUserType);
        console.log('Current user:', user.email);
        
        // Always ensure user profile exists
        try {
          const response = await fetch(API_ENDPOINTS.PROFILE, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${await user.getIdToken()}`
            },
            body: JSON.stringify({
              user_type: pendingUserType || 'traveler',
              name: user.displayName || user.email.split('@')[0],
              email: user.email,
              travel_style: 'cultural',
              interests: ['photography', 'nature', 'food'],
              budget_preference: 'mid-range'
            })
          });
          
          if (response.ok) {
            console.log(`✅ User profile created/updated for: ${user.email}`);
            if (pendingUserType) {
              localStorage.removeItem('pendingUserType');
            }
          } else {
            console.error('❌ Failed to set user profile:', response.status);
            const errorText = await response.text();
            console.error('Error details:', errorText);
          }
        } catch (error) {
          console.error('❌ Error setting user profile:', error);
        }
      }
    };

    setUserType();
  }, [user]);

  return null; // This component doesn't render anything
}

export default UserTypeSetter;
