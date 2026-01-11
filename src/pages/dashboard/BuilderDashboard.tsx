import DashboardLayout from '../../components/layouts/DashboardLayout';
import {
  HomeIcon,
  ClockIcon,
  CheckCircleIcon,
  FolderIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { paymentAPI, builderAPI } from '../../services/api';
import type { Payment, User } from '../../types';

const navItems = [
  { name: 'Overview', path: '/dashboard/builder', icon: HomeIcon },
  { name: 'Projects', path: '/dashboard/builder/projects', icon: FolderIcon },
  { name: 'Pending Verifications', path: '/dashboard/builder/pending', icon: ClockIcon },
  { name: 'Verified Payments', path: '/dashboard/builder/verified', icon: CheckCircleIcon },
];

export default function BuilderDashboard() {
  const [builderProfile, setBuilderProfile] = useState<User | null>(null);
  const [pendingPayments, setPendingPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [verifying, setVerifying] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [profile, payments] = await Promise.all([
        builderAPI.getMe(),
        paymentAPI.getPending().catch(() => []),
      ]);
      setBuilderProfile(profile);
      setPendingPayments(payments);
    } catch (err: any) {
      console.error('Failed to load data:', err);
      setError(err.response?.data?.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (paymentId: string, verified: boolean) => {
    try {
      setVerifying(paymentId);
      const remarks = verified ? 'Payment verified successfully' : 'Payment proof is unclear';
      await paymentAPI.verify(paymentId, verified, remarks);
      // Reload payments after verification
      await loadData();
    } catch (err: any) {
      console.error('Failed to verify payment:', err);
      alert(err.response?.data?.message || 'Failed to verify payment');
    } finally {
      setVerifying(null);
    }
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

  // Show verification pending message if builder is not verified
  if (builderProfile && !builderProfile.isBuilderVerified) {
    return (
      <DashboardLayout navItems={navItems}>
        <div className="space-y-6">
          <h1 className="text-3xl font-bold text-white">Builder Dashboard</h1>
          
          {/* Verification Pending Alert */}
          <div className="alert alert-warning shadow-lg">
            <ExclamationTriangleIcon className="h-6 w-6" />
            <div>
              <h3 className="font-bold text-black">Verification Pending</h3>
              <div className="text-sm text-black">
                Your builder account is pending verification by an administrator. 
                You will be able to access all builder features once your account is verified.
              </div>
            </div>
          </div>

          {/* Profile Info Card */}
          <div className="card bg-base-100 shadow-xl">
            <div className="card-body">
              <h2 className="card-title text-white">Your Profile Information</h2>
              <div className="space-y-2">
                <p className="text-white"><span className="font-semibold">Name:</span> {builderProfile.name}</p>
                <p className="text-white"><span className="font-semibold">Email:</span> {builderProfile.email}</p>
                <p className="text-white"><span className="font-semibold">Company:</span> {builderProfile.companyName}</p>
                <div className="flex items-center gap-2 mt-4">
                  <span className="badge badge-warning">Not Verified</span>
                </div>
              </div>
            </div>
          </div>

          {/* What's Next */}
          <div className="card bg-base-100 shadow-xl">
            <div className="card-body">
              <h2 className="card-title text-white">What happens next?</h2>
              <ul className="list-disc list-inside space-y-2 text-white">
                <li>An administrator will review your information</li>
                <li>You will be notified when your account is verified</li>
                <li>Once verified, you can create projects and list properties</li>
                <li>You will be able to manage property requests and sales</li>
              </ul>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout navItems={navItems}>
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <h1 className="text-4xl font-bold text-white">Builder Dashboard</h1>
          <Link to="/dashboard/builder/projects" className="btn btn-primary gap-2 flex items-center justify-center w-full sm:w-auto">
            <FolderIcon className="w-5 h-5 flex-shrink-0" />
            <span>My Projects</span>
          </Link>
        </div>

        {error && (
          <div className="alert alert-error">
            <span className="text-black">{error}</span>
            <button className="btn btn-sm" onClick={loadData}>
              Retry
            </button>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="stat bg-base-100 rounded-lg shadow">
            <div className="stat-title text-white">Pending Verifications</div>
            <div className="stat-value text-warning">{pendingPayments.length}</div>
            <div className="stat-desc text-white">Awaiting review</div>
          </div>

          <div className="stat bg-base-100 rounded-lg shadow">
            <div className="stat-title text-white">Verified Today</div>
            <div className="stat-value text-success">
              {pendingPayments.filter((p) => p.status === 'verified').length}
            </div>
            <div className="stat-desc text-white">Payments approved</div>
          </div>

          <div className="stat bg-base-100 rounded-lg shadow">
            <div className="stat-title text-white">Rejected Today</div>
            <div className="stat-value text-error">
              {pendingPayments.filter((p) => p.status === 'rejected').length}
            </div>
            <div className="stat-desc text-white">Payments rejected</div>
          </div>
        </div>

        {/* Pending Verifications */}
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <h2 className="card-title text-white">Pending Verifications</h2>
            {pendingPayments.length === 0 ? (
              <p className="text-gray-400 mt-4">No pending payments to verify.</p>
            ) : (
              <div className="overflow-x-auto mt-4">
                <table className="table">
                  <thead>
                    <tr className="text-black">
                      <th className="text-black">Land</th>
                      <th className="text-black">Buyer</th>
                      <th className="text-black">Amount</th>
                      <th className="text-black">Payment Mode</th>
                      <th className="text-black">Proof</th>
                      <th className="text-black">Due Date</th>
                      <th className="text-black">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pendingPayments.map((payment) => (
                      <tr key={payment.id} className="text-black">
                        <td className="text-black">
                          <div className="font-medium">{payment.land?.title || payment.landId}</div>
                          {payment.land?.location && (
                            <div className="text-xs text-gray-600">{payment.land.location}</div>
                          )}
                        </td>
                        <td className="text-black">
                          <div className="font-medium">{payment.buyer?.name || 'Unknown'}</div>
                          {payment.buyer?.email && (
                            <div className="text-xs text-gray-600">{payment.buyer.email}</div>
                          )}
                        </td>
                        <td className="text-black">₹{payment.amount.toLocaleString()}</td>
                        <td>
                          <span className={`badge ${payment.paymentMode === 'crypto' ? 'badge-info' : 'badge-primary'}`}>
                            {payment.paymentMode}
                          </span>
                        </td>
                        <td>
                          {payment.proofCID ? (
                            <a
                              href={`https://ipfs.io/ipfs/${payment.proofCID}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="link link-primary"
                            >
                              View Proof
                            </a>
                          ) : (
                            <span className="text-gray-400">No proof</span>
                          )}
                        </td>
                        <td className="text-black">{new Date(payment.dueDate).toLocaleDateString()}</td>
                        <td>
                          <div className="flex gap-2 items-center">
                            <button
                              className="btn btn-success btn-xs"
                              onClick={() => handleVerify(payment.id, true)}
                              disabled={verifying === payment.id}
                            >
                              {verifying === payment.id ? (
                                <span className="loading loading-spinner loading-xs"></span>
                              ) : (
                                '✓ Verify'
                              )}
                            </button>
                            <button
                              className="btn btn-error btn-xs"
                              onClick={() => handleVerify(payment.id, false)}
                              disabled={verifying === payment.id}
                            >
                              {verifying === payment.id ? (
                                <span className="loading loading-spinner loading-xs"></span>
                              ) : (
                                '✗ Reject'
                              )}
                            </button>
                          </div>
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

