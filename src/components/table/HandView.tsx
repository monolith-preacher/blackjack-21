import { evaluateHand, formatHandValue, isTwoCardTwentyOne, type Card, type Outcome, type PlayerHand } from '../../engine';
import { formatSigned } from '../../utils/format';
import { PlayingCard, tiltFor } from '../cards/PlayingCard';
import { ChipStack } from '../chips/ChipStack';

interface CardsProps {
  cards: Card[];
  /** Index of a card to render face down (the dealer's hole card). */
  hiddenIndex?: number;
}

function CardRow({ cards, hiddenIndex }: CardsProps) {
  return (
    <div className="hand-cards" style={{ '--n': cards.length } as React.CSSProperties}>
      {cards.map((card, i) => (
        <PlayingCard key={card.id} card={card} index={i} count={cards.length} faceDown={i === hiddenIndex} tilt={tiltFor(card.id)} />
      ))}
    </div>
  );
}

interface BadgeProps {
  cards: Card[];
  final: boolean;
  natural?: boolean;
}

function ValueBadge({ cards, final, natural }: BadgeProps) {
  if (cards.length === 0) return <div className="value-badge is-empty" />;
  const { total } = evaluateHand(cards);
  const state = natural ? 'is-blackjack' : total > 21 ? 'is-bust' : total === 21 ? 'is-21' : '';
  return (
    <div className={`value-badge ${state}`} aria-label={`Total ${total}`}>
      {natural ? 'BJ' : formatHandValue(cards, final)}
    </div>
  );
}

interface DealerProps {
  cards: Card[];
  holeRevealed: boolean;
}

export function DealerHandView({ cards, holeRevealed }: DealerProps) {
  const visible = holeRevealed ? cards : cards.slice(0, 1);
  return (
    <div className="hand hand--dealer">
      <CardRow cards={cards} hiddenIndex={holeRevealed ? undefined : 1} />
      <ValueBadge cards={visible} final={holeRevealed} natural={holeRevealed && isTwoCardTwentyOne(cards)} />
    </div>
  );
}

const OUTCOME_LABEL: Record<Outcome, string> = {
  blackjack: 'Blackjack!',
  win: 'Vitória',
  push: 'Empate',
  lose: 'Derrota',
  bust: 'Estourou',
};

interface PlayerProps {
  hand: PlayerHand;
  active: boolean;
  multi: boolean;
  settled: boolean;
}

export function PlayerHandView({ hand, active, multi, settled }: PlayerProps) {
  const outcome = settled ? hand.outcome : undefined;
  const winnings = outcome && hand.payout ? hand.payout - hand.bet : 0;
  const busted = hand.status === 'bust';
  const classes = [
    'hand',
    'hand--player',
    active && multi ? 'is-active' : '',
    busted ? 'is-bust' : '',
    outcome ? `outcome-${outcome}` : '',
    multi && !active && !settled ? 'is-waiting' : '',
  ].join(' ');

  return (
    <div className={classes}>
      {active && multi && !settled && <div className="active-marker" aria-hidden="true" />}
      <div className="hand-cards-wrap">
        <CardRow cards={hand.cards} />
        {outcome && (
          <div className={`outcome-badge outcome-badge--${outcome}`}>
            <span>{OUTCOME_LABEL[outcome]}</span>
            {outcome !== 'push' && <small>{formatSigned((hand.payout ?? 0) - hand.bet)}</small>}
          </div>
        )}
        {!outcome && busted && <div className="outcome-badge outcome-badge--bust"><span>Estourou</span></div>}
      </div>
      <div className="hand-footer">
        <ValueBadge cards={hand.cards} final={hand.status !== 'playing'} natural={hand.status === 'blackjack'} />
        <div className="hand-bets">
          <ChipStack
            amount={hand.bet}
            className={outcome === 'lose' || outcome === 'bust' ? 'stack--lost' : outcome === 'push' ? 'stack--push' : ''}
          />
          {winnings > 0 && <ChipStack amount={winnings} className="stack--payout" />}
          {hand.doubled && <span className="hand-tag">x2</span>}
        </div>
      </div>
    </div>
  );
}
