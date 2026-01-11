import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import DashboardLayout from '../../components/layouts/DashboardLayout';
import {
  HomeIcon,
  FolderIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';
import { projectAPI } from '../../services/api';

const navItems = [
  { name: 'Dashboard', path: '/dashboard/builder', icon: HomeIcon },
  { name: 'Projects', path: '/dashboard/builder/projects', icon: FolderIcon },
];

interface Project {
  id: string;
  name: string;
  location: string;
  description?: string;
  totalUnits?: number;
  builderId: string;
  createdAt: string;
  _count?: {
    properties: number;
  };
}

export default function Projects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await projectAPI.getAll();
      setProjects(data);
    } catch (err: any) {
      console.error('Failed to load projects:', err);
      setError(err.response?.data?.message || 'Failed to load projects');
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
    } catch (err: any) {
      console.error('Failed to delete project:', err);
      alert(err.response?.data?.message || 'Failed to delete project');
    } finally {
      setDeleting(null);
    }
  };

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
            className="btn btn-primary gap-2"
          >
            <PlusIcon className="w-5 h-5" />
            New Project
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
              {projects.reduce((sum, p) => sum + (p._count?.properties || 0), 0)}
            </div>
            <div className="stat-desc text-gray-400">Listed properties</div>
          </div>
          <div className="stat bg-base-200 rounded-lg">
            <div className="stat-title text-white">Avg Units/Project</div>
            <div className="stat-value text-accent">
              {projects.length > 0
                ? Math.round(
                    projects.reduce((sum, p) => sum + (p._count?.properties || 0), 0) /
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
            <Link to="/dashboard/builder/projects/create" className="btn btn-primary">
              <PlusIcon className="w-5 h-5" />
              Create Project
            </Link>
          </div>
        ) : (
          /* Projects Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <div key={project.id} className="card bg-base-200 shadow-xl">
                <div className="card-body">
                  <div className="flex items-start justify-between">
                    <FolderIcon className="w-8 h-8 text-primary" />
                    <div className="flex gap-2">
                      <Link
                        to={`/dashboard/builder/projects/${project.id}/edit`}
                        className="btn btn-ghost btn-sm btn-square"
                        title="Edit"
                      >
                        <PencilIcon className="w-4 h-4" />
                      </Link>
                      <button
                        onClick={() => handleDelete(project.id)}
                        disabled={deleting === project.id}
                        className="btn btn-ghost btn-sm btn-square text-error"
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
                    
                    {project.description && (
                      <p className="text-sm text-gray-400 line-clamp-2">
                        {project.description}
                      </p>
                    )}
                    
                    <div className="flex items-center justify-between pt-2">
                      <div className="text-sm">
                        <span className="text-white font-semibold">
                          {project._count?.properties || 0}
                        </span>
                        <span className="text-gray-400"> Properties</span>
                      </div>
                      
                      {project.totalUnits && (
                        <div className="text-sm">
                          <span className="text-white font-semibold">
                            {project.totalUnits}
                          </span>
                          <span className="text-gray-400"> Total Units</span>
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
