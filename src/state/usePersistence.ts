import { useCallback, useEffect, useState } from 'react';
import type { RoundSummary } from '../engine';
import { DEFAULT_SETTINGS, sanitizeSettings, type Settings } from './settings';
import { addToHistory, EMPTY_STATS, recordRound, type HistoryEntry, type Stats } from './stats';
import { isHistory, isStats, loadJSON, saveJSON, STORAGE_KEYS } from './storage';

export function useSettings() {
  const [settings, setSettings] = useState<Settings>(() =>
    sanitizeSettings(loadJSON(STORAGE_KEYS.settings, (v): v is unknown => v !== null) ?? DEFAULT_SETTINGS),
  );
  useEffect(() => saveJSON(STORAGE_KEYS.settings, settings), [settings]);
  const update = useCallback((patch: Partial<Settings>) => setSettings((s) => ({ ...s, ...patch })), []);
  return [settings, update] as const;
}

export function useStats() {
  const [stats, setStats] = useState<Stats>(() => ({ ...EMPTY_STATS, ...loadJSON(STORAGE_KEYS.stats, isStats) }));
  const [history, setHistory] = useState<HistoryEntry[]>(() => loadJSON(STORAGE_KEYS.history, isHistory) ?? []);

  useEffect(() => saveJSON(STORAGE_KEYS.stats, stats), [stats]);
  useEffect(() => saveJSON(STORAGE_KEYS.history, history), [history]);

  const record = useCallback((summary: RoundSummary) => {
    setStats((s) => recordRound(s, summary));
    setHistory((h) => addToHistory(h, summary));
  }, []);
  const recordRefill = useCallback(() => setStats((s) => ({ ...s, refills: s.refills + 1 })), []);
  const reset = useCallback(() => {
    setStats(EMPTY_STATS);
    setHistory([]);
  }, []);

  return { stats, history, record, recordRefill, reset };
}
