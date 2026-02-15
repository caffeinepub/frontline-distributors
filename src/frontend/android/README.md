# Frontline Distributors - Android APK

This directory contains an Android wrapper project that packages the Frontline Distributors PWA into an installable APK for Android devices.

## ⚠️ Important: Configure PWA URL First

**Before building the release APK**, you must configure the deployed PWA URL:

1. Deploy your frontend canister to the Internet Computer
2. Get your canister URL (e.g., `https://abc123-xyz.ic0.app`)
3. Update `app/src/main/res/values/strings.xml`:
   ```xml
   <string name="pwa_url">https://your-actual-canister-id.ic0.app</string>
   ```

The build will **automatically fail** if you try to build a release APK with the placeholder URL.

## Prerequisites

- **Java Development Kit (JDK)**: JDK 17 or higher
- **Android SDK**: Android SDK 34 (API level 34) or higher
- **Android Studio** (optional but recommended): Latest stable version

## Quick Start: Build Release APK

### Using the Build Script (Easiest)

