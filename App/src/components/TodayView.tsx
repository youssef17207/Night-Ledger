import React, { useMemo, useState } from 'react';
import { Assignment, Course, TaskChunk } from '../types/scheduler';
import {
  DAY_LONG,
  DUST,
  INK,
  LILAC,
  PAPER,
  RULE,
  UiStatus,
  byDue,
  chunkEnd,
  chunkStart,
  courseCodeOf,
  courseColorOf,
  dueDateOf,
  fmtDuration,
  fmtHHMM,
  fmtHours,
  fmtMonthDay,
  formatDateKey,
  isChunkSlipped,
  sortChunks,
} from '../utils/ledger';
import { AssignmentRow, BlockRow, NIGHT_TONE } from './Rows';
import { AddCircle, Btn, Chip, Label, Tag } from './ui';

interface Props {
  now: Date;
  courses: Course[];
  assignments: Assignment[];
  chunks: TaskChunk[];
  onToggleChunk: (chunk: TaskChunk) => void;
  onFocus: (chunk: TaskChunk) => void;
  onLater: (chunk: TaskChunk) => void;
  onAutoFix: () => void;
  onAdd: () => void;
  onSetStatus: (id: string, status: UiStatus) => void;
  onOpenAssignment: (id: string) => void;
  onOpenHours: () => void;
}

type Filter = 'all' | 'todo' | 'done';

