# Specification

## Summary
**Goal:** Make the mobile navigation drawer and its backdrop fully opaque for readability in light/dark themes, then redeploy with a fresh build so clients receive updated assets and a new preview link.

**Planned changes:**
- Update the mobile hamburger drawer styling so the drawer surface is fully opaque (no translucency) in both light and dark themes, without changing any files under `frontend/src/components/ui`.
- Update the drawer overlay/backdrop styling to be fully opaque and remove any blur/backdrop-filter effects that reduce readability.
- Ensure all mobile drawer navigation labels (Dashboard, Products, Billing, Customers, Credits, Reports) remain clearly readable against the updated drawer background.
- Bump the build identifier in `frontend/src/utils/buildInfo.ts` and increment the service worker cache version in `frontend/public/sw.js` to force clients to pick up fresh assets after redeploy.
- Create a fresh Draft deployment and provide a new, distinct shareable preview URL.

**User-visible outcome:** On mobile, opening the hamburger menu shows an opaque, readable navigation drawer and opaque backdrop in both themes, and users receive the update via a new deployment/preview link without typically needing a hard refresh.
