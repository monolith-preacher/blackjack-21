import { winRate, type HistoryEntry, type Stats } from '../../state/stats';
import { formatAmount, formatPercent, formatSigned } from '../../utils/format';

interface Props {
  stats: Stats;
  history: HistoryEntry[];
}

const OUTCOME_TEXT: Record<HistoryEntry['outcome'], string> = {
  blackjack: 'Blackjack',
  win: 'Vitória',
  push: 'Empate',
  lose: 'Derrota',
  bust: 'Estouro',
};

function Stat({ label, value, tone }: { label: string; value: string | number; tone?: 'good' | 'bad' | 'gold' }) {
  return (
    <div className={`stat${tone ? ` stat--${tone}` : ''}`}>
      <span className="stat-value">{value}</span>
      <span className="stat-label">{label}</span>
    </div>
  );
}

export function StatsPanel({ stats, history }: Props) {
  const rate = winRate(stats);
  return (
    <div className="stats-panel">
      <div className="winrate">
        <div className="winrate-ring" style={{ '--p': rate } as React.CSSProperties}>
          <span>{formatPercent(rate)}</span>
        </div>
        <div>
          <div className="winrate-title">Taxa de vitória</div>
          <div className="winrate-sub">
            {stats.wins} vitórias · {stats.losses} derrotas · {stats.pushes} empates
          </div>
        </div>
      </div>

      <div className="stat-grid">
        <Stat label="Rodadas" value={stats.rounds} />
        <Stat label="Mãos jogadas" value={stats.handsPlayed} />
        <Stat label="Blackjacks" value={stats.blackjacks} tone="gold" />
        <Stat label="Estouros" value={stats.busts} tone="bad" />
        <Stat label="Sequência atual" value={stats.currentStreak} />
        <Stat label="Maior sequência" value={stats.bestStreak} tone="gold" />
        <Stat label="Dobras" value={stats.doubles} />
        <Stat label="Divisões" value={stats.splits} />
        <Stat label="Maior ganho" value={formatAmount(stats.biggestWin)} tone="good" />
        <Stat label="Resultado total" value={formatSigned(stats.net)} tone={stats.net >= 0 ? 'good' : 'bad'} />
        <Stat label="Total apostado" value={formatAmount(stats.totalWagered)} />
        <Stat label="Recargas" value={stats.refills} />
      </div>

      <h3 className="panel-subtitle">Histórico recente</h3>
      {history.length === 0 ? (
        <p className="muted">Jogue algumas rodadas para ver o histórico aqui.</p>
      ) : (
        <ol className="history-list">
          {history.map((h, i) => (
            <li key={`${h.roundId}-${h.at}`} className={`history-item history-item--${h.outcome}`}>
              <span className="history-round">#{Math.max(1, stats.rounds - i)}</span>
              <span className="history-outcome">{OUTCOME_TEXT[h.outcome]}</span>
              <span className="history-hands">
                {h.playerTotals.join(' · ')} <em>vs</em> {h.dealerBust ? `${h.dealerTotal}✕` : h.dealerTotal}
              </span>
              <span className="history-net">{formatSigned(h.net)}</span>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
