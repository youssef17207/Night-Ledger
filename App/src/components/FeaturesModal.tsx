import React from 'react';
import { DUST, RULE } from '../utils/ledger';
import { Btn, Modal } from './ui';

interface Props {
  onClose: () => void;
  onOpenHelp: () => void;
}

const FEATURES = [
  {
    title: 'Classes with colours',
    body: 'Add each class once and give it a colour. Every assignment, chart bar and study block wears that colour so you can scan your week at a glance.',
  },
  {
    title: 'Free hours and quick routines',
    body: 'Tell Night Ledger when you can study. Start from a quick routine (After school, Evenings, Full week) and switch between them with one click, then fine-tune any day.',
  },
  {
    title: 'Automatic study plan',
    body: 'Add an assignment with a due date and an estimate. It is scheduled into your free hours, soonest deadline first, and long work is split into shorter blocks.',
  },
  {
    title: 'Week, Today and Homework views',
    body: 'Week shows the whole ledger by day. Today focuses on what to do now and next. Homework lists every open assignment with its status.',
  },
  {
    title: 'Focus timer',
    body: 'Start a block and a timer counts it down. Finishing it ticks the block off and teaches the planner how long your work really takes.',
  },
  {
    title: 'Reminders and sound',
    body: 'A banner appears shortly before a block starts and stays until you start, snooze or finish it. Sound alerts can be switched on or off from the footer.',
  },
  {
    title: 'Auto-fix and Auto-rebalance',
    body: 'Missed a block? Auto-fix moves it into the next open slot on demand. Turn on Auto-rebalance in the footer to have it happen by itself.',
  },
  {
    title: 'Not-enough-time warning',
    body: 'If your free hours cannot cover an assignment before its deadline, you are told straight away with a one-tap way to make room.',
  },
  {
    title: 'Light mode and 12-hour clock',
    body: 'Invert the colours from the footer if dark backgrounds are hard to read. Class colours stay bright either way, and all times show in standard AM/PM.',
  },
  {
    title: 'Private by default',
    body: 'Everything is saved in your browser, with no account. Export a backup file any time and import it on another device.',
  },
];

export const FeaturesModal: React.FC<Props> = ({ onClose, onOpenHelp }) => (
  <Modal
    kicker="Features"
    title={
      <>
        Everything <span className="italic">included</span>
      </>
    }
    onClose={onClose}
    footer={
      <>
        <Btn variant="ghost" onClick={onOpenHelp}>
          How it works →
        </Btn>
        <Btn variant="solid" onClick={onClose}>
          Got it
        </Btn>
      </>
    }
  >
    <div className="flex flex-col">
      {FEATURES.map((f, i) => (
        <div key={f.title} className="flex gap-5 py-4" style={{ borderTop: `1px solid ${RULE}` }}>
          <span className="w-8 flex-none font-serif text-[32px] italic leading-none">{i + 1}</span>
          <div>
            <div className="text-[16px] font-semibold uppercase" style={{ letterSpacing: '0.05em' }}>
              {f.title}
            </div>
            <p className="m-0 mt-1 text-[15px] leading-snug" style={{ color: DUST }}>
              {f.body}
            </p>
          </div>
        </div>
      ))}
    </div>
  </Modal>
);
