// components/CommandPalette.jsx — Global Ctrl+K command palette
// Opens a search modal to navigate pages or trigger quick actions.

import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, LayoutDashboard, FileText, BookOpen, CheckSquare, Timer, Layers, Plus, Zap } from 'lucide-react';

const commands = [
  { id: 'dashboard', label: 'Go to Dashboard', icon: LayoutDashboard, path: '/', group: 'Navigate' },
  { id: 'notes', label: 'Go to Note Studio', icon: FileText, path: '/notes', group: 'Navigate' },
  { id: 'subjects', label: 'Go to Subjects', icon: BookOpen, path: '/subjects', group: 'Navigate' },
  { id: 'tasks', label: 'Go to Task Board', icon: CheckSquare, path: '/tasks', group: 'Navigate' },
  { id: 'focus', label: 'Open Focus Room', icon: Timer, path: '/focus', group: 'Navigate' },
  { id: 'flashcards', label: 'Open Flashcards', icon: Layers, path: '/flashcards', group: 'Navigate' },
  { id: 'new-note', label: 'Create New Note', icon: Plus, path: '/notes', group: 'Actions' },
  { id: 'start-focus', label: 'Start Focus Timer', icon: Zap, path: '/focus', group: 'Actions' },
];

export default function CommandPalette() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef(null);

  // Filter commands by query
  const filtered = query
    ? commands.filter(c => c.label.toLowerCase().includes(query.toLowerCase()))
    : commands;

  // ── Global keyboard listener: Ctrl+K or Cmd+K ─────────────────────────────
  useEffect(() => {
    const handler = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setOpen(prev => !prev);
        setQuery('');
        setSelectedIndex(0);
      }
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  // Auto-focus input when palette opens
  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 50);
  }, [open]);

  // Arrow key navigation within the list
  useEffect(() => {
    const handler = (e) => {
      if (!open) return;
      if (e.key === 'ArrowDown') { e.preventDefault(); setSelectedIndex(i => Math.min(i + 1, filtered.length - 1)); }
      if (e.key === 'ArrowUp') { e.preventDefault(); setSelectedIndex(i => Math.max(i - 1, 0)); }
      if (e.key === 'Enter' && filtered[selectedIndex]) {
        execute(filtered[selectedIndex]);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, filtered, selectedIndex]);

  const execute = (command) => {
    navigate(command.path);
    setOpen(false);
    setQuery('');
  };

  // Group commands for display
  const groups = [...new Set(filtered.map(c => c.group))];

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            onClick={() => setOpen(false)}
          />

          {/* Palette modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="fixed top-[20%] left-1/2 -translate-x-1/2 z-50 w-full max-w-lg mx-4"
          >
            <div className="glass-card overflow-hidden shadow-2xl">
              {/* Search input */}
              <div className="flex items-center gap-3 px-4 py-3 border-b border-[#1E293B]">
                <Search size={18} className="text-[#475569] flex-shrink-0" />
                <input
                  ref={inputRef}
                  value={query}
                  onChange={e => { setQuery(e.target.value); setSelectedIndex(0); }}
                  placeholder="Search commands or pages..."
                  className="flex-1 bg-transparent text-[#F1F5F9] placeholder-[#475569] outline-none text-sm"
                />
                <kbd className="text-xs text-[#475569] bg-[#1E293B] px-1.5 py-0.5 rounded border border-[#334155]">ESC</kbd>
              </div>

              {/* Command list */}
              <div className="max-h-72 overflow-y-auto py-2">
                {filtered.length === 0 ? (
                  <p className="text-center text-[#475569] text-sm py-8">No results for "{query}"</p>
                ) : (
                  groups.map(group => (
                    <div key={group}>
                      <p className="text-[10px] font-semibold text-[#475569] uppercase tracking-wider px-4 py-1.5">{group}</p>
                      {filtered.filter(c => c.group === group).map((cmd, idx) => {
                        const globalIdx = filtered.indexOf(cmd);
                        return (
                          <button
                            key={cmd.id}
                            onClick={() => execute(cmd)}
                            onMouseEnter={() => setSelectedIndex(globalIdx)}
                            className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
                              selectedIndex === globalIdx
                                ? 'bg-[#6366F1]/15 text-[#F1F5F9]'
                                : 'text-[#94A3B8] hover:bg-[#1E293B]'
                            }`}
                          >
                            <cmd.icon size={16} className={selectedIndex === globalIdx ? 'text-[#6366F1]' : 'text-[#475569]'} />
                            {cmd.label}
                          </button>
                        );
                      })}
                    </div>
                  ))
                )}
              </div>

              {/* Footer hint */}
              <div className="border-t border-[#1E293B] px-4 py-2 flex items-center gap-4 text-[#475569] text-xs">
                <span><kbd className="bg-[#1E293B] px-1 rounded">↑↓</kbd> navigate</span>
                <span><kbd className="bg-[#1E293B] px-1 rounded">↵</kbd> select</span>
                <span><kbd className="bg-[#1E293B] px-1 rounded">Ctrl+K</kbd> toggle</span>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
