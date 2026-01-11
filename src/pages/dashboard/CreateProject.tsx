import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
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

export default function CreateProject() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    location: '',
    locationDetails: '',
    description: '',
    totalUnits: '',
    status: 'draft',
  });
  const [approvalDocs, setApprovalDocs] = useState<FileList | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      const projectData: any = {
        name: formData.name.trim(),
        location: formData.location.trim(),
        status: 'draft',
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
      console.log('=== CREATE PROJECT REQUEST ===');
      console.log('JSON payload:', projectData);
      console.log('- Files to upload:', approvalDocs ? approvalDocs.length : 0);
      console.log('==============================');

      // Create project with JSON
      const createdProject = await projectAPI.create(projectData);
      console.log('✅ Project created:', createdProject.id);

      // Upload approval documents if provided
      if (approvalDocs && approvalDocs.length > 0 && createdProject.id) {
        console.log('📤 Uploading', approvalDocs.length, 'approval documents...');
        const docsFormData = new FormData();
        for (let i = 0; i < approvalDocs.length; i++) {
          docsFormData.append('approvalDocuments', approvalDocs[i]);
        }
        await projectAPI.uploadDocs(createdProject.id, docsFormData);
        console.log('✅ Documents uploaded successfully');
      }
      
      // Success - navigate to projects list
      navigate('/dashboard/builder/projects');
    } catch (err: any) {
      console.error('Failed to create project:', err);
      setError(err.response?.data?.message || 'Failed to create project. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

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
          <h1 className="text-3xl font-bold text-white">Create New Project</h1>
          <p className="text-gray-400 mt-1">Start a new property development project</p>
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
                <input
                  type="file"
                  onChange={handleFileChange}
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                  multiple
                  className="file-input w-full bg-blue-900/60 text-blue-50 border border-blue-700 focus:border-blue-500 file:bg-blue-600 file:text-white file:font-medium file:mr-4 file:py-2 file:px-4 hover:file:bg-blue-500"
                />
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
                      <span>Creating...</span>
                    </>
                  ) : (
                    <>
                      <FolderIcon className="w-5 h-5 flex-shrink-0" />
                      <span>Create Project</span>
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
