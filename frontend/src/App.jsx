import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';

// Layouts
import PublicLayout from './components/layout/PublicLayout';
import DashboardLayout from './components/layout/DashboardLayout';

// Public Pages
import LandingPage from './pages/public/LandingPage';
import LoginPage from './pages/public/LoginPage';
import RegisterPage from './pages/public/RegisterPage';
import VerifyPage from './pages/public/VerifyPage';
import ForgotPasswordPage from './pages/public/ForgotPasswordPage';
import ResetPasswordPage from './pages/public/ResetPasswordPage';
import OAuthSuccessPage from './pages/public/OAuthSuccessPage';

// Worker Pages
import WorkerDashboard from './pages/worker/WorkerDashboard';
import JobBoardPage from './pages/worker/JobBoardPage';
import MyComplaints from './pages/worker/MyComplaints';
import WorkerNewComplaintPage from './pages/worker/NewComplaintPage';
import FileComplaintPage from './pages/worker/FileComplaintPage';
import ComplaintDetailsPage from './pages/worker/ComplaintDetailsPage';
import MyAppointments from './pages/worker/MyAppointments';
import WorkerProfile from './pages/worker/WorkerProfile';

// Portals
import EmployerDashboard from './pages/employer/EmployerDashboard';
import JobFormPage from './pages/employer/JobFormPage';
import JobApplicantsPage from './pages/employer/JobApplicantsPage';
import LegalDashboard from './pages/legal/LegalDashboard';
import LegalAppointments from './pages/legal/LegalAppointments';
import NGODashboard from './pages/ngo/NGODashboard';

// Shared
import CommunityFeedPage from './pages/community/CommunityFeedPage';
import AdvocacyHub from './pages/community/AdvocacyHub';
import UserProfilePage from './pages/community/UserProfilePage';
import ExplorePage from './pages/community/ExplorePage';
import BookmarksPage from './pages/community/BookmarksPage';
import ChatPage from './pages/messaging/ChatPage';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminAppointments from './pages/admin/AdminAppointments';
import NotificationsPage from './pages/notifications/NotificationsPage';

import { ProtectedRoute, PublicRoute } from './components/auth/ProtectedRoute';

import NGOCasesPage from './pages/ngo/NGOCasesPage';
import NGOImpactPage from './pages/ngo/NGOImpactPage';
import NGOReportPage from './pages/ngo/NGOReportPage';

import { AuthProvider } from './contexts/complaint/AuthContext';
import MyComplaintsPage from './pages/complaint/MyComplaintsPage';
import NewComplaintPage from './pages/complaint/NewComplaintPage';
import AdminComplaintBoard from './pages/complaint/AdminComplaintBoard';
import OfficerComplaintBoard from './pages/complaint/OfficerComplaintBoard';
import ComplaintDetailPage from './pages/complaint/ComplaintDetailPage';
import DevTestPage from './pages/complaint/DevTestPage';

