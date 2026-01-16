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
  PlusIcon,
} from '@heroicons/react/24/outline';

export interface NavItem {
  name: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
}

// Buyer Navigation Items - Always show all items
export const buyerNavItems: NavItem[] = [
  { name: 'Overview', path: '/dashboard/buyer', icon: HomeIcon },
  { name: 'Property Requests', path: '/dashboard/buyer/property-requests', icon: DocumentTextIcon },
  { name: 'Agreements', path: '/dashboard/buyer/agreements', icon: DocumentTextIcon },
  { name: 'Installments', path: '/dashboard/buyer/installments', icon: CurrencyDollarIcon },
  { name: 'Payment History', path: '/dashboard/buyer/payments', icon: CreditCardIcon },
  { name: 'My Properties', path: '/dashboard/buyer/properties', icon: BuildingOfficeIcon },
];

// Builder Navigation Items - Always show all items
export const builderNavItems: NavItem[] = [
  { name: 'Overview', path: '/dashboard/builder', icon: HomeIcon },
  { name: 'Projects', path: '/dashboard/builder/projects', icon: FolderIcon },
  { name: 'Buyer Progress', path: '/dashboard/builder/buyers', icon: UserGroupIcon },
  { name: 'Payments', path: '/dashboard/builder/payments', icon: CreditCardIcon },
  { name: 'Property Requests', path: '/dashboard/builder/property-requests', icon: DocumentTextIcon },
  { name: 'Agreements', path: '/dashboard/builder/agreements', icon: DocumentTextIcon },
  { name: 'Installments', path: '/dashboard/builder/installments', icon: CurrencyDollarIcon },
  { name: 'Resale Requests', path: '/dashboard/builder/resale-requests', icon: ArrowPathIcon },
  { name: 'Pending Verifications', path: '/dashboard/builder/pending', icon: ClockIcon },
];

// Admin Navigation Items - Always show all items
export const adminNavItems: NavItem[] = [
  { name: 'Overview', path: '/dashboard/admin', icon: HomeIcon },
  { name: 'Project Approvals', path: '/dashboard/admin/projects', icon: FolderIcon },
  { name: 'Approved Projects', path: '/dashboard/admin/approved-projects', icon: BuildingOfficeIcon },
  { name: 'All Lands', path: '/dashboard/admin/all-lands', icon: MapPinIcon },
  { name: 'Builder Verification', path: '/dashboard/admin/builders', icon: UserGroupIcon },
  { name: 'Mint Tokens', path: '/dashboard/admin/mint-tokens', icon: CurrencyDollarIcon },
  { name: 'Property Requests', path: '/dashboard/admin/property-requests', icon: DocumentTextIcon },
];
