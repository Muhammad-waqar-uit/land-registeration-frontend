export type UserRole = 'admin' | 'seller' | 'buyer' | 'builder';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  createdAt?: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
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
}

export interface Land {
  id: string;
  title: string;
  location: string;
  size: number;
  price: number;
  status: 'available' | 'locked' | 'sold';
  ownerId: string;
  documentHash?: string;
  documentCID?: string;
  createdAt?: string;
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
  transactionHash?: string;
  remarks?: string;
  createdAt?: string;
}

export interface Reservation {
  id: string;
  landId: string;
  buyerId: string;
  status: 'active' | 'cancelled';
  createdAt?: string;
}

