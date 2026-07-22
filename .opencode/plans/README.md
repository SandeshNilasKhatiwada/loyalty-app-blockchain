# LoyalChain Redesign Plan

## 1. Core Architecture Overview

### Three User Roles

| Role | Registration | Auth Method | Key Actions |
|------|-------------|-------------|-------------|
| **Admin** | Only created by another admin | Privy (email) | Approve/reject merchants, manage users, view all analytics |
| **Merchant** | Submit application → Admin approves | Privy (email) | Buy tokens (points), award points to customers, accept redemptions |
| **User (Customer)** | Self-register with email | Privy (email) | Earn points from merchants, redeem at any merchant |

**Base Admin:** `s.khatiwada.7607@westcliff.edu` — auto-promoted on login (already implemented via `ADMIN_EMAIL` env)

---

## 2. Complete Data Flow

### A. Merchant Registration & Approval
```
Merchant fills form (business name, reg no, citizenship, docs)
  → Submitted as "PENDING"
  → Admin sees in "Pending Approvals"
  → Admin approves → merchant gets token contract deployed
  → Admin rejects → merchant can resubmit
  → Only APPROVED merchants can buy tokens & award points
```
✅ Already implemented in `backend/routes/admin.js` + `backend/routes/auth.js`

### B. Merchant Buys Tokens (Top-Up)
```
Merchant goes to "Buy Tokens"
  → Enters amount in NPR
  → Selects payment method: eSewa / PayPal / Direct
  → Payment processed (mock for now)
  → System credits merchant's token balance
  → Fee deducted (5% platform fee)
```
✅ Basic top-up exists in `backend/routes/merchant.js`
🔧 **Enhancement:** Add payment method selector + track method in transaction

### C. User Earns Points
```
Customer pays merchant (offline/off-chain)
  → Merchant opens "Award Points"
  → Enters customer's email
  → Enters points amount
  → Points deducted from merchant balance → credited to customer's universal balance
  → Transaction recorded
```
✅ Basic award exists in `backend/routes/points.js`
🔧 **Enhancement:** Award by email (not just wallet address)

### D. User Redeems Points (Cross-Merchant)
```
Customer visits ANY merchant in network
  → Customer provides email
  → Merchant opens "Redeem Points"
  → Enters customer email + points amount
  → Points deducted from customer's universal balance
  → Redeeming merchant's balance credited
  → Transaction recorded
```
⚙️ **New:** Universal points balance, cross-merchant redemption support

### E. Points = Network Credits (Clearinghouse Model)
Points earned from Merchant A can be redeemed at Merchant B:

1. Merchant buys tokens → merchant's `tokenBalance` increases
2. Merchant awards points to customer → merchant balance ↓, user balance ↑
3. User redeems at Merchant B → user balance ↓, Merchant B balance ↑
4. No per-merchant token tracking needed — points are platform-wide credits

---

## 3. Dashboard Layout

### New Layout: Sidebar + Content
Replace current top-navbar with persistent sidebar:

```
┌──────────────────────────────────────────┐
│ ┌──────────┐  ┌────────────────────────┐ │
│ │ SIDEBAR  │  │   TOP BAR              │ │
│ │          │  │   User email | Logout  │ │
│ │  • Dash  │  ├────────────────────────┤ │
│ │  • ...   │  │                        │ │
│ │  • ...   │  │   MAIN CONTENT         │ │
│ │          │  │   (route children)     │ │
│ │ LOGOUT   │  │                        │ │
│ └──────────┘  └────────────────────────┘ │
└──────────────────────────────────────────┘
```

### Role-Based Sidebar

**User:**
- Dashboard (universal balance)
- Activity History
- Find Merchants

**Merchant:**
- Overview (stats + balance)
- Award Points
- Accept Redemption
- Buy Tokens
- Transactions

**Admin:**
- Stats Overview
- Merchant Approvals
- All Merchants
- User Management

---

## 4. Current State vs What's Needed

### Backend (8 route files)

| File | Status | Changes Needed |
|------|--------|---------------|
| `routes/auth.js` | ✅ Works | Minor — prevent self-registration of admin role (already done) |
| `routes/admin.js` | ✅ Works | Add tokenBalance/pointsBalance to stats |
| **`routes/points.js`** | ⚠️ Needs update | Award by email, universal balance, cross-merchant redeem |
| **`routes/merchant.js`** | ⚠️ Needs update | Track payment method on topup, return tokenBalance |
| `routes/analytics.js` | ✅ Works | Minor additions for new balances |
| **`routes/transactions.js`** | ⚠️ Needs update | Include merchant/user names in response |
| `routes/swap.js` | ✅ Works | Keep as-is |
| `routes/qr.js` | 🔧 Optional | Could repurpose for merchant-customer pairing |

### Prisma Schema Changes

Add to **User** model:
```
pointsBalance   BigInt  @default(0)
```

Add to **Merchant** model:
```
tokenBalance    BigInt  @default(0)
```

### Frontend (9 page files + components)

| File | Status | Changes |
|------|--------|---------|
| **`components/Layout.jsx`** | 🔴 Replace | New SidebarLayout with role-based nav |
| **`components/Navbar.jsx`** | 🔴 Remove | Replaced by sidebar |
| **`pages/Dashboard.jsx`** | 🔴 Rewrite | 3 views based on role |
| **`pages/MerchantPanel.jsx`** | ⚠️ Refine | Award by email, payment method UI |
| `pages/Admin.jsx` | ✅ Good | Minor polish |
| `pages/Login.jsx` | ✅ Good | Works |
| `pages/Register.jsx` | ✅ Good | Works |
| `pages/Redemption.jsx` | 🔧 Merge into MerchantPanel | Remove standalone page |
| `pages/TopUp.jsx` | 🔧 Merge into MerchantPanel | Remove standalone page |
| `pages/Swap.jsx` | ✅ Keep | Works |
| `pages/Landing.jsx` | ⚠️ Update | Minor copy updates |

### Service Changes

| File | Change |
|------|--------|
| `services/endpoints.js` | Add new endpoints for universal balance, public merchants, etc. |

---

## 5. Key Design Decisions

1. **Points = platform credits (not per-merchant tokens)** — enables cross-merchant redemption naturally
2. **Email-based identification** — users identified by their login email, not wallet
3. **Merchant-initiated award/redeem** — merchant enters customer info, simplest UX
4. **Payment gateway placeholder** — UI for eSewa/PayPal selector but mock implementation
5. **Sidebar layout** — standard dashboard pattern with left nav + right content

---

## 6. Implementation Order

1. Prisma schema migration (add pointsBalance, tokenBalance fields)
2. Backend: Rewrite points routes (universal balance, email-based, cross-merchant)
3. Backend: Add payment method to topup
4. Backend: New public merchants endpoint
5. Frontend: SidebarLayout component
6. Frontend: Rewrite Dashboard (3 views)
7. Frontend: Refine MerchantPanel
8. Frontend: Update routes/App.jsx
9. Verify end-to-end: register user → merchant approval → buy tokens → award → redeem
