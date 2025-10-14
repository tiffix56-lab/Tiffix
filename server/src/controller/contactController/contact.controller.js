import httpResponse from '../../util/httpResponse.js';
import responseMessage from '../../constant/responseMessage.js';
import httpError from '../../util/httpError.js';
import Contact from '../../models/contact.model.js';
import { EUserRole } from '../../constant/application.js';

export default {
    // ############### PUBLIC/USER CONTROLLERS ###############

    createContact: async (req, res, next) => {
        try {
            const { body } = req;

            if (!body.name || !body.email || !body.phoneNumber || !body.message) {
                return httpError(next, new Error('All fields are required: name, email, phoneNumber, message'), req, 400);
            }

            if (!/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(body.email)) {
                return httpError(next, new Error('Invalid email format'), req, 400);
            }

            if (!/^[0-9]{10}$/.test(body.phoneNumber)) {
                return httpError(next, new Error('Phone number must be 10 digits'), req, 400);
            }

            const newContact = new Contact({
                name: body.name,
                email: body.email,
                phoneNumber: body.phoneNumber,
                message: body.message
            });

            await newContact.save();

            httpResponse(req, res, 201, responseMessage.CREATED, {
                contact: newContact,
                message: 'Contact form submitted successfully'
            });

        } catch (err) {
            const errorMessage = err.message || 'Internal server error while creating contact';
            httpError(next, new Error(errorMessage), req, 500);
        }
    },


    // ############### ADMIN CONTROLLERS ###############

    getAllContacts: async (req, res, next) => {
        try {
            const { role } = req.authenticatedUser;

            if (role !== EUserRole.ADMIN) {
                return httpError(next, new Error(responseMessage.AUTH.FORBIDDEN), req, 403);
            }

            const { page = 1, limit = 20, phoneNumber, email, startDate, endDate } = req.query;

            const query = {};

            if (phoneNumber) {
                query.phoneNumber = phoneNumber;
            }

            if (email) {
                query.email = email;
            }

            if (startDate || endDate) {
                query.createdAt = {};
                if (startDate) query.createdAt.$gte = new Date(startDate);
                if (endDate) query.createdAt.$lte = new Date(endDate);
            }

            const contacts = await Contact.find(query)
                .sort({ createdAt: -1 })
                .limit(parseInt(limit))
                .skip((parseInt(page) - 1) * parseInt(limit));

            const total = await Contact.countDocuments(query);

            httpResponse(req, res, 200, responseMessage.SUCCESS, {
                contacts,
                pagination: {
                    current: parseInt(page),
                    limit: parseInt(limit),
                    total,
                    pages: Math.ceil(total / parseInt(limit))
                },
                filters: { phoneNumber, email, startDate, endDate }
            });

        } catch (err) {
            const errorMessage = err.message || 'Internal server error';
            httpError(next, new Error(errorMessage), req, 500);
        }
    },

    updateContact: async (req, res, next) => {
        try {
            const { role } = req.authenticatedUser;
            const { contactId } = req.params;
            const { body } = req;

            if (role !== EUserRole.ADMIN) {
                return httpError(next, new Error(responseMessage.AUTH.FORBIDDEN), req, 403);
            }

            const contact = await Contact.findById(contactId);
            if (!contact) {
                return httpError(next, new Error('Contact not found'), req, 404);
            }

            if (body.name) contact.name = body.name;
            if (body.email) {
                if (!/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(body.email)) {
                    return httpError(next, new Error('Invalid email format'), req, 400);
                }
                contact.email = body.email;
            }
            if (body.phoneNumber) {
                if (!/^[0-9]{10}$/.test(body.phoneNumber)) {
                    return httpError(next, new Error('Phone number must be 10 digits'), req, 400);
                }
                contact.phoneNumber = body.phoneNumber;
            }
            if (body.message) contact.message = body.message;

            await contact.save();

            httpResponse(req, res, 200, responseMessage.UPDATED, {
                contact,
                message: 'Contact updated successfully'
            });

        } catch (err) {
            const errorMessage = err.message || 'Internal server error';
            httpError(next, new Error(errorMessage), req, 500);
        }
    },

    deleteContact: async (req, res, next) => {
        try {
            const { role } = req.authenticatedUser;
            const { contactId } = req.params;

            if (role !== EUserRole.ADMIN) {
                return httpError(next, new Error(responseMessage.AUTH.FORBIDDEN), req, 403);
            }

            const contact = await Contact.findById(contactId);
            if (!contact) {
                return httpError(next, new Error('Contact not found'), req, 404);
            }

            await Contact.findByIdAndDelete(contactId);

            httpResponse(req, res, 200, responseMessage.SUCCESS, {
                message: 'Contact deleted successfully'
            });

        } catch (err) {
            const errorMessage = err.message || 'Internal server error';
            httpError(next, new Error(errorMessage), req, 500);
        }
    }
};