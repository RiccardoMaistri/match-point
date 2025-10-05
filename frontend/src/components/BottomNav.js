import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';

const BottomNav = () => {
  const location = useLocation();
  const navLinkClasses = "flex flex-col items-center justify-center gap-1 text-secondary-text hover:text-primary transition-all duration-200 h-full rounded-lg";
  const activeLinkClasses = "!text-primary bg-blue-50 border border-blue-200";

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
    <nav className="fixed bottom-0 left-0 right-0 border-t border-gray-200 bg-background shadow-[0_-2px_8px_rgba(0,0,0,0.06)]">
      <div className="flex justify-around items-center h-14 px-2">
        <NavLink to={tournamentPath} className={({ isActive }) => `${navLinkClasses} ${isActive ? activeLinkClasses : ''} flex-1`}>
          <div className="flex h-6 w-6 items-center justify-center">
            <svg fill="currentColor" height="20px" viewBox="0 0 256 256" width="20px" xmlns="http://www.w3.org/2000/svg">
              <path d="M201.57,54.46a104,104,0,1,0,0,147.08A103.4,103.4,0,0,0,201.57,54.46ZM65.75,65.77a87.63,87.63,0,0,1,53.66-25.31A87.31,87.31,0,0,1,94,94.06a87.42,87.42,0,0,1-53.62,25.35A87.58,87.58,0,0,1,65.75,65.77ZM40.33,135.48a103.29,103.29,0,0,0,65-30.11,103.24,103.24,0,0,0,30.13-65,87.78,87.78,0,0,1,80.18,80.14,104,104,0,0,0-95.16,95.1,87.78,87.78,0,0,1-80.18-80.14Zm149.92,54.75a87.69,87.69,0,0,1-53.66,25.31,88,88,0,0,1,79-78.95A87.58,87.58,0,0,1,190.25,190.23Z"></path>
            </svg>
          </div>
          <span className="text-[10px] font-semibold">Matches</span>
        </NavLink>

        <NavLink to={participantsPath} className={({ isActive }) => `${navLinkClasses} ${isActive ? activeLinkClasses : ''} flex-1`}>
          <div className="flex h-6 w-6 items-center justify-center">
            <svg fill="currentColor" height="20px" viewBox="0 0 256 256" width="20px" xmlns="http://www.w3.org/2000/svg">
              <path d="M117.25,157.92a60,60,0,1,0-66.5,0A95.83,95.83,0,0,0,3.53,195.63a8,8,0,1,0,13.4,8.74,80,80,0,0,1,134.14,0,8,8,0,0,0,13.4-8.74A95.83,95.83,0,0,0,117.25,157.92ZM40,108a44,44,0,1,1,44,44A44.05,44.05,0,0,1,40,108Zm210.14,98.7a8,8,0,0,1-11.07-2.33A79.83,79.83,0,0,0,172,168a8,8,0,0,1,0-16,44,44,0,1,0-16.34-84.87,8,8,0,1,1-5.94-14.85,60,60,0,0,1,55.53,105.64,95.83,95.83,0,0,1,47.22,37.71A8,8,0,0,1,250.14,206.7Z"></path>
            </svg>
          </div>
          <span className="text-[10px] font-semibold">Players</span>
        </NavLink>

        <NavLink to={standingsPath} className={({ isActive }) => `${navLinkClasses} ${isActive ? activeLinkClasses : ''} flex-1`}>
          <div className="flex h-6 w-6 items-center justify-center">
            <svg fill="currentColor" height="20px" viewBox="0 0 256 256" width="20px" xmlns="http://www.w3.org/2000/svg">
              <path d="M232,208a8,8,0,0,1-8,8H32a8,8,0,0,1,0-16h8V136a8,8,0,0,1,8-8H80a8,8,0,0,1,8,8v64h32V88a8,8,0,0,1,8-8h32a8,8,0,0,1,8,8V200h32V40a8,8,0,0,1,8-8h32a8,8,0,0,1,8,8V200h8A8,8,0,0,1,232,208Z"></path>
            </svg>
          </div>
          <span className="text-[10px] font-semibold">Standings</span>
        </NavLink>
      </div>
    </nav>
  );
};

export default BottomNav;
