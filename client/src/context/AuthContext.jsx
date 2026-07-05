import React, { createContext, useContext, useState, useEffect } from 'react';
import apiClient from '../api/apiClient';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('user');
    return saved ? JSON.parse(saved) : null;
  });

  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await apiClient.get('/users/me');
        setUser(res.data.data);
        localStorage.setItem('user', JSON.stringify(res.data.data));
      } catch (err) {
        setUser(null);
        localStorage.removeItem('user');
      } finally {
        setIsLoading(false);
      }
    };

    fetchUser();

    const handleLogout = () => {
      setUser(null);
      localStorage.removeItem('user');
    };
    
    window.addEventListener('auth:logout', handleLogout);
    return () => window.removeEventListener('auth:logout', handleLogout);
  }, []);

  const login = async (email, password) => {
    const res = await apiClient.post('/auth/login', { email, password });
    const userData = res.data.data.user;
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
    return userData;
  };

  const register = async (name, email, password) => {
    const res = await apiClient.post('/auth/register', { name, email, password });
    return res.data.data; // contains userId
  };

  const verifyOtp = async (userId, otp) => {
    const res = await apiClient.post('/auth/verify-otp', { userId, otp });
    const userData = res.data.data.user;
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
    return userData;
  };

  const resendOtp = async (userId) => {
    await apiClient.post('/auth/resend-otp', { userId });
  };

  const forgotPassword = async (email) => {
    await apiClient.post('/auth/forgot-password', { email });
  };

  const resetPassword = async (email, otp, newPassword) => {
    await apiClient.post('/auth/reset-password', { email, otp, newPassword });
  };

  const logout = async () => {
    try {
      await apiClient.post('/auth/logout');
    } catch (e) {
      // ignore
    } finally {
      setUser(null);
      localStorage.removeItem('user');
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      login, 
      register, 
      verifyOtp, 
      resendOtp, 
      forgotPassword, 
      resetPassword, 
      logout 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
