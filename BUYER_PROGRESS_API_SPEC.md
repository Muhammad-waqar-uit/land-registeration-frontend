# Buyer Progress Tracking API Specification

## Current Implementation

**Current API Used:** `GET /api/payments/my-payments` (via `paymentAPI.getByBuyer()`)

**Current Issue:** 
- The frontend fetches ALL buyer payments
- Then filters on frontend to only show payments for properties owned by the current builder/seller
- This is inefficient and doesn't provide proper buyer progress tracking

## Required API Endpoint

### Endpoint: `GET /api/buyers/progress`

**Purpose:** Get buyer progress tracking for builder/seller's properties

**Authentication:** Required (JWT token)

**Authorization:** Builder or Seller role only

**Description:** Returns aggregated buyer progress data for all buyers who have made payments or reservations on properties owned by the authenticated builder/seller.

---

## Request

**Method:** `GET`

**URL:** `/api/buyers/progress`

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters (Optional):**
- `status` (string, optional): Filter by status - `'reserved' | 'paying' | 'completed'`
- `landId` (string, optional): Filter by specific property/land ID
- `buyerId` (string, optional): Filter by specific buyer ID

**Example Request:**
```bash
GET /api/buyers/progress
GET /api/buyers/progress?status=paying
GET /api/buyers/progress?landId=123e4567-e89b-12d3-a456-426614174000
```

---

## Response

**Status Code:** `200 OK`

**Response Body:**
```json
{
  "success": true,
  "data": [
    {
      "buyerId": "789e0123-e89b-12d3-a456-426614174002",
      "buyerName": "John Doe",
      "buyerEmail": "john@example.com",
      "buyerPhone": "+1234567890",
      "landId": "123e4567-e89b-12d3-a456-426614174000",
      "landTitle": "Beachfront Property Unit A-101",
      "landLocation": "123 Ocean Drive, Miami, FL",
      "landPrice": 250000.0,
      "totalPaid": 100000.0,
      "remainingBalance": 150000.0,
      "pendingPayments": 2,
      "verifiedPayments": 3,
      "lastPaymentDate": "2024-01-20T10:00:00.000Z",
      "lastPaymentAmount": 50000.0,
      "status": "paying",
      "agreementId": "456e7890-e89b-12d3-a456-426614174001",
      "agreementStatus": "signed",
      "reservationDate": "2024-01-15T10:00:00.000Z",
      "createdAt": "2024-01-15T10:00:00.000Z",
      "updatedAt": "2024-01-20T10:00:00.000Z"
    },
    {
      "buyerId": "890e1234-e89b-12d3-a456-426614174003",
      "buyerName": "Jane Smith",
      "buyerEmail": "jane@example.com",
      "buyerPhone": "+1234567891",
      "landId": "234e5678-e89b-12d3-a456-426614174001",
      "landTitle": "Downtown Apartment Unit B-202",
      "landLocation": "456 Main Street, New York, NY",
      "landPrice": 180000.0,
      "totalPaid": 0.0,
      "remainingBalance": 180000.0,
      "pendingPayments": 1,
      "verifiedPayments": 0,
      "lastPaymentDate": null,
      "lastPaymentAmount": null,
      "status": "reserved",
      "agreementId": null,
      "agreementStatus": null,
      "reservationDate": "2024-01-18T14:00:00.000Z",
      "createdAt": "2024-01-18T14:00:00.000Z",
      "updatedAt": "2024-01-18T14:00:00.000Z"
    }
  ],
  "total": 2,
  "stats": {
    "totalBuyers": 2,
    "reserved": 1,
    "inProgress": 1,
    "completed": 0,
    "totalRevenue": 100000.0,
    "pendingRevenue": 330000.0
  }
}
```

---

## Response Fields

### Buyer Progress Object

| Field | Type | Description |
|-------|------|-------------|
| `buyerId` | string (UUID) | Buyer's user ID |
| `buyerName` | string | Buyer's full name |
| `buyerEmail` | string | Buyer's email address |
| `buyerPhone` | string (optional) | Buyer's phone number |
| `landId` | string (UUID) | Property/Land ID |
| `landTitle` | string | Property title |
| `landLocation` | string | Property location |
| `landPrice` | number | Total property price |
| `totalPaid` | number | Total amount paid (verified payments only) |
| `remainingBalance` | number | Remaining balance to be paid |
| `pendingPayments` | number | Count of pending payments |
| `verifiedPayments` | number | Count of verified payments |
| `lastPaymentDate` | string (ISO date, nullable) | Date of last verified payment |
| `lastPaymentAmount` | number (nullable) | Amount of last verified payment |
| `status` | string (enum) | Buyer progress status: `'reserved'`, `'paying'`, `'completed'` |
| `agreementId` | string (UUID, nullable) | Agreement ID if agreement exists |
| `agreementStatus` | string (nullable) | Agreement status if agreement exists |
| `reservationDate` | string (ISO date, nullable) | Date when property was reserved |
| `createdAt` | string (ISO date) | When this progress record was created |
| `updatedAt` | string (ISO date) | When this progress record was last updated |

### Status Values

- **`reserved`**: Buyer has reserved the property but hasn't made any payments yet
- **`paying`**: Buyer has made at least one payment (verified or pending)
- **`completed`**: All payments completed, ownership transferred

### Stats Object