export const TodayView: React.FC<Props> = ({
  now,
  courses,
  assignments,
  chunks,
  onToggleChunk,
  onFocus,
  onLater,
  onAutoFix,
  onAdd,
  onSetStatus,
  onOpenAssignment,
  onOpenHours,
}) => {
  const [filter, setFilter] = useState<Filter>('all');
  const courseMap = useMemo(() => new Map(courses.map((c) => [c.id, c])), [courses]);
  const assignmentMap = useMemo(() => new Map(assignments.map((a) => [a.id, a])), [assignments]);

  const todayKey = formatDateKey(now);
  const todayChunks = sortChunks(chunks.filter((c) => c.scheduledDate === todayKey));
  const doneCount = todayChunks.filter((c) => c.status === 'Completed').length;
  const total = todayChunks.length;
  const plannedMinutes = todayChunks.reduce((s, c) => s + c.durationMinutes, 0);
  const remainingMinutes = todayChunks.filter((c) => c.status !== 'Completed').reduce((s, c) => s + c.durationMinutes, 0);

  const slippedCount = chunks.filter((c) => isChunkSlipped(c, now)).length;

  // The block to do right now: one in progress, otherwise the next to start, otherwise the earliest unfinished.
  const unfinished = todayChunks.filter((c) => c.status !== 'Completed');
  const nextChunk =
    unfinished.find((c) => chunkStart(c) <= now && now < chunkEnd(c)) ||
    unfinished.find((c) => chunkStart(c) > now) ||
    unfinished[0];
  const nextAssignment = nextChunk ? assignmentMap.get(nextChunk.assignmentId) : undefined;
  const nextColor = courseColorOf(nextAssignment, courseMap);

  const dueToday = assignments.filter((a) => formatDateKey(dueDateOf(a)) === todayKey).sort(byDue);

  const visible = todayChunks.filter((c) =>
    filter === 'todo' ? c.status !== 'Completed' : filter === 'done' ? c.status === 'Completed' : true
  );

  const hour = now.getHours();

  const nextStatus = (() => {
    if (!nextChunk) return '';
    const s = chunkStart(nextChunk).getTime();
    const e = chunkEnd(nextChunk).getTime();
    const t = now.getTime();
    if (t >= s && t < e) return `Happening now · ends ${fmtHHMM(nextChunk.scheduledEndTime)}`;
    if (t < s) {
      const mins = Math.round((s - t) / 60000);
      return mins < 1 ? 'Starting now' : mins < 60 ? `Starts in ${mins} min` : `Starts in ${Math.floor(mins / 60)}h ${mins % 60}m`;
    }
    return `Slipped ${Math.max(1, Math.round((t - e) / 60000))} min ago`;
  })();

  return (
    <div>
      <header className="flex flex-wrap items-start gap-x-14 gap-y-8 pb-12">
        <div className="flex min-w-0 flex-[1_1_520px] flex-col gap-[26px]">
          <div className="flex flex-col gap-3">
            <Label wide>
              {DAY_LONG[now.getDay()]} · {fmtMonthDay(now)}
            </Label>
            <h1
              className="m-0 font-serif font-normal"
              style={{ fontSize: 'clamp(56px, 11vw, 96px)', lineHeight: 0.9, letterSpacing: '-0.03em' }}
            >
              Good <span className="italic">{hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : 'evening'}</span>.
            </h1>
          </div>
          <p className="m-0 font-serif text-[26px] italic leading-[1.3] sm:text-[32px]">
            {total === 0
              ? 'No study blocks planned today.'
              : doneCount === total
              ? 'Every block done. Nicely finished.'
              : `${total - doneCount} ${total - doneCount === 1 ? 'block' : 'blocks'} left, ${fmtDuration(remainingMinutes)} of work.`}
          </p>

          {total > 0 && (
            <div className="flex max-w-[760px] flex-col gap-[10px]">
              <Label>Today's blocks</Label>
              <div className="flex h-[22px] gap-[3px]" aria-hidden="true">
                {todayChunks.map((c) => {
                  const col = courseColorOf(assignmentMap.get(c.assignmentId), courseMap);
                  return (
                    <span
                      key={c.id}
                      className="box-border min-w-0"
                      style={{
                        flex: `${c.durationMinutes} 1 0`,
                        background: c.status === 'Completed' ? col : 'transparent',
                        border: `2px solid ${col}`,
                      }}
                    />
                  );
                })}
              </div>
              <span className="font-mono text-[12px]" style={{ color: DUST, letterSpacing: '0.04em' }}>
                Filled = finished · Outlined = still to do · {fmtHours(plannedMinutes)} hrs planned
              </span>
            </div>
          )}
        </div>

        <aside className="flex min-w-[260px] flex-[0_1_360px] flex-col gap-[26px]">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-baseline gap-3">
              <span className="font-serif text-[72px] italic leading-[0.9]">
                {doneCount}
                <span style={{ color: DUST }}>/{total}</span>
              </span>
              <span className="font-mono text-[13px] uppercase" style={{ letterSpacing: '0.14em', color: DUST }}>
                done
              </span>
            </div>
            <AddCircle onClick={onAdd} />
          </div>
          {slippedCount > 0 && (
            <div className="flex flex-col gap-3 p-4" style={{ border: '2px solid #FF9650' }}>
              <span className="text-[15px] font-medium">
                {slippedCount} study {slippedCount === 1 ? 'block has' : 'blocks have'} slipped past.
              </span>
              <Btn variant="solid" bg="#FF9650" onClick={onAutoFix}>
                Auto-fix schedule
              </Btn>
            </div>
          )}
        </aside>
      </header>

      {nextChunk && (
        <section
          className="mb-10 flex flex-wrap items-center justify-between gap-x-10 gap-y-5"
          style={{ background: PAPER, color: INK, boxShadow: `8px 8px 0 ${nextColor}`, padding: '28px 24px' }}
        >
          <div className="flex min-w-0 flex-[1_1_360px] flex-col gap-3">
            <span className="font-mono text-[13px] uppercase" style={{ letterSpacing: '0.14em', color: '#5B5568' }}>
              Do this next · {nextStatus}
            </span>
            <div className="flex flex-wrap items-center gap-3">
              <Tag color={nextColor} title={nextAssignment?.courseName}>
                {courseCodeOf(nextAssignment, courseMap)}
              </Tag>
              <span className="font-mono text-[14px]" style={{ color: '#5B5568' }}>
                {fmtHHMM(nextChunk.scheduledStartTime)}–{fmtHHMM(nextChunk.scheduledEndTime)} · {nextChunk.durationMinutes} min
              </span>
            </div>
            <h2
              className="m-0 font-serif text-[36px] font-normal leading-[1.05] sm:text-[44px]"
              style={{ letterSpacing: '-0.02em', overflowWrap: 'anywhere' }}
            >
              {nextChunk.chunkLabel}
            </h2>
            {nextAssignment && (
              <span className="font-mono text-[13px]" style={{ color: '#5B5568' }}>
                Due {fmtMonthDay(dueDateOf(nextAssignment))}
              </span>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Btn variant="solid" bg={INK} style={{ color: PAPER }} onClick={() => onFocus(nextChunk)}>
              ▶ Start focus timer
            </Btn>
            <Btn style={{ color: INK }} onClick={() => onToggleChunk(nextChunk)}>
              ✓ Finished
            </Btn>
          </div>
        </section>
      )}

      <section className="flex flex-wrap items-start gap-x-10 gap-y-4 py-7" style={{ borderTop: `1px solid ${RULE}` }}>
        <div className="flex w-[150px] flex-none flex-col gap-2">
          <span className="font-mono text-[13px] uppercase" style={{ letterSpacing: '0.14em', color: DUST }}>
            Study plan
          </span>
          <div className="flex flex-col gap-2">
            {(['all', 'todo', 'done'] as Filter[]).map((f) => (
              <Chip key={f} active={filter === f} onClick={() => setFilter(f)} className="justify-between">
                <span>{f === 'all' ? 'All' : f === 'todo' ? 'To do' : 'Done'}</span>
                <span>{f === 'all' ? total : f === 'todo' ? total - doneCount : doneCount}</span>
              </Chip>
            ))}
          </div>
        </div>
        <div className="flex min-w-0 flex-[1_1_360px] flex-col gap-1 pt-1">
          {total === 0 && (
            <div className="flex flex-col items-start gap-4 py-2">
              <span className="max-w-[520px] text-[17px] font-medium">
                Nothing is scheduled today. Add an assignment and it will be split into blocks that fit your free hours, or
                review your hours if you expected something here.
              </span>
              <div className="flex flex-wrap gap-3">
                <Btn variant="solid" onClick={onAdd}>
                  Add assignment
                </Btn>
                <Btn onClick={onOpenHours}>Free hours</Btn>
              </div>
            </div>
          )}
          {total > 0 && visible.length === 0 && (
            <span className="font-mono text-[13px]" style={{ color: DUST }}>
              Nothing matches this filter.
            </span>
          )}
          {visible.map((c) => (
            <BlockRow
              key={c.id}
              chunk={c}
              assignment={assignmentMap.get(c.assignmentId)}
              courses={courseMap}
              tone={NIGHT_TONE}
              now={now}
              variant="today"
              onToggle={onToggleChunk}
              onFocus={onFocus}
              onLater={onLater}
            />
          ))}
        </div>
      </section>

      <section className="flex flex-wrap items-start gap-x-10 gap-y-4 py-7" style={{ borderTop: `1px solid ${RULE}` }}>
        <div className="flex w-[150px] flex-none flex-col gap-1">
          <span className="font-mono text-[13px] uppercase" style={{ letterSpacing: '0.14em', color: DUST }}>
            Due today
          </span>
          <span className="font-serif text-[92px] leading-[0.9]" style={{ letterSpacing: '-0.03em', color: LILAC }}>
            {dueToday.filter((a) => a.status !== 'Completed').length}
          </span>
        </div>
        <div className="flex min-w-0 flex-[1_1_360px] flex-col gap-1 pt-1">
          {dueToday.length === 0 && (
            <div className="flex min-h-[52px] items-center gap-3">
              <span
                aria-hidden="true"
                className="h-px flex-[1_1_24px]"
                style={{ borderBottom: '2px dotted currentColor', opacity: 0.3 }}
              />
              <span className="flex-none font-mono text-[13px]" style={{ color: DUST }}>
                Nothing due
              </span>
            </div>
          )}
          {dueToday.map((a) => (
            <AssignmentRow
              key={a.id}
              assignment={a}
              courses={courseMap}
              tone={NIGHT_TONE}
              now={now}
              onSetStatus={onSetStatus}
              onOpen={onOpenAssignment}
            />
          ))}
        </div>
      </section>
      <div style={{ borderTop: `1px solid ${RULE}` }} />
    </div>
  );
};
