import { Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from '../pages/LoginPage';
import Dashboard from '../pages/Dashboard';
import CreateReimbursement from '../pages/CreateReimbursement';
import EditReimbursement from '../pages/EditReimbursement';
import ReimbursementDetails from '../pages/ReimbursementDetails';
import CategoriesManagement from '../pages/CategoriesManagement';
import UsersManagement from '../pages/UsersManagement';
import NotFoundPage from '../pages/NotFoundPage';
import Forbidden from '../pages/Forbidden';
import ProtectedRoute from '../components/layout/ProtectedRoute';

import AppShell from '../components/layout/AppShell';

const AppRoutes = () => {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/403" element={<Forbidden />} />

      {/* Private Routes */}
      <Route 
        path="/" 
        element={
          <ProtectedRoute>
            <AppShell>
              <Dashboard />
            </AppShell>
          </ProtectedRoute>
        } 
      />

      <Route 
        path="/reimbursements/new" 
        element={
          <ProtectedRoute>
            <AppShell>
              <CreateReimbursement />
            </AppShell>
          </ProtectedRoute>
        } 
      />

      <Route
        path="/reimbursements/:id/edit"
        element={
          <ProtectedRoute>
            <AppShell>
              <EditReimbursement />
            </AppShell>
          </ProtectedRoute>
        } 
      />

      <Route 
        path="/reimbursements/:id" 
        element={
          <ProtectedRoute>
            <AppShell>
              <ReimbursementDetails />
            </AppShell>
          </ProtectedRoute>
        } 
      />

      <Route 
        path="/categories" 
        element={
          <ProtectedRoute allowedRoles={['ADMIN']}>
            <AppShell>
              <CategoriesManagement />
            </AppShell>
          </ProtectedRoute>
        } 
      />

      <Route
        path="/users"
        element={
          <ProtectedRoute allowedRoles={['ADMIN']}>
            <AppShell>
              <UsersManagement />
            </AppShell>
          </ProtectedRoute>
        }
      />
      
      {/* Fallback */}
      <Route path="/404" element={<NotFoundPage />} />
      <Route path="*" element={<Navigate to="/404" replace />} />
    </Routes>
  );
};

export default AppRoutes;
