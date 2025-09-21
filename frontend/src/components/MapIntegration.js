import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Navigation, Clock, DollarSign, Star } from 'lucide-react';

function MapIntegration({ destination, onLocationSelect }) {
  const [map, setMap] = useState(null);
  const [places, setPlaces] = useState([]);
  const [directions, setDirections] = useState(null);
  const [loading, setLoading] = useState(false);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [error, setError] = useState(null);
  const [travelTime, setTravelTime] = useState(null);
  const [mapError, setMapError] = useState(false);
  const mapRef = useRef(null);
  const directionsService = useRef(null);
  const directionsRenderer = useRef(null);

  const GOOGLE_API_KEY = "AIzaSyCT-ISk5rRd9rP6WLBBdFspUmUDNbRx9Xo";

  // Load Google Maps script
  useEffect(() => {
    if (window.google && window.google.maps) {
      setMapLoaded(true);
      return;
    }

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_API_KEY}&libraries=places`;
    script.async = true;
    script.defer = true;
    script.onload = () => {
      console.log('Google Maps script loaded successfully');
      setMapLoaded(true);
    };
    script.onerror = (error) => {
      console.error('Failed to load Google Maps script:', error);
      setError('Failed to load Google Maps');
    };
    document.head.appendChild(script);
  }, []);

  // Initialize map when ready
  useEffect(() => {
    if (mapLoaded && window.google && window.google.maps && mapRef.current && !map) {
      initializeMap();
    }
  }, [mapLoaded, destination]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (map) {
        // Clear the map instance
        if (directionsRenderer.current) {
          directionsRenderer.current.setMap(null);
        }
        setMap(null);
      }
    };
  }, [map]);

  // Handle destination changes
  useEffect(() => {
    if (map && destination) {
      geocodeDestination(destination);
    }
  }, [destination, map]);

  // Detect black screen and trigger resize
  useEffect(() => {
    if (map) {
      const checkMap = () => {
        if (mapRef.current && mapRef.current.offsetHeight > 0) {
          // Map container has height, trigger resize
          window.google.maps.event.trigger(map, 'resize');
        }
      };
      
      // Check after a delay
      const timeoutId = setTimeout(checkMap, 1000);
      
      return () => clearTimeout(timeoutId);
    }
  }, [map]);

  const initializeMap = () => {
    if (!mapRef.current || !window.google || !window.google.maps) {
      console.log('Map initialization failed - missing dependencies');
      return;
    }

    try {
      console.log('Creating Google Map...');
      const mapInstance = new window.google.maps.Map(mapRef.current, {
        zoom: 13,
        center: { lat: 18.5204, lng: 73.8567 }, // Default to Pune
        mapTypeControl: true,
        streetViewControl: true,
        fullscreenControl: true,
        zoomControl: true,
        scaleControl: true,
      });

      console.log('Map created successfully');
      setMap(mapInstance);
      
      // Initialize directions service
      directionsService.current = new window.google.maps.DirectionsService();
      directionsRenderer.current = new window.google.maps.DirectionsRenderer();
      directionsRenderer.current.setMap(mapInstance);

      // Trigger resize to prevent black screen
      setTimeout(() => {
        if (window.google && window.google.maps) {
          window.google.maps.event.trigger(mapInstance, 'resize');
        }
      }, 100);

      // Additional resize trigger after a longer delay
      setTimeout(() => {
        if (window.google && window.google.maps && mapInstance) {
          window.google.maps.event.trigger(mapInstance, 'resize');
        }
      }, 500);

      // If destination is provided, geocode it
      if (destination) {
        geocodeDestination(destination);
      }
    } catch (error) {
      console.error('Error creating map:', error);
      setError('Failed to create map');
      setMapError(true);
    }
  };

  const geocodeDestination = (address) => {
    if (!window.google || !map) {
      console.log('Geocoding not ready');
      return;
    }

    console.log('Geocoding destination:', address);
    const geocoder = new window.google.maps.Geocoder();
    
    geocoder.geocode({ address }, (results, status) => {
      console.log('Geocoding status:', status);
      if (status === 'OK' && results[0]) {
        const location = results[0].geometry.location;
        console.log('Setting map center to:', location.lat(), location.lng());
        
        map.setCenter(location);
        map.setZoom(15);
        
        // Trigger resize to prevent black screen
        setTimeout(() => {
          if (window.google && window.google.maps) {
            window.google.maps.event.trigger(map, 'resize');
          }
        }, 100);
        
        // Add marker for destination
        new window.google.maps.Marker({
          position: location,
          map: map,
          title: address,
          icon: {
            url: 'https://maps.google.com/mapfiles/ms/icons/red-dot.png'
          }
        });

        // Search for nearby places
        searchNearbyPlaces(location);
      } else {
        console.error('Geocoding failed:', status);
        setError('Could not find location: ' + address);
      }
    });
  };

  const searchNearbyPlaces = (location) => {
    if (!window.google || !map) {
      console.log('Places search not ready');
      return;
    }

    console.log('Searching nearby places...');
    const service = new window.google.maps.places.PlacesService(map);
    const request = {
      location: location,
      radius: 5000,
      type: ['restaurant', 'tourist_attraction', 'lodging', 'shopping_mall']
    };

    service.nearbySearch(request, (results, status) => {
      console.log('Places search status:', status);
      if (status === window.google.maps.places.PlacesServiceStatus.OK) {
        const limitedResults = results.slice(0, 10);
        
        // Get detailed information for each place including photos
        const placesWithDetails = limitedResults.map(place => {
          // Get place details for photos
          const detailsRequest = {
            placeId: place.place_id,
            fields: ['name', 'rating', 'vicinity', 'photos', 'place_id', 'geometry']
          };
          
          service.getDetails(detailsRequest, (placeDetails, detailsStatus) => {
            if (detailsStatus === window.google.maps.places.PlacesServiceStatus.OK) {
              // Update the place with photo information
              setPlaces(prevPlaces => {
                const updatedPlaces = prevPlaces.map(p => 
                  p.place_id === place.place_id 
                    ? { ...p, photos: placeDetails.photos, rating: placeDetails.rating || place.rating }
                    : p
                );
                return updatedPlaces;
              });
            }
          });
          
          return {
            ...place,
            photos: null // Will be updated when details are fetched
          };
        });
        
        setPlaces(placesWithDetails);
        
        // Add markers for places
        limitedResults.forEach(place => {
          new window.google.maps.Marker({
            position: place.geometry.location,
            map: map,
            title: place.name,
            icon: {
              url: 'https://maps.google.com/mapfiles/ms/icons/blue-dot.png'
            }
          });
        });
        console.log('Found', limitedResults.length, 'nearby places');
      } else {
        console.error('Places search failed:', status);
      }
    });
  };

  const getDirections = (destinationName) => {
    console.log('Getting directions to:', destinationName);
    setLoading(true);
    
    // Try to get user's current location first
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const currentLocation = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          
          // Use Google Maps URL as primary method (more reliable)
          const directionsUrl = `https://www.google.com/maps/dir/${currentLocation.lat},${currentLocation.lng}/${encodeURIComponent(destinationName)}`;
          window.open(directionsUrl, '_blank');
          setLoading(false);
        },
        (error) => {
          console.log('Geolocation error:', error);
          // Fallback to just the destination
          const directionsUrl = `https://www.google.com/maps/search/${encodeURIComponent(destinationName)}`;
          window.open(directionsUrl, '_blank');
          setLoading(false);
        }
      );
    } else {
      // No geolocation, just search for the destination
      const directionsUrl = `https://www.google.com/maps/search/${encodeURIComponent(destinationName)}`;
      window.open(directionsUrl, '_blank');
      setLoading(false);
    }
  };

  const getDistanceMatrix = (origins, destinations) => {
    if (!window.google) {
      console.log('Google Maps not available for distance matrix');
      return;
    }

    console.log('Getting travel time from:', origins, 'to:', destinations);
    const service = new window.google.maps.DistanceMatrixService();
    service.getDistanceMatrix(
      {
        origins: origins,
        destinations: destinations,
        travelMode: window.google.maps.TravelMode.DRIVING,
        unitSystem: window.google.maps.UnitSystem.METRIC,
        avoidHighways: false,
        avoidTolls: false,
      },
      (response, status) => {
        console.log('Distance Matrix response:', { status, response });
        if (status === 'OK') {
          const result = response.rows[0].elements[0];
          if (result.status === 'OK') {
            const distance = result.distance.text;
            const duration = result.duration.text;
            console.log('Travel time:', duration, 'Distance:', distance);
            
            // Store travel time for display
            setTravelTime({
              duration: duration,
              distance: distance
            });
            
            // Show travel time in a modal or alert
            alert(`Travel Time: ${duration}\nDistance: ${distance}`);
          } else {
            console.error('Distance matrix element failed:', result.status);
            alert('Could not calculate travel time. Please try again.');
          }
        } else {
          console.error('Distance matrix request failed:', status);
          alert('Could not calculate travel time. Please try again.');
        }
      }
    );
  };

  const retryMap = () => {
    setMapError(false);
    setError(null);
    setMap(null);
    setMapLoaded(false);
    
    // Force re-initialization
    setTimeout(() => {
      if (window.google && window.google.maps && mapRef.current) {
        initializeMap();
      }
    }, 100);
  };

  if (error) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-yellow-800 mb-2">Map Loading</h3>
        <p className="text-yellow-700 mb-4">{error}</p>
        <div className="space-y-3">
          <p className="text-sm text-yellow-600">
            You can still get directions by clicking the "Get Directions" buttons below.
          </p>
          <button 
            onClick={() => {
              setError(null);
              setMapLoaded(false);
              // Reload the script
              const existingScript = document.querySelector('script[src*="maps.googleapis.com"]');
              if (existingScript) {
                existingScript.remove();
              }
              loadGoogleMapsScript();
            }}
            className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700"
          >
            Retry Map
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Location Information */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 px-6 py-4 border-b border-gray-200">
          <h3 className="text-xl font-semibold text-gray-900 flex items-center">
            <MapPin className="h-6 w-6 mr-3 text-indigo-600" />
            Location Details
          </h3>
          <p className="text-sm text-gray-600 mt-1">Current destination information</p>
        </div>
        
        <div className="p-6">
          <div className="bg-gray-50 rounded-xl p-4">
            <h4 className="font-semibold text-gray-900 mb-2">Destination</h4>
            <p className="text-gray-700 emergency-contain">{destination}</p>
          </div>
        </div>
      </div>

      {/* Interactive Map */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b border-gray-200">
          <h3 className="text-xl font-semibold text-gray-900 flex items-center">
            <MapPin className="h-6 w-6 mr-3 text-blue-600" />
            Interactive Map
          </h3>
          <p className="text-sm text-gray-600 mt-1">Explore your destination with real-time maps</p>
        </div>
        
        <div className="p-6">
          {!mapLoaded ? (
            <div className="w-full h-96 rounded-xl border-2 border-dashed border-gray-300 flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent mx-auto mb-4"></div>
                <p className="text-gray-700 font-medium">Loading Google Maps...</p>
                <p className="text-sm text-gray-500 mt-1">This may take a few seconds</p>
              </div>
            </div>
          ) : (
            <div className="relative">
              <div 
                ref={mapRef} 
                className="w-full h-96 rounded-xl border border-gray-300 shadow-inner"
                style={{ minHeight: '400px' }}
              />
              {!map && (
                <div className="absolute inset-0 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl flex items-center justify-center">
                  <div className="text-center max-w-sm">
                    <MapPin className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <h4 className="text-lg font-semibold text-gray-700 mb-2">Map Loading</h4>
                    <p className="text-gray-600 mb-2">Destination: {destination}</p>
                    <button 
                      onClick={() => {
                        const directionsUrl = `https://www.google.com/maps/search/${encodeURIComponent(destination)}`;
                        window.open(directionsUrl, '_blank');
                      }}
                      className="mt-4 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-md"
                    >
                      Open in Google Maps
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Nearby Places */}
      {places.length > 0 ? (
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 px-6 py-4 border-b border-gray-200">
            <h3 className="text-xl font-semibold text-gray-900 flex items-center">
              <Star className="h-6 w-6 mr-3 text-green-600" />
              Nearby Places
            </h3>
            <p className="text-sm text-gray-600 mt-1">Discover restaurants, attractions, and more</p>
          </div>
          
          <div className="p-6">
                    <div className="responsive-grid">
                      {places.map((place) => (
                        <div key={place.place_id} className="bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-md transition-all duration-200 hover:border-blue-300 dynamic-width card-overflow">
                          {/* Place Image */}
                          {place.photos && place.photos.length > 0 ? (
                            <div className="relative h-48 w-full overflow-hidden">
                              <img
                                src={place.photos[0].getUrl({ maxWidth: 400, maxHeight: 300 })}
                                alt={place.name}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  e.target.style.display = 'none';
                                  e.target.nextSibling.style.display = 'flex';
                                }}
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
                              <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm rounded-lg px-2 py-1 flex items-center space-x-1">
                                <Star className="h-4 w-4 text-yellow-500" />
                                <span className="text-sm font-medium text-gray-900">{place.rating || 'N/A'}</span>
                              </div>
                              <div className="hidden absolute inset-0 bg-gray-200 flex items-center justify-center">
                                <MapPin className="h-12 w-12 text-gray-400" />
                              </div>
                            </div>
                          ) : (
                            <div className="h-48 w-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                              <div className="text-center">
                                <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                                <p className="text-sm text-gray-500">No image available</p>
                              </div>
                            </div>
                          )}
                          
                          <div className="p-4">
                            <div className="flex items-start justify-between mb-3 gap-2">
                              <h4 className="font-semibold text-gray-900 text-lg leading-tight emergency-contain flex-1 min-w-0">{place.name}</h4>
                              {place.rating && (
                                <div className="flex items-center bg-yellow-50 px-2 py-1 rounded-lg flex-shrink-0">
                                  <Star className="h-4 w-4 text-yellow-500 mr-1" />
                                  <span className="text-sm font-medium text-yellow-700">{place.rating}</span>
                                </div>
                              )}
                            </div>
                            
                            <p className="location-text mb-4 emergency-contain">{place.vicinity}</p>
                            
                            {place.user_ratings_total && (
                              <p className="text-xs text-gray-500 mb-4">
                                {place.user_ratings_total} reviews
                              </p>
                            )}
                            
                            <div className="flex space-x-2">
                              <button
                                onClick={() => onLocationSelect && onLocationSelect(place)}
                                className="flex-1 px-3 py-2 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium hover:bg-blue-100 transition-colors border border-blue-200"
                              >
                                Select
                              </button>
                              <button
                                onClick={() => getDirections(place.name)}
                                className="flex-1 px-3 py-2 bg-green-50 text-green-700 rounded-lg text-sm font-medium hover:bg-green-100 transition-colors border border-green-200"
                              >
                                Directions
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 px-6 py-4 border-b border-gray-200">
            <h3 className="text-xl font-semibold text-gray-900 flex items-center">
              <MapPin className="h-6 w-6 mr-3 text-purple-600" />
              Explore Destination
            </h3>
          </div>
          
          <div className="p-8 text-center">
            <MapPin className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h4 className="text-lg font-semibold text-gray-700 mb-2">No nearby places found</h4>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              We couldn't find any places near this location. Try searching in Google Maps for more options.
            </p>
            <button
              onClick={() => {
                const searchUrl = `https://www.google.com/maps/search/${encodeURIComponent(destination)}`;
                window.open(searchUrl, '_blank');
              }}
              className="px-8 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all duration-200 font-medium shadow-lg"
            >
              Search in Google Maps
            </button>
          </div>
        </div>
      )}

      {/* Travel Time Display */}
      {travelTime && (
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 px-6 py-4 border-b border-gray-200">
            <h3 className="text-xl font-semibold text-gray-900 flex items-center">
              <Clock className="h-6 w-6 mr-3 text-green-600" />
              Travel Information
            </h3>
            <p className="text-sm text-gray-600 mt-1">Real-time travel data from your location</p>
          </div>
          
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-green-50 rounded-xl p-4 text-center">
                <h4 className="font-semibold text-green-900 mb-2">Travel Time</h4>
                <p className="text-2xl font-bold text-green-600">{travelTime.duration}</p>
              </div>
              <div className="bg-blue-50 rounded-xl p-4 text-center">
                <h4 className="font-semibold text-blue-900 mb-2">Distance</h4>
                <p className="text-2xl font-bold text-blue-600">{travelTime.distance}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
        <div className="bg-gradient-to-r from-gray-50 to-slate-50 px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Quick Actions</h3>
          <p className="text-sm text-gray-600 mt-1">Navigate and explore your destination</p>
        </div>
        
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              onClick={() => getDirections(destination)}
              disabled={loading}
              className="group relative px-8 py-4 bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-xl font-semibold hover:from-green-700 hover:to-blue-700 transition-all duration-200 flex items-center justify-center space-x-3 disabled:opacity-50 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              <Navigation className="h-5 w-5" />
              <span>{loading ? 'Getting Directions...' : 'Get Directions'}</span>
              {loading && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                </div>
              )}
            </button>
            
            <button
              onClick={() => {
                if (navigator.geolocation) {
                  navigator.geolocation.getCurrentPosition(
                    (position) => {
                      const currentLocation = {
                        lat: position.coords.latitude,
                        lng: position.coords.longitude
                      };
                      console.log('Current location:', currentLocation);
                      console.log('Destination:', destination);
                      getDistanceMatrix([currentLocation], [destination]);
                    },
                    (error) => {
                      console.error('Geolocation error:', error);
                      alert('Could not get your location. Please enable location services.');
                    }
                  );
                } else {
                  alert('Geolocation is not supported by this browser.');
                }
              }}
              className="group px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-semibold hover:from-purple-700 hover:to-pink-700 transition-all duration-200 flex items-center justify-center space-x-3 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              <Clock className="h-5 w-5" />
              <span>Get Travel Time</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default MapIntegration;