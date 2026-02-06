# Payment System – Frontend Integration Guide

This document describes how the payment system works and how to integrate it in the frontend. It covers **BANK** and **POINTS** payment modes, APIs, and how the ledger moves balance from the buyer to the owner (builder).

---

## 1. How the Payment System Works

### Two payment modes

| Mode    | Who submits      | Verification              | Where value moves                          |
|---------|------------------|---------------------------|---------------------------------------------|
| **BANK**  | Buyer (amount + proof file) | Builder verifies or rejects | Off-chain (bank); ledger only records for audit |
| **POINTS** | Buyer (amount only)        | None – auto-verified       | **Ledger:** balance minus from buyer, added to owner |

### Flow in short

1. **Before payment:** Buyer has signed an agreement for a property. Optionally, builder has created installments.
2. **Buyer creates payment:** Chooses mode (bank or points), amount, and optionally agreement/installment. For BANK, uploads proof file.
3. **BANK:** Payment is created with status `pending`. Builder sees it under “pending payments”, verifies or rejects. When verified, land `totalPaid` is updated.
4. **POINTS:** Backend checks buyer’s ledger balance, then **transfers points on the ledger from buyer → owner**. Payment is created with status `verified` immediately. Land `totalPaid` is updated.
5. **After full payment:** Land becomes ready for ownership document (builder uploads → admin approves). Ownership transfer happens only when admin approves the ownership document, not when payment is done.

---

## 2. How Ledger Balance Works (Points: minus from user, add to owner)

For **POINTS** payments only:

1. **Balance check**  
   Backend calls the ledger contract `getBalance(buyerWalletAddress)`. If balance (in base units, 1e18) is less than the payment amount, the request is rejected with “Insufficient points balance”.

2. **Transfer on ledger**  
   Backend calls `transferPoints(buyerWalletAddress, ownerWalletAddress, amountInBaseUnits)`.  
   - Ledger subtracts `amount` from the **buyer**’s points balance.  
   - Ledger adds `amount` to the **owner (builder)**’s points balance.

3. **Record in DB**  
   Backend creates a payment row with status `verified`, and optionally calls `recordPayment` / `recordPaymentByOffchainId` on the ledger for audit (payment record + points to payee). Land `totalPaid` is updated.

So: **balance is minus from the user (buyer) and added to the owner (builder) by the ledger** when the frontend calls “Create payment” with `paymentMode: "points"`. The frontend does not call the ledger directly; it only calls the backend **Create payment** API with the chosen amount and mode.

---

## 3. APIs for Frontend

Base URL: your backend root, e.g. `https://api.example.com`. All payment and token endpoints require **JWT** in header: `Authorization: Bearer <token>`.

### 3.1 Get points balance (before paying with points)

Use this so the user can see their balance and you can warn if insufficient.

- **Endpoint:** `GET /tokens/balance?address={walletAddress}`
- **Auth:** JWT (any authenticated user).
- **Query:** `address` – Ethereum-style wallet address (e.g. user’s `walletAddress`).
- **Response:**
  - `200`: `{ "success": true, "balance": "1000000000000000000000" }`  
    Balance is in **base units** (1e18 per “point”). For display: `Number(balance) / 1e18`.
  - `200` with error: `{ "success": false, "error": "..." }` (e.g. ledger not available).

**Frontend:**  
- Call this with the **current user’s wallet address** when they are on the “Pay with points” screen.  
- Show balance as `(Number(balance) / 1e18).toFixed(2)` (or similar).  
- Before submitting payment, you can check `Number(balance) / 1e18 >= amount` and show “Insufficient balance” if not.

---

### 3.2 Create payment

- **Endpoint:** `POST /payments`
- **Auth:** JWT; roles **USER** or **BUILDER** (buyer is usually USER).
- **Content-Type:** `multipart/form-data` if proof file is sent (BANK); for POINTS-only you can send as `application/json` or form-data without file.

**Body (form-data or JSON):**

