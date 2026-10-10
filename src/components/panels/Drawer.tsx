import { useEffect, useRef, type ReactNode } from 'react';
import { IconClose } from '../ui/Icons';

interface Props {
  title: string;
  open: boolean;
  onClose: () => void;
  children: ReactNode;
}

/** Side drawer with backdrop. Closes on Escape or backdrop click; focus moves into it on open. */
export function Drawer({ title, open, onClose, children }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (open) ref.current?.focus();
  }, [open]);

  return (
    <div className={`drawer-root${open ? ' is-open' : ''}`} aria-hidden={!open}>
      <div className="drawer-backdrop" onClick={onClose} />
      <aside ref={ref} className="drawer" role="dialog" aria-modal="true" aria-label={title} tabIndex={-1} inert={!open}>
        <header className="drawer-header">
          <h2>{title}</h2>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Fechar">
            <IconClose />
          </button>
        </header>
        <div className="drawer-body">{children}</div>
      </aside>
    </div>
  );
}
