import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import * as api from '../services/api';

const TournamentsPage = ({ currentUser, onCreateTournament }) => {
  const [tournaments, setTournaments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchTournaments = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await api.getTournaments();
        setTournaments(data);
      } catch (err) {
        setError(err.message || 'Failed to fetch tournaments');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTournaments();
  }, []);

  const handleCreateTournament = () => {
    onCreateTournament();
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <p className="text-gray-400">Loading tournaments...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center py-8">
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  if (tournaments.length === 0) {
    return (
      <div className="flex flex-col items-center py-12 px-6 text-center">
        <div className="mb-6">
          <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M7 3V1h10v2h5a1 1 0 011 1v4a4 4 0 01-4 4h-1.54A6.97 6.97 0 0112 18a6.97 6.97 0 01-5.46-6H5a4 4 0 01-4-4V4a1 1 0 011-1h5zm0 2H3v3a2 2 0 002 2h2V5zm10 0v5h2a2 2 0 002-2V5h-4zM9 5v8a4 4 0 008 0V5H9zm3 12a1 1 0 011 1v3h2v2H9v-2h2v-3a1 1 0 011-1z"/>
          </svg>
        </div>
        <h3 className="text-xl font-semibold text-gray-700 mb-2">No Tournaments Yet</h3>
        <p className="text-gray-500 mb-6 max-w-md">
          Get started by creating your first tournament. You can organize single or double matches with elimination or round-robin formats.
        </p>
        {currentUser ? (
          <button
            onClick={handleCreateTournament}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Create Your First Tournament
          </button>
        ) : (
          <p className="text-gray-400 text-sm">
            Please log in to create tournaments
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Tournaments</h1>
        {currentUser && (
          <button
            onClick={handleCreateTournament}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            + New Tournament
          </button>
        )}
      </div>
      <div className="space-y-4">
        {tournaments.map(tournament => (
          <div
            key={tournament.id}
            onClick={() => navigate(`/tournaments/${tournament.id}`)}
            className="bg-white p-4 rounded-lg shadow hover:shadow-md transition-shadow cursor-pointer border"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-2">{tournament.name}</h3>
            <div className="flex justify-between text-sm text-gray-600">
              <span>{tournament.tournament_type} • {tournament.format}</span>
              <span>{tournament.participants?.length || 0} participants</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TournamentsPage;