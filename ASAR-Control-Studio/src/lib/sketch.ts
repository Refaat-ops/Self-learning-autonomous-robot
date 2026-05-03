import type { BoardConfig, PinDefinition } from '../types';

function sanitizeName(value: string) {
  return value.replace(/[^a-zA-Z0-9_]/g, '_') || 'asar_project';
}

function pinSetup(pin: PinDefinition) {
  if (pin.mode === 'PWM') {
    return [
      `  ledcAttachChannel(${pin.pin}, 5000, 8, ${pin.pwmChannel ?? 0});`,
      `  ledcWrite(${pin.pin}, ${pin.initialValue});`,
    ].join('\n');
  }
  if (pin.mode === 'ANALOG') {
    return `  pinMode(${pin.pin}, INPUT);`;
  }
  return [
    `  pinMode(${pin.pin}, ${pin.mode});`,
    pin.mode === 'OUTPUT'
      ? `  digitalWrite(${pin.pin}, ${pin.initialValue > 0 ? 'HIGH' : 'LOW'});`
      : '',
  ]
    .filter(Boolean)
    .join('\n');
}

function pinRoutes(config: BoardConfig) {
  return config.pins
    .map((pin) => {
      if (pin.mode !== 'OUTPUT' && pin.mode !== 'PWM') return '';
      return [
        `  server.on("/api/pins/${pin.pin}", HTTP_POST, []() {`,
        '    if (!server.hasArg("plain")) {',
        '      server.send(400, "application/json", "{\\"error\\":\\"missing body\\"}");',
        '      return;',
        '    }',
        '    String body = server.arg("plain");',
        '    int value = body.toInt();',
        pin.mode === 'PWM'
          ? `    ledcWrite(${pin.pin}, constrain(value, 0, 255));`
          : `    digitalWrite(${pin.pin}, value > 0 ? ${pin.inverted ? 'LOW' : 'HIGH'} : ${pin.inverted ? 'HIGH' : 'LOW'});`,
        '    server.send(200, "application/json", "{\\"ok\\":true}");',
        '  });',
      ].join('\n');
    })
    .filter(Boolean)
    .join('\n\n');
}

function blynkWriteHandlers(config: BoardConfig): string {
  if (!config.enableBlynk) return '';
  return config.pins
    .filter((p) => (p.mode === 'OUTPUT' || p.mode === 'PWM') && p.blynkVPin !== undefined)
    .map((pin) => {
      const body =
        pin.mode === 'PWM'
          ? `  ledcWrite(${pin.pin}, constrain(param.asInt(), 0, 255));  // ${pin.label}`
          : `  digitalWrite(${pin.pin}, param.asInt() > 0 ? ${pin.inverted ? 'LOW' : 'HIGH'} : ${pin.inverted ? 'HIGH' : 'LOW'});  // ${pin.label}`;
      return `BLYNK_WRITE(V${pin.blynkVPin!}) {\n${body}\n}`;
    })
    .join('\n\n');
}

function blynkSensorReads(config: BoardConfig): string {
  if (!config.enableBlynk) return '';
  return config.pins
    .filter(
      (p) =>
        (p.mode === 'INPUT' || p.mode === 'INPUT_PULLUP' || p.mode === 'ANALOG') &&
        p.blynkVPin !== undefined,
    )
    .map((pin) => {
      const read = pin.mode === 'ANALOG' ? `analogRead(${pin.pin})` : `digitalRead(${pin.pin})`;
      return `  Blynk.virtualWrite(V${pin.blynkVPin!}, ${read});  // ${pin.label}`;
    })
    .join('\n');
}

export function getSketchFileName(config: BoardConfig) {
  return `${sanitizeName(config.projectName)}.ino`;
}

