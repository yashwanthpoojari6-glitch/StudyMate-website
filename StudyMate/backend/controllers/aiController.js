// controllers/aiController.js — AI-powered endpoints using Gemini service
const Note = require('../models/Note');
const Deck = require('../models/Deck');
const Subject = require('../models/Subject');
const gemini = require('../services/geminiService');

// @route   POST /api/ai/summarize/:noteId
// @access  Private
const summarizeNote = async (req, res, next) => {
  try {
    const note = await Note.findOne({ _id: req.params.noteId, user: req.user._id });
    if (!note) return res.status(404).json({ success: false, message: 'Note not found' });
    if (!note.content) return res.status(400).json({ success: false, message: 'Note has no content to summarize' });

    const summary = await gemini.summarizeNote(note.content, note.title);
    res.json({ success: true, data: { summary } });
  } catch (error) {
    next(error);
  }
};

// @route   POST /api/ai/key-terms/:noteId
// @access  Private
const extractKeyTerms = async (req, res, next) => {
  try {
    const note = await Note.findOne({ _id: req.params.noteId, user: req.user._id });
    if (!note) return res.status(404).json({ success: false, message: 'Note not found' });

    const keyTerms = await gemini.extractKeyTerms(note.content, note.title);
    res.json({ success: true, data: { keyTerms } });
  } catch (error) {
    next(error);
  }
};

// @route   POST /api/ai/flashcards/:noteId
// @access  Private — generates a flashcard deck from note and saves it
const generateFlashcards = async (req, res, next) => {
  try {
    const note = await Note.findOne({ _id: req.params.noteId, user: req.user._id });
    if (!note) return res.status(404).json({ success: false, message: 'Note not found' });

    const count = req.body.count || 10;
    const cards = await gemini.generateFlashcards(note.content, note.title, count);

    // Persist the generated deck to MongoDB for spaced repetition tracking
    const deck = await Deck.create({
      user: req.user._id,
      noteRef: note._id,
      subject: note.subject,
      title: `${note.emoji || '🃏'} ${note.title} — Flashcards`,
      cards: cards.map((c) => ({ question: c.question, answer: c.answer })),
    });

    res.status(201).json({ success: true, data: deck });
  } catch (error) {
    next(error);
  }
};

// @route   POST /api/ai/quiz/:noteId
// @access  Private — generates multiple-choice practice quiz questions
const generateQuiz = async (req, res, next) => {
  try {
    const note = await Note.findOne({ _id: req.params.noteId, user: req.user._id });
    if (!note) return res.status(404).json({ success: false, message: 'Note not found' });
    if (!note.content) return res.status(400).json({ success: false, message: 'Note has no content to generate quiz' });

    const count = req.body.count || 5;
    const quiz = await gemini.generateQuiz(note.content, note.title, count);

    res.json({ success: true, data: { quiz } });
  } catch (error) {
    next(error);
  }
};

// @route   POST /api/ai/chat
// @access  Private — general AI academic chat
const chat = async (req, res, next) => {
  try {
    const { messages, context } = req.body;
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ success: false, message: 'Messages array is required' });
    }

    const response = await gemini.chatWithAI(messages, context);
    res.json({ success: true, data: { response } });
  } catch (error) {
    next(error);
  }
};

// @route   POST /api/ai/study-plan/:subjectId
// @access  Private
const generateStudyPlan = async (req, res, next) => {
  try {
    const subject = await Subject.findOne({ _id: req.params.subjectId, user: req.user._id });
    if (!subject) return res.status(404).json({ success: false, message: 'Subject not found' });

    const daysUntilExam = subject.daysUntilExam || 14; // Default 2 weeks if no exam date set
    const plan = await gemini.generateStudyPlan(subject.title, subject.chapters, daysUntilExam);

    res.json({ success: true, data: { plan } });
  } catch (error) {
    next(error);
  }
};

// @route   PATCH /api/ai/decks/:deckId/rate
// @access  Private — rate a flashcard for spaced repetition
const rateCard = async (req, res, next) => {
  try {
    const { cardId, quality } = req.body; // quality: 0=Hard, 3=Good, 5=Easy
    if (quality === undefined) return res.status(400).json({ success: false, message: 'quality is required' });

    const deck = await Deck.findOne({ _id: req.params.deckId, user: req.user._id });
    if (!deck) return res.status(404).json({ success: false, message: 'Deck not found' });

    deck.rateCard(cardId, quality);
    await deck.save();

    res.json({ success: true, data: deck });
  } catch (error) {
    next(error);
  }
};

// @route   GET /api/ai/decks
// @access  Private — list all flashcard decks for the user
const getDecks = async (req, res, next) => {
  try {
    const decks = await Deck.find({ user: req.user._id })
      .populate('noteRef', 'title emoji')
      .populate('subject', 'title colorTag')
      .select('-cards') // Don't return all cards in list view
      .sort({ updatedAt: -1 });

    res.json({ success: true, data: decks });
  } catch (error) {
    next(error);
  }
};

// @route   GET /api/ai/decks/:deckId
// @access  Private — get a single deck with all cards
const getDeck = async (req, res, next) => {
  try {
    const deck = await Deck.findOne({ _id: req.params.deckId, user: req.user._id });
    if (!deck) return res.status(404).json({ success: false, message: 'Deck not found' });

    res.json({ success: true, data: deck });
  } catch (error) {
    next(error);
  }
};

// @route   POST /api/ai/decks
// @access  Private — create a manual flashcard deck
const createDeck = async (req, res, next) => {
  try {
    const { title, subject, cards } = req.body;
    if (!title || !title.trim()) {
      return res.status(400).json({ success: false, message: 'Deck title is required' });
    }

    const deck = await Deck.create({
      user: req.user._id,
      title: title.trim(),
      subject: subject || null,
      cards: cards || [],
    });

    res.status(201).json({ success: true, data: deck });
  } catch (error) {
    next(error);
  }
};

// @route   DELETE /api/ai/decks/:deckId
// @access  Private — delete a flashcard deck
const deleteDeck = async (req, res, next) => {
  try {
    const deck = await Deck.findOneAndDelete({ _id: req.params.deckId, user: req.user._id });
    if (!deck) return res.status(404).json({ success: false, message: 'Deck not found' });

    res.json({ success: true, message: 'Deck deleted successfully' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  summarizeNote,
  extractKeyTerms,
  generateFlashcards,
  generateQuiz,
  chat,
  generateStudyPlan,
  rateCard,
  getDecks,
  getDeck,
  createDeck,
  deleteDeck,
};
