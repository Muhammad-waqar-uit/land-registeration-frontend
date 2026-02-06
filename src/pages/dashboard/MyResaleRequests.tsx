import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import DashboardLayout from '../../components/layouts/DashboardLayout';
import {
  BuildingOfficeIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  RectangleStackIcon,
  ArrowPathIcon,
  ExclamationCircleIcon,
  BanknotesIcon,
  DocumentTextIcon,
} from '@heroicons/react/24/outline';
import { resaleRequestAPI, paymentAPI, transferRequestAPI, landAPI } from '../../services/api';
import { useAppSelector } from '../../store/hooks';
import type { ResaleRequest } from '../../types';
import { buyerNavItems } from '../../constants/navigation';

export default function MyResaleRequests() {
  const { user } = useAppSelector((state) => state.auth);
  const [resaleRequests, setResaleRequests] = useState<ResaleRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [confirmModal, setConfirmModal] = useState<{
    resale: ResaleRequest;
    newOwnerId: string;
    newOwnerName: string;
    totalPaid: number;
    price: number;
  } | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [paymentSummaries, setPaymentSummaries] = useState<Record<string, { totalPaid: number; price: number }>>({});

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const data = await resaleRequestAPI.getMyRequests();
      const list = Array.isArray(data) ? data : [];
      setResaleRequests(list);

      // Fetch payment summaries for listed properties (totalPaid, price from land or installment-summary)
      const listed = list.filter((r) => r.status === 'listed' && r.propertyId);
      const summaries: Record<string, { totalPaid: number; price: number }> = {};
      await Promise.all(
        listed.map(async (r) => {
          try {
            const land = r.property;
            if (land && (land.totalPaid != null || land.price != null)) {
              summaries[r.propertyId!] = {
                totalPaid: land.totalPaid ?? 0,
                price: land.price ?? land.totalPaid ?? 0,
              };
              return;
            }
            const [sum, landData] = await Promise.all([
              paymentAPI.getInstallmentSummary(r.propertyId!).catch(() => null),
              landAPI.getById(r.propertyId!).catch(() => null),
            ]);
            summaries[r.propertyId!] = {
              totalPaid: sum?.totalPaid ?? landData?.totalPaid ?? 0,
              price: landData?.price ?? sum?.totalAmount ?? 0,
            };
          } catch {
            summaries[r.propertyId!] = { totalPaid: 0, price: 0 };
          }
        })
      );
      setPaymentSummaries(summaries);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg || 'Failed to load resale requests');
      setResaleRequests([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleListAsSeller = async (id: string) => {
    try {
      setProcessingId(id);
      setError('');
      await resaleRequestAPI.listAsSeller(id);
      await fetchData();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg || 'Failed to list property');
    } finally {
      setProcessingId(null);
    }
  };

  const handleOpenConfirm = async (resale: ResaleRequest) => {
    if (!resale.propertyId) return;
    try {
      const [payments, landData] = await Promise.all([
        paymentAPI.getByProperty(resale.propertyId),
        landAPI.getById(resale.propertyId),
      ]);
      const verified = (payments || []).filter((p: { status: string }) => p.status === 'verified');
      const totalPaid = verified.reduce((s: number, p: { amount: number }) => s + p.amount, 0);
      const price = landData?.price ?? resale.requestedPrice ?? 0;
      if (totalPaid < price) {
        setError('Property must be fully paid before confirming. Total paid: PKR ' + totalPaid.toLocaleString());
        return;
      }
      const buyerIds = [...new Set(verified.map((p: { buyerId: string }) => p.buyerId))];
      const buyerId = buyerIds[0];
      const buyerPayment = verified.find((p: { buyerId: string }) => p.buyerId === buyerId);
      const buyerName = (buyerPayment as { buyer?: { name: string } })?.buyer?.name || 'Unknown Buyer';
      setConfirmModal({
        resale,
        newOwnerId: buyerId,
        newOwnerName: buyerName,
        totalPaid,
        price,
      });
      setError('');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg || 'Failed to load payment info');
    }
  };

  const handleConfirmPayment = async () => {
    if (!confirmModal) return;
    try {
      setConfirming(true);
      setError('');
      await transferRequestAPI.confirmPayment(confirmModal.resale.id, {
        newOwnerId: confirmModal.newOwnerId,
        paymentConfirmed: true,
        allowDocumentChange: true,
      });
      setConfirmModal(null);
      await fetchData();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg || 'Failed to confirm payment');
    } finally {
      setConfirming(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const config: Record<string, { color: string; icon: typeof ClockIcon; text: string }> = {
      pending: { color: 'badge-warning', icon: ClockIcon, text: 'Pending Builder' },
      approved: { color: 'badge-success', icon: CheckCircleIcon, text: 'Approved' },
      rejected: { color: 'badge-error', icon: XCircleIcon, text: 'Rejected' },
      listed: { color: 'badge-info', icon: RectangleStackIcon, text: 'Listed' },
      sold: { color: 'badge-neutral', icon: CheckCircleIcon, text: 'Sold' },
    };
    const c = config[status] || config.pending;
    const Icon = c.icon;
    return (
      <span className={`badge ${c.color} gap-1 text-white flex flex-row items-center border-black`}>
        <Icon className="h-4 w-4" />
        {c.text}
      </span>
    );
  };

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-PK', { style: 'currency', currency: 'PKR', maximumFractionDigits: 0 }).format(amount);

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
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-white text-white">My Resale Requests</h1>
            <p className="text-gray-400 mt-1">Manage your property resale requests</p>
          </div>
          <Link to="/dashboard/buyer/resale-request/create" className="btn btn-primary flex flex-row items-center border-black text-white">
            <ArrowPathIcon className="w-5 h-5 mr-2" />
            Request Resale
          </Link>
        </div>

        {error && (
          <div className="alert alert-error mb-6">
            <ExclamationCircleIcon className="h-6 w-6" />
            <span className="text-white">{error}</span>
          </div>
        )}

        {resaleRequests.length === 0 ? (
          <div className="card bg-base-200 border border-base-300">
            <div className="card-body items-center py-16">
              <BuildingOfficeIcon className="h-16 w-16 text-gray-500" />
              <h3 className="text-xl font-semibold text-white">No resale requests</h3>
              <p className="text-gray-400 text-center">You haven&apos;t requested to resell any properties yet.</p>
              <Link to="/dashboard/buyer/resale-request/create" className="btn btn-primary mt-4 flex flex-row items-center border-black text-white gap-2">
                Request Resale
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {resaleRequests.map((req) => {
              const summary = paymentSummaries[req.propertyId!];
              const isFullyPaid = summary && summary.totalPaid >= summary.price;
              return (
                <div
                  key={req.id}
                  className="card bg-base-200 border border-base-300 shadow-xl"
                >
                  <div className="card-body">
                    <div className="flex flex-wrap justify-between items-start gap-4">
                      <div>
                        <h3 className="text-lg font-semibold text-white">
                          {req.property?.title || 'Property'}
                        </h3>
                        <p className="text-gray-400 text-white">{req.property?.location}</p>
                        <div className="flex items-center gap-2 mt-2 flex-row items-center border-black text-white">
                          {getStatusBadge(req.status)}
                          <span className="text-primary font-semibold text-white">
                            {formatCurrency(req.requestedPrice)}
                          </span>
                        </div>
                        {req.status === 'listed' && summary && (
                          <div className="mt-2 text-sm text-gray-300 text-white">
                            <span>Paid: {formatCurrency(summary.totalPaid)} / {formatCurrency(summary.price)}</span>
                            {isFullyPaid && (
                              <span className="ml-2 text-success text-white">✓ Fully paid</span>
                            )}
                          </div>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {req.status === 'approved' && (
                          <button
                            onClick={() => handleListAsSeller(req.id)}
                            className="btn btn-primary btn-sm flex flex-row items-center border-black text-white gap-2"
                            disabled={processingId === req.id}
                          >
                            {processingId === req.id ? (
                              <span className="loading loading-spinner loading-xs"></span>
                            ) : (
                              <>
                                <RectangleStackIcon className="w-4 h-4 mr-1" />
                                List as Seller
                              </>
                            )}
                          </button>
                        )}
                        {req.status === 'listed' && isFullyPaid && (
                          <button
                            onClick={() => handleOpenConfirm(req)}
                            className="btn btn-success btn-sm"
                          >
                            <BanknotesIcon className="w-4 h-4 mr-1" />
                            Confirm Payment
                          </button>
                        )}
                        {req.status === 'listed' && (
                          <Link
                            to={`/dashboard/buyer/lands/${req.propertyId}`}
                            className="btn btn-ghost btn-sm"
                          >
                            View Property
                          </Link>
                        )}
                        {req.status === 'pending' && (
                          <span className="text-sm text-gray-400 text-white">Waiting for builder approval</span>
                        )}
                      </div>
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

      {/* Confirm Payment Modal */}
      {confirmModal && (
        <dialog open className="modal modal-open">
          <div className="modal-box bg-base-200">
            <h3 className="font-bold text-lg text-white">Confirm Payment Received</h3>
            <p className="py-2 text-gray-300">
              Confirm that you have received full payment from <strong>{confirmModal.newOwnerName}</strong> and allow
              the builder to upload transfer documents.
            </p>
            <p className="text-sm text-gray-400">
              Amount received: {formatCurrency(confirmModal.totalPaid)}
            </p>
            <div className="modal-action">
              <button
                className="btn btn-ghost"
                onClick={() => setConfirmModal(null)}
                disabled={confirming}
              >
                Cancel
              </button>
              <button
                className="btn btn-primary"
                onClick={handleConfirmPayment}
                disabled={confirming}
              >
                {confirming ? (
                  <span className="loading loading-spinner loading-sm"></span>
                ) : (
                  <>
                    <CheckCircleIcon className="w-5 h-5 mr-2" />
                    Confirm
                  </>
                )}
              </button>
            </div>
          </div>
          <form method="dialog" className="modal-backdrop">
            <button onClick={() => setConfirmModal(null)}>close</button>
          </form>
        </dialog>
      )}
    </DashboardLayout>
  );
}
