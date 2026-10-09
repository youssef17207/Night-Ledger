import React from 'react';
import {
  ShieldCheck,
  Zap,
  RotateCcw,
  Sparkles,
  Calendar,
  Clock,
  X,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onOpenAvailabilityManager: () => void;
}

export const EngineInsightsDrawer: React.FC<Props> = ({
  isOpen,
  onClose,
  onOpenAvailabilityManager,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/70 backdrop-blur-xs transition-opacity animate-fade-in overflow-hidden">
      <div className="bg-white border-t sm:border border-slate-200 w-full max-w-2xl rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col max-h-[92dvh] sm:max-h-[88vh] overflow-hidden">
        {/* Mobile drag handle */}
        <div className="sm:hidden pt-2.5 pb-1 flex justify-center bg-slate-50 shrink-0">
          <div className="w-12 h-1.5 bg-slate-300 rounded-full" />
        </div>

        {/* Header */}
        <div className="px-5 py-4 sm:px-6 sm:py-5 border-b border-indigo-100 bg-gradient-to-r from-indigo-900 via-purple-900 to-indigo-950 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-500/20 text-indigo-300 rounded-2xl border border-indigo-400/30">
              <Sparkles className="w-5 h-5 text-indigo-300" />
            </div>
            <div>
              <h2 className="text-base font-black text-white">
                How PlanCraft Keeps You on Track ✨
              </h2>
              <p className="text-xs text-indigo-200 mt-0.5">
                Smart scheduling that protects your free time and eliminates stress
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 space-y-4 flex-1 overflow-y-auto overscroll-contain min-h-0 text-slate-800">
          {/* Pillar 1: Urgency First & Early Start Chunking */}
          <div className="flex items-start gap-3.5 p-4 rounded-2xl bg-indigo-50/50 border-2 border-indigo-100">
            <div className="p-2.5 bg-indigo-100 text-indigo-700 rounded-2xl shrink-0 mt-0.5">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900">
                1. Urgency-First & Smart Chunking
              </h3>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                Tasks due soonest receive top priority in your daily free time. Long assignments (&gt;2 hrs) are automatically divided into bite-sized study blocks so you never have to cram the night before.
              </p>
            </div>
          </div>

          {/* Pillar 2: Capacity Boundary Protection */}
          <div className="flex items-start gap-3.5 p-4 rounded-2xl bg-emerald-50/50 border-2 border-emerald-100">
            <div className="p-2.5 bg-emerald-100 text-emerald-700 rounded-2xl shrink-0 mt-0.5">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900">
                2. Free Time Protection
              </h3>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                PlanCraft calculates your available study hours against assignment estimates. If coursework exceeds available time before a deadline, it gives you 1-click solutions to adjust your free hours or reduce task time.
              </p>
            </div>
          </div>

          {/* Pillar 3: Auto-Rebalance Recovery */}
          <div className="flex items-start gap-3.5 p-4 rounded-2xl bg-amber-50/50 border-2 border-amber-100">
            <div className="p-2.5 bg-amber-100 text-amber-700 rounded-2xl shrink-0 mt-0.5">
              <RotateCcw className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900">
                3. Auto-Rebalance When Life Happens
              </h3>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                Missed a study block or running late? Click <strong>Auto-Fix</strong> and PlanCraft will automatically relocate delayed tasks into your next open free study slots without messing up your other work.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
          <button
            onClick={onOpenAvailabilityManager}
            className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
          >
            <span>Configure Free Hours</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black rounded-xl transition-all shadow-xs"
          >
            Got it!
          </button>
        </div>
      </div>
    </div>
  );
};
