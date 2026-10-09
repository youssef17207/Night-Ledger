import React, { useMemo, useRef, useState } from 'react';
import {
  Assignment,
  AssignmentCategoryType,
  AssignmentDraft,
  AvailabilityWindow,
  Course,
  HardCapCheckResult,
  LearningHistory,
  TaskChunk,
} from '../types/scheduler';
import { CATEGORY_PRESETS, getSmartDurationSuggestion } from '../utils/learningEngine';
import { checkHardCapBoundary } from '../utils/schedulerEngine';
import { newId } from '../utils/storage';
import { AQUA, DUST, INK, PAPER, TANGERINE, fmtDuration, fmtHours, fmtMonthDay, fmtClock, toLocalInput } from '../utils/ledger';
import { Btn, Chip, FieldLabel, Label, Modal, Tag } from './ui';

interface Props {
  userId: string;
  now: Date;
  existingAssignments: Assignment[];
  existingChunks: TaskChunk[];
  windows: AvailabilityWindow[];
  courses: Course[];
  learningHistory: LearningHistory;
  draft: AssignmentDraft | null;
  onAddAssignment: (assignment: Assignment) => void;
  onOpenCourseManager: () => void;
  onClose: () => void;
  onHardCapViolation: (result: HardCapCheckResult, draft: AssignmentDraft) => void;
}

const DURATIONS = [30, 45, 60, 90, 120, 180, 240];

function defaultDue(): string {
  const d = new Date();
  d.setDate(d.getDate() + 3);
  d.setHours(21, 0, 0, 0);
  return toLocalInput(d);
}

