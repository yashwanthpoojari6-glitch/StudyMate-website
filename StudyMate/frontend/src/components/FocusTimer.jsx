// components/FocusTimer.jsx — Pomodoro timer with play/pause/reset and session logging
import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, RotateCcw, Coffee, Brain } from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';

const MODES = {
  work: { label: 'Focus', color: '#6366F1', defaultMinutes: 25 },
  break: { label: 'Break', color: '#10B981', defaultMinutes: 5 },
};

export default function FocusTimer({ onSessionComplete, onStateChange }) {
  const [mode, setMode] = useState('work');
  const [timeLeft, setTimeLeft] = useState(MODES.work.defaultMinutes * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [sessionsCompleted, setSessionsCompleted] = useState(0);
  const intervalRef = useRef(null);
  const startTimeRef = useRef(null);

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
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(intervalRef.current);
            setIsRunning(false);
            // Session complete
            const completedMinutes = MODES[mode].defaultMinutes;
            if (mode === 'work') {
              setSessionsCompleted(s => s + 1);
              logSession(completedMinutes);
              // Auto-switch to break
              setTimeout(() => switchMode('break'), 500);
            } else {
              setTimeout(() => switchMode('work'), 500);
            }
            // Browser notification
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
    return () => { document.title = 'StudyMate — AI Academic Copilot'; };
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
    // Request notification permission on first start
    if (!isRunning && Notification.permission === 'default') {
      Notification.requestPermission();
    }
    setIsRunning(prev => !prev);
  };

  const reset = () => {
    clearInterval(intervalRef.current);
    setIsRunning(false);
    setTimeLeft(MODES[mode].defaultMinutes * 60);
  };

  const circumference = 2 * Math.PI * 54; // SVG circle radius = 54
  const strokeDashoffset = circumference * (1 - progress / 100);

  return (
    <div className="flex flex-col items-center gap-8">
      {/* Mode switcher */}
      <div className="flex gap-2">
        {Object.entries(MODES).map(([key, { label }]) => (
          <button
            key={key}
            onClick={() => switchMode(key)}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
              mode === key
                ? 'bg-[#6366F1] text-white'
                : 'text-[#475569] hover:text-[#94A3B8] hover:bg-[#1E293B]'
            }`}
          >
            {key === 'work' ? <Brain size={14} /> : <Coffee size={14} />}
            {label}
          </button>
        ))}
      </div>

      {/* Circular progress timer */}
      <div className="relative flex items-center justify-center">
        <svg width="140" height="140" className="-rotate-90">
          {/* Background track */}
          <circle cx="70" cy="70" r="54" fill="none" stroke="#1E293B" strokeWidth="6" />
          {/* Progress arc */}
          <motion.circle
            cx="70" cy="70" r="54" fill="none"
            stroke={MODES[mode].color}
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={circumference}
            animate={{ strokeDashoffset }}
            transition={{ duration: 0.5 }}
          />
        </svg>

        {/* Timer display */}
        <div className="absolute flex flex-col items-center">
          <motion.span
            key={timeLeft}
            className="text-4xl font-bold font-mono text-[#F1F5F9]"
          >
            {formatTime(timeLeft)}
          </motion.span>
          <span className="text-xs text-[#475569] mt-1 uppercase tracking-wider">{MODES[mode].label}</span>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-4">
        <button onClick={reset} className="w-10 h-10 rounded-full bg-[#1E293B] hover:bg-[#334155] flex items-center justify-center text-[#94A3B8] hover:text-[#F1F5F9] transition-all">
          <RotateCcw size={16} />
        </button>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={toggle}
          className="w-16 h-16 rounded-full flex items-center justify-center text-white text-xl font-bold shadow-lg transition-all"
          style={{
            background: `linear-gradient(135deg, ${MODES[mode].color}, ${MODES[mode].color}aa)`,
            boxShadow: isRunning ? `0 0 30px ${MODES[mode].color}50` : 'none',
          }}
        >
          {isRunning ? <Pause size={24} /> : <Play size={24} className="ml-1" />}
        </motion.button>

        {/* Sessions completed badge */}
        <div className="w-10 h-10 rounded-full bg-[#1E293B] flex items-center justify-center">
          <span className="text-xs font-bold text-[#6366F1]">{sessionsCompleted}×</span>
        </div>
      </div>

      {/* Session dots */}
      <div className="flex gap-2">
        {[...Array(4)].map((_, i) => (
          <div key={i} className={`w-2 h-2 rounded-full transition-all ${
            i < sessionsCompleted % 4 ? 'bg-[#6366F1]' : 'bg-[#1E293B]'
          }`} />
        ))}
      </div>
    </div>
  );
}
