import { useRef } from 'react';
import type { GameState } from '../../engine';
import { useTableSizing } from '../../hooks/useTableSizing';
import { DealerHandView, PlayerHandView } from './HandView';
import { tableMessage } from './messages';
import { ResultBanner } from './ResultBanner';
import { BetSpot, DiscardTray, FeltPrint, ShoeView } from './TableProps';

interface Props {
  game: GameState;
  collecting: boolean;
  hints: boolean;
}

export function Table({ game, collecting, hints }: Props) {
  const message = tableMessage(game, hints);
  const settled = game.phase === 'settled';
  const showBetSpot = game.phase === 'betting';
  const handCount = Math.max(1, game.hands.length);
  const feltRef = useRef<HTMLDivElement>(null);
  const size = useTableSizing(feltRef);
  const feltStyle = size ? ({ '--card-w-base': `${size.cardWidth}px` } as React.CSSProperties) : undefined;

  return (
    <div className={`table-rail${collecting ? ' is-collecting' : ''}`}>
      <div ref={feltRef} className={`table-felt${size?.compact ? ' is-compact' : ''}`} style={feltStyle}>
        <div className="felt-light" aria-hidden="true" />

        <div className="table-top">
          <DiscardTray shoe={game.shoe} />
          <section className="dealer-zone" aria-label="Mão do dealer">
            <div className="zone-label">Dealer</div>
            <DealerHandView cards={game.dealer.cards} holeRevealed={game.dealer.holeRevealed} />
          </section>
          <ShoeView shoe={game.shoe} />
        </div>

        <FeltPrint rules={game.rules} />

        <div className="table-center">
          {settled && game.result ? (
            <ResultBanner key={game.result.roundId} result={game.result} />
          ) : (
            message && (
              <div key={message.title} className={`table-message tone-${message.tone ?? 'neutral'}`} aria-live="polite">
                <div className="table-message-title">{message.title}</div>
                {message.detail && <div className="table-message-detail">{message.detail}</div>}
              </div>
            )
          )}
        </div>

        <section className="player-zone" aria-label="Suas mãos">
          {showBetSpot ? (
            <BetSpot chips={game.pendingBet} minBet={game.rules.minBet} />
          ) : (
            <div className="player-hands" style={{ '--hands': handCount } as React.CSSProperties}>
              {game.hands.map((hand, i) => (
                <PlayerHandView
                  key={hand.id}
                  hand={hand}
                  active={game.phase === 'playerTurn' && i === game.activeHand}
                  multi={game.hands.length > 1}
                  settled={settled}
                />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
