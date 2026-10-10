import { formatAmount } from '../../utils/format';
import { Chip } from '../chips/Chip';

interface Props {
  amount: number;
  onRefill: () => void;
}

/** Shown when the balance cannot cover the table minimum. Virtual chips only — nothing is sold. */
export function RefillModal({ amount, onRefill }: Props) {
  return (
    <div className="modal-root" role="dialog" aria-modal="true" aria-labelledby="refill-title">
      <div className="modal">
        <div className="modal-chips" aria-hidden="true">
          <Chip value={100} />
          <Chip value={500} />
          <Chip value={1000} />
        </div>
        <h2 id="refill-title">Suas fichas acabaram</h2>
        <p>Sem problemas — a casa empresta novas fichas virtuais para você continuar jogando.</p>
        <button type="button" className="btn btn--primary btn--wide" onClick={onRefill} autoFocus>
          Receber {formatAmount(amount)} fichas
        </button>
        <p className="disclaimer">Fichas fictícias, sem valor monetário.</p>
      </div>
    </div>
  );
}
