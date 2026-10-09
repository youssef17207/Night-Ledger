import React, { useState } from 'react';
import { AvailabilityWindow } from '../types/scheduler';
import { timeToMinutes } from '../utils/schedulerEngine';
import { newId } from '../utils/storage';
import { DAY_LONG, DAY_SHORT, DUST, INK, LILAC, PAPER, RULE, TANGERINE, fmtHHMM, fmtHours } from '../utils/ledger';
import { Btn, Chip, FieldLabel, Label, Modal } from './ui';

interface Props {
  windows: AvailabilityWindow[];
  onSaveWindows: (windows: AvailabilityWindow[]) => void;
  onClose: () => void;
}

// Monday-first display order of getDay() indexes
const DAY_ORDER = [1, 2, 3, 4, 5, 6, 0];

const mk = (dayOfWeek: number, startTime: string, endTime: string, label: string): AvailabilityWindow => ({
  id: newId('w'),
  dayOfWeek,
  startTime,
  endTime,
  label,
});

const PRESETS: Record<'school' | 'evening' | 'full', { name: string; build: () => AvailabilityWindow[] }> = {
  school: {
    name: 'After school',
    build: () => [
      ...[1, 2, 3, 4].map((d) => mk(d, '15:30', '18:00', 'After-school homework')),
      mk(5, '15:00', '17:30', 'Friday homework'),
      mk(6, '10:00', '13:00', 'Saturday review'),
      mk(0, '14:00', '17:00', 'Sunday week prep'),
    ],
  },
  evening: {
    name: 'Evenings',
    build: () => [
      ...[1, 2, 3, 4].map((d) => mk(d, '19:00', '21:30', 'Evening study')),
      mk(0, '18:30', '21:30', 'Sunday night prep'),
    ],
  },
  full: {
    name: 'Full week',
    build: () => [
      mk(1, '14:00', '17:30', 'Afternoon block'),
      mk(2, '15:00', '18:30', 'Study block'),
      mk(3, '14:00', '18:00', 'Focus block'),
      mk(4, '14:30', '18:00', 'Review block'),
      mk(5, '13:30', '16:30', 'Wind down'),
      mk(6, '10:00', '14:00', 'Weekend deep study'),
      mk(0, '14:00', '18:00', 'Sunday prep'),
    ],
  },
};

