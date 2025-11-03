import React, { useMemo } from 'react';

const Leaderboard = ({ participants, matches, tournament, playoffParticipants = 4 }) => {
  const leaderboardData = useMemo(() => {
    if (!participants || !matches) {
      return [];
    }

    const isDoubles = tournament?.tournament_type === 'double';
    const teams = tournament?.teams || [];
    
    if (isDoubles && teams.length > 0) {
      // For doubles tournaments, calculate stats for teams
      const stats = teams.map(team => {
        const playedMatches = matches.filter(
          m => (m.participant1_id === team.id || m.participant2_id === team.id) && m.status === 'completed' && !m.is_bye
        );

        const wins = playedMatches.filter(m => m.winner_id === team.id).length;
        const losses = playedMatches.length - wins;

        let scoreFor = 0;
        let scoreAgainst = 0;
        playedMatches.forEach(m => {
          const isP1 = m.participant1_id === team.id;
          const p1Score = (m.set1_score_participant1 || 0) + (m.set2_score_participant1 || 0) + (m.set3_score_participant1 || 0);
          const p2Score = (m.set1_score_participant2 || 0) + (m.set2_score_participant2 || 0) + (m.set3_score_participant2 || 0);
          if (isP1) {
            scoreFor += p1Score;
            scoreAgainst += p2Score;
          } else {
            scoreFor += p2Score;
            scoreAgainst += p1Score;
          }
        });

        const player1 = participants.find(p => p.id === team.player1_id);
        const player2 = participants.find(p => p.id === team.player2_id);
        const getName = (p) => {
          if (!p) return 'Unknown';
          if (p.name && p.name !== p.email) return p.name;
          return p.email ? p.email.split('@')[0] : 'Unknown';
        };
        const teamName = `${getName(player1)} / ${getName(player2)}`;

        return {
          id: team.id,
          name: teamName,
          played: playedMatches.length,
          wins,
          losses,
          scoreFor,
          scoreAgainst,
          scoreDiff: scoreFor - scoreAgainst,
        };
      });

      stats.sort((a, b) => b.wins - a.wins);
      return stats;
    } else {
      // For singles tournaments, calculate stats for participants
      const stats = participants.map(participant => {
        const playedMatches = matches.filter(
          m => (m.participant1_id === participant.id || m.participant2_id === participant.id) && m.status === 'completed' && !m.is_bye
        );

        const wins = playedMatches.filter(m => m.winner_id === participant.id).length;
        const losses = playedMatches.length - wins;

        let scoreFor = 0;
        let scoreAgainst = 0;
        playedMatches.forEach(m => {
          const isP1 = m.participant1_id === participant.id;
          const p1Score = (m.set1_score_participant1 || 0) + (m.set2_score_participant1 || 0) + (m.set3_score_participant1 || 0);
          const p2Score = (m.set1_score_participant2 || 0) + (m.set2_score_participant2 || 0) + (m.set3_score_participant2 || 0);
          if (isP1) {
            scoreFor += p1Score;
            scoreAgainst += p2Score;
          } else {
            scoreFor += p2Score;
            scoreAgainst += p1Score;
          }
        });

        const getName = (p) => {
          if (p.name && p.name !== p.email) return p.name;
          return p.email ? p.email.split('@')[0] : 'Unknown';
        };

        return {
          id: participant.id,
          name: getName(participant),
          played: playedMatches.length,
          wins,
          losses,
          scoreFor,
          scoreAgainst,
          scoreDiff: scoreFor - scoreAgainst,
        };
      });

      stats.sort((a, b) => b.wins - a.wins);
      return stats;
    }
  }, [participants, matches, tournament]);

  if (leaderboardData.length === 0) {
    return <p className="text-xs text-slate-500 dark:text-slate-400 py-2 text-center">No completed matches yet.</p>;
  }

  return (
    <div className="bg-white dark:bg-surface-dark rounded-3xl shadow-sm overflow-hidden">
      <div className="p-4 space-y-3">
        {leaderboardData.map((player, index) => {
          const isQualified = index < playoffParticipants;
          return (
            <div key={player.id} className="flex items-center justify-between">
              <div className="flex items-center gap-3 flex-1">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                  isQualified 
                    ? 'bg-primary/10 text-primary dark:bg-primary/20' 
                    : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
                }`}>
                  {index + 1}
                </div>
                <div className="flex-1">
                  <span className={`font-semibold block ${
                    isQualified 
                      ? 'text-slate-900 dark:text-slate-50' 
                      : 'text-slate-600 dark:text-slate-400'
                  }`}>
                    {player.name}
                  </span>
                  <div className="flex gap-3 text-xs text-slate-500 dark:text-slate-400 mt-1">
                    <span>P: {player.played}</span>
                    <span>L: <span className="font-medium">{player.losses}</span></span>
                    <span>Diff: <span className={`${player.scoreDiff >= 0 ? 'text-green-600 dark:text-green-500' : 'text-red-600 dark:text-red-500'} font-medium`}>{player.scoreDiff >= 0 ? `+${player.scoreDiff}` : player.scoreDiff}</span></span>
                  </div>
                </div>
              </div>
              <div className="flex flex-col items-center">
                <span className="font-bold text-2xl text-primary">{player.wins}</span>
                <span className="text-xs text-slate-500 dark:text-slate-400">WINS</span>
              </div>
            </div>
          );
        })}
      </div>
      <div className="border-t border-gray-200 dark:border-border-dark p-3 bg-green-50/50 dark:bg-green-900/20 rounded-b-xl flex items-center justify-center gap-2 text-sm">
        <span className="material-symbols-outlined text-green-600 dark:text-green-400 text-base">emoji_events</span>
        <span className="font-medium text-green-800 dark:text-green-300">Top {playoffParticipants} advance to playoffs</span>
      </div>
    </div>
  );
};

export default Leaderboard;
