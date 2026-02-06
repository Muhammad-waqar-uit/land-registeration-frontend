import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import DashboardLayout from '../../components/layouts/DashboardLayout';
import { landAPI, paymentAPI, propertyRequestAPI, agreementAPI, installmentAPI, resaleRequestAPI, buyerAPI } from '../../services/api';
import { useAppSelector } from '../../store/hooks';
import type { Land, Payment, PropertyRequest, Agreement, Installment, ResaleRequest } from '../../types';
import { buyerNavItems } from '../../constants/navigation';

export default function BuyerDashboard() {
  const { user } = useAppSelector((state) => state.auth);
  const [loading, setLoading] = useState(true);
  const [reservedLands, setReservedLands] = useState<Land[]>([]);
  const [ownedProperties, setOwnedProperties] = useState<Land[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [propertyRequests, setPropertyRequests] = useState<any[]>([]);
  const [agreements, setAgreements] = useState<Agreement[]>([]);
  const [installments, setInstallments] = useState<Installment[]>([]);
  const [resaleRequests, setResaleRequests] = useState<ResaleRequest[]>([]);
  const [stats, setStats] = useState({
    totalPaid: 0,
    pendingPayments: 0,
    pendingRequests: 0,
    pendingAgreements: 0,
    upcomingInstallments: 0,
    ownedProperties: 0,
  });

  const fetchData = useCallback(async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      
      console.log('🔄 Fetching buyer dashboard data...');
      console.log('🌐 API Endpoint: GET /api/property-requests/my-requests');
      console.log('📡 API Method: propertyRequestAPI.getMyRequests()');
      
      const [landsData, paymentsData, requestsResponse, agreementsData, installmentsData, resaleRequestsData, statsData] = await Promise.all([
        landAPI.getAll().catch((err) => {
          console.error('❌ Failed to fetch lands:', err);
          return [];
        }),
        paymentAPI.getByBuyer().catch((err) => {
          console.error('❌ Failed to fetch payments:', err);
          return [];
        }),
        propertyRequestAPI.getMyRequests().catch((err) => {
          console.error('❌ Failed to fetch property requests:', err);
          return { data: [], total: 0, page: 1, limit: 10 };
        }),
        agreementAPI.getAll({ buyerId: user?.id }).catch((err) => {
          console.error('❌ Failed to fetch agreements:', err);
          return [];
        }),
        installmentAPI.getMyInstallments().catch((err) => {
          console.error('❌ Failed to fetch installments:', err);
          return [];
        }),
        resaleRequestAPI.getMyRequests().catch((err) => {
          console.error('❌ Failed to fetch resale requests:', err);
          return [];
        }),
        buyerAPI.getStats().catch(() => ({
          totalPaid: 0,
          pendingPayments: 0,
          pendingRequests: 0,
          pendingAgreements: 0,
          upcomingInstallments: 0,
          ownedProperties: 0,
        })),
      ]);

      // Debug: Log the raw property requests response
      console.log('📋 Raw Property Requests API Response:', {
        isArray: Array.isArray(requestsResponse),
        hasData: !Array.isArray(requestsResponse) && 'data' in requestsResponse,
        fullResponse: requestsResponse,
        responseType: typeof requestsResponse,
        responseKeys: !Array.isArray(requestsResponse) ? Object.keys(requestsResponse) : 'N/A (is array)',
      });

      // Handle paginated response from getMyRequests
      const requestsData = Array.isArray(requestsResponse) ? requestsResponse : (requestsResponse.data || []);
      
      console.log('📋 Processed Property Requests Data:', {
        count: requestsData.length,
        isArray: Array.isArray(requestsData),
        firstRequest: requestsData[0] || null,
      });

      // Debug: Log the first request structure in detail
      if (requestsData.length > 0) {
        const firstRequest = requestsData[0];
        console.log('📋 First Property Request Full Structure:', {
          id: firstRequest.id,
          propertyId: firstRequest.propertyId,
          buyerId: firstRequest.buyerId,
          status: firstRequest.status,
          requestedPrice: firstRequest.requestedPrice,
          builderResponse: firstRequest.builderResponse,
          respondedAt: firstRequest.respondedAt,
          createdAt: firstRequest.createdAt,
          hasProperty: !!firstRequest.property,
          propertyKeys: firstRequest.property ? Object.keys(firstRequest.property) : 'No property object',
          propertyTitle: firstRequest.property?.title,
          propertyLocation: firstRequest.property?.location,
          propertyPrice: firstRequest.property?.price,
          hasBuyer: !!firstRequest.buyer,
          hasRequester: !!firstRequest.requester,
          allKeys: Object.keys(firstRequest),
          fullObject: JSON.stringify(firstRequest, null, 2),
        });
      }

      // Fetch land details for each property request using getById
      const uniquePropertyIds = [...new Set(requestsData.map((r: PropertyRequest) => r.propertyId).filter(Boolean))];
      console.log('🏠 Fetching land details for property IDs:', uniquePropertyIds);
      console.log(`📡 Using landAPI.getById() for ${uniquePropertyIds.length} properties`);
      
      // Fetch all land details in parallel
      const landDetailsMap = new Map<string, Land>();
      if (uniquePropertyIds.length > 0) {
        const landDetailsResults = await Promise.allSettled(
          uniquePropertyIds.map((propertyId) =>
            landAPI.getById(propertyId).catch((err) => {
              console.error(`❌ Failed to fetch land ${propertyId}:`, err);
              return null;
            })
          )
        );
        
        landDetailsResults.forEach((result, index) => {
          const propertyId = uniquePropertyIds[index];
          if (result.status === 'fulfilled' && result.value) {
            landDetailsMap.set(propertyId, result.value);
            console.log(`✅ Fetched land details for ${propertyId}:`, {
              title: result.value.title,
              location: result.value.location,
              price: result.value.price,
            });
          } else {
            console.warn(`⚠️ Could not fetch land details for ${propertyId}`);
          }
        });
        
        console.log(`✅ Fetched ${landDetailsMap.size} land details successfully`);
      }

      // Enrich property requests with fetched land data
      const enrichedRequests = requestsData.map((request: PropertyRequest) => {
        const landDetails = landDetailsMap.get(request.propertyId);
        return {
          ...request,
          property: landDetails || request.property || null,
        };
      });

      // Set property requests, agreements, installments, and resale requests
      setPropertyRequests(enrichedRequests);
      setAgreements(agreementsData || []);
      setInstallments(installmentsData || []);
      setResaleRequests(resaleRequestsData || []);

      // Handle paginated or array response for lands
      const landsArray: Land[] = Array.isArray(landsData) 
        ? landsData 
        : ((landsData && typeof landsData === 'object' && 'data' in landsData ? (landsData as { data: Land[] }).data : null) || []);

      // Filter buyer's payments
      const buyerPayments = (paymentsData || []).filter((p: Payment) => p.buyerId === user.id);
      setPayments(buyerPayments);

      // Get reserved land IDs from payments and property requests
      const reservedLandIdsFromPayments = [...new Set(buyerPayments.map((p: Payment) => p.landId))];
      const reservedLandIdsFromRequests = [...new Set(requestsData.filter((r: PropertyRequest) => r.status === 'approved').map((r: PropertyRequest) => r.propertyId))];
      const allReservedLandIds = [...new Set([...reservedLandIdsFromPayments, ...reservedLandIdsFromRequests])];
      
      // Filter reserved lands (status = 'locked' where buyer has payments or approved requests)
      const reserved = landsArray.filter(
        (land: Land) => land.status === 'locked' && allReservedLandIds.includes(land.id)
      );
      setReservedLands(reserved);

      // Filter owned properties (status = 'sold' or 'owned' and owned by user)
      const owned = landsArray.filter(
        (land: Land) => (land.status === 'sold' || land.status === 'owned') && land.ownerId === user.id
      );
      setOwnedProperties(owned);

      setStats(statsData);
    } catch (error) {
      console.error('Failed to fetch buyer dashboard data:', error);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Refresh when component comes into focus (e.g., after navigation back from payment)
  useEffect(() => {
    const handleFocus = () => {
      fetchData();
    };
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [fetchData]);

  if (loading) {
    return (
      <DashboardLayout navItems={buyerNavItems}>
        <div className="flex items-center justify-center min-h-[400px]">
          <span className="loading loading-spinner loading-lg"></span>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout navItems={buyerNavItems}>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-white">Buyer Dashboard</h1>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-7 gap-4 min-w-0">
          <div className="stat bg-base-100 rounded-lg shadow border border-base-300 min-w-0 overflow-hidden">
            <div className="stat-title text-white min-w-0 break-words line-clamp-2">Property Requests</div>
            <div className="stat-value text-info min-w-0 break-all truncate" title={String(stats.pendingRequests)}>{stats.pendingRequests}</div>
            <div className="stat-desc text-white min-w-0 break-words line-clamp-2">Pending approval</div>
          </div>

          <div className="stat bg-base-100 rounded-lg shadow border border-base-300 min-w-0 overflow-hidden">
            <div className="stat-title text-white min-w-0 break-words line-clamp-2">Agreements</div>
            <div className="stat-value text-warning min-w-0 break-all truncate" title={String(stats.pendingAgreements)}>{stats.pendingAgreements}</div>
            <div className="stat-desc text-white min-w-0 break-words line-clamp-2">Pending signature</div>
          </div>

          <div className="stat bg-base-100 rounded-lg shadow border border-base-300 min-w-0 overflow-hidden">
            <div className="stat-title text-white min-w-0 break-words line-clamp-2">Upcoming Payments</div>
            <div className="stat-value text-secondary min-w-0 break-all truncate" title={String(stats.upcomingInstallments)}>{stats.upcomingInstallments}</div>
            <div className="stat-desc text-white min-w-0 break-words line-clamp-2">Installments due</div>
          </div>

          <div className="stat bg-base-100 rounded-lg shadow border border-base-300 min-w-0 overflow-hidden">
            <div className="stat-title text-white min-w-0 break-words line-clamp-2">Owned Properties</div>
            <div className="stat-value text-accent min-w-0 break-all truncate" title={String(stats.ownedProperties)}>{stats.ownedProperties}</div>
            <div className="stat-desc text-white min-w-0 break-words line-clamp-2">Properties owned</div>
          </div>

          <div className="stat bg-base-100 rounded-lg shadow border border-base-300 min-w-0 overflow-hidden">
            <div className="stat-title text-white min-w-0 break-words line-clamp-2">Total Paid</div>
            <div className="stat-value text-success min-w-0 break-all truncate" title={`PKR ${stats.totalPaid.toLocaleString()}`}>PKR {stats.totalPaid.toLocaleString()}</div>
            <div className="stat-desc text-white min-w-0 break-words line-clamp-2">Installments completed</div>
          </div>

          <div className="stat bg-base-100 rounded-lg shadow border border-base-300 min-w-0 overflow-hidden">
            <div className="stat-title text-white min-w-0 break-words line-clamp-2">Pending Payments</div>
            <div className="stat-value text-error min-w-0 break-all truncate" title={String(stats.pendingPayments)}>{stats.pendingPayments}</div>
            <div className="stat-desc text-white min-w-0 break-words line-clamp-2">Due soon</div>
          </div>
        </div>

        {/* My Property Requests */}
        <div className="card bg-base-100 shadow-xl border border-base-300">
          <div className="card-body">
            <div className="flex justify-between items-center mb-4">
              <h2 className="card-title text-white">My Property Requests</h2>
              <Link to="/dashboard/buyer/property-requests" className="btn btn-ghost btn-sm text-white">
                View All
              </Link>
            </div>
            {propertyRequests.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-400 mb-4">No property requests yet</p>
                <Link to="/" className="btn btn-primary btn-sm">
                  Browse Properties
                </Link>
              </div>
            ) : (
              <>
                <div className="space-y-3">
                  {propertyRequests.slice(0, 3).map((request) => {
                    // Debug each request being rendered
                    console.log('📦 Rendering property request:', {
                      id: request.id,
                      propertyId: request.propertyId,
                      hasProperty: !!request.property,
                      propertyTitle: request.property?.title,
                      propertyLocation: request.property?.location,
                      requestedPrice: request.requestedPrice,
                      propertyPrice: request.property?.price,
                      builderResponse: request.builderResponse,
                      status: request.status,
                      allFields: Object.keys(request),
                    });

                    return (
                      <div
                        key={request.id}
                        className="p-4 bg-base-200 rounded-lg border border-base-300"
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h3 className="font-semibold text-white">
                              {request.property?.title || `Property ID: ${request.propertyId.substring(0, 8)}...`}
                            </h3>
                            <p className="text-sm text-gray-300">
                              {request.property?.location || `ID: ${request.propertyId}`}
                            </p>
                            <p className="text-sm text-white mt-1">
                              {request.requestedPrice 
                                ? `Requested Price: PKR ${request.requestedPrice.toLocaleString()}`
                                : request.property?.price
                                ? `Listed Price: PKR ${request.property.price.toLocaleString()}`
                                : 'Price: Not specified'}
                            </p>
                            <p className="text-xs text-gray-400 mt-1">
                              Status: <span className="capitalize font-semibold">{request.status}</span>
                              {request.respondedAt && (
                                <> • Responded: {new Date(request.respondedAt).toLocaleDateString()}</>
                              )}
                            </p>
                            {request.builderResponse && (
                              <div className="mt-2 p-2 bg-base-300 rounded">
                                <p className="text-sm font-semibold text-gray-300">Builder's Response:</p>
                                <p className="text-sm text-white mt-1">{request.builderResponse}</p>
                              </div>
                            )}
                          </div>
                        <div className="text-right ml-4 min-w-0 max-w-[140px]">
                          <div
                            className={`badge inline-flex items-center justify-center gap-1 shrink-0 max-w-full overflow-hidden ${
                              request.status === 'pending'
                                ? 'badge-warning'
                                : request.status === 'approved'
                                ? 'badge-success'
                                : 'badge-error'
                            }`}
                          >
                            <span className="truncate">{request.status}</span>
                          </div>
                          <p className="text-xs text-gray-400 mt-2">
                            {new Date(request.createdAt).toLocaleDateString()}
                          </p>
                          <Link
                            to={`/dashboard/buyer/lands/${request.propertyId}`}
                            className="btn btn-ghost btn-xs mt-2 text-white"
                          >
                            View Property
                          </Link>
                        </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                {propertyRequests.length > 3 && (
                  <div className="text-center mt-4">
                    <Link to="/dashboard/buyer/property-requests" className="btn btn-ghost btn-sm text-white">
                      View All Requests ({propertyRequests.length})
                    </Link>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* My Agreements */}
        {agreements.length > 0 && (
          <div className="card bg-base-100 shadow-xl border border-base-300">
            <div className="card-body">
              <div className="flex justify-between items-center mb-4">
                <h2 className="card-title text-white">My Agreements</h2>
                <Link to="/dashboard/buyer/agreements" className="btn btn-ghost btn-sm text-white">
                  View All
                </Link>
              </div>
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
                            Amount: PKR {agreement.terms.totalAmount.toLocaleString()}
                          </p>
                        )}
                        {agreement.terms?.installmentPlanYears && (
                          <p className="text-sm text-gray-400">
                            {agreement.terms.installmentPlanYears} year installment plan
                          </p>
                        )}
                      </div>
                      <div className="text-right ml-4 min-w-0 max-w-[160px]">
                        <div
                          className={`badge inline-flex items-center justify-center gap-1 shrink-0 max-w-full overflow-hidden ${
                            agreement.status === 'signed' || agreement.status === 'completed'
                              ? 'badge-success'
                              : agreement.status === 'builder_signed'
                              ? 'badge-info'
                              : 'badge-warning'
                          }`}
                        >
                          <span className="truncate">{agreement.status.replace('_', ' ')}</span>
                        </div>
                        <p className="text-xs text-gray-400 mt-2">
                          {new Date(agreement.createdAt).toLocaleDateString()}
                        </p>
                        <Link
                          to={`/dashboard/buyer/agreements/${agreement.id}`}
                          className="btn btn-ghost btn-xs text-white pb-3 pt-3 pr-3 pl-3"
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
                  <Link
                    to="/dashboard/buyer/agreements"
                    className="btn btn-ghost btn-sm text-white"
                  >
                    View All Agreements ({agreements.length})
                  </Link>
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
                                PKR {installment.amount.toLocaleString()}
                              </p>
                              <p className="text-sm text-gray-400">
                                Payment window: {new Date(installment.paymentWindowStart).toLocaleDateString()} -{' '}
                                {new Date(installment.paymentWindowEnd).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <div className="text-right ml-4">
                          <div
                            className={`badge inline-flex items-center justify-center gap-1 shrink-0 max-w-full overflow-hidden ${
                              isOverdue ? 'badge-error' : 'badge-warning'
                            }`}
                          >
                            <span className="truncate">{isOverdue ? 'Overdue' : installment.status}</span>
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

        {/* My Reserved Properties */}
        {reservedLands.length > 0 && (
          <div className="card bg-base-100 shadow-xl border border-base-300">
            <div className="card-body">
              <div className="flex justify-between items-center mb-4">
                <h2 className="card-title text-white">My Reserved Properties</h2>
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
                                PKR {nextPayment.amount.toLocaleString()}
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

        {/* My Owned Properties */}
        {ownedProperties.length > 0 && (
          <div className="card bg-base-100 shadow-xl border border-base-300">
            <div className="card-body">
              <div className="flex justify-between items-center mb-4">
                <h2 className="card-title text-white">My Owned Properties</h2>
                <Link to="/dashboard/buyer/resale-request/create" className="btn btn-primary btn-sm text-white">
                  Request Resale
                </Link>
              </div>
              <div className="space-y-4">
                {ownedProperties.slice(0, 3).map((property) => {
                  const resaleRequest = resaleRequests.find((r) => r.propertyId === property.id);
                  return (
                    <div
                      key={property.id}
                      className="p-4 bg-base-200 rounded-lg border border-base-300"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg text-white">{property.title}</h3>
                          <p className="text-sm text-gray-300">{property.location}</p>
                          <p className="text-sm mt-2 text-white">
                            Size: {property.size} sq ft
                          </p>
                          <p className="text-lg font-bold text-primary mt-1">
                            PKR {property.price.toLocaleString()}
                          </p>
                          {resaleRequest && (
                            <div className="mt-2">
                              <span className={`badge inline-flex items-center justify-center gap-1 shrink-0 max-w-full overflow-hidden ${
                                resaleRequest.status === 'pending' ? 'badge-warning' :
                                resaleRequest.status === 'approved' ? 'badge-success' :
                                resaleRequest.status === 'listed' ? 'badge-info' :
                                resaleRequest.status === 'sold' ? 'badge-neutral' :
                                'badge-error'
                              }`}>
                                <span className="truncate">Resale: {resaleRequest.status}</span>
                              </span>
                              {resaleRequest.requestedPrice && (
                                <span className="text-sm text-gray-400 ml-2">
                                  Requested: PKR {resaleRequest.requestedPrice.toLocaleString()}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                        <div className="text-right ml-4">
                          <div className="badge badge-success mb-2 inline-flex items-center shrink-0 max-w-full overflow-hidden">
                            <span className="truncate">Owned</span>
                          </div>
                          <Link
                            to={`/dashboard/buyer/lands/${property.id}`}
                            className="btn btn-ghost btn-sm block"
                          >
                            View Details
                          </Link>
                          {!resaleRequest && (
                            <Link
                              to={`/dashboard/buyer/resale-request/create?propertyId=${property.id}`}
                              className="btn btn-primary btn-sm mt-2 block"
                            >
                              Request Resale
                            </Link>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              {ownedProperties.length > 3 && (
                <div className="text-center mt-4">
                  <Link to="/dashboard/buyer/properties" className="btn btn-ghost btn-sm text-white">
                    View All Properties ({ownedProperties.length})
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}

      </div>
    </DashboardLayout>
  );
}

