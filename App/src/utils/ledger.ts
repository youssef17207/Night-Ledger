import { Assignment, AssignmentStatus, Course, TaskChunk } from '../types/scheduler';
import { formatDateKey, parseDateKey, timeToMinutes } from './schedulerEngine';

/* Night Ledger palette (from "Palette & type") */
// Palette constants point at theme variables (defined per theme in index.css), so every inline
// style that uses them re-colours when the theme changes.
export const INK = 'var(--ink)';
export const PAPER = 'var(--paper)';
export const DUST = 'var(--dust)';
export const RULE = 'var(--rule)';
export const LEDGER = 'var(--ledger)';
export const TODAY_MUTED = 'var(--today-muted)';
export const LILAC = 'var(--lilac)';
export const AQUA = 'var(--aqua)';
export const TANGERINE = 'var(--tangerine)';
export const FALLBACK_COLOR = 'var(--dust)';

/** A class stores one of nine palette hexes; each theme repaints that slot (--cc-* in index.css). */
const CLASS_SLOT: Record<string, string> = {
  '#aa92ff': 'lilac',
  '#ff8ab0': 'rose',
  '#a9e67e': 'pistachio',
  '#5ed9cb': 'aqua',
  '#ff9650': 'tangerine',
  '#f4de7b': 'butter',
  '#82c7ff': 'sky',
  '#e49bff': 'orchid',
  '#ff7a7a': 'coral',
};
export function themed(color: string): string {
  const slot = CLASS_SLOT[color.toLowerCase()];
  return slot ? `var(--cc-${slot})` : color;
}

export type UiStatus = 'todo' | 'progress' | 'done';

export const toUiStatus = (s: AssignmentStatus): UiStatus =>
  s === 'Completed' ? 'done' : s === 'In Progress' ? 'progress' : 'todo';

export const fromUiStatus = (s: UiStatus): AssignmentStatus =>
  s === 'done' ? 'Completed' : s === 'progress' ? 'In Progress' : 'Pending';

/* ---------- themes ---------- */

export interface ThemeDef {
  id: string;
  name: string;
  /** Swatch preview only; the real values live in index.css. */
  bg: string;
  text: string;
  accent: string;
  /** Google Fonts css2 family parameters for this theme's typefaces (night's ship with the page). */
  fonts?: string;
}

export const THEMES: ThemeDef[] = [
  { id: 'night', name: 'Night', bg: '#15121A', text: '#F1EBDD', accent: '#AA92FF' },
  {
    id: 'starry', name: 'Starry', bg: '#0B1026', text: '#EEF2FF', accent: '#FFD86B',
    fonts: 'family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400;1,500&family=Jost:wght@400;500;600',
  },
  {
    id: 'vibrant', name: 'Vibrant', bg: '#1A0B2E', text: '#FFF4E0', accent: '#FF5CAA',
    fonts: 'family=Fraunces:ital,wght@0,400;0,600;1,400;1,600&family=Outfit:wght@400;500;600&family=Space+Mono:wght@400;700',
  },
  {
    id: 'neon', name: 'Neon', bg: '#05060F', text: '#E6FFFB', accent: '#00F0FF',
    fonts: 'family=Rajdhani:wght@400;500;600;700&family=Exo+2:ital,wght@0,400;0,500;0,600;1,400&family=Share+Tech+Mono',
  },
  {
    id: 'noir', name: 'Noir', bg: '#0B0B0C', text: '#F4F4F2', accent: '#E5232F',
    fonts: 'family=Playfair+Display:ital,wght@0,400;0,500;1,400;1,500&family=Libre+Franklin:wght@400;500;600&family=Courier+Prime:wght@400;700',
  },
  {
    id: 'sunset', name: 'Sunset', bg: '#1C0F0A', text: '#FFEBD6', accent: '#FF7A45',
    fonts: 'family=DM+Serif+Display:ital@0;1&family=Nunito:wght@400;500;600',
  },
];

const THEME_KEY = 'night-ledger-theme';

export function currentTheme(): string {
  const t = document.documentElement.getAttribute('data-theme');
  return t && THEMES.some((x) => x.id === t) ? t : 'night';
}

