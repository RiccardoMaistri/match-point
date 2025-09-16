import React from 'react';

function TournamentList({ tournaments, onEdit, onDelete, onView }) {
  if (!tournaments || tournaments.length === 0) {
    return <p className="text-gray-600 dark:text-gray-400 py-4 text-center">No tournaments found.</p>;
  }

  return (
    <div className="space-y-6">
      {tournaments.map((tournament) => (
        <div
          key={tournament.id}
          className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-xl shadow-md hover:shadow-lg transition-all duration-300 border border-transparent dark:border-gray-700"
        >
          <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
            {/* Tournament Info */}
            <div className="flex-grow">
              <h4
                className="text-xl sm:text-2xl font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                onClick={() => onView && onView(tournament.id)}
              >
                {tournament.name}
              </h4>
              <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-600 dark:text-gray-400">
                <p>Type: <span className="font-semibold text-gray-800 dark:text-gray-200 capitalize">{tournament.tournament_type}</span></p>
                <p>Format: <span className="font-semibold text-gray-800 dark:text-gray-200 capitalize">{tournament.format.replace('_', ' ')}</span></p>
                <p>Participants: <span className="font-semibold text-gray-800 dark:text-gray-200">{tournament.participants?.length || 0}</span></p>
              </div>
              {tournament.start_date && (
                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                  Starts: <span className="font-medium text-gray-700 dark:text-gray-300">{new Date(tournament.start_date).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                </p>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex-shrink-0 flex flex-row sm:flex-col md:flex-row gap-2 mt-4 sm:mt-0">
              <button
                onClick={() => onView && onView(tournament.id)}
                className="w-full md:w-auto px-4 py-2 text-sm font-semibold bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors shadow-sm"
                title="View Details"
              >
                View
              </button>
              <button
                onClick={() => onEdit && onEdit(tournament.id)}
                className="w-full md:w-auto px-4 py-2 text-sm font-semibold bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                title="Edit Tournament"
              >
                Edit
              </button>
              <button
                onClick={() => onDelete && onDelete(tournament.id)}
                className="w-full md:w-auto px-4 py-2 text-sm font-semibold bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors shadow-sm"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default TournamentList;
