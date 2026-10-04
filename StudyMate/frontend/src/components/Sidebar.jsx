// components/Sidebar.jsx — Neo-brutalist sticker-book light theme sidebar
import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { LogOut, ChevronLeft, ChevronRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

// Hand-drawn / neo-brutalist outlined vector icons with 2px black stroke
const DashboardIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="flex-shrink-0">
    <rect x="2" y="2" width="6.5" height="6.5" rx="1.5" stroke="#000" strokeWidth="2" fill="white" />
    <rect x="11.5" y="2" width="6.5" height="6.5" rx="1.5" stroke="#000" strokeWidth="2" fill="#A3E635" />
    <rect x="2" y="11.5" width="6.5" height="6.5" rx="1.5" stroke="#000" strokeWidth="2" fill="#A3E635" />
    <rect x="11.5" y="11.5" width="6.5" height="6.5" rx="1.5" stroke="#000" strokeWidth="2" fill="white" />
  </svg>
);

const NoteIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="flex-shrink-0">
    <path d="M4 2.5H13L17 6.5V17.5H4V2.5Z" fill="white" stroke="#000" strokeWidth="2" strokeLinejoin="round" />
    <path d="M13 2.5V6.5H17" stroke="#000" strokeWidth="2" strokeLinejoin="round" />
    <path d="M7 9H13M7 12H11" stroke="#000" strokeWidth="1.8" strokeLinecap="round" />
    <circle cx="13" cy="13.5" r="1.5" fill="#A3E635" stroke="#000" strokeWidth="1" />
  </svg>
);

const SubjectsIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="flex-shrink-0">
    <path d="M3 4H17V6.5L10 10.5L3 6.5V4Z" fill="#A3E635" stroke="#000" strokeWidth="2" strokeLinejoin="round" />
    <path d="M3 6.5V16.5H17V6.5" fill="white" stroke="#000" strokeWidth="2" strokeLinejoin="round" />
    <path d="M10 10.5V16.5" stroke="#000" strokeWidth="2" strokeLinecap="round" />
    <path d="M6 13.5H8M12 13.5H14" stroke="#000" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

const TaskIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="flex-shrink-0">
    <rect x="2.5" y="2.5" width="15" height="15" rx="3" fill="white" stroke="#000" strokeWidth="2" />
    <path d="M6 10.5L8.5 13L14.5 7" stroke="#000" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    <circle cx="14" cy="14" r="1.5" fill="#A3E635" stroke="#000" strokeWidth="0.8" />
  </svg>
);

const FocusIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="flex-shrink-0">
    <circle cx="10" cy="10.5" r="7.5" fill="white" stroke="#000" strokeWidth="2" />
    <circle cx="10" cy="10.5" r="3.5" fill="#A3E635" stroke="#000" strokeWidth="1.8" />
    <path d="M10 1.5V3M10 18V19.5M1.5 10.5H3M17 10.5H18.5" stroke="#000" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

const FlashcardsIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="flex-shrink-0">
    <rect x="4" y="6" width="13.5" height="11" rx="2" fill="#A3E635" stroke="#000" strokeWidth="2" />
    <rect x="2.5" y="3" width="13.5" height="11" rx="2" fill="white" stroke="#000" strokeWidth="2" />
    <path d="M5.5 7.5H12M5.5 10H9.5" stroke="#000" strokeWidth="1.8" strokeLinecap="round" />
  </svg>
);

