import { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/layouts/DashboardLayout';
import {
  HomeIcon,
  FolderIcon,
  PencilIcon,
  TrashIcon,
  CheckCircleIcon,
  XCircleIcon,
  ShieldCheckIcon,
  MapPinIcon,
  CalendarIcon,
  UserGroupIcon,
  ArrowLeftIcon,
  DocumentTextIcon,
  CreditCardIcon,
  CurrencyDollarIcon,
  ArrowPathIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';
import { projectAPI } from '../../services/api';
import type { Project } from '../../types';

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
    if (!confirm('Are you sure you want to delete this project? This will also affect all associated properties.')) {
      return;
    }

    try {
      setDeleting(true);
      await projectAPI.delete(id!);
      navigate('/dashboard/builder/projects');
    } catch (err: unknown) {
      console.error('Failed to delete project:', err);
      const error = err as { response?: { data?: { message?: string } } };
      alert(error.response?.data?.message || 'Failed to delete project');
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
          <span>{error || 'Project not found'}</span>
        </div>
        <Link to="/dashboard/builder/projects" className="btn btn-ghost mt-4 text-white">
          <ArrowLeftIcon className="w-5 h-5 mr-2" />
          Back to Projects
        </Link>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout navItems={navItems}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div>
            <Link 
              to="/dashboard/builder/projects" 
              className="btn btn-ghost btn-sm mb-2"
            >
              <ArrowLeftIcon className="w-4 h-4 mr-2" />
              Back to Projects
            </Link>
            <h1 className="text-3xl font-bold text-white">{project.name}</h1>
            <div className="flex items-center gap-2 mt-2">
              {project.status && (
                <div className="badge badge-info">
                  {formatProjectStatus(project.status)}
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-2">
            {project.status !== 'approved' && (
              <Link
                to={`/dashboard/builder/projects/${project.id}/edit`}
                className="btn btn-primary btn-sm"
              >
                <PencilIcon className="w-4 h-4 mr-2" />
                Edit
              </Link>
            )}
            <button
              onClick={handleDelete}
              className="btn btn-error btn-sm"
              disabled={deleting}
            >
              {deleting ? (
                <span className="loading loading-spinner loading-xs"></span>
              ) : (
                <TrashIcon className="w-4 h-4 mr-2" />
              )}
              Delete
            </button>
          </div>
        </div>

        {/* Project Details Card */}
        {project.status === 'pending_approval' && (
          <div className="alert alert-warning">
            <span className="text-black">
              This project is <strong>pending admin approval</strong>. You won’t be able to create lands/properties under it until it’s approved.
            </span>
          </div>
        )}
        <div className="card bg-base-100 shadow-xl border border-base-300">
          <div className="card-body">
            <h2 className="card-title text-white">Project Information</h2>
            
            <div className="grid md:grid-cols-2 gap-6 mt-4">
              {/* Location */}
              <div className="flex items-start gap-3">
                <MapPinIcon className="w-5 h-5 text-primary mt-1" />
                <div>
                  <p className="text-sm text-gray-400">Location</p>
                  <p className="text-white font-semibold">{project.location}</p>
                </div>
              </div>

              {/* Total Units */}
              {project.totalUnits && (
                <div className="flex items-start gap-3">
                  <UserGroupIcon className="w-5 h-5 text-primary mt-1" />
                  <div>
                    <p className="text-sm text-gray-400">Total Units</p>
                    <p className="text-white font-semibold">{project.totalUnits}</p>
                  </div>
                </div>
              )}

              {/* Sold Units */}
              <div className="flex items-start gap-3">
                <UserGroupIcon className="w-5 h-5 text-primary mt-1" />
                <div>
                  <p className="text-sm text-gray-400">Sold Units</p>
                  <p className="text-white font-semibold">{project.soldUnits ?? 0}</p>
                </div>
              </div>

              {/* Total Properties */}
              <div className="flex items-start gap-3">
                <UserGroupIcon className="w-5 h-5 text-primary mt-1" />
                <div>
                  <p className="text-sm text-gray-400">Total Properties</p>
                  <p className="text-white font-semibold">{project._count?.lands ?? project.lands?.length ?? 0}</p>
                </div>
              </div>

              {/* Created Date */}
              <div className="flex items-start gap-3">
                <CalendarIcon className="w-5 h-5 text-primary mt-1" />
                <div>
                  <p className="text-sm text-gray-400">Created On</p>
                  <p className="text-white font-semibold">
                    {new Date(project.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>

            {/* Description */}
            {project.description && (
              <div className="mt-6">
                <h3 className="text-lg font-semibold text-white mb-2">Description</h3>
                <p className="text-gray-300 whitespace-pre-line">{project.description}</p>
              </div>
            )}

            {/* Location Details */}
            {project.locationDetails && (
              <div className="mt-6">
                <h3 className="text-lg font-semibold text-white mb-2">Location Details</h3>
                <p className="text-gray-300 whitespace-pre-line">{project.locationDetails}</p>
              </div>
            )}
          </div>
        </div>

        {/* Approval Documents */}
        {project.approvalDocumentsHash && (
          <div className="card bg-base-100 shadow-xl border border-base-300">
            <div className="card-body">
              <h2 className="card-title text-white">
                <ShieldCheckIcon className="w-6 h-6 text-primary" />
                Document Verification
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
                            {ipfsData?.gateway && (
                              <a
                                href={`${ipfsData.gateway}${ipfsHash}`}
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
                          <p className="text-white font-mono text-xs break-all">
                            {project.approvalDocumentsIPFSHash}
                          </p>
                        );
                      }
                    })()}
                  </div>
                )}

                <div className="flex gap-2">
                  <button
                    onClick={() => handleVerify(false)}
                    className="btn btn-primary btn-sm flex items-center"
                    disabled={verifying}
                  >
                    {verifying ? (
                      <span className="loading loading-spinner loading-xs"></span>
                    ) : (
                      <ShieldCheckIcon className="w-4 h-4 mr-2" />
                    )}
                    Verify Hash
                  </button>
                  <button
                    onClick={() => handleVerify(true)}
                    className="btn btn-secondary btn-sm flex flex-row items-center"
                    disabled={verifying}
                  >
                    {verifying ? (
                      <span className="loading loading-spinner loading-xs"></span>
                    ) : (
                      <ShieldCheckIcon className="w-4 h-4 mr-2" />
                    )}
                    Verify on Blockchain
                  </button>
                </div>

                {verificationResult && (
                  <div
                    className={`alert ${
                      verificationResult.verified ? 'alert-success' : 'alert-error'
                    }`}
                  >
                    {verificationResult.verified ? (
                      <CheckCircleIcon className="w-6 h-6" />
                    ) : (
                      <XCircleIcon className="w-6 h-6" />
                    )}
                    <span>{verificationResult.message}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Associated Properties */}
        <div className="card bg-base-100 shadow-xl border border-base-300">
          <div className="card-body">
            <div className="flex justify-between items-center">
              <h2 className="card-title text-white">Associated Properties</h2>
              <Link
                to={`/dashboard/seller/register-land?projectId=${project.id}`}
                className="btn btn-primary btn-sm"
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
                  to={`/dashboard/seller/register-land?projectId=${project.id}`}
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
