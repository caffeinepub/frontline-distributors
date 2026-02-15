#!/bin/bash

# Build Release APK Script for Frontline Distributors Android Wrapper
# This script builds a release APK, stages it in a versioned folder, and provides publishing instructions

set -e  # Exit on error

echo "🔨 Building Frontline Distributors Android APK..."
echo ""

# Check if we're in the right directory
if [ ! -f "build.gradle" ]; then
    echo "❌ Error: Must run this script from the frontend/android directory"
    echo "   cd frontend/android && ./scripts/build-release-apk.sh"
    exit 1
fi

# Check for Java
if ! command -v java &> /dev/null; then
    echo "❌ Error: Java is not installed or not in PATH"
    echo "   Please install JDK 17 or higher"
    exit 1
fi

echo "✓ Java version:"
java -version 2>&1 | head -n 1

# Extract version info from build.gradle before building
VERSION_NAME=$(grep "versionName" app/build.gradle | sed 's/.*"\(.*\)".*/\1/')
VERSION_CODE=$(grep "versionCode" app/build.gradle | sed 's/[^0-9]*//g' | head -n 1)

echo ""
echo "📦 Building version: v${VERSION_NAME} (code: ${VERSION_CODE})"
echo ""

echo "📋 Validating PWA URL configuration..."
echo "   (Build will fail if placeholder URL is detected)"
echo ""

# Run explicit PWA URL validation before build
./gradlew validatePwaUrl

if [ $? -ne 0 ]; then
    echo ""
    echo "❌ PWA URL validation failed!"
    echo "   Please check frontend/android/app/src/main/res/values/strings.xml"
    exit 1
fi

echo ""
echo "✓ PWA URL validation passed"
echo ""

# Clean previous builds
echo "🧹 Cleaning previous builds..."
./gradlew clean

echo ""
echo "🏗️  Building release APK..."
echo ""

# Build release APK (validation happens automatically via Gradle task)
./gradlew assembleRelease

# Check if build succeeded
if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Build successful!"
    echo ""
    
    # Find the APK file
    APK_PATH=$(find app/build/outputs/apk/release -name "*.apk" -type f | head -n 1)
    
    if [ -n "$APK_PATH" ]; then
        # Expected filename based on Gradle configuration
        EXPECTED_FILENAME="frontline-distributors-v${VERSION_NAME}-${VERSION_CODE}.apk"
        ACTUAL_FILENAME=$(basename "$APK_PATH")
        
        echo "📦 Release APK built:"
        echo "   Location: $APK_PATH"
        echo "   Filename: $ACTUAL_FILENAME"
        
        # Verify filename matches expected pattern
        if [[ "$ACTUAL_FILENAME" == "$EXPECTED_FILENAME" ]]; then
            echo "   ✓ Filename matches expected pattern"
        else
            echo "   ⚠️  Warning: Filename doesn't match expected pattern: $EXPECTED_FILENAME"
            echo "   ⚠️  Actual: $ACTUAL_FILENAME"
            echo ""
            echo "❌ Build failed: Output filename mismatch"
            exit 1
        fi
        
        # Get file size
        if command -v du &> /dev/null; then
            SIZE=$(du -h "$APK_PATH" | cut -f1)
            echo "   Size: $SIZE"
        fi
        
        # Calculate SHA256 checksum for verification
        if command -v shasum &> /dev/null; then
            CHECKSUM=$(shasum -a 256 "$APK_PATH" | cut -d' ' -f1)
            echo "   SHA256: $CHECKSUM"
        elif command -v sha256sum &> /dev/null; then
            CHECKSUM=$(sha256sum "$APK_PATH" | cut -d' ' -f1)
            echo "   SHA256: $CHECKSUM"
        fi
        
        echo ""
        echo "📁 Staging APK in versioned release folder..."
        
        # Create versioned release folder
        BUILD_TIMESTAMP=$(date -u +"%Y%m%d-%H%M%S")
        RELEASE_FOLDER="dist/releases/v${VERSION_NAME}-${VERSION_CODE}-${BUILD_TIMESTAMP}"
        mkdir -p "$RELEASE_FOLDER"
        
        # Copy APK to versioned release folder
        STAGED_APK_PATH="$RELEASE_FOLDER/$EXPECTED_FILENAME"
        cp "$APK_PATH" "$STAGED_APK_PATH"
        
        # Write build metadata with publish info
        cat > "$RELEASE_FOLDER/build-metadata.json" <<EOF
{
  "versionName": "${VERSION_NAME}",
  "versionCode": ${VERSION_CODE},
  "filename": "${EXPECTED_FILENAME}",
  "buildTimestamp": "${BUILD_TIMESTAMP}",
  "sha256": "${CHECKSUM:-unknown}",
  "releaseFolder": "${RELEASE_FOLDER}",
  "publishReady": true
}
EOF
        
        # Also copy to dist root for backward compatibility
        mkdir -p dist
        cp "$APK_PATH" "dist/$EXPECTED_FILENAME"
        cp "$RELEASE_FOLDER/build-metadata.json" "dist/build-metadata.json"
        
        echo "   ✓ Staged to: $STAGED_APK_PATH"
        echo "   ✓ Build metadata: $RELEASE_FOLDER/build-metadata.json"
        echo "   ✓ Also copied to dist/ for compatibility"
        echo ""
        echo "🎉 Release artifact ready for distribution!"
        echo ""
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        echo "📱 NEXT STEPS FOR PUBLISHING"
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        echo ""
        echo "1️⃣  TEST THE APK LOCALLY:"
        echo "   adb install $STAGED_APK_PATH"
        echo ""
        echo "2️⃣  PUBLISH TO GENERATE NEW DOWNLOAD LINK:"
        echo "   Run the publish script to upload and get a fresh download URL:"
        echo "   ./scripts/publish-release-apk.sh"
        echo ""
        echo "   ✅ This build is staged in a unique versioned folder"
        echo "   ✅ Publishing will generate a NEW unique download URL"
        echo "   ⚠️  Do NOT reuse old /latest links - each build gets its own URL"
        echo ""
        echo "3️⃣  DISTRIBUTION OPTIONS:"
        echo "   • Caffeine platform hosting (recommended - auto-generates unique URLs)"
        echo "   • Firebase App Distribution"
        echo "   • Your own CDN/server"
        echo "   • Google Play Store (requires app signing)"
        echo ""
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        echo ""
        echo "🔖 Build Info:"
        echo "   Version: v${VERSION_NAME} (code ${VERSION_CODE})"
        echo "   File: $EXPECTED_FILENAME"
        echo "   Staged in: $RELEASE_FOLDER"
        echo "   Timestamp: $BUILD_TIMESTAMP"
        echo "   Ready for: Fresh distribution with NEW unique download link"
        echo ""
    else
        echo "   ⚠️  Could not locate APK file in build output"
        echo "   Check: app/build/outputs/apk/release/"
        exit 1
    fi
else
    echo ""
    echo "❌ Build failed!"
    echo ""
    echo "Common issues:"
    echo "   • PWA URL still set to placeholder (check strings.xml)"
    echo "   • Missing Android SDK components"
    echo "   • Java version incompatibility (need JDK 17+)"
    echo "   • Gradle configuration errors"
    echo ""
    exit 1
fi
