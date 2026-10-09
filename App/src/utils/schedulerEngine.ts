import {
  Assignment,
  AvailabilityWindow,
  HardCapCheckResult,
  ScheduleRebalanceResult,
  TaskChunk,
} from '../types/scheduler';

// Helper to convert "HH:MM" to minutes from 00:00
export function timeToMinutes(timeStr: string): number {
  const [h, m] = timeStr.split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
}

// Helper to convert minutes from 00:00 to "HH:MM"
export function minutesToTime(totalMinutes: number): string {
  const safeMinutes = Math.max(0, Math.min(1439, Math.round(totalMinutes)));
  const h = Math.floor(safeMinutes / 60);
  const m = safeMinutes % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
}

// Format Date to YYYY-MM-DD
export function formatDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Parse "YYYY-MM-DD" safely
export function parseDateKey(dateKey: string): Date {
  const [y, m, d] = dateKey.split('-').map(Number);
  return new Date(y, m - 1, d);
}

// Get day of week (0=Sun, 1=Mon, ..., 6=Sat)
export function getDayOfWeek(date: Date): number {
  return date.getDay();
}

/**
 * Generate discrete chunk partitions for an assignment based on threshold.
 * e.g. 180 min -> [90, 90]
 * e.g. 300 min -> [100, 100, 100]
 * e.g. 75 min -> [75]
 */
export function divideIntoChunks(
  assignment: Assignment,
  chunkThresholdMinutes: number = 120
): Array<{ label: string; index: number; total: number; duration: number }> {
  const totalMin = assignment.totalEstimatedMinutes;

  if (totalMin <= chunkThresholdMinutes) {
    return [
      {
        label: `${assignment.title} - Full Session`,
        index: 1,
        total: 1,
        duration: totalMin,
      },
    ];
  }

  // Calculate number of chunks needed so each chunk is <= 100-120 min
  const idealChunkDuration = 90; // targeted chunk size
  const chunkCount = Math.max(2, Math.ceil(totalMin / idealChunkDuration));
  const baseDuration = Math.floor(totalMin / chunkCount / 15) * 15;
  const remainder = totalMin - baseDuration * chunkCount;

  const chunks: Array<{ label: string; index: number; total: number; duration: number }> = [];
  for (let i = 0; i < chunkCount; i++) {
    const extra = i < Math.floor(remainder / 15) ? 15 : 0;
    const duration: number = i === chunkCount - 1 
      ? Math.max(15, totalMin - chunks.reduce((sum, c) => sum + c.duration, 0))
      : baseDuration + extra;

    chunks.push({
      label: `${assignment.title} - Part ${i + 1}`,
      index: i + 1,
      total: chunkCount,
      duration,
    });
  }

  return chunks;
}

/**
 * Calculate available study window capacity between startDate and dueDate.
 */
