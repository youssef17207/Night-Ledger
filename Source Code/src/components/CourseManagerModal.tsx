import React, { useState, useRef, useEffect } from 'react';
import { Course, Assignment } from '../types/scheduler';
import { COURSE_PALETTES } from '../utils/learningEngine';
import { CourseIcon, COURSE_ICON_OPTIONS } from './CourseIcon';
import {
  GraduationCap,
  Plus,
  Trash2,
  Edit2,
  Check,
  X,
  Palette,
  BookOpen,
  Sparkles,
  ArrowUp,
} from 'lucide-react';

interface Props {
  courses: Course[];
  assignments: Assignment[];
  onSaveCourses: (updatedCourses: Course[]) => void;
  onClose: () => void;
}

// Quick school presets for middle, high school, and college
const SCHOOL_SUBJECT_PRESETS = [
  { code: 'MATH', name: 'Mathematics / Algebra', color: '#2563eb', icon: 'calculator' },
  { code: 'SCI', name: 'Science & Biology', color: '#059669', icon: 'microscope' },
  { code: 'ENG', name: 'English & Literature', color: '#e11d48', icon: 'book' },
  { code: 'HIST', name: 'History & Social Studies', color: '#d97706', icon: 'globe' },
  { code: 'ART', name: 'Art, Music & Creative', color: '#7c3aed', icon: 'pen' },
  { code: 'CS', name: 'Computer Science & Tech', color: '#0891b2', icon: 'code' },
  { code: 'LANG', name: 'World Language', color: '#0284c7', icon: 'globe' },
  { code: 'PE', name: 'PE & Health', color: '#ea580c', icon: 'atom' },
];

