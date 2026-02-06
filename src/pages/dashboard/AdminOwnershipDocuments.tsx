import { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '../../components/layouts/DashboardLayout';
import { ownershipDocumentsAPI } from '../../services/api';
import type { OwnershipDocument } from '../../types';
import { adminNavItems } from '../../constants/navigation';
import {
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';

const UPLOADS_BASE = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api').replace(/\/api\/?$/, '');

export default function AdminOwnershipDocuments() {
  const [pending, setPending] = useState<OwnershipDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState<string | null>(null);
  const [reviewModal, setReviewModal] = useState<OwnershipDocument | null>(null);
  const [reviewAction, setReviewAction] = useState<'approve' | 'reject'>('approve');
  const [adminNotes, setAdminNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');

  const fetchPending = useCallback(async () => {
    setLoading(true);
    try {
      const list = await ownershipDocumentsAPI.getAdminPending();
      setPending(Array.isArray(list) ? list : []);
    } catch {
      setPending([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPending();
  }, [fetchPending]);

  const openReview = (doc: OwnershipDocument, action: 'approve' | 'reject') => {
    setReviewModal(doc);
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
      await ownershipDocumentsAPI.adminReview(reviewModal.id, {
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

  return (
    <DashboardLayout navItems={adminNavItems}>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-white">Ownership Documents</h1>
        <p className="text-gray-400">
          Approve or reject ownership document uploads. On approve, ownership is transferred to the buyer.
        </p>

        <div className="card bg-base-100 shadow-xl border border-base-300">
          <div className="card-body">
            <h2 className="card-title text-white flex items-center gap-2">
              <ClockIcon className="h-6 w-6" />
              Pending approval
            </h2>
            {loading ? (
              <div className="flex justify-center py-8">
                <span className="loading loading-spinner loading-lg" />
              </div>
            ) : pending.length === 0 ? (
              <p className="text-gray-400 py-4">No pending ownership documents.</p>
            ) : ( 
              <div className="overflow-x-auto">
                <table className="table table-zebra">
                  <thead>
                    <tr>
                      <th className="text-black">Property</th>
                      <th className="text-black">Buyer</th>
                      <th className="text-black">Builder</th>
                      <th className="text-black">Uploaded</th>
                      <th className="text-black">Files</th>
                      <th className="text-black">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pending.map((doc) => (
                      <tr key={doc.id}>
                        <td className="text-black">
                          <div className="font-medium">{doc.property?.title ?? doc.landId}</div>
                          {doc.property?.location && (
                            <div className="text-xs text-gray-400">{doc.property.location}</div>
                          )}
                        </td>
                        <td className="text-black">
                          <div>{doc.buyer?.name ?? doc.buyerId}</div>
                          {doc.buyer?.email && <div className="text-xs text-gray-400">{doc.buyer.email}</div>}
                        </td>
                          <td className="text-black">
                          <div>{doc.uploader?.name ?? doc.uploaderId}</div>
                        </td>
                        <td className="text-gray-300 text-sm">{new Date(doc.uploadedAt).toLocaleString()}</td>
                        <td>
                          {doc.documents?.length
                            ? doc.documents.map((f) => (
                                <a
                                  key={f.id}
                                  href={f.fileUrl.startsWith('http') ? f.fileUrl : `${UPLOADS_BASE}${f.fileUrl}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="link link-primary text-sm block"
                                >
                                  {f.fileName}
                                </a>
                              ))
                            : '—'}
                        </td>
                        <td>
                          <div className="flex gap-2">
                            <button
                              type="button"
                              className="btn btn-success btn-xs gap-1 flex flex-row items-center border-black"
                              onClick={() => openReview(doc, 'approve')}
                              disabled={!!acting}
                            >
                              <CheckCircleIcon className="h-3 w-3" />
                              Approve
                            </button>
                            <button
                              type="button"
                              className="btn btn-error btn-xs gap-1 flex flex-row items-center border-black"
                              onClick={() => openReview(doc, 'reject')}
                              disabled={!!acting}
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
            )}
          </div>
        </div>
      </div>

      {/* Review modal - fixed overlay */}
      {reviewModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/70" onClick={() => setReviewModal(null)} />
          <div className="relative bg-base-200 rounded-lg shadow-xl p-6 max-w-md w-full mx-4 border border-base-300">
            <h3 className="font-bold text-lg text-white mb-2">
              {reviewAction === 'approve' ? 'Approve' : 'Reject'} ownership document
            </h3>
            <p className="text-gray-300 text-sm mb-4">{reviewModal.property?.title} → {reviewModal.buyer?.name}</p>
            <div className="form-control mt-4">
              <label className="label"><span className="label-text text-black">Admin notes (optional)</span></label>
              <textarea className="textarea textarea-bordered bg-base-300 text-white w-full p-2" value={adminNotes} onChange={(e) => setAdminNotes(e.target.value)} rows={2} placeholder="Notes" />
            </div>
            {reviewAction === 'reject' && (
              <div className="form-control mt-2">
                <label className="label"><span className="label-text text-black">Rejection reason <span className="text-red-400">*</span></span></label>
                <textarea value={rejectionReason} onChange={(e) => setRejectionReason(e.target.value)} className="textarea textarea-bordered bg-base-300 text-white w-full" rows={2} placeholder="Reason" required />
              </div>
            )}
            <div className="flex gap-2 justify-end mt-6">
              <button type="button" className="btn btn-ghost flex flex-row items-center border-black text-white" onClick={() => setReviewModal(null)}>Cancel</button>
              <button type="button" className={reviewAction === 'approve' ? 'btn btn-success' : 'btn btn-error'} onClick={submitReview} disabled={acting === reviewModal.id || (reviewAction === 'reject' && !rejectionReason.trim())}>
                {acting === reviewModal.id ? 'Processing…' : reviewAction === 'approve' ? 'Approve' : 'Reject'}
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
