import { useState, useEffect } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { registerUser } from '../../store/slices/authSlice';
import type { UserRole } from '../../types';
import { FaUser, FaLock, FaEnvelope, FaUserTag } from 'react-icons/fa';

export default function Register() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'user' as UserRole,
    cnic: '',
    fatherName: '',
    phoneNumber: '',
    // Builder-specific fields
    companyName: '',
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const dispatch = useAppDispatch();
  interface AuthState {
    isAuthenticated: boolean;
    user: {
      role: UserRole;
      [key: string]: any;
    } | null;
  }

  const { isAuthenticated, user } = useAppSelector((state: { auth: AuthState }) => state.auth);
  const navigate = useNavigate();

  // Redirect if already logged in
  useEffect(() => {
    if (isAuthenticated && user) {
      const roleRoutes: Record<UserRole, string> = {
        admin: '/dashboard/admin',
        user: '/dashboard/buyer',
        builder: '/dashboard/builder',
      };
      navigate(roleRoutes[user.role as UserRole] || '/dashboard', { replace: true });
    }
  }, [isAuthenticated, user, navigate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    // Format CNIC as user types
    if (name === 'cnic') {
      // Remove all non-digit characters
      const digitsOnly = value.replace(/\D/g, '');
      
      // Limit to 13 digits
      const limitedDigits = digitsOnly.slice(0, 13);
      
      // Format as 42201-3541356-7
      let formatted = limitedDigits;
      if (limitedDigits.length > 5) {
        formatted = limitedDigits.slice(0, 5) + '-' + limitedDigits.slice(5);
      }
      if (limitedDigits.length > 12) {
        formatted = limitedDigits.slice(0, 5) + '-' + limitedDigits.slice(5, 12) + '-' + limitedDigits.slice(12);
      }
      
      setFormData({
        ...formData,
        [name]: formatted,
      });
    } else {
      setFormData({
        ...formData,
        [name]: value,
      });
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    // Validate builder-specific fields
    if (formData.role === 'builder') {
      if (!formData.companyName) {
        setError('Company Name is required for builders');
        return;
      }
    }

    // Validate CNIC format if provided
    if (formData.cnic) {
      const cnicDigits = formData.cnic.replace(/\D/g, '');
      if (cnicDigits.length !== 13) {
        setError('CNIC must be exactly 13 digits');
        return;
      }
    }

    setIsLoading(true);
    try {
      const { confirmPassword, ...data } = formData;
      // Remove empty optional fields
      const registerData: any = {
        name: data.name,
        email: data.email,
        password: data.password,
        role: data.role,
      };
      if (data.cnic) registerData.cnic = data.cnic;
      if (data.fatherName) registerData.fatherName = data.fatherName;
      if (data.phoneNumber) registerData.phoneNumber = data.phoneNumber;
      if (data.role === 'builder') {
        registerData.companyName = data.companyName;
        registerData.licenseNumber = 'AUTO-GENERATED-LICENSE';
      }
      const result = await dispatch(registerUser(registerData));
      
      if (registerUser.fulfilled.match(result)) {
        const user = result.payload.user;
        // Redirect based on role
        const roleRoutes: Record<UserRole, string> = {
          admin: '/dashboard/admin',
          user: '/dashboard/buyer',
          builder: '/dashboard/builder',
        };
        navigate(roleRoutes[user.role as UserRole] || '/dashboard');
      } else {
        setError(result.payload as string || 'Registration failed');
      }
    } catch (err: any) {
      setError(err?.message || 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
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
              <option value="user">User (Buyer)</option>
              <option value="builder">Builder</option>
            </select>
          </div>

          {/* Optional User Fields */}
          <div>
            <label className="block mb-2 font-medium text-gray-700">
              CNIC (Optional)
            </label>
            <input
              type="text"
              name="cnic"
              placeholder="40000-000000-0"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              value={formData.cnic}
              onChange={handleChange}
              maxLength={15}
              style={{ borderRadius: '8px', color: '#111827', backgroundColor: '#ffffff' }}
            />
            {formData.cnic && formData.cnic.replace(/\D/g, '').length > 0 && formData.cnic.replace(/\D/g, '').length !== 13 && (
              <p className="text-xs text-red-500 mt-1">CNIC must be 13 digits ({formData.cnic.replace(/\D/g, '').length}/13)</p>
            )}
          </div>

          <div>
            <label className="block mb-2 font-medium text-gray-700">
              Father's Name (Optional)
            </label>
            <input
              type="text"
              name="fatherName"
              placeholder="Enter father's name"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              value={formData.fatherName}
              onChange={handleChange}
              style={{ borderRadius: '8px', color: '#111827', backgroundColor: '#ffffff' }}
            />
          </div>

          <div>
            <label className="block mb-2 font-medium text-gray-700">
              Phone Number (Optional)
            </label>
            <input
              type="tel"
              name="phoneNumber"
              placeholder="+923001234567"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              value={formData.phoneNumber}
              onChange={handleChange}
              style={{ borderRadius: '8px', color: '#111827', backgroundColor: '#ffffff' }}
            />
          </div>

          {/* Builder-specific Fields */}
          {formData.role === 'builder' && (
            <>
              <div>
                <label className="block mb-2 font-medium text-gray-700">
                  Company Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="companyName"
                  placeholder="ABC Construction Ltd."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  value={formData.companyName}
                  onChange={handleChange}
                  required
                  style={{ borderRadius: '8px', color: '#111827', backgroundColor: '#ffffff' }}
                />
              </div>
            </>
          )}

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
            className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            disabled={isLoading}
            style={{ borderRadius: '8px' }}
          >
            {isLoading ? (
              <>
                <span className="loading loading-spinner loading-sm mr-2"></span>
                Signing up...
              </>
            ) : (
              'Sign Up'
            )}
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

