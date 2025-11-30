import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { FaEnvelope, FaKey } from 'react-icons/fa';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    // TODO: Implement forgot password API call
    setTimeout(() => {
      setMessage('Password reset link has been sent to your email (if implemented)');
      setIsLoading(false);
    }, 1000);
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
        <div className="text-center mb-6">
          <FaKey className="mx-auto text-4xl mb-4" style={{ color: '#0d6efd' }} />
          <h3 
            className="font-bold text-2xl"
            style={{ color: '#0d6efd' }}
          >
            Forgot Password
          </h3>
          <p className="text-gray-600 text-sm mt-2">
            Enter your email address and we'll send you a link to reset your password.
          </p>
        </div>
        
        {message && (
          <div className="mb-4 p-3 bg-blue-100 border border-blue-400 text-blue-700 rounded-lg text-sm">
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block mb-2 font-medium text-gray-700">
              <FaEnvelope className="inline mr-2" />
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

          <button
            type="submit"
            className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            disabled={isLoading}
            style={{ borderRadius: '8px' }}
          >
            {isLoading ? (
              <>
                <span className="loading loading-spinner loading-sm mr-2"></span>
                Sending...
              </>
            ) : (
              'Send Reset Link'
            )}
          </button>
        </form>

        <div className="text-center mt-6">
          <Link 
            to="/login" 
            className="text-sm text-blue-600 hover:text-blue-800 hover:underline"
          >
            ← Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
}

