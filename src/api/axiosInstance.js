import axios from 'axios';

const BASE_URL = 'http://localhost:8081/api/v1';

export const axiosInstance = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to attach access token
axiosInstance.interceptors.request.use(
  (config) => {
    // Check if the endpoint is an auth endpoint
    if (!config.url.startsWith('/auth/')) {
      const token = sessionStorage.getItem('accessToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor to handle Response Unwrapping and 401 Refresh Token
axiosInstance.interceptors.response.use(
  (response) => {
    // Unwrap standard ApiResponse<T> format
    const data = response.data;
    if (data && data.success !== undefined) {
      if (data.success) {
        // You can attach the message to data if needed, but usually just returning data.data is clean
        return data.data; 
      } else {
        // If API responds with 200 but success=false
        return Promise.reject(new Error(data.message || 'API Error'));
      }
    }
    return data;
  },
  async (error) => {
    const originalRequest = error.config;

    // If 401 Unauthorized and not already retrying
    if (error.response && error.response.status === 401 && !originalRequest._retry) {
      if (originalRequest.url.startsWith('/auth/login') || originalRequest.url.startsWith('/auth/refresh-token')) {
        return Promise.reject(error);
      }

      originalRequest._retry = true;
      const refreshToken = localStorage.getItem('refreshToken');

      if (refreshToken) {
        try {
          // Attempt to refresh
          const res = await axios.post(`${BASE_URL}/auth/refresh-token`, { refreshToken });
          
          // Assuming the refresh-token endpoint returns { success, data: { accessToken, refreshToken } }
          const newAccessToken = res.data?.data?.accessToken || res.data?.accessToken;
          const newRefreshToken = res.data?.data?.refreshToken || res.data?.refreshToken;
          
          if (newAccessToken) {
            sessionStorage.setItem('accessToken', newAccessToken);
            if (newRefreshToken) {
              localStorage.setItem('refreshToken', newRefreshToken);
            }
            
            // Replay the original request with the new token
            originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
            // Remove the flag so it doesn't loop infinitely if the new token is ALSO bad
            return axiosInstance(originalRequest);
          }
        } catch (refreshError) {
          // Refresh totally failed, log out
          sessionStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          window.location.href = '/login';
          return Promise.reject(refreshError);
        }
      } else {
        // No refresh token available, must log in
        window.location.href = '/login';
      }
    }

    // Attempt to unwrap error message if it's in standard ApiResponse wrapper or Spring validation format
    if (error.response && error.response.data) {
       const wrapper = error.response.data;

       // 1. Handle Spring Boot field validation errors (array of objects)
       if (wrapper.errors && Array.isArray(wrapper.errors)) {
         const validationMsgs = wrapper.errors
           .map(e => e.defaultMessage || e.message || e.msg)
           .filter(Boolean);
         if (validationMsgs.length > 0) {
           return Promise.reject(new Error(validationMsgs.join(' | ')));
         }
       }
       
       // 2. Handle Spring Boot simple Map validation errors (e.g. { "phone": "must be 11 digits" })
       // This can be returned directly at the root, or nested inside wrapper.errors
       let errorMap = null;
       if (wrapper.errors && typeof wrapper.errors === 'object' && !Array.isArray(wrapper.errors)) {
           errorMap = wrapper.errors;
       } else if (error.response.status === 400 && typeof wrapper === 'object' && !wrapper.success && !wrapper.path) {
           // Direct map at root, skipping standard Spring Boot JSON keys like 'timestamp', 'status'
           errorMap = wrapper;
       }

       if (errorMap) {
         const possibleMessages = Object.entries(errorMap)
            .filter(([key, val]) => typeof val === 'string' && key !== 'timestamp' && key !== 'error' && key !== 'path')
            .map(([_, val]) => val.trim());
            
         if (possibleMessages.length > 0) {
           return Promise.reject(new Error(possibleMessages.join(' | ')));
         }
       }

       // 3. Handle raw string responses
       if (typeof wrapper === 'string') {
         return Promise.reject(new Error(wrapper));
       }

       // 4. Standard ApiResponse message or Spring 'message' field
       if (wrapper.message) {
         // If message is generic, try to append it or just return it
         return Promise.reject(new Error(wrapper.message));
       }
    }

    // Fallback if no specific message could be extracted
    const fallbackMsg = error.response?.status === 400 
      ? 'Invalid input data provided. Please check your fields.'
      : (error.message || 'An unexpected error occurred');
      
    return Promise.reject(new Error(fallbackMsg));
  }
);
