import { useState, useEffect, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import DashboardLayout from '../../components/layouts/DashboardLayout';
import {
  CheckCircleIcon,
  BuildingOfficeIcon,
  ClipboardDocumentIcon,
  DocumentDuplicateIcon,
  DocumentTextIcon,
  PhotoIcon,
  CubeTransparentIcon,
  ArrowTopRightOnSquareIcon,
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
    // if it's already a raw hash (e.g. Qm...), use default gateway
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
              <ClipboardDocumentIcon className="w-3.5 h-3.5" />
            )}
          </button>
        )}
      </div>
    </div>
  );
}

export default function BuyerMyProperties() {
  const { user } = useAppSelector((state) => state.auth);
  const [searchParams, setSearchParams] = useSearchParams();
  const page = parseInt(searchParams.get('page') || '1', 10);
  const limit = parseInt(searchParams.get('limit') || '20', 10);

  const [properties, setProperties] = useState<Land[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);

  const loadProperties = useCallback(async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const response = await landAPI.getMyProperties({
        page,
        limit,
      });

      const propertiesList: Land[] = Array.isArray(response.data)
        ? response.data
        : [];

      setProperties(propertiesList);
      setTotal(response.total || propertiesList.length);
    } catch (error: unknown) {
      console.error('Failed to load properties:', error);
      const err = error as { response?: { data?: { message?: string } } };
      console.error('Error details:', err.response?.data?.message);
      setProperties([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [user?.id, page, limit]);

  useEffect(() => {
    loadProperties();
  }, [loadProperties]);

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
        <div>
          <h1 className="text-3xl font-bold text-white">My Owned Properties</h1>
          <p className="text-gray-400 mt-1">View all properties you own</p>
        </div>

        {properties.length === 0 ? (
          <div className="card bg-gray-800/90 shadow-xl border border-gray-700">
            <div className="card-body items-center text-center">
              <BuildingOfficeIcon className="w-16 h-16 text-gray-500 mb-4" />
              <h2 className="card-title text-white">No properties owned</h2>
              <p className="text-gray-400">
                You don't own any properties yet. Browse available properties to get started.
              </p>
              <Link to="/" className="btn btn-primary btn-sm mt-4">
                Browse Properties
              </Link>
            </div>
          </div>
        ) : (
          <>
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {properties.map((property) => (
                <div
                  key={property.id}
                  className="card bg-gray-800/90 shadow-xl border border-gray-700 overflow-hidden min-w-0"
                >
                  {/* Image - use full upload URL like http://localhost:3000/uploads/land-images/... */}
                  <figure className="relative h-44 bg-gray-700/50 shrink-0">
                    {(toFullUploadUrl(property.imageUrl) || toFullUploadUrl(property.imageCID)) ? (
                      <img
                        src={toFullUploadUrl(property.imageUrl) || toFullUploadUrl(property.imageCID) || ''}
                        alt={property.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-500">
                        <PhotoIcon className="w-16 h-16" />
                      </div>
                    )}
                    <div className="absolute top-2 right-2 flex flex-row">
                      <span className="badge badge-success gap-1 shrink-0">
                        Owned
                      </span>
                      {property.isResale && (
                        <span className="badge badge-warning shrink-0">Resale</span>
                      )}
                    </div>
                  </figure>

                  <div className="card-body p-4 min-w-0 overflow-hidden">
                    <div className="flex justify-between items-start gap-2 mb-2 min-w-0">
                      <h3 className="card-title text-white text-lg leading-tight min-w-0 truncate">
                        {property.title}
                      </h3>
                    </div>
                    {property.unitId && (
                      <p className="text-xs text-gray-400 font-mono mb-1 truncate">
                        Unit: {property.unitId}
                      </p>
                    )}
                    <p className="text-sm text-gray-400 mb-3 line-clamp-2 break-words">
                      {property.location}
                    </p>

                    {/* Project & Builder */}
                    {(property.project?.name || property.project?.builder?.name) && (
                      <div className="mb-3 space-y-1 min-w-0">
                        {property.project?.name && (
                          <div className="flex items-center gap-1.5 text-sm min-w-0">
                            <BuildingOfficeIcon className="w-4 h-4 text-gray-500 shrink-0" />
                            <span className="text-blue-400 font-medium truncate">
                              {property.project.name}
                            </span>
                          </div>
                        )}
                        {property.project?.builder?.name && (
                          <p className="text-xs text-gray-500 pl-5 truncate">
                            Builder: {property.project.builder.name}
                          </p>
                        )}
                      </div>
                    )}

                    {/* Key details grid */}
                    <div className="grid grid-cols-2 gap-x-3 gap-y-2 text-sm mb-3 min-w-0">
                      <div className="flex justify-between gap-2 min-w-0">
                        <span className="text-gray-400 shrink-0">Size</span>
                        <span className="text-white font-medium truncate text-right">
                          {property.size} sq ft
                        </span>
                      </div>
                      <div className="flex justify-between gap-2 min-w-0">
                        <span className="text-gray-400 shrink-0">Price</span>
                        <span className="text-primary font-semibold truncate text-right">
                          PKR {Number(property.price).toLocaleString()}
                        </span>
                      </div>
                      {(property.agreementStatus || property.agreementId) && (
                        <div className="col-span-2 flex justify-between items-center gap-2 min-w-0">
                          <span className="text-gray-400 shrink-0">Agreement</span>
                          <span className="flex items-center gap-1.5 min-w-0">
                           
                            {property.agreementId && (
                              <Link
                                to={`/dashboard/buyer/agreements/${property.agreementId}`}
                                className="link link-primary text-xs whitespace-nowrap inline-flex items-center gap-1"
                              >
                                <DocumentTextIcon className="w-3.5 h-3.5" />
                                View agreement
                              </Link>
                            )}
                          </span>
                        </div>
                      )}
                      {property.installmentPlanYears != null && (
                        <>
                          <div className="flex justify-between gap-2 min-w-0">
                            <span className="text-gray-400 shrink-0">Plan</span>
                            <span className="text-white truncate text-right">
                              {property.installmentPlanYears} yr
                            </span>
                          </div>
                          {(property.totalPaid != null || property.remainingBalance != null) && (
                            <div className="flex justify-between gap-2 min-w-0">
                              <span className="text-gray-400 shrink-0">Paid / Left</span>
                              <span className="text-white truncate text-right text-xs">
                                {Number(property.totalPaid ?? 0).toLocaleString()} /{' '}
                                {Number(property.remainingBalance ?? 0).toLocaleString()}
                              </span>
                            </div>
                          )}
                          {property.installmentStartDate && property.installmentEndDate && (
                            <div className="col-span-2 flex justify-between gap-2 text-xs text-gray-500 min-w-0">
                              <span className="truncate">
                                {new Date(property.installmentStartDate).toLocaleDateString()} –{' '}
                                {new Date(property.installmentEndDate).toLocaleDateString()}
                              </span>
                            </div>
                          )}
                        </>
                      )}
                    </div>

                    {/* Document & Image hashes - clickable to open IPFS or upload URL */}
                    <div className="border-t border-gray-700 pt-3 mt-2 space-y-1.5 min-w-0">
                      <div className="flex items-center gap-1.5 text-gray-400 text-xs mb-1.5">
                        <DocumentDuplicateIcon className="w-3.5 h-3.5" />
                        <span>Hashes (click to open)</span>
                      </div>
                      <HashRow
                        label="Document"
                        value={property.documentHash}
                        viewUrl={toFullUploadUrl(property.documentUrl) || toFullUploadUrl(property.documentCID) || parseIPFSViewUrl(property.documentIPFSHash)}
                        title={property.documentHash}
                      />
                      <HashRow
                        label="Image"
                        value={property.imageHash}
                        viewUrl={toFullUploadUrl(property.imageUrl) || toFullUploadUrl(property.imageCID) || parseIPFSViewUrl(property.imageIPFSHash)}
                        title={property.imageHash}
                      />
                    </div>

                    {/* Blockchain */}
                    {(property.blockchainLandId != null || property.blockchainTxHash) && (
                      <div className="border-t border-gray-700 pt-2 mt-2 space-y-1">
                        <div className="flex items-center gap-1.5 text-gray-400 text-xs mb-1">
                          <CubeTransparentIcon className="w-3.5 h-3.5" />
                          <span>Blockchain</span>
                        </div>
                        {property.blockchainLandId != null && (
                          <div className="flex justify-between gap-2 text-xs">
                            <span className="text-gray-400">Land ID</span>
                            <span className="text-gray-300 font-mono">
                              {property.blockchainLandId}
                            </span>
                          </div>
                        )}
                        {property.blockchainTxHash && (
                          <HashRow
                            label="Tx Hash"
                            value={property.blockchainTxHash}
                            viewUrl={getBlockExplorerTxUrl(property.blockchainTxHash)}
                            title={property.blockchainTxHash}
                          />
                        )}
                      </div>
                    )}

                    {property.updatedAt && (
                      <p className="text-xs text-gray-500 mt-2">
                        Updated {new Date(property.updatedAt).toLocaleDateString()}
                      </p>
                    )}

                    <div className="card-actions justify-end mt-4 pt-2 gap-2">
                      <Link
                        to={`/dashboard/buyer/lands/${property.id}`}
                        className="btn btn-primary btn-sm"
                      >
                        View Details
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
