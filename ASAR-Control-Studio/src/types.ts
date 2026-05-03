export type PinMode = 'INPUT' | 'OUTPUT' | 'INPUT_PULLUP' | 'PWM' | 'ANALOG';

export type PinDefinition = {
  id: string;
  pin: number;
  label: string;
  mode: PinMode;
  initialValue: number;
  inverted: boolean;
  pwmChannel?: number;
  blynkVPin?: number;
};

export type BoardConfig = {
  projectName: string;
  boardName: string;
  chipFamily: string;
  wifiSsid: string;
  wifiPassword: string;
  hostname: string;
  serverPort: number;
  serialBaudRate: number;
  pollIntervalMs: number;
  apiBaseUrl: string;
  enableOTA: boolean;
  enableMDNS: boolean;
  enableLogging: boolean;
  enableBlynk: boolean;
  blynkTemplateId: string;
  blynkTemplateName: string;
  blynkAuthToken: string;
  blynkServer: string;
  blynkPort: number;
  blynkHeartbeatMs: number;
  pins: PinDefinition[];
};

export type DeviceStatus = {
  online: boolean;
  freeHeap?: number;
  ip?: string;
  rssi?: number;
  uptimeMs?: number;
  board?: string;
  message?: string;
  pins?: Array<{ pin: number; value: number }>;
};

export type LogEntry = {
  id: string;
  level: 'info' | 'warn' | 'error';
  message: string;
  createdAt: string;
};

export type MobileWidgetKind = 'toggle' | 'button' | 'slider' | 'status' | 'logs';

export type MobileWidget = {
  id: string;
  kind: MobileWidgetKind;
  title: string;
  pin?: number;
  actionValue?: number;
  min?: number;
  max?: number;
};

export type MobileStudioConfig = {
  appName: string;
  packageId: string;
  targetApiBaseUrl: string;
  widgets: MobileWidget[];
};