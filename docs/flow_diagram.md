# System Flow Diagrams

Complete flow diagrams showing how each process works with overall system integration.

## Table of Contents

1. [Authentication & User Management Flows](#authentication--user-management-flows)
2. [Builder Registration & Verification Flow](#builder-registration--verification-flow)
3. [Project & Property Creation Flow](#project--property-creation-flow)
4. [Property Purchase Flow (Complete)](#property-purchase-flow-complete)
5. [Property Request Flow](#property-request-flow)
6. [Agreement Creation & Signing Flow](#agreement-creation--signing-flow)
7. [Payment Flow](#payment-flow)
8. [Installment Payment Flow](#installment-payment-flow)
9. [Ownership Transfer Flow](#ownership-transfer-flow)
10. [Resale Request Flow](#resale-request-flow)
11. [System Integration Overview](#system-integration-overview)

---

## Authentication & User Management Flows

### 1. User Registration Flow

```
┌─────────────┐
│   Frontend  │
└──────┬──────┘
       │ POST /api/auth/register
       │ { email, password, name, role }
       ▼
┌─────────────────────────────────┐
│     Auth Controller             │
│  - Validates DTO                │
│  - Checks email uniqueness      │
└──────┬──────────────────────────┘
       │
       ▼
┌─────────────────────────────────┐
│     Auth Service                │
│  1. Hash password (bcrypt)      │
│  2. Create user record          │
│  3. Generate wallet address     │
│  4. Generate JWT tokens         │
└──────┬──────────────────────────┘
       │
       ├─────────────────┬─────────────────┐
       ▼                 ▼                 ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│  PostgreSQL  │  │ WalletService│  │  JWT Service │
│  - User data │  │  - HD Wallet │  │  - Access    │
│  - Profile   │  │  - Address   │  │  - Refresh   │
└──────────────┘  └──────────────┘  └──────────────┘
       │
       ▼
┌─────────────────────────────────┐
│     Response                    │
│  { user, token, refreshToken }  │
└──────┬──────────────────────────┘
       │
       ▼
┌─────────────┐
│   Frontend  │
│  - Store tokens
│  - Redirect to dashboard
└─────────────┘
```

**Key Steps:**
1. Frontend sends registration data
2. Backend validates and checks email uniqueness
3. Password is hashed using bcrypt
4. User record created in PostgreSQL
5. HD Wallet address generated deterministically
6. JWT tokens (access + refresh) generated
7. Response returned with user data and tokens

---

### 2. Login Flow

```
┌─────────────┐
│   Frontend  │
└──────┬──────┘
       │ POST /api/auth/login
       │ { email, password }
       ▼
┌─────────────────────────────────┐
│     Auth Controller             │
│  - Validates DTO                │
└──────┬──────────────────────────┘
       │
       ▼
┌─────────────────────────────────┐
│     Auth Service                │
│  1. Find user by email          │
│  2. Verify password (bcrypt)    │
│  3. Generate/update wallet      │
│  4. Generate JWT tokens         │
└──────┬──────────────────────────┘
       │
       ├─────────────────┬─────────────────┐
       ▼                 ▼                 ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│  PostgreSQL  │  │ WalletService│  │  JWT Service │
│  - Verify    │  │  - Generate  │  │  - Tokens    │
│  - Update    │  │  - Store     │  │              │
└──────────────┘  └──────────────┘  └──────────────┘
       │
       ▼
┌─────────────────────────────────┐
│     Response                    │
│  { user, token, refreshToken }  │
└──────┬──────────────────────────┘
       │
       ▼
┌─────────────┐
│   Frontend  │
│  - Store tokens
│  - Set auth state
└─────────────┘
```

---

### 3. Token Refresh Flow

```
┌─────────────┐
│   Frontend  │
│  - Token expired
│  - Refresh needed
└──────┬──────┘
       │ POST /api/auth/refresh-token
       │ { refreshToken }
       ▼
┌─────────────────────────────────┐
│     Auth Controller             │
└──────┬──────────────────────────┘
       │
       ▼
┌─────────────────────────────────┐
│     Auth Service                │
│  1. Hash refresh token          │
│  2. Find in database            │
│  3. Verify expiry               │
│  4. Generate new tokens         │
└──────┬──────────────────────────┘
       │
       ├─────────────────┐
       ▼                 ▼
┌──────────────┐  ┌──────────────┐
│  PostgreSQL  │  │  JWT Service │
│  - Token DB  │  │  - New tokens│
└──────────────┘  └──────────────┘
       │
       ▼
┌─────────────────────────────────┐
│     Response                    │
│  { accessToken, refreshToken }  │
└──────┬──────────────────────────┘
       │
       ▼
┌─────────────┐
│   Frontend  │
│  - Update tokens
│  - Continue request
└─────────────┘
```

---

## Builder Registration & Verification Flow

```
┌─────────────┐
│   USER      │
│  (Logged in)│
└──────┬──────┘
       │ POST /api/builders/register
       │ { companyName, licenseNumber, ... }
       ▼
┌─────────────────────────────────┐
│     Builder Controller          │
│  - Validates builder data       │
└──────┬──────────────────────────┘
       │
       ▼
┌─────────────────────────────────┐
│     Builder Service             │
│  1. Check license uniqueness    │
│  2. Update user role → BUILDER  │
│  3. Set isBuilderVerified=false │
│  4. Store company details       │
└──────┬──────────────────────────┘
       │
       ▼
┌──────────────┐
│  PostgreSQL  │
│  - Update user
│  - Builder info
└──────┬───────┘
       │
       ▼
┌─────────────────────────────────┐
│     Response (Builder)          │
│  { ...user, isBuilderVerified: false }
└─────────────────────────────────┘

       ╔═══════════════════════════╗
       ║   ADMIN VERIFICATION      ║
       ╚═══════════════════════════╝

┌─────────────┐
│   ADMIN     │
└──────┬──────┘
       │ POST /api/auth/builders/:id/verify
       │
       ▼
┌─────────────────────────────────┐
│     Auth Controller             │
│  - Admin only                   │
└──────┬──────────────────────────┘
       │
       ▼
┌─────────────────────────────────┐
│     Auth Service                │
│  1. Find builder                │
│  2. Set isBuilderVerified=true  │
│  3. Set builderVerifiedAt       │
│  4. Set verifiedBy=adminId      │
└──────┬──────────────────────────┘
       │
       ▼
┌──────────────┐
│  PostgreSQL  │
│  - Verify    │
└──────┬───────┘
       │
       ▼
┌─────────────────────────────────┐
│     Response (Verified)         │
│  { ...builder, isBuilderVerified: true }
└─────────────────────────────────┘

       ╔═══════════════════════════╗
       ║  Builder can now:         ║
       ║  - Create projects        ║
       ║  - List properties        ║
       ║  - Manage agreements      ║
       ╚═══════════════════════════╝
```

---

## Project & Property Creation Flow

### Project Creation Flow

```
┌─────────────┐
│   BUILDER   │
│  (Verified) │
└──────┬──────┘
       │ POST /api/projects
       │ { name, location, description, ... }
       ▼
┌─────────────────────────────────┐
│     Projects Controller         │
│  - Verify builder role          │
│  - Check builder verified       │
└──────┬──────────────────────────┘
       │
       ▼
┌─────────────────────────────────┐
│     Projects Service            │
│  1. Validate builder            │
│  2. Create project record       │
│  3. Set status=active           │
│  4. Link to builder             │
└──────┬──────────────────────────┘
       │
       ▼
┌──────────────┐
│  PostgreSQL  │
│  - Project   │
└──────┬───────┘
       │
       ▼
┌─────────────────────────────────┐
│     Response                    │
│  { project details }            │
└─────────────────────────────────┘
```

---

### Property Creation Flow

```
┌─────────────┐
│   BUILDER   │
│  (Verified) │
└──────┬──────┘
       │ POST /api/lands
       │ Content-Type: multipart/form-data
       │ { projectId, title, location, size, price, 
       │   document: file, image: file }
       ▼
┌─────────────────────────────────┐
│     Lands Controller            │
│  - File upload interceptor      │
│  - Validate builder role        │
└──────┬──────────────────────────┘
       │
       ▼
┌─────────────────────────────────┐
│     Lands Service               │
│  1. Validate project exists     │
│  2. Validate builder owns project
│  3. Upload files locally        │
│  4. Calculate file hashes       │
│  5. Upload to IPFS (Pinata)     │
│  6. Store in PostgreSQL         │
└──────┬──────────────────────────┘
       │
       ├──────────────┬──────────────┬──────────────┐
       ▼              ▼              ▼              ▼
┌──────────────┐ ┌───────────┐ ┌───────────┐ ┌──────────────┐
│  PostgreSQL  │ │ Local FS  │ │   IPFS    │ │ Blockchain   │
│  - Property  │ │ - Files   │ │ - Hash    │ │  Service     │
│  - Metadata  │ │           │ │ - Gateway │ │  - Register  │
└──────────────┘ └───────────┘ └───────────┘ └──────┬───────┘
                                                    │
                                                    ▼
                                            ┌──────────────┐
                                            │ Smart Contract│
                                            │ - Land ID     │
                                            │ - IPFS Hash   │
                                            │ - Price       │
                                            │ - DocumentHash│
                                            └──────────────┘
       │
       ▼
┌─────────────────────────────────┐
│     Response                    │
│  { land details + blockchain IDs }
└─────────────────────────────────┘
```

**Key Integration Points:**
1. **File Storage**: Local filesystem for immediate access
2. **IPFS**: Permanent, decentralized storage via Pinata
3. **Database**: Property metadata and relationships
4. **Blockchain**: Immutable registration on smart contract

---

## Property Purchase Flow (Complete)

### Complete Purchase Journey

```
┌──────────────────────────────────────────────────────────────────┐
│                    PROPERTY PURCHASE FLOW                        │
└──────────────────────────────────────────────────────────────────┘

Step 1: BROWSING
┌─────────┐      GET /api/lands?status=available
│  USER   │ ──────────────────────────────────────────────────────►
└─────────┘      ┌──────────────┐
                 │   Backend    │
                 │ - Filters    │
                 │ - Pagination │
                 └──────┬───────┘
                        │
                        ▼
                 ┌──────────────┐
                 │  PostgreSQL  │
                 └──────┬───────┘
                        │
                        ▼
                 ┌──────────────┐
                 │   Response   │
                 │  [properties]│
                 └──────────────┘

Step 2: PROPERTY REQUEST
┌─────────┐      POST /api/property-requests
│  USER   │ ──────────────────────────────────────────────────────►
└─────────┘      { propertyId, requestedPrice }
                 ┌──────────────┐
                 │   Backend    │
                 │ 1. Validate  │
                 │ 2. Check if  │
                 │    available │
                 │ 3. Create    │
                 │    request   │
                 └──────┬───────┘
                        │
                        ▼
                 ┌──────────────┐
                 │  PostgreSQL  │
                 │ - Request    │
                 │ - status:    │
                 │   pending    │
                 └──────────────┘

Step 3: BUILDER REVIEW & APPROVAL
┌─────────┐      GET /api/property-requests/pending
│ BUILDER │ ──────────────────────────────────────────────────────►
└─────────┘      ┌──────────────┐
                 │   Response   │
                 │  [requests]  │
                 └──────────────┘

┌─────────┐      POST /api/property-requests/:id/approve
│ BUILDER │ ──────────────────────────────────────────────────────►
└─────────┘      ┌──────────────┐
                 │   Backend    │
                 │ 1. Verify    │
                 │    builder   │
                 │ 2. Update    │
                 │    status    │
                 │ 3. Lock      │
                 │    property  │
                 └──────┬───────┘
                        │
                        ▼
                 ┌──────────────┐
                 │  PostgreSQL  │
                 │ - Request    │
                 │   approved   │
                 │ - Property   │
                 │   locked     │
                 └──────────────┘

Step 4: AGREEMENT CREATION
┌─────────┐      POST /api/agreements
│ BUILDER │ ──────────────────────────────────────────────────────►
└─────────┘      {
                  propertyId,
                  buyerId,
                  agreementType: "initial",
                  terms: { price, installmentPlanYears }
                }
                 ┌──────────────┐
                 │   Backend    │
                 │ 1. Generate  │
                 │    agreement │
                 │ 2. Create    │
                 │    document  │
                 │ 3. Upload to │
                 │    IPFS      │
                 └──────┬───────┘
                        │
                        ├──────────────┬──────────────┐
                        ▼              ▼              ▼
                 ┌──────────────┐ ┌───────────┐ ┌──────────────┐
                 │  PostgreSQL  │ │   IPFS    │ │ Local FS     │
                 │ - Agreement  │ │ - Document│ │ - PDF        │
                 │ - status:    │ │ - Hash    │ │              │
                 │   pending    │ │           │ │              │
                 └──────────────┘ └───────────┘ └──────────────┘

Step 5: AGREEMENT SIGNING
┌─────────┐      POST /api/agreements/:id/sign
│  USER   │ ──────────────────────────────────────────────────────►
│(Buyer)  │      ┌──────────────┐
└─────────┘      │   Backend    │
                 │ 1. Verify    │
                 │    signer    │
                 │ 2. Update    │
                 │    signature │
                 │ 3. Check if  │
                 │    both signed│
                 └──────┬───────┘
                        │
                        ▼
                 ┌──────────────┐
                 │  PostgreSQL  │
                 │ - Buyer      │
                 │   signed     │
                 │ - Status:    │
                 │   buyer_signed│
                 └──────────────┘

┌─────────┐      POST /api/agreements/:id/sign
│ BUILDER │ ──────────────────────────────────────────────────────►
└─────────┘      ┌──────────────┐
                 │   Backend    │
                 │ 1. Verify    │
                 │    builder   │
                 │ 2. Update    │
                 │    signature │
                 │ 3. Status:   │
                 │    signed    │
                 └──────┬───────┘
                        │
                        ▼
                 ┌──────────────┐
                 │  PostgreSQL  │
                 │ - Both       │
                 │   signed     │
                 │ - Status:    │
                 │   signed     │
                 └──────────────┘

Step 6: INSTALLMENT CREATION
┌─────────┐      POST /api/installments
│ BUILDER │ ──────────────────────────────────────────────────────►
└─────────┘      { agreementId }
                 ┌──────────────┐
                 │   Backend    │
                 │ 1. Get       │
                 │    agreement │
                 │ 2. Calculate │
                 │    schedule  │
                 │ 3. Create    │
                 │    installments│
                 └──────┬───────┘
                        │
                        ▼
                 ┌──────────────┐
                 │  PostgreSQL  │
                 │ - Multiple   │
                 │   installments│
                 │ - Amounts    │
                 │ - Due dates  │
                 └──────────────┘

Step 7: PAYMENT PROCESSING (See Payment Flow)

Step 8: OWNERSHIP TRANSFER (See Ownership Transfer Flow)
```

---

## Property Request Flow

```
┌─────────────┐
│   USER      │
│  (Buyer)    │
└──────┬──────┘
       │ POST /api/property-requests
       │ { propertyId, requestedPrice? }
       ▼
┌─────────────────────────────────┐
│     Property Requests Controller│
│  - Validate user                │
└──────┬──────────────────────────┘
       │
       ▼
┌─────────────────────────────────┐
│     Property Requests Service   │
│  1. Check property status       │
│  2. Verify property available   │
│  3. Check existing requests     │
│  4. Create request record       │
│  5. Set status: pending         │
└──────┬──────────────────────────┘
       │
       ▼
┌──────────────┐
│  PostgreSQL  │
│  - Request   │
│  - status:   │
│    pending   │
└──────┬───────┘
       │
       ▼
┌─────────────────────────────────┐
│     Notification (optional)     │
│  - Email to builder             │
└─────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────┐
│     Response                    │
│  { request details }            │
└─────────────────────────────────┘

       ╔═══════════════════════════╗
       ║   BUILDER RESPONSE        ║
       ╚═══════════════════════════╝

┌─────────────┐
│   BUILDER   │
└──────┬──────┘
       │ GET /api/property-requests/pending
       │
       ▼
       │ POST /api/property-requests/:id/approve
       │   OR
       │ POST /api/property-requests/:id/reject
       │
       ▼
┌─────────────────────────────────┐
│     Property Requests Service   │
│  1. Verify builder owns property│
│  2. Update request status       │
│  3. If approved:                │
│     - Update property status    │
│     - Lock property to buyer    │
│  4. If rejected:                │
│     - Set status: rejected      │
│     - Send response message     │
└──────┬──────────────────────────┘
       │
       ▼
┌──────────────┐
│  PostgreSQL  │
│  - Update    │
│    request   │
│  - Update    │
│    property  │
└──────────────┘
```

---

## Agreement Creation & Signing Flow

```
┌──────────────────────────────────────────────────────────────┐
│              AGREEMENT CREATION & SIGNING FLOW               │
└──────────────────────────────────────────────────────────────┘

Phase 1: CREATION
┌─────────┐
│ BUILDER │
└──────┬──┘
       │ POST /api/agreements
       │ {
       │   propertyId,
       │   buyerId,
       │   agreementType: "initial",
       │   terms: { price, installmentPlanYears, paymentTerms }
       │ }
       ▼
┌─────────────────────────────────┐
│     Agreements Controller       │
│  - Validate builder             │
│  - Check property locked        │
└──────┬──────────────────────────┘
       │
       ▼
┌─────────────────────────────────┐
│     Agreements Service          │
│  1. Verify builder owns property│
│  2. Verify property is locked   │
│  3. Generate agreement document │
│  4. Calculate document hash     │
│  5. Upload to IPFS              │
│  6. Store in database           │
│  7. Set status: pending         │
└──────┬──────────────────────────┘
       │
       ├──────────────┬──────────────┬──────────────┐
       ▼              ▼              ▼              ▼
┌──────────────┐ ┌───────────┐ ┌──────────────┐ ┌──────────────┐
│  PostgreSQL  │ │ Local FS  │ │     IPFS     │ │ Blockchain   │
│  - Agreement │ │ - PDF Doc │ │ - Hash       │ │  (optional)  │
│  - Status    │ │           │ │ - Gateway    │ │              │
│  - Terms     │ │           │ │              │ │              │
└──────────────┘ └───────────┘ └──────────────┘ └──────────────┘

Phase 2: BUYER SIGNING
┌─────────┐
│  BUYER  │
└──────┬──┘
       │ POST /api/agreements/:id/sign
       │ { signatureData? }
       ▼
┌─────────────────────────────────┐
│     Agreements Service          │
│  1. Verify buyer                │
│  2. Update buyerSignedAt        │
│  3. Check if both signed        │
│  4. Update status               │
└──────┬──────────────────────────┘
       │
       ▼
┌──────────────┐
│  PostgreSQL  │
│  - Buyer     │
│    signed    │
│  - Status:   │
│    buyer_signed│
└──────────────┘

Phase 3: BUILDER SIGNING
┌─────────┐
│ BUILDER │
└──────┬──┘
       │ POST /api/agreements/:id/sign
       │
       ▼
┌─────────────────────────────────┐
│     Agreements Service          │
│  1. Verify builder              │
│  2. Update builderSignedAt      │
│  3. Check if both signed        │
│  4. Set status: signed          │
│  5. Ready for installments      │
└──────┬──────────────────────────┘
       │
       ▼
┌──────────────┐
│  PostgreSQL  │
│  - Both      │
│    signed    │
│  - Status:   │
│    signed    │
└──────────────┘

Phase 4: UPLOAD SIGNED DOCUMENT (Optional)
┌─────────┐
│  USER   │
└──────┬──┘
       │ POST /api/agreements/:id/upload-signed
       │ Content-Type: multipart/form-data
       │ { document: file }
       ▼
┌─────────────────────────────────┐
│     Agreements Service          │
│  1. Upload signed document      │
│  2. Calculate hash              │
│  3. Upload to IPFS              │
│  4. Store references            │
└──────┬──────────────────────────┘
       │
       ├──────────────┬──────────────┐
       ▼              ▼              ▼
┌──────────────┐ ┌───────────┐ ┌──────────────┐
│  PostgreSQL  │ │ Local FS  │ │     IPFS     │
│  - Signed doc│ │ - File    │ │ - Hash       │
│  - Hash      │ │           │ │ - Gateway    │
└──────────────┘ └───────────┘ └──────────────┘
```

---

## Payment Flow

```
┌──────────────────────────────────────────────────────────────┐
│                      PAYMENT FLOW                            │
└──────────────────────────────────────────────────────────────┘

Payment Mode: BANK TRANSFER
┌─────────┐
│  BUYER  │
└──────┬──┘
       │ POST /api/payments
       │ Content-Type: multipart/form-data
       │ {
       │   landId,
       │   agreementId?,
       │   installmentId?,
       │   amount,
       │   dueDate?,
       │   paymentMode: "bank",
       │   proof: file
       │ }
       ▼
┌─────────────────────────────────┐
│     Payments Controller         │
│  - File upload interceptor      │
│  - Validate buyer               │
└──────┬──────────────────────────┘
       │
       ▼
┌─────────────────────────────────┐
│     Payments Service            │
│  1. Validate property/agreement │
│  2. Verify buyer authorization  │
│  3. Upload proof file           │
│  4. Calculate file hash         │
│  5. Upload to IPFS              │
│  6. Create payment record       │
│  7. Set status: pending         │
└──────┬──────────────────────────┘
       │
       ├──────────────┬──────────────┬──────────────┐
       ▼              ▼              ▼              ▼
┌──────────────┐ ┌───────────┐ ┌──────────────┐ ┌──────────────┐
│  PostgreSQL  │ │ Local FS  │ │     IPFS     │ │ Blockchain   │
│  - Payment   │ │ - Proof   │ │ - Hash       │ │  - Submit    │
│  - Status:   │ │   file    │ │ - Gateway    │ │    payment   │
│    pending   │ │           │ │              │ │    proof     │
└──────────────┘ └───────────┘ └──────────────┘ └──────────────┘

       ╔═══════════════════════════╗
       ║   BUILDER VERIFICATION    ║
       ╚═══════════════════════════╝

┌─────────┐
│ BUILDER │
└──────┬──┘
       │ GET /api/payments/pending
       │
       ▼
       │ POST /api/payments/:id/verify
       │ { verified: true, remarks? }
       ▼
┌─────────────────────────────────┐
│     Payments Service            │
│  1. Verify builder owns property│
│  2. Update payment status       │
│  3. If verified:                │
│     - Update installment status │
│     - Record on blockchain      │
│     - Check if fully paid       │
│  4. If rejected:                │
│     - Set status: rejected      │
│     - Notify buyer              │
└──────┬──────────────────────────┘
       │
       ├──────────────┬──────────────┐
       ▼              ▼              ▼
┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│  PostgreSQL  │ │ Blockchain   │ │ Notifications│
│  - Status:   │ │  - Verify    │ │  - Email     │
│    verified  │ │    payment   │ │              │
│  - Installment│ │  - Update    │ │              │
│    updated   │ │    amountPaid│ │              │
└──────────────┘ └──────────────┘ └──────────────┘


Payment Mode: CRYPTO
┌─────────┐
│  BUYER  │
└──────┬──┘
       │ POST /api/payments
       │ {
       │   landId,
       │   amount,
       │   paymentMode: "crypto",
       │   transactionHash: "0x..."
       │ }
       ▼
┌─────────────────────────────────┐
│     Payments Service            │
│  1. Validate transaction hash   │
│  2. Verify transaction on chain │
│  3. Verify amount matches       │
│  4. Create payment record       │
│  5. Set status: verified        │
│  6. Record on blockchain        │
│  7. Update installment          │
└──────┬──────────────────────────┘
       │
       ├──────────────┬──────────────┐
       ▼              ▼              ▼
┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│  PostgreSQL  │ │ Blockchain   │ │ Blockchain   │
│  - Payment   │ │  - Verify tx │ │  - Record    │
│  - Status:   │ │  - Check amt │ │    payment   │
│    verified  │ │              │ │              │
└──────────────┘ └──────────────┘ └──────────────┘
```

---

## Installment Payment Flow

```
┌──────────────────────────────────────────────────────────────┐
│              INSTALLMENT PAYMENT FLOW                        │
└──────────────────────────────────────────────────────────────┘

Step 1: INSTALLMENT CREATION (After Agreement Signed)
┌─────────┐
│ BUILDER │
└──────┬──┘
       │ POST /api/installments
       │ { agreementId }
       ▼
┌─────────────────────────────────┐
│     Installments Service        │
│  1. Get agreement               │
│  2. Get terms (plan years)      │
│  3. Calculate schedule:         │
│     - 2 years = 24 installments │
│     - 3 years = 36 installments │
│     - 5 years = 60 installments │
│  4. Calculate amounts           │
│  5. Set payment windows         │
│  6. Create installment records  │
└──────┬──────────────────────────┘
       │
       ▼
┌──────────────┐
│  PostgreSQL  │
│  - Multiple  │
│    installments│
│  - Amounts   │
│  - Windows   │
│  - Status:   │
│    pending   │
└──────────────┘

Step 2: PAYMENT DUE NOTIFICATION (Cron/Background)
┌──────────────┐
│ Background   │
│ Job/Cron     │
└──────┬───────┘
       │ Check overdue installments
       │
       ▼
┌─────────────────────────────────┐
│     Installments Service        │
│  1. Find installments due       │
│  2. Mark overdue if past window │
│  3. Update status               │
└──────┬──────────────────────────┘
       │
       ▼
┌──────────────┐
│  PostgreSQL  │
│  - Update    │
│    overdue   │
└──────────────┘

Step 3: BUYER MAKES PAYMENT (See Payment Flow)
┌─────────┐
│  BUYER  │
└──────┬──┘
       │ POST /api/payments
       │ { installmentId, amount, ... }
       │
       ▼ (Payment Flow continues...)
       │
       ▼ (After verification)
┌─────────────────────────────────┐
│     Payments Service            │
│  - Link payment to installment  │
│  - Update installment status    │
│  - Check if installment paid    │
└──────┬──────────────────────────┘
       │
       ▼
┌──────────────┐
│  PostgreSQL  │
│  - Installment│
│    status:   │
│    paid      │
│  - paymentDate│
│    set       │
└──────────────┘

Step 4: TRACK PROGRESS
┌─────────┐
│  BUYER  │
└──────┬──┘
       │ GET /api/payments/installment-summary/:propertyId
       │
       ▼
┌─────────────────────────────────┐
│     Payments Service            │
│  1. Get all installments        │
│  2. Calculate totals            │
│  3. Check payment status        │
│  4. Calculate progress          │
└──────┬──────────────────────────┘
       │
       ▼
┌─────────────────────────────────┐
│     Response                    │
│  {                             │
│    totalAmount: 250000,        │
│    totalPaid: 100000,          │
│    remainingAmount: 150000,    │
│    paidInstallments: 12,       │
│    pendingInstallments: 24,    │
│    paymentProgress: 40%        │
│  }                             │
└─────────────────────────────────┘
```

---

## Ownership Transfer Flow

```
┌──────────────────────────────────────────────────────────────┐
│              OWNERSHIP TRANSFER FLOW                         │
└──────────────────────────────────────────────────────────────┘

Prerequisites:
- Agreement fully signed
- All installments paid (or full payment verified)
- Property fully paid

┌─────────┐
│ BUILDER │
└──────┬──┘
       │ POST /api/agreements/:id/generate-ownership-doc
       │
       ▼
┌─────────────────────────────────┐
│     Agreements Service          │
│  1. Verify agreement signed     │
│  2. Verify payments complete    │
│  3. Verify builder owns property│
│  4. Generate ownership document │
│  5. Calculate document hash     │
│  6. Upload to IPFS              │
│  7. Initialize blockchain       │
│     transfer process            │
└──────┬──────────────────────────┘
       │
       ▼
┌─────────────────────────────────┐
│     Blockchain Service          │
│  1. Request seller approval     │
│  2. Prepare ownership transfer  │
│  3. Execute transfer            │
└──────┬──────────────────────────┘
       │
       ▼
┌─────────────────────────────────┐
│     Smart Contract              │
│  1. Verify payment complete     │
│  2. Request seller approval     │
│  3. Transfer ownership token    │
│  4. Update land ownership       │
│  5. Unlock land                 │
│  6. Emit OwnershipTransferred   │
└──────┬──────────────────────────┘
       │
       ▼
┌─────────────────────────────────┐
│     Backend Updates             │
│  1. Update property status      │
│  2. Update agreement status     │
│  3. Set new owner               │
│  4. Store transaction hash      │
└──────┬──────────────────────────┘
       │
       ├──────────────┬──────────────┬──────────────┐
       ▼              ▼              ▼              ▼
┌──────────────┐ ┌──────────────┐ ┌───────────┐ ┌──────────────┐
│  PostgreSQL  │ │ Blockchain   │ │   IPFS    │ │ Notifications│
│  - Property  │ │  - Ownership │ │ - Document│ │  - Buyer     │
│    status:   │ │    token     │ │ - Hash    │ │  - Builder   │
│    owned     │ │  - Tx hash   │ │           │ │              │
│  - New owner │ │              │ │           │ │              │
│  - Agreement │ │              │ │           │ │              │
│    completed │ │              │ │           │ │              │
└──────────────┘ └──────────────┘ └───────────┘ └──────────────┘

       ╔═══════════════════════════╗
       ║  Ownership Transferred    ║
       ║  - Buyer is now owner     ║
       ║  - Can request resale     ║
       ║  - Ownership on-chain     ║
       ╚═══════════════════════════╝
```

---

## Resale Request Flow

```
┌──────────────────────────────────────────────────────────────┐
│                  RESALE REQUEST FLOW                         │
└──────────────────────────────────────────────────────────────┘

Step 1: OWNER REQUESTS RESALE
┌─────────┐
│  OWNER  │
│ (Buyer) │
└──────┬──┘
       │ POST /api/resale-requests
       │ { propertyId, requestedPrice }
       ▼
┌─────────────────────────────────┐
│     Resale Requests Service     │
│  1. Verify owner                │
│  2. Check property status       │
│  3. Verify ownership            │
│  4. Create resale request       │
│  5. Set status: pending         │
└──────┬──────────────────────────┘
       │
       ▼
┌──────────────┐
│  PostgreSQL  │
│  - Resale    │
│    request   │
│  - Status:   │
│    pending   │
└──────────────┘

Step 2: BUILDER REVIEW & APPROVAL
┌─────────┐
│ BUILDER │
└──────┬──┘
       │ GET /api/resale-requests/builder
       │
       ▼
       │ POST /api/resale-requests/:id/approve
       │
       ▼
┌─────────────────────────────────┐
│     Resale Requests Service     │
│  1. Verify builder              │
│  2. Update request status       │
│  3. Set approvedAt timestamp    │
└──────┬──────────────────────────┘
       │
       ▼
┌──────────────┐
│  PostgreSQL  │
│  - Status:   │
│    approved  │
│  - approvedAt│
└──────────────┘

Step 3: LIST PROPERTY FOR RESALE
┌─────────┐
│ BUILDER │
└──────┬──┘
       │ POST /api/resale-requests/:id/list
       │
       ▼
┌─────────────────────────────────┐
│     Resale Requests Service     │
│  1. Verify request approved     │
│  2. Update property status      │
│  3. Update property price       │
│  4. Set property isResale=true  │
│  5. Set status: listed          │
│  6. Set listedAt timestamp      │
└──────┬──────────────────────────┘
       │
       ▼
┌──────────────┐
│  PostgreSQL  │
│  - Property  │
│    status:   │
│    resale_listed│
│  - Price     │
│    updated   │
│  - isResale: │
│    true      │
│  - Resale    │
│    status:   │
│    listed    │
└──────────────┘

Step 4: NEW BUYER PURCHASE (Repeat Purchase Flow)

Step 5: MARK AS SOLD
┌─────────┐
│ BUILDER │
└──────┬──┘
       │ POST /api/resale-requests/:id/mark-sold
       │
       ▼
┌─────────────────────────────────┐
│     Resale Requests Service     │
│  1. Verify property listed      │
│  2. Update request status       │
│  3. Update property status      │
└──────┬──────────────────────────┘
       │
       ▼
┌──────────────┐
│  PostgreSQL  │
│  - Status:   │
│    sold      │
│  - Property  │
│    status    │
│    updated   │
└──────────────┘
```

---

## System Integration Overview

### Complete System Architecture Flow

```
┌──────────────────────────────────────────────────────────────────┐
│                    SYSTEM INTEGRATION OVERVIEW                   │
└──────────────────────────────────────────────────────────────────┘

┌──────────────┐
│   Frontend   │
│  (React/Vue) │
└──────┬───────┘
       │
       │ REST API
       │ JWT Auth
       ▼
┌──────────────────────────────────────────────────────────────────┐
│                    Backend (NestJS)                              │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │              Controllers Layer                           │  │
│  │  - Auth, Builders, Projects, Lands, Agreements, etc.    │  │
│  └────────────────────┬─────────────────────────────────────┘  │
│                       │                                         │
│  ┌────────────────────▼─────────────────────────────────────┐  │
│  │              Services Layer                               │  │
│  │  - Business Logic                                        │  │
│  │  - Validation                                            │  │
│  │  - Orchestration                                         │  │
│  └────┬──────────┬──────────┬──────────┬──────────┬─────────┘  │
│       │          │          │          │          │             │
│       ▼          ▼          ▼          ▼          ▼             │
│  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐      │
│  │   DB   │ │  IPFS  │ │Wallet  │ │Block-  │ │  Email │      │
│  │Service │ │Service │ │Service │ │chain   │ │Service │      │
│  └───┬────┘ └───┬────┘ └───┬────┘ └───┬────┘ └───┬────┘      │
└──────┼──────────┼──────────┼──────────┼──────────┼─────────────┘
       │          │          │          │          │
       ▼          ▼          ▼          ▼          ▼
┌──────────┐ ┌─────────┐ ┌─────────┐ ┌──────────────┐ ┌──────────┐
│PostgreSQL│ │ Pinata  │ │HD Wallet│ │   Ethereum   │ │ Nodemailer│
│Database  │ │  IPFS   │ │  (BIP44)│ │  Blockchain  │ │   Email   │
│          │ │ Gateway │ │         │ │              │ │           │
└──────────┘ └─────────┘ └─────────┘ └──────┬───────┘ └──────────┘
                                            │
                                            ▼
                                    ┌──────────────┐
                                    │ Smart Contract│
                                    │ LandRegistry   │
                                    │ PaymentToken   │
                                    └──────────────┘
```

### Data Flow Between Components

```
┌──────────────────────────────────────────────────────────────────┐
│                    DATA FLOW DIAGRAM                             │
└──────────────────────────────────────────────────────────────────┘

PROPERTY CREATION DATA FLOW:
────────────────────────────
Frontend
   │
   │ { title, location, price, files }
   ▼
Controller
   │
   │ Validate, Extract files
   ▼
Service
   │
   ├─→ DB Service ───────→ PostgreSQL ──→ Property metadata
   │
   ├─→ File Storage ──────→ Local FS ────→ Temporary files
   │
   ├─→ IPFS Service ──────→ Pinata IPFS ─→ Permanent storage
   │                                              │
   │                                              ▼
   │                                        IPFS Hash
   │                                              │
   └─→ Blockchain Service ──→ Smart Contract ────┴───→ Land registered
                                                              │
                                                              ▼
                                                         Land ID + Tx Hash
                                                              │
                                                              ▼
                                                         DB updated


PAYMENT DATA FLOW:
──────────────────
Frontend (Buyer)
   │
   │ { amount, paymentMode, proof file }
   ▼
Controller
   │
   │ Validate, Extract file
   ▼
Service
   │
   ├─→ DB Service ───────→ PostgreSQL ──→ Payment record (pending)
   │
   ├─→ File Storage ──────→ Local FS ────→ Proof file
   │
   ├─→ IPFS Service ──────→ Pinata IPFS ─→ Proof hash
   │
   └─→ Blockchain Service ──→ Smart Contract ──→ Payment submitted
                                                      │
                    [Builder Verifies]               │
                                                      ▼
                                       Blockchain Service ──→ Payment verified
                                                              │
                                                              ▼
                                                         DB updated (verified)
                                                              │
                                                              ▼
                                                         Installment updated
                                                              │
                                                              ▼
                                                         Check if fully paid
                                                              │
                                                              ▼
                                                    [If fully paid]
                                                              │
                                                              ▼
                                                         Ownership transfer
```

### Key Integration Points

#### 1. Authentication & Authorization
- **JWT Tokens**: All API requests authenticated via Bearer token
- **Role Guards**: Route-level authorization (USER, BUILDER, ADMIN)
- **User Context**: Current user injected via `@CurrentUser()` decorator

#### 2. Database (PostgreSQL)
- **Primary Storage**: User data, properties, agreements, payments
- **Relational Data**: Foreign keys maintain relationships
- **State Management**: Tracks status, timestamps, relationships

#### 3. File Storage (Local + IPFS)
- **Local Storage**: Temporary files for quick access (`/uploads/`)
- **IPFS (Pinata)**: Permanent, immutable document storage
- **Hashes**: SHA-256 calculated for integrity verification

#### 4. Blockchain (Ethereum)
- **Smart Contracts**: Land registry, payment token
- **Backend Managed**: Admin wallet executes transactions
- **Event Listening**: Contract events tracked for synchronization
- **Immutability**: Ownership and payment records on-chain

#### 5. Wallet System (HD Wallets)
- **Deterministic**: Same user ID = same wallet address
- **BIP44 Standard**: `m/44'/60'/0'/0/{userIdIndex}`
- **No Private Keys**: Users don't manage keys (backend-managed)

### Flow Decision Points

```
┌──────────────────────────────────────────────────────────────┐
│                  DECISION POINTS                              │
└──────────────────────────────────────────────────────────────┘

1. USER REGISTRATION
   ├─ Role = "user" → Standard user account
   └─ Role = "builder" → Builder account (requires admin verification)

2. BUILDER VERIFICATION
   ├─ Not verified → Cannot create projects/properties
   └─ Verified → Can create projects, properties, agreements

3. PROPERTY STATUS
   ├─ available → Can receive requests
   ├─ reserved → Locked to specific buyer
   ├─ agreement_pending → Agreement in progress
   ├─ payment_in_progress → Payments being processed
   ├─ owned → Ownership transferred
   └─ resale_listed → Available for resale

4. PROPERTY REQUEST
   ├─ Approved → Agreement can be created
   └─ Rejected → Request closed, property remains available

5. AGREEMENT SIGNING
   ├─ Buyer signs first → Status: buyer_signed
   ├─ Builder signs → Status: signed (both signed)
   └─ Both signed → Installments can be created

6. PAYMENT VERIFICATION
   ├─ Bank payment → Requires proof, builder verification
   └─ Crypto payment → Auto-verified via transaction hash

7. OWNERSHIP TRANSFER
   ├─ Payments complete → Can initiate transfer
   └─ Transfer complete → Buyer becomes owner, can request resale
```

### Error Handling Flow

```
┌──────────────────────────────────────────────────────────────┐
│                  ERROR HANDLING FLOW                          │
└──────────────────────────────────────────────────────────────┘

Request
   │
   ▼
Controller
   │
   ├─ Validation Error ──→ 400 Bad Request ──→ Frontend
   │
   ├─ Authentication Error ──→ 401 Unauthorized ──→ Frontend
   │
   ├─ Authorization Error ──→ 403 Forbidden ──→ Frontend
   │
   ├─ Not Found Error ──→ 404 Not Found ──→ Frontend
   │
   ├─ Conflict Error ──→ 409 Conflict ──→ Frontend
   │
   └─ Server Error ──→ 500 Internal Server Error ──→ Frontend
                              │
                              ▼
                       Log Error
                              │
                              ▼
                       Return user-friendly message
```

---

## Summary

This document provides comprehensive flow diagrams for all major system processes:

1. **Authentication**: Registration, login, token management
2. **Builder Management**: Registration and verification
3. **Project & Property**: Creation with IPFS and blockchain integration
4. **Purchase Flow**: Complete journey from request to ownership
5. **Agreements**: Creation, signing, and document management
6. **Payments**: Bank and crypto payment processing
7. **Installments**: Schedule creation and payment tracking
8. **Ownership Transfer**: Final transfer process
9. **Resale**: Resale request and approval flow

All flows integrate seamlessly through:
- **Database**: State management and relationships
- **IPFS**: Immutable document storage
- **Blockchain**: Ownership and payment verification
- **REST API**: Standard HTTP communication

The system uses a hybrid approach combining Web2 (database, REST API) with Web3 (blockchain, IPFS) for optimal performance and decentralization.
