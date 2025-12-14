import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAppSelector } from '../store/hooks';
import { landAPI, paymentAPI } from '../services/api';
import type { Land, Payment, Reservation } from '../types';
import DashboardLayout from '../components/layouts/DashboardLayout';
import { HomeIcon, DocumentTextIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import { CheckCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/solid';
import { canUpdate, canDelete, getDeleteErrorMessage } from '../utils/landPermissions';

const navItems = [
  { name: 'Dashboard', path: '/dashboard', icon: HomeIcon },
  { name: 'Lands', path: '/dashboard/buyer/lands', icon: DocumentTextIcon },
];

/**
 * Helper function to get IPFS URL from hash JSON string
 * Parses the IPFS hash JSON and constructs the IPFS gateway URL
 */
const getIPFSUrl = (ipfsHashJson?: string): string | null => {
  if (!ipfsHashJson) return null;
  
  try {
    const hashData = JSON.parse(ipfsHashJson);
    if (hashData?.hash) {
      // Use ipfs.io gateway as requested
      return `https://ipfs.io/ipfs/${hashData.hash}`;
    }
  } catch (error) {
    console.error('Failed to parse IPFS hash:', error);
  }
  
  return null;
};

export default function LandDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAppSelector((state) => state.auth);
  const [land, setLand] = useState<Land | null>(null);
  const [loading, setLoading] = useState(true);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
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
  
  // Get IPFS URLs from hash JSON
  const imageIPFSUrl = land?.imageIPFSHash ? getIPFSUrl(land.imageIPFSHash) : null;
  const documentIPFSUrl = land?.documentIPFSHash ? getIPFSUrl(land.documentIPFSHash) : null;

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      try {
        const [landData, paymentsData] = await Promise.all([
          landAPI.getById(id),
          paymentAPI.getByBuyer().catch(() => []),
        ]);
        setLand(landData);
        
        // Filter payments for this land
        const landPayments = (paymentsData || []).filter((p) => p.landId === id);
        setPayments(landPayments);
        
        // Note: Reservations API not available yet
        setReservations([]);
      } catch (error) {
        console.error('Failed to fetch land:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  const handleDelete = async () => {
    if (!land || !user) return;

    // Check permissions
    if (!canDelete(land, user, reservations, payments)) {
      const errorMsg = getDeleteErrorMessage(land, user, reservations, payments);
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
      // Redirect to appropriate dashboard
      if (user.role === 'admin') {
        navigate('/dashboard/admin');
      } else if (user.role === 'seller') {
        navigate('/dashboard/seller');
      } else {
        navigate('/dashboard');
      }
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message ||
        err.message ||
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
    } catch (error: any) {
      console.error('Verification failed:', error);
      setVerificationError(
        error.response?.data?.message ||
        error.message ||
        'Failed to verify files. Please try again.'
      );
      setVerificationStatus('completed');
    }
  };

  const handleReserve = () => {
    // TODO: Implement reservation logic
    console.log('Reserve land:', id);
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

  return (
    <DashboardLayout navItems={navItems}>
      <div className="max-w-6xl mx-auto space-y-6">
        <button onClick={() => navigate(-1)} className="btn btn-primary btn-sm text-white">
          ← Back
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Image Gallery */}
          <div className="card bg-base-100 shadow-xl">
            <figure className="h-64 bg-base-200">
              {imageIPFSUrl ? (
                <img
                  src={imageIPFSUrl}
                  alt={land.title}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    // Fallback if image fails to load
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    const parent = target.parentElement;
                    if (parent) {
                      parent.innerHTML = '<div class="flex items-center justify-center h-full"><span class="text-6xl">🏠</span></div>';
                    }
                  }}
                />
              ) : (
                <div className="flex items-center justify-center h-full">
                  <span className="text-6xl">🏠</span>
                </div>
              )}
            </figure>
          </div>

          {/* Details */}
          <div className="card bg-base-100 shadow-xl">
            <div className="card-body">
              <h1 className="card-title text-3xl text-white">{land.title}</h1>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-white/70">Location</p>
                  <p className="font-semibold text-lg text-white">{land.location}</p>
                </div>
                <div>
                  <p className="text-sm text-white/70">Size</p>
                  <p className="font-semibold text-white">{land.size} sq. ft</p>
                </div>
                <div>
                  <p className="text-sm text-white/70">Price</p>
                  <p className="font-semibold text-2xl text-primary">₹{land.price.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm text-white/70">Status</p>
                  <span className={`badge badge-lg ${
                    land.status === 'available' ? 'badge-success' :
                    land.status === 'locked' ? 'badge-warning' : 'badge-error'
                  }`}>
                    {land.status}
                  </span>
                </div>
              </div>

              <div className="card-actions mt-4 flex gap-2 flex-wrap">
                {user?.role === 'buyer' && land.status === 'available' && (
                  <button onClick={handleReserve} className="btn btn-primary">
                    Reserve Now
                  </button>
                )}
                {canUpdate(land, user, reservations, payments) && (
                  <Link
                    to={`/dashboard/seller/update-land/${land.id}`}
                    className="btn btn-secondary"
                  >
                    <PencilIcon className="h-5 w-5 mr-2" />
                    Update
                  </Link>
                )}
                {canDelete(land, user, reservations, payments) && (
                  <button
                    onClick={handleDelete}
                    className="btn btn-error"
                    disabled={deleting}
                  >
                    {deleting ? (
                      <>
                        <span className="loading loading-spinner loading-sm"></span>
                        Deleting...
                      </>
                    ) : (
                      <>
                        <TrashIcon className="h-5 w-5 mr-2" />
                        Delete
                      </>
                    )}
                  </button>
                )}
              </div>
              {deleteError && (
                <div className="alert alert-error mt-4">
                  <ExclamationTriangleIcon className="h-6 w-6" />
                  <span>{deleteError}</span>
                  <button
                    className="btn btn-sm btn-ghost"
                    onClick={() => setDeleteError(null)}
                  >
                    ✕
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Verification Card */}
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <h2 className="card-title text-white">File Integrity Verification</h2>
            <p className="text-sm text-white/60 mb-4">
              Verify that document and image files have not been tampered with
            </p>
            
            {(land.documentCID || land.documentIPFSHash || land.imageIPFSHash) && (
              <div className="space-y-4">
                {/* Hash Display */}
                <div className="space-y-2">
                  {land.documentIPFSHash && (
                    <div>
                      <p className="text-sm text-white/70 mb-1">Document Hash</p>
                      <p className="font-mono text-xs text-white break-all bg-base-200 p-2 rounded">
                        {(() => {
                          try {
                            const hashData = JSON.parse(land.documentIPFSHash);
                            return hashData?.hash || 'N/A';
                          } catch {
                            return land.documentHash || 'N/A';
                          }
                        })()}
                      </p>
                    </div>
                  )}
                  {land.imageIPFSHash && (
                    <div>
                      <p className="text-sm text-white/70 mb-1">Image Hash</p>
                      <p className="font-mono text-xs text-white break-all bg-base-200 p-2 rounded">
                        {(() => {
                          try {
                            const hashData = JSON.parse(land.imageIPFSHash);
                            return hashData?.hash || 'N/A';
                          } catch {
                            return 'N/A';
                          }
                        })()}
                      </p>
                    </div>
                  )}
                </div>

                {/* Verify Button */}
                <div className="flex justify-end">
                  <button
                    onClick={handleVerifyIntegrity}
                    className="btn btn-outline btn-primary text-white"
                    disabled={verificationStatus === 'checking' || !land.id}
                  >
                    {verificationStatus === 'checking' ? (
                      <>
                        <span className="loading loading-spinner loading-sm"></span>
                        Verifying...
                      </>
                    ) : (
                      'Verify Integrity'
                    )}
                  </button>
                </div>

                {/* Verification Error */}
                {verificationError && (
                  <div className="alert alert-error">
                    <ExclamationTriangleIcon className="h-6 w-6" />
                    <span>{verificationError}</span>
                  </div>
                )}

                {/* Verification Results */}
                {verificationStatus === 'completed' && verificationResult && (
                  <div className="space-y-3">
                    {/* Overall Status */}
                    <div className={`alert ${
                      verificationResult.verified ? 'alert-success' : 'alert-warning'
                    }`}>
                      {verificationResult.verified ? (
                        <CheckCircleIcon className="h-6 w-6" />
                      ) : (
                        <ExclamationTriangleIcon className="h-6 w-6" />
                      )}
                      <span>{verificationResult.message}</span>
                    </div>

                    {/* Document Verification Result */}
                    {verificationResult.document && (
                      <div className={`alert ${
                        verificationResult.document.verified ? 'alert-success' : 'alert-error'
                      }`}>
                        <div className="flex items-start gap-2">
                          {verificationResult.document.verified ? (
                            <CheckCircleIcon className="h-5 w-5 mt-0.5 flex-shrink-0" />
                          ) : (
                            <ExclamationTriangleIcon className="h-5 w-5 mt-0.5 flex-shrink-0" />
                          )}
                          <div className="flex-1">
                            <p className="font-semibold">Document</p>
                            <p className="text-sm">{verificationResult.document.message}</p>
                            <div className="mt-2 space-y-1">
                              <p className="text-xs opacity-80">
                                <span className="font-mono">Stored:</span> {verificationResult.document.storedHash.substring(0, 16)}...
                              </p>
                              <p className="text-xs opacity-80">
                                <span className="font-mono">Calculated:</span> {verificationResult.document.calculatedHash.substring(0, 16)}...
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Image Verification Result */}
                    {verificationResult.image && (
                      <div className={`alert ${
                        verificationResult.image.verified ? 'alert-success' : 'alert-error'
                      }`}>
                        <div className="flex items-start gap-2">
                          {verificationResult.image.verified ? (
                            <CheckCircleIcon className="h-5 w-5 mt-0.5 flex-shrink-0" />
                          ) : (
                            <ExclamationTriangleIcon className="h-5 w-5 mt-0.5 flex-shrink-0" />
                          )}
                          <div className="flex-1">
                            <p className="font-semibold">Image</p>
                            <p className="text-sm">{verificationResult.image.message}</p>
                            <div className="mt-2 space-y-1">
                              <p className="text-xs opacity-80">
                                <span className="font-mono">Stored:</span> {verificationResult.image.storedHash.substring(0, 16)}...
                              </p>
                              <p className="text-xs opacity-80">
                                <span className="font-mono">Calculated:</span> {verificationResult.image.calculatedHash.substring(0, 16)}...
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* No Files Available */}
                    {!verificationResult.document && !verificationResult.image && (
                      <div className="alert alert-info">
                        <span>No files available for verification</span>
                      </div>
                    )}
                  </div>
                )}

                <div className="divider"></div>

                <div>
                  <p className="text-sm text-white/70 mb-2">View Document</p>
                  {documentIPFSUrl ? (
                    <a
                      href={documentIPFSUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-outline btn-secondary text-white"
                    >
                      Open Document (IPFS)
                    </a>
                  ) : (
                    <p className="text-sm text-white/60">Document IPFS hash not available</p>
                  )}
                </div>
              </div>
            )}

            {!land.documentCID && !land.documentIPFSHash && !land.imageIPFSHash && (
              <div className="alert alert-info">
                <span>No files available for verification. This land has no document or image uploaded.</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

