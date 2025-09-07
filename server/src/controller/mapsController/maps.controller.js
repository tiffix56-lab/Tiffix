import httpResponse from '../../util/httpResponse.js';
import responseMessage from '../../constant/responseMessage.js';
import httpError from '../../util/httpError.js';
import olaMapsService from '../../service/olaMapsService.js';

/**
 * Maps Controller - Handle map-related API requests
 * Proxy requests to Ola Maps API to bypass CORS restrictions
 */
export default {
    /**
     * Autocomplete places search
     * POST /maps/autocomplete
     * Body: { query, sessionToken?, location?, radius? }
     */
    autocomplete: async (req, res, next) => {
        try {
            const { query, sessionToken, location, radius } = req.body;

            // Validation
            if (!query) {
                return httpError(next, new Error('Query parameter is required'), req, 400);
            }

            if (typeof query !== 'string' || query.trim().length < 2) {
                return httpError(next, new Error('Query must be at least 2 characters long'), req, 400);
            }

            console.log(`Autocomplete request: "${query.trim()}" from user ${req.userId || 'unknown'}`);

            // Call Ola Maps service
            const result = await olaMapsService.searchPlaces(
                query.trim(),
                sessionToken || null,
                location || undefined,
                radius || undefined
            );

            // Transform response to match frontend expectations
            const transformedResult = {
                status: result.status,
                predictions: result.predictions || [],
                // Keep original result for debugging if needed
                _original: result
            };

            return httpResponse(req, res, 200, responseMessage.SUCCESS, transformedResult);
        } catch (err) {
            console.error('Autocomplete error:', err.message);
            const errorMessage = err.message || 'Failed to search places';
            return httpError(next, new Error(errorMessage), req, 500);
        }
    },

    /**
     * Reverse geocode coordinates to address
     * POST /maps/reverse-geocode
     * Body: { latitude, longitude }
     */
    reverseGeocode: async (req, res, next) => {
        try {
            const { latitude, longitude } = req.body;

            // Validation
            if (!latitude || !longitude) {
                return httpError(next, new Error('Latitude and longitude are required'), req, 400);
            }

            const lat = parseFloat(latitude);
            const lng = parseFloat(longitude);

            if (isNaN(lat) || isNaN(lng)) {
                return httpError(next, new Error('Invalid latitude or longitude format'), req, 400);
            }

            if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
                return httpError(next, new Error('Invalid latitude or longitude range'), req, 400);
            }

            console.log(`Reverse geocode request: ${lat}, ${lng} from user ${req.userId || 'unknown'}`);

            // Call Ola Maps service
            const result = await olaMapsService.reverseGeocode(lat, lng);

            // Transform response to match frontend expectations
            const transformedResult = {
                status: result.status,
                results: result.results || [],
                // Keep original result for debugging if needed
                _original: result
            };

            return httpResponse(req, res, 200, responseMessage.SUCCESS, transformedResult);
        } catch (err) {
            console.error('Reverse geocode error:', err.message);
            const errorMessage = err.message || 'Failed to reverse geocode coordinates';
            return httpError(next, new Error(errorMessage), req, 500);
        }
    },

    /**
     * Get place details by place ID
     * POST /maps/place-details
     * Body: { placeId, sessionToken? }
     */
    placeDetails: async (req, res, next) => {
        try {
            const { placeId, sessionToken } = req.body;

            // Validation
            if (!placeId) {
                return httpError(next, new Error('Place ID is required'), req, 400);
            }

            if (typeof placeId !== 'string' || placeId.trim().length === 0) {
                return httpError(next, new Error('Invalid place ID format'), req, 400);
            }

            console.log(`Place details request: ${placeId} from user ${req.userId || 'unknown'}`);

            // Call Ola Maps service
            const result = await olaMapsService.getPlaceDetails(
                placeId.trim(),
                sessionToken || null
            );

            // Transform response to match frontend expectations
            const transformedResult = {
                status: result.status,
                result: result.result || null,
                // Keep original result for debugging if needed
                _original: result
            };

            return httpResponse(req, res, 200, responseMessage.SUCCESS, transformedResult);
        } catch (err) {
            console.error('Place details error:', err.message);
            const errorMessage = err.message || 'Failed to get place details';
            return httpError(next, new Error(errorMessage), req, 500);
        }
    },

    /**
     * Test Ola Maps API connection
     * GET /maps/test-connection
     */
    testConnection: async (req, res, next) => {
        try {
            console.log(`API connection test requested by user ${req.userId || 'unknown'}`);
            
            const isConnected = await olaMapsService.testConnection();
            
            const result = {
                connected: isConnected,
                timestamp: new Date().toISOString(),
                service: 'Ola Maps API'
            };

            if (isConnected) {
                return httpResponse(req, res, 200, 'Ola Maps API connection successful', result);
            } else {
                return httpResponse(req, res, 503, 'Ola Maps API connection failed', result);
            }
        } catch (err) {
            console.error('Connection test error:', err.message);
            const errorMessage = err.message || 'Failed to test API connection';
            return httpError(next, new Error(errorMessage), req, 500);
        }
    },

    /**
     * Generate session token for Ola Maps requests
     * GET /maps/session-token
     */
    generateSessionToken: (req, res, next) => {
        try {
            const sessionToken = `tiffix-session-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
            
            const result = {
                sessionToken,
                expiresAt: new Date(Date.now() + 5 * 60 * 1000).toISOString(), // 5 minutes from now
                usage: 'Use this token for related autocomplete and place details requests'
            };

            return httpResponse(req, res, 200, responseMessage.SUCCESS, result);
        } catch (err) {
            console.error('Session token generation error:', err.message);
            const errorMessage = err.message || 'Failed to generate session token';
            return httpError(next, new Error(errorMessage), req, 500);
        }
    }
};