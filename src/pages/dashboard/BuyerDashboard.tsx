import DashboardLayout from '../../components/layouts/DashboardLayout';
import {
  HomeIcon,
  DocumentTextIcon,
  CreditCardIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';
import { useState } from 'react';
import { Link } from 'react-router-dom';

const navItems = [
  { name: 'Overview', path: '/dashboard/buyer', icon: HomeIcon },
  { name: 'Available Lands', path: '/dashboard/buyer/lands', icon: DocumentTextIcon },
  { name: 'My Reservations', path: '/dashboard/buyer/reservations', icon: ClockIcon },
  { name: 'Payment History', path: '/dashboard/buyer/payments', icon: CreditCardIcon },
];

export default function BuyerDashboard() {
  const [reservations] = useState([
    {
      id: '1',
      landTitle: 'Plot A-123',
      location: 'Mumbai',
      price: 500000,
      installmentsPaid: 2,
      totalInstallments: 5,
      nextDueDate: '2025-12-01',
      nextAmount: 100000,
    },
  ]);

  const [availableLands] = useState([
    { id: '1', title: 'Plot B-456', location: 'Delhi', price: 750000, image: '' },
    { id: '2', title: 'Plot C-789', location: 'Bangalore', price: 600000, image: '' },
  ]);

  return (
    <DashboardLayout navItems={navItems}>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Buyer Dashboard</h1>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="stat bg-base-100 rounded-lg shadow">
            <div className="stat-title">Active Reservations</div>
            <div className="stat-value text-primary">{reservations.length}</div>
            <div className="stat-desc">Lands locked to you</div>
          </div>

          <div className="stat bg-base-100 rounded-lg shadow">
            <div className="stat-title">Total Paid</div>
            <div className="stat-value text-success">₹200,000</div>
            <div className="stat-desc">Installments completed</div>
          </div>

          <div className="stat bg-base-100 rounded-lg shadow">
            <div className="stat-title">Pending Payments</div>
            <div className="stat-value text-warning">1</div>
            <div className="stat-desc">Due soon</div>
          </div>
        </div>

        {/* My Reservations */}
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <div className="flex justify-between items-center">
              <h2 className="card-title">My Reservations</h2>
              <Link to="/dashboard/buyer/reservations" className="btn btn-ghost btn-sm">
                View All
              </Link>
            </div>
            <div className="space-y-4 mt-4">
              {reservations.map((reservation) => (
                <div key={reservation.id} className="p-4 bg-base-200 rounded-lg">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold text-lg">{reservation.landTitle}</h3>
                      <p className="text-sm text-base-content/70">{reservation.location}</p>
                      <p className="text-sm mt-2">
                        Installments: {reservation.installmentsPaid}/{reservation.totalInstallments}
                      </p>
                      <progress
                        className="progress progress-primary w-48 mt-2"
                        value={(reservation.installmentsPaid / reservation.totalInstallments) * 100}
                        max="100"
                      ></progress>
                    </div>
                    <div className="text-right">
                      <p className="text-sm">Next Payment</p>
                      <p className="font-semibold">₹{reservation.nextAmount.toLocaleString()}</p>
                      <p className="text-xs text-base-content/70">Due: {reservation.nextDueDate}</p>
                      <button className="btn btn-primary btn-sm mt-2">Pay Now</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Available Lands */}
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <div className="flex justify-between items-center">
              <h2 className="card-title">Available Lands</h2>
              <Link to="/dashboard/buyer/lands" className="btn btn-ghost btn-sm">
                Browse All
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              {availableLands.map((land) => (
                <div key={land.id} className="card bg-base-200 shadow">
                  <div className="card-body">
                    <h3 className="card-title">{land.title}</h3>
                    <p className="text-sm text-base-content/70">{land.location}</p>
                    <p className="text-2xl font-bold text-primary">₹{land.price.toLocaleString()}</p>
                    <div className="card-actions justify-end">
                      <Link to={`/lands/${land.id}`} className="btn btn-primary btn-sm">
                        View Details
                      </Link>
                      <button className="btn btn-secondary btn-sm">Reserve Now</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

