import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import DashboardLayout from '../../components/layouts/DashboardLayout';
import {
  HomeIcon,
  FolderIcon,
  UserGroupIcon,
  CurrencyDollarIcon,
  BuildingOfficeIcon,
  MapPinIcon,
  CheckCircleIcon,
  EyeIcon,
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

const formatStatus = (status?: ProjectStatus) => (status || 'pending_approval').replace(/_/g, ' ');

export default function AdminProjects() {
  const [searchParams, setSearchParams] = useSearchParams();
  const status = (searchParams.get('status') as ProjectStatus | null) ?? 'pending_approval';

  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [approving, setApproving] = useState<string | null>(null);

  const allowedStatuses: ProjectStatus[] = useMemo(
    () => ['pending_approval', 'approved', 'active', 'completed'],
    []
  );

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await projectAPI.getAll({ status, page: 1, limit: 50 });
        setProjects(data);
      } catch (err: unknown) {
        console.error('Failed to load projects:', err);
        const e = err as { response?: { data?: { message?: string } } };
        setError(e.response?.data?.message || 'Failed to load projects');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [status]);

  const onApprove = async (id: string) => {
    if (!confirm('Approve this project? This will allow builders to create lands/properties under it.')) return;

    try {
      setApproving(id);
      const updated = await projectAPI.approve(id);
      setProjects((prev) => prev.map((p) => (p.id === id ? { ...p, ...updated } : p)));
    } catch (err: unknown) {
      console.error('Failed to approve project:', err);
      const e = err as { response?: { data?: { message?: string } } };
      alert(e.response?.data?.message || 'Failed to approve project');
    } finally {
      setApproving(null);
    }
  };

  return (
    <DashboardLayout navItems={navItems}>
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-3xl font-bold text-white">Project Approvals</h1>
            <p className="text-gray-400 mt-1">Review and approve builder projects before lands can be created.</p>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-sm text-white/80">Status</label>
            <select
              className="select select-bordered bg-base-200 text-white border-base-300"
              value={status}
              onChange={(e) => setSearchParams({ status: e.target.value })}
            >
              {allowedStatuses.map((s) => (
                <option key={s} value={s}>
                  {formatStatus(s)}
                </option>
              ))}
            </select>
          </div>
        </div>

        {error && (
          <div className="alert alert-error">
            <span className="text-black">{error}</span>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-12">
            <span className="loading loading-spinner loading-lg"></span>
          </div>
        ) : projects.length === 0 ? (
          <div className="card bg-base-100 shadow-xl border border-base-300">
            <div className="card-body">
              <h2 className="card-title text-white">No projects found</h2>
              <p className="text-gray-400">No projects match the selected status filter.</p>
            </div>
          </div>
        ) : (
          <div className="card bg-base-100 shadow-xl border border-base-300">
            <div className="card-body">
              <div className="overflow-x-auto">
                <table className="table table-zebra">
                  <thead>
                    <tr className="text-black">
                      <th className="text-black">Project</th>
                      <th className="text-black">Location</th>
                      <th className="text-black">Builder</th>
                      <th className="text-black">Status</th>
                      <th className="text-black">Created</th>
                      <th className="text-black">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {projects.map((p) => (
                      <tr key={p.id} className="text-black">
                        <td className="font-medium text-black">{p.name}</td>
                        <td className="text-gray-700">{p.location}</td>
                        <td className="font-mono text-xs text-gray-700">{p.builderId?.slice(0, 8)}...</td>
                        <td>
                          <span className={`badge ${statusBadgeClass(p.status)}`}>{formatStatus(p.status)}</span>
                        </td>
                        <td className="text-gray-700">{new Date(p.createdAt).toLocaleDateString()}</td>
                        <td>
                          <div className="flex items-center gap-2">
                            <Link
                              to={`/dashboard/admin/projects/${p.id}`}
                              className="btn btn-sm btn-primary gap-2 flex items-center"
                            >
                              <EyeIcon className="w-4 h-4" />
                              View
                            </Link>

                            {p.status === 'pending_approval' && (
                              <button
                                className="btn btn-sm btn-success gap-2 flex items-center"
                                onClick={() => onApprove(p.id)}
                                disabled={approving === p.id}
                              >
                                {approving === p.id ? (
                                  <span className="loading loading-spinner loading-xs"></span>
                                ) : (
                                  <CheckCircleIcon className="w-4 h-4" />
                                )}
                                Approve
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
