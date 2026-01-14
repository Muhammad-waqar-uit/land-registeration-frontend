import { useState, useEffect, type FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import DashboardLayout from '../../components/layouts/DashboardLayout';
import {
  HomeIcon,
  DocumentTextIcon,
} from '@heroicons/react/24/outline';
import { landAPI } from '../../services/api';
import type { Land } from '../../types';

const navItems = [
  { name: 'Dashboard', path: '/dashboard/seller', icon: HomeIcon },
  { name: 'My Lands', path: '/dashboard/seller/lands', icon: DocumentTextIcon },
];

export default function UpdateLand() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [land, setLand] = useState<Land | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    location: '',
    size: '',
    price: '',
    status: 'available' as 'available' | 'locked' | 'sold',
  });
  const [document, setDocument] = useState<File | null>(null);
  const [image, setImage] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingLand, setLoadingLand] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLand = async () => {
      if (!id) {
        navigate('/dashboard/seller');
        return;
      }

      try {
        setLoadingLand(true);
        const landData = await landAPI.getById(id);
        setLand(landData);
        setFormData({
          title: landData.title,
          location: landData.location,
          size: landData.size.toString(),
          price: landData.price.toString(),
          status: landData.status,
        });
      } catch (err: unknown) {
        setError(
          (err && typeof err === 'object' && 'response' in err && err.response && typeof err.response === 'object' && 'data' in err.response && err.response.data && typeof err.response.data === 'object' && 'message' in err.response.data ? String(err.response.data.message) : '') ||
          (err instanceof Error ? err.message : '') ||
          'Failed to load land. Please try again.'
        );
      } finally {
        setLoadingLand(false);
      }
    };

    fetchLand();
  }, [id, navigate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: name === 'size' || name === 'price' ? value : value,
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

    if (!formData.title || !formData.location || !formData.size || !formData.price) {
      setError('Please fill in all required fields');
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
      landFormData.append('status', formData.status);
      
      // Only append files if new ones are selected
      if (document) {
        landFormData.append('document', document);
      }
      if (image) {
        landFormData.append('image', image);
      }

      await landAPI.update(id!, landFormData);

      // Success - redirect to seller dashboard (will refresh automatically)
      navigate('/dashboard/seller', { state: { refresh: true } });
    } catch (err: unknown) {
      const errorMessage: string = (err && typeof err === 'object' && 'response' in err && err.response && typeof err.response === 'object' && 'data' in err.response && err.response.data && typeof err.response.data === 'object' && 'message' in err.response.data ? String(err.response.data.message) : '') || (err instanceof Error ? err.message : '') || 'Failed to update land. Please try again.';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  if (loadingLand) {
    return (
      <DashboardLayout navItems={navItems}>
        <div className="flex justify-center items-center h-64">
          <span className="loading loading-spinner loading-lg"></span>
        </div>
      </DashboardLayout>
    );
  }

  if (!land) {
    return (
      <DashboardLayout navItems={navItems}>
        <div className="alert alert-error">
          <span className="text-black">Land not found</span>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout navItems={navItems}>
      <div className="max-w-4xl mx-auto w-full space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-white">Update Land</h1>
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
                    min="0.01"
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
                    min="0.01"
                    step="0.01"
                    required
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div className="form-control bg-transparent">
                <label className="label">
                  <span className="label-text text-white">Status</span>
                </label>
                <select
                  name="status"
                  className="select select-bordered w-full bg-base-200 text-white border-base-300 focus:bg-base-200 focus:border-primary"
                  value={formData.status}
                  onChange={handleChange}
                  disabled={isLoading}
                >
                  <option value="available">Available</option>
                  <option value="locked">Locked</option>
                  <option value="sold">Sold</option>
                </select>
              </div>

              <div className="form-control bg-transparent">
                <label className="label">
                  <span className="label-text text-white">Document (PDF/Image)</span>
                  <span className="label-text-alt text-white/60">Optional - leave empty to keep current</span>
                </label>
                <input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                  className="file-input file-input-bordered w-full bg-base-200 text-white border-base-300 focus:bg-base-200 focus:border-primary"
                  onChange={handleFileChange}
                  disabled={isLoading}
                />
                <label className="label">
                  <span className="label-text-alt text-white/60">
                    Upload new document to replace current one (optional)
                  </span>
                </label>
                {land.documentUrl && (
                  <div className="mt-2">
                    <span className="badge badge-info text-white">
                      Current: {land.documentCID || 'Document exists'}
                    </span>
                  </div>
                )}
                {document && (
                  <div className="mt-2">
                    <span className="badge badge-success text-white">
                      New: {document.name} ({(document.size / 1024 / 1024).toFixed(2)} MB)
                    </span>
                  </div>
                )}
              </div>

              <div className="form-control bg-transparent">
                <label className="label">
                  <span className="label-text text-white">Land Image (JPG/PNG)</span>
                  <span className="label-text-alt text-white/60">Optional - leave empty to keep current</span>
                </label>
                <input
                  type="file"
                  accept=".jpg,.jpeg,.png"
                  className="file-input file-input-bordered w-full bg-base-200 text-white border-base-300 focus:bg-base-200 focus:border-primary"
                  onChange={handleImageChange}
                  disabled={isLoading}
                />
                <label className="label">
                  <span className="label-text-alt text-white/60">
                    Upload new image to replace current one (optional)
                  </span>
                </label>
                {land.imageUrl && (
                  <div className="mt-2">
                    <span className="badge badge-info text-white">
                      Current: {land.imageCID || 'Image exists'}
                    </span>
                    {land.imageUrl && !image && (
                      <div className="mt-2">
                        <img
                          src={land.imageUrl}
                          alt="Current"
                          className="max-w-xs rounded-lg border border-base-300"
                          style={{ maxHeight: '200px' }}
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                          }}
                        />
                      </div>
                    )}
                  </div>
                )}
                {image && (
                  <div className="mt-2">
                    <span className="badge badge-success text-white">
                      New: {image.name} ({(image.size / 1024 / 1024).toFixed(2)} MB)
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
                        Updating...
                      </>
                    ) : (
                      'Update Land'
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
