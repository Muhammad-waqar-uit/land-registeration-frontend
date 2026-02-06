# Frontend Integration Guide – Complete Flow & APIs

Use this document to update the frontend with the full land purchase flow: **Agreement → Payment → Ownership Document Upload → Admin Approval → Ownership Transfer**.

**Base URL:** `https://your-backend.com/api` (or `http://localhost:3000/api`)  
**Auth:** All endpoints require JWT: `Authorization: Bearer <token>`

---

## 1. Flow Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  1. AGREEMENT (Builder creates, Buyer signs)                                 │
│     → Agreement signed → Land: status = PAYMENT_IN_PROGRESS                  │
└─────────────────────────────────────────────────────────────────────────────┘
                                      ↓
┌─────────────────────────────────────────────────────────────────────────────┐
│  2. PAYMENT (Buyer pays – BANK or POINTS)                                    │
│     BANK: Buyer submits amount + proof → Builder verifies                    │
│     POINTS: Buyer submits amount → Ledger deducts from buyer, adds to owner  │
│     → When fully paid: Land agreementStatus = COMPLETED                      │
└─────────────────────────────────────────────────────────────────────────────┘
                                      ↓
┌─────────────────────────────────────────────────────────────────────────────┐
│  3. OWNERSHIP DOCUMENT (Builder uploads)                                     │
│     Builder uploads docs for property + buyer                                │
│     → Status: PENDING_ADMIN_APPROVAL                                         │
└─────────────────────────────────────────────────────────────────────────────┘
                                      ↓
┌─────────────────────────────────────────────────────────────────────────────┐
│  4. ADMIN APPROVAL                                                           │
│     Admin approves or rejects ownership document                             │
│     → If approved: Land owner = buyer, status = OWNED (ownership transferred)│
└─────────────────────────────────────────────────────────────────────────────┘
```

**Key rule:** Ownership transfers **only after** admin approves the ownership document, not when payment is complete.

---

## 2. APIs by Flow Step

### Step 1: Agreement (summary)

| Endpoint | Method | Who | Purpose |
|----------|--------|-----|---------|
| `/agreements` | POST | Builder | Create agreement (property + buyer) |
| `/agreements/property/:propertyId` | GET | Any | Get agreements for a property |
| `/agreements/:id` | GET | Any | Get one agreement |
| `/agreements/:id/sign` | POST | Buyer/Builder | Sign agreement (both must sign) |

---

### Step 2: Payment

| Endpoint | Method | Who | Purpose |
|----------|--------|-----|---------|
| `/payments` | POST | User (Buyer) | Create payment (BANK or POINTS) |
| `/payments/my-payments` | GET | User (Buyer) | My payment history |
| `/payments/pending` | GET | Builder | Pending payments to verify (BANK only) |
| `/payments/:id/verify` | POST | Builder/Admin | Verify or reject payment |
| `/payments/property/:propertyId` | GET | Any | Payments for a property |
| `/payments/agreement/:agreementId` | GET | Any | Payments for an agreement |
| `/payments/installment-summary/:propertyId` | GET | Any | Total paid, remaining, timeline |
| `/tokens/balance` | GET | User | Get points balance (before paying with POINTS) |

**Payment modes:** `bank` | `points`  
- **BANK:** Buyer submits amount + proof file → status `pending` → Builder verifies.  
- **POINTS:** Buyer submits amount → backend checks balance → ledger deducts from buyer, adds to owner → status `verified` immediately.

See `docs/PAYMENT-FRONTEND-INTEGRATION.md` for payment API details.

---

### Step 3: Ownership Document Upload (Builder)

| Endpoint | Method | Who | Purpose |
|----------|--------|-----|---------|
| `/ownership-documents/lands/:landId` | POST | Builder, Admin | Upload ownership documents |
| `GET /ownership-documents/lands/:landId` | GET | Builder, Admin, User | Get documents for a property |
| `GET /ownership-documents/builder/me` | GET | Builder, Admin | My uploaded documents |
| `GET /ownership-documents/:id` | GET | Builder, Admin, User | Get one document |

#### 3.1 Upload ownership documents (Builder)

**When:** Payment is fully completed (land `agreementStatus` = `completed`). Builder uploads documents for the buyer/new owner.

- **URL:** `POST /ownership-documents/lands/:landId`
- **Content-Type:** `multipart/form-data`
- **Auth:** Builder or Admin (verified builder)
- **Path:** `landId` – property/land UUID
- **Body (form-data):**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| buyerId | string (UUID) | Yes | New owner/buyer user ID |
| notes | string | No | Builder's notes |
| files | file[] | Yes | At least 1 file (max 10); PDF, images, etc. |

**Example (JavaScript fetch):**
```javascript
const formData = new FormData();
formData.append('buyerId', buyerId);
formData.append('notes', 'Ownership transfer documents');
files.forEach(f => formData.append('files', f));

