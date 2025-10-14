import httpResponse from '../../util/httpResponse.js';
import responseMessage from '../../constant/responseMessage.js';
import httpError from '../../util/httpError.js';
import Complain from '../../models/complain.model.js';
import { EUserRole } from '../../constant/application.js';

export default {
    // ############### PUBLIC/USER CONTROLLERS ###############

    createComplain: async (req, res, next) => {
        try {
            const { body } = req;

            // Validate required fields
            if (!body.title || !body.reason || !body.name || !body.phoneNumber) {
                return httpError(next, new Error('All fields are required: title, reason, name, phoneNumber'), req, 400);
            }

            // Validate phone number format
            if (!/^[0-9]{10}$/.test(body.phoneNumber)) {
                return httpError(next, new Error('Phone number must be 10 digits'), req, 400);
            }

            const newComplain = new Complain({
                title: body.title,
                reason: body.reason,
                name: body.name,
                phoneNumber: body.phoneNumber
            });

            await newComplain.save();

            httpResponse(req, res, 201, responseMessage.CREATED, {
                complain: newComplain,
                message: 'Complaint submitted successfully'
            });

        } catch (err) {
            const errorMessage = err.message || 'Internal server error while creating complaint';
            httpError(next, new Error(errorMessage), req, 500);
        }
    },

    getComplainById: async (req, res, next) => {
        try {
            const { complainId } = req.params;

            const complain = await Complain.findById(complainId);
            if (!complain) {
                return httpError(next, new Error('Complaint not found'), req, 404);
            }

            httpResponse(req, res, 200, responseMessage.SUCCESS, {
                complain
            });

        } catch (err) {
            const errorMessage = err.message || 'Internal server error';
            httpError(next, new Error(errorMessage), req, 500);
        }
    },

    getComplainsByPhoneNumber: async (req, res, next) => {
        try {
            const { phoneNumber } = req.query;
            const { page = 1, limit = 20 } = req.query;

            if (!phoneNumber) {
                return httpError(next, new Error('Phone number is required'), req, 400);
            }

            // Validate phone number format
            if (!/^[0-9]{10}$/.test(phoneNumber)) {
                return httpError(next, new Error('Phone number must be 10 digits'), req, 400);
            }

            const complains = await Complain.find({ phoneNumber })
                .sort({ createdAt: -1 })
                .limit(parseInt(limit))
                .skip((parseInt(page) - 1) * parseInt(limit));

            const total = await Complain.countDocuments({ phoneNumber });

            httpResponse(req, res, 200, responseMessage.SUCCESS, {
                complains,
                pagination: {
                    current: parseInt(page),
                    limit: parseInt(limit),
                    total,
                    pages: Math.ceil(total / parseInt(limit))
                }
            });

        } catch (err) {
            const errorMessage = err.message || 'Internal server error';
            httpError(next, new Error(errorMessage), req, 500);
        }
    },

    // ############### ADMIN CONTROLLERS ###############

    getAllComplains: async (req, res, next) => {
        try {
            const { role } = req.authenticatedUser;

            if (role !== EUserRole.ADMIN) {
                return httpError(next, new Error(responseMessage.AUTH.FORBIDDEN), req, 403);
            }

            const { page = 1, limit = 20, phoneNumber, startDate, endDate } = req.query;

            const query = {};

            if (phoneNumber) {
                query.phoneNumber = phoneNumber;
            }

            if (startDate || endDate) {
                query.createdAt = {};
                if (startDate) query.createdAt.$gte = new Date(startDate);
                if (endDate) query.createdAt.$lte = new Date(endDate);
            }

            const complains = await Complain.find(query)
                .sort({ createdAt: -1 })
                .limit(parseInt(limit))
                .skip((parseInt(page) - 1) * parseInt(limit));

            const total = await Complain.countDocuments(query);

            httpResponse(req, res, 200, responseMessage.SUCCESS, {
                complains,
                pagination: {
                    current: parseInt(page),
                    limit: parseInt(limit),
                    total,
                    pages: Math.ceil(total / parseInt(limit))
                },
                filters: { phoneNumber, startDate, endDate }
            });

        } catch (err) {
            const errorMessage = err.message || 'Internal server error';
            httpError(next, new Error(errorMessage), req, 500);
        }
    },

    updateComplain: async (req, res, next) => {
        try {
            const { role } = req.authenticatedUser;
            const { complainId } = req.params;
            const { body } = req;

            if (role !== EUserRole.ADMIN) {
                return httpError(next, new Error(responseMessage.AUTH.FORBIDDEN), req, 403);
            }

            const complain = await Complain.findById(complainId);
            if (!complain) {
                return httpError(next, new Error('Complaint not found'), req, 404);
            }

            // Update only provided fields
            if (body.title) complain.title = body.title;
            if (body.reason) complain.reason = body.reason;
            if (body.name) complain.name = body.name;
            if (body.phoneNumber) {
                if (!/^[0-9]{10}$/.test(body.phoneNumber)) {
                    return httpError(next, new Error('Phone number must be 10 digits'), req, 400);
                }
                complain.phoneNumber = body.phoneNumber;
            }

            await complain.save();

            httpResponse(req, res, 200, responseMessage.UPDATED, {
                complain,
                message: 'Complaint updated successfully'
            });

        } catch (err) {
            const errorMessage = err.message || 'Internal server error';
            httpError(next, new Error(errorMessage), req, 500);
        }
    },

    deleteComplain: async (req, res, next) => {
        try {
            const { role } = req.authenticatedUser;
            const { complainId } = req.params;

            if (role !== EUserRole.ADMIN) {
                return httpError(next, new Error(responseMessage.AUTH.FORBIDDEN), req, 403);
            }

            const complain = await Complain.findById(complainId);
            if (!complain) {
                return httpError(next, new Error('Complaint not found'), req, 404);
            }

            await Complain.findByIdAndDelete(complainId);

            httpResponse(req, res, 200, responseMessage.SUCCESS, {
                message: 'Complaint deleted successfully'
            });

        } catch (err) {
            const errorMessage = err.message || 'Internal server error';
            httpError(next, new Error(errorMessage), req, 500);
        }
    }
};
