import { canAddChip, pendingTotal, type ChipValue } from '../../engine';
import type { BlackjackController } from '../../state/useBlackjack';
import { formatAmount } from '../../utils/format';
import { ActionButton } from '../ui/ActionButton';
import { IconClear, IconDouble, IconHit, IconPlay, IconRepeat, IconSplit, IconStand, IconUndo } from '../ui/Icons';
import { ChipRack } from './ChipRack';

interface Props {
  ctl: BlackjackController;
  onAddChip: (v: ChipValue) => void;
}

export function Controls({ ctl, onAddChip }: Props) {
  const { game, busy, can, actions } = ctl;
  const free = !busy;

  if (game.phase === 'betting') {
    const bet = pendingTotal(game);
    return (
      <div className="controls controls--betting">
        <ChipRack canAdd={(v) => canAddChip(game, v)} onAdd={onAddChip} disabled={busy || can.refill} />
        <div className="bet-summary" aria-live="polite">
          <span className="bet-summary-label">Aposta</span>
          <span className="bet-summary-value">{formatAmount(bet)}</span>
        </div>
        <div className="controls-group">
          <ActionButton label="Desfazer" shortcut="U" icon={<IconUndo />} onClick={actions.undoChip} disabled={!free || bet === 0} variant="ghost" />
          <ActionButton label="Limpar" shortcut="C" icon={<IconClear />} onClick={actions.clearBet} disabled={!free || bet === 0} variant="ghost" />
          <ActionButton
            label="Repetir"
            hint={game.lastBet ? formatAmount(game.lastBet) : undefined}
            shortcut="R"
            icon={<IconRepeat />}
            onClick={actions.rebet}
            disabled={!free || !can.rebet}
            variant="ghost"
          />
          <ActionButton label="x2" shortcut="X" onClick={actions.doubleBet} disabled={!free || !can.doubleBet} variant="ghost" className="btn--compact" />
          <ActionButton label="Distribuir" shortcut="Enter" icon={<IconPlay />} onClick={actions.deal} disabled={!free || !can.deal} variant="primary" />
        </div>
      </div>
    );
  }

  if (game.phase === 'settled') {
    return (
      <div className="controls controls--settled">
        <ActionButton
          label="Repetir aposta"
          hint={can.rebetAndDeal ? `${formatAmount(game.lastBet)} e distribuir` : 'saldo insuficiente'}
          shortcut="R"
          icon={<IconRepeat />}
          onClick={actions.rebetAndDeal}
          disabled={!free || !can.rebetAndDeal}
        />
        <ActionButton label="Nova rodada" shortcut="Enter" icon={<IconPlay />} onClick={actions.nextRound} disabled={!free} variant="primary" />
      </div>
    );
  }

  const playing = game.phase === 'playerTurn' && free;
  return (
    <div className="controls controls--play">
      <ActionButton label="Pedir" hint="Hit" shortcut="H" icon={<IconHit />} onClick={actions.hit} disabled={!playing || !can.hit} variant="action" className="btn--hit" />
      <ActionButton label="Parar" hint="Stand" shortcut="S" icon={<IconStand />} onClick={actions.stand} disabled={!playing || !can.stand} variant="action" className="btn--stand" />
      <ActionButton label="Dobrar" hint="Double" shortcut="D" icon={<IconDouble />} onClick={actions.double} disabled={!playing || !can.double} variant="action" className="btn--double" />
      <ActionButton label="Dividir" hint="Split" shortcut="P" icon={<IconSplit />} onClick={actions.split} disabled={!playing || !can.split} variant="action" className="btn--split" />
    </div>
  );
}
