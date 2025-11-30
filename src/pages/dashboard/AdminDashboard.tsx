import DashboardLayout from '../../components/layouts/DashboardLayout';
import {
  HomeIcon,
  DocumentTextIcon,
  UserGroupIcon,
  CreditCardIcon,
  ClipboardDocumentListIcon,
} from '@heroicons/react/24/outline';
import { useState } from 'react';

const navItems = [
  { name: 'Overview', path: '/dashboard/admin', icon: HomeIcon },
  { name: 'Land Management', path: '/dashboard/admin/lands', icon: DocumentTextIcon },
  { name: 'User Management', path: '/dashboard/admin/users', icon: UserGroupIcon },
  { name: 'Payment Oversight', path: '/dashboard/admin/payments', icon: CreditCardIcon },
  { name: 'Audit Logs', path: '/dashboard/admin/audit', icon: ClipboardDocumentListIcon },
];

export default function AdminDashboard() {
  const [stats] = useState({
    totalLands: 150,
    totalUsers: 45,
    pendingPayments: 8,
    totalRevenue: 2500000,
  });

  return (
    <DashboardLayout navItems={navItems}>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="stat bg-base-100 rounded-lg shadow">
            <div className="stat-title">Total Lands</div>
            <div className="stat-value text-primary">{stats.totalLands}</div>
            <div className="stat-desc">Registered properties</div>
          </div>

          <div className="stat bg-base-100 rounded-lg shadow">
            <div className="stat-title">Total Users</div>
            <div className="stat-value text-secondary">{stats.totalUsers}</div>
            <div className="stat-desc">Active accounts</div>
          </div>

          <div className="stat bg-base-100 rounded-lg shadow">
            <div className="stat-title">Pending Payments</div>
            <div className="stat-value text-warning">{stats.pendingPayments}</div>
            <div className="stat-desc">Awaiting verification</div>
          </div>

          <div className="stat bg-base-100 rounded-lg shadow">
            <div className="stat-title">Total Revenue</div>
            <div className="stat-value text-success">₹{stats.totalRevenue.toLocaleString()}</div>
            <div className="stat-desc">All time</div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <h2 className="card-title">Quick Actions</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
              <button className="btn btn-primary">
                <DocumentTextIcon className="h-5 w-5" />
                Register New Land
              </button>
              <button className="btn btn-secondary">
                <UserGroupIcon className="h-5 w-5" />
                Manage Users
              </button>
              <button className="btn btn-accent">
                <CreditCardIcon className="h-5 w-5" />
                Review Payments
              </button>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <h2 className="card-title">Recent Activity</h2>
            <div className="overflow-x-auto">
              <table className="table">
                <thead>
                  <tr>
                    <th>Action</th>
                    <th>User</th>
                    <th>Time</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Land Registration</td>
                    <td>John Doe</td>
                    <td>2 hours ago</td>
                    <td><span className="badge badge-success">Completed</span></td>
                  </tr>
                  <tr>
                    <td>Payment Verification</td>
                    <td>Jane Smith</td>
                    <td>5 hours ago</td>
                    <td><span className="badge badge-warning">Pending</span></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

