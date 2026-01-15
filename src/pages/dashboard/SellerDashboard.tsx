import { useEffect, useState, useCallback } from 'react';
import { Link, useLocation } from 'react-router-dom';
import DashboardLayout from '../../components/layouts/DashboardLayout';
import {
  HomeIcon,
  FolderIcon,
  DocumentTextIcon,
  UserGroupIcon,
  CreditCardIcon,
  PencilIcon,
  TrashIcon,
  CurrencyDollarIcon,
  ArrowPathIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';
import { landAPI, paymentAPI, reservationAPI } from '../../services/api';
import { useAppSelector } from '../../store/hooks';
import type { Land, Payment, Reservation } from '../../types';
import { canUpdate, canDelete, getDeleteErrorMessage } from '../../utils/landPermissions';

export default function SellerDashboard() {
  const { user } = useAppSelector((state) => state.auth);
  const location = useLocation();
  
  // Determine navigation items based on current route
  // Note: SellerDashboard is accessed via /dashboard/seller which is for builders
  // But builder dashboard should be at /dashboard/builder
  const isBuilderRoute = location.pathname === '/dashboard/builder' || location.pathname.startsWith('/dashboard/builder/');
  
  const navItems = isBuilderRoute ? [
    { name: 'Overview', path: '/dashboard/builder', icon: HomeIcon },
    { name: 'Projects', path: '/dashboard/builder/projects', icon: FolderIcon },
    { name: 'Buyer Progress', path: '/dashboard/builder/buyers', icon: UserGroupIcon },
    { name: 'Payments', path: '/dashboard/builder/payments', icon: CreditCardIcon },
    { name: 'Property Requests', path: '/dashboard/builder/property-requests', icon: DocumentTextIcon },
    { name: 'Agreements', path: '/dashboard/builder/agreements', icon: DocumentTextIcon },
    { name: 'Installments', path: '/dashboard/builder/installments', icon: CurrencyDollarIcon },
    { name: 'Resale Requests', path: '/dashboard/builder/resale-requests', icon: ArrowPathIcon },
    { name: 'Pending Verifications', path: '/dashboard/builder/pending', icon: ClockIcon },
  ] : [
    { name: 'Overview', path: '/dashboard/seller', icon: HomeIcon },
    { name: 'My Lands', path: '/dashboard/seller/lands', icon: DocumentTextIcon },
    { name: 'Buyer Progress', path: '/dashboard/seller/buyers', icon: UserGroupIcon },
    { name: 'Payments', path: '/dashboard/seller/payments', icon: CreditCardIcon },
  ];
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [myLands, setMyLands] = useState<Land[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [stats, setStats] = useState({
    totalLands: 0,
    activeReservations: 0,
    totalRevenue: 0,
  });

  const fetchData = useCallback(async () => {
    if (!user?.id) return;
    
    try {
      setLoading(true);
      const [landsData, paymentsData, reservationsData] = await Promise.all([
        landAPI.getAll().catch(() => []),
        paymentAPI.getByBuyer().catch(() => []), // This might need to be seller-specific endpoint
        reservationAPI.getAll().catch(() => []),
      ]);

      // Handle paginated or array response
      const landsArray: Land[] = Array.isArray(landsData) 
        ? landsData 
        : ((landsData && typeof landsData === 'object' && 'data' in landsData ? (landsData as { data: Land[] }).data : null) || []);

      // Filter lands owned by current seller
      const sellerLands = landsArray.filter((land) => land.ownerId === user.id);
      setMyLands(sellerLands);

      // Filter payments for seller's lands
      const sellerLandIds = sellerLands.map((land) => land.id);
      const sellerPayments = (paymentsData || []).filter((payment) =>
        sellerLandIds.includes(payment.landId)
      );
      setPayments(sellerPayments);

      // Filter reservations for seller's lands
      const sellerReservations = (reservationsData || []).filter((reservation) =>
        sellerLandIds.includes(reservation.landId)
      );
      setReservations(sellerReservations);

      // Calculate stats
      const lockedLands = sellerLands.filter((l) => l.status === 'locked').length;
      const verifiedPayments = sellerPayments.filter((p) => p.status === 'verified');
      const totalRevenue = verifiedPayments.reduce((sum, p) => sum + p.amount, 0);

      setStats({
        totalLands: sellerLands.length,
        activeReservations: lockedLands,
        totalRevenue,
      });
    } catch (error) {
      console.error('Failed to fetch seller dashboard data:', error);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Refresh when navigating back from register/update land
  useEffect(() => {
    if (location.state?.refresh) {
      fetchData();
      // Clear the refresh flag
      window.history.replaceState({}, document.title);
    }
  }, [location.state, fetchData]);

  // Refresh when component comes into focus (e.g., after navigation back from register/update land)
  useEffect(() => {
    const handleFocus = () => {
      fetchData();
    };
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [fetchData]);

  const handleDelete = async (landId: string) => {
    if (!user) return;
    
    const land = myLands.find((l) => l.id === landId);
    if (!land) return;

    // Check permissions
    if (!canDelete(land, user, reservations, payments)) {
      const errorMsg = getDeleteErrorMessage(land, user, reservations, payments);
      setDeleteError(errorMsg || 'Cannot delete this land.');
      return;
    }

    if (!window.confirm(`Are you sure you want to delete "${land.title}"? This action cannot be undone.`)) {
      return;
    }

    setDeletingId(landId);
    setDeleteError(null);

    try {
      await landAPI.delete(landId);
      // Refresh all data after successful delete
      await fetchData();
    } catch (err: unknown) {
      const errorMessage: string =
        (err && typeof err === 'object' && 'response' in err && err.response && typeof err.response === 'object' && 'data' in err.response && err.response.data && typeof err.response.data === 'object' && 'message' in err.response.data ? String(err.response.data.message) : '') ||
        (err instanceof Error ? err.message : '') ||
        'Failed to delete land. Please try again.';
      setDeleteError(errorMessage);
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) {
    return (
      <DashboardLayout navItems={navItems}>
        <div className="flex items-center justify-center min-h-[400px]">
          <span className="loading loading-spinner loading-lg"></span>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout navItems={navItems}>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-white">Seller Dashboard</h1>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="stat bg-base-100 rounded-lg shadow border border-base-300">
            <div className="stat-title text-white">My Lands</div>
            <div className="stat-value text-primary">{stats.totalLands}</div>
            <div className="stat-desc text-white">Total properties</div>
          </div>

          <div className="stat bg-base-100 rounded-lg shadow border border-base-300">
            <div className="stat-title text-white">Active Reservations</div>
            <div className="stat-value text-secondary">{stats.activeReservations}</div>
            <div className="stat-desc text-white">Lands with buyers</div>
          </div>

          <div className="stat bg-base-100 rounded-lg shadow border border-base-300">
            <div className="stat-title text-white">Total Revenue</div>
            <div className="stat-value text-success">₹{stats.totalRevenue.toLocaleString()}</div>
            <div className="stat-desc text-white">From sales</div>
          </div>
        </div>

        {/* My Lands */}
        <div className="card bg-base-100 shadow-xl border border-base-300">
          <div className="card-body">
            <div className="flex justify-between items-center mb-4">
              <h2 className="card-title text-white">My Lands</h2>
              <Link to="/dashboard/seller/register-land" className="btn btn-primary w-content flex flex-col items-center justify-center">
                Register New Land
              </Link>
            </div>
            {deleteError && (
              <div className="alert alert-error mb-4">
                <span className="text-black">{deleteError}</span>
                <button
                  className="btn btn-sm btn-ghost text-black"
                  onClick={() => setDeleteError(null)}
                >
                  ✕
                </button>
              </div>
            )}
            {myLands.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-white">No lands registered yet.</p>
                <Link to="/dashboard/seller/register-land" className="btn btn-primary btn-sm mt-4">
                  Register Your First Land
                </Link>
              </div>
            ) : (
              <div className="overflow-x-auto ">
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
                    {myLands.map((land) => (
                      <tr key={land.id} className="text-black">
                        <td className="text-black">{land.title}</td>
                        <td className="text-black">{land.location}</td>
                        <td className="text-black">₹{land.price.toLocaleString()}</td>
                        <td>
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
                        <td>
                          <div className="flex gap-2 items-center justify-center">
                            <Link
                              to={`/lands/${land.id}`}
                                className="btn btn-xs btn-primary h-7 w-20"
                            >
                              View
                            </Link>
                            {canUpdate(land, user, reservations, payments) && (
                              <Link
                                to={`/dashboard/seller/update-land/${land.id}`}
                                className="btn btn-xs btn-secondary h-7 w-10"
                                title="Update Land"
                              >
                                <PencilIcon className="h-4 w-4" />
                              </Link>
                            )}
                            {canDelete(land, user, reservations, payments) && (
                              <button
                                onClick={() => handleDelete(land.id)}
                                className="btn btn-xs btn-error h-7 w-10"
                                disabled={deletingId === land.id}
                                title="Delete Land"
                              >
                                {deletingId === land.id ? (
                                  <span className="loading loading-spinner loading-xs"></span>
                                ) : (
                                  <TrashIcon className="h-4 w-4" />
                                )}
                              </button>
                            )}
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

        {/* Buyer Progress */}
        {myLands.filter((l) => l.status === 'locked').length > 0 && (
          <div className="card bg-base-100 shadow-xl border border-base-300">
            <div className="card-body">
              <h2 className="card-title text-white">Buyer Progress</h2>
              <div className="space-y-4 mt-4">
                {myLands
                  .filter((land) => land.status === 'locked')
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
                {myLands.filter((l) => l.status === 'locked').length === 0 && (
                  <p className="text-white text-center py-4">
                    No active reservations
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

