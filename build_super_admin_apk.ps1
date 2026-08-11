$sdkDir = "d:\BestBill-apk\sdk"
$jdkPath = "$sdkDir\jdk-21"
$sdkHome = "$sdkDir\android-sdk"

if (!(Test-Path $jdkPath)) {
    Write-Host "Downloading OpenJDK 21..."
    $jdkZip = "$sdkDir\jdk21.zip"
    Invoke-WebRequest -Uri "https://github.com/adoptium/temurin21-binaries/releases/download/jdk-21.0.2%2B13/OpenJDK21U-jdk_x64_windows_hotspot_21.0.2_13.zip" -OutFile $jdkZip
    Expand-Archive -Path $jdkZip -DestinationPath $sdkDir
    $extracted = Get-ChildItem -Path $sdkDir -Directory -Filter "jdk-21*" | Select-Object -First 1
    Rename-Item -Path $extracted.FullName -NewName "jdk-21"
    Remove-Item -Force $jdkZip
}

# Set environment variables for build process
$env:JAVA_HOME = $jdkPath
$env:ANDROID_HOME = $sdkHome
$env:PATH = "$jdkPath\bin;$sdkHome\cmdline-tools\latest\bin;$env:PATH"

# Ensure local.properties points to portable Android SDK
Set-Content -Path "d:\bestbill_super-admin\android\local.properties" -Value "sdk.dir=d:/BestBill-apk/sdk/android-sdk"

# Build web distribution & sync Capacitor assets
Write-Host "Building Web Distribution..."
Set-Location "d:\bestbill_super-admin"
.\node_modules\.bin\vite.cmd build
npx cap sync android

# Compile Android APK with Gradle
Write-Host "Compiling Android APK with Gradle..."
Set-Location "d:\bestbill_super-admin\android"
.\gradlew.bat --stop
.\gradlew.bat assembleDebug

# Copy compiled APK to root of d:\bestbill_super-admin
$outputApk = "d:\bestbill_super-admin\android\app\build\outputs\apk\debug\app-debug.apk"
$targetName = "d:\bestbill_super-admin\BestBill_Super_Admin.apk"
if (Test-Path $outputApk) {
    Copy-Item -Path $outputApk -Destination $targetName -Force
    (Get-Item $targetName).LastWriteTime = Get-Date
    Write-Host "----------------------------------------"
    Write-Host "BESTBILL SUPER ADMIN APK COMPILED SUCCESSFULLY!"
    Write-Host "Location: $targetName"
    Write-Host "Timestamp: $(Get-Date)"
    Write-Host "----------------------------------------"
} else {
    Write-Host "Build failed. Check error log above."
}
