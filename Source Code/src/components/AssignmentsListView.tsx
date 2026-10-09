import React, { useState } from 'react';
import { Assignment, Course, TaskChunk } from '../types/scheduler';
import { CourseIcon } from './CourseIcon';
import {
  BookOpen,
  Calendar,
  Clock,
  CheckCircle2,
  Trash2,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  Plus,
  Filter,
  Search,
  Play,
  Layers,
  Circle,
  Check,
} from 'lucide-react';

interface Props {
  assignments: Assignment[];
  courses: Course[];
  chunks: TaskChunk[];
  onOpenAddAssignment: () => void;
  onDeleteAssignment: (id: string) => void;
  onToggleAssignmentStatus: (id: string) => void;
  onOpenCourseManager: () => void;
  onStartFocus: (chunk: TaskChunk) => void;
}

export const AssignmentsListView: React.FC<Props> = ({
  assignments,
  courses,
  chunks,
  onOpenAddAssignment,
  onDeleteAssignment,
  onToggleAssignmentStatus,
  onOpenCourseManager,
  onStartFocus,
}) => {
  const [selectedCourseFilter, setSelectedCourseFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'completed'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedAssignmentId, setExpandedAssignmentId] = useState<string | null>(null);

  const courseMap = new Map(courses.map((c) => [c.id, c]));

  // Sort assignments by Urgency First (earliest deadline)
  const sorted = [...assignments].sort(
    (a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
  );

  const filtered = sorted.filter((a) => {
    // Course filter
    if (selectedCourseFilter !== 'all' && a.courseId !== selectedCourseFilter) {
      return false;
    }
    // Status filter
    if (statusFilter === 'active' && a.status === 'Completed') return false;
    if (statusFilter === 'completed' && a.status !== 'Completed') return false;
    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = a.title.toLowerCase().includes(q);
      const matchCode = a.courseCode.toLowerCase().includes(q);
      const matchName = a.courseName.toLowerCase().includes(q);
      const matchNotes = (a.notes || '').toLowerCase().includes(q);
      if (!matchTitle && !matchCode && !matchName && !matchNotes) return false;
    }
    return true;
  });

  return (
    <div className="space-y-5">
      {/* Top Header & Search/Filter Box */}
      <div className="bg-white border-2 border-indigo-100 rounded-3xl p-5 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 bg-gradient-to-tr from-purple-500 to-indigo-600 text-white rounded-2xl flex items-center justify-center shadow-md shadow-purple-200">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-900 tracking-tight">
                All Homework & Assignments
              </h2>
              <p className="text-xs text-slate-500 font-semibold">
                Organized by due date so you never miss a deadline
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onOpenCourseManager}
              className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-2xl transition-all border border-slate-200"
            >
              Manage Classes
            </button>

            <button
              onClick={onOpenAddAssignment}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-black rounded-2xl transition-all shadow-md shadow-indigo-200"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Add Homework</span>
            </button>
          </div>
        </div>

        {/* Search & Filter row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-100">
          {/* Search bar */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search homework, subject, notes..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:bg-white"
            />
          </div>

          {/* Status filter buttons */}
          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200 shrink-0">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                statusFilter === 'all' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              All ({assignments.length})
            </button>
            <button
              onClick={() => setStatusFilter('active')}
              className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                statusFilter === 'active' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              To Do ({assignments.filter((a) => a.status !== 'Completed').length})
            </button>
            <button
              onClick={() => setStatusFilter('completed')}
              className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                statusFilter === 'completed'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Done ({assignments.filter((a) => a.status === 'Completed').length})
            </button>
          </div>
        </div>

        {/* Course Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pt-2 border-t border-slate-100">
          <span className="text-xs font-black text-slate-400 mr-1 shrink-0">Class:</span>
          <button
            onClick={() => setSelectedCourseFilter('all')}
            className={`px-3 py-1 text-xs font-black rounded-xl transition-all shrink-0 ${
              selectedCourseFilter === 'all'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All Classes
          </button>
          {courses.map((course) => {
            const isSelected = selectedCourseFilter === course.id;
            return (
              <button
                key={course.id}
                onClick={() => setSelectedCourseFilter(course.id)}
                className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-black rounded-xl transition-all shrink-0 ${
                  isSelected
                    ? 'text-white shadow-sm'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
                style={
                  isSelected
                    ? { backgroundColor: course.color }
                    : { borderLeft: `3px solid ${course.color}` }
                }
              >
                <CourseIcon icon={course.icon} className="w-3.5 h-3.5" />
                <span>{course.code}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Assignment List */}
      {filtered.length === 0 ? (
        <div className="bg-white border-2 border-indigo-100 rounded-3xl p-10 text-center space-y-3">
          <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mx-auto text-2xl">
            📚
          </div>
          <h4 className="text-lg font-black text-slate-900">No Assignments Found</h4>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {searchQuery
              ? 'No homework matches your search query. Try clearing your search.'
              : 'You have no homework in this view. Click below to add an assignment.'}
          </p>
          <button
            onClick={onOpenAddAssignment}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-all inline-flex items-center gap-2 shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Homework</span>
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((assignment) => {
            const course = courseMap.get(assignment.courseId);
            const courseColor = course?.color || assignment.courseColor || '#4f46e5';
            const isCompleted = assignment.status === 'Completed';
            const assignmentChunks = chunks.filter((c) => c.assignmentId === assignment.id);
            const completedChunksCount = assignmentChunks.filter((c) => c.status === 'Completed').length;
            const isExpanded = expandedAssignmentId === assignment.id;

            const dueDate = new Date(assignment.dueDate);
            const now = new Date();
            const daysUntilDue = Math.ceil(
              (dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
            );

            return (
              <div
                key={assignment.id}
                className={`bg-white border-2 rounded-2xl p-4 sm:p-5 transition-all shadow-xs ${
                  isCompleted
                    ? 'border-slate-200 bg-slate-50/70 opacity-75'
                    : 'border-slate-200 hover:border-indigo-300'
                }`}
                style={{
                  borderLeftWidth: '6px',
                  borderLeftColor: courseColor,
                }}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  {/* Left: Checkmark & details */}
                  <div className="flex items-start sm:items-center gap-3.5 flex-1 min-w-0">
                    <button
                      onClick={() => onToggleAssignmentStatus(assignment.id)}
                      className={`p-1 mt-0.5 sm:mt-0 rounded-xl transition-colors ${
                        isCompleted
                          ? 'text-emerald-600'
                          : 'text-slate-300 hover:text-indigo-600'
                      }`}
                      title={isCompleted ? 'Mark not done' : 'Mark done!'}
                    >
                      {isCompleted ? (
                        <CheckCircle2 className="w-6 h-6 fill-emerald-100 stroke-[2.5]" />
                      ) : (
                        <Circle className="w-6 h-6 stroke-[2]" />
                      )}
                    </button>

                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 text-xs">
                        <span
                          className="font-black px-2 py-0.5 rounded-lg flex items-center gap-1 text-white text-[11px] shadow-2xs"
                          style={{ backgroundColor: courseColor }}
                        >
                          <CourseIcon icon={course?.icon} className="w-3 h-3" />
                          <span>{course?.code || assignment.courseCode}</span>
                        </span>

                        <span className="font-bold text-slate-800">
                          {course?.name || assignment.courseName}
                        </span>

                        <span className="text-slate-300">·</span>

                        {/* Due countdown */}
                        <span
                          className={`font-black text-[11px] px-2 py-0.5 rounded-md ${
                            daysUntilDue <= 1 && !isCompleted
                              ? 'bg-rose-100 text-rose-700'
                              : daysUntilDue <= 3 && !isCompleted
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {daysUntilDue <= 0
                            ? 'Due Today!'
                            : daysUntilDue === 1
                            ? 'Due Tomorrow'
                            : `Due in ${daysUntilDue} days`}
                        </span>
                      </div>

                      <h3
                        className={`text-base font-black mt-1.5 ${
                          isCompleted ? 'line-through text-slate-400' : 'text-slate-900'
                        }`}
                      >
                        {assignment.title}
                      </h3>

                      {assignment.notes && (
                        <p className="text-xs text-slate-500 mt-1 italic line-clamp-1">
                          "{assignment.notes}"
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Right: Study blocks info & controls */}
                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                    {/* Chunks count pill */}
                    <button
                      onClick={() =>
                        setExpandedAssignmentId(isExpanded ? null : assignment.id)
                      }
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors"
                      title="View scheduled study sessions"
                    >
                      <Layers className="w-3.5 h-3.5 text-indigo-600" />
                      <span>
                        {completedChunksCount}/{assignmentChunks.length} sessions
                      </span>
                      {isExpanded ? (
                        <ChevronUp className="w-3.5 h-3.5" />
                      ) : (
                        <ChevronDown className="w-3.5 h-3.5" />
                      )}
                    </button>

                    {/* Delete button */}
                    <button
                      onClick={() => onDeleteAssignment(assignment.id)}
                      className="p-2 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                      title="Delete assignment"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Expanded Study Blocks View */}
                {isExpanded && (
                  <div className="mt-4 pt-3 border-t border-slate-100 space-y-2">
                    <div className="text-xs font-black text-slate-700 uppercase tracking-wider">
                      Scheduled Study Sessions for this Assignment:
                    </div>
                    {assignmentChunks.length === 0 ? (
                      <p className="text-xs text-slate-400">No study blocks generated.</p>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {assignmentChunks.map((chunk) => {
                          const isDone = chunk.status === 'Completed';
                          return (
                            <div
                              key={chunk.id}
                              className={`p-2.5 rounded-xl border text-xs flex items-center justify-between gap-2 ${
                                isDone
                                  ? 'bg-slate-50 border-slate-200 text-slate-400'
                                  : 'bg-white border-slate-200 text-slate-800'
                              }`}
                            >
                              <div>
                                <div className="font-bold">{chunk.chunkLabel}</div>
                                <div className="text-[10px] text-slate-500">
                                  {chunk.scheduledDate} at {chunk.scheduledStartTime} ({chunk.durationMinutes}m)
                                </div>
                              </div>

                              {!isDone && (
                                <button
                                  onClick={() => onStartFocus(chunk)}
                                  className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold rounded-lg flex items-center gap-1 text-[11px]"
                                >
                                  <Play className="w-3 h-3 fill-current" />
                                  <span>Timer</span>
                                </button>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
