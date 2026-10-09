import React from 'react';
import { UserProfile, Course } from '../types/scheduler';
import {
  Calendar,
  CheckCircle2,
  BookOpen,
  Clock,
  Sparkles,
  Plus,
  Palette,
  Flame,
  Volume2,
  VolumeX,
  RotateCcw,
  Download,
  Star,
} from 'lucide-react';

export type DashboardTab = 'today' | 'weekly' | 'assignments';

interface Props {
  activeTab: DashboardTab;
  onTabChange: (tab: DashboardTab) => void;
  user: UserProfile;
  courses: Course[];
  activeAssignmentsCount: number;
  weeklyWorkloadHours: string;
  completionRatePercent: number;
  soundEnabled: boolean;
  onToggleSound: () => void;
  onToggleEngineInsights: () => void;
  onOpenAddAssignment: () => void;
  onOpenCourseManager: () => void;
  onOpenAvailabilityManager: () => void;
  onTriggerRebalance: () => void;
  onResetData: () => void;
  onExportData: () => void;
}

export const Navbar: React.FC<Props> = ({
  activeTab,
  onTabChange,
  user,
  courses,
  activeAssignmentsCount,
  completionRatePercent,
  soundEnabled,
  onToggleSound,
  onOpenAddAssignment,
  onOpenCourseManager,
  onOpenAvailabilityManager,
  onTriggerRebalance,
  onResetData,
  onExportData,
}) => {
  return (
    <header className="bg-white border-b-2 border-indigo-100 sticky top-0 z-30 shadow-xs">
      {/* Top Banner with friendly logo & quick action buttons */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-3">
          {/* Logo & Streak */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center text-white shadow-md shadow-indigo-200 text-xl">
              🎒
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
                  PlanCraft
                </span>
                <span className="inline-flex items-center gap-1 text-[11px] font-black text-amber-600 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
                  <Flame className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                  <span>5d Streak!</span>
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-semibold hidden sm:block">
                Homework & Assignment Scheduler for School & College
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 sm:gap-2.5">
            {/* Sound Toggle */}
            <button
              onClick={onToggleSound}
              className={`p-2 rounded-xl text-xs transition-colors border-2 ${
                soundEnabled
                  ? 'bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100'
                  : 'bg-slate-50 border-slate-200 text-slate-400'
              }`}
              title={soundEnabled ? 'Sound cues: On' : 'Sound cues: Muted'}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4 text-amber-600" /> : <VolumeX className="w-4 h-4" />}
            </button>

            {/* My Classes */}
            <button
              onClick={onOpenCourseManager}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-black text-slate-700 bg-slate-100 hover:bg-purple-50 hover:text-purple-700 rounded-2xl transition-all border border-slate-200"
              title="Manage your subjects and classes"
            >
              <Palette className="w-4 h-4 text-purple-600" />
              <span className="hidden sm:inline">Classes</span>
              <span className="text-[10px] font-mono bg-white px-1.5 py-0.5 rounded-md font-black text-slate-700">
                {courses.length}
              </span>
            </button>

            {/* Study Hours */}
            <button
              onClick={onOpenAvailabilityManager}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-black text-slate-700 bg-slate-100 hover:bg-blue-50 hover:text-blue-700 rounded-2xl transition-all border border-slate-200"
              title="Set your free hours for homework"
            >
              <Clock className="w-4 h-4 text-blue-600" />
              <span className="hidden sm:inline">Free Hours</span>
            </button>

            {/* Auto-Fix Schedule */}
            <button
              onClick={onTriggerRebalance}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-black text-amber-800 bg-amber-50 hover:bg-amber-100 rounded-2xl transition-all border border-amber-200"
              title="Automatically reschedule any missed study blocks"
            >
              <Sparkles className="w-4 h-4 text-amber-600" />
              <span className="hidden md:inline">Auto-Fix</span>
            </button>

            {/* Big Friendly Add Homework Button */}
            <button
              onClick={onOpenAddAssignment}
              className="inline-flex items-center gap-1.5 px-3.5 sm:px-4 py-2 text-xs font-black text-white bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-500 hover:to-pink-500 active:scale-98 rounded-2xl transition-all shadow-md shadow-indigo-200"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Add Homework</span>
            </button>

            {/* Backup / Sample Reset */}
            <div className="hidden sm:flex items-center pl-1 border-l border-slate-200 gap-1">
              <button
                onClick={onExportData}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                title="Save backup JSON"
              >
                <Download className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={onResetData}
                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                title="Reset sample homework"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main 3 Friendly Tabs */}
      <div className="bg-slate-50/90 border-t border-indigo-50 px-4 sm:px-6 lg:px-8 py-2">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <nav className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5">
            <button
              onClick={() => onTabChange('today')}
              className={`inline-flex items-center gap-2 px-4 py-2 text-xs font-black rounded-2xl transition-all shrink-0 ${
                activeTab === 'today'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200'
                  : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              Today's To-Do
            </button>

            <button
              onClick={() => onTabChange('weekly')}
              className={`inline-flex items-center gap-2 px-4 py-2 text-xs font-black rounded-2xl transition-all shrink-0 ${
                activeTab === 'weekly'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200'
                  : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
              }`}
            >
              <Calendar className="w-4 h-4" />
              Weekly Planner
            </button>

            <button
              onClick={() => onTabChange('assignments')}
              className={`inline-flex items-center gap-2 px-4 py-2 text-xs font-black rounded-2xl transition-all shrink-0 ${
                activeTab === 'assignments'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200'
                  : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              All Homework ({activeAssignmentsCount})
            </button>
          </nav>

          <div className="flex items-center gap-3 text-xs font-bold text-slate-600">
            <span className="flex items-center gap-1.5">
              <span>This week's progress:</span>
              <strong className="text-emerald-700 font-black bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200">
                {completionRatePercent}% Done ⭐
              </strong>
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};
