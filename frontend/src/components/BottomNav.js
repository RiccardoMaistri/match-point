import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';

const BottomNav = ({ tournamentId, playoffLocked, matchesLeft }) => {
  const location = useLocation();

  if (!tournamentId) return null;

  return (
    <footer className="fixed bottom-0 left-0 right-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-t border-border-light dark:border-border-dark safe-area-bottom">
      <nav className="flex justify-around items-center p-2">
        <NavLink 
          to={`/tournaments/${tournamentId}/group-stage`} 
          className={({ isActive }) => `flex flex-col items-center justify-center space-y-1 w-1/3 py-2 ${isActive ? 'bg-primary-light dark:bg-primary/20 rounded-2xl' : ''}`}
        >
          <span className={`material-symbols-outlined ${location.pathname.includes('/group-stage') ? 'text-primary dark:text-indigo-400' : 'text-slate-500 dark:text-slate-400'}`}>view_list</span>
          <span className={`text-xs ${location.pathname.includes('/group-stage') ? 'font-semibold text-primary dark:text-indigo-400' : 'font-medium text-slate-500 dark:text-slate-400'}`}>Group Stage</span>
        </NavLink>
        
        <div className="h-8 w-px bg-slate-300 dark:bg-slate-600"></div>
        
        <NavLink 
          to={`/tournaments/${tournamentId}/playoff`} 
          className={({ isActive }) => `flex flex-col items-center justify-center space-y-1 w-1/3 py-2 ${isActive ? 'bg-primary-light dark:bg-primary/20 rounded-2xl' : ''}`}
        >
          <div className="relative">
            {playoffLocked ? (
                <span className={`material-symbols-outlined ${location.pathname.includes('/playoff') ? 'text-primary dark:text-indigo-400' : 'text-slate-500 dark:text-slate-400'}`}>
                    lock
                </span>
            ) : (
                <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="2" 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    className={`w-6 h-6 ${location.pathname.includes('/playoff') ? 'text-primary dark:text-indigo-400' : 'text-slate-500 dark:text-slate-400'}`}
                >
                    <path d="M4 5h4M4 9h4M8 5v4M8 7h4M4 15h4M4 19h4M8 15v4M8 17h4M12 7v10M12 12h6" />
                </svg>
            )}
            {playoffLocked && matchesLeft > 0 && (
                <span className="absolute -top-1 -right-2 bg-slate-500 text-white text-[9px] px-1 rounded-full">
                    {matchesLeft}
                </span>
            )}
          </div>
          <span className={`text-xs ${location.pathname.includes('/playoff') ? 'font-semibold text-primary dark:text-indigo-400' : 'font-medium text-slate-500 dark:text-slate-400'}`}>Playoff</span>
        </NavLink>

        <div className="h-8 w-px bg-slate-300 dark:bg-slate-600"></div>

        <NavLink 
          to={`/tournaments/${tournamentId}/players`} 
          className={({ isActive }) => `flex flex-col items-center justify-center space-y-1 w-1/3 py-2 ${isActive ? 'bg-primary-light dark:bg-primary/20 rounded-2xl' : ''}`}
        >
          <span className={`material-symbols-outlined ${location.pathname.includes('/players') ? 'text-primary dark:text-indigo-400' : 'text-slate-500 dark:text-slate-400'}`}>groups</span>
          <span className={`text-xs ${location.pathname.includes('/players') ? 'font-semibold text-primary dark:text-indigo-400' : 'font-medium text-slate-500 dark:text-slate-400'}`}>Players</span>
        </NavLink>
      </nav>
    </footer>
  );
};

export default BottomNav;
