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
    return <p className="text-sm text-gray-500 dark:text-gray-400 py-4 text-center">No completed matches to build a leaderboard yet.</p>;
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead className="bg-gray-50 dark:bg-gray-800/50">
          <tr>
            <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Rank</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Name</th>
            <th scope="col" className="px-6 py-3 text-center text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Played</th>
            <th scope="col" className="px-6 py-3 text-center text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Wins</th>
            <th scope="col" className="px-6 py-3 text-center text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Losses</th>
          </tr>
        </thead>
        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
          {leaderboardData.map((player, index) => (
            <tr key={player.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{index + 1}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-800 dark:text-gray-200">{player.name}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-600 dark:text-gray-300">{player.played}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-center font-bold text-green-600 dark:text-green-400">{player.wins}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-red-600 dark:text-red-400">{player.losses}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Leaderboard;
