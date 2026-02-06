import { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '../../components/layouts/DashboardLayout';
import { tokenRequestsAPI } from '../../services/api';
import type { TokenRequest } from '../../types';
import { adminNavItems } from '../../constants/navigation';
import {
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  CurrencyDollarIcon,
  ArrowPathIcon,
  PhotoIcon,
} from '@heroicons/react/24/outline';

const UPLOADS_BASE = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api').replace(/\/api\/?$/, '');

export default function AdminPointsRequests() {
  const [list, setList] = useState<{ data: TokenRequest[]; total: number; page: number; limit: number }>({
    data: [],
    total: 0,
    page: 1,
    limit: 10,
  });
  const [stats, setStats] = useState<{
    total: number;
    pending: number;
    approved: number;
    rejected: number;
    totalAmountRequested: number;
    totalAmountApproved: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [acting, setActing] = useState<string | null>(null);
  const [tab, setTab] = useState<'all' | 'pending'>('pending');

  const fetchList = useCallback(async () => {
    setLoading(true);
    try {
      const res =
        tab === 'pending'
          ? await tokenRequestsAPI.getPending({ page: 1, limit: 20 })
          : await tokenRequestsAPI.getAll({
              page: 1,
              limit: 20,
              status: statusFilter || undefined,
            });
      setList(res);
    } catch {
      setList({ data: [], total: 0, page: 1, limit: 10 });
    } finally {
      setLoading(false);
    }
  }, [tab, statusFilter]);

  const fetchStats = useCallback(async () => {
    try {
      const res = await tokenRequestsAPI.getStatistics();
      setStats(res);
    } catch {
      setStats(null);
    }
  }, []);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const handleApprove = async (id: string) => {
    setActing(id);
    try {
      await tokenRequestsAPI.approve(id);
      await fetchList();
      await fetchStats();
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } };
      alert(err.response?.data?.message || 'Approve failed');
    } finally {
      setActing(null);
    }
  };

  const handleReject = async (id: string) => {
    setActing(id);
    try {
      await tokenRequestsAPI.reject(id);
      await fetchList();
      await fetchStats();
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } };
      alert(err.response?.data?.message || 'Reject failed');
    } finally {
      setActing(null);
    }
  };

  return (
    <DashboardLayout navItems={adminNavItems}>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-white">Points Requests</h1>
        <p className="text-gray-400">
          Review and approve or reject point requests. Approving mints points to the user&apos;s wallet.
        </p>

        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
            <div className="stat bg-base-100 rounded-lg border border-base-300">
              <div className="stat-title text-white">Total</div>
              <div className="stat-value text-lg text-white">{stats.total}</div>
            </div>
            <div className="stat bg-base-100 rounded-lg border border-base-300 ">
              <div className="stat-title text-white">Pending</div>
              <div className="stat-value text-lg text-warning">{stats.pending}</div>
            </div>
            <div className="stat bg-base-100 rounded-lg border border-base-300">
              <div className="stat-title text-white">Approved</div>
              <div className="stat-value text-lg text-success">{stats.approved}</div>
            </div>
            <div className="stat bg-base-100 rounded-lg border border-base-300">
              <div className="stat-title text-white">Rejected</div>
              <div className="stat-value text-lg text-error">{stats.rejected}</div>
            </div>
            <div className="stat bg-base-100 rounded-lg border border-base-300">
              <div className="stat-title text-white">Requested</div>
              <div className="stat-value text-lg text-info">PKR {(stats.totalAmountRequested ?? 0).toLocaleString()}</div>
            </div>
            <div className="stat bg-base-100 rounded-lg border border-base-300">
              <div className="stat-title text-white">Approved</div>
              <div className="stat-value text-lg text-success">PKR {(stats.totalAmountApproved ?? 0).toLocaleString()}</div>
            </div>
          </div>
        )}

        <div className="flex gap-2 flex-wrap">
          <button
            type="button"
            className={`btn btn-sm ${tab === 'pending' ? 'btn-primary' : 'btn-ghost'} text-white flex flex-row items-center border-black`}
            onClick={() => setTab('pending')}
          >
            <ClockIcon className="h-4 w-4 mr-1" />
            Pending
          </button>
          <button
            type="button"
            className={`btn btn-sm ${tab === 'all' ? 'btn-primary' : 'btn-ghost'} text-white`}
            onClick={() => setTab('all')}
          >
            All
          </button>
          {tab === 'all' && (
            <>
              <button
                type="button"
                className={`btn btn-sm ${statusFilter === '' ? 'btn-primary' : 'btn-ghost'} text-white`}
                onClick={() => setStatusFilter('')}
              >
                All status
              </button>
              <button
                type="button"
                className={`btn btn-sm ${statusFilter === 'pending' ? 'btn-primary' : 'btn-ghost'} text-white`}
                onClick={() => setStatusFilter('pending')}
              >
                Pending
              </button>
              <button
                type="button"
                className={`btn btn-sm ${statusFilter === 'approved' ? 'btn-primary' : 'btn-ghost'} text-white`}
                onClick={() => setStatusFilter('approved')}
              >
                Approved
              </button>
              <button
                type="button"
                className={`btn btn-sm ${statusFilter === 'rejected' ? 'btn-primary' : 'btn-ghost'} text-white`}
                onClick={() => setStatusFilter('rejected')}
              >
                Rejected
              </button>
            </>
          )}
          <button
            type="button"
            className="btn btn-ghost btn-sm text-white gap-1 flex flex-row items-center border-black"
            onClick={() => { fetchList(); fetchStats(); }}
          >
            <ArrowPathIcon className="h-4 w-4" />
            Refresh
          </button>
        </div>

        <div className="card bg-base-100 shadow-xl border border-base-300">
          <div className="card-body">
            {loading ? (
              <div className="flex justify-center py-8">
                <span className="loading loading-spinner loading-lg" />
              </div>
            ) : list.data.length === 0 ? (
              <p className="text-gray-400 text-center py-8">No requests.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="table table-zebra">
                  <thead>
                    <tr>
                      <th className="text-black">User</th>
                      <th className="text-black">Wallet</th>
                      <th className="text-black">Amount</th>
                      <th className="text-black">Screenshot</th>
                      <th className="text-black">Status</th>
                      <th className="text-black">Date</th>
                      <th className="text-black">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {list.data.map((req) => (
                      <tr key={req.id}>
                        <td className="text-black">
                          <div className="font-medium">{req.user?.name ?? '—'}</div>
                          <div className="text-xs text-gray-400">{req.user?.email}</div>
                        </td>
                        <td className="text-black font-mono text-xs max-w-[120px] truncate" title={req.user?.walletAddress ?? ''}>
                          {req.user?.walletAddress
                            ? `${req.user.walletAddress.slice(0, 8)}...${req.user.walletAddress.slice(-6)}`
                            : '—'}
                        </td>
                        <td className="text-black font-medium">
                          <CurrencyDollarIcon className="h-4 w-4 inline mr-1" />
                          PKR {Number(req.amount).toLocaleString()}
                        </td>
                        <td className="text-black">
                          {req.screenshotUrl ? (
                            <a
                              href={req.screenshotUrl.startsWith('http') ? req.screenshotUrl : `${UPLOADS_BASE}${req.screenshotUrl}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="btn btn-ghost btn-xs gap-1 text-primary flex flex-row items-center border-black"
                            >
                              <PhotoIcon className="h-4 w-4" />
                              View
                            </a>
                          ) : (
                            <span className="text-gray-500">—</span>
                          )}
                        </td>
                        <td>
                          <span
                            className={`badge ${
                              req.status === 'approved'
                                ? 'badge-success'
                                : req.status === 'rejected'
                                ? 'badge-error'
                                : 'badge-warning'
                            }`}
                          >
                            {req.status === 'pending' && <ClockIcon className="h-3 w-3 mr-1 inline" />}
                            {req.status === 'approved' && <CheckCircleIcon className="h-3 w-3 mr-1 inline" />}
                            {req.status === 'rejected' && <XCircleIcon className="h-3 w-3 mr-1 inline" />}
                            {req.status}
                          </span>
                        </td>
                        <td className="text-gray-300 text-sm">{new Date(req.createdAt).toLocaleString()}</td>
                        <td>
                          {req.status === 'pending' && (
                            <div className="flex gap-2">
                              <button
                                type="button"
                                className="btn btn-success btn-xs gap-1 flex flex-row items-center border-black"
                                onClick={() => handleApprove(req.id)}
                                disabled={!!acting}
                              >
                                {acting === req.id ? (
                                  <span className="loading loading-spinner loading-xs" />
                                ) : (
                                  <CheckCircleIcon className="h-3 w-3" />
                                )}
                                Approve
                              </button>
                              <button
                                type="button"
                                className="btn btn-error btn-xs gap-1 flex flex-row items-center border-black"
                                onClick={() => handleReject(req.id)}
                                disabled={!!acting}
                              >
                                {acting === req.id ? (
                                  <span className="loading loading-spinner loading-xs" />
                                ) : (
                                  <XCircleIcon className="h-3 w-3" />
                                )}
                                Reject
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {list.total > list.data.length && (
              <p className="text-sm text-gray-400 mt-2">
                Showing {list.data.length} of {list.total}
              </p>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
