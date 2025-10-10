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
    return <div className="p-6 text-center text-gray-500">Loading standings...</div>;
  }

  if (!currentTournament) {
    return <div className="p-6 text-center text-gray-500">Tournament not found.</div>;
  }

  if (currentTournament.format !== 'round_robin') {
    return <div className="p-6 text-center text-gray-500">Standings only available for round robin tournaments.</div>;
  }

  return (
    <div className="p-3 pb-16">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {standings.length > 0 ? (
          <div className="divide-y divide-gray-200">
            {standings.map((standing, index) => {
              const isQualified = index < (currentTournament?.playoff_participants || 0);
              const diff = (standing.score_for || 0) - (standing.score_against || 0);
              return (
                <div key={standing.participant.id} className={`p-3 ${isQualified ? 'bg-blue-50 border-l-4 border-blue-500' : ''}`}>
                  <div className="flex items-center gap-2">
                    <span className={`text-lg font-bold w-6 flex-shrink-0 ${isQualified ? 'text-blue-700' : 'text-gray-900'}`}>{index + 1}</span>
                    <span className="text-sm font-semibold text-gray-900 truncate flex-1 min-w-0">{standing.participant.name}</span>
                  </div>
                  <div className="flex items-center justify-end gap-1.5 text-[11px] mt-2">
                    <div className="flex flex-col items-center w-7">
                      <span className="text-gray-400 uppercase text-[9px] leading-none mb-1">P</span>
                      <span className="font-semibold text-gray-900">{standing.played}</span>
                    </div>
                    <div className="flex flex-col items-center w-7">
                      <span className="text-gray-400 uppercase text-[9px] leading-none mb-1">W</span>
                      <span className="font-semibold text-blue-600">{standing.wins}</span>
                    </div>
                    <div className="flex flex-col items-center w-7">
                      <span className="text-gray-400 uppercase text-[9px] leading-none mb-1">L</span>
                      <span className="font-semibold text-red-600">{standing.losses}</span>
                    </div>
                    <div className="flex flex-col items-center w-7">
                      <span className="text-gray-400 uppercase text-[9px] leading-none mb-1">GF</span>
                      <span className="font-semibold text-gray-900">{standing.score_for || 0}</span>
                    </div>
                    <div className="flex flex-col items-center w-7">
                      <span className="text-gray-400 uppercase text-[9px] leading-none mb-1">GA</span>
                      <span className="font-semibold text-gray-900">{standing.score_against || 0}</span>
                    </div>
                    <div className="flex flex-col items-center w-8">
                      <span className="text-gray-400 uppercase text-[9px] leading-none mb-1">Diff</span>
                      <span className={`font-bold ${diff > 0 ? 'text-blue-600' : diff < 0 ? 'text-red-600' : 'text-gray-600'}`}>
                        {diff > 0 ? '+' : ''}{diff}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-6 text-center text-gray-500 text-sm">
            No matches completed yet
          </div>
        )}
      </div>
    </div>
  );
};

export default Standings;
