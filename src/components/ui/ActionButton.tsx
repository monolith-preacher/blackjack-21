import type { ReactNode } from 'react';

interface Props {
  label: string;
  hint?: string;
  shortcut?: string;
  icon?: ReactNode;
  onClick: () => void;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'ghost' | 'action';
  className?: string;
}

export function ActionButton({ label, hint, shortcut, icon, onClick, disabled, variant = 'secondary', className }: Props) {
  return (
    <button
      type="button"
      className={`btn btn--${variant} ${className ?? ''}`}
      onClick={onClick}
      disabled={disabled}
      aria-keyshortcuts={shortcut}
      title={shortcut ? `${label} (${shortcut})` : label}
    >
      {icon && <span className="btn-icon">{icon}</span>}
      <span className="btn-text">
        <span className="btn-label">{label}</span>
        {hint && <span className="btn-hint">{hint}</span>}
      </span>
      {shortcut && <kbd className="btn-kbd">{shortcut}</kbd>}
    </button>
  );
}
