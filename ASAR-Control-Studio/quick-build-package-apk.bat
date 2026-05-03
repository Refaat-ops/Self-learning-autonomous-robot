@echo off
setlocal enableextensions enabledelayedexpansion

cd /d "%~dp0"

echo.
echo ==> Build web bundle
call npm run build:web
if errorlevel 1 goto :fail

echo.
echo ==> Create mobile package folder
call npm run package:mobile
if errorlevel 1 goto :fail

if not exist "capacitor.config.ts" if not exist "capacitor.config.json" if not exist "capacitor.config.js" (
  echo.
  echo ==> Install Capacitor dependencies
  set "npm_config_strict_ssl=false"
  call npm install @capacitor/core @capacitor/android @capacitor/cli
  set "npm_config_strict_ssl="
  if errorlevel 1 goto :fail

  echo.
  echo ==> Initialize Capacitor project
  call npx cap init "ASAR Control Studio" com.asar.controlstudio --web-dir=package/mobile-app/www
  if errorlevel 1 goto :fail
)

if not exist "android" (
  echo.
  echo ==> Add Android platform
  call npx cap add android
  if errorlevel 1 goto :fail
)

echo.
echo ==> Copy latest web assets to Android project
call npx cap copy android
if errorlevel 1 goto :fail

echo.
echo ==> Build Android debug APK
pushd android
set "_ASAR_JAVA_HOME=%JAVA_HOME%"
set "_ASAR_PATH=%PATH%"
set "_ASAR_STUDIO_JBR="
if defined ProgramW6432 if exist "%ProgramW6432%\Android\Android Studio\jbr\bin\java.exe" set "_ASAR_STUDIO_JBR=%ProgramW6432%\Android\Android Studio\jbr"
if not defined _ASAR_STUDIO_JBR if exist "%ProgramFiles%\Android\Android Studio\jbr\bin\java.exe" set "_ASAR_STUDIO_JBR=%ProgramFiles%\Android\Android Studio\jbr"
if not defined _ASAR_STUDIO_JBR if defined ProgramFiles(x86) if exist "%ProgramFiles(x86)%\Android\Android Studio\jbr\bin\java.exe" set "_ASAR_STUDIO_JBR=%ProgramFiles(x86)%\Android\Android Studio\jbr"
if not defined _ASAR_STUDIO_JBR if defined LOCALAPPDATA if exist "%LOCALAPPDATA%\Programs\Android Studio\jbr\bin\java.exe" set "_ASAR_STUDIO_JBR=%LOCALAPPDATA%\Programs\Android Studio\jbr"
if not defined _ASAR_STUDIO_JBR if defined LOCALAPPDATA (
  for /d %%J in ("%LOCALAPPDATA%\Programs\Eclipse Adoptium\jdk*") do (
    if exist "%%~fJ\bin\java.exe" (
      set "_ASAR_STUDIO_JBR=%%~fJ"
      goto :java_home_found
    )
  )
)
if not defined _ASAR_STUDIO_JBR if defined LOCALAPPDATA (
  for /d %%J in ("%LOCALAPPDATA%\JetBrains\*") do (
    if exist "%%~fJ\jbr\bin\java.exe" (
      set "_ASAR_STUDIO_JBR=%%~fJ\jbr"
      goto :java_home_found
    )
  )
)
:java_home_found
if defined _ASAR_STUDIO_JBR (
  set "JAVA_HOME=%_ASAR_STUDIO_JBR%"
)
if defined JAVA_HOME if exist "%JAVA_HOME%\bin\java.exe" (
  set "PATH=%JAVA_HOME%\bin;%PATH%"
)

set "_ASAR_JAVA_EXE=java"
if defined JAVA_HOME if exist "%JAVA_HOME%\bin\java.exe" set "_ASAR_JAVA_EXE=%JAVA_HOME%\bin\java.exe"

set "_ASAR_JAVA_MAJOR=0"
set "_ASAR_JAVA_SPEC="
"%_ASAR_JAVA_EXE%" -XshowSettings:properties -version 1>nul 2>"%TEMP%\asar_java_props.txt"
for /f "tokens=2 delims==" %%v in ('findstr /i /c:"java.specification.version =" "%TEMP%\asar_java_props.txt"') do set "_ASAR_JAVA_SPEC=%%v"
del /q "%TEMP%\asar_java_props.txt" >nul 2>nul
set "_ASAR_JAVA_SPEC=%_ASAR_JAVA_SPEC: =%"
for /f "tokens=1,2 delims=." %%a in ("%_ASAR_JAVA_SPEC%") do (
  if "%%a"=="1" (
    set "_ASAR_JAVA_MAJOR=%%b"
  ) else (
    set "_ASAR_JAVA_MAJOR=%%a"
  )
)
if not defined _ASAR_JAVA_MAJOR set "_ASAR_JAVA_MAJOR=0"

if %_ASAR_JAVA_MAJOR% LSS 11 (
  echo.
  echo ERROR: Java 11+ is required for Android Gradle plugin.
  "%_ASAR_JAVA_EXE%" -version
  echo Install Android Studio or JDK 17, then re-run this script.
  set "JAVA_HOME=%_ASAR_JAVA_HOME%"
  set "_ASAR_JAVA_HOME="
  set "PATH=%_ASAR_PATH%"
  set "_ASAR_PATH="
  popd
  goto :fail
)

set "_ASAR_JAVA_TOOL_OPTIONS=%JAVA_TOOL_OPTIONS%"
set "JAVA_TOOL_OPTIONS=-Djavax.net.ssl.trustStoreType=Windows-ROOT %JAVA_TOOL_OPTIONS%"
call gradlew.bat assembleDebug
set "JAVA_TOOL_OPTIONS=%_ASAR_JAVA_TOOL_OPTIONS%"
set "_ASAR_JAVA_TOOL_OPTIONS="
set "JAVA_HOME=%_ASAR_JAVA_HOME%"
set "_ASAR_JAVA_HOME="
set "PATH=%_ASAR_PATH%"
set "_ASAR_PATH="
set "_ASAR_STUDIO_JBR="
if errorlevel 1 (
  popd
  goto :fail
)
popd

if not exist "android\app\build\outputs\apk\debug\app-debug.apk" (
  echo.
  echo ERROR: APK was not generated at the expected path.
  goto :fail
)

if not exist "package\mobile-app\apk" mkdir "package\mobile-app\apk"
copy /y "android\app\build\outputs\apk\debug\app-debug.apk" "package\mobile-app\apk\ASAR-Control-Studio-debug.apk" >nul

echo.
echo Done. APK exported to:
echo %cd%\package\mobile-app\apk\ASAR-Control-Studio-debug.apk
exit /b 0

:fail
echo.
echo ERROR: Script failed.
exit /b 1
