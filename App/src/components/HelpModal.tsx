import React from 'react';
import { DUST, RULE } from '../utils/ledger';
import { Btn, Modal } from './ui';

interface Props {
  onClose: () => void;
  onOpenAvailabilityManager: () => void;
}

const POINTS = [
  {
    n: '1',
    title: 'Soonest deadline first',
    body: 'Whatever is due soonest gets the first slot in your free hours. Anything longer than two hours is split into shorter study blocks so nothing piles up the night before.',
  },
  {
    n: '2',
    title: 'It checks you have the time',
    body: 'When you add an assignment, Night Ledger compares the work against your free hours before the deadline. If it will not fit, it offers a one-tap fix instead of letting you fall behind.',
  },
  {
    n: '3',
    title: 'It recovers when life happens',
    body: 'Miss a block and it slides into the next open slot without disturbing blocks you moved by hand. Auto-fix does it on demand, and Auto-rebalance (in the footer) does it for you.',
  },
  {
    n: '4',
    title: 'It learns your pace',
    body: 'Time a session with the focus timer and Night Ledger compares it with the estimate. Over time, suggested durations for each kind of work get closer to how long you really take.',
  },
];

export const HelpModal: React.FC<Props> = ({ onClose, onOpenAvailabilityManager }) => (
  <Modal
    kicker="How it works"
    title={
      <>
        Planning on <span className="italic">autopilot</span>
      </>
    }
    onClose={onClose}
    footer={
      <>
        <Btn variant="ghost" onClick={onOpenAvailabilityManager}>
          Set free hours →
        </Btn>
        <Btn variant="solid" onClick={onClose}>
          Got it
        </Btn>
      </>
    }
  >
    <div className="flex flex-col">
      {POINTS.map((p) => (
        <div key={p.n} className="flex gap-5 py-5" style={{ borderTop: `1px solid ${RULE}` }}>
          <span className="w-8 flex-none font-serif text-[44px] italic leading-none">{p.n}</span>
          <div>
            <div className="text-[16px] font-semibold uppercase" style={{ letterSpacing: '0.05em' }}>
              {p.title}
            </div>
            <p className="m-0 mt-1 text-[15px] leading-snug" style={{ color: DUST }}>
              {p.body}
            </p>
          </div>
        </div>
      ))}
    </div>
  </Modal>
);
