import DashboardLayout from '../../components/layouts/DashboardLayout';
import {
  HomeIcon,
  DocumentTextIcon,
  UserGroupIcon,
  CreditCardIcon,
} from '@heroicons/react/24/outline';
import { useState } from 'react';

const navItems = [
  { name: 'Overview', path: '/dashboard/seller', icon: HomeIcon },
  { name: 'My Lands', path: '/dashboard/seller/lands', icon: DocumentTextIcon },
  { name: 'Buyer Progress', path: '/dashboard/seller/buyers', icon: UserGroupIcon },
  { name: 'Payments', path: '/dashboard/seller/payments', icon: CreditCardIcon },
];

export default function SellerDashboard() {
  const [myLands] = useState([
    { id: '1', title: 'Plot A-123', location: 'Mumbai', price: 500000, status: 'locked' },
    { id: '2', title: 'Plot B-456', location: 'Delhi', price: 750000, status: 'available' },
  ]);

  return (
    <DashboardLayout navItems={navItems}>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Seller Dashboard</h1>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="stat bg-base-100 rounded-lg shadow">
            <div className="stat-title">My Lands</div>
            <div className="stat-value text-primary">{myLands.length}</div>
            <div className="stat-desc">Total properties</div>
          </div>

          <div className="stat bg-base-100 rounded-lg shadow">
            <div className="stat-title">Active Reservations</div>
            <div className="stat-value text-secondary">3</div>
            <div className="stat-desc">Lands with buyers</div>
          </div>

          <div className="stat bg-base-100 rounded-lg shadow">
            <div className="stat-title">Total Revenue</div>
            <div className="stat-value text-success">₹1,250,000</div>
            <div className="stat-desc">From sales</div>
          </div>
        </div>

        {/* My Lands */}
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <div className="flex justify-between items-center">
              <h2 className="card-title">My Lands</h2>
              <button className="btn btn-primary btn-sm">
                <DocumentTextIcon className="h-5 w-5" />
                Register New Land
              </button>
            </div>
            <div className="overflow-x-auto mt-4">
              <table className="table">
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>Location</th>
                    <th>Price</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {myLands.map((land) => (
                    <tr key={land.id}>
                      <td>{land.title}</td>
                      <td>{land.location}</td>
                      <td>₹{land.price.toLocaleString()}</td>
                      <td>
                        <span className={`badge ${
                          land.status === 'available' ? 'badge-success' :
                          land.status === 'locked' ? 'badge-warning' : 'badge-error'
                        }`}>
                          {land.status}
                        </span>
                      </td>
                      <td>
                        <button className="btn btn-ghost btn-xs">View</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Buyer Progress */}
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <h2 className="card-title">Buyer Progress</h2>
            <div className="space-y-4 mt-4">
              <div className="flex items-center justify-between p-4 bg-base-200 rounded-lg">
                <div>
                  <p className="font-semibold">Plot A-123</p>
                  <p className="text-sm text-base-content/70">Buyer: John Doe</p>
                </div>
                <div className="text-right">
                  <p className="text-sm">Installments Paid: 2/5</p>
                  <progress className="progress progress-primary w-32" value="40" max="100"></progress>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

