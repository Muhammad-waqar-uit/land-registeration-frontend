import { useState, useEffect } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { loginUser } from '../../store/slices/authSlice';
import type { UserRole } from '../../types';
import { FaUser, FaLock } from 'react-icons/fa';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  
  const dispatch = useAppDispatch();
  const { isLoading, isAuthenticated, user } = useAppSelector((state) => state.auth);
  const navigate = useNavigate();

  // Redirect if already logged in
  useEffect(() => {
    if (isAuthenticated && user) {
      const roleRoutes: Record<UserRole, string> = {
        admin: '/dashboard/admin',
        user: '/dashboard/buyer',
        builder: '/dashboard/builder',
      };
      navigate(roleRoutes[user.role] || '/dashboard', { replace: true });
    }
  }, [isAuthenticated, user, navigate]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      const result = await dispatch(loginUser({ email, password }));
      
      if (loginUser.fulfilled.match(result)) {
        const user = result.payload.user;
        // Redirect based on role
        const roleRoutes: Record<UserRole, string> = {
          admin: '/dashboard/admin',
          user: '/dashboard/buyer',
          builder: '/dashboard/builder',
        };
        navigate(roleRoutes[user.role] || '/dashboard');
      } else {
        setError(result.payload as string || 'Login failed');
      }
    } catch (err: any) {
      setError(err?.message || 'An unexpected error occurred');
    }
  };

  return (
    <div 
      className="min-h-screen flex items-center justify-center p-8"
      style={{
        background: 'linear-gradient(to bottom right, #0d6efd, #6610f2)',
        fontFamily: "'Poppins', sans-serif"
      }}
    >
      <div 
        className="w-full max-w-md bg-white p-10 rounded-xl shadow-2xl"
        style={{ boxShadow: '0 0 20px rgba(0,0,0,0.1)' }}
      >
        <h3 
          className="text-center font-bold text-2xl mb-8"
          style={{ color: '#0d6efd' }}
        >
          Login to Land Registry
        </h3>
        
        {error && (
          <div className="mb-4 p-3 bg-red-900/30 border border-red-500 text-red-200 rounded-lg text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block mb-2 font-medium text-white">
              <FaUser className="inline mr-2" />
              Email
            </label>
            <input
              type="email"
              placeholder="Enter your email"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{ borderRadius: '8px', color: '#111827', backgroundColor: '#ffffff' }}
            />
          </div>

          <div>
            <label className="block mb-2 font-medium text-white">
              <FaLock className="inline mr-2" />
              Password
            </label>
            <input
              type="password"
              placeholder="Enter your password"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{ borderRadius: '8px', color: '#111827', backgroundColor: '#ffffff' }}
            />
          </div>

          <button
            type="submit"
            className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            disabled={isLoading}
            style={{ borderRadius: '8px' }}
          >
            {isLoading ? (
              <>
                <span className="loading loading-spinner loading-sm mr-2"></span>
                Logging in...
              </>
            ) : (
              'Login'
            )}
          </button>
        </form>

        <div className="text-center mt-6">
          <Link 
            to="/forgot-password" 
            className="text-sm text-blue-600 hover:text-blue-800 hover:underline"
          >
            Forgot password?
          </Link>
        </div>

        <p className="text-center mt-4 mb-0 text-gray-300">
          Don't have an account?{' '}
          <Link 
            to="/register" 
            className="text-blue-400 hover:text-blue-300 font-semibold hover:underline"
          >
            Sign Up
          </Link>
        </p>
      </div>
    </div>
  );
}

