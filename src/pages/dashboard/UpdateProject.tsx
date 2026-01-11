import { useState, useEffect, type FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import DashboardLayout from '../../components/layouts/DashboardLayout';
import {
  HomeIcon,
  FolderIcon,
  ArrowLeftIcon,
  DocumentIcon,
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
    locationDetails: '',
    description: '',
    totalUnits: '',
  });
  const [approvalDocs, setApprovalDocs] = useState<FileList | null>(null);
  const [existingDocs, setExistingDocs] = useState<any[]>([]);
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
        locationDetails: project.locationDetails || '',
        description: project.description || '',
        totalUnits: project.totalUnits ? String(project.totalUnits) : '',
      });
      
      // Store existing approval documents
      if (project.approvalDocuments && project.approvalDocuments.length > 0) {
        setExistingDocs(project.approvalDocuments);
      }
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
      
      if (formData.locationDetails.trim()) {
        data.append('locationDetails', formData.locationDetails.trim());
      }
      
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
