import './App.css';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from '@/components/ui/sonner';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import FamiliesPage from './pages/FamiliesPage';
import FamiliesPublic from './pages/FamiliesPublic';
import FamilyDetails from './pages/FamilyDetails';
import HealthCasesPage from './pages/HealthCasesPage';
import CoursesPage from './pages/CoursesPage';
import ProjectsPage from './pages/ProjectsPage';
import InitiativesPage from './pages/InitiativesPage';
import AdminDashboard from './pages/AdminDashboard';
import DonationsManagement from './pages/DonationsManagement';
import MyDonationsPage from './pages/MyDonationsPage';
import OurMissionPage from './pages/OurMissionPage';
import ProfilePage from './pages/ProfilePage';
import CommitteeDashboard from './pages/CommitteeDashboard';
import HealthcareManagement from './pages/HealthcareManagement';
import { AuthProvider, useAuth } from './context/AuthContext';

const ProtectedRoute = ({ children, adminOnly = false, committeeOnly = false }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
    </div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (adminOnly && user.role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  if (committeeOnly && !['admin', 'committee_member', 'committee_president'].includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return children;
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="App">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/families-public" element={<FamiliesPublic />} />
            <Route path="/family/:familyId" element={<FamilyDetails />} />
            <Route path="/families" element={<FamiliesPage />} />
            <Route path="/health-cases" element={<HealthCasesPage />} />
            <Route path="/courses" element={<CoursesPage />} />
            <Route path="/projects" element={<ProjectsPage />} />
            <Route path="/initiatives" element={<InitiativesPage />} />
            <Route path="/our-mission" element={<OurMissionPage />} />
            <Route 
              path="/profile" 
              element={
                <ProtectedRoute>
                  <ProfilePage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/my-donations" 
              element={
                <ProtectedRoute>
                  <MyDonationsPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin" 
              element={
                <ProtectedRoute committeeOnly>
                  <AdminDashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/donations-management" 
              element={
                <ProtectedRoute committeeOnly>
                  <DonationsManagement />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/committee-dashboard" 
              element={
                <ProtectedRoute committeeOnly>
                  <CommitteeDashboard />
                </ProtectedRoute>
              } 
            />
          </Routes>
          <Toaster position="top-center" richColors />
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;