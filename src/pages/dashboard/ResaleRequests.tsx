import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { resaleRequestAPI } from '../../services/api';
import type { ResaleRequest } from '../../types';
import { 
  BuildingOfficeIcon, 
  CheckCircleIcon, 
  XCircleIcon, 
  ClockIcon,
  RectangleStackIcon,
  ExclamationCircleIcon 
} from '@heroicons/react/24/outline';

const ResaleRequests: React.FC = () => {
  const [resaleRequests, setResaleRequests] = useState<ResaleRequest[]>([]);
  const [filteredRequests, setFilteredRequests] = useState<ResaleRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    fetchResaleRequests();
  }, []);

  useEffect(() => {
    filterRequests(activeFilter);
  }, [resaleRequests, activeFilter]);

  const fetchResaleRequests = async () => {
    try {
      setLoading(true);
      const data = await resaleRequestAPI.getBuilder();
      const requestsArray = Array.isArray(data) ? data : [];
      setResaleRequests(requestsArray);
      setError('');
    } catch (err: any) {
      console.error('Error fetching resale requests:', err);
      setError(err.response?.data?.message || 'Failed to load resale requests');
      setResaleRequests([]);
    } finally {
      setLoading(false);
    }
  };

  const filterRequests = (filter: string) => {
    if (filter === 'all') {
      setFilteredRequests(resaleRequests);
    } else {
      setFilteredRequests(
        resaleRequests.filter((req) => req.status === filter)
      );
    }
  };

  const handleFilterChange = (filter: string) => {
    setActiveFilter(filter);
  };

  const handleApprove = async (id: string) => {
    try {
      setProcessingId(id);
      await resaleRequestAPI.approve(id);
      await fetchResaleRequests();
      setError('');
    } catch (err: any) {
      console.error('Error approving resale request:', err);
      setError(err.response?.data?.message || 'Failed to approve resale request');
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (id: string) => {
    try {
      setProcessingId(id);
      await resaleRequestAPI.reject(id);
      await fetchResaleRequests();
      setError('');
    } catch (err: any) {
      console.error('Error rejecting resale request:', err);
      setError(err.response?.data?.message || 'Failed to reject resale request');
    } finally {
      setProcessingId(null);
    }
  };

  const handleList = async (id: string) => {
    try {
      setProcessingId(id);
      await resaleRequestAPI.list(id);
      await fetchResaleRequests();
      setError('');
    } catch (err: any) {
      console.error('Error listing resale:', err);
      setError(err.response?.data?.message || 'Failed to list resale');
    } finally {
      setProcessingId(null);
    }
  };

  const handleMarkSold = async (id: string) => {
    try {
      setProcessingId(id);
      await resaleRequestAPI.markSold(id);
      await fetchResaleRequests();
      setError('');
    } catch (err: any) {
      console.error('Error marking as sold:', err);
      setError(err.response?.data?.message || 'Failed to mark as sold');
    } finally {
      setProcessingId(null);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { color: 'badge-warning', icon: ClockIcon, text: 'Pending' },
      approved: { color: 'badge-success', icon: CheckCircleIcon, text: 'Approved' },
      rejected: { color: 'badge-error', icon: XCircleIcon, text: 'Rejected' },
      listed: { color: 'badge-info', icon: RectangleStackIcon, text: 'Listed' },
      sold: { color: 'badge-neutral', icon: CheckCircleIcon, text: 'Sold' },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <span className={`badge ${config.color} gap-1`}>
        <Icon className="h-4 w-4" />
        {config.text}
      </span>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const filterTabs = [
    { key: 'all', label: 'All', count: resaleRequests.length },
    { key: 'pending', label: 'Pending', count: resaleRequests.filter(r => r.status === 'pending').length },
    { key: 'approved', label: 'Approved', count: resaleRequests.filter(r => r.status === 'approved').length },
    { key: 'rejected', label: 'Rejected', count: resaleRequests.filter(r => r.status === 'rejected').length },
    { key: 'listed', label: 'Listed', count: resaleRequests.filter(r => r.status === 'listed').length },
    { key: 'sold', label: 'Sold', count: resaleRequests.filter(r => r.status === 'sold').length },
  ];

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Resale Requests</h1>
          <p className="text-gray-600 mt-1">Manage property resale requests from owners</p>
        </div>
      </div>

      {error && (
        <div className="alert alert-error mb-6">
          <ExclamationCircleIcon className="h-6 w-6" />
          <span>{error}</span>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="tabs tabs-boxed mb-6">
        {filterTabs.map((tab) => (
          <button
            key={tab.key}
            className={`tab gap-2 ${activeFilter === tab.key ? 'tab-active' : ''}`}
            onClick={() => handleFilterChange(tab.key)}
          >
            {tab.label}
            <span className="badge badge-sm">{tab.count}</span>
          </button>
        ))}
      </div>

      {/* Resale Requests Grid */}
      {filteredRequests.length === 0 ? (
        <div className="text-center py-12">
          <BuildingOfficeIcon className="h-16 w-16 mx-auto text-gray-400 mb-4" />
          <h3 className="text-xl font-semibold text-gray-700 mb-2">No resale requests found</h3>
          <p className="text-gray-500 mb-4">
            {activeFilter === 'all'
              ? 'No property owners have requested resale yet.'
              : `No ${activeFilter} resale requests at the moment.`}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredRequests.map((request) => (
            <div
              key={request.id}
              className="card bg-base-100 shadow-xl hover:shadow-2xl transition-shadow"
            >
              <div className="card-body">
                {/* Status Badge */}
                <div className="flex justify-between items-start mb-2">
                  {getStatusBadge(request.status)}
                  <span className="text-xs text-gray-500">
                    {formatDate(request.createdAt)}
                  </span>
                </div>

                {/* Requested Price */}
                <h2 className="card-title text-2xl text-primary">
                  {formatCurrency(request.requestedPrice)}
                </h2>

                {/* Property Info */}
                {request.property && (
                  <div className="text-sm text-gray-600 mb-2">
                    <p className="font-semibold">{request.property.title}</p>
                    <p>{request.property.location}</p>
                    {request.property.price && (
                      <p className="text-xs mt-1">
                        Original Price: {formatCurrency(request.property.price)}
                      </p>
                    )}
                  </div>
                )}

                {/* Owner Info */}
                {request.currentOwner && (
                  <div className="text-sm mb-3">
                    <p className="text-gray-500">Current Owner:</p>
                    <p className="font-medium">{request.currentOwner.name}</p>
                    <p className="text-xs text-gray-500">{request.currentOwner.email}</p>
                  </div>
                )}

                {/* Dates */}
                <div className="space-y-1 mb-4 text-xs">
                  {request.approvedAt && (
                    <p className="text-success">
                      ✓ Approved: {formatDate(request.approvedAt)}
                    </p>
                  )}
                  {request.listedAt && (
                    <p className="text-info">
                      📋 Listed: {formatDate(request.listedAt)}
                    </p>
                  )}
                </div>

                {/* Actions */}
                <div className="card-actions flex-col gap-2">
                  {request.status === 'pending' && (
                    <div className="flex gap-2 w-full">
                      <button
                        onClick={() => handleApprove(request.id)}
                        className="btn btn-success btn-sm flex-1"
                        disabled={processingId === request.id}
                      >
                        {processingId === request.id ? (
                          <span className="loading loading-spinner loading-xs"></span>
                        ) : (
                          <>
                            <CheckCircleIcon className="h-4 w-4" />
                            Approve
                          </>
                        )}
                      </button>
                      <button
                        onClick={() => handleReject(request.id)}
                        className="btn btn-error btn-sm flex-1"
                        disabled={processingId === request.id}
                      >
                        {processingId === request.id ? (
                          <span className="loading loading-spinner loading-xs"></span>
                        ) : (
                          <>
                            <XCircleIcon className="h-4 w-4" />
                            Reject
                          </>
                        )}
                      </button>
                    </div>
                  )}

                  {request.status === 'approved' && (
                    <button
                      onClick={() => handleList(request.id)}
                      className="btn btn-primary btn-sm w-full"
                      disabled={processingId === request.id}
                    >
                      {processingId === request.id ? (
                        <span className="loading loading-spinner loading-xs"></span>
                      ) : (
                        <>
                          <RectangleStackIcon className="h-4 w-4" />
                          List for Resale
                        </>
                      )}
                    </button>
                  )}

                  {request.status === 'listed' && (
                    <button
                      onClick={() => handleMarkSold(request.id)}
                      className="btn btn-success btn-sm w-full"
                      disabled={processingId === request.id}
                    >
                      {processingId === request.id ? (
                        <span className="loading loading-spinner loading-xs"></span>
                      ) : (
                        <>
                          <CheckCircleIcon className="h-4 w-4" />
                          Mark as Sold
                        </>
                      )}
                    </button>
                  )}

                  {request.property && (
                    <Link
                      to={`/lands/${request.propertyId}`}
                      className="btn btn-ghost btn-sm w-full"
                    >
                      View Property
                    </Link>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Summary Stats */}
      {filteredRequests.length > 0 && (
        <div className="stats stats-vertical lg:stats-horizontal shadow mt-8 w-full">
          <div className="stat">
            <div className="stat-title">Total Requests</div>
            <div className="stat-value text-primary">{filteredRequests.length}</div>
          </div>
          <div className="stat">
            <div className="stat-title">Total Value</div>
            <div className="stat-value text-secondary">
              {formatCurrency(
                filteredRequests.reduce((sum, req) => sum + req.requestedPrice, 0)
              )}
            </div>
          </div>
          <div className="stat">
            <div className="stat-title">Pending</div>
            <div className="stat-value text-warning">
              {filteredRequests.filter(r => r.status === 'pending').length}
            </div>
          </div>
          <div className="stat">
            <div className="stat-title">Listed</div>
            <div className="stat-value text-info">
              {filteredRequests.filter(r => r.status === 'listed').length}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResaleRequests;
