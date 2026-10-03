// routes/ai.js
const express = require('express');
const router = express.Router();
const {
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
} = require('../controllers/aiController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

// Note-specific AI operations
router.post('/summarize/:noteId', summarizeNote);
router.post('/key-terms/:noteId', extractKeyTerms);
router.post('/flashcards/:noteId', generateFlashcards);
router.post('/quiz/:noteId', generateQuiz);

// General AI chat
router.post('/chat', chat);

// Study plan generation
router.post('/study-plan/:subjectId', generateStudyPlan);

// Flashcard deck management
router.route('/decks').get(getDecks).post(createDeck);
router.route('/decks/:deckId').get(getDeck).delete(deleteDeck);
router.patch('/decks/:deckId/rate', rateCard);

module.exports = router;
