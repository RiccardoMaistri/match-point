import React, { useMemo } from 'react';

const Leaderboard = ({ participants, matches }) => {
  const leaderboardData = useMemo(() => {
    if (!participants || !matches) {
      return [];
    }

    const stats = participants.map(participant => {
      const playedMatches = matches.filter(
        m => (m.participant1_id === participant.id || m.participant2_id === participant.id) && m.status === 'completed' && !m.is_bye
      );

      const wins = playedMatches.filter(m => m.winner_id === participant.id).length;
      const losses = playedMatches.length - wins;

      return {
        id: participant.id,
        name: participant.name,
        played: playedMatches.length,
        wins,
        losses,
      };
    });

    // Sort by wins (descending)
    stats.sort((a, b) => b.wins - a.wins);

    return stats;
  }, [participants, matches]);

  if (leaderboardData.length === 0) {
    return <p className="text-sm text-secondary-text py-4 text-center">No completed matches to build a leaderboard yet.</p>;
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-accent">
      <table className="min-w-full divide-y divide-accent">
        <thead className="bg-card-background">
          <tr>
            <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-secondary-text uppercase tracking-wider">Rank</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-secondary-text uppercase tracking-wider">Name</th>
            <th scope="col" className="px-6 py-3 text-center text-xs font-bold text-secondary-text uppercase tracking-wider">Played</th>
            <th scope="col" className="px-6 py-3 text-center text-xs font-bold text-secondary-text uppercase tracking-wider">Wins</th>
            <th scope="col" className="px-6 py-3 text-center text-xs font-bold text-secondary-text uppercase tracking-wider">Losses</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-accent">
          {leaderboardData.map((player, index) => (
            <tr key={player.id} className="hover:bg-card-background transition-colors">
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-primary-text">{index + 1}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-primary-text">{player.name}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-secondary-text">{player.played}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-center font-bold text-green-600">{player.wins}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-red-600">{player.losses}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Leaderboard;