export const AddAssignmentModal: React.FC<Props> = ({
  userId,
  now,
  existingAssignments,
  existingChunks,
  windows,
  courses,
  learningHistory,
  draft,
  onAddAssignment,
  onOpenCourseManager,
  onClose,
  onHardCapViolation,
}) => {
  const [title, setTitle] = useState(draft?.title ?? '');
  const [courseId, setCourseId] = useState(
    draft && courses.some((c) => c.id === draft.courseId) ? draft.courseId : courses[0]?.id ?? ''
  );
  const [category, setCategory] = useState<AssignmentCategoryType>(draft?.category ?? 'problem_set');
  const [dueDateString, setDueDateString] = useState(draft?.dueDateString ?? defaultDue());
  const [durationMinutes, setDurationMinutes] = useState(
    draft?.durationMinutes ?? getSmartDurationSuggestion('problem_set', learningHistory).suggestedMinutes
  );
  const [notes, setNotes] = useState(draft?.notes ?? '');
  const [durationTouched, setDurationTouched] = useState(!!draft);
  const titleRef = useRef<HTMLInputElement>(null);

  // A class added from inside this form becomes the selection.
  React.useEffect(() => {
    if (!courses.some((c) => c.id === courseId) && courses[0]) setCourseId(courses[0].id);
  }, [courses, courseId]);

  React.useEffect(() => {
    const t = setTimeout(() => titleRef.current?.focus(), 120);
    return () => clearTimeout(t);
  }, []);

  const suggestion = getSmartDurationSuggestion(category, learningHistory);
  const selectedCourse = courses.find((c) => c.id === courseId);
  const dueValid = !Number.isNaN(new Date(dueDateString).getTime());
  const dueInPast = dueValid && new Date(dueDateString).getTime() <= now.getTime();
  const noWindows = windows.length === 0;

  const capacity = useMemo(
    () =>
      checkHardCapBoundary(
        { title: title || 'New assignment', totalEstimatedMinutes: durationMinutes, dueDate: dueDateString },
        existingAssignments,
        existingChunks,
        windows,
        now
      ),
    [title, durationMinutes, dueDateString, existingAssignments, existingChunks, windows, now]
  );

  const changeCategory = (c: AssignmentCategoryType) => {
    setCategory(c);
    if (!durationTouched) setDurationMinutes(getSmartDurationSuggestion(c, learningHistory).suggestedMinutes);
  };

  const setQuickDue = (daysFromNow: number) => {
    const d = new Date();
    d.setDate(d.getDate() + daysFromNow);
    d.setHours(21, 0, 0, 0);
    setDueDateString(toLocalInput(d));
  };
  const nextWeekday = (weekday: number) => {
    const day = new Date().getDay();
    return (weekday - day + 7) % 7 || 7;
  };

  const currentDraft = (): AssignmentDraft => ({
    title,
    courseId,
    category,
    dueDateString,
    durationMinutes,
    notes,
  });

  const canSubmit = !!title.trim() && !!selectedCourse && dueValid && !dueInPast;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit || !selectedCourse) {
      titleRef.current?.focus();
      return;
    }
    if (!noWindows && !capacity.hasCapacity) {
      onHardCapViolation(capacity, currentDraft());
      return;
    }
    onAddAssignment({
      id: newId('asg'),
      userId,
      courseId: selectedCourse.id,
      title: title.trim(),
      courseCode: selectedCourse.code,
      courseName: selectedCourse.name,
      courseColor: selectedCourse.color,
      category,
      dueDate: new Date(dueDateString).toISOString(),
      totalEstimatedMinutes: durationMinutes,
      actualMinutesSpent: 0,
      status: 'Pending',
      notes: notes.trim(),
      createdAt: new Date().toISOString(),
    });
    onClose();
  };

  const due = dueValid ? new Date(dueDateString) : null;

  return (
    <Modal
      kicker="New homework"
      title={
        <>
          Add <span className="italic">assignment</span>
        </>
      }
      onClose={onClose}
      onSubmit={handleSubmit}
      accent={selectedCourse?.color}
      footer={
        <>
          <Btn type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Btn>
          <Btn type="submit" variant="solid" disabled={!canSubmit}>
            {noWindows || capacity.hasCapacity ? 'Save & schedule' : 'Check my schedule'}
          </Btn>
        </>
      }
    >
      <div className="flex flex-col gap-7">
        <div>
          <FieldLabel htmlFor="asg-title" hint="e.g. Chapter 5 problem set">
            What is it? *
          </FieldLabel>
          <input
            id="asg-title"
            ref={titleRef}
            className="fld"
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Name the assignment"
            maxLength={120}
          />
        </div>

        <div>
          <FieldLabel>Which class? *</FieldLabel>
          {courses.length === 0 ? (
            <div className="flex flex-wrap items-center gap-4 p-4" style={{ border: `2px solid ${TANGERINE}` }}>
              <span className="min-w-0 flex-[1_1_240px] text-[15px] font-medium">
                You have not added any classes yet. Add one first, then come back.
              </span>
              <Btn type="button" variant="solid" onClick={onOpenCourseManager}>
                Add a class
              </Btn>
            </div>
          ) : (
            <div className="flex flex-wrap items-center gap-2">
              {courses.map((c) => {
                const active = c.id === courseId;
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setCourseId(c.id)}
                    aria-pressed={active}
                    title={c.name}
                    className="cursor-pointer border-none bg-transparent p-0"
                    style={{ outline: active ? `2px solid ${PAPER}` : '2px solid transparent', outlineOffset: 3 }}
                  >
                    <span style={{ opacity: active ? 1 : 0.6, display: 'block' }}>
                      <Tag color={c.color}>{c.code}</Tag>
                    </span>
                  </button>
                );
              })}
              <Btn type="button" small variant="ghost" onClick={onOpenCourseManager}>
                + Classes
              </Btn>
            </div>
          )}
          {selectedCourse && (
            <div className="mt-2 font-mono text-[12px]" style={{ color: DUST }}>
              {selectedCourse.name}
            </div>
          )}
        </div>

        <div>
          <FieldLabel htmlFor="asg-cat" hint={CATEGORY_PRESETS.find((p) => p.id === category)?.description}>
            Kind of work
          </FieldLabel>
          <div className="relative">
            <select
              id="asg-cat"
              className="fld mono"
              style={{ appearance: 'none', WebkitAppearance: 'none', textTransform: 'uppercase', letterSpacing: '0.06em' }}
              value={category}
              onChange={(e) => changeCategory(e.target.value as AssignmentCategoryType)}
            >
              {CATEGORY_PRESETS.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.label}
                </option>
              ))}
            </select>
            <span aria-hidden="true" className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[11px]">
              ▾
            </span>
          </div>
        </div>

        <div>
          <FieldLabel
            htmlFor="asg-due"
            hint={due ? `${fmtMonthDay(due)} · ${fmtClock(due)}` : 'pick a date'}
          >
            When is it due? *
          </FieldLabel>
          <div className="no-scrollbar mb-3 flex gap-2 overflow-x-auto pb-1">
            <Chip onClick={() => setQuickDue(1)}>Tomorrow</Chip>
            <Chip onClick={() => setQuickDue(2)}>In 2 days</Chip>
            <Chip onClick={() => setQuickDue(nextWeekday(5))}>Friday</Chip>
            <Chip onClick={() => setQuickDue(nextWeekday(1))}>Next Monday</Chip>
          </div>
          <input
            id="asg-due"
            className="fld mono"
            type="datetime-local"
            required
            value={dueDateString}
            onChange={(e) => setDueDateString(e.target.value)}
          />
          {dueInPast && (
            <div className="mt-2 font-mono text-[12px]" style={{ color: TANGERINE }}>
              That time has already passed. Pick a later due date.
            </div>
          )}
        </div>

        <div>
          <FieldLabel htmlFor="asg-dur" hint={fmtDuration(durationMinutes)}>
            How long will it take? *
          </FieldLabel>
          <div className="mb-3 flex flex-wrap gap-2">
            {DURATIONS.map((m) => (
              <Chip
                key={m}
                active={durationMinutes === m}
                onClick={() => {
                  setDurationMinutes(m);
                  setDurationTouched(true);
                }}
              >
                {fmtDuration(m)}
              </Chip>
            ))}
          </div>
          <input
            id="asg-dur"
            type="range"
            min={15}
            max={480}
            step={15}
            value={durationMinutes}
            onChange={(e) => {
              setDurationMinutes(Number(e.target.value));
              setDurationTouched(true);
            }}
          />
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[12px]" style={{ color: DUST }}>
            <span>{suggestion.insight}</span>
            {suggestion.suggestedMinutes !== durationMinutes && (
              <button
                type="button"
                className="cursor-pointer border-none bg-transparent p-0 font-mono text-[12px] underline"
                style={{ color: PAPER }}
                onClick={() => {
                  setDurationMinutes(suggestion.suggestedMinutes);
                  setDurationTouched(true);
                }}
              >
                Use {fmtDuration(suggestion.suggestedMinutes)}
              </button>
            )}
          </div>
        </div>

        <div
          className="flex flex-col gap-1 p-4"
          style={{
            borderLeft: `6px solid ${noWindows ? DUST : capacity.hasCapacity ? AQUA : TANGERINE}`,
            background: INK,
          }}
          aria-live="polite"
        >
          <Label color={noWindows ? DUST : capacity.hasCapacity ? AQUA : TANGERINE}>
            {noWindows ? 'No free hours set' : capacity.hasCapacity ? 'Fits your schedule' : 'Not enough free time'}
          </Label>
          <span className="text-[15px] font-medium">
            {noWindows
              ? 'It will be saved on its due date. Set your free hours later and Night Ledger will plan study blocks for it.'
              : capacity.hasCapacity
              ? `You have about ${fmtHours(capacity.availableMinutes)} hrs of free time before this is due.${
                  durationMinutes > 120 ? ' It is long, so it will be split into shorter study blocks.' : ''
                }`
              : `You need about ${fmtHours(capacity.deficitMinutes)} more hours of free time before this is due. Saving will show ways to fix that.`}
          </span>
        </div>

        <div>
          <FieldLabel htmlFor="asg-notes" hint="optional">
            Notes or page numbers
          </FieldLabel>
          <textarea
            id="asg-notes"
            className="fld"
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Problems 1-15 on page 84…"
            maxLength={500}
          />
        </div>
      </div>
    </Modal>
  );
};
