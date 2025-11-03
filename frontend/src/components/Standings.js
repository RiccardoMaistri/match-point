import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import * as api from '../services/api';
import Leaderboard from './Leaderboard';

const Standings = ({ tournaments }) => {
  const { tournamentId } = useParams();
  const navigate = useNavigate();
  const [participants, setParticipants] = useState([]);
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);

  const currentTournament = tournaments?.find(t => t.id === tournamentId);

  useEffect(() => {
    if (!tournamentId && tournaments?.length > 0) {
      navigate(`/standings/${tournaments[0].id}`, { replace: true });
      return;
    }

    const fetchData = async () => {
      if (!tournamentId || !currentTournament) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const [participantsData, matchesData] = await Promise.all([
          api.getTournamentParticipants(tournamentId),
          api.getTournamentMatches(tournamentId)
        ]);
        setParticipants(participantsData);
        setMatches(matchesData);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [tournamentId, currentTournament, tournaments, navigate]);

  if (loading) {
    return <div className="p-4 text-center text-slate-500 dark:text-slate-400">Loading standings...</div>;
  }

  if (!currentTournament) {
    return <div className="p-4 text-center text-slate-500 dark:text-slate-400">Tournament not found.</div>;
  }

  return (
    <div className="fixed top-[44px] left-0 right-0 bottom-[72px] flex flex-col">
      <div className="px-4 pt-3 pb-3">
        <div className="px-2">
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-50">Standings</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">Group stage rankings</p>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto px-4">
        <div className="pb-6">
          <Leaderboard 
            participants={participants} 
            matches={matches} 
            tournament={currentTournament}
            playoffParticipants={currentTournament.playoff_participants || 4}
          />
        </div>
      </div>
    </div>
  );
};

export default Standings;
