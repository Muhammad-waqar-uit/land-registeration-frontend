import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import DashboardLayout from '../../components/layouts/DashboardLayout';
import { landAPI, paymentAPI, propertyRequestAPI, agreementAPI, installmentAPI, resaleRequestAPI } from '../../services/api';
import { useAppSelector } from '../../store/hooks';
import type { Land, Payment, PropertyRequest, Agreement, Installment, ResaleRequest } from '../../types';
import { buyerNavItems } from '../../constants/navigation';

/**
 * Helper function to get IPFS URL from hash JSON string
 * Parses the IPFS hash JSON and constructs the IPFS gateway URL
 */
const getIPFSUrl = (ipfsHashJson?: string): string | null => {
  if (!ipfsHashJson) return null;
  
  try {
    const hashData = JSON.parse(ipfsHashJson);
    if (hashData?.hash) {
      // Use gateway.pinata.cloud format
      return `https://gateway.pinata.cloud/ipfs/${hashData.hash}`;
    }
  } catch (error) {
    console.error('Failed to parse IPFS hash:', error);
  }
  
  return null;
};

/**
 * Get image URL for a land - prioritizes imageIPFSHash over imageUrl
 */
const getLandImageUrl = (land: Land): string | null => {
  // Prioritize IPFS hash over direct URL
  if (land.imageIPFSHash) {
    return getIPFSUrl(land.imageIPFSHash);
  }
  
  // Fallback to direct imageUrl only if IPFS hash is not available
  if (land.imageUrl) {
    return land.imageUrl;
  }
  
  return null;
};

export default function BuyerDashboard() {
  const { user } = useAppSelector((state) => state.auth);
  const [loading, setLoading] = useState(true);
  const [availableLands, setAvailableLands] = useState<Land[]>([]);
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
      
      const [landsData, paymentsData, requestsResponse, agreementsData, installmentsData, resaleRequestsData] = await Promise.all([
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

      // Filter available lands (status = 'available')
      const availableIds = landsArray.filter((land: Land) => land.status === 'available').map((land: Land) => land.id);
      
      // Fetch full details for available lands using getById to ensure all data is present
      console.log('🏠 Fetching full details for available lands:', availableIds);
      console.log(`📡 Using landAPI.getById() for ${availableIds.length} available lands`);
      
      const availableLandsMap = new Map<string, Land>();
      if (availableIds.length > 0) {
        const availableLandsResults = await Promise.allSettled(
          availableIds.map((landId) =>
            landAPI.getById(landId).catch((err) => {
              console.error(`❌ Failed to fetch available land ${landId}:`, err);
              // Fallback to original land data if getById fails
              return landsArray.find((l: Land) => l.id === landId) || null;
            })
          )
        );
        
        availableLandsResults.forEach((result, index) => {
          const landId = availableIds[index];
          if (result.status === 'fulfilled' && result.value) {
            availableLandsMap.set(landId, result.value);
            console.log(`✅ Fetched available land details for ${landId}:`, {
              title: result.value.title,
              location: result.value.location,
              price: result.value.price,
            });
          } else {
            // Fallback to original data if getById failed
            const originalLand = landsArray.find((l: Land) => l.id === landId);
            if (originalLand) {
              availableLandsMap.set(landId, originalLand);
              console.warn(`⚠️ Using original data for available land ${landId} (getById failed)`);
            }
          }
        });
        
        console.log(`✅ Fetched ${availableLandsMap.size} available land details successfully`);
      }
      
      // Use fetched details or fallback to original data
      const available = Array.from(availableLandsMap.values());
      setAvailableLands(available);

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

      // Filter owned properties (status = 'sold' and owned by user)
      const owned = landsArray.filter(
        (land: Land) => land.status === 'sold' && land.ownerId === user.id
      );
      setOwnedProperties(owned);

      // Calculate stats
      const verifiedPayments = buyerPayments.filter((p: Payment) => p.status === 'verified');
      const pendingPayments = buyerPayments.filter((p: Payment) => p.status === 'pending');
      const totalPaid = verifiedPayments.reduce((sum: number, p: Payment) => sum + p.amount, 0);
      const pendingRequestsCount = requestsData.filter((r: PropertyRequest) => r.status === 'pending').length;
      const pendingAgreementsCount = (agreementsData || []).filter((a: Agreement) => a.status === 'pending' || a.status === 'buyer_signed').length;
      const upcomingInstallmentsCount = (installmentsData || []).filter((i: Installment) => i.status === 'pending').length;

      setStats({
        totalPaid,
        pendingPayments: pendingPayments.length,
        pendingRequests: pendingRequestsCount,
        pendingAgreements: pendingAgreementsCount,
        upcomingInstallments: upcomingInstallmentsCount,
        ownedProperties: owned.length,
      });
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
        <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
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
            <div className="stat-title text-white">Owned Properties</div>
            <div className="stat-value text-accent">{stats.ownedProperties}</div>
            <div className="stat-desc text-white">Properties owned</div>
          </div>

          <div className="stat bg-base-100 rounded-lg shadow border border-base-300">
            <div className="stat-title text-white">Total Paid</div>
            <div className="stat-value text-success">PKR {stats.totalPaid.toLocaleString()}</div>
            <div className="stat-desc text-white">Installments completed</div>
          </div>

          <div className="stat bg-base-100 rounded-lg shadow border border-base-300">
            <div className="stat-title text-white">Pending Payments</div>
            <div className="stat-value text-error">{stats.pendingPayments}</div>
            <div className="stat-desc text-white">Due soon</div>
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
                            Amount: PKR {agreement.terms.totalAmount.toLocaleString()}
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
                              <span className={`badge ${
                                resaleRequest.status === 'pending' ? 'badge-warning' :
                                resaleRequest.status === 'approved' ? 'badge-success' :
                                resaleRequest.status === 'listed' ? 'badge-info' :
                                resaleRequest.status === 'sold' ? 'badge-neutral' :
                                'badge-error'
                              }`}>
                                Resale: {resaleRequest.status}
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
                          <div className="badge badge-success mb-2">Owned</div>
                          <Link
                            to={`/lands/${property.id}`}
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
                {availableLands.slice(0, 2).map((land) => {
                  const imageUrl = getLandImageUrl(land);
                  
                  return (
                    <div key={land.id} className="card bg-base-200 shadow border border-base-300">
                      {/* Image Section */}
                      <figure className="h-48 bg-base-300 relative">
                        {imageUrl ? (
                          <img
                            src={imageUrl}
                            alt={land.title}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              // Fallback if image fails to load
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                              const parent = target.parentElement;
                              if (parent) {
                                parent.innerHTML = '<div class="flex items-center justify-center h-full"><span class="text-6xl">🏠</span></div>';
                              }
                            }}
                          />
                        ) : (
                          <div className="flex items-center justify-center h-full">
                            <span className="text-6xl">🏠</span>
                          </div>
                        )}
                      </figure>
                      
                      <div className="card-body">
                        <h3 className="card-title text-white">{land.title}</h3>
                        <p className="text-sm text-gray-300">{land.location}</p>
                        <p className="text-2xl font-bold text-primary">PKR {land.price.toLocaleString()}</p>
                        {land.size && (
                          <p className="text-sm text-gray-400">Size: {land.size} sq ft</p>
                        )}
                        <div className="card-actions justify-end mt-4">
                          <Link
                            to={`/lands/${land.id}`}
                            className="btn btn-primary btn-sm"
                          >
                            View Details
                          </Link>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

