import React, { useState, useEffect } from 'react';
import { TaskChunk, Assignment } from '../types/scheduler';
import { timeToMinutes } from '../utils/schedulerEngine';
import { sounds } from '../utils/audioAlerts';
import { Play, Clock, Sparkles, Bell, Check, X, AlertTriangle } from 'lucide-react';

interface Props {
  chunks: TaskChunk[];
  assignments: Assignment[];
  onStartFocus: (chunk: TaskChunk) => void;
  onSnooze: (chunkId: string, minutes: number) => void;
  onTriggerRebalance: () => void;
  currentDateKey: string;
}

export const ContextualNudgeBanner: React.FC<Props> = ({
  chunks,
  assignments,
  onStartFocus,
  onSnooze,
  onTriggerRebalance,
  currentDateKey,
}) => {
  const [dismissedChunkIds, setDismissedChunkIds] = useState<Set<string>>(new Set());
  const [browserNotificationAllowed, setBrowserNotificationAllowed] = useState<boolean>(false);
  const [currentTimeMinutes, setCurrentTimeMinutes] = useState<number>(() => {
    const d = new Date();
    return d.getHours() * 60 + d.getMinutes();
  });

  // Track real time tick every 15 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      const d = new Date();
      setCurrentTimeMinutes(d.getHours() * 60 + d.getMinutes());
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  // Check browser notification status
  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setBrowserNotificationAllowed(Notification.permission === 'granted');
    }
  }, []);

  const requestBrowserPermission = async () => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      try {
        const res = await Notification.requestPermission();
        if (res === 'granted') {
          setBrowserNotificationAllowed(true);
          new Notification('PlanCraft Smart Alerts Active', {
            body: 'You will receive intelligent 15-minute study reminders before blocks start.',
          });
        }
      } catch {
        // ignore
      }
    }
  };

  // Find the most urgent upcoming chunk today:
  // Starts within -15 mins to +30 mins, or is currently in progress, and not completed
  const activeOrUpcoming = chunks.find((c) => {
    if (c.status === 'Completed' || dismissedChunkIds.has(c.id)) return false;
    if (c.scheduledDate !== currentDateKey) return false;

    const startM = timeToMinutes(c.scheduledStartTime);
    const endM = timeToMinutes(c.scheduledEndTime);

    // Active now
    if (currentTimeMinutes >= startM && currentTimeMinutes < endM) {
      return true;
    }
    // Starting within 20 mins
    if (startM > currentTimeMinutes && startM - currentTimeMinutes <= 20) {
      return true;
    }
    // Recently missed (started up to 30 mins ago and not finished)
    if (currentTimeMinutes >= endM && currentTimeMinutes - endM <= 45 && c.status !== 'Missed') {
      return true;
    }
    return false;
  });

  // Also check if any chunk is marked 'Missed'
  const hasMissedChunks = chunks.some(
    (c) => c.status === 'Missed' || (c.scheduledDate < currentDateKey && c.status === 'Scheduled')
  );

  // Trigger audio alert when a new nudge appears
  useEffect(() => {
    if (activeOrUpcoming) {
      sounds.playNudgeAlert();
      if (browserNotificationAllowed && 'Notification' in window) {
        try {
          new Notification(`Study Block: ${activeOrUpcoming.chunkLabel}`, {
            body: `Scheduled at ${activeOrUpcoming.scheduledStartTime}. Click to start focus session or snooze.`,
          });
        } catch {
          // ignore
        }
      }
    }
  }, [activeOrUpcoming?.id]);

  if (!activeOrUpcoming && !hasMissedChunks) {
    return null;
  }

  // If there are missed chunks and no active block, render quick rebalance nudge
  if (!activeOrUpcoming && hasMissedChunks) {
    return (
      <aside aria-label="Schedule Rebalance Alert" className="w-full bg-amber-500 text-slate-900 border-b border-amber-600 px-4 py-2.5 transition-all shadow-sm">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="p-1 bg-amber-600/30 rounded-md text-slate-950">
              <AlertTriangle className="w-4 h-4" />
            </span>
            <div className="text-xs font-semibold text-slate-950">
              <span>Unfinished Study Blocks Detected</span>
              <span className="font-normal text-slate-900 ml-1.5 hidden sm:inline">
                Some scheduled sessions were delayed or missed. Rebalance now to fit them into upcoming open slots.
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onTriggerRebalance}
              className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-950 text-white hover:bg-slate-800 text-xs font-medium rounded-md transition-colors shadow-xs"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              Auto-Rebalance Now
            </button>
          </div>
        </div>
      </aside>
    );
  }

  if (!activeOrUpcoming) return null;

  const parentAssignment = assignments.find((a) => a.id === activeOrUpcoming.assignmentId);
  const startM = timeToMinutes(activeOrUpcoming.scheduledStartTime);
  const endM = timeToMinutes(activeOrUpcoming.scheduledEndTime);
  const minutesUntil = startM - currentTimeMinutes;
  const isNowActive = currentTimeMinutes >= startM && currentTimeMinutes < endM;
  const isPast = currentTimeMinutes >= endM;

  return (
    <aside aria-label="Study Block Reminder" className="w-full bg-indigo-900 text-white border-b border-indigo-950 px-4 py-3 shadow-md transition-all">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-start md:items-center gap-3">
          <div className="p-2 bg-indigo-800 rounded-lg text-indigo-300 mt-0.5 md:mt-0">
            <Bell className="w-4 h-4 animate-bounce" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-indigo-200">
              <span className="font-semibold text-white">
                {parentAssignment?.courseCode || 'Coursework'}
              </span>
              <span aria-hidden="true">·</span>
              <span>
                {isNowActive
                  ? `Active Study Window (Ends ${activeOrUpcoming.scheduledEndTime})`
                  : isPast
                  ? `Window Ended at ${activeOrUpcoming.scheduledEndTime}`
                  : `Starts in ${minutesUntil <= 0 ? 'a moment' : `${minutesUntil} mins`} (${activeOrUpcoming.scheduledStartTime})`}
              </span>
              <span aria-hidden="true">·</span>
              <span>{activeOrUpcoming.durationMinutes} min session</span>
            </div>
            <h2 className="text-sm font-bold text-white tracking-tight mt-0.5">
              {activeOrUpcoming.chunkLabel}
            </h2>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 pl-9 md:pl-0">
          <button
            onClick={() => onStartFocus(activeOrUpcoming)}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold rounded-lg transition-colors shadow-sm"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            Start Now
          </button>

          <button
            onClick={() => onSnooze(activeOrUpcoming.id, 15)}
            className="inline-flex items-center gap-1 px-3 py-1.5 bg-indigo-800 hover:bg-indigo-700 text-indigo-100 text-xs font-medium rounded-lg transition-colors border border-indigo-700/60"
          >
            <Clock className="w-3.5 h-3.5 text-indigo-300" />
            Snooze 15m
          </button>

          <button
            onClick={onTriggerRebalance}
            className="inline-flex items-center gap-1 px-3 py-1.5 bg-indigo-800 hover:bg-indigo-700 text-indigo-100 text-xs font-medium rounded-lg transition-colors border border-indigo-700/60"
            title="Redistribute to future open slots"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            Rebalance
          </button>

          {!browserNotificationAllowed && (
            <button
              onClick={requestBrowserPermission}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-indigo-950/70 hover:bg-indigo-950 text-indigo-300 text-xs rounded-lg transition-colors ml-1"
              title="Enable OS push alerts"
            >
              <Bell className="w-3 h-3" />
              Enable Push
            </button>
          )}

          <button
            onClick={() =>
              setDismissedChunkIds((prev) => new Set([...prev, activeOrUpcoming.id]))
            }
            className="p-1.5 text-indigo-400 hover:text-white rounded-md transition-colors"
            title="Dismiss notice"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};
