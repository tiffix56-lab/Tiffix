import { MenuResponse } from "@/lib/types";
import { servicesAxiosInstance } from "./config"


// AUTHENTICATION

export const signInApi = async (body: { emailAddress: string, password: string }) => {
    const response = await servicesAxiosInstance.post('/auth/login', body);
    return response.data;
}


// MENU

export const getMenusApi = async (params: {page: number, search?: string}): Promise<MenuResponse> => {
    const response = await servicesAxiosInstance.get<MenuResponse>('/menus', {
        params
    });
    return response.data;
}
