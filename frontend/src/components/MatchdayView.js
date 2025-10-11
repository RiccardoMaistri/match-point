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

  return (
    <div className="space-y-2">
      {canGeneratePlayoffs && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-center justify-between">
          <p className="text-sm font-bold text-blue-900">Group stage completed.</p>
          <button
            onClick={handleGeneratePlayoffs}
            className="px-3 py-1.5 bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors font-semibold text-xs shadow-sm"
          >
            Generate Playoffs
          </button>
        </div>
      )}

      <div className="space-y-2">
        {matchdayMatches.length > 0 ? (
          matchdayMatches.map((match) => {
            const participant1 = participants?.find(p => p.id === match.participant1_id);
            const participant2 = participants?.find(p => p.id === match.participant2_id);
            const isUserMatch = currentUser && (participant1?.email === currentUser.email || participant2?.email === currentUser.email);

            const p1_scores = [];
            if (match.set1_score_participant1 !== null) p1_scores.push(match.set1_score_participant1);
            if (match.set2_score_participant1 !== null) p1_scores.push(match.set2_score_participant1);

            const p2_scores = [];
            if (match.set1_score_participant2 !== null) p2_scores.push(match.set1_score_participant2);
            if (match.set2_score_participant2 !== null) p2_scores.push(match.set2_score_participant2);

            const score1Display = p1_scores.length > 0 
              ? p1_scores.map((s, i) => <span key={i} className="text-center w-8 font-bold text-lg">{s}</span>) 
              : <span className="text-center w-8 font-bold text-lg">-</span>;

            const score2Display = p2_scores.length > 0 
              ? p2_scores.map((s, i) => <span key={i} className="text-center w-8 font-bold text-lg">{s}</span>) 
              : <span className="text-center w-8 font-bold text-lg">-</span>;

            return (
              <div key={match.id} className="bg-gray-50 rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <div className="divide-y divide-gray-200">
                  <div className={`flex justify-between items-center p-2.5 ${match.winner_id === match.participant1_id ? 'bg-blue-50 border-l-4 border-blue-500' : 'bg-white'}`}>
                    <span className="font-semibold text-sm truncate flex-1">{getParticipantName(match.participant1_id)}</span>
                    <div className="flex items-center text-gray-900 ml-3">
                      {score1Display}
                    </div>
                  </div>
                  <div className={`flex justify-between items-center p-2.5 ${match.winner_id === match.participant2_id ? 'bg-blue-50 border-l-4 border-blue-500' : 'bg-white'}`}>
                    <span className="font-semibold text-sm truncate flex-1">{getParticipantName(match.participant2_id)}</span>
                    <div className="flex items-center text-gray-900 ml-3">
                      {score2Display}
                    </div>
                  </div>
                </div>
                <div className="flex justify-between items-center px-2.5 py-1.5 bg-white border-t border-gray-200">
                  {match.status !== 'completed' && (
                    <span className="text-[10px] text-gray-400 font-medium">Pending</span>
                  )}
                  {match.status !== 'completed' && isUserMatch && onRecordResult && (
                    <button
                      onClick={() => onRecordResult(tournament.id, match.id)}
                      className="px-3 py-1 text-xs font-semibold text-white bg-primary rounded-lg hover:bg-primary-hover transition-colors shadow-sm"
                    >
                      Record Result
                    </button>
                  )}
                </div>
              </div>
            );
          })
        ) : (
          <div className="p-4 text-center text-gray-500 text-sm">
            No matches scheduled
          </div>
        )}
      </div>

      {tournament?.status === 'playoffs' && (
        <div className="bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-1.5">
            <div className="w-7 h-7 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h4 className="text-sm font-bold text-blue-800">Playoff Phase</h4>
          </div>
          <p className="text-blue-700 text-xs ml-9">
            Top {tournament.playoff_participants} players advancing to knockout stage
          </p>
        </div>
      )}
    </div>
  );
};

export default MatchdayView;
