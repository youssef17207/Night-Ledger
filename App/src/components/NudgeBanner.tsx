import React, { useEffect, useState } from 'react';
import { Assignment, TaskChunk } from '../types/scheduler';
import { sounds } from '../utils/audioAlerts';
import { INK, LILAC, TANGERINE, chunkEnd, chunkStart, fmtHHMM, formatDateKey, isChunkSlipped } from '../utils/ledger';

interface Props {
  now: Date;
  chunks: TaskChunk[];
  assignments: Assignment[];
  onStartFocus: (chunk: TaskChunk) => void;
  onSnooze: (chunkId: string, minutes: number) => void;
  onAutoFix: () => void;
}

const btn =
  'h-9 cursor-pointer px-3 font-mono text-[11px] font-medium uppercase tracking-[0.06em] transition-opacity hover:opacity-80';

/**
 * Real-time reminder strip. Appears from 20 minutes before a block, stays while it is
 * running, and for 45 minutes after it ends if it was not finished.
 */
export const NudgeBanner: React.FC<Props> = ({ now, chunks, assignments, onStartFocus, onSnooze, onAutoFix }) => {
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const [pushAllowed, setPushAllowed] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setPushAllowed(Notification.permission === 'granted');
    }
  }, []);

  const requestPush = async () => {
    if (!('Notification' in window)) return;
    try {
      const res = await Notification.requestPermission();
      if (res === 'granted') {
        setPushAllowed(true);
        new Notification('Night Ledger reminders are on', { body: 'You will get a nudge shortly before each study block.' });
      }
    } catch {
      /* ignore */
    }
  };

  const todayKey = formatDateKey(now);
  const t = now.getTime();

  const current = chunks
    .filter((c) => c.status !== 'Completed' && c.scheduledDate === todayKey && !dismissed.has(c.id))
    .filter((c) => {
      const s = chunkStart(c).getTime();
      const e = chunkEnd(c).getTime();
      if (t >= s && t < e) return true; // running now
      if (s > t && s - t <= 20 * 60_000) return true; // starting soon
      if (t >= e && t - e <= 45 * 60_000 && c.status !== 'Missed') return true; // just ended
      return false;
    })
    .sort((a, b) => chunkStart(a).getTime() - chunkStart(b).getTime())[0];

  const slippedCount = chunks.filter((c) => isChunkSlipped(c, now)).length;

  useEffect(() => {
    if (!current) return;
    sounds.playNudgeAlert();
    if (pushAllowed && 'Notification' in window) {
      try {
        new Notification(`Study block: ${current.chunkLabel}`, {
          body: `Scheduled for ${fmtHHMM(current.scheduledStartTime)}. Open Night Ledger to start or snooze.`,
        });
      } catch {
        /* ignore */
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current?.id]);

  if (!current && slippedCount === 0) return null;

  if (!current) {
    return (
      <aside aria-label="Missed study blocks" style={{ background: TANGERINE, color: INK }}>
        <div className="mx-auto flex max-w-[1120px] flex-wrap items-center justify-between gap-3 px-7 py-3">
          <span className="font-mono text-[13px] font-medium uppercase" style={{ letterSpacing: '0.08em' }}>
            {slippedCount} study {slippedCount === 1 ? 'block' : 'blocks'} slipped past. Move {slippedCount === 1 ? 'it' : 'them'} to
            open slots?
          </span>
          <button type="button" className={btn} style={{ background: INK, color: 'var(--paper)' }} onClick={onAutoFix}>
            Auto-fix now
          </button>
        </div>
      </aside>
    );
  }

  const a = assignments.find((x) => x.id === current.assignmentId);
  const s = chunkStart(current).getTime();
  const e = chunkEnd(current).getTime();
  const running = t >= s && t < e;
  const ended = t >= e;
  const mins = Math.max(0, Math.ceil((s - t) / 60_000));
  const status = running
    ? `Running now, ends ${fmtHHMM(current.scheduledEndTime)}`
    : ended
    ? `Ended at ${fmtHHMM(current.scheduledEndTime)}`
    : `Starts in ${mins <= 1 ? 'a minute' : `${mins} min`} (${fmtHHMM(current.scheduledStartTime)})`;

  return (
    <aside aria-label="Study block reminder" role="status" style={{ background: LILAC, color: INK }}>
      <div className="mx-auto flex max-w-[1120px] flex-wrap items-center justify-between gap-x-6 gap-y-2 px-7 py-3">
        <div className="min-w-0">
          <div className="font-mono text-[12px] font-medium uppercase" style={{ letterSpacing: '0.08em' }}>
            {a?.courseCode ?? 'Study'} · {status}
          </div>
          <div className="text-[16px] font-semibold uppercase" style={{ letterSpacing: '0.04em', overflowWrap: 'anywhere' }}>
            {current.chunkLabel}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" className={btn} style={{ background: INK, color: 'var(--paper)' }} onClick={() => onStartFocus(current)}>
            ▶ Start now
          </button>
          <button
            type="button"
            className={btn}
            style={{ border: `2px solid ${INK}`, background: 'transparent', color: INK }}
            onClick={() => onSnooze(current.id, 15)}
          >
            Snooze 15m
          </button>
          {!pushAllowed && 'Notification' in window && (
            <button
              type="button"
              className={btn}
              style={{ border: `2px solid ${INK}`, background: 'transparent', color: INK }}
              onClick={requestPush}
              title="Get a browser notification before each block"
            >
              Enable alerts
            </button>
          )}
          <button
            type="button"
            className={btn}
            aria-label="Dismiss reminder"
            style={{ background: 'transparent', color: INK }}
            onClick={() => setDismissed((prev) => new Set([...prev, current.id]))}
          >
            ✕
          </button>
        </div>
      </div>
    </aside>
  );
};
