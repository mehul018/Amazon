import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    // Check sessionStorage for current session
    const saved = sessionStorage.getItem('seller_user');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return null;
      }
    }
    // Clean up any legacy localStorage so old persisted sessions do not bypass login
    try {
      localStorage.removeItem('seller_user');
    } catch (e) {
      // ignore
    }
    return null;
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Login handler (supports optional portal check)
  const login = async (email, password, portal = null) => {
    setLoading(true);
    setError(null);
    try {
      const payload = { email, password };
      if (portal) payload.portal = portal;

      const response = await authService.login(payload);
      if (response.data?.success) {
        const userData = response.data.data;
        setUser(userData);
        sessionStorage.setItem('seller_user', JSON.stringify(userData));
        localStorage.removeItem('seller_user');
        return { success: true, data: userData };
      } else {
        setError(response.data?.message || 'Login failed');
        return { success: false, message: response.data?.message };
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Invalid email or password';
      setError(msg);
      return { success: false, message: msg };
    } finally {
      setLoading(false);
    }
  };

  // Register seller handler
  const register = async (formData) => {
    setLoading(true);
    setError(null);
    try {
      const response = await authService.register(formData);
      if (response.data?.success) {
        const userData = response.data.data;
        setUser(userData);
        sessionStorage.setItem('seller_user', JSON.stringify(userData));
        localStorage.removeItem('seller_user');
        return { success: true, data: userData, message: response.data.message };
      } else {
        setError(response.data?.message || 'Registration failed');
        return { success: false, message: response.data?.message };
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to register seller account';
      setError(msg);
      return { success: false, message: msg };
    } finally {
      setLoading(false);
    }
  };

  const [syncingStatus, setSyncingStatus] = useState(false);

  // Sync profile on mount if authenticated
  useEffect(() => {
    if (user?.token) {
      refreshProfile();
    }
  }, []);

  // Refresh user profile (fetches latest verification status)
  const refreshProfile = async () => {
    try {
      setSyncingStatus(true);
      const response = await authService.getProfile();
      if (response.data?.success) {
        const profileData = response.data.data;
        setUser((prev) => {
          const updatedUser = { ...prev, ...profileData };
          sessionStorage.setItem('seller_user', JSON.stringify(updatedUser));
          return updatedUser;
        });
        return response.data.data;
      }
    } catch (err) {
      console.error('Error refreshing profile:', err);
    } finally {
      setSyncingStatus(false);
    }
    return null;
  };

  // Update user state directly (e.g. after verification changes)
  const updateUserData = (updatedFields) => {
    setUser((prev) => {
      if (!prev) return prev;
      const updated = { ...prev, ...updatedFields };
      sessionStorage.setItem('seller_user', JSON.stringify(updated));
      return updated;
    });
  };

  // Logout handler
  const logout = () => {
    setUser(null);
    sessionStorage.removeItem('seller_user');
    localStorage.removeItem('seller_user');
  };

  // Computed role helpers
  const isAdmin = user?.role === 'admin';
  const isSeller = user?.role === 'seller';
  const isVerified = !!user?.isVerified;
  const verificationStatus = user?.verificationStatus || (user?.isVerified ? 'verified' : 'unverified');

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isAdmin,
        isSeller,
        isVerified,
        verificationStatus,
        loading,
        syncingStatus,
        error,
        setError,
        login,
        register,
        refreshProfile,
        updateUserData,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
