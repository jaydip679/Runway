import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import MainLayout from '../components/layout/MainLayout';
import Login from '../pages/auth/Login';
import Register from '../pages/auth/Register';
import VerifyOtp from '../pages/auth/VerifyOtp';
import ForgotPassword from '../pages/auth/ForgotPassword';
import ResetPassword from '../pages/auth/ResetPassword';
import Profile from '../pages/dashboard/Profile';
import { useAuth } from '../context/AuthContext';
import AccountsPage from '../features/accounts/AccountsPage';
import CategoriesManager from '../features/categories/CategoriesManager';
import TransactionsPage from '../features/transactions/TransactionsPage';
import RecurringPage from '../features/recurring/RecurringPage';
import ForecastPage from '../features/forecast/ForecastPage';
import AlertsPage from '../features/alerts/AlertsPage';
import AiAssistantPage from '../features/ai/AiAssistantPage';
import DashboardPage from '../features/dashboard/DashboardPage';
import AdminUsersPage from '../features/admin/AdminUsersPage';
import AdminCsvImportsPage from '../features/admin/AdminCsvImportsPage';
import AdminMetricsPage from '../features/admin/AdminMetricsPage';

const PublicRoute = ({ children }) => {
  const { user, isLoading } = useAuth();
  const location = useLocation();
  if (isLoading) return <div>Loading...</div>;
  if (user && location.pathname !== '/verify-otp') {
    return <Navigate to="/" replace />;
  }
  return children;
};

const ProtectedRoute = ({ children }) => {
  const { user, isLoading } = useAuth();
  if (isLoading) return <div>Loading...</div>;
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
      <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
      <Route path="/verify-otp" element={<PublicRoute><VerifyOtp /></PublicRoute>} />
      <Route path="/forgot-password" element={<PublicRoute><ForgotPassword /></PublicRoute>} />
      <Route path="/reset-password" element={<PublicRoute><ResetPassword /></PublicRoute>} />

      <Route path="/" element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
        <Route index element={<DashboardPage />} />
        <Route path="profile" element={<Profile />} />
        <Route path="accounts" element={<AccountsPage />} />
        <Route path="categories" element={<CategoriesManager />} />
        <Route path="transactions" element={<TransactionsPage />} />
        <Route path="recurring" element={<RecurringPage />} />
        <Route path="forecast" element={<ForecastPage />} />
        <Route path="alerts" element={<AlertsPage />} />
        <Route path="ai" element={<AiAssistantPage />} />
        
        {/* Admin Routes */}
        <Route path="admin/users" element={<AdminRoute><AdminUsersPage /></AdminRoute>} />
        <Route path="admin/csv-imports" element={<AdminRoute><AdminCsvImportsPage /></AdminRoute>} />
        <Route path="admin/metrics" element={<AdminRoute><AdminMetricsPage /></AdminRoute>} />
      </Route>
      
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default AppRoutes;
