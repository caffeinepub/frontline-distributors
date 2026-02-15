#!/bin/bash

# Build Release APK Script for Frontline Distributors Android Wrapper
# This script builds a release APK and provides the output location

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

echo ""
echo "📋 Validating PWA URL configuration..."
echo ""

# Clean previous builds
echo "🧹 Cleaning previous builds..."
./gradlew clean

echo ""
echo "🏗️  Building release APK..."
echo "   (This includes PWA URL validation)"
echo ""

# Build release APK (validation happens automatically)
./gradlew assembleRelease

# Check if build succeeded
if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Build successful!"
    echo ""
    echo "📦 Release APK location:"
    
    # Find the APK file
    APK_PATH=$(find app/build/outputs/apk/release -name "*.apk" -type f | head -n 1)
    
    if [ -n "$APK_PATH" ]; then
        echo "   $APK_PATH"
        echo ""
        
        # Get file size
        if command -v du &> /dev/null; then
            SIZE=$(du -h "$APK_PATH" | cut -f1)
            echo "   Size: $SIZE"
        fi
        
        echo ""
        echo "📱 Next steps:"
        echo "   1. Test the APK on a device: adb install $APK_PATH"
        echo "   2. Or transfer to your phone and install manually"
        echo "   3. Upload to your distribution platform"
        echo ""
        echo "🔗 To generate a download link, upload this APK to your hosting service"
        echo ""
    else
        echo "   ⚠️  Could not locate APK file in build output"
        echo "   Check: app/build/outputs/apk/release/"
    fi
else
    echo ""
    echo "❌ Build failed!"
    echo ""
    echo "Common issues:"
    echo "   • PWA URL still set to placeholder (check strings.xml)"
    echo "   • Missing Android SDK components"
    echo "   • Java version incompatibility"
    echo ""
    exit 1
fi
