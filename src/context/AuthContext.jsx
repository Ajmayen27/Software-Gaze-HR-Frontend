import React, { createContext, useContext, useState, useEffect } from 'react';
import { axiosInstance } from '../api/axiosInstance';
import { useNavigate } from 'react-router-dom';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState(null);
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if we have an access token and refresh token on load
    const token = sessionStorage.getItem('accessToken') || localStorage.getItem('refreshToken');
    const storedRole = sessionStorage.getItem('userRole');
    const storedUser = sessionStorage.getItem('user');
    if (token) {
      setIsAuthenticated(true);
      setRole(storedRole);
      if (storedUser) {
        try {
          setUser(JSON.parse(storedUser));
        } catch (e) { }
      }
    }
    setLoading(false);
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