export function calculateAvailableCapacity(
  startDate: Date,
  dueDate: Date,
  windows: AvailabilityWindow[]
): {
  totalAvailableMinutes: number;
  windowSlots: Array<{
    date: Date;
    dateKey: string;
    dayOfWeek: number;
    startTime: string;
    endTime: string;
    availableMinutes: number;
    windowId: string;
  }>;
} {
  const slots: Array<{
    date: Date;
    dateKey: string;
    dayOfWeek: number;
    startTime: string;
    endTime: string;
    availableMinutes: number;
    windowId: string;
  }> = [];

  let totalAvailableMinutes = 0;
  const current = new Date(startDate);
  current.setHours(0, 0, 0, 0);

  const end = new Date(dueDate);

  // Iterate day by day from start to end
  const maxDays = 28; // 4 weeks outlook
  let dayCounter = 0;

  while (current <= end && dayCounter < maxDays) {
    const dayOfWeek = current.getDay();
    const dateKey = formatDateKey(current);

    const dayWindows = windows.filter((w) => w.dayOfWeek === dayOfWeek);

    for (const w of dayWindows) {
      const windowStartMin = timeToMinutes(w.startTime);
      const windowEndMin = timeToMinutes(w.endTime);
      let windowDuration = windowEndMin - windowStartMin;

      // If this is the current day, check if window start is in past
      if (formatDateKey(startDate) === dateKey) {
        const nowMinutes = startDate.getHours() * 60 + startDate.getMinutes();
        if (nowMinutes >= windowEndMin) {
          // Already passed today
          continue;
        } else if (nowMinutes > windowStartMin) {
          // Window has partially passed, remaining time available:
          windowDuration = windowEndMin - nowMinutes;
        }
      }

      // If this is the due date, don't use window after due time
      if (formatDateKey(dueDate) === dateKey) {
        const dueTimeMin = dueDate.getHours() * 60 + dueDate.getMinutes();
        if (windowStartMin >= dueTimeMin) {
          continue; // window is after deadline
        } else if (windowEndMin > dueTimeMin) {
          windowDuration = dueTimeMin - windowStartMin;
        }
      }

      if (windowDuration >= 15) {
        totalAvailableMinutes += windowDuration;
        slots.push({
          date: new Date(current),
          dateKey,
          dayOfWeek,
          startTime: w.startTime,
          endTime: w.endTime,
          availableMinutes: windowDuration,
          windowId: w.id,
        });
      }
    }

    current.setDate(current.getDate() + 1);
    dayCounter++;
  }

  return { totalAvailableMinutes, windowSlots: slots };
}

/**
 * HARD CAP BOUNDARY ENFORCEMENT:
 * Evaluates whether adding or scheduling an assignment exceeds available capacity before deadline.
 */
export function checkHardCapBoundary(
  targetAssignment: { title: string; totalEstimatedMinutes: number; dueDate: string },
  existingAssignments: Assignment[],
  existingChunks: TaskChunk[],
  windows: AvailabilityWindow[],
  now: Date = new Date()
): HardCapCheckResult {
  const due = new Date(targetAssignment.dueDate);
  const { totalAvailableMinutes } = calculateAvailableCapacity(now, due, windows);

  // Existing commitments due before or at the same time:
  const committedMinutesBeforeDeadline = existingChunks
    .filter((chunk) => {
      if (chunk.status === 'Completed') return false; // already done, doesn't consume future capacity
      const chunkDate = parseDateKey(chunk.scheduledDate);
      return chunkDate <= due;
    })
    .reduce((sum, chunk) => sum + chunk.durationMinutes, 0);

  const requiredMinutes = targetAssignment.totalEstimatedMinutes;
  const netAvailableMinutes = Math.max(0, totalAvailableMinutes - committedMinutesBeforeDeadline);
  const deficitMinutes = Math.max(0, requiredMinutes - netAvailableMinutes);
  const hasCapacity = deficitMinutes === 0;

  const dueDayName = due.toLocaleDateString('en-US', { weekday: 'long' });
  const dueDayIndex = due.getDay();

  const recommendations: HardCapCheckResult['recommendations'] = [];

  if (!hasCapacity) {
    const deficitHours = (deficitMinutes / 60).toFixed(1);

    recommendations.push({
      type: 'extend_window',
      title: `Expand Free Study Window (+${deficitHours} hrs)`,
      description: `Add or extend a study slot on ${dueDayName} or prior days by at least ${deficitMinutes} minutes to clear the bottleneck.`,
      suggestedMinutes: deficitMinutes,
      targetDayOfWeek: dueDayIndex,
    });

    recommendations.push({
      type: 'reduce_duration',
      title: `Trim Assignment Scope (-${deficitHours} hrs)`,
      description: `Reduce estimated duration to ${Math.max(15, requiredMinutes - deficitMinutes)} minutes to fit current capacity.`,
      suggestedMinutes: Math.max(15, requiredMinutes - deficitMinutes),
    });

    recommendations.push({
      type: 'split_further',
      title: 'Extend Due Date',
      description: 'Move deadline by 2-3 days to leverage upcoming weekend or next week availability.',
    });
  }

  return {
    hasCapacity,
    requiredMinutes,
    availableMinutes: netAvailableMinutes,
    deficitMinutes,
    earliestAvailableDate: formatDateKey(now),
    dueDate: targetAssignment.dueDate,
    assignmentTitle: targetAssignment.title,
    recommendations,
  };
}

