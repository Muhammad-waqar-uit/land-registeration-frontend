import { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate, Link, useLocation } from 'react-router-dom';
import { useAppSelector } from '../store/hooks';
import { landAPI, paymentAPI, propertyRequestAPI } from '../services/api';
import type { Land, Payment } from '../types';
import DashboardLayout from '../components/layouts/DashboardLayout';
import {
  PencilIcon,
  TrashIcon,
  DocumentTextIcon,
  PhotoIcon,
  BuildingOfficeIcon,
  MapPinIcon,
  CurrencyDollarIcon,
  CubeTransparentIcon,
  ArrowLeftIcon,
  ShieldCheckIcon,
  DocumentMagnifyingGlassIcon,
} from '@heroicons/react/24/outline';
import { CheckCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/solid';
import { canUpdate, canDelete, getDeleteErrorMessage } from '../utils/landPermissions';
import { builderNavItems, buyerNavItems, adminNavItems } from '../constants/navigation';
import { getBlockExplorerTxUrl } from '../utils/blockchain';

const UPLOADS_BASE = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api').replace(/\/api\/?$/, '');

function toFullUploadUrl(urlOrPath: string | undefined): string | undefined {
  if (!urlOrPath) return undefined;
  if (urlOrPath.startsWith('http://') || urlOrPath.startsWith('https://')) return urlOrPath;
  const base = UPLOADS_BASE.replace(/\/$/, '');
  if (urlOrPath.startsWith('/')) return base + urlOrPath;
  return base + '/uploads/' + urlOrPath;
}

function getIPFSUrl(ipfsHashJson?: string): string | null {
  if (!ipfsHashJson) return null;
  try {
    const hashData = JSON.parse(ipfsHashJson);
    if (hashData?.hash) {
      const gateway = (hashData.gateway || 'https://gateway.pinata.cloud').replace(/\/$/, '');
      return `${gateway}/ipfs/${hashData.hash}`;
    }
  } catch {
    if (ipfsHashJson.startsWith('Qm') || ipfsHashJson.startsWith('baf'))
      return `https://gateway.pinata.cloud/ipfs/${ipfsHashJson}`;
  }
  return null;
}

function getLandImageUrl(land: Land): string | null {
  return toFullUploadUrl(land.imageUrl) || toFullUploadUrl(land.imageCID) || getIPFSUrl(land.imageIPFSHash) || null;
}

function getLandDocumentUrl(land: Land): string | null {
  return toFullUploadUrl(land.documentUrl) || toFullUploadUrl(land.documentCID) || getIPFSUrl(land.documentIPFSHash) || null;
}

export default function LandDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAppSelector((state) => state.auth);
  const navItems = useMemo(() => {
    if (location.pathname.startsWith('/dashboard/builder')) return builderNavItems;
    if (location.pathname.startsWith('/dashboard/admin')) return adminNavItems;
    return buyerNavItems;
  }, [location.pathname]);
  const [land, setLand] = useState<Land | null>(null);
  const [loading, setLoading] = useState(true);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [verificationStatus, setVerificationStatus] = useState<'checking' | 'completed' | null>(null);
  const [verificationResult, setVerificationResult] = useState<{
    verified: boolean;
    message: string;
    document?: {
      verified: boolean;
      message: string;
      storedHash: string;
      calculatedHash: string;
    };
    image?: {
      verified: boolean;
      message: string;
      storedHash: string;
      calculatedHash: string;
    };
  } | null>(null);
  const [verificationError, setVerificationError] = useState<string | null>(null);
  const [blockchainVerificationStatus, setBlockchainVerificationStatus] = useState<'checking' | 'completed' | null>(null);
  const [blockchainVerificationResult, setBlockchainVerificationResult] = useState<{
    verified: boolean;
    message: string;
    databaseHash?: string;
    blockchainHash?: string;
    blockchainLandId?: number;
    blockchainTxHash?: string;
    transactionHash?: string;
    error?: string | null;
  } | null>(null);
  const [blockchainVerificationError, setBlockchainVerificationError] = useState<string | null>(null);
  
  // Property Request state
  const [requesting, setRequesting] = useState(false);
  const [requestError, setRequestError] = useState<string | null>(null);
  const [requestSuccess, setRequestSuccess] = useState(false);
  
  const imageUrl = land ? getLandImageUrl(land) : null;
  const documentUrl = land ? getLandDocumentUrl(land) : null;

  const fetchData = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      const [landData, paymentsData] = await Promise.all([
        landAPI.getById(id),
        paymentAPI.getByBuyer().catch(() => []),
      ]);
      setLand(landData);
      
      // Filter payments for this land
      const landPayments = (paymentsData || []).filter((p) => p.landId === id);
      setPayments(landPayments);
    } catch (error) {
      console.error('Failed to fetch land:', error);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleDelete = async () => {
    if (!land || !user) return;

    // Check permissions
    if (!canDelete(land, user, payments)) {
      const errorMsg = getDeleteErrorMessage(land, user, payments);
      setDeleteError(errorMsg || 'Cannot delete this land.');
      return;
    }

    if (!window.confirm(`Are you sure you want to delete "${land.title}"? This action cannot be undone.`)) {
      return;
    }

    setDeleting(true);
    setDeleteError(null);

    try {
      await landAPI.delete(land.id);
      // Redirect to appropriate dashboard (data will refresh automatically on navigation)
      if (user.role === 'admin') {
        navigate('/dashboard/admin/all-lands');
      } else if (user.role === 'builder') {
        navigate('/dashboard/builder/lands');
      } else {
        navigate('/dashboard/buyer/available');
      }
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } }; message?: string };
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        'Failed to delete land. Please try again.';
      setDeleteError(errorMessage);
    } finally {
      setDeleting(false);
    }
  };

  /**
   * Verify Document and Image Integrity
   * 
   * Calls POST /api/lands/:id/verify to verify both document and image files.
   * Backend automatically:
   * - Reads files from uploads directory
   * - Calculates SHA-256 hashes
   * - Compares with stored hashes in database
   * - Returns verification results for both files
   */
  const handleVerifyIntegrity = async () => {
    if (!land?.id) return;
    
    setVerificationStatus('checking');
    setVerificationResult(null);
    setVerificationError(null);
    
    try {
      const response = await landAPI.verify(land.id);
      setVerificationResult(response);
      setVerificationStatus('completed');
      // Refresh land data after verification
      await fetchData();
    } catch (error: unknown) {
      console.error('Verification failed:', error);
      const err = error as { response?: { data?: { message?: string } }; message?: string };
      setVerificationError(
        err.response?.data?.message ||
        err.message ||
        'Failed to verify files. Please try again.'
      );
      setVerificationStatus('completed');
    }
  };

  /**
   * Verify Blockchain Hash
   * 
   * Calls POST /api/lands/:id/verify-blockchain to verify document hash against blockchain record.
   */
  const handleVerifyBlockchain = async () => {
    if (!land?.id) return;
    
    setBlockchainVerificationStatus('checking');
    setBlockchainVerificationResult(null);
    setBlockchainVerificationError(null);
    
    try {
      const response = await landAPI.verifyBlockchain(land.id);
      setBlockchainVerificationResult(response);
      setBlockchainVerificationStatus('completed');
      // Refresh land data after blockchain verification
      await fetchData();
    } catch (error: unknown) {
      console.error('Blockchain verification failed:', error);
      const err = error as { response?: { data?: { message?: string } }; message?: string };
      setBlockchainVerificationError(
        err.response?.data?.message ||
        err.message ||
        'Failed to verify blockchain. Please try again.'
      );
      setBlockchainVerificationStatus('completed');
    }
  };

  const handleRequestProperty = async () => {
    if (!land?.id || !user) {
      setRequestError('Please login to request a property');
      return;
    }

    if (user.role !== 'user') {
      setRequestError('Only users (buyers) can request properties');
      return;
    }

    if (land.status !== 'available' && land.status !== 'locked') {
      setRequestError(`This property is not available for request. Current status: ${land.status}`);
      return;
    }

    setRequestError(null);
    setRequestSuccess(false);
    setRequesting(true);

    try {
      // Request at listed price - no offer price needed
      await propertyRequestAPI.create({
        propertyId: land.id,
      });
      
      setRequestSuccess(true);
      setRequestError(null);
      await fetchData();
      
      setTimeout(() => {
        setRequestSuccess(false);
      }, 5000);
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } }; message?: string };
      const errorMessage = err.response?.data?.message ||
        err.message ||
        'Failed to submit request. Please try again.';
      setRequestError(errorMessage);
      setRequestSuccess(false);
    } finally {
      setRequesting(false);
    }
  };

  if (loading) {
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
          <span className="text-white">Land not found</span>
        </div>
      </DashboardLayout>
    );
  }

  const statusBadgeClass =
    land.status === 'available' ? 'badge-success' :
    land.status === 'locked' || land.status === 'payment_in_progress' ? 'badge-warning' :
    land.status === 'owned' || land.status === 'sold' ? 'badge-primary' : 'badge-ghost';

  return (
    <DashboardLayout navItems={navItems}>
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Back - outlined so it reads clearly as a button */}
        <button
          onClick={() => navigate(-1)}
          className="btn btn-outline btn-primary btn-sm gap-2 min-w-[7rem] flex items-center gap-2 border-2 text-white border-primary hover:bg-primary hover:text-primary-content"
        >
          <ArrowLeftIcon className="w-4 h-4 shrink-0" />
          Back
        </button>

        {/* Hero: Image + Title & key stats */}
        <div className="card bg-base-100 shadow-xl border border-base-300 overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-0">
            <figure className="relative h-56 lg:h-72 bg-base-300 shrink-0">
              {imageUrl ? (
                <img
                  src={imageUrl}
                  alt={land.title}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    const parent = target.parentElement;
                    if (parent) {
                      const fallback = document.createElement('div');
                      fallback.className = 'flex items-center justify-center h-full w-full bg-base-300';
                      fallback.innerHTML = '<span class="text-6xl">🏠</span>';
                      parent.appendChild(fallback);
                    }
                  }}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-base-content/40">
                  <PhotoIcon className="w-20 h-20" />
                </div>
              )}
              <div className="absolute top-3 right-3">
                <span className={`badge badge-lg ${statusBadgeClass} text-white`}>
                  {land.status.replace('_', ' ')}
                </span>
                {land.isResale && <span className="badge badge-warning badge-sm ml-1 text-white">Resale</span>}
              </div>
            </figure>
            <div className="lg:col-span-2 card-body justify-center">
              <h1 className="text-2xl lg:text-3xl font-bold text-white">{land.title}</h1>
              {land.unitId && (
                <p className="text-sm text-gray-400 font-mono">Land ID: {land.unitId}</p>
              )}
              <div className="flex flex-wrap gap-4 mt-2">
                <div className="flex items-center gap-2">
                  <MapPinIcon className="w-5 h-5 text-gray-500" />
                  <span className="text-white">{land.location}</span>
                </div>
                <div className="flex items-center gap-2">
                  <CurrencyDollarIcon className="w-5 h-5 text-primary" />
                  <span className="text-primary font-bold text-lg">PKR {land.price.toLocaleString()}</span>
                </div>
                <span className="text-white">{land.size} sq. ft</span>
              </div>
              {land.project?.name && (
                <div className="flex items-center gap-2 mt-2 text-gray-400">
                  <BuildingOfficeIcon className="w-4 h-4" />
                  <span>{land.project.name}</span>
                  {land.project.builder?.name && (
                    <span className="text-sm"> · Builder: {land.project.builder.name}</span>
                  )}
                </div>
              )}
              {/* Actions row */}
              <div className="card-actions mt-4 flex flex-wrap gap-2">
                {user?.role === 'user' && (land.status === 'available' || land.status === 'locked') && (
                  <button
                    onClick={handleRequestProperty}
                    className="btn btn-success text-white"
                    disabled={requesting}
                  >
                    {requesting ? (
                      <>
                        <span className="loading loading-spinner loading-sm"></span>
                        <span className="text-white">Requesting...</span>
                      </>
                    ) : (
                      <span className="text-white">Request Property</span>
                    )}
                  </button>
                )}
                {!user && (
                  <div className="alert alert-info">
                    <span className="text-white">Please login as a buyer to request this property.</span>
                    <Link to="/login" className="btn btn-sm btn-primary text-white">Login</Link>
                  </div>
                )}
                {canUpdate(land, user, payments) && (
                  <Link
                    to={`/dashboard/builder/update-land/${land.id}`}
                    className="btn btn-primary gap-2 min-w-[8rem] flex items-center gap-2 bg-primary text-primary-content hover:bg-primary/90 border-0"
                  >
                    <PencilIcon className="h-5 w-5 shrink-0" />
                    Update
                  </Link>
                )}
                {canDelete(land, user, payments) && (
                  <button
                    onClick={handleDelete}
                    className="btn gap-2 min-w-[8rem] flex items-center gap-2 bg-red-600 hover:bg-red-500 text-white border-0"
                    disabled={deleting}
                  >
                    {deleting ? (
                      <>
                        <span className="loading loading-spinner loading-sm shrink-0"></span>
                        Deleting...
                      </>
                    ) : (
                      <>
                        <TrashIcon className="h-5 w-5 shrink-0" />
                        Delete
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Alerts: request success / errors / delete error */}
        {requestSuccess && (
          <div className="alert alert-success">
            <CheckCircleIcon className="h-6 w-6" />
            <span className="text-gray-800">Property request submitted successfully at listed price (PKR {land?.price.toLocaleString() ?? '0'})</span>
            <button className="btn btn-sm btn-ghost text-gray-800" onClick={() => setRequestSuccess(false)}>✕</button>
          </div>
        )}
        {requestError && (
          <div className="alert alert-error">
            <ExclamationTriangleIcon className="h-6 w-6" />
            <span className="text-white">{requestError}</span>
            <button className="btn btn-sm btn-ghost text-white" onClick={() => setRequestError(null)}>✕</button>
          </div>
        )}
        {deleteError && (
          <div className="alert alert-error">
            <ExclamationTriangleIcon className="h-6 w-6" />
            <span className="text-white">{deleteError}</span>
            <button className="btn btn-sm btn-ghost text-white" onClick={() => setDeleteError(null)}>✕</button>
          </div>
        )}

        {/* Details grid: Agreement, Owner, Blockchain, Dates */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {land.agreementId && (
            <div className="card bg-base-100 shadow border border-base-300">
              <div className="card-body py-4">
                <h3 className="font-semibold text-white flex items-center gap-2">
                  <DocumentTextIcon className="w-5 h-5" />
                  Agreement
                </h3>
                <Link
                  to={user?.role === 'builder' ? `/dashboard/builder/agreements/${land.agreementId}` : `/dashboard/buyer/agreements/${land.agreementId}`}
                  className="link link-primary text-white"
                >
                  View agreement
                </Link>
                {land.agreementStatus && (
                  <span className="badge badge-ghost text-white">{land.agreementStatus}</span>
                )}
                {land.installmentPlanYears != null && (
                  <p className="text-sm text-gray-400">
                    {land.installmentPlanYears} yr plan · Paid: PKR {(land.totalPaid ?? 0).toLocaleString()} / Left: PKR {(land.remainingBalance ?? 0).toLocaleString()}
                  </p>
                )}
              </div>
            </div>
          )}
          {(land.currentOwner || land.owner) && (
            <div className="card bg-base-100 shadow border border-base-300">
              <div className="card-body py-4">
                <h3 className="font-semibold text-white">Owner</h3>
                <p className="text-white">
                  {(land.currentOwner ?? land.owner)?.name ?? '—'}
                </p>
                <p className="text-sm text-gray-400">{(land.currentOwner ?? land.owner)?.email}</p>
              </div>
            </div>
          )}
          {(land.blockchainLandId != null || land.blockchainTxHash) && (
            <div className="card bg-base-100 shadow border border-base-300 md:col-span-2">
              <div className="card-body py-4">
                <h3 className="font-semibold text-white flex items-center gap-2">
                  <CubeTransparentIcon className="w-5 h-5" />
                  Blockchain
                </h3>
                <div className="flex flex-wrap gap-4 text-sm">
                  {land.blockchainLandId != null && (
                    <span className="text-white">Land ID: <span className="font-mono">{land.blockchainLandId}</span></span>
                  )}
                  {land.blockchainTxHash && getBlockExplorerTxUrl(land.blockchainTxHash) && (
                    <a
                      href={getBlockExplorerTxUrl(land.blockchainTxHash)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="link link-primary text-white"
                    >
                      View transaction on explorer
                    </a>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
        {(land.createdAt || land.updatedAt) && (
          <p className="text-sm text-gray-500">
            {land.updatedAt ? `Updated ${new Date(land.updatedAt).toLocaleDateString()}` : `Registered ${new Date(land.createdAt!).toLocaleDateString()}`}
          </p>
        )}

        {/* File Integrity Verification */}
        <div className="card bg-base-100 shadow-xl border border-base-300">
          <div className="card-body">
            <h2 className="card-title text-white flex items-center gap-2">
              <ShieldCheckIcon className="w-6 h-6" />
              File Integrity Verification
            </h2>
            <p className="text-sm text-gray-400 mb-4">
              Verify that document and image files have not been tampered with.
            </p>

            {(land.documentCID || land.documentIPFSHash || land.documentHash || land.imageIPFSHash || land.imageHash) && (
              <div className="space-y-4">
                {/* Stored hashes */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {(land.documentHash || land.documentIPFSHash) && (
                    <div>
                      <p className="text-sm text-gray-400 mb-1">Document hash</p>
                      <p className="font-mono text-xs text-white break-all bg-base-200 p-3 rounded-lg">
                        {(() => {
                          try {
                            if (land.documentIPFSHash) {
                              const d = JSON.parse(land.documentIPFSHash);
                              return d?.hash ?? land.documentHash ?? 'N/A';
                            }
                            return land.documentHash ?? 'N/A';
                          } catch {
                            return land.documentHash ?? 'N/A';
                          }
                        })()}
                      </p>
                    </div>
                  )}
                  {(land.imageHash || land.imageIPFSHash) && (
                    <div>
                      <p className="text-sm text-gray-400 mb-1">Image hash</p>
                      <p className="font-mono text-xs text-white break-all bg-base-200 p-3 rounded-lg">
                        {(() => {
                          try {
                            if (land.imageIPFSHash) {
                              const d = JSON.parse(land.imageIPFSHash);
                              return d?.hash ?? land.imageHash ?? 'N/A';
                            }
                            return land.imageHash ?? 'N/A';
                          } catch {
                            return land.imageHash ?? 'N/A';
                          }
                        })()}
                      </p>
                    </div>
                  )}
                </div>

                {/* Verify buttons - all text white */}
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={handleVerifyIntegrity}
                    className="btn btn-primary text-white"
                    disabled={verificationStatus === 'checking' || !land.id}
                  >
                    {verificationStatus === 'checking' ? (
                      <>
                        <span className="loading loading-spinner loading-sm"></span>
                        <span className="text-white">Verifying...</span>
                      </>
                    ) : (
                      <span className="text-white">Verify integrity</span>
                    )}
                  </button>
                  {land.blockchainLandId != null && (
                    <button
                      onClick={handleVerifyBlockchain}
                      className="btn btn-outline btn-secondary text-white border-white"
                      disabled={blockchainVerificationStatus === 'checking' || !land.id}
                    >
                      {blockchainVerificationStatus === 'checking' ? (
                        <>
                          <span className="loading loading-spinner loading-sm"></span>
                          <span className="text-white">Verifying...</span>
                        </>
                      ) : (
                        <span className="text-white">Verify blockchain</span>
                      )}
                    </button>
                  )}
                </div>

                {verificationError && (
                  <div className="alert alert-error">
                    <ExclamationTriangleIcon className="h-6 w-6" />
                    <span className="text-white">{verificationError}</span>
                  </div>
                )}

                {/* File verification results */}
                {verificationStatus === 'completed' && verificationResult && (
                  <div className="space-y-3">
                    <div className={`alert ${verificationResult.verified ? 'alert-success' : 'alert-warning'}`}>
                      {verificationResult.verified ? <CheckCircleIcon className="h-6 w-6" /> : <ExclamationTriangleIcon className="h-6 w-6" />}
                      <span className={verificationResult.verified ? 'text-gray-800' : 'text-gray-800'}>{verificationResult.message}</span>
                    </div>
                    {verificationResult.document && (
                      <div className={`alert ${verificationResult.document.verified ? 'alert-success' : 'alert-error'}`}>
                        <div className="flex items-start gap-2">
                          {verificationResult.document.verified ? <CheckCircleIcon className="h-5 w-5 mt-0.5 flex-shrink-0" /> : <ExclamationTriangleIcon className="h-5 w-5 mt-0.5 flex-shrink-0" />}
                          <div className="flex-1">
                            <p className="font-semibold text-gray-800">Document</p>
                            <p className="text-sm text-gray-800">{verificationResult.document.message}</p>
                            <div className="mt-2 space-y-1 text-xs text-gray-700">
                              <p><span className="font-mono">Stored:</span> {verificationResult.document.storedHash.substring(0, 20)}...</p>
                              <p><span className="font-mono">Calculated:</span> {verificationResult.document.calculatedHash.substring(0, 20)}...</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                    {verificationResult.image && (
                      <div className={`alert ${verificationResult.image.verified ? 'alert-success' : 'alert-error'}`}>
                        <div className="flex items-start gap-2">
                          {verificationResult.image.verified ? <CheckCircleIcon className="h-5 w-5 mt-0.5 flex-shrink-0" /> : <ExclamationTriangleIcon className="h-5 w-5 mt-0.5 flex-shrink-0" />}
                          <div className="flex-1">
                            <p className="font-semibold text-gray-800">Image</p>
                            <p className="text-sm text-gray-800">{verificationResult.image.message}</p>
                            <div className="mt-2 space-y-1 text-xs text-gray-700">
                              <p><span className="font-mono">Stored:</span> {verificationResult.image.storedHash.substring(0, 20)}...</p>
                              <p><span className="font-mono">Calculated:</span> {verificationResult.image.calculatedHash.substring(0, 20)}...</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                    {!verificationResult.document && !verificationResult.image && (
                      <div className="alert alert-info">
                        <span className="text-white">No files available for verification.</span>
                      </div>
                    )}
                  </div>
                )}

                {blockchainVerificationError && (
                  <div className="alert alert-error">
                    <ExclamationTriangleIcon className="h-6 w-6" />
                    <span className="text-white">{blockchainVerificationError}</span>
                  </div>
                )}

                {blockchainVerificationStatus === 'completed' && blockchainVerificationResult && (
                  <div className="space-y-3">
                    <div className={`alert ${blockchainVerificationResult.verified ? 'alert-success' : 'alert-warning'}`}>
                      {blockchainVerificationResult.verified ? <CheckCircleIcon className="h-6 w-6" /> : <ExclamationTriangleIcon className="h-6 w-6" />}
                      <span className="text-gray-800">{blockchainVerificationResult.message}</span>
                    </div>
                    {blockchainVerificationResult.databaseHash && (
                      <div className="bg-base-200 p-4 rounded-lg text-white">
                        <p className="text-sm font-semibold mb-2 text-white">Hash comparison</p>
                        <div className="space-y-1 text-xs text-gray-300">
                          <p><span className="font-mono">Database:</span> {blockchainVerificationResult.databaseHash.substring(0, 32)}...</p>
                          {blockchainVerificationResult.blockchainHash && (
                            <p><span className="font-mono">Blockchain:</span> {blockchainVerificationResult.blockchainHash.substring(0, 32)}...</p>
                          )}
                          {blockchainVerificationResult.blockchainLandId != null && (
                            <p><span className="font-mono">Blockchain Land ID:</span> {blockchainVerificationResult.blockchainLandId}</p>
                          )}
                          {(blockchainVerificationResult.blockchainTxHash ?? blockchainVerificationResult.transactionHash ?? land?.blockchainTxHash) && (
                            <p className="mt-2">
                              <span className="font-mono">Transaction:</span>{' '}
                              <a
                                href={getBlockExplorerTxUrl(blockchainVerificationResult.blockchainTxHash ?? blockchainVerificationResult.transactionHash ?? land?.blockchainTxHash ?? undefined) ?? '#'}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="link link-primary text-white"
                              >
                                View on explorer
                              </a>
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <div className="divider text-gray-500"></div>

                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm text-gray-400">View document</p>
                  {documentUrl ? (
                    <a
                      href={documentUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-outline btn-sm text-white border-white flex items-center gap-2 "
                    >
                      <DocumentMagnifyingGlassIcon className="w-4 h-4 mr-1" />
                      <span className="text-white">Open document</span>
                    </a>
                  ) : (
                    <span className="text-sm text-gray-500">No document URL available</span>
                  )}
                </div>
              </div>
            )}

            {!land.documentCID && !land.documentIPFSHash && !land.documentHash && !land.imageIPFSHash && !land.imageHash && (
              <div className="alert alert-info">
                <span className="text-white">No files available for verification. This land has no document or image uploaded.</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

