/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import confetti from 'canvas-confetti';
import {
  Assignment,
  AssignmentDraft,
  AvailabilityWindow,
  Course,
  HardCapCheckResult,
  LearningHistory,
  TaskChunk,
  UserProfile,
} from './types/scheduler';
import {
  STORAGE_KEYS,
  BackupFile,
  isBackupFile,
  loadActivity,
  loadAssignments,
  loadChunks,
  loadCourses,
  loadLearning,
  loadUser,
  loadWindows,
  logActivity,
  newId,
  resetAllData,
  restoreBackup,
  saveAssignments,
  saveChunks,
  saveCourses,
  saveLearning,
  saveUser,
  saveWindows,
  syncAssignmentsWithCourses,
} from './utils/storage';
import { formatDateKey, generateUrgentFirstSchedule, minutesToTime, parseDateKey, timeToMinutes, triggerAutoRebalance } from './utils/schedulerEngine';
import { recordCompletedPace } from './utils/learningEngine';
import { sounds } from './utils/audioAlerts';
import { useNow } from './utils/useNow';
import {
  INK,
  LILAC,
  PAPER,
  UiStatus,
  fromUiStatus,
  isChunkSlipped,
  courseColorOf,
  fmtHHMM,
  DAY_LONG,
  toLocalInput,
} from './utils/ledger';

import { Header, Footer, DashboardTab } from './components/Header';
import { NudgeBanner } from './components/NudgeBanner';
import { WeekView, weekRangeLabel } from './components/WeekView';
import { TodayView } from './components/TodayView';
import { HomeworkView } from './components/HomeworkView';
import { AddAssignmentModal } from './components/AddAssignmentModal';
import { CourseManagerModal } from './components/CourseManagerModal';
import { AvailabilityManagerModal } from './components/AvailabilityManagerModal';
import { HardCapAlertModal } from './components/HardCapAlertModal';
import { FocusTimerModal } from './components/FocusTimerModal';
import { AssignmentDetailModal } from './components/AssignmentDetailModal';
import { HelpModal } from './components/HelpModal';
import { FeaturesModal } from './components/FeaturesModal';
import { Btn, Modal } from './components/ui';

const CONFETTI_COLORS = ['#AA92FF', '#FF8AB0', '#A9E67E', '#5ED9CB', '#FF9650', '#F1EBDD'];

