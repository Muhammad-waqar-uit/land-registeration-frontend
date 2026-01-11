import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import DashboardLayout from '../../components/layouts/DashboardLayout';
import {
  HomeIcon,
  CreditCardIcon,
} from '@heroicons/react/24/outline';
import { landAPI, paymentAPI, reservationAPI, propertyRequestAPI, agreementAPI, installmentAPI } from '../../services/api';
import { useAppSelector } from '../../store/hooks';
import type { Land, Payment, PropertyRequest, Agreement, Installment } from '../../types';

const navItems = [
  { name: 'Overview', path: '/dashboard/buyer', icon: HomeIcon },
  { name: 'Payment History', path: '/dashboard/buyer/payments', icon: CreditCardIcon },
];

export default function BuyerDashboard() {
  const { user } = useAppSelector((state) => state.auth);
  const [loading, setLoading] = useState(true);
  const [availableLands, setAvailableLands] = useState<Land[]>([]);
  const [reservedLands, setReservedLands] = useState<Land[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [propertyRequests, setPropertyRequests] = useState<PropertyRequest[]>([]);
  const [agreements, setAgreements] = useState<Agreement[]>([]);
  const [installments, setInstallments] = useState<Installment[]>([]);
  const [stats, setStats] = useState({
    activeReservations: 0,
    totalPaid: 0,
    pendingPayments: 0,
    pendingRequests: 0,
    pendingAgreements: 0,
    upcomingInstallments: 0,
  });

  const fetchData = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      const [landsData, paymentsData, reservationsData, requestsData, agreementsData, installmentsData] = await Promise.all([
        landAPI.getAll().catch(() => []),
        paymentAPI.getByBuyer().catch(() => []),
        reservationAPI.getAll().catch(() => []),
        propertyRequestAPI.getMyRequests().catch(() => []),
        agreementAPI.getAll({ buyerId: user?.id }).catch(() => []),
        installmentAPI.getMyInstallments().catch(() => []),
      ]);

      // Set property requests, agreements, and installments
      setPropertyRequests(requestsData || []);
      setAgreements(agreementsData || []);
      setInstallments(installmentsData || []);

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
      const pendingRequestsCount = (requestsData || []).filter((r) => r.status === 'pending').length;
      const pendingAgreementsCount = (agreementsData || []).filter((a) => a.status === 'pending' || a.status === 'buyer_signed').length;
      const upcomingInstallmentsCount = (installmentsData || []).filter((i: Installment) => i.status === 'pending').length;

      setStats({
        activeReservations: buyerReservations.length,
        totalPaid,
        pendingPayments: pendingPayments.length,
        pendingRequests: pendingRequestsCount,
        pendingAgreements: pendingAgreementsCount,
        upcomingInstallments: upcomingInstallmentsCount,
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
        <h1 className="text-3xl font-bold text-white">Buyer Dashboard</h1>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
          <div className="stat bg-base-100 rounded-lg shadow border border-base-300">
            <div className="stat-title text-white">Active Reservations</div>
            <div className="stat-value text-primary">{stats.activeReservations}</div>
            <div className="stat-desc text-white">Lands locked to you</div>
          </div>

          <div className="stat bg-base-100 rounded-lg shadow border border-base-300">
            <div className="stat-title text-white">Property Requests</div>
            <div className="stat-value text-info">{stats.pendingRequests}</div>
            <div className="stat-desc text-white">Pending approval</div>
          </div>

          <div className="stat bg-base-100 rounded-lg shadow border border-base-300">
            <div className="stat-title text-white">Agreements</div>
            <div className="stat-value text-warning">{stats.pendingAgreements}</div>
            <div className="stat-desc text-white">Pending signature</div>
          </div>

          <div className="stat bg-base-100 rounded-lg shadow border border-base-300">
            <div className="stat-title text-white">Upcoming Payments</div>
            <div className="stat-value text-secondary">{stats.upcomingInstallments}</div>
            <div className="stat-desc text-white">Installments due</div>
          </div>

          <div className="stat bg-base-100 rounded-lg shadow border border-base-300">
            <div className="stat-title text-white">Total Paid</div>
            <div className="stat-value text-success">₹{stats.totalPaid.toLocaleString()}</div>
            <div className="stat-desc text-white">Installments completed</div>
          </div>

          <div className="stat bg-base-100 rounded-lg shadow border border-base-300">
            <div className="stat-title text-white">Pending Payments</div>
            <div className="stat-value text-error">{stats.pendingPayments}</div>
            <div className="stat-desc text-white">Due soon</div>
          </div>
        </div>

        {/* My Property Requests */}
        {propertyRequests.length > 0 && (
          <div className="card bg-base-100 shadow-xl border border-base-300">
            <div className="card-body">
              <h2 className="card-title text-white">My Property Requests</h2>
              <div className="space-y-3">
                {propertyRequests.slice(0, 3).map((request) => (
                  <div
                    key={request.id}
                    className="p-4 bg-base-200 rounded-lg border border-base-300"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="font-semibold text-white">{request.property?.title}</h3>
                        <p className="text-sm text-gray-300">{request.property?.location}</p>
                        {request.offerPrice && (
                          <p className="text-sm text-white mt-1">
                            Offer: ₹{request.offerPrice.toLocaleString()}
                          </p>
                        )}
                        {request.message && (
                          <p className="text-sm text-gray-400 mt-2 line-clamp-2">
                            {request.message}
                          </p>
                        )}
                        {request.response && (
                          <div className="mt-2 p-2 bg-base-300 rounded">
                            <p className="text-sm text-gray-400">Builder's Response:</p>
                            <p className="text-sm text-white">{request.response}</p>
                          </div>
                        )}
                      </div>
                      <div className="text-right ml-4">
                        <div
                          className={`badge ${
                            request.status === 'pending'
                              ? 'badge-warning'
                              : request.status === 'approved'
                              ? 'badge-success'
                              : 'badge-error'
                          }`}
                        >
                          {request.status}
                        </div>
                        <p className="text-xs text-gray-400 mt-2">
                          {new Date(request.createdAt).toLocaleDateString()}
                        </p>
                        <Link
                          to={`/lands/${request.propertyId}`}
                          className="btn btn-ghost btn-xs mt-2"
                        >
                          View Property
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              {propertyRequests.length > 3 && (
                <div className="text-center mt-4">
                  <button className="btn btn-ghost btn-sm text-white">
                    View All Requests ({propertyRequests.length})
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* My Agreements */}
        {agreements.length > 0 && (
          <div className="card bg-base-100 shadow-xl border border-base-300">
            <div className="card-body">
              <h2 className="card-title text-white">My Agreements</h2>
              <div className="space-y-3">
                {agreements.slice(0, 3).map((agreement) => (
                  <div
                    key={agreement.id}
                    className="p-4 bg-base-200 rounded-lg border border-base-300"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="font-semibold text-white">{agreement.property?.title}</h3>
                        <p className="text-sm text-gray-300">{agreement.property?.location}</p>
                        {agreement.terms?.totalAmount && (
                          <p className="text-sm text-white mt-1">
                            Amount: ₹{agreement.terms.totalAmount.toLocaleString()}
                          </p>
                        )}
                        {agreement.terms?.installmentPlanYears && (
                          <p className="text-sm text-gray-400">
                            {agreement.terms.installmentPlanYears} year installment plan
                          </p>
                        )}
                      </div>
                      <div className="text-right ml-4">
                        <div
                          className={`badge ${
                            agreement.status === 'signed' || agreement.status === 'completed'
                              ? 'badge-success'
                              : agreement.status === 'builder_signed'
                              ? 'badge-info'
                              : 'badge-warning'
                          }`}
                        >
                          {agreement.status.replace('_', ' ')}
                        </div>
                        <p className="text-xs text-gray-400 mt-2">
                          {new Date(agreement.createdAt).toLocaleDateString()}
                        </p>
                        <Link
                          to={`/dashboard/buyer/agreements/${agreement.id}`}
                          className="btn btn-ghost btn-xs mt-2"
                        >
                          {agreement.status === 'pending' ? 'Sign Agreement' : 'View Details'}
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              {agreements.length > 3 && (
                <div className="text-center mt-4">
                  <button className="btn btn-ghost btn-sm text-white">
                    View All Agreements ({agreements.length})
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* My Installments */}
        {installments.length > 0 && (
          <div className="card bg-base-100 shadow-xl border border-base-300">
            <div className="card-body">
              <h2 className="card-title text-white">Upcoming Payments</h2>
              <div className="space-y-3">
                {installments
                  .filter((inst) => inst.status === 'pending' || inst.status === 'overdue')
                  .slice(0, 3)
                  .map((installment) => {
                    const isOverdue = new Date(installment.paymentWindowEnd) < new Date() && installment.status !== 'paid';
                    return (
                      <div
                        key={installment.id}
                        className={`p-4 bg-base-200 rounded-lg border ${
                          isOverdue ? 'border-error' : 'border-base-300'
                        }`}
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h3 className="font-semibold text-white">{installment.land?.title}</h3>
                            <p className="text-sm text-gray-300">{installment.land?.location}</p>
                            <div className="mt-2">
                              <p className="text-lg font-bold text-white">
                                ₹{installment.amount.toLocaleString()}
                              </p>
                              <p className="text-sm text-gray-400">
                                Payment window: {new Date(installment.paymentWindowStart).toLocaleDateString()} -{' '}
                                {new Date(installment.paymentWindowEnd).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <div className="text-right ml-4">
                            <div
                              className={`badge ${
                                isOverdue ? 'badge-error' : 'badge-warning'
                              }`}
                            >
                              {isOverdue ? 'Overdue' : installment.status}
                            </div>
                            <Link
                              to={`/dashboard/installments/${installment.id}`}
                              className="btn btn-primary btn-xs mt-2 block"
                            >
                              Pay Now
                            </Link>
                            <Link
                              to={`/dashboard/installments/${installment.id}`}
                              className="btn btn-ghost btn-xs mt-1 block"
                            >
                              View Details
                            </Link>
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
              {installments.filter((i) => i.status === 'pending' || i.status === 'overdue').length > 3 && (
                <div className="text-center mt-4">
                  <button className="btn btn-ghost btn-sm text-white">
                    View All Installments ({installments.length})
                  </button>
                </div>
              )}
              {installments.filter((i) => i.status === 'pending' || i.status === 'overdue').length === 0 && (
                <p className="text-center text-gray-400 py-4">No upcoming payments at the moment</p>
              )}
            </div>
          </div>
        )}

        {/* My Reservations */}
        {reservedLands.length > 0 && (
          <div className="card bg-base-100 shadow-xl border border-base-300">
            <div className="card-body">
              <div className="flex justify-between items-center mb-4">
                <h2 className="card-title text-white">My Reservations</h2>
                <Link to="/dashboard/buyer/reservations" className="btn btn-ghost btn-sm text-white">
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
                          <h3 className="font-semibold text-lg text-white">{land.title}</h3>
                          <p className="text-sm text-gray-300">{land.location}</p>
                          <p className="text-sm mt-2 text-white">
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
                              <p className="text-sm text-white">Next Payment</p>
                              <p className="font-semibold text-white">
                                ₹{nextPayment.amount.toLocaleString()}
                              </p>
                              <p className="text-xs text-gray-300">
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
                            <p className="text-sm text-gray-300">No pending payments</p>
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
              <h2 className="card-title text-white">Available Lands</h2>
              <Link to="/dashboard/buyer/lands" className="btn btn-ghost btn-sm text-white">
                Browse All
              </Link>
            </div>
            {availableLands.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-300">No available lands at the moment.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {availableLands.slice(0, 2).map((land) => (
                  <div key={land.id} className="card bg-base-200 shadow border border-base-300">
                    <div className="card-body">
                      <h3 className="card-title text-white">{land.title}</h3>
                      <p className="text-sm text-gray-300">{land.location}</p>
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

