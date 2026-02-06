import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import DashboardLayout from '../../components/layouts/DashboardLayout';
import {
  DocumentTextIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  ExclamationCircleIcon,
} from '@heroicons/react/24/outline';
import { transferRequestAPI } from '../../services/api';
import type { TransferRequest } from '../../types';
import { adminNavItems } from '../../constants/navigation';

const UPLOADS_BASE = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api').replace(/\/api\/?$/, '');

function toFullUrl(path: string | undefined) {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  return `${UPLOADS_BASE}${path.startsWith('/') ? '' : '/uploads/'}${path}`;
}

export default function AdminTransferReview() {
  const [pending, setPending] = useState<TransferRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [acting, setActing] = useState<string | null>(null);
  const [reviewModal, setReviewModal] = useState<TransferRequest | null>(null);
  const [reviewAction, setReviewAction] = useState<'approve' | 'reject'>('approve');
  const [adminNotes, setAdminNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');

  const fetchPending = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const list = await transferRequestAPI.getPendingAdmin();
      setPending(Array.isArray(list) ? list : []);
    } catch (err) {
      setError((err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to load');
      setPending([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPending();
  }, [fetchPending]);

  const openReview = (t: TransferRequest, action: 'approve' | 'reject') => {
    setReviewModal(t);
    setReviewAction(action);
    setAdminNotes('');
    setRejectionReason('');
  };

  const submitReview = async () => {
    if (!reviewModal) return;
    if (reviewAction === 'reject' && !rejectionReason.trim()) {
      alert('Rejection reason is required');
      return;
    }
    setActing(reviewModal.id);
    try {
      await transferRequestAPI.adminReview(reviewModal.id, {
        action: reviewAction,
        adminNotes: adminNotes.trim() || undefined,
        rejectionReason: reviewAction === 'reject' ? rejectionReason.trim() : undefined,
      });
      setReviewModal(null);
      fetchPending();
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } };
      alert(err.response?.data?.message || 'Action failed');
    } finally {
      setActing(null);
    }
  };

  const handleComplete = async (id: string) => {
    setActing(id);
    try {
      await transferRequestAPI.completeTransfer(id);
      fetchPending();
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } };
      alert(err.response?.data?.message || 'Complete failed');
    } finally {
      setActing(null);
    }
  };

  return (
    <DashboardLayout navItems={adminNavItems}>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-white">Transfer Review (Resale)</h1>
        <p className="text-gray-400">
          Review transfer requests from resale. Approve or reject. On approve, builder/admin can complete the transfer.
        </p>

        {error && (
          <div className="alert alert-error">
            <ExclamationCircleIcon className="h-6 w-6" />
            <span className="text-white">{error}</span>
          </div>
        )}

        <div className="card bg-base-100 shadow-xl border border-base-300">
          <div className="card-body">
            <h2 className="card-title text-white flex items-center gap-2">
              <ClockIcon className="h-6 w-6" />
              Pending admin approval
            </h2>
            {loading ? (
              <div className="flex justify-center py-8">
                <span className="loading loading-spinner loading-lg" />
              </div>
            ) : pending.length === 0 ? (
              <p className="text-gray-400 py-4">No pending transfer requests.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="table">
                  <thead>
                    <tr>
                      <th className="text-gray-300">Property</th>
                      <th className="text-gray-300">From</th>
                      <th className="text-gray-300">To</th>
                      <th className="text-gray-300">Documents</th>
                      <th className="text-gray-300">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pending.map((t) => (
                      <tr key={t.id}>
                        <td className="text-white">{t.property?.title || t.propertyId}</td>
                        <td className="text-gray-400">{t.currentOwner?.name || '—'}</td>
                        <td className="text-gray-400">{t.newOwner?.name || '—'}</td>
                        <td>
                          {t.documents?.map((d) => (
                            <a
                              key={d.id}
                              href={toFullUrl(d.documentUrl)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="link link-primary block text-sm"
                            >
                              View
                            </a>
                          )) || '—'}
                        </td>
                        <td>
                          <div className="flex gap-2">
                            <button
                              className="btn btn-success btn-xs"
                              onClick={() => openReview(t, 'approve')}
                              disabled={!!acting}
                            >
                              Approve
                            </button>
                            <button
                              className="btn btn-error btn-xs"
                              onClick={() => openReview(t, 'reject')}
                              disabled={!!acting}
                            >
                              Reject
                            </button>
                            <button
                              className="btn btn-primary btn-xs"
                              onClick={() => window.confirm('Complete transfer?') && handleComplete(t.id)}
                              disabled={!!acting}
                            >
                              {acting === t.id ? (
                                <span className="loading loading-spinner loading-xs"></span>
                              ) : (
                                'Complete'
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

        <Link to="/dashboard/admin" className="btn btn-ghost text-white">
          ← Back to Admin
        </Link>
      </div>

      {/* Review Modal */}
      {reviewModal && (
        <dialog open className="modal modal-open">
          <div className="modal-box bg-base-200">
            <h3 className="font-bold text-lg text-white">
              {reviewAction === 'approve' ? 'Approve' : 'Reject'} Transfer
            </h3>
            <p className="py-2 text-gray-400">
              {reviewModal.property?.title} — {reviewModal.currentOwner?.name} → {reviewModal.newOwner?.name}
            </p>
            {reviewAction === 'reject' && (
              <div className="form-control mt-4">
                <label className="label">
                  <span className="label-text text-white">Rejection reason *</span>
                </label>
                <input
                  type="text"
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  className="input input-bordered bg-base-300"
                  placeholder="Required"
                />
              </div>
            )}
            <div className="form-control mt-4">
              <label className="label">
                <span className="label-text text-white">Admin notes (optional)</span>
              </label>
              <textarea
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                className="textarea textarea-bordered bg-base-300"
                rows={2}
              />
            </div>
            <div className="modal-action">
              <button className="btn btn-ghost" onClick={() => setReviewModal(null)} disabled={!!acting}>
                Cancel
              </button>
              <button
                className={`btn ${reviewAction === 'approve' ? 'btn-success' : 'btn-error'}`}
                onClick={submitReview}
                disabled={!!acting || (reviewAction === 'reject' && !rejectionReason.trim())}
              >
                {acting ? <span className="loading loading-spinner loading-sm"></span> : reviewAction === 'approve' ? 'Approve' : 'Reject'}
              </button>
            </div>
          </div>
          <form method="dialog" className="modal-backdrop">
            <button onClick={() => setReviewModal(null)}>close</button>
          </form>
        </dialog>
      )}
    </DashboardLayout>
  );
}
