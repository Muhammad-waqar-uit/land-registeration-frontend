import { useEffect, useState } from 'react';
import DashboardLayout from '../../components/layouts/DashboardLayout';
import {
  HomeIcon,
  DocumentTextIcon,
  UserGroupIcon,
  CreditCardIcon,
} from '@heroicons/react/24/outline';
import { landAPI, paymentAPI } from '../../services/api';
import type { Land, Payment } from '../../types';
import { Link } from 'react-router-dom';

const navItems = [
  { name: 'Overview', path: '/dashboard/admin', icon: HomeIcon },
  { name: 'Land Management', path: '/dashboard/admin/lands', icon: DocumentTextIcon },
  { name: 'User Management', path: '/dashboard/admin/users', icon: UserGroupIcon },
  { name: 'Payment Oversight', path: '/dashboard/admin/payments', icon: CreditCardIcon },
];

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [lands, setLands] = useState<Land[]>([]);
  const [pendingPayments, setPendingPayments] = useState<Payment[]>([]);
  const [stats, setStats] = useState({
    totalLands: 0,
    availableLands: 0,
    lockedLands: 0,
    soldLands: 0,
    pendingPayments: 0,
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [landsData, paymentsData] = await Promise.all([
          landAPI.getAll(),
          paymentAPI.getPending().catch(() => []), // Handle if endpoint doesn't exist
        ]);

        setLands(landsData || []);
        setPendingPayments(paymentsData || []);

        // Calculate stats
        const totalLands = landsData?.length || 0;
        const availableLands = landsData?.filter((l) => l.status === 'available').length || 0;
        const lockedLands = landsData?.filter((l) => l.status === 'locked').length || 0;
        const soldLands = landsData?.filter((l) => l.status === 'sold').length || 0;

        setStats({
          totalLands,
          availableLands,
          lockedLands,
          soldLands,
          pendingPayments: paymentsData?.length || 0,
        });
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

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
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-base-content">Admin Dashboard</h1>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="stat bg-base-100 rounded-lg shadow border border-base-300">
            <div className="stat-title text-base-content/70">Total Lands</div>
            <div className="stat-value text-primary text-3xl">{stats.totalLands}</div>
            <div className="stat-desc text-base-content/60">Registered properties</div>
          </div>

          <div className="stat bg-base-100 rounded-lg shadow border border-base-300">
            <div className="stat-title text-base-content/70">Available</div>
            <div className="stat-value text-success text-3xl">{stats.availableLands}</div>
            <div className="stat-desc text-base-content/60">Ready for sale</div>
          </div>

          <div className="stat bg-base-100 rounded-lg shadow border border-base-300">
            <div className="stat-title text-base-content/70">Locked</div>
            <div className="stat-value text-warning text-3xl">{stats.lockedLands}</div>
            <div className="stat-desc text-base-content/60">Reserved by buyers</div>
          </div>

          <div className="stat bg-base-100 rounded-lg shadow border border-base-300">
            <div className="stat-title text-base-content/70">Pending Payments</div>
            <div className="stat-value text-error text-3xl">{stats.pendingPayments}</div>
            <div className="stat-desc text-base-content/60">Awaiting verification</div>
          </div>
        </div>

        {/* Recent Lands */}
        {lands.length > 0 && (
          <div className="card bg-base-100 shadow-xl">
            <div className="card-body">
              <div className="flex justify-between items-center">
                <h2 className="card-title text-xl">Recent Land Registrations</h2>
                <Link to="/dashboard/admin/lands" className="btn btn-ghost btn-sm">
                  View All
                </Link>
              </div>
              <div className="overflow-x-auto">
                <table className="table table-zebra">
                  <thead>
                    <tr>
                      <th>Title</th>
                      <th>Location</th>
                      <th>Size</th>
                      <th>Price</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lands.slice(0, 5).map((land) => (
                      <tr key={land.id}>
                        <td className="font-medium">{land.title}</td>
                        <td className="text-base-content/70">{land.location}</td>
                        <td>{land.size} sq ft</td>
                        <td className="font-semibold">₹{land.price.toLocaleString()}</td>
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
                      </tr>
                    ))}
                  </tbody>
                </table>
                {lands.length === 0 && (
                  <div className="text-center py-8 text-base-content/60">
                    No lands registered yet
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Pending Payments */}
        {pendingPayments.length > 0 && (
          <div className="card bg-base-100 shadow-xl">
            <div className="card-body">
              <div className="flex justify-between items-center">
                <h2 className="card-title text-xl">Pending Payment Verifications</h2>
                <Link to="/dashboard/admin/payments" className="btn btn-ghost btn-sm">
                  View All
                </Link>
              </div>
              <div className="overflow-x-auto">
                <table className="table table-zebra">
                  <thead>
                    <tr>
                      <th>Land ID</th>
                      <th>Amount</th>
                      <th>Payment Mode</th>
                      <th>Due Date</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pendingPayments.slice(0, 5).map((payment) => (
                      <tr key={payment.id}>
                        <td className="font-mono text-sm">{payment.landId.slice(0, 8)}...</td>
                        <td className="font-semibold">₹{payment.amount.toLocaleString()}</td>
                        <td>
                          <span className="badge badge-outline">{payment.paymentMode}</span>
                        </td>
                        <td>{new Date(payment.dueDate).toLocaleDateString()}</td>
                        <td>
                          <span className="badge badge-warning">{payment.status}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Empty State */}
        {lands.length === 0 && pendingPayments.length === 0 && (
          <div className="card bg-base-100 shadow-xl">
            <div className="card-body text-center py-12">
              <p className="text-base-content/60 text-lg">No data available yet</p>
              <p className="text-base-content/50 text-sm mt-2">
                Start by registering lands or wait for payment submissions
              </p>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

