import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';

const DashboardLayout = ({ user, onLogout }) => {
  return (
    <div className="layout-container">
      <Sidebar user={user} />
      <div className="main-content">
        <Header user={user} onLogout={onLogout} />
        <main className="page-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
