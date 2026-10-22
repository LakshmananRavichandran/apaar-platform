import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useAuthStore } from './store/useAuthStore';

// Layout
import { MainLayout } from './components/layout/MainLayout';

// Pages
import { Login } from './pages/Login';
import { Home } from './pages/Home';
import { Dashboard } from './pages/Dashboard';
import { Students } from './pages/Students';
import { StudentDetail } from './pages/StudentDetail';
import { Colleges } from './pages/Colleges';
import { VerificationHub } from './pages/VerificationHub';
import { Flags } from './pages/Flags';
import { Duplicates } from './pages/Duplicates';
import { Approvals } from './pages/Approvals';
import { BulkUpload } from './pages/BulkUpload';
import { Reports } from './pages/Reports';
import { VerifierPortal } from './pages/VerifierPortal';
import { StudentPortal } from './pages/StudentPortal';
import { AuditLogs } from './pages/AuditLogs';
import { SystemHealth } from './pages/SystemHealth';
import { PrivacyPolicy } from './pages/PrivacyPolicy';
import { PublicVerify } from './pages/PublicVerify';

// Protected Route Component
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuthStore();
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return <MainLayout>{children}</MainLayout>;
};

export function App() {
  return (
    <BrowserRouter>
      {/* Toast notifications styled like Spotify dark theme */}
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: '#181818',
            color: '#fff',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '12px',
            fontSize: '13px',
            padding: '12px 16px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.5)'
          },
          success: {
            iconTheme: {
              primary: '#1DB954',
              secondary: '#000'
            }
          },
          error: {
            iconTheme: {
              primary: '#EF4444',
              secondary: '#fff'
            }
          }
        }}
      />

      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/verify-public" element={<PublicVerify />} />

        {/* Protected Routes wrapped in MainLayout */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Home />
            </ProtectedRoute>
          }
        />
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
          path="/students/:id"
          element={
            <ProtectedRoute>
              <StudentDetail />
            </ProtectedRoute>
          }
        />
        <Route
          path="/colleges"
          element={
            <ProtectedRoute>
              <Colleges />
            </ProtectedRoute>
          }
        />
        <Route
          path="/verification"
          element={
            <ProtectedRoute>
              <VerificationHub />
            </ProtectedRoute>
          }
        />
        <Route
          path="/flags"
          element={
            <ProtectedRoute>
              <Flags />
            </ProtectedRoute>
          }
        />
        <Route
          path="/duplicates"
          element={
            <ProtectedRoute>
              <Duplicates />
            </ProtectedRoute>
          }
        />
        <Route
          path="/approvals"
          element={
            <ProtectedRoute>
              <Approvals />
            </ProtectedRoute>
          }
        />
        <Route
          path="/bulk-upload"
          element={
            <ProtectedRoute>
              <BulkUpload />
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
          path="/verifier"
          element={
            <ProtectedRoute>
              <VerifierPortal />
            </ProtectedRoute>
          }
        />
        <Route
          path="/student-portal"
          element={
            <ProtectedRoute>
              <StudentPortal />
            </ProtectedRoute>
          }
        />
        <Route
          path="/audit-logs"
          element={
            <ProtectedRoute>
              <AuditLogs />
            </ProtectedRoute>
          }
        />
        <Route
          path="/system-health"
          element={
            <ProtectedRoute>
              <SystemHealth />
            </ProtectedRoute>
          }
        />
        <Route
          path="/privacy"
          element={
            <ProtectedRoute>
              <PrivacyPolicy />
            </ProtectedRoute>
          }
        />
        <Route
          path="/privacy-policy"
          element={
            <ProtectedRoute>
              <PrivacyPolicy />
            </ProtectedRoute>
          }
        />

        {/* Catch-all redirect */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
