import React from 'react';

// Funzione helper per trovare il nome di un partecipante dato il suo ID
const getParticipantName = (participantId, participants) => {
  if (!participantId) return 'N/A';
  const participant = participants.find(p => p.id === participantId);
  return participant ? participant.name : 'Unknown Participant';
};

function MatchList({ matches, participants, onRecordResult, tournamentId, tournamentFormat }) {
  if (!matches || matches.length === 0) {
    return <p className="text-sm text-slate-500 italic py-2">No matches have been generated for this tournament yet.</p>;
  }

  const getStatusClass = (status) => {
    switch (status) {
      case 'completed': return 'text-green-600 bg-green-100';
      case 'in_progress': return 'text-yellow-600 bg-yellow-100';
      case 'pending': return 'text-slate-600 bg-slate-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className="mt-4"> {/* Aggiunto margine superiore */}
      {/* Il titolo è già in TournamentDetail, quindi qui possiamo ometterlo o renderlo più piccolo */}
      {/* <h4 className="text-lg font-semibold text-slate-700 mb-3">
        {tournamentFormat === 'elimination' ? 'Bracket Matches' : 'Scheduled Matches'}
        <span className="text-base font-normal text-slate-500"> ({matches.length})</span>
      </h4> */}
      <ul className="space-y-3">
        {matches.map((match, index) => (
          <li
            key={match.id || index}
            className="bg-white p-3 sm:p-4 rounded-lg shadow-sm border border-slate-200 hover:shadow-md transition-shadow duration-150"
          >
            <div className="flex flex-col sm:flex-row justify-between sm:items-center">
              <div className="mb-2 sm:mb-0 flex-grow">
                <p className="text-sm sm:text-base font-semibold text-slate-800">
                  {match.is_bye
                    ? <><span className="font-bold">{getParticipantName(match.participant1_id, participants)}</span> has a BYE</>
                    : <><span className="font-bold">{getParticipantName(match.participant1_id, participants)}</span> vs <span className="font-bold">{getParticipantName(match.participant2_id, participants)}</span></>
                  }
                </p>
                <div className="text-xs text-slate-500 mt-1 space-x-2">
                  <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${getStatusClass(match.status)}`}>
                    {match.status.charAt(0).toUpperCase() + match.status.slice(1)}
                  </span>
                  {match.round_number && <span>Round: {match.round_number}</span>}
                  {match.match_number && <span>Match: {match.match_number}</span>}
                </div>

                {match.status === 'completed' && !match.is_bye && (
                  <p className="text-xs text-slate-600 mt-1">
                    Score: <span className="font-semibold">{match.score_participant1 ?? '-'}</span> - <span className="font-semibold">{match.score_participant2 ?? '-'}</span>
                    {match.winner_id && <span className="ml-2">Winner: <span className="font-semibold">{getParticipantName(match.winner_id, participants)}</span></span>}
                  </p>
                )}
              </div>
              {!match.is_bye && match.status !== 'completed' && onRecordResult && (
                <button
                  onClick={() => onRecordResult(tournamentId, match.id)}
                  className="mt-2 sm:mt-0 sm:ml-4 px-3 py-1.5 text-xs font-medium text-white bg-indigo-500 rounded-md hover:bg-indigo-600 transition-colors self-start sm:self-center"
                >
                  Record Result
                </button>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default MatchList;
