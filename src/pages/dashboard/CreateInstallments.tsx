import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { installmentAPI, agreementAPI } from '../../services/api';
import type { Agreement } from '../../types';
import { CurrencyDollarIcon, DocumentTextIcon, CalendarIcon, ExclamationCircleIcon } from '@heroicons/react/24/outline';

const CreateInstallments: React.FC = () => {
  const [searchParams] = useSearchParams();
  const agreementIdParam = searchParams.get('agreementId');
  
  const [agreementId, setAgreementId] = useState(agreementIdParam || '');
  const [agreement, setAgreement] = useState<Agreement | null>(null);
  const [agreements, setAgreements] = useState<Agreement[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingAgreement, setLoadingAgreement] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchAgreements();
  }, []);

  useEffect(() => {
    if (agreementIdParam) {
      setAgreementId(agreementIdParam);
      loadAgreement(agreementIdParam);
    }
  }, [agreementIdParam]);

  const fetchAgreements = async () => {
    try {
      const data = await agreementAPI.getAll({ status: 'signed' });
      const agreementsArray = Array.isArray(data) ? data : [];
      // Only show signed agreements that don't have installments yet
      setAgreements(agreementsArray.filter((a) => a.status === 'signed' || a.status === 'builder_signed'));
    } catch (err: any) {
      console.error('Error fetching agreements:', err);
    }
  };

  const loadAgreement = async (id: string) => {
    if (!id) return;
    
    try {
      setLoadingAgreement(true);
      setError('');
      const data = await agreementAPI.getById(id);
      setAgreement(data);
      
      // Validate agreement is signed
      if (data.status !== 'signed' && data.status !== 'completed') {
        setError('This agreement must be fully signed before creating installments.');
      }
    } catch (err: any) {
      console.error('Error loading agreement:', err);
      setError(err.response?.data?.message || 'Failed to load agreement');
      setAgreement(null);
    } finally {
      setLoadingAgreement(false);
    }
  };

  const handleAgreementChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedId = e.target.value;
    setAgreementId(selectedId);
    if (selectedId) {
      loadAgreement(selectedId);
    } else {
      setAgreement(null);
      setError('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!agreementId) {
      setError('Please select an agreement');
      return;
    }

    if (!agreement) {
      setError('Agreement data not loaded');
      return;
    }

    if (agreement.status !== 'signed' && agreement.status !== 'completed') {
      setError('Agreement must be fully signed before creating installments');
      return;
    }

    try {
      setLoading(true);
      setError('');
      setSuccess('');
      
      const result = await installmentAPI.create(agreementId);
      
      setSuccess(`Successfully created ${Array.isArray(result) ? result.length : 0} installments!`);
      
      // Redirect to installments list after 2 seconds
      setTimeout(() => {
        navigate('/dashboard/builder/installments');
      }, 2000);
    } catch (err: any) {
      console.error('Error creating installments:', err);
      setError(err.response?.data?.message || 'Failed to create installments');
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
          <h1 className="text-3xl font-bold">Create Installments</h1>
          <p className="text-gray-600 mt-1">Generate payment schedule from signed agreement</p>
        </div>

        {error && (
          <div className="alert alert-error mb-6">
            <ExclamationCircleIcon className="h-6 w-6" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="alert alert-success mb-6">
            <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{success}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="card bg-base-100 shadow-xl">
          <div className="card-body">
            {/* Agreement Selection */}
            <div className="form-control">
              <label className="label">
                <span className="label-text font-semibold">Select Agreement *</span>
              </label>
              <select
                className="select select-bordered w-full"
                value={agreementId}
                onChange={handleAgreementChange}
                required
                disabled={!!agreementIdParam}
              >
                <option value="">Choose a signed agreement...</option>
                {agreements.map((agr) => (
                  <option key={agr.id} value={agr.id}>
                    {agr.property?.title} - {agr.buyer?.name} - ₹
                    {agr.terms?.totalAmount?.toLocaleString() || 0}
                  </option>
                ))}
              </select>
              <label className="label">
                <span className="label-text-alt text-gray-500">
                  Only signed agreements are available
                </span>
              </label>
            </div>

            {/* Agreement Details */}
            {loadingAgreement && (
              <div className="flex justify-center py-8">
                <span className="loading loading-spinner loading-lg"></span>
              </div>
            )}

            {agreement && !loadingAgreement && (
              <div className="mt-6 space-y-4">
                <div className="divider">Agreement Details</div>

                {/* Property Information */}
                <div className="bg-base-200 rounded-lg p-4">
                  <h3 className="font-semibold text-lg mb-3 flex items-center">
                    <DocumentTextIcon className="h-5 w-5 mr-2" />
                    Property Information
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Property</p>
                      <p className="font-medium">{agreement.property?.title}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Location</p>
                      <p className="font-medium">{agreement.property?.location}</p>
                    </div>
                  </div>
                </div>

                {/* Buyer Information */}
                <div className="bg-base-200 rounded-lg p-4">
                  <h3 className="font-semibold text-lg mb-3">Buyer Information</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Name</p>
                      <p className="font-medium">{agreement.buyer?.name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Email</p>
                      <p className="font-medium">{agreement.buyer?.email}</p>
                    </div>
                  </div>
                </div>

                {/* Payment Terms */}
                <div className="bg-base-200 rounded-lg p-4">
                  <h3 className="font-semibold text-lg mb-3 flex items-center">
                    <CurrencyDollarIcon className="h-5 w-5 mr-2" />
                    Payment Terms
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Total Amount</p>
                      <p className="font-medium text-xl text-primary">
                        {agreement.terms?.totalAmount 
                          ? formatCurrency(agreement.terms.totalAmount)
                          : 'N/A'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Installment Plan</p>
                      <p className="font-medium">
                        {agreement.terms?.installmentPlanYears || 0} years
                      </p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-sm text-gray-500">Agreement Type</p>
                      <p className="font-medium capitalize">{agreement.agreementType}</p>
                    </div>
                  </div>
                </div>

                {/* Installment Preview */}
                {agreement.terms?.totalAmount && agreement.terms?.installmentPlanYears && (
                  <div className="bg-base-200 rounded-lg p-4">
                    <h3 className="font-semibold text-lg mb-3 flex items-center">
                      <CalendarIcon className="h-5 w-5 mr-2" />
                      Installment Preview
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-500">Number of Installments</p>
                        <p className="font-medium text-2xl">
                          {agreement.terms.installmentPlanYears * 12}
                        </p>
                        <p className="text-xs text-gray-500">Monthly payments</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Amount per Installment</p>
                        <p className="font-medium text-2xl text-secondary">
                          {formatCurrency(
                            agreement.terms.totalAmount / (agreement.terms.installmentPlanYears * 12)
                          )}
                        </p>
                        <p className="text-xs text-gray-500">Approximate amount</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Status Check */}
                {(agreement.status !== 'signed' && agreement.status !== 'completed') && (
                  <div className="alert alert-warning">
                    <ExclamationCircleIcon className="h-6 w-6" />
                    <span>
                      This agreement must be fully signed by both parties before creating installments.
                      Current status: <strong>{agreement.status}</strong>
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Submit Button */}
            <div className="card-actions justify-end mt-6">
              <button
                type="button"
                onClick={() => navigate('/dashboard/builder/installments')}
                className="btn btn-ghost"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={
                  loading ||
                  !agreement ||
                  (agreement.status !== 'signed' && agreement.status !== 'completed')
                }
              >
                {loading ? (
                  <>
                    <span className="loading loading-spinner loading-sm"></span>
                    Creating...
                  </>
                ) : (
                  <>
                    <CurrencyDollarIcon className="h-5 w-5 mr-2" />
                    Create Installments
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
              <p>• Installments will be created automatically based on the agreement terms</p>
              <p>• Each installment will have a payment window (start and end date)</p>
              <p>• Buyers will receive notifications when payments are due</p>
              <p>• Payment status will be tracked automatically</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateInstallments;
