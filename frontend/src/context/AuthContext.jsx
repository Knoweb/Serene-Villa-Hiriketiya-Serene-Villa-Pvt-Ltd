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

  const login = (username, password, role) => {
    // Basic simulated authentication for base system setup
    const userData = {
      username,
      role: role.toUpperCase(), // ADMIN, ACCOUNTANT, FRONT_OFFICER
      token: 'simulated-jwt-token-xyz',
      propertyId: currentProperty.id,
    };
    setUser(userData);
    localStorage.setItem('pms_user', JSON.stringify(userData));
    return true;
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
