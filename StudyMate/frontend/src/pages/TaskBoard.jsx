// pages/TaskBoard.jsx — Executive Kanban task board
import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, X, Calendar, AlertTriangle, CheckCircle2, ListTodo,
  Loader2, Filter, Search, ArrowRight, ArrowLeft, Trash2, CheckSquare
} from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';

const COLUMNS = [
  { id: 'todo', label: 'To Do', icon: ListTodo, color: '#94A3B8', bgBadge: 'bg-slate-500/10' },
  { id: 'in_progress', label: 'In Progress', icon: Loader2, color: '#6366F1', bgBadge: 'bg-indigo-500/10' },
  { id: 'completed', label: 'Completed', icon: CheckCircle2, color: '#10B981', bgBadge: 'bg-emerald-500/10' },
];

const PRIORITIES = [
  { value: 'chill', label: 'Chill (Low)', color: 'emerald' },
  { value: 'important', label: 'Important (Med)', color: 'amber' },
  { value: 'urgent', label: 'Urgent (High)', color: 'red' },
];

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
      className={`glass-card p-4 border transition-all group ${
        isOverdue
          ? 'border-red-500/40 bg-red-950/10'
          : task.priority === 'urgent' && task.status !== 'completed'
          ? 'border-red-500/25 bg-red-950/5'
          : 'border-[#1E293B] hover:border-[#334155]'
      }`}
    >
      {/* Priority badge & delete button */}
      <div className="flex items-center justify-between mb-2">
        <span
          className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
            task.priority === 'urgent'
              ? 'bg-red-500/15 text-red-400 border border-red-500/30'
              : task.priority === 'important'
              ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
              : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
          }`}
        >
          {task.priority === 'urgent' && <AlertTriangle size={10} className="inline mr-1" />}
          {task.priority}
        </span>

        <button
          onClick={() => onDelete(task._id)}
          className="text-[#475569] hover:text-red-400 p-1 opacity-0 group-hover:opacity-100 transition-opacity"
          title="Delete task"
        >
          <Trash2 size={13} />
        </button>
      </div>

      <p
        className={`text-sm font-semibold leading-relaxed ${
          task.status === 'completed' ? 'line-through text-[#64748B]' : 'text-[#F1F5F9]'
        }`}
      >
        {task.title}
      </p>

      {/* Linked Subject */}
      {task.subject && (
        <div className="flex items-center gap-1.5 mt-2 text-xs text-[#94A3B8]">
          <span
            className="w-2 h-2 rounded-full flex-shrink-0"
            style={{ background: task.subject.colorTag || '#6366F1' }}
          />
          <span className="truncate">{task.subject.title}</span>
        </div>
      )}

      {/* Due Date & Weightage */}
      <div className="flex items-center justify-between mt-3 pt-2 border-t border-[#1E293B]/70 text-[11px]">
        {dueDate ? (
          <span
            className={`flex items-center gap-1 font-medium ${
              isOverdue
                ? 'text-red-400 font-bold'
                : daysUntilDue !== null && daysUntilDue <= 3
                ? 'text-amber-400'
                : 'text-[#64748B]'
            }`}
          >
            <Calendar size={11} />
            {isOverdue
              ? `Overdue (${Math.abs(daysUntilDue)}d)`
              : dueDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </span>
        ) : (
          <span className="text-[#475569]">No due date</span>
        )}

        {task.weightage > 0 && (
          <span className="text-[10px] text-[#818CF8] bg-[#6366F1]/10 px-1.5 py-0.5 rounded font-mono">
            {task.weightage}% grade
          </span>
        )}
      </div>

      {/* Column transition buttons */}
      <div className="flex items-center justify-between gap-1.5 mt-3 pt-1">
        {task.status !== 'todo' && (
          <button
            onClick={() => onStatusChange(task._id, task.status === 'completed' ? 'in_progress' : 'todo')}
            className="text-[11px] px-2 py-1 rounded bg-[#1E293B] text-[#94A3B8] hover:text-[#F1F5F9] hover:bg-[#334155] flex items-center gap-1 transition-colors"
          >
            <ArrowLeft size={11} /> Back
          </button>
        )}
        <div className="flex-1" />
        {task.status !== 'completed' && (
          <button
            onClick={() => onStatusChange(task._id, task.status === 'todo' ? 'in_progress' : 'completed')}
            className={`text-[11px] px-2.5 py-1 rounded flex items-center gap-1 font-medium transition-colors ${
              task.status === 'todo'
                ? 'bg-[#6366F1]/15 text-[#818CF8] hover:bg-[#6366F1]/30'
                : 'bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/30'
            }`}
          >
            {task.status === 'todo' ? (
              <>Start <ArrowRight size={11} /></>
            ) : (
              <>Complete ✓</>
            )}
          </button>
        )}
      </div>
    </motion.div>
  );
};

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
      <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="glass-card w-full max-w-md z-10 p-6 border border-[#1E293B] shadow-2xl"
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-[#F1F5F9]">Create New Task</h2>
          <button onClick={onClose} className="text-[#64748B] hover:text-[#94A3B8]">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-[#94A3B8] mb-1">Task Title *</label>
            <input
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              className="form-input text-sm"
              placeholder="e.g. Read chapters 3 & 4"
              autoFocus
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-[#94A3B8] mb-1">Priority</label>
              <select
                value={form.priority}
                onChange={(e) => setForm((f) => ({ ...f, priority: e.target.value }))}
                className="form-input text-sm"
              >
                {PRIORITIES.map((p) => (
                  <option key={p.value} value={p.value}>
                    {p.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-[#94A3B8] mb-1">Due Date</label>
              <input
                type="date"
                value={form.dueDate}
                onChange={(e) => setForm((f) => ({ ...f, dueDate: e.target.value }))}
                className="form-input text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-[#94A3B8] mb-1">Course / Subject</label>
              <select
                value={form.subject}
                onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))}
                className="form-input text-sm"
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
              <label className="block text-xs font-medium text-[#94A3B8] mb-1">Grade Weight (%)</label>
              <input
                type="number"
                min="0"
                max="100"
                value={form.weightage}
                onChange={(e) => setForm((f) => ({ ...f, weightage: e.target.value }))}
                className="form-input text-sm"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-ghost flex-1 justify-center text-xs">
              Cancel
            </button>
            <button type="submit" className="btn-primary flex-1 justify-center text-xs">
              Create Task
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

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
  const completionPercent = tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0;

  return (
    <div className="p-6 md:p-8 h-full flex flex-col max-w-7xl mx-auto pb-24 md:pb-8">
      {/* ── Top Header & Stats ─────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 flex-shrink-0">
        <div>
          <h1 className="text-2xl font-extrabold text-[#F1F5F9] flex items-center gap-2 tracking-tight">
            <CheckSquare size={24} className="text-[#6366F1]" />
            Task Board
          </h1>
          <p className="text-xs text-[#64748B] mt-1">
            {tasks.filter((t) => t.status !== 'completed').length} pending • {completionPercent}% overall completion
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Search */}
          <div className="relative">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#475569]" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search tasks..."
              className="bg-[#0D1220] border border-[#1E293B] rounded-xl pl-8 pr-3 py-1.5 text-xs text-[#F1F5F9] placeholder-[#475569] outline-none focus:border-[#6366F1]"
            />
          </div>

          {/* Priority filter */}
          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            className="bg-[#0D1220] border border-[#1E293B] rounded-xl px-3 py-1.5 text-xs text-[#94A3B8] outline-none"
          >
            <option value="all">All Priorities</option>
            <option value="urgent">Urgent Only</option>
            <option value="important">Important Only</option>
            <option value="chill">Chill Only</option>
          </select>

          <button onClick={() => setShowModal(true)} className="btn-primary text-xs py-2 px-3.5">
            <Plus size={15} /> New Task
          </button>
        </div>
      </div>

      {/* ── 3-Column Kanban Board ─────────────────────────────────────────── */}
      {loading ? (
        <div className="grid md:grid-cols-3 gap-5">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="skeleton h-80 rounded-2xl" />
          ))}
        </div>
      ) : (
        <div className="grid md:grid-cols-3 gap-5 flex-1 min-h-0 overflow-y-auto">
          {COLUMNS.map((col) => {
            const colTasks = tasksByStatus(col.id);

            return (
              <div
                key={col.id}
                className="flex flex-col min-h-0 bg-[#0D1220]/60 rounded-2xl border border-[#1E293B] p-3.5"
              >
                {/* Column Header */}
                <div className="flex items-center justify-between mb-3.5 px-1 pb-2 border-b border-[#1E293B]/70">
                  <div className="flex items-center gap-2">
                    <col.icon size={16} style={{ color: col.color }} />
                    <span className="text-xs font-bold text-[#F1F5F9] uppercase tracking-wider">
                      {col.label}
                    </span>
                  </div>
                  <span className="text-xs font-mono font-bold bg-[#151C2C] text-[#818CF8] px-2 py-0.5 rounded-full border border-[#1E293B]">
                    {colTasks.length}
                  </span>
                </div>

                {/* Cards Container */}
                <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                  <AnimatePresence mode="popLayout">
                    {colTasks.length === 0 ? (
                      <div className="text-center py-12 border border-dashed border-[#1E293B] rounded-xl">
                        <p className="text-xs text-[#475569]">No tasks in {col.label.toLowerCase()}</p>
                      </div>
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
