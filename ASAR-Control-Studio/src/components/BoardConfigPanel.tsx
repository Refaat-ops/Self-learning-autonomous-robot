import type { BoardConfig, PinDefinition } from '../types';

type BoardConfigPanelProps = {
  config: BoardConfig;
  onChange: (next: BoardConfig) => void;
};

const pinModes: PinDefinition['mode'][] = ['OUTPUT', 'INPUT', 'INPUT_PULLUP', 'PWM', 'ANALOG'];

export function BoardConfigPanel({ config, onChange }: BoardConfigPanelProps) {
  const patch = <K extends keyof BoardConfig>(key: K, value: BoardConfig[K]) => {
    onChange({ ...config, [key]: value });
  };

  const patchBlynkEnabled = (enabled: boolean) => {
    onChange({ ...config, enableBlynk: enabled });
  };

  const autoAssignBlynkVPins = () => {
    const controllableModes: PinDefinition['mode'][] = ['OUTPUT', 'PWM', 'INPUT', 'INPUT_PULLUP', 'ANALOG'];
    const used = new Set<number>();

    config.pins.forEach((pin) => {
      if (!controllableModes.includes(pin.mode)) {
        return;
      }
      if (typeof pin.blynkVPin === 'number' && Number.isFinite(pin.blynkVPin) && pin.blynkVPin >= 0) {
        used.add(pin.blynkVPin);
      }
    });

    let nextVPin = 0;
    const nextFree = () => {
      while (used.has(nextVPin)) {
        nextVPin += 1;
      }
      used.add(nextVPin);
      return nextVPin;
    };

    onChange({
      ...config,
      pins: config.pins.map((pin) => {
        if (!controllableModes.includes(pin.mode)) {
          return { ...pin, blynkVPin: undefined };
        }

        if (typeof pin.blynkVPin === 'number' && Number.isFinite(pin.blynkVPin) && pin.blynkVPin >= 0) {
          return pin;
        }

        return { ...pin, blynkVPin: nextFree() };
      }),
    });
  };

  const patchPin = (id: string, field: keyof PinDefinition, value: number | string | boolean) => {
    onChange({
      ...config,
      pins: config.pins.map((pin) => (pin.id === id ? { ...pin, [field]: value } : pin)),
    });
  };

  const addPin = () => {
    const nextPin = config.pins.length + 12;

    onChange({
      ...config,
      pins: [
        ...config.pins,
        {
          id: crypto.randomUUID(),
          pin: nextPin,
          label: `GPIO ${nextPin}`,
          mode: 'OUTPUT',
          initialValue: 0,
          inverted: false,
          pwmChannel: 0,
        },
      ],
    });
  };

  const removePin = (id: string) => {
    onChange({
      ...config,
      pins: config.pins.filter((pin) => pin.id !== id),
    });
  };

  return (
    <section className="panel stack-lg">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Board Studio</p>
          <h2>ESP32 system profile</h2>
        </div>
        <span className="badge">{config.boardName}</span>
      </div>

      <div className="grid two-up compact-grid">
        <label>
          <span>Project name</span>
          <input value={config.projectName} onChange={(event) => patch('projectName', event.target.value)} />
        </label>
        <label>
          <span>Board preset</span>
          <input value={config.boardName} onChange={(event) => patch('boardName', event.target.value)} />
        </label>
        <label>
          <span>Chip family</span>
          <input value={config.chipFamily} onChange={(event) => patch('chipFamily', event.target.value)} />
        </label>
        <label>
          <span>Hostname</span>
          <input value={config.hostname} onChange={(event) => patch('hostname', event.target.value)} />
        </label>
        <label>
          <span>Wi-Fi SSID</span>
          <input value={config.wifiSsid} onChange={(event) => patch('wifiSsid', event.target.value)} />
        </label>
        <label>
          <span>Wi-Fi password</span>
          <input
            type="password"
            value={config.wifiPassword}
            onChange={(event) => patch('wifiPassword', event.target.value)}
          />
        </label>
        <label>
          <span>ESP base URL</span>
          <input value={config.apiBaseUrl} onChange={(event) => patch('apiBaseUrl', event.target.value)} />
        </label>
        <label>
          <span>Server port</span>
          <input
            type="number"
            value={config.serverPort}
            onChange={(event) => patch('serverPort', Number(event.target.value))}
          />
        </label>
        <label>
          <span>Serial baud</span>
          <input
            type="number"
            value={config.serialBaudRate}
            onChange={(event) => patch('serialBaudRate', Number(event.target.value))}
          />
        </label>
        <label>
          <span>Monitor cadence (ms)</span>
          <input
            type="number"
            value={config.pollIntervalMs}
            onChange={(event) => patch('pollIntervalMs', Number(event.target.value))}
          />
        </label>
      </div>

      <div className="toggle-row">
        <label className="switch-card">
          <input checked={config.enableOTA} type="checkbox" onChange={(event) => patch('enableOTA', event.target.checked)} />
          <span>Arduino OTA</span>
        </label>
        <label className="switch-card">
          <input checked={config.enableMDNS} type="checkbox" onChange={(event) => patch('enableMDNS', event.target.checked)} />
          <span>mDNS discovery</span>
        </label>
        <label className="switch-card">
          <input checked={config.enableLogging} type="checkbox" onChange={(event) => patch('enableLogging', event.target.checked)} />
          <span>Serial diagnostics</span>
        </label>
      </div>

      {/* ---- Blynk remote access ---- */}
      <div className="stack-md">
        <div className="section-head section-head-blynk">
          <div>
            <p className="eyebrow">Remote Access</p>
            <h3>Blynk cloud bridge</h3>
          </div>
          <label className="switch-card switch-inline">
            <input
              checked={config.enableBlynk}
              type="checkbox"
              onChange={(event) => patchBlynkEnabled(event.target.checked)}
            />
            <span>Enable Blynk</span>
          </label>
        </div>

        {config.enableBlynk && (
          <div className="grid two-up compact-grid">
            <label>
              <span>Template ID</span>
              <input
                value={config.blynkTemplateId}
                placeholder="TMPLxxxxxx"
                onChange={(event) => patch('blynkTemplateId', event.target.value)}
              />
            </label>
            <label>
              <span>Template name</span>
              <input
                value={config.blynkTemplateName}
                placeholder="ASAR ESP Control"
                onChange={(event) => patch('blynkTemplateName', event.target.value)}
              />
            </label>
            <label style={{ gridColumn: '1 / -1' }}>
              <span>Auth token</span>
              <input
                value={config.blynkAuthToken}
                placeholder="Paste token from Blynk console"
                onChange={(event) => patch('blynkAuthToken', event.target.value)}
              />
            </label>
            <label>
              <span>Cloud server</span>
              <input
                value={config.blynkServer}
                onChange={(event) => patch('blynkServer', event.target.value)}
              />
            </label>
            <label>
              <span>Port</span>
              <input
                type="number"
                value={config.blynkPort}
                onChange={(event) => patch('blynkPort', Number(event.target.value))}
              />
            </label>
            <label style={{ gridColumn: '1 / -1' }}>
              <span>Sensor push interval (ms)</span>
              <input
                type="number"
                value={config.blynkHeartbeatMs}
                onChange={(event) => patch('blynkHeartbeatMs', Number(event.target.value))}
              />
            </label>
            <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end' }}>
              <button className="ghost-button" type="button" onClick={autoAssignBlynkVPins}>
                Auto-assign V-Pins
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="stack-md">
        <div className="section-head">
          <div>
            <p className="eyebrow">Pins</p>
            <h3>GPIO quick configuration</h3>
          </div>
          <button className="ghost-button" onClick={addPin} type="button">
            Add pin
          </button>
        </div>

        <div className="pin-list">
          {config.pins.map((pin) => (
            <article className="pin-card" key={pin.id}>
              <label>
                <span>Label</span>
                <input value={pin.label} onChange={(event) => patchPin(pin.id, 'label', event.target.value)} />
              </label>
              <label>
                <span>GPIO</span>
                <input
                  type="number"
                  value={pin.pin}
                  onChange={(event) => patchPin(pin.id, 'pin', Number(event.target.value))}
                />
              </label>
              <label>
                <span>Mode</span>
                <select value={pin.mode} onChange={(event) => patchPin(pin.id, 'mode', event.target.value)}>
                  {pinModes.map((mode) => (
                    <option key={mode} value={mode}>
                      {mode}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <span>Initial value</span>
                <input
                  type="number"
                  value={pin.initialValue}
                  min={0}
                  max={255}
                  onChange={(event) => patchPin(pin.id, 'initialValue', Number(event.target.value))}
                />
              </label>
              <label className="checkbox-inline">
                <input
                  checked={pin.inverted}
                  type="checkbox"
                  onChange={(event) => patchPin(pin.id, 'inverted', event.target.checked)}
                />
                <span>Inverted logic</span>
              </label>
              {config.enableBlynk && (
                <label>
                  <span>Blynk V-Pin</span>
                  <input
                    type="number"
                    min={0}
                    max={255}
                    value={pin.blynkVPin ?? ''}
                    placeholder="None"
                    onChange={(event) =>
                      patchPin(
                        pin.id,
                        'blynkVPin',
                        event.target.value === ''
                          ? (undefined as unknown as number)
                          : Number(event.target.value),
                      )
                    }
                  />
                </label>
              )}
              <button className="danger-button" onClick={() => removePin(pin.id)} type="button">
                Remove
              </button>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}