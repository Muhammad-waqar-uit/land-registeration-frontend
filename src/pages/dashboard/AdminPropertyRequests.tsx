import { useState, useEffect, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import DashboardLayout from '../../components/layouts/DashboardLayout';
import {
  HomeIcon,
  FolderIcon,
  UserGroupIcon,
  CurrencyDollarIcon,
  BuildingOfficeIcon,
  MapPinIcon,
  DocumentTextIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';
import { propertyRequestAPI } from '../../services/api';
import type { PropertyRequest } from '../../types';

const navItems = [
  { name: 'Overview', path: '/dashboard/admin', icon: HomeIcon },
  { name: 'Project Approvals', path: '/dashboard/admin/projects', icon: FolderIcon },
  { name: 'Approved Projects', path: '/dashboard/admin/approved-projects', icon: BuildingOfficeIcon },
  { name: 'All Lands', path: '/dashboard/admin/all-lands', icon: MapPinIcon },
  { name: 'Builder Verification', path: '/dashboard/admin/builders', icon: UserGroupIcon },
  { name: 'Mint Tokens', path: '/dashboard/admin/mint-tokens', icon: CurrencyDollarIcon },
  { name: 'Property Requests', path: '/dashboard/admin/property-requests', icon: DocumentTextIcon },
];

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
      const response = await propertyRequestAPI.getAll({
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
      <DashboardLayout navItems={navItems}>
        <div className="flex justify-center items-center h-64">
          <span className="loading loading-spinner loading-lg"></span>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout navItems={navItems}>
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
                      <tr className="text-black">
                        <th className="text-black">Property</th>
                        <th className="text-black">Buyer</th>
                        <th className="text-black">Listed Price</th>
                        <th className="text-black">Offer Price</th>
                        <th className="text-black">Status</th>
                        <th className="text-black">Requested</th>
                        <th className="text-black">Response</th>
                        <th className="text-black">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {requests.map((request) => (
                        <tr key={request.id} className="text-black">
                          <td>
                            <div>
                              <div className="font-medium">{request.property?.title || 'N/A'}</div>
                              <div className="text-sm text-gray-600">{request.property?.location || ''}</div>
                            </div>
                          </td>
                          <td>
                            <div>
                              <div className="font-medium">{request.buyer?.name || request.requester?.name || 'Unknown'}</div>
                              <div className="text-sm text-gray-600">{request.buyer?.email || request.requester?.email || 'N/A'}</div>
                            </div>
                          </td>
                          <td className="font-semibold">
                            PKR {request.property?.price?.toLocaleString() || '0'}
                          </td>
                          <td className="font-semibold">
                            {request.requestedPrice ? (
                              <span className="text-green-600">PKR {request.requestedPrice.toLocaleString()}</span>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
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
                              to={`/lands/${request.propertyId}`}
                              className="btn btn-ghost btn-xs"
                            >
                              View Property
                            </Link>
                          </td>
                        </tr>
                      ))}
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
