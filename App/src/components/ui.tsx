import React, { useEffect, useRef } from 'react';
import { DUST, INK, LEDGER, LILAC, PAPER, RULE } from '../utils/ledger';

/** Small mono caption, e.g. "AFTER THAT". */
export const Label: React.FC<{
  children: React.ReactNode;
  color?: string;
  wide?: boolean;
  className?: string;
  style?: React.CSSProperties;
}> = ({ children, color = DUST, wide, className = '', style }) => (
  <span
    className={`font-mono text-[13px] uppercase ${className}`}
    style={{ letterSpacing: wide ? '0.14em' : '0.08em', color, ...style }}
  >
    {children}
  </span>
);

/** Class tag: highlighter-pastel block with ink mono type. */
export const Tag: React.FC<{
  color: string;
  children: React.ReactNode;
  title?: string;
  className?: string;
}> = ({ color, children, title, className = '' }) => (
  <span
    title={title}
    className={`inline-block max-w-full overflow-hidden text-ellipsis whitespace-nowrap align-middle font-mono text-[12px] font-medium uppercase ${className}`}
    style={{
      padding: '3px 9px',
      background: color,
      color: INK,
      letterSpacing: '0.06em',
    }}
  >
    {children}
  </span>
);

export const PlusIcon: React.FC<{ size?: number }> = ({ size = 26 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="square">
    <path d="M12 4v16M4 12h16" />
  </svg>
);

/** The one circle in the whole system: the add button. */
export const AddCircle: React.FC<{ onClick: () => void; label?: string }> = ({ onClick, label = 'Add assignment' }) => (
  <button
    aria-label={label}
    title={label}
    onClick={onClick}
    className="flex h-16 w-16 flex-none cursor-pointer items-center justify-center rounded-full border-none transition-transform hover:scale-105 active:scale-95"
    style={{ background: PAPER, color: INK }}
  >
    <PlusIcon />
  </button>
);

type BtnProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'solid' | 'line' | 'ghost' | 'danger';
  bg?: string;
  small?: boolean;
};

/** Hard-cornered button. */
export const Btn: React.FC<BtnProps> = ({ variant = 'line', bg, small, className = '', style, children, type = 'button', ...rest }) => {
  const base =
    'inline-flex cursor-pointer items-center justify-center gap-2 font-mono font-medium uppercase transition-opacity disabled:cursor-not-allowed disabled:opacity-40';
  const size = small ? 'h-9 px-3 text-[11px]' : 'h-11 px-4 text-[12px]';
  const look: React.CSSProperties =
    variant === 'solid'
      ? { background: bg ?? PAPER, color: INK, border: `2px solid ${bg ?? PAPER}` }
      : variant === 'danger'
      ? { background: 'transparent', color: '#FF9650', border: '2px solid #FF9650' }
      : variant === 'ghost'
      ? { background: 'transparent', color: DUST, border: '2px solid transparent' }
      : { background: 'transparent', color: 'inherit', border: '2px solid currentColor' };
  return (
    <button
      {...rest}
      type={type}
      className={`${base} ${size} tracking-[0.06em] hover:opacity-80 ${className}`}
      style={{ ...look, ...style }}
    >
      {children}
    </button>
  );
};

/** Toggle chip used for filters and option rows. */
export const Chip: React.FC<
  React.ButtonHTMLAttributes<HTMLButtonElement> & { active?: boolean; color?: string }
> = ({ active, color, className = '', style, children, ...rest }) => (
  <button
    type="button"
    {...rest}
    className={`inline-flex h-9 flex-none cursor-pointer items-center gap-2 px-3 font-mono text-[12px] font-medium uppercase tracking-[0.06em] transition-colors ${className}`}
    style={{
      border: `2px solid ${active ? color ?? PAPER : RULE}`,
      background: active ? color ?? PAPER : 'transparent',
      color: active ? INK : PAPER,
      ...style,
    }}
  >
    {children}
  </button>
);

/** Dotted leader line that fills the gap between a title and its time. */
export const Leader: React.FC<{ className?: string }> = ({ className = '' }) => (
  <span
    aria-hidden="true"
    className={`h-px min-w-3 flex-[1_1_24px] ${className}`}
    style={{ borderBottom: '2px dotted currentColor', opacity: 0.3, marginTop: 10 }}
  />
);

export const FieldLabel: React.FC<{ children: React.ReactNode; hint?: React.ReactNode; htmlFor?: string }> = ({
  children,
  hint,
  htmlFor,
}) => (
  <label htmlFor={htmlFor} className="mb-2 flex flex-wrap items-baseline justify-between gap-x-3">
    <Label>{children}</Label>
    {hint && <span className="font-mono text-[12px]" style={{ color: DUST }}>{hint}</span>}
  </label>
);

interface ModalProps {
  kicker: string;
  title: React.ReactNode;
  onClose: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
  width?: number;
  accent?: string;
  /** Submit handler: wraps body + footer in a <form>. */
  onSubmit?: (e: React.FormEvent) => void;
}

// Open modals, innermost last, so Escape only closes the one on top.
const modalStack: symbol[] = [];

/** Ink-on-ledger sheet with a hard offset shadow. Closes on Esc or the close button. */
export const Modal: React.FC<ModalProps> = ({
  kicker,
  title,
  onClose,
  children,
  footer,
  width = 640,
  accent = LILAC,
  onSubmit,
}) => {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const prevFocus = document.activeElement as HTMLElement | null;
    const me = Symbol('modal');
    modalStack.push(me);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && modalStack[modalStack.length - 1] === me) onClose();
    };
    document.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    panelRef.current?.focus();
    return () => {
      modalStack.splice(modalStack.indexOf(me), 1);
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
      prevFocus?.focus?.();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const inner = (
    <>
      <div
        className="flex flex-none items-start justify-between gap-4 px-5 pb-4 pt-5 sm:px-7"
        style={{ borderBottom: `1px solid ${RULE}` }}
      >
        <div className="min-w-0">
          <Label wide>{kicker}</Label>
          <h2
            className="m-0 mt-1 font-serif text-[40px] font-normal leading-[0.95] sm:text-[48px]"
            style={{ letterSpacing: '-0.02em' }}
          >
            {title}
          </h2>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="flex h-11 w-11 flex-none cursor-pointer items-center justify-center border-2 bg-transparent"
          style={{ borderColor: RULE, color: PAPER }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="square">
            <path d="M5 5l14 14M19 5L5 19" />
          </svg>
        </button>
      </div>
      <div className="thin-scroll min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-5 sm:px-7">{children}</div>
      {footer && (
        <div
          className="flex flex-none flex-wrap items-center justify-between gap-3 px-5 py-4 sm:px-7"
          style={{ borderTop: `1px solid ${RULE}`, background: INK }}
        >
          {footer}
        </div>
      )}
    </>
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-6"
      style={{ background: 'rgba(21,18,26,0.88)' }}
    >
      <div
        ref={panelRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label={kicker}
        className="ledger-in flex max-h-[94dvh] w-full flex-col outline-none sm:max-h-[90vh]"
        style={{
          maxWidth: width,
          background: LEDGER,
          color: PAPER,
          border: `1px solid ${RULE}`,
          boxShadow: `8px 8px 0 ${accent}`,
        }}
      >
        {onSubmit ? (
          <form onSubmit={onSubmit} className="flex min-h-0 flex-1 flex-col">
            {inner}
          </form>
        ) : (
          inner
        )}
      </div>
    </div>
  );
};
