// pages/FlashcardPage.jsx — AI Flashcard decks with 3D flip cards & spaced repetition review
import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Layers, Plus, BookOpen, RefreshCw, ArrowRight,
  Trophy, X, Calendar, Search, Sparkles, CheckCircle2, Trash2
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
      <div className="absolute inset-0 bg-black/45 backdrop-blur-xs" onClick={onClose} />
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-white rounded-3xl w-full max-w-lg max-h-[85vh] flex flex-col z-10 border-2 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-6 sm:p-7 select-none"
      >
        <div className="flex items-center justify-between pb-4 border-b-2 border-black mb-4">
          <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[#A3E635] flex items-center justify-center border-2 border-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
              <Plus size={18} className="stroke-[3] text-black" />
            </div>
            Create Custom Deck
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white hover:bg-red-50 flex items-center justify-center border-2 border-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] transition-colors cursor-pointer"
          >
            <X size={16} className="text-black stroke-[2.5]" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden space-y-4">
          <div>
            <label className="block text-xs font-black text-slate-800 mb-1.5 uppercase tracking-wider">
              Deck Title *
            </label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Molecular Biology - Unit 1"
              className="form-input text-sm font-semibold"
              autoFocus
            />
          </div>

          <div className="flex-1 overflow-y-auto space-y-3 pr-1">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-black text-slate-800 uppercase tracking-wider">
                Cards ({cards.length})
              </label>
              <button
                type="button"
                onClick={handleAddCard}
                className="text-xs font-black text-black bg-[#A3E635] hover:bg-[#8cee2b] px-2.5 py-1 rounded-lg border-2 border-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] flex items-center gap-1 cursor-pointer"
              >
                <Plus size={13} className="stroke-[3]" /> Add Card
              </button>
            </div>

            {cards.map((c, i) => (
              <div key={i} className="p-3 bg-[#F9FAFB] rounded-2xl border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-mono font-black text-slate-700">Card #{i + 1}</span>
                  {cards.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveCard(i)}
                      className="w-6 h-6 rounded-md bg-white hover:bg-red-50 text-red-600 border border-black flex items-center justify-center cursor-pointer"
                    >
                      <X size={13} className="stroke-[2.5]" />
                    </button>
                  )}
                </div>
                <input
                  value={c.question}
                  onChange={(e) => handleCardChange(i, 'question', e.target.value)}
                  placeholder="Question / Front"
                  className="form-input text-xs py-1.5 font-semibold"
                />
                <input
                  value={c.answer}
                  onChange={(e) => handleCardChange(i, 'answer', e.target.value)}
                  placeholder="Answer / Back"
                  className="form-input text-xs py-1.5 font-semibold"
                />
              </div>
            ))}
          </div>

          <div className="flex gap-3 pt-3 border-t-2 border-black/10">
            <button type="button" onClick={onClose} className="btn-ghost flex-1 justify-center text-xs py-2.5 font-black">
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="btn-primary flex-1 justify-center text-xs py-2.5 font-black"
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
      <div className="py-12 text-center select-none">
        <p className="text-sm font-bold text-slate-700">This deck has no cards to review.</p>
        <button onClick={onClose} className="btn-ghost mt-4 font-black">
          Close
        </button>
      </div>
    );
  }

  if (done) {
    const total = cards.length;

    return (
      <div className="flex flex-col items-center gap-6 py-10 text-center select-none">
        <motion.div
          initial={{ scale: 0, rotate: -20 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', damping: 12 }}
          className="w-20 h-20 rounded-3xl bg-amber-200 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center text-black"
        >
          <Trophy size={40} className="stroke-[2.5]" />
        </motion.div>

        <div>
          <h3 className="text-2xl font-black text-slate-900">Review Session Complete!</h3>
          <p className="text-xs font-bold text-slate-600 mt-1">
            You successfully reviewed {total} spaced repetition cards
          </p>
        </div>

        {/* Rating Breakdown */}
        <div className="grid grid-cols-3 gap-3 w-full max-w-sm">
          <div className="bg-red-100 p-3 rounded-2xl border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
            <p className="text-2xl font-black font-mono text-red-900">{results.hard}</p>
            <p className="text-[11px] font-bold text-red-950 mt-0.5">Needs Review (1d)</p>
          </div>
          <div className="bg-amber-100 p-3 rounded-2xl border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
            <p className="text-2xl font-black font-mono text-amber-900">{results.good}</p>
            <p className="text-[11px] font-bold text-amber-950 mt-0.5">Retained (6d)</p>
          </div>
          <div className="bg-[#DCFCE7] p-3 rounded-2xl border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
            <p className="text-2xl font-black font-mono text-emerald-900">{results.easy}</p>
            <p className="text-[11px] font-bold text-emerald-950 mt-0.5">Mastered (14d+)</p>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => {
              setCurrentIdx(0);
              setDone(false);
              setResults({ hard: 0, good: 0, easy: 0 });
            }}
            className="btn-ghost text-xs py-2 px-4 font-black"
          >
            <RefreshCw size={14} className="stroke-[2.5]" /> Review Again
          </button>
          <button onClick={onComplete} className="btn-primary text-xs py-2 px-5 font-black">
            Done
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 select-none">
      {/* Session Progress Header */}
      <div>
        <div className="flex items-center justify-between text-xs font-black text-slate-800 mb-2">
          <span>
            Card {currentIdx + 1} of {cards.length}
          </span>
          <div className="flex items-center gap-3">
            <span className="text-[11px] font-bold text-slate-500">Click card to flip</span>
            <button
              onClick={onClose}
              className="w-7 h-7 rounded-full bg-white hover:bg-red-50 flex items-center justify-center border-2 border-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] cursor-pointer"
            >
              <X size={14} className="stroke-[2.5]" />
            </button>
          </div>
        </div>
        <div className="bg-[#E5E7EB] rounded-full h-2 overflow-hidden border border-black">
          <motion.div
            className="h-full bg-[#A3E635] rounded-full"
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
      className="bg-white rounded-3xl p-5 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] flex flex-col justify-between transition-all group relative select-none"
    >
      <div>
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-200 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center text-black">
            <Layers size={19} className="stroke-[2.5]" />
          </div>
          <div className="flex items-center gap-1.5">
            {dueCount > 0 ? (
              <span className="text-[11px] font-black bg-amber-200 text-amber-950 border border-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] px-2.5 py-0.5 rounded-full flex items-center gap-1">
                <Calendar size={11} className="stroke-[2.5]" /> {dueCount} due
              </span>
            ) : (
              <span className="text-[11px] font-black bg-[#DCFCE7] text-emerald-950 border border-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] px-2.5 py-0.5 rounded-full">
                Up to date
              </span>
            )}
            <button
              onClick={() => onDelete(deck._id)}
              className="w-7 h-7 rounded-lg bg-white hover:bg-red-50 text-gray-500 hover:text-red-600 border border-black flex items-center justify-center transition-colors cursor-pointer shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] opacity-0 group-hover:opacity-100"
              title="Delete deck"
            >
              <Trash2 size={13} className="stroke-[2.5]" />
            </button>
          </div>
        </div>

        <h3 className="font-black text-slate-900 text-base mb-1 line-clamp-1">
          {deck.title}
        </h3>

        {deck.noteRef && (
          <p className="text-xs text-slate-600 font-bold flex items-center gap-1.5 mb-2 truncate">
            <span>{deck.noteRef.emoji || '📝'}</span>
            <span className="truncate">From note: {deck.noteRef.title}</span>
          </p>
        )}

        <p className="text-xs text-slate-600 font-bold">
          <span className="font-mono font-black text-slate-900">{totalCards}</span> active flashcards
        </p>
      </div>

      <div className="mt-5 pt-3.5 border-t-2 border-black/10">
        <button
          onClick={() => onReview(deck)}
          className={`w-full text-xs font-black py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 transition-all border-2 border-black cursor-pointer ${
            dueCount > 0
              ? 'bg-[#A3E635] hover:bg-[#8cee2b] text-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-y-0 active:shadow-none'
              : 'bg-white hover:bg-gray-100 text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-0 active:shadow-none'
          }`}
        >
          {dueCount > 0 ? `Review ${dueCount} Due Cards` : 'Study Deck'}
          <ArrowRight size={13} className="stroke-[3]" />
        </button>
      </div>
    </motion.div>
  );
};

// ── Main Flashcard Page Component ─────────────────────────────────────────────
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
    <div className="p-6 md:p-8 max-w-6xl mx-auto space-y-8 pb-28 md:pb-12 select-none">
      {/* ── Top Header: Prominent Black Title & Crisp White Search Bar ──────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b-2 border-black pb-6">
        <div>
          <h1 className="text-slate-900 font-black text-3xl flex items-center gap-3 tracking-tight">
            <div className="w-10 h-10 rounded-2xl bg-amber-200 flex items-center justify-center border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
              <Layers size={22} className="text-black stroke-[3]" />
            </div>
            Flashcard Decks
          </h1>
          <p className="text-slate-700 font-medium text-xs md:text-sm mt-1.5">
            Supercharged active recall powered by the SM-2 Spaced Repetition Algorithm
          </p>
        </div>

        {/* Search Bar & Actions */}
        <div className="flex items-center gap-3 flex-wrap">
          {/* Crisp White Search Input with 2px Black Border & Drop Shadow */}
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-black stroke-[2.5]" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search decks..."
              className="bg-white border-2 border-black rounded-xl pl-9 pr-3.5 py-2 text-xs font-bold text-black placeholder:text-slate-500 outline-none shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] focus:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all"
            />
          </div>

          <button
            onClick={() => setShowCreateModal(true)}
            className="btn-ghost text-xs py-2 px-3 font-black border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] cursor-pointer"
          >
            <Plus size={14} className="stroke-[3]" /> New Deck
          </button>

          <button
            onClick={() => (window.location.href = '/notes')}
            className="btn-primary text-xs py-2 px-3.5 font-black border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] cursor-pointer"
            title="Generate flashcards from a note"
          >
            <Sparkles size={14} className="stroke-[3]" /> AI Generate
          </button>
        </div>
      </div>

      {/* ── Daily Summary Cards: Vibrant Pastel Neo-Brutalist Badges ────────── */}
      {decks.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-amber-100 p-4.5 rounded-3xl border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-white border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center text-black">
              <Calendar size={20} className="stroke-[2.5]" />
            </div>
            <div>
              <p className="text-2xl font-black font-mono text-black">{totalDueCount}</p>
              <p className="text-xs font-black text-black/75">Cards Due for Review Today</p>
            </div>
          </div>

          <div className="bg-blue-100 p-4.5 rounded-3xl border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-white border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center text-black">
              <Layers size={20} className="stroke-[2.5]" />
            </div>
            <div>
              <p className="text-2xl font-black font-mono text-black">{decks.length}</p>
              <p className="text-xs font-black text-black/75">Total Created Decks</p>
            </div>
          </div>

          <div className="bg-lime-200 p-4.5 rounded-3xl border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-white border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center text-black">
              <CheckCircle2 size={20} className="stroke-[2.5]" />
            </div>
            <div>
              <p className="text-2xl font-black font-mono text-black">{totalCardsCount}</p>
              <p className="text-xs font-black text-black/75">Total Flashcards in Library</p>
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
            className="fixed inset-0 z-50 bg-black/45 backdrop-blur-xs flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="bg-white rounded-3xl w-full max-w-xl p-6 md:p-8 border-2 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] relative select-none"
            >
              <div className="flex items-center justify-between mb-5 pb-3.5 border-b-2 border-black">
                <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-amber-200 border border-black flex items-center justify-center">
                    <Layers size={15} className="stroke-[2.5] text-black" />
                  </div>
                  {activeDeck.title}
                </h2>
                <button
                  onClick={() => setActiveDeck(null)}
                  className="w-8 h-8 rounded-full bg-white hover:bg-red-50 flex items-center justify-center border-2 border-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] transition-colors cursor-pointer"
                >
                  <X size={16} className="text-black stroke-[2.5]" />
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
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="skeleton h-56 rounded-3xl" />
          ))}
        </div>
      ) : decks.length === 0 ? (
        /* ── Empty State Card with Bright Lime-Green Sticker Badge & High-Contrast Typography ── */
        <div className="bg-white rounded-3xl p-10 sm:p-12 text-center max-w-md mx-auto border-2 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
          <div className="bg-lime-400 border-2 border-black rounded-2xl p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] inline-flex items-center justify-center mx-auto mb-5 text-black">
            <Layers size={32} className="stroke-[2.5] text-black" />
          </div>
          <h3 className="text-black font-black text-2xl tracking-tight">No flashcard decks yet</h3>
          <p className="text-slate-700 font-semibold text-xs md:text-sm mt-2 mb-6 leading-relaxed">
            Create a custom deck manually or convert any study note in the Note Studio into flashcards!
          </p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => setShowCreateModal(true)}
              className="btn-ghost text-xs font-black border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] cursor-pointer"
            >
              <Plus size={14} className="stroke-[3]" /> New Deck
            </button>
            <button
              onClick={() => (window.location.href = '/notes')}
              className="btn-primary text-xs font-black border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] cursor-pointer"
            >
              <BookOpen size={14} className="stroke-[2.5]" /> Note Studio
            </button>
          </div>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
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
