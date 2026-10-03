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

const COLORS = ['#6366F1', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4', '#F97316', '#EC4899'];

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
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="glass-card w-full max-w-2xl max-h-[85vh] flex flex-col z-10 border border-[#1E293B] shadow-2xl overflow-hidden"
      >
        <div className="flex items-center justify-between p-5 border-b border-[#1E293B]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#6366F1]/20 flex items-center justify-center text-[#818CF8]">
              <Sparkles size={16} />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#F1F5F9]">{subject.title} — AI Study Plan</h2>
              <p className="text-xs text-[#64748B]">Personalized exam preparation timetable</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {!loading && plan && (
              <button onClick={copyPlan} className="btn-ghost text-xs py-1.5 px-2.5">
                {copied ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            )}
            <button onClick={onClose} className="text-[#64748B] hover:text-[#94A3B8]">
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Loader2 size={32} className="animate-spin text-[#6366F1] mb-3" />
              <p className="text-sm font-semibold text-[#F1F5F9]">Synthesizing AI Study Plan...</p>
              <p className="text-xs text-[#64748B] mt-1">Analyzing syllabus chapters and exam target date</p>
            </div>
          ) : (
            <div className="markdown-body text-xs md:text-sm text-[#CBD5E1] leading-relaxed">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{plan}</ReactMarkdown>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

const SubjectModal = ({ subject, onClose, onSave }) => {
  const [form, setForm] = useState({
    title: subject?.title || '',
    code: subject?.code || '',
    colorTag: subject?.colorTag || '#6366F1',
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
      <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="glass-card w-full max-w-lg max-h-[90vh] overflow-y-auto z-10 p-6 border border-[#1E293B] shadow-2xl"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-[#F1F5F9]">{subject ? 'Edit Subject' : 'New Subject'}</h2>
          <button onClick={onClose} className="text-[#475569] hover:text-[#94A3B8]">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <label className="block text-xs font-medium text-[#94A3B8] mb-1">Subject Title *</label>
              <input
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                className="form-input text-sm"
                placeholder="e.g. Data Structures & Algorithms"
                autoFocus
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#94A3B8] mb-1">Code</label>
              <input
                value={form.code}
                onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))}
                className="form-input text-sm"
                placeholder="CS201"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-[#94A3B8] mb-1">Exam Date</label>
            <input
              type="date"
              value={form.examDate}
              onChange={(e) => setForm((f) => ({ ...f, examDate: e.target.value }))}
              className="form-input text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[#94A3B8] mb-1.5">Color Tag</label>
            <div className="flex gap-2 flex-wrap">
              {COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, colorTag: c }))}
                  className={`w-7 h-7 rounded-full transition-transform ${
                    form.colorTag === c ? 'scale-125 ring-2 ring-white/60' : 'hover:scale-110'
                  }`}
                  style={{ background: c }}
                />
              ))}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-medium text-[#94A3B8]">Chapters / Topics</label>
              <button
                type="button"
                onClick={handleAddChapter}
                className="text-xs text-[#818CF8] flex items-center gap-1 hover:underline"
              >
                <Plus size={12} /> Add Chapter
              </button>
            </div>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {form.chapters.map((ch, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="text-xs text-[#475569] w-5 text-right font-mono">{i + 1}.</span>
                  <input
                    value={ch}
                    onChange={(e) => handleChapterChange(i, e.target.value)}
                    className="form-input text-xs py-1.5 flex-1"
                    placeholder={`Chapter ${i + 1}`}
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveChapter(i)}
                    className="text-[#475569] hover:text-red-400 p-1"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-ghost flex-1 justify-center text-xs">
              Cancel
            </button>
            <button type="submit" className="btn-primary flex-1 justify-center text-xs">
              {subject ? 'Update Subject' : 'Create Subject'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

const SubjectCard = ({ subject, onEdit, onDelete, onToggleChapter, onGeneratePlan }) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <motion.div
      layout
      whileHover={{ y: -2 }}
      className="glass-card p-5 border border-[#1E293B] hover:border-[#334155] transition-all flex flex-col justify-between"
    >
      <div>
        {/* Header */}
        <div className="flex items-start gap-3">
          <div className="w-2.5 h-12 rounded-full flex-shrink-0" style={{ background: subject.colorTag }} />
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="font-bold text-[#F1F5F9] truncate">{subject.title}</h3>
                {subject.code && <span className="text-xs text-[#64748B] font-mono">{subject.code}</span>}
              </div>
              <div className="flex gap-1">
                <button
                  onClick={() => onEdit(subject)}
                  className="p-1.5 rounded-lg hover:bg-[#1E293B] text-[#64748B] hover:text-[#94A3B8]"
                  title="Edit subject"
                >
                  <Edit3 size={14} />
                </button>
                <button
                  onClick={() => onDelete(subject._id)}
                  className="p-1.5 rounded-lg hover:bg-red-500/10 text-[#64748B] hover:text-red-400"
                  title="Delete subject"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>

            {/* Exam countdown */}
            {subject.examDate && (
              <div
                className={`mt-2 flex items-center gap-1.5 text-xs font-semibold ${
                  subject.daysUntilExam <= 7
                    ? 'text-red-400'
                    : subject.daysUntilExam <= 14
                    ? 'text-amber-400'
                    : 'text-emerald-400'
                }`}
              >
                <Calendar size={12} />
                {subject.daysUntilExam === 0 ? 'Exam is Today!' : `${subject.daysUntilExam} days until exam`}
              </div>
            )}

            {/* Progress bar */}
            {subject.chapters?.length > 0 && (
              <div className="mt-3">
                <div className="flex items-center justify-between text-[11px] text-[#64748B] mb-1">
                  <span>Syllabus Progress</span>
                  <span className="font-mono">{subject.progress}%</span>
                </div>
                <div className="bg-[#1E293B] rounded-full h-1.5 overflow-hidden">
                  <motion.div
                    className="h-full rounded-full"
                    style={{ background: subject.colorTag }}
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
        <div className="mt-4 pt-3 border-t border-[#1E293B]/70 flex items-center justify-between">
          <button
            onClick={() => onGeneratePlan(subject)}
            className="text-xs text-[#818CF8] bg-[#6366F1]/10 hover:bg-[#6366F1]/20 border border-[#6366F1]/25 px-2.5 py-1 rounded-lg flex items-center gap-1.5 transition-all font-medium"
          >
            <Sparkles size={12} /> AI Study Plan
          </button>

          {subject.chapters?.length > 0 && (
            <button
              onClick={() => setExpanded((v) => !v)}
              className="text-xs text-[#64748B] hover:text-[#94A3B8] flex items-center gap-1"
            >
              {expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
              {subject.chapters.length} chapters
            </button>
          )}
        </div>

        {/* Chapter list toggle */}
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
                      className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs text-left transition-colors ${
                        chapter.isCompleted ? 'bg-emerald-500/5 text-[#475569]' : 'hover:bg-[#1E293B] text-[#94A3B8]'
                      }`}
                    >
                      {chapter.isCompleted ? (
                        <CheckCircle size={14} className="text-emerald-400 flex-shrink-0" />
                      ) : (
                        <Circle size={14} className="text-[#334155] flex-shrink-0" />
                      )}
                      <span className={chapter.isCompleted ? 'line-through opacity-60' : ''}>
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
      toast.error('Failed to load courses');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSubjects();
  }, [fetchSubjects]);

  const handleSave = async (data) => {
    try {
      if (modal && modal._id) {
        const res = await api.put(`/subjects/${modal._id}`, data);
        setSubjects((prev) => prev.map((s) => (s._id === modal._id ? res.data.data : s)));
        toast.success('Subject updated! 📚');
      } else {
        const res = await api.post('/subjects', data);
        setSubjects((prev) => [res.data.data, ...prev]);
        toast.success('Subject created! 🎉');
      }
      setModal(null);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save subject');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this course?')) return;
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
    <div className="p-6 md:p-8 max-w-6xl mx-auto space-y-8 pb-28 md:pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#1E293B]/80 pb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-[#F1F5F9] flex items-center gap-2.5 tracking-tight">
            <BookOpen size={26} className="text-[#6366F1]" />
            Course & Syllabus Tracker
          </h1>
          <p className="text-xs md:text-sm text-[#64748B] mt-1">
            Organize academic courses, track syllabus milestones, and generate AI study schedules
          </p>
        </div>
        <button onClick={() => setModal('create')} className="btn-primary text-xs py-2 px-3.5">
          <Plus size={15} /> Add Course
        </button>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="skeleton h-56 rounded-2xl" />
          ))}
        </div>
      ) : subjects.length === 0 ? (
        <div className="glass-card p-12 text-center max-w-md mx-auto border border-[#1E293B]">
          <BookOpen size={48} className="mx-auto text-[#1E293B] mb-4" />
          <h3 className="text-lg font-bold text-[#F1F5F9]">No courses added yet</h3>
          <p className="text-xs text-[#64748B] mt-1.5 mb-5">
            Add your subjects to keep syllabus progress and upcoming exam dates organized!
          </p>
          <button onClick={() => setModal('create')} className="btn-primary text-xs mx-auto">
            <Plus size={14} /> Add First Course
          </button>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
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
