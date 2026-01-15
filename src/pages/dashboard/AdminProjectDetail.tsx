import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import DashboardLayout from '../../components/layouts/DashboardLayout';
import {
  HomeIcon,
  FolderIcon,
  UserGroupIcon,
  CurrencyDollarIcon,
  ArrowLeftIcon,
  PencilIcon,
  CheckCircleIcon,
  ShieldCheckIcon,
  MapPinIcon,
  CalendarIcon,
  UserGroupIcon as UsersIcon,
  DocumentTextIcon,
} from '@heroicons/react/24/outline';
import { projectAPI } from '../../services/api';
import type { Project, ProjectStatus } from '../../types';

const navItems = [
  { name: 'Overview', path: '/dashboard/admin', icon: HomeIcon },
  { name: 'Project Approvals', path: '/dashboard/admin/projects', icon: FolderIcon },
  { name: 'Builder Verification', path: '/dashboard/admin/builders', icon: UserGroupIcon },
  { name: 'Mint Tokens', path: '/dashboard/admin/mint-tokens', icon: CurrencyDollarIcon },
];

const formatStatus = (status?: ProjectStatus) => (status || 'pending_approval').replace(/_/g, ' ');

export default function AdminProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [approving, setApproving] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState<{
    verified: boolean;
    message: string;
  } | null>(null);

  const [approvalStatus, setApprovalStatus] = useState<null | {
    projectId: string;
    status: ProjectStatus;
    isApproved: boolean;
    canCreateLands: boolean;
    totalUnits: number;
    landsCount: number;
    remainingUnits: number;
  }>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      setVerificationResult(null);

      const data = await projectAPI.getById(id!);
      setProject(data);

      try {
        const status = await projectAPI.getApprovalStatus(id!);
        setApprovalStatus(status);
      } catch {
        setApprovalStatus(null);
      }
    } catch (err: unknown) {
      console.error('Failed to load project:', err);
      const e = err as { response?: { data?: { message?: string } } };
      setError(e.response?.data?.message || 'Failed to load project');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (id) load();
  }, [id, load]);

  const onApprove = async () => {
    if (!id) return;
    if (!confirm('Approve this project? This will allow land/property creation under it.')) return;

    try {
      setApproving(true);
      const updated = await projectAPI.approve(id);
      setProject((prev) => (prev ? { ...prev, ...updated } : prev));
      const status = await projectAPI.getApprovalStatus(id);
      setApprovalStatus(status);
    } catch (err: unknown) {
      console.error('Failed to approve:', err);
      const e = err as { response?: { data?: { message?: string } } };
      alert(e.response?.data?.message || 'Failed to approve project');
    } finally {
      setApproving(false);
    }
  };

  const onVerifyDocs = async () => {
    if (!id) return;
    if (!project?.approvalDocumentsHash) {
      alert('No document hash found to verify');
      return;
    }

    try {
      setVerifying(true);
      const result = await projectAPI.verify(id);
      setVerificationResult(result);
    } catch (err: unknown) {
      console.error('Verification failed:', err);
      const e = err as { response?: { data?: { message?: string } } };
      setVerificationResult({
        verified: false,
        message: e.response?.data?.message || 'Verification failed',
      });
    } finally {
      setVerifying(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout navItems={navItems}>
        <div className="flex justify-center items-center h-64">
          <span className="loading loading-spinner loading-lg"></span>
        </div>
      </DashboardLayout>
    );
  }

  if (error || !project) {
    return (
      <DashboardLayout navItems={navItems}>
        <div className="alert alert-error">
          <span className="text-black">{error || 'Project not found'}</span>
        </div>
        <Link to="/dashboard/admin/projects" className="btn btn-ghost mt-4">
          <ArrowLeftIcon className="w-5 h-5 mr-2" />
          Back to Projects
        </Link>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout navItems={navItems}>
      <div className="space-y-6">
        <div className="flex justify-between items-start gap-4 flex-wrap">
          <div>
            <button
              onClick={() => navigate('/dashboard/admin/projects')}
              className="btn btn-ghost btn-sm mb-2"
            >
              <ArrowLeftIcon className="w-4 h-4 mr-2" />
              Back to Project Approvals
            </button>
            <h1 className="text-3xl font-bold text-white">{project.name}</h1>
            <div className="flex items-center gap-2 mt-2">
              <span className="badge badge-info">{formatStatus(project.status)}</span>
              <span className="badge badge-outline">builder: {project.builderId?.slice(0, 8)}...</span>
            </div>
          </div>

          <div className="flex gap-2">
            {project.status === 'pending_approval' && (
              <button
                onClick={onApprove}
                className="btn btn-success btn-sm"
                disabled={approving}
              >
                {approving ? (
                  <span className="loading loading-spinner loading-xs"></span>
                ) : (
                  <CheckCircleIcon className="w-4 h-4 mr-2" />
                )}
                Approve Project
              </button>
            )}
            <Link to="/dashboard/admin/projects" className="btn btn-primary btn-sm">
              <PencilIcon className="w-4 h-4 mr-2" />
              Review List
            </Link>
          </div>
        </div>

        {project.status === 'pending_approval' && (
          <div className="alert alert-warning">
            <span className="text-black">
              This project is pending approval. Use “Approve Project” once you’ve reviewed documents and details.
            </span>
          </div>
        )}

        {approvalStatus && (
          <div className={`alert ${approvalStatus.canCreateLands ? 'alert-success' : 'alert-warning'}`}>
            <span className="text-black">
              Land creation eligibility: <strong>{approvalStatus.canCreateLands ? 'Allowed' : 'Blocked'}</strong> — totalUnits: {approvalStatus.totalUnits}, lands: {approvalStatus.landsCount}, remaining: {approvalStatus.remainingUnits}
            </span>
          </div>
        )}

        <div className="card bg-base-100 shadow-xl border border-base-300">
          <div className="card-body">
            <h2 className="card-title text-white">Project Information</h2>

            <div className="grid md:grid-cols-2 gap-6 mt-4">
              <div className="flex items-start gap-3">
                <MapPinIcon className="w-5 h-5 text-primary mt-1" />
                <div>
                  <p className="text-sm text-gray-400">Location</p>
                  <p className="text-white font-semibold">{project.location}</p>
                  {project.locationDetails && (
                    <p className="text-sm text-gray-400 mt-1">{project.locationDetails}</p>
                  )}
                </div>
              </div>

              {typeof project.totalUnits === 'number' && (
                <div className="flex items-start gap-3">
                  <UsersIcon className="w-5 h-5 text-primary mt-1" />
                  <div>
                    <p className="text-sm text-gray-400">Total Units</p>
                    <p className="text-white font-semibold">{project.totalUnits}</p>
                    {typeof project.soldUnits === 'number' && (
                      <p className="text-sm text-gray-400 mt-1">Sold: {project.soldUnits}</p>
                    )}
                  </div>
                </div>
              )}

              <div className="flex items-start gap-3">
                <CalendarIcon className="w-5 h-5 text-primary mt-1" />
                <div>
                  <p className="text-sm text-gray-400">Created On</p>
                  <p className="text-white font-semibold">{new Date(project.createdAt).toLocaleDateString()}</p>
                </div>
              </div>

              {project._count && (
                <div className="flex items-start gap-3">
                  <UsersIcon className="w-5 h-5 text-primary mt-1" />
                  <div>
                    <p className="text-sm text-gray-400">Total Properties</p>
                    <p className="text-white font-semibold">{project._count.lands}</p>
                  </div>
                </div>
              )}
            </div>

            {project.description && (
              <div className="mt-6">
                <h3 className="text-lg font-semibold text-white mb-2">Description</h3>
                <p className="text-gray-300 whitespace-pre-line">{project.description}</p>
              </div>
            )}
          </div>
        </div>

        {(project.approvalDocumentsHash || (project.approvalDocuments && project.approvalDocuments.length > 0)) && (
          <div className="card bg-base-100 shadow-xl border border-base-300">
            <div className="card-body">
              <h2 className="card-title text-white">
                <ShieldCheckIcon className="w-6 h-6 text-primary" />
                Approval Documents
              </h2>

              {project.approvalDocuments && project.approvalDocuments.length > 0 && (
                <div className="mt-4 space-y-2">
                  {(project.approvalDocuments as Array<{ url?: string; path?: string; name?: string; filename?: string }>).map(
                    (doc, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <DocumentTextIcon className="w-4 h-4 text-blue-400" />
                        <a
                          href={doc.url || doc.path}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-400 hover:text-blue-300 underline"
                        >
                          {doc.filename || doc.name || `Document ${idx + 1}`}
                        </a>
                      </div>
                    )
                  )}
                </div>
              )}

              {project.approvalDocumentsHash && (
                <div className="mt-4">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <p className="text-sm text-gray-400">SHA-256 Hash</p>
                    <button
                      onClick={onVerifyDocs}
                      disabled={verifying}
                      className="btn btn-sm btn-success gap-2"
                    >
                      {verifying ? (
                        <span className="loading loading-spinner loading-xs"></span>
                      ) : (
                        <ShieldCheckIcon className="w-4 h-4" />
                      )}
                      Verify
                    </button>
                  </div>
                  <p className="mt-2 text-xs text-green-400 font-mono break-all">{project.approvalDocumentsHash}</p>

                  {verificationResult && (
                    <div
                      className={`mt-3 alert ${verificationResult.verified ? 'alert-success' : 'alert-error'}`}
                    >
                      <span className="text-black">{verificationResult.message}</span>
                    </div>
                  )}
                </div>
              )}

              {(project.approvalDocumentsCID || project.approvalDocumentsIPFSHash) && (
                <div className="mt-5 space-y-3">
                  {project.approvalDocumentsCID && (
                    <div>
                      <p className="text-sm text-gray-400">Document CID</p>
                      <p className="mt-1 text-xs text-white font-mono break-all">{project.approvalDocumentsCID}</p>
                    </div>
                  )}

                  {project.approvalDocumentsIPFSHash && (
                    <div>
                      <p className="text-sm text-gray-400">IPFS</p>
                      {(() => {
                        try {
                          const ipfsData = JSON.parse(project.approvalDocumentsIPFSHash as string) as {
                            hash?: string;
                            gateway?: string;
                            timestamp?: string;
                          };

                          const ipfsHash = ipfsData?.hash || String(project.approvalDocumentsIPFSHash);
                          const gateway = ipfsData?.gateway;

                          return (
                            <div className="mt-1 space-y-1">
                              <p className="text-xs text-blue-300 font-mono break-all">{ipfsHash}</p>
                              {gateway && (
                                <a
                                  href={`${gateway}${ipfsHash}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-xs text-blue-400 hover:text-blue-300 underline inline-block"
                                >
                                  View on IPFS →
                                </a>
                              )}
                              {ipfsData?.timestamp && (
                                <p className="text-xs text-gray-500">Pinned: {new Date(ipfsData.timestamp).toLocaleString()}</p>
                              )}
                            </div>
                          );
                        } catch {
                          return (
                            <p className="mt-1 text-xs text-white font-mono break-all">
                              {project.approvalDocumentsIPFSHash}
                            </p>
                          );
                        }
                      })()}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
