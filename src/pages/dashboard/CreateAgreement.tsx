import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import DashboardLayout from '../../components/layouts/DashboardLayout';
import {
  HomeIcon,
  FolderIcon,
  DocumentTextIcon,
  ArrowLeftIcon,
} from '@heroicons/react/24/outline';
import { agreementAPI, landAPI, propertyRequestAPI } from '../../services/api';
import type { Land, PropertyRequest } from '../../types';

const navItems = [
  { name: 'Dashboard', path: '/dashboard/builder', icon: HomeIcon },
  { name: 'Projects', path: '/dashboard/builder/projects', icon: FolderIcon },
  { name: 'Agreements', path: '/dashboard/builder/agreements', icon: DocumentTextIcon },
];

export default function CreateAgreement() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const requestId = searchParams.get('requestId');
  const propertyId = searchParams.get('propertyId');

  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [property, setProperty] = useState<Land | null>(null);
  const [request, setRequest] = useState<PropertyRequest | null>(null);

  const [formData, setFormData] = useState({
    propertyId: propertyId || '',
    buyerId: '',
    agreementType: 'initial' as 'initial' | 'final',
    price: '',
    totalAmount: '',
    installmentPlanYears: '3',
    paymentTerms: 'Payable in installments over the agreed period',
  });

  useEffect(() => {
    if (propertyId) {
      loadProperty(propertyId);
    }
    if (requestId) {
      loadRequest(requestId);
    } else {
      setLoadingData(false);
    }
  }, [propertyId, requestId]);

  const loadProperty = async (id: string) => {
    try {
      const data = await landAPI.getById(id);
      setProperty(data);
      setFormData((prev) => ({
        ...prev,
        price: data.price?.toString() || '',
        totalAmount: data.price?.toString() || '',
      }));
    } catch (error: any) {
      console.error('Failed to load property:', error);
    }
  };

  const loadRequest = async (id: string) => {
    try {
      const data = await propertyRequestAPI.getById(id);
      setRequest(data);
      setFormData((prev) => ({
        ...prev,
        propertyId: data.propertyId,
        buyerId: data.requesterId,
        price: data.offerPrice?.toString() || data.property?.price?.toString() || '',
        totalAmount: data.offerPrice?.toString() || data.property?.price?.toString() || '',
      }));
      
      if (data.property) {
        setProperty(data.property);
      }
    } catch (error: any) {
      console.error('Failed to load request:', error);
    } finally {
      setLoadingData(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.propertyId || !formData.buyerId) {
      setError('Property and buyer are required');
      return;
    }

    try {
      setLoading(true);
      
      const agreementData = {
        propertyId: formData.propertyId,
        buyerId: formData.buyerId,
        agreementType: formData.agreementType,
        terms: {
          price: parseFloat(formData.price),
          totalAmount: parseFloat(formData.totalAmount),
          installmentPlanYears: parseInt(formData.installmentPlanYears),
          paymentTerms: formData.paymentTerms,
          propertyDetails: property ? {
            title: property.title,
            location: property.location,
            size: property.size,
          } : {},
        },
      };

      const newAgreement = await agreementAPI.create(agreementData);
      navigate(`/dashboard/builder/agreements/${newAgreement.id}`);
    } catch (err: any) {
      console.error('Failed to create agreement:', err);
      setError(err.response?.data?.message || 'Failed to create agreement');
    } finally {
      setLoading(false);
    }
  };

  if (loadingData) {
    return (
      <DashboardLayout navItems={navItems}>
        <div className="flex justify-center items-center h-64">
          <span className="loading loading-spinner loading-lg"></span>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout navItems={navItems}>
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <button
            onClick={() => navigate('/dashboard/builder/agreements')}
            className="btn btn-ghost btn-sm mb-2"
          >
            <ArrowLeftIcon className="w-4 h-4 mr-2" />
            Back to Agreements
          </button>
          <h1 className="text-3xl font-bold text-white">Create Agreement</h1>
          <p className="text-gray-400 mt-1">Create a purchase agreement with a buyer</p>
        </div>

        {error && (
          <div className="alert alert-error">
            <span>{error}</span>
          </div>
        )}

        {/* Property Info */}
        {property && (
          <div className="card bg-base-200 border border-base-300">
            <div className="card-body">
              <h3 className="card-title text-white">Property Details</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-400">Title</p>
                  <p className="text-white font-semibold">{property.title}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Location</p>
                  <p className="text-white">{property.location}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Size</p>
                  <p className="text-white">{property.size} sq ft</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Listed Price</p>
                  <p className="text-white">₹{property.price?.toLocaleString()}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Request Info */}
        {request && (
          <div className="alert alert-info">
            <span>
              Creating agreement from approved request by <strong>{request.requester?.name}</strong>
              {request.offerPrice && ` with offer price ₹${request.offerPrice.toLocaleString()}`}
            </span>
          </div>
        )}

        {/* Agreement Form */}
        <form onSubmit={handleSubmit} className="card bg-base-200 shadow-xl border border-base-300">
          <div className="card-body space-y-4">
            <h2 className="card-title text-white">Agreement Details</h2>

            {/* Property ID */}
            <div className="form-control">
              <label className="label">
                <span className="label-text text-white">Property ID *</span>
              </label>
              <input
                type="text"
                value={formData.propertyId}
                onChange={(e) => setFormData({ ...formData, propertyId: e.target.value })}
                className="input input-bordered"
                placeholder="Enter property ID"
                required
                disabled={!!propertyId}
              />
            </div>

            {/* Buyer ID */}
            <div className="form-control">
              <label className="label">
                <span className="label-text text-white">Buyer ID *</span>
              </label>
              <input
                type="text"
                value={formData.buyerId}
                onChange={(e) => setFormData({ ...formData, buyerId: e.target.value })}
                className="input input-bordered"
                placeholder="Enter buyer ID"
                required
                disabled={!!request?.requesterId}
              />
              {request && (
                <label className="label">
                  <span className="label-text-alt text-info">From request by {request.requester?.name}</span>
                </label>
              )}
            </div>

            {/* Agreement Type */}
            <div className="form-control">
              <label className="label">
                <span className="label-text text-white">Agreement Type *</span>
              </label>
              <select
                value={formData.agreementType}
                onChange={(e) => setFormData({ ...formData, agreementType: e.target.value as 'initial' | 'final' })}
                className="select select-bordered"
                required
              >
                <option value="initial">Initial Agreement</option>
                <option value="final">Final Agreement</option>
              </select>
            </div>

            <div className="divider text-white">Payment Terms</div>

            {/* Price */}
            <div className="form-control">
              <label className="label">
                <span className="label-text text-white">Price (₹) *</span>
              </label>
              <input
                type="number"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                className="input input-bordered"
                placeholder="Enter price"
                min="0"
                step="1000"
                required
              />
            </div>

            {/* Total Amount */}
            <div className="form-control">
              <label className="label">
                <span className="label-text text-white">Total Amount (₹) *</span>
              </label>
              <input
                type="number"
                value={formData.totalAmount}
                onChange={(e) => setFormData({ ...formData, totalAmount: e.target.value })}
                className="input input-bordered"
                placeholder="Enter total amount"
                min="0"
                step="1000"
                required
              />
            </div>

            {/* Installment Plan */}
            <div className="form-control">
              <label className="label">
                <span className="label-text text-white">Installment Plan (Years) *</span>
              </label>
              <input
                type="number"
                value={formData.installmentPlanYears}
                onChange={(e) => setFormData({ ...formData, installmentPlanYears: e.target.value })}
                className="input input-bordered"
                placeholder="Enter years"
                min="1"
                max="10"
                required
              />
            </div>

            {/* Payment Terms */}
            <div className="form-control">
              <label className="label">
                <span className="label-text text-white">Payment Terms</span>
              </label>
              <textarea
                value={formData.paymentTerms}
                onChange={(e) => setFormData({ ...formData, paymentTerms: e.target.value })}
                className="textarea textarea-bordered h-24"
                placeholder="Enter payment terms and conditions..."
              />
            </div>

            {/* Actions */}
            <div className="card-actions justify-end mt-4">
              <button
                type="button"
                onClick={() => navigate('/dashboard/builder/agreements')}
                className="btn btn-ghost"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading}
              >
                {loading ? (
                  <span className="loading loading-spinner loading-sm"></span>
                ) : (
                  'Create Agreement'
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
