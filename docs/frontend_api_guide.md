# Frontend API Integration Guide

Complete API documentation with request/response examples for frontend developers.

## Table of Contents
1. [Base Configuration](#base-configuration)
2. [Authentication](#authentication)
3. [Builders](#builders)
4. [Projects](#projects)
5. [Properties/Lands](#propertieslands)
6. [Property Requests](#property-requests)
7. [Resale Requests](#resale-requests)
8. [Agreements](#agreements)
9. [Installments](#installments)
10. [Payments](#payments)
11. [Contact](#contact)
12. [Error Handling](#error-handling)

---

## Base Configuration

### Base URL
```
Development: http://localhost:3000/api
Production: https://your-domain.com/api
```

### Authentication
All protected endpoints require a Bearer token in the Authorization header:
```
Authorization: Bearer <access_token>
```

### Content Types
- **JSON**: `application/json` (default for most endpoints)
- **Form Data**: `multipart/form-data` (for file uploads)

---

## Authentication

### 1. Register User ✅ Complete

**Endpoint:** `POST /api/auth/register`

**Auth Required:** No

**Registration Types:** Only 2 types of registration are supported:
1. **User Registration** (Regular Buyers) - `role: "user"`
2. **Builder Registration** - `role: "builder"`

**Request Body for User (Buyer):**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "role": "user",
  "cnic": "12345-1234567-1",  // optional
  "fatherName": "Jane Doe",  // optional
  "phoneNumber": "+923001234567"  // optional
}
```

**Request Body for Builder:**
```json
{
  "name": "Builder Name",
  "email": "builder@example.com",
  "password": "password123",
  "role": "builder",
  "cnic": "12345-1234567-1",  // optional
  "fatherName": "Father Name",  // optional
  "phoneNumber": "+923001234567",  // optional
  "companyName": "ABC Construction Ltd.",  // required for builder
  "licenseNumber": "LIC-2024-001"  // required for builder
}
```

**Response:** `201 Created`
```json
{
  "user": {
    "id": "uuid",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "user",
    "walletAddress": null,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "refresh-token-abc123xyz..."
}
```

**Frontend Implementation:** ✅
- Form fields updated with all optional and builder-specific fields
- Validation added for builder-required fields
- RegisterData type updated in types/index.ts
- Role options: `"user"` (for buyers) and `"builder"` only
- Located at: [src/pages/auth/Register.tsx](src/pages/auth/Register.tsx)
- **Note:** Admin accounts cannot be created through registration

---

### 2. Login ✅ Complete

**Endpoint:** `POST /api/auth/login`

**Auth Required:** No

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

**Response:** `200 OK`
```json
{
  "user": {
    "id": "uuid",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "user",
    "walletAddress": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "refresh-token-abc123xyz..."
}
```

**Frontend Implementation:** ✅
- Login form sends email and password
- Token handling implemented with refresh token support
- Role-based routing: admin, user (buyer), builder
- Located at: [src/pages/auth/Login.tsx](src/pages/auth/Login.tsx)

---

### 3. Get Current User

**Endpoint:** `GET /api/auth/me`

**Auth Required:** Yes

**Response:** `200 OK`
```json
{
  "id": "uuid",
  "name": "John Doe",
  "email": "john@example.com",
  "role": "user",
  "walletAddress": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

---

### 4. Update Profile

**Endpoint:** `PATCH /api/auth/profile`

**Auth Required:** Yes

**Request Body:**
```json
{
  "name": "John Updated",
  "email": "john.updated@example.com",
  "cnic": "12345-1234567-1",
  "fatherName": "Jane Doe",
  "phoneNumber": "+923001234567"
}
```

**Response:** `200 OK`
```json
{
  "id": "uuid",
  "name": "John Updated",
  "email": "john.updated@example.com",
  "role": "user",
  "walletAddress": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

---

### 5. Update Password

**Endpoint:** `PATCH /api/auth/password`

**Auth Required:** Yes

**Request Body:**
```json
{
  "currentPassword": "oldpassword123",
  "newPassword": "newpassword123"
}
```

**Response:** `200 OK`
```json
{
  "message": "Password updated successfully"
}
```

---

### 6. Forgot Password

**Endpoint:** `POST /api/auth/forgot-password`

**Auth Required:** No

**Request Body:**
```json
{
  "email": "john@example.com"
}
```

**Response:** `200 OK`
```json
{
  "message": "Password reset email sent",
  "resetToken": "reset-token-abc123..."
}
```

---

### 7. Reset Password

**Endpoint:** `POST /api/auth/reset-password`

**Auth Required:** No

**Request Body:**
```json
{
  "token": "reset-token-abc123...",
  "newPassword": "newpassword123"
}
```

**Response:** `200 OK`
```json
{
  "message": "Password reset successfully"
}
```

---

### 8. Generate Wallet

**Endpoint:** `POST /api/auth/wallet/generate`

**Auth Required:** Yes

**Response:** `200 OK`
```json
{
  "id": "uuid",
  "name": "John Doe",
  "email": "john@example.com",
  "role": "user",
  "walletAddress": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

---

### 9. Refresh Token

**Endpoint:** `POST /api/auth/refresh-token`

**Auth Required:** No

**Request Body:**
```json
{
  "refreshToken": "refresh-token-abc123xyz..."
}
```

**Response:** `200 OK`
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "new-refresh-token-xyz789..."
}
```

---

### 10. Logout

**Endpoint:** `POST /api/auth/logout`

**Auth Required:** Yes

**Request Body (optional):**
```json
{
  "refreshToken": "refresh-token-abc123xyz..."
}
```

**Response:** `200 OK`
```json
{
  "message": "Logged out successfully"
}
```

---

### 11. Verify Builder (Admin Only)

**Endpoint:** `POST /api/auth/builders/:id/verify`

**Auth Required:** Yes (Admin)

**Response:** `200 OK`
```json
{
  "id": "uuid",
  "name": "Builder Name",
  "email": "builder@example.com",
  "role": "builder",
  "walletAddress": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
  "isBuilderVerified": true,
  "builderVerifiedAt": "2024-01-01T00:00:00.000Z",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

---

## Builders

### 1. Register as Builder

**Endpoint:** `POST /api/builders/register`

**Auth Required:** Yes (User)

**Request Body:**
```json
{
  "companyName": "ABC Construction Ltd.",
  "licenseNumber": "LIC-2024-001",
  "cnic": "12345-1234567-1",
  "fatherName": "Jane Doe",
  "phoneNumber": "+923001234567"
}
```

**Response:** `201 Created`
```json
{
  "id": "uuid",
  "name": "John Doe",
  "email": "john@example.com",
  "role": "builder",
  "walletAddress": null,
  "cnic": "12345-1234567-1",
  "fatherName": "Jane Doe",
  "phoneNumber": "+923001234567",
  "isBuilderVerified": false,
  "builderVerifiedAt": null,
  "companyName": "ABC Construction Ltd.",
  "licenseNumber": "LIC-2024-001",
  "verifiedBy": null,
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

---

## Builders

### 2. Get All Builders ✅ Complete

**Endpoint:** `GET /api/builders?verifiedOnly=true`

**Auth Required:** No

**Query Parameters:**
- `verifiedOnly` (boolean, optional): Show only verified builders

**Response:** `200 OK`
```json
[
  {
    "id": "uuid",
    "name": "Builder Name",
    "email": "builder@example.com",
    "role": "builder",
    "walletAddress": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
    "isBuilderVerified": true,
    "companyName": "ABC Construction Ltd.",
    "licenseNumber": "LIC-2024-001",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
]
```

---

### 3. Get Builder by ID ✅ Complete

**Endpoint:** `GET /api/builders/:id`

**Auth Required:** No

**Response:** `200 OK`
```json
{
  "id": "uuid",
  "name": "Builder Name",
  "email": "builder@example.com",
  "role": "builder",
  "walletAddress": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
  "isBuilderVerified": true,
  "companyName": "ABC Construction Ltd.",
  "licenseNumber": "LIC-2024-001",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

---

### 4. Get Current Builder Profile ✅ Complete

**Endpoint:** `GET /api/builders/me`

**Auth Required:** Yes (Builder)

**Response:** `200 OK`
```json
{
  "id": "uuid",
  "name": "Builder Name",
  "email": "builder@example.com",
  "role": "builder",
  "walletAddress": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
  "isBuilderVerified": true,
  "companyName": "ABC Construction Ltd.",
  "licenseNumber": "LIC-2024-001",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

---

### 5. Update Builder Profile

**Endpoint:** `PATCH /api/builders/me`

**Auth Required:** Yes (Builder)

**Request Body:**
```json
{
  "name": "Updated Name",
  "email": "updated@example.com",
  "companyName": "New Company Name",
  "licenseNumber": "LIC-2024-002",
  "cnic": "12345-1234567-1",
  "fatherName": "Jane Doe",
  "phoneNumber": "+923001234567"
}
```

**Response:** `200 OK`
```json
{
  "id": "uuid",
  "name": "Updated Name",
  "email": "updated@example.com",
  "role": "builder",
  "walletAddress": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
  "isBuilderVerified": true,
  "companyName": "New Company Name",
  "licenseNumber": "LIC-2024-002",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

---

### 6. Get Builder's Projects

**Endpoint:** `GET /api/builders/me/projects`

**Auth Required:** Yes (Builder)

**Response:** `200 OK`
```json
[
  {
    "id": "uuid",
    "name": "Luxury Apartments Phase 1",
    "location": "Downtown Area",
    "status": "active",
    "totalUnits": 50,
    "soldUnits": 25,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
]
```

---

### 7. Get Builder's Properties

**Endpoint:** `GET /api/builders/me/properties`

**Auth Required:** Yes (Builder)

**Response:** `200 OK`
```json
[
  {
    "id": "uuid",
    "title": "Unit A-101",
    "location": "123 Ocean Drive",
    "size": 500.5,
    "price": 250000.0,
    "status": "available",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
]
```

---

### 8. Get Builder Dashboard Stats

**Endpoint:** `GET /api/builders/me/dashboard`

**Auth Required:** Yes (Builder)

**Response:** `200 OK`
```json
{
  "totalProjects": 5,
  "totalProperties": 50,
  "soldProperties": 25,
  "pendingRequests": 10,
  "totalRevenue": 6250000.0
}
```

---

### 9. Get Builder's Property Requests

**Endpoint:** `GET /api/builders/me/requests?status=pending`

**Auth Required:** Yes (Builder)

**Query Parameters:**
- `status` (string, optional): Filter by status (pending, approved, rejected)
- `page` (number, optional): Page number (default: 1)
- `limit` (number, optional): Items per page (default: 10)

**Response:** `200 OK`
```json
[
  {
    "id": "uuid",
    "propertyId": "uuid",
    "buyerId": "uuid",
    "status": "pending",
    "requestedPrice": 240000.0,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
]
```

---

### 10. Verify Builder (Admin) ✅ Complete

**Endpoint:** `POST /api/builders/:id/verify`

**Auth Required:** Yes (Admin)

**Request Body (optional):**
```json
{
  "remarks": "All documents verified"
}
```

**Response:** `200 OK`
```json
{
  "id": "uuid",
  "name": "Builder Name",
  "email": "builder@example.com",
  "role": "builder",
  "isBuilderVerified": true,
  "builderVerifiedAt": "2024-01-01T00:00:00.000Z",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

**Frontend Implementation:** ✅
- Admin can view all builders in table format
- Filter by verification status (all, pending, verified)
- One-click verification action
- Builder dashboard shows verification pending message
- Located at: [src/pages/dashboard/BuilderVerification.tsx](src/pages/dashboard/BuilderVerification.tsx)

---

## Projects

### 1. Create Project

**Endpoint:** `POST /api/projects`

**Auth Required:** Yes (Builder)

**Request Body:**
```json
{
  "name": "Luxury Apartments Phase 1",
  "description": "Modern luxury apartments with world-class amenities",
  "location": "Downtown Area, City",
  "locationDetails": "Near Central Park, next to shopping mall",
  "totalUnits": 50
}
```

**Response:** `201 Created`
```json
{
  "id": "uuid",
  "name": "Luxury Apartments Phase 1",
  "description": "Modern luxury apartments with world-class amenities",
  "location": "Downtown Area, City",
  "locationDetails": "Near Central Park, next to shopping mall",
  "status": "active",
  "totalUnits": 50,
  "soldUnits": 0,
  "builderId": "uuid",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

---

### 2. Get All Projects

**Endpoint:** `GET /api/projects?builderId=uuid&status=active&page=1&limit=10`

**Auth Required:** Yes

**Query Parameters:**
- `builderId` (uuid, optional): Filter by builder
- `status` (string, optional): Filter by status (active, completed, cancelled)
- `page` (number, optional): Page number (default: 1)
- `limit` (number, optional): Items per page (default: 10)

**Response:** `200 OK`
```json
[
  {
    "id": "uuid",
    "name": "Luxury Apartments Phase 1",
    "location": "Downtown Area, City",
    "status": "active",
    "totalUnits": 50,
    "soldUnits": 25,
    "builderId": "uuid",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
]
```

---

### 3. Get Project by ID

**Endpoint:** `GET /api/projects/:id`

**Auth Required:** Yes

**Response:** `200 OK`
```json
{
  "id": "uuid",
  "name": "Luxury Apartments Phase 1",
  "description": "Modern luxury apartments",
  "location": "Downtown Area, City",
  "status": "active",
  "totalUnits": 50,
  "soldUnits": 25,
  "builderId": "uuid",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

---

### 4. Get Project Properties

**Endpoint:** `GET /api/projects/:id/properties`

**Auth Required:** Yes

**Response:** `200 OK`
```json
{
  "id": "uuid",
  "name": "Luxury Apartments Phase 1",
  "lands": [
    {
      "id": "uuid",
      "title": "Unit A-101",
      "location": "123 Ocean Drive",
      "size": 500.5,
      "price": 250000.0,
      "status": "available",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

---

### 5. Update Project

**Endpoint:** `PATCH /api/projects/:id`

**Auth Required:** Yes (Builder/Admin)

**Request Body:**
```json
{
  "name": "Updated Project Name",
  "description": "Updated description",
  "location": "Updated Location",
  "totalUnits": 60
}
```

**Response:** `200 OK`
```json
{
  "id": "uuid",
  "name": "Updated Project Name",
  "description": "Updated description",
  "location": "Updated Location",
  "status": "active",
  "totalUnits": 60,
  "soldUnits": 25,
  "builderId": "uuid",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

---

### 6. Delete Project

**Endpoint:** `DELETE /api/projects/:id`

**Auth Required:** Yes (Builder/Admin)

**Response:** `200 OK`

---

### 7. Upload Approval Documents

**Endpoint:** `POST /api/projects/:id/approval-documents`

**Auth Required:** Yes (Builder/Admin)

**Content-Type:** `multipart/form-data`

**Request Body (Form Data):**
- `document` (file): Approval documents file (PDF, Image, etc.)

**Response:** `200 OK`
```json
{
  "id": "uuid",
  "name": "Luxury Apartments Phase 1",
  "approvalDocumentsCID": "doc-uuid",
  "approvalDocumentsIPFSHash": "QmHash...",
  "approvalDocumentsHash": "sha256-hash...",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

---

## Properties/Lands

### 1. Get All Properties

**Endpoint:** `GET /api/lands` or `GET /api/properties`

**Auth Required:** Yes

**Query Parameters:**
- `status` (string, optional): Filter by status (available, reserved, agreement_pending, payment_in_progress, owned, resale_listed)
- `projectId` (uuid, optional): Filter by project
- `builderId` (uuid, optional): Filter by builder
- `ownerId` (uuid, optional): Filter by owner
- `isResale` (boolean, optional): Filter resale properties
- `minPrice` (number, optional): Minimum price
- `maxPrice` (number, optional): Maximum price
- `page` (number, optional): Page number (default: 1)
- `limit` (number, optional): Items per page (default: 10)

**Response:** `200 OK`
```json
[
  {
    "id": "uuid",
    "title": "Unit A-101",
    "location": "123 Ocean Drive, Miami",
    "size": 500.5,
    "price": 250000.0,
    "status": "available",
    "ownerId": "uuid",
    "documentUrl": "/uploads/document-uuid.pdf",
    "imageUrl": "/uploads/image-uuid.jpg",
    "documentHash": "sha256-hash...",
    "imageHash": "sha256-hash...",
    "blockchainLandId": 1,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
]
```

---

### 2. Get Property by ID

**Endpoint:** `GET /api/lands/:id` or `GET /api/properties/:id`

**Auth Required:** Yes

**Response:** `200 OK`
```json
{
  "id": "uuid",
  "title": "Unit A-101",
  "location": "123 Ocean Drive, Miami",
  "size": 500.5,
  "price": 250000.0,
  "status": "available",
  "ownerId": "uuid",
  "documentUrl": "/uploads/document-uuid.pdf",
  "imageUrl": "/uploads/image-uuid.jpg",
  "documentIPFSHash": "{\"hash\":\"QmHash...\",\"gateway\":\"https://gateway.pinata.cloud/ipfs/QmHash...\",\"timestamp\":\"2024-01-01T00:00:00.000Z\"}",
  "imageIPFSHash": "{\"hash\":\"QmHash...\",\"gateway\":\"https://gateway.pinata.cloud/ipfs/QmHash...\",\"timestamp\":\"2024-01-01T00:00:00.000Z\"}",
  "documentHash": "sha256-hash...",
  "imageHash": "sha256-hash...",
  "blockchainLandId": 1,
  "blockchainTxHash": "0x1234...",
  "owner": {
    "id": "uuid",
    "name": "Builder Name",
    "email": "builder@example.com",
    "walletAddress": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb"
  },
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

---

### 3. Create Property

**Endpoint:** `POST /api/lands` or `POST /api/properties`

**Auth Required:** Yes (Builder)

**Content-Type:** `multipart/form-data`

**Request Body (Form Data):**
- `projectId` (string, required): Project UUID
- `title` (string, required): Property title
- `unitId` (string, optional): Unit identifier
- `location` (string, required): Property location
- `size` (number, required): Size in square meters
- `price` (number, required): Property price
- `installmentPlanYears` (number, optional): 2, 3, or 5 years
- `isResale` (boolean, optional): Mark as resale
- `document` (file, required): Property document (PDF/Image)
- `image` (file, required): Property image (JPG/PNG)

**Response:** `201 Created`
```json
{
  "id": "uuid",
  "title": "Unit A-101",
  "location": "123 Ocean Drive, Miami",
  "size": 500.5,
  "price": 250000.0,
  "status": "available",
  "ownerId": "uuid",
  "documentUrl": "/uploads/document-uuid.pdf",
  "imageUrl": "/uploads/image-uuid.jpg",
  "blockchainLandId": 1,
  "blockchainTxHash": "0x1234...",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

---

### 4. Update Property

**Endpoint:** `PATCH /api/lands/:id` or `PATCH /api/properties/:id`

**Auth Required:** Yes (Builder/Admin)

**Content-Type:** `multipart/form-data`

**Request Body (Form Data):**
- `title` (string, optional)
- `location` (string, optional)
- `size` (number, optional)
- `price` (number, optional)
- `status` (string, optional): available, locked, sold
- `document` (file, optional): New document file
- `image` (file, optional): New image file

**Response:** `200 OK`
```json
{
  "id": "uuid",
  "title": "Updated Title",
  "location": "Updated Location",
  "size": 600.0,
  "price": 300000.0,
  "status": "available",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

---

### 5. Delete Property

**Endpoint:** `DELETE /api/lands/:id` or `DELETE /api/properties/:id`

**Auth Required:** Yes (Builder/Admin)

**Response:** `200 OK`
```json
{
  "message": "Land deleted successfully"
}
```

---

### 6. Verify Document Integrity

**Endpoint:** `GET /api/lands/:id/verify`

**Auth Required:** Yes

**Response:** `200 OK`
```json
{
  "documentVerified": true,
  "imageVerified": true,
  "documentHash": "sha256-hash...",
  "imageHash": "sha256-hash...",
  "documentMatch": true,
  "imageMatch": true
}
```

---

### 7. Verify Blockchain Hash

**Endpoint:** `POST /api/lands/:id/verify-blockchain`

**Auth Required:** Yes

**Response:** `200 OK`
```json
{
  "verified": true,
  "message": "Hash matches blockchain record",
  "databaseHash": "sha256-hash...",
  "blockchainHash": "sha256-hash...",
  "blockchainLandId": 1
}
```

---

## Property Requests

### 1. Create Property Request

**Endpoint:** `POST /api/property-requests`

**Auth Required:** Yes

**Request Body:**
```json
{
  "propertyId": "uuid",
  "requestedPrice": 240000.0  // optional
}
```

**Response:** `201 Created`
```json
{
  "id": "uuid",
  "propertyId": "uuid",
  "buyerId": "uuid",
  "status": "pending",
  "requestedPrice": 240000.0,
  "builderResponse": null,
  "respondedAt": null,
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

---

### 2. Get All Property Requests (Admin)

**Endpoint:** `GET /api/property-requests?status=pending&page=1&limit=10`

**Auth Required:** Yes (Admin)

**Query Parameters:**
- `status` (string, optional): pending, approved, rejected
- `propertyId` (uuid, optional)
- `buyerId` (uuid, optional)
- `page` (number, optional)
- `limit` (number, optional)

**Response:** `200 OK`
```json
[
  {
    "id": "uuid",
    "propertyId": "uuid",
    "buyerId": "uuid",
    "status": "pending",
    "requestedPrice": 240000.0,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
]
```

---

### 3. Get My Property Requests

**Endpoint:** `GET /api/property-requests/my-requests?status=pending`

**Auth Required:** Yes

**Query Parameters:**
- `status` (string, optional): pending, approved, rejected
- `page` (number, optional)
- `limit` (number, optional)

**Response:** `200 OK`
```json
[
  {
    "id": "uuid",
    "propertyId": "uuid",
    "buyerId": "uuid",
    "status": "pending",
    "requestedPrice": 240000.0,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
]
```

---

### 4. Get Pending Requests (Builder)

**Endpoint:** `GET /api/property-requests/pending?page=1&limit=10`

**Auth Required:** Yes (Builder)

**Response:** `200 OK`
```json
[
  {
    "id": "uuid",
    "propertyId": "uuid",
    "buyerId": "uuid",
    "status": "pending",
    "requestedPrice": 240000.0,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
]
```

---

### 5. Get Property Request by ID

**Endpoint:** `GET /api/property-requests/:id`

**Auth Required:** Yes

**Response:** `200 OK`
```json
{
  "id": "uuid",
  "propertyId": "uuid",
  "buyerId": "uuid",
  "status": "approved",
  "requestedPrice": 240000.0,
  "builderResponse": "Approved with conditions",
  "respondedAt": "2024-01-02T00:00:00.000Z",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-02T00:00:00.000Z"
}
```

---

### 6. Respond to Property Request (Builder)

**Endpoint:** `POST /api/property-requests/:id/respond`

**Auth Required:** Yes (Builder)

**Request Body:**
```json
{
  "status": "approved",  // "approved" | "rejected"
  "response": "Approved with conditions"  // optional
}
```

**Response:** `200 OK`
```json
{
  "id": "uuid",
  "propertyId": "uuid",
  "buyerId": "uuid",
  "status": "approved",
  "requestedPrice": 240000.0,
  "builderResponse": "Approved with conditions",
  "respondedAt": "2024-01-02T00:00:00.000Z",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-02T00:00:00.000Z"
}
```

---

### 7. Approve Property Request

**Endpoint:** `POST /api/property-requests/:id/approve`

**Auth Required:** Yes (Builder)

**Response:** `200 OK`
```json
{
  "id": "uuid",
  "status": "approved",
  "respondedAt": "2024-01-02T00:00:00.000Z",
  "updatedAt": "2024-01-02T00:00:00.000Z"
}
```

---

### 8. Reject Property Request

**Endpoint:** `POST /api/property-requests/:id/reject`

**Auth Required:** Yes (Builder)

**Response:** `200 OK`
```json
{
  "id": "uuid",
  "status": "rejected",
  "respondedAt": "2024-01-02T00:00:00.000Z",
  "updatedAt": "2024-01-02T00:00:00.000Z"
}
```

---

### 9. Cancel Property Request

**Endpoint:** `DELETE /api/property-requests/:id`

**Auth Required:** Yes (Buyer)

**Response:** `200 OK`
```json
{
  "id": "uuid",
  "status": "cancelled",
  "updatedAt": "2024-01-02T00:00:00.000Z"
}
```

---

## Resale Requests

### 1. Create Resale Request

**Endpoint:** `POST /api/resale-requests`

**Auth Required:** Yes

**Request Body:**
```json
{
  "propertyId": "uuid",
  "requestedPrice": 280000.0
}
```

**Response:** `201 Created`
```json
{
  "id": "uuid",
  "propertyId": "uuid",
  "currentOwnerId": "uuid",
  "builderId": "uuid",
  "requestedPrice": 280000.0,
  "status": "pending",
  "approvedAt": null,
  "listedAt": null,
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

---

### 2. Get All Resale Requests (Admin)

**Endpoint:** `GET /api/resale-requests?status=approved&page=1&limit=10`

**Auth Required:** Yes (Admin)

**Query Parameters:**
- `status` (string, optional): pending, approved, rejected, listed, sold
- `propertyId` (uuid, optional)
- `page` (number, optional)
- `limit` (number, optional)

**Response:** `200 OK`
```json
[
  {
    "id": "uuid",
    "propertyId": "uuid",
    "currentOwnerId": "uuid",
    "builderId": "uuid",
    "requestedPrice": 280000.0,
    "status": "approved",
    "approvedAt": "2024-01-02T00:00:00.000Z",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-02T00:00:00.000Z"
  }
]
```

---

### 3. Get My Resale Requests

**Endpoint:** `GET /api/resale-requests/my-requests`

**Auth Required:** Yes

**Response:** `200 OK`
```json
[
  {
    "id": "uuid",
    "propertyId": "uuid",
    "status": "pending",
    "requestedPrice": 280000.0,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
]
```

---

### 4. Get Builder's Resale Requests

**Endpoint:** `GET /api/resale-requests/builder?status=pending`

**Auth Required:** Yes (Builder)

**Response:** `200 OK`
```json
[
  {
    "id": "uuid",
    "propertyId": "uuid",
    "currentOwnerId": "uuid",
    "status": "pending",
    "requestedPrice": 280000.0,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
]
```

---

### 5. Get Resale Request by ID

**Endpoint:** `GET /api/resale-requests/:id`

**Auth Required:** Yes

**Response:** `200 OK`
```json
{
  "id": "uuid",
  "propertyId": "uuid",
  "currentOwnerId": "uuid",
  "builderId": "uuid",
  "requestedPrice": 280000.0,
  "status": "listed",
  "approvedAt": "2024-01-02T00:00:00.000Z",
  "listedAt": "2024-01-03T00:00:00.000Z",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-03T00:00:00.000Z"
}
```

---

### 6. Respond to Resale Request (Builder)

**Endpoint:** `POST /api/resale-requests/:id/respond`

**Auth Required:** Yes (Builder)

**Request Body:**
```json
{
  "status": "approved"  // "approved" | "rejected"
}
```

**Response:** `200 OK`
```json
{
  "id": "uuid",
  "status": "approved",
  "approvedAt": "2024-01-02T00:00:00.000Z",
  "updatedAt": "2024-01-02T00:00:00.000Z"
}
```

---

### 7. Approve Resale Request

**Endpoint:** `POST /api/resale-requests/:id/approve`

**Auth Required:** Yes (Builder)

**Response:** `200 OK`
```json
{
  "id": "uuid",
  "status": "approved",
  "approvedAt": "2024-01-02T00:00:00.000Z",
  "updatedAt": "2024-01-02T00:00:00.000Z"
}
```

---

### 8. Reject Resale Request

**Endpoint:** `POST /api/resale-requests/:id/reject`

**Auth Required:** Yes (Builder)

**Response:** `200 OK`
```json
{
  "id": "uuid",
  "status": "rejected",
  "updatedAt": "2024-01-02T00:00:00.000Z"
}
```

---

### 9. List Property as Resale

**Endpoint:** `POST /api/resale-requests/:id/list`

**Auth Required:** Yes (Builder)

**Response:** `200 OK`
```json
{
  "id": "uuid",
  "status": "listed",
  "listedAt": "2024-01-03T00:00:00.000Z",
  "updatedAt": "2024-01-03T00:00:00.000Z"
}
```

---

### 10. Mark Resale as Sold

**Endpoint:** `POST /api/resale-requests/:id/mark-sold`

**Auth Required:** Yes (Builder/Admin)

**Response:** `200 OK`
```json
{
  "id": "uuid",
  "status": "sold",
  "updatedAt": "2024-01-04T00:00:00.000Z"
}
```

---

## Agreements

### 1. Create Agreement

**Endpoint:** `POST /api/agreements`

**Auth Required:** Yes (Builder)

**Request Body:**
```json
{
  "propertyId": "uuid",
  "buyerId": "uuid",
  "agreementType": "initial",  // "initial" | "final"
  "terms": {
    "price": 250000.0,
    "totalAmount": 250000.0,
    "installmentPlanYears": 3,
    "paymentTerms": "Payable in 3 years with monthly installments",
    "propertyDetails": {}
  }
}
```

**Response:** `201 Created`
```json
{
  "id": "uuid",
  "propertyId": "uuid",
  "buyerId": "uuid",
  "builderId": "uuid",
  "agreementType": "initial",
  "status": "pending",
  "documentUrl": "/uploads/agreement-doc.pdf",
  "documentIPFSHash": "QmHash...",
  "documentHash": "sha256-hash...",
  "buyerSignedAt": null,
  "builderSignedAt": null,
  "signedDocumentUrl": null,
  "terms": {
    "price": 250000.0,
    "totalAmount": 250000.0,
    "installmentPlanYears": 3
  },
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

---

### 2. Get All Agreements

**Endpoint:** `GET /api/agreements?propertyId=uuid&buyerId=uuid&status=signed`

**Auth Required:** Yes

**Query Parameters:**
- `propertyId` (uuid, optional)
- `buyerId` (uuid, optional)
- `builderId` (uuid, optional)
- `status` (string, optional): pending, buyer_signed, builder_signed, signed, completed
- `agreementType` (string, optional): initial, final
- `page` (number, optional)
- `limit` (number, optional)

**Response:** `200 OK`
```json
[
  {
    "id": "uuid",
    "propertyId": "uuid",
    "buyerId": "uuid",
    "builderId": "uuid",
    "agreementType": "initial",
    "status": "signed",
    "buyerSignedAt": "2024-01-02T00:00:00.000Z",
    "builderSignedAt": "2024-01-02T00:00:00.000Z",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-02T00:00:00.000Z"
  }
]
```

---

### 3. Get Agreement by ID

**Endpoint:** `GET /api/agreements/:id`

**Auth Required:** Yes

**Response:** `200 OK`
```json
{
  "id": "uuid",
  "propertyId": "uuid",
  "buyerId": "uuid",
  "builderId": "uuid",
  "agreementType": "initial",
  "status": "signed",
  "documentUrl": "/uploads/agreement-doc.pdf",
  "documentIPFSHash": "QmHash...",
  "buyerSignedAt": "2024-01-02T00:00:00.000Z",
  "builderSignedAt": "2024-01-02T00:00:00.000Z",
  "signedDocumentUrl": "/uploads/signed-doc.pdf",
  "terms": {
    "price": 250000.0,
    "installmentPlanYears": 3
  },
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-02T00:00:00.000Z"
}
```

---

### 4. Get Property Agreements

**Endpoint:** `GET /api/agreements/property/:propertyId`

**Auth Required:** Yes

**Response:** `200 OK`
```json
[
  {
    "id": "uuid",
    "propertyId": "uuid",
    "buyerId": "uuid",
    "status": "signed",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-02T00:00:00.000Z"
  }
]
```

---

### 5. Sign Agreement

**Endpoint:** `POST /api/agreements/:id/sign`

**Auth Required:** Yes (Buyer/Builder)

**Request Body:**
```json
{
  "signatureData": "base64-encoded-signature"  // optional, for digital signature
}
```

**Response:** `200 OK`
```json
{
  "id": "uuid",
  "status": "buyer_signed",  // or "builder_signed" or "signed"
  "buyerSignedAt": "2024-01-02T00:00:00.000Z",
  "updatedAt": "2024-01-02T00:00:00.000Z"
}
```

---

### 6. Upload Signed Document

**Endpoint:** `POST /api/agreements/:id/upload-signed`

**Auth Required:** Yes

**Content-Type:** `multipart/form-data`

**Request Body (Form Data):**
- `document` (file, required): Signed agreement document (PDF/Image)

**Response:** `200 OK`
```json
{
  "id": "uuid",
  "signedDocumentUrl": "/uploads/signed-doc.pdf",
  "signedDocumentIPFSHash": "QmHash...",
  "signedDocumentHash": "sha256-hash...",
  "updatedAt": "2024-01-02T00:00:00.000Z"
}
```

---

### 7. Generate Ownership Document

**Endpoint:** `POST /api/agreements/:id/generate-ownership-doc`

**Auth Required:** Yes (Builder)

**Response:** `200 OK`
```json
{
  "id": "uuid",
  "status": "completed",
  "blockchainTxHash": "0x1234...",
  "updatedAt": "2024-01-03T00:00:00.000Z"
}
```

---

### 8. Verify Agreement

**Endpoint:** `POST /api/agreements/:id/verify`

**Auth Required:** Yes

**Response:** `200 OK`
```json
{
  "verified": true,
  "message": "Agreement signatures and document verified",
  "signaturesVerified": true,
  "documentVerified": true,
  "agreement": {
    "id": "uuid",
    "status": "signed"
  }
}
```

---

## Installments

### 1. Create Installments

**Endpoint:** `POST /api/installments`

**Auth Required:** Yes (Builder)

**Request Body:**
```json
{
  "agreementId": "uuid"
}
```

**Response:** `201 Created`
```json
[
  {
    "id": "uuid",
    "landId": "uuid",
    "agreementId": "uuid",
    "buyerId": "uuid",
    "amount": 6944.44,
    "paymentWindowStart": "2024-01-15T00:00:00.000Z",
    "paymentWindowEnd": "2024-02-15T00:00:00.000Z",
    "status": "pending",
    "paymentDate": null,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
]
```

---

### 2. Get All Installments

**Endpoint:** `GET /api/installments?landId=uuid&buyerId=uuid&status=pending`

**Auth Required:** Yes

**Query Parameters:**
- `landId` (uuid, optional)
- `agreementId` (uuid, optional)
- `buyerId` (uuid, optional)
- `status` (string, optional): pending, paid, overdue, completed
- `page` (number, optional)
- `limit` (number, optional)

**Response:** `200 OK`
```json
[
  {
    "id": "uuid",
    "landId": "uuid",
    "agreementId": "uuid",
    "buyerId": "uuid",
    "amount": 6944.44,
    "paymentWindowStart": "2024-01-15T00:00:00.000Z",
    "paymentWindowEnd": "2024-02-15T00:00:00.000Z",
    "status": "pending",
    "paymentDate": null,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
]
```

---

### 3. Get My Installments

**Endpoint:** `GET /api/installments/my-installments?status=pending`

**Auth Required:** Yes

**Response:** `200 OK`
```json
[
  {
    "id": "uuid",
    "landId": "uuid",
    "amount": 6944.44,
    "paymentWindowStart": "2024-01-15T00:00:00.000Z",
    "paymentWindowEnd": "2024-02-15T00:00:00.000Z",
    "status": "pending",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
]
```

---

### 4. Get Installment by ID

**Endpoint:** `GET /api/installments/:id`

**Auth Required:** Yes

**Response:** `200 OK`
```json
{
  "id": "uuid",
  "landId": "uuid",
  "agreementId": "uuid",
  "buyerId": "uuid",
  "amount": 6944.44,
  "paymentWindowStart": "2024-01-15T00:00:00.000Z",
  "paymentWindowEnd": "2024-02-15T00:00:00.000Z",
  "status": "paid",
  "paymentDate": "2024-01-20T00:00:00.000Z",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-20T00:00:00.000Z"
}
```

---

### 5. Get Installment Status

**Endpoint:** `GET /api/installments/:id/status`

**Auth Required:** Yes

**Response:** `200 OK`
```json
{
  "installment": {
    "id": "uuid",
    "amount": 6944.44,
    "status": "pending",
    "paymentWindowStart": "2024-01-15T00:00:00.000Z",
    "paymentWindowEnd": "2024-02-15T00:00:00.000Z"
  },
  "isPaid": false,
  "hasPendingPayment": true,
  "paymentStatus": "pending"
}
```

---

### 6. Update Overdue Installments (Admin)

**Endpoint:** `POST /api/installments/update-overdue`

**Auth Required:** Yes (Admin)

**Response:** `200 OK`
```json
{
  "updatedCount": 5,
  "message": "5 installment(s) marked as overdue"
}
```

---

## Payments

### 1. Create Payment

**Endpoint:** `POST /api/payments`

**Auth Required:** Yes (User/Builder)

**Content-Type:** `multipart/form-data`

**Request Body (Form Data):**
- `landId` (string, required): Property UUID
- `agreementId` (string, optional): Agreement UUID
- `installmentId` (string, optional): Installment UUID
- `amount` (number, required): Payment amount
- `dueDate` (string, optional): ISO date string
- `paymentMode` (string, required): "bank" | "crypto"
- `transactionHash` (string, optional): Required for crypto payments
- `proof` (file, optional): Payment proof file (for bank transfers)

**Response:** `201 Created`
```json
{
  "id": "uuid",
  "landId": "uuid",
  "buyerId": "uuid",
  "amount": 50000.0,
  "dueDate": "2024-02-01T00:00:00.000Z",
  "status": "pending",
  "paymentMode": "bank",
  "proofCID": "proof-uuid",
  "transactionHash": null,
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

---

### 2. Get My Payments

**Endpoint:** `GET /api/payments/my-payments`

**Auth Required:** Yes (User)

**Response:** `200 OK`
```json
[
  {
    "id": "uuid",
    "landId": "uuid",
    "buyerId": "uuid",
    "amount": 50000.0,
    "dueDate": "2024-02-01T00:00:00.000Z",
    "status": "verified",
    "paymentMode": "bank",
    "land": {
      "id": "uuid",
      "title": "Unit A-101",
      "location": "123 Ocean Drive"
    },
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-02T00:00:00.000Z"
  }
]
```

---

### 3. Get Pending Payments (Builder)

**Endpoint:** `GET /api/payments/pending`

**Auth Required:** Yes (Builder)

**Response:** `200 OK`
```json
[
  {
    "id": "uuid",
    "landId": "uuid",
    "buyerId": "uuid",
    "amount": 50000.0,
    "status": "pending",
    "paymentMode": "bank",
    "buyer": {
      "id": "uuid",
      "name": "Buyer Name",
      "email": "buyer@example.com"
    },
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
]
```

---

### 4. Get Property Payments

**Endpoint:** `GET /api/payments/property/:propertyId`

**Auth Required:** Yes

**Response:** `200 OK`
```json
[
  {
    "id": "uuid",
    "amount": 50000.0,
    "status": "verified",
    "paymentMode": "bank",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-02T00:00:00.000Z"
  }
]
```

---

### 5. Get Agreement Payments

**Endpoint:** `GET /api/payments/agreement/:agreementId`

**Auth Required:** Yes

**Response:** `200 OK`
```json
[
  {
    "id": "uuid",
    "amount": 6944.44,
    "status": "verified",
    "paymentMode": "bank",
    "createdAt": "2024-01-15T00:00:00.000Z",
    "updatedAt": "2024-01-16T00:00:00.000Z"
  }
]
```

---

### 6. Get Installment Summary

**Endpoint:** `GET /api/payments/installment-summary/:propertyId`

**Auth Required:** Yes

**Response:** `200 OK`
```json
{
  "propertyId": "uuid",
  "totalAmount": 250000.0,
  "totalPaid": 100000.0,
  "remainingAmount": 150000.0,
  "totalInstallments": 36,
  "paidInstallments": 12,
  "pendingInstallments": 24,
  "overdueInstallments": 0,
  "nextDueDate": "2024-02-15T00:00:00.000Z",
  "nextInstallmentAmount": 6944.44,
  "paymentProgress": 40.0
}
```

---

### 7. Verify Payment

**Endpoint:** `POST /api/payments/:id/verify`

**Auth Required:** Yes (Builder/Admin)

**Request Body:**
```json
{
  "verified": true,  // true | false
  "remarks": "Payment verified successfully"  // optional
}
```

**Response:** `200 OK`
```json
{
  "id": "uuid",
  "status": "verified",
  "remarks": "Payment verified successfully",
  "updatedAt": "2024-01-02T00:00:00.000Z"
}
```

---

## Contact

### 1. Submit Contact Form

**Endpoint:** `POST /api/contact`

**Auth Required:** No

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "message": "Hello, I would like to inquire about..."
}
```

**Response:** `200 OK`
```json
{
  "message": "Contact form submitted successfully",
  "sentAt": "2024-01-01T00:00:00.000Z"
}
```

---

## Error Handling

### Error Response Format

All errors follow this structure:

```json
{
  "statusCode": 400,
  "message": "Error message or array of validation errors",
  "error": "Bad Request"
}
```

### Common Status Codes

- **200 OK**: Request successful
- **201 Created**: Resource created successfully
- **400 Bad Request**: Invalid request data or validation errors
- **401 Unauthorized**: Missing or invalid authentication token
- **403 Forbidden**: Insufficient permissions (role-based access)
- **404 Not Found**: Resource not found
- **409 Conflict**: Resource already exists (e.g., duplicate email)
- **500 Internal Server Error**: Server error

### Validation Error Example

```json
{
  "statusCode": 400,
  "message": [
    "email must be an email",
    "password must be longer than or equal to 8 characters"
  ],
  "error": "Bad Request"
}
```

### Authentication Error Example

```json
{
  "statusCode": 401,
  "message": "Unauthorized",
  "error": "Unauthorized"
}
```

### Forbidden Error Example

```json
{
  "statusCode": 403,
  "message": "Forbidden - Builder only",
  "error": "Forbidden"
}
```

---

## Important Notes for Frontend Developers

### 1. Authentication Token Storage
- Store the `accessToken` securely (e.g., httpOnly cookies or secure storage)
- Store `refreshToken` securely for token refresh functionality
- Include the token in the `Authorization` header for all protected endpoints

### 2. File Uploads
- Use `FormData` for multipart/form-data requests
- Ensure proper file validation on frontend before upload
- Show upload progress for better UX

### 3. Token Refresh
- Implement automatic token refresh using the `refresh-token` endpoint
- Refresh token before it expires (check token expiry)
- Handle refresh token expiry by redirecting to login

### 4. Pagination
- Most list endpoints support pagination via `page` and `limit` query parameters
- Default values: `page=1`, `limit=10`
- Implement infinite scroll or pagination UI accordingly

### 5. File URLs
- Document and image URLs are relative paths (e.g., `/uploads/file-uuid.pdf`)
- Prepend the base URL to get full URL: `http://localhost:3000/uploads/file-uuid.pdf`
- IPFS hashes are stored as JSON strings with gateway URLs

### 6. Status Enums

**Property Status:**
- `available` - Available for purchase
- `reserved` - Reserved by a buyer
- `agreement_pending` - Agreement in progress
- `payment_in_progress` - Payment being processed
- `owned` - Ownership transferred
- `resale_listed` - Listed for resale

**Payment Status:**
- `pending` - Awaiting verification
- `verified` - Verified by builder/admin
- `rejected` - Rejected by builder/admin

**Agreement Status:**
- `pending` - Awaiting signatures
- `buyer_signed` - Buyer has signed
- `builder_signed` - Builder has signed
- `signed` - Both parties signed
- `completed` - Ownership transferred

**Installment Status:**
- `pending` - Not yet paid
- `paid` - Payment received
- `overdue` - Payment window passed
- `completed` - All payments completed

### 7. Date Formats
- All dates are in ISO 8601 format: `2024-01-01T00:00:00.000Z`
- Use appropriate date libraries for parsing and formatting

### 8. UUIDs
- All IDs are UUID v4 format
- Validate UUID format on frontend before sending requests

### 9. Error Handling Best Practices
- Display user-friendly error messages
- Log errors for debugging
- Handle network errors gracefully
- Implement retry logic for failed requests where appropriate

### 10. Swagger Documentation
- Interactive API documentation available at: `http://localhost:3000/api/docs`
- Test endpoints directly from Swagger UI during development

---

## Enums Reference

This section provides detailed information about all enums used in the API, their values, and what happens when each value is used.

### 1. UserRole

**Used in:** Authentication, Authorization, Builder endpoints

**Values:**
- `admin` - System administrator with full access
- `user` - Standard user who can purchase properties
- `builder` - Real estate developer/company (requires verification)

**What happens:**
- **`admin`**: 
  - Full system access
  - Can verify builders (`POST /api/auth/builders/:id/verify`)
  - Can access all endpoints
  - Can update/delete any resource
  
- **`user`**: 
  - Can browse properties
  - Can create property requests
  - Can make payments
  - Can sign agreements
  - Cannot create projects or properties
  
- **`builder`**: 
  - Requires admin verification (`isBuilderVerified: true`)
  - Can create projects and properties (only when verified)
  - Can approve/reject property requests
  - Can create agreements
  - Can verify payments
  - Can transfer ownership
  - Cannot perform builder actions until verified

**Registration:**
- Users can register with `role: "user"` or `role: "builder"`
- Builders must provide `companyName` and `licenseNumber`
- Builder accounts start with `isBuilderVerified: false`

---

### 2. LandStatus (Property Status)

**Used in:** Property/Land endpoints, Query filters

**Values:**
- `available` - Property is available for purchase
- `reserved` - Property is reserved by a buyer (locked)
- `agreement_pending` - Agreement is being created/negotiated
- `payment_in_progress` - Payments are being processed
- `owned` - Ownership has been transferred to buyer
- `resale_listed` - Property is listed for resale
- `locked` - *(Deprecated)* Use `reserved` instead
- `sold` - *(Deprecated)* Use `owned` instead

**Status Flow:**
```
available → reserved → agreement_pending → payment_in_progress → owned → resale_listed
```

**What happens:**
- **`available`**: 
  - Property can receive purchase requests
  - Visible in property listings
  - Builder can update/delete property
  
- **`reserved`**: 
  - Property is locked to a specific buyer
  - Cannot receive new requests
  - Set when property request is approved
  - Only the reserved buyer can proceed with agreement
  
- **`agreement_pending`**: 
  - Agreement is being created or signed
  - Property remains locked to buyer
  - Set when agreement is created
  
- **`payment_in_progress`**: 
  - Payments are being processed
  - Installments may be active
  - Property remains locked to buyer
  - Set when first payment is made
  
- **`owned`**: 
  - Ownership has been transferred
  - Buyer is now the owner
  - Property cannot be updated by builder
  - Owner can request resale
  
- **`resale_listed`**: 
  - Property is available for resale
  - New buyers can request purchase
  - Original buyer remains owner until sale

**Used in endpoints:**
- `GET /api/lands?status={LandStatus}` - Filter properties by status
- Property status is automatically updated by system based on workflow

---

### 3. PaymentStatus

**Used in:** Payment endpoints, Payment responses

**Values:**
- `pending` - Payment submitted, awaiting builder verification
- `verified` - Builder verified and approved the payment
- `rejected` - Builder rejected the payment

**What happens:**
- **`pending`**: 
  - Payment is submitted by buyer
  - Appears in builder's pending payments list (`GET /api/payments/pending`)
  - Requires builder verification
  - For bank payments: proof file must be uploaded
  - For crypto payments: transaction hash must be provided
  
- **`verified`**: 
  - Builder has verified the payment (`POST /api/payments/:id/verify`)
  - Payment amount is recorded on blockchain
  - Associated installment status updated to `paid`
  - Property's `totalPaid` is updated
  - System checks if property is fully paid
  
- **`rejected`**: 
  - Builder rejected the payment
  - Buyer is notified
  - Payment can be resubmitted with corrections
  - No blockchain record created

**Status Flow:**
```
pending → verified (builder verifies)
       → rejected (builder rejects)
```

**Used in endpoints:**
- `POST /api/payments` - Creates payment with status `pending`
- `POST /api/payments/:id/verify` - Changes status to `verified` or `rejected`
- `GET /api/payments/my-payments` - Returns payments with status
- `GET /api/payments/pending` - Returns payments with status `pending`

---

### 4. PaymentMode

**Used in:** Payment creation endpoints

**Values:**
- `bank` - Bank transfer payment
- `crypto` - Cryptocurrency payment

**What happens:**
- **`bank`**: 
  - Requires proof file upload (`proof` field in form data)
  - Proof file is stored locally and uploaded to IPFS
  - Requires builder verification
  - Status starts as `pending`
  - Builder must verify the payment manually
  
- **`crypto`**: 
  - Requires `transactionHash` field
  - Transaction is verified on blockchain automatically
  - If transaction is valid and amount matches, status can be auto-verified
  - Amount must match the payment amount
  - Transaction must be confirmed on blockchain

**Used in endpoints:**
- `POST /api/payments` - Specify payment mode in request body
- Response includes payment mode in payment details

---

### 5. AgreementType

**Used in:** Agreement creation endpoints

**Values:**
- `initial` - Initial purchase agreement
- `final_ownership` - Final ownership transfer agreement

**What happens:**
- **`initial`**: 
  - Created when property request is approved
  - Contains purchase terms (price, installment plan)
  - Must be signed by both buyer and builder
  - Used for new property purchases
  
- **`final_ownership`**: 
  - Created for ownership transfer
  - Used for final documentation
  - Typically created after all payments are complete

**Used in endpoints:**
- `POST /api/agreements` - Specify agreement type in request body
- Response includes agreement type

---

### 6. AgreementStatus

**Used in:** Agreement endpoints, Agreement responses

**Values:**
- `draft` - Agreement is being drafted
- `pending_signature` - Agreement is ready, awaiting signatures
- `signed` - Both parties have signed the agreement
- `completed` - Agreement is completed, ownership transferred

**What happens:**
- **`draft`**: 
  - Agreement document is being prepared
  - Not yet ready for signing
  
- **`pending_signature`**: 
  - Agreement document is generated
  - Ready for buyer and builder to sign
  - Set when agreement is created
  
- **`signed`**: 
  - Both buyer and builder have signed
  - Set when second party signs
  - Installments can now be created
  - Payments can be processed
  
- **`completed`**: 
  - Ownership has been transferred
  - Agreement process is complete
  - Set when ownership transfer is finalized

**Status Flow:**
```
draft → pending_signature → signed → completed
```

**Used in endpoints:**
- `POST /api/agreements` - Creates agreement with status `pending_signature`
- `POST /api/agreements/:id/sign` - Updates status to `signed` when both parties sign
- `POST /api/agreements/:id/generate-ownership-doc` - Updates status to `completed`
- `GET /api/agreements?status={AgreementStatus}` - Filter agreements by status

---

### 7. PropertyRequestStatus

**Used in:** Property request endpoints

**Values:**
- `pending` - Request is pending builder approval
- `approved` - Builder approved the request
- `rejected` - Builder rejected the request
- `cancelled` - Buyer cancelled the request

**What happens:**
- **`pending`**: 
  - Request is created by buyer
  - Appears in builder's pending requests (`GET /api/property-requests/pending`)
  - Property remains `available`
  - Builder can approve or reject
  
- **`approved`**: 
  - Builder approves the request (`POST /api/property-requests/:id/approve`)
  - Property status changes to `reserved`
  - Property is locked to this buyer
  - Builder can now create agreement
  - Other buyers cannot request this property
  
- **`rejected`**: 
  - Builder rejects the request (`POST /api/property-requests/:id/reject`)
  - Property status remains `available`
  - Property becomes available for other requests
  - Builder can provide response message
  
- **`cancelled`**: 
  - Buyer cancels the request (`DELETE /api/property-requests/:id`)
  - Property status returns to `available` (if it was `reserved`)
  - Property becomes available for other requests

**Status Flow:**
```
pending → approved (builder approves)
       → rejected (builder rejects)
       → cancelled (buyer cancels)
```

**Used in endpoints:**
- `POST /api/property-requests` - Creates request with status `pending`
- `POST /api/property-requests/:id/approve` - Changes status to `approved`
- `POST /api/property-requests/:id/reject` - Changes status to `rejected`
- `DELETE /api/property-requests/:id` - Changes status to `cancelled`
- `GET /api/property-requests?status={PropertyRequestStatus}` - Filter by status

---

### 8. ResaleRequestStatus

**Used in:** Resale request endpoints

**Values:**
- `pending` - Resale request is pending builder approval
- `approved` - Builder approved the resale request
- `rejected` - Builder rejected the resale request
- `listed` - Property is listed for resale
- `sold` - Resale property has been sold

**What happens:**
- **`pending`**: 
  - Owner creates resale request
  - Appears in builder's resale requests (`GET /api/resale-requests/builder`)
  - Builder must approve before listing
  
- **`approved`**: 
  - Builder approves the resale (`POST /api/resale-requests/:id/approve`)
  - Property can now be listed
  - Builder must call list endpoint to make it available
  
- **`rejected`**: 
  - Builder rejects the resale request
  - Property remains in owner's possession
  - Owner can create new request with different price
  
- **`listed`**: 
  - Builder lists the property for resale (`POST /api/resale-requests/:id/list`)
  - Property status changes to `resale_listed`
  - Property is visible in listings with `isResale: true`
  - New buyers can request purchase
  - Purchase flow repeats for new buyer
  
- **`sold`**: 
  - Property has been sold to new buyer (`POST /api/resale-requests/:id/mark-sold`)
  - New buyer becomes owner
  - Original owner receives payment
  - Resale request is completed

**Status Flow:**
```
pending → approved → listed → sold
       → rejected
```

**Used in endpoints:**
- `POST /api/resale-requests` - Creates request with status `pending`
- `POST /api/resale-requests/:id/approve` - Changes status to `approved`
- `POST /api/resale-requests/:id/reject` - Changes status to `rejected`
- `POST /api/resale-requests/:id/list` - Changes status to `listed`
- `POST /api/resale-requests/:id/mark-sold` - Changes status to `sold`
- `GET /api/resale-requests?status={ResaleRequestStatus}` - Filter by status

---

### 9. InstallmentStatus

**Used in:** Installment endpoints, Installment responses

**Values:**
- `pending` - Installment is within payment window, not yet paid
- `paid` - Installment has been paid
- `overdue` - Payment window has expired, not paid

**What happens:**
- **`pending`**: 
  - Installment is created with payment window
  - Buyer can make payment within the window
  - Status is automatically checked by system
  - Set when installment is created
  
- **`paid`**: 
  - Payment has been verified for this installment
  - Set when payment is verified (`POST /api/payments/:id/verify`)
  - `paymentDate` field is set
  - Contributes to property's `totalPaid`
  
- **`overdue`**: 
  - Payment window has expired
  - No payment was received
  - Updated automatically by cron job (`POST /api/installments/update-overdue`)
  - Buyer should still be able to pay (late payment)
  - May trigger notifications or penalties (system dependent)

**Status Flow:**
```
pending → paid (payment verified)
       → overdue (window expired, admin updates)
```

**Used in endpoints:**
- `POST /api/installments` - Creates installments with status `pending`
- `POST /api/payments/:id/verify` - Updates related installment to `paid`
- `POST /api/installments/update-overdue` - Updates overdue installments (Admin)
- `GET /api/installments?status={InstallmentStatus}` - Filter by status
- `GET /api/installments/my-installments` - Returns installments with status

---

### 10. ProjectStatus

**Used in:** Project endpoints, Project responses

**Values:**
- `draft` - Project is being created/edited
- `active` - Project is active and accepting properties
- `completed` - Project is completed (all units sold)
- `cancelled` - Project is cancelled

**What happens:**
- **`draft`**: 
  - Project is being set up
  - Default status when created
  - Builder can edit project details
  
- **`active`**: 
  - Project is live
  - Builder can add properties
  - Properties can be listed and sold
  - Set when project is ready
  
- **`completed`**: 
  - All properties in project have been sold
  - No new properties can be added
  - Set automatically or manually by builder/admin
  
- **`cancelled`**: 
  - Project is cancelled
  - Properties cannot be sold
  - Used for projects that won't proceed

**Used in endpoints:**
- `POST /api/projects` - Creates project with status `draft` (default)
- `PATCH /api/projects/:id` - Can update status
- `GET /api/projects?status={ProjectStatus}` - Filter projects by status

---

## Quick Reference

### Base URL
```
http://localhost:3000/api
```

### Authentication Header
```
Authorization: Bearer <access_token>
```

### File Upload Content-Type
```
multipart/form-data
```

### Common Query Parameters
- `page` (number): Page number (default: 1)
- `limit` (number): Items per page (default: 10)
- `status` (string): Filter by status (use enum values)
- `propertyId`, `landId` (uuid): Filter by property
- `buyerId`, `builderId` (uuid): Filter by user

### Enum Values Quick Reference

**UserRole:** `admin` | `user` | `builder`

**Note:** The system uses 3 role types:
- `admin` - System administrator (cannot register, must be created manually)
- `user` - Regular users/buyers who can purchase properties
- `builder` - Property builders/developers who can create and manage properties

**Old Role Mapping (Deprecated):**
- `buyer` → now uses `user`
- `seller` → now uses `builder`

**LandStatus:** `available` | `reserved` | `agreement_pending` | `payment_in_progress` | `owned` | `resale_listed`

**PaymentStatus:** `pending` | `verified` | `rejected`

**PaymentMode:** `bank` | `crypto`

**AgreementType:** `initial` | `final_ownership`

**AgreementStatus:** `draft` | `pending_signature` | `signed` | `completed`

**PropertyRequestStatus:** `pending` | `approved` | `rejected` | `cancelled`

**ResaleRequestStatus:** `pending` | `approved` | `rejected` | `listed` | `sold`

**InstallmentStatus:** `pending` | `paid` | `overdue`

**ProjectStatus:** `draft` | `active` | `completed` | `cancelled`

### Additional Constants

**Installment Plan Years:** `2` | `3` | `5`
- Used in property creation (`POST /api/lands`)
- Determines number of monthly installments:
  - `2` years = 24 monthly installments
  - `3` years = 36 monthly installments
  - `5` years = 60 monthly installments
- Used to calculate installment amounts and payment windows

---

**Last Updated:** 2024-01-01

**For issues or questions, please contact the backend team.**
