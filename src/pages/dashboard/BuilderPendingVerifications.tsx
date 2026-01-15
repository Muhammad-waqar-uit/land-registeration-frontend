import { useEffect, useState } from 'react';
import DashboardLayout from '../../components/layouts/DashboardLayout';
import {
  HomeIcon,
  ClockIcon,
  FolderIcon,
  DocumentTextIcon,
  CurrencyDollarIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  XCircleIcon,
  UserGroupIcon,
  CreditCardIcon,
} from '@heroicons/react/24/outline';
import { paymentAPI } from '../../services/api';
import type { Payment } from '../../types';
import { Link } from 'react-router-dom';

const navItems = [
  { name: 'Overview', path: '/dashboard/builder', icon: HomeIcon },
  { name: 'Projects', path: '/dashboard/builder/projects', icon: FolderIcon },
  { name: 'Buyer Progress', path: '/dashboard/builder/buyers', icon: UserGroupIcon },
  { name: 'Payments', path: '/dashboard/builder/payments', icon: CreditCardIcon },
  { name: 'Property Requests', path: '/dashboard/builder/property-requests', icon: DocumentTextIcon },
  { name: 'Agreements', path: '/dashboard/builder/agreements', icon: DocumentTextIcon },
  { name: 'Installments', path: '/dashboard/builder/installments', icon: CurrencyDollarIcon },
  { name: 'Resale Requests', path: '/dashboard/builder/resale-requests', icon: ArrowPathIcon },
  { name: 'Pending Verifications', path: '/dashboard/builder/pending', icon: ClockIcon },
];

