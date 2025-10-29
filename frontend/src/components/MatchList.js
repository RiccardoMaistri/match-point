import React from 'react';

// Helper function to find a participant's name by ID
const getParticipantName = (participantId, participants) => {
  if (!participantId) return 'N/A';
  const participant = participants.find(p => p.id === participantId);
  return participant ? participant.name : 'Unknown Participant';
};

function MatchList({ matches, participants, onRecordResult, tournamentId, tournamentFormat, currentUser, tournamentOwnerId }) {
  if (!matches || matches.length === 0) {
    return <p className="text-sm text-secondary-text italic py-4 text-center">No matches have been generated yet.</p>;
  }

  // Updated status classes with dark mode support
  const getStatusClass = (status) => {
    switch (status) {
      case 'completed': return 'bg-green-500 text-white';
      case 'in_progress': return 'bg-yellow-500 text-white';
      case 'pending': return 'bg-gray-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  return (
    <div className="pt-4">
      <ul className="space-y-4">
        {matches.map((match) => {
          // Find participant objects from the participants list
          const participant1 = participants.find(p => p.id === match.participant1_id);
          const participant2 = participants.find(p => p.id === match.participant2_id);

          // Check if the current user is one of the participants in the match by comparing emails
          const isCurrentUserParticipant = currentUser && (
            (participant1 && participant1.email === currentUser.email) ||
            (participant2 && participant2.email === currentUser.email)
          );

          return (
            <li
              key={match.id}
              className="bg-white p-4 rounded-lg border border-accent transition-shadow hover:shadow-md"
            >
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                {/* Match Info */}
                <div className="flex-grow">
                  <p className="text-base font-semibold text-primary-text">
                    {match.is_bye
                      ? <><span className="font-bold">{getParticipantName(match.participant1_id, participants)}</span> has a BYE</>
                      : <>
                          <span className="font-bold">{getParticipantName(match.participant1_id, participants)}</span>
                          <span className="text-secondary-text mx-2">vs</span>
                          <span className="font-bold">{getParticipantName(match.participant2_id, participants)}</span>
                        </>
                    }
                  </p>

                  {/* Match Meta */}
                  <div className="text-xs text-secondary-text mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1">
                    <span className={`inline-block px-2.5 py-0.5 rounded-full font-medium capitalize ${getStatusClass(match.status)}`}>
                      {match.status.replace('_', ' ')}
                    </span>
                    {match.round_number && <span>Round: <span className="font-medium text-primary-text">{match.round_number}</span></span>}
                    {match.match_number && <span>Match: <span className="font-medium text-primary-text">{match.match_number}</span></span>}
                  </div>

                  {/* Completed Match Info */}
                  {match.status === 'completed' && !match.is_bye && (
                    <p className="text-sm text-secondary-text mt-2">
                      Score: <span className="font-semibold">{match.score_participant1 ?? 'N/A'}</span> - <span className="font-semibold">{match.score_participant2 ?? 'N/A'}</span>
                      {match.winner_id && <span className="ml-4">Winner: <span className="font-bold text-green-600">{getParticipantName(match.winner_id, participants)}</span></span>}
                    </p>
                  )}
                </div>

                {/* Action Button */}
                {!match.is_bye && match.status !== 'completed' && onRecordResult && isCurrentUserParticipant && (
                  <div className="flex-shrink-0 self-start sm:self-center">
                      <button
                        onClick={() => onRecordResult(tournamentId, match.id)}
                        className="px-4 py-2 text-xs font-semibold text-white bg-primary rounded-lg hover:bg-primary-hover shadow-sm transition-colors"
                      >
                        Record Result
                      </button>
                  </div>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export default MatchList;
