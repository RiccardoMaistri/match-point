import React from 'react';
import TournamentCard from './TournamentCard';

const TournamentList = ({ tournaments, onView }) => {
  if (!tournaments || tournaments.length === 0) {
    return <p className="text-secondary-text py-4 text-center">No tournaments found.</p>;
  }

  const activeTournaments = tournaments.filter(t => t.status !== 'completed');
  const pastTournaments = tournaments.filter(t => t.status === 'completed');

  return (
    <div>
      {activeTournaments.length > 0 && (
        <section className="px-4 pt-6 pb-3">
          <h2 className="text-primary-text text-lg font-semibold leading-tight tracking-tight">Active</h2>
        </section>
      )}
      <div className="grid gap-4 px-4">
        {activeTournaments.map((tournament) => (
          <div key={tournament.id} onClick={() => onView(tournament.id)} className="cursor-pointer">
            <TournamentCard tournament={tournament} onView={onView} />
          </div>
        ))}
      </div>

      {pastTournaments.length > 0 && (
        <section className="px-4 pt-8 pb-3">
          <h2 className="text-primary-text text-lg font-semibold leading-tight tracking-tight">Past</h2>
        </section>
      )}
      <div className="grid gap-4 px-4">
        {pastTournaments.map((tournament) => (
          <div key={tournament.id} onClick={() => onView(tournament.id)} className="cursor-pointer">
            <TournamentCard tournament={tournament} onView={onView} />
          </div>
        ))}
      </div>
    </div>
  );
};

export default TournamentList;
