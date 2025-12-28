import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from './store/hooks';
import { fetchCurrentUser } from './store/slices/authSlice';

// Auth Pages
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword from './pages/auth/ResetPassword';

// Dashboard Pages
import AdminDashboard from './pages/dashboard/AdminDashboard';
import SellerDashboard from './pages/dashboard/SellerDashboard';
import SellerMyLands from './pages/dashboard/SellerMyLands';
import BuyerDashboard from './pages/dashboard/BuyerDashboard';
import BuilderDashboard from './pages/dashboard/BuilderDashboard';
import RegisterLand from './pages/dashboard/RegisterLand';
import UpdateLand from './pages/dashboard/UpdateLand';

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
  const { token, user, isLoading } = useAppSelector((state) => state.auth);

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

        {/* Protected Routes - Seller */}
        <Route
          path="/dashboard/seller"
          element={
            <ProtectedRoute allowedRoles={['seller']}>
              <SellerDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/seller/lands"
          element={
            <ProtectedRoute allowedRoles={['seller']}>
              <SellerMyLands />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/seller/register-land"
          element={
            <ProtectedRoute allowedRoles={['seller']}>
              <RegisterLand />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/seller/update-land/:id"
          element={
            <ProtectedRoute allowedRoles={['seller', 'admin']}>
              <UpdateLand />
            </ProtectedRoute>
          }
        />

        {/* Protected Routes - Buyer */}
        <Route
          path="/dashboard/buyer"
          element={
            <ProtectedRoute allowedRoles={['buyer']}>
              <BuyerDashboard />
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
    seller: '/dashboard/seller',
    buyer: '/dashboard/buyer',
    builder: '/dashboard/builder',
  };

  return <Navigate to={roleRoutes[user.role] || '/login'} replace />;
}

export default App;