fetch(`/api/ownership-documents/lands/${landId}`, {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${token}` },
  body: formData,
});
```

**Response:** `200` – Ownership document object (see 3.4).

**Errors:**
- `400` – Payment not completed yet; or documents already uploaded and pending
- `403` – Not verified builder; or not original builder of property
- `404` – Property or buyer not found

---

### Step 4: Admin Review & Ownership Transfer

| Endpoint | Method | Who | Purpose |
|----------|--------|-----|---------|
| `GET /ownership-documents/admin-pending` | GET | Admin | List pending documents for review |
| `POST /ownership-documents/:id/admin-review` | POST | Admin | Approve or reject |

#### 4.1 Get pending ownership documents (Admin)

- **URL:** `GET /ownership-documents/admin-pending`
- **Auth:** Admin only
- **Response:** `200` – Array of ownership documents with status `pending_admin_approval`

#### 4.2 Admin review (Approve or Reject)

**When:** Admin reviews the uploaded ownership documents and approves or rejects.

- **URL:** `POST /ownership-documents/:id/admin-review`
- **Auth:** Admin only
- **Body (JSON):**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| action | string | Yes | `"approve"` or `"reject"` |
| adminNotes | string | No | Admin notes |
| rejectionReason | string | Yes if reject | Required when `action` is `"reject"` |

**Example approve:** `{ "action": "approve", "adminNotes": "Documents verified" }`  
**Example reject:** `{ "action": "reject", "rejectionReason": "ID mismatch", "adminNotes": "Please resubmit" }`

**Response:** `200` – Updated ownership document.

**On approve:** Backend sets land `ownerId` = buyer, `status` = `owned`, and optionally updates ledger. **Ownership is transferred at this step.**

---

## 3. Ownership Document Response Shape

| Field | Type | Description |
|-------|------|-------------|
| id | string | Document ID |
| landId | string | Property ID |
| uploaderId | string | Builder who uploaded |
| buyerId | string | New owner/buyer |
| documentType | string | `initial_ownership` \| `final_ownership` |
| status | string | `pending_admin_approval` \| `approved` \| `rejected` |
| notes | string \| null | Builder notes |
| uploadedAt | Date | Upload timestamp |
| reviewedBy | string \| null | Admin who reviewed |
| reviewedAt | Date \| null | Review timestamp |
| adminNotes | string \| null | Admin notes |
| rejectionReason | string \| null | If rejected |
| property | object | Land info (id, title, unitId, location, price, size, status) |
| uploader | object | Builder info |
| buyer | object | Buyer info |
| documents | array | Files: id, fileName, fileUrl, fileHash, fileSize, mimeType, uploadedAt, ipfsHash |

---

## 4. Land & Agreement Statuses (for UI logic)

**Land status:** `available` \| `reserved` \| `agreement_pending` \| `payment_in_progress` \| `owned` \| `resale_listed` \| `locked` \| `sold`

**Land agreementStatus:** `none` \| `pending` \| `signed` \| `completed`  
- `completed` = payment fully done; ready for ownership document upload

**Ownership document status:** `pending_admin_approval` \| `approved` \| `rejected`

**Payment status:** `pending` \| `verified` \| `rejected`

---

## 5. Frontend Screens Checklist

| Screen | User | APIs | Notes |
|--------|------|------|-------|
| **Property detail** | Any | `GET /lands/:id`, `GET /payments/installment-summary/:propertyId`, `GET /agreements/property/:propertyId`, `GET /ownership-documents/lands/:landId` | Show property, payments, agreement status, ownership doc status |
| **Pay for property** | Buyer | `GET /tokens/balance?address=...`, `POST /payments` | Choose BANK or POINTS; for POINTS show balance first |
| **My payments** | Buyer | `GET /payments/my-payments` | Payment history |
| **Pending payments (verify)** | Builder | `GET /payments/pending`, `POST /payments/:id/verify` | Verify or reject BANK payments |
| **Upload ownership doc** | Builder | `POST /ownership-documents/lands/:landId` | Only when payment complete; need buyerId + files |
| **Builder: My ownership docs** | Builder | `GET /ownership-documents/builder/me` | Documents I uploaded |
| **Admin: Pending ownership docs** | Admin | `GET /ownership-documents/admin-pending` | List to review |
| **Admin: Review ownership doc** | Admin | `POST /ownership-documents/:id/admin-review` | Approve or reject → transfers ownership on approve |
| **My properties** | User | `GET /lands` (filter by owner) | Show owned properties after transfer |

---

## 6. Quick Reference: All Endpoints

| Module | Endpoint | Method | Who |
|--------|----------|--------|-----|
| Agreements | `/agreements` | POST | Builder |
| Agreements | `/agreements` | GET | Any |
| Agreements | `/agreements/property/:propertyId` | GET | Any |
| Agreements | `/agreements/:id` | GET | Any |
| Agreements | `/agreements/:id/sign` | POST | Buyer/Builder |
| Payments | `/payments` | POST | User |
| Payments | `/payments/my-payments` | GET | User |
| Payments | `/payments/pending` | GET | Builder |
| Payments | `/payments/:id/verify` | POST | Builder/Admin |
| Payments | `/payments/property/:propertyId` | GET | Any |
| Payments | `/payments/agreement/:agreementId` | GET | Any |
| Payments | `/payments/installment-summary/:propertyId` | GET | Any |
| Tokens | `/tokens/balance?address=...` | GET | Any |
| Ownership | `/ownership-documents/lands/:landId` | POST | Builder/Admin |
| Ownership | `/ownership-documents/lands/:landId` | GET | Builder/Admin/User |
| Ownership | `/ownership-documents/builder/me` | GET | Builder/Admin |
| Ownership | `/ownership-documents/admin-pending` | GET | Admin |
| Ownership | `/ownership-documents/:id` | GET | Builder/Admin/User |
| Ownership | `/ownership-documents/:id/admin-review` | POST | Admin |

---

## 7. Related Docs

- **`PAYMENT-FRONTEND-INTEGRATION.md`** – Payment API details, BANK vs POINTS, balance/ledger flow
- **`API-POINTS-ADMIN-USER-SCREENS.md`** – Tokens, token requests, admin mint/approve
- **`FLOW-DIAGRAMS-BANK-AND-POINTS.md`** – Visual flow diagrams
