import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import DashboardLayout from '../../components/layouts/DashboardLayout';
import {
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  DocumentTextIcon,
} from '@heroicons/react/24/outline';
import { propertyRequestAPI, agreementAPI } from '../../services/api';
import type { PropertyRequest, Agreement } from '../../types';
import { builderNavItems } from '../../constants/navigation';

export default function PropertyRequests() {
  const [requests, setRequests] = useState<PropertyRequest[]>([]);
  const [agreements, setAgreements] = useState<Record<string, Agreement>>({}); // Map propertyRequestId -> Agreement
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
  const [processing, setProcessing] = useState<string | null>(null);
  const [responseText, setResponseText] = useState<Record<string, string>>({});

  // Load requests function - used both in useEffect and manual calls
  // Uses GET /api/property-requests/builder/all with status filter (recommended for builder)
  const loadRequests = async () => {
    try {
      setLoading(true);
      console.log('🔄 Loading property requests with filter:', filter);
      
      // Use builder/all endpoint with status filter for all tabs
      const statusParam = filter === 'all' ? undefined : filter;
      console.log('📡 API: propertyRequestAPI.getBuilderAll()');
      console.log('🌐 Endpoint: GET /api/property-requests/builder/all?status=' + (statusParam || 'undefined (all)'));
      
      // Backend returns paginated response: { data, total, page, limit }
      // Includes buyer.name and property.title/price for table display
      const response = await propertyRequestAPI.getBuilderAll({
        status: statusParam,
        page: 1,
        limit: 100, // Load all for now, can add pagination later
      });
      
      console.log('📋 Property Requests Response:', {
        dataCount: response.data?.length || 0,
        total: response.total,
        filter: filter,
        statusParam: statusParam,
        firstRequest: response.data?.[0] || null,
      });
      
      const requestsData = response.data || [];
      setRequests(requestsData);
      
      // Fetch agreements for approved requests to check if agreement exists
      const approvedRequests = requestsData.filter((r) => r.status === 'approved');
      if (approvedRequests.length > 0) {
        try {
          console.log('🔍 Fetching agreements for approved requests...');
          // Fetch all agreements - returns Agreement[] directly (not paginated)
          const agreementsData = await agreementAPI.getAll();
          
          // Create a map: propertyRequestId -> Agreement
          const agreementsMap: Record<string, Agreement> = {};
          approvedRequests.forEach((request) => {
            const matchingAgreement = agreementsData.find(
              (agreement: Agreement) =>
                agreement.propertyId === request.propertyId &&
                agreement.buyerId === request.buyerId
            );
            if (matchingAgreement) {
              agreementsMap[request.id] = matchingAgreement;
            }
          });
          
          console.log('✅ Agreements mapped:', {
            approvedRequestsCount: approvedRequests.length,
            agreementsFound: Object.keys(agreementsMap).length,
            agreementsMap: agreementsMap,
          });
          
          setAgreements(agreementsMap);
        } catch (agreementError) {
          console.error('⚠️ Failed to fetch agreements (non-critical):', agreementError);
          // Don't fail the entire request if agreement fetch fails
          setAgreements({});
        }
      } else {
        setAgreements({});
      }
    } catch (error: unknown) {
      console.error('❌ Failed to load property requests:', error);
    } finally {
      setLoading(false);
    }
  };

  // Reload requests when filter changes
  useEffect(() => {
    loadRequests();
  }, [filter]);

  const handleApprove = async (requestId: string) => {
    if (!window.confirm('Are you sure you want to approve this request?')) {
      return;
    }

    try {
      setProcessing(requestId);
      await propertyRequestAPI.approve(requestId, responseText[requestId] || undefined);
      await loadRequests();
      setResponseText({ ...responseText, [requestId]: '' });
    } catch (error: unknown) {
      console.error('Failed to approve request:', error);
      const err = error as { response?: { data?: { message?: string } } };
      alert(err.response?.data?.message || 'Failed to approve request');
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async (requestId: string) => {
    if (!window.confirm('Are you sure you want to reject this request?')) {
      return;
    }

    try {
      setProcessing(requestId);
      await propertyRequestAPI.reject(requestId, responseText[requestId] || undefined);
      await loadRequests();
      setResponseText({ ...responseText, [requestId]: '' });
    } catch (error: unknown) {
      console.error('Failed to reject request:', error);
      const err = error as { response?: { data?: { message?: string } } };
      alert(err.response?.data?.message || 'Failed to reject request');
    } finally {
      setProcessing(null);
    }
  };

  // No need for client-side filtering - API handles it via status param
  const filteredRequests = requests;

  if (loading) {
    return (
      <DashboardLayout navItems={builderNavItems}>
        <div className="flex justify-center items-center h-64">
          <span className="loading loading-spinner loading-lg"></span>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout navItems={builderNavItems}>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-white">Property Requests</h1>
          <p className="text-gray-400 mt-1">Manage property purchase requests from buyers</p>
        </div>

        {/* Filter Tabs */}
        <div className="tabs tabs-boxed bg-gray-800/90 border border-gray-700">
          <a
            className={`tab text-white ${filter === 'pending' ? 'tab-active bg-blue-600' : 'hover:bg-gray-700'}`}
            onClick={() => setFilter('pending')}
          >
            <ClockIcon className="w-4 h-4 mr-2" />
            Pending
          </a>
          <a
            className={`tab text-white ${filter === 'approved' ? 'tab-active bg-green-600' : 'hover:bg-gray-700'}`}
            onClick={() => setFilter('approved')}
          >
            <CheckCircleIcon className="w-4 h-4 mr-2" />
            Approved
          </a>
          <a
            className={`tab text-white ${filter === 'rejected' ? 'tab-active bg-red-600' : 'hover:bg-gray-700'}`}
            onClick={() => setFilter('rejected')}
          >
            <XCircleIcon className="w-4 h-4 mr-2" />
            Rejected
          </a>
          <a
            className={`tab text-white ${filter === 'all' ? 'tab-active bg-purple-600' : 'hover:bg-gray-700'}`}
            onClick={() => setFilter('all')}
          >
            All
          </a>
        </div>

        {/* Requests List */}
        {filteredRequests.length === 0 ? (
          <div className="card bg-gray-800/90 shadow-xl border border-gray-700">
            <div className="card-body items-center text-center">
              <DocumentTextIcon className="w-16 h-16 text-gray-500 mb-4" />
              <h2 className="card-title text-white">No {filter !== 'all' ? filter : ''} requests found</h2>
              <p className="text-gray-400">
                {filter === 'pending'
                  ? 'New property requests will appear here'
                  : `No ${filter} requests at this time`}
              </p>
            </div>
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredRequests.map((request) => (
              <div key={request.id} className="card bg-gray-800/90 shadow-xl border border-gray-700">
                <div className="card-body">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="card-title text-white">
                        {request.property?.title || 'Property'}
                      </h3>
                      <p className="text-sm text-gray-400">
                        {request.property?.location}
                      </p>
                    </div>
                    <div
                      className={`badge badge-lg ${
                        request.status === 'pending'
                          ? 'badge-warning'
                          : request.status === 'approved'
                          ? 'badge-success'
                          : 'badge-error'
                      }`}
                    >
                      {request.status}
                    </div>
                  </div>

                  <div className="divider"></div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-400">Buyer</p>
                      <p className="font-semibold text-white">{request.buyer?.name || request.requester?.name || 'Unknown'}</p>
                      <p className="text-xs text-gray-500">{request.buyer?.email || request.requester?.email || 'N/A'}</p>
                    </div>

                    <div>
                      <p className="text-sm text-gray-400">Listed Price</p>
                      <p className="font-semibold text-lg text-primary">
                        PKR {request.property?.price?.toLocaleString() || '0'}
                      </p>
                    </div>

                    {request.requestedPrice && (
                      <div>
                        <p className="text-sm text-gray-400">Offer Price</p>
                        <p className="font-semibold text-lg text-success">
                          PKR {request.requestedPrice.toLocaleString()}
                        </p>
                      </div>
                    )}

                    <div>
                      <p className="text-sm text-gray-400">Requested On</p>
                      <p className="text-white">
                        {new Date(request.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  {request.status === 'pending' && (
                    <>
                      <div className="divider"></div>

                      <div className="form-control bg-transparent flex flex-col items-start gap-2">
                        <label className="label">
                          <span className="label-text text-white">Response Message (Optional)</span>
                        </label>
                        <textarea
                          value={responseText[request.id] || ''}
                          onChange={(e) =>
                            setResponseText({ ...responseText, [request.id]: e.target.value })
                          }
                          placeholder="Add a message with your decision..."
                          className="p-3 textarea textarea-bordered h-20 w-full text-white  border-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      <div className="card-actions justify-end mt-4">
                        <Link
                          to={`/dashboard/builder/lands/${request.propertyId}`}
                          className="btn btn-ghost btn-sm text-white border-white"
                        >
                          View Property
                        </Link>
                        <button
                          onClick={() => handleReject(request.id)}
                          className="btn btn-error btn-sm text-white border-white hover:bg-red-600 hover:text-white flex flex-row items-center gap-2"
                          disabled={processing === request.id}
                        >
                          {processing === request.id ? (
                            <span className="loading loading-spinner loading-xs"></span>
                          ) : (
                            <XCircleIcon className="w-4 h-4" />
                          )}
                          Reject
                        </button>
                        <button
                          onClick={() => handleApprove(request.id)}
                          className="btn btn-success btn-sm text-white border-white hover:bg-green-600 hover:text-white flex flex-row items-center gap-2"
                          disabled={processing === request.id}
                        >
                          {processing === request.id ? (
                            <span className="loading loading-spinner loading-xs"></span>
                          ) : (
                            <CheckCircleIcon className="w-4 h-4" />
                          )}
                          Approve
                        </button>
                      </div>
                    </>
                  )}

                  {request.builderResponse && (
                    <div className="mt-4">
                      <p className="text-sm text-gray-400">Your Response</p>
                      <p className="text-white bg-base-300 p-3 rounded mt-1">{request.builderResponse}</p>
                      {request.respondedAt && (
                        <p className="text-xs text-gray-400 mt-1">
                          Responded: {new Date(request.respondedAt).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  )}

                  {request.status === 'approved' && !agreements[request.id] && (
                    <>
                      <div className="divider"></div>
                      <div className="card-actions justify-end">
                        <Link
                          to={`/dashboard/builder/agreements/create?requestId=${request.id}`}
                          className="btn btn-primary btn-sm"
                        >
                          Create Agreement
                        </Link>
                      </div>
                    </>
                  )}
                  
                  {request.status === 'approved' && agreements[request.id] && (
                    <>
                      <div className="divider"></div>
                      <div className="card-actions justify-end">
                        <Link
                          to={`/dashboard/builder/agreements/${agreements[request.id].id}`}
                          className="btn btn-info btn-sm"
                        >
                          View Agreement ({agreements[request.id].status})
                        </Link>
                      </div>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