// StudyMate Illustrated Book Logo
const StudyMateLogo = () => (
  <svg width="34" height="34" viewBox="0 0 34 34" fill="none">
    <rect x="2" y="5" width="30" height="24" rx="4" fill="#A3E635" stroke="#000" strokeWidth="2" />
    <rect x="2" y="5" width="15" height="24" rx="4" fill="#BBF7D0" stroke="#000" strokeWidth="2" />
    <path d="M17 5V29" stroke="#000" strokeWidth="2" />
    <path d="M5.5 11.5H12.5M5.5 16H10.5M5.5 20.5H11.5" stroke="#000" strokeWidth="1.6" strokeLinecap="round" />
    <path d="M21.5 11.5H28.5M21.5 16H26.5M21.5 20.5H28.5" stroke="#000" strokeWidth="1.6" strokeLinecap="round" />
    <circle cx="17" cy="17" r="2.5" fill="#000" />
    {/* Small starburst sticker */}
    <path d="M29 3 L30 6 L33 7 L30 8 L29 11 L28 8 L25 7 L28 6 Z" fill="#FBBF24" stroke="#000" strokeWidth="1" />
  </svg>
);

// Sparkle vector sticker accent
const Sparkle = ({ size = 12 }) => (
  <svg width={size} height={size} viewBox="0 0 12 12" fill="none">
    <path d="M6 0 L6.8 4.5 L12 6 L6.8 7.5 L6 12 L5.2 7.5 L0 6 L5.2 4.5 Z" fill="#000" stroke="#000" strokeWidth="0.5" />
  </svg>
);

