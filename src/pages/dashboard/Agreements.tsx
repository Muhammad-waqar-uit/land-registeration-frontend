import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import DashboardLayout from '../../components/layouts/DashboardLayout';
import {
  DocumentTextIcon,
  PlusIcon,
  CheckCircleIcon,
  ClockIcon,
  EyeIcon,
} from '@heroicons/react/24/outline';
import { agreementAPI } from '../../services/api';
import type { Agreement } from '../../types';
import { builderNavItems } from '../../constants/navigation';

export default function Agreements() {
  const [agreements, setAgreements] = useState<Agreement[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'draft' | 'pending_signature' | 'buyer_signed' | 'builder_signed' | 'signed' | 'completed'>('all');

  useEffect(() => {
    loadAgreements();
  }, [filter]);

  const loadAgreements = async () => {
    try {
      setLoading(true);
      const data = await agreementAPI.getAll();
      setAgreements(data);
    } catch (error: unknown) {
      console.error('Failed to load agreements:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSign = async (agreementId: string) => {
    if (!window.confirm('Are you sure you want to sign this agreement? This action cannot be undone.')) {
      return;
    }

    try {
      await agreementAPI.sign(agreementId, true); // confirmed: true
      await loadAgreements();
      alert('Agreement signed successfully!');
    } catch (error: unknown) {
      console.error('Failed to sign agreement:', error);
      const errorMessage = error && typeof error === 'object' && 'response' in error
        ? (error as { response?: { data?: { message?: string } } }).response?.data?.message
        : undefined;
      alert(errorMessage || 'Failed to sign agreement');
    }
  };

  const filteredAgreements = agreements.filter((agreement) => {
    if (filter === 'all') return true;
    
    // Handle status mapping
    switch (filter) {
      case 'draft':
        return agreement.status === 'draft';
      case 'pending_signature':
        // Show agreements where one party has signed but not both
        return (
          agreement.status === 'pending_signature' ||
          agreement.status === 'buyer_signed' ||
          agreement.status === 'builder_signed'
        );
      case 'buyer_signed':
        // Show agreements where buyer signed but builder hasn't
        return (
          agreement.status === 'buyer_signed' ||
          (agreement.buyerSignedAt && !agreement.builderSignedAt)
        );
      case 'builder_signed':
        // Show agreements where builder signed but buyer hasn't
        return (
          agreement.status === 'builder_signed' ||
          (agreement.builderSignedAt && !agreement.buyerSignedAt)
        );
      case 'signed':
        // Show fully signed agreements
        return (
          agreement.status === 'signed' ||
          (agreement.buyerSignedAt && agreement.builderSignedAt && agreement.status !== 'completed')
        );
      case 'completed':
        return agreement.status === 'completed';
      default:
        return agreement.status === filter;
    }
  });

  if (loading) {
    return (
      <DashboardLayout navItems={builderNavItems}>
        <div className="flex justify-center items-center h-64">
          <span className="loading loading-spinner loading-lg"></span>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout navItems={builderNavItems}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white">Agreements</h1>
            <p className="text-gray-400 mt-1">Manage purchase agreements with buyers</p>
          </div>
          <Link
            to="/dashboard/builder/agreements/create"
            className="btn bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white border-0  flex items-center"
          >
            <PlusIcon className="w-5 h-5 mr-2" />
            Create Agreement
          </Link>
        </div>

        {/* Filter Tabs */}
        <div className="tabs tabs-boxed bg-gray-800/90 border border-gray-700">
          <a
            className={`tab text-white ${filter === 'all' ? 'tab-active bg-purple-600' : 'hover:bg-gray-700'}`}
            onClick={() => setFilter('all')}
          >
            All
          </a>
          <a
            className={`tab text-white ${filter === 'draft' ? 'tab-active bg-gray-600' : 'hover:bg-gray-700'}`}
            onClick={() => setFilter('draft')}
          >
            <ClockIcon className="w-4 h-4 mr-2" />
            Draft
          </a>
          <a
            className={`tab text-white ${filter === 'pending_signature' ? 'tab-active bg-yellow-600' : 'hover:bg-gray-700'}`}
            onClick={() => setFilter('pending_signature')}
          >
            <ClockIcon className="w-4 h-4 mr-2" />
            Pending Signature
          </a>
          <a
            className={`tab text-white ${filter === 'buyer_signed' ? 'tab-active bg-blue-600' : 'hover:bg-gray-700'}`}
            onClick={() => setFilter('buyer_signed')}
          >
            Buyer Signed
          </a>
          <a
            className={`tab text-white ${filter === 'builder_signed' ? 'tab-active bg-indigo-600' : 'hover:bg-gray-700'}`}
            onClick={() => setFilter('builder_signed')}
          >
            Builder Signed
          </a>
          <a
            className={`tab text-white ${filter === 'signed' ? 'tab-active bg-green-600' : 'hover:bg-gray-700'}`}
            onClick={() => setFilter('signed')}
          >
            <CheckCircleIcon className="w-4 h-4 mr-2" />
            Signed
          </a>
          <a
            className={`tab text-white ${filter === 'completed' ? 'tab-active bg-emerald-600' : 'hover:bg-gray-700'}`}
            onClick={() => setFilter('completed')}
          >
            Completed
          </a>
        </div>

        {/* Agreements List */}
        {filteredAgreements.length === 0 ? (
          <div className="card bg-gray-800/90 shadow-xl border border-gray-700">
            <div className="card-body items-center text-center">
              <DocumentTextIcon className="w-16 h-16 text-gray-500 mb-4" />
              <h2 className="card-title text-white">No {filter !== 'all' ? filter : ''} agreements found</h2>
              <p className="text-gray-400">
                {filter === 'all'
                  ? 'Create your first agreement to get started'
                  : `No ${filter} agreements at this time`}
              </p>
              {filter === 'all' && (
                <Link to="/dashboard/builder/agreements/create" className="btn bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white border-0 mt-4">
                  Create First Agreement
                </Link>
              )}
            </div>
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredAgreements.map((agreement) => (
              <div key={agreement.id} className="card bg-gray-800/90 shadow-xl border border-gray-700">
                <div className="card-body">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="card-title text-white">
                        {agreement.property?.title || 'Property Agreement'}
                      </h3>
                      <p className="text-sm text-gray-400">
                        {agreement.property?.location}
                      </p>
                      <div className="flex gap-2 mt-2">
                        <div className="badge badge-primary">
                          {agreement.agreementType}
                        </div>
                        <div
                          className={`badge ${
                            agreement.status === 'completed'
                              ? 'badge-success'
                              : agreement.status === 'signed'
                              ? 'badge-info'
                              : agreement.status === 'buyer_signed' || agreement.status === 'builder_signed'
                              ? 'badge-warning'
                              : 'badge-ghost'
                          }`}
                        >
                          {agreement.status.replace('_', ' ')}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="divider"></div>

                  <div className="grid md:grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm text-gray-400">Buyer</p>
                      <p className="font-semibold text-white">{agreement.buyer?.name}</p>
                      <p className="text-xs text-gray-500">{agreement.buyer?.email}</p>
                    </div>

                    {agreement.terms?.totalAmount && (
                      <div>
                        <p className="text-sm text-gray-400">Total Amount</p>
                        <p className="font-semibold text-lg text-primary">
                          PKR {agreement.terms.totalAmount.toLocaleString()}
                        </p>
                      </div>
                    )}

                    {agreement.terms?.installmentPlanYears && (
                      <div>
                        <p className="text-sm text-gray-400">Installment Plan</p>
                        <p className="font-semibold text-white">
                          {agreement.terms.installmentPlanYears} years
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="grid md:grid-cols-2 gap-4 mt-4">
                    <div>
                      <p className="text-sm text-gray-400">Buyer Signature</p>
                      <p className="text-white">
                        {agreement.buyerSignedAt ? (
                          <span className="flex items-center gap-2 text-success">
                            <CheckCircleIcon className="w-4 h-4" />
                            {new Date(agreement.buyerSignedAt).toLocaleDateString()}
                          </span>
                        ) : (
                          <span className="text-gray-500">Not signed</span>
                        )}
                      </p>
                    </div>

                    <div>
                      <p className="text-sm text-gray-400">Builder Signature</p>
                      <p className="text-white">
                        {agreement.builderSignedAt ? (
                          <span className="flex items-center gap-2 text-success">
                            <CheckCircleIcon className="w-4 h-4" />
                            {new Date(agreement.builderSignedAt).toLocaleDateString()}
                          </span>
                        ) : (
                          <span className="text-gray-500">Not signed</span>
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="card-actions justify-end mt-4">
                    <Link
                      to={`/dashboard/builder/agreements/${agreement.id}`}
                      className="btn btn-ghost btn-sm text-white border-white flex flex-row"
                    >
                      <EyeIcon className="w-4 h-4 mr-2" />
                      View Details
                    </Link>
                    {/* Show sign button if builder can sign (buyer has signed OR builder can sign first) */}
                    {(!agreement.builderSignedAt && (
                      agreement.status === 'draft' ||
                      agreement.status === 'buyer_signed' ||
                      agreement.status === 'pending_signature' ||
                      (agreement.buyerSignedAt && !agreement.builderSignedAt)
                    )) && (
                      <button
                        onClick={() => handleSign(agreement.id)}
                        className="btn btn-primary btn-sm text-white border-white flex flex-col"
                        title={agreement.buyerSignedAt ? 'Buyer has signed - Click to sign as builder' : 'Click to sign this agreement'}
                      >
                        <CheckCircleIcon className="w-4 h-4 mr-2" />
                        {agreement.buyerSignedAt ? 'Sign Agreement' : 'Sign Agreement'}
                      </button>
                    )}
                  </div>

                  <div className="text-xs text-gray-500 mt-2">
                    Created {new Date(agreement.createdAt).toLocaleDateString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
