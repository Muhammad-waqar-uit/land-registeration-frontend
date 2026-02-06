import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import DashboardLayout from '../../components/layouts/DashboardLayout';
import {
  DocumentTextIcon,
  CheckCircleIcon,
  ClockIcon,
  ExclamationCircleIcon,
  ArrowUpTrayIcon,
  DocumentArrowUpIcon,
} from '@heroicons/react/24/outline';
import { transferRequestAPI } from '../../services/api';
import type { TransferRequest } from '../../types';
import { builderNavItems } from '../../constants/navigation';

const UPLOADS_BASE = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api').replace(/\/api\/?$/, '');

const STATUS_CONFIG: Record<string, { color: string; label: string }> = {
  pending_payment_confirmation: { color: 'badge-warning', label: 'Awaiting Seller Confirm' },
  pending_seller_payment_confirmation: { color: 'badge-warning', label: 'Awaiting Seller' },
  pending_builder_documents: { color: 'badge-info', label: 'Upload Documents' },
  documents_uploaded: { color: 'badge-info', label: 'Docs Uploaded' },
  pending_admin_approval: { color: 'badge-warning', label: 'Admin Review' },
  approved: { color: 'badge-success', label: 'Ready to Complete' },
  completed: { color: 'badge-neutral', label: 'Completed' },
  rejected: { color: 'badge-error', label: 'Rejected' },
};

export default function BuilderTransferRequests() {
  const [transfers, setTransfers] = useState<TransferRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [completingId, setCompletingId] = useState<string | null>(null);
  const [uploadModal, setUploadModal] = useState<TransferRequest | null>(null);
  const [uploadFiles, setUploadFiles] = useState<FileList | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const res = await transferRequestAPI.getBuilderRequests();
      setTransfers(res.data || []);
    } catch (err: unknown) {
      setError((err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to load');
      setTransfers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);


  const handleUpload = async () => {
    if (!uploadModal || !uploadFiles?.length) return;
    try {
      setUploadingId(uploadModal.id);
      setError('');
      const formData = new FormData();
      for (let i = 0; i < uploadFiles.length; i++) {
        formData.append('files', uploadFiles[i]);
      }
      await transferRequestAPI.uploadDocuments(uploadModal.id, formData);
      setUploadModal(null);
      setUploadFiles(null);
      await fetchData();
    } catch (err: unknown) {
      setError((err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Upload failed');
    } finally {
      setUploadingId(null);
    }
  };

  const handleComplete = async (id: string) => {
    try {
      setCompletingId(id);
      setError('');
      await transferRequestAPI.completeTransfer(id);
      await fetchData();
    } catch (err: unknown) {
      setError((err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Complete failed');
    } finally {
      setCompletingId(null);
    }
  };

  const toFullUrl = (path: string | undefined) => {
    if (!path) return '';
    if (path.startsWith('http')) return path;
    return `${UPLOADS_BASE}${path.startsWith('/') ? '' : '/uploads/'}${path}`;
  };

  if (loading) {
    return (
      <DashboardLayout navItems={builderNavItems}>
        <div className="flex justify-center items-center h-64">
          <span className="loading loading-spinner loading-lg"></span>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout navItems={builderNavItems}>
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-2">Transfer Requests</h1>
        <p className="text-gray-400 mb-6">Upload documents and complete ownership transfers for resale</p>

        {error && (
          <div className="alert alert-error mb-6">
            <ExclamationCircleIcon className="h-6 w-6" />
            <span className="text-white">{error}</span>
          </div>
        )}

        {transfers.length === 0 ? (
          <div className="card bg-base-200 border border-base-300">
            <div className="card-body items-center py-16">
              <DocumentTextIcon className="h-16 w-16 text-gray-500" />
              <h3 className="text-xl font-semibold text-white">No transfer requests</h3>
              <p className="text-gray-400">No transfer requests require your action.</p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {transfers.map((t) => {
              const config = STATUS_CONFIG[t.status] || { color: 'badge-ghost', label: t.status };
              const showUpload = t.status === 'pending_builder_documents' && (!t.documents?.length || t.documents.length === 0);
              const showComplete = ['documents_uploaded', 'pending_admin_approval', 'approved'].includes(t.status);
              return (
                <div key={t.id} className="card bg-base-200 border border-base-300">
                  <div className="card-body">
                    <div className="flex flex-wrap justify-between items-start gap-4">
                      <div>
                        <h3 className="text-lg font-semibold text-white">
                          {t.property?.title || 'Property'}
                        </h3>
                        {t.currentOwner && (
                          <p className="text-gray-400 text-sm">From: {t.currentOwner.name}</p>
                        )}
                        {t.newOwner && (
                          <p className="text-gray-400 text-sm">To: {t.newOwner.name}</p>
                        )}
                        <span className={`badge ${config.color} mt-2`}>{config.label}</span>
                        {t.documents && t.documents.length > 0 && (
                          <div className="mt-3 space-y-1">
                            <p className="text-sm text-gray-400">Documents:</p>
                            {t.documents.map((d) => (
                              <a
                                key={d.id}
                                href={toFullUrl(d.documentUrl)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="block text-sm text-primary hover:underline"
                              >
                                View document
                              </a>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {showUpload && (
                          <button
                            onClick={() => setUploadModal(t)}
                            className="btn btn-primary btn-sm"
                            disabled={uploadingId === t.id}
                          >
                            <ArrowUpTrayIcon className="w-4 h-4 mr-1" />
                            Upload Documents
                          </button>
                        )}
                        {showComplete && (
                          <button
                            onClick={() => window.confirm('Complete this transfer?') && handleComplete(t.id)}
                            className="btn btn-success btn-sm"
                            disabled={completingId === t.id}
                          >
                            {completingId === t.id ? (
                              <span className="loading loading-spinner loading-xs"></span>
                            ) : (
                              <>
                                <CheckCircleIcon className="w-4 h-4 mr-1" />
                                Complete Transfer
                              </>
                            )}
                          </button>
                        )}
                        <Link to={`/dashboard/builder/lands/${t.propertyId}`} className="btn btn-ghost btn-sm">
                          View Property
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="mt-6">
          <Link to="/dashboard/builder" className="btn btn-ghost text-white">
            ← Back to Dashboard
          </Link>
        </div>
      </div>

      {/* Upload Modal */}
      {uploadModal && (
        <dialog open className="modal modal-open">
          <div className="modal-box bg-base-200">
            <h3 className="font-bold text-lg text-white">Upload Transfer Documents</h3>
            <p className="py-2 text-gray-400">Upload 1–10 files (PDF or images)</p>
            <input
              type="file"
              multiple
              accept=".pdf,.jpg,.jpeg,.png"
              className="file-input file-input-bordered w-full"
              onChange={(e) => setUploadFiles(e.target.files)}
            />
            <div className="modal-action">
              <button
                className="btn btn-ghost"
                onClick={() => {
                  setUploadModal(null);
                  setUploadFiles(null);
                }}
                disabled={!!uploadingId}
              >
                Cancel
              </button>
              <button
                className="btn btn-primary"
                onClick={handleUpload}
                disabled={!uploadFiles?.length || !!uploadingId}
              >
                {uploadingId ? <span className="loading loading-spinner loading-sm"></span> : 'Upload'}
              </button>
            </div>
          </div>
          <form method="dialog" className="modal-backdrop">
            <button
              onClick={() => {
                setUploadModal(null);
                setUploadFiles(null);
              }}
            >
              close
            </button>
          </form>
        </dialog>
      )}
    </DashboardLayout>
  );
}
