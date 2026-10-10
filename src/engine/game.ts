import { chipsForAmount, type ChipValue } from './chips';
import { evaluateHand, isTenValue, isTwoCardTwentyOne, rankValue } from './hand';
import { createRules, type Rules } from './rules';
import { createShoe, cryptoRng, needsReshuffle, type Shoe } from './shoe';
import type { Card, Rng } from './types';

/*
 * The game is a pure state machine. Every exported transition takes a GameState and returns a
 * new one (inputs are never mutated). Player decisions are explicit calls (hit, stand, ...);
 * everything the table does on its own (dealing, the dealer's play, settlement) happens one
 * atomic step at a time through `advance`, so the UI can animate each step individually.
 */

export type Phase = 'betting' | 'dealing' | 'playerTurn' | 'dealerTurn' | 'settled';
export type HandStatus = 'playing' | 'stood' | 'bust' | 'blackjack';
export type Outcome = 'blackjack' | 'win' | 'push' | 'lose' | 'bust';

export interface PlayerHand {
  id: string;
  cards: Card[];
  bet: number;
  status: HandStatus;
  doubled: boolean;
  fromSplit: boolean;
  splitAces: boolean;
  outcome?: Outcome;
  /** Total returned to the balance at settlement (stake + winnings), 0 for a loss. */
  payout?: number;
}

export interface DealerHand {
  cards: Card[];
  holeRevealed: boolean;
}

export interface HandResult {
  outcome: Outcome;
  bet: number;
  payout: number;
  total: number;
  doubled: boolean;
}

export interface RoundSummary {
  roundId: number;
  hands: HandResult[];
  dealerTotal: number;
  dealerBust: boolean;
  dealerBlackjack: boolean;
  splits: number;
  totalBet: number;
  totalPayout: number;
  /** Payout minus everything wagered this round. */
  net: number;
  balanceAfter: number;
}

export type GameEvent =
  | { type: 'betChanged' }
  | { type: 'roundStart'; reshuffled: boolean }
  | { type: 'deal'; to: 'player' | 'dealer'; handIndex: number; faceDown: boolean }
  | { type: 'peek'; dealerBlackjack: boolean }
  | { type: 'naturals'; playerBlackjack: boolean; dealerBlackjack: boolean }
  | { type: 'playerTurn' }
  | { type: 'hit'; handIndex: number; bust: boolean }
  | { type: 'stand'; handIndex: number }
  | { type: 'double'; handIndex: number; bust: boolean }
  | { type: 'split'; handIndex: number }
  | { type: 'reveal' }
  | { type: 'settle'; summary: RoundSummary }
  | { type: 'newRound' }
  | { type: 'refill' };

export interface GameState {
  rules: Rules;
  phase: Phase;
  /** Chips the player can still use. Bets are deducted when placed on the table. */
  balance: number;
  /** Chips stacked in the betting circle (not yet deducted from the balance). */
  pendingBet: ChipValue[];
  /** Amount of the previous round's initial bet, for "rebet". */
  lastBet: number;
  shoe: Shoe;
  dealer: DealerHand;
  hands: PlayerHand[];
  activeHand: number;
  roundId: number;
  handSeq: number;
  lastEvent: GameEvent | null;
  result: RoundSummary | null;
}

export class GameError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'GameError';
  }
}

export interface CreateGameOptions {
  rules?: Partial<Rules>;
  balance?: number;
  shoe?: Shoe;
  rng?: Rng;
}

export function createGame(opts: CreateGameOptions = {}): GameState {
  const rules = createRules(opts.rules);
  return {
    rules,
    phase: 'betting',
    balance: opts.balance ?? rules.startingBalance,
    pendingBet: [],
    lastBet: 0,
    shoe: opts.shoe ?? createShoe(rules.decks, rules.penetration, opts.rng ?? cryptoRng),
    dealer: { cards: [], holeRevealed: false },
    hands: [],
    activeHand: 0,
    roundId: 0,
    handSeq: 0,
    lastEvent: null,
    result: null,
  };
}

// ---------------------------------------------------------------------------------------------
// Betting
// ---------------------------------------------------------------------------------------------

export function pendingTotal(s: GameState): number {
  return s.pendingBet.reduce((a, b) => a + b, 0);
}

