import { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '../../components/layouts/DashboardLayout';
import { ownershipDocumentsAPI, landAPI, agreementAPI } from '../../services/api';
import { useAppSelector } from '../../store/hooks';
import type { Land, OwnershipDocument, Agreement } from '../../types';
import { builderNavItems } from '../../constants/navigation';
import {
  DocumentArrowUpIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';

const UPLOADS_BASE = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api').replace(/\/api\/?$/, '');

export default function BuilderOwnershipDocuments() {
  const { user } = useAppSelector((state) => state.auth);
  const [myDocs, setMyDocs] = useState<OwnershipDocument[]>([]);
  const [landsReady, setLandsReady] = useState<Land[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Upload form
  const [selectedLandId, setSelectedLandId] = useState('');
  const [buyerId, setBuyerId] = useState('');
  const [notes, setNotes] = useState('');
  const [files, setFiles] = useState<FileList | null>(null);
  const [buyerOptions, setBuyerOptions] = useState<{ id: string; name: string; email: string }[]>([]);

  const fetchData = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    setError(null);
    try {
      const [docs, landsData] = await Promise.all([
        ownershipDocumentsAPI.getBuilderMe(),
        landAPI.getAll().catch(() => []),
      ]);
      setMyDocs(Array.isArray(docs) ? docs : []);

      const landsArray = Array.isArray(landsData) ? landsData : [];
      const builderLands = landsArray.filter(
        (l: Land) => l.ownerId === user.id && (l.agreementStatus === 'completed' || l.agreementStatus === 'signed')
      );
      setLandsReady(builderLands);
    } catch (e) {
      setError((e as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // When land selected, load agreements to get buyer
  useEffect(() => {
    if (!selectedLandId) {
      setBuyerOptions([]);
      setBuyerId('');
      return;
    }
    (async () => {
      try {
        const agreements = await agreementAPI.getByProperty(selectedLandId);
        const list = Array.isArray(agreements) ? agreements : [];
        const completed = list.filter((a: Agreement) => a.status === 'signed' || a.status === 'completed');
        const buyers = completed.map((a: Agreement) => ({
          id: a.buyerId,
          name: a.buyer?.name ?? 'Buyer',
          email: a.buyer?.email ?? '',
        }));
        setBuyerOptions(buyers);
        if (buyers.length === 1) setBuyerId(buyers[0].id);
        else setBuyerId('');
      } catch {
        setBuyerOptions([]);
        setBuyerId('');
      }
    })();
  }, [selectedLandId]);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLandId || !buyerId || !files || files.length === 0) {
      setError('Select a property, buyer, and at least one file.');
      return;
    }
    setUploading(true);
    setError(null);
    setSuccess(null);
    try {
      const formData = new FormData();
      formData.append('buyerId', buyerId);
      if (notes.trim()) formData.append('notes', notes.trim());
      for (let i = 0; i < files.length; i++) {
        formData.append('files', files[i]);
      }
      await ownershipDocumentsAPI.upload(selectedLandId, formData);
      setSuccess('Ownership documents uploaded. Pending admin approval.');
      setSelectedLandId('');
      setBuyerId('');
      setNotes('');
      setFiles(null);
      fetchData();
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } };
      setError(err.response?.data?.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const pendingByLandId = new Set(
    myDocs.filter((d) => d.status === 'pending_admin_approval').map((d) => d.landId)
  );

  return (
    <DashboardLayout navItems={builderNavItems}>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-white">Ownership Documents</h1>
        <p className="text-gray-400">
          After payment is complete, upload ownership documents for the buyer. Admin approval will transfer ownership.
        </p>

        {error && (
          <div className="alert alert-error">
            <span className="text-white">{error}</span>
          </div>
        )}
        {success && (
          <div className="alert alert-success">
            <span className="text-black">{success}</span>
          </div>
        )}

        {/* Upload new */}
        <div className="card bg-base-100 shadow-xl border border-base-300">
          <div className="card-body">
            <h2 className="card-title text-white flex items-center gap-2">
              <DocumentArrowUpIcon className="h-6 w-6" />
              Upload Ownership Document
            </h2>
            <p className="text-gray-400 text-sm">
              Only properties with completed payment are listed. Select property and buyer, then upload files.
            </p>

            <form onSubmit={handleUpload} className="space-y-4 mt-4">
              <div className="form-control">
                <label className="label">
                  <span className="label-text text-black">Property</span>
                </label>
                <select
                  value={selectedLandId}
                  onChange={(e) => setSelectedLandId(e.target.value)}
                  className="select select-bordered bg-base-200 text-white w-full p-2"
                  required
                >
                  <option value="">Select property</option>
                  {landsReady
                    .filter((l) => !pendingByLandId.has(l.id))
                    .map((land) => (
                      <option key={land.id} value={land.id}>
                        {land.title} – {land.location}
                      </option>
                    ))}
                </select>
                {landsReady.filter((l) => !pendingByLandId.has(l.id)).length === 0 && landsReady.length > 0 && (
                  <p className="text-warning text-sm mt-1">All completed properties already have a pending upload.</p>
                )}
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text text-black">Buyer (new owner)</span>
                </label>
                <select
                  value={buyerId}
                  onChange={(e) => setBuyerId(e.target.value)}
                  className="select select-bordered bg-base-200 text-white w-full p-2"
                  required
                  disabled={!selectedLandId || buyerOptions.length === 0}
                >
                  <option value="">Select buyer</option>
                  {buyerOptions.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name} – {b.email}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text text-black">Notes (optional)</span>
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="textarea textarea-bordered bg-base-200 text-white w-full p-2"
                  rows={2}
                  placeholder="Builder notes"
                />
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text text-white">Files (PDF/images, max 10) <span className="text-red-400">*</span></span>
                </label>
                <input
                  type="file"
                  multiple
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(e) => setFiles(e.target.files || null)}
                  className="file-input file-input-bordered bg-base-200 text-white w-full"
                  required
                />
                {files && files.length > 0 && (
                  <p className="text-sm text-gray-400 mt-1">{files.length} file(s) selected</p>
                )}
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                disabled={uploading || !selectedLandId || !buyerId || !files?.length}
              >
                {uploading ? 'Uploading…' : 'Upload'}
              </button>
            </form>
          </div>
        </div>

        {/* My uploaded documents */}
        <div className="card bg-base-100 shadow-xl border border-base-300">
          <div className="card-body">
            <h2 className="card-title text-white">My Uploaded Documents</h2>
            {loading ? (
              <div className="flex justify-center py-8">
                <span className="loading loading-spinner loading-lg" />
              </div>
            ) : myDocs.length === 0 ? (
              <p className="text-gray-400 py-4">No ownership documents uploaded yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="table table-zebra">
                  <thead>
                    <tr>
                      <th className="text-black">Property</th>
                      <th className="text-black">Buyer</th>
                      <th className="text-black">Status</th>
                      <th className="text-black">Uploaded</th>
                      <th className="text-black">Files</th>
                    </tr>
                  </thead>
                  <tbody>
                    {myDocs.map((doc) => (
                      <tr key={doc.id}>
                        <td className="text-black">
                          <div className="font-medium">{doc.property?.title ?? doc.landId}</div>
                          {doc.property?.location && (
                            <div className="  text-xs text-gray-400">{doc.property.location}</div>
                          )}
                        </td>
                        <td className="text-black">
                          <div>{doc.buyer?.name ?? doc.buyerId}</div>
                          {doc.buyer?.email && <div className="text-xs text-gray-400">{doc.buyer.email}</div>}
                        </td>
                        <td>
                          <span
                            className={`badge ${
                              doc.status === 'approved'
                                ? 'badge-success'
                                : doc.status === 'rejected'
                                ? 'badge-error'
                                : 'badge-warning'
                            }`}
                          >
                            {doc.status === 'pending_admin_approval' && <ClockIcon className="h-3 w-3 mr-1 inline" />}
                            {doc.status === 'approved' && <CheckCircleIcon className="h-3 w-3 mr-1 inline" />}
                            {doc.status === 'rejected' && <XCircleIcon className="h-3 w-3 mr-1 inline" />}
                            {doc.status.replace('_', ' ')}
                          </span>
                        </td>
                            <td className="text-black text-sm">{new Date(doc.uploadedAt).toLocaleString()}</td>
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
