import config from '../config/config.js';
// Using native fetch API available in Node.js 18+

/**
 * Ola Maps Service - Backend proxy for Ola Maps API calls
 * Handles autocomplete, reverse geocoding, and place details
 */
class OlaMapsService {
    constructor() {
        this.apiKey = config.olaMaps.apiKey;
        this.baseUrl = config.olaMaps.baseUrl;
        this.apiVersion = config.olaMaps.apiVersion;

        if (!this.apiKey) {
            console.error('❌ Ola Maps API key not found in backend configuration');
            console.error('Please set OLA_MAPS_API_KEY environment variable');
        } else {
            console.log('✅ Ola Maps service initialized successfully');
        }
    }

    /**
     * Generate unique request ID for X-Request-Id header
     */
    generateRequestId() {
        return `tiffix-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
    }

    /**
     * Make authenticated request to Ola Maps API
     */
    async makeOlaRequest(endpoint, params = {}) {
        if (!this.apiKey) {
            throw new Error('Ola Maps API key not configured');
        }

        // Add API key to parameters
        const urlParams = new URLSearchParams({
            ...params,
            api_key: this.apiKey
        });

        const url = `${this.baseUrl}/places/${this.apiVersion}/${endpoint}?${urlParams.toString()}`;
        console.log(`Making request to Ola Maps: ${endpoint}`);

        try {
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'X-Request-Id': this.generateRequestId(),
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                },
            });

            console.log(`Ola Maps ${endpoint} response status: ${response.status}`);

            if (!response.ok) {
                const errorText = await response.text();
                console.error(`Ola Maps API error (${response.status}):`, errorText);
                throw new Error(`Ola Maps API error: ${response.status} - ${errorText}`);
            }

            // Check if response is JSON
            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
                const textResponse = await response.text();
                console.error('Non-JSON response from Ola Maps:', textResponse.substring(0, 500));
                throw new Error('Ola Maps API returned non-JSON response');
            }

            const data = await response.json();
            console.log(`Ola Maps ${endpoint} response:`, { 
                status: data.status, 
                resultsCount: data.predictions?.length || data.results?.length || (data.result ? 1 : 0)
            });

            return data;
        } catch (error) {
            console.error(`Error calling Ola Maps ${endpoint}:`, error.message);
            throw error;
        }
    }

    /**
     * Search places using autocomplete
     * @param {string} query - Search query
     * @param {string} sessionToken - Session token (optional)
     * @param {string} location - Reference location (optional, defaults to Delhi)
     * @param {string} radius - Search radius in meters (optional, defaults to 50km)
     */
    async searchPlaces(query, sessionToken = null, location = '28.6139,77.2090', radius = '50000') {
        if (!query || query.length < 2) {
            return { status: 'OK', predictions: [] };
        }

        const params = {
            input: query,
            language: 'en',
            location: location,
            radius: radius
        };

        if (sessionToken) {
            params.sessiontoken = sessionToken;
        }

        return await this.makeOlaRequest('autocomplete', params);
    }

    /**
     * Reverse geocode coordinates to get address
     * @param {number} latitude - Latitude coordinate
     * @param {number} longitude - Longitude coordinate
     */
    async reverseGeocode(latitude, longitude) {
        if (!latitude || !longitude) {
            throw new Error('Latitude and longitude are required for reverse geocoding');
        }

        const params = {
            latlng: `${latitude},${longitude}`,
            language: 'en'
        };

        return await this.makeOlaRequest('reverse-geocode', params);
    }

    /**
     * Get detailed information for a specific place
     * @param {string} placeId - Place ID from autocomplete
     * @param {string} sessionToken - Session token (optional)
     */
    async getPlaceDetails(placeId, sessionToken = null) {
        if (!placeId) {
            throw new Error('Place ID is required for place details');
        }

        const params = {
            place_id: placeId,
            fields: 'formatted_address,geometry,address_components,name',
            language: 'en'
        };

        if (sessionToken) {
            params.sessiontoken = sessionToken;
        }

        return await this.makeOlaRequest('details', params);
    }

    /**
     * Test API connectivity
     */
    async testConnection() {
        try {
            console.log('Testing Ola Maps API connection...');
            
            // Test with Delhi coordinates
            const testResult = await this.reverseGeocode(28.6139, 77.2090);
            
            if (testResult && testResult.status === 'OK') {
                console.log('✅ Ola Maps API connection test successful');
                return true;
            } else {
                console.log('❌ Ola Maps API connection test failed - invalid response');
                return false;
            }
        } catch (error) {
            console.error('❌ Ola Maps API connection test error:', error.message);
            return false;
        }
    }
}

// Export singleton instance
const olaMapsService = new OlaMapsService();
export default olaMapsService;