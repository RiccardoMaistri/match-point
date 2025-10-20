import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import * as api from '../services/api';

const Standings = ({ tournaments }) => {
  const { tournamentId } = useParams();
  const navigate = useNavigate();
  const [standings, setStandings] = useState([]);
  const [loading, setLoading] = useState(true);

  const currentTournament = tournaments?.find(t => t.id === tournamentId);

  useEffect(() => {
    if (!tournamentId && tournaments?.length > 0) {
      navigate(`/standings/${tournaments[0].id}`, { replace: true });
      return;
    }

    const fetchStandings = async () => {
      if (!tournamentId || !currentTournament) {
        setLoading(false);
        return;
      }

      if (currentTournament.format !== 'round_robin') {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const response = await api.getTournamentStandings(tournamentId);
        setStandings(response.standings);
      } catch (error) {
        console.error('Error fetching standings:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStandings();
  }, [tournamentId, currentTournament, tournaments, navigate]);

  if (loading) {
    return <div className="p-4 text-center text-gray-500 dark:text-gray-400">Loading standings...</div>;
  }

  if (!currentTournament) {
    return <div className="p-4 text-center text-gray-500 dark:text-gray-400">Tournament not found.</div>;
  }

  if (currentTournament.format !== 'round_robin') {
    return <div className="p-4 text-center text-gray-500 dark:text-gray-400">Standings only available for round robin tournaments.</div>;
  }

  return (
    <div className="min-h-screen p-4">
      <div className="bg-card-light dark:bg-card-dark rounded-lg shadow-md p-4 max-w-md mx-auto">
        <ul className="space-y-4">
          {standings.map((standing, index) => {
            const scoreDiff = standing.score_for - standing.score_against;
            return (
              <li key={standing.participant.id} className="flex items-center space-x-4 pb-2 border-b border-gray-200 dark:border-gray-700 last:border-b-0">
                <div className={`flex-none w-8 text-center text-lg font-bold ${index < 4 ? 'text-primary' : 'text-gray-600 dark:text-gray-400'}`}>{index + 1}</div>
                <div className="flex-grow">
                  <p className="font-semibold text-gray-800 dark:text-white">{standing.participant.name}</p>
                  <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mt-1">
                    <span>P: {standing.played}</span>
                    <span>L: <span className="font-medium">{standing.losses}</span></span>
                    <span>Diff: <span className={`${scoreDiff >= 0 ? 'text-green-500' : 'text-red-500'} font-medium`}>{scoreDiff >= 0 ? `+${scoreDiff}` : scoreDiff}</span></span>
                  </div>
                </div>
                <div className="flex flex-col items-center">
                  <span className="font-bold text-2xl text-primary">{standing.wins}</span>
                  <span className="text-xs text-gray-600 dark:text-gray-400">WINS</span>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
};

export default Standings;
