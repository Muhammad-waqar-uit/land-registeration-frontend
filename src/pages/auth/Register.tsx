import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAppDispatch } from '../../store/hooks';
import { registerUser } from '../../store/slices/authSlice';
import type { UserRole } from '../../types';
import { FaUser, FaLock, FaEnvelope, FaUserTag } from 'react-icons/fa';

export default function Register() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'buyer' as UserRole,
  });
  const [error, setError] = useState('');
  
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    try {
      const { confirmPassword, ...registerData } = formData;
      const result = await dispatch(registerUser(registerData));
      
      if (registerUser.fulfilled.match(result)) {
        const user = result.payload.user;
        // Redirect based on role
        const roleRoutes: Record<UserRole, string> = {
          admin: '/dashboard/admin',
          seller: '/dashboard/seller',
          buyer: '/dashboard/buyer',
          builder: '/dashboard/builder',
        };
        navigate(roleRoutes[user.role] || '/dashboard');
      } else {
        setError(result.payload as string || 'Registration failed');
      }
    } catch (err) {
      setError('An unexpected error occurred');
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
        className="w-full max-w-md bg-white rounded-xl shadow-2xl flex flex-col"
        style={{ 
          boxShadow: '0 0 20px rgba(0,0,0,0.1)',
          maxHeight: '90vh',
          overflow: 'hidden'
        }}
      >
        <div className="p-6 pb-4 flex-shrink-0">
          <h3 
            className="text-center font-bold text-2xl"
            style={{ color: '#0d6efd' }}
          >
            Create Account
          </h3>
        </div>
        
        <div className="px-6 pb-4 flex-shrink-0">
          {error && (
            <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg text-sm">
              {error}
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto px-6 custom-scrollbar">
          <form onSubmit={handleSubmit} className="space-y-5 pb-4">
          <div>
            <label className="block mb-2 font-medium text-gray-700">
              <FaUser className="inline mr-2" />
              Full Name
            </label>
            <input
              type="text"
              name="name"
              placeholder="Enter your full name"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              value={formData.name}
              onChange={handleChange}
              required
              style={{ borderRadius: '8px', color: '#111827', backgroundColor: '#ffffff' }}
            />
          </div>

          <div>
            <label className="block mb-2 font-medium text-gray-700">
              <FaEnvelope className="inline mr-2" />
              Email
            </label>
            <input
              type="email"
              name="email"
              placeholder="Enter your email"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              value={formData.email}
              onChange={handleChange}
              required
              style={{ borderRadius: '8px', color: '#111827', backgroundColor: '#ffffff' }}
            />
          </div>

          <div>
            <label className="block mb-2 font-medium text-gray-700">
              <FaUserTag className="inline mr-2" />
              Role
            </label>
            <select
              name="role"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all appearance-none"
              value={formData.role}
              onChange={handleChange}
              required
              style={{ 
                borderRadius: '8px',
                color: '#111827',
                backgroundColor: '#ffffff',
                cursor: 'pointer'
              }}
            >
              <option value="buyer">Buyer</option>
              <option value="seller">Seller</option>
              <option value="builder">Builder</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          <div>
            <label className="block mb-2 font-medium text-gray-700">
              <FaLock className="inline mr-2" />
              Password
            </label>
            <input
              type="password"
              name="password"
              placeholder="Enter your password"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              value={formData.password}
              onChange={handleChange}
              required
              minLength={6}
              style={{ borderRadius: '8px', color: '#111827', backgroundColor: '#ffffff' }}
            />
          </div>

          <div>
            <label className="block mb-2 font-medium text-gray-700">
              <FaLock className="inline mr-2" />
              Confirm Password
            </label>
            <input
              type="password"
              name="confirmPassword"
              placeholder="Confirm your password"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
              minLength={6}
              style={{ borderRadius: '8px', color: '#111827', backgroundColor: '#ffffff' }}
            />
          </div>

          <button
            type="submit"
            className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ borderRadius: '8px' }}
          >
            Sign Up
          </button>
          </form>
        </div>

        <div className="p-6 pt-4 flex-shrink-0 border-t border-gray-200">
          <p className="text-center mb-0 text-gray-600">
            Already have an account?{' '}
            <Link 
              to="/login" 
              className="text-blue-600 hover:text-blue-800 font-semibold hover:underline"
            >
              Login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

