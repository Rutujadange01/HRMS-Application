import React, { createContext, useState, useEffect } from 'react';
import { authService } from '../services/authService';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(false);

  // Initialize default demo user session for quick exploration
  useEffect(() => {
    setUser({ uid: 'demo_admin_123', email: 'admin@acmeenterprise.com' });
    setProfile({
      uid: 'demo_admin_123',
      name: 'Sarah Jenkins',
      email: 'admin@acmeenterprise.com',
      role: 'Admin',
      companyId: 'comp_01',
      UPhoto: null,
      avatar: 'https://ui-avatars.com/api/?name=Sarah+Jenkins&background=F15E8C&color=fff'
    });
  }, []);

  const login = async (email, password) => {
    setLoading(true);
    try {
      const result = await authService.login(email, password);
      setUser(result.user);
      setProfile(result.profile);
      return result;
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData) => {
    setLoading(true);
    try {
      const result = await authService.register(userData);
      setUser(result.user);
      setProfile(result.profile);
      return result;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      await authService.logout();
      setUser(null);
      setProfile(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        login,
        register,
        logout,
        setProfile
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
