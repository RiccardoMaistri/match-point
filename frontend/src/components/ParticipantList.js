import React from 'react';

function ParticipantList({ participants, tournamentId, onRemoveParticipant }) {
  if (!participants || participants.length === 0) {
    return <p className="text-sm text-gray-500 dark:text-gray-400 py-4 text-center">No participants have been added yet.</p>;
  }

  return (
    <div className="space-y-3 pt-4">
      <h4 className="text-md font-semibold text-gray-700 dark:text-gray-300">Registered Participants ({participants.length})</h4>
      <ul className="space-y-3">
        {participants.map((participant) => (
          <li 
            key={participant.id} 
            className="flex flex-col sm:flex-row justify-between sm:items-center bg-gray-50 dark:bg-gray-800/50 p-3 rounded-lg border border-gray-200 dark:border-gray-700 transition-shadow hover:shadow-md"
          >
            <div className="flex-grow mb-2 sm:mb-0">
              <span className="font-semibold text-gray-800 dark:text-gray-200">{participant.name}</span>
              <span className="text-sm text-gray-500 dark:text-gray-400 ml-2">({participant.email})</span>
              {participant.ranking !== null && participant.ranking !== undefined && (
                <span className="text-xs bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300 px-2 py-1 rounded-full ml-2 font-medium">
                  Rank: {participant.ranking}
                </span>
              )}
            </div>
            {onRemoveParticipant && (
              <button
                onClick={() => onRemoveParticipant(tournamentId, participant.id)}
                className="px-3 py-1 text-xs font-semibold bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300 rounded-md hover:bg-red-200 dark:hover:bg-red-800/60 transition-colors self-start sm:self-center"
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
