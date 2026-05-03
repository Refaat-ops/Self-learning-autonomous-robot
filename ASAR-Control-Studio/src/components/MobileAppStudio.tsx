import { useEffect, useMemo, useState } from 'react';
import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  type DragEndEvent,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type {
  BoardConfig,
  DeviceStatus,
  LogEntry,
  MobileStudioConfig,
  MobileWidget,
  MobileWidgetKind,
} from '../types';

type MobileAppStudioProps = {
  config: BoardConfig;
  status: DeviceStatus;
  logs: LogEntry[];
  connectionState: 'idle' | 'probing' | 'online' | 'offline';
  onTogglePin: (pin: number, nextValue: number) => void;
};

const STORAGE_KEY = 'asar-mobile-app-studio:v1';

const widgetLabels: Record<MobileWidgetKind, string> = {
  toggle: 'Toggle',
  button: 'Push button',
  slider: 'Slider',
  status: 'Status card',
  logs: 'Logs feed',
};

function sanitizeTemplateName(value: string) {
  const clean = value.trim().replace(/[^a-zA-Z0-9_\- ]/g, '');
  return clean.length > 0 ? clean : 'ASAR ESP Control';
}

function generateWidgetsFromBoard(boardConfig: BoardConfig): MobileWidget[] {
  const widgets: MobileWidget[] = [];

  boardConfig.pins.forEach((pin) => {
    if (pin.mode === 'PWM') {
      widgets.push({
        id: crypto.randomUUID(),
        kind: 'slider',
        title: `${pin.label} PWM`,
        pin: pin.pin,
        min: 0,
        max: 255,
      });
      return;
    }

    if (pin.mode === 'OUTPUT') {
      widgets.push({
        id: crypto.randomUUID(),
        kind: 'toggle',
        title: `${pin.label} Toggle`,
        pin: pin.pin,
      });
    }
  });

  widgets.push({
    id: crypto.randomUUID(),
    kind: 'status',
    title: 'ESP Status',
  });
  widgets.push({
    id: crypto.randomUUID(),
    kind: 'logs',
    title: 'Recent Logs',
  });

  return widgets;
}

function createWidget(kind: MobileWidgetKind, boardConfig: BoardConfig): MobileWidget {
  const outputPin = boardConfig.pins.find((pin) => pin.mode === 'OUTPUT' || pin.mode === 'PWM');

  if (kind === 'status') {
    return {
      id: crypto.randomUUID(),
      kind,
      title: 'ESP Status',
    };
  }

  if (kind === 'logs') {
    return {
      id: crypto.randomUUID(),
      kind,
      title: 'Recent Logs',
    };
  }

  if (kind === 'slider') {
    return {
      id: crypto.randomUUID(),
      kind,
      title: outputPin ? `${outputPin.label} Dimmer` : 'PWM Slider',
      pin: outputPin?.pin,
      min: 0,
      max: 255,
      actionValue: 128,
    };
  }

  if (kind === 'button') {
    return {
      id: crypto.randomUUID(),
      kind,
      title: outputPin ? `${outputPin.label} Trigger` : 'Trigger',
      pin: outputPin?.pin,
      actionValue: 1,
    };
  }

  return {
    id: crypto.randomUUID(),
    kind,
    title: outputPin ? `${outputPin.label} Toggle` : 'Toggle',
    pin: outputPin?.pin,
  };
}

function defaultStudioConfig(boardConfig: BoardConfig): MobileStudioConfig {
  const widgets = [createWidget('toggle', boardConfig), createWidget('status', boardConfig), createWidget('logs', boardConfig)];
  return {
    appName: 'ASAR ESP Mobile Controller',
    packageId: 'com.asar.mobilecontroller',
    targetApiBaseUrl: boardConfig.apiBaseUrl,
    widgets,
  };
}

