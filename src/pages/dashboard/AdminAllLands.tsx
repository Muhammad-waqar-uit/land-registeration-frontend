import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import DashboardLayout from '../../components/layouts/DashboardLayout';
import {
  HomeIcon,
  FolderIcon,
  UserGroupIcon,
  CurrencyDollarIcon,
  BuildingOfficeIcon,
  MapPinIcon,
} from '@heroicons/react/24/outline';
import { landAPI } from '../../services/api';
import type { Land } from '../../types';

const navItems = [
  { name: 'Overview', path: '/dashboard/admin', icon: HomeIcon },
  { name: 'Project Approvals', path: '/dashboard/admin/projects', icon: FolderIcon },
  { name: 'Approved Projects', path: '/dashboard/admin/approved-projects', icon: BuildingOfficeIcon },
  { name: 'All Lands', path: '/dashboard/admin/all-lands', icon: MapPinIcon },
  { name: 'Builder Verification', path: '/dashboard/admin/builders', icon: UserGroupIcon },
  { name: 'Mint Tokens', path: '/dashboard/admin/mint-tokens', icon: CurrencyDollarIcon },
];

const statusBadgeClass = (status?: string) => {
  switch (status) {
    case 'available':
      return 'badge-success';
    case 'locked':
    case 'reserved':
      return 'badge-warning';
    case 'sold':
    case 'owned':
      return 'badge-error';
    case 'agreement_pending':
    case 'payment_in_progress':
      return 'badge-info';
    case 'resale_listed':
      return 'badge-secondary';
    default:
      return 'badge-ghost';
  }
};

export default function AdminAllLands() {
  const [searchParams, setSearchParams] = useSearchParams();
  const page = parseInt(searchParams.get('page') || '1', 10);
  const limit = parseInt(searchParams.get('limit') || '20', 10);
  const status = searchParams.get('status') || '';
  const projectId = searchParams.get('projectId') || '';
  const builderId = searchParams.get('builderId') || '';
  const ownerId = searchParams.get('ownerId') || '';
  const isResale = searchParams.get('isResale') || '';
  const minPrice = searchParams.get('minPrice') || '';
  const maxPrice = searchParams.get('maxPrice') || '';

  const [lands, setLands] = useState<Land[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const params: {
          page: number;
          limit: number;
          status?: string;
          projectId?: string;
          builderId?: string;
          ownerId?: string;
          isResale?: boolean;
          minPrice?: number;
          maxPrice?: number;
        } = {
          page,
          limit,
        };

        if (status) params.status = status;
        if (projectId) params.projectId = projectId;
        if (builderId) params.builderId = builderId;
        if (ownerId) params.ownerId = ownerId;
        if (isResale) params.isResale = isResale === 'true';
        if (minPrice) params.minPrice = parseFloat(minPrice);
        if (maxPrice) params.maxPrice = parseFloat(maxPrice);

        const response = await landAPI.getAllLands(params);
        setLands(response.data);
        setTotal(response.total);
      } catch (err: unknown) {
        console.error('Failed to load lands:', err);
        const e = err as { response?: { data?: { message?: string } } };
        setError(e.response?.data?.message || 'Failed to load lands');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [page, limit, status, projectId, builderId, ownerId, isResale, minPrice, maxPrice]);

  const handlePageChange = (newPage: number) => {
    setSearchParams((prev) => {
      const newParams = new URLSearchParams(prev);
      newParams.set('page', newPage.toString());
      return newParams;
    });
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <DashboardLayout navItems={navItems}>
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-3xl font-bold text-white">All Lands/Properties</h1>
            <p className="text-gray-400 mt-1">View and manage all lands and properties in the system.</p>
          </div>
        </div>

        {error && (
          <div className="alert alert-error">
            <span className="text-white">{error}</span>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-12">
            <span className="loading loading-spinner loading-lg"></span>
          </div>
        ) : lands.length === 0 ? (
          <div className="card bg-base-100 shadow-xl border border-base-300">
            <div className="card-body">
              <h2 className="card-title text-white">No lands found</h2>
              <p className="text-gray-400">No lands match your filter criteria.</p>
            </div>
          </div>
        ) : (
          <>
            <div className="card bg-base-100 shadow-xl border border-base-300">
              <div className="card-body">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="card-title text-white">
                    All Lands/Properties ({total} total)
                  </h2>
                </div>
                <div className="overflow-x-auto">
                  <table className="table table-zebra">
                    <thead>
                      <tr className="text-white">
                        <th className="text-white">Title</th>
                        <th className="text-white">Location</th>
                        <th className="text-white">Size</th>
                        <th className="text-white">Price</th>
                        <th className="text-white">Status</th>
                        <th className="text-white">Owner</th>
                        <th className="text-white">Created At</th>
                      </tr>
                    </thead>
                    <tbody>
                      {lands.map((land) => (
                        <tr key={land.id} className="text-white">
                          <td className="font-medium text-white">{land.title}</td>
                          <td className="text-gray-700">{land.location}</td>
                          <td className="text-gray-700">{land.size} sq ft</td>
                          <td className="font-semibold text-white">
                            PKR {land.price.toLocaleString()}
                          </td>
                          <td>
                            <span className={`badge ${statusBadgeClass(land.status)}`}>
                              {land.status}
                            </span>
                          </td>
                          <td className="text-gray-700">
                            {land.owner ? land.owner.name : <span className="font-mono text-xs">{land.ownerId.slice(0, 8)}...</span>}
                          </td>
                          <td className="text-gray-700">
                            {land.createdAt
                              ? new Date(land.createdAt).toLocaleDateString()
                              : 'N/A'}
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
