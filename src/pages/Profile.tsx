import { useState, useEffect, useCallback } from 'react';
import type { FormEvent } from 'react';
import { useAppSelector, useAppDispatch } from '../store/hooks';
import { updateProfile, updatePassword } from '../store/slices/authSlice';
import DashboardLayout from '../components/layouts/DashboardLayout';
import { HomeIcon, UserIcon, BanknotesIcon, PencilIcon, TrashIcon, PlusIcon } from '@heroicons/react/24/outline';
import { userBankInfoAPI } from '../services/api';
import type { UserBankInfo } from '../types';

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
  });
  const [error, setError] = useState<string | null>(null);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
  });
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  // Bank details
  const [bankInfoList, setBankInfoList] = useState<UserBankInfo[]>([]);
  const [loadingBankInfo, setLoadingBankInfo] = useState(true);
  const [bankForm, setBankForm] = useState({ bankName: '', accountNumber: '' });
  const [editingBankId, setEditingBankId] = useState<string | null>(null);
  const [savingBank, setSavingBank] = useState(false);
  const [deletingBankId, setDeletingBankId] = useState<string | null>(null);

  const fetchBankInfo = useCallback(async () => {
    try {
      setLoadingBankInfo(true);
      const data = await userBankInfoAPI.getAll();
      setBankInfoList(data);
    } catch (err) {
      console.error('Failed to fetch bank info:', err);
    } finally {
      setLoadingBankInfo(false);
    }
  }, []);

  useEffect(() => {
    fetchBankInfo();
  }, [fetchBankInfo]);

  const handleBankSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!bankForm.bankName.trim() || !bankForm.accountNumber.trim()) return;
    setSavingBank(true);
    try {
      if (editingBankId) {
        await userBankInfoAPI.update(editingBankId, bankForm);
        setEditingBankId(null);
      } else {
        await userBankInfoAPI.create(bankForm);
      }
      setBankForm({ bankName: '', accountNumber: '' });
      await fetchBankInfo();
    } catch (err) {
      console.error('Failed to save bank info:', err);
      alert((err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to save bank info');
    } finally {
      setSavingBank(false);
    }
  };

  const handleBankEdit = (item: UserBankInfo) => {
    setBankForm({ bankName: item.bankName, accountNumber: item.accountNumber });
    setEditingBankId(item.id);
  };

  const handleBankDelete = async (id: string) => {
    if (!window.confirm('Delete this bank account?')) return;
    setDeletingBankId(id);
    try {
      await userBankInfoAPI.delete(id);
      if (editingBankId === id) {
        setEditingBankId(null);
        setBankForm({ bankName: '', accountNumber: '' });
      }
      await fetchBankInfo();
    } catch (err) {
      console.error('Failed to delete bank info:', err);
      alert((err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to delete');
    } finally {
      setDeletingBankId(null);
    }
  };

  const maskAccountNumber = (acc: string) => {
    if (acc.length <= 4) return '****';
    return '*'.repeat(acc.length - 4) + acc.slice(-4);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      // Only send name and email to API - role is not sent
      await dispatch(updateProfile({ name: formData.name, email: formData.email })).unwrap();
      setIsEditing(false);
    } catch (err: unknown) {
      setError((err as string) || 'Failed to update profile');
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
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setPasswordError(error.response?.data?.message || 'Failed to update password');
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  return (
    <DashboardLayout navItems={navItems}>
      <div className="max-w-4xl mx-auto w-full space-y-6">
        <h1 className="text-3xl font-bold text-white">User Profile</h1>

        <div className="card bg-base-100 shadow-xl border border-base-300">
          <div className="card-body">
            <div className="flex justify-between items-center mb-6">
              <h2 className="card-title text-white">Personal Information</h2>
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
                    <span className="label-text text-white">Full Name</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    className="input input-bordered w-full bg-base-200 p-1 border-b-2 border-white text-white p-2 border-base-300 focus:bg-base-200 focus:border-primary"
                    value={formData.name}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="form-control bg-transparent">
                  <label className="label">
                    <span className="label-text text-white">Email (Read Only)</span>
                  </label>
                  <input
                    type="email"
                    name="email"
                    readOnly
                    disabled
                    className="input input-bordered w-full bg-base-200 text-white p-2 border-base-300 cursor-not-allowed"
                    value={formData.email}
                  />
                </div>

                <div className="form-control bg-transparent">
                  <label className="label">
                    <span className="label-text text-white">Role (Read Only)</span>
                  </label>
                  <input
                    type="text"
                    name="role"
                    readOnly
                    disabled
                      className="input input-bordered w-full bg-base-200 text-white p-2 border-base-300 cursor-not-allowed"
                    value={formData.role.toUpperCase()}
                  />
                </div>

                {error && (
                  <div className="alert alert-error">
                    <span className="text-white">{error}</span>
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
                    <h3 className="text-2xl font-bold text-white mb-1">{user?.name}</h3>
                    <p className="text-white mb-2">{user?.email}</p>
                    <span className="badge badge-primary items-center p-2 justify-center capitalize mb-2">{user?.role}</span>
                    {user?.walletAddress && (
                      <div className="mt-2">
                        <p className="text-xs text-white mb-1">Wallet Address:</p>
                        <p className="text-sm font-mono text-white break-all bg-base-200 p-2 rounded">
                          {user.walletAddress}
                        </p>
                      </div>
                    )}
                    {!user?.walletAddress && (
                      <div className="mt-2">
                        <p className="text-xs text-white">No wallet address connected</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Bank Details */}
        <div className="card bg-base-100 shadow-xl border border-base-300">
          <div className="card-body">
            <h2 className="card-title text-white mb-4">
              <BanknotesIcon className="w-6 h-6" />
              Bank Details
            </h2>
            <p className="text-gray-400 text-sm mb-4">
              Add your bank account details for payment references (e.g. when receiving or making bank transfers).
            </p>
            {loadingBankInfo ? (
              <div className="flex justify-center py-6">
                <span className="loading loading-spinner loading-md"></span>
              </div>
            ) : (
              <>
                {bankInfoList.length > 0 && (
                  <div className="space-y-3 mb-6">
                    {bankInfoList.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between p-4 rounded-lg bg-base-200 border border-base-300"
                      >
                        <div>
                          <p className="font-semibold text-white">{item.bankName}</p>
                          <p className="text-sm font-mono text-gray-400">{maskAccountNumber(item.accountNumber)}</p>
                        </div>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            className="btn btn-ghost btn-sm"
                            onClick={() => handleBankEdit(item)}
                            disabled={!!editingBankId}
                          >
                            <PencilIcon className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            className="btn btn-ghost btn-sm text-error"
                            onClick={() => handleBankDelete(item.id)}
                            disabled={deletingBankId === item.id}
                          >
                            {deletingBankId === item.id ? (
                              <span className="loading loading-spinner loading-xs"></span>
                            ) : (
                              <TrashIcon className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                <form onSubmit={handleBankSubmit} className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="form-control bg-transparent">
                      <label className="label">
                        <span className="label-text text-white">Bank Name</span>
                      </label>
                      <input
                        type="text"
                        value={bankForm.bankName}
                        onChange={(e) => setBankForm({ ...bankForm, bankName: e.target.value })}
                        className="input input-bordered w-full bg-base-200 text-white border-base-300"
                        placeholder="e.g. HBL, UBL"
                        required
                      />
                    </div>
                    <div className="form-control bg-transparent">
                      <label className="label">
                        <span className="label-text text-white">Account Number</span>
                      </label>
                      <input
                        type="text"
                        value={bankForm.accountNumber}
                        onChange={(e) => setBankForm({ ...bankForm, accountNumber: e.target.value })}
                        className="input input-bordered w-full bg-base-200 text-white border-base-300"
                        placeholder="e.g. 12345678901234"
                        required
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      className="btn btn-primary btn-sm flex flex-row items-center border-black"
                      disabled={savingBank}
                    >
                      {savingBank ? (
                        <span className="loading loading-spinner loading-sm"></span>
                      ) : (
                        <>
                          <PlusIcon className="w-4 h-4 mr-1" />
                          {editingBankId ? 'Update' : 'Add'} Bank Account
                        </>
                      )}
                    </button>
                    {editingBankId && (
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm"
                        onClick={() => {
                          setEditingBankId(null);
                          setBankForm({ bankName: '', accountNumber: '' });
                        }}
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </form>
              </>
            )}
          </div>
        </div>

        {/* Security Settings */}
        <div className="card bg-base-100 shadow-xl border border-base-300">
          <div className="card-body">
            <h2 className="card-title text-white mb-4">Security Settings</h2>
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div className="form-control bg-transparent">
                <label className="label">
                  <span className="label-text text-white">Current Password</span>
                </label>
                <input
                  type="password"
                  name="currentPassword"
                  placeholder="Enter current password"
                  className="input input-bordered w-full bg-base-200 text-white p-2 border-base-300 placeholder:text-gray-400 focus:bg-base-200 focus:border-primary"
                  value={passwordData.currentPassword}
                  onChange={handlePasswordChange}
                  required
                />
              </div>
              <div className="form-control bg-transparent">
                <label className="label">
                  <span className="label-text text-white">New Password</span>
                </label>
                <input
                  type="password"
                  name="newPassword"
                  placeholder="Enter new password"
                  className="input input-bordered w-full bg-base-200 text-white p-2 border-base-300 placeholder:text-gray-400 focus:bg-base-200 focus:border-primary"
                  value={passwordData.newPassword}
                  onChange={handlePasswordChange}
                  required
                  minLength={8}
                />
                <label className="label">
                  <span className="label-text-alt text-white">Password must be at least 8 characters</span>
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

