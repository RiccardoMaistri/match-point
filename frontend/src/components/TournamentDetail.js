import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import * as api from '../services/api';
import RecordResultModal from './RecordResultModal';
import Bracket from './Bracket';
import ConfirmModal from './ConfirmModal';
import MatchdayView from './MatchdayView';

function TournamentDetail({ currentUser }) {
  const { tournamentId } = useParams();
  const [tournament, setTournament] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [matches, setMatches] = useState([]);
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isResultModalOpen, setIsResultModalOpen] = useState(false);
  const [currentMatchForResult, setCurrentMatchForResult] = useState(null);
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, title: '', message: '', onConfirm: null });


  const [selectedMatchday, setSelectedMatchday] = useState(1);

  const fetchTournamentData = useCallback(async () => {
    if (!tournamentId) return;
    setIsLoading(true);
    setError(null);
    try {
      const tournamentData = await api.getTournamentById(tournamentId);
      setTournament(tournamentData);
      const participantsData = await api.getTournamentParticipants(tournamentId);
      setParticipants(participantsData);
      const matchesData = await api.getTournamentMatches(tournamentId);
      setMatches(matchesData);
      if (tournamentData.status === 'completed') {
        const resultsData = await api.getTournamentResults(tournamentId);
        setResults(resultsData);
      }
    } catch (err) {
      setError(err.message || `Failed to fetch tournament details`);
    } finally {
      setIsLoading(false);
    }
  }, [tournamentId]);

  useEffect(() => {
    fetchTournamentData();
  }, [fetchTournamentData]);



  const handleRemoveParticipant = async (tournamentId, participantId) => {
    setConfirmModal({
      isOpen: true,
      title: 'Remove Participant',
      message: 'Are you sure you want to remove this participant?',
      onConfirm: async () => {
        try {
          await api.removeParticipantFromTournament(tournamentId, participantId);
          await fetchTournamentData();
        } catch (err) {
          setError(err.message || 'Failed to remove participant');
        }
        setConfirmModal({ isOpen: false });
      }
    });
  };

  const handleGenerateMatches = async () => {
    if (!tournament?.id) return;
    setConfirmModal({
      isOpen: true,
      title: 'Generate Matches',
      message: matches.length > 0 ? 'This will regenerate all matches. Continue?' : 'Generate matches for this tournament?',
      onConfirm: async () => {
        try {
          await api.generateMatches(tournament.id);
          await fetchTournamentData();
        } catch (err) {
          setError(err.message || 'Failed to generate matches');
        }
        setConfirmModal({ isOpen: false });
      }
    });
  };

  const openRecordResultModal = (matchId) => {
    const matchToRecord = matches.find(m => m.id === matchId);
    if (matchToRecord) {
      setCurrentMatchForResult(matchToRecord);
      setIsResultModalOpen(true);
      setError(null);
    }
  };

  const handleSubmitMatchResult = async (tournamentId, matchId, resultData) => {
    try {
      await api.recordMatchResult(tournamentId, matchId, resultData);
      await fetchTournamentData();
      setIsResultModalOpen(false);
      setCurrentMatchForResult(null);
    } catch (err) {
      setError(err.message || 'Failed to record match result.');
    }
  };

  if (isLoading) {
    return <p className="text-center py-10">Loading tournament...</p>;
  }

  if (error) {
    return <p className="text-center py-10 text-red-500">{error}</p>;
  }

  if (!tournament) {
    return <p className="text-center py-10">Tournament not found.</p>;
  }

  const isOwner = currentUser && tournament && tournament.user_id === currentUser.id;
  const canGenerateMatches = participants.length >= 2 && participants.length >= tournament.playoff_participants;



  const Section = ({ title, children }) => (
    <div className="bg-white p-3 rounded-lg shadow-sm border border-gray-200 mb-3">
      <h3 className="text-base font-bold text-primary-text mb-2">{title}</h3>
      {children}
    </div>
  );

  return (
    <div className="p-3 pb-16">

      {tournament.format === 'round_robin' && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-3">
          <div className="flex items-center justify-between p-3 border-b border-gray-100">
            <h3 className="text-base font-bold text-primary-text">Group Stage</h3>
            <div className="flex items-center gap-2">
              {tournament.status !== 'open' && (
                <>
                  <span className="text-[10px] text-secondary-text font-semibold">DAY</span>
                  <select
                    value={selectedMatchday}
                    onChange={(e) => setSelectedMatchday(parseInt(e.target.value))}
                    className="w-14 px-2 py-1 text-sm font-semibold border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-white"
                  >
                    {Array.from({ length: tournament.total_matchdays || 1 }, (_, i) => (
                      <option key={i + 1} value={i + 1}>
                        {i + 1}
                      </option>
                    ))}
                  </select>
                </>
              )}
              {isOwner && canGenerateMatches && (
                <button onClick={handleGenerateMatches} className="px-3 py-1.5 text-xs font-semibold text-primary border border-primary rounded-lg hover:bg-primary hover:text-white transition-colors">
                  {matches.length > 0 ? 'Regenerate' : 'Generate'}
                </button>
              )}
            </div>
          </div>
          {!canGenerateMatches && tournament.status === 'open' && isOwner && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 m-3">
              <p className="text-xs text-blue-800">
                ℹ️ Add at least 2 participants to generate matches.
              </p>
            </div>
          )}
          {tournament.status !== 'open' && (
            <div className="p-3">
              <MatchdayView 
                tournament={tournament} 
                onMatchUpdate={fetchTournamentData}
                matches={matches}
                participants={participants}
                currentUser={currentUser}
                onRecordResult={(tId, mId) => openRecordResultModal(mId)}
                selectedMatchday={selectedMatchday}
              />
            </div>
          )}
        </div>
      )}

      {tournament.status === 'playoffs' && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-3">
          <div className="p-3 border-b border-gray-100">
            <h3 className="text-base font-bold text-primary-text">Playoff Bracket</h3>
          </div>
          <div className="p-3">
            <Bracket matches={matches.filter(m => m.phase === 'playoff')} participants={participants} tournament={tournament} />
          </div>
        </div>
      )}



      {tournament.status === 'completed' && (
        <Section title="Final Results">
          {results.length > 0 ? (
            <ul className="list-disc pl-5 space-y-2 text-primary-text">
              {results.map((result, index) => <li key={index}><span className="font-bold">{result.rank}. {result.participant}</span>{result.wins !== undefined && ` (${result.wins} wins)`}</li>)}
            </ul>
          ) : <p className="text-secondary-text">No results available.</p>}
        </Section>
      )}

      {isResultModalOpen && currentMatchForResult && <RecordResultModal isOpen={isResultModalOpen} onClose={() => setIsResultModalOpen(false)} match={currentMatchForResult} participants={participants} onSubmitResult={handleSubmitMatchResult} tournamentId={tournament.id} />}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        onConfirm={confirmModal.onConfirm}
        onCancel={() => setConfirmModal({ isOpen: false })}
      />
    </div>
  );
}

export default TournamentDetail;
