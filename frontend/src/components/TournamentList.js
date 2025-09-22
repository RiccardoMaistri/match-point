import React from 'react';

function TournamentList({ tournaments, onView }) {
  if (!tournaments || tournaments.length === 0) {
    return <p className="text-gray-600 dark:text-gray-400 py-4 text-center">No tournaments found.</p>;
  }

  const getStatusClass = (status) => {
    switch (status) {
      case 'completed': return 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300';
      case 'in_progress': return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-300';
      default: return 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300';
    }
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {tournaments.map((tournament) => (
        <div
          key={tournament.id}
          className="flex flex-col rounded-xl bg-white dark:bg-gray-800 shadow-md overflow-hidden cursor-pointer hover:shadow-lg transition-shadow border border-gray-200 dark:border-gray-700"
          onClick={() => onView && onView(tournament.id)}
        >
          <div className="p-3">
             <h4 className="text-lg font-bold text-gray-800 dark:text-white truncate mb-2">{tournament.name}</h4>
             <span className={`inline-block px-2 py-0.5 text-xs rounded-full font-semibold ${getStatusClass(tournament.status)}`}>
                {tournament.status.replace('_', ' ')}
             </span>
          </div>

          <div className="p-3 flex-grow border-t border-gray-100 dark:border-gray-700">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Format: <span className="font-semibold text-gray-800 dark:text-gray-200 capitalize">{tournament.format.replace('_', ' ')}</span>
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Participants: <span className="font-semibold text-gray-800 dark:text-gray-200">{tournament.participants?.length || 0}</span>
            </p>
          </div>

          <div className="p-2 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-200 dark:border-gray-700/50">
             <button
                className="w-full rounded-md h-9 px-3 text-sm font-medium bg-indigo-600 text-white hover:bg-indigo-700 transition-colors"
              >
                View
              </button>
          </div>
        </div>
      ))}
    </div>
  );
}

export default TournamentList;
