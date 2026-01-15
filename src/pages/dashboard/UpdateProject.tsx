import { useState, useEffect, useCallback, type FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import DashboardLayout from '../../components/layouts/DashboardLayout';
import {
  HomeIcon,
  FolderIcon,
  ArrowLeftIcon,
  DocumentIcon,
  ShieldCheckIcon,
  DocumentTextIcon,
  UserGroupIcon,
  CreditCardIcon,
  CurrencyDollarIcon,
  ArrowPathIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';
import { projectAPI } from '../../services/api';

const navItems = [
  { name: 'Overview', path: '/dashboard/builder', icon: HomeIcon },
  { name: 'Projects', path: '/dashboard/builder/projects', icon: FolderIcon },
  { name: 'My Lands', path: '/dashboard/builder/lands', icon: DocumentTextIcon },
  { name: 'Buyer Progress', path: '/dashboard/builder/buyers', icon: UserGroupIcon },
  { name: 'Payments', path: '/dashboard/builder/payments', icon: CreditCardIcon },
  { name: 'Property Requests', path: '/dashboard/builder/property-requests', icon: DocumentTextIcon },
  { name: 'Agreements', path: '/dashboard/builder/agreements', icon: DocumentTextIcon },
  { name: 'Installments', path: '/dashboard/builder/installments', icon: CurrencyDollarIcon },
  { name: 'Resale Requests', path: '/dashboard/builder/resale-requests', icon: ArrowPathIcon },
  { name: 'Pending Verifications', path: '/dashboard/builder/pending', icon: ClockIcon },
];

export default function UpdateProject() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [formData, setFormData] = useState({
    name: '',
    location: '',
    locationDetails: '',
    description: '',
    totalUnits: '',
  });
  const [approvalDocs, setApprovalDocs] = useState<FileList | null>(null);
  const [existingDocs, setExistingDocs] = useState<Array<{ id?: string; name?: string; url?: string; path?: string; filename?: string }>>([]);
  const [projectMetadata, setProjectMetadata] = useState<{
    status?: string;
    approvalDocumentsHash?: string;
    approvalDocumentsIPFSHash?: string;
    approvalDocumentsCID?: string;
    soldUnits?: number;
  }>({});
  const [isLoading, setIsLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState<{
    verified: boolean;
    message: string;
  } | null>(null);

  const loadProject = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const project = await projectAPI.getById(id!);
      setFormData({
        name: project.name || '',
        location: project.location || '',
        locationDetails: project.locationDetails || '',
        description: project.description || '',
        totalUnits: project.totalUnits ? String(project.totalUnits) : '',
      });
      
      // Store project metadata
      setProjectMetadata({
        status: project.status,
        approvalDocumentsHash: project.approvalDocumentsHash,
        approvalDocumentsIPFSHash: project.approvalDocumentsIPFSHash,
        approvalDocumentsCID: project.approvalDocumentsCID,
        soldUnits: project.soldUnits,
      });
      
      // Store existing approval documents
      if (project.approvalDocuments && project.approvalDocuments.length > 0) {
        setExistingDocs(project.approvalDocuments as Array<{ id?: string; name?: string; url?: string; path?: string; filename?: string }>);
      }
    } catch (err: unknown) {
      console.error('Failed to load project:', err);
      setError((err && typeof err === 'object' && 'response' in err && err.response && typeof err.response === 'object' && 'data' in err.response && err.response.data && typeof err.response.data === 'object' && 'message' in err.response.data ? err.response.data.message as string : null) || 'Failed to load project');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (id) {
      loadProject();
    }
  }, [id, loadProject]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    if (error) setError(null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setApprovalDocs(e.target.files);
      if (error) setError(null);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      setError('Project name is required');
      return;
    }
    
    if (!formData.location.trim()) {
      setError('Location is required');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // Prepare JSON data
      const projectData: Record<string, string | number> = {
        name: formData.name.trim(),
        location: formData.location.trim(),
      };
      
      if (formData.locationDetails.trim()) {
        projectData.locationDetails = formData.locationDetails.trim();
      }
      
      if (formData.description.trim()) {
        projectData.description = formData.description.trim();
      }
      
      if (formData.totalUnits && parseInt(formData.totalUnits) > 0) {
        projectData.totalUnits = parseInt(formData.totalUnits);
      }

      // Debug: Log what we're sending
      console.log('=== UPDATE PROJECT REQUEST ===' );
      console.log('Project ID:', id);
      console.log('JSON payload:', projectData);
      console.log('- Files to upload:', approvalDocs ? approvalDocs.length : 0);
      console.log('==============================');

      // Update project with JSON
      await projectAPI.update(id!, projectData);
      console.log('✅ Project updated');

      // Upload new approval documents if provided
      if (approvalDocs && approvalDocs.length > 0) {
        console.log('📤 Uploading', approvalDocs.length, 'new approval documents...');
        const docsFormData = new FormData();
        for (let i = 0; i < approvalDocs.length; i++) {
          docsFormData.append('approvalDocuments', approvalDocs[i]);
        }
        await projectAPI.uploadDocs(id!, docsFormData);
        console.log('✅ Documents uploaded successfully');
      }
      
      // Success - navigate to projects list
      navigate('/dashboard/builder/projects');
    } catch (err: unknown) {
      console.error('Failed to update project:', err);
      setError((err && typeof err === 'object' && 'response' in err && err.response && typeof err.response === 'object' && 'data' in err.response && err.response.data && typeof err.response.data === 'object' && 'message' in err.response.data ? err.response.data.message as string : null) || 'Failed to update project. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerify = async () => {
    if (!projectMetadata.approvalDocumentsHash) {
      alert('No document hash found to verify');
      return;
    }

    try {
      setVerifying(true);
      setVerificationResult(null);
      const result = await projectAPI.verify(id!);
      setVerificationResult(result);
    } catch (err: unknown) {
      console.error('Verification failed:', err);
      setVerificationResult({
        verified: false,
        message: (err && typeof err === 'object' && 'response' in err && err.response && typeof err.response === 'object' && 'data' in err.response && err.response.data && typeof err.response.data === 'object' && 'message' in err.response.data ? err.response.data.message as string : null) || 'Verification failed',
      });
    } finally {
      setVerifying(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout navItems={navItems}>
        <div className="flex justify-center py-12">
          <span className="loading loading-spinner loading-lg"></span>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout navItems={navItems}>
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate('/dashboard/builder/projects')}
            className="btn btn-outline btn-primary btn-sm gap-2 mb-4 inline-flex items-center justify-center"
          >
            <ArrowLeftIcon className="w-4 h-4 flex-shrink-0" />
            <span>Back to Projects</span>
          </button>
          <h1 className="text-3xl font-bold text-white">Update Project</h1>
          <p className="text-gray-400 mt-1">Edit project details</p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="alert alert-error mb-6">
            <span className="text-black">{error}</span>
          </div>
        )}

        {/* Project Metadata */}
        {(projectMetadata.status || projectMetadata.approvalDocumentsHash) && (
          <div className="card bg-blue-950/50 shadow-xl border border-blue-800 mb-6">
            <div className="card-body p-4">
              <h3 className="text-lg font-semibold text-blue-100 mb-3">Project Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* Status */}
                {projectMetadata.status && (
                  <div>
                    <p className="text-xs text-blue-300 mb-1">Status</p>
                    <span className={`badge ${
                      projectMetadata.status === 'approved' ? 'badge-success' :
                      projectMetadata.status === 'pending_approval' ? 'badge-warning' :
                      projectMetadata.status === 'active' ? 'badge-info' :
                      projectMetadata.status === 'completed' ? 'badge-neutral' :
                      'badge-ghost'
                    }`}>
                      {projectMetadata.status}
                    </span>
                  </div>
                )}
                
                {/* Sold Units */}
                {formData.totalUnits && (
                  <div>
                    <p className="text-xs text-blue-300 mb-1">Sales Progress</p>
                    <p className="text-sm text-blue-50">
                      <span className="font-semibold">{projectMetadata.soldUnits || 0}</span> / {formData.totalUnits} units sold
                    </p>
                  </div>
                )}
              </div>
              
              {/* Document Hash */}
              {projectMetadata.approvalDocumentsHash && (
                <div className="mt-3">
                  <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
                    <p className="text-xs text-blue-300">Document Hash (SHA-256)</p>
                    <button
                      type="button"
                      onClick={handleVerify}
                      disabled={verifying}
                      className="btn btn-xs btn-success gap-1 inline-flex items-center justify-center"
                      title="Verify document integrity"
                    >
                      {verifying ? (
                        <span className="loading loading-spinner loading-xs"></span>
                      ) : (
                        <ShieldCheckIcon className="w-3 h-3 flex-shrink-0" />
                      )}
                      <span>Verify</span>
                    </button>
                  </div>
                  <div className="bg-blue-900/40 p-2 rounded border border-blue-700">
                    <p className="text-xs text-green-400 font-mono break-all">
                      {projectMetadata.approvalDocumentsHash}
                    </p>
                  </div>
                  
                  {/* Verification Result */}
                  {verificationResult && (
                    <div className={`mt-2 p-2 rounded border ${
                      verificationResult.verified
                        ? 'bg-green-900/20 border-green-700'
                        : 'bg-red-900/20 border-red-700'
                    }`}>
                      <div className="flex items-center gap-2">
                        <ShieldCheckIcon className={`w-4 h-4 ${
                          verificationResult.verified ? 'text-green-400' : 'text-red-400'
                        }`} />
                        <p className={`text-xs font-medium ${
                          verificationResult.verified ? 'text-green-300' : 'text-red-300'
                        }`}>
                          {verificationResult.message}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}
              
              {/* IPFS Hash */}
              {projectMetadata.approvalDocumentsIPFSHash && (
                <div className="mt-3">
                  <p className="text-xs text-blue-300 mb-1">IPFS Hash</p>
                  <div className="bg-blue-900/40 p-2 rounded border border-blue-700">
                    {(() => {
                      try {
                        const ipfsData = JSON.parse(projectMetadata.approvalDocumentsIPFSHash);
                        return (
                          <div className="space-y-1">
                            <p className="text-xs text-blue-50">
                              <span className="text-blue-300">Hash:</span>{' '}
                              <span className="font-mono">{ipfsData.hash}</span>
                            </p>
                            {ipfsData.gateway && (
                              <a
                                href={`${ipfsData.gateway}${ipfsData.hash}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-blue-400 hover:text-blue-300 underline inline-block"
                              >
                                View on IPFS →
                              </a>
                            )}
                          </div>
                        );
                      } catch {
                        return <p className="text-xs text-blue-50 font-mono break-all">{projectMetadata.approvalDocumentsIPFSHash}</p>;
                      }
                    })()}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Form */}
        <div className="card bg-blue-950 shadow-2xl border border-blue-800">
          <div className="card-body">
            <form onSubmit={handleSubmit} className="space-y-6 ">
              {/* Project Name */}
              <div className="form-control bg-blue-900/60">
                <label className="label">
                  <span className="label-text text-blue-100 font-medium ">
                    Project Name <span className="text-red-400">*</span>
                  </span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="e.g., Green Valley Housing, Downtown Plaza"
                  className="input w-full p-2 bg-blue-900/60 text-blue-50 border border-blue-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-400/30 focus:outline-none placeholder:text-white"
                  required
                />
              </div>

              {/* Location */}
              <div className="form-control bg-blue-900/60">
                <label className="label">
                  <span className="label-text text-blue-100 font-medium">
                    Location <span className="text-red-400">*</span>
                  </span>
                </label>
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  placeholder="e.g., Downtown Area, City"
                  className="input w-full p-2 bg-blue-900/60 text-blue-50 border border-blue-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-400/30 focus:outline-none placeholder:text-white"
                  required
                />
              </div>

              {/* Location Details */}
              <div className="form-control bg-blue-900/60">
                <label className="label">
                  <span className="label-text text-blue-100 font-medium">Location Details</span>
                </label>
                <input
                  type="text"
                  name="locationDetails"
                  value={formData.locationDetails}
                  onChange={handleChange}
                  placeholder="e.g., Near Central Park, next to shopping mall, 5 minutes from airport"
                  className="input w-full p-2 bg-blue-900/60 text-blue-50 border border-blue-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-400/30 focus:outline-none placeholder:text-white"
                />
                <label className="label">
                  <span className="label-text-alt text-blue-300">Optional</span>
                </label>
              </div>

              {/* Description */}
              <div className="form-control bg-blue-900/60">
                <label className="label">
                  <span className="label-text text-blue-100 font-medium">Description</span>
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Describe your project, its features, amenities, etc."
                  className="textarea h-32 p-2 w-full bg-blue-900/60 text-blue-50 border border-blue-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-400/30 focus:outline-none placeholder:text-white"
                  rows={4}
                />
                <label className="label">
                  <span className="label-text-alt text-blue-300">Optional</span>
                </label>
              </div>

              {/* Total Units */}
              <div className="form-control bg-blue-900/60">
                <label className="label">
                  <span className="label-text text-blue-100 font-medium">Total Units</span>
                </label>
                <input
                  type="number"
                  name="totalUnits"
                  value={formData.totalUnits}
                  onChange={handleChange}
                  placeholder="e.g., 50"
                  min="1"
                  className="input w-full p-2 bg-blue-900/60 text-blue-50 border border-blue-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-400/30 focus:outline-none placeholder:text-white"
                />
                <label className="label">
                  <span className="label-text-alt text-blue-300">
                    Optional - How many properties/units in this project
                  </span>
                </label>
              </div>

              {/* Approval Documents */}
              <div className="form-control bg-blue-900/60">
                <label className="label">
                  <span className="label-text text-blue-100 font-medium">Approval Documents</span>
                </label>
                
                {/* Existing Documents */}
                {existingDocs.length > 0 && (
                  <div className="mb-4 space-y-2">
                    <p className="text-sm text-blue-200 mb-2">Existing Documents:</p>
                    <div className="space-y-2">
                      {existingDocs.map((doc, index) => (
                        <div key={index} className="flex items-center gap-2 bg-blue-800/40 p-2 rounded border border-blue-700">
                          <DocumentIcon className="w-5 h-5 text-blue-300 flex-shrink-0" />
                          <a
                            href={doc.url || doc.path}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-200 hover:text-blue-100 text-sm flex-1 truncate underline"
                          >
                            {doc.filename || doc.name || `Document ${index + 1}`}
                          </a>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Upload New Documents */}
                <div>
                  <p className="text-sm text-blue-200 mb-2">Add More Documents:</p>
                  <input
                    type="file"
                    onChange={handleFileChange}
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                    multiple
                    className="file-input w-full bg-blue-900/60 text-blue-50 border border-blue-700 focus:border-blue-500 file:bg-blue-600 file:text-white file:font-medium file:mr-4 file:py-2 file:px-4 hover:file:bg-blue-500"
                  />
                </div>
                <label className="label">
                  <span className="label-text-alt text-blue-300">
                    Optional - Upload NOC, approval letters, plans, etc. (PDF, Images)
                  </span>
                </label>
              </div>

              {/* Submit Button */}
              <div className="card-actions justify-end pt-4">
                <button
                  type="button"
                  onClick={() => navigate('/dashboard/builder/projects')}
                  className="btn btn-outline btn-primary w-auto"
                  disabled={isLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="btn btn-primary gap-2 inline-flex items-center justify-center w-auto"
                >
                  {isLoading ? (
                    <>
                      <span className="loading loading-spinner"></span>
                      <span>Updating...</span>
                    </>
                  ) : (
                    <>
                      <FolderIcon className="w-5 h-5 flex-shrink-0" />
                      <span>Update Project</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