| Field          | Type   | Required | Description |
|----------------|--------|----------|-------------|
| landId         | UUID   | Yes      | Property (land) ID. |
| agreementId    | UUID   | No       | Agreement ID (recommended if payment is under an agreement). |
| installmentId  | UUID   | No       | Installment ID if paying a specific installment. |
| amount         | number | Yes      | Payment amount (e.g. 50000.0). Min 0.01. |
| dueDate        | string | No       | ISO date string (e.g. `2024-02-01`). |
| paymentMode    | string | Yes      | `"bank"` or `"points"`. |
| transactionHash| string | No       | Optional; e.g. from blockchain. |
| proof          | file   | For BANK | Proof file (e.g. screenshot, PDF). Required for BANK in practice. |

**POINTS behaviour (backend):**  
- Backend gets buyer from JWT and loads land (with owner).  
- Backend calls ledger `getBalance(buyer.walletAddress)` → if insufficient, responds **400** “Insufficient points balance…”.  
- Backend calls ledger `transferPoints(buyer, owner, amountInBaseUnits)` → balance minus from user, add to owner.  
- Backend creates payment with status `verified` and updates land `totalPaid`.

**BANK behaviour (backend):**  
- Backend creates payment with status `pending`. Builder must verify later.  
- If proof file is sent, it is stored and linked to the payment.

**Response:**  
- `201`: Payment object (see Payment response shape below).  
- `400`: Validation error, insufficient points (POINTS), or “Buyer and builder must have wallet addresses for points payment”, “Ledger is not available”, etc.  
- `403` / `404` as applicable.

**Frontend:**  
- **BANK:** Form with amount, due date (optional), agreement/installment if needed, and **file input for proof**. Submit as multipart.  
- **POINTS:** Form with amount and same IDs. Optionally get balance first with `GET /tokens/balance?address=...` and disable submit or show error if balance &lt; amount. No proof file. Submit; on success, payment is already `verified`.

---

### 3.3 Get “my payments” (buyer)

- **Endpoint:** `GET /payments/my-payments`
- **Auth:** JWT; role **USER**.
- **Response:** `200` – array of payment objects for the current user (buyer).

Use for: “My payments” / “Payment history” for the logged-in buyer.

---

### 3.4 Get pending payments (builder – verify list)

- **Endpoint:** `GET /payments/pending`
- **Auth:** JWT; role **BUILDER**.
- **Response:** `200` – array of payments with status `pending` for properties owned/built by the builder.

Use for: Builder’s “Pending payments” list to verify or reject BANK payments.

---

### 3.5 Verify payment (builder / admin)

- **Endpoint:** `POST /payments/:id/verify`
- **Auth:** JWT; **BUILDER** or **ADMIN** (and payment must be for a property they can verify).
- **Body (JSON):**  
  `{ "verified": true | false, "remarks": "optional string" }`
- **Response:** `200` – updated payment object; `400` if already processed; `403` if not allowed.

Use for: “Verify” / “Reject” action on a pending BANK payment.

---

### 3.6 Get payments by property

- **Endpoint:** `GET /payments/property/:propertyId`
- **Auth:** JWT.
- **Response:** `200` – array of payments for that property.

Use for: Property detail page “Payments” section.

---

### 3.7 Get payments by agreement

- **Endpoint:** `GET /payments/agreement/:agreementId`
- **Auth:** JWT.
- **Response:** `200` – array of payments for that agreement.

Use for: Agreement detail / payment history for one deal.

---

### 3.8 Get installment summary (total paid, remaining, timeline)

- **Endpoint:** `GET /payments/installment-summary/:propertyId`
- **Auth:** JWT.
- **Response:** `200` –  
  `{ "totalPaid": number, "remainingBalance": number, "totalAmount": number, "payments": Payment[], "installments": InstallmentSummaryItem[] }`

Use for: Property page “Payment summary” – total paid, remaining balance, list of payments and installments (with windows and status).

---

## 4. Payment and related shapes (for reference)

- **Payment (summary):**  
  `id`, `landId`, `buyerId`, `amount`, `dueDate`, `status`, `paymentMode`, `proofCID`, `transactionHash`, `remarks`, `createdAt`, `updatedAt`.  
  Optional: `land` (id, title, location), `buyer` (id, name, email, walletAddress).

- **Status:** `pending` | `verified` | `rejected`.  
- **Payment mode:** `bank` | `points`.

