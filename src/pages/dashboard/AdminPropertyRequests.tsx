import { useState, useEffect, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import DashboardLayout from '../../components/layouts/DashboardLayout';
import {
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  DocumentTextIcon,
} from '@heroicons/react/24/outline';
import { propertyRequestAPI } from '../../services/api';
import type { PropertyRequest } from '../../types';
import { adminNavItems } from '../../constants/navigation';

export default function AdminPropertyRequests() {
  const [searchParams, setSearchParams] = useSearchParams();
  const page = parseInt(searchParams.get('page') || '1', 10);
  const limit = parseInt(searchParams.get('limit') || '20', 10);
  const statusFilter = searchParams.get('status') || 'all';

  const [requests, setRequests] = useState<PropertyRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);

  const loadRequests = useCallback(async () => {
    try {
      setLoading(true);
      console.log('🔄 Fetching all property requests...');
      console.log('🌐 API Endpoint: GET /api/property-requests');
      console.log('📡 API Method: propertyRequestAPI.getAll()');
      console.log('📋 Query Params:', { page, limit, status: statusFilter !== 'all' ? statusFilter : undefined });
      
      const response = await propertyRequestAPI.getAll({
        page,
        limit,
        status: statusFilter !== 'all' ? statusFilter : undefined,
      });
      
      console.log('📋 Property Requests API Response:', {
        dataCount: response.data?.length || 0,
        total: response.total,
        page: response.page,
        limit: response.limit,
        firstRequest: response.data?.[0] || null,
      });
      
      // Debug: Log first request structure
      if (response.data && response.data.length > 0) {
        const firstRequest = response.data[0];
        console.log('📋 First Property Request Full Structure:', {
          id: firstRequest.id,
          propertyId: firstRequest.propertyId,
          buyerId: firstRequest.buyerId,
          status: firstRequest.status,
          hasBuyer: !!firstRequest.buyer,
          buyerName: firstRequest.buyer?.name,
          buyerEmail: firstRequest.buyer?.email,
          hasRequester: !!firstRequest.requester,
          requesterName: firstRequest.requester?.name,
          hasProperty: !!firstRequest.property,
          propertyTitle: firstRequest.property?.title,
          propertyPrice: firstRequest.property?.price,
          requestedPrice: firstRequest.requestedPrice,
          allKeys: Object.keys(firstRequest),
          fullObject: JSON.stringify(firstRequest, null, 2),
        });
      }
      
      setRequests(response.data || []);
      setTotal(response.total || 0);
    } catch (error: unknown) {
      console.error('❌ Failed to load property requests:', error);
      const err = error as { response?: { data?: { message?: string } } };
      alert(err.response?.data?.message || 'Failed to load property requests');
    } finally {
      setLoading(false);
    }
  }, [page, limit, statusFilter]);

  useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  const handleFilterChange = (status: string) => {
    setSearchParams((prev) => {
      const newParams = new URLSearchParams(prev);
      if (status === 'all') {
        newParams.delete('status');
      } else {
        newParams.set('status', status);
      }
      newParams.set('page', '1');
      return newParams;
    });
  };

  const handlePageChange = (newPage: number) => {
    setSearchParams((prev) => {
      const newParams = new URLSearchParams(prev);
      newParams.set('page', newPage.toString());
      return newParams;
    });
  };

  const totalPages = Math.ceil(total / limit);

  if (loading) {
    return (
      <DashboardLayout navItems={adminNavItems}>
        <div className="flex justify-center items-center h-64">
          <span className="loading loading-spinner loading-lg"></span>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout navItems={adminNavItems}>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-white">All Property Requests</h1>
          <p className="text-gray-400 mt-1">View and monitor all property requests in the system</p>
        </div>

        {/* Filter Tabs */}
        <div className="tabs tabs-boxed bg-gray-800/90 border border-gray-700">
          <a
            className={`tab text-white ${statusFilter === 'all' ? 'tab-active bg-purple-600' : 'hover:bg-gray-700'}`}
            onClick={() => handleFilterChange('all')}
          >
            All ({total})
          </a>
          <a
            className={`tab text-white ${statusFilter === 'pending' ? 'tab-active bg-blue-600' : 'hover:bg-gray-700'}`}
            onClick={() => handleFilterChange('pending')}
          >
            <ClockIcon className="w-4 h-4 mr-2" />
            Pending
          </a>
          <a
            className={`tab text-white ${statusFilter === 'approved' ? 'tab-active bg-green-600' : 'hover:bg-gray-700'}`}
            onClick={() => handleFilterChange('approved')}
          >
            <CheckCircleIcon className="w-4 h-4 mr-2" />
            Approved
          </a>
          <a
            className={`tab text-white ${statusFilter === 'rejected' ? 'tab-active bg-red-600' : 'hover:bg-gray-700'}`}
            onClick={() => handleFilterChange('rejected')}
          >
            <XCircleIcon className="w-4 h-4 mr-2" />
            Rejected
          </a>
          <a
            className={`tab text-white ${statusFilter === 'cancelled' ? 'tab-active bg-gray-600' : 'hover:bg-gray-700'}`}
            onClick={() => handleFilterChange('cancelled')}
          >
            Cancelled
          </a>
        </div>

        {/* Requests List */}
        {requests.length === 0 ? (
          <div className="card bg-gray-800/90 shadow-xl border border-gray-700">
            <div className="card-body items-center text-center">
              <DocumentTextIcon className="w-16 h-16 text-gray-500 mb-4" />
              <h2 className="card-title text-white">No requests found</h2>
              <p className="text-gray-400">
                {statusFilter === 'all'
                  ? 'No property requests in the system yet'
                  : `No ${statusFilter} requests at this time`}
              </p>
            </div>
          </div>
        ) : (
          <>
            <div className="card bg-gray-800/90 shadow-xl border border-gray-700">
              <div className="card-body">
                <div className="overflow-x-auto">
                  <table className="table table-zebra">
                    <thead>
                      <tr className="text-white">
                        <th className="text-white">Property Name</th>
                        <th className="text-white">Buyer Name</th>
                        <th className="text-white">Price</th>
                        <th className="text-white">Status</th>
                        <th className="text-white">Requested</th>
                        <th className="text-white">Response</th>
                        <th className="text-white">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {requests.map((request) => {
                        // Debug each request
                        console.log('📦 Rendering property request:', {
                          id: request.id,
                          propertyId: request.propertyId,
                          hasBuyer: !!request.buyer,
                          buyerName: request.buyer?.name,
                          hasRequester: !!request.requester,
                          requesterName: request.requester?.name,
                          hasProperty: !!request.property,
                          propertyTitle: request.property?.title,
                          propertyPrice: request.property?.price,
                          status: request.status,
                        });

                        return (
                          <tr key={request.id} className="text-white">
                            <td className="font-medium">
                              {request.property?.title || 'N/A'}
                            </td>
                            <td className="font-medium">
                              {request.buyer?.name || request.requester?.name || 'N/A'}
                            </td>
                            <td className="font-semibold">
                              PKR {request.property?.price?.toLocaleString() || '0'}
                            </td>
                            <td>
                              <span
                                className={`badge ${
                                  request.status === 'pending'
                                    ? 'badge-warning'
                                    : request.status === 'approved'
                                    ? 'badge-success'
                                    : request.status === 'rejected'
                                    ? 'badge-error'
                                    : 'badge-ghost'
                                }`}
                              >
                                {request.status}
                              </span>
                            </td>
                            <td className="text-gray-700">
                              {new Date(request.createdAt).toLocaleDateString()}
                            </td>
                            <td>
                              {request.builderResponse ? (
                                <div>
                                  <p className="text-sm">{request.builderResponse}</p>
                                  {request.respondedAt && (
                                    <p className="text-xs text-gray-500">
                                      {new Date(request.respondedAt).toLocaleDateString()}
                                    </p>
                                  )}
                                </div>
                              ) : (
                                <span className="text-gray-400">-</span>
                              )}
                            </td>
                            <td>
                              <Link
                                to={`/dashboard/admin/lands/${request.propertyId}`}
                                className="btn btn-ghost btn-xs"
                              >
                                View Property
                              </Link>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-2">
                <button
                  className="btn btn-sm btn-ghost text-white"
                  onClick={() => handlePageChange(page - 1)}
                  disabled={page === 1}
                >
                  Previous
                </button>
                <span className="text-white">
                  Page {page} of {totalPages}
                </span>
                <button
                  className="btn btn-sm btn-ghost text-white"
                  onClick={() => handlePageChange(page + 1)}
                  disabled={page >= totalPages}
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
