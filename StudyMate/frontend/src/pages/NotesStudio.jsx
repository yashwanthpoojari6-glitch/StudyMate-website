// pages/NotesStudio.jsx — Split-screen Markdown note editor with AI copilot panel
import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  Plus, Save, Trash2, Share2, Eye, Edit3, Sparkles,
  FileText, Tag, Link2, Brain, Layers, AlignLeft, Copy, Check,
  Download, Bold, Italic, Code, List, Heading2, MessageSquare, Send, X,
  Search
} from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';

// ── Skeleton for note list ─────────────────────────────────────────────────────
const NoteSkeleton = () => (
  <div className="space-y-2 px-3 py-2">
    {[...Array(5)].map((_, i) => (
      <div key={i} className="skeleton h-14 rounded-xl" />
    ))}
  </div>
);

// ── AI Copilot Panel (Actions + Academic Chat) ─────────────────────────────────
const AICopilot = ({ noteId, noteTitle, noteContent, onFlashcardsGenerated }) => {
  const [activeTab, setActiveTab] = useState('tools'); // 'tools' | 'chat'
  const [loading, setLoading] = useState(null); // which tool is running
  const [result, setResult] = useState(null);
  const [resultTitle, setResultTitle] = useState('');
  const [copied, setCopied] = useState(false);

  // Chat State
  const [chatMessages, setChatMessages] = useState([
    {
      role: 'model',
      text: `Hello! I'm your AI Academic Copilot. Ask me anything about "${noteTitle || 'your note'}" or any study concept! 🎓`,
    },
  ]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const runTool = async (action) => {
    if (!noteId) {
      toast.error('Please save the note first');
      return;
    }
    if (!noteContent.trim()) {
      toast.error('Note is empty! Write some content first.');
      return;
    }
    setLoading(action);
    setResult(null);

    try {
      if (action === 'summarize') {
        const res = await api.post(`/ai/summarize/${noteId}`);
        setResult(res.data.data.summary);
        setResultTitle('Executive Summary');
        toast.success('Summary generated! 📝');
      } else if (action === 'keyterms') {
        const res = await api.post(`/ai/key-terms/${noteId}`);
        setResult(res.data.data.keyTerms);
        setResultTitle('Key Vocabulary & Concepts');
        toast.success('Key terms extracted! 🏷️');
      } else if (action === 'flashcards') {
        const res = await api.post(`/ai/flashcards/${noteId}`, { count: 10 });
        const cardCount = res.data.data.cards?.length || 0;
        toast.success(`Generated deck with ${cardCount} flashcards! 🃏`);
        onFlashcardsGenerated?.();
        setResult(`### ✅ Flashcard Deck Created!\n- **Title**: ${res.data.data.title}\n- **Cards Generated**: ${cardCount}\n\nYou can now review this deck with spaced repetition in the **Flashcards** section!`);
        setResultTitle('Flashcard Deck Generated');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'AI request failed');
    } finally {
      setLoading(null);
    }
  };

  const handleSendChat = async (e) => {
    e.preventDefault();
    if (!chatInput.trim() || chatLoading) return;

    const userMsg = chatInput.trim();
    setChatInput('');
    setChatMessages((prev) => [...prev, { role: 'user', text: userMsg }]);
    setChatLoading(true);

    try {
      const messagesPayload = chatMessages
        .concat({ role: 'user', text: userMsg })
        .map((m) => ({ role: m.role, text: m.text }));

      const context = noteContent ? `Current Note (${noteTitle}):\n${noteContent}` : '';
      const res = await api.post('/ai/chat', { messages: messagesPayload, context });
      setChatMessages((prev) => [...prev, { role: 'model', text: res.data.data.response }]);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send message');
      setChatMessages((prev) => [
        ...prev,
        { role: 'model', text: '⚠️ Apologies, I could not process that request. Please try again.' },
      ]);
    } finally {
      setChatLoading(false);
    }
  };

  const copyResult = () => {
    navigator.clipboard.writeText(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const tools = [
    { key: 'summarize', label: 'Summarize Note', desc: 'Concise executive summary', icon: AlignLeft, color: '#6366F1' },
    { key: 'keyterms', label: 'Extract Key Terms', desc: 'High-yield definitions', icon: Tag, color: '#10B981' },
    { key: 'flashcards', label: 'Convert to Flashcards', desc: 'Create study deck', icon: Layers, color: '#F59E0B' },
  ];

  return (
    <div className="h-full flex flex-col bg-[#0D1220]">
      {/* Copilot Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#1E293B]">
        <div className="flex items-center gap-2">
          <Brain size={17} className="text-[#6366F1]" />
          <span className="text-sm font-bold text-[#F1F5F9]">AI Copilot</span>
        </div>
        <span className="text-[10px] font-bold bg-[#6366F1]/15 text-[#818CF8] px-2 py-0.5 rounded-full border border-[#6366F1]/30">
          Gemini Pro
        </span>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[#1E293B] px-3 pt-2">
        <button
          onClick={() => setActiveTab('tools')}
          className={`flex-1 pb-2 text-xs font-semibold flex items-center justify-center gap-1.5 border-b-2 transition-colors ${
            activeTab === 'tools'
              ? 'border-[#6366F1] text-[#F1F5F9]'
              : 'border-transparent text-[#64748B] hover:text-[#94A3B8]'
          }`}
        >
          <Sparkles size={13} /> Tools
        </button>
        <button
          onClick={() => setActiveTab('chat')}
          className={`flex-1 pb-2 text-xs font-semibold flex items-center justify-center gap-1.5 border-b-2 transition-colors ${
            activeTab === 'chat'
              ? 'border-[#6366F1] text-[#F1F5F9]'
              : 'border-transparent text-[#64748B] hover:text-[#94A3B8]'
          }`}
        >
          <MessageSquare size={13} /> Ask Copilot
        </button>
      </div>

      {/* Tab 1: Tools */}
      {activeTab === 'tools' && (
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="p-3.5 space-y-2 flex-shrink-0">
            {tools.map(({ key, label, desc, icon: Icon, color }) => (
              <button
                key={key}
                onClick={() => runTool(key)}
                disabled={!!loading}
                className="w-full flex items-center gap-3 p-2.5 rounded-xl bg-[#0B0F17]/80 border border-[#1E293B] hover:border-[#334155] text-left transition-all disabled:opacity-50 group"
              >
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-105"
                  style={{ background: `${color}18` }}
                >
                  {loading === key ? (
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" style={{ color }} />
                  ) : (
                    <Icon size={16} style={{ color }} />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-[#F1F5F9] group-hover:text-white truncate">
                    {loading === key ? 'Processing...' : label}
                  </p>
                  <p className="text-[10px] text-[#64748B] truncate">{desc}</p>
                </div>
              </button>
            ))}
          </div>

          {/* AI Result Box */}
          <div className="flex-1 overflow-hidden flex flex-col border-t border-[#1E293B]">
            {result ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex-1 flex flex-col overflow-hidden"
              >
                <div className="flex items-center justify-between px-3.5 py-2 bg-[#0B0F17] border-b border-[#1E293B]/70">
                  <span className="text-[11px] font-bold text-[#818CF8] truncate">{resultTitle}</span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={copyResult}
                      className="text-[11px] text-[#64748B] hover:text-[#94A3B8] flex items-center gap-1 px-1.5 py-0.5 rounded"
                    >
                      {copied ? <Check size={11} className="text-emerald-400" /> : <Copy size={11} />}
                      {copied ? 'Copied' : 'Copy'}
                    </button>
                    <button
                      onClick={() => setResult(null)}
                      className="text-[#64748B] hover:text-[#94A3B8] p-0.5"
                    >
                      <X size={12} />
                    </button>
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto p-3.5 text-xs text-[#CBD5E1] leading-relaxed markdown-body">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{result}</ReactMarkdown>
                </div>
              </motion.div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-6 text-center text-[#475569]">
                <Sparkles size={24} className="mb-2 opacity-40 text-[#6366F1]" />
                <p className="text-xs">Click a tool above to analyze your note with AI</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 2: Ask Copilot Chat */}
      {activeTab === 'chat' && (
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto p-3 space-y-3">
            {chatMessages.map((m, idx) => (
              <div
                key={idx}
                className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[90%] rounded-xl px-3 py-2 text-xs leading-relaxed ${
                    m.role === 'user'
                      ? 'bg-[#6366F1] text-white rounded-br-none'
                      : 'bg-[#151C2C] text-[#E2E8F0] border border-[#1E293B] rounded-bl-none'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{m.text}</p>
                </div>
              </div>
            ))}
            {chatLoading && (
              <div className="flex items-center gap-1.5 text-xs text-[#818CF8] bg-[#151C2C] border border-[#1E293B] px-3 py-2 rounded-xl rounded-bl-none w-max">
                <span className="w-1.5 h-1.5 rounded-full bg-[#6366F1] animate-bounce" />
                <span className="w-1.5 h-1.5 rounded-full bg-[#6366F1] animate-bounce delay-100" />
                <span className="w-1.5 h-1.5 rounded-full bg-[#6366F1] animate-bounce delay-200" />
                <span className="text-[10px] ml-1">Thinking...</span>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          <form onSubmit={handleSendChat} className="p-2 border-t border-[#1E293B] flex gap-1.5">
            <input
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="Ask Copilot about this note..."
              className="flex-1 bg-[#0B0F17] border border-[#1E293B] rounded-lg px-2.5 py-1.5 text-xs text-[#F1F5F9] placeholder-[#475569] outline-none focus:border-[#6366F1]"
            />
            <button
              type="submit"
              disabled={!chatInput.trim() || chatLoading}
              className="w-8 h-8 rounded-lg bg-[#6366F1] hover:bg-[#4F46E5] text-white flex items-center justify-center transition-colors disabled:opacity-40 flex-shrink-0"
            >
              <Send size={13} />
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default function NotesStudio() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [notes, setNotes] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeNote, setActiveNote] = useState(null);
  const [content, setContent] = useState('');
  const [title, setTitle] = useState('');
  const [emoji, setEmoji] = useState('📝');
  const [preview, setPreview] = useState(false);
  const [showAI, setShowAI] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [shareInfo, setShareInfo] = useState(null);

  const textareaRef = useRef(null);

  const fetchNotes = useCallback(async () => {
    try {
      const res = await api.get('/notes');
      setNotes(res.data?.data || []);
    } catch {
      toast.error('Failed to load notes');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  useEffect(() => {
    if (id && notes.length > 0) {
      const found = notes.find((n) => n._id === id);
      if (found) loadNote(found);
    } else if (!id && notes.length > 0 && !activeNote) {
      loadNote(notes[0]);
    }
  }, [id, notes]);

  const loadNote = (note) => {
    setActiveNote(note);
    setTitle(note.title || 'Untitled Note');
    setContent(note.content || '');
    setEmoji(note.emoji || '📝');
    setDirty(false);
    setShareInfo(note.isShared ? { isShared: true, url: `${window.location.origin}/note/public/${note.shareToken}` } : null);
  };

  const createNote = async () => {
    try {
      const res = await api.post('/notes', {
        title: 'Untitled Note',
        content: '# Untitled Note\n\nStart writing notes with **Markdown** or let AI assist you...',
        emoji: '📝',
      });
      const newNote = res.data.data;
      setNotes((prev) => [newNote, ...prev]);
      loadNote(newNote);
      navigate(`/notes/${newNote._id}`);
      toast.success('New note created! ✍️');
    } catch {
      toast.error('Failed to create note');
    }
  };

  const saveNote = async () => {
    if (!activeNote) return;
    setSaving(true);
    try {
      const res = await api.put(`/notes/${activeNote._id}`, { title, content, emoji });
      const updated = res.data.data;
      setNotes((prev) => prev.map((n) => (n._id === updated._id ? updated : n)));
      setActiveNote(updated);
      setDirty(false);
      toast.success('Note saved', { id: 'note-save' });
    } catch {
      toast.error('Failed to save note');
    } finally {
      setSaving(false);
    }
  };

  const deleteNote = async () => {
    if (!activeNote || !confirm('Permanently delete this note?')) return;
    try {
      await api.delete(`/notes/${activeNote._id}`);
      const remaining = notes.filter((n) => n._id !== activeNote._id);
      setNotes(remaining);
      if (remaining.length > 0) {
        loadNote(remaining[0]);
        navigate(`/notes/${remaining[0]._id}`);
      } else {
        setActiveNote(null);
        setTitle('');
        setContent('');
        navigate('/notes');
      }
      toast.success('Note deleted');
    } catch {
      toast.error('Failed to delete note');
    }
  };

  const toggleShare = async () => {
    if (!activeNote) return;
    try {
      const res = await api.patch(`/notes/${activeNote._id}/share`);
      const { isShared, shareToken } = res.data.data;
      const shareUrl = `${window.location.origin}/note/public/${shareToken}`;
      setShareInfo({ isShared, url: isShared ? shareUrl : null });

      if (isShared) {
        navigator.clipboard.writeText(shareUrl);
        toast.success('Public link copied to clipboard! 🔗');
      } else {
        toast.success('Public sharing disabled');
      }
    } catch {
      toast.error('Failed to toggle share state');
    }
  };

  const downloadMarkdown = () => {
    if (!activeNote) return;
    const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.md`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success('Downloaded .md file 📥');
  };

  const insertMarkdown = (syntax, placeholder = '') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = content.substring(start, end) || placeholder;

    let replacement = '';
    if (syntax === 'bold') replacement = `**${selected}**`;
    else if (syntax === 'italic') replacement = `*${selected}*`;
    else if (syntax === 'h2') replacement = `\n## ${selected}\n`;
    else if (syntax === 'code') replacement = `\`${selected}\``;
    else if (syntax === 'list') replacement = `\n- ${selected}`;

    const newContent = content.substring(0, start) + replacement + content.substring(end);
    setContent(newContent);
    setDirty(true);
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + replacement.length, start + replacement.length);
    }, 10);
  };

  // Auto-save debounce (3 seconds)
  useEffect(() => {
    if (!dirty || !activeNote) return;
    const timer = setTimeout(saveNote, 3000);
    return () => clearTimeout(timer);
  }, [content, title, dirty]);

  const filteredNotes = notes.filter((n) =>
    n.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex h-screen overflow-hidden">
      {/* ── Left Sidebar: Notes Navigator ────────────────────────────────────── */}
      <div className="w-64 flex-shrink-0 border-r border-[#1E293B] bg-[#0D1220] flex flex-col hidden lg:flex">
        <div className="p-3.5 border-b border-[#1E293B] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText size={16} className="text-[#818CF8]" />
            <span className="text-xs font-bold uppercase tracking-wider text-[#94A3B8]">
              Notebook
            </span>
          </div>
          <button
            onClick={createNote}
            className="w-7 h-7 rounded-lg bg-[#6366F1]/15 hover:bg-[#6366F1]/30 text-[#818CF8] flex items-center justify-center transition-colors"
            title="Create note"
          >
            <Plus size={15} />
          </button>
        </div>

        {/* Search Notes */}
        <div className="p-2 border-b border-[#1E293B]">
          <div className="relative">
            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#475569]" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter notes..."
              className="w-full bg-[#0B0F17] border border-[#1E293B] rounded-lg pl-8 pr-2.5 py-1 text-xs text-[#F1F5F9] placeholder-[#475569] outline-none"
            />
          </div>
        </div>

        {/* Notes List */}
        <div className="flex-1 overflow-y-auto py-2 px-1.5 space-y-1">
          {loading ? (
            <NoteSkeleton />
          ) : filteredNotes.length === 0 ? (
            <div className="text-center py-12 px-4">
              <FileText size={28} className="mx-auto text-[#1E293B] mb-2" />
              <p className="text-xs text-[#475569]">No notes found</p>
              <button
                onClick={createNote}
                className="btn-ghost text-xs mt-3 inline-flex items-center gap-1 text-[#818CF8]"
              >
                <Plus size={12} /> New Note
              </button>
            </div>
          ) : (
            filteredNotes.map((note) => {
              const isSelected = activeNote?._id === note._id;
              return (
                <button
                  key={note._id}
                  onClick={() => {
                    loadNote(note);
                    navigate(`/notes/${note._id}`);
                  }}
                  className={`w-full text-left px-3 py-2 rounded-xl transition-all ${
                    isSelected
                      ? 'bg-[#6366F1]/15 border border-[#6366F1]/30 text-[#F1F5F9]'
                      : 'hover:bg-[#1E293B]/60 text-[#94A3B8] border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm">{note.emoji || '📝'}</span>
                    <span className="text-xs font-semibold truncate flex-1">{note.title}</span>
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-[#475569] mt-1 pl-6">
                    <span>
                      {new Date(note.updatedAt || Date.now()).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </span>
                    {note.isShared && (
                      <span className="text-indigo-400 font-medium flex items-center gap-0.5">
                        <Link2 size={9} /> shared
                      </span>
                    )}
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* ── Center Editor Area ──────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col overflow-hidden bg-[#0B0F17]">
        {activeNote ? (
          <>
            {/* Top Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 border-b border-[#1E293B] bg-[#0D1220]">
              <div className="flex items-center gap-2 flex-1 min-w-[200px]">
                <input
                  value={emoji}
                  onChange={(e) => {
                    setEmoji(e.target.value);
                    setDirty(true);
                  }}
                  className="w-8 text-center bg-transparent text-xl outline-none cursor-pointer"
                  maxLength={2}
                  title="Change emoji"
                />
                <input
                  value={title}
                  onChange={(e) => {
                    setTitle(e.target.value);
                    setDirty(true);
                  }}
                  placeholder="Note Title..."
                  className="flex-1 bg-transparent text-base md:text-lg font-bold text-[#F1F5F9] outline-none placeholder-[#334155]"
                />
                {dirty && (
                  <span className="text-[11px] text-[#F59E0B] bg-amber-500/10 px-2 py-0.5 rounded font-mono">
                    Unsaved
                  </span>
                )}
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <button
                  onClick={() => setPreview((p) => !p)}
                  className={`btn-ghost text-xs py-1.5 px-2.5 ${preview ? 'text-[#818CF8] bg-[#6366F1]/10' : ''}`}
                  title="Toggle Markdown Preview"
                >
                  {preview ? <Edit3 size={14} /> : <Eye size={14} />}
                  <span className="hidden sm:inline">{preview ? 'Edit' : 'Preview'}</span>
                </button>

                <button
                  onClick={toggleShare}
                  className={`btn-ghost text-xs py-1.5 px-2.5 ${shareInfo?.isShared ? 'text-indigo-400' : ''}`}
                  title="Share Note"
                >
                  <Share2 size={14} />
                  <span className="hidden sm:inline">Share</span>
                </button>

                <button
                  onClick={downloadMarkdown}
                  className="btn-ghost text-xs py-1.5 px-2.5"
                  title="Download .md"
                >
                  <Download size={14} />
                </button>

                <button
                  onClick={saveNote}
                  disabled={saving}
                  className="btn-primary text-xs py-1.5 px-3"
                >
                  <Save size={14} />
                  <span className="hidden sm:inline">{saving ? 'Saving...' : 'Save'}</span>
                </button>

                <button
                  onClick={deleteNote}
                  className="btn-danger text-xs py-1.5 px-2"
                  title="Delete Note"
                >
                  <Trash2 size={13} />
                </button>

                <button
                  onClick={() => setShowAI((v) => !v)}
                  className={`btn-ghost text-xs py-1.5 px-2.5 ${
                    showAI ? 'text-[#818CF8] bg-[#6366F1]/10 border border-[#6366F1]/30' : ''
                  }`}
                  title="Toggle AI Copilot"
                >
                  <Sparkles size={14} className="text-[#818CF8]" />
                  <span className="hidden sm:inline">Copilot</span>
                </button>
              </div>
            </div>

            {/* Markdown formatting quickbar (when editing) */}
            {!preview && (
              <div className="flex items-center gap-1 px-4 py-1.5 border-b border-[#1E293B]/70 bg-[#0B0F17] text-xs text-[#64748B]">
                <button
                  onClick={() => insertMarkdown('bold', 'bold text')}
                  className="p-1 hover:text-[#F1F5F9] rounded hover:bg-[#1E293B]"
                  title="Bold"
                >
                  <Bold size={13} />
                </button>
                <button
                  onClick={() => insertMarkdown('italic', 'italic text')}
                  className="p-1 hover:text-[#F1F5F9] rounded hover:bg-[#1E293B]"
                  title="Italic"
                >
                  <Italic size={13} />
                </button>
                <button
                  onClick={() => insertMarkdown('h2', 'Heading')}
                  className="p-1 hover:text-[#F1F5F9] rounded hover:bg-[#1E293B]"
                  title="Heading"
                >
                  <Heading2 size={13} />
                </button>
                <button
                  onClick={() => insertMarkdown('code', 'code')}
                  className="p-1 hover:text-[#F1F5F9] rounded hover:bg-[#1E293B]"
                  title="Inline Code"
                >
                  <Code size={13} />
                </button>
                <button
                  onClick={() => insertMarkdown('list', 'List item')}
                  className="p-1 hover:text-[#F1F5F9] rounded hover:bg-[#1E293B]"
                  title="Bullet List"
                >
                  <List size={13} />
                </button>
                <span className="text-[#334155] mx-1">|</span>
                <span className="text-[11px] text-[#475569]">Markdown Supported</span>
              </div>
            )}

            {/* Public Link Notification Banner */}
            {shareInfo?.isShared && (
              <div className="flex items-center justify-between px-4 py-2 bg-[#6366F1]/10 border-b border-[#6366F1]/20 text-xs text-[#818CF8]">
                <div className="flex items-center gap-2 truncate">
                  <Link2 size={13} className="flex-shrink-0" />
                  <span className="truncate">Public Link: {shareInfo.url}</span>
                </div>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(shareInfo.url);
                    toast.success('Copied share link!');
                  }}
                  className="text-xs font-bold underline ml-2 flex-shrink-0"
                >
                  Copy Link
                </button>
              </div>
            )}

            {/* Editor Body */}
            <div className="flex-1 flex overflow-hidden">
              {/* Document Input or Preview */}
              <div className="flex-1 overflow-y-auto">
                {preview ? (
                  <div className="p-6 md:p-10 max-w-4xl mx-auto markdown-body">
                    {content ? (
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
                    ) : (
                      <p className="text-[#475569] italic">Nothing to preview yet...</p>
                    )}
                  </div>
                ) : (
                  <textarea
                    ref={textareaRef}
                    value={content}
                    onChange={(e) => {
                      setContent(e.target.value);
                      setDirty(true);
                    }}
                    placeholder={`# Welcome to Note Studio\n\nStart writing in Markdown...\n\n- Press the AI Copilot ✨ button to summarize or generate flashcards\n- Switch to Preview mode anytime`}
                    className="w-full h-full bg-transparent text-[#CBD5E1] p-6 md:p-8 font-mono text-sm leading-relaxed resize-none outline-none"
                    spellCheck
                  />
                )}
              </div>

              {/* AI Copilot Split Screen Drawer */}
              <AnimatePresence>
                {showAI && (
                  <motion.div
                    initial={{ width: 0, opacity: 0 }}
                    animate={{ width: 320, opacity: 1 }}
                    exit={{ width: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="border-l border-[#1E293B] overflow-hidden flex-shrink-0 hidden md:block"
                  >
                    <AICopilot
                      noteId={activeNote._id}
                      noteTitle={title}
                      noteContent={content}
                      onFlashcardsGenerated={fetchNotes}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
            <div className="w-16 h-16 rounded-2xl bg-[#1E293B]/70 flex items-center justify-center mb-4">
              <FileText size={32} className="text-[#475569]" />
            </div>
            <h3 className="text-lg font-bold text-[#F1F5F9]">No note selected</h3>
            <p className="text-xs text-[#64748B] mt-1 max-w-sm mb-5">
              Select an existing note from the sidebar or initialize a fresh document to begin.
            </p>
            <button onClick={createNote} className="btn-primary">
              <Plus size={16} /> Create Note
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
