import type { Land, User, Payment, Reservation } from '../types';

/**
 * Check if a land can be updated by the current user
 * Based on the guide:
 * - User must be ADMIN or SELLER
 * - User must be the owner OR admin
 * - For sellers: land status must be 'available'
 * - For sellers: no active reservations
 * - For sellers: no pending payments
 * - Admins bypass all restrictions
 */
export const canUpdate = (
  land: Land,
  user: User | null,
  reservations: Reservation[] = [],
  payments: Payment[] = []
): boolean => {
  if (!user) return false;
  
  // Only ADMIN and SELLER can update
  if (user.role !== 'admin' && user.role !== 'seller') return false;
  
  // Admin can update any land
  if (user.role === 'admin') return true;
  
  // Seller must be the owner
  if (land.ownerId !== user.id) return false;
  
  // For sellers: land must be available
  if (land.status !== 'available') return false;
  
  // For sellers: check for active reservations
  const activeReservations = reservations.filter(
    (r) => r.landId === land.id && r.status === 'active'
  );
  if (activeReservations.length > 0) return false;
  
  // For sellers: check for pending payments
  const pendingPayments = payments.filter(
    (p) => p.landId === land.id && p.status === 'pending'
  );
  if (pendingPayments.length > 0) return false;
  
  return true;
};

/**
 * Check if a land can be deleted by the current user
 * Based on the guide:
 * - User must be ADMIN or SELLER
 * - User must be the owner OR admin
 * - For sellers: land status must be 'available'
 * - For sellers: no reservations exist (active or cancelled)
 * - For sellers: no payments exist (any status)
 * - Admins bypass all restrictions
 */
export const canDelete = (
  land: Land,
  user: User | null,
  reservations: Reservation[] = [],
  payments: Payment[] = []
): boolean => {
  if (!user) return false;
  
  // Only ADMIN and SELLER can delete
  if (user.role !== 'admin' && user.role !== 'seller') return false;
  
  // Admin can delete any land
  if (user.role === 'admin') return true;
  
  // Seller must be the owner
  if (land.ownerId !== user.id) return false;
  
  // For sellers: land must be available
  if (land.status !== 'available') return false;
  
  // For sellers: check for any reservations
  const landReservations = reservations.filter((r) => r.landId === land.id);
  if (landReservations.length > 0) return false;
  
  // For sellers: check for any payments
  const landPayments = payments.filter((p) => p.landId === land.id);
  if (landPayments.length > 0) return false;
  
  return true;
};

/**
 * Get error message for why update is not allowed
 */
export const getUpdateErrorMessage = (
  land: Land,
  user: User | null,
  reservations: Reservation[] = [],
  payments: Payment[] = []
): string | null => {
  if (!user) return 'You must be logged in to update lands.';
  
  if (user.role !== 'admin' && user.role !== 'seller') {
    return 'Only administrators and sellers can update lands.';
  }
  
  if (user.role === 'admin') return null; // Admin can always update
  
  if (land.ownerId !== user.id) {
    return 'You can only update lands that you own.';
  }
  
  if (land.status !== 'available') {
    return `Cannot update land with status '${land.status}'. Land must be available.`;
  }
  
  const activeReservations = reservations.filter(
    (r) => r.landId === land.id && r.status === 'active'
  );
  if (activeReservations.length > 0) {
    return 'Cannot update land with active reservations.';
  }
  
  const pendingPayments = payments.filter(
    (p) => p.landId === land.id && p.status === 'pending'
  );
  if (pendingPayments.length > 0) {
    return 'Cannot update land with pending payments.';
  }
  
  return null;
};

/**
 * Get error message for why delete is not allowed
 */
export const getDeleteErrorMessage = (
  land: Land,
  user: User | null,
  reservations: Reservation[] = [],
  payments: Payment[] = []
): string | null => {
  if (!user) return 'You must be logged in to delete lands.';
  
  if (user.role !== 'admin' && user.role !== 'seller') {
    return 'Only administrators and sellers can delete lands.';
  }
  
  if (user.role === 'admin') return null; // Admin can always delete
  
  if (land.ownerId !== user.id) {
    return 'You can only delete lands that you own.';
  }
  
  if (land.status !== 'available') {
    return `Cannot delete land with status '${land.status}'. Land must be available.`;
  }
  
  const landReservations = reservations.filter((r) => r.landId === land.id);
  if (landReservations.length > 0) {
    return 'Cannot delete land with existing reservations. This land has transaction history.';
  }
  
  const landPayments = payments.filter((p) => p.landId === land.id);
  if (landPayments.length > 0) {
    return 'Cannot delete land with existing payments. This land has transaction history.';
  }
  
  return null;
};
