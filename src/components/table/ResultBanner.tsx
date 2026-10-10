import type { RoundSummary } from '../../engine';
import { roundOutcome } from '../../state/stats';
import { formatAmount, formatSigned } from '../../utils/format';

const TITLES = {
  blackjack: 'Blackjack!',
  win: 'Você venceu!',
  push: 'Empate',
  lose: 'Você perdeu',
  bust: 'Estourou!',
} as const;

function subtitle(r: RoundSummary): string {
  if (r.dealerBlackjack) return 'Dealer tem Blackjack';
  if (r.dealerBust) return `Dealer estourou com ${r.dealerTotal}`;
  return `Dealer fez ${r.dealerTotal}`;
}

/** Celebration / result plate shown in the middle of the felt when a round is settled. */
export function ResultBanner({ result }: { result: RoundSummary }) {
  const outcome = roundOutcome(result);
  const mixed = result.hands.length > 1;
  const title = mixed && outcome !== 'blackjack' ? (result.net > 0 ? 'Saldo positivo!' : result.net < 0 ? 'Rodada perdida' : 'Rodada empatada') : TITLES[outcome];
  return (
    <div className={`result-banner result-banner--${outcome}`} role="status" aria-live="polite">
      {(outcome === 'blackjack' || outcome === 'win') && (
        <div className="sparkles" aria-hidden="true">
          {Array.from({ length: outcome === 'blackjack' ? 16 : 9 }, (_, i) => (
            <span key={i} style={{ '--s': i } as React.CSSProperties} />
          ))}
        </div>
      )}
      <div className="result-title">{title}</div>
      <div className="result-amount">
        {result.net === 0 ? `Aposta de ${formatAmount(result.totalBet)} devolvida` : `${formatSigned(result.net)} fichas`}
      </div>
      <div className="result-sub">{subtitle(result)}</div>
    </div>
  );
}
