// components/FocusTimer.jsx — Neo-Brutalist Pomodoro timer with sticker aesthetic
import { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Play, Pause, RotateCcw, Coffee, Brain } from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';

const MODES = {
  work: { label: 'Focus', defaultMinutes: 25 },
  break: { label: 'Break', defaultMinutes: 5 },
};

export default function FocusTimer({ onSessionComplete, onStateChange }) {
  const [mode, setMode] = useState('work');
  const [timeLeft, setTimeLeft] = useState(MODES.work.defaultMinutes * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [sessionsCompleted, setSessionsCompleted] = useState(0);
  const intervalRef = useRef(null);

  const totalSeconds = MODES[mode].defaultMinutes * 60;
  const progress = ((totalSeconds - timeLeft) / totalSeconds) * 100;

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  // Log completed session to the backend and update heatmap
  const logSession = useCallback(async (minutes) => {
    try {
      await api.post('/focus/log', { durationMinutes: minutes, sessionType: 'pomodoro' });
      onSessionComplete?.();
      toast.success(`🎉 ${minutes} min focus session logged!`);
    } catch {
      toast.error('Failed to log session');
    }
  }, [onSessionComplete]);

  // Timer tick
  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(intervalRef.current);
            setIsRunning(false);
            // Session complete
            const completedMinutes = MODES[mode].defaultMinutes;
            if (mode === 'work') {
              setSessionsCompleted((s) => s + 1);
              logSession(completedMinutes);
              setTimeout(() => switchMode('break'), 500);
            } else {
              setTimeout(() => switchMode('work'), 500);
            }
            if (Notification.permission === 'granted') {
              new Notification('StudyMate', {
                body: mode === 'work' ? '⏰ Time for a break!' : '💪 Back to work!',
              });
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(intervalRef.current);
  }, [isRunning, mode, logSession]);

  useEffect(() => {
    document.title = isRunning ? `${formatTime(timeLeft)} — ${MODES[mode].label} | StudyMate` : 'StudyMate';
    return () => {
      document.title = 'StudyMate — AI Academic Copilot';
    };
  }, [timeLeft, isRunning, mode]);

  useEffect(() => {
    onStateChange?.({ isRunning, mode });
  }, [isRunning, mode, onStateChange]);

  const switchMode = (newMode) => {
    clearInterval(intervalRef.current);
    setIsRunning(false);
    setMode(newMode);
    setTimeLeft(MODES[newMode].defaultMinutes * 60);
  };

  const toggle = () => {
    if (!isRunning && Notification.permission === 'default') {
      Notification.requestPermission();
    }
    setIsRunning((prev) => !prev);
  };

  const reset = () => {
    clearInterval(intervalRef.current);
    setIsRunning(false);
    setTimeLeft(MODES[mode].defaultMinutes * 60);
  };

  const circumference = 2 * Math.PI * 92; // SVG circle radius = 92
  const strokeDashoffset = circumference * (1 - progress / 100);

  return (
    <div className="flex flex-col items-center gap-7 w-full select-none">
      {/* Mode Switcher: Pill-shaped sticker buttons */}
      <div className="flex gap-3">
        {Object.entries(MODES).map(([key, { label }]) => {
          const isActive = mode === key;
          return (
            <button
              key={key}
              onClick={() => switchMode(key)}
              className={`flex items-center gap-2 px-5 py-2 rounded-full text-xs sm:text-sm font-black transition-all cursor-pointer border-2 border-black ${
                isActive
                  ? 'bg-[#A3E635] text-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] -translate-y-0.5'
                  : 'bg-white text-black hover:bg-[#F0FDF4] shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'
              }`}
            >
              {key === 'work' ? (
                <Brain size={16} className="stroke-[2.5]" />
              ) : (
                <Coffee size={16} className="stroke-[2.5]" />
              )}
              {label}
            </button>
          );
        })}
      </div>

      {/* Massive Circular Progress Gauge */}
      <div className="relative flex items-center justify-center">
        <svg width="240" height="240" className="-rotate-90">
          {/* Background track */}
          <circle
            cx="120"
            cy="120"
            r="92"
            fill="none"
            stroke="#E5E7EB"
            strokeWidth="10"
          />
          {/* Progress arc */}
          <motion.circle
            cx="120"
            cy="120"
            r="92"
            fill="none"
            stroke="#A3E635"
            strokeWidth="12"
            strokeLinecap="round"
            strokeDasharray={circumference}
            animate={{ strokeDashoffset }}
            transition={{ duration: 0.5 }}
          />
        </svg>

        {/* High-Contrast Massive Timer Display with Sticker Pop Effect */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.span
            key={timeLeft}
            className="text-black font-black text-6xl sm:text-7xl font-mono tracking-tight [text-shadow:3px_3px_0px_#A3E635] leading-none"
          >
            {formatTime(timeLeft)}
          </motion.span>
          <span className="mt-3 px-3 py-1 bg-white text-black font-black text-xs uppercase tracking-wider rounded-full border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
            {MODES[mode].label} Mode
          </span>
        </div>
      </div>

      {/* Media Controls: Chunky, Bold Circular Sticker Buttons */}
      <div className="flex items-center gap-5">
        {/* Reset Button */}
        <button
          onClick={reset}
          title="Reset timer"
          className="w-12 h-12 rounded-full bg-white hover:bg-red-50 text-black border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 flex items-center justify-center transition-all cursor-pointer"
        >
          <RotateCcw size={20} className="stroke-[2.5]" />
        </button>

        {/* Chunky Vibrant Green Play/Pause Sticker Button */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={toggle}
          title={isRunning ? 'Pause session' : 'Start session'}
          className="w-20 h-20 rounded-full bg-[#A3E635] hover:bg-[#8cee2b] text-black border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] active:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center transition-all cursor-pointer"
        >
          {isRunning ? (
            <Pause size={32} className="stroke-[3] text-black" />
          ) : (
            <Play size={32} className="stroke-[3] text-black ml-1.5" />
          )}
        </motion.button>

        {/* Sessions Completed Counter */}
        <div
          title={`${sessionsCompleted} sessions completed today`}
          className="w-12 h-12 rounded-full bg-[#DCFCE7] text-black border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center font-black text-sm"
        >
          {sessionsCompleted}×
        </div>
      </div>

      {/* Interval Progress Dots */}
      <div className="flex items-center gap-2.5">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className={`w-3.5 h-3.5 rounded-full border-2 border-black transition-all ${
              i < sessionsCompleted % 4
                ? 'bg-[#A3E635] shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]'
                : 'bg-white'
            }`}
          />
        ))}
      </div>
    </div>
  );
}
