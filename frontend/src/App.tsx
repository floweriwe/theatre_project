import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { MainLayout } from './components/layout/MainLayout';
import { useAuthStore } from './store/authStore';
// Auth pages
import { LoginPage } from './pages/auth/LoginPage';
import { RegisterPage } from './pages/auth/RegisterPage';
import { ForgotPasswordPage } from './pages/auth/ForgotPasswordPage';
import { ResetPasswordPage } from './pages/auth/ResetPasswordPage';
import { VerifyEmailPage } from './pages/auth/VerifyEmailPage';
// Main pages
import { DashboardPage } from './pages/dashboard/DashboardPage';
import { InventoryListPage } from './pages/inventory/InventoryListPage';
import { InventoryItemPage } from './pages/inventory/InventoryItemPage';
import { InventoryFormPage } from './pages/inventory/InventoryFormPage';
import { DocumentsListPage } from './pages/documents/DocumentsListPage';
import { DocumentViewPage } from './pages/documents/DocumentViewPage';
import { DocumentFormPage } from './pages/documents/DocumentFormPage';
import { PerformancesListPage } from './pages/performances/PerformancesListPage';
import { PerformanceViewPage } from './pages/performances/PerformanceViewPage';
import { PerformanceFormPage } from './pages/performances/PerformanceFormPage';
import { SchedulePage } from './pages/schedule/SchedulePage';
import { ProfilePage } from './pages/profile/ProfilePage';
import { SettingsPage } from './pages/settings/SettingsPage';
// Admin pages
import { UsersListPage } from './pages/admin/UsersListPage';
import { UserDetailPage } from './pages/admin/UserDetailPage';
import { CategoriesPage } from './pages/admin/CategoriesPage';
import { AuditLogPage } from './pages/admin/AuditLogPage';
// Reports pages
import { ReportsPage } from './pages/reports/ReportsPage';
// Help pages
import { HelpPage } from './pages/help/HelpPage';
// Error pages
import { NotFoundPage } from './pages/error/NotFoundPage';

// Ãâ€”ÃÂ°Ã‘â€°ÃÂ¸Ã‘â€°Ã‘â€˜ÃÂ½ÃÂ½Ã‘â€¹ÃÂ¹ Ã‘â‚¬ÃÂ¾Ã‘Æ’Ã‘â€š
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated } = useAuthStore();
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
};

