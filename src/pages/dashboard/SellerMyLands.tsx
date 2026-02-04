import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import DashboardLayout from '../../components/layouts/DashboardLayout';
import {
  PencilIcon,
  TrashIcon,
  MagnifyingGlassIcon,
  PhotoIcon,
  DocumentTextIcon,
  DocumentDuplicateIcon,
  CubeTransparentIcon,
  ArrowTopRightOnSquareIcon,
  BuildingOfficeIcon,
} from '@heroicons/react/24/outline';
import { CheckIcon } from '@heroicons/react/24/solid';
import { landAPI, paymentAPI } from '../../services/api';
import { useAppSelector } from '../../store/hooks';
import type { Land, Payment } from '../../types';
import { canUpdate, canDelete, getDeleteErrorMessage } from '../../utils/landPermissions';
import { builderNavItems } from '../../constants/navigation';
import { getBlockExplorerTxUrl } from '../../utils/blockchain';

const UPLOADS_BASE = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api').replace(/\/api\/?$/, '');

function toFullUploadUrl(urlOrPath: string | undefined): string | undefined {
  if (!urlOrPath) return undefined;
  if (urlOrPath.startsWith('http://') || urlOrPath.startsWith('https://')) return urlOrPath;
  const path = urlOrPath.startsWith('/') ? urlOrPath : `/uploads/${urlOrPath}`;
  return `${UPLOADS_BASE}${path}`;
}

function parseIPFSViewUrl(ipfsJson: string | undefined): string | undefined {
  if (!ipfsJson) return undefined;
  try {
    const parsed = typeof ipfsJson === 'string' ? JSON.parse(ipfsJson) : ipfsJson;
    const hash = parsed?.hash;
    const gateway = (parsed?.gateway || 'https://ipfs.io').replace(/\/$/, '');
    if (hash) return `${gateway}/ipfs/${hash}`;
  } catch {
    if (ipfsJson.startsWith('Qm') || ipfsJson.startsWith('baf')) {
      return `https://ipfs.io/ipfs/${ipfsJson}`;
    }
  }
  return undefined;
}

function truncateHash(hash: string | undefined, len = 12): string {
  if (!hash) return '—';
  if (hash.length <= len) return hash;
  return `${hash.slice(0, 6)}…${hash.slice(-6)}`;
}

function HashRow({
  label,
  value,
  viewUrl,
  title,
}: {
  label: string;
  value: string | undefined;
  viewUrl?: string;
  title?: string;
}) {
  const [copied, setCopied] = useState(false);
  const display = truncateHash(value, 14);
  const full = value || '';

  const copy = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!full) return;
    navigator.clipboard.writeText(full);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const linkTitle = viewUrl ? 'Open in new tab' : (title ?? full);

  return (
    <div className="flex items-center justify-between gap-2 text-xs min-w-0">
      <span className="text-gray-400 shrink-0">{label}</span>
      <div className="flex items-center gap-1 min-w-0 flex-1 justify-end">
        {viewUrl ? (
          <a
            href={viewUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="link link-primary font-mono text-gray-300 truncate hover:text-primary flex items-center gap-0.5 min-w-0"
            title={linkTitle}
          >
            <code className="truncate">{display}</code>
            <ArrowTopRightOnSquareIcon className="w-3.5 h-3.5 shrink-0" />
          </a>
        ) : (
          <code className="text-gray-300 truncate font-mono" title={title ?? full}>
            {display}
          </code>
        )}
        {full && (
          <button
            type="button"
            onClick={copy}
            className="btn btn-ghost btn-xs p-0.5 text-gray-400 hover:text-primary shrink-0"
            title="Copy full hash"
          >
            {copied ? (
              <CheckIcon className="w-3.5 h-3.5 text-success" />
            ) : (
              <DocumentDuplicateIcon className="w-3.5 h-3.5" />
            )}
          </button>
        )}
      </div>
    </div>
  );
}

