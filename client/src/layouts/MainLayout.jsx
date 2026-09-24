import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';

const MainLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  // Dynamic Title based on route
  const getPageTitle = () => {
    switch (location.pathname) {
      case '/dashboard':
        return 'Seller Dashboard Overview';
      case '/products':
        return 'Product Inventory Management';
      case '/orders':
        return 'Orders & Shipment Fulfillment';
      case '/customers':
        return 'Customer Database & Accounts';
      case '/sales':
        return 'Sales Performance & Analytics';
      default:
        return 'Amazon Seller Dashboard';
    }
  };

  return (
    <div className="app-layout">
      {/* Sidebar Navigation */}
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Main Wrapper */}
      <div className="main-wrapper">
        <Navbar
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          pageTitle={getPageTitle()}
        />

        {/* Dynamic Nested Page Content */}
        <main className="page-container">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
