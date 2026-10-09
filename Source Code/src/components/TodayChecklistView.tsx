import React, { useState } from 'react';
import { TaskChunk, Assignment, Course } from '../types/scheduler';
import { sounds } from '../utils/audioAlerts';
import { CourseIcon } from './CourseIcon';
import confetti from 'canvas-confetti';
import {
  CheckCircle2,
  Circle,
  Play,
  Clock,
  Sparkles,
  Calendar,
  Check,
  Zap,
  Plus,
  Smile,
  PartyPopper,
  Flame,
  Star,
  CheckCircle,
} from 'lucide-react';

interface Props {
  chunks: TaskChunk[];
  assignments: Assignment[];
  courses: Course[];
  currentDateKey: string;
  onStartFocus: (chunk: TaskChunk) => void;
  onCompleteChunk: (chunkId: string, actualMinutes?: number) => void;
  onMarkDelayed: (chunkId: string) => void;
  onTriggerRebalance: () => void;
  onOpenAddAssignment: () => void;
}

export const TodayChecklistView: React.FC<Props> = ({
  chunks,
  assignments,
  courses,
  currentDateKey,
  onStartFocus,
  onCompleteChunk,
  onMarkDelayed,
  onTriggerRebalance,
  onOpenAddAssignment,
}) => {
  const [filterMode, setFilterMode] = useState<'all' | 'todo' | 'done'>('all');

  const courseMap = new Map(courses.map((c) => [c.id, c]));
  const assignmentMap = new Map(assignments.map((a) => [a.id, a]));

  // Filter chunks for today
  const todayChunks = chunks
    .filter((c) => c.scheduledDate === currentDateKey)
    .sort((a, b) => a.scheduledStartTime.localeCompare(b.scheduledStartTime));

  const completedCount = todayChunks.filter((c) => c.status === 'Completed').length;
  const totalCount = todayChunks.length;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const totalMinutes = todayChunks.reduce((sum, c) => sum + c.durationMinutes, 0);

  const now = new Date();
  const hour = now.getHours();
  const greeting =
    hour < 12 ? 'Good morning! ☀️' : hour < 17 ? 'Good afternoon! 🌤️' : 'Good evening! 🌙';

  // Find next uncompleted chunk
  const nextChunk = todayChunks.find((c) => c.status !== 'Completed');

  const handleQuickCheck = (chunk: TaskChunk) => {
    if (chunk.status === 'Completed') {
      onCompleteChunk(chunk.id, undefined);
    } else {
      sounds.playSuccessChime();
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.65 },
        colors: ['#6366f1', '#ec4899', '#f59e0b', '#10b981', '#3b82f6'],
      });
      onCompleteChunk(chunk.id, chunk.durationMinutes);
    }
  };

  const nextAssignment = nextChunk ? assignmentMap.get(nextChunk.assignmentId) : undefined;
  const nextCourse = nextAssignment ? courseMap.get(nextAssignment.courseId) : undefined;
  const nextColor = nextCourse?.color || nextAssignment?.courseColor || '#4f46e5';

  const visibleChunks = todayChunks.filter((c) => {
    if (filterMode === 'todo') return c.status !== 'Completed';
    if (filterMode === 'done') return c.status === 'Completed';
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Cheerful Colorful Banner */}
      <div className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-3xl p-6 sm:p-7 text-white shadow-xl shadow-indigo-200/50 relative overflow-hidden">
        {/* Playful background decorative bubbles */}
        <div className="absolute -right-8 -bottom-8 w-44 h-44 bg-white/10 rounded-full blur-xl pointer-events-none" />
        <div className="absolute right-20 -top-10 w-32 h-32 bg-amber-300/20 rounded-full blur-lg pointer-events-none" />

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-5">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-pink-200">
              <span className="bg-white/20 backdrop-blur-xs px-2.5 py-0.5 rounded-full text-white">
                {greeting}
              </span>
              <span>·</span>
              <span>
                {now.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
              </span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              {totalCount === 0
                ? 'No homework scheduled for today! 🎉'
                : completedCount === totalCount
                ? 'All finished for today! Superstar! 🌟'
                : `${totalCount - completedCount} tasks to do today! Let's crush it 💪`}
            </h2>

            <p className="text-xs sm:text-sm text-indigo-100 font-semibold">
              Planned study time: <strong>{(totalMinutes / 60).toFixed(1)} hours</strong> across your classes
            </p>
          </div>

          {/* Big Cheerful Progress Card */}
          <div className="bg-white text-slate-900 border-2 border-white/60 rounded-2xl p-4 sm:px-6 sm:py-3.5 text-center shrink-0 shadow-lg flex sm:flex-col items-center justify-between gap-3">
            <div>
              <div className="text-[11px] font-black text-slate-500 uppercase tracking-wider">
                Today's Progress
              </div>
              <div className="text-2xl sm:text-3xl font-black text-indigo-600 font-mono mt-0.5">
                {completedCount} of {totalCount}
              </div>
            </div>
            <div className="inline-flex items-center gap-1 text-xs font-black text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
              <Star className="w-3.5 h-3.5 fill-emerald-500 text-emerald-500" />
              <span>{progressPercent}% Done</span>
            </div>
          </div>
        </div>

        {/* Cheerful Progress Track */}
        <div className="w-full bg-black/20 h-3 rounded-full mt-5 overflow-hidden p-0.5 backdrop-blur-xs">
          <div
            className="bg-gradient-to-r from-amber-300 via-pink-300 to-white h-full rounded-full transition-all duration-500 shadow-sm"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Hero Focus Card: What to do right now */}
      {nextChunk && nextChunk.status !== 'Completed' && (
        <div
          className="rounded-3xl p-5 sm:p-6 text-white shadow-xl relative overflow-hidden transition-all border-2 border-white/20"
          style={{
            background: `linear-gradient(135deg, ${nextColor}, #1e1b4b)`,
          }}
        >
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-amber-400 text-slate-950 flex items-center gap-1.5 shadow-sm">
                  <Zap className="w-3.5 h-3.5 fill-current" />
                  Do This Next!
                </span>
                <span className="bg-white text-slate-900 px-3 py-1 rounded-full text-xs font-black flex items-center gap-1.5 shadow-sm">
                  <CourseIcon icon={nextCourse?.icon} className="w-3.5 h-3.5" />
                  {nextCourse?.code || nextAssignment?.courseCode}: {nextCourse?.name || nextAssignment?.courseName}
                </span>
              </div>

              <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                {nextChunk.chunkLabel}
              </h3>

              <div className="flex flex-wrap items-center gap-3 text-xs text-white/90 font-semibold">
                <span className="flex items-center gap-1.5 bg-black/25 backdrop-blur-xs px-3 py-1 rounded-xl">
                  <Clock className="w-3.5 h-3.5 text-amber-300" />
                  <span>
                    {nextChunk.scheduledStartTime} – {nextChunk.scheduledEndTime} ({nextChunk.durationMinutes} min)
                  </span>
                </span>
                {nextAssignment && (
                  <span className="bg-white/20 px-2.5 py-1 rounded-xl">
                    Due: <strong>{new Date(nextAssignment.dueDate).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</strong>
                  </span>
                )}
              </div>
            </div>

            {/* Quick Action Buttons */}
            <div className="flex flex-wrap items-center gap-2.5">
              <button
                onClick={() => onStartFocus(nextChunk)}
                className="inline-flex items-center gap-2 px-5 py-3 bg-amber-400 hover:bg-amber-300 active:scale-98 text-slate-950 font-black text-xs sm:text-sm rounded-2xl shadow-lg transition-all"
              >
                <Play className="w-4 h-4 fill-current" />
                Start Focus Timer
              </button>

              <button
                onClick={() => handleQuickCheck(nextChunk)}
                className="inline-flex items-center gap-1.5 px-4 py-3 bg-emerald-500 hover:bg-emerald-400 active:scale-98 text-white font-black text-xs sm:text-sm rounded-2xl shadow-lg transition-all"
              >
                <Check className="w-4 h-4 stroke-[3]" />
                I Finished This!
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Checklist Section */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
              <span>Today's Checklist</span>
              <span className="text-xs bg-indigo-100 text-indigo-700 px-2.5 py-0.5 rounded-full font-black">
                {todayChunks.length}
              </span>
            </h3>

            {/* Simple Filter Pills */}
            <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200">
              <button
                onClick={() => setFilterMode('all')}
                className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all ${
                  filterMode === 'all' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setFilterMode('todo')}
                className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all ${
                  filterMode === 'todo' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                To-Do ({totalCount - completedCount})
              </button>
              <button
                onClick={() => setFilterMode('done')}
                className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all ${
                  filterMode === 'done' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Done ({completedCount})
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onTriggerRebalance}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs font-bold rounded-xl transition-all border border-amber-200"
              title="Automatically fix any missed times"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              <span>Auto-Fix Missed Times</span>
            </button>
            <button
              onClick={onOpenAddAssignment}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-bold rounded-xl transition-all shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Homework</span>
            </button>
          </div>
        </div>

        {todayChunks.length === 0 ? (
          <div className="bg-white border-2 border-indigo-100 rounded-3xl p-8 sm:p-12 text-center space-y-3 shadow-xs">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto text-3xl shadow-sm">
              🏖️
            </div>
            <h4 className="text-xl font-black text-slate-900">Your Day is Completely Clear!</h4>
            <p className="text-xs sm:text-sm text-slate-500 max-w-sm mx-auto">
              No homework scheduled for today. You can relax, check the <strong>Weekly Planner</strong>, or add an assignment.
            </p>
            <button
              onClick={onOpenAddAssignment}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-all inline-flex items-center gap-2 shadow-md shadow-indigo-200"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Homework</span>
            </button>
          </div>
        ) : visibleChunks.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-6 text-center text-slate-500 text-xs">
            No tasks match this filter.
          </div>
        ) : (
          <div className="space-y-2.5">
            {visibleChunks.map((chunk) => {
              const assignment = assignmentMap.get(chunk.assignmentId);
              const course = assignment ? courseMap.get(assignment.courseId) : undefined;
              const courseColor = course?.color || assignment?.courseColor || '#4f46e5';
              const isCompleted = chunk.status === 'Completed';

              return (
                <div
                  key={chunk.id}
                  className={`bg-white border-2 rounded-2xl p-4 transition-all shadow-xs flex items-center justify-between gap-3 ${
                    isCompleted
                      ? 'border-slate-200 bg-slate-50/70 opacity-75'
                      : 'border-slate-200 hover:border-indigo-300 hover:shadow-sm'
                  }`}
                  style={{
                    borderLeftWidth: '6px',
                    borderLeftColor: courseColor,
                  }}
                >
                  {/* Left: Checkmark & details */}
                  <div className="flex items-center gap-3.5 flex-1 min-w-0">
                    <button
                      onClick={() => handleQuickCheck(chunk)}
                      className={`p-1 rounded-xl transition-transform active:scale-90 ${
                        isCompleted
                          ? 'text-emerald-600 hover:text-emerald-700'
                          : 'text-slate-300 hover:text-indigo-600'
                      }`}
                      title={isCompleted ? 'Mark not done' : 'Mark done!'}
                    >
                      {isCompleted ? (
                        <CheckCircle2 className="w-7 h-7 fill-emerald-100 stroke-[2.5]" />
                      ) : (
                        <Circle className="w-7 h-7 stroke-[2]" />
                      )}
                    </button>

                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 text-xs">
                        <span
                          className="font-bold px-2 py-0.5 rounded-lg flex items-center gap-1 text-white text-[11px] shadow-2xs"
                          style={{ backgroundColor: courseColor }}
                        >
                          <CourseIcon icon={course?.icon} className="w-3 h-3" />
                          <span>{course?.code || assignment?.courseCode}</span>
                        </span>
                        <span className="font-bold text-slate-800 truncate">
                          {course?.name || assignment?.courseName}
                        </span>
                        <span className="text-slate-300">·</span>
                        <span className="font-mono text-slate-600 font-bold bg-slate-100 px-2 py-0.5 rounded-md text-[11px]">
                          {chunk.scheduledStartTime} – {chunk.scheduledEndTime}
                        </span>
                        <span className="text-slate-500 font-semibold text-[11px]">
                          ({chunk.durationMinutes}m)
                        </span>
                      </div>

                      <h4
                        className={`text-sm sm:text-base font-black mt-1 truncate ${
                          isCompleted ? 'line-through text-slate-400' : 'text-slate-900'
                        }`}
                      >
                        {chunk.chunkLabel}
                      </h4>

                      {assignment && (
                        <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1.5">
                          <span>Due:</span>
                          <strong className="text-slate-700">
                            {new Date(assignment.dueDate).toLocaleDateString('en-US', {
                              weekday: 'short',
                              month: 'short',
                              day: 'numeric',
                            })}
                          </strong>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right: Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    {!isCompleted ? (
                      <>
                        <button
                          onClick={() => onStartFocus(chunk)}
                          className="inline-flex items-center gap-1.5 px-3 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-black rounded-xl transition-all border border-indigo-200"
                        >
                          <Play className="w-3.5 h-3.5 fill-current" />
                          <span className="hidden sm:inline">Timer</span>
                        </button>

                        <button
                          onClick={() => onMarkDelayed(chunk.id)}
                          className="px-2.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold rounded-xl transition-all"
                          title="Reschedule for later"
                        >
                          Later
                        </button>
                      </>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs font-black text-emerald-700 bg-emerald-100 px-3 py-1.5 rounded-xl">
                        <Check className="w-4 h-4 stroke-[3]" /> Done!
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
