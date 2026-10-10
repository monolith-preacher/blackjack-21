import { CHIP_VALUES, type ChipValue } from '../../engine';
import { Chip } from '../chips/Chip';

interface Props {
  canAdd: (v: ChipValue) => boolean;
  onAdd: (v: ChipValue) => void;
  disabled: boolean;
}

export function ChipRack({ canAdd, onAdd, disabled }: Props) {
  return (
    <div className="chip-rack" role="group" aria-label="Fichas para apostar">
      {CHIP_VALUES.map((v, i) => {
        const enabled = !disabled && canAdd(v);
        return (
          <button
            key={v}
            type="button"
            className="rack-chip"
            onClick={() => onAdd(v)}
            disabled={!enabled}
            aria-label={`Apostar ficha de ${v}`}
            title={`Ficha de ${v} (tecla ${i + 1})`}
            data-anchor={`rack-${v}`}
          >
            <Chip value={v} />
            <kbd className="rack-kbd">{i + 1}</kbd>
          </button>
        );
      })}
    </div>
  );
}
