import React from 'react';
import * as api from '../services/api';

const MatchdayView = ({ tournament, matches, participants, onMatchUpdate, currentUser, onRecordResult, selectedMatchday }) => {
  const matchdayMatches = matches.filter(
    (m) => m.match_day === selectedMatchday && m.phase === 'group'
  );

  const handleGeneratePlayoffs = async () => {
    if (!tournament?.id) return;
    
    try {
      await api.generatePlayoffs(tournament.id);
      onMatchUpdate?.();
    } catch (error) {
      console.error('Error generating playoffs:', error);
      alert(error.message || 'Failed to generate playoffs');
    }
  };

  const getParticipantName = (participantId) => {
    const participant = participants?.find(p => p.id === participantId);
    return participant?.name || 'Unknown';
  };

  if (!tournament || tournament.format !== 'round_robin') {
    return null;
  }

  const groupMatches = matches?.filter(m => m.phase === 'group') || [];
  const allGroupMatchesCompleted = groupMatches.length > 0 && groupMatches.every(m => m.status === 'completed');
  const canGeneratePlayoffs = tournament?.status === 'group_stage' && 
    allGroupMatchesCompleted &&
    tournament?.playoff_participants > 0;

  const scoreDisplay = (scores) => {
      if (scores.length === 0) {
          return <span className="text-center w-8 font-bold text-lg text-subtext-light dark:text-subtext-dark">-</span>;
      }
      return scores.map((s, i) => (
          <span key={i} className="text-center w-8 font-bold text-lg">{s}</span>
      ));
  };

  return (
    <div className="space-y-4">
      {canGeneratePlayoffs && (
        <div className="bg-primary/10 border border-primary/20 rounded-lg p-3 flex items-center justify-between">
          <p className="text-sm font-bold text-primary">Group stage completed.</p>
          <button
            onClick={handleGeneratePlayoffs}
            className="px-3 py-1.5 bg-primary text-white rounded-lg hover:bg-indigo-700 transition-colors font-semibold text-xs shadow-sm"
          >
            Generate Playoffs
          </button>
        </div>
      )}

      <div className="space-y-3">
        {matchdayMatches.length > 0 ? (
          matchdayMatches.map((match) => {
            const participant1 = participants?.find(p => p.id === match.participant1_id);
            const participant2 = participants?.find(p => p.id === match.participant2_id);
            const isUserMatch = currentUser && (participant1?.email === currentUser.email || participant2?.email === currentUser.email);

            const p1_scores = [];
            if (match.set1_score_participant1 !== null) p1_scores.push(match.set1_score_participant1);
            if (match.set2_score_participant1 !== null) p1_scores.push(match.set2_score_participant1);
            if (match.set3_score_participant1 !== null) p1_scores.push(match.set3_score_participant1);

            const p2_scores = [];
            if (match.set1_score_participant2 !== null) p2_scores.push(match.set1_score_participant2);
            if (match.set2_score_participant2 !== null) p2_scores.push(match.set2_score_participant2);
            if (match.set3_score_participant2 !== null) p2_scores.push(match.set3_score_participant2);

            return (
              <div key={match.id} className="bg-card-light dark:bg-card-dark rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm">
                <div className="divide-y divide-gray-200 dark:divide-gray-700">
                  <div className={`flex justify-between items-center p-3 ${match.winner_id === match.participant1_id ? 'bg-blue-50 dark:bg-blue-900/30 border-l-4 border-blue-500' : 'bg-white dark:bg-card-dark'}`}>
                    <p className="font-semibold truncate text-text-light dark:text-text-dark">{getParticipantName(match.participant1_id)}</p>
                    <div className="flex items-center text-text-light dark:text-text-dark ml-3">
                      {scoreDisplay(p1_scores)}
                    </div>
                  </div>
                  <div className={`flex justify-between items-center p-3 ${match.winner_id === match.participant2_id ? 'bg-blue-50 dark:bg-blue-900/30 border-l-4 border-blue-500' : 'bg-white dark:bg-card-dark'}`}>
                    <p className="font-semibold truncate text-text-light dark:text-text-dark">{getParticipantName(match.participant2_id)}</p>
                    <div className="flex items-center text-text-light dark:text-text-dark ml-3">
                      {scoreDisplay(p2_scores)}
                    </div>
                  </div>
                </div>
                {match.status !== 'completed' && isUserMatch && onRecordResult && (
                  <div className="flex justify-end items-center px-3 py-2 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-700">
                    <button
                      onClick={() => onRecordResult(tournament.id, match.id)}
                      className="px-4 py-1.5 text-xs font-semibold text-white bg-primary rounded-lg hover:bg-indigo-700 transition-colors shadow"
                    >
                      Record Result
                    </button>
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <div className="p-4 text-center text-subtext-light dark:text-subtext-dark text-sm">
            No matches scheduled for this day.
          </div>
        )}
      </div>

      {tournament?.status === 'playoffs' && (
        <div className="bg-primary/10 border border-primary/20 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-1.5">
            <div className="w-7 h-7 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h4 className="text-sm font-bold text-primary">Group Stage</h4>
          </div>
          <p className="text-primary/80 text-xs ml-9">
            Top {tournament.playoff_participants} players advancing to knockout stage.
          </p>
        </div>
      )}
    </div>
  );
};

export default MatchdayView;
