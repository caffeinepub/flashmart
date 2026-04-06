# FlashMart

## Current State
The backend `resetAllData` function exists and takes only one parameter: `adminPassword: Text`. The frontend (`AdminResetPage.tsx`) validates password and confirmation client-side, then calls `actor.resetAllData("FLASHMART007")` with only the password. The IDL declares `resetAllData` as `IDL.Func([IDL.Text], [IDL.Text], [])` (single text argument).

## Requested Changes (Diff)

### Add
- Backend `resetAllData` should accept a second `confirmation: Text` parameter and verify it equals "RESET" server-side.
- On success, return "Reset successful".
- On failure, trap with a clear error message.

### Modify
- `src/backend/main.mo`: Change `resetAllData(adminPassword: Text)` to `resetAllData(adminPassword: Text, confirmation: Text)`, add confirmation check, change return value to "Reset successful".
- `src/frontend/src/declarations/backend.did.js`: Update `resetAllData` IDL to accept two Text args.
- `src/frontend/src/declarations/backend.did.d.ts`: Update `resetAllData` ActorMethod signature to `[string, string]`.
- `src/frontend/src/backend.d.ts`: Update `resetAllData` signature to `(adminPassword: string, confirmation: string): Promise<string>`.
- `src/frontend/src/pages/AdminResetPage.tsx`: Pass both `password` and `"RESET"` to `actor.resetAllData(password, confirmText)`, show "Reset successful" on success.

### Remove
- Nothing removed.

## Implementation Plan
1. Update `main.mo` `resetAllData` to take two parameters and verify both.
2. Update all IDL files (`backend.did.js`, `backend.did.d.ts`, `backend.d.ts`) to reflect the two-argument signature.
3. Update `AdminResetPage.tsx` to call `actor.resetAllData(password.trim(), confirmText.trim())` and handle the response properly.
