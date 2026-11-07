import axios, {
    AxiosInstance,
    AxiosRequestConfig,
    AxiosResponse,
} from "axios";

const BASE_URL =
    process.env.NEXT_PUBLIC_API_BASE_URL;

const apiService: AxiosInstance = axios.create({
    baseURL: BASE_URL,
    headers: {
        "Content-Type": "application/json",
    },
    timeout: 30000,
});

apiService.interceptors.request.use(
    (config) => {
        if (typeof window !== "undefined") {
            const token = sessionStorage.getItem("access_token");

            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            }
        }

        return config;
    },
    (error) => Promise.reject(error)
);

apiService.interceptors.response.use(
    (response: AxiosResponse) => response,
    (error) => {
        if (error.response) {
            console.error("API Error:", error.response.data);

            if (error.response.status === 401) {
                if (typeof window !== "undefined") {
                    sessionStorage.removeItem("access_token");
                }
            }
        } else if (error.request) {
            console.error("Server not responding:", error.message);
        } else {
            console.error("Request Error:", error.message);
        }

        return Promise.reject(error);
    }
);

const api = {
    get: async <T = any>(url: string, config?: AxiosRequestConfig) => {
        const response = await apiService.get<T>(url, config);
        return response.data;
    },

    post: async <T = any>(
        url: string,
        data?: any,
        config?: AxiosRequestConfig
    ) => {
        const response = await apiService.post<T>(url, data, config);
        return response.data;
    },

    put: async <T = any>(
        url: string,
        data?: any,
        config?: AxiosRequestConfig
    ) => {
        const response = await apiService.put<T>(url, data, config);
        return response.data;
    },

    delete: async <T = any>(
        url: string,
        data?: any,
        config?: AxiosRequestConfig
    ) => {
        const response = await apiService.delete<T>(url, {
            ...config,
            data,
        });
        return response.data;
    },
};

export default api;
export { apiService };