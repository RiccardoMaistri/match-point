import React, { useState, useEffect, useCallback } from 'react';
import * as api from '../services/api';
import ParticipantList from './ParticipantList';
import ParticipantForm from './ParticipantForm';
import MatchList from './MatchList';
import RecordResultModal from './RecordResultModal';
import Leaderboard from './Leaderboard';

function TournamentDetail({ tournament, refetchTournament, onBackToList, globalIsLoading, globalSetIsLoading, globalSetError, currentUser }) {
  const [participants, setParticipants] = useState([]);
  const [matches, setMatches] = useState([]);
  const [shareFeedback, setShareFeedback] = useState('');
  const [showParticipantForm, setShowParticipantForm] = useState(false);
  const [results, setResults] = useState([]);
  const [isDetailsLoading, setIsDetailsLoading] = useState(true);

  const [isResultModalOpen, setIsResultModalOpen] = useState(false);
  const [currentMatchForResult, setCurrentMatchForResult] = useState(null);

  const fetchParticipantsAndMatches = useCallback(async () => {
    if (!tournament?.id) return;
    setIsDetailsLoading(true);
    try {
      const [participantsData, matchesData] = await Promise.all([
        api.getTournamentParticipants(tournament.id),
        api.getTournamentMatches(tournament.id)
      ]);
      setParticipants(participantsData);
      setMatches(matchesData || []);
    } catch (err) {
      globalSetError(err.message || `Failed to fetch tournament details`);
    } finally {
      setIsDetailsLoading(false);
    }
  }, [tournament?.id, globalSetError]);

  const fetchResults = useCallback(async () => {
    if (!tournament?.id) return;
    setIsDetailsLoading(true);
    try {
      const resultsData = await api.getTournamentResults(tournament.id);
      setResults(resultsData);
    } catch (err) {
      globalSetError(err.message || `Failed to fetch tournament results`);
    } finally {
      setIsDetailsLoading(false);
    }
  }, [tournament?.id, globalSetError]);

  useEffect(() => {
    fetchParticipantsAndMatches();
  }, [fetchParticipantsAndMatches]);

  useEffect(() => {
    if (tournament?.status === 'completed') {
      fetchResults();
    }
  }, [tournament?.status, fetchResults]);

  const handleAddParticipant = async (tournamentId, participantData) => {
    globalSetIsLoading(true);
    try {
      await api.addParticipantToTournament(tournamentId, participantData);
      await fetchParticipantsAndMatches();
      setShowParticipantForm(false);
    } catch (err) {
      globalSetError(err.message || 'Failed to add participant');
    } finally {
      globalSetIsLoading(false);
    }
  };

  const handleShareInviteLink = async () => {
    setShareFeedback('');
    if (tournament?.invitation_link) {
      if (navigator.share) {
        try {
          await navigator.share({
            title: `Join Tournament: ${tournament.name}`,
            text: `You're invited to join the tournament "${tournament.name}". Click the link to register:`,
            url: tournament.invitation_link,
          });
          setShareFeedback('Invitation link shared successfully!');
        } catch (error) {
          if (error.name !== 'AbortError') copyToClipboard();
          else setShareFeedback('Sharing cancelled.');
        }
      } else {
        copyToClipboard();
      }
    } else {
      setShareFeedback('No invitation link available for this tournament.');
    }
    setTimeout(() => setShareFeedback(''), 3000);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(tournament.invitation_link).then(() => {
      setShareFeedback('Invitation link copied to clipboard!');
    }).catch(() => {
      setShareFeedback('Failed to copy link. Please copy it manually.');
    });
  };

  const handleRemoveParticipant = async (tournamentId, participantId) => {
    if (!window.confirm('Are you sure you want to remove this participant?')) return;
    globalSetIsLoading(true);
    try {
      await api.removeParticipantFromTournament(tournamentId, participantId);
      await fetchParticipantsAndMatches();
    } catch (err) {
      globalSetError(err.message || 'Failed to remove participant');
    } finally {
      globalSetIsLoading(false);
    }
  };

  const handleGenerateMatches = async () => {
    if (!tournament?.id || !window.confirm('Are you sure you want to generate/regenerate matches? This might overwrite existing matches.')) return;
    globalSetIsLoading(true);
    try {
      const result = await api.generateMatches(tournament.id);
      alert(result.message || "Matches generated successfully!");
      await fetchParticipantsAndMatches();
      await refetchTournament(); // Refetch tournament to get the new status
    } catch (err) {
      globalSetError(err.message || 'Failed to generate matches');
    } finally {
      globalSetIsLoading(false);
    }
  };

  const openRecordResultModal = (matchId) => {
    const matchToRecord = matches.find(m => m.id === matchId);
    if (matchToRecord) {
      setCurrentMatchForResult(matchToRecord);
      setIsResultModalOpen(true);
      globalSetError(null);
    }
  };

  const handleSubmitMatchResult = async (tournamentId, matchId, resultData) => {
    globalSetIsLoading(true);
    try {
      await api.recordMatchResult(tournamentId, matchId, resultData);
      await fetchParticipantsAndMatches();
      setIsResultModalOpen(false);
      setCurrentMatchForResult(null);
      alert('Match result recorded successfully!');
    } catch (err) {
      globalSetError(err.message || 'Failed to record match result.');
    } finally {
      globalSetIsLoading(false);
    }
  };

  if (!tournament) {
    return (
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl text-center">
        <p className="text-lg text-gray-700 dark:text-gray-300">Tournament data is not available.</p>
        <button onClick={onBackToList} className="mt-4 px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 transition-colors">
          &larr; Back to Tournaments List
        </button>
      </div>
    );
  }

  const canManageParticipants = tournament.registration_open;
  const canGenerateMatches = participants.length >= 2;
  const isOwner = currentUser && tournament && tournament.user_id === currentUser.id;

  const statusColors = {
    open: 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300',
    in_progress: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-300',
    completed: 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300',
  };

  const Section = ({ title, children, isLoading }) => (
    <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 space-y-4">
      <h3 className="text-xl font-bold text-gray-900 dark:text-white">{title}</h3>
      {isLoading ? <p className="text-gray-500 dark:text-gray-400">Loading details...</p> : children}
    </div>
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white leading-tight">{tournament.name}</h2>
          {isOwner && <p className="text-sm text-gray-500 dark:text-gray-400">(Owned by you)</p>}
        </div>
        <button onClick={onBackToList} className="self-start sm:self-center px-4 py-2 text-sm font-semibold text-gray-800 dark:text-gray-200 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors">
          &larr; Back to List
        </button>
      </div>

      {/* Details Card */}
      <Section title="Details">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-4 text-sm">
          <div className="flex flex-col"><strong className="text-gray-600 dark:text-gray-400">Type:</strong> <span className="text-gray-800 dark:text-gray-200 capitalize">{tournament.tournament_type}</span></div>
          <div className="flex flex-col"><strong className="text-gray-600 dark:text-gray-400">Format:</strong> <span className="text-gray-800 dark:text-gray-200 capitalize">{tournament.format.replace('_', ' ')}</span></div>
          <div className="flex items-center gap-2"><strong className="text-gray-600 dark:text-gray-400">Status:</strong> <span className={`px-2 py-0.5 text-xs rounded-full font-semibold ${statusColors[tournament.status]}`}>{tournament.status.replace('_', ' ')}</span></div>
          {tournament.start_date && <div className="flex flex-col"><strong className="text-gray-600 dark:text-gray-400">Start Date:</strong> <span className="text-gray-800 dark:text-gray-200">{new Date(tournament.start_date).toLocaleDateString()}</span></div>}
          {tournament.end_date && <div className="flex flex-col"><strong className="text-gray-600 dark:text-gray-400">End Date:</strong> <span className="text-gray-800 dark:text-gray-200">{new Date(tournament.end_date).toLocaleDateString()}</span></div>}
          {tournament.invitation_link && (
            <div className="sm:col-span-2 md:col-span-3 flex flex-wrap items-center gap-x-4 gap-y-2">
              <strong className="text-gray-600 dark:text-gray-400">Invitation Link:</strong>
              <div className="flex items-center gap-2 p-2 bg-gray-100 dark:bg-gray-900 rounded-lg">
                <a href={tournament.invitation_link} target="_blank" rel="noopener noreferrer" className="text-indigo-600 dark:text-indigo-400 hover:underline break-all text-xs sm:text-sm">{tournament.invitation_link}</a>
                {isOwner && <button onClick={handleShareInviteLink} className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700">Share</button>}
              </div>
            </div>
          )}
        </div>
        {shareFeedback && <div className={`mt-4 p-2 text-sm rounded-md text-center ${shareFeedback.includes('copied') || shareFeedback.includes('shared') ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>{shareFeedback}</div>}
      </Section>

      <Section title="Participants" isLoading={isDetailsLoading}>
        {showParticipantForm && canManageParticipants && isOwner && <ParticipantForm tournamentId={tournament.id} onSubmit={handleAddParticipant} onCancel={() => { setShowParticipantForm(false); globalSetError(null);}} existingParticipants={participants} />}
        {!canManageParticipants && <p className="text-sm text-orange-600 bg-orange-100 dark:bg-orange-900/50 dark:text-orange-300 p-3 rounded-lg border border-orange-200 dark:border-orange-800">Registration for this tournament is closed.</p>}
        <ParticipantList participants={participants} tournamentId={tournament.id} onRemoveParticipant={canManageParticipants && isOwner ? handleRemoveParticipant : null} />
      </Section>

      {tournament.format === 'round_robin' && tournament.status !== 'open' && (
        <Section title="Leaderboard" isLoading={isDetailsLoading}>
          <Leaderboard participants={participants} matches={matches} />
        </Section>
      )}

      <Section title={`Matches / ${tournament.format === 'elimination' ? 'Bracket' : 'Schedule'}`} isLoading={isDetailsLoading}>
        {isOwner && (
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 mb-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">Generate and manage matches.</p>
            {canGenerateMatches ? (
              <button onClick={handleGenerateMatches} disabled={globalIsLoading} className="px-4 py-2 text-sm font-semibold text-white bg-cyan-600 rounded-lg hover:bg-cyan-700 disabled:bg-gray-400 transition-colors">
                {globalIsLoading ? 'Processing...' : (matches.length > 0 ? 'Regenerate Matches' : 'Generate Matches')}
              </button>
            ) : (
              <p className="text-sm text-gray-500 dark:text-gray-400 italic">
                At least 2 participants are needed to generate matches.
              </p>
            )}
          </div>
        )}
        <MatchList matches={matches} participants={participants} onRecordResult={(tId, mId) => openRecordResultModal(mId)} tournamentId={tournament.id} tournamentFormat={tournament.format} currentUser={currentUser} />
      </Section>

      {tournament.status === 'completed' && (
        <Section title="Final Results" isLoading={isDetailsLoading}>
          {tournament.format === 'round_robin' ? <Leaderboard participants={participants} matches={matches} /> : results.length > 0 ? (
            <ul className="list-disc pl-5 space-y-2 text-gray-800 dark:text-gray-200">
              {results.map((result, index) => <li key={index}><span className="font-bold">{result.rank}. {result.participant}</span>{result.wins !== undefined && ` (${result.wins} wins)`}</li>)}
            </ul>
          ) : <p className="text-gray-500 dark:text-gray-400">No results available.</p>}
        </Section>
      )}

      {isResultModalOpen && currentMatchForResult && <RecordResultModal isOpen={isResultModalOpen} onClose={() => setIsResultModalOpen(false)} match={currentMatchForResult} participants={participants} onSubmitResult={handleSubmitMatchResult} tournamentId={tournament.id} />}
    </div>
  );
}

export default TournamentDetail;