function loadStudioConfig(boardConfig: BoardConfig): MobileStudioConfig {
  const fallback = defaultStudioConfig(boardConfig);

  if (typeof window === 'undefined') {
    return fallback;
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return fallback;
    }

    const parsed = JSON.parse(raw) as Partial<MobileStudioConfig>;
    const widgets = Array.isArray(parsed.widgets)
      ? parsed.widgets
          .filter((widget): widget is MobileWidget => Boolean(widget) && typeof widget === 'object' && typeof widget.id === 'string')
          .map((widget) => ({
            ...widget,
            id: widget.id || crypto.randomUUID(),
          }))
      : fallback.widgets;

    return {
      appName: typeof parsed.appName === 'string' && parsed.appName.trim().length > 0 ? parsed.appName : fallback.appName,
      packageId:
        typeof parsed.packageId === 'string' && parsed.packageId.trim().length > 0 ? parsed.packageId : fallback.packageId,
      targetApiBaseUrl:
        typeof parsed.targetApiBaseUrl === 'string' && parsed.targetApiBaseUrl.trim().length > 0
          ? parsed.targetApiBaseUrl
          : boardConfig.apiBaseUrl,
      widgets,
    };
  } catch {
    return fallback;
  }
}

type SortableWidgetTileProps = {
  widget: MobileWidget;
  boardConfig: BoardConfig;
  onPatchWidget: (id: string, patch: Partial<MobileWidget>) => void;
  onRemoveWidget: (id: string) => void;
};

function SortableWidgetTile({ widget, boardConfig, onPatchWidget, onRemoveWidget }: SortableWidgetTileProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: widget.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.74 : 1,
  };

  const outputPins = boardConfig.pins.filter((pin) => pin.mode === 'OUTPUT' || pin.mode === 'PWM');

  return (
    <article className="widget-tile" ref={setNodeRef} style={style}>
      <div className="widget-tile-head">
        <button className="widget-grip" type="button" {...attributes} {...listeners}>
          Drag
        </button>
        <span className="widget-kind">{widgetLabels[widget.kind]}</span>
        <button className="danger-button" onClick={() => onRemoveWidget(widget.id)} type="button">
          Remove
        </button>
      </div>

      <div className="widget-stack">
        <label>
          <span>Widget title</span>
          <input value={widget.title} onChange={(event) => onPatchWidget(widget.id, { title: event.target.value })} />
        </label>

        {(widget.kind === 'toggle' || widget.kind === 'button' || widget.kind === 'slider') && (
          <label>
            <span>GPIO target</span>
            <select
              value={widget.pin ?? ''}
              onChange={(event) =>
                onPatchWidget(widget.id, {
                  pin: event.target.value === '' ? undefined : Number(event.target.value),
                })
              }
            >
              <option value="">Choose output pin</option>
              {outputPins.map((pin) => (
                <option key={pin.id} value={pin.pin}>
                  {pin.label} (GPIO {pin.pin})
                </option>
              ))}
            </select>
          </label>
        )}

        {widget.kind === 'button' && (
          <label>
            <span>Button value</span>
            <input
              type="number"
              min={0}
              max={255}
              value={widget.actionValue ?? 1}
              onChange={(event) => onPatchWidget(widget.id, { actionValue: Number(event.target.value) })}
            />
          </label>
        )}

        {widget.kind === 'slider' && (
          <div className="grid two-up compact-grid">
            <label>
              <span>Min</span>
              <input
                type="number"
                min={0}
                max={255}
                value={widget.min ?? 0}
                onChange={(event) => onPatchWidget(widget.id, { min: Number(event.target.value) })}
              />
            </label>
            <label>
              <span>Max</span>
              <input
                type="number"
                min={0}
                max={255}
                value={widget.max ?? 255}
                onChange={(event) => onPatchWidget(widget.id, { max: Number(event.target.value) })}
              />
            </label>
          </div>
        )}
      </div>
    </article>
  );
}

