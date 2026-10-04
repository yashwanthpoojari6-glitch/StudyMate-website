// pages/Dashboard.jsx — Flagship executive study dashboard
import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import {
  Flame, Clock, CheckSquare, BookOpen, ArrowRight, Calendar,
  Plus, Zap, FileText, Layers, X,
  TrendingUp, Sparkles, Award
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import Heatmap from '../components/Heatmap';
import toast from 'react-hot-toast';

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 5) return { text: 'Late night grinding', emoji: '🦉' };
  if (hour < 12) return { text: 'Good morning', emoji: '☀️' };
  if (hour < 17) return { text: 'Good afternoon', emoji: '⚡' };
  if (hour < 22) return { text: 'Good evening', emoji: '🌙' };
  return { text: 'Burning the midnight oil', emoji: '✨' };
};

// Neo-brutalist Stat Card with vibrant pastel/mint/lime green background, 2px black border, and brutalist drop shadows
const StatCard = ({ icon: Icon, label, value, bgColor = 'bg-lime-200', suffix = '', trend }) => (
  <motion.div
    whileHover={{ y: -3, transition: { duration: 0.15 } }}
    className={`${bgColor} rounded-2xl p-5 relative overflow-hidden border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all`}
  >
    {/* Decorative 8-point vector starburst accent */}
    <svg className="absolute -top-1 -right-1 opacity-20 pointer-events-none" width="38" height="38" viewBox="0 0 36 36">
      <path
        d="M18 0 L20 14 L36 18 L20 22 L18 36 L16 22 L0 18 L16 14 Z"
        fill="#000000"
        stroke="#000000"
        strokeWidth="1.5"
      />
    </svg>

    <div className="flex items-center justify-between mb-3.5 relative z-10">
      <div
        className="w-11 h-11 rounded-xl bg-white flex items-center justify-center border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
      >
        <Icon size={20} className="stroke-[2.5] text-black" />
      </div>
      {trend && (
        <span className="text-[11px] font-black text-black bg-white px-2.5 py-1 rounded-full flex items-center gap-1 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
          <TrendingUp size={12} className="stroke-[3]" /> {trend}
        </span>
      )}
    </div>

    <p className="text-3xl font-black text-black tracking-tight">
      {value}
      {suffix && <span className="text-sm font-black text-black/70 ml-1.5">{suffix}</span>}
    </p>
    <p className="text-xs font-black text-black/80 mt-1 uppercase tracking-wider">{label}</p>
  </motion.div>
);

