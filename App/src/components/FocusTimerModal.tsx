import React, { useEffect, useRef, useState } from 'react';
import confetti from 'canvas-confetti';
import { Assignment, TaskChunk } from '../types/scheduler';
import { sounds } from '../utils/audioAlerts';
import { DUST, INK, LEDGER, LILAC, PAPER, RULE, courseColorOf, fmtHHMM, resolveColor } from '../utils/ledger';
import { Btn, Label, Tag } from './ui';

interface Props {
  chunk: TaskChunk;
  assignment?: Assignment;
  courseColor?: string;
  courseCode?: string;
  onComplete: (chunkId: string, actualMinutes: number) => void;
  onClose: () => void;
}

const pad = (n: number) => n.toString().padStart(2, '0');

export const FocusTimerModal: React.FC<Props> = ({ chunk, assignment, courseColor, courseCode, onComplete, onClose }) => {
  const initialSeconds = chunk.durationMinutes * 60;
  const color = courseColor || (assignment ? courseColorOf(assignment, new Map()) : LILAC);

  const [secondsRemaining, setSecondsRemaining] = useState(initialSeconds);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isActive, setIsActive] = useState(true);
  const [isMinimized, setIsMinimized] = useState(false);
  const [ambient, setAmbient] = useState(false);

  const lastTick = useRef(Date.now());
  const audioCtx = useRef<AudioContext | null>(null);
  const noiseNode = useRef<AudioBufferSourceNode | null>(null);

  // Wall-clock based so the countdown stays correct even when the tab is throttled in the background.
  useEffect(() => {
    if (!isActive) return;
    lastTick.current = Date.now();
    const id = window.setInterval(() => {
      const now = Date.now();
      const dt = Math.floor((now - lastTick.current) / 1000);
      if (dt < 1) return;
      lastTick.current += dt * 1000;
      setElapsedSeconds((e) => e + dt);
      setSecondsRemaining((s) => Math.max(0, s - dt));
    }, 250);
    return () => window.clearInterval(id);
  }, [isActive]);

  useEffect(() => {
    if (isActive && secondsRemaining === 0) {
      setIsActive(false);
      sounds.playTimerComplete();
      confetti({ particleCount: 80, spread: 60, origin: { y: 0.7 }, colors: [resolveColor(color), resolveColor(PAPER), resolveColor(LILAC)] });
    }
  }, [secondsRemaining, isActive, color]);

  // Show the countdown in the browser tab title.
  useEffect(() => {
    const prev = document.title;
    const m = Math.floor(secondsRemaining / 60);
    const s = secondsRemaining % 60;
    document.title = `${pad(m)}:${pad(s)} · ${chunk.chunkLabel}`;
    return () => {
      document.title = prev;
    };
  }, [secondsRemaining, chunk.chunkLabel]);

  const stopAmbient = () => {
    try {
      noiseNode.current?.stop();
    } catch {
      /* already stopped */
    }
    noiseNode.current = null;
    audioCtx.current?.close().catch(() => {});
    audioCtx.current = null;
  };

  useEffect(() => stopAmbient, []);

  const toggleAmbient = () => {
    if (ambient) {
      stopAmbient();
      setAmbient(false);
      return;
    }
    try {
      const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new Ctx();
      audioCtx.current = ctx;
      // Gentle brown noise: a calm study murmur.
      const size = ctx.sampleRate * 2;
      const buffer = ctx.createBuffer(1, size, ctx.sampleRate);
      const out = buffer.getChannelData(0);
      let last = 0;
      for (let i = 0; i < size; i++) {
        const white = Math.random() * 2 - 1;
        out[i] = ((last + 0.02 * white) / 1.02) * 1.5;
        last = (last + 0.02 * white) / 1.02;
      }
      const src = ctx.createBufferSource();
      src.buffer = buffer;
      src.loop = true;
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 400;
      const gain = ctx.createGain();
      gain.gain.value = 0.08;
      src.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      src.start();
      noiseNode.current = src;
      setAmbient(true);
    } catch {
      /* audio blocked */
    }
  };

  const handleFinish = () => {
    sounds.playSuccessChime();
    confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 }, colors: [resolveColor(color), resolveColor(PAPER), resolveColor(LILAC)] });
    const actual = Math.max(1, Math.round(elapsedSeconds / 60));
    onComplete(chunk.id, actual);
    onClose();
  };

  const m = Math.floor(secondsRemaining / 60);
  const s = secondsRemaining % 60;
  const progress = Math.min(1, (initialSeconds - secondsRemaining) / Math.max(1, initialSeconds));
  const SEGMENTS = 30;
  const filled = Math.round(progress * SEGMENTS);
  const finished = secondsRemaining === 0;

  if (isMinimized) {
    return (
      <div
        className="ledger-in fixed bottom-5 right-5 z-50 flex items-center gap-3 p-3"
        style={{ background: PAPER, color: INK, boxShadow: `6px 6px 0 ${color}` }}
      >
        <span className="font-serif text-[40px] italic leading-none">
          {pad(m)}:{pad(s)}
        </span>
        <span className="max-w-[140px] truncate font-mono text-[12px] uppercase" style={{ letterSpacing: '0.06em' }}>
          {chunk.chunkLabel}
        </span>
        <Btn small onClick={() => setIsActive((a) => !a)} style={{ color: INK }}>
          {isActive ? 'Pause' : 'Go'}
        </Btn>
        <Btn small onClick={() => setIsMinimized(false)} style={{ color: INK }}>
          Open
        </Btn>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-6" style={{ background: 'color-mix(in srgb, var(--ink) 92%, transparent)' }}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Focus session"
        className="ledger-in flex w-full max-w-[640px] flex-col"
        style={{ background: LEDGER, border: `1px solid ${RULE}`, boxShadow: `8px 8px 0 ${color}` }}
      >
        <div className="flex items-center justify-between gap-3 px-5 py-4 sm:px-7" style={{ borderBottom: `1px solid ${RULE}` }}>
          <Label wide>{finished ? 'Time is up' : isActive ? 'Focus session' : 'Paused'}</Label>
          <div className="flex gap-2">
            <Btn small onClick={() => setIsMinimized(true)}>
              Minimise
            </Btn>
            <Btn small variant="ghost" onClick={onClose}>
              Close
            </Btn>
          </div>
        </div>

        <div className="flex flex-col items-start gap-5 px-5 py-8 sm:px-7">
          <div className="flex flex-wrap items-center gap-3">
            <Tag color={color}>{courseCode || assignment?.courseCode || 'STUDY'}</Tag>
            <span className="font-mono text-[13px]" style={{ color: DUST }}>
              {fmtHHMM(chunk.scheduledStartTime)}–{fmtHHMM(chunk.scheduledEndTime)} · {chunk.durationMinutes} min target
            </span>
          </div>
          <h2
            className="m-0 font-serif text-[32px] font-normal leading-[1.05] sm:text-[40px]"
            style={{ letterSpacing: '-0.02em', overflowWrap: 'anywhere' }}
          >
            {chunk.chunkLabel}
          </h2>

          <div
            className="font-serif italic leading-[0.85]"
            style={{ fontSize: 'clamp(96px, 26vw, 176px)', letterSpacing: '-0.04em' }}
            aria-live="off"
          >
            {pad(m)}:{pad(s)}
          </div>

          <div className="flex h-[22px] w-full gap-[3px]" aria-hidden="true">
            {Array.from({ length: SEGMENTS }, (_, i) => (
              <span
                key={i}
                className="min-w-0 flex-1"
                style={{ background: i < filled ? color : 'transparent', border: `2px solid ${color}` }}
              />
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Btn onClick={() => setSecondsRemaining((x) => Math.max(60, x - 300))} title="Take off five minutes">
              −5m
            </Btn>
            <Btn variant="solid" onClick={() => setIsActive((a) => !a)} disabled={finished}>
              {isActive ? 'Pause' : 'Resume'}
            </Btn>
            <Btn
              onClick={() => {
                setSecondsRemaining((x) => x + 300);
                if (finished) setIsActive(true);
              }}
              title="Add five minutes"
            >
              +5m
            </Btn>
            <Btn
              variant="ghost"
              onClick={() => {
                setIsActive(false);
                setSecondsRemaining(initialSeconds);
                setElapsedSeconds(0);
              }}
            >
              Reset
            </Btn>
            <Btn variant="ghost" onClick={toggleAmbient}>
              Ambient · {ambient ? 'On' : 'Off'}
            </Btn>
          </div>
        </div>

        <div
          className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 sm:px-7"
          style={{ borderTop: `1px solid ${RULE}`, background: INK }}
        >
          <span className="font-mono text-[13px]" style={{ color: DUST }}>
            Logged <span style={{ color: PAPER }}>{Math.max(0, Math.round(elapsedSeconds / 60))} min</span>
          </span>
          <Btn variant="solid" bg={color} onClick={handleFinish}>
            ✓ Mark session complete
          </Btn>
        </div>
      </div>
    </div>
  );
};
