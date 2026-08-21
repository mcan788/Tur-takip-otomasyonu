import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

const Login = lazy(() => import('./pages/Login'));
const AgencyLogin = lazy(() => import('./pages/AgencyLogin'));
const SuperAdminDashboard = lazy(() => import('./pages/SuperAdminDashboard'));
const SuperAdminHome = lazy(() => import('./pages/SuperAdminHome'));
const SuperAdminReports = lazy(() => import('./pages/SuperAdminReports'));
const PublicAgencyPage = lazy(() => import('./pages/PublicAgencyPage'));
const AgencyDashboard = lazy(() => import('./pages/AgencyDashboard'));
const Tours = lazy(() => import('./pages/Tours'));
const TourManagement = lazy(() => import('./pages/TourManagement'));
const PersonnelManagement = lazy(() => import('./pages/PersonnelManagement'));
const OfficeManagement = lazy(() => import('./pages/OfficeManagement'));
const Profile = lazy(() => import('./pages/Profile'));
const AgencyReports = lazy(() => import('./pages/AgencyReports'));
const FinancialDetails = lazy(() => import('./pages/FinancialDetails'));
const SupportPage = lazy(() => import('./pages/SupportPage'));
const ModuleSelector = lazy(() => import('./pages/ModuleSelector'));
import ProtectedRoute from './components/ProtectedRoute';
import './App.css';
import ErrorBoundary from './components/ErrorBoundary';

const params = new URLSearchParams(window.location.search);
let token = params.get('token');

const getCookie = (name) => {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(';').shift();
  return null;
};

if (!token) {
  token = getCookie('sso_tur_takip_token');
  if (token) document.cookie = 'sso_tur_takip_token=; Max-Age=-99999999; path=/';
}

if (token) {
  localStorage.clear();
  localStorage.setItem('token', token);
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join(''));
    const decoded = JSON.parse(jsonPayload);
    if (decoded.role) localStorage.setItem('role', decoded.role);
    if (decoded.agencyId) localStorage.setItem('agencyId', decoded.agencyId);
    if (decoded.subdomain) localStorage.setItem('agencyName', decoded.subdomain);
    if (decoded.staffId) localStorage.setItem('staffId', decoded.staffId);
    const source = params.get('source');
    if ((decoded.role === 'SUPERADMIN' || decoded.role === 'Admin') && source !== 'rentacar' && window.location.pathname !== '/super-admin' && window.location.pathname !== '/super-admin/module-selector') {
      window.location.href = '/super-admin/module-selector';
    }
  } catch (e) { console.error('Token decode error:', e); }
  window.history.replaceState({}, document.title, window.location.pathname);
}

const HardRedirect = () => {
  if (window.location.port === '5173' || window.location.port === '5174') {
    window.location.href = `http://${window.location.hostname}:3000/`;
  } else {
    if (window.location.pathname === '/') {
      window.location.href = `http://${window.location.hostname}:3000/`;
    } else {
      window.location.replace('/');
    }
  }
  return null;
};

const SSORedirect = () => {
  const adminToken = localStorage.getItem('token') || '';
  React.useEffect(() => {
    if (!adminToken) { window.location.replace('/'); return; }
    const isLocal = window.location.port === '3000' || window.location.port === '5173' || window.location.port === '5174';
    const baseUrl = isLocal ? `http://${window.location.hostname}:5001` : '';
    // POST ile gönder (IIS bu isteği Python'a yönlendirir), token URL param olarak da ekleniyor
    const form = document.createElement('form');
    form.method = 'POST';
    form.action = `${baseUrl}/sso-login?token=${adminToken}`;
    document.body.appendChild(form);
    form.submit();
  }, [adminToken]);
  return <div style={{display:'flex',justifyContent:'center',alignItems:'center',height:'100vh',fontWeight:'bold',color:'var(--accent-color)'}}>Rent A Car modülüne geçiş yapılıyor...</div>;
};

function App() {
  return (
    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <div className="app-container">
        <ErrorBoundary>
          <Suspense fallback={<div style={{display:'flex',justifyContent:'center',alignItems:'center',height:'100vh',color:'var(--accent-color)',fontWeight:'bold'}}>Yükleniyor...</div>}>
            <Routes>
              <Route path="/sso-login" element={<SSORedirect />} />
              <Route path="/" element={<HardRedirect />} />
              <Route path="/acente-giris" element={<HardRedirect />} />
              <Route path="/acente-giriş" element={<HardRedirect />} />
              <Route path="/zy-yonetim-merkezi" element={<HardRedirect />} />
              <Route path="/super-admin/module-selector" element={<ProtectedRoute><ModuleSelector /></ProtectedRoute>} />
              <Route path="/super-admin" element={<ProtectedRoute><SuperAdminHome /></ProtectedRoute>} />
              <Route path="/super-admin/agencies" element={<ProtectedRoute><SuperAdminDashboard /></ProtectedRoute>} />
              <Route path="/super-admin/reports" element={<ProtectedRoute><SuperAdminReports /></ProtectedRoute>} />
              <Route path="/super-admin/support" element={<ProtectedRoute><SupportPage /></ProtectedRoute>} />
              <Route path="/agency" element={<ProtectedRoute><AgencyDashboard /></ProtectedRoute>} />
              <Route path="/agency/tour-management" element={<ProtectedRoute><TourManagement /></ProtectedRoute>} />
              <Route path="/agency/tours" element={<ProtectedRoute><Tours /></ProtectedRoute>} />
              <Route path="/agency/personnel" element={<ProtectedRoute><PersonnelManagement /></ProtectedRoute>} />
              <Route path="/agency/offices" element={<ProtectedRoute><OfficeManagement /></ProtectedRoute>} />
              <Route path="/agency/reports" element={<ProtectedRoute><AgencyReports /></ProtectedRoute>} />
              <Route path="/agency/financial-details" element={<ProtectedRoute><FinancialDetails /></ProtectedRoute>} />
              <Route path="/agency/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
              <Route path="/agency/support" element={<ProtectedRoute><SupportPage /></ProtectedRoute>} />
              <Route path="/agency/:agencyUsername" element={<PublicAgencyPage />} />
            </Routes>
          </Suspense>
        </ErrorBoundary>
      </div>
    </Router>
  );
}

export default App;

