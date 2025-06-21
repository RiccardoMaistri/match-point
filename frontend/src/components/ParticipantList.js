import React from 'react';

function ParticipantList({ participants, tournamentId, onRemoveParticipant }) {
  if (!participants || participants.length === 0) {
    return <p className="text-sm text-gray-500">No participants added yet.</p>;
  }

  return (
    <div>
      <h4 className="text-md font-semibold mb-2">Registered Participants ({participants.length})</h4>
      <ul className="space-y-2">
        {participants.map((participant) => (
          <li key={participant.id} className="flex justify-between items-center bg-white p-2.5 rounded shadow-sm border border-gray-200">
            <div>
              <span className="font-medium text-gray-800">{participant.name}</span>
              <span className="text-xs text-gray-500 ml-2">({participant.email})</span>
              {participant.ranking !== null && participant.ranking !== undefined && (
                <span className="text-xs bg-gray-200 text-gray-700 px-1.5 py-0.5 rounded-full ml-2">
                  Rank: {participant.ranking}
                </span>
              )}
            </div>
            <button
              onClick={() => onRemoveParticipant(tournamentId, participant.id)}
              className="px-2 py-1 text-xs text-red-600 hover:text-red-800 border border-red-300 rounded hover:bg-red-50"
              title="Remove participant"
            >
              Remove
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default ParticipantList;
