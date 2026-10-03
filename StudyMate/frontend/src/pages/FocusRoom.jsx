// pages/FocusRoom.jsx — High-performance Pomodoro timer + ambient soundscape engine
import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import FocusTimer from '../components/FocusTimer';
import Heatmap from '../components/Heatmap';
import api from '../services/api';
import {
  Volume2, VolumeX, Wind, CloudRain, Music, Waves, Coffee,
  Sparkles, Flame, CheckCircle, Zap, Sliders, Play, Pause
} from 'lucide-react';
import toast from 'react-hot-toast';

// ── Web Audio API Soundscape Engine ───────────────────────────────────────────
// Fully synthetic sound generator without requiring any external audio assets.
const createAudioContext = () => new (window.AudioContext || window.webkitAudioContext)();

const SOUNDSCAPES = [
  { id: 'none', label: 'Silence', icon: VolumeX, description: 'No background audio', type: 'none' },
  { id: 'rain', label: 'Rainfall', icon: CloudRain, description: 'Soft precipitation noise', type: 'brown' },
  { id: 'white', label: 'White Noise', icon: Wind, description: 'Static deep concentration', type: 'white' },
  { id: 'waves', label: 'Ocean Waves', icon: Waves, description: 'Rhythmic rolling surf', type: 'ocean' },
  { id: 'lofi', label: 'Lo-Fi Chill', icon: Music, description: 'Warm synthesizer drone', type: 'lofi' },
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
            // Leaky integrator produces Brown noise
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
        // Melodic ambient soundscape using dual harmonic oscillators
        const osc = ctx.createOscillator();
        const filter = ctx.createBiquadFilter();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(130.81, ctx.currentTime); // C3 chord tone

        filter.type = 'lowpass';
        filter.frequency.value = 650;
        filter.Q.value = 3;

        osc.connect(filter);
        filter.connect(gainRef.current);
        osc.start();

        // Subtle LFO vibrato
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
    <div className="p-6 md:p-8 max-w-6xl mx-auto space-y-8 pb-28 md:pb-12">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#1E293B]/80 pb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-[#F1F5F9] flex items-center gap-2.5 tracking-tight">
            <Zap size={26} className="text-[#6366F1]" />
            Focus Room
          </h1>
          <p className="text-xs md:text-sm text-[#64748B] mt-1">
            Immersive deep work chamber with automated ambient soundscapes
          </p>
        </div>

        {/* Status Indicator */}
        <div className="flex items-center gap-2 px-3.5 py-1.5 bg-[#0D1220] border border-[#1E293B] rounded-full text-xs text-[#94A3B8]">
          <span className={`w-2 h-2 rounded-full ${isPlaying ? 'bg-emerald-400 animate-ping' : 'bg-[#475569]'}`} />
          <span>{isPlaying ? 'Soundscape Active' : 'Soundscape Paused'}</span>
        </div>
      </div>

      {/* ── Main Chamber: Timer & Soundscape Engine ────────────────────────── */}
      <div className="grid lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Pomodoro Circular Timer (7 cols) */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="lg:col-span-7 glass-card p-6 md:p-8 border border-[#1E293B] flex flex-col items-center justify-center relative overflow-hidden"
        >
          <div className="absolute top-0 left-0 w-48 h-48 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
          <FocusTimer
            onSessionComplete={fetchFocusTelemetry}
            onStateChange={handleTimerStateChange}
          />
        </motion.div>

        {/* Right Column: Soundscape Deck & Triggers (5 cols) */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="lg:col-span-5 glass-card p-6 border border-[#1E293B] space-y-6"
        >
          <div className="flex items-center justify-between pb-3 border-b border-[#1E293B]">
            <div className="flex items-center gap-2">
              <Volume2 size={18} className="text-[#818CF8]" />
              <h2 className="text-sm font-bold text-[#F1F5F9] uppercase tracking-wider">
                Ambient Soundscape
              </h2>
            </div>
            {isPlaying && (
              <div className="flex items-end gap-0.5 h-4">
                <span className="w-1 bg-[#6366F1] rounded animate-bounce h-3" />
                <span className="w-1 bg-[#6366F1] rounded animate-bounce delay-100 h-4" />
                <span className="w-1 bg-[#6366F1] rounded animate-bounce delay-200 h-2" />
              </div>
            )}
          </div>

          {/* Sound Choices Grid */}
          <div className="grid grid-cols-2 gap-2.5">
            {SOUNDSCAPES.map(({ id, label, icon: Icon, description }) => {
              const isSelected = activeSound === id;

              return (
                <button
                  key={id}
                  onClick={() => playAudio(id)}
                  className={`flex flex-col items-start p-3 rounded-xl border text-left transition-all ${
                    isSelected
                      ? 'bg-[#6366F1]/15 border-[#6366F1]/50 text-[#F1F5F9] shadow-md shadow-indigo-500/10'
                      : 'bg-[#0B0F17]/70 border-[#1E293B] text-[#94A3B8] hover:border-[#334155]'
                  }`}
                >
                  <div className="flex items-center justify-between w-full mb-1.5">
                    <Icon size={16} className={isSelected ? 'text-[#818CF8]' : 'text-[#64748B]'} />
                    {isSelected && isPlaying && (
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    )}
                  </div>
                  <span className="text-xs font-bold text-[#F1F5F9]">{label}</span>
                  <span className="text-[10px] text-[#64748B] line-clamp-1">{description}</span>
                </button>
              );
            })}
          </div>

          {/* Volume Slider & Controls */}
          {activeSound !== 'none' && (
            <div className="p-3.5 bg-[#0B0F17]/80 rounded-xl border border-[#1E293B] space-y-3">
              <div className="flex items-center justify-between text-xs text-[#94A3B8]">
                <span className="flex items-center gap-1.5">
                  <Sliders size={13} className="text-[#818CF8]" /> Volume Output
                </span>
                <span className="font-mono text-[#F1F5F9] font-bold">
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
                className="w-full accent-[#6366F1] cursor-pointer"
              />
            </div>
          )}

          {/* Soundscape Auto-Trigger Switch */}
          <div className="flex items-center justify-between p-3.5 bg-[#0B0F17]/60 rounded-xl border border-[#1E293B]">
            <div>
              <p className="text-xs font-bold text-[#F1F5F9]">Auto-trigger with Timer</p>
              <p className="text-[10px] text-[#64748B] mt-0.5">
                Automatically play when focus starts, pause on break
              </p>
            </div>
            <button
              onClick={() => setAutoTriggerSound((v) => !v)}
              className={`w-11 h-6 rounded-full transition-colors relative p-1 ${
                autoTriggerSound ? 'bg-[#6366F1]' : 'bg-[#1E293B]'
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full bg-white transition-transform ${
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
          <div className="glass-card p-4 border border-[#1E293B] text-center">
            <p className="text-2xl font-bold font-mono text-[#F1F5F9]">
              {Math.round((stats.totalFocusMinutes || 0) / 60)}h
            </p>
            <p className="text-xs font-semibold text-[#818CF8] mt-1">All-Time Deep Work</p>
            <p className="text-[10px] text-[#64748B] mt-0.5">{stats.totalFocusMinutes || 0} minutes logged</p>
          </div>

          <div className="glass-card p-4 border border-[#1E293B] text-center">
            <p className="text-2xl font-bold font-mono text-[#10B981]">
              {((stats.weeklyMinutes || 0) / 60).toFixed(1)}h
            </p>
            <p className="text-xs font-semibold text-[#94A3B8] mt-1">This Week's Focus</p>
            <p className="text-[10px] text-[#64748B] mt-0.5">{stats.weeklySessions || 0} completed intervals</p>
          </div>

          <div className="glass-card p-4 border border-[#1E293B] text-center">
            <p className="text-2xl font-bold font-mono text-[#F59E0B]">
              {stats.streak?.count || 1} 🔥
            </p>
            <p className="text-xs font-semibold text-[#94A3B8] mt-1">Consecutive Day Streak</p>
            <p className="text-[10px] text-[#64748B] mt-0.5">Consistency unlocks mastery</p>
          </div>
        </div>
      )}

      {/* ── Annual Study Heatmap ───────────────────────────────────────────── */}
      <div className="glass-card p-6 border border-[#1E293B]">
        <h2 className="text-sm font-bold uppercase tracking-wider text-[#94A3B8] mb-4">
          Focus History & Velocity
        </h2>
        <Heatmap data={heatmapData} />
      </div>
    </div>
  );
}
