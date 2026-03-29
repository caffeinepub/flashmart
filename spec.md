# FlashMart

## Current State
FlashMart has a Header component with logo, nav links, and logout button. Vendors already get sound/popup/vibration for new orders via VendorDashboard polling. There is no global notification bell, no notification history panel, no browser push permission system, and no cross-role notification infrastructure.

Key files:
- `src/frontend/src/components/Header.tsx` — header with nav + auth buttons
- `src/frontend/src/context/AppContext.tsx` — global screen/user state
- `src/frontend/src/pages/VendorDashboard.tsx` — already polls for orders, has sound alerts
- `src/frontend/src/pages/CustomerDashboard.tsx` — customer view
- `src/frontend/src/pages/DeliveryDashboard.tsx` — delivery view
- `src/frontend/src/context/CartContext.tsx` — cart state

## Requested Changes (Diff)

### Add
- `NotificationContext` (`src/frontend/src/context/NotificationContext.tsx`): global state for in-app notifications. Stores an array of notification objects `{ id, title, message, type, read, timestamp }`. Persists to localStorage. Provides `addNotification`, `markRead`, `markAllRead`, `clearAll` functions.
- `NotificationBell` component (`src/frontend/src/components/NotificationBell.tsx`): bell icon with unread badge count. Clicking opens the notification panel slide-in drawer.
- `NotificationPanel` component: slide-in panel from right showing notification history grouped by recency. Each item shows title, message, time ago, and a colored dot by type (order=green, offer=orange, reminder=yellow, system=blue). Mark all read button + clear button.
- Smart trigger hooks (`src/frontend/src/hooks/useNotificationTriggers.ts`):
  - **Order updates**: when order status changes (placed, accepted, out_for_delivery, delivered, expired) — fire matching notification
  - **Cart abandonment**: if items are in cart and no order placed after 10 minutes of inactivity, fire reminder notification
  - **Time-based offers**: on app load, check time of day — morning (6–11am): breakfast offers, lunch (11am–3pm): lunch deals, evening (6–10pm): dinner specials — fire at most once per day per slot (stored in localStorage)
  - **Vendor new order**: when a new order arrives (detected by polling diff), fire vendor notification with order count
  - **Delivery new assignment**: when an order is assigned to delivery partner, fire notification
- **Browser Push (Notification API)**: on first use, request `Notification.permission`. When granted, use `new Notification(title, { body, icon })` to also fire OS-level notifications. This works when tab is in background. Show a one-time permission prompt card on Customer Dashboard and Vendor Dashboard.
- **Psychology copy system**: notification messages use smart copy templates:
  - Personalized: "Only for you — [item] is back in stock 🎯"
  - Urgency: "Last chance ⏳ — [offer] ends soon"
  - Social proof: "People near you are buying [item]"
  - Curiosity: "You left something behind 👀 — your cart is waiting"
- `NotificationBell` mounted in `Header.tsx` (top right, before logout button) — globally visible on all screens

### Modify
- `Header.tsx`: add `<NotificationBell />` in the right side action area (before logout button)
- `App.tsx`: wrap with `NotificationProvider`
- `VendorDashboard.tsx`: existing new-order sound/popup kept intact; additionally call `addNotification` when new orders arrive so they appear in the bell history
- `CustomerDashboard.tsx`: add browser push permission prompt card (dismissable, stores dismissed state in localStorage)
- `CartContext.tsx` or cart page: start cart abandonment timer when items are added

### Remove
- Nothing removed

## Implementation Plan
1. Create `NotificationContext` with localStorage persistence
2. Create `NotificationBell` + `NotificationPanel` components (bell in header, panel as slide-in sheet)
3. Create `useNotificationTriggers` hook with all trigger logic
4. Add browser Notification API permission request + OS notification firing
5. Wire `NotificationBell` into `Header.tsx`
6. Wrap `App.tsx` with `NotificationProvider`
7. Integrate vendor/delivery triggers into their dashboards
8. Add psychology-copy notification messages
9. Validate and build