/** Total currently at risk on the table (pending chips or active hand bets). */
export function amountOnTable(s: GameState): number {
  if (s.phase === 'betting') return pendingTotal(s);
  if (s.phase === 'settled') return 0;
  return s.hands.reduce((a, h) => a + h.bet, 0);
}

export function canAddChip(s: GameState, value: ChipValue): boolean {
  if (s.phase !== 'betting') return false;
  const next = pendingTotal(s) + value;
  return next <= s.balance && next <= s.rules.maxBet;
}

export function addChip(s: GameState, value: ChipValue): GameState {
  if (!canAddChip(s, value)) throw new GameError('Aposta inválida: saldo ou limite insuficiente.');
  return { ...s, pendingBet: [...s.pendingBet, value], lastEvent: { type: 'betChanged' } };
}

export function undoChip(s: GameState): GameState {
  if (s.phase !== 'betting' || s.pendingBet.length === 0) throw new GameError('Nada para desfazer.');
  return { ...s, pendingBet: s.pendingBet.slice(0, -1), lastEvent: { type: 'betChanged' } };
}

export function clearBet(s: GameState): GameState {
  if (s.phase !== 'betting' || s.pendingBet.length === 0) throw new GameError('Nenhuma aposta para limpar.');
  return { ...s, pendingBet: [], lastEvent: { type: 'betChanged' } };
}

export function canRebet(s: GameState): boolean {
  return (
    s.phase === 'betting' &&
    s.lastBet > 0 &&
    pendingTotal(s) !== s.lastBet &&
    s.lastBet <= s.balance &&
    s.lastBet <= s.rules.maxBet
  );
}

/** Replaces the pending bet with the previous round's bet. */
export function rebet(s: GameState): GameState {
  if (!canRebet(s)) throw new GameError('Não é possível repetir a aposta.');
  return { ...s, pendingBet: chipsForAmount(s.lastBet), lastEvent: { type: 'betChanged' } };
}

export function canDoubleBet(s: GameState): boolean {
  const total = pendingTotal(s);
  return s.phase === 'betting' && total > 0 && total * 2 <= s.balance && total * 2 <= s.rules.maxBet;
}

/** Doubles the pending bet (before dealing). */
export function doubleBet(s: GameState): GameState {
  if (!canDoubleBet(s)) throw new GameError('Não é possível dobrar a aposta.');
  return { ...s, pendingBet: [...s.pendingBet, ...s.pendingBet], lastEvent: { type: 'betChanged' } };
}

export function canDeal(s: GameState): boolean {
  const total = pendingTotal(s);
  return s.phase === 'betting' && total >= s.rules.minBet && total <= s.rules.maxBet && total <= s.balance;
}

/** The player cannot afford the table minimum and has nothing on the table. */
export function isBroke(s: GameState): boolean {
  return s.phase === 'betting' && s.balance < s.rules.minBet;
}

/** Restores the starting balance when the player has run out of chips. */
export function refill(s: GameState): GameState {
  if (!isBroke(s)) throw new GameError('Recarga disponível apenas sem saldo para apostar.');
  return { ...s, balance: s.rules.startingBalance, pendingBet: [], lastEvent: { type: 'refill' } };
}

// ---------------------------------------------------------------------------------------------
// Round flow
// ---------------------------------------------------------------------------------------------

/** Confirms the bet: deducts it, reshuffles at the cut card and starts dealing. */
export function startRound(s: GameState, rng: Rng = cryptoRng): GameState {
  if (!canDeal(s)) throw new GameError('Aposta inválida para iniciar a rodada.');
  const bet = pendingTotal(s);
  const reshuffled = needsReshuffle(s.shoe);
  const shoe = reshuffled
    ? createShoe(s.rules.decks, s.rules.penetration, rng, s.shoe.generation + 1)
    : s.shoe;
  const roundId = s.roundId + 1;
  const hand: PlayerHand = {
    id: `r${roundId}-h${s.handSeq + 1}`,
    cards: [],
    bet,
    status: 'playing',
    doubled: false,
    fromSplit: false,
    splitAces: false,
  };
  return {
    ...s,
    phase: 'dealing',
    balance: s.balance - bet,
    pendingBet: [],
    lastBet: bet,
    shoe,
    dealer: { cards: [], holeRevealed: false },
    hands: [hand],
    activeHand: 0,
    roundId,
    handSeq: s.handSeq + 1,
    lastEvent: { type: 'roundStart', reshuffled },
    result: null,
  };
}

