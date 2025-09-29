import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import * as api from '../services/api';
import MatchList from './MatchList';
import RecordResultModal from './RecordResultModal';
import Leaderboard from './Leaderboard';
import Bracket from './Bracket';
import ConfirmModal from './ConfirmModal';

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
  const [copyMessage, setCopyMessage] = useState('');
  const [showParticipants, setShowParticipants] = useState(true);

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

  const handleInvite = () => {
    const tournamentLink = window.location.href;
    if (navigator.share) {
      navigator.share({
        title: `Join my tournament: ${tournament.name}`,
        text: `Join my tournament '${tournament.name}' on Match Point!`,
        url: tournamentLink,
      })
        .then(() => console.log('Successful share'))
        .catch((error) => console.log('Error sharing', error));
    } else if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(tournamentLink)
        .then(() => {
          setCopyMessage('Link copied to clipboard!');
          setTimeout(() => setCopyMessage(''), 3000);
        })
        .catch(err => {
          console.error('Failed to copy: ', err);
        });
    } else {
      const textArea = document.createElement('textarea');
      textArea.value = tournamentLink;
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand('copy');
        setCopyMessage('Link copied to clipboard!');
        setTimeout(() => setCopyMessage(''), 3000);
      } catch (err) {
        console.error('Fallback copy failed: ', err);
      }
      document.body.removeChild(textArea);
    }
  };

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
  const canManageParticipants = tournament.registration_open;
  const canGenerateMatches = participants.length >= 2;



  const Section = ({ title, children }) => (
    <div className="bg-card-background p-3 rounded-lg shadow-md mb-4">
      <h3 className="text-lg font-bold text-primary-text mb-2">{title}</h3>
      {children}
    </div>
  );

  return (
    <div className="p-3">
      <div className="bg-card-background p-3 rounded-lg shadow-md mb-4">
        <h2 className="text-2xl font-bold text-primary-text mb-1">{tournament.name}</h2>
        <p className="text-xs text-secondary-text mb-2">Owned by {isOwner ? 'you' : 'another user'}</p>
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs">
          <div><strong>Type:</strong> <span className="text-secondary-text capitalize">{tournament.tournament_type}</span></div>
          <div><strong>Format:</strong> <span className="text-secondary-text capitalize">{tournament.format.replace('_', ' ')}</span></div>
          {tournament.start_date && <div><strong>Date:</strong> <span className="text-secondary-text">{new Date(tournament.start_date).toLocaleDateString()}</span></div>}
        </div>
      </div>

      <Section title={`Participants (${participants.length})`}>
        <div className="flex justify-between items-center mb-2">
          <button
            onClick={() => setShowParticipants(!showParticipants)}
            className="text-sm text-primary hover:text-primary-hover flex items-center gap-1"
          >
            <svg className={`w-4 h-4 transition-transform ${showParticipants ? 'rotate-90' : ''}`} fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
            </svg>
            {showParticipants ? 'Hide' : 'Show'}
          </button>
          {isOwner && canManageParticipants && (
            <button onClick={handleInvite} className="bg-primary text-white py-2 px-4 rounded hover:bg-primary-hover transition-colors">
              Invite
            </button>
          )}
        </div>
        {copyMessage && <p className="text-xs text-green-600 mb-2 text-center">{copyMessage}</p>}
        {showParticipants && (
          <div className="space-y-1">
            {participants.length === 0 ? (
              <p className="text-xs text-secondary-text py-2 text-center">No participants yet.</p>
            ) : (
              participants.map((participant) => (
                <div key={participant.id} className="flex justify-between items-center bg-white p-2 rounded border border-accent">
                  <div className="flex-grow">
                    <span className="font-medium text-primary-text text-sm">{participant.name}</span>
                    <span className="text-xs text-secondary-text ml-1">({participant.email})</span>
                    {participant.ranking !== null && participant.ranking !== undefined && (
                      <span className="text-xs bg-primary text-white px-1 py-0.5 rounded ml-1 font-medium">
                        #{participant.ranking}
                      </span>
                    )}
                  </div>
                  {isOwner && (
                    <button
                      onClick={() => handleRemoveParticipant(tournament.id, participant.id)}
                      className="px-2 py-1 text-xs font-semibold bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                      title="Remove participant"
                    >
                      ×
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </Section>

      {tournament.format === 'round_robin' && tournament.status !== 'open' && (
        <Section title="Leaderboard">
          <Leaderboard participants={participants} matches={matches} />
        </Section>
      )}

      <Section title={tournament.format === 'elimination' ? 'Bracket' : 'Matches'}>
        {isOwner && (
          <div className="mb-4">
            {canGenerateMatches ? (
              <button onClick={handleGenerateMatches} className="w-full bg-primary text-white py-1 px-3 rounded text-sm hover:bg-primary-hover transition-colors">
                {matches.length > 0 ? 'Regenerate Matches' : 'Generate Matches'}
              </button>
            ) : (
              <p className="text-sm text-secondary-text italic">
                At least 2 participants are needed to generate matches.
              </p>
            )}
          </div>
        )}
        {tournament.format === 'elimination' ? (
          <>
            <Bracket matches={matches} participants={participants} />
            <div className="mt-8">
              <h4 className="text-lg font-semibold text-primary-text mb-4">Matches</h4>
              <MatchList 
                matches={matches} 
                participants={participants} 
                onRecordResult={(tId, mId) => openRecordResultModal(mId)} 
                tournamentId={tournament.id} 
                tournamentFormat={tournament.format} 
                currentUser={currentUser} 
              />
            </div>
          </>
        ) : (
          <MatchList 
            matches={matches} 
            participants={participants} 
            onRecordResult={(tId, mId) => openRecordResultModal(mId)} 
            tournamentId={tournament.id} 
            tournamentFormat={tournament.format} 
            currentUser={currentUser} 
          />
        )}
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
