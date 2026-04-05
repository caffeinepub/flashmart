# FlashMart

## Current State
FlashMart is a hyperlocal delivery app with a Motoko backend storing users, stores, products, orders, and delivery locations. The app has role-based access control (customer/vendor/delivery/admin), phone OTP login, geofencing, order expiry, and live delivery tracking. Admin panel was previously removed. No dedicated reset functionality exists.

Backend has these data stores:
- `users`: Map<Principal, UserProfile>
- `stores`: Map<Int, Store>
- `products`: Map<Int, Product>
- `otps`: Map<Text, OTP>
- `orders`: Map<Int, Order>
- `deliveryLocations`: Map<Int, DeliveryLocation>
- Counters: `nextOrderId`, `nextProductId`, `nextStoreId`

## Requested Changes (Diff)

### Add
- Backend: `resetAllData(adminPassword: Text) : async Text` — clears all maps (users, stores, products, orders, deliveryLocations, otps) and resets all ID counters to 1. Validates a hardcoded admin password before proceeding. Logs the reset action with timestamp. Returns a success message with timestamp.
- Backend: `getResetLogs() : async [ResetLog]` — returns list of reset audit log entries (timestamp, caller principal)
- Frontend: New `AdminResetPage` screen accessible via a hidden route (admin password `FLASHMART007` guards entry)
- Frontend: Admin Reset UI with:
  - Password input field (admin password verification)
  - Text input requiring user to type "RESET" exactly
  - Warning banner: "This will delete ALL app data permanently"
  - Red confirm button only enabled when both fields are valid
  - Success/error toast feedback
  - Post-reset: clears all localStorage (cart, session, vendorAccess, deliveryAccess), invalidates all React Query caches
- Frontend: Add `admin-reset` to AppScreen type and App.tsx routing
- Frontend: Add `useResetAllData` mutation hook in useQueries.ts

### Modify
- `AppScreen` type in AppContext.tsx — add `"admin-reset"`
- `App.tsx` — add route for `admin-reset` screen
- `backend.d.ts` and `declarations/backend.did.d.ts` — add `resetAllData` and `getResetLogs` signatures
- `LandingPage.tsx` — add a subtle hidden admin link or the admin reset accessible from landing page

### Remove
- Nothing removed

## Implementation Plan

1. **Backend**: Add `ResetLog` type, `resetLogs` array, `resetAllData(adminPassword)` function that:
   - Validates password against hardcoded `"FLASHMART007"`
   - Clears users, stores, products, orders, deliveryLocations, otps maps
   - Resets nextOrderId, nextProductId, nextStoreId to 1
   - Appends a ResetLog entry with caller + Time.now()
   - Returns success string with timestamp
2. **Backend**: Add `getResetLogs()` query returning all reset log entries
3. **Frontend declarations**: Add `resetAllData` and `getResetLogs` to both `backend.d.ts` and `backend.did.d.ts`
4. **Frontend hook**: Add `useResetAllData` mutation in `useQueries.ts`
5. **Frontend page**: Create `AdminResetPage.tsx` with double-confirmation UI (password + RESET text), warning banner, and post-reset cleanup (localStorage clear + query cache invalidation)
6. **Frontend routing**: Add `"admin-reset"` screen to AppContext and App.tsx, accessible from LandingPage via admin password entry
