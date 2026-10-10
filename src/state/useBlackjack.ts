import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import {
  addChip,
  advance,
  availableActions,
  canDeal,
  canDoubleBet,
  canRebet,
  clearBet,
  createGame,
  double,
  doubleBet,
  GameError,
  hit,
  isBroke,
  needsAdvance,
  newRound,
  rebet,
  refill,
  split,
  stand,
  startRound,
  undoChip,
  type ChipValue,
  type GameEvent,
  type GameState,
} from '../engine';
import { isGameState, loadJSON, saveJSON, STORAGE_KEYS } from './storage';

export interface ControllerOptions {
  /** Animation speed multiplier (1 = normal). */
  speed: number;
  /** Called after every committed transition, e.g. for sounds and statistics. */
  onEvent: (event: GameEvent, state: GameState) => void;
  /** Called when an action is rejected (invalid or attempted during an animation). */
  onRejected?: () => void;
}

/** Base pause (ms, at normal speed) after each event before the table continues. */
function delayAfter(e: GameEvent | null, s: GameState): number {
  if (!e) return 0;
  switch (e.type) {
    case 'roundStart':
      return e.reshuffled ? 1150 : 250;
    case 'deal':
      return s.phase === 'dealerTurn' ? 780 : 470;
    case 'peek':
      return 1000;
    case 'naturals':
      return 650;
    case 'reveal':
      return 800;
    case 'hit':
      return 420;
    case 'double':
      return 650;
    case 'split':
      return 600;
    case 'stand':
      return 250;
    default:
      return 0;
  }
}

const COLLECT_MS = 520;

function initialGame(): GameState {
  return loadJSON(STORAGE_KEYS.game, isGameState) ?? createGame();
}

/**
 * Drives the pure engine with timing. Every table step is committed separately and followed
 * by a pause so the UI can animate it. A lock prevents overlapping actions: input received
 * while the table is busy is rejected instead of queued, so the balance can never be touched
 * by two transitions at once.
 */
export function useBlackjack(options: ControllerOptions) {
  const [game, setGame] = useState<GameState>(initialGame);
  const [busy, setBusy] = useState(false);
  const [collecting, setCollecting] = useState(false);
  const gameRef = useRef(game);
  const busyRef = useRef(false);
  /** Incremented on reset so any in-flight sequence stops committing. */
  const epochRef = useRef(0);
  const optsRef = useRef(options);
  useLayoutEffect(() => {
    optsRef.current = options;
  });

  const sleep = useCallback(
    (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, Math.round(ms * optsRef.current.speed))),
    [],
  );

  const commit = useCallback((s: GameState) => {
    gameRef.current = s;
    setGame(s);
    saveJSON(STORAGE_KEYS.game, s);
    if (s.lastEvent) optsRef.current.onEvent(s.lastEvent, s);
  }, []);

  const reject = useCallback(() => optsRef.current.onRejected?.(), []);

  /** Runs automatic table steps (dealing, dealer play, settlement) one at a time. */
  const autoPlay = useCallback(
    async (epoch: number) => {
      let s = gameRef.current;
      while (needsAdvance(s)) {
        if (epoch !== epochRef.current) return;
        s = advance(s);
        commit(s);
        await sleep(delayAfter(s.lastEvent, s));
      }
    },
    [commit, sleep],
  );

  const locked = useCallback(
    async (task: (epoch: number) => Promise<void>) => {
      if (busyRef.current) {
        reject();
        return;
      }
      const epoch = epochRef.current;
      busyRef.current = true;
      setBusy(true);
      try {
        await task(epoch);
      } catch (err) {
        if (err instanceof GameError) reject();
        else throw err;
      } finally {
        if (epoch === epochRef.current) {
          busyRef.current = false;
          setBusy(false);
        }
      }
    },
    [reject],
  );

  /** Applies a player decision, then lets the table play out whatever follows. */
  const act = useCallback(
    (fn: (s: GameState) => GameState) =>
      locked(async (epoch) => {
        const s = fn(gameRef.current);
        commit(s);
        await sleep(delayAfter(s.lastEvent, s));
        await autoPlay(epoch);
      }),
    [locked, commit, sleep, autoPlay],
  );

  /** Instant betting changes (no animation lock needed, but refused while busy). */
  const instant = useCallback(
    (fn: (s: GameState) => GameState) => {
      if (busyRef.current) return reject();
      try {
        commit(fn(gameRef.current));
      } catch (err) {
        if (err instanceof GameError) reject();
        else throw err;
      }
    },
    [commit, reject],
  );

  const clearTable = useCallback(
    async (epoch: number) => {
      setCollecting(true);
      await sleep(COLLECT_MS);
      setCollecting(false);
      if (epoch !== epochRef.current) return;
      commit(newRound(gameRef.current));
    },
    [commit, sleep],
  );

  // Resume an interrupted round after a page reload.
  useEffect(() => {
    if (needsAdvance(gameRef.current) && !busyRef.current) void locked(autoPlay);
  }, [locked, autoPlay]);

  const actions = {
    addChip: (v: ChipValue) => instant((s) => addChip(s, v)),
    undoChip: () => instant(undoChip),
    clearBet: () => instant(clearBet),
    rebet: () => instant(rebet),
    doubleBet: () => instant(doubleBet),
    refill: () => instant(refill),
    deal: () => act((s) => startRound(s)),
    hit: () => act((s) => hit(s)),
    stand: () => act(stand),
    double: () => act((s) => double(s)),
    split: () => act(split),
    nextRound: () => locked(clearTable),
    /** Clears the table, repeats the previous bet and deals immediately. */
    rebetAndDeal: () =>
      locked(async (epoch) => {
        await clearTable(epoch);
        if (epoch !== epochRef.current) return;
        if (!canRebet(gameRef.current)) return;
        commit(rebet(gameRef.current));
        const s = startRound(gameRef.current);
        commit(s);
        await sleep(delayAfter(s.lastEvent, s));
        await autoPlay(epoch);
      }),
    /** Starts over with a fresh shoe and the starting balance. */
    resetGame: () => {
      epochRef.current++;
      busyRef.current = false;
      setBusy(false);
      setCollecting(false);
      commit({ ...createGame({ rules: gameRef.current.rules }), lastEvent: { type: 'newRound' } });
    },
  };

  const settledRebetPossible =
    game.phase === 'settled' && game.lastBet > 0 && game.lastBet <= game.balance && game.lastBet <= game.rules.maxBet;

  return {
    game,
    busy,
    collecting,
    actions,
    can: {
      ...availableActions(game),
      deal: canDeal(game),
      rebet: canRebet(game),
      doubleBet: canDoubleBet(game),
      rebetAndDeal: settledRebetPossible,
      refill: isBroke(game),
    },
  };
}

export type BlackjackController = ReturnType<typeof useBlackjack>;
