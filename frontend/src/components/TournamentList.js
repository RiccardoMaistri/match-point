import React from 'react';

function TournamentList({ tournaments, onEdit, onDelete, onView }) { // Rimossi DUMMY_TOURNAMENTS
  if (!tournaments || tournaments.length === 0) {
    // Questo messaggio ora è gestito in App.js, ma teniamo un fallback
    return <p className="text-gray-600 py-4 text-center">No tournaments found.</p>;
  }

  return (
    <div className="space-y-4 md:space-y-5">
      <h3 className="text-2xl font-semibold mb-4 text-gray-700">Available Tournaments</h3>
      {tournaments.map((tournament) => (
        <div
          key={tournament.id}
          className="bg-white p-4 sm:p-5 rounded-lg shadow-md hover:shadow-xl transition-shadow duration-200 ease-in-out border border-gray-200"
        >
          <div className="flex flex-col sm:flex-row justify-between items-start">
            <div className="mb-3 sm:mb-0">
              <h4
                className="text-xl sm:text-2xl font-bold text-blue-700 hover:text-blue-800 cursor-pointer"
                onClick={() => onView && onView(tournament.id)} // Rende il titolo cliccabile per vedere i dettagli
              >
                {tournament.name}
              </h4>
              <p className="text-xs sm:text-sm text-gray-500 mt-1">
                Type: <span className="font-semibold text-gray-700 capitalize">{tournament.tournament_type}</span> |
                Format: <span className="font-semibold text-gray-700 capitalize">{tournament.format.replace('_', ' ')}</span>
              </p>
              {tournament.start_date && (
                <p className="text-xs sm:text-sm text-gray-500">
                  Date: <span className="font-semibold text-gray-700">{new Date(tournament.start_date).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                </p>
              )}
               <p className="text-xs text-gray-500 mt-1">
                Participants: <span className="font-semibold text-gray-700">{tournament.participants?.length || 0}</span>
              </p>
            </div>
            <div className="flex space-x-2 mt-2 sm:mt-0 self-start sm:self-center">
              <button
                onClick={() => onView && onView(tournament.id)}
                className="px-3 py-1.5 text-xs sm:text-sm bg-indigo-500 text-white rounded-md hover:bg-indigo-600 transition-colors"
                title="View Details"
              >
                View
              </button>
              <button
                onClick={() => onEdit && onEdit(tournament.id)}
                className="px-3 py-1.5 text-xs sm:text-sm bg-yellow-500 text-white rounded-md hover:bg-yellow-600 transition-colors"
                title="Edit Tournament"
              >
                Edit
              </button>
              <button
                onClick={() => onDelete && onDelete(tournament.id)}
                className="px-3 py-1.5 text-xs sm:text-sm bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
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
