import { useState, useEffect, type FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import DashboardLayout from '../../components/layouts/DashboardLayout';
import {
  HomeIcon,
  FolderIcon,
  ArrowLeftIcon,
} from '@heroicons/react/24/outline';
import { projectAPI } from '../../services/api';

const navItems = [
  { name: 'Dashboard', path: '/dashboard/builder', icon: HomeIcon },
  { name: 'Projects', path: '/dashboard/builder/projects', icon: FolderIcon },
];

export default function UpdateProject() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [formData, setFormData] = useState({
    name: '',
    location: '',
    description: '',
    totalUnits: '',
  });
  const [approvalDocs, setApprovalDocs] = useState<FileList | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      loadProject();
    }
  }, [id]);

  const loadProject = async () => {
    try {
      setLoading(true);
      setError(null);
      const project = await projectAPI.getById(id!);
      setFormData({
        name: project.name || '',
        location: project.location || '',
        description: project.description || '',
        totalUnits: project.totalUnits ? String(project.totalUnits) : '',
      });
    } catch (err: any) {
      console.error('Failed to load project:', err);
      setError(err.response?.data?.message || 'Failed to load project');
    } finally {
      setLoading(false);
    }
  };

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

      const data = new FormData();
      data.append('name', formData.name.trim());
      data.append('location', formData.location.trim());
      
      if (formData.description.trim()) {
        data.append('description', formData.description.trim());
      }
      
      if (formData.totalUnits && parseInt(formData.totalUnits) > 0) {
        data.append('totalUnits', formData.totalUnits);
      }

      // Upload new approval documents if provided
      if (approvalDocs && approvalDocs.length > 0) {
        for (let i = 0; i < approvalDocs.length; i++) {
          data.append('approvalDocuments', approvalDocs[i]);
        }
      }

      await projectAPI.update(id!, data);
      
      // Success - navigate to projects list
      navigate('/dashboard/builder/projects');
    } catch (err: any) {
      console.error('Failed to update project:', err);
      setError(err.response?.data?.message || 'Failed to update project. Please try again.');
    } finally {
      setIsLoading(false);
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
            className="btn btn-ghost btn-sm gap-2 mb-4"
          >
            <ArrowLeftIcon className="w-4 h-4" />
            Back to Projects
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

        {/* Form */}
        <div className="card bg-base-200 shadow-xl">
          <div className="card-body">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Project Name */}
              <div className="form-control">
                <label className="label">
                  <span className="label-text text-white">
                    Project Name <span className="text-error">*</span>
                  </span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="e.g., Green Valley Housing, Downtown Plaza"
                  className="input input-bordered w-full"
                  required
                />
              </div>

              {/* Location */}
              <div className="form-control">
                <label className="label">
                  <span className="label-text text-white">
                    Location <span className="text-error">*</span>
                  </span>
                </label>
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  placeholder="e.g., Phase 6, DHA Lahore"
                  className="input input-bordered w-full"
                  required
                />
              </div>

              {/* Description */}
              <div className="form-control">
                <label className="label">
                  <span className="label-text text-white">Description</span>
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Describe your project, its features, amenities, etc."
                  className="textarea textarea-bordered h-32"
                  rows={4}
                />
                <label className="label">
                  <span className="label-text-alt text-gray-400">Optional</span>
                </label>
              </div>

              {/* Total Units */}
              <div className="form-control">
                <label className="label">
                  <span className="label-text text-white">Total Units</span>
                </label>
                <input
                  type="number"
                  name="totalUnits"
                  value={formData.totalUnits}
                  onChange={handleChange}
                  placeholder="e.g., 50"
                  min="1"
                  className="input input-bordered w-full"
                />
                <label className="label">
                  <span className="label-text-alt text-gray-400">
                    Optional - How many properties/units in this project
                  </span>
                </label>
              </div>

              {/* Approval Documents */}
              <div className="form-control">
                <label className="label">
                  <span className="label-text text-white">Add More Approval Documents</span>
                </label>
                <input
                  type="file"
                  onChange={handleFileChange}
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                  multiple
                  className="file-input file-input-bordered w-full"
                />
                <label className="label">
                  <span className="label-text-alt text-gray-400">
                    Optional - Upload additional NOC, approval letters, plans, etc.
                  </span>
                </label>
              </div>

              {/* Submit Button */}
              <div className="card-actions justify-end pt-4">
                <button
                  type="button"
                  onClick={() => navigate('/dashboard/builder/projects')}
                  className="btn btn-ghost"
                  disabled={isLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="btn btn-primary"
                >
                  {isLoading ? (
                    <>
                      <span className="loading loading-spinner"></span>
                      Updating...
                    </>
                  ) : (
                    <>
                      <FolderIcon className="w-5 h-5" />
                      Update Project
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