const navItems = [
  { to: '/', icon: DashboardIcon, label: 'Dashboard' },
  { to: '/notes', icon: NoteIcon, label: 'Note Studio' },
  { to: '/subjects', icon: SubjectsIcon, label: 'Subjects' },
  { to: '/tasks', icon: TaskIcon, label: 'Task Board' },
  { to: '/focus', icon: FocusIcon, label: 'Focus Room' },
  { to: '/flashcards', icon: FlashcardsIcon, label: 'Flashcards' },
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);

  const initials = user?.name?.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase() || 'SM';

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <>
      {/* Desktop Sidebar: Clean White Background, 2px Solid Black Right Border */}
      <motion.aside
        animate={{ width: collapsed ? 74 : 240 }}
        transition={{ duration: 0.22, ease: 'easeInOut' }}
        className="hidden md:flex flex-col h-screen relative z-30 flex-shrink-0 bg-white border-r-2 border-black select-none"
      >
        {/* Brand Header */}
        <div className="flex items-center gap-3 px-4 py-4.5 border-b-2 border-black bg-white">
          <div className="flex-shrink-0 cursor-pointer" onClick={() => navigate('/')}>
            <StudyMateLogo />
          </div>
          <AnimatePresence>
            {!collapsed && (
              <motion.div
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -8 }}
                className="flex items-center gap-1.5"
              >
                <span className="font-black text-[#111827] text-xl tracking-tight">
                  StudyMate
                </span>
                <span className="text-[10px] font-black uppercase px-1.5 py-0.2 rounded-md bg-[#A3E635] text-black border border-black shadow-[1px_1px_0px_#000]">
                  PRO
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 py-4 px-3 space-y-1.5 overflow-hidden">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl font-black text-sm transition-all duration-150 cursor-pointer relative ${
                  collapsed ? 'justify-center' : ''
                } ${
                  isActive
                    ? 'bg-[#A3E635] text-black border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] translate-x-0.5'
                    : 'text-[#1F2937] hover:bg-[#F0FDF4] hover:border-black/30 border-2 border-transparent'
                }`
              }
              title={collapsed ? label : undefined}
            >
              {({ isActive }) => (
                <>
                  <Icon />
                  <AnimatePresence>
                    {!collapsed && (
                      <motion.span
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="whitespace-nowrap tracking-tight font-extrabold"
                      >
                        {label}
                      </motion.span>
                    )}
                  </AnimatePresence>
                  {/* Active Pill Sparkle Accent */}
                  {isActive && !collapsed && (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="ml-auto flex items-center"
                    >
                      <Sparkle size={10} />
                    </motion.span>
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Decorative Illustrative Sticker Accent */}
        {!collapsed && (
          <div className="px-4 pb-2 opacity-50 pointer-events-none select-none">
            <svg width="70" height="34" viewBox="0 0 70 34" fill="none">
              <path d="M35 32 Q32 20 22 16 Q15 14 10 18" stroke="#A3E635" strokeWidth="2" strokeLinecap="round" />
              <path d="M35 32 Q38 20 50 14 Q58 10 62 13" stroke="#A3E635" strokeWidth="2" strokeLinecap="round" />
              <path d="M35 32 Q35 18 35 10" stroke="#86EFAC" strokeWidth="2" strokeLinecap="round" />
              <ellipse cx="22" cy="15" rx="5" ry="3.5" fill="#A3E635" stroke="#000" strokeWidth="1" />
              <ellipse cx="50" cy="13" rx="5" ry="3.5" fill="#86EFAC" stroke="#000" strokeWidth="1" />
              <ellipse cx="35" cy="9" rx="4" ry="2.5" fill="#A3E635" stroke="#000" strokeWidth="1" />
            </svg>
          </div>
        )}

        {/* User Profile Container & Logout */}
        <div className="p-3 space-y-2 border-t-2 border-black bg-white">
          <div
            onClick={() => navigate('/')}
            className={`flex items-center gap-2.5 p-2 rounded-xl bg-[#F0FDF4] hover:bg-[#DCFCE7] border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 active:translate-y-0 active:shadow-none transition-all duration-150 cursor-pointer select-none ${
              collapsed ? 'justify-center' : ''
            }`}
            title="View Profile / Dashboard"
          >
            <div
              className="w-8 h-8 rounded-full bg-[#A3E635] flex items-center justify-center font-black text-xs text-black border-2 border-black flex-shrink-0 shadow-[1px_1px_0px_#000]"
            >
              {initials}
            </div>
            <AnimatePresence>
              {!collapsed && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="min-w-0 flex-1"
                >
                  <p className="text-xs font-black text-[#111827] truncate leading-tight">{user?.name || 'Scholar'}</p>
                  <p className="text-[10px] text-[#4B5563] truncate font-bold">{user?.email || 'scholar@studymate.io'}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <button
            onClick={handleLogout}
            className={`flex items-center gap-2.5 w-full px-2.5 py-2 rounded-xl font-black text-xs text-red-600 bg-white hover:bg-red-50 border-2 border-red-500 shadow-[2px_2px_0px_0px_rgba(239,68,68,1)] hover:shadow-[4px_4px_0px_0px_rgba(239,68,68,1)] hover:-translate-y-0.5 active:translate-y-0 active:shadow-none transition-all duration-150 cursor-pointer ${
              collapsed ? 'justify-center' : ''
            }`}
            title="Log out of StudyMate"
          >
            <LogOut size={14} className="text-red-600 stroke-[2.5]" />
            {!collapsed && <span>Logout</span>}
          </button>
        </div>

        {/* Neo-brutalist Sidebar Collapse Toggle */}
        <button
          onClick={() => setCollapsed((v) => !v)}
          className="absolute -right-3.5 top-1/2 -translate-y-1/2 w-7 h-7 bg-white hover:bg-[#A3E635] rounded-full flex items-center justify-center font-black text-black transition-all z-20 border-2 border-black shadow-[2px_2px_0px_#000] hover:scale-105 active:scale-95 cursor-pointer"
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight size={14} className="stroke-[2.5]" /> : <ChevronLeft size={14} className="stroke-[2.5]" />}
        </button>
      </motion.aside>

      {/* Mobile Bottom Navigation Bar */}
      <nav
        className="md:hidden fixed bottom-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-1.5 px-3 py-2 rounded-2xl bg-white border-2 border-black shadow-[4px_4px_0px_#000]"
      >
        {navItems.slice(0, 5).map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex flex-col items-center gap-0.5 px-2.5 py-1 rounded-xl transition-all font-black text-[10px] ${
                isActive
                  ? 'bg-[#A3E635] text-black border-2 border-black shadow-[2px_2px_0px_#000]'
                  : 'text-[#4B5563] border-2 border-transparent'
              }`
            }
          >
            <Icon />
            <span className="tracking-tight">{label}</span>
          </NavLink>
        ))}
      </nav>
    </>
  );
}