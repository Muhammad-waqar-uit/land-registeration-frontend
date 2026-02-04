import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { projectAPI } from '../../services/api';
import type { Project } from '../../types';
import DashboardLayout from '../../components/layouts/DashboardLayout';
import {
  PencilIcon,
  TrashIcon,
  ShieldCheckIcon,
} from '@heroicons/react/24/outline';
import { CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/solid';
import { builderNavItems } from '../../constants/navigation';

export default function ProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState<{
    verified: boolean;
    message: string;
    databaseHash?: string;
    blockchainHash?: string;
    blockchainTxHash?: string;
    transactionHash?: string;
  } | null>(null);

  const formatProjectStatus = (status?: Project['status']) =>
    (status || 'pending_approval').replace(/_/g, ' ');

  const loadProject = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await projectAPI.getById(id!);
      // Debug: Check what the API is returning
      console.log('Project API Response:', {
        id: data.id,
        name: data.name,
        soldUnits: data.soldUnits,
        totalUnits: data.totalUnits,
        _count: data._count,
        landsCount: data._count?.lands,
        landsArrayLength: data.lands?.length,
        fullResponse: data,
      });
      setProject(data);
    } catch (err: unknown) {
      console.error('Failed to load project:', err);
      const error = err as { response?: { data?: { message?: string } } };
      setError(error.response?.data?.message || 'Failed to load project');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (id) {
      loadProject();
    }
  }, [id, loadProject]);

  const handleDelete = async () => {
    if (!project) return;

    if (!window.confirm(`Are you sure you want to delete "${project.name}"? This will also affect all associated properties.`)) {
      return;
    }

    try {
      setDeleting(true);
      await projectAPI.delete(project.id);
      navigate('/dashboard/builder/projects');
    } catch (err: unknown) {
      console.error('Failed to delete project:', err);
      const error = err as { response?: { data?: { message?: string } } };
      alert(error.response?.data?.message || 'Failed to delete project');
    } finally {
      setDeleting(false);
    }
  };

  const handleVerify = async (useBlockchain = false) => {
    if (!project?.approvalDocumentsHash) {
      alert('No document hash found to verify');
      return;
    }

    try {
      setVerifying(true);
      const result = useBlockchain 
        ? await projectAPI.verifyBlockchain(id!)
        : await projectAPI.verify(id!);
      
      setVerificationResult(result);
    } catch (err: unknown) {
      console.error('Verification failed:', err);
      const error = err as { response?: { data?: { message?: string } } };
      setVerificationResult({
        verified: false,
        message: error.response?.data?.message || 'Verification failed',
      });
    } finally {
      setVerifying(false);
    }
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

  if (error || !project) {
    return (
      <DashboardLayout navItems={builderNavItems}>
        <div className="alert alert-error">
          <span className="text-white">{error || 'Project not found'}</span>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout navItems={builderNavItems}>
      <div className="space-y-6">
        {/* Header - left content can shrink so Delete/Edit stay visible */}
        <div className="flex flex-wrap gap-4 items-start justify-between">
          <div className="min-w-0 flex-1">
            <button
              onClick={() => navigate('/dashboard/builder/projects')}
              className="btn btn-outline btn-primary btn-sm gap-2 mb-2 inline-flex items-center justify-center"
            >
              ← Back to Projects
            </button>
            <h1 className="text-3xl font-bold text-white truncate break-words">{project.name}</h1>
            <p className="text-gray-400 mt-1 truncate break-words">{project.location}</p>
          </div>
          <div className="flex gap-2 shrink-0 flex-wrap">
            {project.status !== 'approved' && (
              <Link
                to={`/dashboard/builder/projects/${project.id}/edit`}
                className="btn btn-primary btn-sm inline-flex items-center gap-2 text-white"
              >
                <PencilIcon className="w-4 h-4 shrink-0" />
                <span className="truncate">Edit</span>
              </Link>
            )}
            <button
              onClick={handleDelete}
              className="btn btn-error btn-sm inline-flex items-center gap-2 text-white"
              disabled={deleting}
            >
              {deleting ? (
                <span className="loading loading-spinner loading-xs"></span>
              ) : (
                <TrashIcon className="w-4 h-4 shrink-0" />
              )}
              <span className="truncate">Delete</span>
            </button>
          </div>
        </div>

        {/* Project Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Basic Information */}
          <div className="card bg-base-100 shadow-xl border border-base-300">
            <div className="card-body">
              <h2 className="card-title text-white min-w-0 truncate">Project Information</h2>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-400">Status</p>
                  <span className={`badge badge-lg inline-flex items-center gap-1 max-w-full overflow-hidden ${
                    project.status === 'approved' ? 'badge-success' :
                    project.status === 'pending_approval' ? 'badge-warning' :
                    project.status === 'active' ? 'badge-info' :
                    'badge-error'
                  }`}>
                    <span className="truncate">{formatProjectStatus(project.status)}</span>
                  </span>
                </div>
                {project.locationDetails && (
                  <div>
                    <p className="text-sm text-gray-400">Location Details</p>
                    <p className="text-white">{project.locationDetails}</p>
                  </div>
                )}
                {project.description && (
                  <div>
                    <p className="text-sm text-gray-400">Description</p>
                    <p className="text-white">{project.description}</p>
                  </div>
                )}
                <div>
                  <p className="text-sm text-gray-400">Total Units</p>
                  <p className="text-white font-semibold text-xl">{project.totalUnits ?? 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Sold Units</p>
                  <p className="text-white font-semibold text-xl">{project.soldUnits ?? 0}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Total Properties</p>
                  <p className="text-white font-semibold text-xl">{project._count?.lands ?? project.lands?.length ?? 0}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Document Verification */}
          {project.approvalDocumentsHash && (
            <div className="card bg-base-100 shadow-xl border border-base-300">
              <div className="card-body">
                <h2 className="card-title text-white flex items-center gap-2 min-w-0">
                  <ShieldCheckIcon className="w-6 h-6 text-primary shrink-0" />
                  <span className="truncate">Document Verification</span>
                </h2>

                <div className="space-y-4 mt-4">
                  <div>
                    <p className="text-sm text-gray-400">Document Hash</p>
                    <p className="text-white font-mono text-sm break-all">
                      {project.approvalDocumentsHash}
                    </p>
                  </div>

                  {project.approvalDocumentsCID && (
                    <div>
                      <p className="text-sm text-gray-400 mb-2">Document CID</p>
                      <p className="text-white font-mono text-xs break-all">
                        {project.approvalDocumentsCID}
                      </p>
                    </div>
                  )}

                  {project.approvalDocumentsIPFSHash && (
                    <div>
                      <p className="text-sm text-gray-400 mb-2">IPFS Hash</p>
                      {(() => {
                        try {
                          const ipfsData = JSON.parse(project.approvalDocumentsIPFSHash) as {
                            hash?: string;
                            gateway?: string;
                            timestamp?: string;
                          };
                          const ipfsHash = ipfsData?.hash || project.approvalDocumentsIPFSHash;
                          return (
                            <div className="space-y-1">
                              <p className="text-white font-mono text-xs break-all">{ipfsHash}</p>
                              <a
                                href={`https://gateway.pinata.cloud/ipfs/${ipfsHash}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-blue-400 hover:text-blue-300 underline inline-block"
                              >
                                View on IPFS →
                              </a>
                              {ipfsData?.timestamp && (
                                <p className="text-xs text-gray-500">Pinned: {new Date(ipfsData.timestamp).toLocaleString()}</p>
                              )}
                            </div>
                          );
                        } catch {
                          return (
                            <div className="space-y-1">
                              <p className="text-white font-mono text-xs break-all">
                                {project.approvalDocumentsIPFSHash}
                              </p>
                              <a
                                href={`https://gateway.pinata.cloud/ipfs/${project.approvalDocumentsIPFSHash}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-blue-400 hover:text-blue-300 underline inline-block"
                              >
                                View on IPFS →
                              </a>
                            </div>
                          );
                        }
                      })()}
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => handleVerify(false)}
                    className="btn btn-primary btn-sm inline-flex items-center gap-2"
                    disabled={verifying}
                  >
                    {verifying ? (
                      <span className="loading loading-spinner loading-xs"></span>
                    ) : (
                      <ShieldCheckIcon className="w-4 h-4 shrink-0" />
                    )}
                    <span className="truncate">Verify Hash</span>
                  </button>
                  <button
                    onClick={() => handleVerify(true)}
                    className="btn btn-secondary btn-sm inline-flex items-center gap-2"
                    disabled={verifying}
                  >
                    {verifying ? (
                      <span className="loading loading-spinner loading-xs"></span>
                    ) : (
                      <ShieldCheckIcon className="w-4 h-4 shrink-0" />
                    )}
                    <span className="truncate">Verify on Blockchain</span>
                  </button>
                </div>

                {verificationResult && (
                  <div className="space-y-2">
                    <div
                      className={`alert inline-flex items-center gap-2 min-w-0 max-w-full overflow-hidden ${
                        verificationResult.verified ? 'alert-success' : 'alert-error'
                      }`}
                    >
                      {verificationResult.verified ? (
                        <CheckCircleIcon className="h-6 w-6 shrink-0" />
                      ) : (
                        <XCircleIcon className="h-6 w-6 shrink-0" />
                      )}
                      <span className="truncate">{verificationResult.message}</span>
                    </div>
                    {(verificationResult.blockchainTxHash || verificationResult.transactionHash) && (() => {
                      const txHash = verificationResult.blockchainTxHash || verificationResult.transactionHash;
                      if (!txHash) return null;
                      return (
                        <div className="bg-base-200 p-3 rounded">
                          <p className="text-sm font-semibold mb-2">Blockchain Transaction:</p>
                          <a
                            href={`https://sepolia.basescan.org/tx/${txHash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-400 hover:text-blue-300 underline break-all text-xs"
                          >
                            {txHash.substring(0, 20)}...
                            {txHash.slice(-8)}
                            {' '}
                            <span className="text-xs">→ View on Base Sepolia Etherscan</span>
                          </a>
                        </div>
                      );
                    })()}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Associated Properties */}
        <div className="card bg-base-100 shadow-xl border border-base-300">
          <div className="card-body">
            <div className="flex flex-wrap gap-2 justify-between items-center min-w-0">
              <h2 className="card-title text-white min-w-0 truncate">Associated Properties</h2>
              <Link
                to={`/dashboard/builder/register-land?projectId=${project.id}`}
                className="btn btn-primary btn-sm shrink-0"
              >
                Add Property
              </Link>
            </div>
            <p className="text-gray-400">
              Total properties in this project: {project._count?.lands || project.lands?.length || 0}
            </p>
            {(!project._count?.lands && !project.lands?.length) && (
              <div className="text-center py-8">
                <p className="text-gray-500">No properties added yet</p>
                <Link
                  to={`/dashboard/builder/register-land?projectId=${project.id}`}
                  className="btn btn-primary btn-sm mt-4"
                >
                  Add First Property
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
