# Specification

## Summary
**Goal:** Ensure the Login screen is always reachable and usable during app startup, even when a previous password-auth session exists but actor/profile initialization stalls or fails.

**Planned changes:**
- Adjust startup gating so the app does not remain indefinitely on the full-screen “Loading...” state when the backend actor is unavailable or still initializing; keep the Login UI reachable and interactive.
- Add clear recovery actions on startup timeout and profile-fetch error states to clear password-auth state (logout/clearAuth) and return to the Login screen without requiring manual cache clearing or relying only on a full page reload.
- Ensure any added/updated user-facing labels and help text in these flows are in English, and keep error/toast normalization consistent with existing patterns.

**User-visible outcome:** Users can always access and use the Login screen; if startup/profile loading stalls or fails, they can tap a visible recovery option to clear the stored session and immediately return to a usable Login screen.
