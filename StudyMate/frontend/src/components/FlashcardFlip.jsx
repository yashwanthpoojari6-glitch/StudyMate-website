// components/FlashcardFlip.jsx — Neo-Brutalist 3D flip card with SM-2 spaced repetition rating
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
    <div className="flex flex-col items-center gap-6 w-full select-none">
      {/* 3D Flip Card Container */}
      <div
        className="relative w-full max-w-lg h-68 cursor-pointer"
        style={{ perspective: '1000px' }}
        onClick={() => setFlipped((f) => !f)}
      >
        <motion.div
          animate={{ rotateY: flipped ? 180 : 0 }}
          transition={{ duration: 0.5, ease: 'easeInOut' }}
          className="relative w-full h-full"
          style={{ transformStyle: 'preserve-3d' }}
        >
          {/* Front Face — Question (Crisp White with 2px Black Border & Drop Shadow) */}
          <div
            className="absolute inset-0 bg-white rounded-3xl border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex flex-col items-center justify-center p-6 sm:p-8 text-center"
            style={{ backfaceVisibility: 'hidden' }}
          >
            <span className="text-[11px] font-black uppercase tracking-wider mb-4 px-3 py-1 bg-lime-200 text-black border border-black rounded-full shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
              Question
            </span>
            <p className="text-xl font-black text-slate-900 leading-relaxed max-w-md">
              {card.question}
            </p>
            <p className="text-xs font-bold text-slate-500 mt-6 animate-pulse">
              Click anywhere to flip &amp; reveal answer
            </p>
          </div>

          {/* Back Face — Answer (Rotated 180deg) */}
          <div
            className="absolute inset-0 bg-[#F0FDF4] rounded-3xl border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex flex-col items-center justify-center p-6 sm:p-8 text-center"
            style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
          >
            <span className="text-[11px] font-black uppercase tracking-wider mb-4 px-3 py-1 bg-[#A3E635] text-black border border-black rounded-full shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
              Answer
            </span>
            <p className="text-lg font-bold text-slate-900 leading-relaxed max-w-md">
              {card.answer}
            </p>
          </div>
        </motion.div>
      </div>

      {/* Rating Buttons — Visible after flip as Tactile Neo-Brutalist Sticker Pills */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: flipped ? 1 : 0, y: flipped ? 0 : 10 }}
        className="flex gap-3.5 flex-wrap justify-center"
        style={{ pointerEvents: flipped ? 'all' : 'none' }}
      >
        {/* Hard — quality 0 */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleRate(0);
          }}
          className="flex items-center gap-2 px-5 py-2.5 bg-red-200 hover:bg-red-300 border-2 border-black text-black font-black text-xs rounded-xl shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-0 active:shadow-none transition-all cursor-pointer"
        >
          <ThumbsDown size={15} className="stroke-[2.5]" /> Hard (1d)
        </button>

        {/* Good — quality 3 */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleRate(3);
          }}
          className="flex items-center gap-2 px-5 py-2.5 bg-amber-200 hover:bg-amber-300 border-2 border-black text-black font-black text-xs rounded-xl shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-0 active:shadow-none transition-all cursor-pointer"
        >
          <Minus size={15} className="stroke-[2.5]" /> Good (6d)
        </button>

        {/* Easy — quality 5 */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleRate(5);
          }}
          className="flex items-center gap-2 px-5 py-2.5 bg-[#A3E635] hover:bg-[#8cee2b] border-2 border-black text-black font-black text-xs rounded-xl shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-0 active:shadow-none transition-all cursor-pointer"
        >
          <ThumbsUp size={15} className="stroke-[2.5]" /> Easy (14d+)
        </button>
      </motion.div>

      <p className="text-xs font-bold text-slate-600">
        Next review date auto-calculated via spaced repetition
      </p>
    </div>
  );
}
