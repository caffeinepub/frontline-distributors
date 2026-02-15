# Frontline Distributors Android Wrapper

This directory contains the Android wrapper for the Frontline Distributors PWA (Progressive Web App). The wrapper provides a native Android app experience by loading the deployed PWA in a fullscreen WebView.

## 📋 Overview

- **App Name**: Frontline Distributors
- **Package**: com.frontline.wrapper
- **Current Version**: v1.5 (versionCode 6)
- **Min SDK**: 24 (Android 7.0)
- **Target SDK**: 34 (Android 14)

## 🔧 Prerequisites

- **JDK 17 or higher** (required for Gradle 8.2)
- **Android SDK** with API level 34
- **Gradle 8.2** (included via wrapper)

## ⚙️ Configuration

### PWA URL Setup (CRITICAL)

Before building a release APK, you **must** configure the PWA URL in:

`frontend/android/app/src/main/res/values/strings.xml`

The PWA URL is currently configured to: `https://frontline-distributors.ic0.app`

**The release build will automatically fail if:**
- The URL is still set to a placeholder (e.g., `your-canister-id.ic0.app`)
- The URL doesn't use HTTPS
- The URL is empty or invalid

This validation ensures you never accidentally build a release APK pointing to the wrong URL.

## 🏗️ Building the APK

### Automated Build Script (Recommended)

The easiest way to build a release APK is using the automated build script:

