// pages/PublicNoteView.jsx — Read-only public note viewer with sleek typography
import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { BookOpen, Calendar, Zap, ArrowLeft, Copy, Check } from 'lucide-react';
import api from '../services/api';

export default function PublicNoteView() {
  const { shareToken } = useParams();
  const [note, setNote] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fetchPublicNote = async () => {
      try {
        const res = await api.get(`/notes/public/${shareToken}`);
        setNote(res.data.data);
      } catch (err) {
        setError(err.response?.data?.message || 'This note is no longer shared or does not exist.');
      } finally {
        setLoading(false);
      }
    };
    if (shareToken) fetchPublicNote();
  }, [shareToken]);

  const copyUrl = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0B0F17] flex items-center justify-center p-6">
        <div className="w-full max-w-3xl space-y-4">
          <div className="skeleton h-10 w-2/3 rounded-lg" />
          <div className="skeleton h-4 w-1/3 rounded-md" />
          <div className="skeleton h-72 rounded-xl mt-6" />
        </div>
      </div>
    );
  }

  if (error || !note) {
    return (
      <div className="min-h-screen bg-[#0B0F17] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-2xl bg-[#1E293B] flex items-center justify-center mb-4">
          <BookOpen size={32} className="text-[#475569]" />
        </div>
        <h2 className="text-xl font-bold text-[#F1F5F9] mb-2">Note Unavailable</h2>
        <p className="text-sm text-[#475569] max-w-md mb-6">{error}</p>
        <Link to="/" className="btn-primary">
          <ArrowLeft size={16} /> Go to StudyMate Home
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0B0F17] text-[#F1F5F9] p-4 md:p-10">
      {/* Top navbar */}
      <header className="max-w-4xl mx-auto flex items-center justify-between pb-6 mb-8 border-b border-[#1E293B]">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-md shadow-indigo-500/20">
            <Zap size={16} className="text-white" />
          </div>
          <span className="font-bold text-[#F1F5F9] tracking-tight">StudyMate</span>
          <span className="text-xs bg-[#6366F1]/15 text-[#818CF8] px-2 py-0.5 rounded-full border border-[#6366F1]/20">
            Public Note
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={copyUrl}
            className="btn-ghost text-xs py-1.5 px-3"
            title="Copy share link"
          >
            {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
            {copied ? 'Link Copied' : 'Share'}
          </button>
          <Link to="/login" className="btn-primary text-xs py-1.5 px-3">
            Open StudyMate
          </Link>
        </div>
      </header>

      {/* Main note document */}
      <main className="max-w-4xl mx-auto">
        <motion.article
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-6 md:p-12 rounded-2xl shadow-2xl border border-[#1E293B]"
        >
          {/* Note header */}
          <div className="mb-8 pb-6 border-b border-[#1E293B]">
            <div className="flex items-center gap-3 mb-3">
              <span className="text-3xl">{note.emoji || '📝'}</span>
              <h1 className="text-3xl md:text-4xl font-extrabold text-[#F1F5F9] tracking-tight">
                {note.title}
              </h1>
            </div>

            <div className="flex flex-wrap items-center gap-4 text-xs text-[#94A3B8] mt-4">
              {note.subject?.title && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#1E293B] text-[#CBD5E1]">
                  <span className="w-2 h-2 rounded-full bg-[#6366F1]" />
                  {note.subject.title}
                </span>
              )}
              {note.updatedAt && (
                <span className="flex items-center gap-1.5 text-[#64748B]">
                  <Calendar size={13} />
                  Updated {new Date(note.updatedAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                </span>
              )}
              {note.tags && note.tags.length > 0 && (
                <div className="flex items-center gap-1.5">
                  {note.tags.map(t => (
                    <span key={t} className="text-[11px] bg-[#0B0F17] px-2 py-0.5 rounded text-[#818CF8] border border-[#1E293B]">
                      #{t}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Markdown Content */}
          <div className="markdown-body text-[#CBD5E1] text-sm md:text-base leading-relaxed">
            {note.content ? (
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {note.content}
              </ReactMarkdown>
            ) : (
              <p className="text-[#475569] italic">This note is currently empty.</p>
            )}
          </div>
        </motion.article>

        <footer className="text-center py-10 text-xs text-[#475569]">
          Created and shared with <span className="text-[#818CF8]">StudyMate</span> — AI Academic Copilot
        </footer>
      </main>
    </div>
  );
}
