import React from 'react';

// Helper function to find a participant's name by ID
const getParticipantName = (participantId, participants) => {
  if (!participantId) return 'N/A';
  const participant = participants.find(p => p.id === participantId);
  return participant ? participant.name : 'Unknown Participant';
};

function MatchList({ matches, participants, onRecordResult, tournamentId, tournamentFormat, currentUser, tournamentOwnerId }) {
  if (!matches || matches.length === 0) {
    return <p className="text-sm text-gray-500 dark:text-gray-400 italic py-4 text-center">No matches have been generated yet.</p>;
  }

  // Updated status classes with dark mode support
  const getStatusClass = (status) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300';
      case 'in_progress': return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-300';
      case 'pending': return 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300';
      default: return 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  return (
    <div className="pt-4">
      <ul className="space-y-4">
        {matches.map((match) => (
          <li
            key={match.id}
            className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-lg border border-gray-200 dark:border-gray-700 transition-shadow hover:shadow-md"
          >
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
              {/* Match Info */}
              <div className="flex-grow">
                <p className="text-base font-semibold text-gray-800 dark:text-gray-200">
                  {match.is_bye
                    ? <><span className="font-bold">{getParticipantName(match.participant1_id, participants)}</span> has a BYE</>
                    : <>
                        <span className="font-bold">{getParticipantName(match.participant1_id, participants)}</span>
                        <span className="text-gray-500 dark:text-gray-400 mx-2">vs</span>
                        <span className="font-bold">{getParticipantName(match.participant2_id, participants)}</span>
                      </>
                  }
                </p>
                
                {/* Match Meta */}
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1">
                  <span className={`inline-block px-2.5 py-0.5 rounded-full font-medium capitalize ${getStatusClass(match.status)}`}>
                    {match.status.replace('_', ' ')}
                  </span>
                  {match.round_number && <span>Round: <span className="font-medium text-gray-700 dark:text-gray-300">{match.round_number}</span></span>}
                  {match.match_number && <span>Match: <span className="font-medium text-gray-700 dark:text-gray-300">{match.match_number}</span></span>}
                </div>

                {/* Completed Match Info */}
                {match.status === 'completed' && !match.is_bye && (
                  <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">
                    Score: <span className="font-semibold">{match.score_participant1 ?? 'N/A'}</span> - <span className="font-semibold">{match.score_participant2 ?? 'N/A'}</span>
                    {match.winner_id && <span className="ml-4">Winner: <span className="font-bold text-green-600 dark:text-green-400">{getParticipantName(match.winner_id, participants)}</span></span>}
                  </p>
                )}
              </div>

              {/* Action Button */}
              {!match.is_bye && match.status !== 'completed' && onRecordResult &&
                (currentUser?.id === tournamentOwnerId ||
                 match.participant1_id === currentUser?.id ||
                 match.participant2_id === currentUser?.id) && (
                <div className="flex-shrink-0 self-start sm:self-center">
                    <button
                      onClick={() => onRecordResult(tournamentId, match.id)}
                      className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 shadow-sm transition-colors"
                    >
                      Record Result
                    </button>
                </div>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default MatchList;
