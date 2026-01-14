import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import DashboardLayout from '../../components/layouts/DashboardLayout';
import { installmentAPI, agreementAPI } from '../../services/api';
import type { Agreement } from '../../types';
import { CurrencyDollarIcon, DocumentTextIcon, CalendarIcon, ExclamationCircleIcon, HomeIcon, FolderIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';

const navItems = [
  { name: 'Dashboard', path: '/dashboard/builder', icon: HomeIcon },
  { name: 'Projects', path: '/dashboard/builder/projects', icon: FolderIcon },
  { name: 'Agreements', path: '/dashboard/builder/agreements', icon: DocumentTextIcon },
  { name: 'Installments', path: '/dashboard/builder/installments', icon: CurrencyDollarIcon },
];

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
    } catch (err: unknown) {
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
    } catch (err: unknown) {
      console.error('Error loading agreement:', err);
      setError((err as { response?: { data?: { message?: string } } }).response?.data?.message || 'Failed to load agreement');
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
    } catch (err: unknown) {
      console.error('Error creating installments:', err);
      setError((err as { response?: { data?: { message?: string } } }).response?.data?.message || 'Failed to create installments');
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
    <DashboardLayout navItems={navItems}>
      <div className="max-w-3xl mx-auto">
        <div className="mb-6">
          <button
            onClick={() => navigate('/dashboard/builder/installments')}
            className="btn btn-outline btn-primary btn-sm gap-2 mb-4 inline-flex items-center justify-center"
          >
            <ArrowLeftIcon className="w-4 h-4 flex-shrink-0" />
            <span>Back to Installments</span>
          </button>
          <h1 className="text-3xl font-bold text-white">Create Installments</h1>
          <p className="text-gray-400 mt-1">Generate payment schedule from signed agreement</p>
        </div>

        {error && (
          <div className="alert alert-error mb-6">
            <ExclamationCircleIcon className="h-6 w-6" />
            <span className="text-black">{error}</span>
          </div>
        )}

        {success && (
          <div className="alert alert-success mb-6">
            <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-black">{success}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="card bg-blue-950 shadow-2xl border border-blue-800">
          <div className="card-body">
            {/* Agreement Selection */}
            <div className="form-control mb-4">
              <label className="label">
                <span className="label-text text-black font-semibold text-base">Select Agreement *</span>
              </label>
              <select
                className="select w-full bg-blue-900/60 text-white border border-blue-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-400/30 focus:outline-none"
                value={agreementId}
                onChange={handleAgreementChange}
                required
                disabled={!!agreementIdParam}
              >
                <option value="" className="bg-gray-800 text-gray-300">Choose a signed agreement...</option>
                {agreements.map((agr) => (
                  <option key={agr.id} value={agr.id} className="bg-gray-800 text-white">
                    {agr.property?.title} - {agr.buyer?.name} - ₹
                    {agr.terms?.totalAmount?.toLocaleString() || 0}
                  </option>
                ))}
              </select>
              <label className="label">
                <span className="label-text-alt text-blue-800">
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
                <div className="divider text-blue-100">Agreement Details</div>

                {/* Property Information */}
                <div className="bg-blue-900/40 rounded-lg p-4 border border-blue-700">
                  <h3 className="font-semibold text-lg mb-3 flex items-center text-blue-100">
                    <DocumentTextIcon className="h-5 w-5 mr-2" />
                    Property Information
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-blue-300">Property</p>
                      <p className="font-medium text-white">{agreement.property?.title}</p>
                    </div>
                    <div>
                      <p className="text-sm text-blue-300">Location</p>
                      <p className="font-medium text-white">{agreement.property?.location}</p>
                    </div>
                  </div>
                </div>

                {/* Buyer Information */}
                <div className="bg-blue-900/40 rounded-lg p-4 border border-blue-700">
                  <h3 className="font-semibold text-lg mb-3 text-blue-100">Buyer Information</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-blue-300">Name</p>
                      <p className="font-medium text-white">{agreement.buyer?.name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-blue-300">Email</p>
                      <p className="font-medium text-white">{agreement.buyer?.email}</p>
                    </div>
                  </div>
                </div>

                {/* Payment Terms */}
                <div className="bg-blue-900/40 rounded-lg p-4 border border-blue-700">
                  <h3 className="font-semibold text-lg mb-3 flex items-center text-blue-100">
                    <CurrencyDollarIcon className="h-5 w-5 mr-2" />
                    Payment Terms
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-blue-300">Total Amount</p>
                      <p className="font-medium text-xl text-primary">
                        {agreement.terms?.totalAmount 
                          ? formatCurrency(agreement.terms.totalAmount)
                          : 'N/A'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-blue-300">Installment Plan</p>
                      <p className="font-medium text-white">
                        {agreement.terms?.installmentPlanYears || 0} years
                      </p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-sm text-blue-300">Agreement Type</p>
                      <p className="font-medium capitalize text-white">{agreement.agreementType}</p>
                    </div>
                  </div>
                </div>

                {/* Installment Preview */}
                {agreement.terms?.totalAmount && agreement.terms?.installmentPlanYears && (
                  <div className="bg-blue-900/40 rounded-lg p-4 border border-blue-700">
                    <h3 className="font-semibold text-lg mb-3 flex items-center text-blue-100">
                      <CalendarIcon className="h-5 w-5 mr-2" />
                      Installment Preview
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-blue-300">Number of Installments</p>
                        <p className="font-medium text-2xl text-white">
                          {agreement.terms.installmentPlanYears * 12}
                        </p>
                        <p className="text-xs text-blue-300">Monthly payments</p>
                      </div>
                      <div>
                        <p className="text-sm text-blue-300">Amount per Installment</p>
                        <p className="font-medium text-2xl text-secondary">
                          {formatCurrency(
                            agreement.terms.totalAmount / (agreement.terms.installmentPlanYears * 12)
                          )}
                        </p>
                        <p className="text-xs text-blue-300">Approximate amount</p>
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
            <div className="card-actions justify-end mt-8 gap-3">
              <button
                type="button"
                onClick={() => navigate('/dashboard/builder/installments')}
                className="btn btn-outline btn-primary"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary gap-2 inline-flex items-center justify-center"
                disabled={
                  loading ||
                  !agreement ||
                  (agreement.status !== 'signed' && agreement.status !== 'completed')
                }
              >
                {loading ? (
                  <>
                    <span className="loading loading-spinner loading-sm"></span>
                    <span>Creating...</span>
                  </>
                ) : (
                  <>
                    <CurrencyDollarIcon className="h-5 w-5 flex-shrink-0" />
                    <span>Create Installments</span>
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
            <h3 className="font-bold text-black">How it works</h3>
            <div className="text-sm text-black">
              <p>• Installments will be created automatically based on the agreement terms</p>
              <p>• Each installment will have a payment window (start and end date)</p>
              <p>• Buyers will receive notifications when payments are due</p>
              <p>• Payment status will be tracked automatically</p>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default CreateInstallments;
