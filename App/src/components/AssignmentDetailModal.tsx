import React, { useState } from 'react';
import { Assignment, Course, TaskChunk } from '../types/scheduler';
import { CATEGORY_PRESETS } from '../utils/learningEngine';
import {
  DAY_SHORT,
  DUST,
  INK,
  RULE,
  TANGERINE,
  UiStatus,
  courseColorOf,
  dueDateOf,
  fmtClock,
  fmtDuration,
  fmtHHMM,
  fmtMonthDay,
  isChunkSlipped,
  parseKey,
  sortChunks,
  toUiStatus,
} from '../utils/ledger';
import { Btn, Label, Modal, Tag } from './ui';

interface Props {
  assignment: Assignment;
  courses: Map<string, Course>;
  chunks: TaskChunk[];
  now: Date;
  onClose: () => void;
  onSetStatus: (id: string, status: UiStatus) => void;
  onDelete: (id: string) => void;
  onFocus: (chunk: TaskChunk) => void;
  onToggleChunk: (chunk: TaskChunk) => void;
}

const stamp = (iso?: string) => {
  if (!iso) return '';
  const d = new Date(iso);
  return `${fmtMonthDay(d)} ${fmtClock(d)}`;
};

export const AssignmentDetailModal: React.FC<Props> = ({
  assignment: a,
  courses,
  chunks,
  now,
  onClose,
  onSetStatus,
  onDelete,
  onFocus,
  onToggleChunk,
}) => {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const color = courseColorOf(a, courses);
  const course = courses.get(a.courseId);
  const mine = sortChunks(chunks.filter((c) => c.assignmentId === a.id));
  const doneBlocks = mine.filter((c) => c.status === 'Completed').length;
  const plannedMinutes = mine.reduce((s, c) => s + c.durationMinutes, 0);
  const due = dueDateOf(a);
  const status = toUiStatus(a.status);
  const categoryLabel = CATEGORY_PRESETS.find((p) => p.id === a.category)?.label ?? a.category;

  return (
    <Modal
      kicker={`${course?.code || a.courseCode} · ${categoryLabel}`}
      title={<span style={{ overflowWrap: 'anywhere' }}>{a.title}</span>}
      onClose={onClose}
      accent={color}
      width={680}
      footer={
        confirmDelete ? (
          <>
            <span className="font-mono text-[12px]" style={{ color: TANGERINE }}>
              Delete this assignment and its {mine.length} study {mine.length === 1 ? 'block' : 'blocks'}?
            </span>
            <span className="flex gap-2">
              <Btn variant="ghost" onClick={() => setConfirmDelete(false)}>
                Keep
              </Btn>
              <Btn variant="danger" onClick={() => onDelete(a.id)}>
                Delete
              </Btn>
            </span>
          </>
        ) : (
          <>
            <Btn variant="ghost" onClick={() => setConfirmDelete(true)}>
              Delete
            </Btn>
            <Btn variant="solid" onClick={onClose}>
              Done
            </Btn>
          </>
        )
      }
    >
      <div className="flex flex-col gap-7">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <Tag color={color} title={course?.name || a.courseName}>
              {course?.code || a.courseCode}
            </Tag>
            <span className="font-mono text-[14px]">
              Due {DAY_SHORT[due.getDay()]} {fmtMonthDay(due)} · {fmtClock(due)}
            </span>
          </div>
          <div className="relative flex">
            <select
              className="sel"
              aria-label="Status"
              value={status}
              onChange={(e) => onSetStatus(a.id, e.target.value as UiStatus)}
              style={{ width: 158, background: status === 'progress' ? color : 'transparent', color: status === 'progress' ? INK : 'inherit' }}
            >
              <option value="todo">To do</option>
              <option value="progress">In progress</option>
              <option value="done">Done</option>
            </select>
            <span
              aria-hidden="true"
              className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[11px]"
              style={{ color: status === 'progress' ? INK : 'inherit' }}
            >
              ▾
            </span>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Estimated', value: fmtDuration(a.totalEstimatedMinutes) },
            { label: 'Logged', value: fmtDuration(a.actualMinutesSpent) },
            { label: 'Blocks', value: mine.length ? `${doneBlocks}/${mine.length}` : '—' },
          ].map((s) => (
            <div key={s.label} className="p-3" style={{ border: `2px solid ${RULE}`, background: INK }}>
              <Label>{s.label}</Label>
              <div className="font-serif text-[36px] italic leading-none">{s.value}</div>
            </div>
          ))}
        </div>

        {a.notes && (
          <div>
            <Label>Notes</Label>
            <p className="m-0 mt-2 whitespace-pre-wrap text-[16px] leading-snug">{a.notes}</p>
          </div>
        )}

        <div>
          <div className="mb-2 flex items-center justify-between">
            <Label>Study blocks · {fmtDuration(plannedMinutes)} planned</Label>
          </div>
          {mine.length === 0 ? (
            <div className="p-4 font-mono text-[13px]" style={{ border: `2px dashed ${RULE}`, color: DUST }}>
              No study blocks. Set your free hours and Night Ledger will plan them.
            </div>
          ) : (
            <div className="flex flex-col">
              {mine.map((c) => {
                const done = c.status === 'Completed';
                const slipped = isChunkSlipped(c, now);
                const d = parseKey(c.scheduledDate);
                return (
                  <div
                    key={c.id}
                    className="flex flex-wrap items-center gap-x-4 gap-y-1 py-3"
                    style={{ borderTop: `1px solid ${RULE}`, opacity: done ? 0.5 : 1 }}
                  >
                    <label className="flex h-11 w-11 flex-none cursor-pointer items-center justify-center">
                      <input
                        className="chk"
                        type="checkbox"
                        aria-label={`Mark ${c.chunkLabel} done`}
                        checked={done}
                        onChange={() => onToggleChunk(c)}
                        style={{ ['--c' as string]: color } as React.CSSProperties}
                      />
                    </label>
                    <div className="min-w-0 flex-[1_1_200px]">
                      <div
                        className="text-[14px] font-medium uppercase"
                        style={{ letterSpacing: '0.05em', textDecoration: done ? 'line-through' : 'none' }}
                      >
                        {c.chunkLabel}
                      </div>
                      <div className="font-mono text-[12px]" style={{ color: slipped && !done ? TANGERINE : DUST }}>
                        {DAY_SHORT[d.getDay()]} {fmtMonthDay(d)} · {fmtHHMM(c.scheduledStartTime)}–{fmtHHMM(c.scheduledEndTime)} ·{' '}
                        {c.durationMinutes}m{slipped && !done ? ' · slipped' : ''}
                      </div>
                    </div>
                    {!done && (
                      <Btn small onClick={() => onFocus(c)}>
                        ▶ Timer
                      </Btn>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="flex flex-wrap gap-x-6 gap-y-1 font-mono text-[12px]" style={{ color: DUST }}>
          <span>Added {stamp(a.createdAt)}</span>
          {a.startedAt && <span>Started {stamp(a.startedAt)}</span>}
          {a.completedAt && <span>Finished {stamp(a.completedAt)}</span>}
        </div>
      </div>
    </Modal>
  );
};
