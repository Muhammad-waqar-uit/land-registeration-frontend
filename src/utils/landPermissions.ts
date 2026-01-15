import type { Land, User, Payment } from '../types';

/**
 * Check if a land can be updated by the current user
 * - User must be ADMIN or BUILDER
 * - User must be the owner OR admin
 * - For builders: land status must be 'available'
 * - For builders: no pending payments
 * - Admins bypass all restrictions
 */
export const canUpdate = (
  land: Land,
  user: User | null,
  payments: Payment[] = []
): boolean => {
  if (!user) return false;
  
  // Only ADMIN and BUILDER can update
  if (user.role !== 'admin' && user.role !== 'builder') return false;
  
  // Admin can update any land
  if (user.role === 'admin') return true;
  
  // Builder must be the owner
  if (land.ownerId !== user.id) return false;
  
  // For builders: land must be available
  if (land.status !== 'available') return false;
  
  // For builders: check for pending payments
  const pendingPayments = payments.filter(
    (p) => p.landId === land.id && p.status === 'pending'
  );
  if (pendingPayments.length > 0) return false;
  
  return true;
};

/**
 * Check if a land can be deleted by the current user
 * - User must be ADMIN or BUILDER
 * - User must be the owner OR admin
 * - For builders: land status must be 'available'
 * - For builders: no payments exist (any status)
 * - Admins bypass all restrictions
 */
export const canDelete = (
  land: Land,
  user: User | null,
  payments: Payment[] = []
): boolean => {
  if (!user) return false;
  
  // Only ADMIN and BUILDER can delete
  if (user.role !== 'admin' && user.role !== 'builder') return false;
  
  // Admin can delete any land
  if (user.role === 'admin') return true;
  
  // Builder must be the owner
  if (land.ownerId !== user.id) return false;
  
  // For builders: land must be available
  if (land.status !== 'available') return false;
  
  // For builders: check for any payments
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
  payments: Payment[] = []
): string | null => {
  if (!user) return 'You must be logged in to update lands.';
  
  if (user.role !== 'admin' && user.role !== 'builder') {
    return 'Only administrators and builders can update lands.';
  }
  
  if (user.role === 'admin') return null; // Admin can always update
  
  if (land.ownerId !== user.id) {
    return 'You can only update lands that you own.';
  }
  
  if (land.status !== 'available') {
    return `Cannot update land with status '${land.status}'. Land must be available.`;
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
  payments: Payment[] = []
): string | null => {
  if (!user) return 'You must be logged in to delete lands.';
  
  if (user.role !== 'admin' && user.role !== 'builder') {
    return 'Only administrators and builders can delete lands.';
  }
  
  if (user.role === 'admin') return null; // Admin can always delete
  
  if (land.ownerId !== user.id) {
    return 'You can only delete lands that you own.';
  }
  
  if (land.status !== 'available') {
    return `Cannot delete land with status '${land.status}'. Land must be available.`;
  }
  
  const landPayments = payments.filter((p) => p.landId === land.id);
  if (landPayments.length > 0) {
    return 'Cannot delete land with existing payments. This land has transaction history.';
  }
  
  return null;
};
