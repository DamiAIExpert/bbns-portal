import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider, App as AntApp } from 'antd';
import { ThemeProvider } from 'styled-components';
import ErrorBoundary from './components/ErrorBoundary';

// --- THEME CONFIGURATION ---
const customTheme = {
  token: {
    colorPrimary: '#27ae60',
    borderRadius: 8,
  },
};

// --- LAYOUTS & AUTH COMPONENTS ---
import ProtectedRoute from './components/Auth/ProtectedRoute';
import UserLayout from './layouts/UserLayout';
import AdminLayout from './layouts/AdminLayout';
import NotFound from './components/Utils/NotFound';

// --- AUTH PAGES ---
import UserLogin from './pages/Auth/UserLogin';
import AdminLogin from './pages/Auth/AdminLogin';
import RegisterForm from './pages/Auth/RegisterForm';
import ForgotPassword from './pages/Auth/ForgotPassword';

// --- USER PAGES ---
import UserDashboard from './pages/User/UserDashboard';
import SubmitProposal from './pages/User/SubmitProposal';
import ViewProposals from './pages/User/ViewProposals';
import ProposalDetailsPage from './pages/User/ProposalDetailsPage';
import Profile from './pages/User/Profile';

// --- ADMIN PAGES ---
import AdminDashboard from './pages/Admin/AdminDashboard';
import EvaluationReportPage from './pages/Admin/EvaluationReportPage';
import UserManagementPage from './pages/Admin/UserManagementPage';
import AdminProposalsPage from './pages/Admin/AdminProposalsPage';
import AdminProposalDetailsPage from './pages/Admin/AdminProposalDetailsPage';
import SettingsPage from './pages/Admin/SettingsPage';
import BlockchainLogsPage from './pages/Admin/BlockchainLogsPage';
import FinalizePage from './pages/Admin/FinalizePage';
import NegotiationsPage from './pages/Admin/NegotiationsPage';
import BenchmarkingPage from './pages/Admin/BenchmarkingPage';
import FeasibilityPage from './pages/Admin/FeasibilityPage';
import ConflictsPage from './pages/Admin/ConflictsPage';
import AnalyticsPage from './pages/Admin/AnalyticsPage';
import RealTimeAnalyticsPage from './pages/Admin/RealTimeAnalyticsPage';
import ResearchAnalyticsPage from './pages/Admin/ResearchAnalyticsPage';

// --- PLACEHOLDER COMPONENTS for pages not yet built ---
const ResetPasswordPage = () => <div style={{ padding: 40 }}>Reset Password Page</div>;

// --- App Component ---
const App: React.FC = () => {
  useEffect(() => {
    // Global error handler to catch unhandled JavaScript errors
    const handleGlobalError = (event: ErrorEvent) => {
      console.error('Global error caught:', event.error);
      
      // Handle specific errors that might be from browser extensions
      if (event.message?.includes('resumeId') || 
          event.filename?.includes('contents.') ||
          event.filename?.includes('extension://')) {
        console.warn('Browser extension error detected and ignored:', event.message);
        event.preventDefault(); // Prevent the error from propagating
        return;
      }
      
      // Log other errors for debugging but don't break the app
      console.error('Unhandled error:', {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        error: event.error
      });
    };

    // Global promise rejection handler
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      console.error('Unhandled promise rejection:', event.reason);
      
      // Handle specific promise rejections
      if (event.reason?.message?.includes('resumeId')) {
        console.warn('Browser extension promise rejection detected and ignored:', event.reason.message);
        event.preventDefault();
        return;
      }
    };

    // Add event listeners
    window.addEventListener('error', handleGlobalError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    // Cleanup function
    return () => {
      window.removeEventListener('error', handleGlobalError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);

  return (
    <ConfigProvider theme={customTheme}>
      <ThemeProvider theme={customTheme}>
        <AntApp>
          <Router>
            <Routes>
              {/* --- Public Routes --- */}
              <Route path="/" element={<Navigate to="/login" replace />} />
              <Route path="/login" element={<UserLogin />} />
              <Route path="/admin/login" element={<AdminLogin />} />
              <Route path="/register" element={<RegisterForm />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password/:token" element={<ResetPasswordPage />} />

              {/* --- Protected User Routes --- */}
              <Route element={<ProtectedRoute access="user" />}>
                <Route path="/user" element={<UserLayout />}>
                  <Route index element={<Navigate to="dashboard" replace />} />
                  <Route path="dashboard" element={<UserDashboard />} />
                  <Route path="submit-proposal" element={<SubmitProposal />} />
                  <Route path="view-proposals" element={<ViewProposals />} />
                  <Route path="proposals/:proposalId" element={<ProposalDetailsPage />} />
                  <Route path="profile" element={<Profile />} />
                </Route>
              </Route>

              {/* --- Protected Admin Routes --- */}
              <Route element={<ProtectedRoute access="admin" />}>
                <Route path="/admin" element={<AdminLayout />}>
                  <Route index element={<Navigate to="dashboard" replace />} />
                  <Route path="dashboard" element={<AdminDashboard />} />
                  <Route path="analytics" element={<AnalyticsPage />} />
                  <Route path="real-time-analytics" element={<RealTimeAnalyticsPage />} />
                  <Route path="research-analytics" element={<ResearchAnalyticsPage />} />
                  <Route path="users" element={<UserManagementPage />} />
                  <Route path="proposals" element={<AdminProposalsPage />} />
                  <Route path="proposals/:proposalId" element={<AdminProposalDetailsPage />} />
                  <Route path="negotiations" element={<NegotiationsPage />} />
                  <Route path="benchmarking" element={
                    <ErrorBoundary>
                      <BenchmarkingPage />
                    </ErrorBoundary>
                  } />
                  <Route path="feasibility" element={<FeasibilityPage />} />
                  <Route path="conflicts" element={<ConflictsPage />} />
                  <Route path="finalize" element={<FinalizePage />} />
                  <Route path="evaluation" element={<EvaluationReportPage />} />
                  <Route path="blockchain-logs" element={<BlockchainLogsPage />} />
                  <Route path="settings" element={<SettingsPage />} />
                </Route>
              </Route>

              {/* --- Fallback Route --- */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Router>
        </AntApp>
      </ThemeProvider>
    </ConfigProvider>
  );
};

export default App;
