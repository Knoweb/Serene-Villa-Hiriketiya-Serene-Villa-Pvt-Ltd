import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('pms_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [currentProperty, setCurrentProperty] = useState({
    id: 1,
    name: 'Serene Villa Pvt Ltd',
    totalRooms: 6,
    invoiceStartNumber: 0,
  });

  const login = async (username, password) => {
    const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, password })
      });

      if (res.ok) {
        const userData = await res.json();
        setUser(userData);
        localStorage.setItem('pms_user', JSON.stringify(userData));
        return { success: true };
      } else {
        const errData = await res.json();
        return { success: false, message: errData.message || 'Invalid credentials' };
      }
    } catch (err) {
      return { success: false, message: 'Server is currently offline. Please ensure the backend is running.' };
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('pms_user');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, currentProperty, setCurrentProperty }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
