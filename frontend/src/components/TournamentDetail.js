import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import MatchList from './MatchList';
import RecordResultModal from './RecordResultModal';
import * as api from '../services/api';

const TournamentDetail = ({ currentUser }) => {
  const { tournamentId } = useParams();
  const navigate = useNavigate();
  const [tournament, setTournament] = useState(null);
  const [matches, setMatches] = useState([]);
  const [participants, setParticipants] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isRecordModalOpen, setRecordModalOpen] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState(null);

  const fetchTournamentDetails = useCallback(async () => {
    const id = tournamentId || (await api.getTournaments())[0]?.id;
    if (!id) {
      setIsLoading(false);
      setError('No tournaments found.');
      return;
    }

    if (!tournamentId) {
        navigate(`/tournaments/${id}`, { replace: true });
    }

    setIsLoading(true);
    try {
      const [tournamentData, matchesData, participantsData] = await Promise.all([
        api.getTournamentById(id),
        api.getTournamentMatches(id),
        api.getTournamentParticipants(id),
      ]);
      setTournament(tournamentData);
      setMatches(matchesData);
      setParticipants(participantsData);
    } catch (err) {
      setError(err.message || 'Failed to fetch tournament details');
    } finally {
      setIsLoading(false);
    }
  }, [tournamentId, navigate]);

  useEffect(() => {
    fetchTournamentDetails();
  }, [fetchTournamentDetails]);

  const handleOpenRecordModal = (match) => {
    setSelectedMatch(match);
    setRecordModalOpen(true);
  };

  const handleCloseRecordModal = () => {
    setRecordModalOpen(false);
    setSelectedMatch(null);
  };

  const handleSubmitResult = async (tId, matchId, resultData) => {
    try {
      await api.recordMatchResult(tId, matchId, resultData);
      fetchTournamentDetails();
    } catch (error) {
      setError(error.message || 'Failed to record result');
    } finally {
      handleCloseRecordModal();
    }
  };

  if (isLoading) return <div className="text-center p-4">Loading...</div>;
  if (error) return <div className="text-center p-4 text-red-500">Error: {error}</div>;
  if (!tournament) return <div className="text-center p-4">Tournament not found.</div>;

  const groupStageMatches = matches.filter(m => m.stage === 'round_robin');
  const playoffMatches = matches.filter(m => m.stage !== 'round_robin');

  return (
    <>
      {groupStageMatches.length > 0 && (
        <CollapsibleSection title="Group Stage" subtitle="Top 8 players advance">
          <MatchList matches={groupStageMatches} participants={participants} onRecordResult={handleOpenRecordModal} />
        </CollapsibleSection>
      )}

      {playoffMatches.length > 0 && (
        <CollapsibleSection title="Quarterfinals" subtitle="Best of 3 sets">
          <MatchList matches={playoffMatches} participants={participants} onRecordResult={handleOpenRecordModal} />
        </CollapsibleSection>
      )}

      {matches.length === 0 && (
        <div className="text-center p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
          <p className="text-gray-500 dark:text-gray-400">No matches scheduled yet.</p>
        </div>
      )}

      {selectedMatch && (
        <RecordResultModal
          isOpen={isRecordModalOpen}
          onClose={handleCloseRecordModal}
          match={selectedMatch}
          participants={participants}
          onSubmitResult={handleSubmitResult}
          tournamentId={tournament.id}
        />
      )}
    </>
  );
};

const CollapsibleSection = ({ title, subtitle, children }) => {
  const [expanded, setExpanded] = useState(true);

  return (
    <section>
      <div onClick={() => setExpanded(!expanded)} className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm cursor-pointer">
        <div>
          <h2 className="font-bold text-gray-900 dark:text-white">{title}</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">{subtitle}</p>
        </div>
        <span className={`material-icons text-gray-500 dark:text-gray-400 transition-transform ${expanded ? 'rotate-180' : ''}`}>{expanded ? 'expand_less' : 'expand_more'}</span>
      </div>
      <div className={`collapsible-content ${expanded ? 'expanded' : ''} space-y-3 mt-3`}>
        {children}
      </div>
    </section>
  );
};

export default TournamentDetail;

