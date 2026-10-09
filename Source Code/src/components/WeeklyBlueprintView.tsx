import React, { useState } from 'react';
import {
  Assignment,
  AvailabilityWindow,
  Course,
  TaskChunk,
} from '../types/scheduler';
import {
  formatDateKey,
  minutesToTime,
  parseDateKey,
  timeToMinutes,
} from '../utils/schedulerEngine';
import { CourseIcon } from './CourseIcon';
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  CheckCircle2,
  Lock,
  ArrowRight,
  ArrowLeft,
  Plus,
  Minus,
  Sparkles,
  Calendar,
  Check,
  Circle,
  Star,
  Play,
} from 'lucide-react';

interface Props {
  chunks: TaskChunk[];
  assignments: Assignment[];
  courses: Course[];
  windows: AvailabilityWindow[];
  onUpdateChunk: (updated: TaskChunk) => void;
  onTriggerRebalance: () => void;
  onOpenAvailabilityManager: () => void;
  onStartFocus: (chunk: TaskChunk) => void;
}

export const WeeklyBlueprintView: React.FC<Props> = ({
  chunks,
  assignments,
  courses,
  windows,
  onUpdateChunk,
  onTriggerRebalance,
  onOpenAvailabilityManager,
  onStartFocus,
}) => {
  const [weekOffset, setWeekOffset] = useState<number>(0);
  const [selectedCourseFilter, setSelectedCourseFilter] = useState<string>('all');

  const courseMap = new Map(courses.map((c) => [c.id, c]));
  const assignmentMap = new Map(assignments.map((a) => [a.id, a]));

  // Compute 7 days of the selected week (Mon -> Sun)
  const getWeekDates = (offset: number) => {
    const now = new Date();
    const currentDay = now.getDay();
    const distanceToMonday = currentDay === 0 ? -6 : 1 - currentDay;
    const monday = new Date(now);
    monday.setDate(now.getDate() + distanceToMonday + offset * 7);
    monday.setHours(0, 0, 0, 0);

    const days = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      days.push(d);
    }
    return days;
  };

  const weekDays = getWeekDates(weekOffset);
  const weekDateKeys = new Set(weekDays.map(formatDateKey));

  // Filter chunks by week dates and course filter
  const weekChunks = chunks.filter((c) => {
    if (!weekDateKeys.has(c.scheduledDate)) return false;
    if (selectedCourseFilter === 'all') return true;
    const parent = assignmentMap.get(c.assignmentId);
    return parent?.courseId === selectedCourseFilter;
  });

  const totalWeekMinutes = weekChunks.reduce((sum, c) => sum + c.durationMinutes, 0);
  const completedWeekMinutes = weekChunks
    .filter((c) => c.status === 'Completed')
    .reduce((sum, c) => sum + c.durationMinutes, 0);

  // Shift chunk to adjacent day
  const handleShiftDay = (chunk: TaskChunk, dayDelta: number) => {
    const currentD = parseDateKey(chunk.scheduledDate);
    currentD.setDate(currentD.getDate() + dayDelta);
    const newDateKey = formatDateKey(currentD);

    onUpdateChunk({
      ...chunk,
      scheduledDate: newDateKey,
      isManualOverride: true,
    });
  };

  // Resize chunk duration (+/- 15m)
  const handleResizeDuration = (chunk: TaskChunk, deltaMinutes: number) => {
    const newDur = Math.max(15, chunk.durationMinutes + deltaMinutes);
    const startM = timeToMinutes(chunk.scheduledStartTime);
    const newEndM = Math.min(1439, startM + newDur);

    onUpdateChunk({
      ...chunk,
      durationMinutes: newDur,
      scheduledEndTime: minutesToTime(newEndM),
      isManualOverride: true,
    });
  };

  // Toggle complete
  const handleToggleComplete = (chunk: TaskChunk) => {
    const newStatus = chunk.status === 'Completed' ? 'Scheduled' : 'Completed';
    onUpdateChunk({
      ...chunk,
      status: newStatus,
    });
  };

  const todayKey = formatDateKey(new Date());

  return (
    <div className="space-y-5">
      {/* Top Header & Friendly Week Navigator */}
      <div className="bg-white border-2 border-indigo-100 rounded-3xl p-5 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 bg-gradient-to-tr from-indigo-500 to-purple-600 text-white rounded-2xl flex items-center justify-center shadow-md shadow-indigo-200">
              <Calendar className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-black text-slate-900 tracking-tight">
                  Weekly Homework Planner
                </h2>
                {weekOffset === 0 && (
                  <span className="text-[11px] font-black uppercase tracking-wider px-2.5 py-0.5 bg-indigo-100 text-indigo-700 rounded-full border border-indigo-200">
                    This Week ⭐
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 font-semibold mt-0.5">
                {weekDays[0].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} –{' '}
                {weekDays[6].toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Week switch buttons */}
            <div className="flex items-center bg-slate-100 p-1 rounded-2xl border border-slate-200">
              <button
                onClick={() => setWeekOffset((w) => w - 1)}
                className="p-1.5 hover:bg-white rounded-xl text-slate-600 transition-colors"
                title="Previous Week"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={() => setWeekOffset(0)}
                className="px-3 py-1 text-xs font-black text-slate-700 hover:text-slate-900"
              >
                Current Week
              </button>
              <button
                onClick={() => setWeekOffset((w) => w + 1)}
                className="p-1.5 hover:bg-white rounded-xl text-slate-600 transition-colors"
                title="Next Week"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Action: Rebalance / Study Times */}
            <button
              onClick={onTriggerRebalance}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs font-bold rounded-2xl transition-all border border-amber-200"
            >
              <Sparkles className="w-4 h-4 text-amber-600" />
              <span>Auto-Fix Missed Slots</span>
            </button>

            <button
              onClick={onOpenAvailabilityManager}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-2xl transition-all border border-slate-200"
            >
              <Clock className="w-4 h-4 text-blue-600" />
              <span>Change Study Hours</span>
            </button>
          </div>
        </div>

        {/* Colorful Class Filter Bar */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pt-2 border-t border-slate-100">
          <span className="text-xs font-black text-slate-400 mr-1 shrink-0">
            Filter:
          </span>
          <button
            onClick={() => setSelectedCourseFilter('all')}
            className={`px-3 py-1.5 text-xs font-black rounded-xl transition-all shrink-0 ${
              selectedCourseFilter === 'all'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All Classes ({chunks.length})
          </button>
          {courses.map((course) => {
            const isSelected = selectedCourseFilter === course.id;
            return (
              <button
                key={course.id}
                onClick={() => setSelectedCourseFilter(course.id)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-black rounded-xl transition-all shrink-0 ${
                  isSelected
                    ? 'text-white shadow-md'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
                style={
                  isSelected
                    ? { backgroundColor: course.color }
                    : { borderLeft: `4px solid ${course.color}` }
                }
              >
                <CourseIcon icon={course.icon} className="w-3.5 h-3.5" />
                <span>{course.code}</span>
              </button>
            );
          })}
        </div>

        {/* Week Summary Banner */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 text-xs font-bold text-slate-600 border-t border-slate-100">
          <div className="flex items-center gap-3">
            <span>
              Total Planned:{' '}
              <strong className="text-indigo-900 font-black">
                {(totalWeekMinutes / 60).toFixed(1)} hrs
              </strong>
            </span>
            <span>·</span>
            <span>
              Completed:{' '}
              <strong className="text-emerald-700 font-black">
                {(completedWeekMinutes / 60).toFixed(1)} hrs
              </strong>
            </span>
          </div>
          <div className="text-indigo-600 font-black">
            {weekChunks.length} scheduled study blocks this week
          </div>
        </div>
      </div>

      {/* 7-Day Colorful Columns Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-3.5">
        {weekDays.map((dayDate) => {
          const dateKey = formatDateKey(dayDate);
          const isToday = dateKey === todayKey;
          const dayOfWeek = dayDate.getDay();

          const dayWindows = windows
            .filter((w) => w.dayOfWeek === dayOfWeek)
            .sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime));

          const totalWindowMinutes = dayWindows.reduce(
            (sum, w) => sum + (timeToMinutes(w.endTime) - timeToMinutes(w.startTime)),
            0
          );

          const dayChunks = weekChunks
            .filter((c) => c.scheduledDate === dateKey)
            .sort((a, b) => a.scheduledStartTime.localeCompare(b.scheduledStartTime));

          const dayChunkMinutes = dayChunks.reduce((sum, c) => sum + c.durationMinutes, 0);

          return (
            <div
              key={dateKey}
              className={`flex flex-col rounded-3xl border-2 transition-all shadow-xs ${
                isToday
                  ? 'border-indigo-500 bg-indigo-50/40 ring-4 ring-indigo-200/50 shadow-md'
                  : 'border-slate-200/90 bg-white hover:border-slate-300'
              }`}
            >
              {/* Day Header */}
              <div
                className={`p-3.5 border-b rounded-t-3xl ${
                  isToday
                    ? 'bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 text-white'
                    : 'bg-slate-50 border-slate-200 text-slate-900'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase tracking-wider flex items-center gap-1">
                    <span>{dayDate.toLocaleDateString('en-US', { weekday: 'short' })}</span>
                    {isToday && <Star className="w-3.5 h-3.5 fill-amber-300 text-amber-300" />}
                  </span>
                  <span className={`text-xs font-black font-mono ${isToday ? 'text-indigo-100' : 'text-slate-500'}`}>
                    {dayDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </span>
                </div>

                <div
                  className={`text-[11px] font-bold mt-1 flex items-center justify-between ${
                    isToday ? 'text-indigo-100' : 'text-slate-500'
                  }`}
                >
                  <span>
                    {(dayChunkMinutes / 60).toFixed(1)}h homework
                  </span>
                  <span className="opacity-80">
                    {(totalWindowMinutes / 60).toFixed(1)}h free
                  </span>
                </div>
              </div>

              {/* Day Study Blocks Area */}
              <div className="p-2.5 space-y-2.5 flex-1 min-h-[300px]">
                {dayChunks.length === 0 ? (
                  <div className="h-40 flex flex-col items-center justify-center text-center p-3 text-slate-400 text-xs border-2 border-dashed border-slate-200 rounded-2xl">
                    <span className="text-2xl mb-1">☀️</span>
                    <span className="font-bold text-slate-600">No Homework</span>
                    <span className="text-[10px] text-slate-400 mt-0.5">Free time or rest</span>
                  </div>
                ) : (
                  dayChunks.map((chunk) => {
                    const parentAssignment = assignmentMap.get(chunk.assignmentId);
                    const course = parentAssignment
                      ? courseMap.get(parentAssignment.courseId)
                      : undefined;
                    const courseColor = course?.color || parentAssignment?.courseColor || '#4f46e5';
                    const isCompleted = chunk.status === 'Completed';

                    return (
                      <div
                        key={chunk.id}
                        className={`rounded-2xl p-3 border-2 transition-all shadow-xs space-y-2 ${
                          isCompleted
                            ? 'bg-slate-100/90 border-slate-200 opacity-60'
                            : 'bg-white border-slate-200 hover:shadow-md'
                        }`}
                        style={{
                          borderLeftWidth: '5px',
                          borderLeftColor: courseColor,
                        }}
                      >
                        {/* Course badge & time */}
                        <div className="flex items-center justify-between gap-1 text-[11px]">
                          <span
                            className="font-black px-2 py-0.5 rounded-lg flex items-center gap-1 text-white shadow-2xs truncate"
                            style={{ backgroundColor: courseColor }}
                          >
                            <CourseIcon icon={course?.icon} className="w-3 h-3" />
                            <span>{course?.code || parentAssignment?.courseCode}</span>
                          </span>

                          <span className="font-mono font-bold text-slate-600 text-[10px] bg-slate-100 px-1.5 py-0.5 rounded">
                            {chunk.scheduledStartTime}
                          </span>
                        </div>

                        {/* Title */}
                        <div className="min-w-0">
                          <h4
                            className={`text-xs font-black leading-tight ${
                              isCompleted ? 'line-through text-slate-400' : 'text-slate-900'
                            }`}
                          >
                            {chunk.chunkLabel}
                          </h4>
                          <div className="text-[10px] font-semibold text-slate-500 mt-0.5">
                            Duration: {chunk.durationMinutes} min
                          </div>
                        </div>

                        {/* Quick action controls on each card */}
                        <div className="pt-1.5 border-t border-slate-100 flex items-center justify-between gap-1 text-[10px]">
                          {/* Check off button */}
                          <button
                            onClick={() => handleToggleComplete(chunk)}
                            className={`flex items-center gap-1 font-black px-2 py-1 rounded-lg transition-colors ${
                              isCompleted
                                ? 'bg-emerald-100 text-emerald-700'
                                : 'bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-emerald-700'
                            }`}
                            title={isCompleted ? 'Mark not done' : 'Mark done'}
                          >
                            {isCompleted ? (
                              <CheckCircle2 className="w-3.5 h-3.5 fill-emerald-600 text-white" />
                            ) : (
                              <Circle className="w-3.5 h-3.5 text-slate-400" />
                            )}
                            <span>{isCompleted ? 'Done' : 'Do'}</span>
                          </button>

                          {/* Focus timer quick trigger */}
                          {!isCompleted && (
                            <button
                              onClick={() => onStartFocus(chunk)}
                              className="p-1 hover:bg-indigo-50 text-indigo-600 rounded-lg transition-colors"
                              title="Start Focus Timer"
                            >
                              <Play className="w-3 h-3 fill-current" />
                            </button>
                          )}

                          {/* Day shifting buttons */}
                          <div className="flex items-center gap-0.5">
                            <button
                              onClick={() => handleShiftDay(chunk, -1)}
                              className="p-1 hover:bg-slate-200 text-slate-500 hover:text-slate-900 rounded transition-colors"
                              title="Move back 1 day"
                            >
                              <ArrowLeft className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => handleShiftDay(chunk, 1)}
                              className="p-1 hover:bg-slate-200 text-slate-500 hover:text-slate-900 rounded transition-colors"
                              title="Move forward 1 day"
                            >
                              <ArrowRight className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
