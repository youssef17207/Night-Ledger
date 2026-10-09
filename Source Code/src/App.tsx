/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  Assignment,
  AssignmentStatus,
  AvailabilityWindow,
  CategorySpeedLearning,
  Course,
  HardCapCheckResult,
  TaskChunk,
  UserProfile,
} from './types/scheduler';
import {
  loadAssignments,
  loadChunks,
  loadCourses,
  loadLearning,
  loadUser,
  loadWindows,
  resetAllDataToDefault,
  saveAssignments,
  saveChunks,
  saveCourses,
  saveLearning,
  saveUser,
  saveWindows,
  syncAssignmentsWithCourses,
} from './utils/storage';
import {
  formatDateKey,
  generateUrgentFirstSchedule,
  triggerAutoRebalance,
} from './utils/schedulerEngine';
import { recordCompletedPace } from './utils/learningEngine';
import { sounds } from './utils/audioAlerts';

import { Navbar, DashboardTab } from './components/Navbar';
import { ContextualNudgeBanner } from './components/ContextualNudgeBanner';
import { TodayChecklistView } from './components/TodayChecklistView';
import { WeeklyBlueprintView } from './components/WeeklyBlueprintView';
import { AssignmentsListView } from './components/AssignmentsListView';
import { AddAssignmentModal } from './components/AddAssignmentModal';
import { CourseManagerModal } from './components/CourseManagerModal';
import { AvailabilityManagerModal } from './components/AvailabilityManagerModal';
import { HardCapAlertModal } from './components/HardCapAlertModal';
import { FocusTimerModal } from './components/FocusTimerModal';
import { EngineInsightsDrawer } from './components/EngineInsightsDrawer';

import { CheckCircle2, Sparkles, AlertCircle, X } from 'lucide-react';

