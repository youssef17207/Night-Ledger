import { Assignment, AssignmentStatus, Course, TaskChunk } from '../types/scheduler';
import { formatDateKey, parseDateKey, timeToMinutes } from './schedulerEngine';

/* Night Ledger palette (from "Palette & type") */
export const INK = '#15121A';
export const PAPER = '#F1EBDD';
export const DUST = '#A59FB0';
export const RULE = '#3A3445';
export const LEDGER = '#1D1924';
export const TODAY_MUTED = '#5B5568';
export const LILAC = '#AA92FF';
export const AQUA = '#5ED9CB';
export const TANGERINE = '#FF9650';
export const FALLBACK_COLOR = '#A59FB0';

export type UiStatus = 'todo' | 'progress' | 'done';

export const toUiStatus = (s: AssignmentStatus): UiStatus =>
  s === 'Completed' ? 'done' : s === 'In Progress' ? 'progress' : 'todo';

export const fromUiStatus = (s: UiStatus): AssignmentStatus =>
  s === 'done' ? 'Completed' : s === 'progress' ? 'In Progress' : 'Pending';

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

/** 24h clock without a leading zero on the hour, as in the mockup: 9:00, 23:59. */
export function fmtClock(d: Date): string {
  return `${d.getHours()}:${d.getMinutes().toString().padStart(2, '0')}`;
}

/** "HH:MM" string -> "9:00" */
export function fmtHHMM(t: string): string {
  const [h, m] = t.split(':').map(Number);
  return `${h}:${(m || 0).toString().padStart(2, '0')}`;
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
  return c?.color || a?.courseColor || FALLBACK_COLOR;
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
      color: course.color,
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
