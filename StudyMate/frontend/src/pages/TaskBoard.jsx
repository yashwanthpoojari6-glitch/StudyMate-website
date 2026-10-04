// pages/TaskBoard.jsx — Neo-Brutalist Kanban task board with sticker aesthetic
import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, X, Calendar, AlertTriangle, CheckCircle2, ListTodo,
  Loader2, Search, ArrowRight, ArrowLeft, Trash2, CheckSquare, Sparkles, Star
} from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';

// ── Column Configuration with Vibrant Pastel Headers ──────────────────────────
const COLUMNS = [
  {
    id: 'todo',
    label: 'TO DO',
    icon: ListTodo,
    headerBg: 'bg-yellow-200',
    emptyMsg: 'No tasks in To Do! Time to conquer the day.',
  },
  {
    id: 'in_progress',
    label: 'IN PROGRESS',
    icon: Loader2,
    headerBg: 'bg-blue-200',
    emptyMsg: 'Nothing in progress. Pick a task and dive in!',
  },
  {
    id: 'completed',
    label: 'COMPLETED',
    icon: CheckCircle2,
    headerBg: 'bg-lime-200',
    emptyMsg: 'No finished tasks yet. You got this!',
  },
];

const PRIORITIES = [
  { value: 'chill', label: 'Chill (Low)', color: 'lime' },
  { value: 'important', label: 'Important (Med)', color: 'amber' },
  { value: 'urgent', label: 'Urgent (High)', color: 'red' },
];

