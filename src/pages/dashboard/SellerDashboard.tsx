import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import DashboardLayout from '../../components/layouts/DashboardLayout';
import {
  HomeIcon,
  DocumentTextIcon,
  UserGroupIcon,
  CreditCardIcon,
} from '@heroicons/react/24/outline';
import { landAPI, paymentAPI } from '../../services/api';
import { useAppSelector } from '../../store/hooks';
import type { Land, Payment } from '../../types';

const navItems = [
  { name: 'Overview', path: '/dashboard/seller', icon: HomeIcon },
  { name: 'My Lands', path: '/dashboard/seller/lands', icon: DocumentTextIcon },
  { name: 'Buyer Progress', path: '/dashboard/seller/buyers', icon: UserGroupIcon },
  { name: 'Payments', path: '/dashboard/seller/payments', icon: CreditCardIcon },
];

export default function SellerDashboard() {
  const { user } = useAppSelector((state) => state.auth);
  const [loading, setLoading] = useState(true);
  const [myLands, setMyLands] = useState<Land[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [stats, setStats] = useState({
    totalLands: 0,
    activeReservations: 0,
    totalRevenue: 0,
  });

  useEffect(() => {
    const fetchData = async () => {
      if (!user?.id) return;
      
      try {
        setLoading(true);
        const [landsData, paymentsData] = await Promise.all([
          landAPI.getAll().catch(() => []),
          paymentAPI.getByBuyer().catch(() => []), // This might need to be seller-specific endpoint
        ]);

        // Filter lands owned by current seller
        const sellerLands = (landsData || []).filter((land) => land.ownerId === user.id);
        setMyLands(sellerLands);

        // Filter payments for seller's lands
        const sellerLandIds = sellerLands.map((land) => land.id);
        const sellerPayments = (paymentsData || []).filter((payment) =>
          sellerLandIds.includes(payment.landId)
        );
        setPayments(sellerPayments);

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
    };

    fetchData();
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
        <h1 className="text-3xl font-bold text-base-content">Seller Dashboard</h1>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="stat bg-base-100 rounded-lg shadow border border-base-300">
            <div className="stat-title text-base-content/70">My Lands</div>
            <div className="stat-value text-primary">{stats.totalLands}</div>
            <div className="stat-desc text-base-content/60">Total properties</div>
          </div>

          <div className="stat bg-base-100 rounded-lg shadow border border-base-300">
            <div className="stat-title text-base-content/70">Active Reservations</div>
            <div className="stat-value text-secondary">{stats.activeReservations}</div>
            <div className="stat-desc text-base-content/60">Lands with buyers</div>
          </div>

          <div className="stat bg-base-100 rounded-lg shadow border border-base-300">
            <div className="stat-title text-base-content/70">Total Revenue</div>
            <div className="stat-value text-success">₹{stats.totalRevenue.toLocaleString()}</div>
            <div className="stat-desc text-base-content/60">From sales</div>
          </div>
        </div>

        {/* My Lands */}
        <div className="card bg-base-100 shadow-xl border border-base-300">
          <div className="card-body">
            <div className="flex justify-between items-center mb-4">
              <h2 className="card-title text-base-content">My Lands</h2>
              <Link to="/dashboard/seller/register-land" className="btn btn-primary w-content flex flex-col items-center justify-center">
                Register New Land
              </Link>
            </div>
            {myLands.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-base-content/70">No lands registered yet.</p>
                <Link to="/dashboard/seller/register-land" className="btn btn-primary btn-sm mt-4">
                  Register Your First Land
                </Link>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="table">
                  <thead>
                    <tr>
                      <th className="text-base-content">Title</th>
                      <th className="text-base-content">Location</th>
                      <th className="text-base-content">Price</th>
                      <th className="text-base-content">Status</th>
                      <th className="text-base-content">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {myLands.map((land) => (
                      <tr key={land.id}>
                        <td className="text-base-content">{land.title}</td>
                        <td className="text-base-content">{land.location}</td>
                        <td className="text-base-content">₹{land.price.toLocaleString()}</td>
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
                          <Link
                            to={`/lands/${land.id}`}
                            className="btn btn-ghost btn-xs text-base-content"
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
              <h2 className="card-title text-base-content">Buyer Progress</h2>
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
                          <p className="font-semibold text-base-content">{land.title}</p>
                          <p className="text-sm text-base-content/70">
                            {landPayments.length > 0
                              ? `Payments: ${paidInstallments}/${totalInstallments}`
                              : 'No payments yet'}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-base-content">
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
                  <p className="text-base-content/70 text-center py-4">
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

