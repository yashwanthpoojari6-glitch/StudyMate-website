// components/Heatmap.jsx — GitHub-style annual activity heatmap
// Renders a 52-week grid of daily study session intensity.

import { useMemo } from 'react';
import { motion } from 'framer-motion';

const DAYS_IN_WEEK = 7;
const WEEKS = 53;

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const DAY_LABELS = ['', 'Mon', '', 'Wed', '', 'Fri', ''];

// Determine heat level (0-4) based on total minutes studied
const getHeatLevel = (minutes) => {
  if (!minutes || minutes === 0) return 0;
  if (minutes < 30) return 1;
  if (minutes < 60) return 2;
  if (minutes < 120) return 3;
  return 4;
};

export default function Heatmap({ data = [] }) {
  // Build a date-keyed lookup map from API data
  const dataMap = useMemo(() => {
    const map = {};
    data.forEach(({ date, totalMinutes }) => { map[date] = totalMinutes; });
    return map;
  }, [data]);

  // Build the grid: 53 columns (weeks) × 7 rows (days)
  const grid = useMemo(() => {
    const today = new Date();
    const endDate = new Date(today);
    const startDate = new Date(today);
    startDate.setFullYear(startDate.getFullYear() - 1);
    startDate.setDate(startDate.getDate() - startDate.getDay()); // Align to Sunday

    const weeks = [];
    const cursor = new Date(startDate);

    while (cursor <= endDate) {
      const week = [];
      for (let d = 0; d < 7; d++) {
        const dateStr = cursor.toISOString().split('T')[0];
        week.push({
          date: dateStr,
          minutes: dataMap[dateStr] || 0,
          level: getHeatLevel(dataMap[dateStr]),
          isFuture: cursor > today,
        });
        cursor.setDate(cursor.getDate() + 1);
      }
      weeks.push(week);
    }
    return weeks;
  }, [dataMap]);

  // Get month label positions for the header
  const monthLabels = useMemo(() => {
    const labels = [];
    let lastMonth = -1;
    grid.forEach((week, weekIdx) => {
      const month = new Date(week[0].date).getMonth();
      if (month !== lastMonth) {
        labels.push({ month, weekIdx });
        lastMonth = month;
      }
    });
    return labels;
  }, [grid]);

  const totalMinutes = Object.values(dataMap).reduce((a, b) => a + b, 0);
  const activeDays = Object.keys(dataMap).length;

  return (
    <div className="w-full">
      {/* Stats summary */}
      <div className="flex items-center gap-6 mb-4 text-sm">
        <span className="text-[#94A3B8]">
          <span className="text-[#F1F5F9] font-semibold">{activeDays}</span> active days
        </span>
        <span className="text-[#94A3B8]">
          <span className="text-[#F1F5F9] font-semibold">{Math.round(totalMinutes / 60)}h</span> total focus
        </span>
      </div>

      <div className="overflow-x-auto">
        <div className="min-w-max">
          {/* Month labels */}
          <div className="flex mb-1 pl-8">
            {grid.map((_, weekIdx) => {
              const label = monthLabels.find(l => l.weekIdx === weekIdx);
              return (
                <div key={weekIdx} className="w-3 mr-0.5 text-[10px] text-[#475569] -ml-0">
                  {label ? MONTHS[label.month] : ''}
                </div>
              );
            })}
          </div>

          <div className="flex gap-0.5">
            {/* Day-of-week labels */}
            <div className="flex flex-col gap-0.5 mr-1.5">
              {DAY_LABELS.map((label, i) => (
                <div key={i} className="h-3 text-[10px] text-[#475569] leading-3 w-6">{label}</div>
              ))}
            </div>

            {/* Heatmap grid */}
            {grid.map((week, weekIdx) => (
              <div key={weekIdx} className="flex flex-col gap-0.5">
                {week.map((day) => (
                  <motion.div
                    key={day.date}
                    whileHover={{ scale: 1.4 }}
                    title={day.isFuture ? '' : `${day.date}: ${day.minutes} min`}
                    className={`w-3 h-3 rounded-sm cursor-default transition-colors ${
                      day.isFuture
                        ? 'opacity-0'
                        : `heat-${day.level}`
                    }`}
                  />
                ))}
              </div>
            ))}
          </div>

          {/* Legend */}
          <div className="flex items-center gap-1.5 mt-3 justify-end">
            <span className="text-[10px] text-[#475569]">Less</span>
            {[0, 1, 2, 3, 4].map(level => (
              <div key={level} className={`w-3 h-3 rounded-sm heat-${level}`} />
            ))}
            <span className="text-[10px] text-[#475569]">More</span>
          </div>
        </div>
      </div>
    </div>
  );
}
