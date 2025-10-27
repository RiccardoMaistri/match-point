import React from 'react';
import TournamentCard from './TournamentCard';

const TournamentList = ({ tournaments, onView }) => {
  if (!tournaments || tournaments.length === 0) {
    return <p className="text-text-on-light dark:text-text-on-dark-secondary py-4 text-center">No tournaments found.</p>;
  }

  const activeTournaments = tournaments.filter(t => t.status !== 'completed');
  const pastTournaments = tournaments.filter(t => t.status === 'completed');

  return (
    <div className="space-y-6">
      {activeTournaments.length > 0 && (
        <div>
          <h2 className="text-xl font-bold text-text-on-light dark:text-text-on-dark px-4 pb-2">Active</h2>
          <div className="space-y-4">
            {activeTournaments.map((tournament) => (
              <TournamentCard key={tournament.id} tournament={tournament} onView={onView} />
            ))}
          </div>
        </div>
      )}

      {pastTournaments.length > 0 && (
        <div>
          <h2 className="text-xl font-bold text-text-on-light dark:text-text-on-dark px-4 pb-2">Past</h2>
          <div className="space-y-4">
            {pastTournaments.map((tournament) => (
              <TournamentCard key={tournament.id} tournament={tournament} onView={onView} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default TournamentList;
