# Riva (formerly FlashMart)

## Current State
The app is branded as "FlashMart" throughout the codebase. References appear in:
- `LandingPage.tsx`: hero heading, description, CTA section, role cards heading
- `Header.tsx`: logo text "Flash" + "Mart"
- `LoginPage.tsx`: welcome heading "Welcome to FlashMart"
- `NotificationContext.tsx`: STORAGE_KEY = 'flashmart_notifications'
- `CartContext.tsx`: localStorage keys
- `context/CartContext.tsx`: storage keys
- `useLocation.ts`, `useOrderCountdown.ts`: any FlashMart text
- `PasswordModal.tsx`: password entry references
- `searchUtils.ts`: trending searches referencing FlashMart
- `CustomerDashboard.tsx`, `VendorDashboard.tsx`, `DeliveryDashboard.tsx`: page headings/titles
- `AdminResetPage.tsx`: admin page title
- `CartPage.tsx`, `RoleSelectionPage.tsx`, `OrderTrackingPage.tsx`: any FlashMart text
- `index.html`: page title (currently empty)
- `package.json`: app name field
- Password constants: `FLASHMART2026V`, `FLASHMART2026D`, `FLASHMART007` (keep passwords as-is -- they are credentials, not display names)

## Requested Changes (Diff)

### Add
- Tagline: "Why walk? Get it in minutes." on splash/landing and login screens
- "Riva:" prefix to all notification messages (e.g. "Riva: Your order is on the way")

### Modify
- All display text "FlashMart" → "Riva" across every screen
- Header logo text: "Flash" + "Mart" → "Riva" (single word, styled cleanly)
- `index.html` title: set to "Riva"
- `package.json` name field: update to "riva"
- localStorage storage key: `flashmart_notifications` → `riva_notifications`
- localStorage cart key (in CartContext): update to `riva_cart` or similar
- All page headings, descriptions, and CTAs that reference "FlashMart"
- LandingPage: hero heading and subtitle to reference "Riva"; tagline "Why walk? Get it in minutes."
- LoginPage: "Welcome to FlashMart" → "Welcome to Riva"
- Role cards section: "Who is FlashMart for?" → "Who is Riva for?" or similar
- CTA section: "Join thousands of customers and vendors on FlashMart" → "Riva"
- All notification title/message strings that say "FlashMart" → "Riva"
- All notification messages should be prefixed with "Riva:" if they are not already
- Trending searches in searchUtils.ts: remove any FlashMart references
- AdminResetPage: update title references
- VendorDashboard/DeliveryDashboard: any heading text referencing FlashMart

### Remove
- No screens or features removed; branding rename only

## Implementation Plan
1. Update `index.html` title to "Riva"
2. Update `package.json` name to "riva"
3. Update `Header.tsx` logo: replace "Flash"+"Mart" with "Riva"
4. Update `LandingPage.tsx`: all FlashMart text → Riva; add tagline "Why walk? Get it in minutes."
5. Update `LoginPage.tsx`: heading and subtitle
6. Update `NotificationContext.tsx`: STORAGE_KEY → `riva_notifications`; prefix notification messages if applicable
7. Update `CartContext.tsx`: localStorage key → `riva_cart`
8. Update all other pages with FlashMart references: CustomerDashboard, VendorDashboard, DeliveryDashboard, CartPage, AdminResetPage, RoleSelectionPage, OrderTrackingPage, PasswordModal
9. Update `searchUtils.ts`: remove FlashMart mentions in trending searches
10. Update `useLocation.ts`, `useOrderCountdown.ts` if any FlashMart display text exists
11. Add "Riva:" prefix logic for notification messages where user-facing notification content is set
