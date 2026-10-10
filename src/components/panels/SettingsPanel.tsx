import { useState } from 'react';
import { SPEED_LABEL, type AnimationSpeed, type Settings } from '../../state/settings';

interface Props {
  settings: Settings;
  onChange: (patch: Partial<Settings>) => void;
  onResetGame: () => void;
  onResetStats: () => void;
}

const SPEEDS: AnimationSpeed[] = ['slow', 'normal', 'fast'];

function ConfirmButton({ label, confirmLabel, onConfirm }: { label: string; confirmLabel: string; onConfirm: () => void }) {
  const [armed, setArmed] = useState(false);
  return armed ? (
    <div className="confirm-row">
      <button type="button" className="btn btn--danger" onClick={() => { onConfirm(); setArmed(false); }}>
        {confirmLabel}
      </button>
      <button type="button" className="btn btn--ghost" onClick={() => setArmed(false)}>
        Cancelar
      </button>
    </div>
  ) : (
    <button type="button" className="btn btn--ghost btn--wide" onClick={() => setArmed(true)}>
      {label}
    </button>
  );
}

export function SettingsPanel({ settings, onChange, onResetGame, onResetStats }: Props) {
  return (
    <div className="settings-panel">
      <section className="setting">
        <div className="setting-head">
          <label htmlFor="sound-toggle">Efeitos sonoros</label>
          <button
            id="sound-toggle"
            type="button"
            role="switch"
            aria-checked={settings.soundEnabled}
            className={`switch${settings.soundEnabled ? ' is-on' : ''}`}
            onClick={() => onChange({ soundEnabled: !settings.soundEnabled })}
          >
            <span />
          </button>
        </div>
        <div className="setting-row">
          <label htmlFor="volume">Volume</label>
          <input
            id="volume"
            type="range"
            min={0}
            max={100}
            value={Math.round(settings.volume * 100)}
            disabled={!settings.soundEnabled}
            onChange={(e) => onChange({ volume: Number(e.target.value) / 100 })}
            style={{ '--v': settings.volume } as React.CSSProperties}
          />
          <span className="setting-value">{Math.round(settings.volume * 100)}%</span>
        </div>
      </section>

      <section className="setting">
        <div className="setting-head">
          <span>Velocidade das animações</span>
        </div>
        <div className="segmented" role="radiogroup" aria-label="Velocidade das animações">
          {SPEEDS.map((sp) => (
            <button
              key={sp}
              type="button"
              role="radio"
              aria-checked={settings.speed === sp}
              className={settings.speed === sp ? 'is-selected' : ''}
              onClick={() => onChange({ speed: sp })}
            >
              {SPEED_LABEL[sp]}
            </button>
          ))}
        </div>
      </section>

      <section className="setting">
        <div className="setting-head">
          <label htmlFor="hints-toggle">Mensagens de ajuda na mesa</label>
          <button
            id="hints-toggle"
            type="button"
            role="switch"
            aria-checked={settings.showHints}
            className={`switch${settings.showHints ? ' is-on' : ''}`}
            onClick={() => onChange({ showHints: !settings.showHints })}
          >
            <span />
          </button>
        </div>
      </section>

      <section className="setting">
        <div className="setting-head">
          <span>Partida</span>
        </div>
        <p className="muted small">Reinicia o saldo para o valor inicial e embaralha um novo shoe. As estatísticas são mantidas.</p>
        <ConfirmButton label="Reiniciar partida" confirmLabel="Confirmar reinício" onConfirm={onResetGame} />
        <p className="muted small">Apaga estatísticas e histórico salvos neste navegador.</p>
        <ConfirmButton label="Zerar estatísticas" confirmLabel="Confirmar" onConfirm={onResetStats} />
      </section>

      <p className="disclaimer">Saldo, estatísticas e configurações ficam salvos localmente no seu navegador.</p>
    </div>
  );
}
