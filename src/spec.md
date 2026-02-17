# Specification

## Summary
**Goal:** Replace the generic “Unable to connect to server” Owner/Salesman login failure with a clear, actionable error state that surfaces actor/agent initialization failures and provides recovery actions.

**Planned changes:**
- Update the login/startup flow to display the underlying actor/agent initialization error (when present), including an expandable “Technical Details” section, instead of only a generic connection message.
- Add working user actions on the error state: Retry (re-attempt actor initialization) and Clear Cache (invoke the existing resetCachedApp()).
- Adjust the actor initialization hook’s public state so the app can distinguish “initializing” vs “initialized” vs “failed with error”, and ensure failures are logged and available for UI diagnostics.
- Make actor initialization resilient when the `caffeineAdminToken` URL parameter is missing/empty so anonymous actor creation for password login does not fail solely due to secret initialization.

**User-visible outcome:** When connection/initialization fails during Owner/Salesman login, users see a clear error with technical details and can Retry or Clear Cache; the UI no longer hangs indefinitely on “Connecting to server...”, and missing admin token no longer causes a generic connection failure for password login.
