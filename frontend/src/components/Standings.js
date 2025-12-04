import React from 'react';
import Leaderboard from './Leaderboard';

const Standings = ({ tournament, participants, matches }) => {
  if (!tournament) {
    return <div className="p-4 text-center text-slate-500 dark:text-slate-400">Tournament not found.</div>;
  }

  return (
    <div className="flex flex-col h-full">
      <div className="px-2 mb-3">
        <h2 className="text-xl font-bold text-slate-900 dark:text-slate-50">Leaderboard</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">Group stage rankings</p>
      </div>
      <div className="flex-1 overflow-y-auto">
        <div className="pb-6">
          <Leaderboard 
            participants={participants} 
            matches={matches} 
            tournament={tournament}
            playoffParticipants={tournament.playoff_participants || 4}
          />
        </div>
      </div>
    </div>
  );
};

export default Standings;
