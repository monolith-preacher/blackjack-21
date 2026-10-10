import { useCallback, useEffect, useState } from 'react';
import { clearRects } from './animation/fly';
import { SpeedContext } from './animation/SpeedContext';
import { sound, type SoundName } from './audio/SoundEngine';
import { Controls } from './components/controls/Controls';
import { TopBar } from './components/hud/TopBar';
import { Drawer } from './components/panels/Drawer';
import { RefillModal } from './components/panels/RefillModal';
import { RulesPanel } from './components/panels/RulesPanel';
import { SettingsPanel } from './components/panels/SettingsPanel';
import { StatsPanel } from './components/panels/StatsPanel';
import { Table } from './components/table/Table';
import { amountOnTable, CHIP_VALUES, type ChipValue, type GameEvent } from './engine';
import { SPEED_FACTOR } from './state/settings';
import { roundOutcome, type RoundOutcome } from './state/stats';
import { useBlackjack } from './state/useBlackjack';
import { useSettings, useStats } from './state/usePersistence';

type Panel = 'stats' | 'rules' | 'settings' | null;

const OUTCOME_SOUND: Record<RoundOutcome, SoundName> = {
  blackjack: 'blackjack',
  win: 'win',
  push: 'push',
  lose: 'lose',
  bust: 'bust',
};

const PANEL_TITLES = { stats: 'Estatísticas', rules: 'Regras do jogo', settings: 'Configurações' } as const;

export default function App() {
  const [settings, updateSettings] = useSettings();
  const { stats, history, record, recordRefill, reset: resetStats } = useStats();
  const [panel, setPanel] = useState<Panel>(null);
  const speed = SPEED_FACTOR[settings.speed];

  useEffect(() => {
    sound.setEnabled(settings.soundEnabled);
    sound.setVolume(settings.volume);
  }, [settings.soundEnabled, settings.volume]);

  // Browsers only allow audio after a user gesture.
  useEffect(() => {
    const unlock = () => sound.unlock();
    window.addEventListener('pointerdown', unlock, { once: true });
    window.addEventListener('keydown', unlock, { once: true });
    return () => {
      window.removeEventListener('pointerdown', unlock);
      window.removeEventListener('keydown', unlock);
    };
  }, []);

  const onEvent = useCallback(
    (e: GameEvent) => {
      switch (e.type) {
        case 'betChanged':
          sound.play('chip');
          break;
        case 'roundStart':
          clearRects();
          sound.play(e.reshuffled ? 'shuffle' : 'chipStack');
          break;
        case 'deal':
        case 'hit':
          sound.play('deal');
          break;
        case 'double':
          sound.play('chipStack');
          sound.play('deal');
          break;
        case 'split':
          sound.play('chipStack');
          break;
        case 'peek':
          sound.play('click');
          break;
        case 'reveal':
          sound.play('flip');
          break;
        case 'settle':
          record(e.summary);
          sound.play(OUTCOME_SOUND[roundOutcome(e.summary)]);
          break;
        case 'newRound':
          clearRects();
          break;
        case 'refill':
          recordRefill();
          sound.play('chipStack');
          break;
      }
    },
    [record, recordRefill],
  );

  const ctl = useBlackjack({ speed, onEvent, onRejected: () => sound.play('error') });
  const { game, actions, can, busy } = ctl;

  const addChip = useCallback((v: ChipValue) => actions.addChip(v), [actions]);

  // Keyboard shortcuts.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey || e.repeat) return;
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) return;
      if (e.key === 'Escape') {
        setPanel(null);
        return;
      }
      if (panel) return;
      // Let a focused button handle its own Enter/Space activation.
      if ((e.key === 'Enter' || e.key === ' ') && target?.tagName === 'BUTTON') return;

      const k = e.key.toLowerCase();
      const run = (fn: () => void) => {
        e.preventDefault();
        fn();
      };
      if (k === 'm') return run(() => updateSettings({ soundEnabled: !settings.soundEnabled }));
      if (k === 't') return run(() => setPanel('stats'));
      if (k === '?') return run(() => setPanel('rules'));
      if (can.refill) return;

      switch (game.phase) {
        case 'betting': {
          const n = Number(k);
          if (n >= 1 && n <= CHIP_VALUES.length) return run(() => addChip(CHIP_VALUES[n - 1]));
          if (k === 'u' || k === 'backspace') return run(actions.undoChip);
          if (k === 'c') return run(actions.clearBet);
          if (k === 'r') return run(actions.rebet);
          if (k === 'x') return run(actions.doubleBet);
          if (k === 'enter' || k === ' ') return run(actions.deal);
          break;
        }
        case 'playerTurn':
          if (k === 'h') return run(actions.hit);
          if (k === 's') return run(actions.stand);
          if (k === 'd') return run(actions.double);
          if (k === 'p') return run(actions.split);
          break;
        case 'settled':
          if (k === 'enter' || k === ' ') return run(actions.nextRound);
          if (k === 'r') return run(actions.rebetAndDeal);
          break;
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [panel, game.phase, can.refill, actions, addChip, settings.soundEnabled, updateSettings]);

  const openPanel = (p: Exclude<Panel, null>) => {
    sound.play('click');
    setPanel(p);
  };

  return (
    <SpeedContext.Provider value={speed}>
      <div className={`app phase-${game.phase}${busy ? ' is-busy' : ''}`} style={{ '--speed': speed } as React.CSSProperties}>
        <TopBar
          balance={game.balance}
          onTable={amountOnTable(game)}
          history={history}
          soundOn={settings.soundEnabled}
          onToggleSound={() => updateSettings({ soundEnabled: !settings.soundEnabled })}
          onOpen={openPanel}
        />
        <main className="stage">
          <Table game={game} collecting={ctl.collecting} hints={settings.showHints} />
        </main>
        <footer className="dock">
          <Controls ctl={ctl} onAddChip={addChip} />
        </footer>

        <Drawer title={panel ? PANEL_TITLES[panel] : ''} open={panel !== null} onClose={() => setPanel(null)}>
          {panel === 'stats' && <StatsPanel stats={stats} history={history} />}
          {panel === 'rules' && <RulesPanel rules={game.rules} />}
          {panel === 'settings' && (
            <SettingsPanel
              settings={settings}
              onChange={updateSettings}
              onResetGame={() => {
                actions.resetGame();
                setPanel(null);
              }}
              onResetStats={resetStats}
            />
          )}
        </Drawer>

        {can.refill && !busy && <RefillModal amount={game.rules.startingBalance} onRefill={actions.refill} />}
      </div>
    </SpeedContext.Provider>
  );
}
