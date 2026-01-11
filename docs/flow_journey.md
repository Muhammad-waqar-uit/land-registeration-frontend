# User Journey Guide

Complete guide to user workflows, capabilities, and interactions in the Land Registration System.

## Table of Contents

1. [Overview](#overview)
2. [User Roles & Capabilities](#user-roles--capabilities)
3. [Getting Started](#getting-started)
4. [User Journey: Standard User](#user-journey-standard-user)
5. [User Journey: Builder](#user-journey-builder)
6. [User Journey: Admin](#user-journey-admin)
7. [Complete Purchase Flow (Step-by-Step)](#complete-purchase-flow-step-by-step)
8. [Complete Resale Flow (Step-by-Step)](#complete-resale-flow-step-by-step)
9. [Common Scenarios](#common-scenarios)
10. [User Interactions & Notifications](#user-interactions--notifications)

---

## Overview

The Land Registration System is a platform where:
- **Builders** create projects and list properties for sale
- **Users** browse, request, and purchase properties
- **Admins** manage the system and verify builders
- Properties can be purchased through installment plans
- Properties can be resold after purchase

---

## User Roles & Capabilities

### 1. Standard User (USER)

**What you can do:**
- ✅ Register and create account
- ✅ Browse available properties
- ✅ Request properties for purchase
- ✅ Sign agreements
- ✅ Make payments (bank or crypto)
- ✅ Track installment payments
- ✅ View your property purchases
- ✅ Request property resale
- ✅ View payment history
- ✅ Update profile information

**What you cannot do:**
- ❌ Create projects
- ❌ List properties for sale
- ❌ Verify payments
- ❌ Create agreements
- ❌ Transfer ownership

---

### 2. Builder (BUILDER)

**Requirements:**
- Must be verified by admin before full access

**Before Verification:**
- ✅ Register as builder
- ✅ Submit company information
- ⏳ Wait for admin verification

**After Verification:**
- ✅ Create and manage projects
- ✅ List properties under projects
- ✅ View property requests from buyers
- ✅ Approve/reject property requests
- ✅ Create purchase agreements
- ✅ Sign agreements
- ✅ Verify buyer payments
- ✅ Track payment progress
- ✅ Transfer ownership after full payment
- ✅ Manage resale requests
- ✅ Approve/reject resale requests
- ✅ List resale properties

**What you cannot do:**
- ❌ Purchase properties (unless you have USER role)
- ❌ Verify other builders
- ❌ Access admin functions

---

### 3. Admin (ADMIN)

**What you can do:**
- ✅ All user capabilities
- ✅ All builder capabilities
- ✅ Verify builders
- ✅ Access all system data
- ✅ Update/delete any resource
- ✅ Manage system settings
- ✅ View all transactions
- ✅ Monitor system activity

---

## Getting Started

### Step 1: Registration

**For Standard Users:**
```
1. Go to Registration page
2. Fill in:
   - Name
   - Email
   - Password (minimum 8 characters)
   - Role: Select "user"
   - Optional: CNIC, Father Name, Phone Number
3. Click "Register"
4. You're automatically logged in
5. Wallet address is automatically generated
```

**For Builders:**
```
1. Go to Registration page
2. Fill in:
   - Name
   - Email
   - Password (minimum 8 characters)
   - Role: Select "builder"
   - Company Name (required for builders)
   - License Number (required, must be unique)
   - Optional: CNIC, Father Name, Phone Number
3. Click "Register"
4. Your account is created but NOT verified
5. Wait for admin to verify your account
6. You'll receive notification when verified
```

**After Registration:**
- You receive access token and refresh token
- Your wallet address is automatically generated
- You can log in immediately
- Builders must wait for verification to access builder features

---

## User Journey: Standard User

### Journey Overview

```
Registration → Browse Properties → Request Property → Agreement → Payments → Ownership
```

### Detailed Steps

#### Phase 1: Account Setup

**1. Register Account**
- Create account with email and password
- System generates wallet address automatically
- Account is immediately active (no verification needed for users)

**2. Complete Profile (Optional)**
- Update profile information
- Add CNIC, phone number, father name
- Upload profile picture (if feature available)

**3. Explore Platform**
- Browse available properties
- Filter by location, price, project
- View property details, images, documents
- Check installment plans available

---

#### Phase 2: Property Discovery & Request

**1. Browse Properties**
- View all available properties
- Filter by:
  - Price range
  - Location
  - Project
  - Property status
- View property details:
  - Images
  - Documents
  - Location details
  - Price and size
  - Installment plans

**2. Request Property**
- Click "Request Property" on desired property
- Optionally enter your offer price
- Submit request
- **What happens:**
  - Request status: `pending`
  - Builder receives notification
  - Property remains available (others can still request)
  - You can cancel request anytime

**3. Wait for Builder Response**
- Builder reviews your request
- Builder can:
  - ✅ Approve → Property becomes reserved for you
  - ❌ Reject → Property remains available
- You receive notification of decision

**If Approved:**
- Property status changes to `reserved`
- Property is locked to you (others cannot request)
- Builder can now create agreement
- You proceed to agreement phase

**If Rejected:**
- Request status: `rejected`
- Property remains available
- You can request another property
- Builder may provide rejection reason

---

#### Phase 3: Agreement & Signing

**1. Wait for Agreement Creation**
- Builder creates agreement with purchase terms
- Agreement includes:
  - Property details
  - Price
  - Installment plan (if applicable)
  - Payment terms
  - Terms and conditions

**2. Review Agreement**
- View agreement document
- Check all terms and conditions
- Verify property details
- Review payment schedule (if installments)

**3. Sign Agreement**
- Click "Sign Agreement"
- Confirm your acceptance
- **What happens:**
  - Your signature is recorded
  - Agreement status: `buyer_signed`
  - Builder is notified
  - Waiting for builder signature

**4. Builder Signs**
- Builder reviews and signs
- Agreement status: `signed` (both signed)
- Installments are automatically created (if applicable)
- Payment phase begins

---

#### Phase 4: Payments

**Two Payment Options:**

**Option A: Full Payment**
- Make one payment for full amount
- Choose payment method:
  - Bank transfer (requires proof upload)
  - Crypto payment (requires transaction hash)
- Builder verifies payment
- Once verified, proceed to ownership transfer

**Option B: Installment Plan**
- System creates installments based on plan (2, 3, or 5 years)
- You receive payment schedule:
  - Monthly installments
  - Due dates for each installment
  - Amount for each installment

**Making Installment Payments:**

**For Bank Transfer:**
1. Make bank transfer for installment amount
2. Take screenshot/receipt
3. Submit payment:
   - Select installment
   - Enter amount
   - Upload proof file
   - Submit
4. Status: `pending`
5. Builder verifies payment
6. Once verified:
   - Installment status: `paid`
   - Payment recorded on blockchain
   - Next installment becomes due

**For Crypto Payment:**
1. Make crypto transfer
2. Copy transaction hash
3. Submit payment:
   - Select installment
   - Enter amount
   - Enter transaction hash
   - Submit
4. System verifies transaction automatically
5. Once verified:
   - Installment status: `paid`
   - Payment recorded on blockchain

**Tracking Payments:**
- View payment history
- Check installment status
- See payment progress:
  - Total paid
  - Remaining amount
  - Number of installments paid
  - Next due date

---

#### Phase 5: Ownership Transfer

**1. Complete All Payments**
- Finish all installments OR make full payment
- System marks property as fully paid

**2. Builder Initiates Transfer**
- Builder generates ownership document
- Ownership transfer process begins

**3. Ownership Transferred**
- Property ownership transferred to you
- Recorded on blockchain
- Property status: `owned`
- You are now the legal owner
- You can:
  - View ownership document
  - Request property resale
  - View in "My Properties"

---

#### Phase 6: Property Resale (Optional)

**If you want to sell your property:**

**1. Request Resale**
- Go to "My Properties"
- Select property you want to resell
- Click "Request Resale"
- Enter your asking price
- Submit request
- Status: `pending`

**2. Wait for Builder Approval**
- Builder reviews your request
- Builder can:
  - ✅ Approve → Proceed to listing
  - ❌ Reject → Request rejected
- You receive notification

**3. Property Listed (If Approved)**
- Builder lists property for resale
- Status: `listed`
- Property appears in listings with resale tag
- New buyers can request purchase
- You remain owner until sale completes

**4. New Buyer Purchases**
- New buyer goes through purchase flow
- Once purchase completes:
  - Ownership transfers to new buyer
  - You receive payment
  - Status: `sold`
  - Property removed from your properties

---

## User Journey: Builder

### Journey Overview

```
Registration → Verification → Create Project → List Properties → Manage Requests → Agreements → Payments → Transfer Ownership
```

### Detailed Steps

#### Phase 1: Registration & Verification

**1. Register as Builder**
- Register with role: "builder"
- Provide required information:
  - Company Name
  - License Number (must be unique)
  - Business details
- Account created but NOT verified
- Status: `isBuilderVerified: false`

**2. Wait for Admin Verification**
- Admin reviews your application
- Admin verifies:
  - Company information
  - License validity
  - Business credentials
- Admin approves verification
- Status: `isBuilderVerified: true`
- You receive notification

**3. Access Builder Features**
- After verification, you can:
  - Create projects
  - List properties
  - Manage property requests
  - Create agreements
  - Verify payments
  - Transfer ownership

---

#### Phase 2: Project Creation

**1. Create Project**
- Go to "My Projects"
- Click "Create New Project"
- Fill in:
  - Project Name
  - Location
  - Description
  - Total Units (optional)
- Submit
- Project status: `draft` or `active`

**2. Upload Approval Documents (Optional)**
- Upload project approval documents
- Documents stored securely
- Available for viewing

**3. Manage Project**
- Edit project details
- Update status
- View project properties
- Track sales progress

---

#### Phase 3: Property Listing

**1. Create Property**
- Go to project
- Click "Add Property"
- Fill in:
  - Property Title
  - Unit ID (optional)
  - Location
  - Size (square meters)
  - Price
  - Installment Plan (2, 3, or 5 years - optional)
- Upload files:
  - Property Document (PDF/Image)
  - Property Image
- Submit

**2. System Processing**
- Files uploaded to local storage
- Files uploaded to IPFS (permanent storage)
- Document hashes calculated
- Property registered on blockchain
- Property status: `available`
- Property visible in listings

**3. Property Management**
- View all your properties
- Edit property details (if not sold)
- Delete property (if not sold)
- View property requests
- Track property status

---

#### Phase 4: Managing Property Requests

**1. Receive Requests**
- Buyers request your properties
- View requests in "Pending Requests"
- See:
  - Buyer information
  - Property requested
  - Offer price (if provided)
  - Request date

**2. Review Request**
- Review buyer profile
- Check buyer history
- Consider offer price (if provided)
- Make decision

**3. Approve Request**
- Click "Approve"
- **What happens:**
  - Property status: `reserved`
  - Property locked to this buyer
  - Other requests automatically cancelled
  - Buyer notified
  - You can now create agreement

**4. Reject Request**
- Click "Reject"
- Optionally provide reason
- **What happens:**
  - Request status: `rejected`
  - Property remains `available`
  - Buyer notified
  - Other buyers can still request

---

#### Phase 5: Agreement Creation

**1. Create Agreement**
- Go to approved request
- Click "Create Agreement"
- Fill in agreement terms:
  - Property details (auto-filled)
  - Buyer (auto-filled)
  - Price
  - Installment plan (if applicable)
  - Payment terms
- System generates agreement document
- Agreement status: `pending_signature`

**2. Buyer Signs**
- Buyer reviews and signs agreement
- Agreement status: `buyer_signed`
- You receive notification

**3. Sign Agreement**
- Review agreement
- Click "Sign Agreement"
- **What happens:**
  - Agreement status: `signed`
  - Installments created (if applicable)
  - Payment phase begins
  - Buyer notified

---

#### Phase 6: Payment Verification

**1. Receive Payment Notifications**
- Buyers submit payments
- View pending payments in "Pending Payments"
- See:
  - Property
  - Buyer information
  - Amount
  - Payment method
  - Proof file (for bank payments)

**2. Verify Bank Payments**
- Review proof document
- Verify bank transfer:
  - Check transfer details
  - Verify amount matches
  - Confirm receipt in bank account
- Click "Verify Payment"
- **What happens:**
  - Payment status: `verified`
  - Payment recorded on blockchain
  - Installment status updated (if applicable)
  - Property's total paid updated
  - System checks if fully paid

**3. Verify Crypto Payments**
- System auto-verifies transaction
- Check transaction on blockchain
- Verify amount and recipient
- Payment automatically verified if valid

**4. Reject Payment (If Issues)**
- Click "Reject Payment"
- Provide reason
- **What happens:**
  - Payment status: `rejected`
  - Buyer notified
  - Buyer can resubmit

**5. Track Payment Progress**
- View payment history
- Check total paid vs total price
- Monitor installment schedule
- See payment progress percentage

---

#### Phase 7: Ownership Transfer

**1. Verify Full Payment**
- Check if property is fully paid
- All installments completed OR full payment received
- System confirms payment completion

**2. Generate Ownership Document**
- Go to agreement
- Click "Generate Ownership Document"
- System creates ownership document
- Document uploaded to IPFS
- Blockchain transfer initiated

**3. Complete Transfer**
- Ownership transferred on blockchain
- Property status: `owned`
- Buyer becomes new owner
- Agreement status: `completed`
- Buyer notified
- You receive confirmation

**4. Post-Transfer**
- Property removed from your listings
- Recorded in sales history
- Revenue updated
- Buyer can request resale (if desired)

---

#### Phase 8: Managing Resale Requests

**1. Receive Resale Requests**
- Property owners request resale
- View in "Resale Requests"
- See:
  - Property
  - Current owner
  - Requested resale price
  - Request date

**2. Review Request**
- Review resale price
- Check market conditions
- Consider property value
- Make decision

**3. Approve Resale**
- Click "Approve"
- **What happens:**
  - Request status: `approved`
  - You can now list property
  - Owner notified

**4. List Property for Resale**
- Click "List Property"
- **What happens:**
  - Property status: `resale_listed`
  - Property visible in listings
  - New buyers can request
  - Request status: `listed`
  - Resale purchase flow begins

**5. Mark as Sold**
- After new buyer completes purchase
- Click "Mark as Sold"
- **What happens:**
  - Request status: `sold`
  - Ownership transferred to new buyer
  - Original owner receives payment
  - Resale process complete

---

## User Journey: Admin

### Overview

Admins have access to all features plus administrative functions.

### Key Admin Functions

**1. Verify Builders**
- View pending builder applications
- Review builder information:
  - Company details
  - License information
  - Business credentials
- Approve or reject verification
- Builders receive notification

**2. System Monitoring**
- View all users
- View all properties
- View all transactions
- Monitor system activity
- Track system metrics

**3. Management**
- Update any resource
- Delete any resource
- Access all data
- Resolve disputes
- System maintenance

---

## Complete Purchase Flow (Step-by-Step)

### From Buyer's Perspective

```
1. REGISTRATION
   ├─ Create account
   ├─ Receive wallet address
   └─ Account ready

2. BROWSING
   ├─ Browse available properties
   ├─ Filter by preferences
   ├─ View property details
   └─ Select property

3. REQUEST
   ├─ Click "Request Property"
   ├─ Enter offer price (optional)
   ├─ Submit request
   ├─ Status: pending
   └─ Wait for builder response

4. BUILDER REVIEW
   ├─ Builder receives request
   ├─ Builder reviews
   ├─ Builder approves OR rejects
   └─ You receive notification

5. AGREEMENT (If Approved)
   ├─ Builder creates agreement
   ├─ You review agreement
   ├─ You sign agreement
   ├─ Builder signs agreement
   └─ Agreement signed (both parties)

6. PAYMENTS
   ├─ Installments created (if applicable)
   ├─ Make payments:
   │   ├─ Bank: Upload proof → Builder verifies
   │   └─ Crypto: Enter tx hash → Auto-verified
   ├─ Track payment progress
   └─ Complete all payments

7. OWNERSHIP
   ├─ Builder initiates transfer
   ├─ Ownership transferred
   ├─ Property status: owned
   └─ You are now owner

8. RESALE (Optional)
   ├─ Request resale
   ├─ Builder approves
   ├─ Property listed
   ├─ New buyer purchases
   └─ Ownership transferred
```

### From Builder's Perspective

```
1. RECEIVE REQUEST
   ├─ Buyer requests property
   ├─ Review buyer profile
   └─ Make decision

2. APPROVE REQUEST
   ├─ Click "Approve"
   ├─ Property reserved for buyer
   └─ Create agreement

3. CREATE AGREEMENT
   ├─ Fill agreement terms
   ├─ Generate document
   └─ Send to buyer

4. SIGN AGREEMENT
   ├─ Buyer signs
   ├─ You sign
   └─ Agreement complete

5. VERIFY PAYMENTS
   ├─ Receive payment notifications
   ├─ Verify bank payments
   ├─ Crypto auto-verified
   └─ Track progress

6. TRANSFER OWNERSHIP
   ├─ Verify full payment
   ├─ Generate ownership doc
   ├─ Execute transfer
   └─ Complete
```

---

## Complete Resale Flow (Step-by-Step)

### From Owner's Perspective

```
1. REQUEST RESALE
   ├─ Go to "My Properties"
   ├─ Select property
   ├─ Click "Request Resale"
   ├─ Enter asking price
   └─ Submit request

2. WAIT FOR APPROVAL
   ├─ Builder reviews
   ├─ Builder approves OR rejects
   └─ You receive notification

3. PROPERTY LISTED (If Approved)
   ├─ Builder lists property
   ├─ Property visible in listings
   ├─ Status: resale_listed
   └─ New buyers can request

4. NEW BUYER PURCHASES
   ├─ New buyer goes through purchase flow
   ├─ Payments completed
   ├─ Ownership transfers
   └─ You receive payment

5. COMPLETE
   ├─ Status: sold
   ├─ Property removed from your list
   └─ Process complete
```

### From Builder's Perspective

```
1. RECEIVE RESALE REQUEST
   ├─ Owner requests resale
   ├─ Review request
   └─ Make decision

2. APPROVE REQUEST
   ├─ Click "Approve"
   └─ Request approved

3. LIST PROPERTY
   ├─ Click "List Property"
   ├─ Property listed for resale
   └─ New buyers can purchase

4. MANAGE SALE
   ├─ New buyer purchases
   ├─ Manage sale process
   └─ Complete sale

5. MARK AS SOLD
   ├─ Click "Mark as Sold"
   └─ Process complete
```

---

## Common Scenarios

### Scenario 1: User Wants to Buy Property

**Steps:**
1. Register account (if not registered)
2. Browse properties
3. Request desired property
4. Wait for builder approval
5. Sign agreement (when created)
6. Make payments (installments or full)
7. Receive ownership after full payment

**Timeline:**
- Request: Immediate
- Approval: Depends on builder (usually 1-3 days)
- Agreement: 1-2 days after approval
- Signing: Immediate (both parties)
- Payments: 2-5 years (installments) or immediate (full)
- Ownership: After full payment

---

### Scenario 2: Builder Wants to Sell Property

**Steps:**
1. Register as builder
2. Wait for admin verification
3. Create project
4. List properties
5. Receive and approve requests
6. Create agreements
7. Verify payments
8. Transfer ownership after full payment

**Timeline:**
- Registration: Immediate
- Verification: Depends on admin (1-7 days)
- Project creation: Immediate
- Property listing: Immediate
- Request approval: Builder's discretion
- Payment verification: 1-3 days per payment
- Ownership transfer: After full payment

---

### Scenario 3: User Wants to Resell Property

**Steps:**
1. Go to "My Properties"
2. Select owned property
3. Request resale with asking price
4. Wait for builder approval
5. Property listed for resale
6. New buyer purchases
7. Ownership transfers, you receive payment

**Timeline:**
- Resale request: Immediate
- Builder approval: 1-3 days
- Property listing: Immediate after approval
- New buyer purchase: Varies
- Ownership transfer: After new buyer completes payment

---

### Scenario 4: Payment Issues

**Bank Payment Rejected:**
1. Builder rejects payment
2. You receive notification with reason
3. Review issue
4. Resubmit payment with corrected proof
5. Builder verifies again

**Crypto Payment Failed:**
1. Transaction hash invalid
2. System rejects automatically
3. Verify transaction hash
4. Resubmit with correct hash

**Late Installment Payment:**
1. Installment becomes overdue
2. You can still make payment
3. Payment may be accepted (system dependent)
4. Continue with next installments

---

## User Interactions & Notifications

### When You Receive Notifications

**As a User/Buyer:**
- ✅ Property request approved/rejected
- ✅ Agreement created and ready to sign
- ✅ Agreement signed by builder
- ✅ Payment verified or rejected
- ✅ Installment due reminders
- ✅ Ownership transferred
- ✅ Resale request approved/rejected

**As a Builder:**
- ✅ Builder verification approved
- ✅ New property request received
- ✅ Agreement signed by buyer
- ✅ New payment submitted
- ✅ Payment verification needed
- ✅ Property fully paid
- ✅ Resale request received

**As an Admin:**
- ✅ New builder registration
- ✅ System alerts
- ✅ Important updates

---

## Key Points to Remember

### For Users/Buyers:

1. **Registration is instant** - No verification needed
2. **Property requests** - Multiple buyers can request same property until approved
3. **Approval** - Builder decides, you wait for notification
4. **Agreements** - Must be signed by both parties
5. **Payments** - Can pay in installments or full payment
6. **Ownership** - Transferred after full payment
7. **Resale** - Must be approved by builder

### For Builders:

1. **Verification required** - Must wait for admin approval
2. **Properties** - Can only list after verification
3. **Requests** - Review and approve/reject buyer requests
4. **Agreements** - Create after request approval
5. **Payments** - Must verify bank payments manually
6. **Ownership** - Transfer after full payment received
7. **Resale** - Manage resale requests from owners

### For Admins:

1. **Verification** - Verify builders to enable features
2. **Access** - Full access to all system functions
3. **Management** - Can update/delete any resource
4. **Monitoring** - Monitor system activity

---

## Status Progression Guide

### Property Status Flow

```
available → reserved → agreement_pending → payment_in_progress → owned → resale_listed
```

**What each status means:**
- **available**: Anyone can request
- **reserved**: Locked to specific buyer
- **agreement_pending**: Agreement being created/signed
- **payment_in_progress**: Payments being processed
- **owned**: Ownership transferred
- **resale_listed**: Available for resale

### Request Status Flow

```
pending → approved (buyer proceeds)
       → rejected (property remains available)
       → cancelled (buyer cancels)
```

### Agreement Status Flow

```
pending_signature → buyer_signed → signed → completed
```

### Payment Status Flow

```
pending → verified (payment accepted)
       → rejected (payment rejected, can resubmit)
```

---

**Last Updated:** 2024-01-01

**For technical API details, refer to FRONTEND_API_GUIDE.md**
**For system architecture, refer to ARCHITECTURE_FLOW.md**
