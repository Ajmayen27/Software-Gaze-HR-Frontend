import React, { createContext, useContext, useState, useEffect } from 'react';
import { axiosInstance } from '../api/axiosInstance';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState(null);
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const initializeAuth = async () => {
      const accessToken = sessionStorage.getItem('accessToken');
      const refreshToken = localStorage.getItem('refreshToken');
      const storedRole = sessionStorage.getItem('userRole');
      const storedUser = sessionStorage.getItem('user');

      if (accessToken && storedRole) {
        setIsAuthenticated(true);
        setRole(storedRole);
        if (storedUser) {
          try {
            setUser(JSON.parse(storedUser));
          } catch (e) {}
        }
        setLoading(false);
      } else if (refreshToken) {
        // Access token is missing/expired (e.g. new window/tab), but refresh token is available in localStorage.
        // Attempt to request a new access token to restore the user session.
        try {
          const res = await axios.post('http://localhost:8081/api/v1/auth/refresh-token', { refreshToken });
          
          // Unwrap response format from the API
          const responseData = res.data;
          const data = responseData && responseData.success !== undefined ? responseData.data : responseData;
          
          const newAccessToken = data?.accessToken;
          const newRefreshToken = data?.refreshToken;

          if (newAccessToken) {
            sessionStorage.setItem('accessToken', newAccessToken);
            if (newRefreshToken) {
              localStorage.setItem('refreshToken', newRefreshToken);
            }

            let userRole = data?.role;
            try {
              const payload = JSON.parse(atob(newAccessToken.split('.')[1]));
              userRole = payload.role || payload.roles || payload.authorities || userRole;
              if (Array.isArray(userRole)) userRole = userRole[0];
              if (typeof userRole === 'object' && userRole.authority) {
                userRole = userRole.authority;
              }
            } catch (e) {}

            if (userRole) {
              sessionStorage.setItem('userRole', userRole);
              setRole(userRole);
              setIsAuthenticated(true);
            }

            const loggedInUser = data?.user || { role: userRole };
            sessionStorage.setItem('user', JSON.stringify(loggedInUser));
            setUser(loggedInUser);
          } else {
            // Failed to retrieve a new token
            localStorage.removeItem('refreshToken');
            sessionStorage.clear();
          }
        } catch (err) {
          console.warn('Failed to restore session via refresh token:', err);
          localStorage.removeItem('refreshToken');
          sessionStorage.clear();
        } finally {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const login = async (email, password) => {
    try {
      // The API response gets unwrapped by interceptor to just return `data` content
      const data = await axiosInstance.post('/auth/login', { email, password });

      const { accessToken, refreshToken } = data;

      let userRole = data.role;
      if (accessToken) {
        try {
          const payload = JSON.parse(atob(accessToken.split('.')[1]));
          userRole = payload.role || payload.roles || payload.authorities || userRole;
          if (Array.isArray(userRole)) userRole = userRole[0];
          // Handle { authority: "ROLE_EMPLOYEE" } structure from Spring Security
          if (typeof userRole === 'object' && userRole.authority) {
            userRole = userRole.authority;
          }
        } catch (e) { }
      }

      if (accessToken) sessionStorage.setItem('accessToken', accessToken);
      if (refreshToken) localStorage.setItem('refreshToken', refreshToken);
      if (userRole) sessionStorage.setItem('userRole', userRole);

      const loggedInUser = data.user || { email, role: userRole };
      sessionStorage.setItem('user', JSON.stringify(loggedInUser));

      setIsAuthenticated(true);
      setRole(userRole);
      setUser(loggedInUser);

      // Navigate based on role
      if (typeof userRole === 'string') {
        const roleUpper = userRole.toUpperCase();
        if (roleUpper.includes('SUPPORT')) {
          navigate('/support/tickets');
        } else if (roleUpper.includes('EMPLOYEE')) {
          navigate('/my-profile');
        } else if (roleUpper.includes('CLIENT')) {
          navigate('/client-profile');
        } else {
          navigate('/dashboard'); // default redirect for admin/other roles
        }
      } else {
        navigate('/dashboard');
      }
      return true;
    } catch (error) {
      throw error;
    }
  };

  const logout = async () => {
    try {
      // Attempt to hit the logout endpoint if it expects a token
      await axiosInstance.post('/auth/logout');
    } catch (e) {
      // ignore
    } finally {
      sessionStorage.removeItem('accessToken');
      sessionStorage.removeItem('userRole');
      sessionStorage.removeItem('user');
      localStorage.removeItem('refreshToken');
      setIsAuthenticated(false);
      setRole(null);
      setUser(null);
      navigate('/login');
    }
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, logout, loading, role, user }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
