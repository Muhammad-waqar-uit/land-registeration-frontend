import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import DashboardLayout from '../../components/layouts/DashboardLayout';
import {
  HomeIcon,
  FolderIcon,
  DocumentTextIcon,
  ArrowLeftIcon,
  UserGroupIcon,
  CreditCardIcon,
  CurrencyDollarIcon,
  ArrowPathIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';
import { agreementAPI, landAPI, propertyRequestAPI } from '../../services/api';
import type { Land, PropertyRequest } from '../../types';

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
  const [signedDocument, setSignedDocument] = useState<File | null>(null);

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
    } catch (error: unknown) {
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
        buyerId: data.buyerId || data.requester?.id || '',
        price: data.requestedPrice?.toString() || data.property?.price?.toString() || '',
        totalAmount: data.requestedPrice?.toString() || data.property?.price?.toString() || '',
      }));
      
      if (data.property) {
        setProperty(data.property);
      }
    } catch (error: unknown) {
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
      
      // Upload signed document if provided
      if (signedDocument) {
        try {
          await agreementAPI.uploadSigned(newAgreement.id, signedDocument);
        } catch (uploadErr) {
          console.error('Failed to upload document:', uploadErr);
          // Continue anyway, agreement is created
        }
      }
      
      navigate(`/dashboard/builder/agreements/${newAgreement.id}`);
    } catch (err: unknown) {
      console.error('Failed to create agreement:', err);
      const errorMessage = err && typeof err === 'object' && 'response' in err
        ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
        : undefined;
      setError(errorMessage || 'Failed to create agreement');
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
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate('/dashboard/builder/agreements')}
            className="btn btn-outline btn-primary btn-sm gap-2 mb-4 inline-flex items-center justify-center"
          >
            <ArrowLeftIcon className="w-4 h-4 flex-shrink-0" />
            <span>Back to Agreements</span>
          </button>
          <h1 className="text-3xl font-bold text-white">Create Agreement</h1>
          <p className="text-gray-400 mt-1">Create a purchase agreement with a buyer</p>
        </div>

        {error && (
          <div className="alert alert-error mb-6">
            <span className="text-black">{error}</span>
          </div>
        )}

        {/* Property Info */}
        {property && (
          <div className="card bg-blue-950 shadow-2xl border border-blue-800 mb-6">
            <div className="card-body">
              <h3 className="card-title text-blue-100 font-medium">Property Details</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-blue-300">Title</p>
                  <p className="text-white font-semibold">{property.title}</p>
                </div>
                <div>
                  <p className="text-sm text-blue-300">Location</p>
                  <p className="text-white">{property.location}</p>
                </div>
                <div>
                  <p className="text-sm text-blue-300">Size</p>
                  <p className="text-white">{property.size} sq ft</p>
                </div>
                <div>
                  <p className="text-sm text-blue-300">Listed Price</p>
                  <p className="text-white">PKR {property.price?.toLocaleString()}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Request Info */}
        {request && (
          <div className="alert alert-info mb-6">
            <span className="text-black">
              Creating agreement from approved request by <strong>{request.buyer?.name || request.requester?.name || 'Unknown'}</strong>
              {request.requestedPrice && ` with offer price PKR ${request.requestedPrice.toLocaleString()}`}
            </span>
          </div>
        )}

        {/* Agreement Form */}
        <div className="card bg-blue-950 shadow-2xl border border-blue-800">
          <div className="card-body">
            <form onSubmit={handleSubmit} className="space-y-6">
              <h2 className="text-xl font-bold text-blue-100">Agreement Details</h2>

            {/* Property ID */}
            <div className="form-control bg-blue-900/60">
              <label className="label">
                <span className="label-text text-blue-100 font-medium">
                  Property ID <span className="text-red-400">*</span>
                </span>
              </label>
              <input
                type="text"
                value={formData.propertyId}
                onChange={(e) => setFormData({ ...formData, propertyId: e.target.value })}
                className="input w-full p-2 bg-blue-900/60 text-blue-50 border border-blue-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-400/30 focus:outline-none placeholder:text-white"
                placeholder="Enter property ID"
                required
                disabled={!!propertyId}
              />
            </div>

            {/* Buyer ID */}
            <div className="form-control bg-blue-900/60">
              <label className="label">
                <span className="label-text text-blue-100 font-medium">
                  Buyer ID <span className="text-red-400">*</span>
                </span>
              </label>
              <input
                type="text"
                value={formData.buyerId}
                onChange={(e) => setFormData({ ...formData, buyerId: e.target.value })}
                className="input w-full p-2 bg-blue-900/60 text-blue-50 border border-blue-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-400/30 focus:outline-none placeholder:text-white"
                placeholder="Enter buyer ID"
                required
                disabled={!!request?.buyerId || !!request?.requester?.id}
              />
              {request && (
                <label className="label">
                  <span className="label-text-alt text-blue-300">From request by {request.requester?.name}</span>
                </label>
              )}
            </div>

            {/* Agreement Type */}
            <div className="form-control bg-blue-900/60">
              <label className="label">
                <span className="label-text text-blue-100 font-medium">
                  Agreement Type <span className="text-red-400">*</span>
                </span>
              </label>
              <select
                value={formData.agreementType}
                onChange={(e) => setFormData({ ...formData, agreementType: e.target.value as 'initial' | 'final' })}
                className="select w-full p-2 bg-blue-900/60 text-blue-50 border border-blue-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-400/30 focus:outline-none"
                required
              >
                <option value="initial">Initial Agreement</option>
                <option value="final">Final Agreement</option>
              </select>
            </div>

            <div className="divider text-blue-100">Payment Terms</div>

            {/* Price */}
            <div className="form-control bg-blue-900/60">
              <label className="label">
                <span className="label-text text-blue-100 font-medium">
                  Price (PKR) <span className="text-red-400">*</span>
                </span>
              </label>
              <input
                type="number"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                className="input w-full p-2 bg-blue-900/60 text-blue-50 border border-blue-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-400/30 focus:outline-none placeholder:text-white"
                placeholder="Enter price"
                min="0"
                step="1000"
                required
              />
            </div>

            {/* Total Amount */}
            <div className="form-control bg-blue-900/60">
              <label className="label">
                <span className="label-text text-blue-100 font-medium">
                  Total Amount (PKR) <span className="text-red-400">*</span>
                </span>
              </label>
              <input
                type="number"
                value={formData.totalAmount}
                onChange={(e) => setFormData({ ...formData, totalAmount: e.target.value })}
                className="input w-full p-2 bg-blue-900/60 text-blue-50 border border-blue-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-400/30 focus:outline-none placeholder:text-white"
                placeholder="Enter total amount"
                min="0"
                step="1000"
                required
              />
            </div>

            {/* Installment Plan */}
            <div className="form-control bg-blue-900/60">
              <label className="label">
                <span className="label-text text-blue-100 font-medium">
                  Installment Plan (Years) <span className="text-red-400">*</span>
                </span>
              </label>
              <input
                type="number"
                value={formData.installmentPlanYears}
                onChange={(e) => setFormData({ ...formData, installmentPlanYears: e.target.value })}
                className="input w-full p-2 bg-blue-900/60 text-blue-50 border border-blue-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-400/30 focus:outline-none placeholder:text-white"
                placeholder="Enter years"
                min="1"
                max="10"
                required
              />
            </div>

            {/* Payment Terms */}
            <div className="form-control bg-blue-900/60">
              <label className="label">
                <span className="label-text text-blue-100 font-medium">Payment Terms</span>
              </label>
              <textarea
                value={formData.paymentTerms}
                onChange={(e) => setFormData({ ...formData, paymentTerms: e.target.value })}
                className="textarea h-24 p-2 w-full bg-blue-900/60 text-blue-50 border border-blue-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-400/30 focus:outline-none placeholder:text-white"
                placeholder="Enter payment terms and conditions..."
              />
              <label className="label">
                <span className="label-text-alt text-blue-300">Optional</span>
              </label>
            </div>

            <div className="divider text-blue-100">Documents</div>

            {/* Signed Agreement Document */}
            <div className="form-control bg-blue-900/60">
              <label className="label">
                <span className="label-text text-blue-100 font-medium">Signed Agreement Document</span>
              </label>
              <input
                type="file"
                onChange={(e) => setSignedDocument(e.target.files?.[0] || null)}
                className="file-input w-full bg-blue-900/60 text-blue-50 border border-blue-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-400/30 focus:outline-none"
                accept=".pdf,.doc,.docx"
              />
              <label className="label">
                <span className="label-text-alt text-blue-300">
                  Upload signed agreement (PDF, DOC, DOCX) - Optional
                </span>
              </label>
              {signedDocument && (
                <div className="alert alert-info mt-2">
                  <span className="text-black">Selected: {signedDocument.name}</span>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="card-actions justify-end pt-4">
              <button
                type="button"
                onClick={() => navigate('/dashboard/builder/agreements')}
                className="btn btn-outline btn-primary w-auto"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary gap-2 inline-flex items-center justify-center w-auto"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="loading loading-spinner"></span>
                    <span>Creating...</span>
                  </>
                ) : (
                  <>
                    <DocumentTextIcon className="w-5 h-5 flex-shrink-0" />
                    <span>Create Agreement</span>
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
