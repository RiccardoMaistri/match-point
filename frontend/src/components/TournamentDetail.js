import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import * as api from '../services/api';
import ParticipantList from './ParticipantList';
import ParticipantForm from './ParticipantForm';
import MatchList from './MatchList';
import RecordResultModal from './RecordResultModal';
import Leaderboard from './Leaderboard';

function TournamentDetail({ currentUser }) {
  const { tournamentId } = useParams();
  const [tournament, setTournament] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [matches, setMatches] = useState([]);
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showParticipantForm, setShowParticipantForm] = useState(false);
  const [isResultModalOpen, setIsResultModalOpen] = useState(false);
  const [currentMatchForResult, setCurrentMatchForResult] = useState(null);

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

  const handleAddParticipant = async (tournamentId, participantData) => {
    try {
      await api.addParticipantToTournament(tournamentId, participantData);
      await fetchTournamentData();
      setShowParticipantForm(false);
    } catch (err) {
      setError(err.message || 'Failed to add participant');
    }
  };

  const handleRemoveParticipant = async (tournamentId, participantId) => {
    if (!window.confirm('Are you sure you want to remove this participant?')) return;
    try {
      await api.removeParticipantFromTournament(tournamentId, participantId);
      await fetchTournamentData();
    } catch (err) {
      setError(err.message || 'Failed to remove participant');
    }
  };

  const handleGenerateMatches = async () => {
    if (!tournament?.id || !window.confirm('Are you sure you want to generate/regenerate matches? This might overwrite existing matches.')) return;
    try {
      const result = await api.generateMatches(tournament.id);
      alert(result.message || "Matches generated successfully!");
      await fetchTournamentData();
    } catch (err) {
      setError(err.message || 'Failed to generate matches');
    }
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
      alert('Match result recorded successfully!');
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
  const canManageParticipants = tournament.registration_open;
  const canGenerateMatches = participants.length >= 2;

  const Section = ({ title, children }) => (
    <div className="bg-card-background p-4 sm:p-6 rounded-xl shadow-md mb-8">
      <h3 className="text-xl font-bold text-primary-text mb-4">{title}</h3>
      {children}
    </div>
  );

  return (
    <div className="p-4">
      <h2 className="text-3xl font-bold text-primary-text mb-2">{tournament.name}</h2>
      <p className="text-sm text-secondary-text mb-6">Owned by {isOwner ? 'you' : 'another user'}</p>

      <Section title="Details">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div><strong className="text-primary-text">Type:</strong> <span className="text-secondary-text capitalize">{tournament.tournament_type}</span></div>
          <div><strong className="text-primary-text">Format:</strong> <span className="text-secondary-text capitalize">{tournament.format.replace('_', ' ')}</span></div>
          <div><strong className="text-primary-text">Status:</strong> <span className="text-secondary-text capitalize">{tournament.status.replace('_', ' ')}</span></div>
          {tournament.start_date && <div><strong className="text-primary-text">Start Date:</strong> <span className="text-secondary-text">{new Date(tournament.start_date).toLocaleDateString()}</span></div>}
        </div>
      </Section>

      <Section title="Participants">
        {isOwner && canManageParticipants && (
          <div className="mb-4">
            <button onClick={() => setShowParticipantForm(!showParticipantForm)} className="w-full bg-primary text-white py-2 px-4 rounded-lg hover:bg-primary-hover transition-colors">
              {showParticipantForm ? 'Cancel' : 'Add Participant'}
            </button>
            {showParticipantForm && <ParticipantForm tournamentId={tournament.id} onSubmit={handleAddParticipant} onCancel={() => setShowParticipantForm(false)} existingParticipants={participants} />}
          </div>
        )}
        <ParticipantList participants={participants} tournamentId={tournament.id} onRemoveParticipant={isOwner ? handleRemoveParticipant : null} />
      </Section>

      {tournament.format === 'round_robin' && tournament.status !== 'open' && (
        <Section title="Leaderboard">
          <Leaderboard participants={participants} matches={matches} />
        </Section>
      )}

      <Section title="Matches">
        {isOwner && (
          <div className="mb-4">
            {canGenerateMatches ? (
              <button onClick={handleGenerateMatches} className="w-full bg-primary text-white py-2 px-4 rounded-lg hover:bg-primary-hover transition-colors">
                {matches.length > 0 ? 'Regenerate Matches' : 'Generate Matches'}
              </button>
            ) : (
              <p className="text-sm text-secondary-text italic">
                At least 2 participants are needed to generate matches.
              </p>
            )}
          </div>
        )}
        <MatchList matches={matches} participants={participants} onRecordResult={(tId, mId) => openRecordResultModal(mId)} tournamentId={tournament.id} tournamentFormat={tournament.format} currentUser={currentUser} />
      </Section>

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
    </div>
  );
}

export default TournamentDetail;
