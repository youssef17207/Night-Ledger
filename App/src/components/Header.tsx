import React from 'react';
import { DUST, LILAC, PAPER } from '../utils/ledger';

export type DashboardTab = 'week' | 'today' | 'homework';

interface Props {
  tab: DashboardTab;
  onTab: (t: DashboardTab) => void;
  courseCount: number;
  openCount: number;
  weekRange: string;
  isCurrentWeek: boolean;
  onPrevWeek: () => void;
  onNextWeek: () => void;
  onThisWeek: () => void;
  onOpenCourses: () => void;
  onOpenHours: () => void;
  onAutoFix: () => void;
  onOpenHelp: () => void;
  onOpenFeatures: () => void;
}

const mono = 'font-mono text-[13px] uppercase';

const ToolLink: React.FC<{ onClick: () => void; children: React.ReactNode; title?: string; expanded?: boolean }> = ({
  onClick,
  children,
  title,
  expanded,
}) => (
  <button
    type="button"
    onClick={onClick}
    title={title}
    aria-expanded={expanded}
    aria-haspopup={expanded === undefined ? undefined : 'menu'}
    className="-mx-1.5 cursor-pointer border-none bg-transparent px-1.5 py-2 font-mono text-[15px] uppercase tracking-[0.14em] transition-colors hover:text-[#AA92FF]"
    style={{ color: DUST }}
  >
    {children}
  </button>
);

/** "More" dropdown: keeps the secondary links out of sight until they are wanted. */
const MoreMenu: React.FC<{ items: Array<{ label: string; title?: string; run: () => void }> }> = ({ items }) => {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef<HTMLSpanElement>(null);
  React.useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);
  return (
    <span ref={ref} className="relative">
      <ToolLink onClick={() => setOpen((o) => !o)} expanded={open} title="Auto-fix, features and how it works">
        More {open ? '▴' : '▾'}
      </ToolLink>
      {open && (
        <div
          role="menu"
          className="tool-menu absolute left-[-14px] top-full z-20 mt-1 flex min-w-[230px] flex-col py-2"
          style={{ background: '#1D1924', border: '1px solid #3A3445', boxShadow: '6px 6px 0 #AA92FF' }}
        >
          {items.map((it) => (
            <button
              key={it.label}
              type="button"
              role="menuitem"
              title={it.title}
              onClick={() => {
                setOpen(false);
                it.run();
              }}
              className="cursor-pointer border-none bg-transparent px-4 py-3 text-left font-mono text-[14px] uppercase tracking-[0.14em] transition-colors"
              style={{ color: DUST }}
            >
              {it.label}
            </button>
          ))}
        </div>
      )}
    </span>
  );
};

/** Wordmark: a crescent-over-ledger-lines mark beside "Night Ledger" set in the display serif. */
const Logo: React.FC = () => (
  <span className="mr-2 flex items-center gap-3 normal-case" style={{ color: PAPER, letterSpacing: 'normal' }} aria-label="Night Ledger">
    <svg width="38" height="38" viewBox="0 0 38 38" aria-hidden="true" className="flex-none">
      <rect width="38" height="38" fill={PAPER} />
      <circle cx="17" cy="16" r="10" fill="#15121A" />
      <circle cx="22" cy="13" r="9" fill={PAPER} />
      <rect x="6" y="28" width="26" height="2" fill="#15121A" />
      <rect x="6" y="32" width="16" height="2" fill="#15121A" />
      <circle cx="29" cy="9" r="2.2" fill="#7E5BFF" />
    </svg>
    <span className="font-serif text-[30px] leading-none tracking-[0.005em]">
      <span className="italic">Night</span> Ledger
    </span>
  </span>
);

export const Header: React.FC<Props> = ({
  tab,
  onTab,
  courseCount,
  openCount,
  weekRange,
  isCurrentWeek,
  onPrevWeek,
  onNextWeek,
  onThisWeek,
  onOpenCourses,
  onOpenHours,
  onAutoFix,
  onOpenHelp,
  onOpenFeatures,
}) => {
  const tabs: Array<{ id: DashboardTab; label: string }> = [
    { id: 'week', label: 'Week' },
    { id: 'today', label: 'Today' },
    { id: 'homework', label: `Homework · ${openCount}` },
  ];

  return (
    <div className="flex flex-col gap-1 pb-9">
      <div
        className={`${mono} flex flex-wrap items-center justify-between gap-x-8 gap-y-1`}
        style={{ letterSpacing: '0.14em', color: DUST }}
      >
        <span className="flex flex-wrap items-center gap-x-8">
          <Logo />
          <nav aria-label="Views" className="flex items-center gap-8">
            {tabs.map((t) => {
              const active = tab === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => onTab(t.id)}
                  aria-current={active ? 'page' : undefined}
                  className="-mx-1.5 cursor-pointer border-none bg-transparent px-1.5 py-3 font-mono text-[15px] uppercase tracking-[0.14em] transition-colors hover:text-[#F1EBDD]"
                  style={{
                    color: active ? PAPER : DUST,
                    boxShadow: active ? `inset 0 -2px 0 ${LILAC}` : 'none',
                  }}
                >
                  {t.label}
                </button>
              );
            })}
          </nav>
        </span>

        {tab === 'week' && (
          <span className="week-row flex items-center gap-8">
            <button
              type="button"
              onClick={onPrevWeek}
              className="-mx-1.5 cursor-pointer border-none bg-transparent px-1.5 py-3 font-mono text-[15px] uppercase tracking-[0.14em] transition-colors hover:text-[#AA92FF]"
              style={{ color: DUST }}
            >
              ← Prev
            </button>
            <button
              type="button"
              onClick={onThisWeek}
              disabled={isCurrentWeek}
              title={isCurrentWeek ? 'This week' : 'Jump to this week'}
              className={`-mx-1.5 w-[190px] border-none bg-transparent px-1.5 py-3 text-center font-mono text-[15px] uppercase tracking-[0.14em] ${isCurrentWeek ? 'cursor-default' : 'cursor-pointer hover:text-[#AA92FF]'}`}
              style={{ color: PAPER }}
            >
              {weekRange}
            </button>
            <button
              type="button"
              onClick={onNextWeek}
              className="-mx-1.5 cursor-pointer border-none bg-transparent px-1.5 py-3 font-mono text-[15px] uppercase tracking-[0.14em] transition-colors hover:text-[#AA92FF]"
              style={{ color: DUST }}
            >
              Next →
            </button>
          </span>
        )}
      </div>

      <div className="tool-row flex flex-wrap items-center gap-x-8 gap-y-0">
        <ToolLink onClick={onOpenCourses} title="Add and edit your classes">
          Classes · {courseCount}
        </ToolLink>
        <ToolLink onClick={onOpenHours} title="Tell Night Ledger when you are free to study">
          Free hours
        </ToolLink>
        <MoreMenu
          items={[
            { label: 'Auto-fix', title: 'Move missed study blocks into the next open slots', run: onAutoFix },
            { label: 'Features', title: 'See everything Night Ledger can do', run: onOpenFeatures },
            { label: 'How it works', run: onOpenHelp },
          ]}
        />
      </div>
    </div>
  );
};

