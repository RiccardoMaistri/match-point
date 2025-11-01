import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import * as api from '../services/api';
import RecordResultModal from './RecordResultModal';
import ConfirmModal from './ConfirmModal';

function TournamentDetail({ currentUser }) {
  const { tournamentId } = useParams();
  const [tournament, setTournament] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [matches, setMatches] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isResultModalOpen, setIsResultModalOpen] = useState(false);
  const [currentMatchForResult, setCurrentMatchForResult] = useState(null);
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, title: '', message: '', onConfirm: null });
  const [activeTab, setActiveTab] = useState('group');
  const [allMatchesOpen, setAllMatchesOpen] = useState(false);

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
    } catch (err) {
      setError(err.message || `Failed to fetch tournament details`);
    } finally {
      setIsLoading(false);
    }
  }, [tournamentId]);

  useEffect(() => {
    fetchTournamentData();
  }, [fetchTournamentData]);



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

  const getParticipantName = (participantId) => {
    const participant = participants?.find(p => p.id === participantId);
    return participant?.name || 'Unknown';
  };

  const myMatches = matches.filter(m => {
    const p1 = participants.find(p => p.id === m.participant1_id);
    const p2 = participants.find(p => p.id === m.participant2_id);
    return currentUser && (p1?.email === currentUser.email || p2?.email === currentUser.email);
  });

  const groupMatches = matches.filter(m => m.phase === 'group');
  const playoffMatches = matches.filter(m => m.phase === 'playoff');
  const groupStageComplete = groupMatches.length > 0 && groupMatches.every(m => m.status === 'completed');
  const playoffsStarted = playoffMatches.length > 0;
  const canAccessPlayoffs = groupStageComplete && playoffsStarted;
  const remainingGroupMatches = groupMatches.filter(m => m.status !== 'completed').length;

  const renderMatch = (match, showRecordButton = true) => {
    const p1 = participants.find(p => p.id === match.participant1_id);
    const p2 = participants.find(p => p.id === match.participant2_id);
    const isUserMatch = currentUser && (p1?.email === currentUser.email || p2?.email === currentUser.email);
    const isCompleted = match.status === 'completed';
    const p1Name = getParticipantName(match.participant1_id);
    const p2Name = getParticipantName(match.participant2_id);

    const p1Sets = [];
    const p2Sets = [];
    if (match.set1_score_participant1 !== null) {
      p1Sets.push(match.set1_score_participant1);
      p2Sets.push(match.set1_score_participant2);
    }
    if (match.set2_score_participant1 !== null) {
      p1Sets.push(match.set2_score_participant1);
      p2Sets.push(match.set2_score_participant2);
    }
    if (match.set3_score_participant1 !== null) {
      p1Sets.push(match.set3_score_participant1);
      p2Sets.push(match.set3_score_participant2);
    }

    return (
      <div className="flex justify-between items-center">
        <div className="flex-1 space-y-1">
          <div className="flex items-center justify-between">
            <span className={`font-semibold ${match.winner_id === match.participant1_id ? 'text-primary' : 'text-slate-800 dark:text-slate-200'}`}>
              {p1Name}
            </span>
            {isCompleted && p1Sets.length > 0 && (
              <div className="flex gap-2">
                {p1Sets.map((score, i) => (
                  <span key={i} className={`font-bold ${match.winner_id === match.participant1_id ? 'text-primary' : 'text-slate-500 dark:text-slate-400'}`}>
                    {score}
                  </span>
                ))}
              </div>
            )}
          </div>
          <div className="flex items-center justify-between">
            <span className={`font-semibold ${match.winner_id === match.participant2_id ? 'text-primary' : 'text-slate-800 dark:text-slate-200'}`}>
              {p2Name}
            </span>
            {isCompleted && p2Sets.length > 0 && (
              <div className="flex gap-2">
                {p2Sets.map((score, i) => (
                  <span key={i} className={`font-bold ${match.winner_id === match.participant2_id ? 'text-primary' : 'text-slate-500 dark:text-slate-400'}`}>
                    {score}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
        {!isCompleted && isUserMatch && showRecordButton && (
          <button
            onClick={() => openRecordResultModal(match.id)}
            className="flex items-center justify-center gap-1.5 ml-4 px-3 py-1.5 bg-primary/10 dark:bg-primary/20 text-primary dark:text-indigo-300 rounded-full text-xs font-semibold hover:bg-primary/20 dark:hover:bg-primary/30 transition-colors"
          >
            <span className="material-symbols-outlined text-base">edit_square</span>
            <span>Record Result</span>
          </button>
        )}
        {!isCompleted && !isUserMatch && showRecordButton && (
          <div className="ml-4 w-10 h-10 flex items-center justify-center">
            <button
              onClick={() => openRecordResultModal(match.id)}
              className="w-8 h-8 flex items-center justify-center bg-primary/10 dark:bg-primary/20 text-primary dark:text-indigo-300 rounded-full hover:bg-indigo-200 dark:hover:bg-primary/30 transition-all duration-200"
            >
              <span className="material-symbols-outlined text-base">edit</span>
            </button>
          </div>
        )}
      </div>
    );
  };

  const renderPlayoffRounds = () => {
    const roundsMap = {};
    playoffMatches.forEach(m => {
      if (!roundsMap[m.round_number]) roundsMap[m.round_number] = [];
      roundsMap[m.round_number].push(m);
    });

    const sortedRounds = Object.keys(roundsMap).sort((a, b) => b - a);
    const getRoundName = (roundNum) => {
      const totalRounds = Math.max(...playoffMatches.map(m => m.round_number || 1));
      const remaining = totalRounds - roundNum + 1;
      if (remaining === 1) return 'Final';
      if (remaining === 2) return 'Semi-finals';
      if (remaining === 3) return 'Quarter-finals';
      return `Round ${roundNum}`;
    };

    return (
      <div>
        <div className="px-2 mb-3">
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-50">Playoffs</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">Knockout stage</p>
        </div>
        <div className="bg-white dark:bg-surface-dark rounded-3xl shadow-sm flex flex-col max-h-[calc(100vh-366px)]">
          <div className="overflow-y-auto">
            <div className="p-4 space-y-4 divide-y divide-gray-200 dark:divide-border-dark">
              {sortedRounds.map(roundNum => (
                roundsMap[roundNum].map((match, idx) => (
                  <div key={match.id} className={idx > 0 || roundNum !== sortedRounds[0] ? 'pt-4' : ''}>
                    {renderMatch(match)}
                  </div>
                ))
              ))}
            </div>
          </div>
          <div className="mt-auto border-t border-gray-200 dark:border-border-dark flex items-center justify-center gap-2 p-3 bg-blue-50 dark:bg-blue-900/30 rounded-b-xl text-sm">
            <span className="material-symbols-outlined text-blue-600 dark:text-blue-400 text-base">timer</span>
            <span className="font-medium text-blue-800 dark:text-blue-300">Playoffs in progress</span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="fixed top-[44px] left-0 right-0 bottom-[72px] flex flex-col">
      {/* Status Badge */}
      <div className="px-3 pt-3 pb-2">
        {!groupStageComplete && groupMatches.length > 0 && (
          <div className="flex items-center justify-center gap-2 mb-2 px-4 py-2 bg-blue-50/50 dark:bg-blue-900/20 rounded-full border border-blue-200 dark:border-blue-800 w-fit mx-auto">
            <span className="material-symbols-outlined text-blue-600 dark:text-blue-400 text-base">timer</span>
            <span className="text-sm font-medium text-blue-800 dark:text-blue-300">Group stage in progress</span>
          </div>
        )}
        {groupStageComplete && !playoffsStarted && (
          isOwner ? (
            <button
              onClick={handleGenerateMatches}
              className="flex items-center justify-center gap-2 mb-2 px-4 py-2 bg-purple-50/50 dark:bg-purple-900/20 rounded-full border border-purple-200 dark:border-purple-800 w-fit mx-auto hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-purple-600 dark:text-purple-400 text-base">emoji_events</span>
              <span className="text-sm font-medium text-purple-800 dark:text-purple-300">Start Playoff Phase</span>
            </button>
          ) : (
            <div className="flex items-center justify-center gap-2 mb-2 px-4 py-2 bg-amber-50/50 dark:bg-amber-900/20 rounded-full border border-amber-200 dark:border-amber-800 w-fit mx-auto">
              <span className="material-symbols-outlined text-amber-600 dark:text-amber-400 text-base">schedule</span>
              <span className="text-sm font-medium text-amber-800 dark:text-amber-300">Waiting for playoffs to start</span>
            </div>
          )
        )}
        {playoffsStarted && (
          <div className="flex items-center justify-center gap-2 mb-2 px-4 py-2 bg-purple-50/50 dark:bg-purple-900/20 rounded-full border border-purple-200 dark:border-purple-800 w-fit mx-auto">
            <span className="material-symbols-outlined text-purple-600 dark:text-purple-400 text-base">emoji_events</span>
            <span className="text-sm font-medium text-purple-800 dark:text-purple-300">Playoffs are about to start</span>
          </div>
        )}
      </div>

      {/* Tab Switcher */}
      <div className="px-3 pb-3">
        <div className="p-1 bg-slate-100 dark:bg-slate-800 rounded-3xl flex">
        <button
          onClick={() => setActiveTab('group')}
          className={`flex-1 text-center py-1.5 px-3 rounded-2xl text-xs font-semibold cursor-pointer transition-colors duration-300 ${
            activeTab === 'group'
              ? 'bg-indigo-600 text-white'
              : 'text-slate-600 dark:text-slate-300'
          }`}
        >
          Group Stage
        </button>
        <button
          onClick={() => canAccessPlayoffs && setActiveTab('playoffs')}
          className={`flex-1 py-1.5 px-2 rounded-2xl text-xs font-semibold transition-all duration-300 flex flex-col items-center justify-center ${
            activeTab === 'playoffs'
              ? 'bg-indigo-600 text-white shadow-md'
              : canAccessPlayoffs
              ? 'bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 cursor-pointer'
              : 'text-slate-400 dark:text-slate-500 cursor-not-allowed'
          }`}
        >
          <div className="flex items-center gap-1">
            {!canAccessPlayoffs && <span className="material-symbols-outlined text-xs">lock</span>}
            {canAccessPlayoffs && activeTab !== 'playoffs' && (
              <span className="material-symbols-outlined text-xs">emoji_events</span>
            )}
            <span>Playoffs</span>
          </div>
          {!canAccessPlayoffs && remainingGroupMatches > 0 && (
            <span className="text-[9px] opacity-75 mt-0.5">{remainingGroupMatches} match{remainingGroupMatches !== 1 ? 'es' : ''} left</span>
          )}
        </button>
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto px-3">
        {/* Group Stage Tab */}
        {activeTab === 'group' && (
          <div className="space-y-6 pb-6">
          {/* Generate Matches Button */}
          {isOwner && canGenerateMatches && tournament.status === 'open' && (
            <div className="bg-blue-50 border border-blue-200 rounded-2xl p-3">
              <button onClick={handleGenerateMatches} className="w-full px-4 py-2 text-sm font-semibold text-white bg-primary rounded-2xl hover:bg-indigo-700 transition-colors">
                {matches.length > 0 ? 'Regenerate Matches' : 'Kick Off Tournament'}
              </button>
            </div>
          )}

          {!canGenerateMatches && tournament.status === 'open' && isOwner && (
            <div className="flex items-center gap-2 px-4 py-3 bg-slate-50 dark:bg-slate-800/50 rounded-3xl border border-slate-200 dark:border-slate-700">
              <span className="material-symbols-outlined text-slate-400 dark:text-slate-500 text-lg">group_add</span>
              <p className="text-sm text-slate-600 dark:text-slate-400">Add at least 2 participants to start</p>
            </div>
          )}

          {/* My Matches */}
          {myMatches.filter(m => m.phase === 'group').length > 0 && (
            <div>
              <div className="px-2 mb-3">
                <h2 className="text-xl font-bold text-slate-900 dark:text-slate-50">My Matches</h2>
              </div>
              <div className="bg-white dark:bg-surface-dark rounded-3xl shadow-sm flex flex-col">
                <div className="p-4 space-y-4 divide-y divide-gray-200 dark:divide-border-dark">
                  {myMatches.filter(m => m.phase === 'group').map((match, idx) => (
                    <div key={match.id} className={idx > 0 ? 'pt-4' : ''}>
                      {renderMatch(match)}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* All Matches */}
          {groupMatches.length > 0 && (
            <div>
              <button
                onClick={() => setAllMatchesOpen(!allMatchesOpen)}
                className="w-full flex justify-between items-center px-2 mb-3"
              >
                <div>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-slate-50">All Matches</h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 text-left">
                    Tap to expand
                  </p>
                </div>
                <span className={`material-symbols-outlined text-slate-500 dark:text-slate-400 transition-transform ${allMatchesOpen ? 'rotate-180' : ''}`}>
                  expand_more
                </span>
              </button>
              {allMatchesOpen && (
                <div className="bg-white dark:bg-surface-dark rounded-3xl shadow-sm p-4 space-y-4 divide-y divide-gray-200 dark:divide-border-dark">
                  {groupMatches.filter(match => !myMatches.some(m => m.id === match.id)).map((match, idx) => (
                    <div key={match.id} className={idx > 0 ? 'pt-4' : ''}>
                      {renderMatch(match, false)}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          </div>
        )}

        {/* Playoffs Tab */}
        {activeTab === 'playoffs' && (
          <div className="space-y-6 pb-6">
          {playoffMatches.length > 0 ? (
            renderPlayoffRounds()
          ) : (
            <div className="text-center py-8">
              <p className="text-slate-500 dark:text-slate-400">Playoffs not yet generated</p>
            </div>
          )}
          </div>
        )}
      </div>

      {isResultModalOpen && currentMatchForResult && (
        <RecordResultModal
          isOpen={isResultModalOpen}
          onClose={() => setIsResultModalOpen(false)}
          match={currentMatchForResult}
          participants={participants}
          onSubmitResult={handleSubmitMatchResult}
          tournamentId={tournament.id}
        />
      )}
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
