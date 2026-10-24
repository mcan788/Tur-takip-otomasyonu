import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login';
import DashboardLayout from './components/layout/DashboardLayout';
import DashboardOverview from './pages/DashboardOverview';
import Tours from './pages/Tours';
import Reservations from './pages/Reservations';
import Staff from './pages/Staff';
import Agencies from './pages/Agencies';
import Licenses from './pages/Licenses';
import SSOReceiver from './components/SSOReceiver';
import { apiService } from './services/apiService';
import { ToastProvider } from './components/common/Toast';

function App() {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      const parsedUser = JSON.parse(savedUser);
      apiService.setToken(parsedUser.token);
      return parsedUser;
    }
    return null;
  });

  const handleLoginSuccess = (userData) => {
    apiService.setToken(userData.token);
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('token', userData.token);
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    apiService.setToken(null);
    setUser(null);
  };

  return (
    <ToastProvider>
      {/* Global Background Elements from Vanilla CSS */}
      <div className="bg-container">
          <div className="noise"></div>
          <div className="grid"></div>
          <div className="glow glow-left"></div>
          <div className="glow glow-right"></div>
      </div>
      
      <Router>
      <Routes>
        <Route 
          path="/login" 
          element={!user ? <Login onLoginSuccess={handleLoginSuccess} /> : <Navigate to="/dashboard" replace />} 
        />
        
        {/* SSO Receiver Routes for Python/Master Redirection */}
        <Route path="/super-admin" element={<SSOReceiver onLoginSuccess={handleLoginSuccess} targetRoute="/dashboard" />} />
        <Route path="/agency" element={<SSOReceiver onLoginSuccess={handleLoginSuccess} targetRoute="/dashboard" />} />

        <Route 
          path="/" 
          element={user ? <DashboardLayout user={user} onLogout={handleLogout} /> : <Navigate to="/login" replace />}
        >
          <Route path="dashboard" element={<DashboardOverview />} />
          <Route path="tours" element={<Tours />} />
          <Route path="reservations" element={<Reservations />} />
          <Route path="staff" element={<Staff />} />
          <Route path="agencies" element={<Agencies />} />
          <Route path="licenses" element={<Licenses />} />
          <Route index element={<Navigate to="/dashboard" replace />} />
        </Route>
      </Routes>
    </Router>
    </ToastProvider>
  );
}

export default App;
