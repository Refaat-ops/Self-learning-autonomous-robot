$ErrorActionPreference = 'Stop'

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $scriptDir

function Run-Step {
  param(
    [Parameter(Mandatory = $true)]
    [string]$Label,
    [Parameter(Mandatory = $true)]
    [string]$Command
  )

  Write-Host "`n==> $Label" -ForegroundColor Cyan
  cmd /c $Command
  if ($LASTEXITCODE -ne 0) {
    throw "Step failed: $Label"
  }
}

try {
  Run-Step -Label 'Build web bundle' -Command 'npm run build:web'
  Run-Step -Label 'Create mobile package folder' -Command 'npm run package:mobile'

  $hasCapConfig = (Test-Path 'capacitor.config.ts') -or (Test-Path 'capacitor.config.json') -or (Test-Path 'capacitor.config.js')

  if (-not $hasCapConfig) {
    Run-Step -Label 'Install Capacitor dependencies' -Command 'set npm_config_strict_ssl=false&& npm install @capacitor/core @capacitor/android @capacitor/cli'
    Run-Step -Label 'Initialize Capacitor project' -Command 'npx cap init "ASAR Control Studio" com.asar.controlstudio --web-dir=package/mobile-app/www'
  }

  if (-not (Test-Path 'android')) {
    Run-Step -Label 'Add Android platform' -Command 'npx cap add android'
  }

  Run-Step -Label 'Copy latest web assets to Android project' -Command 'npx cap copy android'

  Write-Host "`n==> Build Android debug APK" -ForegroundColor Cyan
  Push-Location 'android'
  try {
    $oldJavaHome = $env:JAVA_HOME
    $oldPath = $env:PATH
    $androidStudioJbr = Join-Path ${env:ProgramFiles} 'Android\Android Studio\jbr'
    $androidStudioJava = Join-Path $androidStudioJbr 'bin\java.exe'

    if (Test-Path $androidStudioJava) {
      $env:JAVA_HOME = $androidStudioJbr
      $env:PATH = "$androidStudioJbr\bin;$oldPath"
    }

    $javaExe = if ($env:JAVA_HOME -and (Test-Path (Join-Path $env:JAVA_HOME 'bin\java.exe'))) {
      Join-Path $env:JAVA_HOME 'bin\java.exe'
    }
    else {
      'java'
    }

    $javaVersionCommand = "`"$javaExe`" -version 2>&1"
    $javaVersionText = cmd /c $javaVersionCommand
    $javaVersionLine = $javaVersionText | Select-Object -First 1
    if ($javaVersionLine -match '"([0-9]+)\.([0-9]+).*"') {
      $major = if ($Matches[1] -eq '1') { [int]$Matches[2] } else { [int]$Matches[1] }
      if ($major -lt 11) {
        throw "Java 11+ is required for Android Gradle plugin. Current: $javaVersionLine. Install Android Studio or JDK 17 and re-run the script."
      }
    }
    else {
      throw "Unable to detect Java version from: $javaVersionLine"
    }

    $oldJavaToolOptions = $env:JAVA_TOOL_OPTIONS
    $env:JAVA_TOOL_OPTIONS = "-Djavax.net.ssl.trustStoreType=Windows-ROOT $oldJavaToolOptions".Trim()
    cmd /c 'gradlew.bat assembleDebug'
    $env:JAVA_TOOL_OPTIONS = $oldJavaToolOptions
    $env:JAVA_HOME = $oldJavaHome
    $env:PATH = $oldPath
    if ($LASTEXITCODE -ne 0) {
      throw 'Android build failed.'
    }
  }
  finally {
    Pop-Location
  }

  $sourceApk = Join-Path $scriptDir 'android\app\build\outputs\apk\debug\app-debug.apk'
  if (-not (Test-Path $sourceApk)) {
    throw 'APK was not generated at the expected path.'
  }

  $targetDir = Join-Path $scriptDir 'package\mobile-app\apk'
  New-Item -ItemType Directory -Path $targetDir -Force | Out-Null
  $targetApk = Join-Path $targetDir 'ASAR-Control-Studio-debug.apk'
  Copy-Item -Path $sourceApk -Destination $targetApk -Force

  Write-Host "`nDone. APK exported to:" -ForegroundColor Green
  Write-Host $targetApk -ForegroundColor Green
}
catch {
  Write-Host "`nERROR: $($_.Exception.Message)" -ForegroundColor Red
  exit 1
}
