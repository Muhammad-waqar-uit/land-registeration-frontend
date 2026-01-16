import { useEffect, useState } from 'react';
import DashboardLayout from '../../components/layouts/DashboardLayout';
import {
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon,
  DocumentTextIcon,
} from '@heroicons/react/24/outline';
import { paymentAPI } from '../../services/api';
import type { Payment } from '../../types';
import { Link } from 'react-router-dom';
import { buyerNavItems } from '../../constants/navigation';

export default function BuyerPayments() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'verified' | 'pending' | 'rejected'>('all');

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const data = await paymentAPI.getByBuyer();
      setPayments(data || []);
    } catch (error) {
      console.error('Failed to fetch payments:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, []);

  const filteredPayments = payments.filter((payment) => {
    if (filter === 'all') return true;
    return payment.status === filter;
  });

  const stats = {
    total: payments.length,
    verified: payments.filter((p) => p.status === 'verified').length,
    pending: payments.filter((p) => p.status === 'pending').length,
    rejected: payments.filter((p) => p.status === 'rejected').length,
    totalAmount: payments
      .filter((p) => p.status === 'verified')
      .reduce((sum, p) => sum + p.amount, 0),
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'verified':
        return (
          <span className="badge badge-success gap-1">
            <CheckCircleIcon className="h-3 w-3" />
            Verified
          </span>
        );
      case 'pending':
        return (
          <span className="badge badge-warning gap-1">
            <ClockIcon className="h-3 w-3" />
            Pending
          </span>
        );
      case 'rejected':
        return (
          <span className="badge badge-error gap-1">
            <XCircleIcon className="h-3 w-3" />
            Rejected
          </span>
        );
      default:
        return <span className="badge">{status}</span>;
    }
  };

  if (loading) {
    return (
      <DashboardLayout navItems={buyerNavItems}>
        <div className="flex items-center justify-center min-h-[400px]">
          <span className="loading loading-spinner loading-lg"></span>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout navItems={buyerNavItems}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-white">Payment History</h1>
          <Link to="/dashboard/buyer" className="btn btn-ghost text-white">
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
            <div className="stat-title text-gray-300">Total Paid</div>
            <div className="stat-value text-green-400">PKR {stats.totalAmount.toLocaleString()}</div>
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
              <DocumentTextIcon className="h-16 w-16 mx-auto text-gray-500 mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">No Payments Found</h3>
              <p className="text-gray-400">
                {filter === 'all'
                  ? "You haven't made any payments yet."
                  : `No ${filter} payments found.`}
              </p>
            </div>
          </div>
        ) : (
          <div className="card bg-gray-800/90 shadow-xl border border-gray-700">
            <div className="card-body">
              <div className="overflow-x-auto">
                <table className="table">
                  <thead>
                    <tr className="border-gray-700">
                      <th className="text-gray-300">Date</th>
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
                        <td className="text-gray-300">
                          {new Date(payment?.createdAt ?? '').toLocaleDateString('en-IN', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </td>
                        <td>
                          <div className="text-white font-semibold">
                            {payment.land?.title || 'N/A'}
                          </div>
                          <div className="text-sm text-gray-400">
                            {payment.land?.location || ''}
                          </div>
                        </td>
                        <td className="text-white font-semibold">PKR {payment.amount.toLocaleString()}</td>
                        <td className="text-gray-300 capitalize">{payment.paymentMode}</td>
                        <td>{getStatusBadge(payment.status)}</td>
                        <td>
                          {payment.transactionHash ? (
                            <span className="text-xs font-mono text-blue-400">
                              {payment.transactionHash.slice(0, 8)}...
                              {payment.transactionHash.slice(-6)}
                            </span>
                          ) : (
                            <span className="text-gray-500">-</span>
                          )}
                        </td>
                        <td>
                          {payment.remarks ? (
                            <span className="text-sm text-gray-300">{payment.remarks}</span>
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
