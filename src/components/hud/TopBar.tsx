import { useEffect, useRef, useState } from 'react';
import { useAnimatedNumber } from '../../hooks/useAnimatedNumber';
import type { HistoryEntry } from '../../state/stats';
import { formatAmount, formatSigned } from '../../utils/format';
import { Chip } from '../chips/Chip';
import { IconBook, IconChart, IconGear, IconSound } from '../ui/Icons';

interface Props {
  balance: number;
  onTable: number;
  history: HistoryEntry[];
  soundOn: boolean;
  onToggleSound: () => void;
  onOpen: (panel: 'stats' | 'rules' | 'settings') => void;
}

const DOT_LABEL: Record<HistoryEntry['outcome'], string> = {
  blackjack: 'BJ',
  win: 'V',
  push: 'E',
  lose: 'D',
  bust: 'D',
};

/** Balance with a counting animation and a floating "+X" when a round pays out. */
function Balance({ balance }: { balance: number }) {
  const shown = useAnimatedNumber(balance, 800);
  const prev = useRef(balance);
  const [delta, setDelta] = useState<{ value: number; key: number } | null>(null);

  useEffect(() => {
    const diff = balance - prev.current;
    prev.current = balance;
    // Only celebrate increases (payouts / refills); bets placed are visible on the table.
    if (diff > 0) setDelta({ value: diff, key: Date.now() });
  }, [balance]);

  return (
    <div className="balance" aria-live="polite">
      <Chip value={1000} className="balance-chip" />
      <div className="balance-text">
        <span className="balance-label">Saldo</span>
        <span className="balance-value">{formatAmount(Number.isInteger(balance) ? Math.round(shown) : Math.round(shown * 2) / 2)}</span>
      </div>
      {delta && (
        <span key={delta.key} className="balance-delta" onAnimationEnd={() => setDelta(null)}>
          {formatSigned(delta.value)}
        </span>
      )}
    </div>
  );
}

export function TopBar({ balance, onTable, history, soundOn, onToggleSound, onOpen }: Props) {
  const recent = history.slice(0, 10);
  return (
    <header className="topbar">
      <div className="brand">
        <span className="brand-mark" aria-hidden="true">
          <span>21</span>
        </span>
        <span className="brand-name">
          Aurum <em>Blackjack</em>
        </span>
      </div>

      <div className="recent" aria-label="Últimas rodadas">
        {recent.length === 0 ? (
          <span className="recent-empty">Sem rodadas ainda</span>
        ) : (
          recent.map((h) => (
            <span key={h.roundId + '-' + h.at} className={`recent-dot recent-dot--${h.outcome}`} title={`Rodada ${h.roundId}: ${formatSigned(h.net)}`}>
              {DOT_LABEL[h.outcome]}
            </span>
          ))
        )}
      </div>

      <div className="topbar-right">
        <Balance balance={balance} />
        {onTable > 0 && (
          <div className="on-table">
            <span className="balance-label">Na mesa</span>
            <span className="on-table-value">{formatAmount(onTable)}</span>
          </div>
        )}
        <nav className="topbar-actions">
          <button type="button" className="icon-btn" onClick={() => onOpen('stats')} aria-label="Estatísticas e histórico" title="Estatísticas (T)">
            <IconChart />
          </button>
          <button type="button" className="icon-btn" onClick={() => onOpen('rules')} aria-label="Regras" title="Regras (?)">
            <IconBook />
          </button>
          <button type="button" className="icon-btn" onClick={() => onOpen('settings')} aria-label="Configurações" title="Configurações">
            <IconGear />
          </button>
          <button
            type="button"
            className={`icon-btn${soundOn ? '' : ' is-off'}`}
            onClick={onToggleSound}
            aria-label={soundOn ? 'Desativar som' : 'Ativar som'}
            aria-pressed={soundOn}
            title="Som (M)"
          >
            <IconSound muted={!soundOn} />
          </button>
        </nav>
      </div>
    </header>
  );
}