// Quick Task Modal
const QuickTaskModal = ({ subjects, onClose, onCreated }) => {
  const [title, setTitle] = useState('');
  const [priority, setPriority] = useState('important');
  const [dueDate, setDueDate] = useState('');
  const [subject, setSubject] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error('Task title is required');
      return;
    }
    setSubmitting(true);
    try {
      const res = await api.post('/assignments', {
        title,
        priority,
        dueDate: dueDate || undefined,
        subject: subject || undefined,
      });
      toast.success('Task created successfully! 🎯');
      onCreated(res.data.data);
      onClose();
    } catch {
      toast.error('Failed to create task');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/45 backdrop-blur-xs" onClick={onClose} />
      <motion.div
        initial={{ scale: 0.94, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.94, opacity: 0 }}
        className="bg-white rounded-3xl w-full max-w-md z-10 p-6 sm:p-7 border-2 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] relative"
      >
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-[#A3E635] flex items-center justify-center border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
              <Plus size={20} className="text-black stroke-[3]" />
            </div>
            <h2 className="text-lg font-black text-[#111827]">Quick Add Task</h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white hover:bg-red-50 flex items-center justify-center border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-colors cursor-pointer"
          >
            <X size={16} className="text-black stroke-[2.5]" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-black text-[#374151] mb-1.5 uppercase tracking-wider">
              Task Title *
            </label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Finish Calculus Problem Set 4"
              className="form-input text-sm font-semibold"
              autoFocus
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-black text-[#374151] mb-1.5 uppercase tracking-wider">
                Priority
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="form-input text-sm font-bold"
              >
                <option value="chill">Chill (Low)</option>
                <option value="important">Important (Med)</option>
                <option value="urgent">Urgent (High)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-black text-[#374151] mb-1.5 uppercase tracking-wider">
                Due Date
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="form-input text-sm font-semibold"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-black text-[#374151] mb-1.5 uppercase tracking-wider">
              Course / Subject
            </label>
            <select
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="form-input text-sm font-semibold"
            >
              <option value="">No subject linked</option>
              {subjects.map((s) => (
                <option key={s._id} value={s._id}>
                  {s.title}
                </option>
              ))}
            </select>
          </div>

          <div className="flex gap-3 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="btn-ghost flex-1 justify-center text-xs py-2.5 font-black"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="btn-primary flex-1 justify-center text-xs py-2.5 font-black"
            >
              {submitting ? 'Creating...' : 'Create Task'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const greeting = getGreeting();

  const [heatmapData, setHeatmapData] = useState([]);
  const [stats, setStats] = useState(null);
  const [subjects, setSubjects] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showQuickTask, setShowQuickTask] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [heatmapRes, statsRes, subjectsRes, assignmentsRes] = await Promise.all([
        api.get('/focus/heatmap'),
        api.get('/focus/stats'),
        api.get('/subjects'),
        api.get('/assignments?status=todo'),
      ]);
      setHeatmapData(heatmapRes.data?.data || []);
      setStats(statsRes.data?.data || null);
      setSubjects(subjectsRes.data?.data || []);
      setAssignments((assignmentsRes.data?.data || []).slice(0, 5));
    } catch {
      // Graceful fallback
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleCompleteTask = async (taskId) => {
    try {
      await api.patch(`/assignments/${taskId}/status`, { status: 'completed' });
      setAssignments((prev) => prev.filter((t) => t._id !== taskId));
      setStats((prev) => (prev ? { ...prev, completedTasks: (prev.completedTasks || 0) + 1 } : prev));
      toast.success('Task completed! Keep the momentum going 🎉');
    } catch {
      toast.error('Failed to update task');
    }
  };

  const todayKey = new Date().toISOString().split('T')[0];
  const todayMinutes = heatmapData.find((d) => d.date === todayKey)?.totalMinutes || 0;
  const upcomingExams = subjects.filter((s) => s.examDate).slice(0, 3);

  // Restored vibrant pastel/mint/lime green background classes
  const quickActions = [
    {
      title: 'Focus Timer',
      desc: '25m Pomodoro session',
      icon: Zap,
      action: () => navigate('/focus'),
      bgClass: 'bg-lime-200',
      badge: 'Deep Work',
    },
    {
      title: 'New Note',
      desc: 'Markdown + AI Copilot',
      icon: FileText,
      action: () => navigate('/notes'),
      bgClass: 'bg-emerald-100',
      badge: 'Editor',
    },
    {
      title: 'Quick Task',
      desc: 'Add to Kanban board',
      icon: Plus,
      action: () => setShowQuickTask(true),
      bgClass: 'bg-green-200',
      badge: 'Action',
    },
    {
      title: 'Flashcards',
      desc: 'Spaced repetition deck',
      icon: Layers,
      action: () => navigate('/flashcards'),
      bgClass: 'bg-teal-100',
      badge: 'Recall',
    },
  ];

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8 pb-28 md:pb-12">
      {/* Header Banner */}
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b-2 border-black"
      >
        <div>
          <div className="flex items-center gap-2.5">
            <span className="text-3xl">{greeting.emoji}</span>
            <h1 className="text-2xl md:text-3xl font-black text-[#111827] tracking-tight">
              {greeting.text}, {user?.name?.split(' ')[0] || 'Scholar'}!
            </h1>
          </div>
          <p className="text-xs md:text-sm text-[#4B5563] mt-1.5 flex items-center gap-2 font-bold">
            <Calendar size={14} className="text-black stroke-[2.5]" />
            {new Date().toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
            <span className="text-black font-black">•</span>
            <span className="text-black bg-[#A3E635] px-2.5 py-0.5 rounded-full border-2 border-black text-xs font-black flex items-center gap-1 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
              <Sparkles size={11} className="stroke-[2.5]" /> Academic Copilot Active
            </span>
          </p>
        </div>

        {/* Gamified Badges */}
        <div className="flex items-center gap-3">
          <div className="token-badge">
            <Flame size={18} className="text-[#F59E0B] stroke-[2.5]" />
            <span className="font-black text-base">{stats?.streak?.count || user?.streak?.count || 1}</span>
            <span className="font-bold text-[#4B5563] text-xs">Day Streak</span>
          </div>
          <div className="token-badge hidden sm:flex">
            <Award size={16} className="text-emerald-700 stroke-[2.5]" />
            <span className="font-black text-xs">Level {Math.floor((stats?.totalFocusMinutes || 0) / 120) + 1}</span>
          </div>
        </div>
      </motion.div>

      {/* Quick Launch Action Cards — Vibrant pastel/mint/lime green backgrounds with 2px solid black borders & brutalist drop shadows */}
      <div>
        <div className="flex items-center justify-between mb-3.5 px-1">
          <h2 className="text-xs font-black uppercase tracking-widest text-[#111827] flex items-center gap-2">
            <svg width="15" height="15" viewBox="0 0 15 15">
              <path
                d="M7.5 0 L8.5 6.5 L15 7.5 L8.5 8.5 L7.5 15 L6.5 8.5 L0 7.5 L6.5 6.5 Z"
                fill="#A3E635"
                stroke="#000"
                strokeWidth="1"
              />
            </svg>
            Quick Launch Actions
          </h2>
          <span className="text-[11px] font-black text-[#6B7280] uppercase tracking-wider">
            Direct Shortcuts
          </span>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map((qa, idx) => (
            <motion.button
              key={qa.title}
              onClick={qa.action}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              whileHover={{ y: -3 }}
              whileTap={{ scale: 0.98 }}
              className={`${qa.bgClass} rounded-2xl p-4 text-left cursor-pointer border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all relative overflow-hidden group`}
            >
              {/* Corner Starburst Vector Sticker */}
              <svg className="absolute -top-1 -right-1 opacity-20 pointer-events-none" width="34" height="34" viewBox="0 0 34 34">
                <path
                  d="M17 0 L19 13 L34 17 L19 21 L17 34 L15 21 L0 17 L15 13 Z"
                  fill="#000"
                  stroke="#000"
                  strokeWidth="1"
                />
              </svg>

              <div className="flex items-center justify-between mb-3 relative z-10">
                <div
                  className="w-10 h-10 rounded-xl bg-white flex items-center justify-center border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                >
                  <qa.icon size={19} className="text-black stroke-[2.5]" />
                </div>
                <span className="text-[10px] font-black bg-white text-black px-2 py-0.5 rounded-md border-2 border-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
                  {qa.badge}
                </span>
              </div>

              <p className="text-sm font-black text-black">{qa.title}</p>
              <p className="text-[11px] font-bold text-black/75 mt-0.5 line-clamp-1">{qa.desc}</p>

              <div className="flex justify-end mt-3">
                <div className="w-7 h-7 rounded-lg bg-white border-2 border-black flex items-center justify-center transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] group-hover:translate-x-0.5">
                  <ArrowRight size={14} className="text-black stroke-[3]" />
                </div>
              </div>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Stats Grid — Restored vibrant pastel/mint/lime green background colors with 2px solid black borders & drop shadows */}
      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="skeleton h-28 rounded-2xl" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard
            icon={Flame}
            label="Current Streak"
            value={stats?.streak?.count || 1}
            bgColor="bg-lime-200"
            suffix="days"
            trend="Active"
          />
          <StatCard
            icon={Clock}
            label="Today's Focus Time"
            value={todayMinutes}
            bgColor="bg-emerald-100"
            suffix="min"
            trend={todayMinutes > 0 ? '+Today' : undefined}
          />
          <StatCard
            icon={Clock}
            label="Weekly Deep Work"
            value={((stats?.weeklyMinutes || 0) / 60).toFixed(1)}
            bgColor="bg-green-200"
            suffix="hrs"
          />
          <StatCard
            icon={CheckSquare}
            label="Tasks Completed"
            value={stats?.completedTasks || 0}
            bgColor="bg-lime-300"
            suffix="done"
          />
        </div>
      )}

      {/* Heatmap Activity Container */}
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="bg-white rounded-2xl p-6 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
          <h2 className="text-base font-black text-[#111827] flex items-center gap-2.5">
            <span
              className="w-3.5 h-3.5 rounded-full bg-[#A3E635] inline-block border-2 border-black shadow-[1px_1px_0px_#000]"
            />
            Study Activity Heatmap
            <span className="text-xs text-[#6B7280] font-bold">(Past 365 Days)</span>
          </h2>
          <Link
            to="/focus"
            className="text-xs font-black text-black bg-[#A3E635] hover:bg-[#8cee2b] px-3.5 py-1.5 rounded-xl border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex items-center gap-1.5 transition-all cursor-pointer active:translate-x-0.5 active:translate-y-0.5"
          >
            Launch Focus Session <ArrowRight size={13} className="stroke-[3]" />
          </Link>
        </div>
        {loading ? <div className="skeleton h-32 rounded-xl" /> : <Heatmap data={heatmapData} />}
      </motion.div>

      {/* Exams & Priority Tasks Grid */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Upcoming Exams Card */}
        <motion.div
          initial={{ opacity: 0, x: -16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl p-6 flex flex-col border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
        >
          <div className="flex items-center justify-between mb-4 pb-3 border-b-2 border-black">
            <h2 className="text-base font-black text-[#111827] flex items-center gap-2">
              <Calendar size={18} className="text-[#F59E0B] stroke-[2.5]" /> Upcoming Exam Dates
            </h2>
            <Link
              to="/subjects"
              className="text-xs text-[#15803D] hover:underline flex items-center gap-1 font-black"
            >
              All Subjects <ArrowRight size={13} className="stroke-[3]" />
            </Link>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[...Array(2)].map((_, i) => (
                <div key={i} className="skeleton h-16 rounded-xl" />
              ))}
            </div>
          ) : upcomingExams.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center py-8 text-center">
              <div className="w-12 h-12 rounded-2xl bg-[#F0FDF4] border-2 border-black flex items-center justify-center mb-3 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                <BookOpen size={24} className="text-[#15803D] stroke-[2.5]" />
              </div>
              <p className="text-sm font-black text-[#111827]">No exams currently scheduled</p>
              <p className="text-xs font-bold text-[#6B7280] mt-1">Keep courses up to date to track countdowns</p>
              <Link
                to="/subjects"
                className="btn-ghost text-xs mt-3.5 inline-flex items-center gap-1.5 py-1.5 px-3.5"
              >
                <Plus size={13} className="stroke-[3]" /> Add Course &amp; Exam Date
              </Link>
            </div>
          ) : (
            <div className="space-y-3 flex-1">
              {upcomingExams.map((subject) => {
                const days = subject.daysUntilExam;
                const urgencyColor = days <= 5 ? '#EF4444' : days <= 14 ? '#F59E0B' : '#15803D';
                return (
                  <div
                    key={subject._id}
                    className="flex items-center gap-3.5 p-3.5 rounded-xl bg-white hover:bg-[#F0FDF4] transition-all border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                  >
                    <div
                      className="w-3 h-12 rounded-full flex-shrink-0 border-2 border-black"
                      style={{ background: subject.colorTag || '#A3E635' }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-black text-[#111827] truncate">{subject.title}</p>
                        {subject.code && (
                          <span className="text-[10px] font-black text-[#111827] bg-[#F0FDF4] px-1.5 py-0.5 rounded border border-black">
                            {subject.code}
                          </span>
                        )}
                      </div>
                      <div className="mt-2 bg-[#E5E7EB] rounded-full h-2 overflow-hidden border border-black">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${subject.progress || 0}%`,
                            background: subject.colorTag || '#A3E635',
                          }}
                        />
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-[#4B5563] mt-1.5 font-bold">
                        <span>{subject.progress || 0}% Syllabus completed</span>
                        <span>
                          {new Date(subject.examDate).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                          })}
                        </span>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0 pl-2">
                      <p className="text-xl font-black" style={{ color: urgencyColor }}>
                        {days === 0 ? 'Today!' : days}
                      </p>
                      <p className="text-[10px] uppercase font-black text-[#6B7280]">
                        {days === 0 ? 'Exam' : 'Days left'}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </motion.div>

        {/* Priority Active Tasks Card */}
        <motion.div
          initial={{ opacity: 0, x: 16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.25 }}
          className="bg-white rounded-2xl p-6 flex flex-col border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
        >
          <div className="flex items-center justify-between mb-4 pb-3 border-b-2 border-black">
            <h2 className="text-base font-black text-[#111827] flex items-center gap-2">
              <CheckSquare size={18} className="text-[#15803D] stroke-[2.5]" /> Active Priority Tasks
            </h2>
            <Link
              to="/tasks"
              className="text-xs text-[#15803D] hover:underline flex items-center gap-1 font-black"
            >
              Task Board <ArrowRight size={13} className="stroke-[3]" />
            </Link>
          </div>

          {loading ? (
            <div className="space-y-2.5">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="skeleton h-12 rounded-xl" />
              ))}
            </div>
          ) : assignments.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center py-8 text-center">
              <div className="w-12 h-12 rounded-2xl bg-[#A3E635] border-2 border-black flex items-center justify-center mb-3 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                <CheckSquare size={24} className="text-black stroke-[2.5]" />
              </div>
              <p className="text-sm font-black text-[#111827]">All caught up!</p>
              <p className="text-xs font-bold text-[#6B7280] mt-1">No pending tasks on your plate</p>
              <button
                onClick={() => setShowQuickTask(true)}
                className="btn-ghost text-xs mt-3.5 inline-flex items-center gap-1.5 py-1.5 px-3.5"
              >
                <Plus size={13} className="stroke-[3]" /> Create a Task
              </button>
            </div>
          ) : (
            <div className="space-y-2.5 flex-1">
              {assignments.map((task) => {
                const isUrgent = task.priority === 'urgent';
                const isImportant = task.priority === 'important';
                return (
                  <div
                    key={task._id}
                    className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all border-2 ${
                      isUrgent
                        ? 'border-red-500 bg-red-50 shadow-[2px_2px_0px_#EF4444]'
                        : 'border-black bg-white hover:bg-[#F0FDF4] shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'
                    }`}
                  >
                    <button
                      onClick={() => handleCompleteTask(task._id)}
                      title="Mark task done"
                      className="w-5 h-5 rounded-md flex items-center justify-center text-transparent hover:text-black hover:bg-[#A3E635] border-2 border-black transition-colors flex-shrink-0 cursor-pointer"
                    >
                      <CheckSquare size={13} className="stroke-[3]" />
                    </button>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-black text-[#111827] truncate">{task.title}</p>
                      {task.dueDate && (
                        <p className="text-[11px] text-[#4B5563] flex items-center gap-1 mt-0.5 font-bold">
                          <Calendar size={11} />
                          Due{' '}
                          {new Date(task.dueDate).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                          })}
                        </p>
                      )}
                    </div>
                    <span
                      className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full flex-shrink-0 border-2 border-black ${
                        isUrgent
                          ? 'bg-red-200 text-red-900 shadow-[1px_1px_0px_#000]'
                          : isImportant
                          ? 'bg-amber-200 text-amber-900 shadow-[1px_1px_0px_#000]'
                          : 'bg-[#A3E635] text-black shadow-[1px_1px_0px_#000]'
                      }`}
                    >
                      {task.priority}
                    </span>
                  </div>
                );
              })}
              <div className="pt-2 flex items-center justify-between">
                <button
                  onClick={() => setShowQuickTask(true)}
                  className="text-xs text-[#15803D] hover:text-black font-black flex items-center gap-1 cursor-pointer"
                >
                  <Plus size={13} className="stroke-[3]" /> Add another task
                </button>
                <Link
                  to="/tasks"
                  className="text-xs text-[#6B7280] hover:text-black font-bold"
                >
                  Open full Kanban →
                </Link>
              </div>
            </div>
          )}
        </motion.div>
      </div>

      {/* Quick Task Modal */}
      <AnimatePresence>
        {showQuickTask && (
          <QuickTaskModal
            subjects={subjects}
            onClose={() => setShowQuickTask(false)}
            onCreated={(newTask) => setAssignments((prev) => [newTask, ...prev].slice(0, 5))}
          />
        )}
      </AnimatePresence>
    </div>
  );
}