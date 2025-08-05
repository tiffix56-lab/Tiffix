import httpResponse from '../../util/httpResponse.js';
import responseMessage from '../../constant/responseMessage.js';
import httpError from '../../util/httpError.js';
import { validateJoiSchema, ValidateCreateMenu, ValidateUpdateMenu, ValidateMenuQuery } from '../../util/validationService.js';
import Menu from '../../models/menu.model.js';

export default {
    // Create new menu item (Admin only)
    createMenu: async (req, res, next) => {
        try {
            const { body } = req;

            const { error, value } = validateJoiSchema(ValidateCreateMenu, body);
            if (error) {
                return httpError(next, error, req, 422);
            }

            const newMenu = new Menu(value);
            const savedMenu = await newMenu.save();

            httpResponse(req, res, 201, responseMessage.SUCCESS, { menu: savedMenu });
        } catch (err) {
            httpError(next, err, req, 500);
        }
    },

    // Get all menu items with filters
    getAllMenus: async (req, res, next) => {
        try {
            const { query } = req;
            
            const { error, value } = validateJoiSchema(ValidateMenuQuery, query);
            if (error) {
                return httpError(next, error, req, 422);
            }

            const { 
                page = 1, 
                limit = 10, 
                vendorCategory, 
                cuisine, 
                dietaryOptions, 
                minPrice, 
                maxPrice, 
                search,
                isAvailable,
                sortBy = 'createdAt',
                sortOrder = 'desc'
            } = value;

            const skip = (page - 1) * limit;
            const filter = { isActive: true };

            if (vendorCategory) filter.vendorCategory = vendorCategory;
            if (cuisine) filter.cuisine = new RegExp(cuisine, 'i');
            if (dietaryOptions) filter.dietaryOptions = { $in: dietaryOptions.split(',') };
            if (minPrice || maxPrice) {
                filter.price = {};
                if (minPrice) filter.price.$gte = parseFloat(minPrice);
                if (maxPrice) filter.price.$lte = parseFloat(maxPrice);
            }
            if (isAvailable !== undefined) filter.isAvailable = isAvailable === 'true';
            if (search) {
                filter.$or = [
                    { foodTitle: { $regex: search, $options: 'i' } },
                    { 'description.short': { $regex: search, $options: 'i' } },
                    { cuisine: { $regex: search, $options: 'i' } },
                    { tags: { $regex: search, $options: 'i' } }
                ];
            }

            const sortObj = {};
            sortObj[sortBy] = sortOrder === 'desc' ? -1 : 1;

            const menus = await Menu.find(filter)
                .sort(sortObj)
                .skip(skip)
                .limit(parseInt(limit));

            const total = await Menu.countDocuments(filter);

            httpResponse(req, res, 200, responseMessage.SUCCESS, {
                menus,
                pagination: {
                    currentPage: parseInt(page),
                    totalPages: Math.ceil(total / limit),
                    totalItems: total,
                    itemsPerPage: parseInt(limit)
                }
            });
        } catch (err) {
            httpError(next, err, req, 500);
        }
    },

    // Get single menu by ID
    getMenuById: async (req, res, next) => {
        try {
            const { id } = req.params;

            const menu = await Menu.findById(id);
            if (!menu) {
                return httpError(next, new Error('Menu item not found'), req, 404);
            }

            httpResponse(req, res, 200, responseMessage.SUCCESS, { menu });
        } catch (err) {
            httpError(next, err, req, 500);
        }
    },

    // Update menu item (Admin only)
    updateMenu: async (req, res, next) => {
        try {
            const { id } = req.params;
            const { body } = req;

            const { error, value } = validateJoiSchema(ValidateUpdateMenu, body);
            if (error) {
                return httpError(next, error, req, 422);
            }

            const updatedMenu = await Menu.findByIdAndUpdate(id, value, { 
                new: true, 
                runValidators: true 
            });

            if (!updatedMenu) {
                return httpError(next, new Error('Menu item not found'), req, 404);
            }

            httpResponse(req, res, 200, responseMessage.SUCCESS, { menu: updatedMenu });
        } catch (err) {
            httpError(next, err, req, 500);
        }
    },

    // Delete menu item (Admin only)
    deleteMenu: async (req, res, next) => {
        try {
            const { id } = req.params;

            const deletedMenu = await Menu.findByIdAndUpdate(id, { isActive: false }, { new: true });
            if (!deletedMenu) {
                return httpError(next, new Error('Menu item not found'), req, 404);
            }

            httpResponse(req, res, 200, responseMessage.SUCCESS, { message: 'Menu item deleted successfully' });
        } catch (err) {
            httpError(next, err, req, 500);
        }
    },

    // Get menus by vendor category
    getMenusByCategory: async (req, res, next) => {
        try {
            const { category } = req.params;
            const { page = 1, limit = 10 } = req.query;

            const skip = (page - 1) * limit;
            const menus = await Menu.find({ vendorCategory: category, isAvailable: true, isActive: true })
                .sort({ 'rating.average': -1 })
                .skip(skip)
                .limit(parseInt(limit));

            const total = await Menu.countDocuments({ vendorCategory: category, isAvailable: true, isActive: true });

            httpResponse(req, res, 200, responseMessage.SUCCESS, {
                menus,
                pagination: {
                    currentPage: parseInt(page),
                    totalPages: Math.ceil(total / limit),
                    totalItems: total,
                    itemsPerPage: parseInt(limit)
                }
            });
        } catch (err) {
            httpError(next, err, req, 500);
        }
    },

    // Get menus by cuisine
    getMenusByCuisine: async (req, res, next) => {
        try {
            const { cuisine } = req.params;
            const { page = 1, limit = 10 } = req.query;

            const skip = (page - 1) * limit;
            const menus = await Menu.findByCuisine(cuisine)
                .skip(skip)
                .limit(parseInt(limit));

            const total = await Menu.countDocuments({ cuisine, isAvailable: true, isActive: true });

            httpResponse(req, res, 200, responseMessage.SUCCESS, {
                menus,
                pagination: {
                    currentPage: parseInt(page),
                    totalPages: Math.ceil(total / limit),
                    totalItems: total,
                    itemsPerPage: parseInt(limit)
                }
            });
        } catch (err) {
            httpError(next, err, req, 500);
        }
    },

    // Search menus
    searchMenus: async (req, res, next) => {
        try {
            const { q: searchTerm } = req.query;
            const { page = 1, limit = 10 } = req.query;

            if (!searchTerm) {
                return httpError(next, new Error('Search term is required'), req, 400);
            }

            const skip = (page - 1) * limit;
            const menus = await Menu.searchFood(searchTerm)
                .skip(skip)
                .limit(parseInt(limit));

            httpResponse(req, res, 200, responseMessage.SUCCESS, { menus });
        } catch (err) {
            httpError(next, err, req, 500);
        }
    },

    // Toggle menu availability (Admin only)
    toggleAvailability: async (req, res, next) => {
        try {
            const { id } = req.params;

            const menu = await Menu.findById(id);
            if (!menu) {
                return httpError(next, new Error('Menu item not found'), req, 404);
            }

            menu.isAvailable = !menu.isAvailable;
            await menu.save();

            httpResponse(req, res, 200, responseMessage.SUCCESS, { 
                menu,
                message: `Menu item ${menu.isAvailable ? 'enabled' : 'disabled'} successfully`
            });
        } catch (err) {
            httpError(next, err, req, 500);
        }
    },

    // Update menu rating (Internal use)
    updateRating: async (req, res, next) => {
        try {
            const { id } = req.params;
            const { rating } = req.body;

            if (!rating || rating < 1 || rating > 5) {
                return httpError(next, new Error('Rating must be between 1 and 5'), req, 400);
            }

            const menu = await Menu.findById(id);
            if (!menu) {
                return httpError(next, new Error('Menu item not found'), req, 404);
            }

            await menu.updateRating(rating);

            httpResponse(req, res, 200, responseMessage.SUCCESS, { 
                menu,
                message: 'Rating updated successfully'
            });
        } catch (err) {
            httpError(next, err, req, 500);
        }
    },

    // Get available menus only
    getAvailableMenus: async (req, res, next) => {
        try {
            const { page = 1, limit = 10 } = req.query;
            const skip = (page - 1) * limit;

            const menus = await Menu.findAvailable()
                .skip(skip)
                .limit(parseInt(limit));

            const total = await Menu.countDocuments({ isAvailable: true, isActive: true });

            httpResponse(req, res, 200, responseMessage.SUCCESS, {
                menus,
                pagination: {
                    currentPage: parseInt(page),
                    totalPages: Math.ceil(total / limit),
                    totalItems: total,
                    itemsPerPage: parseInt(limit)
                }
            });
        } catch (err) {
            httpError(next, err, req, 500);
        }
    }
};