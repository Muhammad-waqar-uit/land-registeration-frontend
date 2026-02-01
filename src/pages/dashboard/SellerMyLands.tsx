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
  MagnifyingGlassIcon,
  ArrowPathIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';
import { landAPI, paymentAPI } from '../../services/api';
import { useAppSelector } from '../../store/hooks';
import type { Land, Payment } from '../../types';
import { canUpdate, canDelete, getDeleteErrorMessage } from '../../utils/landPermissions';

export default function SellerMyLands() {
  const { user, isLoading: authLoading } = useAppSelector((state) => state.auth);
  const location = useLocation();
  
  // Determine navigation items based on current route
  const isBuilderRoute = location.pathname.startsWith('/dashboard/builder');
  
  const navItems = isBuilderRoute ? [
    { name: 'Overview', path: '/dashboard/builder', icon: HomeIcon },
    { name: 'Projects', path: '/dashboard/builder/projects', icon: FolderIcon },
    { name: 'Buyer Progress', path: '/dashboard/builder/buyers', icon: UserGroupIcon },
    { name: 'Payments', path: '/dashboard/builder/payments', icon: CreditCardIcon },
    { name: 'Property Requests', path: '/dashboard/builder/property-requests', icon: DocumentTextIcon },
    { name: 'Agreements', path: '/dashboard/builder/agreements', icon: DocumentTextIcon },
    { name: 'Resale Requests', path: '/dashboard/builder/resale-requests', icon: ArrowPathIcon },
    { name: 'Pending Verifications', path: '/dashboard/builder/pending', icon: ClockIcon },
  ] : [
    { name: 'Overview', path: '/dashboard/seller', icon: HomeIcon },
    { name: 'My Lands', path: '/dashboard/seller/lands', icon: DocumentTextIcon },
    { name: 'Buyer Progress', path: '/dashboard/seller/buyers', icon: UserGroupIcon },
    { name: 'Payments', path: '/dashboard/seller/payments', icon: CreditCardIcon },
  ];
  const [loading, setLoading] = useState(true);
  const [myLands, setMyLands] = useState<Land[]>([]);
  const [filteredLands, setFilteredLands] = useState<Land[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'available' | 'locked' | 'sold'>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  const fetchData = useCallback(async () => {
    // Wait for user to be loaded before fetching
    if (!user?.id) {
      setLoading(true);
      return;
    }
    
    try {
      setLoading(true);
      const [landsData, paymentsData] = await Promise.all([
        landAPI.getAll().catch(() => []),
        paymentAPI.getByBuyer().catch(() => []),
      ]);

      // Handle paginated or array response
      const landsArray: Land[] = Array.isArray(landsData) 
        ? landsData 
        : ((landsData && typeof landsData === 'object' && 'data' in landsData ? (landsData as { data: Land[] }).data : null) || []);

      // Filter lands owned by current seller
      const sellerLands = landsArray.filter((land) => land.ownerId === user.id);
      setMyLands(sellerLands);
      setFilteredLands(sellerLands);

      // Filter payments for seller's lands
      const sellerLandIds = sellerLands.map((land) => land.id);
      const sellerPayments = (paymentsData || []).filter((payment) =>
        sellerLandIds.includes(payment.landId)
      );
      setPayments(sellerPayments);
    } catch (error) {
      console.error('Failed to fetch seller lands data:', error);
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

  // Filter lands based on search and status
  useEffect(() => {
    let filtered = [...myLands];

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter((land) => land.status === statusFilter);
    }

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (land) =>
          land.title.toLowerCase().includes(query) ||
          land.location.toLowerCase().includes(query) ||
          land.id.toLowerCase().includes(query)
      );
    }

    setFilteredLands(filtered);
  }, [myLands, searchQuery, statusFilter]);

  const handleDelete = async (landId: string) => {
    if (!user) return;
    
    const land = myLands.find((l) => l.id === landId);
    if (!land) return;

    // Check permissions
    if (!canDelete(land, user, payments)) {
      const errorMsg = getDeleteErrorMessage(land, user, payments);
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

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'available':
        return 'badge-success';
      case 'locked':
        return 'badge-warning';
      case 'sold':
        return 'badge-error';
      default:
        return 'badge-ghost';
    }
  };

  const getLandPaymentInfo = (landId: string) => {
    const landPayments = payments.filter((p) => p.landId === landId);
    const verifiedPayments = landPayments.filter((p) => p.status === 'verified');
    const totalPaid = verifiedPayments.reduce((sum, p) => sum + p.amount, 0);
    return { totalPayments: landPayments.length, totalPaid, verifiedPayments: verifiedPayments.length };
  };

  // Show loading while auth is loading or data is loading
  if (authLoading || loading) {
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
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-white">My Lands</h1>
          <Link to="/dashboard/seller/register-land" className="btn btn-primary">
            Register New Land
          </Link>
        </div>

        {/* Filters and Search */}
        <div className="card bg-base-100 shadow border border-base-300">
          <div className="card-body">
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
              {/* Search */}
                <label className="input input-bordered flex items-center gap-2 border-white border-2">
                  <MagnifyingGlassIcon className="w-4 h-4 opacity-70" />
                  <input
                    type="text"
                    className="grow text-white "
                    placeholder="Search by title, location, or ID..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </label>

              {/* Status Filter */}
                <select
                  className="select select-bordered text-white border-2 border-white"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as 'all' | 'available' | 'locked' | 'sold')}
                >
                  <option value="all">All Status</option>
                  <option value="available">Available</option>
                  <option value="locked">Locked</option>
                  <option value="sold">Sold</option>
                </select>

              {/* View Mode Toggle */}
              <div className="btn-group">
                <button
                  className={`btn ${viewMode === 'grid' ? 'btn-active' : ''} text-white border-2 border-white`}
                  onClick={() => setViewMode('grid')}
                >
                  Grid
                </button>
                <button
                  className={`btn ${viewMode === 'table' ? 'btn-active' : ''} text-white border-2 border-white`}
                  onClick={() => setViewMode('table')}
                >
                  Table
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {deleteError && (
          <div className="alert alert-error">
            <span className="text-black">{deleteError}</span>
            <button
              className="btn btn-sm btn-ghost text-black"
              onClick={() => setDeleteError(null)}
            >
              ✕
            </button>
          </div>
        )}

        {/* Results Count */}
        <div className="text-sm text-white">
          Showing {filteredLands.length} of {myLands.length} lands
        </div>

        {/* Lands Display */}
        {filteredLands.length === 0 ? (
          <div className="card bg-base-100 shadow-xl border border-base-300">
            <div className="card-body text-center py-12">
              {myLands.length === 0 ? (
                <>
                  <p className="text-white text-lg">No lands registered yet.</p>
                  <Link to="/dashboard/seller/register-land" className="btn btn-primary btn-sm mt-4">
                    Register Your First Land
                  </Link>
                </>
              ) : (
                <p className="text-white text-lg">No lands match your search criteria.</p>
              )}
            </div>
          </div>
        ) : viewMode === 'grid' ? (
          /* Grid View */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredLands.map((land) => {
              const paymentInfo = getLandPaymentInfo(land.id);

              return (
                <div key={land.id} className="card bg-base-100 shadow-xl border border-base-300 hover:shadow-2xl transition-shadow">
                  <div className="card-body">
                    <div className="flex justify-between items-start mb-2">
                      <h2 className="card-title text-white">{land.title}</h2>
                      <span className={`badge ${getStatusBadgeClass(land.status)}`}>
                        {land.status}
                      </span>
                    </div>
                    
                    <p className="text-white text-sm mb-4">
                      <span className="font-semibold">Location:</span> {land.location}
                    </p>

                    <div className="space-y-2 mb-4">
                      <div className="flex text-sm text-white">
                        <span className="text-white mr-2">Size:</span>
                        <span className="text-white font-semibold">{land.size} sq ft</span>
                      </div>
                      <div className="flex  text-sm text-white">
                        <span className="text-white mr-2">Price:</span>
                        <span className="text-white font-semibold text-primary">
                          PKR {land.price.toLocaleString()}
                        </span>
                      </div>
                      {land.status === 'locked' && paymentInfo.totalPayments > 0 && (
                        <>
                          <div className="flex text-sm">
                            <span className="text-white mr-2">Payments Received:</span>
                            <span className="text-white font-semibold text-success">
                              {paymentInfo.verifiedPayments}
                            </span>
                          </div>
                          <div className="flex justify-between text-sm text-white">
                            <span className="text-white">Total Paid:</span>
                            <span className="text-white font-semibold text-success">
                              PKR {paymentInfo.totalPaid.toLocaleString()}
                            </span>
                          </div>
                        </>
                      )}
                    </div>

                    {land.createdAt && (
                      <p className="text-xs text-white mb-4">
                        Registered: {new Date(land.createdAt).toLocaleDateString()}
                      </p>
                    )}

                    <div className="card-actions justify-end gap-2">
                      <Link
                        to={`/lands/${land.id}`}
                        className="btn btn-primary btn-sm"
                      >
                        View
                      </Link>
                      {canUpdate(land, user, payments) && (
                        <Link
                          to={`/dashboard/seller/update-land/${land.id}`}
                          className="btn btn-secondary btn-sm"
                          title="Update Land"
                        >
                          <PencilIcon className="h-4 w-4" />
                        </Link>
                      )}
                      {canDelete(land, user, payments) && (
                        <button
                          onClick={() => handleDelete(land.id)}
                          className="btn btn-error btn-sm btn-secondary"
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
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* Table View */
          <div className="card bg-base-100 shadow-xl border border-base-300">
            <div className="card-body p-0">
              <div className="overflow-x-auto">
                <table className="table">
                  <thead>
                    <tr className="text-black">
                      <th className="text-black">Title</th>
                      <th className="text-black">Location</th>
                      <th className="text-black">Size</th>
                      <th className="text-black">Price</th>
                      <th className="text-black">Status</th>
                      <th className="text-black">Payment Info</th>
                      <th className="text-black">Created</th>
                      <th className="text-black">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredLands.map((land) => {
                      const paymentInfo = getLandPaymentInfo(land.id);

                      return (
                        <tr key={land.id} className="hover text-black">
                          <td className="text-black font-semibold">{land.title}</td>
                          <td className="text-black">{land.location}</td>
                          <td className="text-black">{land.size} sq ft</td>
                          <td className="text-black">PKR {land.price.toLocaleString()}</td>
                          <td>
                            <span className={`badge ${getStatusBadgeClass(land.status)}`}>
                              {land.status}
                            </span>
                          </td>
                          <td className="text-black text-sm">
                            {land.status === 'locked' && paymentInfo.totalPayments > 0 ? (
                              <div>
                                <div>Paid: PKR {paymentInfo.totalPaid.toLocaleString()}</div>
                                <div className="text-xs text-gray-600">
                                  ({paymentInfo.verifiedPayments} verified)
                                </div>
                              </div>
                            ) : (
                              <span className="text-black">-</span>
                            )}
                          </td>
                          <td className="text-black text-sm">
                            {land.createdAt ? new Date(land.createdAt).toLocaleDateString() : '-'}
                          </td>
                          <td>
                            <div className="flex gap-2 items-center">
                              <Link
                                to={`/lands/${land.id}`}
                                className="btn btn-xs btn-primary"
                              >
                                View
                              </Link>
                              {canUpdate(land, user, payments) && (
                                <Link
                                  to={`/dashboard/seller/update-land/${land.id}`}
                                  className="btn btn-xs btn-secondary"
                                  title="Update Land"
                                >
                                  <PencilIcon className="h-4 w-4" />
                                </Link>
                              )}
                              {canDelete(land, user, payments) && (
                                <button
                                  onClick={() => handleDelete(land.id)}
                                  className="btn btn-xs btn-error"
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
                      );
                    })}
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

