# FlashMart

## Current State
The `createStore` Motoko function accepts 7 arguments: name, image, category, description, deliveryTime, latitude (Float), longitude (Float). However, the deployed canister's IDL (`backend.did.d.ts`) only shows 5 string arguments, meaning the canister was deployed without the lat/lng parameters. This causes "IDL error: invalid type argument" when the frontend tries to call createStore with 7 args.

## Requested Changes (Diff)

### Add
- Nothing new

### Modify
- Redeploy backend so the canister IDL matches the Motoko source (7-arg createStore with Float lat/lng)

### Remove
- Nothing

## Implementation Plan
1. No code changes needed — the Motoko source and frontend hooks are already correct
2. Simply redeploy to get a fresh canister with the correct IDL
