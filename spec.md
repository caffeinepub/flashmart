# FlashMart

## Current State
Full FlashMart app with phone OTP login, customer/vendor/delivery dashboards, cart, product management, location gating, map pinning, order expiry, and notification sounds. The current canister keeps stopping (IC0508) and needs a fresh deployment.

## Requested Changes (Diff)

### Add
- Nothing new

### Modify
- Rebuild/redeploy to provision a fresh canister

### Remove
- Nothing

## Implementation Plan
- Regenerate Motoko backend (same logic) to force new canister provisioning
- Keep all frontend code exactly as-is
