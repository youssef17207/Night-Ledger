import React from 'react';
import { HardCapCheckResult } from '../types/scheduler';
import { DUST, INK, RULE, TANGERINE, fmtClock, fmtHours, fmtMonthDay, DAY_SHORT } from '../utils/ledger';
import { Btn, Label, Modal } from './ui';

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

const Stat: React.FC<{ label: string; value: string; sub: string; accent?: string }> = ({ label, value, sub, accent }) => (
  <div className="flex-[1_1_120px] p-4" style={{ border: `2px solid ${accent ?? RULE}`, background: INK }}>
    <Label color={accent ?? DUST}>{label}</Label>
    <div className="font-serif text-[48px] italic leading-none" style={{ color: accent }}>
      {value}
    </div>
    <div className="font-mono text-[12px]" style={{ color: DUST }}>
      {sub}
    </div>
  </div>
);

export const HardCapAlertModal: React.FC<Props> = ({ hardCapResult, onApplyRecommendation, onOpenAvailabilityManager, onClose }) => {
  const due = new Date(hardCapResult.dueDate);
  return (
    <Modal
      kicker="Schedule check"
      title={
        <>
          Not enough <span className="italic">time</span>
        </>
      }
      onClose={onClose}
      width={600}
      accent={TANGERINE}
      footer={
        <>
          <Btn variant="ghost" onClick={onOpenAvailabilityManager}>
            Edit free hours
          </Btn>
          <Btn variant="solid" onClick={onClose}>
            Adjust assignment
          </Btn>
        </>
      }
    >
      <div className="flex flex-col gap-6">
        <p className="m-0 text-[16px] font-medium leading-snug">
          <span className="font-semibold uppercase" style={{ letterSpacing: '0.04em' }}>
            {hardCapResult.assignmentTitle}
          </span>{' '}
          is due {DAY_SHORT[due.getDay()]} {fmtMonthDay(due)} at {fmtClock(due)}. Your free hours before then do not cover it.
        </p>

        <div className="flex flex-wrap gap-3">
          <Stat label="Work needed" value={`${fmtHours(hardCapResult.requiredMinutes)}h`} sub={`${hardCapResult.requiredMinutes} min`} />
          <Stat label="Free time" value={`${fmtHours(hardCapResult.availableMinutes)}h`} sub={`${hardCapResult.availableMinutes} min`} />
          <Stat
            label="Short by"
            value={`${fmtHours(hardCapResult.deficitMinutes)}h`}
            sub={`${hardCapResult.deficitMinutes} min`}
            accent={TANGERINE}
          />
        </div>

        <div className="flex flex-col gap-3">
          <Label wide>Pick a fix</Label>
          {hardCapResult.recommendations.map((rec, i) => (
            <button
              key={i}
              type="button"
              onClick={() => onApplyRecommendation(rec)}
              className="flex cursor-pointer flex-col gap-1 p-4 text-left transition-colors hover:bg-[var(--ink)]"
              style={{ border: `2px solid ${RULE}`, background: 'transparent', color: 'inherit' }}
            >
              <span className="flex items-center justify-between gap-3 text-[15px] font-semibold uppercase" style={{ letterSpacing: '0.04em' }}>
                {rec.title}
                <span aria-hidden="true">→</span>
              </span>
              <span className="text-[14px]" style={{ color: DUST }}>
                {rec.description}
              </span>
            </button>
          ))}
        </div>
      </div>
    </Modal>
  );
};
