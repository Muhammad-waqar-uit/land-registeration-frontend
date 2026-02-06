import DashboardLayout from '../../components/layouts/DashboardLayout';
import {
  ExclamationTriangleIcon,
  FolderIcon,
} from '@heroicons/react/24/outline';
import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { paymentAPI, builderAPI, landAPI } from '../../services/api';
import { useAppSelector } from '../../store/hooks';
import type { Payment, User, Land } from '../../types';
import { builderNavItems } from '../../constants/navigation';

export default function BuilderDashboard() {
  const { user, isLoading: authLoading } = useAppSelector((state) => state.auth);
  const [builderProfile, setBuilderProfile] = useState<User | null>(null);
  const [pendingPayments, setPendingPayments] = useState<Payment[]>([]);
  const [myLands, setMyLands] = useState<Land[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [verifying, setVerifying] = useState<string | null>(null);
  const [stats, setStats] = useState({
    totalLands: 0,
    totalRevenue: 0,
    totalProjects: 0,
  });

  const fetchData = useCallback(async () => {
    // Wait for user to be loaded before fetching
    if (!user?.id) {
      setLoading(true);
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      const [profile, pendingPaymentsData, landsData, statsData] = await Promise.all([
        builderAPI.getMe().catch(() => null),
        paymentAPI.getPending().catch(() => []),
        landAPI.getAll({ ownerId: user.id, limit: 500 }).catch(() => []),
        builderAPI.getStats().catch(() => ({ totalLands: 0, totalRevenue: 0, totalProjects: 0 })),
      ]);

      setBuilderProfile(profile);
      setPendingPayments(pendingPaymentsData);
      setStats(statsData);

      // Handle paginated or array response for lands
      const landsArray: Land[] = Array.isArray(landsData)
        ? landsData
        : ((landsData && typeof landsData === 'object' && 'data' in landsData ? (landsData as { data: Land[] }).data : null) || []);

      // Filter lands owned by current builder
      const builderLands = landsArray.filter((land) => land.ownerId === user.id);
      setMyLands(builderLands);

      // Fetch payments for builder's lands (for Recent Payments and locked lands sections)
      const builderLandIds = builderLands.map((land) => land.id);
      const allPaymentsForLands = await Promise.all(
        builderLandIds.map((lid) => paymentAPI.getByProperty(lid).catch(() => []))
      );
      const builderPayments = allPaymentsForLands.flat().filter(Boolean) as Payment[];
      setPayments(builderPayments);
    } catch (err: unknown) {
      console.error('Failed to load data:', err);
      const errorMessage = err && typeof err === 'object' && 'response' in err
        ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
        : undefined;
      setError(errorMessage || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    // Only fetch data when user is loaded (not during auth loading)
    if (!authLoading && user?.id) {
      fetchData();
    } else if (!authLoading && !user) {
      setLoading(false);
    }
  }, [fetchData, authLoading, user]);

  const handleVerify = async (paymentId: string, verified: boolean) => {
    try {
      setVerifying(paymentId);
      const remarks = verified ? 'Payment verified successfully' : 'Payment proof is unclear';
      await paymentAPI.verify(paymentId, verified, remarks);
      // Reload payments after verification
      await fetchData();
    } catch (err: unknown) {
      console.error('Failed to verify payment:', err);
      const errorMessage = err && typeof err === 'object' && 'response' in err
        ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
        : undefined;
      alert(errorMessage || 'Failed to verify payment');
    } finally {
      setVerifying(null);
    }
  };

  // Show loading while auth is loading or data is loading
  if (authLoading || loading) {
    return (
      <DashboardLayout navItems={builderNavItems}>
        <div className="flex justify-center items-center h-64">
          <span className="loading loading-spinner loading-lg"></span>
        </div>
      </DashboardLayout>
    );
  }

  // Show verification pending message if builder is not verified
  if (builderProfile && !builderProfile.isBuilderVerified) {
    return (
      <DashboardLayout navItems={builderNavItems}>
        <div className="space-y-6">
          <h1 className="text-3xl font-bold text-white">Builder Dashboard</h1>
          
          {/* Verification Pending Alert */}
          <div className="alert alert-warning shadow-lg">
            <ExclamationTriangleIcon className="h-6 w-6" />
            <div>
              <h3 className="font-bold text-white">Verification Pending</h3>
              <div className="text-sm text-white">
                Your builder account is pending verification by an administrator. 
                You will be able to access all builder features once your account is verified.
              </div>
            </div>
          </div>

          {/* Profile Info Card */}
          <div className="card bg-base-100 shadow-xl">
            <div className="card-body">
              <h2 className="card-title text-white">Your Profile Information</h2>
              <div className="space-y-2">
                <p className="text-white"><span className="font-semibold">Name:</span> {builderProfile.name}</p>
                <p className="text-white"><span className="font-semibold">Email:</span> {builderProfile.email}</p>
                <p className="text-white"><span className="font-semibold">Company:</span> {builderProfile.companyName}</p>
                <div className="flex items-center gap-2 mt-4">
                  <span className="badge badge-warning">Not Verified</span>
                </div>
              </div>
            </div>
          </div>

          {/* What's Next */}
          <div className="card bg-base-100 shadow-xl">
            <div className="card-body">
              <h2 className="card-title text-white">What happens next?</h2>
              <ul className="list-disc list-inside space-y-2 text-white">
                <li>An administrator will review your information</li>
                <li>You will be notified when your account is verified</li>
                <li>Once verified, you can create projects and list properties</li>
                <li>You will be able to manage property requests and sales</li>
              </ul>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout navItems={builderNavItems}>
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <h1 className="text-4xl font-bold text-white">Builder Dashboard</h1>
          <Link to="/dashboard/builder/projects" className="btn btn-primary gap-2 flex items-center justify-center w-full sm:w-auto">
            <FolderIcon className="w-5 h-5 flex-shrink-0" />
            <span>My Projects</span>
          </Link>
        </div>

        {error && (
          <div className="alert alert-error">
            <span className="text-white">{error}</span>
            <button className="btn btn-sm" onClick={fetchData}>
              Retry
            </button>
          </div>
        )}

        {/* Overview - Combined Stats and Pending Verifications */}
        <div className="card bg-base-100 shadow-xl border border-base-300">
          <div className="card-body">
            <h2 className="card-title text-white mb-4">Overview</h2>
            
            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="stat bg-base-200 rounded-lg shadow border border-base-300">
                <div className="stat-title text-white">My Lands</div>
                <div className="stat-value text-primary text-3xl">{stats.totalLands}</div>
                <div className="stat-desc text-white">Total properties</div>
              </div>

              <div className="stat bg-base-200 rounded-lg shadow border border-base-300">
                <div className="stat-title text-white">Total Revenue</div>
                <div className="stat-value text-success text-3xl">PKR {stats.totalRevenue.toLocaleString()}</div>
                <div className="stat-desc text-white">From sales</div>
              </div>

              <div className="stat bg-base-200 rounded-lg shadow border border-base-300">
                <div className="stat-title text-white">Total Projects</div>
                <div className="stat-value text-info text-3xl">{stats.totalProjects}</div>
                <div className="stat-desc text-white">My projects</div>
              </div>
            </div>

            {/* Pending Verifications */}
            <div className="divider"></div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold text-white">Pending Verifications</h3>
              <Link to="/dashboard/builder/pending" className="btn btn-ghost btn-sm text-white">
                View All
              </Link>
            </div>
            {pendingPayments.length === 0 ? (
              <p className="text-gray-400">No pending payments to verify.</p>
            ) : (
              <div className="overflow-x-auto text-black">
                <table className="table">
                  <thead>
                    <tr>
                      <th className="text-black">Land</th>
                      <th className="text-black">Buyer</th>
                      <th className="text-black">Amount</th>
                      <th className="text-black">Payment Mode</th>
                      <th className="text-black">Proof</th>
                      <th className="text-black">Due Date</th>
                      <th className="text-black">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pendingPayments.map((payment) => (
                      <tr key={payment.id}>
                        <td className="text-black">
                          <div className="font-medium">{payment.land?.title || payment.landId}</div>
                          {payment.land?.location && (
                            <div className="text-xs text-gray-600">{payment.land.location}</div>
                          )}
                        </td>
                        <td className="text-black">
                          <div className="font-medium">{payment.buyer?.name || 'Unknown'}</div>
                          {payment.buyer?.email && (
                            <div className="text-xs text-gray-600">{payment.buyer.email}</div>
                          )}
                        </td>
                        <td className="text-black">PKR {payment.amount.toLocaleString()}</td>
                        <td className="text-black">
                          <span className={`badge ${payment.paymentMode === 'points' ? 'badge-info' : 'badge-primary'}`}>
                            {payment.paymentMode === 'points' ? 'Points' : 'Bank'}
                          </span>
                        </td>
                        <td className="text-black">
                          {payment.proofCID ? (
                            <a
                              href={`http://localhost:3000/uploads/${payment.proofCID}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="link link-primary text-black"
                            >
                              View Proof
                            </a>
                          ) : (
                            <span className="text-gray-500">No proof</span>
                          )}
                        </td>
                        <td className="text-black">{new Date(payment.dueDate).toLocaleDateString()}</td>
                        <td>
                          <div className="flex gap-2 items-center">
                            <button
                              className="btn btn-success btn-xs"
                              onClick={() => handleVerify(payment.id, true)}
                              disabled={verifying === payment.id}
                            >
                              {verifying === payment.id ? (
                                <span className="loading loading-spinner loading-xs"></span>
                              ) : (
                                '✓ Verify'
                              )}
                            </button>
                            <button
                              className="btn btn-error btn-xs"
                              onClick={() => handleVerify(payment.id, false)}
                              disabled={verifying === payment.id}
                            >
                              {verifying === payment.id ? (
                                <span className="loading loading-spinner loading-xs"></span>
                              ) : (
                                '✗ Reject'
                              )}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* My Lands */}
        <div className="card bg-base-100 shadow-xl border border-base-300">
          <div className="card-body">
            <div className="flex justify-between items-center mb-4">
              <h2 className="card-title text-white">My Lands</h2>
              <Link to="/dashboard/builder/projects" className="btn btn-primary text-white">
                Create Project
              </Link>
            </div>
            {myLands.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-white">No lands registered yet.</p>
                <Link to="/dashboard/builder/projects" className="btn btn-primary btn-sm mt-4 text-white">
                  Create Your First Project
                </Link>
              </div>
            ) : (
              <div className="overflow-x-auto text-black">
                <table className="table">
                  <thead className="bg-transparent">
                    <tr>
                      <th className="text-black">Title</th>
                      <th className="text-black">Location</th>
                      <th className="text-black">Price</th>
                      <th className="text-black">Status</th>
                      <th className="text-black">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {myLands.slice(0, 5).map((land) => (
                      <tr key={land.id}>
                        <td className="text-black">{land.title}</td>
                        <td className="text-black">{land.location}</td>
                        <td className="text-black">PKR {land.price.toLocaleString()}</td>
                        <td className="text-black">
                          <span
                            className={`badge ${
                              land.status === 'available'
                                ? 'badge-success'
                                : land.status === 'locked'
                                ? 'badge-warning'
                                : 'badge-error'
                            }`}
                          >
                            {land.status}
                          </span>
                        </td>
                        <td className="text-black">
                          <Link
                            to={`/dashboard/builder/lands/${land.id}`}
                            className="btn btn-xs btn-primary text-white flex flex-row items-center gap-2 w-20"
                          >
                            View
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Buyer Progress */}
        {myLands.filter((l) => l.status === 'locked').length > 0 && (
          <div className="card bg-base-100 shadow-xl border border-base-300">
            <div className="card-body">
              <div className="flex justify-between items-center mb-4">
                <h2 className="card-title text-white">Buyer Progress</h2>
                <Link to="/dashboard/builder/buyers" className="btn btn-ghost btn-sm text-white">
                  View All
                </Link>
              </div>
              <div className="space-y-4 mt-4">
                {myLands
                  .filter((land) => land.status === 'locked')
                  .slice(0, 3)
                  .map((land) => {
                    const landPayments = payments.filter((p) => p.landId === land.id);
                    const verifiedPayments = landPayments.filter((p) => p.status === 'verified');
                    const totalInstallments = 5; // This should come from backend
                    const paidInstallments = verifiedPayments.length;
                    const progress = (paidInstallments / totalInstallments) * 100;

                    return (
                      <div
                        key={land.id}
                        className="flex items-center justify-between p-4 bg-base-200 rounded-lg border border-base-300"
                      >
                        <div>
                          <p className="font-semibold text-white">{land.title}</p>
                          <p className="text-sm text-white">
                            {landPayments.length > 0
                              ? `Payments: ${paidInstallments}/${totalInstallments}`
                              : 'No payments yet'}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-white">
                            Installments Paid: {paidInstallments}/{totalInstallments}
                          </p>
                          <progress
                            className="progress progress-primary w-32"
                            value={progress}
                            max="100"
                          ></progress>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>
        )}

        {/* Payments */}
        {payments.length > 0 && (
          <div className="card bg-base-100 shadow-xl border border-base-300">
            <div className="card-body">
              <div className="flex justify-between items-center mb-4">
                <h2 className="card-title text-white">Recent Payments</h2>
                <Link to="/dashboard/builder/payments" className="btn btn-ghost btn-sm text-white">
                  View All
                </Link>
              </div>
              <div className="overflow-x-auto text-black">
                <table className="table">
                  <thead>
                    <tr>
                      <th className="text-black">Land</th>
                      <th className="text-black">Buyer</th>
                      <th className="text-black">Amount</th>
                      <th className="text-black">Status</th>
                      <th className="text-black">Due Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payments.slice(0, 5).map((payment) => (
                      <tr key={payment.id}>
                        <td className="text-black">
                          <div className="font-medium">{payment.land?.title || payment.landId.slice(0, 8)}...</div>
                          {payment.land?.location && (
                            <div className="text-xs text-gray-600">{payment.land.location}</div>
                          )}
                        </td>
                        <td className="text-black">
                          <div className="font-medium">{payment.buyer?.name || 'Unknown'}</div>
                          {payment.buyer?.email && (
                            <div className="text-xs text-gray-600">{payment.buyer.email}</div>
                          )}
                        </td>
                        <td className="text-black">PKR {payment.amount.toLocaleString()}</td>
                        <td className="text-black">
                          <span
                            className={`badge ${
                              payment.status === 'verified'
                                ? 'badge-success'
                                : payment.status === 'rejected'
                                ? 'badge-error'
                                : 'badge-warning'
                            }`}
                          >
                            {payment.status}
                          </span>
                        </td>
                        <td className="text-black">{new Date(payment.dueDate).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

      </div>
    </DashboardLayout>
  );
}

