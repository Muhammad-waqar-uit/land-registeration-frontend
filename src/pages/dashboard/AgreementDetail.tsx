import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import DashboardLayout from '../../components/layouts/DashboardLayout';
import {
  HomeIcon,
  FolderIcon,
  DocumentTextIcon,
  ArrowLeftIcon,
  CheckCircleIcon,
  ShieldCheckIcon,
  UserGroupIcon,
  CreditCardIcon,
  CurrencyDollarIcon,
  ArrowPathIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';
import { agreementAPI } from '../../services/api';
import { useAppSelector } from '../../store/hooks';
import type { Agreement } from '../../types';

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

const buyerNavItems = [
  { name: 'Dashboard', path: '/dashboard/buyer', icon: HomeIcon },
];

export default function AgreementDetail() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAppSelector((state) => state.auth);
  const [agreement, setAgreement] = useState<Agreement | null>(null);
  const [loading, setLoading] = useState(true);
  const [signing, setSigning] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState<{ verified: boolean; message: string } | null>(null);

  const loadAgreement = useCallback(async () => {
    try {
      setLoading(true);
      const data = await agreementAPI.getById(id!);
      setAgreement(data);
    } catch (error: unknown) {
      console.error('Failed to load agreement:', error);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (id) {
      loadAgreement();
    }
  }, [id, loadAgreement]);

  const handleSign = async () => {
    try {
      setSigning(true);
      await agreementAPI.sign(id!);
      await loadAgreement();
    } catch (error: unknown) {
      console.error('Failed to sign agreement:', error);
      const errorMessage = error && typeof error === 'object' && 'response' in error
        ? (error as { response?: { data?: { message?: string } } }).response?.data?.message
        : undefined;
      alert(errorMessage || 'Failed to sign agreement');
    } finally {
      setSigning(false);
    }
  };

  const handleVerify = async () => {
    try {
      setVerifying(true);
      const result = await agreementAPI.verify(id!);
      setVerificationResult(result);
    } catch (error: unknown) {
      console.error('Failed to verify agreement:', error);
      const errorMessage = error && typeof error === 'object' && 'response' in error
        ? (error as { response?: { data?: { message?: string } } }).response?.data?.message
        : undefined;
      setVerificationResult({
        verified: false,
        message: errorMessage || 'Verification failed',
      });
    } finally {
      setVerifying(false);
    }
  };

  const canSign = () => {
    if (!agreement || !user) return false;
    
    if (user.role === 'builder') {
      return agreement.status === 'buyer_signed' && !agreement.builderSignedAt;
    } else if (user.role === 'user') {
      return agreement.status === 'pending' && !agreement.buyerSignedAt;
    }
    return false;
  };

  if (loading) {
    return (
      <DashboardLayout navItems={user?.role === 'builder' ? navItems : buyerNavItems}>
        <div className="flex justify-center items-center h-64">
          <span className="loading loading-spinner loading-lg"></span>
        </div>
      </DashboardLayout>
    );
  }

  if (!agreement) {
    return (
      <DashboardLayout navItems={user?.role === 'builder' ? navItems : buyerNavItems}>
        <div className="alert alert-error">
          <span>Agreement not found</span>
        </div>
      </DashboardLayout>
    );
  }

  const navPath = user?.role === 'builder' ? '/dashboard/builder/agreements' : '/dashboard/buyer';

  return (
    <DashboardLayout navItems={user?.role === 'builder' ? navItems : buyerNavItems}>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <Link to={navPath} className="btn btn-ghost btn-sm mb-2">
            <ArrowLeftIcon className="w-4 h-4 mr-2" />
            Back
          </Link>
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-white">Agreement Details</h1>
              <p className="text-gray-400 mt-1">{agreement.property?.title}</p>
            </div>
            <div className="flex gap-2">
              <div className="badge badge-lg badge-primary">
                {agreement.agreementType}
              </div>
              <div
                className={`badge badge-lg ${
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

        {/* Parties */}
        <div className="grid md:grid-cols-2 gap-4">
          <div className="card bg-base-200 border border-base-300">
            <div className="card-body">
              <h3 className="card-title text-white">Buyer</h3>
              <div>
                <p className="font-semibold text-white">{agreement.buyer?.name}</p>
                <p className="text-sm text-gray-400">{agreement.buyer?.email}</p>
                {agreement.buyer?.walletAddress && (
                  <p className="text-xs text-gray-500 mt-1 font-mono">{agreement.buyer.walletAddress}</p>
                )}
              </div>
              <div className="mt-4">
                <p className="text-sm text-gray-400">Signature Status</p>
                {agreement.buyerSignedAt ? (
                  <p className="flex items-center gap-2 text-success mt-1">
                    <CheckCircleIcon className="w-5 h-5" />
                    Signed on {new Date(agreement.buyerSignedAt).toLocaleDateString()}
                  </p>
                ) : (
                  <p className="text-gray-500 mt-1">Not signed</p>
                )}
              </div>
            </div>
          </div>

          <div className="card bg-base-200 border border-base-300">
            <div className="card-body">
              <h3 className="card-title text-white">Builder</h3>
              <div>
                <p className="font-semibold text-white">{agreement.builder?.name}</p>
                <p className="text-sm text-gray-400">{agreement.builder?.email}</p>
                {agreement.builder?.companyName && (
                  <p className="text-sm text-gray-400 mt-1">{agreement.builder.companyName}</p>
                )}
              </div>
              <div className="mt-4">
                <p className="text-sm text-gray-400">Signature Status</p>
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
        </div>

        {/* Property Details */}
        <div className="card bg-base-200 border border-base-300">
          <div className="card-body">
            <h3 className="card-title text-white">Property Details</h3>
            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-gray-400">Title</p>
                <p className="text-white font-semibold">{agreement.property?.title}</p>
              </div>
              <div>
                <p className="text-sm text-gray-400">Location</p>
                <p className="text-white">{agreement.property?.location}</p>
              </div>
              <div>
                <p className="text-sm text-gray-400">Size</p>
                <p className="text-white">{agreement.property?.size} sq ft</p>
              </div>
            </div>
          </div>
        </div>

        {/* Terms */}
        {agreement.terms && (
          <div className="card bg-base-200 border border-base-300">
            <div className="card-body">
              <h3 className="card-title text-white">Agreement Terms</h3>
              <div className="grid md:grid-cols-3 gap-4">
                {agreement.terms.price && (
                  <div>
                    <p className="text-sm text-gray-400">Price</p>
                    <p className="text-white text-xl font-bold">PKR {agreement.terms.price.toLocaleString()}</p>
                  </div>
                )}
                {agreement.terms.totalAmount && (
                  <div>
                    <p className="text-sm text-gray-400">Total Amount</p>
                    <p className="text-white text-xl font-bold">PKR {agreement.terms.totalAmount.toLocaleString()}</p>
                  </div>
                )}
                {agreement.terms.installmentPlanYears && (
                  <div>
                    <p className="text-sm text-gray-400">Installment Plan</p>
                    <p className="text-white text-xl font-bold">{agreement.terms.installmentPlanYears} years</p>
                  </div>
                )}
              </div>
              {agreement.terms.paymentTerms && (
                <div className="mt-4">
                  <p className="text-sm text-gray-400">Payment Terms</p>
                  <p className="text-white whitespace-pre-line">{agreement.terms.paymentTerms}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Documents */}
        {agreement.documentHash && (
          <div className="card bg-base-200 border border-base-300">
            <div className="card-body">
              <h3 className="card-title text-white">
                <ShieldCheckIcon className="w-6 h-6 text-primary" />
                Document Information
              </h3>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-400">Document Hash</p>
                  <p className="text-white font-mono text-sm break-all">{agreement.documentHash}</p>
                </div>
                {agreement.documentIPFSHash && (
                  <div>
                    <p className="text-sm text-gray-400">IPFS Hash</p>
                    <p className="text-white font-mono text-sm break-all">{agreement.documentIPFSHash}</p>
                  </div>
                )}
                <div className="flex gap-2">
                  <button
                    onClick={handleVerify}
                    className="btn btn-primary btn-sm"
                    disabled={verifying}
                  >
                    {verifying ? (
                      <span className="loading loading-spinner loading-xs"></span>
                    ) : (
                      <ShieldCheckIcon className="w-4 h-4 mr-2" />
                    )}
                    Verify Document
                  </button>
                </div>
                {verificationResult && (
                  <div className={`alert ${verificationResult.verified ? 'alert-success' : 'alert-error'}`}>
                    {verificationResult.verified ? (
                      <CheckCircleIcon className="w-6 h-6" />
                    ) : (
                      <ShieldCheckIcon className="w-6 h-6" />
                    )}
                    <span>{verificationResult.message}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        {canSign() && (
          <div className="card bg-base-200 border border-primary">
            <div className="card-body">
              <h3 className="card-title text-white">Action Required</h3>
              <p className="text-gray-300">
                {user?.role === 'builder'
                  ? 'The buyer has signed this agreement. Please review and sign to proceed.'
                  : 'Please review the agreement terms and sign to proceed.'}
              </p>
              <div className="card-actions justify-end mt-4">
                <button
                  onClick={handleSign}
                  className="btn btn-primary"
                  disabled={signing}
                >
                  {signing ? (
                    <span className="loading loading-spinner loading-sm"></span>
                  ) : (
                    <>
                      <CheckCircleIcon className="w-5 h-5 mr-2" />
                      Sign Agreement
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="text-xs text-gray-500">
          Created {new Date(agreement.createdAt).toLocaleDateString()}
        </div>
      </div>
    </DashboardLayout>
  );
}
