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
import { projectAPI } from '../../services/api';
import type { Project, ProjectStatus } from '../../types';

const navItems = [
  { name: 'Overview', path: '/dashboard/admin', icon: HomeIcon },
  { name: 'Project Approvals', path: '/dashboard/admin/projects', icon: FolderIcon },
  { name: 'Approved Projects', path: '/dashboard/admin/approved-projects', icon: BuildingOfficeIcon },
  { name: 'All Lands', path: '/dashboard/admin/all-lands', icon: MapPinIcon },
  { name: 'Builder Verification', path: '/dashboard/admin/builders', icon: UserGroupIcon },
  { name: 'Mint Tokens', path: '/dashboard/admin/mint-tokens', icon: CurrencyDollarIcon },
];

const statusBadgeClass = (status?: ProjectStatus) => {
  switch (status) {
    case 'pending_approval':
      return 'badge-warning';
    case 'approved':
      return 'badge-success';
    case 'active':
      return 'badge-info';
    case 'completed':
      return 'badge-neutral';
    default:
      return 'badge-ghost';
  }
};

const formatStatus = (status?: ProjectStatus) => (status || 'approved').replace(/_/g, ' ');

export default function AdminApprovedProjects() {
  const [searchParams, setSearchParams] = useSearchParams();
  const page = parseInt(searchParams.get('page') || '1', 10);
  const limit = parseInt(searchParams.get('limit') || '20', 10);
  const search = searchParams.get('search') || '';
  const builderId = searchParams.get('builderId') || '';

  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await projectAPI.getApprovedProjects({
          page,
          limit,
          search: search || undefined,
          builderId: builderId || undefined,
        });
        setProjects(response.data);
        setTotal(response.data.length);
      } catch (err: unknown) {
        console.error('Failed to load approved projects:', err);
        const e = err as { response?: { data?: { message?: string } } };
        setError(e.response?.data?.message || 'Failed to load approved projects');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [page, limit, search, builderId]);

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
            <h1 className="text-3xl font-bold text-white">Approved Projects</h1>
            <p className="text-gray-400 mt-1">View all approved projects in the system.</p>
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
        ) : projects.length === 0 ? (
          <div className="card bg-base-100 shadow-xl border border-base-300">
            <div className="card-body">
              <h2 className="card-title text-white">No approved projects found</h2>
              <p className="text-gray-400">No approved projects match your search criteria.</p>
            </div>
          </div>
        ) : (
          <>
            <div className="card bg-base-100 shadow-xl border border-base-300">
              <div className="card-body">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="card-title text-white">
                    Approved Projects ({total} total)
                  </h2>
                </div>
                <div className="overflow-x-auto">
                  <table className="table table-zebra">
                    <thead>
                      <tr className="text-white">
                        <th className="text-white">Name</th>
                        <th className="text-white">Location</th>
                        <th className="text-white">Status</th>
                        <th className="text-white">Total Units</th>
                        <th className="text-white">Sold Units</th>
                        <th className="text-white">Created At</th>
                      </tr>
                    </thead>
                    <tbody>
                      {projects.map((p) => (
                        <tr key={p.id} className="text-white">
                          <td className="font-medium text-white">{p.name}</td>
                          <td className="text-gray-700">{p.location}</td>
                          <td>
                            <span className={`badge ${statusBadgeClass(p.status)}`}>
                              {formatStatus(p.status)}
                            </span>
                          </td>
                          <td className="text-gray-700">{p.totalUnits || 'N/A'}</td>
                          <td className="text-gray-700">{p.soldUnits || 0}</td>
                          <td className="text-gray-700">
                            {new Date(p.createdAt).toLocaleDateString()}
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
