import { servicesAxiosInstance } from "./config"



export const signInApi = async (body: { emailAddress: string, password: string }) => {
    const response = await servicesAxiosInstance.post('/auth/login', body);
    return response.data;
}