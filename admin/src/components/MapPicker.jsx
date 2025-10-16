import { useEffect, useRef, useState } from 'react';
import { MapPin, Search } from 'lucide-react';
import { OlaMaps } from 'olamaps-web-sdk';
import { mapsAutocompleteApi, mapsPlaceDetailsApi, mapsGenerateSessionTokenApi } from '../service/api.service';

const MapPicker = ({ onLocationSelect, initialLat = 20.5937, initialLng = 78.9629 }) => {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const marker = useRef(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [sessionToken, setSessionToken] = useState(null);
  const [selectedLocation, setSelectedLocation] = useState({
    lat: initialLat,
    lng: initialLng,
    address: ''
  });

  // Generate session token on mount
  useEffect(() => {
    const generateToken = async () => {
      try {
        const response = await mapsGenerateSessionTokenApi();
        setSessionToken(response.data.sessionToken);
      } catch (error) {
        console.error('Error generating session token:', error);
      }
    };
    generateToken();
  }, []);

  // Initialize OLA Maps
  useEffect(() => {
    if (map.current) return; // Initialize map only once

    // Note: OlaMaps SDK still needs API key for map rendering only
    // This is safe as it's only used for displaying the map, not for API calls
    const OLA_MAPS_API_KEY = import.meta.env.VITE_OLA_MAPS_API_KEY || '';

    // Initialize OlaMaps instance
    const olaMaps = new OlaMaps({
      apiKey: OLA_MAPS_API_KEY
    });

    let mapInstance = null;
    let markerInstance = null;
    let isMapLoaded = false;

    try {
      // Initialize the map with OLA Maps native style (not OpenStreetMap)
      mapInstance = olaMaps.init({
        container: mapContainer.current,
        center: [initialLng, initialLat],
        zoom: 5,
        style: 'https://api.olamaps.io/tiles/vector/v1/styles/default-light-standard-mr/style.json',
        attributionControl: false // Hide attribution control
      });

      map.current = mapInstance;

      // Handle style errors
      mapInstance.on('error', (e) => {
        console.error('Map error:', e.error);
      });

      // Wait for map to load
      mapInstance.on('load', () => {
        isMapLoaded = true;

        // Hide attribution controls
        const attributionButtons = mapContainer.current.querySelectorAll('.mapboxgl-ctrl-attrib-button, .mapboxgl-ctrl-attrib, .mapboxgl-ctrl-bottom-right, .mapboxgl-ctrl-bottom-left');
        attributionButtons.forEach(el => {
          if (el) el.style.display = 'none';
        });

        // Add a marker at the initial location
        markerInstance = olaMaps.addMarker({
          offset: [0, 0],
          anchor: 'bottom',
          color: '#FF6B00',
          draggable: true
        })
          .setLngLat([initialLng, initialLat])
          .addTo(mapInstance);

        marker.current = markerInstance;

        // Update location when marker is dragged
        markerInstance.on('dragend', () => {
          const lngLat = markerInstance.getLngLat();
          updateLocation(lngLat.lat, lngLat.lng);
        });

        // Add click event to map
        mapInstance.on('click', (e) => {
          const { lat, lng } = e.lngLat;
          markerInstance.setLngLat([lng, lat]);
          updateLocation(lat, lng);
        });
      });
    } catch (error) {
      console.error('Error initializing map:', error);
    }

    return () => {
      // Clean up only if map was loaded
      if (markerInstance) {
        try {
          markerInstance.remove();
        } catch (e) {
          console.warn('Error removing marker:', e);
        }
      }

      if (mapInstance && isMapLoaded) {
        try {
          mapInstance.remove();
        } catch (e) {
          console.warn('Error removing map:', e);
        }
      }

      map.current = null;
      marker.current = null;
    };
  }, [initialLat, initialLng]);

  const updateLocation = (lat, lng) => {
    const location = {
      lat: parseFloat(lat.toFixed(6)),
      lng: parseFloat(lng.toFixed(6)),
      address: `${lat.toFixed(6)}, ${lng.toFixed(6)}`
    };
    setSelectedLocation(location);
    if (onLocationSelect) {
      onLocationSelect(location);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setIsSearching(true);

    try {
      // Using backend API - secure, no API key exposed
      const response = await mapsAutocompleteApi({
        query: searchQuery.trim(),
        sessionToken: sessionToken
      });

      console.log('Search response:', response);

      if (response.success) {
        setSearchResults(response.data.predictions || []);
      } else {
        console.error('Search failed:', response.message);
        setSearchResults([]);
      }
    } catch (error) {
      console.error('Error searching location:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearchKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const selectSearchResult = async (result) => {
    try {
      // Check if result already has coordinates (geometry field)
      if (result.geometry && result.geometry.location) {
        const lat = result.geometry.location.lat;
        const lng = result.geometry.location.lng;

        // Update map and marker
        map.current.flyTo({
          center: [lng, lat],
          zoom: 14
        });
        marker.current.setLngLat([lng, lat]);

        updateLocation(lat, lng);
        setSearchResults([]);
        setSearchQuery('');
        return;
      }

      // If no geometry, fetch place details from backend
      const placeId = result.place_id || result.id;
      if (!placeId) {
        console.error('No place ID found in result');
        return;
      }

      const response = await mapsPlaceDetailsApi({
        placeId: placeId,
        sessionToken: sessionToken
      });

      console.log('Place details response:', response);

      if (response.success) {
        const lat = response.data?.result?.geometry?.location?.lat;
        const lng = response.data?.result?.geometry?.location?.lng;

        if (lat && lng) {
          // Update map and marker
          map.current.flyTo({
            center: [lng, lat],
            zoom: 14
          });
          marker.current.setLngLat([lng, lat]);

          updateLocation(lat, lng);
        }

        setSearchResults([]);
        setSearchQuery('');
      } else {
        console.error('Place details failed:', response.message);
      }
    } catch (error) {
      console.error('Error getting place details:', error);
    }
  };

  return (
    <div className="w-full">
      {/* Search Bar */}
      <div className="mb-4 relative">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search for a location..."
              className="w-full bg-gray-900 border border-gray-600 rounded-lg pl-10 pr-4 py-2 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-white placeholder-gray-400"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleSearchKeyDown}
            />
          </div>
          <button
            onClick={handleSearch}
            disabled={isSearching || !searchQuery.trim()}
            className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white px-4 py-2 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSearching ? 'Searching...' : 'Search'}
          </button>
        </div>

        {/* Search Results */}
        {searchResults.length > 0 && (
          <div className="absolute z-10 w-full mt-2 bg-gray-800 border border-gray-600 rounded-lg shadow-lg max-h-60 overflow-y-auto">
            {searchResults.map((result, index) => (
              <div
                key={index}
                onClick={() => selectSearchResult(result)}
                className="p-3 hover:bg-gray-700 cursor-pointer border-b border-gray-700 last:border-b-0 transition-colors"
              >
                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-orange-400 mt-1 flex-shrink-0" />
                  <div>
                    <p className="text-white text-sm">{result.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Map Container */}
      <div className="relative">
        <style>{`
          .mapboxgl-ctrl-attrib-button,
          .mapboxgl-ctrl-attrib,
          .mapboxgl-ctrl-bottom-right,
          .mapboxgl-ctrl-bottom-left {
            display: none !important;
          }
        `}</style>
        <div
          ref={mapContainer}
          className="w-full h-96 rounded-lg border-2 border-gray-600"
        />

        {/* Selected Location Info */}
        <div className="absolute bottom-4 left-4 right-4 bg-gray-800/95 backdrop-blur-sm border border-gray-600 rounded-lg p-3 shadow-lg">
          <div className="flex items-start gap-2">
            <MapPin className="w-5 h-5 text-orange-400 mt-0.5 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs text-gray-400 mb-1">Selected Location:</p>
              <p className="text-sm text-white font-mono break-all">
                Lat: {selectedLocation.lat}, Lng: {selectedLocation.lng}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Instructions */}
      <div className="mt-4 bg-blue-900/30 border border-blue-500/30 rounded-lg p-3">
        <p className="text-sm text-blue-200">
          Click anywhere on the map or drag the marker to select a location. You can also search for a specific place using the search bar above.
        </p>
      </div>
    </div>
  );
};

export default MapPicker;