function drawCard(shoe: Shoe, rules: Rules, rng: Rng): [Card, Shoe] {
  // Emergency reshuffle if the shoe runs dry mid-round (practically impossible with a cut card).
  const source = shoe.cards.length > 0 ? shoe : createShoe(rules.decks, rules.penetration, rng, shoe.generation + 1);
  const [card, ...rest] = source.cards;
  return [card, { ...source, cards: rest }];
}

function withHand(s: GameState, index: number, hand: PlayerHand): PlayerHand[] {
  return s.hands.map((h, i) => (i === index ? hand : h));
}

/** Moves past finished hands; when none remain, hands control to the dealer. */
function normalizeTurn(s: GameState): GameState {
  let i = s.activeHand;
  while (i < s.hands.length && s.hands[i].status !== 'playing') i++;
  if (i >= s.hands.length) return { ...s, activeHand: Math.max(0, s.hands.length - 1), phase: 'dealerTurn' };
  return { ...s, activeHand: i };
}

/** Status after a card lands: bust, automatic stand on 21, or still playing. */
function statusAfterCard(hand: PlayerHand): HandStatus {
  const { total } = evaluateHand(hand.cards);
  if (total > 21) return 'bust';
  if (total === 21) return 'stood';
  return 'playing';
}

export function dealerUpCard(s: GameState): Card | undefined {
  return s.dealer.cards[0];
}

export function dealerShouldDraw(s: GameState): boolean {
  const live = s.hands.some((h) => h.status !== 'bust' && h.status !== 'blackjack');
  if (!live) return false;
  const { total, soft } = evaluateHand(s.dealer.cards);
  if (total < 17) return true;
  return total === 17 && soft && s.rules.dealerHitsSoft17;
}

/** True while the table has an automatic step to perform (no player input needed). */
export function needsAdvance(s: GameState): boolean {
  if (s.phase === 'dealing' || s.phase === 'dealerTurn') return true;
  if (s.phase === 'playerTurn') return (s.hands[s.activeHand]?.cards.length ?? 2) < 2;
  return false;
}

/** Performs exactly one automatic step: deal one card, check naturals, reveal, draw or settle. */
export function advance(s: GameState, rng: Rng = cryptoRng): GameState {
  switch (s.phase) {
    case 'dealing':
      return advanceDealing(s, rng);
    case 'playerTurn':
      return advanceSplitHand(s, rng);
    case 'dealerTurn':
      return advanceDealer(s, rng);
    default:
      throw new GameError(`Nada a avançar na fase ${s.phase}.`);
  }
}

function advanceDealing(s: GameState, rng: Rng): GameState {
  const hand = s.hands[0];
  const dealt = hand.cards.length + s.dealer.cards.length;
  if (dealt < 4) {
    // Order: player, dealer (up), player, dealer (hole, face down).
    const [card, shoe] = drawCard(s.shoe, s.rules, rng);
    if (dealt % 2 === 0) {
      return {
        ...s,
        shoe,
        hands: withHand(s, 0, { ...hand, cards: [...hand.cards, card] }),
        lastEvent: { type: 'deal', to: 'player', handIndex: 0, faceDown: false },
      };
    }
    return {
      ...s,
      shoe,
      dealer: { ...s.dealer, cards: [...s.dealer.cards, card] },
      lastEvent: { type: 'deal', to: 'dealer', handIndex: 0, faceDown: dealt === 3 },
    };
  }

  // All four cards are out: resolve naturals and the dealer peek.
  const playerBJ = isTwoCardTwentyOne(hand.cards);
  const dealerBJ = isTwoCardTwentyOne(s.dealer.cards);
  const up = s.dealer.cards[0];
  const peeks = s.rules.dealerPeek && (up.rank === 'A' || isTenValue(up.rank));

  if (playerBJ) {
    return {
      ...s,
      hands: withHand(s, 0, { ...hand, status: 'blackjack' }),
      phase: 'dealerTurn',
      lastEvent: { type: 'naturals', playerBlackjack: true, dealerBlackjack: dealerBJ },
    };
  }
  if (peeks && dealerBJ) {
    return { ...s, phase: 'dealerTurn', lastEvent: { type: 'peek', dealerBlackjack: true } };
  }
  return {
    ...s,
    phase: 'playerTurn',
    lastEvent: peeks ? { type: 'peek', dealerBlackjack: false } : { type: 'playerTurn' },
  };
}

