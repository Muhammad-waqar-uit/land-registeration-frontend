import { useEffect, useState } from 'react';
import DashboardLayout from '../../components/layouts/DashboardLayout';
import {
  HomeIcon,
  UserGroupIcon,
  CheckCircleIcon,
  ClockIcon,
  FolderIcon,
  CurrencyDollarIcon,
  BuildingOfficeIcon,
  MapPinIcon,
} from '@heroicons/react/24/outline';
import { builderAPI } from '../../services/api';
import type { User } from '../../types';

const navItems = [
  { name: 'Overview', path: '/dashboard/admin', icon: HomeIcon },
  { name: 'Project Approvals', path: '/dashboard/admin/projects', icon: FolderIcon },
  { name: 'Approved Projects', path: '/dashboard/admin/approved-projects', icon: BuildingOfficeIcon },
  { name: 'All Lands', path: '/dashboard/admin/all-lands', icon: MapPinIcon },
  { name: 'Builder Verification', path: '/dashboard/admin/builders', icon: UserGroupIcon },
  { name: 'Mint Tokens', path: '/dashboard/admin/mint-tokens', icon: CurrencyDollarIcon },
];

export default function BuilderVerification() {
  const [builders, setBuilders] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'pending' | 'verified'>('all');

  useEffect(() => {
    loadBuilders();
  }, []);

  const loadBuilders = async () => {
    try {
      setLoading(true);
      const data = await builderAPI.getAll();
      setBuilders(data);
    } catch (err: unknown) {
      console.error('Failed to load builders:', err);
      const errorMessage = err && typeof err === 'object' && 'response' in err
        ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
        : undefined;
      alert(errorMessage || 'Failed to load builders');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (builderId: string) => {
    if (!builderId || builderId === 'undefined' || builderId === 'null') {
      alert('Invalid builder ID. Please refresh the page and try again.');
      return;
    }
    
    if (!confirm('Are you sure you want to verify this builder?')) return;

    try {
      setVerifying(builderId);
      console.log('Verifying builder with ID:', builderId);
      await builderAPI.verify(builderId, 'Verified by admin');
      await loadBuilders();
      alert('Builder verified successfully!');
    } catch (err: unknown) {
      console.error('Failed to verify builder:', err);
      const errObj = err && typeof err === 'object' && 'response' in err ? (err as { response?: { data?: { message?: string | string[] } } }) : null;
      console.error('Error response:', errObj?.response?.data);
      
      // Extract validation error messages
      const errorData = errObj?.response?.data;
      let errorMessage = 'Failed to verify builder';
      
      if (errorData?.message) {
        if (Array.isArray(errorData.message)) {
          errorMessage = errorData.message.join(', ');
        } else {
          errorMessage = errorData.message;
        }
      }
      
      console.error('Error message:', errorMessage);
      alert(errorMessage);
    } finally {
      setVerifying(null);
    }
  };

  const filteredBuilders = builders.filter((builder) => {
    if (filter === 'pending') return !builder.isBuilderVerified;
    if (filter === 'verified') return builder.isBuilderVerified;
    return true;
  });

  const stats = {
    total: builders.length,
    verified: builders.filter((b) => b.isBuilderVerified).length,
    pending: builders.filter((b) => !b.isBuilderVerified).length,
  };

  if (loading) {
    return (
      <DashboardLayout navItems={navItems}>
        <div className="flex justify-center items-center h-64">
          <span className="loading loading-spinner loading-lg"></span>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout navItems={navItems}>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-white">Builder Verification</h1>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="stat bg-base-100 rounded-lg shadow">
            <div className="stat-title text-white">Total Builders</div>
            <div className="stat-value text-primary">{stats.total}</div>
            <div className="stat-desc text-white">Registered builders</div>
          </div>

          <div className="stat bg-base-100 rounded-lg shadow">
            <div className="stat-title text-white">Verified</div>
            <div className="stat-value text-success">{stats.verified}</div>
            <div className="stat-desc text-white">Active builders</div>
          </div>

          <div className="stat bg-base-100 rounded-lg shadow">
            <div className="stat-title text-white">Pending Verification</div>
            <div className="stat-value text-warning">{stats.pending}</div>
            <div className="stat-desc text-white">Awaiting review</div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-2">
          <button
            className={`btn btn-sm ${filter === 'all' ? 'btn-primary' : 'btn-ghost text-white'}`}
            onClick={() => setFilter('all')}
          >
            All ({stats.total})
          </button>
          <button
            className={`btn btn-sm ${filter === 'pending' ? 'btn-warning' : 'btn-ghost text-white'}`}
            onClick={() => setFilter('pending')}
          >
            Pending ({stats.pending})
          </button>
          <button
            className={`btn btn-sm ${filter === 'verified' ? 'btn-success' : 'btn-ghost text-white'}`}
            onClick={() => setFilter('verified')}
          >
            Verified ({stats.verified})
          </button>
        </div>

        {/* Builders Table */}
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <h2 className="card-title text-white">
              {filter === 'pending' && 'Pending Builders'}
              {filter === 'verified' && 'Verified Builders'}
              {filter === 'all' && 'All Builders'}
            </h2>

            {filteredBuilders.length === 0 ? (
              <div className="text-center py-8 text-white">
                No builders found
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="table table-zebra w-full">
                  <thead>
                    <tr className="text-black">
                      <th className="text-black">Name</th>
                      <th className="text-black">Email</th>
                      <th className="text-black">Company</th>
                      <th className="text-black">Status</th>
                      <th className="text-black">Registered</th>
                      <th className="text-black">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredBuilders.map((builder) => (
                      <tr key={builder.id} className="text-black">
                        <td className="text-black">
                          <div className="font-bold">{builder.name}</div>
                        </td>
                        <td className="text-black">{builder.email}</td>
                        <td className="text-black">{builder.companyName || 'N/A'}</td>
                        <td>
                          {builder.isBuilderVerified ? (
                            <div className="flex items-center gap-2">
                              <CheckCircleIcon className="h-5 w-5 text-success" />
                              <span className="badge badge-success">Verified</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <ClockIcon className="h-5 w-5 text-warning" />
                              <span className="badge badge-warning">Pending</span>
                            </div>
                          )}
                        </td>
                        <td className="text-black">
                          {builder.createdAt
                            ? new Date(builder.createdAt).toLocaleDateString()
                            : 'N/A'}
                        </td>
                        <td>
                          {!builder.isBuilderVerified ? (
                            <button
                              className="btn btn-success btn-sm flex items-center gap-1"
                              onClick={() => handleVerify(builder.id)}
                              disabled={verifying === builder.id}
                            >
                              {verifying === builder.id ? (
                                <span className="loading loading-spinner loading-xs"></span>
                              ) : (
                                <>
                                  <CheckCircleIcon className="h-4 w-4" />
                                  <span>Verify</span>
                                </>
                              )}
                            </button>
                          ) : (
                            <div className="text-success text-sm flex items-center gap-1">
                              <CheckCircleIcon className="h-4 w-4" />
                              <span>Verified</span>
                              {builder.builderVerifiedAt && (
                                <span className="text-xs text-gray-600">
                                  {new Date(builder.builderVerifiedAt).toLocaleDateString()}
                                </span>
                              )}
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
