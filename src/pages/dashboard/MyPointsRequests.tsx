import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import DashboardLayout from '../../components/layouts/DashboardLayout';
import { tokenRequestsAPI } from '../../services/api';
import type { TokenRequest } from '../../types';
import type { NavItem } from '../../constants/navigation';
import {
  CurrencyDollarIcon,
  ArrowLeftIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  TrashIcon,
  PhotoIcon,
} from '@heroicons/react/24/outline';

const UPLOADS_BASE = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api').replace(/\/api\/?$/, '');

interface MyPointsRequestsProps {
  navItems: NavItem[];
  backPath: string;
  backLabel: string;
  requestPointsPath: string;
}

export default function MyPointsRequests({
  navItems,
  backPath,
  backLabel,
  requestPointsPath,
}: MyPointsRequestsProps) {
  const [data, setData] = useState<{ data: TokenRequest[]; total: number; page: number; limit: number }>({
    data: [],
    total: 0,
    page: 1,
    limit: 10,
  });
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<'pending' | 'approved' | 'rejected' | ''>('');
  const [cancelling, setCancelling] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const res = await tokenRequestsAPI.myRequests({
        page: 1,
        limit: 10,
        status: statusFilter || undefined,
      });
      setData(res);
    } catch {
      setData({ data: [], total: 0, page: 1, limit: 10 });
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  const handleCancel = async (id: string) => {
    setCancelling(id);
    try {
      await tokenRequestsAPI.cancel(id);
      await fetch();
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } };
      alert(err.response?.data?.message || 'Cancel failed');
    } finally {
      setCancelling(null);
    }
  };

  return (
    <DashboardLayout navItems={navItems}>
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link to={backPath} className="btn btn-ghost btn-sm text-white gap-2 flex flex-row items-center border-black">
              <ArrowLeftIcon className="h-4 w-4" />
              {backLabel}
            </Link>
            <h1 className="text-3xl font-bold text-white">My Points Requests</h1>
          </div>
          <Link to={requestPointsPath} className="btn btn-primary gap-2 text-white flex flex-row items-center border-black">
            <CurrencyDollarIcon className="h-5 w-5" />
            Request Points
          </Link>
        </div>

        <div className="flex gap-2 flex-wrap">
          <button
            type="button"
            className={`btn btn-sm ${statusFilter === '' ? 'btn-primary' : 'btn-ghost'} text-white`}
            onClick={() => setStatusFilter('')}
          >
            All
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
        </div>

        <div className="card bg-base-100 shadow-xl border border-base-300">
          <div className="card-body">
            {loading ? (
              <div className="flex justify-center py-8">
                <span className="loading loading-spinner loading-lg" />
              </div>
            ) : data.data.length === 0 ? (
              <p className="text-gray-400 text-center py-8">No points requests yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="table table-zebra">
                  <thead>
                    <tr>
                      <th className="text-black">Amount</th>
                      <th className="text-black">Screenshot</th>
                      <th className="text-black">Status</th>
                      <th className="text-black">Date</th>
                      <th className="text-black">Review</th>
                      <th className="text-black">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.data.map((req) => (
                      <tr key={req.id}>
                        <td className="text-black font-medium">PKR {Number(req.amount).toLocaleString()}</td>
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
                        <td className="text-gray-300">{new Date(req.createdAt).toLocaleString()}</td>
                        <td className="text-gray-300 text-sm max-w-xs truncate">
                          {req.adminResponse || '—'}
                        </td>
                        <td>
                          {req.status === 'pending' && (
                            <button
                              type="button"
                              className="btn btn-error btn-xs gap-1 gap-2 flex flex-row items-center border-black"
                              onClick={() => handleCancel(req.id)}
                              disabled={cancelling === req.id}
                            >
                              {cancelling === req.id ? (
                                <span className="loading loading-spinner loading-xs" />
                              ) : (
                                <TrashIcon className="h-3 w-3" />
                              )}
                              Cancel
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {data.total > data.data.length && (
              <p className="text-sm text-gray-400 mt-2">
                Showing {data.data.length} of {data.total}
              </p>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
