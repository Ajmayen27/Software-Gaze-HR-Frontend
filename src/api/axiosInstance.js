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

    // Attempt to unwrap error message if it's in standard ApiResponse wrapper
    if (error.response && error.response.data) {
       const wrapper = error.response.data;
       if (wrapper.message) {
         return Promise.reject(new Error(wrapper.message));
       }
    }

    return Promise.reject(error);
  }
);
