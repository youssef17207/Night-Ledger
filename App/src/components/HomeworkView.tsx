import React, { useMemo, useState } from 'react';
import { Assignment, Course, TaskChunk } from '../types/scheduler';
import {
  DUST,
  PAPER,
  RULE,
  TANGERINE,
  UiStatus,
  byDue,
  dueDateOf,
  fmtDuration,
  startOfDay,
  startOfWeek,
  MS_DAY,
  themed,
} from '../utils/ledger';
import { AssignmentRow, NIGHT_TONE } from './Rows';
import { AddCircle, Btn, Chip } from './ui';

interface Props {
  now: Date;
  courses: Course[];
  assignments: Assignment[];
  chunks: TaskChunk[];
  onAdd: () => void;
  onSetStatus: (id: string, status: UiStatus) => void;
  onOpenAssignment: (id: string) => void;
  onOpenCourses: () => void;
}

type StatusFilter = 'all' | 'active' | 'done';

export const HomeworkView: React.FC<Props> = ({
  now,
  courses,
  assignments,
  chunks,
  onAdd,
  onSetStatus,
  onOpenAssignment,
  onOpenCourses,
}) => {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('active');
  const [classFilter, setClassFilter] = useState<string>('all');
  const [query, setQuery] = useState('');

  const courseMap = useMemo(() => new Map(courses.map((c) => [c.id, c])), [courses]);
  const activeCount = assignments.filter((a) => a.status !== 'Completed').length;
  const doneCount = assignments.length - activeCount;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return assignments
      .filter((a) => {
        if (classFilter !== 'all' && a.courseId !== classFilter) return false;
        if (statusFilter === 'active' && a.status === 'Completed') return false;
        if (statusFilter === 'done' && a.status !== 'Completed') return false;
        if (q) {
          const hay = `${a.title} ${a.courseCode} ${a.courseName} ${a.notes || ''}`.toLowerCase();
          if (!hay.includes(q)) return false;
        }
        return true;
      })
      .sort(byDue);
  }, [assignments, classFilter, statusFilter, query]);

  // Group by when it's due, relative to right now.
  const todayStart = startOfDay(now).getTime();
  const weekEnd = startOfWeek(now, 1).getTime();
  const groups: Array<{ key: string; label: string; accent?: string; items: Assignment[] }> = [
    { key: 'late', label: 'Late', accent: TANGERINE, items: [] },
    { key: 'today', label: 'Today', items: [] },
    { key: 'week', label: 'This week', items: [] },
    { key: 'later', label: 'Later', items: [] },
    { key: 'done', label: 'Done', items: [] },
  ];
  filtered.forEach((a) => {
    const due = dueDateOf(a).getTime();
    if (a.status === 'Completed') groups[4].items.push(a);
    else if (due < now.getTime() && due < todayStart) groups[0].items.push(a);
    else if (due < todayStart + MS_DAY) groups[1].items.push(a);
    else if (due < weekEnd) groups[2].items.push(a);
    else groups[3].items.push(a);
  });

  const hasAny = assignments.length > 0;

  return (
    <div>
      <header className="flex flex-wrap items-start gap-x-14 gap-y-8 pb-10">
        <div className="flex min-w-0 flex-[1_1_520px] flex-col gap-[26px]">
          <h1
            className="m-0 font-serif font-normal"
            style={{ fontSize: 'clamp(56px, 11vw, 96px)', lineHeight: 0.9, letterSpacing: '-0.03em' }}
          >
            All <span className="italic">homework</span>
          </h1>
          <p className="m-0 font-serif text-[26px] italic leading-[1.3] sm:text-[32px]">
            {activeCount} open, {doneCount} finished.
          </p>
        </div>
        <aside className="flex min-w-[260px] flex-[0_1_360px] items-center justify-between gap-4">
          <span className="font-mono text-[13px] uppercase" style={{ letterSpacing: '0.14em', color: DUST }}>
            Add assignment
          </span>
          <AddCircle onClick={onAdd} />
        </aside>
      </header>

      <div className="flex flex-col gap-4 pb-8">
        <div className="flex flex-wrap items-center gap-3">
          <input
            type="search"
            className="fld mono"
            style={{ maxWidth: 380 }}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search title, class or notes"
            aria-label="Search homework"
          />
          <div className="flex flex-wrap gap-2">
            <Chip active={statusFilter === 'active'} onClick={() => setStatusFilter('active')}>
              To do · {activeCount}
            </Chip>
            <Chip active={statusFilter === 'done'} onClick={() => setStatusFilter('done')}>
              Done · {doneCount}
            </Chip>
            <Chip active={statusFilter === 'all'} onClick={() => setStatusFilter('all')}>
              All · {assignments.length}
            </Chip>
          </div>
        </div>
        <div className="no-scrollbar flex items-center gap-2 overflow-x-auto pb-1">
          <Chip active={classFilter === 'all'} onClick={() => setClassFilter('all')}>
            All classes
          </Chip>
          {courses.map((c) => (
            <Chip
              key={c.id}
              active={classFilter === c.id}
              color={c.color}
              onClick={() => setClassFilter(classFilter === c.id ? 'all' : c.id)}
              style={classFilter === c.id ? undefined : { boxShadow: `inset 4px 0 0 ${themed(c.color)}` }}
              title={c.name}
            >
              {c.code}
            </Chip>
          ))}
          <Btn small variant="ghost" onClick={onOpenCourses}>
            Manage classes
          </Btn>
        </div>
      </div>

      {filtered.length === 0 && (
        <div className="flex flex-col items-start gap-4 py-10" style={{ borderTop: `1px solid ${RULE}` }}>
          <span className="max-w-[520px] font-serif text-[32px] italic leading-[1.2]">
            {!hasAny ? 'No homework yet.' : query ? 'Nothing matches that search.' : 'Nothing in this view.'}
          </span>
          {!hasAny && (
            <Btn variant="solid" onClick={onAdd}>
              Add your first assignment
            </Btn>
          )}
        </div>
      )}

      {groups
        .filter((g) => g.items.length > 0)
        .map((g) => (
          <section
            key={g.key}
            className="flex flex-wrap items-start gap-x-10 gap-y-4 py-7"
            style={{ borderTop: `1px solid ${RULE}` }}
          >
            <div className="flex w-[150px] flex-none flex-col gap-1">
              <span
                className="font-mono text-[13px] uppercase"
                style={{ letterSpacing: '0.14em', color: g.accent ?? DUST }}
              >
                {g.label}
              </span>
              <span className="font-serif text-[92px] leading-[0.9]" style={{ letterSpacing: '-0.03em' }}>
                {g.items.length}
              </span>
            </div>
            <div className="flex min-w-0 flex-[1_1_360px] flex-col gap-3 pt-1">
              {g.items.map((a) => {
                const mine = chunks.filter((c) => c.assignmentId === a.id);
                const doneBlocks = mine.filter((c) => c.status === 'Completed').length;
                const due = dueDateOf(a);
                const days = Math.ceil((due.getTime() - now.getTime()) / MS_DAY);
                const countdown =
                  a.status === 'Completed'
                    ? a.completedAt
                      ? `Finished ${new Date(a.completedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
                      : 'Finished'
                    : days < 0
                    ? `${Math.abs(days)}d late`
                    : days === 0
                    ? 'Due today'
                    : days === 1
                    ? 'Due tomorrow'
                    : `Due in ${days} days`;
                return (
                  <div key={a.id}>
                    <AssignmentRow
                      assignment={a}
                      courses={courseMap}
                      tone={NIGHT_TONE}
                      now={now}
                      whenMode="date"
                      onSetStatus={onSetStatus}
                      onOpen={onOpenAssignment}
                    />
                    <div
                      className="flex flex-wrap items-center gap-x-4 pl-[56px] font-mono text-[12px]"
                      style={{ color: DUST, letterSpacing: '0.04em' }}
                    >
                      <span style={{ color: a.status !== 'Completed' && days <= 1 ? TANGERINE : DUST }}>{countdown}</span>
                      <span>{fmtDuration(a.totalEstimatedMinutes)} estimated</span>
                      <span>
                        {mine.length === 0 ? 'No study blocks' : `${doneBlocks}/${mine.length} blocks done`}
                      </span>
                      {a.notes && (
                        <span className="min-w-0 truncate italic" style={{ color: PAPER, opacity: 0.7 }}>
                          “{a.notes}”
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        ))}
      <div style={{ borderTop: `1px solid ${RULE}` }} />
    </div>
  );
};
