import React, { useState, useRef, useEffect } from 'react';
import { AvailabilityWindow } from '../types/scheduler';
import { timeToMinutes } from '../utils/schedulerEngine';
import { Clock, Plus, Trash2, Calendar, Sparkles, X, Check, ArrowUp } from 'lucide-react';

interface Props {
  windows: AvailabilityWindow[];
  onSaveWindows: (windows: AvailabilityWindow[]) => void;
  onClose: () => void;
}

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const DAY_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export const AvailabilityManagerModal: React.FC<Props> = ({
  windows: initialWindows,
  onSaveWindows,
  onClose,
}) => {
  const [windows, setWindows] = useState<AvailabilityWindow[]>(initialWindows);
  const [selectedDay, setSelectedDay] = useState<number>(1); // Monday default
  const [newStart, setNewStart] = useState('15:30');
  const [newEnd, setNewEnd] = useState('18:00');
  const [newLabel, setNewLabel] = useState('After-School Study');

  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 0;
    }
  }, []);

  // Compute total weekly capacity
  const totalWeeklyMinutes = windows.reduce((sum, w) => {
    return sum + Math.max(0, timeToMinutes(w.endTime) - timeToMinutes(w.startTime));
  }, 0);
  const totalWeeklyHours = (totalWeeklyMinutes / 60).toFixed(1);

  const handleAddWindow = (e: React.FormEvent) => {
    e.preventDefault();
    if (timeToMinutes(newEnd) <= timeToMinutes(newStart)) {
      alert('End time must be later than start time.');
      return;
    }

    const newWin: AvailabilityWindow = {
      id: `w_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      dayOfWeek: selectedDay,
      startTime: newStart,
      endTime: newEnd,
      label: newLabel.trim() || 'Study Window',
    };

    const updated = [...windows, newWin];
    setWindows(updated);
    setNewLabel('Study Time');
  };

  const handleRemoveWindow = (id: string) => {
    setWindows(windows.filter((w) => w.id !== id));
  };

  const handleApplyPreset = (presetName: 'school' | 'evening' | 'weekend') => {
    if (presetName === 'school') {
      // After-school routine (3:30 - 6:00 PM weekdays + weekend morning)
      setWindows([
        { id: 'w1', dayOfWeek: 1, startTime: '15:30', endTime: '18:00', label: 'After-School Homework' },
        { id: 'w2', dayOfWeek: 2, startTime: '15:30', endTime: '18:00', label: 'After-School Homework' },
        { id: 'w3', dayOfWeek: 3, startTime: '15:30', endTime: '18:00', label: 'After-School Homework' },
        { id: 'w4', dayOfWeek: 4, startTime: '15:30', endTime: '18:00', label: 'After-School Homework' },
        { id: 'w5', dayOfWeek: 5, startTime: '15:00', endTime: '17:30', label: 'Friday Homework' },
        { id: 'w6', dayOfWeek: 6, startTime: '10:00', endTime: '13:00', label: 'Saturday Review' },
        { id: 'w7', dayOfWeek: 0, startTime: '14:00', endTime: '17:00', label: 'Sunday Week Prep' },
      ]);
    } else if (presetName === 'evening') {
      // Evening routine (7:00 - 9:30 PM)
      setWindows([
        { id: 'w1', dayOfWeek: 1, startTime: '19:00', endTime: '21:30', label: 'Evening Study' },
        { id: 'w2', dayOfWeek: 2, startTime: '19:00', endTime: '21:30', label: 'Evening Study' },
        { id: 'w3', dayOfWeek: 3, startTime: '19:00', endTime: '21:30', label: 'Evening Study' },
        { id: 'w4', dayOfWeek: 4, startTime: '19:00', endTime: '21:30', label: 'Evening Study' },
        { id: 'w5', dayOfWeek: 0, startTime: '18:30', endTime: '21:30', label: 'Sunday Night Prep' },
      ]);
    } else if (presetName === 'weekend') {
      // Balanced College & High School Schedule
      setWindows([
        { id: 'w1', dayOfWeek: 1, startTime: '14:00', endTime: '17:30', label: 'Mon Afternoon Block' },
        { id: 'w2', dayOfWeek: 2, startTime: '15:00', endTime: '18:30', label: 'Tue Study Block' },
        { id: 'w3', dayOfWeek: 3, startTime: '14:00', endTime: '18:00', label: 'Wed Focus Block' },
        { id: 'w4', dayOfWeek: 4, startTime: '14:30', endTime: '18:00', label: 'Thu Review' },
        { id: 'w5', dayOfWeek: 5, startTime: '13:30', endTime: '16:30', label: 'Fri Wind Down' },
        { id: 'w6', dayOfWeek: 6, startTime: '10:00', endTime: '14:00', label: 'Sat Weekend Deep Study' },
        { id: 'w7', dayOfWeek: 0, startTime: '14:00', endTime: '18:00', label: 'Sun Prep' },
      ]);
    }
  };

  const handleSaveAndClose = () => {
    onSaveWindows(windows);
    onClose();
  };

  const dayWindows = windows
    .filter((w) => w.dayOfWeek === selectedDay)
    .sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime));

  const dayMinutes = dayWindows.reduce((sum, w) => {
    return sum + (timeToMinutes(w.endTime) - timeToMinutes(w.startTime));
  }, 0);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/70 backdrop-blur-xs transition-opacity animate-fade-in overflow-hidden">
      <div className="bg-white border-t sm:border border-slate-200 w-full max-w-2xl rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col max-h-[92dvh] sm:max-h-[88vh] overflow-hidden">
        {/* Mobile drag handle */}
        <div className="sm:hidden pt-2.5 pb-1 flex justify-center bg-slate-50 shrink-0">
          <div className="w-12 h-1.5 bg-slate-300 rounded-full" />
        </div>

        {/* Header - Fixed */}
        <div className="px-5 py-3.5 sm:px-6 sm:py-4 border-b border-indigo-100 bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <span className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-blue-200">
              <Clock className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                My Free Study Hours ⏰
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                Set when you're free so homework gets scheduled at the right time
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
          {/* Capacity banner with presets */}
          <div className="bg-indigo-50/50 border-2 border-indigo-100 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="text-[11px] font-black text-indigo-900 uppercase tracking-wider">
                Total Study Free Time:
              </span>
              <div className="text-2xl font-black text-indigo-700 font-mono mt-0.5">
                {totalWeeklyHours} <span className="text-xs font-semibold text-slate-500">hours / week</span>
              </div>
            </div>

            {/* Routine Presets */}
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-xs font-bold text-slate-500 mr-1">Quick Routine:</span>
              <button
                type="button"
                onClick={() => handleApplyPreset('school')}
                className="px-2.5 py-1 text-xs font-bold bg-white hover:bg-indigo-100 text-indigo-800 border border-indigo-200 rounded-xl transition-all shadow-2xs"
              >
                🎒 After School
              </button>
              <button
                type="button"
                onClick={() => handleApplyPreset('evening')}
                className="px-2.5 py-1 text-xs font-bold bg-white hover:bg-indigo-100 text-indigo-800 border border-indigo-200 rounded-xl transition-all shadow-2xs"
              >
                🌙 Evening Focus
              </button>
              <button
                type="button"
                onClick={() => handleApplyPreset('weekend')}
                className="px-2.5 py-1 text-xs font-bold bg-white hover:bg-indigo-100 text-indigo-800 border border-indigo-200 rounded-xl transition-all shadow-2xs"
              >
                📚 Full Week
              </button>
            </div>
          </div>

          {/* Day Selection Tabs */}
          <div>
            <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-2">
              Select Day of Week
            </label>
            <div className="grid grid-cols-7 gap-1.5">
              {DAY_SHORT.map((shortName, index) => {
                const isSelected = selectedDay === index;
                const count = windows.filter((w) => w.dayOfWeek === index).length;
                return (
                  <button
                    key={index}
                    type="button"
                    onClick={() => setSelectedDay(index)}
                    className={`py-2 px-1 text-center rounded-2xl border-2 transition-all ${
                      isSelected
                        ? 'border-indigo-600 bg-indigo-600 text-white shadow-sm'
                        : 'border-slate-200 bg-slate-50 hover:bg-white text-slate-700'
                    }`}
                  >
                    <div className="text-xs font-black">{shortName}</div>
                    <div
                      className={`text-[10px] mt-0.5 font-bold ${
                        isSelected ? 'text-indigo-200' : 'text-slate-400'
                      }`}
                    >
                      {count} slots
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Active Day Overview & Add Slot */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-slate-800 uppercase tracking-wider">
                {DAY_NAMES[selectedDay]} Study Windows:
              </span>
              <span className="text-xs font-bold text-indigo-700 font-mono bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-200">
                {(dayMinutes / 60).toFixed(1)} hrs scheduled
              </span>
            </div>

            {dayWindows.length === 0 ? (
              <div className="p-5 text-center bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl text-xs text-slate-500">
                No study times set for {DAY_NAMES[selectedDay]}. Add one below!
              </div>
            ) : (
              <div className="space-y-2">
                {dayWindows.map((win) => {
                  const duration = timeToMinutes(win.endTime) - timeToMinutes(win.startTime);
                  return (
                    <div
                      key={win.id}
                      className="p-3 bg-white border-2 border-slate-200 rounded-2xl flex items-center justify-between gap-3 shadow-xs"
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs">
                          {duration}m
                        </span>
                        <div>
                          <div className="text-xs font-black text-slate-900">{win.label}</div>
                          <div className="text-[11px] font-mono font-bold text-indigo-700">
                            {win.startTime} – {win.endTime} ({(duration / 60).toFixed(1)} hrs)
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRemoveWindow(win.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                        title="Delete slot"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Add New Study Slot Form */}
            <form
              onSubmit={handleAddWindow}
              className="p-4 bg-slate-50/80 border-2 border-slate-200 rounded-2xl space-y-3"
            >
              <span className="text-xs font-black text-slate-800 uppercase tracking-wider block">
                + Add Study Time to {DAY_NAMES[selectedDay]}
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                    Start Time
                  </label>
                  <input
                    type="time"
                    required
                    value={newStart}
                    onChange={(e) => setNewStart(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                    End Time
                  </label>
                  <input
                    type="time"
                    required
                    value={newEnd}
                    onChange={(e) => setNewEnd(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                    Slot Name
                  </label>
                  <input
                    type="text"
                    value={newLabel}
                    onChange={(e) => setNewLabel(e.target.value)}
                    placeholder="e.g. Math Prep, Evening Review"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-900"
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black rounded-xl transition-all shadow-xs flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Free Slot</span>
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSaveAndClose}
            className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black rounded-xl transition-all shadow-md shadow-indigo-200"
          >
            Save Free Hours & Re-Plan
          </button>
        </div>
      </div>
    </div>
  );
};
