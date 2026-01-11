import { useState, useEffect } from 'react';
import type { FormEvent } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { FaKey, FaLock } from 'react-icons/fa';
import { authAPI } from '../../services/api';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [token, setToken] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Get token from URL query parameter
    const tokenFromUrl = searchParams.get('token');
    if (tokenFromUrl) {
      setToken(tokenFromUrl);
    } else {
      setError('Invalid reset link. Please request a new password reset.');
    }
  }, [searchParams]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');

    // Validate passwords match
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    // Validate password length
    if (password.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    setIsLoading(true);
    try {
      const response = await authAPI.resetPassword({
        token,
        newPassword: password,
      });
      setMessage(response.message || 'Password reset successfully');
      
      // Redirect to login after 2 seconds
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err: any) {
      setError(
        err.response?.data?.message || 'Failed to reset password. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (!token) {
    return (
      <div 
        className="min-h-screen flex items-center justify-center p-8"
        style={{
          background: 'linear-gradient(to bottom right, #0d6efd, #6610f2)',
          fontFamily: "'Poppins', sans-serif"
        }}
      >
        <div 
          className="w-full max-w-md p-10 rounded-xl shadow-2xl"
          style={{ boxShadow: '0 0 20px rgba(0,0,0,0.3)', backgroundColor: '#1f2937' }}
        >
          <div className="text-center mb-6">
            <FaKey className="mx-auto text-4xl mb-4" style={{ color: '#dc2626' }} />
            <h3 
              className="font-bold text-2xl"
              style={{ color: '#ef4444' }}
            >
              Invalid Reset Link
            </h3>
            <p className="text-sm mt-2" style={{ color: '#d1d5db' }}>
              This reset link is invalid or has expired. Please request a new password reset.
            </p>
          </div>
          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg text-sm">
              {error}
            </div>
          )}
          <div className="text-center mt-6">
            <Link 
              to="/forgot-password" 
              className="inline-block px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors duration-200"
            >
              Request New Reset Link
            </Link>
          </div>
          <div className="text-center mt-4">
            <Link 
              to="/login" 
              className="text-sm hover:underline"
              style={{ color: '#60a5fa' }}
            >
              ← Back to Login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen flex items-center justify-center p-8"
      style={{
        background: 'linear-gradient(to bottom right, #0d6efd, #6610f2)',
        fontFamily: "'Poppins', sans-serif"
      }}
    >
      <div 
        className="w-full max-w-md p-10 rounded-xl shadow-2xl"
        style={{ boxShadow: '0 0 20px rgba(0,0,0,0.3)', backgroundColor: '#1f2937' }}
      >
        <div className="text-center mb-6">
          <FaLock className="mx-auto text-4xl mb-4" style={{ color: '#0d6efd' }} />
          <h3 
            className="font-bold text-2xl"
            style={{ color: '#60a5fa' }}
          >
            Reset Password
          </h3>
          <p className="text-sm mt-2" style={{ color: '#d1d5db' }}>
            Enter your new password below.
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg text-sm">
            {error}
          </div>
        )}
        {message && (
          <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded-lg text-sm">
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block mb-2 font-medium text-white">
              <FaLock className="inline mr-2" />
              New Password
            </label>
            <input
              type="password"
              placeholder="Enter new password (min 8 characters)"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              disabled={isLoading}
              style={{ borderRadius: '8px', color: '#ffffff', backgroundColor: '#1f2937', borderColor: '#374151' }}
            />
            <p className="text-xs mt-1" style={{ color: '#9ca3af' }}>Password must be at least 8 characters</p>
          </div>

          <div>
            <label className="block mb-2 font-medium text-white">
              <FaLock className="inline mr-2" />
              Confirm Password
            </label>
            <input
              type="password"
              placeholder="Confirm new password"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={8}
              disabled={isLoading}
              style={{ borderRadius: '8px', color: '#ffffff', backgroundColor: '#1f2937', borderColor: '#374151' }}
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
                Resetting...
              </>
            ) : (
              'Reset Password'
            )}
          </button>
        </form>

        <div className="text-center mt-6">
          <Link 
            to="/login" 
            className="text-sm hover:underline"
            style={{ color: '#60a5fa' }}
          >
            ← Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
}
