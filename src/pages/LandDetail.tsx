import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppSelector } from '../store/hooks';
import { landAPI } from '../services/api';
import type { Land } from '../types';
import DashboardLayout from '../components/layouts/DashboardLayout';
import { HomeIcon, DocumentTextIcon } from '@heroicons/react/24/outline';
import { CheckCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/solid';

const navItems = [
  { name: 'Dashboard', path: '/dashboard', icon: HomeIcon },
  { name: 'Lands', path: '/dashboard/buyer/lands', icon: DocumentTextIcon },
];

export default function LandDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAppSelector((state) => state.auth);
  const [land, setLand] = useState<Land | null>(null);
  const [loading, setLoading] = useState(true);
  const [verificationStatus, setVerificationStatus] = useState<'verified' | 'tampered' | 'checking' | null>(null);

  useEffect(() => {
    const fetchLand = async () => {
      if (!id) return;
      try {
        const data = await landAPI.getById(id);
        setLand(data);
      } catch (error) {
        console.error('Failed to fetch land:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchLand();
  }, [id]);

  const handleVerifyIntegrity = async () => {
    if (!land?.documentCID) return;
    
    setVerificationStatus('checking');
    // TODO: Implement document hash verification
    // This would re-hash the document and compare with blockchain
    setTimeout(() => {
      setVerificationStatus('verified'); // Mock result
    }, 2000);
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
          <span>Land not found</span>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout navItems={navItems}>
      <div className="max-w-6xl mx-auto space-y-6">
        <button onClick={() => navigate(-1)} className="btn btn-ghost btn-sm">
          ← Back
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Image Gallery */}
          <div className="card bg-base-100 shadow-xl">
            <figure className="h-64 bg-base-200">
              <div className="flex items-center justify-center h-full">
                <span className="text-6xl">🏠</span>
              </div>
            </figure>
          </div>

          {/* Details */}
          <div className="card bg-base-100 shadow-xl">
            <div className="card-body">
              <h1 className="card-title text-3xl">{land.title}</h1>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-base-content/70">Location</p>
                  <p className="font-semibold text-lg">{land.location}</p>
                </div>
                <div>
                  <p className="text-sm text-base-content/70">Size</p>
                  <p className="font-semibold">{land.size} sq. ft</p>
                </div>
                <div>
                  <p className="text-sm text-base-content/70">Price</p>
                  <p className="font-semibold text-2xl text-primary">₹{land.price.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm text-base-content/70">Status</p>
                  <span className={`badge badge-lg ${
                    land.status === 'available' ? 'badge-success' :
                    land.status === 'locked' ? 'badge-warning' : 'badge-error'
                  }`}>
                    {land.status}
                  </span>
                </div>
              </div>

              {user?.role === 'buyer' && land.status === 'available' && (
                <div className="card-actions mt-4">
                  <button onClick={handleReserve} className="btn btn-primary btn-block">
                    Reserve Now
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Document Card */}
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <h2 className="card-title">Document Verification</h2>
            
            {land.documentCID && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-base-content/70">Document Hash</p>
                    <p className="font-mono text-xs">{land.documentHash || 'N/A'}</p>
                  </div>
                  <button
                    onClick={handleVerifyIntegrity}
                    className="btn btn-outline btn-primary"
                    disabled={verificationStatus === 'checking'}
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

                {verificationStatus && (
                  <div className={`alert ${
                    verificationStatus === 'verified' ? 'alert-success' : 'alert-warning'
                  }`}>
                    {verificationStatus === 'verified' ? (
                      <>
                        <CheckCircleIcon className="h-6 w-6" />
                        <span>Document integrity verified ✓</span>
                      </>
                    ) : (
                      <>
                        <ExclamationTriangleIcon className="h-6 w-6" />
                        <span>Document may have been tampered ⚠️</span>
                      </>
                    )}
                  </div>
                )}

                <div className="divider"></div>

                <div>
                  <p className="text-sm text-base-content/70 mb-2">View Document</p>
                  <a
                    href={`https://ipfs.io/ipfs/${land.documentCID}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-outline btn-secondary"
                  >
                    Open Document (IPFS)
                  </a>
                </div>
              </div>
            )}

            {!land.documentCID && (
              <div className="alert alert-info">
                <span>No document available</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

