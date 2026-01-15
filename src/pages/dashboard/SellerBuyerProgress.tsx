import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import DashboardLayout from '../../components/layouts/DashboardLayout';
import {
  HomeIcon,
  FolderIcon,
  DocumentTextIcon,
  UserGroupIcon,
  CreditCardIcon,
  CurrencyDollarIcon,
  ArrowPathIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';
import { paymentAPI, reservationAPI } from '../../services/api';
import { useAppSelector } from '../../store/hooks';
import type { Payment, Reservation } from '../../types';
import { Link } from 'react-router-dom';

interface BuyerProgress {
  buyerId: string;
  buyerName: string;
  buyerEmail: string;
  landId: string;
  landTitle: string;
  reservationDate?: string;
  totalPaid: number;
  pendingPayments: number;
  lastPaymentDate?: string;
  status: 'reserved' | 'paying' | 'completed';
}

export default function SellerBuyerProgress() {
  const { user } = useAppSelector((state) => state.auth);
  const location = useLocation();
  const [buyerProgress, setBuyerProgress] = useState<BuyerProgress[]>([]);
  const [loading, setLoading] = useState(true);

  // Determine navigation items based on current route
  const isBuilderRoute = location.pathname.startsWith('/dashboard/builder');
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

  const fetchData = async () => {
    try {
      setLoading(true);
      const [paymentsData, reservationsData] = await Promise.all([
        paymentAPI.getByBuyer().catch(() => []),
        reservationAPI.getAll().catch(() => []),
      ]);

      // Group by buyer and land
      const progressMap = new Map<string, BuyerProgress>();

      // Process reservations
      (reservationsData || []).forEach((reservation: Reservation) => {
        if (reservation.land?.ownerId === user?.id) {
          const key = `${reservation.buyerId}-${reservation.landId}`;
          if (!progressMap.has(key)) {
            progressMap.set(key, {
              buyerId: reservation.buyerId,
              buyerName: reservation.buyer?.name || 'Unknown',
              buyerEmail: reservation.buyer?.email || 'N/A',
              landId: reservation.landId,
              landTitle: reservation.land?.title || 'N/A',
              reservationDate: reservation.createdAt,
              totalPaid: 0,
              pendingPayments: 0,
              status: 'reserved',
            });
          }
        }
      });

      // Process payments
      (paymentsData || []).forEach((payment: Payment) => {
        if (payment.land?.ownerId    === user?.id) {
          const key = `${payment.buyerId}-${payment.landId}`;
          const existing = progressMap.get(key);
          
          if (existing) {
            if (payment.status === 'verified') {
              existing.totalPaid += payment.amount;
              existing.lastPaymentDate = payment.createdAt;
              existing.status = 'paying';
            } else if (payment.status === 'pending') {
              existing.pendingPayments += 1;
            }
          } else {
            progressMap.set(key, {
              buyerId: payment.buyerId,
              buyerName: payment.buyer?.name || 'Unknown',
              buyerEmail: payment.buyer?.email || 'N/A',
              landId: payment.landId,
              landTitle: payment.land?.title || 'N/A',
              totalPaid: payment.status === 'verified' ? payment.amount : 0,
              pendingPayments: payment.status === 'pending' ? 1 : 0,
              lastPaymentDate: payment.status === 'verified' ? payment.createdAt : undefined,
              status: 'paying',
            });
          }
        }
      });

      setBuyerProgress(Array.from(progressMap.values()));
    } catch (error) {
      console.error('Failed to fetch buyer progress:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user?.id]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'reserved':
        return <span className="badge badge-info">Reserved</span>;
      case 'paying':
        return <span className="badge badge-warning">In Progress</span>;
      case 'completed':
        return <span className="badge badge-success">Completed</span>;
      default:
        return <span className="badge">{status}</span>;
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
        {/* Header */}
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-white">Buyer Progress Tracking</h1>
          <Link to={isBuilderRoute ? "/dashboard/builder" : "/dashboard/seller"} className="btn btn-ghost text-white">
            Back to Dashboard
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="stat bg-gray-800/90 rounded-lg shadow border border-gray-700">
            <div className="stat-title text-gray-300">Total Buyers</div>
            <div className="stat-value text-blue-400">{buyerProgress.length}</div>
          </div>

          <div className="stat bg-gray-800/90 rounded-lg shadow border border-gray-700">
            <div className="stat-title text-gray-300">Reserved Only</div>
            <div className="stat-value text-info-400">
              {buyerProgress.filter((b) => b.status === 'reserved').length}
            </div>
          </div>

          <div className="stat bg-gray-800/90 rounded-lg shadow border border-gray-700">
            <div className="stat-title text-gray-300">In Progress</div>
            <div className="stat-value text-yellow-400">
              {buyerProgress.filter((b) => b.status === 'paying').length}
            </div>
          </div>

          <div className="stat bg-gray-800/90 rounded-lg shadow border border-gray-700">
            <div className="stat-title text-gray-300">Total Revenue</div>
            <div className="stat-value text-green-400">
              ₹{buyerProgress.reduce((sum, b) => sum + b.totalPaid, 0).toLocaleString()}
            </div>
          </div>
        </div>

        {/* Buyer Progress List */}
        {buyerProgress.length === 0 ? (
          <div className="card bg-gray-800/90 shadow-xl border border-gray-700">
            <div className="card-body text-center py-12">
              <UserGroupIcon className="h-16 w-16 mx-auto text-gray-500 mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">No Buyers Yet</h3>
              <p className="text-gray-400">
                When buyers reserve or make payments on your properties, they'll appear here.
              </p>
            </div>
          </div>
        ) : (
          <div className="card bg-gray-800/90 shadow-xl border border-gray-700">
            <div className="card-body">
              <h2 className="card-title text-white mb-4">Buyer Activity</h2>
              <div className="overflow-x-auto">
                <table className="table">
                  <thead>
                    <tr className="border-gray-700">
                      <th className="text-gray-300">Buyer</th>
                      <th className="text-gray-300">Property</th>
                      <th className="text-gray-300">Reservation Date</th>
                      <th className="text-gray-300">Total Paid</th>
                      <th className="text-gray-300">Pending Payments</th>
                      <th className="text-gray-300">Last Payment</th>
                      <th className="text-gray-300">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {buyerProgress.map((progress, index) => (
                      <tr key={`${progress.buyerId}-${progress.landId}-${index}`} className="border-gray-700 hover:bg-gray-700/50">
                        <td>
                          <div className="text-white font-semibold">{progress.buyerName}</div>
                          <div className="text-sm text-gray-400">{progress.buyerEmail}</div>
                        </td>
                        <td className="text-white">{progress.landTitle}</td>
                        <td className="text-gray-300">
                          {progress.reservationDate
                            ? new Date(progress.reservationDate).toLocaleDateString('en-IN', {
                                day: '2-digit',
                                month: 'short',
                                year: 'numeric',
                              })
                            : '-'}
                        </td>
                        <td className="text-green-400 font-semibold">
                          ₹{progress.totalPaid.toLocaleString()}
                        </td>
                        <td className="text-yellow-400">{progress.pendingPayments}</td>
                        <td className="text-gray-300">
                          {progress.lastPaymentDate
                            ? new Date(progress.lastPaymentDate).toLocaleDateString('en-IN', {
                                day: '2-digit',
                                month: 'short',
                                year: 'numeric',
                              })
                            : '-'}
                        </td>
                        <td>{getStatusBadge(progress.status)}</td>
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
