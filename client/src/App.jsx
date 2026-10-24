import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import MainLayout from './layouts/MainLayout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Products from './pages/Products';
import Orders from './pages/Orders';
import Customers from './pages/Customers';
import Sales from './pages/Sales';
import AdminSellers from './pages/AdminSellers';

// Protected Route Guard - requires authentication to access
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

// Seller Only Route Guard - requires !isAdmin (Admins use Customers to place orders)
const SellerOnlyRoute = ({ children }) => {
  const { isAdmin } = useAuth();
  if (isAdmin) {
    return <Navigate to="/customers" replace />;
  }
  return children;
};

// Admin Route Guard - requires role === 'admin'
const AdminRoute = ({ children }) => {
  const { isAuthenticated, isAdmin } = useAuth();
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  if (!isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
};

// Public Route Guard - if already logged in, redirect based on role
const PublicRoute = ({ children }) => {
  const { isAuthenticated, isAdmin } = useAuth();
  if (isAuthenticated) {
    return <Navigate to={isAdmin ? "/admin/sellers" : "/dashboard"} replace />;
  }
  return children;
};

function AppRoutes() {
  const { isAuthenticated, isAdmin } = useAuth();

  return (
    <Routes>
      {/* Root Route */}
      <Route
        path="/"
        element={
          <Navigate
            to={
              !isAuthenticated
                ? "/login"
                : isAdmin
                ? "/admin/sellers"
                : "/dashboard"
            }
            replace
          />
        }
      />

      {/* Public Login Routes & Aliases */}
      <Route
        path="/login"
        element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        }
      />
      <Route
        path="/admin/login"
        element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        }
      />
      <Route
        path="/seller/login"
        element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        }
      />
      <Route
        path="/seller/register"
        element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        }
      />

      {/* Protected Shared & Seller Application Routes */}
      <Route
        element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={<Dashboard />} />
        
        {/* NEW CHANGE: Added an alias route for stats/dashboard compatibility if needed */}
        <Route path="/stats" element={<Dashboard />} />

        <Route path="/products" element={<Products />} />
        <Route
          path="/orders"
          element={
            <SellerOnlyRoute>
              <Orders />
            </SellerOnlyRoute>
          }
        />
        <Route path="/customers" element={<Customers />} />
        <Route path="/sales" element={<Sales />} />

        {/* Dedicated Admin Routes */}
        <Route
          path="/admin/sellers"
          element={
            <AdminRoute>
              <AdminSellers />
            </AdminRoute>
          }
        />
      </Route>

      {/* Catch-all route */}
      <Route
        path="*"
        element={
          <Navigate
            to={
              !isAuthenticated
                ? "/login"
                : isAdmin
                ? "/admin/sellers"
                : "/dashboard"
            }
            replace
          />
        }
      />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;