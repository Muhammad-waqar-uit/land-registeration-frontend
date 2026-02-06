export type UserRole = 'admin' | 'user' | 'builder';

export type ProjectStatus = 'pending_approval' | 'approved' | 'active' | 'completed';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  walletAddress: string | null; // Backend returns null if not set, string if set
  // Builder-specific fields
  isBuilderVerified?: boolean;
  builderVerifiedAt?: string | null;
  companyName?: string;
  licenseNumber?: string;
  verifiedBy?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  cnic?: string;
  fatherName?: string;
  phoneNumber?: string;
  // Builder-specific fields (required if role is "builder")
  companyName?: string;
  licenseNumber?: string;
}

export interface Land {
  id: string;
  title: string;
  location: string;
  size: number;
  price: number;
  status: 'available' | 'locked' | 'sold' | 'owned' | 'payment_in_progress';
  ownerId: string;
  owner?: {
    id: string;
    name: string;
    email: string;
    walletAddress: string | null;
  };
  documentHash?: string;
  documentCID?: string;
  documentUrl?: string;
  documentIPFSHash?: string;
  imageCID?: string;
  imageUrl?: string;
  imageIPFSHash?: string;
  imageHash?: string;
  blockchainLandId?: number;
  blockchainTxHash?: string;
  createdAt?: string;
  updatedAt?: string;
  // My-properties / detailed response fields
  unitId?: string;
  projectId?: string;
  isResale?: boolean;
  agreementId?: string | null;
  agreementStatus?: string;
  originalOwnerId?: string | null;
  currentOwnerId?: string;
  installmentPlanYears?: number;
  installmentStartDate?: string;
  installmentEndDate?: string;
  totalPaid?: number;
  remainingBalance?: number;
  ownerDetails?: User;
  currentOwner?: User;
  originalOwner?: User | null;
  project?: {
    id: string;
    name: string;
    description?: string;
    location?: string;
    locationDetails?: string;
    status?: string;
    totalUnits?: number;
    soldUnits?: number;
    builderId?: string;
    builder?: {
      id: string;
      name: string;
      email: string;
      role: string;
      walletAddress: string | null;
      createdAt?: string;
      updatedAt?: string;
    };
  };
}

export interface UserBankInfo {
  id: string;
  userId: string;
  bankName: string;
  accountNumber: string;
  createdAt: string;
  updatedAt: string;
}

export interface Payment {
  id: string;
  landId: string;
  buyerId: string;
  amount: number;
  dueDate: string;
  status: 'pending' | 'verified' | 'rejected';
  paymentMode: 'bank' | 'points';
  proofCID?: string;
  transactionHash?: string | null;
  remarks?: string | null;
  createdAt?: string;
  updatedAt?: string;
  land?: {
    id: string;
    title: string;
    location: string;
    price?: number;
    ownerId: string;
  };
  buyer?: {
    id: string;
    name: string;
    email: string;
    walletAddress: string | null;
  };
}

export interface Project {
  id: string;
  name: string;
  location: string;
  locationDetails?: string;
  description?: string;
  status?: ProjectStatus;
  totalUnits?: number;
  soldUnits?: number;
  builderId: string;
  createdAt: string;
  updatedAt?: string;
  approvalDocuments?: unknown[];
  approvalDocumentsCID?: string;
  approvalDocumentsIPFSHash?: string;
  approvalDocumentsHash?: string;
  lands?: Land[];
  _count?: {
    lands: number;
  };
}

export interface PropertyRequest {
  id: string;
  propertyId: string;
  buyerId: string;  // Backend uses buyerId, not requesterId
  agreementId?: string | null;  // May be null until agreement is created
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  requestedPrice?: number | null;  // Backend uses requestedPrice, not offerPrice
  builderResponse?: string | null;  // Backend uses builderResponse, not response
  respondedAt?: string | null;  // When builder responded
  createdAt: string;
  updatedAt?: string;
  property?: Land;  // Property details
  requester?: {  // Alias for buyer (for backward compatibility)
    id: string;
    name: string;
    email: string;
    walletAddress: string | null;
  };
  buyer?: {  // Buyer details (preferred)
    id: string;
    name: string;
    email: string;
    walletAddress: string | null;
  };
}

export interface Agreement {
  id: string;
  propertyId: string;
  buyerId: string;
  builderId: string;
  agreementType: 'initial' | 'final_ownership';
  status: 'draft' | 'pending' | 'pending_signature' | 'buyer_signed' | 'builder_signed' | 'signed' | 'completed';
  documentUrl?: string;
  documentIPFSHash?: string;
  documentHash?: string;
  buyerSignedAt?: string | null;
  builderSignedAt?: string | null;
  signedDocumentUrl?: string | null;
  signedDocumentIPFSHash?: string;
  signedDocumentHash?: string;
  blockchainTxHash?: string | null;
  terms?: {
    price?: number;
    totalAmount?: number;
    installmentPlanYears?: number;
    paymentTerms?: string;
    propertyDetails?: unknown;
    [key: string]: unknown;
  };
  createdAt: string;
  updatedAt?: string;
  property?: Land;
  buyer?: {
    id: string;
    name: string;
    email: string;
    walletAddress: string | null;
  };
  builder?: {
    id: string;
    name: string;
    email: string;
    companyName?: string;
  };
}

