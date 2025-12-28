import DashboardLayout from '../../components/layouts/DashboardLayout';
import {
  HomeIcon,
  ClockIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';
import { useState, useEffect } from 'react';
import { paymentAPI } from '../../services/api';
import type { Payment } from '../../types';

const navItems = [
  { name: 'Overview', path: '/dashboard/builder', icon: HomeIcon },
  { name: 'Pending Verifications', path: '/dashboard/builder/pending', icon: ClockIcon },
  { name: 'Verified Payments', path: '/dashboard/builder/verified', icon: CheckCircleIcon },
];

export default function BuilderDashboard() {
  const [pendingPayments, setPendingPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [verifying, setVerifying] = useState<string | null>(null);

  useEffect(() => {
    loadPendingPayments();
  }, []);

  const loadPendingPayments = async () => {
    try {
      setLoading(true);
      setError(null);
      // Note: According to backend guide, /payments/pending is for Seller role
      // Builder should use the same endpoint or a different one - using pending for now
      const payments = await paymentAPI.getPending();
      setPendingPayments(payments);
    } catch (err: any) {
      console.error('Failed to load pending payments:', err);
      setError(err.response?.data?.message || 'Failed to load pending payments');
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
      await loadPendingPayments();
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

  return (
    <DashboardLayout navItems={navItems}>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Builder Dashboard</h1>

        {error && (
          <div className="alert alert-error">
            <span>{error}</span>
            <button className="btn btn-sm" onClick={loadPendingPayments}>
              Retry
            </button>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="stat bg-base-100 rounded-lg shadow">
            <div className="stat-title">Pending Verifications</div>
            <div className="stat-value text-warning">{pendingPayments.length}</div>
            <div className="stat-desc">Awaiting review</div>
          </div>

          <div className="stat bg-base-100 rounded-lg shadow">
            <div className="stat-title">Verified Today</div>
            <div className="stat-value text-success">
              {pendingPayments.filter((p) => p.status === 'verified').length}
            </div>
            <div className="stat-desc">Payments approved</div>
          </div>

          <div className="stat bg-base-100 rounded-lg shadow">
            <div className="stat-title">Rejected Today</div>
            <div className="stat-value text-error">
              {pendingPayments.filter((p) => p.status === 'rejected').length}
            </div>
            <div className="stat-desc">Payments rejected</div>
          </div>
        </div>

        {/* Pending Verifications */}
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <h2 className="card-title">Pending Verifications</h2>
            {pendingPayments.length === 0 ? (
              <p className="text-gray-500 mt-4">No pending payments to verify.</p>
            ) : (
              <div className="overflow-x-auto mt-4">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Land</th>
                      <th>Buyer</th>
                      <th>Amount</th>
                      <th>Payment Mode</th>
                      <th>Proof</th>
                      <th>Due Date</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pendingPayments.map((payment) => (
                      <tr key={payment.id}>
                        <td>
                          {payment.land?.title || payment.landId}
                          {payment.land?.location && (
                            <div className="text-xs text-gray-500">{payment.land.location}</div>
                          )}
                        </td>
                        <td>
                          {payment.buyer?.name || 'Unknown'}
                          {payment.buyer?.email && (
                            <div className="text-xs text-gray-500">{payment.buyer.email}</div>
                          )}
                        </td>
                        <td>₹{payment.amount.toLocaleString()}</td>
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
                        <td>{new Date(payment.dueDate).toLocaleDateString()}</td>
                        <td>
                          <div className="flex gap-2">
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

