import httpResponse from '../../util/httpResponse.js';
import responseMessage from '../../constant/responseMessage.js';
import httpError from '../../util/httpError.js';
import { validateJoiSchema, ValidateCreateMenu, ValidateUpdateMenu, ValidateMenuQuery } from '../../service/validationService.js';
import Menu from '../../models/menu.model.js';

export default {
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
                tags,
                isAvailable,
                sortBy = 'createdAt',
                sortOrder = 'desc',
                search
            } = value;

            const skip = (page - 1) * limit;
            const filter = { isActive: true };

            if (vendorCategory) filter.vendorCategory = vendorCategory;

            if (cuisine) filter.cuisine = new RegExp(cuisine, 'i');

            if (dietaryOptions) {
                const dietaryArray = dietaryOptions.split(',').map(d => d.trim());
                filter.dietaryOptions = { $in: dietaryArray };
            }

            if (tags) {
                const tagsArray = tags.split(',').map(t => t.trim());
                filter.tags = { $in: tagsArray };
            }

            if (isAvailable !== undefined) filter.isAvailable = isAvailable === 'true';

            if (search) {
                filter.$or = [
                    { foodTitle: { $regex: search, $options: 'i' } },
                    { 'description.short': { $regex: search, $options: 'i' } },
                    { 'description.long': { $regex: search, $options: 'i' } },
                    { cuisine: { $regex: search, $options: 'i' } },
                    { tags: { $regex: search, $options: 'i' } },
                    { detailedItemList: { $regex: search, $options: 'i' } }
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

    deleteMenu: async (req, res, next) => {
        try {
            const { id } = req.params;

            const deletedMenu = await Menu.findByIdAndDelete(id);
            if (!deletedMenu) {
                return httpError(next, new Error('Menu item not found'), req, 404);
            }

            httpResponse(req, res, 200, responseMessage.SUCCESS, { message: 'Menu item deleted successfully' });
        } catch (err) {
            httpError(next, err, req, 500);
        }
    },

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

    bulkUpdateAvailability: async (req, res, next) => {
        try {
            const { menuIds, isAvailable } = req.body;

            if (!Array.isArray(menuIds) || menuIds.length === 0) {
                return httpError(next, new Error('Menu IDs array is required'), req, 400);
            }

            const result = await Menu.updateMany(
                { _id: { $in: menuIds } },
                { isAvailable: isAvailable }
            );

            httpResponse(req, res, 200, responseMessage.SUCCESS, {
                message: `${result.modifiedCount} menus updated successfully`,
                modifiedCount: result.modifiedCount
            });
        } catch (err) {
            httpError(next, err, req, 500);
        }
    },
};