export const CourseManagerModal: React.FC<Props> = ({
  courses,
  assignments,
  onSaveCourses,
  onClose,
}) => {
  const [courseList, setCourseList] = useState<Course[]>(courses);
  const [editingCourseId, setEditingCourseId] = useState<string | null>(null);

  // Form states
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [color, setColor] = useState(COURSE_PALETTES[0].hex);
  const [icon, setIcon] = useState('book');
  const [instructor, setInstructor] = useState('');
  const [credits, setCredits] = useState<number>(3);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [deleteWarningId, setDeleteWarningId] = useState<string | null>(null);

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const formTopRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 0;
    }
  }, []);

  const startEdit = (c: Course) => {
    setEditingCourseId(c.id);
    setCode(c.code);
    setName(c.name);
    setColor(c.color);
    setIcon(c.icon || 'book');
    setInstructor(c.instructor || '');
    setCredits(c.credits || 3);
    setIsAddingNew(false);
    setTimeout(() => {
      formTopRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 50);
  };

  const startAdd = () => {
    const usedColors = new Set(courseList.map((c) => c.color.toLowerCase()));
    const availablePalette = COURSE_PALETTES.find((p) => !usedColors.has(p.hex.toLowerCase()));
    setColor(availablePalette ? availablePalette.hex : COURSE_PALETTES[0].hex);

    setEditingCourseId(null);
    setCode('');
    setName('');
    setIcon('book');
    setInstructor('');
    setCredits(3);
    setIsAddingNew(true);
    setTimeout(() => {
      formTopRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 50);
  };

  const applyPreset = (preset: typeof SCHOOL_SUBJECT_PRESETS[0]) => {
    setCode(preset.code);
    setName(preset.name);
    setColor(preset.color);
    setIcon(preset.icon);
    setIsAddingNew(true);
    setEditingCourseId(null);
    setTimeout(() => {
      formTopRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 50);
  };

  const cancelForm = () => {
    setIsAddingNew(false);
    setEditingCourseId(null);
  };

  const handleSaveCourse = (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim() || !name.trim()) return;

    if (isAddingNew) {
      const newCourse: Course = {
        id: `course_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        code: code.trim().toUpperCase(),
        name: name.trim(),
        color,
        icon,
        instructor: instructor.trim() || undefined,
        credits: credits > 0 ? credits : 3,
        createdAt: new Date().toISOString(),
      };
      const updated = [...courseList, newCourse];
      setCourseList(updated);
      onSaveCourses(updated);
      setIsAddingNew(false);
    } else if (editingCourseId) {
      const updated = courseList.map((c) => {
        if (c.id === editingCourseId) {
          return {
            ...c,
            code: code.trim().toUpperCase(),
            name: name.trim(),
            color,
            icon,
            instructor: instructor.trim() || undefined,
            credits: credits > 0 ? credits : 3,
          };
        }
        return c;
      });
      setCourseList(updated);
      onSaveCourses(updated);
      setEditingCourseId(null);
    }
  };

  const handleDeleteCourse = (courseId: string) => {
    const updated = courseList.filter((c) => c.id !== courseId);
    setCourseList(updated);
    onSaveCourses(updated);
    setDeleteWarningId(null);
    if (editingCourseId === courseId) {
      setEditingCourseId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/70 backdrop-blur-xs transition-opacity animate-fade-in overflow-hidden">
      <div className="bg-white border-t sm:border border-slate-200 w-full max-w-2xl rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col max-h-[92dvh] sm:max-h-[88vh] overflow-hidden">
        {/* Mobile drag handle */}
        <div className="sm:hidden pt-2.5 pb-1 flex justify-center bg-slate-50 shrink-0">
          <div className="w-12 h-1.5 bg-slate-300 rounded-full" />
        </div>

        {/* Header - Fixed at top */}
        <div className="px-5 py-3.5 sm:px-6 sm:py-4 border-b border-indigo-100 bg-gradient-to-r from-purple-50 via-indigo-50 to-pink-50 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <span className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-500 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-purple-200">
              <GraduationCap className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                My Classes & Subjects 🎨
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                Choose a fun color for each class to see on your calendar
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content - Single scroll container */}
        <div
          ref={scrollContainerRef}
          className="flex-1 overflow-y-auto overscroll-contain p-4 sm:p-6 space-y-5 text-slate-800"
        >
          {/* Quick presets for adding standard subjects */}
          {!isAddingNew && !editingCourseId && (
            <div className="bg-gradient-to-br from-indigo-50/50 to-purple-50/50 p-4 rounded-2xl border-2 border-indigo-100 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-indigo-950 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Quick Add Popular School Subjects:</span>
                </span>
                <button
                  type="button"
                  onClick={startAdd}
                  className="text-xs font-black text-indigo-600 hover:text-indigo-800 bg-white px-2.5 py-1 rounded-lg border border-indigo-200 shadow-2xs hover:bg-indigo-50 transition-colors flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Custom Class</span>
                </button>
              </div>

              <div className="flex flex-wrap gap-1.5">
                {SCHOOL_SUBJECT_PRESETS.map((preset) => {
                  const alreadyExists = courseList.some(
                    (c) => c.code.toUpperCase() === preset.code
                  );
                  return (
                    <button
                      key={preset.code}
                      type="button"
                      disabled={alreadyExists}
                      onClick={() => applyPreset(preset)}
                      className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border shadow-2xs ${
                        alreadyExists
                          ? 'bg-slate-100 text-slate-400 border-slate-200 opacity-60 cursor-not-allowed'
                          : 'bg-white hover:bg-indigo-50 text-slate-800 border-slate-200 hover:border-indigo-300'
                      }`}
                    >
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: preset.color }}
                      />
                      <span>{preset.name}</span>
                      {!alreadyExists && <Plus className="w-3 h-3 text-indigo-600 ml-0.5" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Form for Create / Edit */}
          {(isAddingNew || editingCourseId) && (
            <div ref={formTopRef}>
              <form
                onSubmit={handleSaveCourse}
                className="p-4 sm:p-5 bg-indigo-50/40 border-2 border-indigo-300 rounded-3xl space-y-4 shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-black text-indigo-950 uppercase tracking-wider flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-indigo-600" />
                    <span>{isAddingNew ? 'Create New Class' : 'Edit Class Details'}</span>
                  </h3>
                  <button
                    type="button"
                    onClick={cancelForm}
                    className="text-slate-400 hover:text-slate-600 p-1"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Live Preview Pill */}
                <div className="p-3 bg-white border border-slate-200 rounded-2xl flex items-center justify-between">
                  <span className="text-[11px] font-black text-slate-400 uppercase">Preview:</span>
                  <div className="flex items-center gap-2">
                    <span
                      className="font-mono text-xs font-black px-3 py-1 rounded-xl flex items-center gap-1.5 text-white shadow-xs"
                      style={{ backgroundColor: color }}
                    >
                      <CourseIcon icon={icon} className="w-3.5 h-3.5" />
                      <span>{code || 'CLASS'}</span>
                    </span>
                    <span className="text-xs font-black text-slate-800">
                      {name || 'Subject Name'}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                      Short Code *
                    </label>
                    <input
                      type="text"
                      required
                      value={code}
                      onChange={(e) => setCode(e.target.value)}
                      placeholder="e.g. MATH, ENG 9"
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-mono font-bold uppercase focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                      Class Title *
                    </label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Geometry, Biology, US History"
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                    />
                  </div>
                </div>

                {/* Subject Icon Selector */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                    Subject Icon
                  </label>
                  <div className="grid grid-cols-5 sm:grid-cols-10 gap-1.5">
                    {COURSE_ICON_OPTIONS.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setIcon(item.id)}
                        className={`p-2 rounded-xl border flex items-center justify-center transition-all ${
                          icon === item.id
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs scale-105'
                            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                        }`}
                        title={item.label}
                      >
                        <item.Icon className="w-4 h-4" />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Color Palette */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5 flex items-center gap-1.5">
                    <Palette className="w-3.5 h-3.5 text-purple-600" />
                    <span>Calendar Color *</span>
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {COURSE_PALETTES.map((palette) => (
                      <button
                        key={palette.hex}
                        type="button"
                        onClick={() => setColor(palette.hex)}
                        className={`w-7 h-7 rounded-full transition-transform border-2 ${
                          color.toLowerCase() === palette.hex.toLowerCase()
                            ? 'scale-125 border-slate-900 shadow-md ring-2 ring-indigo-400'
                            : 'border-white hover:scale-110 shadow-xs'
                        }`}
                        style={{ backgroundColor: palette.hex }}
                        title={palette.name}
                      />
                    ))}
                  </div>
                </div>

                {/* Save button */}
                <div className="flex items-center justify-end gap-2 pt-2 border-t border-indigo-200">
                  <button
                    type="button"
                    onClick={cancelForm}
                    className="px-3.5 py-1.5 text-xs font-bold text-slate-600 hover:text-slate-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black rounded-xl transition-all shadow-xs"
                  >
                    {isAddingNew ? 'Create Class' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Current Classes List */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-slate-700 uppercase tracking-wider">
                Your Classes ({courseList.length})
              </span>
              {!isAddingNew && !editingCourseId && (
                <button
                  type="button"
                  onClick={startAdd}
                  className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Another Class</span>
                </button>
              )}
            </div>

            <div className="space-y-2">
              {courseList.map((course) => {
                const linkedCount = assignments.filter((a) => a.courseId === course.id).length;
                return (
                  <div
                    key={course.id}
                    className="p-3 bg-white border-2 border-slate-200 hover:border-slate-300 rounded-2xl flex items-center justify-between gap-3 shadow-xs transition-all"
                    style={{
                      borderLeftWidth: '6px',
                      borderLeftColor: course.color,
                    }}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span
                        className="w-8 h-8 rounded-xl flex items-center justify-center text-white shrink-0 shadow-2xs font-mono font-bold"
                        style={{ backgroundColor: course.color }}
                      >
                        <CourseIcon icon={course.icon} className="w-4 h-4" />
                      </span>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-black text-slate-900">{course.code}</span>
                          <span className="text-xs font-bold text-slate-700 truncate">{course.name}</span>
                        </div>
                        <div className="text-[10px] text-slate-500 font-semibold mt-0.5">
                          {linkedCount} {linkedCount === 1 ? 'assignment' : 'assignments'} linked
                          {course.instructor && ` · ${course.instructor}`}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => startEdit(course)}
                        className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                        title="Edit Class"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>

                      {deleteWarningId === course.id ? (
                        <div className="flex items-center gap-1 bg-rose-50 p-1 rounded-xl border border-rose-200">
                          <span className="text-[10px] font-bold text-rose-700 px-1">Delete?</span>
                          <button
                            type="button"
                            onClick={() => handleDeleteCourse(course.id)}
                            className="p-1 bg-rose-600 text-white rounded-md text-[10px] font-bold"
                          >
                            Yes
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteWarningId(null)}
                            className="p-1 text-slate-600 hover:bg-slate-200 rounded-md text-[10px]"
                          >
                            No
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setDeleteWarningId(course.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          title="Delete Class"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-black rounded-xl transition-all shadow-xs"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
