import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import DashboardLayout from '../../components/layouts/DashboardLayout';
import {
  HomeIcon,
  FolderIcon,
  DocumentTextIcon,
  UserGroupIcon,
  CreditCardIcon,
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';
import { paymentAPI } from '../../services/api';
import { useAppSelector } from '../../store/hooks';
import type { Payment } from '../../types';
import { getBlockExplorerTxUrl } from '../../utils/blockchain';
import { builderNavItems } from '../../constants/navigation';

export default function SellerPayments() {
  const { user } = useAppSelector((state) => state.auth);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'verified' | 'pending' | 'rejected'>('all');

  const fetchPayments = useCallback(async () => {
    try {
      setLoading(true);
      const paymentsData = await paymentAPI.getByBuilder().catch(() => []);
      const paymentsArray = Array.isArray(paymentsData) ? paymentsData : [];
      setPayments(paymentsArray);
    } catch (error) {
      console.error('Failed to fetch payments:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  const filteredPayments = payments.filter((payment) => {
    if (filter === 'all') return true;
    return payment.status === filter;
  });

  const stats = {
    total: payments.length,
    verified: payments.filter((p) => p.status === 'verified').length,
    pending: payments.filter((p) => p.status === 'pending').length,
    rejected: payments.filter((p) => p.status === 'rejected').length,
    totalReceived: payments
      .filter((p) => p.status === 'verified')
      .reduce((sum, p) => sum + p.amount, 0),
  };

  const getStatusBadge = (status: string) => {
    const baseClass = 'badge inline-flex items-center gap-1 shrink-0 max-w-full overflow-hidden';
    const textClass = 'truncate';
    switch (status) {
      case 'verified':
        return (
          <span className={`${baseClass} badge-success`}>
            <CheckCircleIcon className="h-3 w-3 shrink-0" />
            <span className={textClass}>Verified</span>
          </span>
        );
      case 'pending':
        return (
          <span className={`${baseClass} badge-warning`}>
            <ClockIcon className="h-3 w-3 shrink-0" />
            <span className={textClass}>Pending</span>
          </span>
        );
      case 'rejected':
        return (
          <span className={`${baseClass} badge-error`}>
            <XCircleIcon className="h-3 w-3 shrink-0" />
            <span className={textClass}>Rejected</span>
          </span>
        );
      default:
        return (
          <span className={baseClass}>
            <span className={textClass}>{status}</span>
          </span>
        );
    }
  };

  if (loading) {
    return (
      <DashboardLayout navItems={builderNavItems}>
        <div className="flex items-center justify-center min-h-[400px]">
          <span className="loading loading-spinner loading-lg"></span>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout navItems={builderNavItems}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-white">Payment Tracking</h1>
          <Link to="/dashboard/builder" className="btn btn-ghost text-white">
            Back to Dashboard
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="stat bg-gray-800/90 rounded-lg shadow border border-gray-700">
            <div className="stat-title text-gray-300">Total Payments</div>
            <div className="stat-value text-blue-400">{stats.total}</div>
          </div>

          <div className="stat bg-gray-800/90 rounded-lg shadow border border-gray-700">
            <div className="stat-title text-gray-300">Verified</div>
            <div className="stat-value text-green-400">{stats.verified}</div>
          </div>

          <div className="stat bg-gray-800/90 rounded-lg shadow border border-gray-700">
            <div className="stat-title text-gray-300">Pending</div>
            <div className="stat-value text-yellow-400">{stats.pending}</div>
          </div>

          <div className="stat bg-gray-800/90 rounded-lg shadow border border-gray-700">
            <div className="stat-title text-gray-300">Rejected</div>
            <div className="stat-value text-red-400">{stats.rejected}</div>
          </div>

          <div className="stat bg-gray-800/90 rounded-lg shadow border border-gray-700">
            <div className="stat-title text-gray-300">Total Received</div>
            <div className="stat-value text-green-400">PKR {stats.totalReceived.toLocaleString()}</div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`btn btn-sm ${filter === 'all' ? 'btn-primary' : 'btn-ghost text-white'}`}
          >
            All ({stats.total})
          </button>
          <button
            onClick={() => setFilter('verified')}
            className={`btn btn-sm ${filter === 'verified' ? 'btn-success' : 'btn-ghost text-white'}`}
          >
            Verified ({stats.verified})
          </button>
          <button
            onClick={() => setFilter('pending')}
            className={`btn btn-sm ${filter === 'pending' ? 'btn-warning' : 'btn-ghost text-white'}`}
          >
            Pending ({stats.pending})
          </button>
          <button
            onClick={() => setFilter('rejected')}
            className={`btn btn-sm ${filter === 'rejected' ? 'btn-error' : 'btn-ghost text-white'}`}
          >
            Rejected ({stats.rejected})
          </button>
        </div>

        {/* Payment List */}
        {filteredPayments.length === 0 ? (
          <div className="card bg-gray-800/90 shadow-xl border border-gray-700">
            <div className="card-body text-center py-12">
              <CreditCardIcon className="h-16 w-16 mx-auto text-gray-500 mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">No Payments Found</h3>
              <p className="text-gray-400">
                {filter === 'all'
                  ? "No payments have been made for your properties yet."
                  : `No ${filter} payments found.`}
              </p>
            </div>
          </div>
        ) : (
          <div className="card bg-gray-800/90 shadow-xl border border-gray-700">
            <div className="card-body">
              <h2 className="card-title text-white mb-4">Payment History</h2>
              <div className="overflow-x-auto">
                <table className="table">
                  <thead>
                    <tr className="border-gray-700">
                      <th className="text-gray-300">Date</th>
                      <th className="text-gray-300">Buyer</th>
                      <th className="text-gray-300">Property</th>
                      <th className="text-gray-300">Amount</th>
                      <th className="text-gray-300">Payment Mode</th>
                      <th className="text-gray-300">Status</th>
                      <th className="text-gray-300">Transaction</th>
                      <th className="text-gray-300">Remarks</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPayments.map((payment) => (
                      <tr key={payment.id} className="border-gray-700 hover:bg-gray-700/50">
                        <td className="text-black">
                          {new Date(payment?.createdAt ?? '').toLocaleDateString('en-IN', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </td>
                        <td>
                          <div className="text-black font-semibold">
                            {payment.buyer?.name || 'Unknown'}
                          </div>
                          <div className="text-sm text-black">
                            {payment.buyer?.email || 'N/A'}
                          </div>
                        </td>
                        <td>
                            <div className="text-black font-semibold">
                            {payment.land?.title || 'N/A'}
                          </div>
                          <div className="text-sm text-black">
                            {payment.land?.location || ''}
                          </div>
                        </td>
                        <td className="text-black font-semibold">PKR {payment.amount.toLocaleString()}</td>
                        <td className="text-black">{payment.paymentMode === 'points' ? 'Points' : 'Bank'}</td>
                        <td>{getStatusBadge(payment.status)}</td>
                        <td>
                          {payment.transactionHash ? (
                            <a
                              href={getBlockExplorerTxUrl(payment.transactionHash)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs font-mono text-blue-400 hover:text-blue-300 link truncate max-w-[120px] inline-block"
                              title={payment.transactionHash}
                            >
                              {payment.transactionHash.slice(0, 8)}...
                              {payment.transactionHash.slice(-6)}
                            </a>
                          ) : (
                            <span className="text-gray-500">-</span>
                          )}
                        </td>
                        <td>
                          {payment.remarks ? (
                                <span className="text-sm text-black truncate max-w-[120px] inline-block">{payment.remarks}</span>
                          ) : (
                            <span className="text-gray-500">-</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
