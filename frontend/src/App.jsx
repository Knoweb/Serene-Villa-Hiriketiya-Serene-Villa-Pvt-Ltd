import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import GuestRegistration from './pages/GuestRegistration';
import Dashboard from './pages/Dashboard';
import Registrations from './pages/Registrations';
import Reservations from './pages/Reservations';
import Rooms from './pages/Rooms';
import Bookings from './pages/Bookings';
import Payments from './pages/Payments';
import Discounts from './pages/Discounts';
import Handover from './pages/Handover';
import Reports from './pages/Reports';
import Users from './pages/Users';
import HideDetails from './pages/HideDetails';

// Route Guard to redirect to login if not authenticated
const ProtectedRoute = ({ children }) => {
  const { user } = useAuth();
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return <Layout>{children}</Layout>;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/qr-register" element={<GuestRegistration />} />

          {/* Protected Dashboard Routes */}
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/registrations" 
            element={
              <ProtectedRoute>
                <Registrations />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/reservations" 
            element={
              <ProtectedRoute>
                <Reservations />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/rooms" 
            element={
              <ProtectedRoute>
                <Rooms />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/bookings" 
            element={
              <ProtectedRoute>
                <Bookings />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/payments" 
            element={
              <ProtectedRoute>
                <Payments />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/discounts" 
            element={
              <ProtectedRoute>
                <Discounts />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/handover" 
            element={
              <ProtectedRoute>
                <Handover />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/reports" 
            element={
              <ProtectedRoute>
                <Reports />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/users" 
            element={
              <ProtectedRoute>
                <Users />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/hide-details" 
            element={
              <ProtectedRoute>
                <HideDetails />
              </ProtectedRoute>
            } 
          />

          {/* Default Redirection */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
