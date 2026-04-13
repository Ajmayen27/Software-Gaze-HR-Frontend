import React, { createContext, useContext, useState, useEffect } from 'react';
import { axiosInstance } from '../api/axiosInstance';
import { useNavigate } from 'react-router-dom';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if we have an access token and refresh token on load
    const token = sessionStorage.getItem('accessToken') || localStorage.getItem('refreshToken');
    if (token) {
      setIsAuthenticated(true);
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    try {
      // The API response gets unwrapped by interceptor to just return `data` content
      const data = await axiosInstance.post('/auth/login', { email, password });
      
      const { accessToken, refreshToken } = data;
      
      if (accessToken) sessionStorage.setItem('accessToken', accessToken);
      if (refreshToken) localStorage.setItem('refreshToken', refreshToken);
      
      setIsAuthenticated(true);
      navigate('/employees'); // default redirect
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
      localStorage.removeItem('refreshToken');
      setIsAuthenticated(false);
      navigate('/login');
    }
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