export const AvailabilityManagerModal: React.FC<Props> = ({ windows: initialWindows, onSaveWindows, onClose }) => {
  const [windows, setWindows] = useState<AvailabilityWindow[]>(initialWindows);
  const [selectedDay, setSelectedDay] = useState<number>(1);
  const [targetDays, setTargetDays] = useState<Set<number>>(new Set([1]));
  const [newStart, setNewStart] = useState('15:30');
  const [newEnd, setNewEnd] = useState('18:00');
  const [newLabel, setNewLabel] = useState('');
  const [error, setError] = useState('');

  const minutesOf = (w: AvailabilityWindow) => Math.max(0, timeToMinutes(w.endTime) - timeToMinutes(w.startTime));
  const totalWeekly = windows.reduce((s, w) => s + minutesOf(w), 0);

  const pickDay = (d: number) => {
    setSelectedDay(d);
    setTargetDays(new Set([d]));
  };

  const toggleTarget = (d: number) => {
    setTargetDays((prev) => {
      const next = new Set(prev);
      if (next.has(d)) next.delete(d);
      else next.add(d);
      return next;
    });
  };

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (timeToMinutes(newEnd) - timeToMinutes(newStart) < 15) {
      setError('The end time must be at least 15 minutes after the start time.');
      return;
    }
    if (targetDays.size === 0) {
      setError('Choose at least one day.');
      return;
    }
    setError('');
    const label = newLabel.trim() || 'Study time';
    setWindows((prev) => [...prev, ...[...targetDays].map((d) => mk(d, newStart, newEnd, label))]);
    setNewLabel('');
  };

  const dayWindows = windows
    .filter((w) => w.dayOfWeek === selectedDay)
    .sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime));
  const dayMinutes = dayWindows.reduce((s, w) => s + minutesOf(w), 0);

  const save = () => {
    onSaveWindows(windows);
    onClose();
  };

  return (
    <Modal
      kicker="When you can study"
      title={
        <>
          Free <span className="italic">hours</span>
        </>
      }
      onClose={onClose}
      width={720}
      accent="#5ED9CB"
      footer={
        <>
          <Btn variant="ghost" onClick={onClose}>
            Cancel
          </Btn>
          <Btn variant="solid" onClick={save}>
            Save & re-plan
          </Btn>
        </>
      }
    >
      <div className="flex flex-col gap-7">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="flex items-baseline gap-3">
            <span className="font-serif text-[72px] italic leading-[0.9]">{fmtHours(totalWeekly)}</span>
            <Label wide>hours a week</Label>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Label>Quick routine</Label>
            {(Object.keys(PRESETS) as Array<keyof typeof PRESETS>).map((k) => (
              <Chip
                key={k}
                onClick={() => {
                  if (windows.length === 0 || window.confirm('Replace your current free hours with this routine?')) {
                    setWindows(PRESETS[k].build());
                  }
                }}
              >
                {PRESETS[k].name}
              </Chip>
            ))}
          </div>
        </div>

        <div>
          <FieldLabel>Day</FieldLabel>
          <div className="grid grid-cols-7 gap-2">
            {DAY_ORDER.map((d) => {
              const count = windows.filter((w) => w.dayOfWeek === d).length;
              const active = selectedDay === d;
              return (
                <button
                  key={d}
                  type="button"
                  onClick={() => pickDay(d)}
                  aria-pressed={active}
                  className="flex cursor-pointer flex-col items-center gap-1 py-2"
                  style={{
                    border: `2px solid ${active ? PAPER : RULE}`,
                    background: active ? PAPER : 'transparent',
                    color: active ? INK : PAPER,
                  }}
                >
                  <span className="font-mono text-[12px] font-medium uppercase tracking-[0.06em]">{DAY_SHORT[d]}</span>
                  <span className="font-mono text-[11px]" style={{ color: active ? '#5B5568' : DUST }}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between gap-3">
            <Label>{DAY_LONG[selectedDay]}</Label>
            <span className="font-mono text-[12px]" style={{ color: DUST }}>
              {fmtHours(dayMinutes)} hrs
            </span>
          </div>
          {dayWindows.length === 0 ? (
            <div className="p-4 font-mono text-[13px]" style={{ border: `2px dashed ${RULE}`, color: DUST }}>
              Nothing set for {DAY_LONG[selectedDay]}. Add a window below.
            </div>
          ) : (
            <div className="flex flex-col">
              {dayWindows.map((w) => (
                <div key={w.id} className="flex flex-wrap items-center gap-x-4 gap-y-1 py-3" style={{ borderTop: `1px solid ${RULE}` }}>
                  <span className="w-[120px] flex-none font-mono text-[14px]">
                    {fmtHHMM(w.startTime)}–{fmtHHMM(w.endTime)}
                  </span>
                  <span className="min-w-0 flex-[1_1_160px] text-[15px] font-medium uppercase" style={{ letterSpacing: '0.04em' }}>
                    {w.label}
                  </span>
                  <span className="font-mono text-[12px]" style={{ color: DUST }}>
                    {fmtHours(minutesOf(w))} hrs
                  </span>
                  <Btn small variant="ghost" onClick={() => setWindows((prev) => prev.filter((x) => x.id !== w.id))}>
                    Remove
                  </Btn>
                </div>
              ))}
            </div>
          )}
        </div>

        <form onSubmit={handleAdd} className="flex flex-col gap-4 p-5" style={{ border: `2px solid ${RULE}`, background: INK }}>
          <Label wide color={PAPER}>
            Add a window
          </Label>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <FieldLabel htmlFor="w-start">From</FieldLabel>
              <input id="w-start" className="fld mono" type="time" required value={newStart} onChange={(e) => setNewStart(e.target.value)} />
            </div>
            <div>
              <FieldLabel htmlFor="w-end">To</FieldLabel>
              <input id="w-end" className="fld mono" type="time" required value={newEnd} onChange={(e) => setNewEnd(e.target.value)} />
            </div>
            <div>
              <FieldLabel htmlFor="w-label" hint="optional">
                Name
              </FieldLabel>
              <input
                id="w-label"
                className="fld"
                value={newLabel}
                maxLength={40}
                onChange={(e) => setNewLabel(e.target.value)}
                placeholder="After school"
              />
            </div>
          </div>
          <div>
            <FieldLabel hint="tap more than one to repeat it">Add to</FieldLabel>
            <div className="flex flex-wrap gap-2">
              {DAY_ORDER.map((d) => (
                <Chip key={d} active={targetDays.has(d)} color={LILAC} onClick={() => toggleTarget(d)}>
                  {DAY_SHORT[d]}
                </Chip>
              ))}
            </div>
          </div>
          {error && (
            <div className="font-mono text-[12px]" style={{ color: TANGERINE }} role="alert">
              {error}
            </div>
          )}
          <div className="flex justify-end">
            <Btn type="submit" variant="solid">
              + Add window
            </Btn>
          </div>
        </form>
      </div>
    </Modal>
  );
};
