import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';

const isTokenValid = (token) => {
  try {
    if (!token) return false;
    const base64Url = token.split('.')[1];
    if (!base64Url) return false;
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    const decoded = JSON.parse(jsonPayload);
    
    // Süre kontrolü (exp saniye cinsindendir)
    if (decoded.exp && decoded.exp * 1000 < Date.now()) {
      return false;
    }
    return true;
  } catch (error) {
    return false;
  }
};

const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  const location = useLocation();

  if (!token || !isTokenValid(token)) {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('agencyId');
    window.location.href = '/';
    return null;
  }

  return children;
};

export default ProtectedRoute;
