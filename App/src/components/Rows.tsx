import React from 'react';
import { Assignment, Course, TaskChunk } from '../types/scheduler';
import {
  DUST,
  INK,
  PAPER,
  TANGERINE,
  TODAY_MUTED,
  UiStatus,
  courseCodeOf,
  courseColorOf,
  dueDateOf,
  fmtClock,
  fmtHHMM,
  fmtMonthDay,
  isChunkSlipped,
  toUiStatus,
} from '../utils/ledger';
import { Leader, Tag } from './ui';

/** Colours a row needs so it reads on both the ink page and today's paper card. */
export interface Tone {
  ink: string;
  muted: string;
  boxBg: string;
  boxInk: string;
}
export const NIGHT_TONE: Tone = { ink: PAPER, muted: DUST, boxBg: PAPER, boxInk: INK };
export const PAPER_TONE: Tone = { ink: INK, muted: TODAY_MUTED, boxBg: INK, boxInk: PAPER };

const chkStyle = (color: string) => ({ ['--c' as string]: color }) as React.CSSProperties;

interface AssignmentRowProps {
  assignment: Assignment;
  courses: Map<string, Course>;
  tone: Tone;
  now: Date;
  /** 'time' = 9:00 (inside a day section), 'date' = Oct 3 9:00 (late carry-over) */
  whenMode?: 'time' | 'date';
  onSetStatus: (id: string, status: UiStatus) => void;
  onOpen: (id: string) => void;
}

/** One assignment, exactly as drawn in the weekly mockup. */
export const AssignmentRow: React.FC<AssignmentRowProps> = ({
  assignment,
  courses,
  tone,
  now,
  whenMode = 'time',
  onSetStatus,
  onOpen,
}) => {
  const color = courseColorOf(assignment, courses);
  const status = toUiStatus(assignment.status);
  const done = status === 'done';
  const due = dueDateOf(assignment);
  const late = !done && due.getTime() < now.getTime();
  const inProgress = status === 'progress';
  const code = courseCodeOf(assignment, courses);

  return (
    <div className="flex min-h-[52px] flex-wrap items-center gap-x-3 gap-y-1" style={{ opacity: done ? 0.5 : 1 }}>
      <label className="flex h-11 w-11 flex-none cursor-pointer items-center justify-center">
        <input
          className="chk"
          type="checkbox"
          aria-label={`Mark ${assignment.title} done`}
          checked={done}
          onChange={(e) => onSetStatus(assignment.id, e.target.checked ? 'done' : 'todo')}
          style={chkStyle(color)}
        />
      </label>
      <span className="w-[92px] flex-none">
        <Tag color={color} title={courseNameTitle(assignment, courses)}>{code}</Tag>
      </span>
      <button
        type="button"
        onClick={() => onOpen(assignment.id)}
        title="Open details"
        className="min-w-0 cursor-pointer border-none text-left font-sans text-[16px] font-semibold uppercase leading-[1.25]"
        style={{
          padding: '7px 12px',
          background: tone.boxBg,
          color: tone.boxInk,
          boxShadow: `3px 3px 0 ${color}`,
          letterSpacing: '0.05em',
          textDecoration: done ? 'line-through' : 'none',
          overflowWrap: 'anywhere',
        }}
      >
        {assignment.title}
      </button>
      <Leader />
      {late && (
        <span
          className="flex-none font-mono text-[11px] font-medium uppercase"
          style={{ padding: '2px 6px', background: TANGERINE, color: INK, letterSpacing: '0.06em' }}
        >
          Late
        </span>
      )}
      <span className="flex-none font-mono text-[14px]" style={{ color: tone.muted }}>
        {whenMode === 'date' ? `${fmtMonthDay(due)} ${fmtClock(due)}` : fmtClock(due)}
      </span>
      <span className="relative flex flex-none">
        <select
          className="sel"
          aria-label={`Status of ${assignment.title}`}
          value={status}
          onChange={(e) => onSetStatus(assignment.id, e.target.value as UiStatus)}
          style={{
            width: 142,
            background: inProgress ? color : 'transparent',
            color: inProgress ? INK : 'inherit',
          }}
        >
          <option value="todo">To do</option>
          <option value="progress">In progress</option>
          <option value="done">Done</option>
        </select>
        <span
          aria-hidden="true"
          className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[11px]"
          style={{ color: inProgress ? INK : 'inherit' }}
        >
          ▾
        </span>
      </span>
    </div>
  );
};

