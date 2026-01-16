import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import DashboardLayout from '../../components/layouts/DashboardLayout';
import {
  DocumentTextIcon,
  CheckCircleIcon,
  ClockIcon,
  EyeIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline';
import { agreementAPI } from '../../services/api';
import { useAppSelector } from '../../store/hooks';
import type { Agreement } from '../../types';
import { buyerNavItems } from '../../constants/navigation';

export default function BuyerAgreements() {
  const { user } = useAppSelector((state) => state.auth);
  const [agreements, setAgreements] = useState<Agreement[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'draft' | 'pending_signature' | 'signed' | 'completed'>('all');
  const [signing, setSigning] = useState<string | null>(null);

  useEffect(() => {
    loadAgreements();
  }, [filter]);

  const loadAgreements = async () => {
    try {
      setLoading(true);
      // Get all agreements for the current buyer
      const data = await agreementAPI.getAll({ buyerId: user?.id });
      
      // Filter by status if needed
      let filtered = data;
      if (filter !== 'all') {
        filtered = data.filter((agreement) => {
          if (filter === 'pending_signature') {
            return agreement.status === 'pending_signature' || agreement.status === 'buyer_signed' || agreement.status === 'builder_signed';
          }
          return agreement.status === filter;
        });
      }
      
      setAgreements(filtered);
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
      setSigning(agreementId);
      await agreementAPI.sign(agreementId, true);
      await loadAgreements();
      alert('Agreement signed successfully!');
    } catch (error: unknown) {
      console.error('Failed to sign agreement:', error);
      const err = error as { response?: { data?: { message?: string } } };
      alert(err.response?.data?.message || 'Failed to sign agreement');
    } finally {
      setSigning(null);
    }
  };

  const canSign = (agreement: Agreement) => {
    if (!user) return false;
    // Buyer can sign if:
    // 1. Agreement status is 'draft' or 'pending_signature'
    // 2. Buyer hasn't signed yet (buyerSignedAt is null)
    // 3. Agreement belongs to this buyer
    return (
      agreement.buyerId === user.id &&
      (agreement.status === 'draft' || agreement.status === 'pending_signature') &&
      !agreement.buyerSignedAt
    );
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'draft':
        return <div className="badge badge-ghost">Draft</div>;
      case 'pending_signature':
      case 'buyer_signed':
      case 'builder_signed':
        return <div className="badge badge-warning">Pending Signature</div>;
      case 'signed':
        return <div className="badge badge-success">Signed</div>;
      case 'completed':
        return <div className="badge badge-info">Completed</div>;
      default:
        return <div className="badge badge-ghost">{status}</div>;
    }
  };

  if (loading) {
    return (
      <DashboardLayout navItems={buyerNavItems}>
        <div className="flex justify-center items-center h-64">
          <span className="loading loading-spinner loading-lg"></span>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout navItems={buyerNavItems}>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-white">My Agreements</h1>
          <p className="text-gray-400 mt-1">View and manage your property purchase agreements</p>
        </div>

        {/* Filter Tabs */}
        <div className="tabs tabs-boxed bg-gray-800/90 border border-gray-700">
          <a
            className={`tab text-white ${filter === 'all' ? 'tab-active bg-blue-600' : 'hover:bg-gray-700'}`}
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
            className={`tab text-white ${filter === 'signed' ? 'tab-active bg-green-600' : 'hover:bg-gray-700'}`}
            onClick={() => setFilter('signed')}
          >
            <CheckCircleIcon className="w-4 h-4 mr-2" />
            Signed
          </a>
          <a
            className={`tab text-white ${filter === 'completed' ? 'tab-active bg-purple-600' : 'hover:bg-gray-700'}`}
            onClick={() => setFilter('completed')}
          >
            <CheckCircleIcon className="w-4 h-4 mr-2" />
            Completed
          </a>
        </div>

        {/* Agreements List */}
        {agreements.length === 0 ? (
          <div className="card bg-gray-800/90 shadow-xl border border-gray-700">
            <div className="card-body items-center text-center">
              <DocumentTextIcon className="w-16 h-16 text-gray-500 mb-4" />
              <h2 className="card-title text-white">No agreements found</h2>
              <p className="text-gray-400">
                {filter === 'all'
                  ? 'You don\'t have any agreements yet'
                  : `No ${filter} agreements at this time`}
              </p>
            </div>
          </div>
        ) : (
          <div className="grid gap-4">
            {agreements.map((agreement) => (
              <div key={agreement.id} className="card bg-gray-800/90 shadow-xl border border-gray-700">
                <div className="card-body">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="card-title text-white">
                        {agreement.property?.title || (agreement.terms?.propertyDetails as any)?.title || 'Property Agreement'}
                      </h3>
                      <p className="text-sm text-gray-400">
                        {agreement.property?.location || (agreement.terms?.propertyDetails as any)?.location || 'Location not available'}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(agreement.status)}
                      <div className="badge badge-lg badge-primary">
                        {agreement.agreementType.replace('_', ' ').toUpperCase()}
                      </div>
                    </div>
                  </div>

                  <div className="divider"></div>

                  <div className="grid md:grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm text-gray-400">Total Amount</p>
                      <p className="text-white text-lg font-bold">
                        PKR {agreement.terms?.totalAmount?.toLocaleString() || agreement.terms?.price?.toLocaleString() || '0'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">Builder</p>
                      <p className="text-white">
                        {agreement.builder?.name || (agreement.terms?.builderDetails as any)?.name || 'N/A'}
                      </p>
                      {(agreement.builder?.companyName || (agreement.terms?.builderDetails as any)?.companyName) && (
                        <p className="text-xs text-gray-500">
                          {agreement.builder?.companyName || (agreement.terms?.builderDetails as any)?.companyName}
                        </p>
                      )}
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">Created</p>
                      <p className="text-white">
                        {new Date(agreement.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  {/* Signature Status */}
                  <div className="mt-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-sm text-gray-400">Your Signature</p>
                        {agreement.buyerSignedAt ? (
                          <p className="flex items-center gap-2 text-success mt-1">
                            <CheckCircleIcon className="w-5 h-5" />
                            Signed on {new Date(agreement.buyerSignedAt).toLocaleDateString()}
                          </p>
                        ) : (
                          <p className="text-warning mt-1">Not signed</p>
                        )}
                      </div>
                      <div>
                        <p className="text-sm text-gray-400">Builder Signature</p>
                        {agreement.builderSignedAt ? (
                          <p className="flex items-center gap-2 text-success mt-1">
                            <CheckCircleIcon className="w-5 h-5" />
                            Signed on {new Date(agreement.builderSignedAt).toLocaleDateString()}
                          </p>
                        ) : (
                          <p className="text-gray-500 mt-1">Not signed</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="card-actions justify-end mt-4">
                    <Link
                      to={`/dashboard/buyer/agreements/${agreement.id}`}
                      className="btn btn-ghost btn-sm text-white border-white flex flex-row w-30"
                    >
                      <EyeIcon className="w-4 h-4 mr-2" />
                      View Details
                    </Link>
                    {canSign(agreement) && (
                      <button
                        onClick={() => handleSign(agreement.id)}
                        className="btn btn-primary btn-sm text-white border-white hover:bg-blue-600 flex flex-row w-30"
                        disabled={signing === agreement.id}
                      >
                        {signing === agreement.id ? (
                          <span className="loading loading-spinner loading-xs"></span>
                        ) : (
                          <CheckCircleIcon className="w-4 h-4 mr-2" />
                        )}
                        Sign Agreement
                      </button>
                    )}
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
