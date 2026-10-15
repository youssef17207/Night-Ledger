import React, { useMemo, useState } from 'react';
import { Assignment, AvailabilityWindow, Course, TaskChunk } from '../types/scheduler';
import {
  DAY_SHORT,
  DUST,
  INK,
  LILAC,
  PAPER,
  RULE,
  TANGERINE,
  UiStatus,
  buildClassBars,
  byDue,
  chunkEnd,
  courseColorOf,
  dueDateOf,
  fmtDuration,
  formatDateKey,
  fmtHHMM,
  fmtWhen,
  isoWeek,
  sortChunks,
  startOfWeek,
} from '../utils/ledger';
import { AssignmentRow, BlockRow, NIGHT_TONE, PAPER_TONE, Tone } from './Rows';
import { AddCircle, Btn, Label, Tag } from './ui';

interface Props {
  now: Date;
  weekOffset: number;
  courses: Course[];
  assignments: Assignment[];
  chunks: TaskChunk[];
  windows: AvailabilityWindow[];
  onSetStatus: (id: string, status: UiStatus) => void;
  onOpenAssignment: (id: string) => void;
  onAdd: () => void;
  onToggleChunk: (chunk: TaskChunk) => void;
  onFocus: (chunk: TaskChunk) => void;
  onShiftChunk: (chunk: TaskChunk, dayDelta: number) => void;
  onResizeChunk: (chunk: TaskChunk, minutesDelta: number) => void;
  onOpenCourses: () => void;
  onOpenHours: () => void;
}

interface DaySection {
  key: string;
  date: Date;
  isToday: boolean;
  label: string;
  assignments: Assignment[];
  chunks: TaskChunk[];
}

