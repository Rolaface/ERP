import axios from "axios";
import type { AxiosInstance } from "axios";
 
export const createAxiosInstance = (
  baseURL: string
): AxiosInstance => {
  const instance = axios.create({
    baseURL,
    withCredentials: true,
    headers: {
      "Content-Type": "application/json",
    },
  });
 
  // Global 401 handler
  instance.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response?.status === 401) {
        window.location.href = "/login";
      }
      return Promise.reject(error);
    }
  );
 
  return instance;
};
 