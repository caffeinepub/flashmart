# FlashMart

## Current State
FlashMart is a mobile-first delivery platform with 8 screens (Login, OTP, Role Selection, Customer/Vendor/Delivery dashboards, Admin panel, Landing page). The UI uses OKLCH color tokens. Currently, many text elements use `text-muted-foreground` (low contrast gray), primary color is a mid-lightness green, borders and shadows on cards/inputs are minimal, and button colors use `bg-primary/90` hover states.

## Requested Changes (Diff)

### Add
- `shadow-card` utility defined in CSS with a visible drop shadow
- Stronger border styles on inputs and cards

### Modify
- OKLCH CSS tokens: darken foreground/muted-foreground for higher contrast; darken primary to a deeper green; strengthen border and input tokens
- All `text-muted-foreground` labels and secondary text to use `text-foreground` or explicit dark text where contrast is too low
- Primary buttons: ensure `text-primary-foreground` is white (`#ffffff`) and `bg-primary` is a darker, more saturated green
- Font weights: important labels, headings, card titles to be `font-semibold` or `font-bold`
- Input fields: stronger border (darker), visible focus ring
- Cards: visible border and shadow
- Badges/status pills: ensure text has sufficient contrast on their backgrounds

### Remove
- Nothing functional removed

## Implementation Plan
1. Update `index.css` OKLCH tokens: darken `--foreground`, `--muted-foreground`, `--primary`, `--border`, `--input`; add `shadow-card` definition
2. Update `LoginPage.tsx`: darken label text, strengthen card shadow/border, button contrast
3. Update `OTPPage.tsx`: same pattern
4. Update `RoleSelectionPage.tsx`: darker role card borders, stronger selected state
5. Update `CustomerDashboard.tsx`: label contrast, badge contrast, card shadows
6. Update `VendorDashboard.tsx`: same pattern
7. Update `DeliveryDashboard.tsx`: same pattern
8. Update `AdminPanel.tsx`: table header contrast, stat values
9. Update `LandingPage.tsx`: hero text contrast, CTA buttons
10. Update `Header.tsx`: nav text contrast, active states