export interface Installment {
  id: string;
  landId: string;
  agreementId: string;
  buyerId: string;
  amount: number;
  paymentWindowStart: string;
  paymentWindowEnd: string;
  status: 'pending' | 'paid' | 'overdue' | 'completed';
  paymentDate?: string | null;
  createdAt: string;
  updatedAt?: string;
  land?: Land;
  agreement?: Agreement;
  buyer?: {
    id: string;
    name: string;
    email: string;
    walletAddress: string | null;
  };
}

export interface ResaleRequest {
  id: string;
  propertyId: string;
  currentOwnerId: string;
  builderId: string;
  requestedPrice: number;
  status: 'pending' | 'approved' | 'rejected' | 'listed' | 'sold';
  approvedAt?: string | null;
  listedAt?: string | null;
  createdAt: string;
  updatedAt?: string;
  property?: Land;
  currentOwner?: {
    id: string;
    name: string;
    email: string;
    walletAddress: string | null;
  };
  builder?: {
    id: string;
    name: string;
    email: string;
    companyName?: string;
  };
}

export interface TransferRequest {
  id: string;
  resaleRequestId: string;
  propertyId: string;
  currentOwnerId: string;
  newOwnerId: string;
  status: string;
  notes?: string | null;
  builderNotes?: string | null;
  signedAt?: string | null;
  uploadedAt?: string | null;
  completedAt?: string | null;
  createdAt: string;
  updatedAt?: string;
  property?: { id: string; title: string; unitId?: string | null };
  currentOwner?: { id: string; name: string; email: string };
  newOwner?: { id: string; name: string; email: string };
  documents?: { id: string; documentType?: string; documentUrl?: string }[];
}

// Buyer Progress Tracking Types
export interface BuyerProgressItem {
  buyerId: string;
  buyerName: string;
  buyerEmail: string;
  buyerPhone: string | null;
  landId: string;
  landTitle: string;
  landLocation: string;
  landPrice: number;
  projectId?: string | null; // Project ID if property belongs to a project
  projectName?: string | null; // Project name for display
  totalPaid: number;
  remainingBalance: number;
  pendingPayments: number;
  verifiedPayments: number;
  lastPaymentDate: string | null;
  lastPaymentAmount: number | null;
  status: 'reserved' | 'paying' | 'completed';
  agreementId: string | null;
  agreementStatus: string | null;
  reservationDate: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface BuyerProgressStats {
  totalBuyers: number;
  reserved: number;
  inProgress: number;
  completed: number;
  totalRevenue: number;
  pendingRevenue: number;
  // Per-status stats
  byStatus?: {
    reserved: {
      count: number;
      revenue: number;
    };
    paying: {
      count: number;
      revenue: number;
    };
    completed: {
      count: number;
      revenue: number;
    };
  };
  // Per-project stats (if projectId filter is used)
  byProject?: {
    [projectId: string]: {
      projectName: string;
      totalBuyers: number;
      reserved: number;
      inProgress: number;
      completed: number;
      totalRevenue: number;
      pendingRevenue: number;
    };
  };
}

export interface BuyerProgressResponse {
  data: BuyerProgressItem[];
  total: number;
  stats: BuyerProgressStats;
}

// Token (points) request – user requests points, admin approves (mint on approve)
export interface TokenRequest {
  id: string;
  userId: string;
  amount: number;
  notes: string | null;
  screenshotUrl: string | null;
  status: 'pending' | 'approved' | 'rejected';
  adminResponse: string | null;
  reviewedBy: string | null;
  reviewedAt: string | null;
  createdAt: string;
  updatedAt: string;
  user?: {
    id: string;
    name: string;
    email: string;
    role: string;
    walletAddress: string | null;
  };
  reviewer?: { id: string; name: string; email: string } | null;
}

// Ownership document – builder uploads after payment complete; admin approves → ownership transfer
export type OwnershipDocumentStatus = 'pending_admin_approval' | 'approved' | 'rejected';

export interface OwnershipDocumentFile {
  id: string;
  fileName: string;
  fileUrl: string;
  fileHash: string;
  fileSize: number;
  mimeType: string;
  uploadedAt: string;
  ipfsHash?: string | null;
}

export interface OwnershipDocument {
  id: string;
  landId: string;
  uploaderId: string;
  buyerId: string;
  documentType: string;
  status: OwnershipDocumentStatus;
  notes: string | null;
  uploadedAt: string;
  reviewedBy?: string | null;
  reviewedAt?: string | null;
  adminNotes?: string | null;
  rejectionReason?: string | null;
  createdAt: string;
  updatedAt: string;
  property?: { id: string; title: string; unitId?: string; location?: string; price?: number; size?: number; status?: string };
  uploader?: { id: string; name: string; email: string };
  buyer?: { id: string; name: string; email: string };
  reviewer?: { id: string; name: string; email: string };
  documents?: OwnershipDocumentFile[];
}
