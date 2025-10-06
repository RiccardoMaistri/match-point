import React from 'react';

const Header = ({ title, tournaments, currentTournamentId, onTournamentChange, onAdd }) => {
  const selectedId = currentTournamentId || (tournaments && tournaments.length > 0 ? tournaments[0].id : null);
  const currentTournament = tournaments?.find(t => t.id === selectedId);

  return (
    <header className="sticky top-0 z-10 bg-background shadow-sm border-b border-gray-200">
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex-1 flex items-center justify-end">
          {onAdd && (
            <button
              onClick={onAdd}
              className="w-9 h-9 flex items-center justify-center text-white bg-primary hover:bg-primary-hover rounded-full transition-colors shadow-sm"
              aria-label="Create new tournament"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
            </button>
          )}
        </div>
        <div className="flex flex-col items-center justify-center flex-1 px-2">
        {tournaments && tournaments.length > 0 ? (
          <>
            <select
              value={selectedId}
              onChange={(e) => onTournamentChange(e.target.value)}
              className="text-primary-text text-lg font-bold leading-tight bg-transparent border-none focus:outline-none cursor-pointer max-w-[70vw] text-center"
            >
              {tournaments.map(t => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
            {currentTournament && (
              <p className="text-xs text-secondary-text mt-0.5 truncate max-w-[70vw]">
                {currentTournament.format.replace('_', ' ').split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')} · {currentTournament.participants?.length || 0} player{currentTournament.participants?.length !== 1 ? 's' : ''}
              </p>
            )}
          </>
        ) : (
          <h1 className="text-primary-text text-lg font-bold leading-tight">{title}</h1>
        )}
        </div>
        <div className="flex-1" />
      </div>
    </header>
  );
};

export default Header;
