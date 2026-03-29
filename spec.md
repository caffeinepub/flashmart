# FlashMart

## Current State
- Single hardcoded global delivery polygon in `CartPage.tsx` (`DELIVERY_ZONE`)
- `Store` type in Motoko has no zone fields
- `MapPickerModal` shows map for pinning location but no zone polygon overlay
- Vendors have no UI to define custom delivery zones
- All stores use the same global polygon for delivery eligibility checks

## Requested Changes (Diff)

### Add
- `useCustomZone: Bool` and `customDeliveryZone: [(Float, Float)]` fields to Motoko `Store` type
- `setStoreDeliveryZone(storeId, zone, useCustom)` backend function
- `ZoneEditorModal` component: Leaflet map where vendor taps to add polygon points, can remove individual points, and sees the polygon shape live
- Delivery zone logic: if store has `useCustomZone=true` and a saved polygon → use it; else → fall back to global polygon
- Buffer logic in point-in-polygon: expand polygon slightly outward (~50m) before checking to handle GPS jitter near edges
- Draw active delivery zone polygon on `MapPickerModal` (checkout map) so customer can see boundary
- Color the polygon green (inside) or red (outside) based on pinned location status
- `useSetStoreDeliveryZone` mutation hook in `useQueries.ts`

### Modify
- `Store` interface in `backend.d.ts`: add `useCustomZone: boolean` and `customDeliveryZone: Array<[number, number]>`
- `CartPage.tsx`: replace hardcoded `DELIVERY_ZONE` with dynamic zone fetched from store data; pass zone to `MapPickerModal`
- `MapPickerModal.tsx`: accept optional `deliveryZone` prop and draw it as a Leaflet polygon on the map
- `VendorDashboard.tsx`: add a "Delivery Zone" settings card with toggle ("Use custom delivery zone") and "Edit Zone" button that opens `ZoneEditorModal`; preloads global zone as default points if no custom zone saved yet
- `createStore` and `updateStore` in backend: initialize zone fields to empty/false defaults

### Remove
- Hardcoded `DELIVERY_ZONE` constant from `CartPage.tsx` (replace with store-aware dynamic lookup)

## Implementation Plan
1. Update Motoko `Store` type with zone fields; add `setStoreDeliveryZone` function; update `createStore`/`updateStore` to initialize zone defaults
2. Update `backend.d.ts` Store interface and add new function signature
3. Add `useSetStoreDeliveryZone` hook to `useQueries.ts`
4. Create `ZoneEditorModal.tsx` with Leaflet: tap to add points, click point to remove, live polygon preview, preload global zone as default, confirm saves zone
5. Update `VendorDashboard.tsx`: add delivery zone card with toggle + Edit Zone button
6. Update `MapPickerModal.tsx`: draw delivery zone polygon, color-code inside/outside
7. Update `CartPage.tsx`: use store's zone (or global fallback), pass zone to `MapPickerModal`
