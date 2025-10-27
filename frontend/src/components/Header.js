import React from 'react';

const Header = ({ tournaments, currentTournamentId, onTournamentChange, onAdd }) => {
  const selectedTournament = tournaments?.find(t => t.id === currentTournamentId);

  return (
    <header className="sticky top-0 z-10 p-4 bg-surface-light dark:bg-surface-dark border-b border-border-light dark:border-border-dark">
      <div className="flex items-center justify-between">
        <div className="w-10"></div>
        <div className="text-center">
          {tournaments && tournaments.length > 0 ? (
            <>
              <button className="flex items-center justify-center gap-1 mx-auto">
                <h1 className="text-lg font-bold text-text-on-light dark:text-text-on-dark">{selectedTournament?.name || 'Select Tournament'}</h1>
                <span className="material-icons text-text-on-light dark:text-text-on-dark-secondary">expand_more</span>
              </button>
              {selectedTournament && (
                <p className="text-xs text-text-on-light dark:text-text-on-dark-secondary">
                  {selectedTournament.format.replace('_', ' ').split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')} - {selectedTournament.participants?.length || 0} players
                </p>
              )}
            </>
          ) : (
            <h1 className="text-lg font-bold text-text-on-light dark:text-text-on-dark">MatchPoint</h1>
          )}
        </div>
        {onAdd ? (
            <button onClick={onAdd} className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white">
                <span className="material-icons">add</span>
            </button>
        ) : <div className="w-10"></div>}
      </div>
    </header>
  );
};

export default Header;
