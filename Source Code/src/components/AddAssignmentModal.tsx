import React, { useState, useEffect, useRef } from 'react';
import {
  Assignment,
  AssignmentCategoryType,
  AvailabilityWindow,
  CategorySpeedLearning,
  Course,
  HardCapCheckResult,
  TaskChunk,
} from '../types/scheduler';
import { CATEGORY_PRESETS, getSmartDurationSuggestion } from '../utils/learningEngine';
import { checkHardCapBoundary } from '../utils/schedulerEngine';
import { CourseIcon } from './CourseIcon';
import {
  Sparkles,
  Calendar,
  Clock,
  BookOpen,
  AlertTriangle,
  X,
  CheckCircle2,
  GraduationCap,
  Plus,
  Layers,
  ArrowUp,
  Smile,
  Zap,
} from 'lucide-react';

interface Props {
  existingAssignments: Assignment[];
  existingChunks: TaskChunk[];
  windows: AvailabilityWindow[];
  courses: Course[];
  learningHistory: Record<AssignmentCategoryType, CategorySpeedLearning>;
  onAddAssignment: (assignment: Assignment) => void;
  onOpenCourseManager: () => void;
  onClose: () => void;
  onHardCapViolation: (result: HardCapCheckResult) => void;
}

export const AddAssignmentModal: React.FC<Props> = ({
  existingAssignments,
  existingChunks,
  windows,
  courses,
  learningHistory,
  onAddAssignment,
  onOpenCourseManager,
  onClose,
  onHardCapViolation,
}) => {
  const [title, setTitle] = useState('');
  const [selectedCourseId, setSelectedCourseId] = useState<string>(
    courses[0]?.id || ''
  );
  const [category, setCategory] = useState<AssignmentCategoryType>('problem_set');

  // Format default deadline 3 days in future at 21:00 (9:00 PM)
  const [dueDateString, setDueDateString] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 3);
    const yyyy = d.getFullYear();
    const mm = (d.getMonth() + 1).toString().padStart(2, '0');
    const dd = d.getDate().toString().padStart(2, '0');
    return `${yyyy}-${mm}-${dd}T21:00`;
  });

  const [durationMinutes, setDurationMinutes] = useState<number>(60);
  const [notes, setNotes] = useState('');

  // Refs for bulletproof mobile scroll to top and focus
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);

  // Update duration suggestion when category changes
  const suggestion = getSmartDurationSuggestion(category, learningHistory);

  useEffect(() => {
    // Smooth reset scroll position to top whenever opened
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 0;
    }
    // Auto-focus title input after mount
    const timer = setTimeout(() => {
      titleInputRef.current?.focus();
    }, 120);
    return () => clearTimeout(timer);
  }, []);

  // Real-time capacity check
  const capacityEvaluation = checkHardCapBoundary(
    {
      title: title || 'New Assignment',
      totalEstimatedMinutes: durationMinutes,
      dueDate: dueDateString,
    },
    existingAssignments,
    existingChunks,
    windows
  );

  const selectedCourse = courses.find((c) => c.id === selectedCourseId) || courses[0];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
      }
      titleInputRef.current?.focus();
      return;
    }

    // Check hard cap boundary
    if (!capacityEvaluation.hasCapacity) {
      onHardCapViolation(capacityEvaluation);
      return;
    }

    const newAssignment: Assignment = {
      id: `asg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      userId: 'usr_alex_chen',
      courseId: selectedCourse?.id || 'course_default',
      title: title.trim(),
      courseCode: selectedCourse ? selectedCourse.code : 'GEN 101',
      courseName: selectedCourse ? selectedCourse.name : 'General Class',
      courseColor: selectedCourse ? selectedCourse.color : '#4f46e5',
      category,
      dueDate: new Date(dueDateString).toISOString(),
      totalEstimatedMinutes: durationMinutes,
      actualMinutesSpent: 0,
      status: 'Pending',
      notes: notes.trim(),
      createdAt: new Date().toISOString(),
    };

    onAddAssignment(newAssignment);
    onClose();
  };

  // Friendly quick-date presets for middle/high school and college students
  const setQuickDueDate = (daysFromNow: number, hour = 21, minute = 0) => {
    const d = new Date();
    d.setDate(d.getDate() + daysFromNow);
    const yyyy = d.getFullYear();
    const mm = (d.getMonth() + 1).toString().padStart(2, '0');
    const dd = d.getDate().toString().padStart(2, '0');
    const hh = hour.toString().padStart(2, '0');
    const min = minute.toString().padStart(2, '0');
    setDueDateString(`${yyyy}-${mm}-${dd}T${hh}:${min}`);
  };

  // Friendly duration presets
  const FRIENDLY_DURATIONS = [
    { label: '30 min', minutes: 30, desc: 'Quick Homework', icon: '⚡' },
    { label: '45 min', minutes: 45, desc: 'Reading & Review', icon: '📖' },
    { label: '1 hour', minutes: 60, desc: 'Standard Assignment', icon: '⏱️' },
    { label: '1.5 hrs', minutes: 90, desc: 'Study & Problems', icon: '📝' },
    { label: '2 hours', minutes: 120, desc: 'Big Project / Paper', icon: '🔬' },
    { label: '3 hours', minutes: 180, desc: 'Deep Study Session', icon: '🎯' },
  ];

  const handleScrollToTop = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
    titleInputRef.current?.focus();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/70 backdrop-blur-xs transition-opacity animate-fade-in">
      {/* Modal Card - Single scroll container inside, sticky header and footer */}
      <div className="bg-white border-t sm:border border-slate-200 w-full max-w-xl rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col max-h-[92dvh] sm:max-h-[88vh] overflow-hidden">
        
        {/* Mobile drag handle for pleasant sheet look */}
        <div className="sm:hidden pt-2.5 pb-1 flex justify-center bg-slate-50 shrink-0">
          <div className="w-12 h-1.5 bg-slate-300 rounded-full" />
        </div>

        {/* Header - Always pinned at top */}
        <div className="px-5 py-3.5 sm:px-6 sm:py-4 border-b border-indigo-100 bg-gradient-to-r from-indigo-50/80 via-purple-50/60 to-pink-50/70 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <span className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-md shadow-indigo-200">
              <BookOpen className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight flex items-center gap-1.5">
                <span>Add Homework</span>
                <span className="text-sm">✨</span>
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                We'll automatically fit it into your free study time
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={handleScrollToTop}
              className="p-2 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-100/60 rounded-xl transition-colors sm:hidden"
              title="Scroll to Name"
            >
              <ArrowUp className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-xl transition-colors"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Form Body - The ONLY scroll container */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden min-h-0">
          <div
            ref={scrollContainerRef}
            className="flex-1 overflow-y-auto overscroll-contain p-4 sm:p-6 space-y-4 text-slate-800"
          >
            {/* Step 1: Title */}
            <div>
              <label
                htmlFor="assignment-title-input"
                className="block text-xs font-black text-slate-800 uppercase tracking-wider mb-1.5 flex items-center justify-between"
              >
                <span>Assignment Name *</span>
                <span className="text-[11px] font-normal text-slate-400">e.g. Math Quiz Prep, Science Worksheet</span>
              </label>
              <input
                id="assignment-title-input"
                ref={titleInputRef}
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="What homework do you need to do?"
                className="w-full px-4 py-3 bg-indigo-50/40 border-2 border-indigo-200 hover:border-indigo-400 focus:border-indigo-600 rounded-2xl text-base font-bold text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:bg-white shadow-xs transition-all"
              />
            </div>

            {/* Step 2: Course / Subject Selection */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <GraduationCap className="w-4 h-4 text-indigo-600" />
                  <span>Class / Subject *</span>
                </label>
                <button
                  type="button"
                  onClick={onOpenCourseManager}
                  className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 bg-indigo-50 px-2.5 py-1 rounded-lg hover:bg-indigo-100 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Customize Classes</span>
                </button>
              </div>

              {/* Colorful course pill selector */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-2">
                {courses.map((course) => {
                  const isSelected = selectedCourseId === course.id;
                  return (
                    <button
                      type="button"
                      key={course.id}
                      onClick={() => setSelectedCourseId(course.id)}
                      className={`p-2.5 rounded-2xl border-2 text-left transition-all flex items-center gap-2 ${
                        isSelected
                          ? 'border-indigo-600 bg-indigo-50/80 shadow-xs ring-2 ring-indigo-600/30'
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      <span
                        className="w-4 h-4 rounded-full shrink-0 shadow-xs border border-white"
                        style={{ backgroundColor: course.color }}
                      />
                      <div className="truncate">
                        <div className="text-xs font-black truncate text-slate-900">{course.code}</div>
                        <div className="text-[10px] text-slate-500 truncate">{course.name}</div>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Dropdown backup */}
              <div className="relative">
                <select
                  required
                  value={selectedCourseId}
                  onChange={(e) => setSelectedCourseId(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                >
                  {courses.map((course) => (
                    <option key={course.id} value={course.id}>
                      {course.code} – {course.name}
                    </option>
                  ))}
                </select>
                <div
                  className="absolute left-3.5 top-2.5 w-3.5 h-3.5 rounded-full border border-white shadow-xs pointer-events-none"
                  style={{ backgroundColor: selectedCourse?.color || '#6366f1' }}
                />
              </div>
            </div>

            {/* Step 3: When is it due? */}
            <div className="bg-slate-50/80 border-2 border-slate-200/80 rounded-2xl p-3.5 space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-pink-600" />
                  <span>When is it due? *</span>
                </label>
                <span className="text-[11px] font-bold text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded-md">
                  {new Date(dueDateString).toLocaleDateString('en-US', {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                  })}{' '}
                  at {new Date(dueDateString).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                </span>
              </div>

              {/* Friendly quick date buttons */}
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
                <button
                  type="button"
                  onClick={() => setQuickDueDate(1, 21, 0)}
                  className="px-2.5 py-1.5 bg-white border border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/50 rounded-xl text-xs font-bold text-slate-700 transition-colors shrink-0"
                >
                  Tomorrow
                </button>
                <button
                  type="button"
                  onClick={() => setQuickDueDate(2, 21, 0)}
                  className="px-2.5 py-1.5 bg-white border border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/50 rounded-xl text-xs font-bold text-slate-700 transition-colors shrink-0"
                >
                  In 2 Days
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const now = new Date();
                    const day = now.getDay();
                    const diff = (5 - day + 7) % 7 || 7;
                    setQuickDueDate(diff, 21, 0);
                  }}
                  className="px-2.5 py-1.5 bg-white border border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/50 rounded-xl text-xs font-bold text-slate-700 transition-colors shrink-0"
                >
                  This Friday
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const now = new Date();
                    const day = now.getDay();
                    const diff = (8 - day + 7) % 7 || 7;
                    setQuickDueDate(diff, 21, 0);
                  }}
                  className="px-2.5 py-1.5 bg-white border border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/50 rounded-xl text-xs font-bold text-slate-700 transition-colors shrink-0"
                >
                  Next Monday
                </button>
              </div>

              {/* Exact Datetime Input */}
              <input
                type="datetime-local"
                required
                value={dueDateString}
                onChange={(e) => setDueDateString(e.target.value)}
                className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Step 4: Estimated Time to Complete */}
            <div className="bg-slate-50/80 border-2 border-slate-200/80 rounded-2xl p-3.5 space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-amber-600" />
                  <span>How long will it take? *</span>
                </label>
                <span className="text-xs font-black text-indigo-700 bg-indigo-100 px-2.5 py-0.5 rounded-full font-mono">
                  {durationMinutes < 60
                    ? `${durationMinutes} minutes`
                    : `${(durationMinutes / 60).toFixed(1)} hours (${durationMinutes}m)`}
                </span>
              </div>

              {/* Friendly duration tiles */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {FRIENDLY_DURATIONS.map((preset) => {
                  const isSelected = durationMinutes === preset.minutes;
                  return (
                    <button
                      type="button"
                      key={preset.minutes}
                      onClick={() => setDurationMinutes(preset.minutes)}
                      className={`p-2 rounded-xl border text-left transition-all flex items-center gap-2 ${
                        isSelected
                          ? 'border-indigo-600 bg-indigo-600 text-white shadow-sm'
                          : 'border-slate-200 bg-white hover:border-slate-300 text-slate-800'
                      }`}
                    >
                      <span className="text-base">{preset.icon}</span>
                      <div className="min-w-0">
                        <div className={`text-xs font-bold ${isSelected ? 'text-white' : 'text-slate-900'}`}>
                          {preset.label}
                        </div>
                        <div
                          className={`text-[10px] truncate ${
                            isSelected ? 'text-indigo-100' : 'text-slate-500'
                          }`}
                        >
                          {preset.desc}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Fine-tune Slider */}
              <div className="pt-1">
                <input
                  type="range"
                  min="15"
                  max="360"
                  step="15"
                  value={durationMinutes}
                  onChange={(e) => setDurationMinutes(Number(e.target.value))}
                  className="w-full accent-indigo-600 cursor-pointer h-2 bg-slate-200 rounded-lg"
                />
              </div>
            </div>

            {/* Step 5: Capacity Check Feedback */}
            <div
              className={`p-3.5 rounded-2xl border-2 text-xs flex items-start gap-2.5 shadow-xs ${
                capacityEvaluation.hasCapacity
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                  : 'bg-rose-50 border-rose-300 text-rose-900'
              }`}
            >
              {capacityEvaluation.hasCapacity ? (
                <>
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-black text-emerald-950">You have plenty of study time! 👍 </span>
                    <p className="mt-0.5 text-emerald-800">
                      You have <strong>{(capacityEvaluation.availableMinutes / 60).toFixed(1)} hours</strong> of free study
                      windows before this is due. PlanCraft will automatically schedule it for you.
                    </p>
                    {durationMinutes > 120 && (
                      <div className="font-bold text-indigo-700 mt-1.5 flex items-center gap-1.5 bg-white/70 px-2.5 py-1 rounded-lg border border-indigo-200">
                        <Layers className="w-3.5 h-3.5" />
                        <span>Since this is over 2 hours, we'll split it into manageable bite-sized sessions!</span>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-black text-rose-950">Schedule Notice: Low Free Time ⚠️ </span>
                    <p className="mt-0.5 text-rose-800">
                      You need about <strong>{(capacityEvaluation.deficitMinutes / 60).toFixed(1)} more hours</strong> of study
                      time before this due date. Submitting will help you add open study hours or adjust your schedule.
                    </p>
                  </div>
                </>
              )}
            </div>

            {/* Step 6: Notes (Optional) */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Notes or Page Numbers (Optional)
              </label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Problems #1-15 on Page 84, bring colored pencils..."
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:bg-white resize-none"
              />
            </div>
          </div>

          {/* Sticky Footer */}
          <div className="px-4 py-3 sm:px-6 sm:py-3.5 bg-slate-50/95 border-t border-slate-200 flex items-center justify-between gap-3 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 rounded-xl hover:bg-slate-200/60 transition-colors"
            >
              Cancel
            </button>

            <button
              type="submit"
              className={`px-6 py-3 rounded-2xl text-xs sm:text-sm font-black text-white shadow-md active:scale-98 transition-all flex items-center gap-2 ${
                capacityEvaluation.hasCapacity
                  ? 'bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 hover:from-indigo-500 hover:to-purple-500 shadow-indigo-200'
                  : 'bg-rose-600 hover:bg-rose-700 shadow-rose-200'
              }`}
            >
              <span>{capacityEvaluation.hasCapacity ? 'Save & Schedule Homework' : 'Fix Schedule & Save'}</span>
              <span>🚀</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
