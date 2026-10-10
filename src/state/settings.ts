export type AnimationSpeed = 'slow' | 'normal' | 'fast';

export interface Settings {
  soundEnabled: boolean;
  /** Master volume, 0–1. */
  volume: number;
  speed: AnimationSpeed;
  /** Show the dealer's peek / hints / hand totals messages. */
  showHints: boolean;
}

export const DEFAULT_SETTINGS: Settings = {
  soundEnabled: true,
  volume: 0.6,
  speed: 'normal',
  showHints: true,
};

/** Multiplier applied to every animation duration and table delay. */
export const SPEED_FACTOR: Record<AnimationSpeed, number> = {
  slow: 1.45,
  normal: 1,
  fast: 0.55,
};

export const SPEED_LABEL: Record<AnimationSpeed, string> = {
  slow: 'Lenta',
  normal: 'Normal',
  fast: 'Rápida',
};

export function sanitizeSettings(v: unknown): Settings {
  const s = { ...DEFAULT_SETTINGS };
  if (typeof v !== 'object' || v === null) return s;
  const o = v as Record<string, unknown>;
  if (typeof o.soundEnabled === 'boolean') s.soundEnabled = o.soundEnabled;
  if (typeof o.volume === 'number' && Number.isFinite(o.volume)) s.volume = Math.min(1, Math.max(0, o.volume));
  if (o.speed === 'slow' || o.speed === 'normal' || o.speed === 'fast') s.speed = o.speed;
  if (typeof o.showHints === 'boolean') s.showHints = o.showHints;
  return s;
}