export default function App() {
  // Primary application state
  const [user, setUser] = useState<UserProfile>(loadUser);
  const [courses, setCourses] = useState<Course[]>(loadCourses);
  const [assignments, setAssignments] = useState<Assignment[]>(loadAssignments);
  const [chunks, setChunks] = useState<TaskChunk[]>(loadChunks);
  const [windows, setWindows] = useState<AvailabilityWindow[]>(loadWindows);
  const [learningHistory, setLearningHistory] = useState<
    Record<string, CategorySpeedLearning>
  >(loadLearning);

  // Active view tab
  const [activeTab, setActiveTab] = useState<DashboardTab>('today');

  // Modals & UI states
  const [isAddAssignmentOpen, setIsAddAssignmentOpen] = useState(false);
  const [isCourseManagerOpen, setIsCourseManagerOpen] = useState(false);
  const [isAvailabilityManagerOpen, setIsAvailabilityManagerOpen] = useState(false);
  const [isEngineInsightsOpen, setIsEngineInsightsOpen] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [activeFocusChunk, setActiveFocusChunk] = useState<TaskChunk | null>(null);
  const [hardCapAlert, setHardCapAlert] = useState<HardCapCheckResult | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const currentDateKey = formatDateKey(new Date());

  // Show transient toast
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((cur) => (cur === msg ? null : cur));
    }, 4500);
  };

  const handleToggleSound = () => {
    setSoundEnabled((prev) => {
      const next = !prev;
      sounds.setMuted(!next);
      showToast(next ? 'Sound cues enabled' : 'Sound cues muted');
      return next;
    });
  };

  // Sync assignment metadata whenever courses change
  const handleSaveCourses = (updatedCourses: Course[]) => {
    setCourses(updatedCourses);
    saveCourses(updatedCourses);

    // Sync course names, codes, and colors into assignments
    const syncedAssignments = syncAssignmentsWithCourses(assignments, updatedCourses);
    setAssignments(syncedAssignments);
    saveAssignments(syncedAssignments);

    showToast('Course updates and colors applied across all schedules.');
  };

  // Handle adding an assignment with auto-chunking & urgency-first scheduling
  const handleAddAssignment = (newAssignment: Assignment) => {
    const updatedAssignments = [...assignments, newAssignment];
    setAssignments(updatedAssignments);
    saveAssignments(updatedAssignments);

    // Run urgency-first scheduling to place the chunks
    const scheduleResult = generateUrgentFirstSchedule(
      updatedAssignments,
      windows,
      chunks,
      user.chunkThresholdMinutes
    );

    setChunks(scheduleResult.chunks);
    saveChunks(scheduleResult.chunks);

    const generatedCount = scheduleResult.chunks.filter(
      (c) => c.assignmentId === newAssignment.id
    ).length;

    showToast(
      `"${newAssignment.title}" scheduled! Partitioned into ${generatedCount} study blocks.`
    );
  };

  // Handle single chunk updates (e.g. manual drag/shift, duration resize)
  const handleUpdateChunk = (updatedChunk: TaskChunk) => {
    const updatedList = chunks.map((c) => (c.id === updatedChunk.id ? updatedChunk : c));
    setChunks(updatedList);
    saveChunks(updatedList);

    if (updatedChunk.isManualOverride) {
      showToast(`Study block pinned to ${updatedChunk.scheduledDate} ${updatedChunk.scheduledStartTime}.`);
    }
  };

  // Auto-Rebalance trigger
  const handleTriggerRebalance = () => {
    const clonedChunks = [...chunks];
    const result = triggerAutoRebalance(clonedChunks, assignments, windows);

    setChunks(clonedChunks);
    saveChunks(clonedChunks);

    if (result.rebalancedCount > 0) {
      showToast(
        `Auto-Rebalance complete: Successfully relocated ${result.rebalancedCount} study blocks into open slots.`
      );
    } else {
      showToast('All active study blocks are currently aligned with your free windows.');
    }
  };

  // Snooze a chunk by 15 mins
  const handleSnoozeChunk = (chunkId: string, minutes: number) => {
    const target = chunks.find((c) => c.id === chunkId);
    if (!target) return;

    const [h, m] = target.scheduledStartTime.split(':').map(Number);
    const newStartM = h * 60 + m + minutes;
    const newEndM = newStartM + target.durationMinutes;

    const toTime = (totalM: number) => {
      const hh = Math.floor(totalM / 60) % 24;
      const mm = totalM % 60;
      return `${hh.toString().padStart(2, '0')}:${mm.toString().padStart(2, '0')}`;
    };

    const updated = {
      ...target,
      scheduledStartTime: toTime(newStartM),
      scheduledEndTime: toTime(newEndM),
      isManualOverride: true,
    };

    handleUpdateChunk(updated);
    showToast(`Session snoozed by ${minutes} minutes.`);
  };

  // Mark chunk complete and optionally update adaptive learning speed ratio
  const handleCompleteChunk = (chunkId: string, actualMinutes?: number) => {
    const target = chunks.find((c) => c.id === chunkId);
    if (!target) return;

    const newStatus = target.status === 'Completed' ? 'Scheduled' : 'Completed';
    const updatedChunk: TaskChunk = {
      ...target,
      status: newStatus,
      completedAt: newStatus === 'Completed' ? new Date().toISOString() : undefined,
      actualDurationMinutes: actualMinutes || target.durationMinutes,
    };

    const updatedChunks = chunks.map((c) => (c.id === chunkId ? updatedChunk : c));
    setChunks(updatedChunks);
    saveChunks(updatedChunks);

    // If completed and actual minutes provided, refine learning engine
    if (newStatus === 'Completed' && actualMinutes) {
      const parentAssignment = assignments.find((a) => a.id === target.assignmentId);
      if (parentAssignment) {
        const updatedLearning = recordCompletedPace(
          learningHistory as any,
          parentAssignment.category,
          target.durationMinutes,
          actualMinutes
        );
        setLearningHistory(updatedLearning);
        saveLearning(updatedLearning);
      }
    }
  };

  // Mark delayed
  const handleMarkDelayed = (chunkId: string) => {
    const updatedChunks = chunks.map((c) => {
      if (c.id === chunkId) {
        return { ...c, status: 'Missed' as const };
      }
      return c;
    });
    setChunks(updatedChunks);
    saveChunks(updatedChunks);
    handleTriggerRebalance();
  };

  // Delete assignment and its chunks
  const handleDeleteAssignment = (assignmentId: string) => {
    const updatedAssignments = assignments.filter((a) => a.id !== assignmentId);
    setAssignments(updatedAssignments);
    saveAssignments(updatedAssignments);

    const updatedChunks = chunks.filter((c) => c.assignmentId !== assignmentId);
    setChunks(updatedChunks);
    saveChunks(updatedChunks);

    showToast('Assignment and its scheduled study blocks removed.');
  };

  // Toggle assignment status
  const handleToggleAssignmentStatus = (assignmentId: string) => {
    const target = assignments.find((a) => a.id === assignmentId);
    if (!target) return;

    const newStatus: AssignmentStatus = target.status === 'Completed' ? 'Pending' : 'Completed';
    const updated = assignments.map((a) =>
      a.id === assignmentId ? { ...a, status: newStatus } : a
    );
    setAssignments(updated);
    saveAssignments(updated);

    // Also mark its chunks completed if completed
    if (newStatus === 'Completed') {
      const updatedChunks = chunks.map((c) =>
        c.assignmentId === assignmentId ? { ...c, status: 'Completed' as const } : c
      );
      setChunks(updatedChunks);
      saveChunks(updatedChunks);
    }
  };

  // Save availability windows and re-run scheduling
  const handleSaveWindows = (newWindows: AvailabilityWindow[]) => {
    setWindows(newWindows);
    saveWindows(newWindows);

    // Regenerate schedule with new window capacity
    const scheduleResult = generateUrgentFirstSchedule(
      assignments,
      newWindows,
      chunks,
      user.chunkThresholdMinutes
    );
    setChunks(scheduleResult.chunks);
    saveChunks(scheduleResult.chunks);

    showToast('Availability windows updated and study blocks realigned.');
  };

  // Apply Hard Cap recommendation action
  const handleApplyHardCapRecommendation = (action: {
    type: 'extend_window' | 'reduce_duration' | 'split_further';
    suggestedMinutes?: number;
    targetDayOfWeek?: number;
  }) => {
    setHardCapAlert(null);

    if (action.type === 'extend_window' && action.targetDayOfWeek !== undefined) {
      // Add or extend window on target day
      const dayName = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][action.targetDayOfWeek];
      const newWin: AvailabilityWindow = {
        id: `w_ext_${Date.now()}`,
        dayOfWeek: action.targetDayOfWeek,
        startTime: '19:00',
        endTime: '22:30',
        label: `${dayName} Extended Cram Session`,
      };
      const updatedWindows = [...windows, newWin];
      handleSaveWindows(updatedWindows);
      setIsAddAssignmentOpen(true);
      showToast(`Extended ${dayName} availability by +3.5 hours. Ready to schedule!`);
    } else if (action.type === 'reduce_duration' || action.type === 'split_further') {
      setIsAddAssignmentOpen(true);
      showToast('Assignment form reopened to adjust estimate or due date.');
    }
  };

  // Export JSON backup
  const handleExportData = () => {
    const data = {
      user,
      courses,
      windows,
      assignments,
      chunks,
      learningHistory,
      exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `plancraft_schedule_backup_${currentDateKey}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Schedule data exported successfully.');
  };

  // Calculations for navbar stats
  const activeAssignments = assignments.filter((a) => a.status !== 'Completed');
  const totalChunksCount = chunks.length;
  const completedChunksCount = chunks.filter((c) => c.status === 'Completed').length;
  const completionRate =
    totalChunksCount > 0 ? Math.round((completedChunksCount / totalChunksCount) * 100) : 0;
  const totalChunkMinutes = chunks.reduce((sum, c) => sum + c.durationMinutes, 0);
  const weeklyWorkloadHours = (totalChunkMinutes / 60).toFixed(1);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col text-slate-900 font-sans selection:bg-indigo-500 selection:text-white">
      {/* Toast banner */}
      {toastMessage && (
        <aside aria-label="Notification" className="fixed bottom-5 left-5 z-50 bg-slate-900 text-white border border-slate-700 px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 animate-slide-up max-w-md">
          <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
          <span className="text-xs font-medium flex-1">{toastMessage}</span>
          <button
            onClick={() => setToastMessage(null)}
            className="text-slate-400 hover:text-white p-1"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </aside>
      )}

      {/* Main Top Header Navbar */}
      <Navbar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        user={user}
        courses={courses}
        activeAssignmentsCount={activeAssignments.length}
        weeklyWorkloadHours={weeklyWorkloadHours}
        completionRatePercent={completionRate}
        soundEnabled={soundEnabled}
        onToggleSound={handleToggleSound}
        onToggleEngineInsights={() => setIsEngineInsightsOpen(true)}
        onOpenAddAssignment={() => setIsAddAssignmentOpen(true)}
        onOpenCourseManager={() => setIsCourseManagerOpen(true)}
        onOpenAvailabilityManager={() => setIsAvailabilityManagerOpen(true)}
        onTriggerRebalance={handleTriggerRebalance}
        onResetData={resetAllDataToDefault}
        onExportData={handleExportData}
      />

      {/* Contextual Nudge Banner (Smart Push simulation 15m before block) */}
      <ContextualNudgeBanner
        chunks={chunks}
        assignments={assignments}
        currentDateKey={currentDateKey}
        onStartFocus={(chunk) => setActiveFocusChunk(chunk)}
        onSnooze={handleSnoozeChunk}
        onTriggerRebalance={handleTriggerRebalance}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'today' && (
          <TodayChecklistView
            chunks={chunks}
            assignments={assignments}
            courses={courses}
            currentDateKey={currentDateKey}
            onStartFocus={(chunk) => setActiveFocusChunk(chunk)}
            onCompleteChunk={handleCompleteChunk}
            onMarkDelayed={handleMarkDelayed}
            onTriggerRebalance={handleTriggerRebalance}
            onOpenAddAssignment={() => setIsAddAssignmentOpen(true)}
          />
        )}

        {activeTab === 'weekly' && (
          <WeeklyBlueprintView
            chunks={chunks}
            assignments={assignments}
            courses={courses}
            windows={windows}
            onUpdateChunk={handleUpdateChunk}
            onTriggerRebalance={handleTriggerRebalance}
            onOpenAvailabilityManager={() => setIsAvailabilityManagerOpen(true)}
            onStartFocus={(chunk) => setActiveFocusChunk(chunk)}
          />
        )}

        {activeTab === 'assignments' && (
          <AssignmentsListView
            assignments={assignments}
            courses={courses}
            chunks={chunks}
            onOpenAddAssignment={() => setIsAddAssignmentOpen(true)}
            onDeleteAssignment={handleDeleteAssignment}
            onToggleAssignmentStatus={handleToggleAssignmentStatus}
            onOpenCourseManager={() => setIsCourseManagerOpen(true)}
            onStartFocus={(chunk) => setActiveFocusChunk(chunk)}
          />
        )}
      </main>

      {/* Engine Insights Drawer */}
      <EngineInsightsDrawer
        isOpen={isEngineInsightsOpen}
        onClose={() => setIsEngineInsightsOpen(false)}
        onOpenAvailabilityManager={() => {
          setIsEngineInsightsOpen(false);
          setIsAvailabilityManagerOpen(true);
        }}
      />

      {/* Add Assignment Modal */}
      {isAddAssignmentOpen && (
        <AddAssignmentModal
          existingAssignments={assignments}
          existingChunks={chunks}
          windows={windows}
          courses={courses}
          learningHistory={learningHistory as any}
          onAddAssignment={handleAddAssignment}
          onOpenCourseManager={() => {
            setIsAddAssignmentOpen(false);
            setIsCourseManagerOpen(true);
          }}
          onClose={() => setIsAddAssignmentOpen(false)}
          onHardCapViolation={(result) => {
            setIsAddAssignmentOpen(false);
            setHardCapAlert(result);
          }}
        />
      )}

      {/* Course Manager Modal */}
      {isCourseManagerOpen && (
        <CourseManagerModal
          courses={courses}
          assignments={assignments}
          onSaveCourses={handleSaveCourses}
          onClose={() => setIsCourseManagerOpen(false)}
        />
      )}

      {/* Availability Windows Manager Modal */}
      {isAvailabilityManagerOpen && (
        <AvailabilityManagerModal
          windows={windows}
          onSaveWindows={handleSaveWindows}
          onClose={() => setIsAvailabilityManagerOpen(false)}
        />
      )}

      {/* Hard Cap Boundary Enforcement Modal */}
      {hardCapAlert && (
        <HardCapAlertModal
          hardCapResult={hardCapAlert}
          onApplyRecommendation={handleApplyHardCapRecommendation}
          onOpenAvailabilityManager={() => {
            setHardCapAlert(null);
            setIsAvailabilityManagerOpen(true);
          }}
          onClose={() => setHardCapAlert(null)}
        />
      )}

      {/* Focus Timer Modal */}
      {activeFocusChunk && (
        <FocusTimerModal
          chunk={activeFocusChunk}
          assignment={assignments.find((a) => a.id === activeFocusChunk.assignmentId)}
          onComplete={handleCompleteChunk}
          onClose={() => setActiveFocusChunk(null)}
        />
      )}
    </div>
  );
}
