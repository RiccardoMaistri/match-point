import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Layout from '../components/ui/Layout';
import TournamentCard from '../components/ui/TournamentCard';
import * as api from '../services/api';

const TournamentsPage = ({ currentUser }) => {
  const [tournaments, setTournaments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const location = useLocation();
  const navigate = useNavigate();
  
  // Controlla se dobbiamo mostrare il form di creazione torneo
  const showCreateForm = location.state?.showCreateForm || false;

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
    // Qui puoi implementare la logica per mostrare il form di creazione torneo
    // o navigare a una pagina dedicata
    navigate('/tournaments/create');
  };

  // Icona per il pulsante di azione nell'header
  const addIcon = (
    <div className="text-white">
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 256 256">
        <path d="M224,128a8,8,0,0,1-8,8H136v80a8,8,0,0,1-16,0V136H40a8,8,0,0,1,0-16h80V40a8,8,0,0,1,16,0v80h80A8,8,0,0,1,224,128Z"></path>
      </svg>
    </div>
  );

  return (
    <Layout 
      title="Tournaments" 
      actionIcon={addIcon}
      onActionClick={handleCreateTournament}
    >
      {isLoading ? (
        <div className="flex justify-center py-8">
          <p className="text-gray-400">Loading tournaments...</p>
        </div>
      ) : error ? (
        <div className="flex justify-center py-8">
          <p className="text-red-500">{error}</p>
        </div>
      ) : tournaments.length === 0 ? (
        <div className="flex flex-col items-center py-8 px-4">
          <p className="text-gray-400 text-center mb-4">No tournaments available.</p>
          {currentUser && (
            <button
              onClick={handleCreateTournament}
              className="px-4 py-2 bg-indigo-600 text-white rounded-2xl hover:bg-indigo-700 transition-colors"
            >
              Create New Tournament
            </button>
          )}
        </div>
      ) : (
        <div>
          {tournaments.map(tournament => (
            <TournamentCard key={tournament.id} tournament={tournament} />
          ))}
        </div>
      )}
    </Layout>
  );
};

export default TournamentsPage;