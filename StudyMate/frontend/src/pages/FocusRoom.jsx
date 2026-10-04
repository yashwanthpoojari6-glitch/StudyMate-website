// pages/FocusRoom.jsx — Neo-Brutalist Pomodoro focus chamber & ambient soundscape engine
import { useState, useRef, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import FocusTimer from '../components/FocusTimer';
import Heatmap from '../components/Heatmap';
import api from '../services/api';
import {
  Volume2, VolumeX, Wind, CloudRain, Music, Waves,
  Zap, Sliders, Sparkles, Flame, Clock
} from 'lucide-react';
import toast from 'react-hot-toast';

// ── Vector Starburst & Sparkle Accents ──────────────────────────────────────────
const VectorStarburst = ({ size = 32, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 32 32" fill="none" className={className}>
    <path
      d="M16 0 L18 12 L30 16 L18 20 L16 32 L14 20 L2 16 L14 12 Z"
      fill="#A3E635"
      stroke="#000"
      strokeWidth="2"
      strokeLinejoin="round"
    />
  </svg>
);

const VectorSparkle = ({ size = 20, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 20 20" fill="none" className={className}>
    <path
      d="M10 0 L11.5 7 L18.5 10 L11.5 13 L10 20 L8.5 13 L1.5 10 L8.5 7 Z"
      fill="#BBF7D0"
      stroke="#000"
      strokeWidth="1.5"
    />
  </svg>
);

// ── Web Audio API Soundscape Engine ───────────────────────────────────────────
const createAudioContext = () => new (window.AudioContext || window.webkitAudioContext)();

const SOUNDSCAPES = [
  { id: 'none', label: 'Silence', icon: VolumeX, description: 'No background audio' },
  { id: 'rain', label: 'Rainfall', icon: CloudRain, description: 'Soft precipitation' },
  { id: 'white', label: 'White Noise', icon: Wind, description: 'Deep concentration' },
  { id: 'waves', label: 'Ocean Waves', icon: Waves, description: 'Rhythmic rolling surf' },
  { id: 'lofi', label: 'Lo-Fi Chill', icon: Music, description: 'Warm synthesizer drone' },
];

function useSoundscape() {
  const ctxRef = useRef(null);
  const nodeRef = useRef(null);
  const gainRef = useRef(null);
  const [activeSound, setActiveSound] = useState('none');
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.4);

  const stopAudio = useCallback(() => {
    try {
      nodeRef.current?.stop?.();
      nodeRef.current?.disconnect?.();
    } catch {
      // Ignored
    }
    nodeRef.current = null;
    setIsPlaying(false);
  }, []);

  const playAudio = useCallback((id) => {
    stopAudio();
    if (id === 'none') {
      setActiveSound('none');
      setIsPlaying(false);
      return;
    }

    try {
      if (!ctxRef.current) ctxRef.current = createAudioContext();
      const ctx = ctxRef.current;
      if (ctx.state === 'suspended') ctx.resume();

      gainRef.current = ctx.createGain();
      gainRef.current.gain.value = volume;
      gainRef.current.connect(ctx.destination);

      if (id === 'white' || id === 'rain' || id === 'waves') {
        const bufferSize = ctx.sampleRate * 2;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        let lastOut = 0;

        for (let i = 0; i < bufferSize; i++) {
          const white = Math.random() * 2 - 1;
          if (id === 'white') {
            data[i] = white * 0.3;
          } else {
            lastOut = (lastOut + 0.02 * white) / 1.02;
            data[i] = lastOut * 3.2;
          }
        }

        const source = ctx.createBufferSource();
        source.buffer = buffer;
        source.loop = true;
        source.connect(gainRef.current);
        source.start();
        nodeRef.current = source;
      } else if (id === 'lofi') {
        const osc = ctx.createOscillator();
        const filter = ctx.createBiquadFilter();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(130.81, ctx.currentTime);

        filter.type = 'lowpass';
        filter.frequency.value = 650;
        filter.Q.value = 3;

        osc.connect(filter);
        filter.connect(gainRef.current);
        osc.start();

        const lfo = ctx.createOscillator();
        const lfoGain = ctx.createGain();
        lfo.frequency.value = 0.3;
        lfoGain.gain.value = 4;
        lfo.connect(lfoGain);
        lfoGain.connect(osc.frequency);
        lfo.start();

        nodeRef.current = osc;
      }

      setActiveSound(id);
      setIsPlaying(true);
    } catch {
      toast.error('Audio engine requires user interaction');
    }
  }, [stopAudio, volume]);

  useEffect(() => {
    if (gainRef.current) gainRef.current.gain.value = volume;
  }, [volume]);

  useEffect(() => {
    return () => {
      stopAudio();
      ctxRef.current?.close?.();
    };
  }, [stopAudio]);

  return { activeSound, isPlaying, volume, setVolume, playAudio, stopAudio };
}

export default function FocusRoom() {
  const [heatmapData, setHeatmapData] = useState([]);
  const [stats, setStats] = useState(null);
  const [autoTriggerSound, setAutoTriggerSound] = useState(true);

  const {
    activeSound,
    isPlaying,
    volume,
    setVolume,
    playAudio,
    stopAudio,
  } = useSoundscape();

  const fetchFocusTelemetry = useCallback(async () => {
    try {
      const [heatRes, statsRes] = await Promise.all([
        api.get('/focus/heatmap'),
        api.get('/focus/stats'),
      ]);
      setHeatmapData(heatRes.data?.data || []);
      setStats(statsRes.data?.data || null);
    } catch {
      // Graceful fallback
    }
  }, []);

  useEffect(() => {
    fetchFocusTelemetry();
  }, [fetchFocusTelemetry]);

  // Synchronize timer state changes to trigger soundscapes automatically
  const handleTimerStateChange = useCallback(({ isRunning, mode }) => {
    if (!autoTriggerSound || activeSound === 'none') return;

    if (isRunning && mode === 'work' && !isPlaying) {
      playAudio(activeSound);
    } else if ((!isRunning || mode === 'break') && isPlaying) {
      stopAudio();
    }
  }, [autoTriggerSound, activeSound, isPlaying, playAudio, stopAudio]);

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto space-y-8 pb-28 md:pb-12 relative overflow-hidden select-none">
      {/* ── Scattered Black & Green Vector Sparkles / Starbursts ─────────────── */}
      <VectorStarburst size={48} className="absolute top-4 right-10 opacity-30 pointer-events-none animate-pulse-slow hidden sm:block" />
      <VectorSparkle size={32} className="absolute top-28 left-6 opacity-35 pointer-events-none hidden md:block" />
      <VectorStarburst size={36} className="absolute bottom-40 right-8 opacity-25 pointer-events-none hidden sm:block" />
      <VectorSparkle size={28} className="absolute bottom-20 left-12 opacity-35 pointer-events-none hidden sm:block" />

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b-2 border-black pb-6">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#A3E635] flex items-center justify-center border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
              <Zap size={22} className="text-black stroke-[3]" />
            </div>
            <h1 className="text-2xl md:text-3xl font-black text-[#111827] tracking-tight">
              Focus Room
            </h1>
          </div>
          <p className="text-xs md:text-sm text-[#4B5563] mt-1.5 font-bold">
            Immersive deep work chamber with automated ambient soundscapes &amp; pomodoro flow
          </p>
        </div>

        {/* Status Indicator Sticker */}
        <div className="flex items-center gap-2.5 px-4 py-2 bg-white border-2 border-black rounded-full shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] text-xs font-black text-black">
          <span className={`w-3 h-3 rounded-full border border-black ${isPlaying ? 'bg-[#A3E635] animate-ping' : 'bg-gray-300'}`} />
          <span>{isPlaying ? 'Soundscape Active' : 'Soundscape Idle'}</span>
        </div>
      </div>

      {/* ── Main Chamber: Timer & Soundscape Engine ────────────────────────── */}
      <div className="grid lg:grid-cols-12 gap-7 items-start">
        {/* Left Column: Pomodoro Timer Panel — Stark white card with thick 2px black border & harsh drop shadow */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="lg:col-span-7 bg-white rounded-3xl p-6 sm:p-10 border-2 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] flex flex-col items-center justify-center relative overflow-hidden"
        >
          {/* Corner starburst accent inside panel */}
          <div className="absolute -top-2 -right-2 pointer-events-none">
            <VectorStarburst size={32} />
          </div>

          <FocusTimer
            onSessionComplete={fetchFocusTelemetry}
            onStateChange={handleTimerStateChange}
          />
        </motion.div>

        {/* Right Column: Soundscape Deck & Triggers — Stark white card with thick 2px black border & harsh drop shadow */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="lg:col-span-5 bg-white rounded-3xl p-6 sm:p-7 border-2 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] space-y-5 relative overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-3.5 border-b-2 border-black">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-[#A3E635] flex items-center justify-center border-2 border-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
                <Volume2 size={16} className="text-black stroke-[3]" />
              </div>
              <h2 className="text-sm font-black text-[#111827] uppercase tracking-wider">
                Ambient Soundscape
              </h2>
            </div>
            {isPlaying && (
              <div className="flex items-end gap-1 h-5 px-2 py-0.5 bg-lime-100 rounded-md border border-black">
                <span className="w-1 bg-black rounded-full animate-bounce h-3" />
                <span className="w-1 bg-black rounded-full animate-bounce delay-100 h-4" />
                <span className="w-1 bg-black rounded-full animate-bounce delay-200 h-2" />
              </div>
            )}
          </div>

          {/* Sound Choices Grid: Selectable Sticker Cards */}
          <div className="grid grid-cols-2 gap-3">
            {SOUNDSCAPES.map(({ id, label, icon: Icon, description }) => {
              const isSelected = activeSound === id;

              return (
                <button
                  key={id}
                  onClick={() => playAudio(id)}
                  className={`flex flex-col items-start p-3 rounded-2xl border-2 border-black text-left transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-[#A3E635] text-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] -translate-y-0.5 font-black'
                      : 'bg-white text-black hover:bg-[#F0FDF4] shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]'
                  }`}
                >
                  <div className="flex items-center justify-between w-full mb-2">
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center border-2 border-black ${
                        isSelected ? 'bg-white' : 'bg-[#F0FDF4]'
                      }`}
                    >
                      <Icon size={15} className="text-black stroke-[2.5]" />
                    </div>
                    {isSelected && isPlaying && (
                      <span className="w-2.5 h-2.5 rounded-full bg-black animate-ping" />
                    )}
                  </div>
                  <span className="text-xs font-black text-black">{label}</span>
                  <span className={`text-[10px] font-bold line-clamp-1 ${isSelected ? 'text-black/80' : 'text-[#6B7280]'}`}>
                    {description}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Volume Slider & Output Container */}
          {activeSound !== 'none' && (
            <div className="p-4 bg-[#F9FAFB] rounded-2xl border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] space-y-3">
              <div className="flex items-center justify-between text-xs font-black text-black">
                <span className="flex items-center gap-1.5">
                  <Sliders size={14} className="stroke-[2.5]" /> Volume Output
                </span>
                <span className="font-mono text-black bg-white px-2 py-0.5 rounded-md border-2 border-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
                  {Math.round(volume * 100)}%
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={volume}
                onChange={(e) => setVolume(parseFloat(e.target.value))}
                className="w-full accent-[#15803D] cursor-pointer h-2 bg-[#E5E7EB] rounded-lg border border-black"
              />
            </div>
          )}

          {/* Soundscape Auto-Trigger Switch */}
          <div className="flex items-center justify-between p-4 bg-[#F9FAFB] rounded-2xl border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
            <div className="pr-3">
              <p className="text-xs font-black text-black">Auto-trigger with Timer</p>
              <p className="text-[10px] font-bold text-[#4B5563] mt-0.5">
                Automatically play when focus starts, pause on break
              </p>
            </div>
            <button
              onClick={() => setAutoTriggerSound((v) => !v)}
              className={`w-12 h-6.5 rounded-full border-2 border-black transition-colors relative p-0.5 cursor-pointer flex-shrink-0 ${
                autoTriggerSound ? 'bg-[#A3E635]' : 'bg-[#E5E7EB]'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white border-2 border-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] transition-transform ${
                  autoTriggerSound ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </motion.div>
      </div>

      {/* ── Analytics & Streak Metrics ─────────────────────────────────────── */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-lime-200 rounded-2xl p-5 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] text-center relative overflow-hidden">
            <p className="text-3xl font-black font-mono text-black">
              {Math.round((stats.totalFocusMinutes || 0) / 60)}h
            </p>
            <p className="text-xs font-black text-black mt-1 uppercase tracking-wider">All-Time Deep Work</p>
            <p className="text-[10px] font-bold text-black/75 mt-0.5">{stats.totalFocusMinutes || 0} minutes logged</p>
          </div>

          <div className="bg-emerald-100 rounded-2xl p-5 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] text-center relative overflow-hidden">
            <p className="text-3xl font-black font-mono text-black">
              {((stats.weeklyMinutes || 0) / 60).toFixed(1)}h
            </p>
            <p className="text-xs font-black text-black mt-1 uppercase tracking-wider">This Week's Focus</p>
            <p className="text-[10px] font-bold text-black/75 mt-0.5">{stats.weeklySessions || 0} completed intervals</p>
          </div>

          <div className="bg-green-200 rounded-2xl p-5 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] text-center relative overflow-hidden">
            <p className="text-3xl font-black font-mono text-black">
              {stats.streak?.count || 1} 🔥
            </p>
            <p className="text-xs font-black text-black mt-1 uppercase tracking-wider">Day Streak</p>
            <p className="text-[10px] font-bold text-black/75 mt-0.5">Consistency unlocks mastery</p>
          </div>
        </div>
      )}

      {/* ── Annual Study Heatmap ───────────────────────────────────────────── */}
      <div className="bg-white rounded-3xl p-6 border-2 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
        <h2 className="text-sm font-black uppercase tracking-wider text-black mb-4 flex items-center gap-2">
          <Clock size={16} className="stroke-[3]" /> Focus History &amp; Velocity
        </h2>
        <Heatmap data={heatmapData} />
      </div>
    </div>
  );
}