- **Installment summary item:**  
  `id`, `amount`, `paymentWindowStart`, `paymentWindowEnd`, `paymentDate`, `status`.

---

## 5. Frontend integration checklist

- [ ] **Pay with points screen**  
  - Resolve current user’s `walletAddress`.  
  - Call `GET /tokens/balance?address={walletAddress}`.  
  - Display balance as `Number(balance) / 1e18`.  
  - Create payment form: landId, agreementId (if any), amount, `paymentMode: "points"`.  
  - Optionally prevent submit or show error if `Number(balance) / 1e18 < amount`.  
  - On success, show “Payment confirmed” (status is already `verified`); balance on ledger is already minus from user and add to owner.

- [ ] **Pay with bank screen**  
  - Form: landId, agreementId (if any), amount, `paymentMode: "bank"`, **proof file**.  
  - Submit as multipart.  
  - Show “Payment submitted; pending builder verification”.

- [ ] **Builder: Pending payments**  
  - Call `GET /payments/pending`.  
  - For each payment, show “Verify” / “Reject” and call `POST /payments/:id/verify` with `{ "verified": true|false, "remarks": "..." }`.

- [ ] **Buyer: My payments**  
  - Call `GET /payments/my-payments` and show list with status (pending / verified / rejected).

- [ ] **Property payment summary**  
  - Call `GET /payments/installment-summary/:propertyId` and show total paid, remaining balance, and payment/installment list.

---

## 6. Summary: balance minus from user, add to owner (ledger)

- For **POINTS**, when the frontend calls **Create payment** with `paymentMode: "points"` and a valid amount:
  1. Backend checks ledger **getBalance(buyer)**.
  2. Backend calls ledger **transferPoints(buyer, owner, amount)** → balance is **minus from the user (buyer)** and **add to the owner (builder)** on the ledger.
  3. Backend creates the payment as `verified` and updates land `totalPaid`.

The frontend does not call the ledger; it only calls the backend. To show the user’s current points, use **GET /tokens/balance?address=…** and display `Number(balance) / 1e18`.
That file is the single place to update the frontend. It covers:
How the payment system works – BANK vs POINTS, who submits, who verifies, where value moves.
How ledger balance works – for POINTS: backend checks balance → transferPoints(buyer, owner, amount) → balance minus from user, add to owner on the ledger; frontend only calls backend, not the contract.
All APIs – URLs, methods, request bodies, responses, and when to use each.
Frontend integration checklist – pay with points (show balance, then create payment), pay with bank (form + proof file), builder pending/verify, my payments, installment summary.
2. How balance “minus from user, add to owner” works
Frontend: User chooses “Pay with points”, enters amount, submits POST /payments with paymentMode: "points", landId, agreementId (if any), amount.
Backend (PaymentsService):
getBalance(buyerWallet) on the ledger → if balance &lt; amount → 400 “Insufficient points balance”.
transferPoints(buyerWallet, ownerWallet, amountInBaseUnits) on the ledger → ledger subtracts from buyer and adds to owner.
Creates payment with status verified, updates land totalPaid, optionally records payment on ledger for audit.
So the ledger does the “minus from user, add to owner”; the frontend only calls the backend.
3. APIs the frontend needs
Purpose	Method	Endpoint
Show user’s points balance (before/while paying)	GET	/tokens/balance?address={walletAddress}
Create payment (BANK or POINTS)	POST	/payments (form-data for BANK with proof; POINTS can be form-data or JSON)
Buyer: my payments	GET	/payments/my-payments
Builder: pending payments to verify	GET	/payments/pending
Builder: verify/reject	POST	/payments/:id/verify body { "verified": true\|false, "remarks": "..." }
Payments for a property	GET	/payments/property/:propertyId
Payments for an agreement	GET	/payments/agreement/:agreementId
Payment summary (total paid, remaining)	GET	/payments/installment-summary/:propertyId
Balance display: Backend returns balance as a string in base units (1e18 per point). Frontend should show: Number(balance) / 1e18.
Use docs/PAYMENT-FRONTEND-INTEGRATION.md as the single reference to update the frontend and to see exactly how the payment system and ledger balance (minus from user, add to owner) wor