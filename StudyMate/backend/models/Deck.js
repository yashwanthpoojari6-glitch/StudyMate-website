// models/Deck.js — AI Flashcard deck with spaced repetition card data
const mongoose = require('mongoose');

// Individual flashcard with SM-2 spaced repetition fields
const cardSchema = new mongoose.Schema({
  question: { type: String, required: true },
  answer: { type: String, required: true },
  // SM-2 algorithm fields:
  // easeFactor: multiplier for next interval (starts at 2.5)
  easeFactor: { type: Number, default: 2.5 },
  // interval: days until next review
  interval: { type: Number, default: 1 },
  // nextReview: absolute date for next review
  nextReview: { type: Date, default: Date.now },
  // repetitions: number of times reviewed successfully
  repetitions: { type: Number, default: 0 },
}, { _id: true });

const deckSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    // Optional: link deck to the note it was generated from
    noteRef: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Note',
      default: null,
    },
    subject: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subject',
      default: null,
    },
    title: {
      type: String,
      required: [true, 'Deck title is required'],
      trim: true,
    },
    cards: [cardSchema],
  },
  { timestamps: true }
);

// ─── Instance Method: apply SM-2 spaced repetition rating ────────────────────
// quality: 0=Hard, 3=Good, 5=Easy (maps to our 3-button UI)
deckSchema.methods.rateCard = function (cardId, quality) {
  const card = this.cards.id(cardId);
  if (!card) throw new Error('Card not found');

  // SM-2 core algorithm
  if (quality < 3) {
    // Failed — reset to beginning
    card.repetitions = 0;
    card.interval = 1;
  } else {
    // Passed — increase interval
    if (card.repetitions === 0) card.interval = 1;
    else if (card.repetitions === 1) card.interval = 6;
    else card.interval = Math.round(card.interval * card.easeFactor);
    card.repetitions += 1;
  }

  // Update ease factor (bounded between 1.3 and 2.5)
  card.easeFactor = Math.max(
    1.3,
    card.easeFactor + 0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02)
  );

  // Schedule next review date
  card.nextReview = new Date(Date.now() + card.interval * 24 * 60 * 60 * 1000);
  return card;
};

const Deck = mongoose.model('Deck', deckSchema);
module.exports = Deck;
