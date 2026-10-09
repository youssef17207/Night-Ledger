import React, { useState, useEffect, useRef } from 'react';
import { TaskChunk, Assignment } from '../types/scheduler';
import { sounds } from '../utils/audioAlerts';
import confetti from 'canvas-confetti';
import {
  Play,
  Pause,
  RotateCcw,
  CheckCircle2,
  X,
  Minimize2,
  Maximize2,
  Clock,
  Sparkles,
  Volume2,
  VolumeX,
} from 'lucide-react';

interface Props {
  chunk: TaskChunk;
  assignment?: Assignment;
  onComplete: (chunkId: string, actualMinutes: number) => void;
  onClose: () => void;
}

export const FocusTimerModal: React.FC<Props> = ({
  chunk,
  assignment,
  onComplete,
  onClose,
}) => {
  const initialSeconds = chunk.durationMinutes * 60;
  const [secondsRemaining, setSecondsRemaining] = useState<number>(initialSeconds);
  const [isActive, setIsActive] = useState<boolean>(true);
  const [isMinimized, setIsMinimized] = useState<boolean>(false);
  const [elapsedMinutes, setElapsedMinutes] = useState<number>(0);
  const [ambientAudio, setAmbientAudio] = useState<'none' | 'rain' | 'whitenoise'>('none');

  // Ambient sound synthesizer
  const audioContextRef = useRef<AudioContext | null>(null);
  const noiseNodeRef = useRef<AudioNode | null>(null);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isActive && secondsRemaining > 0) {
      interval = setInterval(() => {
        setSecondsRemaining((sec) => {
          if (sec <= 1) {
            sounds.playTimerComplete();
            confetti({
              particleCount: 80,
              spread: 60,
              origin: { y: 0.7 },
            });
            setIsActive(false);
            return 0;
          }
          return sec - 1;
        });
        setElapsedMinutes((prev) => prev + 1 / 60);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isActive, secondsRemaining]);

  // Ambient sound generator using Web Audio API buffer noise
  const toggleAmbientSound = () => {
    if (ambientAudio === 'none') {
      try {
        const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        const ctx = new AudioCtx();
        audioContextRef.current = ctx;

        // Generate gentle brown noise (calming study sound)
        const bufferSize = ctx.sampleRate * 2;
        const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const output = noiseBuffer.getChannelData(0);
        let lastOut = 0.0;
        for (let i = 0; i < bufferSize; i++) {
          const white = Math.random() * 2 - 1;
          output[i] = (lastOut + 0.02 * white) / 1.02;
          lastOut = output[i];
          output[i] *= 1.5;
        }

        const whiteNoise = ctx.createBufferSource();
        whiteNoise.buffer = noiseBuffer;
        whiteNoise.loop = true;

        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 400; // Deep soft murmur

        const gainNode = ctx.createGain();
        gainNode.gain.value = 0.08;

        whiteNoise.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(ctx.destination);
        whiteNoise.start();

        noiseNodeRef.current = whiteNoise;
        setAmbientAudio('rain');
      } catch {
        // audio fail
      }
    } else {
      if (noiseNodeRef.current) {
        try {
          (noiseNodeRef.current as AudioScheduledSourceNode).stop();
        } catch {
          // ignore
        }
      }
      if (audioContextRef.current) {
        audioContextRef.current.close().catch(() => {});
      }
      setAmbientAudio('none');
    }
  };

  useEffect(() => {
    return () => {
      if (noiseNodeRef.current) {
        try {
          (noiseNodeRef.current as AudioScheduledSourceNode).stop();
        } catch {
          // ignore
        }
      }
      if (audioContextRef.current) {
        audioContextRef.current.close().catch(() => {});
      }
    };
  }, []);

  const handleFinish = () => {
    sounds.playSuccessChime();
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
    });
    const finalMinutes = Math.max(5, Math.round(elapsedMinutes > 0 ? elapsedMinutes : chunk.durationMinutes));
    onComplete(chunk.id, finalMinutes);
    onClose();
  };

  const minutes = Math.floor(secondsRemaining / 60);
  const seconds = secondsRemaining % 60;
  const progressPercent = Math.min(100, Math.round(((initialSeconds - secondsRemaining) / initialSeconds) * 100));

  if (isMinimized) {
    return (
      <div className="fixed bottom-5 right-5 z-50 bg-slate-900 text-white rounded-xl shadow-2xl p-3 flex items-center gap-3 border border-slate-700 animate-slide-up">
        <div className="w-10 h-10 rounded-lg bg-indigo-600/30 flex items-center justify-center font-mono text-sm font-bold text-indigo-400">
          {minutes}:{seconds.toString().padStart(2, '0')}
        </div>
        <div className="max-w-[140px] truncate">
          <p className="text-xs font-semibold truncate">{chunk.chunkLabel}</p>
          <p className="text-[11px] text-slate-400">Focusing</p>
        </div>
        <button
          onClick={() => setIsActive(!isActive)}
          className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-300"
        >
          {isActive ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
        </button>
        <button
          onClick={() => setIsMinimized(false)}
          className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-300"
          title="Expand"
        >
          <Maximize2 className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4">
      <div className="bg-slate-900 border border-slate-800 text-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/50">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Active Focus Session
            </span>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setIsMinimized(true)}
              className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
              title="Minimize to floating widget"
            >
              <Minimize2 className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
              title="Close focus session"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-8 flex flex-col items-center text-center">
          <div className="inline-flex items-center gap-2 text-xs font-semibold px-3 py-1 bg-slate-800 text-indigo-300 rounded-lg mb-3">
            <span>{assignment?.courseCode || 'Study Task'}</span>
            <span aria-hidden="true">·</span>
            <span>{assignment?.courseName || 'Coursework'}</span>
          </div>

          <h2 className="text-xl font-bold text-white mb-6 max-w-md">
            {chunk.chunkLabel}
          </h2>

          {/* Circular / Big Timer Display */}
          <div className="relative w-64 h-64 flex flex-col items-center justify-center rounded-full bg-slate-950 border-4 border-slate-800 shadow-inner my-2">
            <svg className="absolute inset-0 w-full h-full -rotate-90">
              <circle
                cx="128"
                cy="128"
                r="118"
                className="stroke-slate-800"
                strokeWidth="8"
                fill="transparent"
              />
              <circle
                cx="128"
                cy="128"
                r="118"
                className="stroke-indigo-500 transition-all duration-1000 ease-linear"
                strokeWidth="8"
                strokeDasharray={2 * Math.PI * 118}
                strokeDashoffset={2 * Math.PI * 118 * (1 - progressPercent / 100)}
                strokeLinecap="round"
                fill="transparent"
              />
            </svg>

            <div className="font-mono text-5xl font-extrabold tracking-tight text-white select-none">
              {minutes.toString().padStart(2, '0')}:{seconds.toString().padStart(2, '0')}
            </div>

            <div className="text-xs text-slate-400 mt-2 font-medium flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              <span>Target: {chunk.durationMinutes} min</span>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-3 mt-6">
            <button
              onClick={() => setSecondsRemaining((s) => Math.max(60, s - 300))}
              className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-300 rounded-lg transition-colors"
              title="Minus 5 minutes"
            >
              -5m
            </button>

            <button
              onClick={() => setIsActive(!isActive)}
              className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl shadow-lg shadow-indigo-600/30 transition-transform active:scale-95 flex items-center gap-2"
            >
              {isActive ? (
                <>
                  <Pause className="w-5 h-5 fill-current" /> Pause
                </>
              ) : (
                <>
                  <Play className="w-5 h-5 fill-current" /> Resume
                </>
              )}
            </button>

            <button
              onClick={() => setSecondsRemaining((s) => s + 300)}
              className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-300 rounded-lg transition-colors"
              title="Add 5 minutes"
            >
              +5m
            </button>

            <button
              onClick={() => {
                setIsActive(false);
                setSecondsRemaining(initialSeconds);
              }}
              className="p-3 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-lg transition-colors"
              title="Reset Timer"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>

          {/* Ambient Sound Toggle */}
          <div className="mt-6 flex items-center gap-2">
            <button
              onClick={toggleAmbientSound}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                ambientAudio !== 'none'
                  ? 'bg-indigo-950 text-indigo-300 border border-indigo-700'
                  : 'bg-slate-800/80 text-slate-400 hover:text-slate-200'
              }`}
            >
              {ambientAudio !== 'none' ? <Volume2 className="w-3.5 h-3.5 text-indigo-400" /> : <VolumeX className="w-3.5 h-3.5" />}
              <span>{ambientAudio !== 'none' ? 'Ambient Sound: On (Brown Noise)' : 'Ambient Noise: Off'}</span>
            </button>
          </div>
        </div>

        {/* Footer with Complete action */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-900/80 flex items-center justify-between">
          <div className="text-xs text-slate-400">
            <span>Logged: </span>
            <span className="font-semibold text-slate-200 font-mono">
              {Math.max(1, Math.round(elapsedMinutes))} min
            </span>
          </div>
          <button
            onClick={handleFinish}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl shadow-md transition-colors"
          >
            <CheckCircle2 className="w-4 h-4" />
            Mark Session Complete
          </button>
        </div>
      </div>
    </div>
  );
};
