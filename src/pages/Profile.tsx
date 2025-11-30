import { useState } from 'react';
import type { FormEvent } from 'react';
import { useAppSelector } from '../store/hooks';
import DashboardLayout from '../components/layouts/DashboardLayout';
import { HomeIcon, UserIcon } from '@heroicons/react/24/outline';

const navItems = [
  { name: 'Dashboard', path: '/dashboard', icon: HomeIcon },
  { name: 'Profile', path: '/profile', icon: UserIcon },
];

export default function Profile() {
  const { user } = useAppSelector((state) => state.auth);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
  });

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    // TODO: Implement profile update API call
    console.log('Update profile:', formData);
    setIsEditing(false);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <DashboardLayout navItems={navItems}>
      <div className="max-w-4xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold">User Profile</h1>

        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <div className="flex justify-between items-center mb-4">
              <h2 className="card-title">Personal Information</h2>
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
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Full Name</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    className="input input-bordered"
                    value={formData.name}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Email</span>
                  </label>
                  <input
                    type="email"
                    name="email"
                    className="input input-bordered"
                    value={formData.email}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Role</span>
                  </label>
                  <input
                    type="text"
                    className="input input-bordered"
                    value={user?.role.toUpperCase()}
                    disabled
                  />
                </div>

                <div className="flex gap-2">
                  <button type="submit" className="btn btn-primary">
                    Save Changes
                  </button>
                  <button
                    type="button"
                    className="btn btn-ghost"
                    onClick={() => {
                      setIsEditing(false);
                      setFormData({
                        name: user?.name || '',
                        email: user?.email || '',
                      });
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="avatar placeholder">
                    <div className="bg-secondary text-secondary-content rounded-full w-24">
                      <span className="text-3xl">{user?.name?.charAt(0).toUpperCase()}</span>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold">{user?.name}</h3>
                    <p className="text-base-content/70">{user?.email}</p>
                  </div>
                </div>

                <div className="divider"></div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-base-content/70">Full Name</p>
                    <p className="font-semibold">{user?.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-base-content/70">Email</p>
                    <p className="font-semibold">{user?.email}</p>
                  </div>
                  <div>
                    <p className="text-sm text-base-content/70">Role</p>
                    <p className="font-semibold capitalize">{user?.role}</p>
                  </div>
                  <div>
                    <p className="text-sm text-base-content/70">User ID</p>
                    <p className="font-semibold text-xs">{user?.id}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Security Settings */}
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <h2 className="card-title">Security Settings</h2>
            <div className="space-y-4 mt-4">
              <div className="form-control">
                <label className="label">
                  <span className="label-text">Change Password</span>
                </label>
                <div className="flex gap-2">
                  <input
                    type="password"
                    placeholder="New password"
                    className="input input-bordered flex-1"
                  />
                  <button className="btn btn-primary">Update</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