export function generateSketch(config: BoardConfig) {
  const setupBlocks = config.pins.map(pinSetup).join('\n');
  const statusPins = config.pins
    .map(
      (pin) =>
        `  pins += String("{\\"pin\\":${pin.pin},\\"value\\":") + ${
          pin.mode === 'ANALOG' ? `analogRead(${pin.pin})` : `digitalRead(${pin.pin})`
        } + "}";`,
    )
    .join('\n  pins += ",";\n');

  const writeHandlers = blynkWriteHandlers(config);
  const sensorReads = blynkSensorReads(config);
  const hasSensors = sensorReads.length > 0;

  const blynkDefines = config.enableBlynk
    ? `// ---- Blynk IoT defines (must appear before any includes) ----
#define BLYNK_TEMPLATE_ID   "${config.blynkTemplateId}"
#define BLYNK_TEMPLATE_NAME "${config.blynkTemplateName || sanitizeName(config.projectName)}"
#define BLYNK_AUTH_TOKEN    "${config.blynkAuthToken}"
#define BLYNK_PRINT         Serial

`
    : '';

  const blynkInclude = config.enableBlynk
    ? config.blynkPort === 443
      ? '#include <BlynkSimpleEsp32_SSL.h>\n'
      : '#include <BlynkSimpleEsp32.h>\n'
    : '';

  const blynkVPinMap = config.enableBlynk
    ? '// Virtual pin map:\n' +
      config.pins
        .filter((p) => p.blynkVPin !== undefined)
        .map((p) => `//   V${p.blynkVPin!}  <->  ${p.label} (GPIO ${p.pin}, ${p.mode})`)
        .join('\n') +
      '\n\n'
    : '';

  const blynkTimer = config.enableBlynk && hasSensors
    ? `BlynkTimer blynkTimer;\nvoid sendSensorData() {\n${sensorReads}\n}\n\n`
    : '';

  const blynkBegin = config.enableBlynk
    ? `  // Connect to Blynk cloud — provides remote access from any network
  Blynk.begin(BLYNK_AUTH_TOKEN, WIFI_SSID, WIFI_PASSWORD, "${config.blynkServer}", ${config.blynkPort});
${hasSensors ? `  blynkTimer.setInterval(${config.blynkHeartbeatMs}L, sendSensorData);` : ''}`
    : `  WiFi.mode(WIFI_STA);
  WiFi.setHostname("${config.hostname}");
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  while (WiFi.status() != WL_CONNECTED) { delay(500); Serial.print("."); }
  Serial.println();
  Serial.print("IP: "); Serial.println(WiFi.localIP());`;

  const blynkLoop = config.enableBlynk
    ? `  Blynk.run();\n${hasSensors ? '  blynkTimer.run();\n' : ''}`
    : '';

  return `// ============================================================
// ${config.projectName}
// Board: ${config.boardName}  Chip: ${config.chipFamily}
// Generated by ASAR Control Studio
//
// Libraries required (install via Arduino Library Manager):
${config.enableBlynk
  ? `//   • Blynk  by Volodymyr Shymanskyy  (https://github.com/blynkkk/blynk-library)
//   • ESP32  board package by Espressif (v2.x or v3.x)
// Setup:
//   1. Create a Blynk template at https://blynk.cloud
//   2. Fill in BLYNK_TEMPLATE_ID above with your template ID
//   3. Replace BLYNK_AUTH_TOKEN with the token from Blynk console
//   4. Assign virtual pins (V0-V255) to GPIO below via pin map`
  : `//   • ESP32  board package by Espressif (v2.x or v3.x)`}
// ============================================================

${blynkDefines}#include <WiFi.h>
#include <WebServer.h>
${blynkInclude}${config.enableMDNS ? '#include <ESPmDNS.h>\n' : ''}${config.enableOTA ? '#include <ArduinoOTA.h>\n' : ''}
${blynkVPinMap}const char* WIFI_SSID     = "${config.wifiSsid}";
const char* WIFI_PASSWORD = "${config.wifiPassword}";

WebServer server(${config.serverPort});
unsigned long lastLogMs = 0;

// ---- Blynk remote-control handlers (any network) ----
${writeHandlers}
${blynkTimer}// ---- Local HTTP status endpoint (same-network check) ----
void handleStatus() {
  String pins = "[";
${statusPins}
  pins += "]";
  String payload = String("{\\"online\\":true,\\"board\\":\\"${config.boardName}\\",\\"ip\\":\\"")
    + WiFi.localIP().toString()
    + "\\",\\"rssi\\":" + WiFi.RSSI()
    + ",\\"freeHeap\\":" + ESP.getFreeHeap()
    + ",\\"uptimeMs\\":" + millis()
    + ",\\"pins\\":" + pins + "}";
  server.send(200, "application/json", payload);
}

void handleLogs() {
  server.send(200, "application/json",
    "[{\\"id\\":\\"boot\\",\\"level\\":\\"info\\",\\"message\\":\\"ESP32 online\\",\\"createdAt\\":\\"0\\"}]");
}

void setup() {
  Serial.begin(${config.serialBaudRate});
${setupBlocks}

${blynkBegin}

${config.enableMDNS
  ? `  if (MDNS.begin("${config.hostname}")) { Serial.println("mDNS responder started"); }\n`
  : ''}${config.enableOTA
  ? `  ArduinoOTA.setHostname("${config.hostname}");\n  ArduinoOTA.begin();\n`
  : ''}
  server.on("/api/status", HTTP_GET, handleStatus);
  server.on("/api/logs",   HTTP_GET, handleLogs);
${pinRoutes(config)}
  server.begin();
  Serial.println("ASAR node ready  |  IP: " + WiFi.localIP().toString());
}

void loop() {
${blynkLoop}  server.handleClient();
${config.enableOTA ? '  ArduinoOTA.handle();\n' : ''}  if (${config.enableLogging ? 'true' : 'false'} && millis() - lastLogMs > 5000) {
    lastLogMs = millis();
    Serial.printf("heap=%u rssi=%d uptime=%lums\\n", ESP.getFreeHeap(), WiFi.RSSI(), millis());
  }
}`;
}