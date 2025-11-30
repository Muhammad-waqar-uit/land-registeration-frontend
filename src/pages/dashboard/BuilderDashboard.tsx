import DashboardLayout from '../../components/layouts/DashboardLayout';
import {
  HomeIcon,
  ClockIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';
import { useState } from 'react';

const navItems = [
  { name: 'Overview', path: '/dashboard/builder', icon: HomeIcon },
  { name: 'Pending Verifications', path: '/dashboard/builder/pending', icon: ClockIcon },
  { name: 'Verified Payments', path: '/dashboard/builder/verified', icon: CheckCircleIcon },
];

export default function BuilderDashboard() {
  const [pendingPayments] = useState([
    {
      id: '1',
      landId: 'LAND-001',
      buyerName: 'John Doe',
      amount: 100000,
      proofCID: 'QmXXX...',
      submittedAt: '2025-11-30T10:00:00Z',
    },
    {
      id: '2',
      landId: 'LAND-002',
      buyerName: 'Jane Smith',
      amount: 150000,
      proofCID: 'QmYYY...',
      submittedAt: '2025-11-30T11:00:00Z',
    },
  ]);

  const handleVerify = (paymentId: string, verified: boolean) => {
    // TODO: Implement verification API call
    console.log(`Verify payment ${paymentId}: ${verified}`);
  };

  return (
    <DashboardLayout navItems={navItems}>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Builder Dashboard</h1>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="stat bg-base-100 rounded-lg shadow">
            <div className="stat-title">Pending Verifications</div>
            <div className="stat-value text-warning">{pendingPayments.length}</div>
            <div className="stat-desc">Awaiting review</div>
          </div>

          <div className="stat bg-base-100 rounded-lg shadow">
            <div className="stat-title">Verified Today</div>
            <div className="stat-value text-success">12</div>
            <div className="stat-desc">Payments approved</div>
          </div>

          <div className="stat bg-base-100 rounded-lg shadow">
            <div className="stat-title">Rejected Today</div>
            <div className="stat-value text-error">2</div>
            <div className="stat-desc">Payments rejected</div>
          </div>
        </div>

        {/* Pending Verifications */}
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <h2 className="card-title">Pending Verifications</h2>
            <div className="overflow-x-auto mt-4">
              <table className="table">
                <thead>
                  <tr>
                    <th>Land ID</th>
                    <th>Buyer</th>
                    <th>Amount</th>
                    <th>Proof</th>
                    <th>Submitted</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingPayments.map((payment) => (
                    <tr key={payment.id}>
                      <td>{payment.landId}</td>
                      <td>{payment.buyerName}</td>
                      <td>₹{payment.amount.toLocaleString()}</td>
                      <td>
                        <a
                          href={`https://ipfs.io/ipfs/${payment.proofCID}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="link link-primary"
                        >
                          View Proof
                        </a>
                      </td>
                      <td>{new Date(payment.submittedAt).toLocaleDateString()}</td>
                      <td>
                        <div className="flex gap-2">
                          <button
                            className="btn btn-success btn-xs"
                            onClick={() => handleVerify(payment.id, true)}
                          >
                            ✓ Verify
                          </button>
                          <button
                            className="btn btn-error btn-xs"
                            onClick={() => handleVerify(payment.id, false)}
                          >
                            ✗ Reject
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

