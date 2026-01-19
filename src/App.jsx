import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import useAuthStore from './store/authStore';

// Pages
import LandingPage from './pages/LandingPage';
import ComingSoon from './pages/ComingSoon';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Students from './pages/Students';
import Categories from './pages/Categories';
import Suppliers from './pages/Suppliers';
import Products from './pages/Products';
import PointOfSales from './pages/PointOfSales';
import Transaction from './pages/Transaction';
import PaymentMethods from './pages/PaymentMethods';
import Liabilities from './pages/Liabilities';

import Reports from './pages/Reports';
import Settings from './pages/Settings';
import StockOpname from './pages/StockOpname';
import BillingTemplates from './pages/BillingTemplates';
import ItemBundles from './pages/ItemBundles';


// Audit & Logs Pages
import AuditLogs from './pages/audit/AuditLogs';
import LoginHistory from './pages/audit/LoginHistory';
import SecurityLogs from './pages/audit/SecurityLogs';
import NotFound from './pages/NotFound';

// Protected Route Component
function ProtectedRoute({ children }) {
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

// Public Route Component (redirects to dashboard if already logged in)
function PublicRoute({ children }) {
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

// Handler for /logout route
function LogoutHandler() {
  const logout = useAuthStore(state => state.logout);

  // Perform logout on mount
  useEffect(() => {
    logout();
  }, [logout]);

  return <Navigate to="/login" replace />;
}

function App() {
  return (
    <BrowserRouter>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: '#363636',
            color: '#fff',
          },
          success: {
            iconTheme: {
              primary: '#10b981',
              secondary: '#fff',
            },
          },
          error: {
            iconTheme: {
              primary: '#ef4444',
              secondary: '#fff',
            },
          },
        }}
      />

      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<LandingPage />} />
        <Route
          path="/login"
          element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          }
        />
        <Route
          path="/logout"
          element={<LogoutHandler />}
        />

        {/* Protected Routes - Available */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/students"
          element={
            <ProtectedRoute>
              <Students />
            </ProtectedRoute>
          }
        />

        <Route
          path="/pos"
          element={
            <ProtectedRoute>
              <PointOfSales />
            </ProtectedRoute>
          }
        />

        <Route
          path="/transactions"
          element={
            <ProtectedRoute>
              <Transaction />
            </ProtectedRoute>
          }
        />

        <Route
          path="/liabilities"
          element={
            <ProtectedRoute>
              <Liabilities />
            </ProtectedRoute>
          }
        />

        <Route
          path="/products"
          element={
            <ProtectedRoute>
              <Products />
            </ProtectedRoute>
          }
        />

        <Route
          path="/categories"
          element={
            <ProtectedRoute>
              <Categories />
            </ProtectedRoute>
          }
        />

        <Route
          path="/suppliers"
          element={
            <ProtectedRoute>
              <Suppliers />
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
          path="/payment-methods"
          element={
            <ProtectedRoute>
              <PaymentMethods />
            </ProtectedRoute>
          }
        />

        <Route
          path="/users"
          element={
            <ProtectedRoute>
              <ComingSoon />
            </ProtectedRoute>
          }
        />



        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <Settings />
            </ProtectedRoute>
          }
        />

        <Route path="/stock-opname" element={<ProtectedRoute><StockOpname /></ProtectedRoute>} />
        <Route path="/billing-templates" element={<ProtectedRoute><BillingTemplates /></ProtectedRoute>} />
        <Route path="/item-bundles" element={<ProtectedRoute><ItemBundles /></ProtectedRoute>} />

        {/* Audit & Logs Routes */}
        <Route path="/audit/logs" element={<ProtectedRoute><AuditLogs /></ProtectedRoute>} />
        <Route path="/audit/login-history" element={<ProtectedRoute><LoginHistory /></ProtectedRoute>} />
        <Route path="/audit/security" element={<ProtectedRoute><SecurityLogs /></ProtectedRoute>} />

        {/* Catch all - 404 Not Found */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;