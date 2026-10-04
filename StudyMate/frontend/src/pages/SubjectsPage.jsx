// pages/SubjectsPage.jsx — Course/subject management with chapter tracking, exam dates & AI study plan
import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  Plus, BookOpen, Calendar, CheckCircle, Circle, Trash2, Edit3,
  X, Check, ChevronDown, ChevronUp, Sparkles, Copy, Loader2
} from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';

const COLORS = ['#A3E635', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4', '#F97316', '#EC4899'];

// ── AI Study Plan Modal ────────────────────────────────────────────────────────
const StudyPlanModal = ({ subject, onClose }) => {
  const [loading, setLoading] = useState(true);
  const [plan, setPlan] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fetchPlan = async () => {
      try {
        const res = await api.post(`/ai/study-plan/${subject._id}`);
        setPlan(res.data?.data?.plan || 'No plan generated.');
      } catch (err) {
        toast.error(err.response?.data?.message || 'Failed to generate study plan');
        onClose();
      } finally {
        setLoading(false);
      }
    };
    if (subject) fetchPlan();
  }, [subject, onClose]);

  const copyPlan = () => {
    navigator.clipboard.writeText(plan);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success('Study plan copied to clipboard!');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/45 backdrop-blur-xs" onClick={onClose} />
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-white rounded-3xl w-full max-w-2xl max-h-[85vh] flex flex-col z-10 border-2 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] overflow-hidden"
      >
        <div className="flex items-center justify-between p-5 border-b-2 border-black bg-white">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#A3E635] flex items-center justify-center text-black border-2 border-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
              <Sparkles size={18} className="stroke-[2.5]" />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-900">{subject.title} — AI Study Plan</h2>
              <p className="text-xs font-semibold text-slate-600">Personalized exam preparation timetable</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {!loading && plan && (
              <button
                onClick={copyPlan}
                className="btn-ghost text-xs py-1.5 px-3 font-black border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] cursor-pointer"
              >
                {copied ? <Check size={14} className="text-emerald-600 stroke-[3]" /> : <Copy size={14} className="stroke-[2.5]" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white hover:bg-red-50 flex items-center justify-center border-2 border-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] transition-colors cursor-pointer"
            >
              <X size={16} className="text-black stroke-[2.5]" />
            </button>
          </div>
        </div>

        <div className="p-6 overflow-y-auto flex-1 bg-[#F9FAFB]">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Loader2 size={36} className="animate-spin text-black mb-3" />
              <p className="text-sm font-black text-slate-900">Synthesizing AI Study Plan...</p>
              <p className="text-xs font-semibold text-slate-600 mt-1">Analyzing syllabus chapters and exam target date</p>
            </div>
          ) : (
            <div className="markdown-body text-xs md:text-sm text-slate-900 leading-relaxed bg-white p-5 rounded-2xl border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{plan}</ReactMarkdown>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

// ── Subject Create / Edit Modal ────────────────────────────────────────────────
const SubjectModal = ({ subject, onClose, onSave }) => {
  const [form, setForm] = useState({
    title: subject?.title || '',
    code: subject?.code || '',
    colorTag: subject?.colorTag || '#A3E635',
    examDate: subject?.examDate ? new Date(subject.examDate).toISOString().split('T')[0] : '',
    chapters: subject?.chapters?.map((c) => c.name) || [''],
  });

  const handleAddChapter = () => setForm((f) => ({ ...f, chapters: [...f.chapters, ''] }));
  const handleChapterChange = (i, val) =>
    setForm((f) => {
      const chs = [...f.chapters];
      chs[i] = val;
      return { ...f, chapters: chs };
    });
  const handleRemoveChapter = (i) =>
    setForm((f) => ({ ...f, chapters: f.chapters.filter((_, idx) => idx !== i) }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) {
      toast.error('Title is required');
      return;
    }
    const payload = {
      ...form,
      chapters: form.chapters.filter((c) => c.trim()).map((name) => ({ name, isCompleted: false })),
    };
    await onSave(payload);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/45 backdrop-blur-xs" onClick={onClose} />
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-white rounded-3xl w-full max-w-lg max-h-[90vh] overflow-y-auto z-10 p-6 sm:p-7 border-2 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] select-none"
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-[#A3E635] flex items-center justify-center border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
              <BookOpen size={20} className="text-black stroke-[3]" />
            </div>
            <h2 className="text-xl font-black text-slate-900">{subject ? 'Edit Subject' : 'New Subject'}</h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white hover:bg-red-50 flex items-center justify-center border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-colors cursor-pointer"
          >
            <X size={16} className="text-black stroke-[2.5]" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <label className="block text-xs font-black text-slate-800 mb-1.5 uppercase tracking-wider">
                Subject Title *
              </label>
              <input
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                className="form-input text-sm font-semibold"
                placeholder="e.g. Data Structures & Algorithms"
                autoFocus
              />
            </div>
            <div>
              <label className="block text-xs font-black text-slate-800 mb-1.5 uppercase tracking-wider">
                Code
              </label>
              <input
                value={form.code}
                onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))}
                className="form-input text-sm font-semibold"
                placeholder="CS201"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-black text-slate-800 mb-1.5 uppercase tracking-wider">
              Target Exam Date
            </label>
            <input
              type="date"
              value={form.examDate}
              onChange={(e) => setForm((f) => ({ ...f, examDate: e.target.value }))}
              className="form-input text-sm font-semibold"
            />
          </div>

          <div>
            <label className="block text-xs font-black text-slate-800 mb-1.5 uppercase tracking-wider">
              Color Tag
            </label>
            <div className="flex gap-2.5 flex-wrap">
              {COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, colorTag: c }))}
                  className={`w-8 h-8 rounded-full border-2 border-black transition-transform cursor-pointer ${
                    form.colorTag === c ? 'scale-120 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]' : 'hover:scale-110'
                  }`}
                  style={{ background: c }}
                />
              ))}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-black text-slate-800 uppercase tracking-wider">
                Chapters / Topics ({form.chapters.length})
              </label>
              <button
                type="button"
                onClick={handleAddChapter}
                className="text-xs font-black text-black bg-[#A3E635] hover:bg-[#8cee2b] px-2.5 py-1 rounded-lg border-2 border-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] flex items-center gap-1 cursor-pointer"
              >
                <Plus size={13} className="stroke-[3]" /> Add Chapter
              </button>
            </div>
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {form.chapters.map((ch, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="text-xs text-black w-5 text-right font-black font-mono">{i + 1}.</span>
                  <input
                    value={ch}
                    onChange={(e) => handleChapterChange(i, e.target.value)}
                    className="form-input text-xs py-2 flex-1 font-semibold"
                    placeholder={`Chapter ${i + 1}`}
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveChapter(i)}
                    className="w-7 h-7 rounded-lg bg-white hover:bg-red-50 text-red-600 border border-black flex items-center justify-center cursor-pointer"
                  >
                    <X size={14} className="stroke-[2.5]" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-3">
            <button type="button" onClick={onClose} className="btn-ghost flex-1 justify-center text-xs py-2.5 font-black">
              Cancel
            </button>
            <button type="submit" className="btn-primary flex-1 justify-center text-xs py-2.5 font-black">
              {subject ? 'Update Subject' : 'Create Subject'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

// ── Subject Card Component ────────────────────────────────────────────────────
const SubjectCard = ({ subject, onEdit, onDelete, onToggleChapter, onGeneratePlan }) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <motion.div
      layout
      whileHover={{ y: -3 }}
      className="bg-white rounded-3xl p-5 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all flex flex-col justify-between relative overflow-hidden select-none"
    >
      <div>
        {/* Header */}
        <div className="flex items-start gap-3">
          <div className="w-3 h-14 rounded-full flex-shrink-0 border-2 border-black" style={{ background: subject.colorTag || '#A3E635' }} />
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="font-black text-slate-900 text-base truncate">{subject.title}</h3>
                {subject.code && (
                  <span className="text-xs text-black font-black bg-[#F0FDF4] px-1.5 py-0.2 rounded border border-black font-mono">
                    {subject.code}
                  </span>
                )}
              </div>
              <div className="flex gap-1.5">
                <button
                  onClick={() => onEdit(subject)}
                  className="w-7 h-7 rounded-lg bg-white hover:bg-gray-100 text-black border border-black flex items-center justify-center transition-colors cursor-pointer shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]"
                  title="Edit subject"
                >
                  <Edit3 size={13} className="stroke-[2.5]" />
                </button>
                <button
                  onClick={() => onDelete(subject._id)}
                  className="w-7 h-7 rounded-lg bg-white hover:bg-red-50 text-red-600 border border-black flex items-center justify-center transition-colors cursor-pointer shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]"
                  title="Delete subject"
                >
                  <Trash2 size={13} className="stroke-[2.5]" />
                </button>
              </div>
            </div>

            {/* Exam Countdown */}
            {subject.examDate && (
              <div
                className={`mt-2.5 inline-flex items-center gap-1.5 text-xs font-black px-2.5 py-0.5 rounded-full border border-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] ${
                  subject.daysUntilExam <= 7
                    ? 'bg-red-200 text-red-950'
                    : subject.daysUntilExam <= 14
                    ? 'bg-amber-200 text-amber-950'
                    : 'bg-[#DCFCE7] text-emerald-950'
                }`}
              >
                <Calendar size={12} className="stroke-[2.5]" />
                {subject.daysUntilExam === 0 ? 'Exam is Today!' : `${subject.daysUntilExam} days until exam`}
              </div>
            )}

            {/* Progress Bar */}
            {subject.chapters?.length > 0 && (
              <div className="mt-3">
                <div className="flex items-center justify-between text-xs font-bold text-slate-700 mb-1">
                  <span>Syllabus Progress</span>
                  <span className="font-mono font-black text-slate-900">{subject.progress}%</span>
                </div>
                <div className="bg-[#E5E7EB] rounded-full h-2.5 overflow-hidden border border-black">
                  <motion.div
                    className="h-full rounded-full"
                    style={{ background: subject.colorTag || '#A3E635' }}
                    initial={{ width: 0 }}
                    animate={{ width: `${subject.progress}%` }}
                    transition={{ duration: 0.8, ease: 'easeOut' }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* AI Study Plan Quick Trigger */}
        <div className="mt-4 pt-3.5 border-t-2 border-black/10 flex items-center justify-between">
          <button
            onClick={() => onGeneratePlan(subject)}
            className="text-xs font-black text-black bg-[#A3E635] hover:bg-[#8cee2b] border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer active:translate-x-0.5 active:translate-y-0.5"
          >
            <Sparkles size={13} className="stroke-[3]" /> AI Study Plan
          </button>

          {subject.chapters?.length > 0 && (
            <button
              onClick={() => setExpanded((v) => !v)}
              className="text-xs font-black text-slate-800 hover:text-black flex items-center gap-1 cursor-pointer bg-white px-2 py-1 rounded-lg border border-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]"
            >
              {expanded ? <ChevronUp size={14} className="stroke-[3]" /> : <ChevronDown size={14} className="stroke-[3]" />}
              {subject.chapters.length} chapters
            </button>
          )}
        </div>

        {/* Chapter List Toggle */}
        {subject.chapters?.length > 0 && (
          <AnimatePresence>
            {expanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden mt-3"
              >
                <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                  {subject.chapters.map((chapter) => (
                    <button
                      key={chapter._id}
                      onClick={() => onToggleChapter(subject._id, chapter._id)}
                      className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-left transition-all border border-black cursor-pointer ${
                        chapter.isCompleted
                          ? 'bg-[#F0FDF4] text-gray-500 shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]'
                          : 'bg-white hover:bg-[#F9FAFB] text-slate-900 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'
                      }`}
                    >
                      {chapter.isCompleted ? (
                        <CheckCircle size={15} className="text-emerald-600 stroke-[3] flex-shrink-0" />
                      ) : (
                        <Circle size={15} className="text-black stroke-[2] flex-shrink-0" />
                      )}
                      <span className={chapter.isCompleted ? 'line-through opacity-70' : ''}>
                        {chapter.name}
                      </span>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </div>
    </motion.div>
  );
};

// ── Main Subjects Page ────────────────────────────────────────────────────────
export default function SubjectsPage() {
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null); // null | 'create' | subject object
  const [studyPlanSubject, setStudyPlanSubject] = useState(null);

  const fetchSubjects = useCallback(async () => {
    try {
      const res = await api.get('/subjects');
      setSubjects(res.data?.data || []);
    } catch {
      toast.error('Failed to load subjects');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSubjects();
  }, [fetchSubjects]);

  const handleSave = async (data) => {
    try {
      if (modal === 'create') {
        const res = await api.post('/subjects', data);
        setSubjects((prev) => [res.data.data, ...prev]);
        toast.success('Course created! 📚');
      } else {
        const res = await api.put(`/subjects/${modal._id}`, data);
        setSubjects((prev) => prev.map((s) => (s._id === modal._id ? res.data.data : s)));
        toast.success('Course updated! ✨');
      }
      setModal(null);
    } catch {
      toast.error('Failed to save course');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this course and all its chapters?')) return;
    try {
      await api.delete(`/subjects/${id}`);
      setSubjects((prev) => prev.filter((s) => s._id !== id));
      toast.success('Course removed');
    } catch {
      toast.error('Failed to delete course');
    }
  };

  const handleToggleChapter = async (subjectId, chapterId) => {
    try {
      const res = await api.patch(`/subjects/${subjectId}/chapters/${chapterId}`);
      setSubjects((prev) => prev.map((s) => (s._id === subjectId ? res.data.data : s)));
    } catch {
      toast.error('Failed to update chapter progress');
    }
  };

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto space-y-8 pb-28 md:pb-12 select-none">
      {/* ── Header: High Contrast, Bold Black Typography ────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b-2 border-black pb-6">
        <div>
          <h1 className="text-slate-900 font-black text-3xl flex items-center gap-3 tracking-tight">
            <div className="w-10 h-10 rounded-2xl bg-[#A3E635] flex items-center justify-center border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
              <BookOpen size={22} className="text-black stroke-[3]" />
            </div>
            Course &amp; Syllabus Tracker
          </h1>
          <p className="text-slate-700 font-medium text-xs md:text-sm mt-1.5">
            Organize academic courses, track syllabus milestones, and generate AI study schedules
          </p>
        </div>
        <button
          onClick={() => setModal('create')}
          className="px-4 py-2 bg-[#A3E635] hover:bg-[#8cee2b] text-black font-black text-xs rounded-xl border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 active:translate-y-0 active:shadow-none transition-all flex items-center gap-1.5 cursor-pointer"
        >
          <Plus size={16} className="stroke-[3]" /> Add Course
        </button>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="skeleton h-56 rounded-3xl" />
          ))}
        </div>
      ) : subjects.length === 0 ? (
        /* ── Empty State Card with High-Contrast Typography & 6px Shadow ─────── */
        <div className="bg-white rounded-3xl p-10 sm:p-12 text-center max-w-md mx-auto border-2 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
          <div className="w-16 h-16 rounded-2xl bg-[#A3E635] border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center mx-auto mb-5 text-black">
            <BookOpen size={32} className="stroke-[2.5]" />
          </div>
          <h3 className="text-slate-900 font-black text-2xl tracking-tight">No courses added yet</h3>
          <p className="text-slate-700 font-semibold text-xs md:text-sm mt-2 mb-6 leading-relaxed">
            Add your subjects to keep syllabus progress and upcoming exam dates organized!
          </p>
          <button
            onClick={() => setModal('create')}
            className="px-5 py-2.5 bg-[#A3E635] hover:bg-[#8cee2b] text-black font-black text-xs rounded-xl border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 active:translate-y-0 active:shadow-none transition-all inline-flex items-center gap-1.5 mx-auto cursor-pointer"
          >
            <Plus size={15} className="stroke-[3]" /> Add First Course
          </button>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {subjects.map((subject) => (
            <SubjectCard
              key={subject._id}
              subject={subject}
              onEdit={setModal}
              onDelete={handleDelete}
              onToggleChapter={handleToggleChapter}
              onGeneratePlan={setStudyPlanSubject}
            />
          ))}
        </div>
      )}

      {/* Edit/Create Modal */}
      {modal && (
        <SubjectModal
          subject={modal === 'create' ? null : modal}
          onClose={() => setModal(null)}
          onSave={handleSave}
        />
      )}

      {/* AI Study Plan Modal */}
      {studyPlanSubject && (
        <StudyPlanModal
          subject={studyPlanSubject}
          onClose={() => setStudyPlanSubject(null)}
        />
      )}
    </div>
  );
}
