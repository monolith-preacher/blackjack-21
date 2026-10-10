import { evaluateHand, pendingTotal, rankValue, type GameState } from '../../engine';
import { formatAmount } from '../../utils/format';

export interface TableMessage {
  title: string;
  detail?: string;
  tone?: 'neutral' | 'gold' | 'info' | 'danger';
}

function upCardLabel(s: GameState): string {
  const up = s.dealer.cards[0];
  if (!up) return '';
  return up.rank === 'A' ? 'Ás' : String(rankValue(up.rank));
}

/** Contextual line shown in the middle of the felt, derived purely from game state. */
export function tableMessage(s: GameState, hints: boolean): TableMessage | null {
  const e = s.lastEvent;
  switch (s.phase) {
    case 'betting': {
      const bet = pendingTotal(s);
      if (s.balance < s.rules.minBet) return { title: 'Sem fichas suficientes', detail: 'Recarregue seu saldo virtual para continuar', tone: 'danger' };
      if (bet === 0) {
        return {
          title: 'Faça sua aposta',
          detail: hints ? `Clique nas fichas · mínimo ${formatAmount(s.rules.minBet)} · máximo ${formatAmount(s.rules.maxBet)}` : undefined,
        };
      }
      if (bet < s.rules.minBet) return { title: `Aposta: ${formatAmount(bet)}`, detail: `Mínimo da mesa: ${formatAmount(s.rules.minBet)}` };
      return { title: `Aposta: ${formatAmount(bet)}`, detail: hints ? 'Pressione Distribuir (Enter) quando estiver pronto' : undefined, tone: 'gold' };
    }
    case 'dealing':
      if (e?.type === 'roundStart' && e.reshuffled) return { title: 'Embaralhando o shoe…', detail: `${s.rules.decks} baralhos · novo corte`, tone: 'info' };
      if (e?.type === 'peek') return { title: 'Dealer verifica Blackjack…', tone: 'info' };
      if (e?.type === 'naturals' && e.playerBlackjack) return { title: 'Blackjack!', tone: 'gold' };
      return { title: 'Boa sorte!' };
    case 'playerTurn': {
      const hand = s.hands[s.activeHand];
      if (!hand) return null;
      if (hand.cards.length < 2) return { title: `Mão ${s.activeHand + 1} de ${s.hands.length}`, detail: 'Distribuindo…' };
      const { total, soft } = evaluateHand(hand.cards);
      const prefix = s.hands.length > 1 ? `Mão ${s.activeHand + 1} de ${s.hands.length} · ` : '';
      const detail =
        e?.type === 'peek' && !e.dealerBlackjack
          ? 'Dealer não tem Blackjack — sua vez'
          : hints
            ? `Você tem ${soft ? 'soft ' : ''}${total} contra ${upCardLabel(s)} do dealer`
            : undefined;
      return { title: `${prefix}Sua vez`, detail };
    }
    case 'dealerTurn': {
      if (e?.type === 'peek' && e.dealerBlackjack) return { title: 'Dealer tem Blackjack!', tone: 'danger' };
      if (e?.type === 'naturals') return { title: 'Blackjack!', tone: 'gold' };
      if (!s.dealer.holeRevealed) return { title: 'Vez do dealer' };
      const { total } = evaluateHand(s.dealer.cards);
      if (total > 21) return { title: `Dealer estourou com ${total}!`, tone: 'gold' };
      return { title: e?.type === 'reveal' ? `Dealer revela: ${total}` : `Dealer compra… ${total}`, tone: 'info' };
    }
    case 'settled':
      return null;
  }
}