export function MobileAppStudio({ config, status, logs, connectionState, onTogglePin }: MobileAppStudioProps) {
  const [studioConfig, setStudioConfig] = useState<MobileStudioConfig>(() => loadStudioConfig(config));
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  useEffect(() => {
    setStudioConfig((current) => {
      if (current.widgets.length > 0) {
        return current;
      }
      return defaultStudioConfig(config);
    });
  }, [config]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(studioConfig));
  }, [studioConfig]);

  const statusByPin = useMemo(() => {
    const map = new Map<number, number>();
    (status.pins ?? []).forEach((entry) => {
      map.set(entry.pin, entry.value);
    });
    return map;
  }, [status.pins]);

  const patchWidget = (id: string, patch: Partial<MobileWidget>) => {
    setStudioConfig((current) => ({
      ...current,
      widgets: current.widgets.map((widget) => (widget.id === id ? { ...widget, ...patch } : widget)),
    }));
  };

  const removeWidget = (id: string) => {
    setStudioConfig((current) => ({
      ...current,
      widgets: current.widgets.filter((widget) => widget.id !== id),
    }));
  };

  const addWidget = (kind: MobileWidgetKind) => {
    setStudioConfig((current) => ({
      ...current,
      widgets: [...current.widgets, createWidget(kind, config)],
    }));
  };

  const onDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) {
      return;
    }

    setStudioConfig((current) => {
      const oldIndex = current.widgets.findIndex((widget) => widget.id === active.id);
      const newIndex = current.widgets.findIndex((widget) => widget.id === over.id);

      if (oldIndex < 0 || newIndex < 0) {
        return current;
      }

      return {
        ...current,
        widgets: arrayMove(current.widgets, oldIndex, newIndex),
      };
    });
  };

  const exportLayoutJson = () => {
    const payload = {
      generatedAt: new Date().toISOString(),
      ...studioConfig,
      widgets: studioConfig.widgets.map((widget, order) => ({
        order,
        ...widget,
      })),
    };

    const blob = new Blob([`${JSON.stringify(payload, null, 2)}\n`], { type: 'application/json;charset=utf-8' });
    const url = window.URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'asar-mobile-app-layout.json';
    anchor.click();
    window.URL.revokeObjectURL(url);
  };

  const downloadApkBuildGuide = () => {
    const text = [
      'ASAR Mobile APK Build Guide',
      '',
      `App Name: ${studioConfig.appName}`,
      `Package ID: ${studioConfig.packageId}`,
      `Target ESP URL: ${studioConfig.targetApiBaseUrl}`,
      '',
      'Run one of these commands in the project root:',
      'PowerShell: .\\quick-build-package-apk.ps1',
      'CMD: quick-build-package-apk.bat',
      '',
      'APK output:',
      'package/mobile-app/apk/ASAR-Control-Studio-debug.apk',
      '',
      'After install on phone:',
      '1) Open ASAR Control Studio app',
      '2) Set ESP base URL to your board IP',
      '3) Use mobile studio widgets to control GPIO',
    ].join('\n');

    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = window.URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'asar-apk-build-guide.txt';
    anchor.click();
    window.URL.revokeObjectURL(url);
  };

  const copyApkCommand = async () => {
    const command = '.\\quick-build-package-apk.ps1';
    try {
      await navigator.clipboard.writeText(command);
    } catch {
      // Clipboard may be blocked in insecure contexts; ignore silently.
    }
  };

  const autoGenerateWidgets = () => {
    setStudioConfig((current) => ({
      ...current,
      targetApiBaseUrl: config.apiBaseUrl,
      widgets: generateWidgetsFromBoard(config),
    }));
  };

  const exportBlynkBlueprint = () => {
    const pinToVPin = new Map<number, number>();
    config.pins.forEach((pin) => {
      if (typeof pin.blynkVPin === 'number' && pin.blynkVPin >= 0) {
        pinToVPin.set(pin.pin, pin.blynkVPin);
      }
    });

    const datastreams = config.pins
      .filter((pin) => typeof pin.blynkVPin === 'number' && pin.blynkVPin >= 0)
      .map((pin) => {
        const isOutput = pin.mode === 'OUTPUT' || pin.mode === 'PWM';
        const min = pin.mode === 'PWM' ? 0 : pin.mode === 'ANALOG' ? 0 : 0;
        const max = pin.mode === 'PWM' ? 255 : pin.mode === 'ANALOG' ? 4095 : 1;

        return {
          pin: `V${pin.blynkVPin}`,
          gpio: pin.pin,
          label: pin.label,
          mode: pin.mode,
          direction: isOutput ? 'client_to_device' : 'device_to_client',
          min,
          max,
          dataType: 'integer',
        };
      });

    const widgetBindings = studioConfig.widgets
      .filter((widget) => widget.pin !== undefined)
      .map((widget) => ({
        title: widget.title,
        kind: widget.kind,
        gpio: widget.pin,
        blynkPin: widget.pin !== undefined ? pinToVPin.get(widget.pin) : undefined,
      }));

    const payload = {
      generatedAt: new Date().toISOString(),
      projectName: config.projectName,
      mobileUi: {
        appName: studioConfig.appName,
        packageId: studioConfig.packageId,
        targetApiBaseUrl: studioConfig.targetApiBaseUrl,
        widgets: studioConfig.widgets,
      },
      blynk: {
        enabled: config.enableBlynk,
        templateId: config.blynkTemplateId,
        templateName: sanitizeTemplateName(config.blynkTemplateName || config.projectName),
        authToken: config.blynkAuthToken,
        cloudServer: config.blynkServer,
        cloudPort: config.blynkPort,
        heartbeatMs: config.blynkHeartbeatMs,
        datastreams,
      },
      widgetBindings,
      setupSteps: [
        'Open Blynk Console and create/edit template using templateName.',
        'Create datastreams listed in blynk.datastreams.',
        'Use the same Template ID and Auth Token in ASAR board profile.',
        'Flash the generated sketch and test from Blynk app/dashboard.',
      ],
    };

    const blob = new Blob([`${JSON.stringify(payload, null, 2)}\n`], { type: 'application/json;charset=utf-8' });
    const url = window.URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'asar-blynk-ui-config-blueprint.json';
    anchor.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <section className="panel stack-lg">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Mobile App Studio</p>
          <h2>Drag, drop, and build your phone controls</h2>
        </div>
        <div className="hero-chips">
          <span>{studioConfig.widgets.length} widgets</span>
          <span>{connectionState}</span>
        </div>
      </div>

      <div className="grid two-up compact-grid">
        <label>
          <span>Mobile app name</span>
          <input
            value={studioConfig.appName}
            onChange={(event) => setStudioConfig((current) => ({ ...current, appName: event.target.value }))}
          />
        </label>
        <label>
          <span>Package id</span>
          <input
            value={studioConfig.packageId}
            onChange={(event) => setStudioConfig((current) => ({ ...current, packageId: event.target.value }))}
          />
        </label>
        <label style={{ gridColumn: '1 / -1' }}>
          <span>Target ESP base URL for mobile app</span>
          <input
            value={studioConfig.targetApiBaseUrl}
            onChange={(event) =>
              setStudioConfig((current) => ({
                ...current,
                targetApiBaseUrl: event.target.value,
              }))
            }
          />
        </label>
      </div>

      <div className="widget-palette">
        <button className="primary-button" onClick={autoGenerateWidgets} type="button">
          Auto-generate widgets from GPIO
        </button>
        <button className="ghost-button small" onClick={() => addWidget('toggle')} type="button">
          Add toggle
        </button>
        <button className="ghost-button small" onClick={() => addWidget('button')} type="button">
          Add button
        </button>
        <button className="ghost-button small" onClick={() => addWidget('slider')} type="button">
          Add slider
        </button>
        <button className="ghost-button small" onClick={() => addWidget('status')} type="button">
          Add status
        </button>
        <button className="ghost-button small" onClick={() => addWidget('logs')} type="button">
          Add logs
        </button>
      </div>

      <div className="grid two-up">
        <div className="stack-md">
          <div className="section-head">
            <div>
              <p className="eyebrow">Widget Layout</p>
              <h3>Drag cards to reorder</h3>
            </div>
          </div>

          <DndContext collisionDetection={closestCenter} sensors={sensors} onDragEnd={onDragEnd}>
            <SortableContext items={studioConfig.widgets.map((widget) => widget.id)} strategy={verticalListSortingStrategy}>
              <div className="widget-stack">
                {studioConfig.widgets.map((widget) => (
                  <SortableWidgetTile
                    key={widget.id}
                    widget={widget}
                    boardConfig={config}
                    onPatchWidget={patchWidget}
                    onRemoveWidget={removeWidget}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        </div>

        <div className="stack-md">
          <div className="section-head">
            <div>
              <p className="eyebrow">Phone Preview</p>
              <h3>Installed APK behavior</h3>
            </div>
          </div>

          <div className="dashboard-grid">
            {studioConfig.widgets.map((widget) => {
              if (widget.kind === 'status') {
                return (
                  <article className="dashboard-widget accent-ice" key={widget.id}>
                    <span className="widget-kind">Status</span>
                    <strong>{widget.title}</strong>
                    <p className="widget-meta">Connectivity: {connectionState}</p>
                    <p className="widget-meta">IP: {status.ip ?? 'Unknown'}</p>
                    <p className="widget-meta">RSSI: {status.rssi !== undefined ? `${status.rssi} dBm` : '--'}</p>
                  </article>
                );
              }

              if (widget.kind === 'logs') {
                return (
                  <article className="dashboard-widget accent-cyan" key={widget.id}>
                    <span className="widget-kind">Logs</span>
                    <strong>{widget.title}</strong>
                    <div className="widget-log-list">
                      {logs.slice(0, 3).map((log) => (
                        <div key={log.id}>
                          <span>{log.level}</span>
                          <p>{log.message}</p>
                        </div>
                      ))}
                    </div>
                  </article>
                );
              }

              const pin = widget.pin;
              const liveValue = pin !== undefined ? statusByPin.get(pin) ?? 0 : 0;

              if (widget.kind === 'button') {
                return (
                  <article className="dashboard-widget accent-amber" key={widget.id}>
                    <span className="widget-kind">Button</span>
                    <strong>{widget.title}</strong>
                    <p className="widget-meta">GPIO: {pin ?? 'not assigned'}</p>
                    <button
                      className="action-button"
                      type="button"
                      onClick={() => {
                        if (pin === undefined) {
                          return;
                        }
                        onTogglePin(pin, widget.actionValue ?? 1);
                      }}
                    >
                      Send {widget.actionValue ?? 1}
                    </button>
                  </article>
                );
              }

              if (widget.kind === 'slider') {
                const min = Math.min(widget.min ?? 0, widget.max ?? 255);
                const max = Math.max(widget.min ?? 0, widget.max ?? 255);
                return (
                  <article className="dashboard-widget accent-lime" key={widget.id}>
                    <span className="widget-kind">Slider</span>
                    <strong>{widget.title}</strong>
                    <p className="widget-meta">GPIO: {pin ?? 'not assigned'}</p>
                    <input
                      type="range"
                      min={min}
                      max={max}
                      value={Math.min(max, Math.max(min, liveValue))}
                      onChange={(event) => {
                        if (pin === undefined) {
                          return;
                        }
                        onTogglePin(pin, Number(event.target.value));
                      }}
                    />
                    <p className="widget-meta">Value: {liveValue}</p>
                  </article>
                );
              }

              return (
                <article className="dashboard-widget accent-rose" key={widget.id}>
                  <span className="widget-kind">Toggle</span>
                  <strong>{widget.title}</strong>
                  <p className="widget-meta">GPIO: {pin ?? 'not assigned'}</p>
                  <button
                    className="action-button"
                    type="button"
                    onClick={() => {
                      if (pin === undefined) {
                        return;
                      }
                      onTogglePin(pin, liveValue > 0 ? 0 : 1);
                    }}
                  >
                    {liveValue > 0 ? 'Turn off' : 'Turn on'}
                  </button>
                </article>
              );
            })}
          </div>
        </div>
      </div>

      <div className="widget-palette">
        <button className="primary-button" onClick={exportLayoutJson} type="button">
          Export mobile layout JSON
        </button>
        <button className="ghost-button" onClick={exportBlynkBlueprint} type="button">
          Export Blynk UI + config blueprint
        </button>
        <button className="ghost-button" onClick={downloadApkBuildGuide} type="button">
          Export APK build guide
        </button>
        <button className="ghost-button" onClick={() => void copyApkCommand()} type="button">
          Copy APK build command
        </button>
      </div>
    </section>
  );
}
