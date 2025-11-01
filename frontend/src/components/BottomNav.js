import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';

const BottomNav = () => {
  const location = useLocation();

  const getCurrentTournamentId = () => {
    const pathParts = location.pathname.split('/');
    if (pathParts[1] === 'tournaments' || pathParts[1] === 'standings' || pathParts[1] === 'participants') {
      return pathParts[2] || null;
    }
    return null;
  };

  const currentTournamentId = getCurrentTournamentId();

  const standingsPath = currentTournamentId ? `/standings/${currentTournamentId}` : '/standings';
  const participantsPath = currentTournamentId ? `/participants/${currentTournamentId}` : '/participants';
  const tournamentPath = currentTournamentId ? `/tournaments/${currentTournamentId}` : '/';

  return (
    <footer className="sticky bottom-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-t border-border-light dark:border-border-dark">
      <nav className="flex justify-around p-2">
        <NavLink to={tournamentPath} className={({ isActive }) => `flex flex-col items-center justify-center space-y-1 w-1/3 py-2 ${isActive ? 'bg-primary-light dark:bg-primary/20 rounded-lg' : ''}`}>
          <span className={`material-symbols-outlined ${location.pathname.startsWith('/tournaments') ? 'text-primary dark:text-indigo-400' : 'text-slate-500 dark:text-slate-400'}`}>sports_tennis</span>
          <span className={`text-xs ${location.pathname.startsWith('/tournaments') ? 'font-semibold text-primary dark:text-indigo-400' : 'font-medium text-slate-500 dark:text-slate-400'}`}>Matches</span>
        </NavLink>
        <NavLink to={standingsPath} className={({ isActive }) => `flex flex-col items-center justify-center space-y-1 w-1/3 py-2 ${isActive ? 'bg-primary-light dark:bg-primary/20 rounded-lg' : ''}`}>
          <span className={`material-symbols-outlined ${location.pathname.startsWith('/standings') ? 'text-primary dark:text-indigo-400' : 'text-slate-500 dark:text-slate-400'}`}>leaderboard</span>
          <span className={`text-xs ${location.pathname.startsWith('/standings') ? 'font-semibold text-primary dark:text-indigo-400' : 'font-medium text-slate-500 dark:text-slate-400'}`}>Standings</span>
        </NavLink>
        <NavLink to={participantsPath} className={({ isActive }) => `flex flex-col items-center justify-center space-y-1 w-1/3 py-2 ${isActive ? 'bg-primary-light dark:bg-primary/20 rounded-lg' : ''}`}>
          <span className={`material-symbols-outlined ${location.pathname.startsWith('/participants') ? 'text-primary dark:text-indigo-400' : 'text-slate-500 dark:text-slate-400'}`}>groups</span>
          <span className={`text-xs ${location.pathname.startsWith('/participants') ? 'font-semibold text-primary dark:text-indigo-400' : 'font-medium text-slate-500 dark:text-slate-400'}`}>Players</span>
        </NavLink>
      </nav>
    </footer>
  );
};

export default BottomNav;