/** Load a theme's typefaces on demand, so people only download the fonts of the theme they use. */
function ensureThemeFonts(id: string): void {
  const fonts = THEMES.find((t) => t.id === id)?.fonts;
  if (!fonts || document.querySelector(`link[data-theme-fonts="${id}"]`)) return;
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = `https://fonts.googleapis.com/css2?${fonts}&display=swap`;
  link.setAttribute('data-theme-fonts', id);
  document.head.appendChild(link);
}

/** Switch theme: set the attribute, remember it, and reset any colours cached from the old theme. */
export function applyTheme(id: string, persist = true): void {
  const root = document.documentElement;
  if (id === 'night') root.removeAttribute('data-theme');
  else root.setAttribute('data-theme', id);
  ensureThemeFonts(id);
  if (persist) {
    try {
      localStorage.setItem(THEME_KEY, id);
    } catch {
      /* storage blocked: the choice just won't persist */
    }
  }
  // Hover colours are cached per button on first hover; drop them so they re-read the new theme.
  document.querySelectorAll<HTMLElement>('[data-text],[data-outlined]').forEach((el) => {
    el.removeAttribute('data-text');
    el.removeAttribute('data-outlined');
    el.style.removeProperty('--hv-bg');
    el.style.removeProperty('--hv-fg');
  });
  const ink = getComputedStyle(root).getPropertyValue('--ink').trim();
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', ink);
}

export function loadSavedTheme(): void {
  try {
    const t = localStorage.getItem(THEME_KEY);
    if (t && THEMES.some((x) => x.id === t)) applyTheme(t, false);
  } catch {
    /* storage blocked */
  }
}

/** Real colour value for canvas use (confetti can't read CSS variables). */
export function resolveColor(c: string): string {
  const m = /^var\((--[\w-]+)\)$/.exec(c);
  if (!m) return c;
  return getComputedStyle(document.documentElement).getPropertyValue(m[1]).trim() || c;
}

/* ---------- dates ---------- */

export const MS_DAY = 86_400_000;
export const DAY_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
export const DAY_LONG = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
export const MONTH_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

/** Monday 00:00 of the week containing `d`, shifted by `offsetWeeks`. */
export function startOfWeek(d: Date, offsetWeeks = 0): Date {
  const x = startOfDay(d);
  const back = x.getDay() === 0 ? 6 : x.getDay() - 1;
  x.setDate(x.getDate() - back + offsetWeeks * 7);
  return x;
}

/** ISO-8601 week number. */
export function isoWeek(d: Date): number {
  const t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNum = t.getUTCDay() || 7;
  t.setUTCDate(t.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(t.getUTCFullYear(), 0, 1));
  return Math.ceil(((t.getTime() - yearStart.getTime()) / MS_DAY + 1) / 7);
}

/** 12-hour clock: 9:00 AM, 11:59 PM. */
function fmt12(h: number, m: number): string {
  const suffix = h >= 12 ? 'PM' : 'AM';
  return `${h % 12 || 12}:${m.toString().padStart(2, '0')} ${suffix}`;
}

export function fmtClock(d: Date): string {
  return fmt12(d.getHours(), d.getMinutes());
}

/** "HH:MM" (24h) string -> "9:00 AM" */
export function fmtHHMM(t: string): string {
  const [h, m] = t.split(':').map(Number);
  return fmt12(h, m || 0);
}

export function fmtMonthDay(d: Date): string {
  return `${MONTH_SHORT[d.getMonth()]} ${d.getDate()}`;
}

export function fmtDuration(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m ? `${h}h ${m}m` : `${h}h`;
}

export function fmtHours(minutes: number): string {
  return (minutes / 60).toFixed(1);
}

/** "Fri 9:00", "Today 21:00", "Tomorrow 9:00", or "Oct 14 9:00" when it's further out. */
export function fmtWhen(due: Date, now: Date): string {
  const dayDiff = Math.round((startOfDay(due).getTime() - startOfDay(now).getTime()) / MS_DAY);
  const clock = fmtClock(due);
  if (dayDiff === 0) return `Today ${clock}`;
  if (dayDiff === 1) return `Tomorrow ${clock}`;
  if (dayDiff > 1 && dayDiff < 7) return `${DAY_SHORT[due.getDay()]} ${clock}`;
  return `${fmtMonthDay(due)} ${clock}`;
}

