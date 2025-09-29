import React from 'react';

function ParticipantList({ participants, tournamentId, onRemoveParticipant }) {
  if (!participants || participants.length === 0) {
    return <p className="text-xs text-secondary-text py-2 text-center">No participants have been added yet.</p>;
  }

  return (
    <div className="space-y-2 pt-2">
      <h4 className="text-sm font-semibold text-primary-text">Participants ({participants.length})</h4>
      <ul className="space-y-2">
        {participants.map((participant) => (
          <li 
            key={participant.id} 
            className="flex justify-between items-center bg-white p-2 rounded border border-accent"
          >
            <div className="flex-grow">
              <span className="font-medium text-primary-text text-sm">{participant.name}</span>
              <span className="text-xs text-secondary-text ml-1">({participant.email})</span>
              {participant.ranking !== null && participant.ranking !== undefined && (
                <span className="text-xs bg-primary text-white px-1 py-0.5 rounded ml-1 font-medium">
                  #{participant.ranking}
                </span>
              )}
            </div>
            {onRemoveParticipant && (
              <button
                onClick={() => onRemoveParticipant(tournamentId, participant.id)}
                className="px-2 py-1 text-xs font-semibold bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                title="Remove participant"
              >
                ×
              </button>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default ParticipantList;
