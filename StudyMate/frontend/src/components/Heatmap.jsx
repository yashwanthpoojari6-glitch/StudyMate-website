// components/Heatmap.jsx — Neo-Brutalist annual activity heatmap with pixel-perfect alignment
import { useMemo } from 'react';
import { motion } from 'framer-motion';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const CELL_SIZE = 14; // px (w-3.5 / h-3.5)
const CELL_GAP = 4;   // px (gap-1)
const TOTAL_WEEKS = 53;

// Heat level mapping: 0 = inactive, 1-4 = intensity tiers
const getHeatTier = (minutes) => {
  if (!minutes || minutes === 0) return 0;
  if (minutes < 30) return 1;
  if (minutes < 60) return 2;
  if (minutes < 120) return 3;
  return 4;
};

const TIER_CLASSES = {
  0: 'bg-white border border-black shadow-[1px_1px_0px_0px_rgba(0,0,0,0.06)]',
  1: 'bg-lime-200 border border-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]',
  2: 'bg-lime-300 border border-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]',
  3: 'bg-lime-400 border border-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]',
  4: 'bg-lime-500 border border-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]',
};

export default function Heatmap({ data = [] }) {
  // Build a date-keyed lookup map from API data
  const dataMap = useMemo(() => {
    const map = {};
    data.forEach(({ date, totalMinutes }) => {
      map[date] = totalMinutes;
    });
    return map;
  }, [data]);

  // Build the 53-week × 7-day grid ending on current week
  const grid = useMemo(() => {
    const today = new Date();
    const currentDay = today.getDay(); // 0 is Sunday, 6 is Saturday

    // Start of week 0 is Sunday, 52 weeks before current week's Sunday
    const currentWeekSunday = new Date(today.getFullYear(), today.getMonth(), today.getDate() - currentDay);
    const startDate = new Date(currentWeekSunday);
    startDate.setDate(startDate.getDate() - (TOTAL_WEEKS - 1) * 7);

    const weeks = [];
    const cursor = new Date(startDate);

    for (let w = 0; w < TOTAL_WEEKS; w++) {
      const week = [];
      for (let d = 0; d < 7; d++) {
        const y = cursor.getFullYear();
        const m = String(cursor.getMonth() + 1).padStart(2, '0');
        const dayNum = String(cursor.getDate()).padStart(2, '0');
        const dateStr = `${y}-${m}-${dayNum}`;
        const isFuture = cursor > today;
        const minutes = dataMap[dateStr] || 0;

        week.push({
          date: dateStr,
          month: cursor.getMonth(),
          dayOfMonth: cursor.getDate(),
          minutes,
          tier: getHeatTier(minutes),
          isFuture,
        });
        cursor.setDate(cursor.getDate() + 1);
      }
      weeks.push(week);
    }
    return weeks;
  }, [dataMap]);

  // Month label positions: compute precise column offset for each month start
  const monthLabels = useMemo(() => {
    const labels = [];
    grid.forEach((week, weekIdx) => {
      // Find if the 1st day of a month falls within this week
      const firstOfMonth = week.find((d) => d.dayOfMonth === 1);
      if (firstOfMonth) {
        labels.push({ month: firstOfMonth.month, weekIdx });
      } else if (weekIdx === 0) {
        // Initial week's month
        labels.push({ month: week[0].month, weekIdx: 0 });
      }
    });

    // If week 0 label is too close to the second label (< 3 weeks apart), remove week 0 label
    if (labels.length > 1 && labels[1].weekIdx - labels[0].weekIdx < 3) {
      labels.shift();
    }

    // If the last label is at the very final week (week 52), omit it so it doesn't overflow
    if (labels.length > 0 && labels[labels.length - 1].weekIdx >= grid.length - 1) {
      labels.pop();
    }

    return labels;
  }, [grid]);

  const totalMinutes = Object.values(dataMap).reduce((a, b) => a + b, 0);
  const activeDays = Object.values(dataMap).filter((m) => m > 0).length;
  const gridWidth = grid.length * CELL_SIZE + (grid.length - 1) * CELL_GAP;

  return (
    <div className="w-full select-none">
      {/* ── Stats Summary: Ultra-Bold High-Contrast Black Typography ───────── */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-5 text-sm select-none">
        <div className="flex items-center gap-4">
          <span className="text-slate-900 font-black flex items-center gap-2">
            <span className="text-slate-900 font-black text-base bg-lime-200 px-2.5 py-0.5 rounded-lg border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
              {activeDays}
            </span>
            active days
          </span>
          <span className="text-slate-900 font-black flex items-center gap-2">
            <span className="text-slate-900 font-black text-base bg-lime-300 px-2.5 py-0.5 rounded-lg border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
              {Math.round(totalMinutes / 60)}h
            </span>
            total focus
          </span>
        </div>

        {/* Legend: Outlined White & Green Tiers */}
        <div className="flex items-center gap-2 text-xs font-black text-slate-900">
          <span>Less</span>
          <div className="flex items-center gap-1.5">
            <div
              className="w-3.5 h-3.5 rounded-sm bg-white border border-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]"
              title="0 minutes"
            />
            <div
              className="w-3.5 h-3.5 rounded-sm bg-lime-200 border border-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]"
              title="< 30 min"
            />
            <div
              className="w-3.5 h-3.5 rounded-sm bg-lime-300 border border-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]"
              title="< 60 min"
            />
            <div
              className="w-3.5 h-3.5 rounded-sm bg-lime-400 border border-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]"
              title="< 120 min"
            />
            <div
              className="w-3.5 h-3.5 rounded-sm bg-lime-500 border border-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]"
              title="120+ min"
            />
          </div>
          <span>More</span>
        </div>
      </div>

      {/* ── Heatmap Grid Container: Centered Full-Width Layout with Clean Scroll ── */}
      <div className="w-full overflow-x-auto pb-2 pt-1">
        <div className="inline-block min-w-full">
          <div className="w-fit mx-auto">
            {/* ── 1. Month Header Row: Aligned directly above each starting week ── */}
            <div className="flex items-center mb-2">
              {/* Spacer matching exact width (w-8 = 32px) and gap (mr-2 = 8px) of Y-axis day labels */}
              <div className="w-8 shrink-0 mr-2" />

              {/* Month labels container matching exact width of the 53 week columns */}
              <div className="relative h-4" style={{ width: `${gridWidth}px` }}>
                {monthLabels.map(({ month, weekIdx }) => (
                  <span
                    key={`${month}-${weekIdx}`}
                    className="absolute top-0 text-xs font-black text-slate-900 uppercase tracking-wider select-none leading-none"
                    style={{ left: `${weekIdx * (CELL_SIZE + CELL_GAP)}px` }}
                  >
                    {MONTHS[month]}
                  </span>
                ))}
              </div>
            </div>

            {/* ── 2. Grid Body: Day Labels + 53 Week Columns ────────────────── */}
            <div className="flex items-start">
              {/* Y-Axis Day Labels: Exact 7-row structure matching cell heights and gaps */}
              <div className="w-8 shrink-0 mr-2 grid grid-rows-7 gap-1 select-none">
                <div className="h-3.5" /> {/* Row 1: Sun */}
                <div className="h-3.5 flex items-center justify-end text-[11px] font-black text-slate-900 leading-none pr-1.5">
                  Mon
                </div>
                <div className="h-3.5" /> {/* Row 3: Tue */}
                <div className="h-3.5 flex items-center justify-end text-[11px] font-black text-slate-900 leading-none pr-1.5">
                  Wed
                </div>
                <div className="h-3.5" /> {/* Row 5: Thu */}
                <div className="h-3.5 flex items-center justify-end text-[11px] font-black text-slate-900 leading-none pr-1.5">
                  Fri
                </div>
                <div className="h-3.5" /> {/* Row 7: Sat */}
              </div>

              {/* 53 Week Columns × 7 Days */}
              <div className="flex gap-1">
                {grid.map((week, weekIdx) => (
                  <div key={weekIdx} className="grid grid-rows-7 gap-1">
                    {week.map((day) => {
                      const formattedDate = new Date(day.date + 'T00:00:00').toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      });
                      const tooltip = day.isFuture
                        ? ''
                        : `${day.minutes} mins focus • ${formattedDate}`;

                      return (
                        <motion.div
                          key={day.date}
                          whileHover={{ scale: 1.35 }}
                          title={tooltip}
                          className={`w-3.5 h-3.5 rounded-sm transition-all relative hover:z-10 cursor-pointer ${
                            day.isFuture
                              ? 'opacity-0 pointer-events-none'
                              : TIER_CLASSES[day.tier]
                          }`}
                        />
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
