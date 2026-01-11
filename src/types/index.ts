export type UserRole = 'admin' | 'user' | 'builder';

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
  };
  buyer?: {
    id: string;
    name: string;
    email: string;
    walletAddress: string | null;
  };
}

