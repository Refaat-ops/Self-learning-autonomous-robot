import type { BoardConfig, DeviceStatus, LogEntry } from '../types';

type DevicePanelsProps = {
  config: BoardConfig;
  status: DeviceStatus;
  logs: LogEntry[];
  connectionState: 'idle' | 'probing' | 'online' | 'offline';
  onProbe: () => void;
  onTogglePin: (pin: number, nextValue: number) => void;
};

export function DevicePanels({
  config,
  status,
  logs,
  connectionState,
  onProbe,
  onTogglePin,
}: DevicePanelsProps) {
  return (
    <section className="panel stack-lg">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Live Device</p>
          <h2>Monitor, test, and actuate the board</h2>
        </div>
        <button className="ghost-button" onClick={onProbe} type="button">
          {connectionState === 'probing' ? 'Scanning...' : 'Refresh'}
        </button>
      </div>

      <div className="status-strip">
        <article>
          <span>Connectivity</span>
          <strong className={connectionState}>{connectionState}</strong>
        </article>
        <article>
          <span>IP</span>
          <strong>{status.ip ?? 'Unknown'}</strong>
        </article>
        <article>
          <span>RSSI</span>
          <strong>{status.rssi !== undefined ? `${status.rssi} dBm` : '--'}</strong>
        </article>
        <article>
          <span>Free heap</span>
          <strong>{status.freeHeap !== undefined ? `${status.freeHeap} B` : '--'}</strong>
        </article>
      </div>

      <div className="grid two-up">
        <div className="stack-md">
          <div className="section-head">
            <div>
              <p className="eyebrow">Controls</p>
              <h3>Quick GPIO actions</h3>
            </div>
          </div>

          <div className="control-list">
            {config.pins
              .filter((pin) => pin.mode === 'OUTPUT' || pin.mode === 'PWM')
              .map((pin) => {
                const liveValue = status.pins?.find((entry) => entry.pin === pin.pin)?.value ?? pin.initialValue;

                return (
                  <article className="control-card" key={pin.id}>
                    <div>
                      <strong>{pin.label}</strong>
                      <span>GPIO {pin.pin}</span>
                    </div>
                    <button
                      className="action-button"
                      onClick={() => onTogglePin(pin.pin, liveValue > 0 ? 0 : pin.mode === 'PWM' ? 255 : 1)}
                      type="button"
                    >
                      {liveValue > 0 ? 'Turn off' : pin.mode === 'PWM' ? 'Full power' : 'Turn on'}
                    </button>
                  </article>
                );
              })}
          </div>
        </div>

        <div className="stack-md">
          <div className="section-head">
            <div>
              <p className="eyebrow">Logs</p>
              <h3>Runtime stream</h3>
            </div>
          </div>

          <div className="log-panel">
            {logs.map((log) => (
              <article className={`log-row ${log.level}`} key={log.id}>
                <span>{log.level}</span>
                <p>{log.message}</p>
                <time>{log.createdAt}</time>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}