/** Deals the second card to a hand created by a split. */
function advanceSplitHand(s: GameState, rng: Rng): GameState {
  const index = s.activeHand;
  const hand = s.hands[index];
  if (!hand || hand.cards.length >= 2) throw new GameError('A mão ativa não precisa de carta.');
  const [card, shoe] = drawCard(s.shoe, s.rules, rng);
  const cards = [...hand.cards, card];
  let status = statusAfterCard({ ...hand, cards });
  // Split aces get exactly one card.
  if (hand.splitAces && status === 'playing') status = 'stood';
  const next: GameState = {
    ...s,
    shoe,
    hands: withHand(s, index, { ...hand, cards, status }),
    lastEvent: { type: 'deal', to: 'player', handIndex: index, faceDown: false },
  };
  return normalizeTurn(next);
}

function advanceDealer(s: GameState, rng: Rng): GameState {
  if (!s.dealer.holeRevealed) {
    return { ...s, dealer: { ...s.dealer, holeRevealed: true }, lastEvent: { type: 'reveal' } };
  }
  if (dealerShouldDraw(s)) {
    const [card, shoe] = drawCard(s.shoe, s.rules, rng);
    return {
      ...s,
      shoe,
      dealer: { ...s.dealer, cards: [...s.dealer.cards, card] },
      lastEvent: { type: 'deal', to: 'dealer', handIndex: 0, faceDown: false },
    };
  }
  return settle(s);
}

export function settleHand(hand: PlayerHand, dealerCards: readonly Card[], rules: Rules): { outcome: Outcome; payout: number } {
  const player = evaluateHand(hand.cards).total;
  const dealer = evaluateHand(dealerCards).total;
  const dealerBJ = isTwoCardTwentyOne(dealerCards);
  const bet = hand.bet;

  if (player > 21) return { outcome: 'bust', payout: 0 };
  if (hand.status === 'blackjack') {
    return dealerBJ
      ? { outcome: 'push', payout: bet }
      : { outcome: 'blackjack', payout: bet + bet * rules.blackjackPayout };
  }
  if (dealerBJ) return { outcome: 'lose', payout: 0 };
  if (dealer > 21 || player > dealer) return { outcome: 'win', payout: bet * 2 };
  if (player === dealer) return { outcome: 'push', payout: bet };
  return { outcome: 'lose', payout: 0 };
}

function settle(s: GameState): GameState {
  const hands = s.hands.map((h) => ({ ...h, ...settleHand(h, s.dealer.cards, s.rules) }));
  const totalBet = hands.reduce((a, h) => a + h.bet, 0);
  const totalPayout = hands.reduce((a, h) => a + (h.payout ?? 0), 0);
  const balance = s.balance + totalPayout;
  const dealerValue = evaluateHand(s.dealer.cards);
  const summary: RoundSummary = {
    roundId: s.roundId,
    hands: hands.map((h) => ({
      outcome: h.outcome!,
      bet: h.bet,
      payout: h.payout!,
      total: evaluateHand(h.cards).total,
      doubled: h.doubled,
    })),
    dealerTotal: dealerValue.total,
    dealerBust: dealerValue.total > 21,
    dealerBlackjack: isTwoCardTwentyOne(s.dealer.cards),
    splits: hands.length - 1,
    totalBet,
    totalPayout,
    net: totalPayout - totalBet,
    balanceAfter: balance,
  };
  return { ...s, phase: 'settled', hands, balance, result: summary, lastEvent: { type: 'settle', summary } };
}

/** Clears the table after settlement and returns to betting. */
export function newRound(s: GameState): GameState {
  if (s.phase !== 'settled') throw new GameError('A rodada ainda não terminou.');
  return {
    ...s,
    phase: 'betting',
    pendingBet: [],
    dealer: { cards: [], holeRevealed: false },
    hands: [],
    activeHand: 0,
    lastEvent: { type: 'newRound' },
  };
}

