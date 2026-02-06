import {
  HomeIcon,
  FolderIcon,
  DocumentTextIcon,
  UserGroupIcon,
  CreditCardIcon,
  CurrencyDollarIcon,
  ArrowPathIcon,
  ClockIcon,
  BuildingOfficeIcon,
  MapPinIcon,
  BanknotesIcon,
} from '@heroicons/react/24/outline';

export interface NavItem {
  name: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
}

// Buyer Navigation Items - Always show all items
export const buyerNavItems: NavItem[] = [
  { name: 'Overview', path: '/dashboard/buyer', icon: HomeIcon },
  { name: 'Available Properties', path: '/dashboard/buyer/available', icon: MapPinIcon },
  { name: 'Property Requests', path: '/dashboard/buyer/property-requests', icon: DocumentTextIcon },
  { name: 'Agreements', path: '/dashboard/buyer/agreements', icon: DocumentTextIcon },
  { name: 'Installments', path: '/dashboard/buyer/installments', icon: CurrencyDollarIcon },
  { name: 'Payment History', path: '/dashboard/buyer/payments', icon: CreditCardIcon },
  { name: 'My Properties', path: '/dashboard/buyer/properties', icon: BuildingOfficeIcon },
  { name: 'My Resale Requests', path: '/dashboard/buyer/resale-requests', icon: ArrowPathIcon },
  { name: 'My Transfers', path: '/dashboard/buyer/transfers', icon: DocumentTextIcon },
  { name: 'Request Points', path: '/dashboard/buyer/request-points', icon: BanknotesIcon },
  { name: 'My Points Requests', path: '/dashboard/buyer/points-requests', icon: BanknotesIcon },
];

// Builder Navigation Items - Always show all items (single dashboard at /dashboard/builder)
export const builderNavItems: NavItem[] = [
  { name: 'Overview', path: '/dashboard/builder', icon: HomeIcon },
  { name: 'My Lands', path: '/dashboard/builder/lands', icon: MapPinIcon },
  { name: 'Projects', path: '/dashboard/builder/projects', icon: FolderIcon },
  { name: 'Buyer Progress', path: '/dashboard/builder/buyers', icon: UserGroupIcon },
  { name: 'Payments', path: '/dashboard/builder/payments', icon: CreditCardIcon },
  { name: 'Property Requests', path: '/dashboard/builder/property-requests', icon: DocumentTextIcon },
  { name: 'Agreements', path: '/dashboard/builder/agreements', icon: DocumentTextIcon },
  { name: 'Resale Requests', path: '/dashboard/builder/resale-requests', icon: ArrowPathIcon },
  { name: 'Transfer Requests', path: '/dashboard/builder/transfers', icon: DocumentTextIcon },
  { name: 'Pending Verifications', path: '/dashboard/builder/pending', icon: ClockIcon },
  { name: 'Request Points', path: '/dashboard/builder/request-points', icon: BanknotesIcon },
  { name: 'My Points Requests', path: '/dashboard/builder/points-requests', icon: BanknotesIcon },
  { name: 'Ownership Documents', path: '/dashboard/builder/ownership-documents', icon: DocumentTextIcon },
];

// Admin Navigation Items - Always show all items
export const adminNavItems: NavItem[] = [
  { name: 'Overview', path: '/dashboard/admin', icon: HomeIcon },
  { name: 'Project Approvals', path: '/dashboard/admin/projects', icon: FolderIcon },
  { name: 'Approved Projects', path: '/dashboard/admin/approved-projects', icon: BuildingOfficeIcon },
  { name: 'All Lands', path: '/dashboard/admin/all-lands', icon: MapPinIcon },
  { name: 'Builder Verification', path: '/dashboard/admin/builders', icon: UserGroupIcon },
  { name: 'Points Requests', path: '/dashboard/admin/points-requests', icon: BanknotesIcon },
  { name: 'Property Requests', path: '/dashboard/admin/property-requests', icon: DocumentTextIcon },
  { name: 'Ownership Documents', path: '/dashboard/admin/ownership-documents', icon: DocumentTextIcon },
  { name: 'Transfer Review', path: '/dashboard/admin/transfer-review', icon: DocumentTextIcon },
];
