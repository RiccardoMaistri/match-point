import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/ui/Layout';
import * as api from '../services/api';

const HomePage = ({ currentUser }) => {
  const [userTournaments, setUserTournaments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserTournaments = async () => {
      if (!currentUser) return;
      
      setIsLoading(true);
      setError(null);
      try {
        const tournaments = await api.getTournaments();
        // Filtra i tornei dell'utente corrente
        const userTourns = tournaments.filter(t => t.user_id === currentUser.id);
        setUserTournaments(userTourns);
      } catch (err) {
        setError(err.message || 'Failed to fetch tournaments');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserTournaments();
  }, [currentUser]);

  const handleCreateTournament = () => {
    navigate('/tournaments', { state: { showCreateForm: true } });
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
      title="Match Point" 
      actionIcon={addIcon}
      onActionClick={handleCreateTournament}
    >
      <h2 className="text-white text-[22px] font-bold leading-tight tracking-[-0.015em] px-4 pb-3 pt-5">
        Quick Access
      </h2>
      
      {isLoading ? (
        <div className="flex justify-center py-8">
          <p className="text-gray-400">Loading...</p>
        </div>
      ) : error ? (
        <div className="flex justify-center py-8">
          <p className="text-red-500">{error}</p>
        </div>
      ) : userTournaments.length === 0 ? (
        <div className="flex flex-col items-center py-8 px-4">
          <p className="text-gray-400 text-center mb-4">You don't have any tournaments yet.</p>
          <button
            onClick={handleCreateTournament}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Create Your First Tournament
          </button>
        </div>
      ) : (
        <>
          <div className="flex items-center gap-4 bg-gray-900 px-4 min-h-14 cursor-pointer"
               onClick={() => navigate('/tournaments')}>
            <div className="text-white flex items-center justify-center rounded-lg bg-gray-700 shrink-0 size-10">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 256 256">
                <path d="M232,64H208V56a16,16,0,0,0-16-16H64A16,16,0,0,0,48,56v8H24A16,16,0,0,0,8,80V96a40,40,0,0,0,40,40h3.65A80.13,80.13,0,0,0,120,191.61V216H96a8,8,0,0,0,0,16h64a8,8,0,0,0,0-16H136V191.58c31.94-3.23,58.44-25.64,68.08-55.58H208a40,40,0,0,0,40-40V80A16,16,0,0,0,232,64ZM48,120A24,24,0,0,1,24,96V80H48v32q0,4,.39,8Zm144-8.9c0,35.52-28.49,64.64-63.51,64.9H128a64,64,0,0,1-64-64V56H192ZM232,96a24,24,0,0,1-24,24h-.5a81.81,81.81,0,0,0,.5-8.9V80h24Z"></path>
              </svg>
            </div>
            <p className="text-white text-base font-normal leading-normal flex-1 truncate">My Tournaments</p>
          </div>
          
          <div className="flex items-center gap-4 bg-gray-900 px-4 min-h-14 cursor-pointer"
               onClick={() => navigate('/profile')}>
            <div className="text-white flex items-center justify-center rounded-lg bg-gray-700 shrink-0 size-10">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 256 256">
                <path d="M230.92,212c-15.23-26.33-38.7-45.21-66.09-54.16a72,72,0,1,0-73.66,0C63.78,166.78,40.31,185.66,25.08,212a8,8,0,1,0,13.85,8c18.84-32.56,52.14-52,89.07-52s70.23,19.44,89.07,52a8,8,0,1,0,13.85-8ZM72,96a56,56,0,1,1,56,56A56.06,56.06,0,0,1,72,96Z"></path>
              </svg>
            </div>
            <p className="text-white text-base font-normal leading-normal flex-1 truncate">My Profile</p>
          </div>
        </>
      )}
    </Layout>
  );
};

export default HomePage;