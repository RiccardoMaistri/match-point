import React from 'react';

const MatchList = ({ matches, participants, onRecordResult }) => {

  const getParticipantName = (participantId) => {
    const participant = participants.find(p => p.id === participantId);
    return participant ? participant.name : 'Unknown Player';
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 space-y-4 shadow-sm">
      {matches.map((match, index) => (
        <React.Fragment key={match.id}>
          <div className="flex items-center">
            <div className="flex-grow space-y-1">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-900 dark:text-white">{getParticipantName(match.player1_id)}</span>
                <span className="text-sm font-semibold text-gray-900 dark:text-white">{match.player1_score ?? '-'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500 dark:text-gray-400">{getParticipantName(match.player2_id)}</span>
                <span className="text-sm font-semibold text-gray-500 dark:text-gray-400">{match.player2_score ?? '-'}</span>
              </div>
            </div>
            <div className="ml-4 text-center w-20">
              {match.status === 'completed' ? (
                <span className="px-2 py-1 text-xs font-medium text-green-800 bg-green-100 rounded-full dark:bg-green-900 dark:text-green-300">Completed</span>
              ) : match.status === 'upcoming' ? (
                <span onClick={() => onRecordResult(match)} className="px-2 py-1 text-xs font-medium text-blue-800 bg-blue-100 rounded-full dark:bg-blue-900 dark:text-blue-300 cursor-pointer">Upcoming</span>
              ) : (
                <span className="px-2 py-1 text-xs font-medium text-gray-800 bg-gray-100 rounded-full dark:bg-gray-900 dark:text-gray-300">{match.status}</span>
              )}
            </div>
          </div>
          {index < matches.length - 1 && <div className="border-t border-gray-200 dark:border-gray-700"></div>}
        </React.Fragment>
      ))}
    </div>
  );
};

export default MatchList;

