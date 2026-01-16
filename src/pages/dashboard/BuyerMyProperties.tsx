import { useState, useEffect, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import DashboardLayout from '../../components/layouts/DashboardLayout';
import {
  CheckCircleIcon,
  BuildingOfficeIcon,
} from '@heroicons/react/24/outline';
import { landAPI } from '../../services/api';
import { useAppSelector } from '../../store/hooks';
import type { Land } from '../../types';
import { buyerNavItems } from '../../constants/navigation';

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
      // Get all lands and filter by ownerId and status='sold'
      // Note: landAPI.getAll returns array, not paginated response
      const response = await landAPI.getAll();
      
      console.log('📦 All lands response:', response);
      console.log('👤 Current user ID:', user.id);
      
      // Handle array response and filter by ownerId and status
      const landsArray: Land[] = Array.isArray(response) 
        ? response 
        : [];
      
      console.log('📋 Lands array length:', landsArray.length);
      
      // Filter by sold status AND ownerId matching current user
      const ownedLands = landsArray.filter((land: Land) => {
        const matchesOwner = land.ownerId === user.id;
        const matchesStatus = land.status === 'sold';
        return matchesOwner && matchesStatus;
      });
      
      console.log('🏠 Owned lands count:', ownedLands.length);
      console.log('🏠 Owned lands:', ownedLands);
      
      // Calculate pagination manually
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedProperties = ownedLands.slice(startIndex, endIndex);
      
      setProperties(paginatedProperties);
      setTotal(ownedLands.length);
    } catch (error: unknown) {
      console.error('❌ Failed to load properties:', error);
      const err = error as { response?: { data?: { message?: string } } };
      const errorMessage = err.response?.data?.message || 'Failed to load properties';
      console.error('Error details:', errorMessage);
      // Don't show alert on error - just log it and show empty state
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
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-white">My Owned Properties</h1>
          <p className="text-gray-400 mt-1">View all properties you own</p>
        </div>

        {/* Properties List */}
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
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {properties.map((property) => (
                <div key={property.id} className="card bg-gray-800/90 shadow-xl border border-gray-700">
                  <div className="card-body">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="card-title text-white">{property.title}</h3>
                      <span className="badge badge-success">
                        <CheckCircleIcon className="w-4 h-4 mr-1" />
                        Owned
                      </span>
                    </div>
                    <p className="text-sm text-gray-400 mb-4">{property.location}</p>
                    
                    <div className="space-y-2 mb-4">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-400">Size</span>
                        <span className="text-white font-semibold">{property.size} sq ft</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-400">Price</span>
                        <span className="text-primary font-semibold">
                          PKR {property.price.toLocaleString()}
                        </span>
                      </div>
                      {property.createdAt && (
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-400">Purchased</span>
                          <span className="text-white text-sm">
                            {new Date(property.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="card-actions justify-end mt-4">
                      <Link
                        to={`/lands/${property.id}`}
                        className="btn btn-primary btn-sm"
                      >
                        View Details
                      </Link>
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
