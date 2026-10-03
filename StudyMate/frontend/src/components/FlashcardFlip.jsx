// components/FlashcardFlip.jsx — 3D flip card with SM-2 spaced repetition rating
import { useState } from 'react';
import { motion } from 'framer-motion';
import { ThumbsDown, Minus, ThumbsUp } from 'lucide-react';

export default function FlashcardFlip({ card, onRate, isLast }) {
  const [flipped, setFlipped] = useState(false);

  const handleRate = (quality) => {
    setFlipped(false);
    setTimeout(() => onRate(card._id, quality), 300);
  };

  return (
    <div className="flex flex-col items-center gap-6">
      {/* 3D Flip Card Container */}
      <div
        className="relative w-full max-w-lg h-64 cursor-pointer"
        style={{ perspective: '1000px' }}
        onClick={() => setFlipped(f => !f)}
      >
        <motion.div
          animate={{ rotateY: flipped ? 180 : 0 }}
          transition={{ duration: 0.5, ease: 'easeInOut' }}
          className="relative w-full h-full"
          style={{ transformStyle: 'preserve-3d' }}
        >
          {/* Front face — Question */}
          <div
            className="absolute inset-0 glass-card flex flex-col items-center justify-center p-6 text-center rounded-xl"
            style={{ backfaceVisibility: 'hidden' }}
          >
            <span className="text-xs text-[#475569] uppercase tracking-wider mb-4 font-semibold">Question</span>
            <p className="text-lg text-[#F1F5F9] font-medium leading-relaxed">{card.question}</p>
            <p className="text-xs text-[#475569] mt-6 animate-pulse">Click to reveal answer</p>
          </div>

          {/* Back face — Answer (rotated 180deg) */}
          <div
            className="absolute inset-0 glass-card flex flex-col items-center justify-center p-6 text-center rounded-xl"
            style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
          >
            <span className="text-xs text-[#10B981] uppercase tracking-wider mb-4 font-semibold">Answer</span>
            <p className="text-[#E2E8F0] leading-relaxed">{card.answer}</p>
          </div>
        </motion.div>
      </div>

      {/* Rating buttons — only visible after flip */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: flipped ? 1 : 0, y: flipped ? 0 : 10 }}
        className="flex gap-3"
        style={{ pointerEvents: flipped ? 'all' : 'none' }}
      >
        {/* Hard — quality 0 */}
        <button
          onClick={() => handleRate(0)}
          className="flex items-center gap-2 px-5 py-2.5 bg-red-500/15 hover:bg-red-500/30 border border-red-500/30 text-red-400 rounded-lg text-sm font-medium transition-all"
        >
          <ThumbsDown size={15} /> Hard
        </button>

        {/* Good — quality 3 */}
        <button
          onClick={() => handleRate(3)}
          className="flex items-center gap-2 px-5 py-2.5 bg-amber-500/15 hover:bg-amber-500/30 border border-amber-500/30 text-amber-400 rounded-lg text-sm font-medium transition-all"
        >
          <Minus size={15} /> Good
        </button>

        {/* Easy — quality 5 */}
        <button
          onClick={() => handleRate(5)}
          className="flex items-center gap-2 px-5 py-2.5 bg-emerald-500/15 hover:bg-emerald-500/30 border border-emerald-500/30 text-emerald-400 rounded-lg text-sm font-medium transition-all"
        >
          <ThumbsUp size={15} /> Easy
        </button>
      </motion.div>

      <p className="text-xs text-[#475569]">
        Next review date auto-calculated via spaced repetition
      </p>
    </div>
  );
}