export default function SellerMyLands() {
  const { user, isLoading: authLoading } = useAppSelector((state) => state.auth);
  const [loading, setLoading] = useState(true);
  const [myLands, setMyLands] = useState<Land[]>([]);
  const [filteredLands, setFilteredLands] = useState<Land[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'available' | 'locked' | 'sold'>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  const fetchData = useCallback(async () => {
    // Wait for user to be loaded before fetching
    if (!user?.id) {
      setLoading(true);
      return;
    }
    
    try {
      setLoading(true);
      const [landsData, paymentsData] = await Promise.all([
        landAPI.getAll().catch(() => []),
        paymentAPI.getByBuyer().catch(() => []),
      ]);

      // Handle paginated or array response
      const landsArray: Land[] = Array.isArray(landsData) 
        ? landsData 
        : ((landsData && typeof landsData === 'object' && 'data' in landsData ? (landsData as { data: Land[] }).data : null) || []);

      // Filter lands owned by current seller
      const sellerLands = landsArray.filter((land) => land.ownerId === user.id);
      setMyLands(sellerLands);
      setFilteredLands(sellerLands);

      // Filter payments for seller's lands
      const sellerLandIds = sellerLands.map((land) => land.id);
      const sellerPayments = (paymentsData || []).filter((payment) =>
        sellerLandIds.includes(payment.landId)
      );
      setPayments(sellerPayments);
    } catch (error) {
      console.error('Failed to fetch seller lands data:', error);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    // Only fetch data when user is loaded (not during auth loading)
    if (!authLoading && user?.id) {
      fetchData();
    } else if (!authLoading && !user) {
      setLoading(false);
    }
  }, [fetchData, authLoading, user]);

  // Filter lands based on search and status
  useEffect(() => {
    let filtered = [...myLands];

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter((land) => land.status === statusFilter);
    }

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (land) =>
          land.title.toLowerCase().includes(query) ||
          land.location.toLowerCase().includes(query) ||
          land.id.toLowerCase().includes(query) ||
          (land.unitId && land.unitId.toLowerCase().includes(query)) ||
          (land.project?.name && land.project.name.toLowerCase().includes(query))
      );
    }

    setFilteredLands(filtered);
  }, [myLands, searchQuery, statusFilter]);

  const handleDelete = async (landId: string) => {
    if (!user) return;
    
    const land = myLands.find((l) => l.id === landId);
    if (!land) return;

    // Check permissions
    if (!canDelete(land, user, payments)) {
      const errorMsg = getDeleteErrorMessage(land, user, payments);
      setDeleteError(errorMsg || 'Cannot delete this land.');
      return;
    }

    if (!window.confirm(`Are you sure you want to delete "${land.title}"? This action cannot be undone.`)) {
      return;
    }

    setDeletingId(landId);
    setDeleteError(null);

    try {
      await landAPI.delete(landId);
      await fetchData();
    } catch (err: unknown) {
      const errorMessage: string =
        (err && typeof err === 'object' && 'response' in err && err.response && typeof err.response === 'object' && 'data' in err.response && err.response.data && typeof err.response.data === 'object' && 'message' in err.response.data ? String(err.response.data.message) : '') ||
        (err instanceof Error ? err.message : '') ||
        'Failed to delete land. Please try again.';
      setDeleteError(errorMessage);
    } finally {
      setDeletingId(null);
    }
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'available':
        return 'badge-success';
      case 'locked':
        return 'badge-warning';
      case 'sold':
      case 'owned':
        return 'badge-primary';
      case 'payment_in_progress':
        return 'badge-warning';
      default:
        return 'badge-ghost';
    }
  };

  const getLandPaymentInfo = (landId: string) => {
    const landPayments = payments.filter((p) => p.landId === landId);
    const verifiedPayments = landPayments.filter((p) => p.status === 'verified');
    const totalPaid = verifiedPayments.reduce((sum, p) => sum + p.amount, 0);
    return { totalPayments: landPayments.length, totalPaid, verifiedPayments: verifiedPayments.length };
  };

  // Show loading while auth is loading or data is loading
  if (authLoading || loading) {
    return (
      <DashboardLayout navItems={builderNavItems}>
        <div className="flex items-center justify-center min-h-[400px]">
          <span className="loading loading-spinner loading-lg"></span>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout navItems={builderNavItems}>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-white">My Lands</h1>
          <Link to="/dashboard/builder/register-land" className="btn btn-primary">
            Register New Land
          </Link>
        </div>

        {/* Filters and Search */}
        <div className="card bg-base-100 shadow border border-base-300">
          <div className="card-body">
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
              {/* Search */}
                <label className="input input-bordered flex items-center gap-2 border-white border-2">
                  <MagnifyingGlassIcon className="w-4 h-4 opacity-70" />
                  <input
                    type="text"
                    className="grow text-white "
                    placeholder="Search by title, location, or ID..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </label>

              {/* Status Filter */}
                <select
                  className="select select-bordered text-white border-2 border-white"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as 'all' | 'available' | 'locked' | 'sold')}
                >
                  <option value="all">All Status</option>
                  <option value="available">Available</option>
                  <option value="locked">Locked</option>
                  <option value="sold">Sold</option>
                </select>

              {/* View Mode Toggle */}
              <div className="btn-group">
                <button
                  className={`btn ${viewMode === 'grid' ? 'btn-active' : ''} text-white border-2 border-white`}
                  onClick={() => setViewMode('grid')}
                >
                  Grid
                </button>
                <button
                  className={`btn ${viewMode === 'table' ? 'btn-active' : ''} text-white border-2 border-white`}
                  onClick={() => setViewMode('table')}
                >
                  Table
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {deleteError && (
          <div className="alert alert-error">
            <span className="text-white">{deleteError}</span>
            <button
              className="btn btn-sm btn-ghost text-white"
              onClick={() => setDeleteError(null)}
            >
              ✕
            </button>
          </div>
        )}

        {/* Results Count */}
        <div className="text-sm text-white">
          Showing {filteredLands.length} of {myLands.length} lands
        </div>

        {/* Lands Display */}
        {filteredLands.length === 0 ? (
          <div className="card bg-base-100 shadow-xl border border-base-300">
            <div className="card-body text-center py-12">
              {myLands.length === 0 ? (
                <>
                  <p className="text-white text-lg">No lands registered yet.</p>
                  <Link to="/dashboard/builder/register-land" className="btn btn-primary btn-sm mt-4 text-white">
                    Register Your First Land
                  </Link>
                </>
              ) : (
                <p className="text-white text-lg">No lands match your search criteria.</p>
              )}
            </div>
          </div>
        ) : viewMode === 'grid' ? (
          /* Grid View - rich cards */
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredLands.map((land) => {
              const paymentInfo = getLandPaymentInfo(land.id);
              const imageSrc = toFullUploadUrl(land.imageUrl) || toFullUploadUrl(land.imageCID) || parseIPFSViewUrl(land.imageIPFSHash);

              return (
                <div key={land.id} className="card bg-base-100 shadow-xl border border-base-300 hover:shadow-2xl transition-shadow overflow-hidden min-w-0">
                  <figure className="relative h-44 bg-base-300 shrink-0">
                    {imageSrc ? (
                      <img src={imageSrc} alt={land.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-500">
                        <PhotoIcon className="w-16 h-16" />
                      </div>
                    )}
                    <div className="absolute top-2 right-2 flex flex-wrap gap-1 justify-end">
                      <span className={`badge ${getStatusBadgeClass(land.status)} inline-flex items-center gap-1 max-w-full overflow-hidden shrink-0`}>
                        <span className="truncate">{land.status}</span>
                      </span>
                      {land.isResale && (
                        <span className="badge badge-warning shrink-0">Resale</span>
                      )}
                    </div>
                  </figure>

                  <div className="card-body p-4 min-w-0 overflow-hidden">
                    <div className="flex justify-between items-start gap-2 mb-1 min-w-0">
                      <h2 className="card-title text-white text-lg leading-tight min-w-0 truncate">
                        {land.title}
                      </h2>
                    </div>
                    {land.unitId && (
                      <p className="text-gray-400 text-xs font-mono mb-1 truncate">
                        Land ID: {land.unitId}
                      </p>
                    )}
                    <p className="text-sm text-gray-400 mb-3 line-clamp-2 break-words">
                      {land.location}
                    </p>

                    {/* Project & Builder */}
                    {(land.project?.name || land.project?.builder?.name) && (
                      <div className="mb-3 space-y-1 min-w-0">
                        {land.project?.name && (
                          <div className="flex items-center gap-1.5 text-sm min-w-0">
                            <BuildingOfficeIcon className="w-4 h-4 text-gray-500 shrink-0" />
                            <span className="text-primary font-medium truncate">
                              {land.project.name}
                            </span>
                          </div>
                        )}
                        {land.project?.builder?.name && (
                          <p className="text-xs text-gray-500 pl-5 truncate">
                            Builder: {land.project.builder.name}
                          </p>
                        )}
                      </div>
                    )}

                    {/* Size, Price */}
                    <div className="grid grid-cols-2 gap-x-3 gap-y-2 text-sm mb-3 min-w-0">
                      <div className="flex justify-between gap-2 min-w-0">
                        <span className="text-gray-400 shrink-0">Size</span>
                        <span className="text-white font-medium truncate text-right">
                          {land.size} sq ft
                        </span>
                      </div>
                      <div className="flex justify-between gap-2 min-w-0">
                        <span className="text-gray-400 shrink-0">Price</span>
                        <span className="text-primary font-semibold truncate text-right">
                          PKR {Number(land.price).toLocaleString()}
                        </span>
                      </div>
                    </div>

                    {/* Agreement & Installments */}
                    {(land.agreementStatus || land.agreementId) && (
                      <div className="space-y-1.5 mb-3 min-w-0">
                        <div className="flex justify-between items-center gap-2 min-w-0">
                          <span className="text-gray-400 text-xs shrink-0">Agreement</span>
                          <span className="flex items-center gap-1.5 min-w-0 flex-wrap justify-end">
                            {land.agreementStatus && (
                              <span className="badge badge-ghost text-xs">{land.agreementStatus}</span>
                            )}
                            {land.agreementId && (
                              <Link
                                to={`/dashboard/builder/agreements/${land.agreementId}`}
                                className="link link-primary text-xs whitespace-nowrap inline-flex items-center gap-1"
                              >
                                <DocumentTextIcon className="w-3.5 h-3.5" />
                                View
                              </Link>
                            )}
                          </span>
                        </div>
                        {land.installmentPlanYears != null && (
                          <>
                            <div className="flex justify-between gap-2 text-xs min-w-0">
                              <span className="text-gray-400">Plan</span>
                              <span className="text-white">{land.installmentPlanYears} yr</span>
                            </div>
                            {(land.totalPaid != null || land.remainingBalance != null) && (
                              <div className="flex justify-between gap-2 text-xs min-w-0">
                                <span className="text-gray-400">Paid / Left</span>
                                <span className="text-white">
                                  PKR {Number(land.totalPaid ?? 0).toLocaleString()} /{' '}
                                  {Number(land.remainingBalance ?? 0).toLocaleString()}
                                </span>
                              </div>
                            )}
                            {land.installmentStartDate && land.installmentEndDate && (
                              <div className="text-xs text-gray-500 min-w-0 truncate">
                                {new Date(land.installmentStartDate).toLocaleDateString()} –{' '}
                                {new Date(land.installmentEndDate).toLocaleDateString()}
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    )}

                    {/* Fallback: payments from API if no agreement fields */}
                    {land.status === 'locked' && paymentInfo.totalPayments > 0 && !land.agreementId && (
                      <div className="flex justify-between gap-2 text-sm text-white mb-2">
                        <span className="text-gray-400">Payments</span>
                        <span className="text-success font-semibold">
                          {paymentInfo.verifiedPayments} verified · PKR {paymentInfo.totalPaid.toLocaleString()}
                        </span>
                      </div>
                    )}

                    {/* Current owner when sold/owned */}
                    {land.currentOwner && (
                      <div className="mb-2 text-xs min-w-0">
                        <span className="text-gray-400">Current owner</span>
                        <p className="text-white truncate" title={land.currentOwner.email}>
                          {land.currentOwner.name}
                        </p>
                      </div>
                    )}

                    {/* Document & Image hashes */}
                    <div className="border-t border-base-300 pt-3 mt-2 space-y-1.5 min-w-0">
                      <div className="flex items-center gap-1.5 text-gray-400 text-xs mb-1.5">
                        <DocumentDuplicateIcon className="w-3.5 h-3.5" />
                        <span>Hashes</span>
                      </div>
                      <HashRow
                        label="Document"
                        value={land.documentHash}
                        viewUrl={toFullUploadUrl(land.documentUrl) || toFullUploadUrl(land.documentCID) || parseIPFSViewUrl(land.documentIPFSHash)}
                        title={land.documentHash}
                      />
                      <HashRow
                        label="Image"
                        value={land.imageHash}
                        viewUrl={toFullUploadUrl(land.imageUrl) || toFullUploadUrl(land.imageCID) || parseIPFSViewUrl(land.imageIPFSHash)}
                        title={land.imageHash}
                      />
                    </div>

                    {/* Blockchain */}
                    {(land.blockchainLandId != null || land.blockchainTxHash) && (
                      <div className="border-t border-base-300 pt-2 mt-2 space-y-1 min-w-0">
                        <div className="flex items-center gap-1.5 text-gray-400 text-xs mb-1">
                          <CubeTransparentIcon className="w-3.5 h-3.5" />
                          <span>Blockchain</span>
                        </div>
                        {land.blockchainLandId != null && (
                          <div className="flex justify-between gap-2 text-xs">
                            <span className="text-gray-400">Land ID</span>
                            <span className="text-white font-mono">{land.blockchainLandId}</span>
                          </div>
                        )}
                        {land.blockchainTxHash && (
                          <HashRow
                            label="Tx Hash"
                            value={land.blockchainTxHash}
                            viewUrl={getBlockExplorerTxUrl(land.blockchainTxHash)}
                            title={land.blockchainTxHash}
                          />
                        )}
                      </div>
                    )}

                    {(land.createdAt || land.updatedAt) && (
                      <p className="text-xs text-gray-500 mt-2">
                        {land.updatedAt
                          ? `Updated ${new Date(land.updatedAt).toLocaleDateString()}`
                          : land.createdAt
                            ? `Registered ${new Date(land.createdAt).toLocaleDateString()}`
                            : null}
                      </p>
                    )}

                    <div className="card-actions justify-end gap-2 mt-4 pt-2">
                      <Link
                        to={`/dashboard/builder/lands/${land.id}`}
                        className="btn btn-primary btn-sm text-white"
                      >
                        View
                      </Link>
                      {canUpdate(land, user, payments) && (
                        <Link
                          to={`/dashboard/builder/update-land/${land.id}`}
                          className="btn btn-secondary btn-sm text-white"
                          title="Update Land"
                        >
                          <PencilIcon className="h-4 w-4" />
                        </Link>
                      )}
                      {canDelete(land, user, payments) && (
                        <button
                          onClick={() => handleDelete(land.id)}
                          className="btn btn-error btn-sm text-white"
                          disabled={deletingId === land.id}
                          title="Delete Land"
                        >
                          {deletingId === land.id ? (
                            <span className="loading loading-spinner loading-xs"></span>
                          ) : (
                            <TrashIcon className="h-4 w-4" />
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* Table View */
          <div className="card bg-base-100 shadow-xl border border-base-300">
            <div className="card-body p-0">
              <div className="overflow-x-auto">
                <table className="table">
                  <thead>
                    <tr className="text-white">
                      <th className="text-white">Title</th>
                      <th className="text-white">Land ID</th>
                      <th className="text-white">Location</th>
                      <th className="text-white">Project</th>
                      <th className="text-white">Size</th>
                      <th className="text-white">Price</th>
                      <th className="text-white">Status</th>
                      <th className="text-white">Agreement</th>
                      <th className="text-white">Paid / Left</th>
                      <th className="text-white">Blockchain</th>
                      <th className="text-white">Created</th>
                      <th className="text-white">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredLands.map((land) => {
                      const paymentInfo = getLandPaymentInfo(land.id);
                      const paid = land.totalPaid ?? (land.status === 'locked' ? paymentInfo.totalPaid : 0);
                      const left = land.remainingBalance ?? (land.price - paid);

                      return (
                        <tr key={land.id} className="hover text-white">
                          <td className="text-white font-semibold max-w-[140px] truncate" title={land.title}>
                            {land.title}
                          </td>
                          <td className="text-white font-mono text-xs">{land.unitId ?? '—'}</td>
                          <td className="text-white max-w-[160px] truncate" title={land.location}>
                            {land.location}
                          </td>
                          <td className="text-white text-sm max-w-[120px] truncate" title={land.project?.name}>
                            {land.project?.name ?? '—'}
                          </td>
                          <td className="text-white">{land.size} sq ft</td>
                          <td className="text-white">PKR {land.price.toLocaleString()}</td>
                          <td>
                            <span className={`badge ${getStatusBadgeClass(land.status)} inline-flex items-center max-w-full overflow-hidden`}>
                              <span className="truncate">{land.status}</span>
                            </span>
                            {land.isResale && <span className="badge badge-warning badge-sm ml-1">Resale</span>}
                          </td>
                          <td className="text-white text-sm">
                            {land.agreementId ? (
                              <Link
                                to={`/dashboard/builder/agreements/${land.agreementId}`}
                                className="link link-primary text-xs"
                              >
                                {land.agreementStatus ?? 'View'}
                              </Link>
                            ) : (
                              land.agreementStatus ?? '—'
                            )}
                          </td>
                          <td className="text-white text-xs">
                            {land.agreementId || paymentInfo.totalPayments > 0 ? (
                              <>PKR {Number(paid).toLocaleString()} / {Number(left).toLocaleString()}</>
                            ) : (
                              '—'
                            )}
                          </td>
                          <td className="text-white text-xs font-mono">
                            {land.blockchainLandId != null ? (
                              land.blockchainTxHash ? (
                                <a
                                  href={getBlockExplorerTxUrl(land.blockchainTxHash)}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="link link-primary"
                                >
                                  #{land.blockchainLandId}
                                </a>
                              ) : (
                                <>#{land.blockchainLandId}</>
                              )
                            ) : (
                              '—'
                            )}
                          </td>
                          <td className="text-white text-sm">
                            {land.createdAt ? new Date(land.createdAt).toLocaleDateString() : '—'}
                          </td>
                          <td>
                            <div className="flex gap-2 items-center flex-wrap">
                              <Link
                                to={`/dashboard/builder/lands/${land.id}`}
                                className="btn btn-xs btn-primary text-white"
                              >
                                View
                              </Link>
                              {canUpdate(land, user, payments) && (
                                <Link
                                  to={`/dashboard/builder/update-land/${land.id}`}
                                  className="btn btn-xs btn-secondary text-white"
                                  title="Update Land"
                                >
                                  <PencilIcon className="h-4 w-4" />
                                </Link>
                              )}
                              {canDelete(land, user, payments) && (
                                <button
                                  onClick={() => handleDelete(land.id)}
                                  className="btn btn-xs btn-error text-white"
                                  disabled={deletingId === land.id}
                                  title="Delete Land"
                                >
                                  {deletingId === land.id ? (
                                    <span className="loading loading-spinner loading-xs"></span>
                                  ) : (
                                    <TrashIcon className="h-4 w-4" />
                                  )}
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
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