export default function BuilderPendingVerifications() {
  const [pendingPayments, setPendingPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [verifyingId, setVerifyingId] = useState<string | null>(null);

  const fetchPendingPayments = async () => {
    try {
      setLoading(true);
      const data = await paymentAPI.getPending();
      setPendingPayments(data || []);
    } catch (error) {
      console.error('Failed to fetch pending payments:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingPayments();
  }, []);

  const handleVerify = async (paymentId: string, verified: boolean, remarks?: string) => {
    try {
      setVerifyingId(paymentId);
      await paymentAPI.verify(paymentId, verified, remarks);
      // Refresh the list
      await fetchPendingPayments();
    } catch (error) {
      console.error('Failed to verify payment:', error);
      alert('Failed to verify payment. Please try again.');
    } finally {
      setVerifyingId(null);
    }
  };

  const handleApprove = (paymentId: string) => {
    if (window.confirm('Are you sure you want to approve this payment?')) {
      handleVerify(paymentId, true, 'Payment verified and approved');
    }
  };

  const handleReject = (paymentId: string) => {
    const remarks = window.prompt('Enter rejection reason:');
    if (remarks) {
      handleVerify(paymentId, false, remarks);
    }
  };

  if (loading) {
    return (
      <DashboardLayout navItems={navItems}>
        <div className="flex items-center justify-center min-h-[400px]">
          <span className="loading loading-spinner loading-lg"></span>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout navItems={navItems}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-white">Pending Payment Verifications</h1>
          <Link to="/dashboard/builder" className="btn btn-ghost text-white">
            Back to Dashboard
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="stat bg-gray-800/90 rounded-lg shadow border border-gray-700">
            <div className="stat-title text-gray-300">Pending Verifications</div>
            <div className="stat-value text-yellow-400">{pendingPayments.length}</div>
          </div>

          <div className="stat bg-gray-800/90 rounded-lg shadow border border-gray-700">
            <div className="stat-title text-gray-300">Total Amount</div>
            <div className="stat-value text-blue-400">
              ₹{pendingPayments.reduce((sum, p) => sum + p.amount, 0).toLocaleString()}
            </div>
          </div>

          <div className="stat bg-gray-800/90 rounded-lg shadow border border-gray-700">
            <div className="stat-title text-gray-300">Unique Buyers</div>
            <div className="stat-value text-purple-400">
              {new Set(pendingPayments.map((p) => p.buyerId)).size}
            </div>
          </div>
        </div>

        {/* Pending Payments List */}
        {pendingPayments.length === 0 ? (
          <div className="card bg-gray-800/90 shadow-xl border border-gray-700">
            <div className="card-body text-center py-12">
              <CheckCircleIcon className="h-16 w-16 mx-auto text-green-500 mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">All Caught Up!</h3>
              <p className="text-gray-400">
                There are no pending payment verifications at the moment.
              </p>
            </div>
          </div>
        ) : (
          <div className="card bg-gray-800/90 shadow-xl border border-gray-700">
            <div className="card-body">
              <h2 className="card-title text-white mb-4">Payments Awaiting Verification</h2>
              <div className="overflow-x-auto">
                <table className="table">
                  <thead>
                    <tr className="border-gray-700">
                      <th className="text-gray-300">Date</th>
                      <th className="text-gray-300">Buyer</th>
                      <th className="text-gray-300">Property</th>
                      <th className="text-gray-300">Amount</th>
                      <th className="text-gray-300">Payment Mode</th>
                      <th className="text-gray-300">Transaction Hash</th>
                      <th className="text-gray-300">Proof</th>
                      <th className="text-gray-300">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pendingPayments.map((payment:any) => (
                      <tr key={payment.id} className="border-gray-700 hover:bg-gray-700/50">
                        <td className="text-gray-300">
                          {new Date(payment.createdAt ??'').toLocaleDateString('en-IN', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </td>
                        <td>
                          <div className="text-white font-semibold">
                            {payment.buyer?.name || 'Unknown'}
                          </div>
                          <div className="text-sm text-gray-400">
                            {payment.buyer?.email || 'N/A'}
                          </div>
                        </td>
                        <td>
                          <div className="text-white font-semibold">
                            {payment.land?.title || 'N/A'}
                          </div>
                          <div className="text-sm text-gray-400">
                            {payment.land?.location || ''}
                          </div>
                        </td>
                        <td className="text-white font-semibold">₹{payment.amount.toLocaleString()}</td>
                        <td className="text-gray-300 capitalize">{payment.paymentMode}</td>
                        <td>
                          {payment.transactionHash ? (
                            <span className="text-xs font-mono text-blue-400" title={payment.transactionHash}>
                              {payment.transactionHash.slice(0, 8)}...
                              {payment.transactionHash.slice(-6)}
                            </span>
                          ) : (
                            <span className="text-gray-500">-</span>
                          )}
                        </td>
                        <td>
                          {payment?.proofUrl ? (
                            <a
                              href={payment.proofUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="btn btn-xs btn-ghost text-blue-400 hover:text-blue-300"
                            >
                              View Proof
                            </a>
                          ) : (
                            <span className="text-gray-500">-</span>
                          )}
                        </td>
                        <td>
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleApprove(payment.id)}
                              disabled={verifyingId === payment.id}
                              className="btn btn-xs btn-success gap-1"
                              title="Approve Payment"
                            >
                              <CheckCircleIcon className="h-3 w-3" />
                              {verifyingId === payment.id ? 'Processing...' : 'Approve'}
                            </button>
                            <button
                              onClick={() => handleReject(payment.id)}
                              disabled={verifyingId === payment.id}
                              className="btn btn-xs btn-error gap-1"
                              title="Reject Payment"
                            >
                              <XCircleIcon className="h-3 w-3" />
                              Reject
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Info Card */}
        <div className="card bg-gray-800/90 shadow-xl border border-gray-700">
          <div className="card-body">
            <h3 className="card-title text-blue-400">Verification Guidelines</h3>
            <ul className="list-disc list-inside space-y-2 text-sm text-gray-300">
              <li>Verify the transaction hash on the blockchain explorer if provided</li>
              <li>Check the payment proof document carefully</li>
              <li>Ensure the amount matches what was expected</li>
              <li>Approve only after confirming payment authenticity</li>
              <li>Provide clear rejection reasons if rejecting</li>
              <li>Approved payments will update property and installment status automatically</li>
            </ul>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
