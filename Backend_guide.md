# Backend API Guide

Complete API documentation for Land Registration Management System Backend.

## Table of Contents

1. [Base Information](#base-information)
2. [Authentication](#authentication)
3. [API Endpoints](#api-endpoints)
   - [Auth Endpoints](#auth-endpoints)
   - [Lands Endpoints](#lands-endpoints)
   - [Payments Endpoints](#payments-endpoints)
   - [Reservations Endpoints](#reservations-endpoints)
   - [Contact Endpoints](#contact-endpoints)
4. [Types and Enums](#types-and-enums)
5. [Error Responses](#error-responses)

---

## Base Information

### Base URL
```
http://localhost:3000/api
```

### Swagger Documentation
```
http://localhost:3000/api/docs
```

### Authentication
Most endpoints require JWT authentication. Include the token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

---

## Authentication

### Getting a Token

1. Register a new user: `POST /api/auth/register`
2. Login: `POST /api/auth/login`

Both endpoints return a JWT token that should be used for subsequent authenticated requests.

---

## API Endpoints

## Auth Endpoints

### 1. Register User

**Endpoint:** `POST /api/auth/register`

**Description:** Register a new user account

**Authentication:** Not required (Public)

**Request Payload:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "role": "buyer"
}
```

**Request Body Schema:**
- `name` (string, required): User full name (2-255 characters)
- `email` (string, required): Valid email address
- `password` (string, required): Password (minimum 8 characters)
- `role` (enum, required): User role - `admin`, `seller`, `buyer`, or `builder`

**Response (201 Created):**
```json
{
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "buyer",
    "walletAddress": null,
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI1NTBlODQwMC1lMjliLTQxZDQtYTcxNi00NDY2NTU0NDAwMDAiLCJlbWFpbCI6ImpvaG5AZXhhbXBsZS5jb20iLCJyb2xlIjoiYnV5ZXIiLCJpYXQiOjE3MDUzMjE4MDAsImV4cCI6MTcwNTQwODIwMH0.example"
}
```

**Error Responses:**
- `409 Conflict`: User already exists
- `400 Bad Request`: Validation error

---

### 2. Login User

**Endpoint:** `POST /api/auth/login`

**Description:** Authenticate user and get JWT token

**Authentication:** Not required (Public)

**Request Payload:**
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

**Request Body Schema:**
- `email` (string, required): User email address
- `password` (string, required): User password

**Response (200 OK):**
```json
{
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "buyer",
    "walletAddress": null,
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Error Responses:**
- `401 Unauthorized`: Invalid credentials
- `400 Bad Request`: Validation error

---

### 3. Get Current User

**Endpoint:** `GET /api/auth/me`

**Description:** Get current authenticated user information

**Authentication:** Required (JWT)

**Request Headers:**
```
Authorization: Bearer <token>
```

**Response (200 OK):**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "John Doe",
  "email": "john@example.com",
  "role": "buyer",
  "walletAddress": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
  "createdAt": "2024-01-15T10:30:00.000Z",
  "updatedAt": "2024-01-15T10:30:00.000Z"
}
```

**Error Responses:**
- `401 Unauthorized`: Invalid or missing token

---

### 4. Update User Profile

**Endpoint:** `PATCH /api/auth/profile`

**Description:** Update current user's profile information

**Authentication:** Required (JWT)

**Request Headers:**
```
Authorization: Bearer <token>
```

**Request Payload:**
```json
{
  "name": "John Updated",
  "email": "john.updated@example.com"
}
```

**Request Body Schema:**
- `name` (string, optional): User name (2-255 characters)
- `email` (string, optional): Valid email address

**Response (200 OK):**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "John Updated",
  "email": "john.updated@example.com",
  "role": "buyer",
  "walletAddress": null,
  "createdAt": "2024-01-15T10:30:00.000Z",
  "updatedAt": "2024-01-15T11:00:00.000Z"
}
```

**Error Responses:**
- `401 Unauthorized`: Invalid or missing token
- `409 Conflict`: Email already taken
- `400 Bad Request`: Validation error

---

### 5. Update Password

**Endpoint:** `PATCH /api/auth/password`

**Description:** Update current user's password

**Authentication:** Required (JWT)

**Request Headers:**
```
Authorization: Bearer <token>
```

**Request Payload:**
```json
{
  "currentPassword": "oldPassword123",
  "newPassword": "newPassword123"
}
```

**Request Body Schema:**
- `currentPassword` (string, required): Current password (minimum 8 characters)
- `newPassword` (string, required): New password (minimum 8 characters)

**Response (200 OK):**
```json
{
  "message": "Password updated successfully"
}
```

**Error Responses:**
- `401 Unauthorized`: Invalid or missing token, or incorrect current password
- `400 Bad Request`: Validation error

---

### 6. Forgot Password

**Endpoint:** `POST /api/auth/forgot-password`

**Description:** Request password reset token (sends email if configured)

**Authentication:** Not required (Public)

**Request Payload:**
```json
{
  "email": "john@example.com"
}
```

**Request Body Schema:**
- `email` (string, required): User email address

**Response (200 OK):**
```json
{
  "message": "Password reset token generated. Check your email.",
  "resetToken": "reset-token-abc123xyz"
}
```

**Note:** In development, the reset token is returned in the response. In production, it's sent via email.

---

### 7. Reset Password

**Endpoint:** `POST /api/auth/reset-password`

**Description:** Reset password using reset token

**Authentication:** Not required (Public)

**Request Payload:**
```json
{
  "token": "reset-token-abc123xyz",
  "newPassword": "newPassword123"
}
```

**Request Body Schema:**
- `token` (string, required): Password reset token
- `newPassword` (string, required): New password (minimum 8 characters)

**Response (200 OK):**
```json
{
  "message": "Password reset successfully"
}
```

**Error Responses:**
- `400 Bad Request`: Invalid or expired token, or validation error

---

### 8. Logout

**Endpoint:** `POST /api/auth/logout`

**Description:** Logout user (client should discard token)

**Authentication:** Required (JWT)

**Request Headers:**
```
Authorization: Bearer <token>
```

**Response (200 OK):**
```json
{
  "message": "Logged out successfully"
}
```

---

## Lands Endpoints

### 1. Get All Lands

**Endpoint:** `GET /api/lands`

**Description:** Get paginated list of lands with optional filters

**Authentication:** Required (JWT)

**Request Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
- `status` (enum, optional): Filter by status - `available`, `locked`, or `sold`
- `ownerId` (uuid, optional): Filter by owner ID
- `minPrice` (number, optional): Minimum price filter
- `maxPrice` (number, optional): Maximum price filter
- `page` (number, optional): Page number (default: 1, minimum: 1)
- `limit` (number, optional): Items per page (default: 10, minimum: 1)

**Example Request:**
```
GET /api/lands?status=available&minPrice=10000&maxPrice=500000&page=1&limit=10
```

**Response (200 OK):**
```json
[
  {
    "id": "660e8400-e29b-41d4-a716-446655440000",
    "title": "Beachfront Property",
    "location": "123 Ocean Drive, Miami",
    "size": 500.5,
    "price": 250000.0,
    "status": "available",
    "ownerId": "550e8400-e29b-41d4-a716-446655440000",
    "documentCID": "uploads/land-documents/abc123.pdf",
    "documentUrl": "http://localhost:3000/uploads/land-documents/abc123.pdf",
    "imageCID": "uploads/land-images/xyz789.jpg",
    "imageUrl": "http://localhost:3000/uploads/land-images/xyz789.jpg",
    "documentIPFSHash": "{\"hash\":\"QmXxx...\",\"gateway\":\"https://ipfs.io/ipfs/\",\"timestamp\":\"2024-01-15T10:30:00.000Z\"}",
    "imageIPFSHash": "{\"hash\":\"QmYyy...\",\"gateway\":\"https://ipfs.io/ipfs/\",\"timestamp\":\"2024-01-15T10:30:00.000Z\"}",
    "documentHash": "a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456",
    "imageHash": "b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef12345678",
    "blockchainLandId": 1,
    "blockchainTxHash": "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
]
```

---

### 2. Get Land by ID

**Endpoint:** `GET /api/lands/:id`

**Description:** Get detailed information about a specific land

**Authentication:** Required (JWT)

**Request Headers:**
```
Authorization: Bearer <token>
```

**Path Parameters:**
- `id` (uuid, required): Land ID

**Example Request:**
```
GET /api/lands/660e8400-e29b-41d4-a716-446655440000
```

**Response (200 OK):**
```json
{
  "id": "660e8400-e29b-41d4-a716-446655440000",
  "title": "Beachfront Property",
  "location": "123 Ocean Drive, Miami",
  "size": 500.5,
  "price": 250000.0,
  "status": "available",
  "ownerId": "550e8400-e29b-41d4-a716-446655440000",
  "documentCID": "uploads/land-documents/abc123.pdf",
  "documentUrl": "http://localhost:3000/uploads/land-documents/abc123.pdf",
  "imageCID": "uploads/land-images/xyz789.jpg",
  "imageUrl": "http://localhost:3000/uploads/land-images/xyz789.jpg",
  "documentIPFSHash": "{\"hash\":\"QmXxx...\",\"gateway\":\"https://ipfs.io/ipfs/\",\"timestamp\":\"2024-01-15T10:30:00.000Z\"}",
  "imageIPFSHash": "{\"hash\":\"QmYyy...\",\"gateway\":\"https://ipfs.io/ipfs/\",\"timestamp\":\"2024-01-15T10:30:00.000Z\"}",
  "documentHash": "a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456",
  "imageHash": "b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef12345678",
  "blockchainLandId": 1,
  "blockchainTxHash": "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
  "createdAt": "2024-01-15T10:30:00.000Z",
  "updatedAt": "2024-01-15T10:30:00.000Z",
  "owner": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "John Doe",
    "email": "john@example.com",
    "walletAddress": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb"
  }
}
```

**Error Responses:**
- `404 Not Found`: Land not found
- `401 Unauthorized`: Invalid or missing token

---

### 3. Create Land

**Endpoint:** `POST /api/lands`

**Description:** Create a new land listing

**Authentication:** Required (JWT)

**Authorization:** Seller or Admin only

**Request Headers:**
```
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

**Request Body (Form Data):**
- `title` (string, required): Land title (max 255 characters)
- `location` (string, required): Land location (max 500 characters)
- `size` (number, required): Land size in square meters (minimum 0.01)
- `price` (number, required): Land price (minimum 0.01)
- `document` (file, optional): Land document file (PDF/image)
- `image` (file, optional): Land image file (JPG/PNG)

**Example Request (using curl):**
```bash
curl -X POST http://localhost:3000/api/lands \
  -H "Authorization: Bearer <token>" \
  -F "title=Beachfront Property" \
  -F "location=123 Ocean Drive, Miami" \
  -F "size=500.5" \
  -F "price=250000.0" \
  -F "document=@/path/to/document.pdf" \
  -F "image=@/path/to/image.jpg"
```

**Response (201 Created):**
```json
{
  "id": "660e8400-e29b-41d4-a716-446655440000",
  "title": "Beachfront Property",
  "location": "123 Ocean Drive, Miami",
  "size": 500.5,
  "price": 250000.0,
  "status": "available",
  "ownerId": "550e8400-e29b-41d4-a716-446655440000",
  "documentCID": "uploads/land-documents/abc123.pdf",
  "documentUrl": "http://localhost:3000/uploads/land-documents/abc123.pdf",
  "imageCID": "uploads/land-images/xyz789.jpg",
  "imageUrl": "http://localhost:3000/uploads/land-images/xyz789.jpg",
  "documentHash": "a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456",
  "imageHash": "b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef12345678",
  "createdAt": "2024-01-15T10:30:00.000Z",
  "updatedAt": "2024-01-15T10:30:00.000Z"
}
```

**Error Responses:**
- `403 Forbidden`: Not authorized (Seller/Admin only)
- `400 Bad Request`: Validation error
- `401 Unauthorized`: Invalid or missing token

---

### 4. Update Land

**Endpoint:** `PATCH /api/lands/:id`

**Description:** Update land listing (Owner or Admin only)

**Authentication:** Required (JWT)

**Authorization:** Owner (Seller) or Admin only

**Request Headers:**
```
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

**Path Parameters:**
- `id` (uuid, required): Land ID

**Request Body (Form Data - all fields optional):**
- `title` (string, optional): Land title (max 255 characters)
- `location` (string, optional): Land location (max 500 characters)
- `size` (number, optional): Land size in square meters (minimum 0.01)
- `price` (number, optional): Land price (minimum 0.01)
- `status` (enum, optional): Land status - `available`, `locked`, or `sold`
- `document` (file, optional): New land document file (PDF/image)
- `image` (file, optional): New land image file (JPG/PNG)

**Example Request:**
```bash
curl -X PATCH http://localhost:3000/api/lands/660e8400-e29b-41d4-a716-446655440000 \
  -H "Authorization: Bearer <token>" \
  -F "title=Updated Beachfront Property" \
  -F "price=275000.0" \
  -F "status=locked"
```

**Response (200 OK):**
```json
{
  "id": "660e8400-e29b-41d4-a716-446655440000",
  "title": "Updated Beachfront Property",
  "location": "123 Ocean Drive, Miami",
  "size": 500.5,
  "price": 275000.0,
  "status": "locked",
  "ownerId": "550e8400-e29b-41d4-a716-446655440000",
  "documentCID": "uploads/land-documents/abc123.pdf",
  "documentUrl": "http://localhost:3000/uploads/land-documents/abc123.pdf",
  "imageCID": "uploads/land-images/xyz789.jpg",
  "imageUrl": "http://localhost:3000/uploads/land-images/xyz789.jpg",
  "createdAt": "2024-01-15T10:30:00.000Z",
  "updatedAt": "2024-01-15T11:00:00.000Z"
}
```

**Error Responses:**
- `403 Forbidden`: Not authorized (Owner/Admin only) or not the owner
- `404 Not Found`: Land not found
- `400 Bad Request`: Validation error
- `401 Unauthorized`: Invalid or missing token

---

### 5. Delete Land

**Endpoint:** `DELETE /api/lands/:id`

**Description:** Delete land listing (Owner or Admin only)

**Authentication:** Required (JWT)

**Authorization:** Owner (Seller) or Admin only

**Request Headers:**
```
Authorization: Bearer <token>
```

**Path Parameters:**
- `id` (uuid, required): Land ID

**Example Request:**
```
DELETE /api/lands/660e8400-e29b-41d4-a716-446655440000
```

**Response (200 OK):**
```json
{
  "message": "Land deleted successfully"
}
```

**Error Responses:**
- `403 Forbidden`: Not authorized (Owner/Admin only) or not the owner
- `404 Not Found`: Land not found
- `401 Unauthorized`: Invalid or missing token

---

### 6. Verify Document Integrity

**Endpoint:** `POST /api/lands/:id/verify`

**Description:** Verify document and image integrity using SHA-256 hash

**Authentication:** Required (JWT)

**Request Headers:**
```
Authorization: Bearer <token>
```

**Path Parameters:**
- `id` (uuid, required): Land ID

**Example Request:**
```
POST /api/lands/660e8400-e29b-41d4-a716-446655440000/verify
```

**Response (200 OK):**
```json
{
  "verified": true,
  "message": "All files verified successfully.",
  "document": {
    "verified": true,
    "message": "Document is genuine and has not been tampered with.",
    "storedHash": "a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456",
    "calculatedHash": "a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456"
  },
  "image": {
    "verified": true,
    "message": "Image is genuine and has not been tampered with.",
    "storedHash": "b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef12345678",
    "calculatedHash": "b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef12345678"
  }
}
```

**Error Responses:**
- `404 Not Found`: Land not found
- `401 Unauthorized`: Invalid or missing token

---

### 7. Verify Blockchain Hash

**Endpoint:** `POST /api/lands/:id/verify-blockchain`

**Description:** Verify document hash against blockchain record

**Authentication:** Required (JWT)

**Request Headers:**
```
Authorization: Bearer <token>
```

**Path Parameters:**
- `id` (uuid, required): Land ID

**Example Request:**
```
POST /api/lands/660e8400-e29b-41d4-a716-446655440000/verify-blockchain
```

**Response (200 OK):**
```json
{
  "verified": true,
  "message": "Document hash matches blockchain record",
  "databaseHash": "a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456",
  "blockchainHash": "a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456",
  "blockchainLandId": 1
}
```

**Error Response (if not verified):**
```json
{
  "verified": false,
  "message": "Document hash does not match blockchain record",
  "databaseHash": "a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456",
  "blockchainHash": "different-hash-here",
  "blockchainLandId": 1,
  "error": null
}
```

**Error Responses:**
- `404 Not Found`: Land not found
- `401 Unauthorized`: Invalid or missing token

---

## Payments Endpoints

### 1. Create Payment

**Endpoint:** `POST /api/payments`

**Description:** Create a payment record

**Authentication:** Required (JWT)

**Authorization:** Buyer only

**Request Headers:**
```
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

**Request Body (Form Data):**
- `landId` (uuid, required): Land ID
- `amount` (number, required): Payment amount (minimum 0.01)
- `dueDate` (date string, required): Payment due date (ISO format: YYYY-MM-DD)
- `paymentMode` (enum, required): Payment mode - `bank` or `crypto`
- `transactionHash` (string, optional): Transaction hash (for crypto payments)
- `proof` (file, optional): Payment proof file

**Example Request:**
```bash
curl -X POST http://localhost:3000/api/payments \
  -H "Authorization: Bearer <token>" \
  -F "landId=660e8400-e29b-41d4-a716-446655440000" \
  -F "amount=50000.0" \
  -F "dueDate=2024-02-01" \
  -F "paymentMode=bank" \
  -F "proof=@/path/to/proof.pdf"
```

**Response (201 Created):**
```json
{
  "id": "770e8400-e29b-41d4-a716-446655440000",
  "landId": "660e8400-e29b-41d4-a716-446655440000",
  "buyerId": "550e8400-e29b-41d4-a716-446655440000",
  "amount": 50000.0,
  "dueDate": "2024-02-01T00:00:00.000Z",
  "status": "pending",
  "paymentMode": "bank",
  "proofCID": "uploads/payment-proofs/proof123.pdf",
  "transactionHash": null,
  "remarks": null,
  "createdAt": "2024-01-15T10:30:00.000Z",
  "updatedAt": "2024-01-15T10:30:00.000Z"
}
```

**Error Responses:**
- `403 Forbidden`: Not authorized (Buyer only)
- `400 Bad Request`: Validation error
- `401 Unauthorized`: Invalid or missing token

---

### 2. Get My Payments

**Endpoint:** `GET /api/payments/my-payments`

**Description:** Get all payments for current buyer

**Authentication:** Required (JWT)

**Authorization:** Buyer only

**Request Headers:**
```
Authorization: Bearer <token>
```

**Response (200 OK):**
```json
[
  {
    "id": "770e8400-e29b-41d4-a716-446655440000",
    "landId": "660e8400-e29b-41d4-a716-446655440000",
    "buyerId": "550e8400-e29b-41d4-a716-446655440000",
    "amount": 50000.0,
    "dueDate": "2024-02-01T00:00:00.000Z",
    "status": "pending",
    "paymentMode": "bank",
    "proofCID": "uploads/payment-proofs/proof123.pdf",
    "transactionHash": null,
    "remarks": null,
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z",
    "land": {
      "id": "660e8400-e29b-41d4-a716-446655440000",
      "title": "Beachfront Property",
      "location": "123 Ocean Drive, Miami"
    }
  }
]
```

**Error Responses:**
- `403 Forbidden`: Not authorized (Buyer only)
- `401 Unauthorized`: Invalid or missing token

---

### 3. Get Pending Payments

**Endpoint:** `GET /api/payments/pending`

**Description:** Get pending payments for seller's lands (for verification)

**Authentication:** Required (JWT)

**Authorization:** Seller only

**Request Headers:**
```
Authorization: Bearer <token>
```

**Response (200 OK):**
```json
[
  {
    "id": "770e8400-e29b-41d4-a716-446655440000",
    "landId": "660e8400-e29b-41d4-a716-446655440000",
    "buyerId": "550e8400-e29b-41d4-a716-446655440000",
    "amount": 50000.0,
    "dueDate": "2024-02-01T00:00:00.000Z",
    "status": "pending",
    "paymentMode": "bank",
    "proofCID": "uploads/payment-proofs/proof123.pdf",
    "transactionHash": null,
    "remarks": null,
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z",
    "land": {
      "id": "660e8400-e29b-41d4-a716-446655440000",
      "title": "Beachfront Property",
      "location": "123 Ocean Drive, Miami"
    },
    "buyer": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "John Doe",
      "email": "john@example.com",
      "walletAddress": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb"
    }
  }
]
```

**Error Responses:**
- `403 Forbidden`: Not authorized (Seller only)
- `401 Unauthorized`: Invalid or missing token

---

### 4. Verify Payment

**Endpoint:** `POST /api/payments/:id/verify`

**Description:** Verify or reject a payment (Seller only - for own lands)

**Authentication:** Required (JWT)

**Authorization:** Seller only (must own the land)

**Request Headers:**
```
Authorization: Bearer <token>
```

**Path Parameters:**
- `id` (uuid, required): Payment ID

**Request Payload:**
```json
{
  "verified": true,
  "remarks": "Payment verified successfully"
}
```

**Request Body Schema:**
- `verified` (boolean, required): Whether payment is verified
- `remarks` (string, optional): Remarks/notes

**Example Request:**
```
POST /api/payments/770e8400-e29b-41d4-a716-446655440000/verify
```

**Response (200 OK) - Verified:**
```json
{
  "id": "770e8400-e29b-41d4-a716-446655440000",
  "landId": "660e8400-e29b-41d4-a716-446655440000",
  "buyerId": "550e8400-e29b-41d4-a716-446655440000",
  "amount": 50000.0,
  "dueDate": "2024-02-01T00:00:00.000Z",
  "status": "verified",
  "paymentMode": "bank",
  "proofCID": "uploads/payment-proofs/proof123.pdf",
  "transactionHash": null,
  "remarks": "Payment verified successfully",
  "createdAt": "2024-01-15T10:30:00.000Z",
  "updatedAt": "2024-01-15T11:00:00.000Z"
}
```

**Response (200 OK) - Rejected:**
```json
{
  "id": "770e8400-e29b-41d4-a716-446655440000",
  "landId": "660e8400-e29b-41d4-a716-446655440000",
  "buyerId": "550e8400-e29b-41d4-a716-446655440000",
  "amount": 50000.0,
  "dueDate": "2024-02-01T00:00:00.000Z",
  "status": "rejected",
  "paymentMode": "bank",
  "proofCID": "uploads/payment-proofs/proof123.pdf",
  "transactionHash": null,
  "remarks": "Payment proof is unclear",
  "createdAt": "2024-01-15T10:30:00.000Z",
  "updatedAt": "2024-01-15T11:00:00.000Z"
}
```

**Error Responses:**
- `403 Forbidden`: Not authorized (Seller only) or payment not for your land
- `404 Not Found`: Payment not found
- `400 Bad Request`: Validation error
- `401 Unauthorized`: Invalid or missing token

---

## Reservations Endpoints

### 1. Create Reservation

**Endpoint:** `POST /api/reservations`

**Description:** Create a land reservation

**Authentication:** Required (JWT)

**Authorization:** Buyer only

**Request Headers:**
```
Authorization: Bearer <token>
```

**Request Payload:**
```json
{
  "landId": "660e8400-e29b-41d4-a716-446655440000"
}
```

**Request Body Schema:**
- `landId` (uuid, required): Land ID to reserve

**Response (201 Created):**
```json
{
  "id": "880e8400-e29b-41d4-a716-446655440000",
  "landId": "660e8400-e29b-41d4-a716-446655440000",
  "buyerId": "550e8400-e29b-41d4-a716-446655440000",
  "status": "active",
  "createdAt": "2024-01-15T10:30:00.000Z",
  "updatedAt": "2024-01-15T10:30:00.000Z"
}
```

**Error Responses:**
- `403 Forbidden`: Not authorized (Buyer only)
- `404 Not Found`: Land not found
- `409 Conflict`: Land not available or already reserved
- `400 Bad Request`: Validation error
- `401 Unauthorized`: Invalid or missing token

---

### 2. Get All Reservations

**Endpoint:** `GET /api/reservations`

**Description:** Get all reservations (buyers see only their own, admins see all)

**Authentication:** Required (JWT)

**Request Headers:**
```
Authorization: Bearer <token>
```

**Response (200 OK) - For Buyer:**
```json
[
  {
    "id": "880e8400-e29b-41d4-a716-446655440000",
    "landId": "660e8400-e29b-41d4-a716-446655440000",
    "buyerId": "550e8400-e29b-41d4-a716-446655440000",
    "status": "active",
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z",
    "land": {
      "id": "660e8400-e29b-41d4-a716-446655440000",
      "title": "Beachfront Property",
      "location": "123 Ocean Drive, Miami",
      "price": 250000.0
    },
    "buyer": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "John Doe",
      "email": "john@example.com",
      "walletAddress": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb"
    }
  }
]
```

**Response (200 OK) - For Admin (all reservations):**
```json
[
  {
    "id": "880e8400-e29b-41d4-a716-446655440000",
    "landId": "660e8400-e29b-41d4-a716-446655440000",
    "buyerId": "550e8400-e29b-41d4-a716-446655440000",
    "status": "active",
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z",
    "land": {
      "id": "660e8400-e29b-41d4-a716-446655440000",
      "title": "Beachfront Property",
      "location": "123 Ocean Drive, Miami",
      "price": 250000.0
    },
    "buyer": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "John Doe",
      "email": "john@example.com",
      "walletAddress": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb"
    }
  }
]
```

**Error Responses:**
- `401 Unauthorized`: Invalid or missing token

---

### 3. Cancel Reservation

**Endpoint:** `DELETE /api/reservations/:id`

**Description:** Cancel a reservation

**Authentication:** Required (JWT)

**Authorization:** Buyer only (must own the reservation)

**Request Headers:**
```
Authorization: Bearer <token>
```

**Path Parameters:**
- `id` (uuid, required): Reservation ID

**Example Request:**
```
DELETE /api/reservations/880e8400-e29b-41d4-a716-446655440000
```

**Response (200 OK):**
```json
{
  "message": "Reservation cancelled successfully"
}
```

**Error Responses:**
- `403 Forbidden`: Not authorized (Owner only)
- `404 Not Found`: Reservation not found
- `401 Unauthorized`: Invalid or missing token

---

## Contact Endpoints

### 1. Submit Contact Form

**Endpoint:** `POST /api/contact`

**Description:** Send contact form message via email

**Authentication:** Not required (Public)

**Request Payload:**
```json
{
  "name": "John Doe",
  "email": "user@example.com",
  "message": "Hello, I would like to inquire about a property listing."
}
```

**Request Body Schema:**
- `name` (string, required): Contact name (2-100 characters)
- `email` (string, required): Valid email address
- `message` (string, required): Contact message (10-5000 characters)

**Response (200 OK):**
```json
{
  "message": "Contact form submitted successfully"
}
```

**Error Responses:**
- `400 Bad Request`: Validation error
- `500 Internal Server Error`: Failed to send email

---

## Types and Enums

### UserRole Enum

```typescript
enum UserRole {
  ADMIN = 'admin',
  SELLER = 'seller',
  BUYER = 'buyer',
  BUILDER = 'builder'
}
```

**Description:**
- `admin`: Full access to all resources
- `seller`: Can create/update/delete own lands
- `buyer`: Can view lands, create payments, create reservations
- `builder`: Can verify payments, view all lands

---

### LandStatus Enum

```typescript
enum LandStatus {
  AVAILABLE = 'available',
  LOCKED = 'locked',
  SOLD = 'sold'
}
```

**Description:**
- `available`: Land is available for purchase
- `locked`: Land is reserved/locked (has active reservation)
- `sold`: Land has been sold

---

### PaymentStatus Enum

```typescript
enum PaymentStatus {
  PENDING = 'pending',
  VERIFIED = 'verified',
  REJECTED = 'rejected'
}
```

**Description:**
- `pending`: Payment is awaiting verification
- `verified`: Payment has been verified by seller
- `rejected`: Payment has been rejected by seller

---

### PaymentMode Enum

```typescript
enum PaymentMode {
  BANK = 'bank',
  CRYPTO = 'crypto'
}
```

**Description:**
- `bank`: Bank transfer payment
- `crypto`: Cryptocurrency payment

---

### ReservationStatus Enum

```typescript
enum ReservationStatus {
  ACTIVE = 'active',
  CANCELLED = 'cancelled'
}
```

**Description:**
- `active`: Reservation is active
- `cancelled`: Reservation has been cancelled

---

## Error Responses

### Standard Error Response Format

All error responses follow this format:

```json
{
  "statusCode": 400,
  "message": "Validation error message",
  "error": "Bad Request"
}
```

### Common HTTP Status Codes

- `200 OK`: Request successful
- `201 Created`: Resource created successfully
- `400 Bad Request`: Validation error or bad request
- `401 Unauthorized`: Invalid or missing authentication token
- `403 Forbidden`: User doesn't have permission for this action
- `404 Not Found`: Resource not found
- `409 Conflict`: Resource conflict (e.g., email already exists)
- `500 Internal Server Error`: Server error

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

### Unauthorized Error Example

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
  "message": "Forbidden - Seller/Admin only",
  "error": "Forbidden"
}
```

### Not Found Error Example

```json
{
  "statusCode": 404,
  "message": "Land not found",
  "error": "Not Found"
}
```

---

## Working Methods

### Service Methods Available

#### AuthService
- `register(registerDto: RegisterDto)`: Register new user
- `login(loginDto: LoginDto)`: Authenticate user
- `getCurrentUser(userId: string)`: Get current user info
- `updateProfile(userId: string, updateProfileDto: UpdateProfileDto)`: Update user profile
- `updatePassword(userId: string, currentPassword: string, newPassword: string)`: Update password
- `forgotPassword(email: string)`: Generate password reset token
- `resetPassword(token: string, newPassword: string)`: Reset password with token

#### LandsService
- `findAll(query: QueryLandsDto)`: Get all lands with filters
- `findOne(id: string, includeOwner: boolean)`: Get land by ID
- `create(createLandDto: CreateLandDto, documentFile: File, imageFile: File, ownerId: string)`: Create land
- `update(id: string, updateLandDto: UpdateLandDto, documentFile: File, imageFile: File, userId: string, userRole: UserRole)`: Update land
- `remove(id: string, userId: string, userRole: UserRole)`: Delete land
- `verifyDocumentIntegrity(id: string)`: Verify document/image integrity
- `verifyBlockchainHash(id: string)`: Verify hash against blockchain

#### PaymentsService
- `create(createPaymentDto: CreatePaymentDto, proofFile: File, buyerId: string)`: Create payment
- `findMyPayments(buyerId: string)`: Get buyer's payments
- `findPendingPaymentsForSeller(sellerId: string)`: Get pending payments for seller's lands
- `verify(id: string, verifyPaymentDto: VerifyPaymentDto, sellerId: string)`: Verify/reject payment

#### ReservationsService
- `create(createReservationDto: CreateReservationDto, buyerId: string)`: Create reservation
- `findAll(buyerId?: string)`: Get reservations (filtered by buyer if provided)
- `cancel(id: string, buyerId: string)`: Cancel reservation

#### ContactService
- `submitContactForm(contactDto: ContactDto)`: Submit contact form and send email

---

## Additional Notes

### File Uploads

- Supported file types for land documents: PDF, images
- Supported file types for land images: JPG, PNG
- Files are stored in `uploads/land-documents/` and `uploads/land-images/`
- Files are accessible via `/uploads/` prefix
- SHA-256 hashes are calculated and stored for tamper detection

### Blockchain Integration

- Lands can be registered on blockchain
- Document hashes are stored on blockchain for verification
- Use `verify-blockchain` endpoint to verify against blockchain records

### IPFS Integration

- Documents and images can be uploaded to IPFS
- IPFS hash is stored as JSON string with structure: `{"hash": "...", "gateway": "...", "timestamp": "..."}`

### Pagination

- Default page: 1
- Default limit: 10
- Use `page` and `limit` query parameters for pagination

### Date Formats

- All dates are in ISO 8601 format (UTC)
- Example: `2024-01-15T10:30:00.000Z`
- Date strings in requests should be in format: `YYYY-MM-DD`

---

## Quick Reference

### Base URL
```
http://localhost:3000/api
```

### Authentication Header
```
Authorization: Bearer <token>
```

### Content Types
- JSON: `Content-Type: application/json`
- Form Data: `Content-Type: multipart/form-data`

### Common Endpoints
- Register: `POST /api/auth/register`
- Login: `POST /api/auth/login`
- Get Lands: `GET /api/lands`
- Create Land: `POST /api/lands`
- Create Payment: `POST /api/payments`
- Create Reservation: `POST /api/reservations`

---

**Last Updated:** 2024-01-15
**API Version:** 1.0

