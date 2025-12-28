import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import DashboardLayout from '../../components/layouts/DashboardLayout';
import {
  HomeIcon,
  DocumentTextIcon,
  CreditCardIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';
import { landAPI, paymentAPI, reservationAPI } from '../../services/api';
import { useAppSelector } from '../../store/hooks';
import type { Land, Payment } from '../../types';

const navItems = [
  { name: 'Overview', path: '/dashboard/buyer', icon: HomeIcon },
  { name: 'Available Lands', path: '/dashboard/buyer/lands', icon: DocumentTextIcon },
  { name: 'My Reservations', path: '/dashboard/buyer/reservations', icon: ClockIcon },
  { name: 'Payment History', path: '/dashboard/buyer/payments', icon: CreditCardIcon },
];

export default function BuyerDashboard() {
  const { user } = useAppSelector((state) => state.auth);
  const [loading, setLoading] = useState(true);
  const [availableLands, setAvailableLands] = useState<Land[]>([]);
  const [reservedLands, setReservedLands] = useState<Land[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [stats, setStats] = useState({
    activeReservations: 0,
    totalPaid: 0,
    pendingPayments: 0,
  });

  const fetchData = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      const [landsData, paymentsData, reservationsData] = await Promise.all([
        landAPI.getAll().catch(() => []),
        paymentAPI.getByBuyer().catch(() => []),
        reservationAPI.getAll().catch(() => []),
      ]);

      // Filter available lands (status = 'available')
      const available = (landsData || []).filter((land) => land.status === 'available');
      setAvailableLands(available);

      // Filter buyer's payments
      const buyerPayments = (paymentsData || []).filter((p) => p.buyerId === user.id);
      setPayments(buyerPayments);

      // Filter buyer's reservations
      const buyerReservations = (reservationsData || []).filter((r) => r.buyerId === user.id && r.status === 'active');
      
      // Get reserved land IDs from both reservations and payments
      const reservedLandIdsFromReservations = buyerReservations.map((r) => r.landId);
      const reservedLandIdsFromPayments = [...new Set(buyerPayments.map((p) => p.landId))];
      const allReservedLandIds = [...new Set([...reservedLandIdsFromReservations, ...reservedLandIdsFromPayments])];
      
      // Filter reserved lands (status = 'locked' where buyer has reservations or payments)
      const reserved = (landsData || []).filter(
        (land) => land.status === 'locked' && allReservedLandIds.includes(land.id)
      );
      setReservedLands(reserved);

      // Calculate stats
      const verifiedPayments = buyerPayments.filter((p) => p.status === 'verified');
      const pendingPayments = buyerPayments.filter((p) => p.status === 'pending');
      const totalPaid = verifiedPayments.reduce((sum, p) => sum + p.amount, 0);

      setStats({
        activeReservations: buyerReservations.length,
        totalPaid,
        pendingPayments: pendingPayments.length,
      });
    } catch (error) {
      console.error('Failed to fetch buyer dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user?.id]);

  // Refresh when component comes into focus (e.g., after navigation back from payment/reservation)
  useEffect(() => {
    const handleFocus = () => {
      fetchData();
    };
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [user?.id]);

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
        <h1 className="text-3xl font-bold text-base-content">Buyer Dashboard</h1>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="stat bg-base-100 rounded-lg shadow border border-base-300">
            <div className="stat-title text-base-content/70">Active Reservations</div>
            <div className="stat-value text-primary">{stats.activeReservations}</div>
            <div className="stat-desc text-base-content/60">Lands locked to you</div>
          </div>

          <div className="stat bg-base-100 rounded-lg shadow border border-base-300">
            <div className="stat-title text-base-content/70">Total Paid</div>
            <div className="stat-value text-success">₹{stats.totalPaid.toLocaleString()}</div>
            <div className="stat-desc text-base-content/60">Installments completed</div>
          </div>

          <div className="stat bg-base-100 rounded-lg shadow border border-base-300">
            <div className="stat-title text-base-content/70">Pending Payments</div>
            <div className="stat-value text-warning">{stats.pendingPayments}</div>
            <div className="stat-desc text-base-content/60">Due soon</div>
          </div>
        </div>

        {/* My Reservations */}
        {reservedLands.length > 0 && (
          <div className="card bg-base-100 shadow-xl border border-base-300">
            <div className="card-body">
              <div className="flex justify-between items-center mb-4">
                <h2 className="card-title text-base-content">My Reservations</h2>
                <Link to="/dashboard/buyer/reservations" className="btn btn-ghost btn-sm text-base-content">
                  View All
                </Link>
              </div>
              <div className="space-y-4">
                {reservedLands.slice(0, 3).map((land) => {
                  const landPayments = payments.filter((p) => p.landId === land.id);
                  const verifiedPayments = landPayments.filter((p) => p.status === 'verified');
                  const pendingPayments = landPayments.filter((p) => p.status === 'pending');
                  const totalInstallments = 5; // This should come from backend
                  const paidInstallments = verifiedPayments.length;
                  const progress = (paidInstallments / totalInstallments) * 100;
                  const nextPayment = pendingPayments[0];

                  return (
                    <div
                      key={land.id}
                      className="p-4 bg-base-200 rounded-lg border border-base-300"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-semibold text-lg text-base-content">{land.title}</h3>
                          <p className="text-sm text-base-content/70">{land.location}</p>
                          <p className="text-sm mt-2 text-base-content">
                            Installments: {paidInstallments}/{totalInstallments}
                          </p>
                          <progress
                            className="progress progress-primary w-48 mt-2"
                            value={progress}
                            max="100"
                          ></progress>
                        </div>
                        <div className="text-right">
                          {nextPayment ? (
                            <>
                              <p className="text-sm text-base-content">Next Payment</p>
                              <p className="font-semibold text-base-content">
                                ₹{nextPayment.amount.toLocaleString()}
                              </p>
                              <p className="text-xs text-base-content/70">
                                Due: {nextPayment.dueDate ? new Date(nextPayment.dueDate).toLocaleDateString() : 'N/A'}
                              </p>
                              <Link
                                to={`/dashboard/buyer/payments/${nextPayment.id}`}
                                className="btn btn-primary btn-sm mt-2"
                              >
                                Pay Now
                              </Link>
                            </>
                          ) : (
                            <p className="text-sm text-base-content/70">No pending payments</p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Available Lands */}
        <div className="card bg-base-100 shadow-xl border border-base-300">
          <div className="card-body">
            <div className="flex justify-between items-center mb-4">
              <h2 className="card-title text-base-content">Available Lands</h2>
              <Link to="/dashboard/buyer/lands" className="btn btn-ghost btn-sm text-base-content">
                Browse All
              </Link>
            </div>
            {availableLands.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-base-content/70">No available lands at the moment.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {availableLands.slice(0, 2).map((land) => (
                  <div key={land.id} className="card bg-base-200 shadow border border-base-300">
                    <div className="card-body">
                      <h3 className="card-title text-base-content">{land.title}</h3>
                      <p className="text-sm text-base-content/70">{land.location}</p>
                      <p className="text-2xl font-bold text-primary">₹{land.price.toLocaleString()}</p>
                      <div className="card-actions justify-end mt-4">
                        <Link
                          to={`/lands/${land.id}`}
                          className="btn btn-primary btn-sm"
                        >
                          View Details
                        </Link>
                        <Link
                          to={`/lands/${land.id}`}
                          className="btn btn-secondary btn-sm"
                        >
                          Reserve Now
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

