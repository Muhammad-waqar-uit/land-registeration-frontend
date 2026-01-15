import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from './store/hooks';
import { fetchCurrentUser } from './store/slices/authSlice';
import type { RootState } from './store';

// Auth Pages
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword from './pages/auth/ResetPassword';

// Dashboard Pages
import AdminDashboard from './pages/dashboard/AdminDashboard';
import AdminProjects from './pages/dashboard/AdminProjects';
import AdminProjectDetail from './pages/dashboard/AdminProjectDetail';
import BuilderVerification from './pages/dashboard/BuilderVerification';
import SellerDashboard from './pages/dashboard/SellerDashboard';
import SellerMyLands from './pages/dashboard/SellerMyLands';
import BuyerDashboard from './pages/dashboard/BuyerDashboard';
import BuilderDashboard from './pages/dashboard/BuilderDashboard';
import RegisterLand from './pages/dashboard/RegisterLand';
import UpdateLand from './pages/dashboard/UpdateLand';
import Projects from './pages/dashboard/Projects';
import CreateProject from './pages/dashboard/CreateProject';
import UpdateProject from './pages/dashboard/UpdateProject';
import ProjectDetail from './pages/dashboard/ProjectDetail';
import PropertyRequests from './pages/dashboard/PropertyRequests';
import Agreements from './pages/dashboard/Agreements';
import CreateAgreement from './pages/dashboard/CreateAgreement';
import AgreementDetail from './pages/dashboard/AgreementDetail';
import Installments from './pages/dashboard/Installments';
import CreateInstallments from './pages/dashboard/CreateInstallments';
import ResaleRequests from './pages/dashboard/ResaleRequests';
import CreateResaleRequest from './pages/dashboard/CreateResaleRequest';
import MintTokens from './pages/dashboard/MintTokens';
import BuyerPayments from './pages/dashboard/BuyerPayments';
import SellerBuyerProgress from './pages/dashboard/SellerBuyerProgress';
import SellerPayments from './pages/dashboard/SellerPayments';
import BuilderPendingVerifications from './pages/dashboard/BuilderPendingVerifications';

// Other Pages
import Home from './pages/Home';
import About from './pages/About';
import Contact from './pages/Contact';
import Profile from './pages/Profile';
import LandDetail from './pages/LandDetail';
import Unauthorized from './pages/Unauthorized';
import ProtectedRoute from './components/ProtectedRoute';
import type { UserRole } from './types';

function App() {
  const dispatch = useAppDispatch();
  const { token, user, isLoading } = useAppSelector((state: RootState) => state.auth);

  useEffect(() => {
    // Fetch current user if token exists but user is not loaded
    // This ensures we have the latest user data from the server
    if (token && !user && !isLoading) {
      dispatch(fetchCurrentUser());
    }
  }, [dispatch, token, user, isLoading]);

  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/unauthorized" element={<Unauthorized />} />

        {/* Protected Routes - Admin */}
        <Route
          path="/dashboard/admin"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/admin/builders"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <BuilderVerification />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/admin/mint-tokens"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <MintTokens />
            </ProtectedRoute>
          }
        />

        <Route
          path="/dashboard/admin/projects"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminProjects />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/admin/projects/:id"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminProjectDetail />
            </ProtectedRoute>
          }
        />

        {/* Protected Routes - Builder */}
        <Route
          path="/dashboard/builder"
          element={
            <ProtectedRoute allowedRoles={['builder']}>
              <BuilderDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/builder/projects"
          element={
            <ProtectedRoute allowedRoles={['builder']}>
              <Projects />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/builder/projects/create"
          element={
            <ProtectedRoute allowedRoles={['builder']}>
              <CreateProject />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/builder/projects/:id/edit"
          element={
            <ProtectedRoute allowedRoles={['builder']}>
              <UpdateProject />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/builder/projects/:id"
          element={
            <ProtectedRoute allowedRoles={['builder']}>
              <ProjectDetail />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/builder/property-requests"
          element={
            <ProtectedRoute allowedRoles={['builder']}>
              <PropertyRequests />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/builder/agreements"
          element={
            <ProtectedRoute allowedRoles={['builder']}>
              <Agreements />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/builder/agreements/create"
          element={
            <ProtectedRoute allowedRoles={['builder']}>
              <CreateAgreement />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/builder/agreements/:id"
          element={
            <ProtectedRoute allowedRoles={['builder']}>
              <AgreementDetail />
            </ProtectedRoute>
          }
        />
        {/* Installments Routes */}
        <Route
          path="/dashboard/builder/installments"
          element={
            <ProtectedRoute allowedRoles={['builder']}>
              <Installments />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/builder/installments/create"
          element={
            <ProtectedRoute allowedRoles={['builder']}>
              <CreateInstallments />
            </ProtectedRoute>
          }
        />
        {/* Resale Request Routes */}
        <Route
          path="/dashboard/builder/resale-requests"
          element={
            <ProtectedRoute allowedRoles={['builder']}>
              <ResaleRequests />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/builder/pending"
          element={
            <ProtectedRoute allowedRoles={['builder']}>
              <BuilderPendingVerifications />
            </ProtectedRoute>
          }
        />
        {/* Legacy seller routes redirect to builder */}
        <Route
          path="/dashboard/seller"
          element={
            <ProtectedRoute allowedRoles={['builder']}>
              <SellerDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/seller/lands"
          element={
            <ProtectedRoute allowedRoles={['builder']}>
              <SellerMyLands />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/seller/buyers"
          element={
            <ProtectedRoute allowedRoles={['builder']}>
              <SellerBuyerProgress />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/seller/payments"
          element={
            <ProtectedRoute allowedRoles={['builder']}>
              <SellerPayments />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/seller/register-land"
          element={
            <ProtectedRoute allowedRoles={['builder']}>
              <RegisterLand />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/seller/update-land/:id"
          element={
            <ProtectedRoute allowedRoles={['builder', 'admin']}>
              <UpdateLand />
            </ProtectedRoute>
          }
        />

        {/* Protected Routes - User (Buyer) */}
        <Route
          path="/dashboard/buyer"
          element={
            <ProtectedRoute allowedRoles={['user']}>
              <BuyerDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/buyer/payments"
          element={
            <ProtectedRoute allowedRoles={['user']}>
              <BuyerPayments />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/buyer/agreements/:id"
          element={
            <ProtectedRoute allowedRoles={['user']}>
              <AgreementDetail />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/buyer/resale-request/create"
          element={
            <ProtectedRoute allowedRoles={['user']}>
              <CreateResaleRequest />
            </ProtectedRoute>
          }
        />
        {/* Shared Installments Route - Both buyer and builder can view */}
        <Route
          path="/dashboard/installments/:id"
          element={
            <ProtectedRoute allowedRoles={['user', 'builder']}>
              <AgreementDetail />
            </ProtectedRoute>
          }
        />

        {/* Common protected routes */}
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/lands/:id"
          element={
            <ProtectedRoute>
              <LandDetail />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardRedirect />
            </ProtectedRoute>
          }
        />

        {/* Default redirect */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

// Component to redirect to role-based dashboard
function DashboardRedirect() {
  const { user } = useAppSelector((state) => state.auth);

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const roleRoutes: Record<UserRole, string> = {
    admin: '/dashboard/admin',
    user: '/dashboard/buyer',
    builder: '/dashboard/builder',
  };

  return <Navigate to={roleRoutes[user.role] || '/login'} replace />;
}

export default App;