/** Value for <input type="datetime-local">. */
export function toLocalInput(d: Date): string {
  const p = (n: number) => n.toString().padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}

/* ---------- study blocks in time ---------- */

export function chunkStart(c: TaskChunk): Date {
  const [y, m, d] = c.scheduledDate.split('-').map(Number);
  const x = new Date(y, m - 1, d);
  x.setMinutes(timeToMinutes(c.scheduledStartTime));
  return x;
}

export function chunkEnd(c: TaskChunk): Date {
  const [y, m, d] = c.scheduledDate.split('-').map(Number);
  const x = new Date(y, m - 1, d);
  x.setMinutes(timeToMinutes(c.scheduledEndTime));
  return x;
}

/** A block that ended without being finished (or was flagged missed). */
export function isChunkSlipped(c: TaskChunk, now: Date): boolean {
  if (c.status === 'Completed') return false;
  if (c.status === 'Missed') return true;
  return chunkEnd(c).getTime() <= now.getTime();
}

export function sortChunks(list: TaskChunk[]): TaskChunk[] {
  return [...list].sort(
    (a, b) =>
      a.scheduledDate.localeCompare(b.scheduledDate) ||
      a.scheduledStartTime.localeCompare(b.scheduledStartTime)
  );
}

/* ---------- colours ---------- */

export interface Swatch {
  color: string;
  ink: string;
}

export function courseOf(a: Assignment | undefined, courses: Map<string, Course>) {
  return a ? courses.get(a.courseId) : undefined;
}

export function courseColorOf(a: Assignment | undefined, courses: Map<string, Course>): string {
  const c = courseOf(a, courses);
  return themed(c?.color || a?.courseColor || FALLBACK_COLOR);
}

export function courseCodeOf(a: Assignment | undefined, courses: Map<string, Course>): string {
  const c = courseOf(a, courses);
  return c?.code || a?.courseCode || 'CLASS';
}

/* ---------- ledger numbers ---------- */

export interface ClassBar {
  courseId: string;
  name: string;
  fullName: string;
  color: string;
  open: number;
  inProgress: number;
  segs: Array<{ flex: number; filled: boolean }>;
  width: string;
  countLabel: string;
}

/**
 * Open (not done) work per class. A few open items get one block each; a big pile
 * collapses to two blocks (in progress / to do) so the bar stays readable.
 */
export function buildClassBars(courses: Course[], assignments: Assignment[]): ClassBar[] {
  const bars = courses.map((course) => {
    const open = assignments.filter((a) => a.courseId === course.id && a.status !== 'Completed');
    const inProgress = open.filter((a) => a.status === 'In Progress').length;
    const todo = open.length - inProgress;
    const segs =
      open.length <= 14
        ? open.map((a) => ({ flex: 1, filled: a.status === 'In Progress' }))
        : [
            { flex: inProgress, filled: true },
            { flex: todo, filled: false },
          ].filter((s) => s.flex > 0);
    return {
      courseId: course.id,
      name: course.code,
      fullName: course.name,
      color: themed(course.color),
      open: open.length,
      inProgress,
      segs,
      width: '0%',
      countLabel: open.length > 0 ? `${open.length} left` : 'clear',
    } satisfies ClassBar;
  });
  // Never wider than the track; scale is at least 6 so 1-2 open items don't look full.
  const scale = Math.max(6, ...bars.map((b) => b.open));
  bars.forEach((b) => {
    b.width = `${(b.open / scale) * 100}%`;
  });
  return bars;
}

export function dueDateOf(a: Assignment): Date {
  return new Date(a.dueDate);
}

export function byDue(a: Assignment, b: Assignment): number {
  return dueDateOf(a).getTime() - dueDateOf(b).getTime();
}

export { formatDateKey, parseDateKey as parseKey };
