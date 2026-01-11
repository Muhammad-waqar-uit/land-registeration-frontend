import { useState, type FormEvent, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/layouts/DashboardLayout';
import {
  HomeIcon,
  DocumentTextIcon,
  FolderIcon,
} from '@heroicons/react/24/outline';
import { landAPI, projectAPI } from '../../services/api';

const navItems = [
  { name: 'Dashboard', path: '/dashboard/seller', icon: HomeIcon },
  { name: 'My Lands', path: '/dashboard/seller/lands', icon: DocumentTextIcon },
  { name: 'Projects', path: '/dashboard/builder/projects', icon: FolderIcon },
];

export default function RegisterLand() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: '',
    location: '',
    size: '',
    price: '',
    projectId: '',
  });
  const [document, setDocument] = useState<File | null>(null);
  const [image, setImage] = useState<File | null>(null);
  const [projects, setProjects] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      const data = await projectAPI.getAll();
      setProjects(data);
    } catch (err: any) {
      console.error('Failed to load projects:', err);
      // Non-critical error - user can still create property without project
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    if (error) setError(null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setDocument(e.target.files[0]);
      if (error) setError(null);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setImage(e.target.files[0]);
      if (error) setError(null);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!document) {
      setError('Please upload a document');
      return;
    }

    if (!image) {
      setError('Please upload an image');
      return;
    }

    if (!formData.title || !formData.location || !formData.size || !formData.price) {
      setError('Please fill in all fields');
      return;
    }

    const sizeNum = parseFloat(formData.size);
    const priceNum = parseFloat(formData.price);

    if (isNaN(sizeNum) || sizeNum <= 0) {
      setError('Size must be a positive number');
      return;
    }

    if (isNaN(priceNum) || priceNum <= 0) {
      setError('Price must be a positive number');
      return;
    }

    setIsLoading(true);

    try {
      // Create FormData for multipart/form-data
      const landFormData = new FormData();
      landFormData.append('title', formData.title);
      landFormData.append('location', formData.location);
      landFormData.append('size', formData.size);
      landFormData.append('price', formData.price);
      landFormData.append('document', document);
      landFormData.append('image', image);
      
      // Add projectId if selected
      if (formData.projectId) {
        landFormData.append('projectId', formData.projectId);
      }

      await landAPI.create(landFormData);

      // Success - redirect to seller dashboard (will refresh automatically)
      navigate('/dashboard/seller', { state: { refresh: true } });
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
        err.message ||
        'Failed to register land. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <DashboardLayout navItems={navItems}>
      <div className="max-w-4xl mx-auto w-full space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-white">Register New Land</h1>
          <button
            onClick={() => navigate('/dashboard/seller')}
            className="btn btn-primary btn-sm text-white"
          >
            ← Back to Dashboard
          </button>
        </div>

        <div className="card bg-base-100 shadow-xl border border-base-300">
          <div className="card-body">
            <h2 className="card-title text-white mb-4">Land Information</h2>

            {error && (
              <div className="alert alert-error">
                <span className="text-black">{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Project Selection */}
              <div className="form-control bg-transparent">
                <label className="label">
                  <span className="label-text text-white">Project (Optional)</span>
                </label>
                <select
                  name="projectId"
                  value={formData.projectId}
                  onChange={handleChange}
                  className="select select-bordered w-full bg-base-200 text-white border-base-300 focus:bg-base-200 focus:border-primary"
                  disabled={isLoading}
                >
                  <option value="">No Project (Standalone Property)</option>
                  {projects.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.name} - {project.location}
                    </option>
                  ))}
                </select>
                <label className="label">
                  <span className="label-text-alt text-white/60">
                    Select a project to organize this property
                  </span>
                  <button
                    type="button"
                    onClick={() => navigate('/dashboard/builder/projects/create')}
                    className="label-text-alt text-primary hover:underline"
                  >
                    + Create Project
                  </button>
                </label>
              </div>

              <div className="form-control bg-transparent">
                <label className="label">
                  <span className="label-text text-white">Title</span>
                  <span className="label-text-alt text-error">*</span>
                </label>
                <input
                  type="text"
                  name="title"
                  placeholder="e.g., Beautiful Plot in Downtown"
                  className="input input-bordered w-full bg-base-200 text-white border-base-300 focus:bg-base-200 focus:border-primary placeholder:text-white/50"
                  value={formData.title}
                  onChange={handleChange}
                  required
                  disabled={isLoading}
                />
              </div>

              <div className="form-control bg-transparent">
                <label className="label">
                  <span className="label-text text-white">Location</span>
                  <span className="label-text-alt text-error">*</span>
                </label>
                <input
                  type="text"
                  name="location"
                  placeholder="e.g., 123 Main St, City, State"
                  className="input input-bordered w-full bg-base-200 text-white border-base-300 focus:bg-base-200 focus:border-primary placeholder:text-white/50"
                  value={formData.location}
                  onChange={handleChange}
                  required
                  disabled={isLoading}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="form-control bg-transparent">
                  <label className="label">
                    <span className="label-text text-white">Size (sq. ft)</span>
                    <span className="label-text-alt text-error">*</span>
                  </label>
                  <input
                    type="number"
                    name="size"
                    placeholder="e.g., 5000"
                    className="input input-bordered w-full bg-base-200 text-white border-base-300 focus:bg-base-200 focus:border-primary placeholder:text-white/50"
                    value={formData.size}
                    onChange={handleChange}
                    min="1"
                    step="0.01"
                    required
                    disabled={isLoading}
                  />
                </div>

                <div className="form-control bg-transparent">
                  <label className="label">
                    <span className="label-text text-white">Price (₹)</span>
                    <span className="label-text-alt text-error">*</span>
                  </label>
                  <input
                    type="number"
                    name="price"
                    placeholder="e.g., 5000000"
                    className="input input-bordered w-full bg-base-200 text-white border-base-300 focus:bg-base-200 focus:border-primary placeholder:text-white/50"
                    value={formData.price}
                    onChange={handleChange}
                    min="1"
                    step="0.01"
                    required
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div className="form-control bg-transparent">
                <label className="label">
                  <span className="label-text text-white">Document (PDF/Image)</span>
                  <span className="label-text-alt text-error">*</span>
                </label>
                <input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                  className="file-input file-input-bordered w-full bg-base-200 text-white border-base-300 focus:bg-base-200 focus:border-primary"
                  onChange={handleFileChange}
                  required
                  disabled={isLoading}
                />
                <label className="label">
                  <span className="label-text-alt text-white/60">
                    Upload land document (deed, certificate, etc.)
                  </span>
                </label>
                {document && (
                  <div className="mt-2">
                    <span className="badge badge-info text-white">
                      Selected: {document.name} ({(document.size / 1024 / 1024).toFixed(2)} MB)
                    </span>
                  </div>
                )}
              </div>

              <div className="form-control bg-transparent">
                <label className="label">
                  <span className="label-text text-white">Land Image (JPG/PNG)</span>
                  <span className="label-text-alt text-error">*</span>
                </label>
                <input
                  type="file"
                  accept=".jpg,.jpeg,.png"
                  className="file-input file-input-bordered w-full bg-base-200 text-white border-base-300 focus:bg-base-200 focus:border-primary"
                  onChange={handleImageChange}
                  required
                  disabled={isLoading}
                />
                <label className="label">
                  <span className="label-text-alt text-white/60">
                    Upload land image (photo of the property)
                  </span>
                </label>
                {image && (
                  <div className="mt-2">
                    <span className="badge badge-info text-white">
                      Selected: {image.name} ({(image.size / 1024 / 1024).toFixed(2)} MB)
                    </span>
                    {image.type.startsWith('image/') && (
                      <div className="mt-2">
                        <img
                          src={URL.createObjectURL(image)}
                          alt="Preview"
                          className="max-w-xs rounded-lg border border-base-300"
                          style={{ maxHeight: '200px' }}
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="form-control mt-6 bg-transparent">
                <div className="flex gap-2 justify-end">
                  <button
                    type="button"
                    onClick={() => navigate('/dashboard/seller')}
                    className="btn btn-primary text-white"
                    disabled={isLoading}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary text-white"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <span className="loading loading-spinner loading-sm"></span>
                        Registering...
                      </>
                    ) : (
                      'Register Land'
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