interface Interval {
  start: number;
  end: number;
}

/**
 * First start time (minutes from midnight) inside [windowStart, windowEnd] where a block of
 * `duration` minutes fits without touching any occupied interval. Keeps a 5 minute buffer after
 * each occupied block. Returns null when nothing fits.
 */
export function findSlotStart(
  occupied: Interval[],
  windowStart: number,
  windowEnd: number,
  duration: number
): number | null {
  const sorted = [...occupied].sort((a, b) => a.start - b.start);
  let cursor = windowStart;
  for (const occ of sorted) {
    if (occ.end <= cursor) continue;
    const gapEnd = Math.min(occ.start, windowEnd);
    if (gapEnd - cursor >= duration) return cursor;
    cursor = Math.max(cursor, occ.end + 5);
    if (cursor >= windowEnd) return null;
  }
  return windowEnd - cursor >= duration ? cursor : null;
}

/**
 * CORE SCHEDULING ENGINE (Urgency First + Early Start + Chunking):
 * Allocates all uncompleted assignment chunks into user availability windows.
 */
export function generateUrgentFirstSchedule(
  assignments: Assignment[],
  windows: AvailabilityWindow[],
  existingChunks: TaskChunk[],
  chunkThresholdMinutes: number = 120,
  now: Date = new Date()
): {
  chunks: TaskChunk[];
  unplacedMinutes: number;
} {
  // Preserve all manual user overrides!
  const manualOverrides = existingChunks.filter((c) => c.isManualOverride);
  const completedChunks = existingChunks.filter((c) => c.status === 'Completed');

  // Filter out fully completed assignments
  const activeAssignments = assignments.filter((a) => a.status !== 'Completed');

  // Sort assignments by Urgency First (earliest deadline first)
  const sortedAssignments = [...activeAssignments].sort((a, b) => {
    const diff = new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
    if (diff !== 0) return diff;
    return b.totalEstimatedMinutes - a.totalEstimatedMinutes; // Heavier first if same deadline
  });

  // Track window slot occupancies per day
  // Structure: Map of "YYYY-MM-DD" -> array of busy time intervals [startMin, endMin]
  const occupiedSlots = new Map<string, Array<{ start: number; end: number; chunkId: string }>>();

  // Register manual overrides and completed chunks as occupied
  for (const c of [...manualOverrides, ...completedChunks]) {
    const startM = timeToMinutes(c.scheduledStartTime);
    const endM = timeToMinutes(c.scheduledEndTime);
    const list = occupiedSlots.get(c.scheduledDate) || [];
    list.push({ start: startM, end: endM, chunkId: c.id });
    occupiedSlots.set(c.scheduledDate, list);
  }

  const generatedChunks: TaskChunk[] = [...manualOverrides, ...completedChunks];
  let unplacedMinutes = 0;

  // For each assignment, partition into chunks
  for (const assignment of sortedAssignments) {
    const dueDate = new Date(assignment.dueDate);
    
    // Check if chunks already exist for this assignment
    const existingForAssignment = existingChunks.filter((c) => c.assignmentId === assignment.id);
    const completedForAssignment = existingForAssignment.filter((c) => c.status === 'Completed');
    const overridesForAssignment = existingForAssignment.filter((c) => c.isManualOverride && c.status !== 'Completed');

    const minutesAlreadyAccountedFor = 
      completedForAssignment.reduce((sum, c) => sum + c.durationMinutes, 0) +
      overridesForAssignment.reduce((sum, c) => sum + c.durationMinutes, 0);

    const remainingWorkMinutes = Math.max(0, assignment.totalEstimatedMinutes - minutesAlreadyAccountedFor);

    if (remainingWorkMinutes <= 0) {
      continue;
    }

    // Partition remaining work into chunks
    const chunkPartitions = divideIntoChunks(
      { ...assignment, totalEstimatedMinutes: remainingWorkMinutes },
      chunkThresholdMinutes
    );

    // Schedule each partition chunk leading up to deadline (Urgency & Early Start)
    for (let pIdx = 0; pIdx < chunkPartitions.length; pIdx++) {
      const part = chunkPartitions[pIdx];
      const chunkId = `chunk_${assignment.id}_part_${pIdx + 1}_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      const partDuration = part.duration;

      // Find the earliest suitable study window slot between now and dueDate.
      // An assignment that is already overdue is still planned, as soon as possible.
      let placed = false;
      const overdue = dueDate.getTime() <= now.getTime();
      const searchDate = new Date(now);
      searchDate.setHours(0, 0, 0, 0);

      for (let dayOffset = 0; dayOffset <= 21 && !placed; dayOffset++) {
        const candidateDate = new Date(searchDate);
        candidateDate.setDate(candidateDate.getDate() + dayOffset);

        if (candidateDate > dueDate && !overdue) break; // exceeded deadline

        const dateKey = formatDateKey(candidateDate);
        const dayWindows = windows
          .filter((w) => w.dayOfWeek === candidateDate.getDay())
          .sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime));

        for (const window of dayWindows) {
          let windowStart = timeToMinutes(window.startTime);
          let windowEnd = timeToMinutes(window.endTime);

          // Never schedule in the past (10 minute buffer from now)
          if (dateKey === formatDateKey(now)) {
            windowStart = Math.max(windowStart, now.getHours() * 60 + now.getMinutes() + 10);
          }
          // Finish before the due time on the due date
          if (!overdue && dateKey === formatDateKey(dueDate)) {
            windowEnd = Math.min(windowEnd, dueDate.getHours() * 60 + dueDate.getMinutes());
          }
          if (windowEnd - windowStart < partDuration) continue;

          const dayOccupied = occupiedSlots.get(dateKey) || [];
          const slotStart = findSlotStart(dayOccupied, windowStart, windowEnd, partDuration);
          if (slotStart === null) continue;

          generatedChunks.push({
            id: chunkId,
            assignmentId: assignment.id,
            chunkLabel: part.label,
            chunkIndex: pIdx + 1,
            totalChunks: chunkPartitions.length,
            scheduledDate: dateKey,
            scheduledStartTime: minutesToTime(slotStart),
            scheduledEndTime: minutesToTime(slotStart + partDuration),
            durationMinutes: partDuration,
            status: 'Scheduled',
            isManualOverride: false,
          });
          dayOccupied.push({ start: slotStart, end: slotStart + partDuration, chunkId });
          occupiedSlots.set(dateKey, dayOccupied);
          placed = true;
          break;
        }
      }

      if (!placed) {
        unplacedMinutes += partDuration;
      }
    }
  }

  // Sort final chunks chronologically
  generatedChunks.sort((a, b) => {
    const dComp = a.scheduledDate.localeCompare(b.scheduledDate);
    if (dComp !== 0) return dComp;
    return a.scheduledStartTime.localeCompare(b.scheduledStartTime);
  });

  return {
    chunks: generatedChunks,
    unplacedMinutes,
  };
}

/**
 * AUTO-REBALANCE ENGINE:
 * When a user misses a study block or delays a task, redistributes uncompleted hours
 * into next available future free slots WITHOUT destroying manual overrides on other tasks.
 */
export function triggerAutoRebalance(
  chunks: TaskChunk[],
  assignments: Assignment[],
  windows: AvailabilityWindow[],
  now: Date = new Date()
): ScheduleRebalanceResult {
  const currentDateKey = formatDateKey(now);
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  const shiftedChunks: ScheduleRebalanceResult['shiftedChunks'] = [];
  const validRemainingChunks: TaskChunk[] = [];
  const needsRescheduling: TaskChunk[] = [];

  for (const chunk of chunks) {
    if (chunk.status === 'Completed') {
      validRemainingChunks.push(chunk);
      continue;
    }

    const chunkEndMinutes = timeToMinutes(chunk.scheduledEndTime);
    const isPast =
      chunk.scheduledDate < currentDateKey ||
      (chunk.scheduledDate === currentDateKey && chunkEndMinutes <= currentMinutes);

    // If past or explicitly marked Missed
    if (isPast || chunk.status === 'Missed') {
      // Mark as needing rescheduling
      needsRescheduling.push(chunk);
    } else {
      validRemainingChunks.push(chunk);
    }
  }

  if (needsRescheduling.length === 0) {
    return {
      rebalancedCount: 0,
      shiftedChunks: [],
      unresolvedMinutes: 0,
    };
  }

  // Sort chunks needing rescheduling by parent assignment deadline
  const assignmentMap = new Map(assignments.map((a) => [a.id, a]));
  needsRescheduling.sort((a, b) => {
    const assA = assignmentMap.get(a.assignmentId);
    const assB = assignmentMap.get(b.assignmentId);
    if (!assA || !assB) return 0;
    return new Date(assA.dueDate).getTime() - new Date(assB.dueDate).getTime();
  });

  // Track occupied slots
  const occupiedSlots = new Map<string, Array<{ start: number; end: number }>>();
  for (const c of validRemainingChunks) {
    const list = occupiedSlots.get(c.scheduledDate) || [];
    list.push({
      start: timeToMinutes(c.scheduledStartTime),
      end: timeToMinutes(c.scheduledEndTime),
    });
    occupiedSlots.set(c.scheduledDate, list);
  }

  let unresolvedMinutes = 0;

  for (const missedChunk of needsRescheduling) {
    const parentAssignment = assignmentMap.get(missedChunk.assignmentId);
    const dueDate = parentAssignment ? new Date(parentAssignment.dueDate) : new Date(Date.now() + 86400000 * 7);

    let placed = false;
    const overdue = dueDate.getTime() <= now.getTime();
    const searchDate = new Date(now);
    searchDate.setHours(0, 0, 0, 0);
    const duration = missedChunk.durationMinutes;

    for (let dayOffset = 0; dayOffset <= 14 && !placed; dayOffset++) {
      const candidateDate = new Date(searchDate);
      candidateDate.setDate(candidateDate.getDate() + dayOffset);

      if (candidateDate > dueDate && !overdue) break;

      const dateKey = formatDateKey(candidateDate);
      const dayWindows = windows
        .filter((w) => w.dayOfWeek === candidateDate.getDay())
        .sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime));

      for (const window of dayWindows) {
        let windowStart = timeToMinutes(window.startTime);
        let windowEnd = timeToMinutes(window.endTime);

        if (dateKey === currentDateKey) {
          windowStart = Math.max(windowStart, currentMinutes + 15);
        }
        if (!overdue && dateKey === formatDateKey(dueDate)) {
          windowEnd = Math.min(windowEnd, dueDate.getHours() * 60 + dueDate.getMinutes());
        }
        if (windowEnd - windowStart < duration) continue;

        const dayOccupied = occupiedSlots.get(dateKey) || [];
        const newStart = findSlotStart(dayOccupied, windowStart, windowEnd, duration);
        if (newStart === null) continue;

        shiftedChunks.push({
          chunkId: missedChunk.id,
          label: missedChunk.chunkLabel,
          oldSlot: `${missedChunk.scheduledDate} ${missedChunk.scheduledStartTime}`,
          newSlot: `${dateKey} ${minutesToTime(newStart)}`,
        });

        missedChunk.scheduledDate = dateKey;
        missedChunk.scheduledStartTime = minutesToTime(newStart);
        missedChunk.scheduledEndTime = minutesToTime(newStart + duration);
        missedChunk.status = 'Scheduled';

        dayOccupied.push({ start: newStart, end: newStart + duration });
        occupiedSlots.set(dateKey, dayOccupied);
        validRemainingChunks.push(missedChunk);
        placed = true;
        break;
      }
    }

    if (!placed) {
      unresolvedMinutes += missedChunk.durationMinutes;
      // Keep it in scheduled state so user is aware
      validRemainingChunks.push(missedChunk);
    }
  }

  // Mutate/update array in place
  chunks.length = 0;
  chunks.push(...validRemainingChunks);

  return {
    rebalancedCount: shiftedChunks.length,
    shiftedChunks,
    unresolvedMinutes,
  };
}
