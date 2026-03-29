# FlashMart

## Current State
FlashMart is a hyperlocal delivery app with:
- Phone OTP login, Customer/Vendor/Delivery roles (password-protected)
- Flat product list: vendors add products globally, customers browse all products
- Orders stored in backend with status flow: requested → storeConfirmed → riderAssigned → pickedUp → delivered
- No store concept -- products are tied to vendorId (Principal) only
- Smart search, notification system, map pin/polygon delivery zone, order expiry

## Requested Changes (Diff)

### Add
- Store entity: storeId, name, image/logo, category, description, deliveryTime, vendorId, isOpen, rating, createdAt
- Backend: createStore, getStoreByVendor, getAllStores, getStoreById, updateStore, toggleStoreOpen
- Vendor Store Creation Flow: if vendor has no store → show Create Store form; if has store → show Store Dashboard
- Store Dashboard (vendor): shows only their store's products, orders; toggle open/closed
- Products now include storeId field
- Customer side: Store listing page (browse all stores), Store detail page (products from that store only)
- Store card: name, image, category, deliveryTime, rating, open/closed badge
- Store search: search by name, category, keywords with auto-suggestions and trending
- Orders include storeId
- One store per vendor constraint (frontend-enforced)

### Modify
- VendorDashboard: check if vendor has store, gate to CreateStore or StoreDashboard
- CustomerDashboard: navigate to store listing instead of flat product grid
- addProduct: add storeId param
- Product type: add storeId field
- Order type: add storeId field
- CartPage: include storeId in order
- Backend Order/Product types updated

### Remove
- Nothing removed -- flat product browsing replaced by store-based browsing

## Implementation Plan
1. Update Motoko backend: add Store type, stores Map, store CRUD functions; add storeId to Product and Order
2. Update frontend pages:
   - New: StoreListPage, StoreDetailPage, CreateStorePage
   - Modified: VendorDashboard (store check gate), CustomerDashboard (route to stores), CartPage (storeId in order), SmartSearchBar (store search variant)
3. App.tsx: add new routes
4. Keep all existing features intact (notifications, map, polygon check, order expiry, smart search on products)
