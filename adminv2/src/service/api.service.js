
import { servicesAxiosInstance } from "./config"


// AUTHENTICATION

export const signInApi = async (body) => {
    const response = await servicesAxiosInstance.post('/auth/login', body);
    return response.data;
}


// MENU

export const createMenuApi = async (body) => {
    const response = await servicesAxiosInstance.post('/admin/menus', body);
    return response.data;
}

export const updateMenuApi = async (menuId, body) => {
    const response = await servicesAxiosInstance.put(`/admin/menus/${menuId}`, body);
    return response.data;
}

export const deleteMenuApi = async (menuId) => {
    const response = await servicesAxiosInstance.delete(`/admin/menus/${menuId}`);
    return response.data;
}

export const toggleMenuAvailabilityApi = async (menuId) => {
    const response = await servicesAxiosInstance.patch(`/admin/menus/${menuId}/toggle-availability`);
    return response.data;
}

export const updateMenuRatingApi = async (menuId, rating) => {
    const response = await servicesAxiosInstance.patch(`/admin/menus/${menuId}/rating`, { rating });
    return response.data;
}

export const bulkUpdateMenuAvailabilityApi = async (menuIds, isAvailable) => {
    const response = await servicesAxiosInstance.patch('/admin/menus/bulk-availability', { menuIds, isAvailable });
    return response.data;
}

export const getMenusApi = async (params) => {
    const response = await servicesAxiosInstance.get('/menus', {
        params
    });
    return response.data;
}

export const getMenuByIdApi = async (menuId) => {
    const response = await servicesAxiosInstance.get(`/menus/${menuId}`);
    return response.data;
}