export const WeekView: React.FC<Props> = ({
  now,
  weekOffset,
  courses,
  assignments,
  chunks,
  windows,
  onSetStatus,
  onOpenAssignment,
  onAdd,
  onToggleChunk,
  onFocus,
  onShiftChunk,
  onResizeChunk,
  onOpenCourses,
  onOpenHours,
}) => {
  const [classFilter, setClassFilter] = useState<string | null>(null);
  const [chartOpen, setChartOpen] = useState(false);
  // Day plans start folded (today's starts open); a click on the day's "Study plan" line flips it.
  const [planOpen, setPlanOpen] = useState<Record<string, boolean>>({});

  const courseMap = useMemo(() => new Map(courses.map((c) => [c.id, c])), [courses]);
  const assignmentMap = useMemo(() => new Map(assignments.map((a) => [a.id, a])), [assignments]);
  const activeFilter = classFilter && courseMap.has(classFilter) ? classFilter : null;

  const todayKey = formatDateKey(now);
  const weekStart = startOfWeek(now, weekOffset);
  const thisWeekStart = startOfWeek(now, 0);

  const visibleAssignments = useMemo(
    () => assignments.filter((a) => !activeFilter || a.courseId === activeFilter).sort(byDue),
    [assignments, activeFilter]
  );
  const visibleChunks = useMemo(
    () =>
      chunks.filter((c) => {
        if (!activeFilter) return true;
        return assignmentMap.get(c.assignmentId)?.courseId === activeFilter;
      }),
    [chunks, assignmentMap, activeFilter]
  );

  const open = visibleAssignments.filter((a) => a.status !== 'Completed');
  const next = open[0];
  const upcoming = open.slice(1, 6);
  const dueToday = open.filter((a) => formatDateKey(dueDateOf(a)) === todayKey).length;

  const nextBlock = sortChunks(visibleChunks).find((c) => c.status !== 'Completed' && chunkEnd(c).getTime() > now.getTime());

  const days: DaySection[] = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const date = new Date(weekStart);
      date.setDate(weekStart.getDate() + i);
      const key = formatDateKey(date);
      const isToday = key === todayKey;
      return {
        key,
        date,
        isToday,
        label: isToday ? `${DAY_SHORT[date.getDay()]} · Today` : DAY_SHORT[date.getDay()],
        assignments: visibleAssignments.filter((a) => formatDateKey(dueDateOf(a)) === key),
        chunks: sortChunks(visibleChunks.filter((c) => c.scheduledDate === key)),
      };
    });
  }, [weekStart.getTime(), todayKey, visibleAssignments, visibleChunks]);

  const weekAssignments = days.flatMap((d) => d.assignments);
  const weekDone = weekAssignments.filter((a) => a.status === 'Completed').length;
  const progressLabel = `${weekDone} of ${weekAssignments.length} done this week`;

  // Open work from before this week that has no day section to live in.
  const late =
    weekOffset === 0
      ? visibleAssignments.filter((a) => a.status !== 'Completed' && dueDateOf(a).getTime() < thisWeekStart.getTime())
      : [];

  const bars = buildClassBars(courses, assignments);

  const nextColor = next ? courseColorOf(next, courseMap) : PAPER;
  const nextCourseCode = next ? courseMap.get(next.courseId)?.code || next.courseCode : '';

  return (
    <div>
      <header className="flex flex-col gap-[30px] pb-12">
        <div className="flex flex-wrap items-start gap-x-14 gap-y-10">
          <div className="flex min-w-0 flex-[1_1_520px] flex-col gap-[30px]">
            <h1
              className="m-0 font-serif font-normal"
              style={{ fontSize: 'clamp(64px, 12vw, 96px)', lineHeight: 0.9, letterSpacing: '-0.03em' }}
            >
              Week <span className="italic">{isoWeek(weekStart)}</span>
            </h1>

            <div>
              <p className="m-0 font-serif text-[26px] italic leading-[1.3] sm:text-[32px]">
                Next up:{' '}
                {next ? (
                  <>
                    <button
                      type="button"
                      onClick={() => onOpenAssignment(next.id)}
                      title={`${nextCourseCode}: open details`}
                      className="cursor-pointer border-none align-middle font-sans text-[20px] font-medium not-italic uppercase sm:text-[24px]"
                      style={{ padding: '0 10px', background: nextColor, color: INK, letterSpacing: '0.04em', textAlign: 'left' }}
                    >
                      {next.title}
                    </button>{' '}
                    <span className="font-mono text-[16px] not-italic" style={{ color: DUST, letterSpacing: '0.04em' }}>
                      {fmtWhen(dueDateOf(next), now)}
                    </span>
                  </>
                ) : (
                  <>
                    <span
                      className="align-middle font-sans text-[20px] font-medium not-italic uppercase sm:text-[24px]"
                      style={{ padding: '0 10px', background: PAPER, color: INK, letterSpacing: '0.04em' }}
                    >
                      {assignments.length === 0 ? 'Nothing yet' : 'Nothing, all clear'}
                    </span>
                  </>
                )}
              </p>
              {nextBlock && (
                <p className="m-0 mt-2 font-mono text-[13px]" style={{ color: DUST, letterSpacing: '0.04em' }}>
                  Study block · {fmtWhen(new Date(nextBlock.scheduledDate + 'T' + nextBlock.scheduledStartTime), now)}–
                  {fmtHHMM(nextBlock.scheduledEndTime)} · {nextBlock.chunkLabel}
                </p>
              )}
            </div>

            <div className="flex max-w-[760px] flex-col gap-[10px]">
              <button
                type="button"
                onClick={() => setChartOpen((o) => !o)}
                aria-expanded={chartOpen}
                className="flex w-fit cursor-pointer items-center gap-3 border-none bg-transparent p-0 text-left"
                style={{ color: DUST }}
              >
                <Label>Open work per class · {progressLabel}</Label>
                <span className="font-mono text-[12px]" aria-hidden="true">
                  {chartOpen ? '▴' : '▾'}
                </span>
              </button>
              {!chartOpen && activeFilter && (
                <span className="font-mono text-[12px]" style={{ color: DUST, letterSpacing: '0.04em' }}>
                  Showing one class only
                  {' · '}
                  <button
                    type="button"
                    onClick={() => setClassFilter(null)}
                    className="cursor-pointer border-none bg-transparent p-0 font-mono text-[12px] underline"
                    style={{ color: PAPER }}
                  >
                    Show all classes
                  </button>
                </span>
              )}
              {bars.length === 0 && (
                <div className="flex flex-wrap items-center gap-4 py-2">
                  <span className="font-mono text-[13px]" style={{ color: DUST }}>
                    No classes yet.
                  </span>
                  <Btn small onClick={onOpenCourses}>
                    Add your classes
                  </Btn>
                </div>
              )}
              {chartOpen && bars.map((b) => {
                const selected = activeFilter === b.courseId;
                return (
                  <div key={b.courseId} className="flex min-h-8 items-center gap-[14px]">
                    <span className="w-[92px] flex-none">
                      <button
                        type="button"
                        onClick={() => setClassFilter(selected ? null : b.courseId)}
                        title={selected ? `Showing only ${b.fullName}. Click to show all.` : `Show only ${b.fullName}`}
                        aria-pressed={selected}
                        className="block max-w-full cursor-pointer border-none bg-transparent p-0"
                        style={{ outline: selected ? `2px solid ${PAPER}` : 'none', outlineOffset: 2 }}
                      >
                        <Tag color={b.color}>{b.name}</Tag>
                      </button>
                    </span>
                    <div aria-hidden="true" className="flex h-[22px] min-w-0 flex-[1_1_0] items-center">
                      {b.open === 0 && <span className="flex-[1_1_0]" style={{ borderBottom: `2px dotted ${RULE}` }} />}
                      {b.open > 0 && (
                        <div className="flex h-[22px] gap-[3px]" style={{ width: b.width, minWidth: 14 }}>
                          {b.segs.map((s, i) => (
                            <span
                              key={i}
                              className="min-w-0 box-border"
                              style={{
                                flex: `${s.flex} 1 0`,
                                background: s.filled ? b.color : 'transparent',
                                border: `2px solid ${b.color}`,
                              }}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                    <span className="w-16 flex-none text-right font-mono text-[13px]" style={{ color: DUST }}>
                      {b.countLabel}
                    </span>
                  </div>
                );
              })}
              {chartOpen && (
              <span className="font-mono text-[12px]" style={{ color: DUST, letterSpacing: '0.04em' }}>
                Filled = in progress · Outlined = to do · Done drops off the chart
                {activeFilter && (
                  <>
                    {' · '}
                    <button
                      type="button"
                      onClick={() => setClassFilter(null)}
                      className="cursor-pointer border-none bg-transparent p-0 font-mono text-[12px] underline"
                      style={{ color: PAPER }}
                    >
                      Show all classes
                    </button>
                  </>
                )}
              </span>
              )}
            </div>
          </div>

          <aside className="flex min-w-[260px] flex-[0_1_360px] flex-col gap-[26px]">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-baseline gap-3">
                <span className="font-serif text-[72px] italic leading-[0.9]">{dueToday}</span>
                <span className="font-mono text-[13px] uppercase" style={{ letterSpacing: '0.14em', color: DUST }}>
                  due today
                </span>
              </div>
              <AddCircle onClick={onAdd} />
            </div>
            <div className="flex flex-col">
              <span className="pb-3 font-mono text-[13px] uppercase" style={{ letterSpacing: '0.08em', color: DUST }}>
                After that
              </span>
              {upcoming.length === 0 && (
                <div className="flex min-h-12 items-center" style={{ borderTop: `1px solid ${RULE}` }}>
                  <span className="font-mono text-[13px]" style={{ color: DUST }}>
                    {open.length === 0 ? 'Nothing waiting.' : 'That was the last one.'}
                  </span>
                </div>
              )}
              {upcoming.map((u) => (
                <button
                  key={u.id}
                  type="button"
                  onClick={() => onOpenAssignment(u.id)}
                  className="flex min-h-12 cursor-pointer items-center gap-3 border-none bg-transparent p-0 text-left"
                  style={{ borderTop: `1px solid ${RULE}`, color: PAPER }}
                >
                  <span className="h-[10px] w-[10px] flex-none" style={{ background: courseColorOf(u, courseMap) }} />
                  <span
                    className="min-w-0 flex-[1_1_0] text-[15px] font-medium uppercase"
                    style={{ letterSpacing: '0.04em', overflowWrap: 'anywhere' }}
                  >
                    {u.title}
                  </span>
                  <span className="flex-none font-mono text-[13px]" style={{ color: DUST }}>
                    {fmtWhen(dueDateOf(u), now).replace('Tomorrow ', 'Tmrw ')}
                  </span>
                </button>
              ))}
            </div>
          </aside>
        </div>
      </header>

      {assignments.length === 0 && (
        <GettingStarted
          hasCourses={courses.length > 0}
          hasHours={windows.length > 0}
          onOpenCourses={onOpenCourses}
          onOpenHours={onOpenHours}
          onAdd={onAdd}
        />
      )}
      {assignments.length > 0 && windows.length === 0 && (
        <div
          className="mb-8 flex flex-wrap items-center justify-between gap-4 px-5 py-4"
          style={{ border: `2px solid ${LILAC}` }}
        >
          <span className="max-w-[640px] text-[15px] font-medium">
            You have not set any free hours, so nothing is being planned yet. Tell Night Ledger when you can study and it
            will split your homework into blocks automatically.
          </span>
          <Btn variant="solid" onClick={onOpenHours}>
            Set free hours
          </Btn>
        </div>
      )}

      {late.length > 0 && (
        <section
          className="flex flex-wrap items-start gap-x-10 gap-y-4 py-7"
          style={{ borderTop: `1px solid ${RULE}`, boxSizing: 'border-box' }}
        >
          <div className="flex w-[150px] flex-none flex-col gap-1">
            <span className="font-mono text-[13px] uppercase" style={{ letterSpacing: '0.14em', color: TANGERINE }}>
              Still open
            </span>
            <span className="font-serif text-[92px] leading-[0.9]" style={{ letterSpacing: '-0.03em' }}>
              {late.length}
            </span>
          </div>
          <div className="flex min-w-0 flex-[1_1_360px] flex-col gap-1 pt-1">
            {late.map((a) => (
              <AssignmentRow
                key={a.id}
                assignment={a}
                courses={courseMap}
                tone={NIGHT_TONE}
                now={now}
                whenMode="date"
                showStatus={false}
                onSetStatus={onSetStatus}
                onOpen={onOpenAssignment}
              />
            ))}
          </div>
        </section>
      )}

      {days.map((d) => {
        const tone: Tone = d.isToday ? PAPER_TONE : NIGHT_TONE;
        const empty = d.assignments.length === 0 && d.chunks.length === 0;
        if (empty) {
          // Nothing planned or due: a single slim line instead of a full-height day block.
          return (
            <section
              key={d.key}
              aria-label={`${DAY_SHORT[d.date.getDay()]} ${d.date.getDate()}, nothing due`}
              className="flex items-center gap-4"
              style={{
                boxSizing: 'border-box',
                padding: d.isToday ? '16px 20px' : '14px 0',
                margin: d.isToday ? '0 -20px' : '0',
                background: d.isToday ? PAPER : 'transparent',
                color: tone.ink,
                borderTop: d.isToday ? 'none' : `1px solid ${RULE}`,
                boxShadow: d.isToday ? `8px 8px 0 ${LILAC}` : 'none',
              }}
            >
              <span className="flex w-[150px] flex-none items-baseline gap-3">
                <span className="font-serif text-[40px] leading-none" style={{ letterSpacing: '-0.03em' }}>
                  {d.date.getDate()}
                </span>
                <span className="font-mono text-[13px] uppercase" style={{ letterSpacing: '0.14em', color: tone.muted }}>
                  {d.label}
                </span>
              </span>
              <span
                aria-hidden="true"
                className="h-px flex-[1_1_24px]"
                style={{ borderBottom: '2px dotted currentColor', opacity: 0.3 }}
              />
              <span className="flex-none font-mono text-[13px]" style={{ color: tone.muted }}>
                Nothing due
              </span>
            </section>
          );
        }
        return (
          <section
            key={d.key}
            aria-label={`${DAY_SHORT[d.date.getDay()]} ${d.date.getDate()}`}
            className="flex flex-wrap items-start gap-x-10 gap-y-4"
            style={{
              boxSizing: 'border-box',
              padding: d.isToday ? '28px 20px' : '28px 0',
              margin: d.isToday ? '0 -20px' : '0',
              background: d.isToday ? PAPER : 'transparent',
              color: tone.ink,
              borderTop: d.isToday ? 'none' : `1px solid ${RULE}`,
              boxShadow: d.isToday ? `8px 8px 0 ${LILAC}` : 'none',
            }}
          >
            <div className="flex w-[150px] flex-none flex-col gap-1">
              <span className="font-mono text-[13px] uppercase" style={{ letterSpacing: '0.14em', color: tone.muted }}>
                {d.label}
              </span>
              <span className="font-serif text-[92px] leading-[0.9]" style={{ letterSpacing: '-0.03em' }}>
                {d.date.getDate()}
              </span>
            </div>

            <div className="flex min-w-0 flex-[1_1_360px] flex-col gap-1 pt-1">
              {empty && (
                <div className="flex min-h-[52px] items-center gap-3">
                  <span
                    aria-hidden="true"
                    className="h-px flex-[1_1_24px]"
                    style={{ borderBottom: '2px dotted currentColor', opacity: 0.3 }}
                  />
                  <span className="flex-none font-mono text-[13px]" style={{ color: tone.muted }}>
                    Nothing due
                  </span>
                </div>
              )}

              {d.assignments.map((a) => (
                <AssignmentRow
                  key={a.id}
                  assignment={a}
                  courses={courseMap}
                  tone={tone}
                  now={now}
                  showStatus={false}
                  onSetStatus={onSetStatus}
                  onOpen={onOpenAssignment}
                />
              ))}

              {d.chunks.length > 0 && (() => {
                const planIsOpen = planOpen[d.key] ?? d.isToday;
                const planMinutes = d.chunks.reduce((s, c) => s + c.durationMinutes, 0);
                return (
                  <div className="mt-3 flex flex-col gap-1">
                    <button
                      type="button"
                      onClick={() => setPlanOpen((p) => ({ ...p, [d.key]: !planIsOpen }))}
                      aria-expanded={planIsOpen}
                      className="flex w-full cursor-pointer items-center justify-between gap-3 bg-transparent pb-1 pt-2 text-left font-mono text-[12px] uppercase"
                      style={{ letterSpacing: '0.08em', color: tone.muted, border: 'none', borderTop: `1px dotted ${tone.muted}` }}
                    >
                      <span>
                        Study plan · {d.chunks.length} {d.chunks.length === 1 ? 'block' : 'blocks'} · {fmtDuration(planMinutes)}
                      </span>
                      <span aria-hidden="true">{planIsOpen ? '▴' : '▾'}</span>
                    </button>
                    {planIsOpen &&
                      d.chunks.map((c) => (
                        <BlockRow
                          key={c.id}
                          chunk={c}
                          assignment={assignmentMap.get(c.assignmentId)}
                          courses={courseMap}
                          tone={tone}
                          now={now}
                          variant="week"
                          onToggle={onToggleChunk}
                          onFocus={onFocus}
                          onShift={onShiftChunk}
                          onResize={onResizeChunk}
                        />
                      ))}
                  </div>
                );
              })()}
            </div>
          </section>
        );
      })}
      <div style={{ borderTop: `1px solid ${RULE}` }} />
    </div>
  );
};

const GettingStarted: React.FC<{
  hasCourses: boolean;
  hasHours: boolean;
  onOpenCourses: () => void;
  onOpenHours: () => void;
  onAdd: () => void;
}> = ({ hasCourses, hasHours, onOpenCourses, onOpenHours, onAdd }) => {
  const steps = [
    {
      n: '1',
      done: hasCourses,
      title: 'Add your classes',
      body: 'Name each class and give it a colour. Every assignment will wear it.',
      action: 'Add classes',
      run: onOpenCourses,
    },
    {
      n: '2',
      done: hasHours,
      title: 'Set your free hours',
      body: 'Tell us when you can study. Long assignments get split into blocks that fit those windows.',
      action: 'Set free hours',
      run: onOpenHours,
    },
    {
      n: '3',
      done: false,
      title: 'Add your first assignment',
      body: 'Pick a class, a due date and how long it should take. We handle the planning.',
      action: 'Add assignment',
      run: onAdd,
    },
  ];
  return (
    <section className="mb-10" style={{ background: PAPER, color: INK, boxShadow: `8px 8px 0 ${LILAC}`, padding: '28px 24px' }}>
      <div className="mb-5 flex flex-wrap items-baseline justify-between gap-3">
        <h2 className="m-0 font-serif text-[44px] font-normal italic leading-none" style={{ letterSpacing: '-0.02em' }}>
          A blank ledger.
        </h2>
        <span className="font-mono text-[13px] uppercase" style={{ letterSpacing: '0.08em', color: '#5B5568' }}>
          Three steps to get going
        </span>
      </div>
      <div className="flex flex-col">
        {steps.map((s) => (
          <div
            key={s.n}
            className="flex flex-wrap items-center gap-x-4 gap-y-2 py-4"
            style={{ borderTop: '1px solid rgba(21,18,26,0.25)', opacity: s.done ? 0.55 : 1 }}
          >
            <span
              className="flex h-[22px] w-[22px] flex-none items-center justify-center font-mono text-[12px] font-medium"
              style={{ border: `2px solid ${INK}`, background: s.done ? INK : 'transparent', color: s.done ? PAPER : INK }}
              aria-hidden="true"
            >
              {s.done ? '✓' : s.n}
            </span>
            <div className="min-w-0 flex-[1_1_320px]">
              <div className="text-[17px] font-semibold uppercase" style={{ letterSpacing: '0.05em' }}>
                {s.title}
              </div>
              <div className="text-[15px]" style={{ color: '#5B5568' }}>
                {s.body}
              </div>
            </div>
            <button
              type="button"
              onClick={s.run}
              className="h-11 flex-none cursor-pointer px-4 font-mono text-[12px] font-medium uppercase"
              style={{ background: s.done ? 'transparent' : INK, color: s.done ? INK : PAPER, border: `2px solid ${INK}`, letterSpacing: '0.06em' }}
            >
              {s.done ? 'Edit' : s.action}
            </button>
          </div>
        ))}
      </div>
    </section>
  );
};

// Re-exported so App can compute the header label without duplicating week math.
export function weekRangeLabel(now: Date, offset: number): string {
  const start = startOfWeek(now, offset);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  const m = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const left = `${m[start.getMonth()]} ${start.getDate()}`;
  const right = start.getMonth() === end.getMonth() ? `${end.getDate()}` : `${m[end.getMonth()]} ${end.getDate()}`;
  return `${left} – ${right}`;
}
