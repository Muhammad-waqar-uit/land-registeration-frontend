import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import DashboardLayout from '../../components/layouts/DashboardLayout';
import {
  HomeIcon,
  FolderIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  DocumentTextIcon,
  ShieldCheckIcon,
  UserGroupIcon,
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
  { name: 'Buyer Progress', path: '/dashboard/builder/buyers', icon: UserGroupIcon },
  { name: 'Payments', path: '/dashboard/builder/payments', icon: CreditCardIcon },
  { name: 'Property Requests', path: '/dashboard/builder/property-requests', icon: DocumentTextIcon },
  { name: 'Agreements', path: '/dashboard/builder/agreements', icon: DocumentTextIcon },
  { name: 'Installments', path: '/dashboard/builder/installments', icon: CurrencyDollarIcon },
  { name: 'Resale Requests', path: '/dashboard/builder/resale-requests', icon: ArrowPathIcon },
  { name: 'Pending Verifications', path: '/dashboard/builder/pending', icon: ClockIcon },
];

export default function Projects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [verifying, setVerifying] = useState<string | null>(null);
  const [verificationResults, setVerificationResults] = useState<Record<string, {
    verified: boolean;
    message: string;
  }>>({});

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await projectAPI.getAll();
      // Debug: Check what the API is returning for first project
      if (data.length > 0) {
        const firstProject = data[0];
        console.log('Projects API Response (first project):', {
          id: firstProject.id,
          name: firstProject.name,
          soldUnits: firstProject.soldUnits,
          totalUnits: firstProject.totalUnits,
          _count: firstProject._count,
          landsCount: firstProject._count?.lands,
        });
      }
      setProjects(data);
    } catch (err: unknown) {
      console.error('Failed to load projects:', err);
      const error = err as { response?: { data?: { message?: string } } };
      setError(error.response?.data?.message || 'Failed to load projects');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (projectId: string) => {
    if (!confirm('Are you sure you want to delete this project? This will also affect all associated properties.')) {
      return;
    }

    try {
      setDeleting(projectId);
      await projectAPI.delete(projectId);
      setProjects(projects.filter((p) => p.id !== projectId));
    } catch (err: unknown) {
      console.error('Failed to delete project:', err);
      const error = err as { response?: { data?: { message?: string } } };
      alert(error.response?.data?.message || 'Failed to delete project');
    } finally {
      setDeleting(null);
    }
  };

  const handleVerify = async (projectId: string, useBlockchain = false) => {
    const project = projects.find(p => p.id === projectId);
    if (!project?.approvalDocumentsHash) {
      alert('No document hash found to verify');
      return;
    }

    try {
      setVerifying(projectId);
      const result = useBlockchain 
        ? await projectAPI.verifyBlockchain(projectId)
        : await projectAPI.verify(projectId);
      
      setVerificationResults(prev => ({
        ...prev,
        [projectId]: result,
      }));
    } catch (err: unknown) {
      console.error('Verification failed:', err);
      const error = err as { response?: { data?: { message?: string } } };
      setVerificationResults(prev => ({
        ...prev,
        [projectId]: {
          verified: false,
          message: error.response?.data?.message || 'Verification failed',
        },
      }));
    } finally {
      setVerifying(null);
    }
  };

  const formatProjectStatus = (status?: Project['status']) =>
    (status || 'pending_approval').replace(/_/g, ' ');

  return (
    <DashboardLayout navItems={navItems}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">My Projects</h1>
            <p className="text-gray-400 mt-1">Manage your property development projects</p>
          </div>
          <Link
            to="/dashboard/builder/projects/create"
            className="btn btn-primary gap-2 flex items-center justify-center"
          >
            <PlusIcon className="w-5 h-5 flex-shrink-0" />
            <span>New Project</span>
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="stat bg-base-200 rounded-lg">
            <div className="stat-title text-white">Total Projects</div>
            <div className="stat-value text-primary">{projects.length}</div>
            <div className="stat-desc text-gray-400">Active developments</div>
          </div>
          <div className="stat bg-base-200 rounded-lg">
            <div className="stat-title text-white">Total Properties</div>
            <div className="stat-value text-secondary">
              {projects.reduce((sum, p) => sum + (p._count?.lands || 0), 0)}
            </div>
            <div className="stat-desc text-gray-400">Listed properties</div>
          </div>
          <div className="stat bg-base-200 rounded-lg">
            <div className="stat-title text-white">Avg Units/Project</div>
            <div className="stat-value text-accent">
              {projects.length > 0
                ? Math.round(
                    projects.reduce((sum, p) => sum + (p._count?.lands || 0), 0) /
                      projects.length
                  )
                : 0}
            </div>
            <div className="stat-desc text-gray-400">Average size</div>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="alert alert-error">
            <span className="text-black">{error}</span>
          </div>
        )}

        {/* Loading */}
        {loading ? (
          <div className="flex justify-center py-12">
            <span className="loading loading-spinner loading-lg"></span>
          </div>
        ) : projects.length === 0 ? (
          /* Empty State */
          <div className="text-center py-12">
            <FolderIcon className="w-16 h-16 mx-auto text-gray-600 mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">No Projects Yet</h3>
            <p className="text-gray-400 mb-6">
              Create your first project to start listing properties
            </p>
            <div className="flex justify-center">
              <Link to="/dashboard/builder/projects/create" className="btn btn-primary gap-2 inline-flex items-center justify-center w-auto">
                <PlusIcon className="w-5 h-5 flex-shrink-0" />
                <span>Create Project</span>
              </Link>
            </div>
          </div>
        ) : (
          /* Projects Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <div key={project.id} className="card bg-base-200 shadow-xl">
                <div className="card-body">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <FolderIcon className="w-8 h-8 text-primary" />
                      {/* Status Badge */}
                      <span className={`badge badge-sm ${
                        project.status === 'approved' ? 'badge-success' :
                        project.status === 'pending_approval' ? 'badge-warning' :
                        project.status === 'active' ? 'badge-info' :
                        project.status === 'completed' ? 'badge-neutral' :
                        'badge-ghost'
                      }`}>
                        {formatProjectStatus(project.status)}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      {project.status !== 'approved' && (
                        <Link
                          to={`/dashboard/builder/projects/${project.id}/edit`}
                          className="btn btn-sm btn-square btn-primary"
                          title="Edit"
                        >
                          <PencilIcon className="w-4 h-4" />
                        </Link>
                      )}
                      <button
                        onClick={() => handleDelete(project.id)}
                        disabled={deleting === project.id}
                        className="btn btn-primary btn-sm btn-square text-error"
                        title="Delete"
                      >
                        {deleting === project.id ? (
                          <span className="loading loading-spinner loading-xs"></span>
                        ) : (
                          <TrashIcon className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  <h2 className="card-title text-white mt-2">{project.name}</h2>
                  
                  <div className="space-y-2">
                    <p className="text-sm text-gray-400">
                      <span className="font-semibold text-white">Location:</span>{' '}
                      {project.location}
                    </p>
                    
                    {project.locationDetails && (
                      <p className="text-xs text-gray-500">
                        {project.locationDetails}
                      </p>
                    )}
                    
                    {project.description && (
                      <p className="text-sm text-gray-400 line-clamp-2">
                        {project.description}
                      </p>
                    )}
                    
                    {/* Approval Documents */}
                    {project.approvalDocuments && project.approvalDocuments.length > 0 && (
                      <div className="mt-2">
                        <p className="text-xs text-gray-500 mb-1">Documents:</p>
                        <div className="space-y-1">
                          {(project.approvalDocuments as Array<{ url?: string; path?: string; name?: string; filename?: string }>).slice(0, 2).map((doc, index: number) => (
                            <div key={index} className="flex items-center gap-1 text-xs">
                              <DocumentTextIcon className="w-3 h-3 text-blue-400 flex-shrink-0" />
                              <a
                                href={doc.url || doc.path}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-400 hover:text-blue-300 truncate underline"
                              >
                                {doc.filename || doc.name || `Document ${index + 1}`}
                              </a>
                            </div>
                          ))}
                          {project.approvalDocuments.length > 2 && (
                            <p className="text-xs text-gray-500">+{project.approvalDocuments.length - 2} more</p>
                          )}
                        </div>
                      </div>
                    )}
                    
                    {/* Document Hash */}
                    {project.approvalDocumentsHash && (
                      <div className="flex items-start gap-1 mt-2 p-2 bg-base-300 rounded">
                        <DocumentTextIcon className="w-4 h-4 text-success flex-shrink-0 mt-0.5" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1 flex-wrap gap-1">
                            <p className="text-xs text-gray-500">Document Hash:</p>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.preventDefault();
                                handleVerify(project.id);
                              }}
                              disabled={verifying === project.id}
                              className="btn btn-xs btn-success gap-1 inline-flex items-center justify-center"
                              title="Verify document"
                            >
                              {verifying === project.id ? (
                                <span className="loading loading-spinner loading-xs"></span>
                              ) : (
                                <ShieldCheckIcon className="w-3 h-3 flex-shrink-0" />
                              )}
                              <span>Verify</span>
                            </button>
                          </div>
                          <p className="text-xs text-success font-mono break-all" title={project.approvalDocumentsHash}>
                            {project.approvalDocumentsHash}
                          </p>
                          
                          {/* IPFS Hash */}
                          {project.approvalDocumentsIPFSHash && (
                            <div className="mt-2">
                              <p className="text-xs text-gray-500 mb-1">IPFS:</p>
                              {(() => {
                                try {
                                  const ipfsData = JSON.parse(project.approvalDocumentsIPFSHash);
                                  return (
                                    <div className="space-y-1">
                                      <p className="text-xs text-blue-400 font-mono break-all">
                                        {ipfsData.hash}
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
                                  return <p className="text-xs text-blue-400 font-mono break-all">{project.approvalDocumentsIPFSHash}</p>;
                                }
                              })()}
                            </div>
                          )}
                          
                          {/* Verification Result */}
                          {verificationResults[project.id] && (
                            <div className={`mt-2 p-1.5 rounded text-xs flex items-center gap-1 ${
                              verificationResults[project.id].verified
                                ? 'bg-green-900/20 text-green-300'
                                : 'bg-red-900/20 text-red-300'
                            }`}>
                              <ShieldCheckIcon className="w-3 h-3 flex-shrink-0" />
                              {verificationResults[project.id].message}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                    
                    <div className="flex items-center justify-between pt-2">
                      <div className="text-sm">
                        <span className="text-white font-semibold">
                          {project._count?.lands || 0}
                        </span>
                        <span className="text-gray-400"> Properties</span>
                      </div>
                      
                      {project.totalUnits && (
                        <div className="text-sm">
                          <span className="text-white font-semibold">
                            {project.soldUnits || 0}/{project.totalUnits}
                          </span>
                          <span className="text-gray-400"> Sold</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="card-actions justify-end mt-4">
                    <Link
                      to={`/dashboard/builder/projects/${project.id}`}
                      className="btn btn-primary btn-sm"
                    >
                      View Details
                    </Link>
                  </div>

                  <div className="text-xs text-gray-500 mt-2">
                    Created {new Date(project.createdAt).toLocaleDateString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
