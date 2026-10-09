import React, { useRef, useEffect } from 'react';
import { HardCapCheckResult } from '../types/scheduler';
import { AlertCircle, ArrowRight, Clock, PlusCircle, Scissors, Calendar, X, Sparkles } from 'lucide-react';

interface Props {
  hardCapResult: HardCapCheckResult;
  onApplyRecommendation: (action: {
    type: 'extend_window' | 'reduce_duration' | 'split_further';
    suggestedMinutes?: number;
    targetDayOfWeek?: number;
  }) => void;
  onOpenAvailabilityManager: () => void;
  onClose: () => void;
}

export const HardCapAlertModal: React.FC<Props> = ({
  hardCapResult,
  onApplyRecommendation,
  onOpenAvailabilityManager,
  onClose,
}) => {
  const reqHours = (hardCapResult.requiredMinutes / 60).toFixed(1);
  const availHours = (hardCapResult.availableMinutes / 60).toFixed(1);
  const deficitHours = (hardCapResult.deficitMinutes / 60).toFixed(1);

  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 0;
    }
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/70 backdrop-blur-xs transition-opacity animate-fade-in overflow-hidden">
      <div className="bg-white border-t sm:border border-amber-300 w-full max-w-lg rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col max-h-[92dvh] sm:max-h-[88vh] overflow-hidden">
        {/* Mobile drag handle */}
        <div className="sm:hidden pt-2.5 pb-1 flex justify-center bg-amber-50 shrink-0">
          <div className="w-12 h-1.5 bg-amber-200 rounded-full" />
        </div>

        {/* Top Header */}
        <div className="bg-amber-50/90 border-b border-amber-200 px-5 py-4 sm:px-6 sm:py-5 flex items-start gap-3.5 shrink-0">
          <div className="w-10 h-10 bg-amber-100 text-amber-700 rounded-2xl flex items-center justify-center shrink-0 shadow-xs">
            <Clock className="w-5 h-5 text-amber-600" />
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black uppercase tracking-wider text-amber-800 bg-amber-100/80 px-2 py-0.5 rounded-full">
                Schedule Check ⏳
              </span>
              <button
                onClick={onClose}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-md"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <h2 className="text-base sm:text-lg font-black text-slate-900 mt-1">
              Need a Little More Study Time!
            </h2>
            <p className="text-xs text-slate-600 font-medium mt-0.5">
              You have {reqHours} hours of homework, but only {availHours} hours of free study slots before this deadline.
            </p>
          </div>
        </div>

        {/* Workload Breakdown */}
        <div
          ref={scrollContainerRef}
          className="flex-1 overflow-y-auto overscroll-contain p-4 sm:p-6 space-y-4 text-slate-800"
        >
          <div className="bg-slate-50 border-2 border-slate-200 rounded-2xl p-4 space-y-3">
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Homework: <span className="text-slate-900 font-black">{hardCapResult.assignmentTitle}</span>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="bg-white border border-slate-200 rounded-xl p-2.5 shadow-2xs">
                <div className="text-[10px] text-slate-500 font-bold uppercase">Work Needed</div>
                <div className="text-base font-black text-slate-900 font-mono mt-0.5">{reqHours}h</div>
                <div className="text-[10px] text-slate-400 font-medium">{hardCapResult.requiredMinutes} min</div>
              </div>
              <div className="bg-white border border-slate-200 rounded-xl p-2.5 shadow-2xs">
                <div className="text-[10px] text-slate-500 font-bold uppercase">Free Time</div>
                <div className="text-base font-black text-emerald-700 font-mono mt-0.5">{availHours}h</div>
                <div className="text-[10px] text-slate-400 font-medium">{hardCapResult.availableMinutes} min</div>
              </div>
              <div className="bg-amber-100/70 border border-amber-300 rounded-xl p-2.5 shadow-2xs">
                <div className="text-[10px] text-amber-800 font-bold uppercase">Extra Needed</div>
                <div className="text-base font-black text-amber-900 font-mono mt-0.5">+{deficitHours}h</div>
                <div className="text-[10px] text-amber-800 font-semibold">{hardCapResult.deficitMinutes}m short</div>
              </div>
            </div>

            <p className="text-xs text-slate-600 font-medium leading-relaxed">
              Due on{' '}
              <strong>
                {new Date(hardCapResult.dueDate).toLocaleDateString('en-US', {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric',
                  hour: 'numeric',
                  minute: '2-digit',
                })}
              </strong>
              . Choose how you'd like PlanCraft to fix it:
            </p>
          </div>

          {/* Actionable Remedies */}
          <div>
            <div className="text-xs font-black uppercase tracking-wider text-slate-700 mb-2 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              <span>Choose a 1-Click Fix:</span>
            </div>
            <div className="space-y-2">
              {hardCapResult.recommendations.map((rec, idx) => (
                <button
                  key={idx}
                  onClick={() => onApplyRecommendation(rec)}
                  className="w-full text-left p-3.5 rounded-2xl border-2 border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/50 transition-all flex items-start gap-3 group shadow-xs"
                >
                  <div className="p-2 rounded-xl bg-slate-100 group-hover:bg-indigo-100 text-slate-700 group-hover:text-indigo-700 transition-colors mt-0.5">
                    {rec.type === 'extend_window' && <PlusCircle className="w-4 h-4 text-emerald-600" />}
                    {rec.type === 'reduce_duration' && <Scissors className="w-4 h-4 text-amber-600" />}
                    {rec.type === 'split_further' && <Calendar className="w-4 h-4 text-indigo-600" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-slate-900 group-hover:text-indigo-900">
                        {rec.title}
                      </span>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-600 transition-transform group-hover:translate-x-0.5" />
                    </div>
                    <p className="text-xs text-slate-600 font-medium mt-0.5 leading-relaxed">
                      {rec.description}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3 shrink-0">
          <button
            onClick={onOpenAvailabilityManager}
            className="text-xs font-bold text-indigo-600 hover:text-indigo-800 underline"
          >
            Edit Free Study Hours
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-black rounded-xl transition-colors shadow-xs"
          >
            Adjust Assignment
          </button>
        </div>
      </div>
    </div>
  );
};
