// pages/FlashcardPage.jsx — AI Flashcard decks with 3D flip cards & spaced repetition review
import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Layers, Plus, BookOpen, RefreshCw, ArrowRight, ArrowLeft,
  Trophy, X, Calendar, Search, Sparkles, CheckCircle2, ChevronRight, Zap, Trash2
} from 'lucide-react';
import api from '../services/api';
import FlashcardFlip from '../components/FlashcardFlip';
import toast from 'react-hot-toast';

// ── Create Custom Deck Modal ──────────────────────────────────────────────────
const CreateDeckModal = ({ onClose, onCreated }) => {
  const [title, setTitle] = useState('');
  const [cards, setCards] = useState([
    { question: '', answer: '' },
    { question: '', answer: '' },
  ]);
  const [submitting, setSubmitting] = useState(false);

  const handleAddCard = () => {
    setCards((prev) => [...prev, { question: '', answer: '' }]);
  };

  const handleRemoveCard = (index) => {
    setCards((prev) => prev.filter((_, i) => i !== index));
  };

  const handleCardChange = (index, field, value) => {
    setCards((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error('Deck title is required');
      return;
    }
    const validCards = cards.filter((c) => c.question.trim() && c.answer.trim());
    if (validCards.length === 0) {
      toast.error('Add at least one card with question and answer');
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.post('/ai/decks', {
        title: title.trim(),
        cards: validCards,
      });
      toast.success('Deck created successfully! 🃏');
      onCreated(res.data.data);
      onClose();
    } catch {
      toast.error('Failed to create deck');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="glass-card w-full max-w-lg max-h-[85vh] flex flex-col z-10 border border-[#1E293B] shadow-2xl p-6"
      >
        <div className="flex items-center justify-between pb-4 border-b border-[#1E293B] mb-4">
          <h2 className="text-base font-bold text-[#F1F5F9] flex items-center gap-2">
            <Plus size={18} className="text-[#818CF8]" /> Create Custom Flashcard Deck
          </h2>
          <button onClick={onClose} className="text-[#64748B] hover:text-[#94A3B8]">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden space-y-4">
          <div>
            <label className="block text-xs font-medium text-[#94A3B8] mb-1">Deck Title *</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Molecular Biology - Unit 1"
              className="form-input text-sm"
              autoFocus
            />
          </div>

          <div className="flex-1 overflow-y-auto space-y-3 pr-1">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-medium text-[#94A3B8]">Cards ({cards.length})</label>
              <button
                type="button"
                onClick={handleAddCard}
                className="text-xs text-[#818CF8] hover:underline flex items-center gap-1"
              >
                <Plus size={12} /> Add Card
              </button>
            </div>

            {cards.map((c, i) => (
              <div key={i} className="p-3 bg-[#0B0F17]/80 rounded-xl border border-[#1E293B] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-mono font-bold text-[#64748B]">Card #{i + 1}</span>
                  {cards.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveCard(i)}
                      className="text-[#64748B] hover:text-red-400 p-0.5"
                    >
                      <X size={13} />
                    </button>
                  )}
                </div>
                <input
                  value={c.question}
                  onChange={(e) => handleCardChange(i, 'question', e.target.value)}
                  placeholder="Question / Front"
                  className="form-input text-xs py-1.5"
                />
                <input
                  value={c.answer}
                  onChange={(e) => handleCardChange(i, 'answer', e.target.value)}
                  placeholder="Answer / Back"
                  className="form-input text-xs py-1.5"
                />
              </div>
            ))}
          </div>

          <div className="flex gap-2.5 pt-2 border-t border-[#1E293B]">
            <button type="button" onClick={onClose} className="btn-ghost flex-1 justify-center text-xs">
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="btn-primary flex-1 justify-center text-xs"
            >
              {submitting ? 'Creating...' : 'Create Deck'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

// ── Spaced Repetition Review Session ──────────────────────────────────────────
const ReviewSession = ({ deck, onClose, onComplete }) => {
  const [cards, setCards] = useState(() => {
    const today = new Date();
    const due = deck.cards.filter((c) => !c.nextReview || new Date(c.nextReview) <= today);
    return due.length > 0 ? due : deck.cards;
  });

  const [currentIdx, setCurrentIdx] = useState(0);
  const [results, setResults] = useState({ hard: 0, good: 0, easy: 0 });
  const [done, setDone] = useState(false);

  const handleRate = async (cardId, quality) => {
    const label = quality === 0 ? 'hard' : quality === 3 ? 'good' : 'easy';
    setResults((prev) => ({ ...prev, [label]: prev[label] + 1 }));

    try {
      await api.patch(`/ai/decks/${deck._id}/rate`, { cardId, quality });
    } catch {
      toast.error('Failed to log card rating');
    }

    if (currentIdx + 1 >= cards.length) {
      setDone(true);
    } else {
      setCurrentIdx((i) => i + 1);
    }
  };

  if (cards.length === 0) {
    return (
      <div className="py-12 text-center">
        <p className="text-sm text-[#94A3B8]">This deck has no cards to review.</p>
        <button onClick={onClose} className="btn-ghost mt-4">
          Close
        </button>
      </div>
    );
  }

  if (done) {
    const total = cards.length;

    return (
      <div className="flex flex-col items-center gap-6 py-10 text-center">
        <motion.div
          initial={{ scale: 0, rotate: -20 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', damping: 12 }}
          className="w-20 h-20 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400"
        >
          <Trophy size={40} />
        </motion.div>

        <div>
          <h3 className="text-2xl font-extrabold text-[#F1F5F9]">Review Session Complete!</h3>
          <p className="text-xs text-[#64748B] mt-1">
            You successfully reviewed {total} spaced repetition cards
          </p>
        </div>

        {/* Rating Breakdown */}
        <div className="grid grid-cols-3 gap-3 w-full max-w-sm">
          <div className="glass-card p-3 rounded-xl border border-red-500/20 bg-red-950/10">
            <p className="text-xl font-bold font-mono text-red-400">{results.hard}</p>
            <p className="text-[11px] text-[#94A3B8] mt-0.5">Needs Review (1d)</p>
          </div>
          <div className="glass-card p-3 rounded-xl border border-amber-500/20 bg-amber-950/10">
            <p className="text-xl font-bold font-mono text-amber-400">{results.good}</p>
            <p className="text-[11px] text-[#94A3B8] mt-0.5">Retained (6d)</p>
          </div>
          <div className="glass-card p-3 rounded-xl border border-emerald-500/20 bg-emerald-950/10">
            <p className="text-xl font-bold font-mono text-emerald-400">{results.easy}</p>
            <p className="text-[11px] text-[#94A3B8] mt-0.5">Mastered (14d+)</p>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => {
              setCurrentIdx(0);
              setDone(false);
              setResults({ hard: 0, good: 0, easy: 0 });
            }}
            className="btn-ghost text-xs py-2 px-4"
          >
            <RefreshCw size={14} /> Review Again
          </button>
          <button onClick={onComplete} className="btn-primary text-xs py-2 px-5">
            Done
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Session Progress Header */}
      <div>
        <div className="flex items-center justify-between text-xs text-[#94A3B8] mb-2">
          <span className="font-medium">
            Card {currentIdx + 1} of {cards.length}
          </span>
          <div className="flex items-center gap-3">
            <span className="text-[11px] text-[#64748B]">Click card to flip</span>
            <button onClick={onClose} className="text-[#64748B] hover:text-[#F1F5F9]">
              <X size={17} />
            </button>
          </div>
        </div>
        <div className="bg-[#1E293B] rounded-full h-1.5 overflow-hidden">
          <motion.div
            className="h-full bg-[#6366F1] rounded-full"
            animate={{ width: `${((currentIdx + 1) / cards.length) * 100}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </div>

      {/* 3D Flip Card */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentIdx}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.2 }}
        >
          <FlashcardFlip
            card={cards[currentIdx]}
            onRate={handleRate}
            isLast={currentIdx === cards.length - 1}
          />
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

// ── Deck Card Widget ──────────────────────────────────────────────────────────
const DeckCard = ({ deck, onReview, onDelete }) => {
  const totalCards = deck.cards?.length || 0;
  const dueCount = deck.cards?.filter((c) => !c.nextReview || new Date(c.nextReview) <= new Date()).length || 0;

  return (
    <motion.div
      whileHover={{ y: -3 }}
      className="glass-card p-5 border border-[#1E293B] hover:border-[#334155] flex flex-col justify-between transition-all group relative"
    >
      <div>
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="w-10 h-10 rounded-xl bg-[#6366F1]/15 border border-[#6366F1]/30 flex items-center justify-center text-[#818CF8]">
            <Layers size={18} />
          </div>
          <div className="flex items-center gap-1.5">
            {dueCount > 0 ? (
              <span className="text-[11px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                <Calendar size={11} /> {dueCount} due
              </span>
            ) : (
              <span className="text-[11px] font-medium bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-full">
                Up to date
              </span>
            )}
            <button
              onClick={() => onDelete(deck._id)}
              className="p-1 rounded text-[#475569] hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
              title="Delete deck"
            >
              <Trash2 size={13} />
            </button>
          </div>
        </div>

        <h3 className="font-bold text-[#F1F5F9] text-base mb-1 group-hover:text-white line-clamp-1">
          {deck.title}
        </h3>

        {deck.noteRef && (
          <p className="text-xs text-[#64748B] flex items-center gap-1.5 mb-2 truncate">
            <span>{deck.noteRef.emoji || '📝'}</span>
            <span className="truncate">From note: {deck.noteRef.title}</span>
          </p>
        )}

        <p className="text-xs text-[#94A3B8]">
          <span className="font-mono font-bold text-[#F1F5F9]">{totalCards}</span> active flashcards
        </p>
      </div>

      <div className="mt-5 pt-3 border-t border-[#1E293B]/70">
        <button
          onClick={() => onReview(deck)}
          className={`w-full text-xs font-semibold py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 transition-all ${
            dueCount > 0
              ? 'btn-primary'
              : 'bg-[#1E293B] hover:bg-[#334155] text-[#F1F5F9]'
          }`}
        >
          {dueCount > 0 ? `Review ${dueCount} Due Cards` : 'Study Deck'}
          <ArrowRight size={13} />
        </button>
      </div>
    </motion.div>
  );
};

export default function FlashcardPage() {
  const [decks, setDecks] = useState([]);
  const [activeDeck, setActiveDeck] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);

  const fetchDecks = useCallback(async () => {
    try {
      const res = await api.get('/ai/decks');
      setDecks(res.data?.data || []);
    } catch {
      toast.error('Failed to load flashcard decks');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDecks();
  }, [fetchDecks]);

  const handleStartReview = async (deck) => {
    try {
      const res = await api.get(`/ai/decks/${deck._id}`);
      setActiveDeck(res.data.data);
    } catch {
      toast.error('Failed to load flashcards for this deck');
    }
  };

  const handleDeleteDeck = async (deckId) => {
    if (!confirm('Are you sure you want to delete this deck?')) return;
    try {
      await api.delete(`/ai/decks/${deckId}`);
      setDecks((prev) => prev.filter((d) => d._id !== deckId));
      toast.success('Deck removed');
    } catch {
      toast.error('Failed to delete deck');
    }
  };

  const filteredDecks = decks.filter((d) =>
    d.title.toLowerCase().includes(search.toLowerCase())
  );

  const totalCardsCount = decks.reduce((sum, d) => sum + (d.cards?.length || 0), 0);
  const totalDueCount = decks.reduce(
    (sum, d) =>
      sum + (d.cards?.filter((c) => !c.nextReview || new Date(c.nextReview) <= new Date()).length || 0),
    0
  );

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto space-y-8 pb-28 md:pb-12">
      {/* ── Top Header ─────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#1E293B]/80 pb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-[#F1F5F9] flex items-center gap-2.5 tracking-tight">
            <Layers size={26} className="text-[#F59E0B]" />
            Flashcard Decks
          </h1>
          <p className="text-xs md:text-sm text-[#64748B] mt-1">
            Supercharged active recall powered by the SM-2 Spaced Repetition Algorithm
          </p>
        </div>

        {/* Quick Search & Actions */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#475569]" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search decks..."
              className="bg-[#0D1220] border border-[#1E293B] rounded-xl pl-8 pr-3 py-1.5 text-xs text-[#F1F5F9] placeholder-[#475569] outline-none focus:border-[#6366F1]"
            />
          </div>

          <button
            onClick={() => setShowCreateModal(true)}
            className="btn-ghost text-xs py-2 px-3"
          >
            <Plus size={14} /> New Deck
          </button>

          <button
            onClick={() => (window.location.href = '/notes')}
            className="btn-primary text-xs py-2 px-3.5"
            title="Generate flashcards from a note"
          >
            <Sparkles size={14} /> AI Generate
          </button>
        </div>
      </div>

      {/* ── Daily Summary Card ─────────────────────────────────────────────── */}
      {decks.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="glass-card p-4 border border-[#1E293B] flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/15 flex items-center justify-center text-amber-400">
              <Calendar size={18} />
            </div>
            <div>
              <p className="text-xl font-bold font-mono text-[#F1F5F9]">{totalDueCount}</p>
              <p className="text-xs text-[#64748B]">Cards Due for Review Today</p>
            </div>
          </div>

          <div className="glass-card p-4 border border-[#1E293B] flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/15 flex items-center justify-center text-[#818CF8]">
              <Layers size={18} />
            </div>
            <div>
              <p className="text-xl font-bold font-mono text-[#F1F5F9]">{decks.length}</p>
              <p className="text-xs text-[#64748B]">Total Created Decks</p>
            </div>
          </div>

          <div className="glass-card p-4 border border-[#1E293B] flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/15 flex items-center justify-center text-emerald-400">
              <CheckCircle2 size={18} />
            </div>
            <div>
              <p className="text-xl font-bold font-mono text-[#F1F5F9]">{totalCardsCount}</p>
              <p className="text-xs text-[#64748B]">Total Flashcards in Library</p>
            </div>
          </div>
        </div>
      )}

      {/* ── Active Review Session Modal ────────────────────────────────────── */}
      <AnimatePresence>
        {activeDeck && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="glass-card w-full max-w-xl p-6 md:p-8 border border-[#1E293B] shadow-2xl relative"
            >
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#1E293B]">
                <h2 className="text-sm font-bold text-[#F1F5F9] flex items-center gap-2">
                  <Layers size={16} className="text-[#F59E0B]" />
                  {activeDeck.title}
                </h2>
                <button
                  onClick={() => setActiveDeck(null)}
                  className="text-[#64748B] hover:text-[#94A3B8]"
                >
                  <X size={18} />
                </button>
              </div>

              <ReviewSession
                deck={activeDeck}
                onClose={() => setActiveDeck(null)}
                onComplete={() => {
                  setActiveDeck(null);
                  fetchDecks();
                }}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Decks Grid ─────────────────────────────────────────────────────── */}
      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="skeleton h-56 rounded-2xl" />
          ))}
        </div>
      ) : decks.length === 0 ? (
        <div className="glass-card p-12 text-center max-w-md mx-auto border border-[#1E293B]">
          <div className="w-16 h-16 rounded-2xl bg-[#1E293B] flex items-center justify-center mx-auto mb-4 text-[#475569]">
            <Layers size={32} />
          </div>
          <h3 className="text-lg font-bold text-[#F1F5F9]">No flashcard decks yet</h3>
          <p className="text-xs text-[#64748B] mt-2 leading-relaxed">
            Create a custom deck manually or convert any study note in the Note Studio into flashcards!
          </p>
          <div className="flex gap-2.5 justify-center mt-6">
            <button onClick={() => setShowCreateModal(true)} className="btn-ghost text-xs">
              <Plus size={14} /> New Deck
            </button>
            <button
              onClick={() => (window.location.href = '/notes')}
              className="btn-primary text-xs"
            >
              <BookOpen size={14} /> Note Studio
            </button>
          </div>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredDecks.map((deck) => (
            <DeckCard
              key={deck._id}
              deck={deck}
              onReview={handleStartReview}
              onDelete={handleDeleteDeck}
            />
          ))}
        </div>
      )}

      {/* Create Deck Modal */}
      {showCreateModal && (
        <CreateDeckModal
          onClose={() => setShowCreateModal(false)}
          onCreated={(newDeck) => setDecks((prev) => [newDeck, ...prev])}
        />
      )}
    </div>
  );
}