interface FooterProps {
  soundEnabled: boolean;
  autoRebalance: boolean;
  onToggleSound: () => void;
  onToggleAutoRebalance: () => void;
  onExport: () => void;
  onImport: (file: File) => void;
  onReset: () => void;
}

export const Footer: React.FC<FooterProps> = ({
  soundEnabled,
  autoRebalance,
  onToggleSound,
  onToggleAutoRebalance,
  onExport,
  onImport,
  onReset,
}) => {
  const fileRef = React.useRef<HTMLInputElement>(null);
  const [inverted, setInverted] = React.useState(() => document.documentElement.hasAttribute('data-inverted'));
  const toggleInverted = () => {
    const next = !inverted;
    document.documentElement.toggleAttribute('data-inverted', next);
    try {
      localStorage.setItem('night-ledger-inverted', next ? '1' : '0');
    } catch {
      /* storage blocked: the choice just won't persist */
    }
    setInverted(next);
  };
  const [settingsOpen, setSettingsOpen] = React.useState(false);
  const link =
    'cursor-pointer border-none bg-transparent py-2 font-mono text-[12px] uppercase tracking-[0.08em] transition-colors hover:text-[#AA92FF]';
  return (
    <footer className="mt-10 flex flex-col gap-2 pt-5" style={{ borderTop: '1px solid #3A3445' }}>
      <div>
        <button
          type="button"
          className={link}
          style={{ color: DUST }}
          aria-expanded={settingsOpen}
          onClick={() => setSettingsOpen((o) => !o)}
        >
          Settings & backup {settingsOpen ? '▴' : '▾'}
        </button>
      </div>
      {settingsOpen && (
      <div className="flex flex-wrap items-center gap-x-6">
        <button type="button" className={link} style={{ color: DUST }} onClick={onToggleSound}>
          Sound · {soundEnabled ? 'On' : 'Off'}
        </button>
        <button
          type="button"
          className={link}
          style={{ color: DUST }}
          onClick={onToggleAutoRebalance}
          title="Automatically move study blocks you miss into the next open slot"
        >
          Auto-rebalance · {autoRebalance ? 'On' : 'Off'}
        </button>
        <button
          type="button"
          className={link}
          style={{ color: DUST }}
          onClick={toggleInverted}
          aria-pressed={inverted}
          title="Flip to a light background if dark themes are hard to read"
        >
          Invert colors · {inverted ? 'On' : 'Off'}
        </button>
        <button type="button" className={link} style={{ color: DUST }} onClick={onExport}>
          Export backup
        </button>
        <button type="button" className={link} style={{ color: DUST }} onClick={() => fileRef.current?.click()}>
          Import backup
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) onImport(f);
            e.target.value = '';
          }}
        />
        <button type="button" className={link} style={{ color: '#FF9650' }} onClick={onReset}>
          Erase everything
        </button>
      </div>
      )}
      <span className="font-mono text-[12px] tracking-[0.04em]" style={{ color: DUST }}>
        Saved privately in this browser. No account needed yet.
      </span>
      <div
        className="flex flex-wrap items-center gap-x-4 gap-y-1 pt-2 font-mono text-[12px] tracking-[0.04em]"
        style={{ color: DUST }}
      >
        <span>Developed and created by Youssef Saleh</span>
        <a
          href="https://www.linkedin.com/in/youssef-saleh-082708403/"
          target="_blank"
          rel="noopener noreferrer"
          className="uppercase tracking-[0.08em] transition-colors hover:text-[#AA92FF]"
        >
          LinkedIn
        </a>
        <a
          href="https://github.com/youssef17207"
          target="_blank"
          rel="noopener noreferrer"
          className="uppercase tracking-[0.08em] transition-colors hover:text-[#AA92FF]"
        >
          GitHub
        </a>
      </div>
    </footer>
  );
};
