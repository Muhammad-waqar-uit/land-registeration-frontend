import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import DashboardLayout from '../../components/layouts/DashboardLayout';
import {
  ArrowLeftIcon,
  CheckCircleIcon,
  ShieldCheckIcon,
  CreditCardIcon,
  CurrencyDollarIcon,
} from '@heroicons/react/24/outline';
import { agreementAPI, paymentAPI } from '../../services/api';
import { useAppSelector } from '../../store/hooks';
import type { Agreement } from '../../types';
import { builderNavItems, buyerNavItems } from '../../constants/navigation';

export default function AgreementDetail() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAppSelector((state) => state.auth);
  const [agreement, setAgreement] = useState<Agreement | null>(null);
  const [loading, setLoading] = useState(true);
  const [signing, setSigning] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState<{ verified: boolean; message: string } | null>(null);
  const [paymentSummary, setPaymentSummary] = useState<{
    totalPaid: number;
    remainingBalance: number;
    totalAmount: number;
  } | null>(null);
  const [loadingPaymentSummary, setLoadingPaymentSummary] = useState(false);

  const loadAgreement = useCallback(async () => {
    try {
      setLoading(true);
      const data = await agreementAPI.getById(id!);
      
      // Load payment summary if agreement is signed and has propertyId
      if ((data.status === 'signed' || data.status === 'completed') && data.propertyId && user?.role === 'user') {
        try {
          setLoadingPaymentSummary(true);
          const summary = await paymentAPI.getInstallmentSummary(data.propertyId);
          setPaymentSummary(summary);
        } catch (err) {
          console.error('Failed to load payment summary:', err);
        } finally {
          setLoadingPaymentSummary(false);
        }
      }
      console.log('📋 Agreement Data from API (GET /api/agreements/:id):', {
        id: data.id,
        propertyId: data.propertyId,
        buyerId: data.buyerId,
        builderId: data.builderId,
        agreementType: data.agreementType,
        status: data.status,
        // Direct populated objects (if API includes them)
        buyer: data.buyer ? {
          id: data.buyer.id,
          name: data.buyer.name,
          email: data.buyer.email,
        } : 'NOT POPULATED',
        builder: data.builder ? {
          id: data.builder.id,
          name: data.builder.name,
          email: data.builder.email,
        } : 'NOT POPULATED',
        property: data.property ? {
          id: data.property.id,
          title: data.property.title,
          location: data.property.location,
          price: data.property.price,
        } : 'NOT POPULATED',
        // Data in terms (always available)
        buyerDetails: data.terms?.buyerDetails || 'NOT IN TERMS',
        builderDetails: data.terms?.builderDetails || 'NOT IN TERMS',
        propertyDetails: data.terms?.propertyDetails || 'NOT IN TERMS',
        documentIPFSHash: data.documentIPFSHash,
        signedDocumentIPFSHash: data.signedDocumentIPFSHash,
      });
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
    if (!window.confirm('Are you sure you want to sign this agreement? This action cannot be undone.')) {
      return;
    }

    try {
      setSigning(true);
      await agreementAPI.sign(id!, true); // confirmed: true
      await loadAgreement();
      alert('Agreement signed successfully!');
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
      // Builder can sign if:
      // 1. Agreement is draft (can sign first)
      // 2. Buyer has signed and builder hasn't (buyer_signed or pending_signature)
      // 3. Builder hasn't signed yet
      return (
        !agreement.builderSignedAt &&
        (
          agreement.status === 'draft' ||
          agreement.status === 'pending_signature' ||
          agreement.status === 'buyer_signed' ||
          (agreement.buyerSignedAt && !agreement.builderSignedAt)
        )
      );
    } else if (user.role === 'user') {
      // Buyer can sign if agreement is draft or pending_signature and buyer hasn't signed
      return (
        (agreement.status === 'draft' || agreement.status === 'pending_signature') &&
        !agreement.buyerSignedAt &&
        agreement.buyerId === user.id
      );
    }
    return false;
  };

  if (loading) {
    return (
      <DashboardLayout navItems={user?.role === 'builder' ? builderNavItems : buyerNavItems}>
        <div className="flex justify-center items-center h-64">
          <span className="loading loading-spinner loading-lg"></span>
        </div>
      </DashboardLayout>
    );
  }

  if (!agreement) {
    return (
      <DashboardLayout navItems={user?.role === 'builder' ? builderNavItems : buyerNavItems}>
        <div className="alert alert-error">
          <span>Agreement not found</span>
        </div>
      </DashboardLayout>
    );
  }

  const navPath = user?.role === 'builder' ? '/dashboard/builder/agreements' : '/dashboard/buyer';

  return (
    <DashboardLayout navItems={user?.role === 'builder' ? builderNavItems : buyerNavItems}>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <Link to={navPath} className="btn btn-ghost btn-sm mb-2 flex flex-row w-10 text-white border-whte">
            <ArrowLeftIcon className="w-4 h-4 mr-2" />
            Back
          </Link>
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-white">Agreement Details</h1>
              <p className="text-gray-400 mt-1">
                {agreement.property?.title || (agreement.terms?.propertyDetails as any)?.title || 'Property Agreement'}
              </p>
            </div>
            <div className="flex gap-2">
              <div className="badge badge-lg badge-primary">
                {agreement.agreementType.replace('_', ' ').toUpperCase()}
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
                <p className="font-semibold text-white">
                  {agreement.buyer?.name || (agreement.terms?.buyerDetails as any)?.name || 'N/A'}
                </p>
                {agreement.buyer?.email && (
                  <p className="text-sm text-gray-400">{agreement.buyer.email}</p>
                )}
                {(agreement.terms?.buyerDetails as any)?.cnic && (
                  <p className="text-sm text-gray-400">CNIC: {(agreement.terms?.buyerDetails as any).cnic}</p>
                )}
                {(agreement.terms?.buyerDetails as any)?.phoneNumber && (
                  <p className="text-sm text-gray-400">Phone: {(agreement.terms?.buyerDetails as any).phoneNumber}</p>
                )}
                {(agreement.terms?.buyerDetails as any)?.fatherName && (
                  <p className="text-xs text-gray-500 mt-1">Father: {(agreement.terms?.buyerDetails as any).fatherName}</p>
                )}
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
                <p className="font-semibold text-white">
                  {agreement.builder?.name || (agreement.terms?.builderDetails as any)?.name || 'N/A'}
                </p>
                {agreement.builder?.email && (
                  <p className="text-sm text-gray-400">{agreement.builder.email}</p>
                )}
                {(agreement.builder?.companyName || (agreement.terms?.builderDetails as any)?.companyName) && (
                  <p className="text-sm text-gray-400 mt-1">
                    {agreement.builder?.companyName || (agreement.terms?.builderDetails as any)?.companyName}
                  </p>
                )}
                {(agreement.terms?.builderDetails as any)?.licenseNumber && (
                  <p className="text-xs text-gray-500 mt-1">
                    License: {(agreement.terms?.builderDetails as any).licenseNumber}
                  </p>
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
                <p className="text-white font-semibold">
                  {agreement.property?.title || (agreement.terms?.propertyDetails as any)?.title || 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-400">Location</p>
                <p className="text-white">
                  {agreement.property?.location || (agreement.terms?.propertyDetails as any)?.location || 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-400">Size</p>
                <p className="text-white">
                  {agreement.property?.size
                    ? `${agreement.property.size} sq ft`
                    : (agreement.terms?.propertyDetails as any)?.size
                    ? `${(agreement.terms?.propertyDetails as any).size} sq ft`
                    : 'N/A'}
                </p>
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
                    {(() => {
                      try {
                        // Try parsing as JSON (new format: { hash, gateway, timestamp })
                        const ipfsData = JSON.parse(agreement.documentIPFSHash);
                        const ipfsHash = ipfsData?.hash || agreement.documentIPFSHash;
                        
                        return (
                          <div className="space-y-2">
                            <p className="text-white font-mono text-sm break-all">{ipfsHash}</p>
                            <a
                              href={`https://gateway.pinata.cloud/ipfs/${ipfsHash}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm text-blue-400 hover:text-blue-300 underline inline-flex items-center gap-1"
                            >
                              View on IPFS →
                            </a>
                            {ipfsData?.timestamp && (
                              <p className="text-xs text-gray-500">Pinned: {new Date(ipfsData.timestamp).toLocaleString()}</p>
                            )}
                          </div>
                        );
                      } catch {
                        // If not JSON, treat as plain hash string
                        return (
                          <div className="space-y-2">
                            <p className="text-white font-mono text-sm break-all">{agreement.documentIPFSHash}</p>
                            <a
                              href={`https://gateway.pinata.cloud/ipfs/${agreement.documentIPFSHash}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm text-blue-400 hover:text-blue-300 underline inline-flex items-center gap-1"
                            >
                              View on IPFS →
                            </a>
                          </div>
                        );
                      }
                    })()}
                  </div>
                )}
                <div className="flex gap-2">
                  <button
                    onClick={handleVerify}
                    className="btn btn-primary btn-sm flex flex-row w-30 text-white border-whte"
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

        {/* Payment Summary - Show for signed agreements */}
        {user?.role === 'user' && (agreement.status === 'signed' || agreement.status === 'completed') && agreement.propertyId && (
          <div className="card bg-blue-950 shadow-2xl border border-blue-800">
            <div className="card-body">
              <h3 className="card-title text-blue-100">
                <CurrencyDollarIcon className="w-6 h-6" />
                Payment Status
              </h3>
              {loadingPaymentSummary ? (
                <div className="flex justify-center py-4">
                  <span className="loading loading-spinner loading-md"></span>
                </div>
              ) : paymentSummary ? (
                <div className="space-y-4">
                  <div className="grid md:grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm text-blue-300">Total Amount</p>
                      <p className="text-white text-xl font-bold">
                        PKR {paymentSummary.totalAmount.toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-blue-300">Total Paid</p>
                      <p className="text-success text-xl font-bold">
                        PKR {paymentSummary.totalPaid.toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-blue-300">Remaining Balance</p>
                      <p className="text-warning text-xl font-bold">
                        PKR {paymentSummary.remainingBalance.toLocaleString()}
                      </p>
                    </div>
                  </div>
                  {paymentSummary.remainingBalance > 0 && (
                    <div className="card-actions justify-end mt-4">
                      <Link
                        to={`/dashboard/buyer/payments/create?landId=${agreement.propertyId}&agreementId=${agreement.id}`}
                        className="btn btn-primary text-white border-white flex flex-row w-30"
                      >
                        <CreditCardIcon className="w-5 h-5 mr-2" />
                        Make Payment
                      </Link>
                      <Link
                        to="/dashboard/buyer/installments"
                        className="btn btn-ghost text-white border-white flex flex-row w-30"
                      >
                        <CurrencyDollarIcon className="w-5 h-5 mr-2" />
                        View Installments
                      </Link>
                    </div>
                  )}
                  {paymentSummary.remainingBalance === 0 && (
                    <div className="alert alert-success">
                      <CheckCircleIcon className="w-6 h-6" />
                      <span>All payments completed! Waiting for builder to transfer ownership.</span>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-blue-200">Loading payment information...</p>
              )}
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
                  ? agreement.buyerSignedAt
                    ? 'The buyer has signed this agreement. Please review and sign to complete the agreement.'
                    : 'Please review the agreement terms and sign to proceed. The buyer can sign after you.'
                  : 'Please review the agreement terms and sign to proceed.'}
              </p>
              <div className="card-actions justify-end mt-4">
                <button
                  onClick={handleSign}
                  className="btn btn-primary text-white border-white flex flex-row w-30"
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