| Field | Type | Description |
|-------|------|-------------|
| `totalBuyers` | number | Total number of unique buyers |
| `reserved` | number | Count of buyers with status 'reserved' |
| `inProgress` | number | Count of buyers with status 'paying' |
| `completed` | number | Count of buyers with status 'completed' |
| `totalRevenue` | number | Total verified payments received |
| `pendingRevenue` | number | Total pending payments amount |

---

## Business Logic

### Status Determination

1. **`reserved`**: 
   - Property has a reservation for this buyer
   - No payments made yet
   - OR: Agreement exists but status is `draft` or `pending_signature`

2. **`paying`**: 
   - At least one payment exists (pending or verified)
   - Agreement status is `signed` or `buyer_signed` or `builder_signed`
   - `remainingBalance > 0`

3. **`completed`**: 
   - All payments completed (`remainingBalance = 0`)
   - Agreement status is `completed`
   - Ownership transferred

### Data Aggregation

1. **Group by:** `(buyerId, landId)` - One record per buyer-property combination
2. **Total Paid:** Sum of all payments with `status = 'verified'`
3. **Remaining Balance:** `landPrice - totalPaid`
4. **Pending Payments:** Count of payments with `status = 'pending'`
5. **Verified Payments:** Count of payments with `status = 'verified'`
6. **Last Payment Date:** Most recent `createdAt` from verified payments

### Data Sources

The API should aggregate data from:
- **Payments Table:** Get all payments for properties owned by the builder/seller
- **Agreements Table:** Get agreement status and details
- **Reservations Table (if exists):** Get reservation dates
- **Lands/Properties Table:** Get property details (title, location, price)
- **Users Table:** Get buyer details (name, email, phone)

---

## Database Query Logic (Pseudo-code)

```sql
-- Get buyer progress for builder's properties
SELECT 
  p.buyerId,
  u.name as buyerName,
  u.email as buyerEmail,
  u.phone as buyerPhone,
  p.landId,
  l.title as landTitle,
  l.location as landLocation,
  l.price as landPrice,
  SUM(CASE WHEN p.status = 'verified' THEN p.amount ELSE 0 END) as totalPaid,
  l.price - SUM(CASE WHEN p.status = 'verified' THEN p.amount ELSE 0 END) as remainingBalance,
  COUNT(CASE WHEN p.status = 'pending' THEN 1 END) as pendingPayments,
  COUNT(CASE WHEN p.status = 'verified' THEN 1 END) as verifiedPayments,
  MAX(CASE WHEN p.status = 'verified' THEN p.createdAt END) as lastPaymentDate,
  MAX(CASE WHEN p.status = 'verified' THEN p.amount END) as lastPaymentAmount,
  a.id as agreementId,
  a.status as agreementStatus,
  MIN(p.createdAt) as reservationDate
FROM payments p
INNER JOIN lands l ON p.landId = l.id
INNER JOIN users u ON p.buyerId = u.id
LEFT JOIN agreements a ON a.propertyId = l.id AND a.buyerId = p.buyerId
WHERE l.ownerId = :builderId  -- Current builder/seller ID
GROUP BY p.buyerId, p.landId, u.name, u.email, u.phone, l.title, l.location, l.price, a.id, a.status
ORDER BY lastPaymentDate DESC, p.createdAt DESC
```

---

## Error Responses

### 401 Unauthorized
```json
{
  "statusCode": 401,
  "message": "Unauthorized"
}
```

### 403 Forbidden
```json
{
  "statusCode": 403,
  "message": "Only builders and sellers can access buyer progress"
}
```

### 500 Internal Server Error
```json
{
  "statusCode": 500,
  "message": "Internal server error"
}
```

---

## Frontend Integration

After creating the API, update the frontend:

**File:** `src/services/api.ts`

```typescript
// Add to API service
export const buyerProgressAPI = {
  // Get buyer progress for builder/seller
  getProgress: async (params?: {
    status?: 'reserved' | 'paying' | 'completed';
    landId?: string;
    buyerId?: string;
  }): Promise<{
    data: BuyerProgress[];
    total: number;
    stats: {
      totalBuyers: number;
      reserved: number;
      inProgress: number;
      completed: number;
      totalRevenue: number;
      pendingRevenue: number;
    };
  }> => {
    const response = await api.get('/buyers/progress', { params });
    return response.data.data || response.data;
  },
};
```

**File:** `src/pages/dashboard/SellerBuyerProgress.tsx`

```typescript
// Replace current fetchData function:
const fetchData = useCallback(async () => {
  try {
    setLoading(true);
    const response = await buyerProgressAPI.getProgress();
    setBuyerProgress(response.data || []);
  } catch (error) {
    console.error('Failed to fetch buyer progress:', error);
  } finally {
    setLoading(false);
  }
}, []);
```

---

## Summary

**Current API:** `GET /api/payments/my-payments` (inefficient, frontend filtering)

**Required API:** `GET /api/buyers/progress`

**Key Features:**
- ✅ Returns aggregated buyer progress data
- ✅ Only shows buyers for builder's/seller's properties
- ✅ Includes payment statistics
- ✅ Includes agreement status
- ✅ Includes property details
- ✅ Includes buyer details
- ✅ Supports filtering by status, landId, buyerId
- ✅ Returns summary statistics

**Benefits:**
- More efficient (server-side aggregation)
- Better performance
- Cleaner frontend code
- Proper data structure for buyer progress tracking
