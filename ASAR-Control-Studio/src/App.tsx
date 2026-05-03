import { useEffect, useMemo, useRef, useState } from 'react';
import logo from '../assets/logo.jpg';
import { BoardConfigPanel } from './components/BoardConfigPanel';
import { DevicePanels } from './components/DevicePanels';
import { MobileAppStudio } from './components/MobileAppStudio';
import { SketchPanel } from './components/SketchPanel';
import { generateSketch, getSketchFileName } from './lib/sketch';
import { loadConfig, saveConfig } from './lib/storage';
import type { BoardConfig, DeviceStatus, LogEntry } from './types';

const defaultConfig: BoardConfig = {
  projectName: 'ASAR Control Node',
  boardName: 'DOIT ESP32 DEVKIT V1',
  chipFamily: 'ESP32-WROOM-32',
  wifiSsid: 'YourWiFi',
  wifiPassword: 'YourPassword',
  hostname: 'asar-esp32',
  serverPort: 80,
  serialBaudRate: 115200,
  pollIntervalMs: 3000,
  apiBaseUrl: 'http://192.168.4.1',
  enableOTA: true,
  enableMDNS: true,
  enableLogging: true,
  enableBlynk: false,
  blynkTemplateId: 'TMPLXXXXXX',
  blynkTemplateName: 'ASAR ESP Control',
  blynkAuthToken: 'YOUR_BLYNK_AUTH_TOKEN',
  blynkServer: 'blynk.cloud',
  blynkPort: 443,
  blynkHeartbeatMs: 5000,
  pins: [
    {
      id: crypto.randomUUID(),
      pin: 2,
      label: 'Status LED',
      mode: 'OUTPUT',
      initialValue: 0,
      inverted: false,
      pwmChannel: 0,
    },
    {
      id: crypto.randomUUID(),
      pin: 4,
      label: 'Drive Enable',
      mode: 'OUTPUT',
      initialValue: 1,
      inverted: false,
      pwmChannel: 1,
    },
    {
      id: crypto.randomUUID(),
      pin: 34,
      label: 'Battery Sense',
      mode: 'ANALOG',
      initialValue: 0,
      inverted: false,
      pwmChannel: 0,
    },
  ],
};

const offlineLog: LogEntry = {
  id: 'boot-log',
  level: 'warn',
  message: 'Waiting for ESP32 /api/status and /api/logs endpoints.',
  createdAt: new Date().toLocaleTimeString(),
};

async function fetchJson<T>(url: string): Promise<T> {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 2200);
  const response = await fetch(url, {
    headers: {
      Accept: 'application/json',
    },
    signal: controller.signal,
  });

  window.clearTimeout(timeout);

  if (!response.ok) {
    throw new Error(`${response.status} ${response.statusText}`);
  }

  return response.json() as Promise<T>;
}

export default function App() {
  const [config, setConfig] = useState<BoardConfig>(() => loadConfig(defaultConfig));
  const [status, setStatus] = useState<DeviceStatus>({ online: false, message: 'No signal yet.' });
  const [logs, setLogs] = useState<LogEntry[]>([offlineLog]);
  const [connectionState, setConnectionState] = useState<'idle' | 'probing' | 'online' | 'offline'>('idle');
  const latestConfig = useRef(config);

  useEffect(() => {
    latestConfig.current = config;
  }, [config]);

  useEffect(() => {
    saveConfig(config);
  }, [config]);

  useEffect(() => {
    const flushConfig = () => saveConfig(latestConfig.current);

    window.addEventListener('pagehide', flushConfig);
    window.addEventListener('beforeunload', flushConfig);

    return () => {
      window.removeEventListener('pagehide', flushConfig);
      window.removeEventListener('beforeunload', flushConfig);
    };
  }, []);

  const probeDevice = async () => {
    setConnectionState('probing');

    try {
      const [nextStatus, nextLogs] = await Promise.all([
        fetchJson<DeviceStatus>(`${config.apiBaseUrl}/api/status`),
        fetchJson<LogEntry[]>(`${config.apiBaseUrl}/api/logs`).catch(() => []),
      ]);

      setStatus({ ...nextStatus, online: true });
      if (nextLogs.length > 0) {
        setLogs(nextLogs);
      }
      setConnectionState('online');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      setStatus({ online: false, message });
      setLogs((current) => {
        const nextEntry = {
          id: crypto.randomUUID(),
          level: 'error' as const,
          message: `Probe failed: ${message}`,
          createdAt: new Date().toLocaleTimeString(),
        };

        if (current[0]?.message === nextEntry.message) {
          return current;
        }

        return [nextEntry, ...current.slice(0, 8)];
      });
      setConnectionState('offline');
    }
  };

  useEffect(() => {
    void probeDevice();
    const handle = window.setInterval(() => {
      void probeDevice();
    }, config.pollIntervalMs);

    return () => window.clearInterval(handle);
  }, [config.apiBaseUrl, config.pollIntervalMs]);

  const pushPinValue = async (pin: number, nextValue: number) => {
    try {
      await fetch(`${config.apiBaseUrl}/api/pins/${pin}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain',
        },
        body: String(nextValue),
      });

      setLogs((current) => [
        {
          id: crypto.randomUUID(),
          level: 'info',
          message: `GPIO ${pin} set to ${nextValue}`,
          createdAt: new Date().toLocaleTimeString(),
        },
        ...current.slice(0, 8),
      ]);
      void probeDevice();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      setLogs((current) => [
        {
          id: crypto.randomUUID(),
          level: 'error',
          message: `Failed to write GPIO ${pin}: ${message}`,
          createdAt: new Date().toLocaleTimeString(),
        },
        ...current.slice(0, 8),
      ]);
    }
  };

  const sketch = useMemo(() => generateSketch(config), [config]);
  const fileName = useMemo(() => getSketchFileName(config), [config]);

  const downloadSketch = () => {
    const blob = new Blob([sketch], { type: 'text/plain;charset=utf-8' });
    const url = window.URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = fileName;
    anchor.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="app-shell">
      <div className="ambient ambient-a" />
      <div className="ambient ambient-b" />

      <header className="hero-card">
        <img alt="ASAR robot logo" className="hero-logo" src={logo} />
        <div className="hero-copy">
          <p className="eyebrow">Adaptive Smart / Autonomous Robot</p>
          <h1>ASAR Control Studio</h1>
          <p className="hero-text">
            Configure your ESP32, assign pins, enable Blynk remote access, and generate a ready-to-flash Arduino sketch.
          </p>
          <div className="hero-chips">
            <span>ESP32 server mode</span>
            <span>Blynk remote bridge</span>
            <span>Wi-Fi + OTA</span>
            <span>Sketch generation</span>
          </div>
        </div>
      </header>

      <main className="content-grid elastic-grid">
        <BoardConfigPanel config={config} onChange={setConfig} />
        <DevicePanels
          config={config}
          connectionState={connectionState}
          logs={logs}
          onProbe={() => void probeDevice()}
          onTogglePin={pushPinValue}
          status={status}
        />
        <MobileAppStudio
          config={config}
          status={status}
          logs={logs}
          connectionState={connectionState}
          onTogglePin={pushPinValue}
        />
        <SketchPanel fileName={fileName} onDownload={downloadSketch} sketch={sketch} />
      </main>
    </div>
  );
}