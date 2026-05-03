import type { BoardConfig, PinDefinition } from '../types';

const STORAGE_KEYS = ['asar-control-studio:v2', 'asar-control-studio'] as const;

function clonePins(pins: PinDefinition[]): PinDefinition[] {
  return pins.map((pin) => ({ ...pin, id: pin.id || crypto.randomUUID() }));
}

function normalizeConfig(fallback: BoardConfig, candidate: unknown): BoardConfig {
  if (!candidate || typeof candidate !== 'object') {
    return fallback;
  }

  const source = candidate as Partial<BoardConfig>;
  const pins = Array.isArray(source.pins) ? clonePins(source.pins as PinDefinition[]) : clonePins(fallback.pins);

  return {
    ...fallback,
    ...source,
    pins,
  };
}

function isBoardConfig(value: unknown): value is BoardConfig {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const candidate = value as Partial<BoardConfig>;
  return Array.isArray(candidate.pins) && typeof candidate.projectName === 'string';
}

export function loadConfig<T>(fallback: T): T {
  if (typeof window === 'undefined') {
    return fallback;
  }

  try {
    const raw = STORAGE_KEYS.map((key) => window.localStorage.getItem(key)).find((value) => Boolean(value));

    if (!raw) {
      return fallback;
    }

    if (isBoardConfig(fallback)) {
      return normalizeConfig(fallback, JSON.parse(raw)) as T;
    }

    return { ...fallback, ...JSON.parse(raw) } as T;
  } catch {
    return fallback;
  }
}

export function saveConfig(config: BoardConfig) {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    const payload = JSON.stringify(config);
    window.localStorage.setItem(STORAGE_KEYS[0], payload);
    window.localStorage.setItem(STORAGE_KEYS[1], payload);
  } catch {
    // Ignore storage write failures (private mode / quotas), keep app responsive.
  }
}