// ---------------------------------------------------------------------------------------------
// Player actions
// ---------------------------------------------------------------------------------------------

function activeForAction(s: GameState): PlayerHand | undefined {
  if (s.phase !== 'playerTurn') return undefined;
  const hand = s.hands[s.activeHand];
  if (!hand || hand.status !== 'playing' || hand.cards.length < 2) return undefined;
  return hand;
}

export function canHit(s: GameState): boolean {
  const hand = activeForAction(s);
  return !!hand && !hand.splitAces;
}

export function canStand(s: GameState): boolean {
  return !!activeForAction(s);
}

export function canDouble(s: GameState): boolean {
  const hand = activeForAction(s);
  if (!hand || hand.cards.length !== 2 || hand.splitAces) return false;
  if (hand.fromSplit && !s.rules.doubleAfterSplit) return false;
  return s.balance >= hand.bet;
}

export function canSplit(s: GameState): boolean {
  const hand = activeForAction(s);
  if (!hand || hand.cards.length !== 2 || hand.splitAces) return false;
  if (s.hands.length >= s.rules.maxHands || s.balance < hand.bet) return false;
  const [a, b] = hand.cards;
  return s.rules.splitByValue ? rankValue(a.rank) === rankValue(b.rank) : a.rank === b.rank;
}

export interface AvailableActions {
  hit: boolean;
  stand: boolean;
  double: boolean;
  split: boolean;
}

export function availableActions(s: GameState): AvailableActions {
  return { hit: canHit(s), stand: canStand(s), double: canDouble(s), split: canSplit(s) };
}

export function hit(s: GameState, rng: Rng = cryptoRng): GameState {
  if (!canHit(s)) throw new GameError('Não é possível pedir carta agora.');
  const index = s.activeHand;
  const hand = s.hands[index];
  const [card, shoe] = drawCard(s.shoe, s.rules, rng);
  const cards = [...hand.cards, card];
  const status = statusAfterCard({ ...hand, cards });
  return normalizeTurn({
    ...s,
    shoe,
    hands: withHand(s, index, { ...hand, cards, status }),
    lastEvent: { type: 'hit', handIndex: index, bust: status === 'bust' },
  });
}

export function stand(s: GameState): GameState {
  if (!canStand(s)) throw new GameError('Não é possível parar agora.');
  const index = s.activeHand;
  return normalizeTurn({
    ...s,
    hands: withHand(s, index, { ...s.hands[index], status: 'stood' }),
    lastEvent: { type: 'stand', handIndex: index },
  });
}

/** Doubles the hand's bet, deals exactly one more card and ends the hand. */
export function double(s: GameState, rng: Rng = cryptoRng): GameState {
  if (!canDouble(s)) throw new GameError('Não é possível dobrar agora.');
  const index = s.activeHand;
  const hand = s.hands[index];
  const [card, shoe] = drawCard(s.shoe, s.rules, rng);
  const cards = [...hand.cards, card];
  const bust = evaluateHand(cards).total > 21;
  return normalizeTurn({
    ...s,
    shoe,
    balance: s.balance - hand.bet,
    hands: withHand(s, index, { ...hand, cards, bet: hand.bet * 2, doubled: true, status: bust ? 'bust' : 'stood' }),
    lastEvent: { type: 'double', handIndex: index, bust },
  });
}

/** Splits a pair into two hands with equal bets. Each hand then receives a second card in turn. */
export function split(s: GameState): GameState {
  if (!canSplit(s)) throw new GameError('Não é possível dividir agora.');
  const index = s.activeHand;
  const hand = s.hands[index];
  const aces = hand.cards[0].rank === 'A';
  const make = (card: Card, seq: number): PlayerHand => ({
    id: `r${s.roundId}-h${seq}`,
    cards: [card],
    bet: hand.bet,
    status: 'playing',
    doubled: false,
    fromSplit: true,
    splitAces: aces,
  });
  const first = make(hand.cards[0], s.handSeq + 1);
  const second = make(hand.cards[1], s.handSeq + 2);
  const hands = [...s.hands.slice(0, index), first, second, ...s.hands.slice(index + 1)];
  return {
    ...s,
    balance: s.balance - hand.bet,
    hands,
    handSeq: s.handSeq + 2,
    lastEvent: { type: 'split', handIndex: index },
  };
}
