// pages/Dashboard.jsx — Flagship executive study dashboard
import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import {
  Flame, Clock, CheckSquare, BookOpen, ArrowRight, Calendar,
  Plus, Zap, FileText, Layers, CheckCircle2, AlertCircle, X,
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

const StatCard = ({ icon: Icon, label, value, color, suffix = '', trend }) => (
  <motion.div
    whileHover={{ y: -3, transition: { duration: 0.2 } }}
    className="glass-card p-5 relative overflow-hidden group border border-[#1E293B] hover:border-[#334155] transition-all"
  >
    <div
      className="absolute top-0 right-0 w-24 h-24 rounded-full blur-2xl opacity-10 pointer-events-none transition-opacity group-hover:opacity-25"
      style={{ background: color }}
    />
    <div className="flex items-center justify-between mb-3 relative z-10">
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center shadow-inner"
        style={{ background: `${color}18`, border: `1px solid ${color}30` }}
      >
        <Icon size={19} style={{ color }} />
      </div>
      {trend && (
        <span className="text-[11px] font-medium text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full flex items-center gap-1">
          <TrendingUp size={11} /> {trend}
        </span>
      )}
    </div>
    <div className="relative z-10">
      <p className="text-2xl lg:text-3xl font-bold font-mono text-[#F1F5F9] tracking-tight">
        {value}
        {suffix && <span className="text-sm font-normal text-[#64748B] ml-1">{suffix}</span>}
      </p>
      <p className="text-xs font-medium text-[#94A3B8] mt-1">{label}</p>
    </div>
  </motion.div>
);

// Quick Task creation modal
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
      <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="glass-card w-full max-w-md z-10 p-6 border border-[#1E293B] shadow-2xl"
      >
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#6366F1]/20 flex items-center justify-center text-[#818CF8]">
              <Plus size={18} />
            </div>
            <h2 className="text-base font-bold text-[#F1F5F9]">Quick Add Task</h2>
          </div>
          <button onClick={onClose} className="text-[#64748B] hover:text-[#94A3B8]">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-[#94A3B8] mb-1">Task Title *</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Finish Calculus Problem Set 4"
              className="form-input text-sm"
              autoFocus
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-[#94A3B8] mb-1">Priority</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="form-input text-sm"
              >
                <option value="chill">Chill (Low)</option>
                <option value="important">Important (Medium)</option>
                <option value="urgent">Urgent (High)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-[#94A3B8] mb-1">Due Date</label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="form-input text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-[#94A3B8] mb-1">Course / Subject</label>
            <select
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="form-input text-sm"
            >
              <option value="">No subject linked</option>
              {subjects.map((s) => (
                <option key={s._id} value={s._id}>
                  {s.title}
                </option>
              ))}
            </select>
          </div>

          <div className="flex gap-2.5 pt-2">
            <button type="button" onClick={onClose} className="btn-ghost flex-1 justify-center text-xs">
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="btn-primary flex-1 justify-center text-xs"
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
      // Fallback grace
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

  const quickActions = [
    {
      title: 'Focus Timer',
      desc: '25m Pomodoro session',
      icon: Zap,
      color: '#6366F1',
      bgGlow: 'from-indigo-500/15 to-purple-500/5',
      action: () => navigate('/focus'),
    },
    {
      title: 'New Note',
      desc: 'Markdown + AI Copilot',
      icon: FileText,
      color: '#38BDF8',
      bgGlow: 'from-sky-500/15 to-blue-500/5',
      action: () => navigate('/notes'),
    },
    {
      title: 'Quick Task',
      desc: 'Add to Kanban board',
      icon: Plus,
      color: '#10B981',
      bgGlow: 'from-emerald-500/15 to-teal-500/5',
      action: () => setShowQuickTask(true),
    },
    {
      title: 'Flashcards',
      desc: 'Spaced repetition deck',
      icon: Layers,
      color: '#F59E0B',
      bgGlow: 'from-amber-500/15 to-yellow-500/5',
      action: () => navigate('/flashcards'),
    },
  ];

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8 pb-28 md:pb-12">
      {/* ── Greeting Header ─────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#1E293B]/70 pb-6"
      >
        <div>
          <div className="flex items-center gap-2">
            <span className="text-2xl">{greeting.emoji}</span>
            <h1 className="text-2xl md:text-3xl font-extrabold text-[#F1F5F9] tracking-tight">
              {greeting.text}, {user?.name?.split(' ')[0] || 'Scholar'}!
            </h1>
          </div>
          <p className="text-xs md:text-sm text-[#64748B] mt-1.5 flex items-center gap-2">
            <Calendar size={13} className="text-[#475569]" />
            {new Date().toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
            <span className="text-[#334155]">•</span>
            <span className="text-[#818CF8] font-medium flex items-center gap-1">
              <Sparkles size={12} /> Academic Copilot Active
            </span>
          </p>
        </div>

        {/* Streak & Level Badges */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3.5 py-1.5 bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/25 rounded-full shadow-sm">
            <Flame size={16} className="text-amber-400 animate-pulse" />
            <span className="text-amber-400 font-bold font-mono text-sm">
              {stats?.streak?.count || user?.streak?.count || 1}
            </span>
            <span className="text-amber-300/80 text-xs font-medium">Day Streak</span>
          </div>

          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-[#1E293B]/60 border border-[#334155]/60 rounded-full text-xs text-[#94A3B8]">
            <Award size={14} className="text-[#6366F1]" />
            <span>Scholar Level {Math.floor((stats?.totalFocusMinutes || 0) / 120) + 1}</span>
          </div>
        </div>
      </motion.div>

      {/* ── Quick Actions Row ──────────────────────────────────────────────── */}
      <div>
        <div className="flex items-center justify-between mb-3 px-1">
          <h2 className="text-xs font-bold uppercase tracking-wider text-[#64748B]">
            Quick Launch Actions
          </h2>
          <span className="text-[11px] text-[#475569]">Direct Shortcuts</span>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
          {quickActions.map((qa, idx) => (
            <motion.button
              key={qa.title}
              onClick={qa.action}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              className={`glass-card p-4 text-left border border-[#1E293B] hover:border-[#334155] bg-gradient-to-br ${qa.bgGlow} transition-all relative overflow-hidden group`}
            >
              <div className="flex items-center justify-between mb-2">
                <div
                  className="w-9 h-9 rounded-lg flex items-center justify-center transition-transform group-hover:scale-110"
                  style={{ background: `${qa.color}25` }}
                >
                  <qa.icon size={18} style={{ color: qa.color }} />
                </div>
                <ArrowRight size={14} className="text-[#475569] group-hover:text-[#F1F5F9] group-hover:translate-x-1 transition-all" />
              </div>
              <p className="text-sm font-bold text-[#F1F5F9] group-hover:text-white">{qa.title}</p>
              <p className="text-[11px] text-[#64748B] mt-0.5">{qa.desc}</p>
            </motion.button>
          ))}
        </div>
      </div>

      {/* ── Stats Grid ──────────────────────────────────────────────────────── */}
      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="skeleton h-28 rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard
            icon={Flame}
            label="Current Streak"
            value={stats?.streak?.count || 1}
            color="#F59E0B"
            suffix="days"
            trend="Active"
          />
          <StatCard
            icon={Clock}
            label="Today's Focus Time"
            value={todayMinutes}
            color="#6366F1"
            suffix="min"
            trend={todayMinutes > 0 ? '+Today' : undefined}
          />
          <StatCard
            icon={Clock}
            label="Weekly Deep Work"
            value={((stats?.weeklyMinutes || 0) / 60).toFixed(1)}
            color="#10B981"
            suffix="hrs"
          />
          <StatCard
            icon={CheckSquare}
            label="Tasks Completed"
            value={stats?.completedTasks || 0}
            color="#38BDF8"
            suffix="done"
          />
        </div>
      )}

      {/* ── Annual Activity Heatmap ────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="glass-card p-6 border border-[#1E293B]"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
          <h2 className="text-base font-bold text-[#F1F5F9] flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#6366F1] shadow-lg shadow-indigo-500/50" />
            Study Activity Heatmap
            <span className="text-xs text-[#64748B] font-normal font-sans">(Past 365 Days)</span>
          </h2>
          <Link
            to="/focus"
            className="text-xs font-semibold text-[#818CF8] hover:text-[#A5B4FC] flex items-center gap-1 transition-colors"
          >
            Launch Focus Session <ArrowRight size={13} />
          </Link>
        </div>

        {loading ? (
          <div className="skeleton h-32 rounded-lg" />
        ) : (
          <Heatmap data={heatmapData} />
        )}
      </motion.div>

      {/* ── Bottom Section: Exams & Pending Tasks ──────────────────────────── */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Upcoming Exams Countdown */}
        <motion.div
          initial={{ opacity: 0, x: -16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-card p-6 border border-[#1E293B] flex flex-col"
        >
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#1E293B]">
            <h2 className="text-base font-bold text-[#F1F5F9] flex items-center gap-2">
              <Calendar size={17} className="text-[#F59E0B]" />
              Upcoming Exam Dates
            </h2>
            <Link
              to="/subjects"
              className="text-xs text-[#818CF8] hover:underline flex items-center gap-1 font-medium"
            >
              All Subjects <ArrowRight size={13} />
            </Link>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[...Array(2)].map((_, i) => (
                <div key={i} className="skeleton h-16 rounded-lg" />
              ))}
            </div>
          ) : upcomingExams.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center py-8 text-center">
              <BookOpen size={36} className="text-[#1E293B] mb-2.5" />
              <p className="text-sm font-medium text-[#64748B]">No exams currently scheduled</p>
              <Link
                to="/subjects"
                className="btn-ghost text-xs mt-3 inline-flex items-center gap-1.5 py-1.5 px-3"
              >
                <Plus size={13} /> Add Course & Exam Date
              </Link>
            </div>
          ) : (
            <div className="space-y-3 flex-1">
              {upcomingExams.map((subject) => {
                const days = subject.daysUntilExam;
                const urgencyColor =
                  days <= 5 ? '#EF4444' : days <= 14 ? '#F59E0B' : '#10B981';

                return (
                  <div
                    key={subject._id}
                    className="flex items-center gap-3.5 p-3.5 bg-[#0B0F17]/70 rounded-xl border border-[#1E293B] hover:border-[#334155] transition-all"
                  >
                    <div
                      className="w-2.5 h-12 rounded-full flex-shrink-0"
                      style={{ background: subject.colorTag || '#6366F1' }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-bold text-[#F1F5F9] truncate">
                          {subject.title}
                        </p>
                        {subject.code && (
                          <span className="text-[10px] font-mono text-[#64748B] bg-[#1E293B] px-1.5 py-0.5 rounded">
                            {subject.code}
                          </span>
                        )}
                      </div>
                      <div className="mt-2 bg-[#1E293B] rounded-full h-1.5 overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${subject.progress || 0}%`,
                            background: subject.colorTag || '#6366F1',
                          }}
                        />
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-[#64748B] mt-1.5">
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
                      <p className="text-xl font-extrabold font-mono" style={{ color: urgencyColor }}>
                        {days === 0 ? 'Today!' : days}
                      </p>
                      <p className="text-[10px] uppercase font-bold text-[#475569]">
                        {days === 0 ? 'Exam' : 'Days left'}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </motion.div>

        {/* Pending Tasks with Quick Complete */}
        <motion.div
          initial={{ opacity: 0, x: 16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.25 }}
          className="glass-card p-6 border border-[#1E293B] flex flex-col"
        >
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#1E293B]">
            <h2 className="text-base font-bold text-[#F1F5F9] flex items-center gap-2">
              <CheckSquare size={17} className="text-[#10B981]" />
              Active Priority Tasks
            </h2>
            <Link
              to="/tasks"
              className="text-xs text-[#818CF8] hover:underline flex items-center gap-1 font-medium"
            >
              Task Board <ArrowRight size={13} />
            </Link>
          </div>

          {loading ? (
            <div className="space-y-2.5">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="skeleton h-12 rounded-lg" />
              ))}
            </div>
          ) : assignments.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center py-8 text-center">
              <CheckCircle2 size={36} className="text-emerald-500/40 mb-2.5" />
              <p className="text-sm font-semibold text-[#F1F5F9]">All caught up!</p>
              <p className="text-xs text-[#64748B] mt-1">No pending tasks on your plate</p>
              <button
                onClick={() => setShowQuickTask(true)}
                className="btn-ghost text-xs mt-3 inline-flex items-center gap-1.5 py-1.5 px-3"
              >
                <Plus size={13} /> Create a Task
              </button>
            </div>
          ) : (
            <div className="space-y-2 flex-1">
              {assignments.map((task) => {
                const isUrgent = task.priority === 'urgent';
                const isImportant = task.priority === 'important';

                return (
                  <div
                    key={task._id}
                    className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl bg-[#0B0F17]/70 border transition-all ${
                      isUrgent
                        ? 'border-red-500/30 bg-red-950/10'
                        : 'border-[#1E293B] hover:border-[#334155]'
                    }`}
                  >
                    <button
                      onClick={() => handleCompleteTask(task._id)}
                      title="Mark task done"
                      className="w-5 h-5 rounded-md border border-[#334155] hover:border-emerald-400 hover:bg-emerald-500/10 flex items-center justify-center text-transparent hover:text-emerald-400 transition-colors flex-shrink-0"
                    >
                      <CheckCircle2 size={13} />
                    </button>

                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[#E2E8F0] truncate">
                        {task.title}
                      </p>
                      {task.dueDate && (
                        <p className="text-[11px] text-[#64748B] flex items-center gap-1 mt-0.5">
                          <Calendar size={10} />
                          Due{' '}
                          {new Date(task.dueDate).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                          })}
                        </p>
                      )}
                    </div>

                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full flex-shrink-0 ${
                        isUrgent
                          ? 'bg-red-500/15 text-red-400 border border-red-500/30'
                          : isImportant
                          ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                          : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
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
                  className="text-xs text-[#818CF8] hover:text-[#A5B4FC] font-medium flex items-center gap-1"
                >
                  <Plus size={13} /> Add another task
                </button>
                <Link to="/tasks" className="text-xs text-[#64748B] hover:text-[#94A3B8]">
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
