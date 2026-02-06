import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import DashboardLayout from '../../components/layouts/DashboardLayout';
import {
  DocumentTextIcon,
  CheckCircleIcon,
  ClockIcon,
  ExclamationCircleIcon,
  BuildingOfficeIcon,
} from '@heroicons/react/24/outline';
import { transferRequestAPI } from '../../services/api';
import type { TransferRequest } from '../../types';
import { buyerNavItems } from '../../constants/navigation';

const STATUS_CONFIG: Record<string, { color: string; label: string }> = {
  pending_payment_confirmation: { color: 'badge-warning', label: 'Awaiting Payment Confirmation' },
  pending_seller_payment_confirmation: { color: 'badge-warning', label: 'Awaiting Your Confirmation' },
  pending_builder_documents: { color: 'badge-info', label: 'Builder Uploading Docs' },
  documents_uploaded: { color: 'badge-info', label: 'Documents Uploaded' },
  pending_admin_approval: { color: 'badge-warning', label: 'Admin Review' },
  approved: { color: 'badge-success', label: 'Approved' },
  completed: { color: 'badge-neutral', label: 'Completed' },
  rejected: { color: 'badge-error', label: 'Rejected' },
};

export default function MyTransfers() {
  const [transfers, setTransfers] = useState<TransferRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const res = await transferRequestAPI.getMyTransfers();
      setTransfers(res.data || []);
    } catch (err: unknown) {
      setError((err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to load');
      setTransfers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) {
    return (
      <DashboardLayout navItems={buyerNavItems}>
        <div className="flex justify-center items-center h-64">
          <span className="loading loading-spinner loading-lg"></span>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout navItems={buyerNavItems}>
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-2">My Transfer Requests</h1>
        <p className="text-gray-400 mb-6">Transfers where you are the seller (current owner)</p>

        {error && (
          <div className="alert alert-error mb-6">
            <ExclamationCircleIcon className="h-6 w-6" />
            <span className="text-white">{error}</span>
          </div>
        )}

        {transfers.length === 0 ? (
          <div className="card bg-base-200 border border-base-300">
            <div className="card-body items-center py-16">
              <DocumentTextIcon className="h-16 w-16 text-gray-500" />
              <h3 className="text-xl font-semibold text-white">No transfer requests</h3>
              <p className="text-gray-400">You have no active or completed ownership transfers.</p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {transfers.map((t) => {
              const config = STATUS_CONFIG[t.status] || { color: 'badge-ghost', label: t.status };
              return (
                <div key={t.id} className="card bg-base-200 border border-base-300">
                  <div className="card-body">
                    <div className="flex flex-wrap justify-between items-start gap-4">
                      <div>
                        <h3 className="text-lg font-semibold text-white">
                          {t.property?.title || 'Property'}
                        </h3>
                        {t.newOwner && (
                          <p className="text-gray-400">To: {t.newOwner.name}</p>
                        )}
                        <span className={`badge ${config.color} mt-2`}>{config.label}</span>
                      </div>
                      <Link to={`/dashboard/buyer/lands/${t.propertyId}`} className="btn btn-ghost btn-sm">
                        View Property
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="mt-6">
          <Link to="/dashboard/buyer" className="btn btn-ghost text-white">
            ← Back to Dashboard
          </Link>
        </div>
      </div>
    </DashboardLayout>
  );
}
