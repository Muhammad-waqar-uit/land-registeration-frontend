import { useState, useEffect, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import DashboardLayout from '../../components/layouts/DashboardLayout';
import {
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  TrashIcon,
  DocumentTextIcon,
} from '@heroicons/react/24/outline';
import { propertyRequestAPI } from '../../services/api';
import type { PropertyRequest } from '../../types';
import { buyerNavItems } from '../../constants/navigation';

export default function BuyerPropertyRequests() {
  const [searchParams, setSearchParams] = useSearchParams();
  const page = parseInt(searchParams.get('page') || '1', 10);
  const limit = parseInt(searchParams.get('limit') || '10', 10);
  const statusFilter = searchParams.get('status') || 'all';

  const [requests, setRequests] = useState<PropertyRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [cancelling, setCancelling] = useState<string | null>(null);

  const loadRequests = useCallback(async () => {
    try {
      setLoading(true);
      const response = await propertyRequestAPI.getMyRequests({
        page,
        limit,
        status: statusFilter !== 'all' ? statusFilter : undefined,
      });
      setRequests(response.data || []);
      setTotal(response.total || 0);
    } catch (error: unknown) {
      console.error('Failed to load property requests:', error);
      const err = error as { response?: { data?: { message?: string } } };
      alert(err.response?.data?.message || 'Failed to load property requests');
    } finally {
      setLoading(false);
    }
  }, [page, limit, statusFilter]);

  useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  const handleCancel = async (requestId: string) => {
    if (!window.confirm('Are you sure you want to cancel this request? The property will become available for other buyers.')) {
      return;
    }

    try {
      setCancelling(requestId);
      await propertyRequestAPI.cancel(requestId);
      await loadRequests();
    } catch (error: unknown) {
      console.error('Failed to cancel request:', error);
      const err = error as { response?: { data?: { message?: string } } };
      alert(err.response?.data?.message || 'Failed to cancel request');
    } finally {
      setCancelling(null);
    }
  };

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
      <DashboardLayout navItems={buyerNavItems}>
        <div className="flex justify-center items-center h-64">
          <span className="loading loading-spinner loading-lg"></span>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout navItems={buyerNavItems}>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-white">My Property Requests</h1>
          <p className="text-gray-400 mt-1">View and manage your property purchase requests</p>
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
                  ? "You haven't made any property requests yet"
                  : `No ${statusFilter} requests at this time`}
              </p>
              <Link to="/" className="btn btn-primary btn-sm mt-4">
                Browse Properties
              </Link>
            </div>
          </div>
        ) : (
          <>
            <div className="grid gap-4">
              {requests.map((request) => (
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
                            : request.status === 'rejected'
                            ? 'badge-error'
                            : 'badge-ghost'
                        }`}
                      >
                        {request.status}
                      </div>
                    </div>

                    <div className="divider"></div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-400">Listed Price</p>
                        <p className="font-semibold text-lg text-primary">
                          PKR {request.property?.price?.toLocaleString() || '0'}
                        </p>
                      </div>

                      <div>
                        <p className="text-sm text-gray-400">Requested On</p>
                        <p className="text-white">
                          {new Date(request.createdAt).toLocaleDateString()}
                        </p>
                      </div>

                      {request.respondedAt && (
                        <div>
                          <p className="text-sm text-gray-400">Response Date</p>
                          <p className="text-white">
                            {new Date(request.respondedAt).toLocaleDateString()}
                          </p>
                        </div>
                      )}
                    </div>

                    {request.builderResponse && (
                      <div className="mt-4">
                        <p className="text-sm text-gray-400">Builder's Response</p>
                        <p className="text-white bg-base-300 p-3 rounded mt-1">{request.builderResponse}</p>
                      </div>
                    )}

                    <div className="divider"></div>

                    <div className="card-actions justify-end">
                      <Link
                        to={`/lands/${request.propertyId}`}
                        className="btn btn-ghost btn-sm flex flex-row text-white border-white"
                      >
                        View Property
                      </Link>
                      {request.status === 'pending' && (
                        <button
                          onClick={() => handleCancel(request.id)}
                          className="btn btn-error btn-sm"
                          disabled={cancelling === request.id}
                        >
                          {cancelling === request.id ? (
                            <span className="loading loading-spinner loading-xs"></span>
                          ) : (
                            <TrashIcon className="w-4 h-4" />
                          )}
                          Cancel Request
                        </button>
                      )}
                      {request.status === 'approved' && (
                        <Link
                          to={`/dashboard/buyer/agreements/${request.agreementId}`}
                          className="btn btn-primary btn-sm"
                        >
                          View Agreement
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              ))}
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