const ComplaintsRoot = () => {
  const role = localStorage.getItem('userRole');
  if (role === 'worker') return <Navigate to="/complaints/my" replace />;
  if (role === 'admin') return <Navigate to="/complaints/admin" replace />;
  if (role === 'lawyer') return <Navigate to="/complaints/officer" replace />;
  return <Navigate to="/dashboard" replace />;
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <Toaster position="top-right" expand={false} richColors closeButton />
        <Routes>

          {/* ── Public ───────────────────────────────────────────────────────── */}
          <Route element={<PublicLayout />}>
            <Route path="/" element={<LandingPage />} />
            <Route path="/jobs" element={<JobBoardPage />} />
            <Route path="/advocacy" element={<AdvocacyHub />} />
            <Route path="/dev/test" element={<DevTestPage />} />

            <Route element={<PublicRoute />}>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/verify" element={<VerifyPage />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />
              <Route path="/reset-password" element={<ResetPasswordPage />} />
              <Route path="/oauth-success" element={<OAuthSuccessPage />} />
            </Route>
          </Route>

          {/* ── Worker Portal ────────────────────────────────────────────────── */}
          <Route element={<ProtectedRoute allowedRoles={['worker']} />}>
            <Route element={<DashboardLayout />}>
              <Route path="/worker/dashboard" element={<WorkerDashboard />} />
              <Route path="/worker/jobs" element={<JobBoardPage />} />
              <Route path="/worker/complaints" element={<MyComplaints />} />
              <Route path="/worker/complaints/new" element={<WorkerNewComplaintPage />} />
              <Route path="/worker/complaints/file" element={<FileComplaintPage />} />
              <Route path="/worker/complaints/:id" element={<ComplaintDetailsPage />} />
              <Route path="/worker/appointments" element={<MyAppointments />} />
              <Route path="/worker/profile" element={<WorkerProfile />} />
            </Route>
          </Route>

          {/* ── Employer Portal ──────────────────────────────────────────────── */}
          <Route element={<ProtectedRoute allowedRoles={['employer']} />}>
            <Route element={<DashboardLayout />}>
              <Route path="/employer/dashboard" element={<EmployerDashboard />} />
              <Route path="/employer/jobs" element={<EmployerDashboard />} />
              <Route path="/employer/jobs/new" element={<JobFormPage />} />
              <Route path="/employer/jobs/:id" element={<JobApplicantsPage />} />
              <Route path="/employer/jobs/:id/edit" element={<JobFormPage />} />
            </Route>
          </Route>

          {/* ── Legal Portal ─────────────────────────────────────────────────── */}
          <Route element={<ProtectedRoute allowedRoles={['lawyer']} />}>
            <Route element={<DashboardLayout />}>
              <Route path="/legal/dashboard" element={<LegalDashboard />} />
              <Route path="/legal/cases" element={<LegalDashboard />} />
              <Route path="/legal/cases/:id" element={<ComplaintDetailsPage />} />
              <Route path="/legal/appointments" element={<LegalAppointments />} />
            </Route>
          </Route>

          {/* ── NGO Portal ───────────────────────────────────────────────────── */}
          <Route element={<ProtectedRoute allowedRoles={['ngo']} />}>
            <Route element={<DashboardLayout />}>
              <Route path="/ngo/dashboard" element={<NGODashboard />} />
              <Route path="/ngo/cases" element={<NGOCasesPage />} />
              <Route path="/ngo/cases/:id" element={<ComplaintDetailsPage />} />
              <Route path="/ngo/impact" element={<NGOImpactPage />} />
              <Route path="/ngo/reports" element={<NGOReportPage />} />
            </Route>
          </Route>

          {/* ── Admin Portal ─────────────────────────────────────────────────── */}
          <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
            <Route element={<DashboardLayout />}>
              <Route path="/admin/dashboard" element={<AdminDashboard />} />
              <Route path="/admin/appointments" element={<AdminAppointments />} />
            </Route>
          </Route>

          {/* ── Complaint Module ─────────────────────────────────────────────── */}
          <Route element={<ProtectedRoute allowedRoles={['worker', 'admin', 'lawyer']} />}>
            <Route element={<DashboardLayout />}>
              <Route path="/complaints" element={<ComplaintsRoot />} />
              <Route path="/complaints/my" element={<MyComplaintsPage />} />
              <Route path="/complaints/new" element={<NewComplaintPage />} />
              <Route path="/complaints/admin" element={<AdminComplaintBoard />} />
              <Route path="/complaints/officer" element={<OfficerComplaintBoard />} />
              <Route path="/complaints/:id" element={<ComplaintDetailPage />} />
            </Route>
          </Route>

          {/* ── Shared Authenticated Routes ───────────────────────────────────── */}
          <Route element={<ProtectedRoute allowedRoles={['worker', 'admin', 'lawyer', 'employer', 'ngo']} />}>
            <Route element={<DashboardLayout />}>
              <Route path="/community"                     element={<CommunityFeedPage />} />
              <Route path="/community/explore"             element={<ExplorePage />} />
              <Route path="/community/bookmarks"           element={<BookmarksPage />} />
              <Route path="/community/advocacy"            element={<AdvocacyHub />} />
              <Route path="/community/profile/:userId"     element={<UserProfilePage />} />
              <Route path="/messages"                      element={<ChatPage />} />
              <Route path="/notifications"                  element={<NotificationsPage />} />
            </Route>
          </Route>

          {/* ── Fallback ─────────────────────────────────────────────────────── */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