function courseNameTitle(a: Assignment, courses: Map<string, Course>) {
  return courses.get(a.courseId)?.name || a.courseName;
}

interface BlockRowProps {
  chunk: TaskChunk;
  assignment: Assignment | undefined;
  courses: Map<string, Course>;
  tone: Tone;
  now: Date;
  variant: 'week' | 'today';
  onToggle: (chunk: TaskChunk) => void;
  onFocus: (chunk: TaskChunk) => void;
  onShift?: (chunk: TaskChunk, dayDelta: number) => void;
  onResize?: (chunk: TaskChunk, minutesDelta: number) => void;
  onLater?: (chunk: TaskChunk) => void;
}

const CtlButton: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement>> = ({ className = '', style, ...rest }) => (
  <button
    type="button"
    {...rest}
    className={`h-9 min-w-9 flex-none cursor-pointer px-2 font-mono text-[11px] font-medium uppercase tracking-[0.06em] opacity-70 transition-opacity hover:opacity-100 ${className}`}
    style={{ background: 'transparent', color: 'inherit', border: '2px solid currentColor', ...style }}
  />
);

/** One planned study block. Same grammar as an assignment row, but with a colour rule instead of the offset box. */
export const BlockRow: React.FC<BlockRowProps> = ({
  chunk,
  assignment,
  courses,
  tone,
  now,
  variant,
  onToggle,
  onFocus,
  onShift,
  onResize,
  onLater,
}) => {
  const color = courseColorOf(assignment, courses);
  const done = chunk.status === 'Completed';
  const slipped = isChunkSlipped(chunk, now);
  const code = courseCodeOf(assignment, courses);

  return (
    <div className="flex min-h-[48px] flex-wrap items-center gap-x-3 gap-y-1" style={{ opacity: done ? 0.5 : 1 }}>
      <label className="flex h-11 w-11 flex-none cursor-pointer items-center justify-center">
        <input
          className="chk"
          type="checkbox"
          aria-label={`Mark ${chunk.chunkLabel} done`}
          checked={done}
          onChange={() => onToggle(chunk)}
          style={chkStyle(color)}
        />
      </label>
      <span className="w-[92px] flex-none">
        <Tag color={color} title={assignment?.courseName}>{code}</Tag>
      </span>
      <span
        className="min-w-0 font-sans text-[14px] font-medium uppercase leading-[1.25]"
        style={{
          borderLeft: `4px solid ${color}`,
          paddingLeft: 10,
          letterSpacing: '0.05em',
          textDecoration: done ? 'line-through' : 'none',
          overflowWrap: 'anywhere',
        }}
      >
        {chunk.chunkLabel}
      </span>
      <Leader />
      {slipped && !done && (
        <span
          className="flex-none font-mono text-[11px] font-medium uppercase"
          style={{ padding: '2px 6px', background: TANGERINE, color: INK, letterSpacing: '0.06em' }}
        >
          {chunk.status === 'Missed' ? 'Missed' : 'Slipped'}
        </span>
      )}
      <span className="flex-none font-mono text-[14px]" style={{ color: tone.muted }}>
        {fmtHHMM(chunk.scheduledStartTime)}–{fmtHHMM(chunk.scheduledEndTime)}
      </span>
      {!done && (
        <span className="flex flex-none flex-wrap items-center gap-1">
          <CtlButton onClick={() => onFocus(chunk)} title="Start focus timer" aria-label="Start focus timer">
            ▶ Timer
          </CtlButton>
          {variant === 'week' && onShift && onResize && (
            <>
              <CtlButton onClick={() => onShift(chunk, -1)} title="Move one day earlier" aria-label="Move one day earlier">
                ←
              </CtlButton>
              <CtlButton onClick={() => onShift(chunk, 1)} title="Move one day later" aria-label="Move one day later">
                →
              </CtlButton>
              <CtlButton onClick={() => onResize(chunk, -15)} title="15 minutes shorter" aria-label="15 minutes shorter">
                −15
              </CtlButton>
              <CtlButton onClick={() => onResize(chunk, 15)} title="15 minutes longer" aria-label="15 minutes longer">
                +15
              </CtlButton>
            </>
          )}
          {variant === 'today' && onLater && (
            <CtlButton onClick={() => onLater(chunk)} title="Move to the next open slot" aria-label="Do this later">
              Later
            </CtlButton>
          )}
        </span>
      )}
    </div>
  );
};