export default function App() {
  // ---- persisted state (starts empty for a brand-new student) ----
  const [user, setUser] = useState<UserProfile>(loadUser);
  const [courses, setCourses] = useState<Course[]>(loadCourses);
  const [assignments, setAssignments] = useState<Assignment[]>(loadAssignments);
  const [chunks, setChunks] = useState<TaskChunk[]>(loadChunks);
  const [windows, setWindows] = useState<AvailabilityWindow[]>(loadWindows);
  const [learning, setLearning] = useState<LearningHistory>(loadLearning);

  // ---- UI state ----
  const [tab, setTab] = useState<DashboardTab>('week');
  const [weekOffset, setWeekOffset] = useState(0);
  const [addOpen, setAddOpen] = useState(false);
  const [addDraft, setAddDraft] = useState<AssignmentDraft | null>(null);
  const [coursesOpen, setCoursesOpen] = useState(false);
  const [hoursOpen, setHoursOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [featuresOpen, setFeaturesOpen] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  const [hardCap, setHardCap] = useState<HardCapCheckResult | null>(null);
  const [focusChunkId, setFocusChunkId] = useState<string | null>(null);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [toast, setToast] = useState<string | null>(null);

  const now = useNow();
  const todayKey = formatDateKey(now);

  // Latest state for effects/handlers that must not see stale closures.
  const live = useRef({ user, courses, assignments, chunks, windows, learning });
  live.current = { user, courses, assignments, chunks, windows, learning };

  const toastTimer = useRef<number | undefined>(undefined);
  const showToast = useCallback((msg: string) => {
    setToast(msg);
    window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(null), 4500);
  }, []);

  // ---- commit helpers: update state and storage together ----
  const commitAssignments = (next: Assignment[]) => {
    live.current.assignments = next;
    setAssignments(next);
    saveAssignments(next);
  };
  const commitChunks = (next: TaskChunk[]) => {
    live.current.chunks = next;
    setChunks(next);
    saveChunks(next);
  };
  const commitWindows = (next: AvailabilityWindow[]) => {
    live.current.windows = next;
    setWindows(next);
    saveWindows(next);
  };
  const commitLearning = (next: LearningHistory) => {
    setLearning(next);
    saveLearning(next);
  };
  const commitUser = (next: UserProfile) => {
    setUser(next);
    saveUser(next);
  };

  /** Re-plan every unfinished assignment into the free hours, keeping done and hand-placed blocks. */
  const replan = (asgs: Assignment[], wins: AvailabilityWindow[], chs: TaskChunk[]) =>
    generateUrgentFirstSchedule(asgs, wins, chs, live.current.user.chunkThresholdMinutes, new Date());

  /** Move any slipped blocks to the next open slots. Pure on a copy; returns the new list + result. */
  const rebalance = (list: TaskChunk[]) => {
    const copy = list.map((c) => ({ ...c }));
    const result = triggerAutoRebalance(copy, live.current.assignments, live.current.windows, new Date());
    return { list: copy, result };
  };

  // ---- keep several open tabs in sync (real-time across tabs) ----
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      switch (e.key) {
        case STORAGE_KEYS.USER:
          setUser(loadUser());
          break;
        case STORAGE_KEYS.COURSES:
          setCourses(loadCourses());
          break;
        case STORAGE_KEYS.ASSIGNMENTS:
          setAssignments(loadAssignments());
          break;
        case STORAGE_KEYS.CHUNKS:
          setChunks(loadChunks());
          break;
        case STORAGE_KEYS.WINDOWS:
          setWindows(loadWindows());
          break;
        case STORAGE_KEYS.LEARNING:
          setLearning(loadLearning());
          break;
        case null:
          // storage.clear() elsewhere
          window.location.reload();
          break;
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  // ---- auto-rebalance blocks that slip past (once per block) ----
  const attemptedSlips = useRef<Set<string>>(new Set());
  useEffect(() => {
    if (!user.autoRebalanceOnDelay) return;
    const fresh = chunks.filter((c) => {
      if (!isChunkSlipped(c, now)) return false;
      const key = `${c.id}|${c.scheduledDate}|${c.scheduledStartTime}`;
      if (attemptedSlips.current.has(key)) return false;
      attemptedSlips.current.add(key);
      return true;
    });
    if (fresh.length === 0) return;
    const { list, result } = rebalance(chunks);
    if (result.rebalancedCount > 0) {
      commitChunks(list);
      logActivity('auto_rebalance', { moved: result.rebalancedCount });
      showToast(
        `Moved ${result.rebalancedCount} missed ${result.rebalancedCount === 1 ? 'block' : 'blocks'} into your next open slots.`
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [now, chunks, user.autoRebalanceOnDelay]);

  // ---- handlers ----
  const handleSaveCourses = (updated: Course[]) => {
    setCourses(updated);
    saveCourses(updated);
    const synced = syncAssignmentsWithCourses(live.current.assignments, updated);
    commitAssignments(synced);
    logActivity('courses_updated', { count: updated.length });
  };

  const handleAddAssignment = (a: Assignment) => {
    const nextAssignments = [...live.current.assignments, a];
    const result = replan(nextAssignments, live.current.windows, live.current.chunks);
    commitAssignments(nextAssignments);
    commitChunks(result.chunks);
    setAddDraft(null);
    logActivity('assignment_added', { id: a.id, category: a.category, minutes: a.totalEstimatedMinutes, due: a.dueDate });
    const count = result.chunks.filter((c) => c.assignmentId === a.id).length;
    if (live.current.windows.length === 0) {
      showToast(`"${a.title}" added. Set your free hours to get study blocks.`);
    } else if (result.unplacedMinutes > 0) {
      showToast(`"${a.title}" added with ${count} study ${count === 1 ? 'block' : 'blocks'}. Some time could not be placed.`);
    } else {
      showToast(`"${a.title}" planned into ${count} study ${count === 1 ? 'block' : 'blocks'}.`);
    }
  };

  const handleSetStatus = (id: string, ui: UiStatus) => {
    const { assignments: asgs, chunks: chs, windows: wins } = live.current;
    const target = asgs.find((a) => a.id === id);
    if (!target) return;
    const status = fromUiStatus(ui);
    if (status === target.status) return;
    const stamp = new Date().toISOString();

    const nextAssignments = asgs.map((a) =>
      a.id === id
        ? {
            ...a,
            status,
            startedAt: status !== 'Pending' && !a.startedAt ? stamp : a.startedAt,
            completedAt: status === 'Completed' ? stamp : undefined,
          }
        : a
    );

    let nextChunks = chs;
    if (status === 'Completed') {
      // Nothing left to plan: drop unfinished blocks, keep the ones already done.
      nextChunks = chs.filter((c) => c.assignmentId !== id || c.status === 'Completed');
      sounds.playSuccessChime();
      confetti({ particleCount: 70, spread: 70, origin: { y: 0.7 }, colors: CONFETTI_COLORS });
      showToast(`"${target.title}" finished.`);
    } else if (target.status === 'Completed') {
      nextChunks = replan(nextAssignments, wins, chs).chunks;
      showToast(`"${target.title}" reopened and replanned.`);
    }
    commitAssignments(nextAssignments);
    if (nextChunks !== chs) commitChunks(nextChunks);
    logActivity('assignment_status', { id, from: target.status, to: status });
  };

  const handleDeleteAssignment = (id: string) => {
    const target = live.current.assignments.find((a) => a.id === id);
    commitAssignments(live.current.assignments.filter((a) => a.id !== id));
    commitChunks(live.current.chunks.filter((c) => c.assignmentId !== id));
    setDetailId(null);
    logActivity('assignment_deleted', { id, title: target?.title });
    showToast('Assignment and its study blocks removed.');
  };

  /**
   * Tick a study block done / not done, and roll the result up into its assignment:
   * time logged, first-started and finished timestamps, and the learned pace.
   */
  const toggleChunk = (chunkId: string, opts: { actualMinutes?: number; celebrate?: boolean; forceComplete?: boolean } = {}) => {
    const { assignments: asgs, chunks: chs, learning: learned, windows: wins } = live.current;
    const target = chs.find((c) => c.id === chunkId);
    if (!target) return;
    if (opts.forceComplete && target.status === 'Completed') return;

    const completing = target.status !== 'Completed';
    const stamp = new Date().toISOString();
    const updated: TaskChunk = completing
      ? { ...target, status: 'Completed', completedAt: stamp, actualDurationMinutes: opts.actualMinutes ?? target.durationMinutes }
      : { ...target, status: 'Scheduled', completedAt: undefined, actualDurationMinutes: undefined };
    let nextChunks = chs.map((c) => (c.id === chunkId ? updated : c));

    const asg = asgs.find((a) => a.id === target.assignmentId);
    let nextAssignments = asgs;
    if (asg) {
      const done = nextChunks.filter((c) => c.assignmentId === asg.id && c.status === 'Completed');
      const doneMinutes = done.reduce((s, c) => s + c.durationMinutes, 0);
      const spent = done.reduce((s, c) => s + (c.actualDurationMinutes ?? c.durationMinutes), 0);
      let status = asg.status;
      if (completing) {
        if (doneMinutes >= asg.totalEstimatedMinutes) status = 'Completed';
        else if (status === 'Pending') status = 'In Progress';
      } else if (status === 'Completed' && doneMinutes < asg.totalEstimatedMinutes) {
        status = doneMinutes > 0 ? 'In Progress' : 'Pending';
      }
      nextAssignments = asgs.map((a) =>
        a.id === asg.id
          ? {
              ...a,
              status,
              actualMinutesSpent: spent,
              startedAt: a.startedAt ?? (status !== 'Pending' ? stamp : undefined),
              completedAt: status === 'Completed' ? a.completedAt ?? stamp : undefined,
            }
          : a
      );
      if (status === 'Completed') {
        nextChunks = nextChunks.filter((c) => c.assignmentId !== asg.id || c.status === 'Completed');
        if (asg.status !== 'Completed') showToast(`"${asg.title}" is fully done.`);
      } else if (asg.status === 'Completed') {
        nextChunks = replan(nextAssignments, wins, nextChunks).chunks;
      }
    }

    if (completing && opts.actualMinutes && asg && opts.actualMinutes >= target.durationMinutes * 0.25) {
      commitLearning(recordCompletedPace(learned, asg.category, target.durationMinutes, opts.actualMinutes));
    }
    if (completing && opts.celebrate) {
      sounds.playSuccessChime();
      confetti({ particleCount: 70, spread: 70, origin: { y: 0.7 }, colors: CONFETTI_COLORS });
    }

    commitChunks(nextChunks);
    if (nextAssignments !== asgs) commitAssignments(nextAssignments);
    logActivity(completing ? 'chunk_completed' : 'chunk_reopened', {
      chunkId,
      assignmentId: target.assignmentId,
      plannedMinutes: target.durationMinutes,
      actualMinutes: opts.actualMinutes,
      scheduledFor: `${target.scheduledDate} ${target.scheduledStartTime}`,
    });
  };

  const handleToggleChunk = (chunk: TaskChunk) => toggleChunk(chunk.id, { celebrate: chunk.status !== 'Completed' });
  // The focus timer plays its own chime and confetti.
  const handleTimerComplete = (chunkId: string, actualMinutes: number) =>
    toggleChunk(chunkId, { actualMinutes, forceComplete: true });

  const updateChunk = (updated: TaskChunk) => {
    commitChunks(live.current.chunks.map((c) => (c.id === updated.id ? updated : c)));
  };

  const handleShiftChunk = (chunk: TaskChunk, dayDelta: number) => {
    const d = parseDateKey(chunk.scheduledDate);
    d.setDate(d.getDate() + dayDelta);
    const key = formatDateKey(d);
    updateChunk({ ...chunk, scheduledDate: key, isManualOverride: true });
    logActivity('chunk_moved', { chunkId: chunk.id, to: key });
    showToast(`Block pinned to ${key} at ${chunk.scheduledStartTime}.`);
  };

  const handleResizeChunk = (chunk: TaskChunk, delta: number) => {
    const duration = Math.max(15, chunk.durationMinutes + delta);
    const end = Math.min(1439, timeToMinutes(chunk.scheduledStartTime) + duration);
    updateChunk({ ...chunk, durationMinutes: end - timeToMinutes(chunk.scheduledStartTime), scheduledEndTime: minutesToTime(end), isManualOverride: true });
    logActivity('chunk_resized', { chunkId: chunk.id, minutes: duration });
  };

  const handleSnooze = (chunkId: string, minutes: number) => {
    const target = live.current.chunks.find((c) => c.id === chunkId);
    if (!target) return;
    const start = timeToMinutes(target.scheduledStartTime) + minutes;
    const end = Math.min(1439, start + target.durationMinutes);
    updateChunk({ ...target, scheduledStartTime: minutesToTime(start), scheduledEndTime: minutesToTime(end), isManualOverride: true });
    logActivity('chunk_snoozed', { chunkId, minutes });
    showToast(`Snoozed ${minutes} minutes.`);
  };

  const handleAutoFix = () => {
    const { list, result } = rebalance(live.current.chunks);
    if (result.rebalancedCount > 0) {
      commitChunks(list);
      logActivity('auto_fix', { moved: result.rebalancedCount, unresolvedMinutes: result.unresolvedMinutes });
      showToast(`Moved ${result.rebalancedCount} ${result.rebalancedCount === 1 ? 'block' : 'blocks'} into open slots.`);
    } else if (result.unresolvedMinutes > 0) {
      showToast(`No open slot before the deadline for ${result.unresolvedMinutes} min of work. Add free hours.`);
    } else {
      showToast('Everything already sits inside your free hours.');
    }
  };

  const handleLater = (chunk: TaskChunk) => {
    const flagged = live.current.chunks.map((c) => (c.id === chunk.id ? { ...c, status: 'Missed' as const } : c));
    const { list, result } = rebalance(flagged);
    commitChunks(list);
    logActivity('chunk_deferred', { chunkId: chunk.id });
    showToast(
      result.rebalancedCount > 0
        ? 'Moved to your next open slot.'
        : 'No open slot found before the deadline. Add free hours to fit it.'
    );
  };

  const handleSaveWindows = (next: AvailabilityWindow[]) => {
    commitWindows(next);
    const result = replan(live.current.assignments, next, live.current.chunks);
    commitChunks(result.chunks);
    logActivity('windows_updated', { windows: next.length });
    showToast('Free hours saved. Study blocks re-planned.');
  };

  const openAdd = (draft: AssignmentDraft | null = null) => {
    setAddDraft(draft);
    setAddOpen(true);
  };

  const handleHardCapViolation = (result: HardCapCheckResult, draft: AssignmentDraft) => {
    setAddOpen(false);
    setAddDraft(draft);
    setHardCap(result);
  };

  // Apply a one-tap fix from the capacity warning, then bring the form back with the user's input intact.
  const handleApplyHardCap = (action: { type: 'extend_window' | 'reduce_duration' | 'split_further'; suggestedMinutes?: number; targetDayOfWeek?: number }) => {
    setHardCap(null);
    const draft = addDraft;
    if (action.type === 'extend_window' && action.targetDayOfWeek !== undefined) {
      const dayName = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][action.targetDayOfWeek];
      const extra: AvailabilityWindow = {
        id: newId('w'),
        dayOfWeek: action.targetDayOfWeek,
        startTime: '19:00',
        endTime: '22:30',
        label: `${dayName} extended session`,
      };
      handleSaveWindows([...live.current.windows, extra]);
      showToast(`Added a ${fmtHHMM(extra.startTime)}–${fmtHHMM(extra.endTime)} window on ${DAY_LONG[action.targetDayOfWeek]}s.`);
    } else if (action.type === 'reduce_duration' && draft && action.suggestedMinutes) {
      setAddDraft({ ...draft, durationMinutes: action.suggestedMinutes });
    } else if (action.type === 'split_further' && draft) {
      const due = new Date(draft.dueDateString);
      due.setDate(due.getDate() + 3);
      setAddDraft({ ...draft, dueDateString: toLocalInput(due) });
    }
    setAddOpen(true);
  };

  const handleToggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    sounds.setMuted(!next);
    showToast(next ? 'Sound on.' : 'Sound off.');
  };

  const handleExport = () => {
    const l = live.current;
    const backup: BackupFile = {
      app: 'night-ledger',
      version: 1,
      exportedAt: new Date().toISOString(),
      user: l.user,
      courses: l.courses,
      windows: l.windows,
      assignments: l.assignments,
      chunks: l.chunks,
      learningHistory: l.learning,
      activity: loadActivity(),
    };
    const url = URL.createObjectURL(new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `night-ledger-backup-${todayKey}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Backup downloaded.');
  };

  const handleImport = async (file: File) => {
    try {
      const parsed: unknown = JSON.parse(await file.text());
      if (!isBackupFile(parsed)) throw new Error('Not a Night Ledger backup');
      if (!window.confirm('Replace everything in this browser with the backup?')) return;
      restoreBackup(parsed);
      window.location.reload();
    } catch {
      showToast('That file is not a valid Night Ledger backup.');
    }
  };

  // ---- derived ----
  const courseMap = useMemo(() => new Map(courses.map((c) => [c.id, c])), [courses]);
  const openCount = assignments.filter((a) => a.status !== 'Completed').length;
  const focusChunk = chunks.find((c) => c.id === focusChunkId) ?? null;
  const focusAssignment = focusChunk ? assignments.find((a) => a.id === focusChunk.assignmentId) : undefined;
  const detail = detailId ? assignments.find((a) => a.id === detailId) : undefined;

  useEffect(() => {
    document.title = 'Night Ledger';
  }, []);

  return (
    <div className="flex min-h-screen flex-col" style={{ background: INK, color: PAPER }}>
      {toast && (
        <aside
          aria-live="polite"
          className="ledger-in fixed bottom-5 left-5 right-5 z-[60] flex max-w-md items-center gap-3 px-4 py-3 sm:right-auto"
          style={{ background: PAPER, color: INK, boxShadow: `5px 5px 0 ${LILAC}` }}
        >
          <span className="flex-1 text-[15px] font-medium">{toast}</span>
          <button
            type="button"
            onClick={() => setToast(null)}
            aria-label="Dismiss"
            className="cursor-pointer border-none bg-transparent p-1 font-mono text-[14px]"
            style={{ color: INK }}
          >
            ✕
          </button>
        </aside>
      )}

      <NudgeBanner
        now={now}
        chunks={chunks}
        assignments={assignments}
        onStartFocus={(c) => setFocusChunkId(c.id)}
        onSnooze={handleSnooze}
        onAutoFix={handleAutoFix}
      />

      <main className="flex-1 px-7 pb-[72px] pt-7">
        <div className="mx-auto" style={{ maxWidth: 1120 }}>
          <Header
            tab={tab}
            onTab={setTab}
            courseCount={courses.length}
            openCount={openCount}
            weekRange={weekRangeLabel(now, weekOffset)}
            isCurrentWeek={weekOffset === 0}
            onPrevWeek={() => setWeekOffset((w) => w - 1)}
            onNextWeek={() => setWeekOffset((w) => w + 1)}
            onThisWeek={() => setWeekOffset(0)}
            onOpenCourses={() => setCoursesOpen(true)}
            onOpenHours={() => setHoursOpen(true)}
            onAutoFix={handleAutoFix}
            onOpenHelp={() => setHelpOpen(true)}
            onOpenFeatures={() => setFeaturesOpen(true)}
          />

          {tab === 'week' && (
            <WeekView
              now={now}
              weekOffset={weekOffset}
              courses={courses}
              assignments={assignments}
              chunks={chunks}
              windows={windows}
              onSetStatus={handleSetStatus}
              onOpenAssignment={setDetailId}
              onAdd={() => openAdd()}
              onToggleChunk={handleToggleChunk}
              onFocus={(c) => setFocusChunkId(c.id)}
              onShiftChunk={handleShiftChunk}
              onResizeChunk={handleResizeChunk}
              onOpenCourses={() => setCoursesOpen(true)}
              onOpenHours={() => setHoursOpen(true)}
            />
          )}

          {tab === 'today' && (
            <TodayView
              now={now}
              courses={courses}
              assignments={assignments}
              chunks={chunks}
              onToggleChunk={handleToggleChunk}
              onFocus={(c) => setFocusChunkId(c.id)}
              onLater={handleLater}
              onAutoFix={handleAutoFix}
              onAdd={() => openAdd()}
              onSetStatus={handleSetStatus}
              onOpenAssignment={setDetailId}
              onOpenHours={() => setHoursOpen(true)}
            />
          )}

          {tab === 'homework' && (
            <HomeworkView
              now={now}
              courses={courses}
              assignments={assignments}
              chunks={chunks}
              onAdd={() => openAdd()}
              onSetStatus={handleSetStatus}
              onOpenAssignment={setDetailId}
              onOpenCourses={() => setCoursesOpen(true)}
            />
          )}

          <Footer
            soundEnabled={soundEnabled}
            autoRebalance={user.autoRebalanceOnDelay}
            onToggleSound={handleToggleSound}
            onToggleAutoRebalance={() => {
              const next = !user.autoRebalanceOnDelay;
              commitUser({ ...user, autoRebalanceOnDelay: next });
              showToast(next ? 'Missed blocks will move automatically.' : 'Missed blocks stay put until you auto-fix.');
            }}
            onExport={handleExport}
            onImport={handleImport}
            onReset={() => setResetOpen(true)}
          />
        </div>
      </main>

      {addOpen && (
        <AddAssignmentModal
          userId={user.id}
          now={now}
          existingAssignments={assignments}
          existingChunks={chunks}
          windows={windows}
          courses={courses}
          learningHistory={learning}
          draft={addDraft}
          onAddAssignment={handleAddAssignment}
          onOpenCourseManager={() => setCoursesOpen(true)}
          onClose={() => {
            setAddOpen(false);
            setAddDraft(null);
          }}
          onHardCapViolation={handleHardCapViolation}
        />
      )}

      {coursesOpen && (
        <CourseManagerModal
          courses={courses}
          assignments={assignments}
          onSaveCourses={handleSaveCourses}
          onClose={() => setCoursesOpen(false)}
        />
      )}

      {hoursOpen && (
        <AvailabilityManagerModal windows={windows} onSaveWindows={handleSaveWindows} onClose={() => setHoursOpen(false)} />
      )}

      {hardCap && (
        <HardCapAlertModal
          hardCapResult={hardCap}
          onApplyRecommendation={handleApplyHardCap}
          onOpenAvailabilityManager={() => {
            setHardCap(null);
            setHoursOpen(true);
          }}
          onClose={() => {
            setHardCap(null);
            setAddOpen(true);
          }}
        />
      )}

      {featuresOpen && (
        <FeaturesModal
          onClose={() => setFeaturesOpen(false)}
          onOpenHelp={() => {
            setFeaturesOpen(false);
            setHelpOpen(true);
          }}
        />
      )}

      {helpOpen && (
        <HelpModal
          onClose={() => setHelpOpen(false)}
          onOpenAvailabilityManager={() => {
            setHelpOpen(false);
            setHoursOpen(true);
          }}
        />
      )}

      {detail && (
        <AssignmentDetailModal
          assignment={detail}
          courses={courseMap}
          chunks={chunks}
          now={now}
          onClose={() => setDetailId(null)}
          onSetStatus={handleSetStatus}
          onDelete={handleDeleteAssignment}
          onFocus={(c) => {
            setDetailId(null);
            setFocusChunkId(c.id);
          }}
          onToggleChunk={handleToggleChunk}
        />
      )}

      {focusChunk && (
        <FocusTimerModal
          key={focusChunk.id}
          chunk={focusChunk}
          assignment={focusAssignment}
          courseColor={courseColorOf(focusAssignment, courseMap)}
          courseCode={focusAssignment ? courseMap.get(focusAssignment.courseId)?.code ?? focusAssignment.courseCode : undefined}
          onComplete={handleTimerComplete}
          onClose={() => setFocusChunkId(null)}
        />
      )}

      {resetOpen && (
        <Modal
          kicker="Erase everything"
          title={
            <>
              Start <span className="italic">over?</span>
            </>
          }
          onClose={() => setResetOpen(false)}
          width={520}
          accent="#FF9650"
          footer={
            <>
              <Btn variant="ghost" onClick={() => setResetOpen(false)}>
                Keep my data
              </Btn>
              <Btn variant="danger" onClick={resetAllData}>
                Erase it all
              </Btn>
            </>
          }
        >
          <p className="m-0 text-[16px] leading-snug">
            This deletes your classes, free hours, assignments, study blocks and learned pace from this browser. There is no
            undo, so export a backup first if you might want it back.
          </p>
        </Modal>
      )}
    </div>
  );
}
