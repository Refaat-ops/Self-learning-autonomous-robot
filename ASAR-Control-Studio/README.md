# ASAR Control Studio

Responsive React + TypeScript control studio for the DOIT ESP32 DEVKIT V1. The app lets you configure Wi-Fi and common ESP32 settings, define GPIO behavior, compose a mobile-friendly client dashboard with drag-and-drop widgets, poll a live ESP32 over HTTP, and export an Arduino-ready `.ino` sketch.

## Features

- Board profile editor for Wi-Fi, OTA, mDNS, serial logging, host, and port settings
- GPIO configuration with fast add/remove flow and generated server routes
- Drag-and-drop widget composer for control and monitoring layouts
- In-app Mobile App Studio panel with draggable buttons/sliders/status widgets and live ESP preview
- Live polling against ESP32 HTTP endpoints: `/api/status`, `/api/logs`, and `/api/pins/:pin`
- Arduino sketch preview and `.ino` download for use in Arduino IDE
- APK export helpers from the UI (layout JSON + build guide + quick Windows command)
- Responsive UI tuned for desktop and mobile browsers

## Getting started

```bash
npm install
npm run dev
```

Quick workflow for browser + mobile packaging:

```bash
npm run quick:package-and-dev
```

What it does in one run:

- Builds the web app
- Creates `package/mobile-app/www` with the mobile-ready bundle
- Starts the web dev host on your local network

Build for production:

```bash
npm run build
```

Mobile package only:

```bash
npm run package:mobile
```

## One-click APK export (Windows)

Two helper scripts are included in the project root:

- `quick-build-package-apk.ps1`
- `quick-build-package-apk.bat`

What they do:

1. Build web bundle
2. Create mobile package folder
3. Initialize Capacitor + Android (if not initialized yet)
4. Copy web assets to Android project
5. Build Android debug APK
6. Copy APK to `package/mobile-app/apk/ASAR-Control-Studio-debug.apk`

Run with PowerShell:

```powershell
.\quick-build-package-apk.ps1
```

Run with CMD:

```bat
quick-build-package-apk.bat
```

Note: Android Studio + SDK + Java must be installed and configured (`ANDROID_HOME`, platform tools, build tools).

If APK build fails with `SSLHandshakeException` while downloading Gradle, ensure your corporate/root CA is trusted by Windows. The helper scripts force Gradle to use the Windows certificate store.

If APK build fails with `Dependency requires at least JVM runtime version 11`, install Android Studio (it includes JDK 17). The helper scripts automatically prefer Android Studio bundled JDK when detected.

Alternative: install JDK 17 with winget, then reopen terminal:

```powershell
winget install EclipseAdoptium.Temurin.17.JDK
```

## Expected ESP32 endpoints

The generated sketch exposes these default endpoints:

- `GET /api/status`
- `GET /api/logs`
- `POST /api/pins/:pin` with a plain text body such as `0`, `1`, or `255`

## Arduino IDE flow

1. Configure the board profile in the app.
2. Download the generated `.ino` file.
3. Open the file in Arduino IDE.
4. Select the correct ESP32 board and COM port.
5. Compile and flash the sketch.