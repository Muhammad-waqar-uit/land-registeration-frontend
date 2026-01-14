import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { resaleRequestAPI, landAPI } from '../../services/api';
import type { Land } from '../../types';
import { 
  CurrencyDollarIcon, 
  BuildingOfficeIcon, 
  ExclamationCircleIcon,
  CheckCircleIcon 
} from '@heroicons/react/24/outline';

const CreateResaleRequest: React.FC = () => {
  const [searchParams] = useSearchParams();
  const propertyIdParam = searchParams.get('propertyId');
  
  const [propertyId, setPropertyId] = useState(propertyIdParam || '');
  const [requestedPrice, setRequestedPrice] = useState('');
  const [property, setProperty] = useState<Land | null>(null);
  const [ownedProperties, setOwnedProperties] = useState<Land[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingProperty, setLoadingProperty] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchOwnedProperties();
  }, []);

  useEffect(() => {
    if (propertyIdParam) {
      setPropertyId(propertyIdParam);
      loadProperty(propertyIdParam);
    }
  }, [propertyIdParam]);

  const fetchOwnedProperties = async () => {
    try {
      // Fetch properties owned by the user (status = 'owned')
      const data = await landAPI.getAll();
      const properties = Array.isArray(data) ? data : [];
      // Filter for owned properties only
      const owned = properties.filter((p) => p.status === 'sold');
      setOwnedProperties(owned);
    } catch (err: unknown) {
      console.error('Error fetching owned properties:', err);
    }
  };

  const loadProperty = async (id: string) => {
    if (!id) return;
    
    try {
      setLoadingProperty(true);
      setError('');
      const data = await landAPI.getById(id);
      setProperty(data);
      
      // Pre-fill requested price with current property price
      if (data.price) {
        setRequestedPrice(data.price.toString());
      }
    } catch (err: unknown) {
      console.error('Error loading property:', err);
      setError((err as { response?: { data?: { message?: string } } }).response?.data?.message || 'Failed to load property');
      setProperty(null);
    } finally {
      setLoadingProperty(false);
    }
  };

  const handlePropertyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedId = e.target.value;
    setPropertyId(selectedId);
    if (selectedId) {
      loadProperty(selectedId);
    } else {
      setProperty(null);
      setRequestedPrice('');
      setError('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!propertyId) {
      setError('Please select a property');
      return;
    }

    if (!requestedPrice || parseFloat(requestedPrice) <= 0) {
      setError('Please enter a valid price');
      return;
    }

    try {
      setLoading(true);
      setError('');
      setSuccess('');
      
      await resaleRequestAPI.create({
        propertyId,
        requestedPrice: parseFloat(requestedPrice),
      });
      
      setSuccess('Resale request submitted successfully! Waiting for builder approval.');
      
      // Redirect to dashboard after 2 seconds
      setTimeout(() => {
        navigate('/dashboard/buyer');
      }, 2000);
    } catch (err: unknown) {
      console.error('Error creating resale request:', err);
      setError((err as { response?: { data?: { message?: string } } }).response?.data?.message || 'Failed to create resale request');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-3xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Request Property Resale</h1>
          <p className="text-gray-600 mt-1">Submit a request to resell your owned property</p>
        </div>

        {error && (
          <div className="alert alert-error mb-6">
            <ExclamationCircleIcon className="h-6 w-6" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="alert alert-success mb-6">
            <CheckCircleIcon className="h-6 w-6" />
            <span>{success}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="card bg-base-100 shadow-xl">
          <div className="card-body">
            {/* Property Selection */}
            <div className="form-control">
              <label className="label">
                <span className="label-text font-semibold">Select Property *</span>
              </label>
              <select
                className="select select-bordered w-full"
                value={propertyId}
                onChange={handlePropertyChange}
                required
                disabled={!!propertyIdParam || ownedProperties.length === 0}
              >
                <option value="">
                  {ownedProperties.length === 0 
                    ? 'No owned properties available' 
                    : 'Choose a property to resell...'}
                </option>
                {ownedProperties.map((prop) => (
                  <option key={prop.id} value={prop.id}>
                    {prop.title} - {prop.location} ({formatCurrency(prop.price)})
                  </option>
                ))}
              </select>
              <label className="label">
                <span className="label-text-alt text-gray-500">
                  Only properties you own are available for resale
                </span>
              </label>
            </div>

            {/* Property Details */}
            {loadingProperty && (
              <div className="flex justify-center py-8">
                <span className="loading loading-spinner loading-lg"></span>
              </div>
            )}

            {property && !loadingProperty && (
              <div className="mt-6 space-y-4">
                <div className="divider">Property Details</div>

                {/* Property Information */}
                <div className="bg-base-200 rounded-lg p-4">
                  <h3 className="font-semibold text-lg mb-3 flex items-center">
                    <BuildingOfficeIcon className="h-5 w-5 mr-2" />
                    Property Information
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Title</p>
                      <p className="font-medium">{property.title}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Location</p>
                      <p className="font-medium">{property.location}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Size</p>
                      <p className="font-medium">{property.size} sq ft</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Original Price</p>
                      <p className="font-medium text-primary">
                        {formatCurrency(property.price)}
                      </p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-sm text-gray-500">Status</p>
                      <p className="font-medium capitalize">{property.status}</p>
                    </div>
                  </div>
                </div>

                {/* Requested Price */}
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-semibold">Requested Resale Price *</span>
                  </label>
                  <label className="input-group">
                    <span>$</span>
                    <input
                      type="number"
                      placeholder="Enter your desired price"
                      className="input input-bordered w-full"
                      value={requestedPrice}
                      onChange={(e) => setRequestedPrice(e.target.value)}
                      required
                      min="0"
                      step="0.01"
                    />
                  </label>
                  <label className="label">
                    <span className="label-text-alt text-gray-500">
                      Original price: {formatCurrency(property.price)}
                    </span>
                    {requestedPrice && parseFloat(requestedPrice) > 0 && (
                      <span className={`label-text-alt font-semibold ${
                        parseFloat(requestedPrice) > property.price ? 'text-success' : 'text-warning'
                      }`}>
                        {parseFloat(requestedPrice) > property.price ? '+' : ''}
                        {formatCurrency(parseFloat(requestedPrice) - property.price)}
                      </span>
                    )}
                  </label>
                </div>

                {/* Price Comparison */}
                {requestedPrice && parseFloat(requestedPrice) > 0 && (
                  <div className="bg-base-200 rounded-lg p-4">
                    <h3 className="font-semibold text-lg mb-3 flex items-center">
                      <CurrencyDollarIcon className="h-5 w-5 mr-2" />
                      Price Comparison
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-500">Original Purchase Price</p>
                        <p className="font-medium text-xl">
                          {formatCurrency(property.price)}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Requested Resale Price</p>
                        <p className="font-medium text-xl text-primary">
                          {formatCurrency(parseFloat(requestedPrice))}
                        </p>
                      </div>
                      <div className="col-span-2">
                        <p className="text-sm text-gray-500">Difference</p>
                        <p className={`font-medium text-xl ${
                          parseFloat(requestedPrice) > property.price ? 'text-success' : 'text-error'
                        }`}>
                          {parseFloat(requestedPrice) > property.price ? '+' : ''}
                          {formatCurrency(parseFloat(requestedPrice) - property.price)}
                          {' '}
                          ({((parseFloat(requestedPrice) / property.price - 1) * 100).toFixed(1)}%)
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* No Owned Properties Warning */}
            {ownedProperties.length === 0 && !loadingProperty && (
              <div className="alert alert-warning mt-6">
                <ExclamationCircleIcon className="h-6 w-6" />
                <div>
                  <h3 className="font-bold">No Properties Available</h3>
                  <p className="text-sm">You don't own any properties that can be resold. Properties must be fully paid and ownership transferred before resale.</p>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <div className="card-actions justify-end mt-6">
              <button
                type="button"
                onClick={() => navigate('/dashboard/buyer')}
                className="btn btn-ghost"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading || !property || ownedProperties.length === 0}
              >
                {loading ? (
                  <>
                    <span className="loading loading-spinner loading-sm"></span>
                    Submitting...
                  </>
                ) : (
                  <>
                    <CurrencyDollarIcon className="h-5 w-5 mr-2" />
                    Submit Resale Request
                  </>
                )}
              </button>
            </div>
          </div>
        </form>

        {/* Info Box */}
        <div className="alert alert-info mt-6">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="stroke-current shrink-0 w-6 h-6">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
          <div>
            <h3 className="font-bold">How it works</h3>
            <div className="text-sm">
              <p>• Submit a resale request with your desired price</p>
              <p>• Builder will review and approve/reject your request</p>
              <p>• Once approved, builder will list your property for resale</p>
              <p>• New buyers can then purchase your property</p>
              <p>• You'll be notified of status updates</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateResaleRequest;
