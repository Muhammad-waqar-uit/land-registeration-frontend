import { useEffect, useState } from 'react';
import DashboardLayout from '../../components/layouts/DashboardLayout';
import {
  HomeIcon,
  UserGroupIcon,
  CurrencyDollarIcon,
  FolderIcon,
  BuildingOfficeIcon,
  MapPinIcon,
  DocumentTextIcon,
} from '@heroicons/react/24/outline';
import { landAPI, paymentAPI, builderAPI, projectAPI } from '../../services/api';
import type { Land, Payment } from '../../types';
import { Link } from 'react-router-dom';

const navItems = [
  { name: 'Overview', path: '/dashboard/admin', icon: HomeIcon },
  { name: 'Project Approvals', path: '/dashboard/admin/projects', icon: FolderIcon },
  { name: 'Approved Projects', path: '/dashboard/admin/approved-projects', icon: BuildingOfficeIcon },
  { name: 'All Lands', path: '/dashboard/admin/all-lands', icon: MapPinIcon },
  { name: 'Builder Verification', path: '/dashboard/admin/builders', icon: UserGroupIcon },
  { name: 'Mint Tokens', path: '/dashboard/admin/mint-tokens', icon: CurrencyDollarIcon },
  { name: 'Property Requests', path: '/dashboard/admin/property-requests', icon: DocumentTextIcon },
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
    pendingBuilders: 0,
    pendingProjects: 0,
    totalBuilders: 0,
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [landsData, paymentsData, buildersData] = await Promise.all([
        landAPI.getAll(),
        paymentAPI.getPending().catch(() => []), // Handle if endpoint doesn't exist
        builderAPI.getAll().catch(() => []),
      ]);

      const pendingProjects = await projectAPI.getAll({ status: 'pending_approval', page: 1, limit: 50 }).catch(() => []);

      setLands(landsData || []);
      setPendingPayments(paymentsData || []);

      // Calculate stats
      const totalLands = landsData?.length || 0;
      const availableLands = landsData?.filter((l) => l.status === 'available').length || 0;
      const lockedLands = landsData?.filter((l) => l.status === 'locked').length || 0;
      const soldLands = landsData?.filter((l) => l.status === 'sold').length || 0;
      const pendingBuilders = buildersData?.filter((b) => !b.isBuilderVerified).length || 0;

      setStats({
        totalLands,
        availableLands,
        lockedLands,
        soldLands,
        pendingPayments: paymentsData?.length || 0,
        pendingBuilders,
        pendingProjects: pendingProjects?.length || 0,
        totalBuilders: buildersData?.length || 0,
      });
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Refresh when component comes into focus (e.g., after navigation back)
  useEffect(() => {
    const handleFocus = () => {
      fetchData();
    };
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
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
          <h1 className="text-3xl font-bold text-white">Admin Dashboard</h1>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
          <div className="stat bg-base-100 rounded-lg shadow border border-base-300">
            <div className="stat-title text-white">Total Lands</div>
            <div className="stat-value text-primary text-3xl">{stats.totalLands}</div>
            <div className="stat-desc text-gray-400">Registered properties</div>
          </div>

          <div className="stat bg-base-100 rounded-lg shadow border border-base-300">
            <div className="stat-title text-white">Available</div>
            <div className="stat-value text-success text-3xl">{stats.availableLands}</div>
            <div className="stat-desc text-gray-400">Ready for sale</div>
          </div>

          <div className="stat bg-base-100 rounded-lg shadow border border-base-300">
            <div className="stat-title text-white">Locked</div>
            <div className="stat-value text-warning text-3xl">{stats.lockedLands}</div>
            <div className="stat-desc text-gray-400">Reserved by buyers</div>
          </div>

          <div className="stat bg-base-100 rounded-lg shadow border border-base-300">
            <div className="stat-title text-white">Pending Payments</div>
            <div className="stat-value text-error text-3xl">{stats.pendingPayments}</div>
            <div className="stat-desc text-gray-400">Awaiting verification</div>
          </div>

          <Link to="/dashboard/admin/projects" className="stat bg-base-100 rounded-lg shadow border border-base-300 hover:border-warning hover:shadow-lg transition-all cursor-pointer">
            <div className="stat-title text-white">Pending Projects</div>
            <div className="stat-value text-warning text-3xl">{stats.pendingProjects}</div>
            <div className="stat-desc text-gray-400">Awaiting approval</div>
          </Link>

          <Link to="/dashboard/admin/builders" className="stat bg-base-100 rounded-lg shadow border border-base-300 hover:border-warning hover:shadow-lg transition-all cursor-pointer">
            <div className="stat-title text-white">Pending Builders</div>
            <div className="stat-value text-warning text-3xl">{stats.pendingBuilders}</div>
            <div className="stat-desc text-gray-400">{stats.totalBuilders} total builders</div>
          </Link>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Mint Tokens Card */}
          <Link
            to="/dashboard/admin/mint-tokens"
            className="card bg-gradient-to-br from-primary to-primary-focus text-white shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105"
          >
            <div className="card-body">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="card-title text-lg">Mint Tokens</h3>
                  <p className="text-sm opacity-90 mt-1">
                    Create new ERC20 tokens
                  </p>
                </div>
                <CurrencyDollarIcon className="h-12 w-12 opacity-80" />
              </div>
            </div>
          </Link>

          {/* Builder Verification Card */}
          <Link
            to="/dashboard/admin/builders"
            className="card bg-gradient-to-br from-info to-info-focus text-white shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105"
          >
            <div className="card-body">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="card-title text-lg">Verify Builders</h3>
                  <p className="text-sm opacity-90 mt-1">
                    {stats.pendingBuilders} pending
                  </p>
                </div>
                <UserGroupIcon className="h-12 w-12 opacity-80" />
              </div>
            </div>
          </Link>

          {/* Project Approval Card */}
          <Link
            to="/dashboard/admin/projects"
            className="card bg-gradient-to-br from-warning to-warning-focus text-white shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105"
          >
            <div className="card-body">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="card-title text-lg">Approve Projects</h3>
                  <p className="text-sm opacity-90 mt-1">
                    {stats.pendingProjects} pending
                  </p>
                </div>
                <FolderIcon className="h-12 w-12 opacity-80" />
              </div>
            </div>
          </Link>
        </div>

        {/* Recent Lands */}
        {lands.length > 0 && (
          <div className="card bg-base-100 shadow-xl">
            <div className="card-body">
              <div className="flex justify-between items-center">
                <h2 className="card-title text-xl text-white">Recent Land Registrations</h2>
                <Link to="/dashboard/admin/lands" className="btn btn-ghost btn-sm">
                  View All
                </Link>
              </div>
              <div className="overflow-x-auto">
                <table className="table table-zebra">
                  <thead>
                    <tr className="text-black">
                      <th className="text-black">Title</th>
                      <th className="text-black">Location</th>
                      <th className="text-black">Size</th>
                      <th className="text-black">Price</th>
                      <th className="text-black">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lands.slice(0, 5).map((land) => (
                      <tr key={land.id} className="text-black">
                        <td className="font-medium text-black">{land.title}</td>
                        <td className="text-gray-600">{land.location}</td>
                        <td className="text-black">{land.size} sq ft</td>
                        <td className="font-semibold text-black">PKR {land.price.toLocaleString()}</td>
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
                  <div className="text-center py-8 text-gray-400">
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
                <h2 className="card-title text-xl text-white">Pending Payment Verifications</h2>
                <Link to="/dashboard/admin/payments" className="btn btn-ghost btn-sm">
                  View All
                </Link>
              </div>
              <div className="overflow-x-auto">
                <table className="table table-zebra">
                  <thead>
                    <tr className="text-black">
                      <th className="text-black">Land ID</th>
                      <th className="text-black">Amount</th>
                      <th className="text-black">Payment Mode</th>
                      <th className="text-black">Due Date</th>
                      <th className="text-black">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pendingPayments.slice(0, 5).map((payment) => (
                      <tr key={payment.id} className="text-black">
                        <td className="font-mono text-sm">{payment.landId.slice(0, 8)}...</td>
                        <td className="font-semibold">PKR {payment.amount.toLocaleString()}</td>
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
              <p className="text-gray-400 text-lg">No data available yet</p>
              <p className="text-white text-sm mt-2">
                Start by registering lands or wait for payment submissions
              </p>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

