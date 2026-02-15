# Specification

## Summary
**Goal:** Regenerate a fresh Android release APK for the existing PWA wrapper and provide a new, working download link.

**Planned changes:**
- Bump the Android wrapper app versionCode and versionName in `frontend/android/app/build.gradle` so the new APK is distinguishable from prior builds.
- Verify `pwa_url` in `frontend/android/app/src/main/res/values/strings.xml` points to a valid deployed PWA URL (not the placeholder) for the release build.
- Produce a new Android release APK artifact from `frontend/android` and publish a reachable download URL (not reusing the previous broken link unless verified working).

**User-visible outcome:** A new Android release APK is available via a working download link and, when installed, it opens and successfully loads the deployed PWA.
