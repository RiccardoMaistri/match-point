import React from 'react';

function ParticipantList({ participants, tournamentId, onRemoveParticipant }) {
  if (!participants || participants.length === 0) {
    return <p className="text-sm text-secondary-text py-4 text-center">No participants have been added yet.</p>;
  }

  return (
    <div className="space-y-3 pt-4">
      <h4 className="text-md font-semibold text-primary-text">Participants ({participants.length})</h4>
      <ul className="space-y-3">
        {participants.map((participant) => (
          <li 
            key={participant.id} 
            className="flex flex-col sm:flex-row justify-between sm:items-center bg-white p-3 rounded-lg border border-accent transition-shadow hover:shadow-md"
          >
            <div className="flex-grow mb-2 sm:mb-0">
              <span className="font-semibold text-primary-text">{participant.name}</span>
              <span className="text-sm text-secondary-text ml-2">({participant.email})</span>
              {participant.ranking !== null && participant.ranking !== undefined && (
                <span className="text-xs bg-primary text-white px-2 py-1 rounded-full ml-2 font-medium">
                  Rank: {participant.ranking}
                </span>
              )}
            </div>
            {onRemoveParticipant && (
              <button
                onClick={() => onRemoveParticipant(tournamentId, participant.id)}
                className="px-3 py-1 text-xs font-semibold bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors self-start sm:self-center"
                title="Remove participant"
              >
                Remove
              </button>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default ParticipantList;