// ── Neo-Brutalist Task Card ───────────────────────────────────────────────────
const TaskCard = ({ task, onStatusChange, onDelete }) => {
  const isOverdue = task.dueDate && new Date() > new Date(task.dueDate) && task.status !== 'completed';
  const dueDate = task.dueDate ? new Date(task.dueDate) : null;
  const daysUntilDue = dueDate ? Math.ceil((dueDate - new Date()) / (1000 * 60 * 60 * 24)) : null;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ y: -2 }}
      className={`bg-white rounded-2xl p-4 border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] transition-all group relative select-none ${
        isOverdue ? 'bg-red-50/60' : ''
      }`}
    >
      {/* Top Header: Priority Badge & Delete Button */}
      <div className="flex items-center justify-between mb-2.5">
        <span
          className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full border-2 border-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] flex items-center gap-1 ${
            task.priority === 'urgent'
              ? 'bg-red-200 text-red-950'
              : task.priority === 'important'
              ? 'bg-amber-200 text-amber-950'
              : 'bg-[#A3E635] text-black'
          }`}
        >
          {task.priority === 'urgent' && <AlertTriangle size={11} className="stroke-[3]" />}
          {task.priority}
        </span>

        <button
          onClick={() => onDelete(task._id)}
          className="w-7 h-7 rounded-lg bg-white hover:bg-red-100 text-gray-500 hover:text-red-600 border-2 border-transparent hover:border-black flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 cursor-pointer"
          title="Delete task"
        >
          <Trash2 size={13} className="stroke-[2.5]" />
        </button>
      </div>

      {/* Task Title */}
      <p
        className={`text-sm font-black leading-snug ${
          task.status === 'completed' ? 'line-through text-gray-400' : 'text-[#111827]'
        }`}
      >
        {task.title}
      </p>

      {/* Linked Subject Pill */}
      {task.subject && (
        <div className="inline-flex items-center gap-1.5 mt-2.5 px-2 py-0.5 rounded-md bg-[#F0FDF4] border border-black text-xs font-bold text-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
          <span
            className="w-2.5 h-2.5 rounded-full flex-shrink-0 border border-black"
            style={{ background: task.subject.colorTag || '#A3E635' }}
          />
          <span className="truncate max-w-[170px]">{task.subject.title}</span>
        </div>
      )}

      {/* Due Date & Weightage */}
      <div className="flex items-center justify-between mt-3 pt-2.5 border-t-2 border-black/10 text-[11px] font-bold">
        {dueDate ? (
          <span
            className={`flex items-center gap-1.5 ${
              isOverdue
                ? 'text-red-700 font-black'
                : daysUntilDue !== null && daysUntilDue <= 3
                ? 'text-amber-700 font-black'
                : 'text-[#4B5563]'
            }`}
          >
            <Calendar size={12} className="stroke-[2.5]" />
            {isOverdue
              ? `Overdue (${Math.abs(daysUntilDue)}d)`
              : dueDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </span>
        ) : (
          <span className="text-gray-400 font-semibold">No due date</span>
        )}

        {task.weightage > 0 && (
          <span className="text-[10px] font-black text-black bg-yellow-200 px-1.5 py-0.5 rounded border border-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
            {task.weightage}% weight
          </span>
        )}
      </div>

      {/* Column Transition Buttons — Tactile Stickers */}
      <div className="flex items-center justify-between gap-2 mt-3 pt-1">
        {task.status !== 'todo' && (
          <button
            onClick={() => onStatusChange(task._id, task.status === 'completed' ? 'in_progress' : 'todo')}
            className="text-[11px] font-black px-2.5 py-1 rounded-xl bg-white hover:bg-gray-100 text-black border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-0 active:shadow-none flex items-center gap-1 transition-all cursor-pointer"
          >
            <ArrowLeft size={11} className="stroke-[3]" /> Back
          </button>
        )}
        <div className="flex-1" />
        {task.status !== 'completed' && (
          <button
            onClick={() => onStatusChange(task._id, task.status === 'todo' ? 'in_progress' : 'completed')}
            className={`text-[11px] font-black px-3 py-1 rounded-xl border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-0 active:shadow-none flex items-center gap-1.5 transition-all cursor-pointer ${
              task.status === 'todo'
                ? 'bg-blue-200 hover:bg-blue-300 text-black'
                : 'bg-lime-400 hover:bg-lime-300 text-black'
            }`}
          >
            {task.status === 'todo' ? (
              <>Start <ArrowRight size={12} className="stroke-[3]" /></>
            ) : (
              <>Complete ✓</>
            )}
          </button>
        )}
      </div>
    </motion.div>
  );
};

// ── Create Task Neo-Brutalist Modal ───────────────────────────────────────────
const CreateTaskModal = ({ subjects, onClose, onCreate }) => {
  const [form, setForm] = useState({
    title: '',
    priority: 'important',
    dueDate: '',
    subject: '',
    weightage: 0,
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) {
      toast.error('Task title is required');
      return;
    }
    await onCreate({
      ...form,
      subject: form.subject || undefined,
      dueDate: form.dueDate || undefined,
      weightage: Number(form.weightage) || 0,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/45 backdrop-blur-xs" onClick={onClose} />
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-white rounded-3xl w-full max-w-md z-10 p-6 sm:p-7 border-2 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] relative select-none"
      >
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-[#A3E635] flex items-center justify-center border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
              <Plus size={20} className="text-black stroke-[3]" />
            </div>
            <h2 className="text-xl font-black text-[#111827]">Create New Task</h2>
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
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              className="form-input text-sm font-semibold"
              placeholder="e.g. Read chapters 3 & 4"
              autoFocus
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-black text-[#374151] mb-1.5 uppercase tracking-wider">
                Priority
              </label>
              <select
                value={form.priority}
                onChange={(e) => setForm((f) => ({ ...f, priority: e.target.value }))}
                className="form-input text-sm font-bold"
              >
                {PRIORITIES.map((p) => (
                  <option key={p.value} value={p.value}>
                    {p.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-black text-[#374151] mb-1.5 uppercase tracking-wider">
                Due Date
              </label>
              <input
                type="date"
                value={form.dueDate}
                onChange={(e) => setForm((f) => ({ ...f, dueDate: e.target.value }))}
                className="form-input text-sm font-semibold"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-black text-[#374151] mb-1.5 uppercase tracking-wider">
                Course / Subject
              </label>
              <select
                value={form.subject}
                onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))}
                className="form-input text-sm font-semibold"
              >
                <option value="">None</option>
                {subjects.map((s) => (
                  <option key={s._id} value={s._id}>
                    {s.title}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-black text-[#374151] mb-1.5 uppercase tracking-wider">
                Grade Weight (%)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                value={form.weightage}
                onChange={(e) => setForm((f) => ({ ...f, weightage: e.target.value }))}
                className="form-input text-sm font-semibold"
              />
            </div>
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
              className="btn-primary flex-1 justify-center text-xs py-2.5 font-black"
            >
              Create Task
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

// ── Main TaskBoard Component ──────────────────────────────────────────────────
export default function TaskBoard() {
  const [tasks, setTasks] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [search, setSearch] = useState('');
  const [filterPriority, setFilterPriority] = useState('all');

  const fetchData = useCallback(async () => {
    try {
      const [tasksRes, subjectsRes] = await Promise.all([
        api.get('/assignments'),
        api.get('/subjects'),
      ]);
      setTasks(tasksRes.data?.data || []);
      setSubjects(subjectsRes.data?.data || []);
    } catch {
      toast.error('Failed to load assignments');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleCreate = async (data) => {
    try {
      const res = await api.post('/assignments', data);
      setTasks((prev) => [res.data.data, ...prev]);
      setShowModal(false);
      toast.success('Task created! 🎯');
    } catch {
      toast.error('Failed to create task');
    }
  };

  const handleStatusChange = async (id, status) => {
    const originalTasks = [...tasks];
    setTasks((prev) => prev.map((t) => (t._id === id ? { ...t, status } : t)));

    try {
      await api.patch(`/assignments/${id}/status`, { status });
      if (status === 'completed') toast.success('Task completed! 🎉');
    } catch {
      setTasks(originalTasks);
      toast.error('Failed to update status');
    }
  };

  const handleDelete = async (id) => {
    const originalTasks = [...tasks];
    setTasks((prev) => prev.filter((t) => t._id !== id));
    try {
      await api.delete(`/assignments/${id}`);
      toast.success('Task removed');
    } catch {
      setTasks(originalTasks);
      toast.error('Failed to delete task');
    }
  };

  const filteredTasks = tasks.filter((t) => {
    const matchesSearch = t.title.toLowerCase().includes(search.toLowerCase());
    const matchesPriority = filterPriority === 'all' || t.priority === filterPriority;
    return matchesSearch && matchesPriority;
  });

  const tasksByStatus = (status) => filteredTasks.filter((t) => t.status === status);

  const completedCount = tasks.filter((t) => t.status === 'completed').length;
  const pendingCount = tasks.filter((t) => t.status !== 'completed').length;
  const completionPercent = tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0;

  return (
    <div className="p-6 md:p-8 h-full flex flex-col max-w-7xl mx-auto pb-24 md:pb-8 select-none">
      {/* ── Top Header & Stats (Ultra-Bold Black Title & Sticker Inputs) ─────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 mb-8 flex-shrink-0 border-b-2 border-black pb-6">
        <div>
          <h1 className="text-3xl md:text-4xl font-black text-black flex items-center gap-3 tracking-tight">
            <div className="w-10 h-10 rounded-2xl bg-[#A3E635] flex items-center justify-center border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
              <CheckSquare size={22} className="text-black stroke-[3]" />
            </div>
            Task Board
          </h1>
          <div className="flex items-center gap-2 mt-2">
            <span className="text-xs font-bold text-[#4B5563]">
              {pendingCount} pending tasks
            </span>
            <span className="text-black font-black">•</span>
            <span className="text-xs font-black bg-white text-black px-2.5 py-0.5 rounded-full border-2 border-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
              {completionPercent}% overall completion
            </span>
          </div>
        </div>

        {/* Inputs & Action Button: Crisp White Containers, 2px Black Borders & Drop Shadows */}
        <div className="flex items-center gap-3 flex-wrap">
          {/* Search Input */}
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-black stroke-[2.5]" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search tasks..."
              className="bg-white border-2 border-black rounded-xl pl-9 pr-3.5 py-2 text-xs font-bold text-black placeholder-gray-500 outline-none shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] focus:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-all"
            />
          </div>

          {/* Priority Filter Dropdown */}
          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            className="bg-white border-2 border-black rounded-xl px-3 py-2 text-xs font-black text-black outline-none shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] cursor-pointer"
          >
            <option value="all">All Priorities</option>
            <option value="urgent">Urgent Only</option>
            <option value="important">Important Only</option>
            <option value="chill">Chill Only</option>
          </select>

          {/* New Task Sticker Button */}
          <button
            onClick={() => setShowModal(true)}
            className="px-4 py-2 bg-[#A3E635] hover:bg-[#8cee2b] text-black font-black text-xs rounded-xl border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 active:translate-y-0 active:shadow-none transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Plus size={16} className="stroke-[3]" /> New Task
          </button>
        </div>
      </div>

      {/* ── 3-Column Kanban Board (Clean White Containers, 2px Borders & 6px Shadows) ── */}
      {loading ? (
        <div className="grid md:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="skeleton h-88 rounded-3xl" />
          ))}
        </div>
      ) : (
        <div className="grid md:grid-cols-3 gap-6 flex-1 min-h-0 overflow-y-auto pr-1">
          {COLUMNS.map((col) => {
            const colTasks = tasksByStatus(col.id);

            return (
              <div
                key={col.id}
                className="flex flex-col min-h-0 bg-white rounded-3xl border-2 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] overflow-hidden"
              >
                {/* Column Header: Distinct Pastel Background with 2px Black Bottom Border */}
                <div
                  className={`flex items-center justify-between p-4 border-b-2 border-black ${col.headerBg}`}
                >
                  <div className="flex items-center gap-2">
                    <col.icon size={18} className="text-black stroke-[3]" />
                    <span className="text-xs font-black text-black tracking-wider uppercase">
                      {col.label}
                    </span>
                  </div>
                  <span className="text-xs font-black bg-white text-black px-2.5 py-0.5 rounded-full border-2 border-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
                    {colTasks.length}
                  </span>
                </div>

                {/* Cards Container */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-[#FAFBFD]">
                  <AnimatePresence mode="popLayout">
                    {colTasks.length === 0 ? (
                      /* Lively Sticker-Style Empty State */
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-center py-12 px-4 bg-white border-2 border-dashed border-black rounded-2xl flex flex-col items-center justify-center gap-2.5"
                      >
                        <div className="w-10 h-10 rounded-full bg-[#F0FDF4] border-2 border-black flex items-center justify-center shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                          <Star size={18} className="text-amber-500 fill-amber-400 stroke-[2.5]" />
                        </div>
                        <p className="text-xs font-black text-black max-w-[200px] leading-relaxed">
                          {col.emptyMsg}
                        </p>
                      </motion.div>
                    ) : (
                      colTasks.map((task) => (
                        <TaskCard
                          key={task._id}
                          task={task}
                          onStatusChange={handleStatusChange}
                          onDelete={handleDelete}
                        />
                      ))
                    )}
                  </AnimatePresence>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Task Modal */}
      {showModal && (
        <CreateTaskModal
          subjects={subjects}
          onClose={() => setShowModal(false)}
          onCreate={handleCreate}
        />
      )}
    </div>
  );
}