// ÃÅ¸Ã‘Æ’ÃÂ±ÃÂ»ÃÂ¸Ã‘â€¡ÃÂ½Ã‘â€¹ÃÂ¹ Ã‘â‚¬ÃÂ¾Ã‘Æ’Ã‘â€š (Ã‘â‚¬ÃÂµÃÂ´ÃÂ¸Ã‘â‚¬ÃÂµÃÂºÃ‘â€š ÃÂµÃ‘ÂÃÂ»ÃÂ¸ ÃÂ°ÃÂ²Ã‘â€šÃÂ¾Ã‘â‚¬ÃÂ¸ÃÂ·ÃÂ¾ÃÂ²ÃÂ°ÃÂ½)
const PublicRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated } = useAuthStore();
  
  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }
  
  return <>{children}</>;
};

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* ÃÅ¸Ã‘Æ’ÃÂ±ÃÂ»ÃÂ¸Ã‘â€¡ÃÂ½Ã‘â€¹ÃÂµ ÃÂ¼ÃÂ°Ã‘â‚¬Ã‘Ë†Ã‘â‚¬Ã‘Æ’Ã‘â€šÃ‘â€¹ */}
        <Route
          path="/login"
          element={
            <PublicRoute>
              <LoginPage />
            </PublicRoute>
          }
        />
        <Route
          path="/register"
          element={
            <PublicRoute>
              <RegisterPage />
            </PublicRoute>
          }
        />
        <Route
          path="/forgot-password"
          element={
            <PublicRoute>
              <ForgotPasswordPage />
            </PublicRoute>
          }
        />
        <Route
          path="/reset-password"
          element={
            <PublicRoute>
              <ResetPasswordPage />
            </PublicRoute>
          }
        />
        <Route
          path="/verify-email"
          element={
            <PublicRoute>
              <VerifyEmailPage />
            </PublicRoute>
          }
        />
        
        {/* Ãâ€”ÃÂ°Ã‘â€°ÃÂ¸Ã‘â€°Ã‘â€˜ÃÂ½ÃÂ½Ã‘â€¹ÃÂµ ÃÂ¼ÃÂ°Ã‘â‚¬Ã‘Ë†Ã‘â‚¬Ã‘Æ’Ã‘â€šÃ‘â€¹ ÃÂ²ÃÂ½Ã‘Æ’Ã‘â€šÃ‘â‚¬ÃÂ¸ MainLayout */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <MainLayout />
            </ProtectedRoute>
          }
        >
          {/* Dashboard */}
          <Route index element={<DashboardPage />} />
          
          {/* ÃËœÃÂ½ÃÂ²ÃÂµÃÂ½Ã‘â€šÃÂ°Ã‘â‚¬Ã‘Å’ */}
          <Route path="inventory">
            <Route index element={<InventoryListPage />} />
            <Route path="new" element={<InventoryFormPage />} />
            <Route path=":id" element={<InventoryItemPage />} />
            <Route path=":id/edit" element={<InventoryFormPage />} />
          </Route>
          
          {/* Ãâ€ÃÂ¾ÃÂºÃ‘Æ’ÃÂ¼ÃÂµÃÂ½Ã‘â€šÃ‘â€¹ */}
          <Route path="documents">
            <Route index element={<DocumentsListPage />} />
            <Route path="upload" element={<DocumentFormPage />} />
            <Route path=":id" element={<DocumentViewPage />} />
            <Route path=":id/edit" element={<DocumentFormPage />} />
          </Route>
          
          {/* ÃÂ¡ÃÂ¿ÃÂµÃÂºÃ‘â€šÃÂ°ÃÂºÃÂ»ÃÂ¸ */}
          <Route path="performances">
            <Route index element={<PerformancesListPage />} />
            <Route path="new" element={<PerformanceFormPage />} />
            <Route path=":id" element={<PerformanceViewPage />} />
            <Route path=":id/edit" element={<PerformanceFormPage />} />
          </Route>
          
          {/* ÃÂ ÃÂ°Ã‘ÂÃÂ¿ÃÂ¸Ã‘ÂÃÂ°ÃÂ½ÃÂ¸ÃÂµ */}
          <Route path="schedule" element={<SchedulePage />} />
          
          {/* ÃÅ¸Ã‘â‚¬ÃÂ¾Ã‘â€žÃÂ¸ÃÂ»Ã‘Å’ ÃÂ¸ ÃÂ½ÃÂ°Ã‘ÂÃ‘â€šÃ‘â‚¬ÃÂ¾ÃÂ¹ÃÂºÃÂ¸ */}
          <Route path="profile" element={<ProfilePage />} />
          <Route path="settings" element={<SettingsPage />} />
          
          {/* ÃÅ¾Ã‘â€šÃ‘â€¡Ã‘â€˜Ã‘â€šÃ‘â€¹ */}
          <Route path="reports" element={<ReportsPage />} />
          
          {/* ÃÂÃÂ´ÃÂ¼ÃÂ¸ÃÂ½ÃÂ¸Ã‘ÂÃ‘â€šÃ‘â‚¬ÃÂ¸Ã‘â‚¬ÃÂ¾ÃÂ²ÃÂ°ÃÂ½ÃÂ¸ÃÂµ */}
          <Route path="admin">
            <Route path="users" element={<UsersListPage />} />
            <Route path="users/:id" element={<UserDetailPage />} />
            <Route path="users/:id/edit" element={<UserDetailPage />} />
            <Route path="categories" element={<CategoriesPage />} />
            <Route path="audit" element={<AuditLogPage />} />
          </Route>
          
          {/* ÃÂ¡ÃÂ¿Ã‘â‚¬ÃÂ°ÃÂ²ÃÂºÃÂ° */}
          <Route path="help" element={<HelpPage />} />
        </Route>
        
        {/* 404 */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  );
}
