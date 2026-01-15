import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import DashboardLayout from '../../components/layouts/DashboardLayout';
import {
  HomeIcon,
  DocumentTextIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  FolderIcon,
  UserGroupIcon,
  CreditCardIcon,
  CurrencyDollarIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';
import { propertyRequestAPI } from '../../services/api';
import type { PropertyRequest } from '../../types';

const navItems = [
  { name: 'Overview', path: '/dashboard/builder', icon: HomeIcon },
  { name: 'Projects', path: '/dashboard/builder/projects', icon: FolderIcon },
  { name: 'Buyer Progress', path: '/dashboard/builder/buyers', icon: UserGroupIcon },
  { name: 'Payments', path: '/dashboard/builder/payments', icon: CreditCardIcon },
  { name: 'Property Requests', path: '/dashboard/builder/property-requests', icon: DocumentTextIcon },
  { name: 'Agreements', path: '/dashboard/builder/agreements', icon: DocumentTextIcon },
  { name: 'Installments', path: '/dashboard/builder/installments', icon: CurrencyDollarIcon },
  { name: 'Resale Requests', path: '/dashboard/builder/resale-requests', icon: ArrowPathIcon },
  { name: 'Pending Verifications', path: '/dashboard/builder/pending', icon: ClockIcon },
];

export default function PropertyRequests() {
  const [requests, setRequests] = useState<PropertyRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
  const [processing, setProcessing] = useState<string | null>(null);
  const [responseText, setResponseText] = useState<Record<string, string>>({});

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async () => {
    try {
      setLoading(true);
      const data = await propertyRequestAPI.getPending();
      setRequests(data);
    } catch (error: unknown) {
      console.error('Failed to load property requests:', error);
    } finally {
      setLoading(false);
    }
  };

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

  const filteredRequests = requests.filter((req) => {
    if (filter === 'all') return true;
    return req.status === filter;
  });

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
                      <p className="font-semibold text-white">{request.requester?.name}</p>
                      <p className="text-xs text-gray-500">{request.requester?.email}</p>
                    </div>

                    <div>
                      <p className="text-sm text-gray-400">Listed Price</p>
                      <p className="font-semibold text-lg text-primary">
                        ₹{request.property?.price?.toLocaleString()}
                      </p>
                    </div>

                    {request.offerPrice && (
                      <div>
                        <p className="text-sm text-gray-400">Offer Price</p>
                        <p className="font-semibold text-lg text-success">
                          ₹{request.offerPrice.toLocaleString()}
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

                  {request.message && (
                    <div className="mt-4">
                      <p className="text-sm text-gray-400">Message from Buyer</p>
                      <p className="text-white bg-base-300 p-3 rounded mt-1">{request.message}</p>
                    </div>
                  )}

                  {request.status === 'pending' && (
                    <>
                      <div className="divider"></div>

                      <div className="form-control">
                        <label className="label">
                          <span className="label-text text-white">Response Message (Optional)</span>
                        </label>
                        <textarea
                          value={responseText[request.id] || ''}
                          onChange={(e) =>
                            setResponseText({ ...responseText, [request.id]: e.target.value })
                          }
                          placeholder="Add a message with your decision..."
                          className="textarea textarea-bordered h-20"
                        />
                      </div>

                      <div className="card-actions justify-end mt-4">
                        <Link
                          to={`/dashboard/seller/lands/${request.propertyId}`}
                          className="btn btn-ghost btn-sm"
                        >
                          View Property
                        </Link>
                        <button
                          onClick={() => handleReject(request.id)}
                          className="btn btn-error btn-sm"
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
                          className="btn btn-success btn-sm"
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

                  {request.response && (
                    <div className="mt-4">
                      <p className="text-sm text-gray-400">Your Response</p>
                      <p className="text-white bg-base-300 p-3 rounded mt-1">{request.response}</p>
                    </div>
                  )}

                  {request.status === 'approved' && (
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
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
