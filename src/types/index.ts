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
  status: 'available' | 'locked' | 'sold';
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
}

export interface Payment {
  id: string;
  landId: string;
  buyerId: string;
  amount: number;
  dueDate: string;
  status: 'pending' | 'verified' | 'rejected';
  paymentMode: 'bank' | 'crypto';
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

export interface Reservation {
  id: string;
  landId: string;
  buyerId: string;
  status: 'active' | 'cancelled';
  createdAt?: string;
  updatedAt?: string;
  land?: {
    id: string;
    title: string;
    location: string;
    price: number;
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
  requesterId: string;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  offerPrice?: number;
  message?: string;
  response?: string;
  createdAt: string;
  updatedAt?: string;
  property?: Land;
  requester?: {
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
  agreementType: 'initial' | 'final';
  status: 'pending' | 'buyer_signed' | 'builder_signed' | 'signed' | 'completed';
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
