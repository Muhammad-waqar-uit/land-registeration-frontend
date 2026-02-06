# API Specification Notes

## User Bank Info – Backend Endpoint for Payment Reference

To show the builder's bank details on the **Agreement Detail** and **Create Payment** pages (so buyers know where to send bank transfers), the backend needs an endpoint to fetch another user's bank info:

**Suggested:** `GET /api/user-bank-info/user/:userId`

- **Auth:** JWT required
- **Response:** Same as `GET /user-bank-info` but for the specified user (for payment reference)
- **Use case:** Buyer views builder's bank account(s) when paying via bank transfer

If this endpoint is not implemented, the bank details section will simply not appear on those pages.

---

# Builder Payments Page – API Specification

**Frontend Route:** `/dashboard/builder/payments`  
**Component:** `SellerPayments.tsx`  
**Purpose:** Payment tracking for builder/seller – all payments received for their lands (verified, pending, rejected).

---

## Current Implementation (Frontend)

### APIs Called

| API | Endpoint | Issue |
|-----|----------|-------|
| `paymentAPI.getByBuyer()` | `GET /payments/my-payments` | Returns **buyer's** payments (payments made by user), not builder's |
| `landAPI.getAll()` | `GET /lands` | Used to get builder's land IDs, then filter payments client-side |

**Current workaround:** Frontend filters `getByBuyer()` by `landId in sellerLandIds`. This only works if the backend returns all payments (or buyer-specific). For a builder, `getByBuyer()` likely returns wrong/empty data.

---

## Backend Route to Add or Update

### Option A (Recommended): New dedicated endpoint

**Route:** `GET /api/payments/builder` or `GET /api/payments/my-lands`

**Auth:** JWT, Builder role

**Logic:** Return all payments where the land's `ownerId` or `originalOwnerId` = current user (builder) id.

---

## Required Response Shape

Return an array of payment objects. Each payment must include:

```json
[
  {
    "id": "string (UUID)",
    "landId": "string",
    "buyerId": "string",
    "amount": "number",
    "dueDate": "string (ISO date, e.g. 2024-01-15)",
    "status": "pending" | "verified" | "rejected",
    "paymentMode": "bank" | "points",
    "proofCID": "string | null",
    "transactionHash": "string | null",
    "remarks": "string | null",
    "createdAt": "string (ISO datetime)",
    "updatedAt": "string (ISO datetime)",
    "land": {
      "id": "string",
      "title": "string",
      "location": "string",
      "ownerId": "string"
    },
    "buyer": {
      "id": "string",
      "name": "string",
      "email": "string",
      "walletAddress": "string | null"
    }
  }
]
```

---

## Fields Used in Frontend

| Field | Used For | Required |
|-------|----------|----------|
| `id` | Row key, React `key` | **Yes** |
| `landId` | Filtering (if needed) | **Yes** |
| `amount` | Table: amount column, stats (totalReceived) | **Yes** |
| `status` | Table: status badge, stats (total, verified, pending, rejected), filter | **Yes** |
| `paymentMode` | Table: "Points" or "Bank" | **Yes** |
| `createdAt` | Table: Date column | **Yes** |
| `transactionHash` | Table: Transaction link (optional, null = "-") | Optional |
| `remarks` | Table: Remarks column (optional, null = "-") | Optional |
| `land.title` | Table: Property name | **Yes** |
| `land.location` | Table: Property location (subtitle) | **Yes** |
| `buyer.name` | Table: Buyer name | **Yes** |
| `buyer.email` | Table: Buyer email (subtitle) | **Yes** |

### Stats computed from response

- **Total Payments:** `payments.length`
- **Verified:** `payments.filter(p => p.status === 'verified').length`
- **Pending:** `payments.filter(p => p.status === 'pending').length`
- **Rejected:** `payments.filter(p => p.status === 'rejected').length`
- **Total Received:** `payments.filter(p => p.status === 'verified').reduce((s, p) => s + p.amount, 0)`

---

## Minimal Response (if you want to reduce payload)

At minimum, each payment object must have:

```json
{
  "id": "string",
  "landId": "string",
  "amount": "number",
  "status": "pending|verified|rejected",
  "paymentMode": "bank|points",
  "createdAt": "string",
  "transactionHash": "string|null",
  "remarks": "string|null",
  "land": { "id": "string", "title": "string", "location": "string" },
  "buyer": { "id": "string", "name": "string", "email": "string" }
}
```

---

## Backend Implementation Summary

| Item | Value |
|------|-------|
| **Route** | `GET /api/payments/builder` or `GET /api/payments/my-lands` |
| **Auth** | JWT required, role: builder |
| **Query** | Payments where `land.ownerId = builderId` OR `land.originalOwnerId = builderId` |
| **Relations** | Include `land` and `buyer` (User) in response |
| **Response** | `Payment[]` (array, or `{ data: Payment[] }`) |

---

## Frontend Update After Backend is Ready

In `SellerPayments.tsx` and `api.ts`:

1. Add `paymentAPI.getByBuilder(): Promise<Payment[]>` → `GET /payments/builder` (or your chosen path).
2. Replace the current fetch logic with a single call to `getByBuilder()`.
3. Remove the `landAPI.getAll()` call and client-side filtering for this page.
