import { useState, useEffect } from 'react';
import type { FormEvent } from 'react';
import { useAppSelector, useAppDispatch } from '../store/hooks';
import { updateProfile, updatePassword } from '../store/slices/authSlice';
import DashboardLayout from '../components/layouts/DashboardLayout';
import { HomeIcon, UserIcon } from '@heroicons/react/24/outline';

const navItems = [
  { name: 'Dashboard', path: '/dashboard', icon: HomeIcon },
  { name: 'Profile', path: '/profile', icon: UserIcon },
];

export default function Profile() {
  const { user, isLoading } = useAppSelector((state) => state.auth);
  const dispatch = useAppDispatch();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    role: user?.role || '',
    walletAddress: user?.walletAddress || '',
  });
  const [error, setError] = useState<string | null>(null);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
  });
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      // Only send name and email to API - role is not sent
      await dispatch(updateProfile({ name: formData.name, email: formData.email })).unwrap();
      setIsEditing(false);
    } catch (err: any) {
      setError(err || 'Failed to update profile');
    }
  };

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        role: user.role || '',
      });
    }
  }, [user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPasswordData({
      ...passwordData,
      [e.target.name]: e.target.value,
    });
    setPasswordError(null);
  };

  const handlePasswordSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setPasswordError(null);

    if (passwordData.newPassword.length < 8) {
      setPasswordError('Password must be at least 8 characters');
      return;
    }

    setIsUpdatingPassword(true);
    try {
      await dispatch(updatePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      })).unwrap();
      // Clear form on success
      setPasswordData({
        currentPassword: '',
        newPassword: '',
      });
      // Show success message (you can add a success state if needed)
      setPasswordError(null);
    } catch (err: any) {
      setPasswordError(err.response?.data?.message || 'Failed to update password');
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  return (
    <DashboardLayout navItems={navItems}>
      <div className="max-w-4xl mx-auto w-full space-y-6">
        <h1 className="text-3xl font-bold text-base-content">User Profile</h1>

        <div className="card bg-base-100 shadow-xl border border-base-300">
          <div className="card-body">
            <div className="flex justify-between items-center mb-6">
              <h2 className="card-title text-base-content">Personal Information</h2>
              {!isEditing && (
                <button
                  className="btn btn-primary btn-sm"
                  onClick={() => setIsEditing(true)}
                >
                  Edit Profile
                </button>
              )}
            </div>

            {isEditing ? (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="form-control bg-transparent">
                  <label className="label">
                    <span className="label-text text-base-content text-white">Full Name</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    className="input input-bordered w-full bg-base-200 p-1 border-b-2 border-white text-base-content text-white p-2 border-base-300 focus:bg-base-200 focus:border-primary"
                    value={formData.name}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="form-control bg-transparent">
                  <label className="label">
                    <span className="label-text text-base-content text-white">Email (Read Only)</span>
                  </label>
                  <input
                    type="email"
                    name="email"
                    readOnly
                    disabled
                    className="input input-bordered w-full bg-base-200 text-base-content/70 text-white p-2 border-base-300 cursor-not-allowed"
                    value={formData.email}
                  />
                </div>

                <div className="form-control bg-transparent">
                  <label className="label">
                    <span className="label-text text-base-content text-white">Role (Read Only)</span>
                  </label>
                  <input
                    type="text"
                    name="role"
                    readOnly
                    disabled
                      className="input input-bordered w-full bg-base-200 text-base-content text-white p-2 border-base-300 cursor-not-allowed"
                    value={formData.role.toUpperCase()}
                  />
                </div>

                {error && (
                  <div className="alert alert-error">
                    <span>{error}</span>
                  </div>
                )}
                <div className="flex gap-2 pt-2">
                  <button 
                    type="submit" 
                    className="btn btn-primary"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <span className="loading loading-spinner loading-sm"></span>
                        Saving...
                      </>
                    ) : (
                      'Save Changes'
                    )}
                  </button>
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => {
                      setIsEditing(false);
                      setError(null);
                      setFormData({
                        name: user?.name || '',
                        email: user?.email || '',
                        role: user?.role || '',
                      });
                    }}
                    disabled={isLoading}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-4">
                {/* User Header */}
                <div className="flex items-center gap-6">
                  <div className="avatar placeholder">
                    <div className="bg-primary text-primary-content rounded-full center items-center justify-center w-20 h-20">
                      <span className="text-3xl font-bold">{user?.name?.charAt(0).toUpperCase()}</span>
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-2xl font-bold text-base-content mb-1">{user?.name}</h3>
                    <p className="text-base-content/70 mb-2 text-white">{user?.email}</p>
                    <span className="badge badge-primary items-center p-2 justify-center capitalize mb-2">{user?.role}</span>
                    {user?.walletAddress && (
                      <div className="mt-2">
                        <p className="text-xs text-base-content/60 text-white mb-1">Wallet Address:</p>
                        <p className="text-sm font-mono text-base-content/80 text-white break-all bg-base-200 p-2 rounded">
                          {user.walletAddress}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Security Settings */}
        <div className="card bg-base-100 shadow-xl border border-base-300">
          <div className="card-body">
            <h2 className="card-title text-base-content mb-4">Security Settings</h2>
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div className="form-control bg-transparent">
                <label className="label">
                  <span className="label-text text-base-content text-white">Current Password</span>
                </label>
                <input
                  type="password"
                  name="currentPassword"
                  placeholder="Enter current password"
                  className="input input-bordered w-full bg-base-200 text-base-content text-white p-2 border-base-300 placeholder:text-base-content/50 focus:bg-base-200 focus:border-primary"
                  value={passwordData.currentPassword}
                  onChange={handlePasswordChange}
                  required
                />
              </div>
              <div className="form-control bg-transparent">
                <label className="label">
                  <span className="label-text text-base-content text-white">New Password</span>
                </label>
                <input
                  type="password"
                  name="newPassword"
                  placeholder="Enter new password"
                  className="input input-bordered w-full bg-base-200 text-base-content text-white p-2 border-base-300 placeholder:text-base-content/50 focus:bg-base-200 focus:border-primary"
                  value={passwordData.newPassword}
                  onChange={handlePasswordChange}
                  required
                  minLength={8}
                />
                <label className="label">
                  <span className="label-text-alt text-base-content/60 text-white">Password must be at least 8 characters</span>
                </label>
              </div>
              {passwordError && (
                <div className="alert alert-error text-white">
                  <span className="text-white">{passwordError}</span>
                </div>
              )}
              <div className="flex justify-end">
                <button 
                  type="submit" 
                  className="btn btn-primary"
                  disabled={isUpdatingPassword}
                >
                  {isUpdatingPassword ? (
                    <>
                      <span className="loading loading-spinner loading-sm"></span>
                      Updating...
                    </>
                  ) : (
                    'Update Password'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

