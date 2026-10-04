// pages/NotesStudio.jsx — Neo-Brutalist split-screen Markdown note editor with AI copilot panel
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

// ── Skeleton for note list ─────────────────────────────────────────────────────
const NoteSkeleton = () => (
  <div className="space-y-2.5 px-3 py-2">
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
    { key: 'summarize', label: 'Summarize Note', desc: 'Concise executive summary', icon: AlignLeft, color: '#A3E635' },
    { key: 'keyterms', label: 'Extract Key Terms', desc: 'High-yield definitions', icon: Tag, color: '#86EFAC' },
    { key: 'flashcards', label: 'Convert to Flashcards', desc: 'Create study deck', icon: Layers, color: '#FCD34D' },
  ];

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Copilot Header */}
      <div className="flex items-center justify-between px-4 py-3.5 border-b-2 border-black bg-white">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-[#A3E635] flex items-center justify-center border-2 border-black shadow-[1px_1px_0px_#000]">
            <Brain size={16} className="text-black stroke-[2.5]" />
          </div>
          <span className="text-sm font-black text-[#111827]">AI Copilot</span>
        </div>
        <span className="text-[10px] font-black bg-[#A3E635] text-black px-2 py-0.5 rounded-full border-2 border-black shadow-[1px_1px_0px_#000]">
          Gemini Pro
        </span>
      </div>

      {/* Tabs */}
      <div className="flex border-b-2 border-black px-3 py-2 bg-[#F9FAFB] gap-2">
        <button
          onClick={() => setActiveTab('tools')}
          className={`flex-1 py-1.5 px-2 text-xs font-black rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
            activeTab === 'tools'
              ? 'bg-[#A3E635] text-black border-2 border-black shadow-[2px_2px_0px_#000]'
              : 'text-[#4B5563] hover:text-black border-2 border-transparent hover:bg-white'
          }`}
        >
          <Sparkles size={13} className="stroke-[2.5]" /> Tools
        </button>
        <button
          onClick={() => setActiveTab('chat')}
          className={`flex-1 py-1.5 px-2 text-xs font-black rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
            activeTab === 'chat'
              ? 'bg-[#A3E635] text-black border-2 border-black shadow-[2px_2px_0px_#000]'
              : 'text-[#4B5563] hover:text-black border-2 border-transparent hover:bg-white'
          }`}
        >
          <MessageSquare size={13} className="stroke-[2.5]" /> Ask Copilot
        </button>
      </div>

      {/* Tab 1: Tools */}
      {activeTab === 'tools' && (
        <div className="flex-1 flex flex-col overflow-hidden bg-white">
          <div className="p-3.5 space-y-2.5 flex-shrink-0">
            {tools.map(({ key, label, desc, icon: Icon, color }) => (
              <button
                key={key}
                onClick={() => runTool(key)}
                disabled={!!loading}
                className="w-full flex items-center gap-3 p-3 rounded-xl bg-white border-2 border-black shadow-[2px_2px_0px_#000] hover:shadow-[4px_4px_0px_#000] hover:-translate-y-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0px_#000] text-left transition-all disabled:opacity-50 group cursor-pointer"
              >
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 border-2 border-black shadow-[1px_1px_0px_#000]"
                  style={{ backgroundColor: color }}
                >
                  {loading === key ? (
                    <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Icon size={16} className="text-black stroke-[2.5]" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-black text-[#111827] truncate">
                    {loading === key ? 'Analyzing with AI...' : label}
                  </p>
                  <p className="text-[10px] font-bold text-[#4B5563] truncate">{desc}</p>
                </div>
              </button>
            ))}
          </div>

          {/* AI Result Box */}
          <div className="flex-1 overflow-hidden flex flex-col border-t-2 border-black bg-[#F9FAFB]">
            {result ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex-1 flex flex-col overflow-hidden"
              >
                <div className="flex items-center justify-between px-3.5 py-2 bg-[#A3E635] border-b-2 border-black">
                  <span className="text-xs font-black text-black truncate">{resultTitle}</span>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={copyResult}
                      className="text-xs font-black text-black bg-white hover:bg-gray-100 flex items-center gap-1 px-2 py-0.5 rounded-lg border-2 border-black shadow-[1px_1px_0px_#000] cursor-pointer"
                    >
                      {copied ? <Check size={12} className="stroke-[3] text-emerald-600" /> : <Copy size={12} className="stroke-[2.5]" />}
                      {copied ? 'Copied' : 'Copy'}
                    </button>
                    <button
                      onClick={() => setResult(null)}
                      className="text-black hover:bg-black/10 p-1 rounded-lg border border-black cursor-pointer"
                    >
                      <X size={13} className="stroke-[2.5]" />
                    </button>
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto p-4 text-xs text-[#111827] leading-relaxed markdown-body bg-white">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{result}</ReactMarkdown>
                </div>
              </motion.div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-6 text-center text-[#4B5563]">
                <div className="w-10 h-10 rounded-xl bg-white border-2 border-black flex items-center justify-center mb-2 shadow-[2px_2px_0px_#000]">
                  <Sparkles size={20} className="text-black stroke-[2]" />
                </div>
                <p className="text-xs font-black text-[#111827]">AI Copilot Ready</p>
                <p className="text-[11px] font-bold text-[#6B7280] mt-1 max-w-[200px]">
                  Click a tool above to analyze your note with Gemini Pro
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 2: Ask Copilot Chat */}
      {activeTab === 'chat' && (
        <div className="flex-1 flex flex-col overflow-hidden bg-[#F9FAFB]">
          <div className="flex-1 overflow-y-auto p-3 space-y-3">
            {chatMessages.map((m, idx) => (
              <div
                key={idx}
                className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[90%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed border-2 border-black shadow-[2px_2px_0px_#000] ${
                    m.role === 'user'
                      ? 'bg-[#A3E635] text-black font-bold rounded-br-none'
                      : 'bg-white text-[#111827] font-medium rounded-bl-none'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{m.text}</p>
                </div>
              </div>
            ))}
            {chatLoading && (
              <div className="flex items-center gap-1.5 text-xs font-black text-black bg-white border-2 border-black shadow-[2px_2px_0px_#000] px-3 py-2 rounded-2xl rounded-bl-none w-max">
                <span className="w-1.5 h-1.5 rounded-full bg-black animate-bounce" />
                <span className="w-1.5 h-1.5 rounded-full bg-black animate-bounce delay-100" />
                <span className="w-1.5 h-1.5 rounded-full bg-black animate-bounce delay-200" />
                <span className="text-[11px] ml-1">Thinking...</span>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          <form onSubmit={handleSendChat} className="p-2.5 border-t-2 border-black bg-white flex gap-2">
            <input
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="Ask Copilot about this note..."
              className="flex-1 bg-white border-2 border-black rounded-xl px-3 py-1.5 text-xs font-bold text-[#111827] placeholder-[#6B7280] outline-none shadow-[2px_2px_0px_#000]"
            />
            <button
              type="submit"
              disabled={!chatInput.trim() || chatLoading}
              className="w-8 h-8 rounded-xl bg-[#A3E635] hover:bg-[#8cee2b] text-black border-2 border-black shadow-[2px_2px_0px_#000] flex items-center justify-center transition-all disabled:opacity-40 flex-shrink-0 cursor-pointer active:translate-x-0.5 active:translate-y-0.5"
            >
              <Send size={14} className="stroke-[2.5]" />
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
    <div className="flex h-screen overflow-hidden bg-[#F0FDF4]">
      {/* ── Left Sidebar: Notebook Panel (Clean White, 2px Solid Black Border) ── */}
      <div className="w-72 flex-shrink-0 border-r-2 border-black bg-white flex flex-col hidden lg:flex">
        {/* Notebook Header */}
        <div className="p-3.5 border-b-2 border-black flex items-center justify-between bg-white">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#A3E635] flex items-center justify-center border-2 border-black shadow-[1px_1px_0px_#000]">
              <FileText size={15} className="text-black stroke-[2.5]" />
            </div>
            <span className="text-xs font-black uppercase tracking-wider text-[#111827]">
              Notebook
            </span>
            <span className="text-[10px] font-black bg-[#F0FDF4] text-black px-1.5 py-0.2 rounded-md border border-black">
              {notes.length}
            </span>
          </div>

          <button
            onClick={createNote}
            className="w-8 h-8 rounded-xl bg-[#A3E635] hover:bg-[#8cee2b] text-black flex items-center justify-center border-2 border-black shadow-[2px_2px_0px_#000] hover:shadow-[3px_3px_0px_#000] transition-all cursor-pointer active:translate-x-0.5 active:translate-y-0.5"
            title="Create note"
          >
            <Plus size={16} className="stroke-[3]" />
          </button>
        </div>

        {/* Search Input */}
        <div className="p-2.5 border-b-2 border-black bg-[#F9FAFB]">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-black stroke-[2.5]" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter notes..."
              className="w-full bg-white border-2 border-black rounded-xl pl-9 pr-3 py-1.5 text-xs font-bold text-[#111827] placeholder-[#6B7280] outline-none shadow-[2px_2px_0px_#000]"
            />
          </div>
        </div>

        {/* Notes List */}
        <div className="flex-1 overflow-y-auto p-2.5 space-y-1.5">
          {loading ? (
            <NoteSkeleton />
          ) : filteredNotes.length === 0 ? (
            <div className="text-center py-12 px-4">
              <div className="w-12 h-12 rounded-2xl bg-[#F0FDF4] border-2 border-black flex items-center justify-center mx-auto mb-3 shadow-[2px_2px_0px_#000]">
                <FileText size={24} className="text-[#15803D] stroke-[2.5]" />
              </div>
              <p className="text-xs font-black text-[#111827]">No notes found</p>
              <button
                onClick={createNote}
                className="btn-primary text-xs mt-3.5 inline-flex items-center gap-1.5 py-1.5 px-3"
              >
                <Plus size={13} className="stroke-[3]" /> New Note
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
                  className={`w-full text-left px-3 py-2.5 rounded-xl transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-[#A3E635] text-black border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]'
                      : 'bg-white hover:bg-[#F0FDF4] text-[#1F2937] border-2 border-transparent hover:border-black/30'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm">{note.emoji || '📝'}</span>
                    <span className="text-xs font-black truncate flex-1">{note.title}</span>
                  </div>
                  <div className="flex items-center justify-between text-[10px] font-bold text-[#4B5563] mt-1 pl-6">
                    <span>
                      {new Date(note.updatedAt || Date.now()).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </span>
                    {note.isShared && (
                      <span className="text-black bg-white px-1.5 py-0.2 rounded border border-black font-black flex items-center gap-0.5 shadow-[1px_1px_0px_#000]">
                        <Link2 size={9} className="stroke-[3]" /> shared
                      </span>
                    )}
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* ── Main Workspace: Crisp White Panels with 2px Solid Black Borders ── */}
      <div className="flex-1 flex flex-col overflow-hidden bg-white">
        {activeNote ? (
          <>
            {/* Top Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-2.5 px-4 py-3 border-b-2 border-black bg-white">
              <div className="flex items-center gap-2.5 flex-1 min-w-[200px]">
                <input
                  value={emoji}
                  onChange={(e) => {
                    setEmoji(e.target.value);
                    setDirty(true);
                  }}
                  className="w-9 h-9 text-center bg-[#F0FDF4] border-2 border-black rounded-xl text-lg outline-none cursor-pointer shadow-[2px_2px_0px_#000]"
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
                  className="flex-1 bg-transparent text-base md:text-xl font-black text-[#111827] outline-none placeholder-[#9CA3AF]"
                />
                {dirty && (
                  <span className="text-[11px] font-black text-black bg-[#FDE047] px-2 py-0.5 rounded-lg border-2 border-black shadow-[2px_2px_0px_#000]">
                    Unsaved
                  </span>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={() => setPreview((p) => !p)}
                  className={`btn-ghost text-xs py-1.5 px-2.5 ${preview ? 'bg-[#A3E635]' : ''}`}
                  title="Toggle Markdown Preview"
                >
                  {preview ? <Edit3 size={14} className="stroke-[2.5]" /> : <Eye size={14} className="stroke-[2.5]" />}
                  <span className="hidden sm:inline">{preview ? 'Edit' : 'Preview'}</span>
                </button>

                <button
                  onClick={toggleShare}
                  className={`btn-ghost text-xs py-1.5 px-2.5 ${shareInfo?.isShared ? 'bg-[#A3E635]' : ''}`}
                  title="Share Note"
                >
                  <Share2 size={14} className="stroke-[2.5]" />
                  <span className="hidden sm:inline">Share</span>
                </button>

                <button
                  onClick={downloadMarkdown}
                  className="btn-ghost text-xs py-1.5 px-2.5"
                  title="Download .md file"
                >
                  <Download size={14} className="stroke-[2.5]" />
                </button>

                <button
                  onClick={saveNote}
                  disabled={saving}
                  className="btn-primary text-xs py-1.5 px-3.5"
                >
                  <Save size={14} className="stroke-[2.5]" />
                  <span className="hidden sm:inline">{saving ? 'Saving...' : 'Save'}</span>
                </button>

                <button
                  onClick={deleteNote}
                  className="btn-danger text-xs py-1.5 px-2.5"
                  title="Delete Note"
                >
                  <Trash2 size={14} className="stroke-[2.5]" />
                </button>

                <button
                  onClick={() => setShowAI((v) => !v)}
                  className={`btn-ghost text-xs py-1.5 px-2.5 ${
                    showAI ? 'bg-[#A3E635] border-2 border-black' : ''
                  }`}
                  title="Toggle AI Copilot"
                >
                  <Sparkles size={14} className="stroke-[2.5] text-black" />
                  <span className="hidden sm:inline">Copilot</span>
                </button>
              </div>
            </div>

            {/* Markdown Formatting Quickbar (when editing) */}
            {!preview && (
              <div className="flex items-center gap-1.5 px-4 py-2 border-b-2 border-black bg-[#F9FAFB] text-xs font-bold text-[#111827]">
                <button
                  onClick={() => insertMarkdown('bold', 'bold text')}
                  className="p-1.5 hover:bg-white rounded-lg border border-transparent hover:border-black transition-colors"
                  title="Bold"
                >
                  <Bold size={14} className="stroke-[3]" />
                </button>
                <button
                  onClick={() => insertMarkdown('italic', 'italic text')}
                  className="p-1.5 hover:bg-white rounded-lg border border-transparent hover:border-black transition-colors"
                  title="Italic"
                >
                  <Italic size={14} className="stroke-[3]" />
                </button>
                <button
                  onClick={() => insertMarkdown('h2', 'Heading')}
                  className="p-1.5 hover:bg-white rounded-lg border border-transparent hover:border-black transition-colors"
                  title="Heading"
                >
                  <Heading2 size={14} className="stroke-[3]" />
                </button>
                <button
                  onClick={() => insertMarkdown('code', 'code')}
                  className="p-1.5 hover:bg-white rounded-lg border border-transparent hover:border-black transition-colors"
                  title="Inline Code"
                >
                  <Code size={14} className="stroke-[3]" />
                </button>
                <button
                  onClick={() => insertMarkdown('list', 'List item')}
                  className="p-1.5 hover:bg-white rounded-lg border border-transparent hover:border-black transition-colors"
                  title="Bullet List"
                >
                  <List size={14} className="stroke-[3]" />
                </button>
                <span className="text-[#D1D5DB] mx-1 font-normal">|</span>
                <span className="text-[11px] font-black text-[#6B7280]">Markdown Enabled</span>
              </div>
            )}

            {/* Public Link Notification Banner */}
            {shareInfo?.isShared && (
              <div className="flex items-center justify-between px-4 py-2 bg-[#ECFDF5] border-b-2 border-black text-xs font-black text-[#15803D]">
                <div className="flex items-center gap-2 truncate">
                  <Link2 size={14} className="flex-shrink-0 stroke-[3]" />
                  <span className="truncate">Public Link: {shareInfo.url}</span>
                </div>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(shareInfo.url);
                    toast.success('Copied share link!');
                  }}
                  className="text-xs font-black text-black bg-white px-2 py-0.5 rounded-lg border-2 border-black shadow-[1px_1px_0px_#000] ml-2 flex-shrink-0 cursor-pointer"
                >
                  Copy Link
                </button>
              </div>
            )}

            {/* Editor Body */}
            <div className="flex-1 flex overflow-hidden bg-white">
              {/* Document Input or Preview */}
              <div className="flex-1 overflow-y-auto">
                {preview ? (
                  <div className="p-6 md:p-10 max-w-4xl mx-auto markdown-body">
                    {content ? (
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
                    ) : (
                      <p className="text-[#9CA3AF] italic">Nothing to preview yet...</p>
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
                    className="w-full h-full bg-white text-[#111827] p-6 md:p-8 font-mono text-sm leading-relaxed resize-none outline-none"
                    spellCheck
                  />
                )}
              </div>

              {/* AI Copilot Split Screen Drawer */}
              <AnimatePresence>
                {showAI && (
                  <motion.div
                    initial={{ width: 0, opacity: 0 }}
                    animate={{ width: 330, opacity: 1 }}
                    exit={{ width: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="border-l-2 border-black overflow-hidden flex-shrink-0 hidden md:block bg-white"
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
          /* ── 'No note selected' State: Vibrant, Living Neo-Brutalist Sticker Area ── */
          <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-10 text-center bg-[#F0FDF4] relative overflow-hidden">
            {/* Background Vector Starbursts & Sparkles Accents */}
            <VectorStarburst size={56} className="absolute top-10 left-12 opacity-35 pointer-events-none animate-pulse-slow" />
            <VectorSparkle size={36} className="absolute top-16 right-16 opacity-45 pointer-events-none" />
            <VectorStarburst size={44} className="absolute bottom-12 right-20 opacity-30 pointer-events-none" />
            <VectorSparkle size={32} className="absolute bottom-16 left-24 opacity-40 pointer-events-none" />

            {/* Central Crisp White Container Card with 2px Black Border and Solid Drop Shadow */}
            <motion.div
              initial={{ scale: 0.94, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.25 }}
              className="bg-white rounded-3xl p-8 sm:p-12 max-w-lg w-full border-2 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] relative z-10"
            >
              {/* Card Corner Vector Sparkle */}
              <div className="absolute -top-3 -right-3">
                <VectorStarburst size={32} />
              </div>

              {/* Playful Sticker Icon Illustration */}
              <div className="w-20 h-20 rounded-3xl bg-[#A3E635] border-2 border-black shadow-[4px_4px_0px_#000] flex items-center justify-center mx-auto mb-6 relative">
                <FileText size={38} className="text-black stroke-[2.5]" />
                <div className="absolute -bottom-1 -right-1 w-7 h-7 bg-white rounded-full border-2 border-black flex items-center justify-center shadow-[1px_1px_0px_#000]">
                  <Sparkles size={14} className="text-black stroke-[2.5]" />
                </div>
              </div>

              <h2 className="text-2xl sm:text-3xl font-black text-[#111827] tracking-tight mb-2">
                No note selected
              </h2>

              <p className="text-xs sm:text-sm font-bold text-[#4B5563] max-w-sm mx-auto mb-7 leading-relaxed">
                Select an existing note from the notebook sidebar or ignite a fresh document with Markdown and AI support.
              </p>

              {/* Prominent Lime-Green 'Create Note' Sticker Button */}
              <button
                onClick={createNote}
                className="px-6 py-3.5 bg-[#A3E635] hover:bg-[#8cee2b] active:translate-x-0.5 active:translate-y-0.5 text-black font-black text-sm md:text-base rounded-2xl border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2.5 mx-auto cursor-pointer"
              >
                <Plus size={18} className="stroke-[3]" /> Create Note
              </button>

              {/* Feature Sticker Pills */}
              <div className="flex flex-wrap items-center justify-center gap-2 mt-8 pt-6 border-t-2 border-black/10">
                <span className="text-[11px] font-black bg-[#F0FDF4] text-black px-2.5 py-1 rounded-xl border-2 border-black shadow-[2px_2px_0px_#000]">
                  ✍️ Markdown Editor
                </span>
                <span className="text-[11px] font-black bg-[#DCFCE7] text-black px-2.5 py-1 rounded-xl border-2 border-black shadow-[2px_2px_0px_#000]">
                  ⚡ AI Summaries
                </span>
                <span className="text-[11px] font-black bg-[#FEF08A] text-black px-2.5 py-1 rounded-xl border-2 border-black shadow-[2px_2px_0px_#000]">
                  🃏 Auto Flashcards
                </span>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
}
