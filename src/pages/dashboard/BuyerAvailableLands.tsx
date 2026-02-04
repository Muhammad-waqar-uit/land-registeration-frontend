import { useState, useEffect, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import DashboardLayout from '../../components/layouts/DashboardLayout';
import {
  BuildingOfficeIcon,
  ClipboardDocumentIcon,
  DocumentDuplicateIcon,
  PhotoIcon,
  CubeTransparentIcon,
  ArrowTopRightOnSquareIcon,
  TagIcon,
} from '@heroicons/react/24/outline';
import { CheckIcon } from '@heroicons/react/24/solid';
import { landAPI } from '../../services/api';
import { useAppSelector } from '../../store/hooks';
import type { Land } from '../../types';
import { buyerNavItems } from '../../constants/navigation';
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
            title={title ?? full}
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
            {copied ? <CheckIcon className="w-3.5 h-3.5 text-success" /> : <ClipboardDocumentIcon className="w-3.5 h-3.5" />}
          </button>
        )}
      </div>
    </div>
  );
}

export default function BuyerAvailableLands() {
  const { user } = useAppSelector((state) => state.auth);
  const [searchParams, setSearchParams] = useSearchParams();
  const page = parseInt(searchParams.get('page') || '1', 10);
  const limit = parseInt(searchParams.get('limit') || '20', 10);

  const [lands, setLands] = useState<Land[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);

  const loadLands = useCallback(async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const response = await landAPI.getAvailableLands({ page, limit });
      const list = Array.isArray(response.data) ? response.data : [];
      setLands(list);
      setTotal(response.total ?? list.length);
    } catch (error) {
      // Fallback: backend may not have GET /lands/available yet; use GET /lands?status=available
      try {
        const all = await landAPI.getAll({ status: 'available' });
        const list = Array.isArray(all) ? all : [];
        const start = (page - 1) * limit;
        setLands(list.slice(start, start + limit));
        setTotal(list.length);
      } catch (fallbackErr) {
        console.error('Failed to load available lands:', fallbackErr);
        setLands([]);
        setTotal(0);
      }
    } finally {
      setLoading(false);
    }
  }, [user?.id, page, limit]);

  useEffect(() => {
    loadLands();
  }, [loadLands]);

  const handlePageChange = (newPage: number) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set('page', newPage.toString());
      return next;
    });
  };

  const totalPages = Math.ceil(total / limit);

  if (loading) {
    return (
      <DashboardLayout navItems={buyerNavItems}>
        <div className="flex justify-center items-center h-64">
          <span className="loading loading-spinner loading-lg" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout navItems={buyerNavItems}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-white">Available Properties</h1>
          <p className="text-gray-400 mt-1">Browse properties you can request to buy</p>
        </div>

        {lands.length === 0 ? (
          <div className="card bg-gray-800/90 shadow-xl border border-gray-700">
            <div className="card-body items-center text-center">
              <TagIcon className="w-16 h-16 text-gray-500 mb-4" />
              <h2 className="card-title text-white">No available properties</h2>
              <p className="text-gray-400">
                There are no available properties at the moment. Check back later or view your dashboard.
              </p>
              <Link to="/dashboard/buyer" className="btn btn-primary btn-sm mt-4">
                Back to Dashboard
              </Link>
            </div>
          </div>
        ) : (
          <>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {lands.map((land) => (
                <div
                  key={land.id}
                  className="card bg-gray-800/90 shadow-xl border border-gray-700 overflow-hidden min-w-0"
                >
                  <figure className="relative h-44 bg-gray-700/50 shrink-0">
                    {(toFullUploadUrl(land.imageUrl) || toFullUploadUrl(land.imageCID)) ? (
                      <img
                        src={toFullUploadUrl(land.imageUrl) || toFullUploadUrl(land.imageCID) || ''}
                        alt={land.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-500">
                        <PhotoIcon className="w-16 h-16" />
                      </div>
                    )}
                    <div className="absolute top-2 right-2 flex flex-wrap gap-1 justify-end max-w-[70%]">
                      <span className="badge badge-info gap-1 shrink-0 gap-2 flex items-center gap-2" >
                        <TagIcon className="w-3.5 h-3.5" />
                        Available
                      </span>
                    </div>
                  </figure>

                  <div className="card-body p-3 min-w-0 overflow-hidden space-y-1.5">
                    <div className="flex gap-1.5 min-w-0">
                      <span className="text-gray-400 shrink-0 text-sm">Title:</span>
                      <span className="text-white font-medium truncate text-sm">{land.title}</span>
                    </div>
                    {land.unitId && (
                      <div className="flex gap-1.5 min-w-0 text-sm">
                        <span className="text-gray-400 shrink-0">Unit:</span>
                        <span className="text-gray-300 font-mono truncate">{land.unitId}</span>
                      </div>
                    )}
                    <div className="flex gap-1.5 min-w-0 text-sm">
                      <span className="text-gray-400 shrink-0">Location:</span>
                      <span className="text-gray-300 truncate line-clamp-1">{land.location}</span>
                    </div>

                    {land.project?.name && (
                      <div className="flex gap-1.5 min-w-0 text-sm">
                        <span className="text-gray-400 shrink-0">Project:</span>
                        <span className="text-primary truncate">{land.project.name}</span>
                      </div>
                    )}
                    {land.project?.builder?.name && (
                      <div className="flex gap-1.5 min-w-0 text-sm">
                        <span className="text-gray-400 shrink-0">Builder:</span>
                        <span className="text-gray-300 truncate">{land.project.builder.name}</span>
                      </div>
                    )}

                    <div className="flex gap-1.5 min-w-0 text-sm">
                      <span className="text-gray-400 shrink-0">Size:</span>
                      <span className="text-white">{land.size} sq ft</span>
                    </div>
                    <div className="flex gap-1.5 min-w-0 text-sm">
                      <span className="text-gray-400 shrink-0">Price:</span>
                      <span className="text-primary font-semibold">PKR {Number(land.price).toLocaleString()}</span>
                    </div>

                    <div className="border-t border-gray-700 pt-1.5 mt-1 space-y-1 min-w-0">
                      <div className="flex gap-1.5 text-gray-400 text-xs">
                        <DocumentDuplicateIcon className="w-3.5 h-3.5 shrink-0" />
                        <span>Hashes</span>
                      </div>
                      <HashRow
                        label="Document:"
                        value={land.documentHash}
                        viewUrl={toFullUploadUrl(land.documentUrl) || toFullUploadUrl(land.documentCID) || parseIPFSViewUrl(land.documentIPFSHash)}
                        title={land.documentHash}
                      />
                      <HashRow
                        label="Image:"
                        value={land.imageHash}
                        viewUrl={toFullUploadUrl(land.imageUrl) || toFullUploadUrl(land.imageCID) || parseIPFSViewUrl(land.imageIPFSHash)}
                        title={land.imageHash}
                      />
                    </div>

                    {(land.blockchainLandId != null || land.blockchainTxHash) && (
                      <div className="border-t border-gray-700 pt-1.5 mt-1 space-y-1 min-w-0">
                        <div className="flex gap-1.5 text-gray-400 text-xs">
                          <CubeTransparentIcon className="w-3.5 h-3.5 shrink-0" />
                          <span>Blockchain</span>
                        </div>
                        {land.blockchainLandId != null && (
                          <div className="flex gap-1.5 text-xs min-w-0">
                            <span className="text-gray-400 shrink-0">Land ID:</span>
                            <span className="text-gray-300 font-mono">{land.blockchainLandId}</span>
                          </div>
                        )}
                        {land.blockchainTxHash && (
                          <HashRow
                            label="Tx Hash:"
                            value={land.blockchainTxHash}
                            viewUrl={getBlockExplorerTxUrl(land.blockchainTxHash)}
                            title={land.blockchainTxHash}
                          />
                        )}
                      </div>
                    )}

                    {land.updatedAt && (
                      <div className="flex gap-1.5 text-xs min-w-0">
                        <span className="text-gray-400 shrink-0">Updated:</span>
                        <span className="text-gray-500">{new Date(land.updatedAt).toLocaleDateString()}</span>
                      </div>
                    )}

                    <div className="card-actions justify-end gap-2 pt-2 mt-1">
                      <Link
                        to={`/dashboard/buyer/lands/${land.id}`}
                        className="btn btn-primary btn-sm text-white"
                      >
                        View Details
                      </Link>
                      <Link
                        to={`/dashboard/buyer/property-requests`}
                        state={{ landId: land.id }}
                        className="btn btn-outline btn-sm text-white border-white hover:bg-white/10"
                      >
                        Request
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>

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
