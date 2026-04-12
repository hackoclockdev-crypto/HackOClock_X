'use client';

import { useState, useEffect, useRef } from 'react';

// Hackathon start: April 23, 2026, 9:00 AM IST
const HACKATHON_DATE = new Date('2026-04-23T09:00:00+05:30');

function pad(n: number) {
  return String(n).padStart(2, '0');
}

function getTimeLeft() {
  const now = Date.now();
  const target = HACKATHON_DATE.getTime();
  const diff = Math.max(0, target - now);

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);

  return { days, hours, minutes, seconds, isOver: diff === 0 };
}

function CountdownUnit({ value, label, prevValue }: { value: number; label: string; prevValue: number }) {
  const hasChanged = value !== prevValue;

  return (
    <div className="flex flex-col items-center">
      <div
        className="relative w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 rounded-2xl flex items-center justify-center overflow-hidden"
        style={{
          background: 'linear-gradient(145deg, #1a1a1d, #111113)',
          border: '1px solid rgba(6, 182, 212,0.15)',
          boxShadow: '0 4px 24px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05)',
        }}
      >
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amber-500/50 to-transparent" />
        <span
          key={`${label}-${value}`}
          className="text-3xl sm:text-4xl md:text-5xl font-black font-mono text-white"
          style={{
            animation: hasChanged ? 'flipDown 0.3s ease-out' : 'none',
            textShadow: '0 0 20px rgba(6, 182, 212,0.3)',
          }}
        >
          {pad(value)}
        </span>
        <div className="absolute inset-x-0 top-1/2 h-px bg-black/40" />
      </div>
      <span className="mt-3 text-xs font-semibold tracking-widest text-zinc-500 uppercase">
        {label}
      </span>
    </div>
  );
}

export default function CountdownTimer() {
  const [mounted, setMounted] = useState(false);
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0, isOver: false });
  const prevRef = useRef(timeLeft);

  useEffect(() => {
    setMounted(true);
    // Initial sync
    const initial = getTimeLeft();
    setTimeLeft(initial);
    prevRef.current = initial;
    
    const ticker = setInterval(() => {
      const next = getTimeLeft();
      setTimeLeft(current => {
        prevRef.current = current; // Capture current state for the animation 'before' it updates
        return next;
      });
    }, 1000);
    
    return () => clearInterval(ticker);
  }, []);

  if (!mounted) {
    return (
      <div className="flex items-center justify-center gap-4 sm:gap-6 md:gap-8 opacity-0">
        {['Days', 'Hours', 'Minutes', 'Seconds'].map((lbl) => (
          <div key={lbl} className="flex flex-col items-center">
             <div className="w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 rounded-2xl bg-zinc-900/50" />
             <span className="mt-3 text-xs font-semibold tracking-widest text-zinc-800 uppercase">{lbl}</span>
          </div>
        ))}
      </div>
    );
  }

  if (timeLeft.isOver) {
    return (
      <div className="text-center">
        <p className="text-2xl font-bold gradient-text">
          🚀 HackO&apos;Clock is LIVE!
        </p>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center gap-4 sm:gap-6 md:gap-8">
      <CountdownUnit value={timeLeft.days} label="Days" prevValue={prevRef.current.days} />
      <CountdownUnit value={timeLeft.hours} label="Hours" prevValue={prevRef.current.hours} />
      <CountdownUnit value={timeLeft.minutes} label="Minutes" prevValue={prevRef.current.minutes} />
      <CountdownUnit value={timeLeft.seconds} label="Seconds" prevValue={prevRef.current.seconds} />
    </div>
  );
}
