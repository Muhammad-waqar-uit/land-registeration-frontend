import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/layouts/DashboardLayout';
import {
  HomeIcon,
  FolderIcon,
  ArrowLeftIcon,
  DocumentTextIcon,
  UserGroupIcon,
  CreditCardIcon,
  ArrowPathIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';
import { projectAPI } from '../../services/api';

const navItems = [
  { name: 'Overview', path: '/dashboard/builder', icon: HomeIcon },
  { name: 'Projects', path: '/dashboard/builder/projects', icon: FolderIcon },
  { name: 'Buyer Progress', path: '/dashboard/builder/buyers', icon: UserGroupIcon },
  { name: 'Payments', path: '/dashboard/builder/payments', icon: CreditCardIcon },
  { name: 'Property Requests', path: '/dashboard/builder/property-requests', icon: DocumentTextIcon },
  { name: 'Agreements', path: '/dashboard/builder/agreements', icon: DocumentTextIcon },
  { name: 'Resale Requests', path: '/dashboard/builder/resale-requests', icon: ArrowPathIcon },
  { name: 'Pending Verifications', path: '/dashboard/builder/pending', icon: ClockIcon },
];

export default function CreateProject() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    location: '',
    locationDetails: '',
    description: '',
    totalUnits: '',
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

    if (!formData.locationDetails.trim()) {
      setError('Location details are required');
      return;
    }

    if (!formData.description.trim()) {
      setError('Description is required');
      return;
    }

    const totalUnitsValue = parseInt(formData.totalUnits, 10);
    if (!formData.totalUnits || Number.isNaN(totalUnitsValue) || totalUnitsValue < 1) {
      setError('Total units is required and must be at least 1');
      return;
    }

    if (!approvalDocs || approvalDocs.length === 0) {
      setError('Approval documents are required');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // Prepare JSON data
      const projectData: Record<string, string | number> = {
        name: formData.name.trim(),
        location: formData.location.trim(),
        locationDetails: formData.locationDetails.trim(),
        description: formData.description.trim(),
        totalUnits: totalUnitsValue,
      };

      // Debug: Log what we're sending
      console.log('=== CREATE PROJECT REQUEST ===');
      console.log('JSON payload:', projectData);
      console.log('- Files to upload:', approvalDocs ? approvalDocs.length : 0);
      console.log('==============================');

      // Create project with JSON
      const createdProject = await projectAPI.create(projectData);
      console.log('✅ Project created:', createdProject.id);

      // Upload approval documents if provided (backend accepts single file only)
      if (approvalDocs && approvalDocs.length > 0 && createdProject.id) {
        console.log('📤 Uploading approval document (single file only)...');
        const docsFormData = new FormData();
        // Backend accepts single file with field name 'approvalDocuments'
        docsFormData.append('approvalDocuments', approvalDocs[0]);
        await projectAPI.uploadDocs(createdProject.id, docsFormData);
        console.log('✅ Document uploaded successfully');
      }
      
      // Success - navigate to projects list
      navigate('/dashboard/builder/projects');
    } catch (err: unknown) {
      console.error('Failed to create project:', err);
      setError((err as { response?: { data?: { message?: string } } }).response?.data?.message || 'Failed to create project. Please try again.');
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
            <div className="alert alert-info mb-6">
              <span className="text-black">
                New projects are created as <strong>pending approval</strong>. An admin must approve the project before you can create lands/properties under it.
              </span>
            </div>
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
                  <span className="label-text text-blue-100 font-medium">Location Details <span className="text-red-400">*</span></span>
                </label>
                <input
                  type="text"
                  name="locationDetails"
                  value={formData.locationDetails}
                  onChange={handleChange}
                  placeholder="e.g., Near Central Park, next to shopping mall, 5 minutes from airport"
                  className="input w-full p-2 bg-blue-900/60 text-blue-50 border border-blue-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-400/30 focus:outline-none placeholder:text-white"
                  required
                />
                <label className="label">
                  <span className="label-text-alt text-blue-300">Required</span>
                </label>
              </div>

              {/* Description */}
              <div className="form-control bg-blue-900/60">
                <label className="label">
                  <span className="label-text text-blue-100 font-medium">Description <span className="text-red-400">*</span></span>
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Describe your project, its features, amenities, etc."
                  className="textarea h-32 p-2 w-full bg-blue-900/60 text-blue-50 border border-blue-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-400/30 focus:outline-none placeholder:text-white"
                  rows={4}
                  required
                />
                <label className="label">
                  <span className="label-text-alt text-blue-300">Required</span>
                </label>
              </div>

              {/* Total Units */}
              <div className="form-control bg-blue-900/60">
                <label className="label">
                  <span className="label-text text-blue-100 font-medium">Total Units <span className="text-red-400">*</span></span>
                </label>
                <input
                  type="number"
                  name="totalUnits"
                  value={formData.totalUnits}
                  onChange={handleChange}
                  placeholder="e.g., 50"
                  min="1"
                  className="input w-full p-2 bg-blue-900/60 text-blue-50 border border-blue-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-400/30 focus:outline-none placeholder:text-white"
                  required
                />
                <label className="label">
                  <span className="label-text-alt text-blue-300">
                    Required - How many properties/units in this project
                  </span>
                </label>
              </div>

              {/* Approval Documents */}
              <div className="form-control bg-blue-900/60">
                <label className="label">
                  <span className="label-text text-blue-100 font-medium">Approval Documents<span className="text-red-400">*</span></span>
                </label>
                <input
                  type="file"
                  onChange={handleFileChange}
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                  multiple
                  className="file-input w-full bg-blue-900/60 text-blue-50 border border-blue-700 focus:border-blue-500 file:bg-blue-600 file:text-white file:font-medium file:mr-4 file:py-2 file:px-4 hover:file:bg-blue-500"
                  required
                />
                <label className="label">
                  <span className="label-text-alt text-blue-300">
                    Required - Upload NOC, approval letters, plans, etc. (PDF, Images)
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
