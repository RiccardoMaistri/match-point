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
  const [activeTab, setActiveTab] = useState(() => {
    const saved = localStorage.getItem(`tournament-${tournamentId}-tab`);
    return saved || 'group';
  });
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
      const response = await api.recordMatchResult(tournamentId, matchId, resultData);
      await fetchTournamentData();
      setIsResultModalOpen(false);
      setCurrentMatchForResult(null);
      
      // Show winner notification if tournament is completed
      if (response.tournament_winner) {
        alert(`🏆 ${response.tournament_winner.name} wins the tournament! 🏆`);
      }
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
  const canGenerateMatches = tournament?.tournament_type === 'double' 
    ? (tournament.teams?.length || 0) >= 4
    : participants.length >= 4 && participants.length >= tournament.playoff_participants;

  const getParticipantName = (participantId, match = null) => {
    if (!participantId && match?.is_bye) {
      return 'Bye';
    }
    
    if (tournament?.tournament_type === 'double') {
      // For doubles, participantId is actually teamId
      const team = tournament.teams?.find(t => t.id === participantId);
      if (!team) return 'Unknown';
      
      const player1 = participants?.find(p => p.id === team.player1_id);
      const player2 = participants?.find(p => p.id === team.player2_id);
      
      const getName = (p) => {
        if (!p) return 'Unknown';
        if (p.name && p.name !== p.email) return p.name;
        return p.email ? p.email.split('@')[0] : 'Unknown';
      };
      
      return `${getName(player1)} / ${getName(player2)}`;
    } else {
      // Singles logic
      const participant = participants?.find(p => p.id === participantId);
      if (!participant) return 'Unknown';
      
      if (participant.name && participant.name !== participant.email) {
        return participant.name;
      }
      return participant.email ? participant.email.split('@')[0] : 'Unknown';
    }
  };

  const myMatches = matches.filter(m => {
    if (!currentUser) return false;
    
    if (tournament?.tournament_type === 'double') {
      // For doubles, check if user is in either team
      const team1 = tournament.teams?.find(t => t.id === m.participant1_id);
      const team2 = tournament.teams?.find(t => t.id === m.participant2_id);
      
      const isInTeam1 = team1 && (
        participants.find(p => p.id === team1.player1_id)?.email === currentUser.email ||
        participants.find(p => p.id === team1.player2_id)?.email === currentUser.email
      );
      
      const isInTeam2 = team2 && (
        participants.find(p => p.id === team2.player1_id)?.email === currentUser.email ||
        participants.find(p => p.id === team2.player2_id)?.email === currentUser.email
      );
      
      return isInTeam1 || isInTeam2;
    } else {
      // Singles logic
      const p1 = participants.find(p => p.id === m.participant1_id);
      const p2 = participants.find(p => p.id === m.participant2_id);
      return p1?.email === currentUser.email || p2?.email === currentUser.email;
    }
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
    let isUserMatch = false;
    if (currentUser) {
      if (tournament?.tournament_type === 'double') {
        const team1 = tournament.teams?.find(t => t.id === match.participant1_id);
        const team2 = tournament.teams?.find(t => t.id === match.participant2_id);
        
        const isInTeam1 = team1 && (
          participants.find(p => p.id === team1.player1_id)?.email === currentUser.email ||
          participants.find(p => p.id === team1.player2_id)?.email === currentUser.email
        );
        
        const isInTeam2 = team2 && (
          participants.find(p => p.id === team2.player1_id)?.email === currentUser.email ||
          participants.find(p => p.id === team2.player2_id)?.email === currentUser.email
        );
        
        isUserMatch = isInTeam1 || isInTeam2;
      } else {
        const p1 = participants.find(p => p.id === match.participant1_id);
        const p2 = participants.find(p => p.id === match.participant2_id);
        isUserMatch = p1?.email === currentUser.email || p2?.email === currentUser.email;
      }
    }
    const isCompleted = match.status === 'completed';
    const p1Name = getParticipantName(match.participant1_id, match);
    const p2Name = getParticipantName(match.participant2_id, match);
    const canRecordResult = match.phase === 'playoff' ? isUserMatch : showRecordButton;

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
        {!isCompleted && isUserMatch && canRecordResult && (
          <button
            onClick={() => openRecordResultModal(match.id)}
            className="flex items-center justify-center gap-1.5 ml-4 px-3 py-1.5 bg-primary/10 dark:bg-primary/20 text-primary dark:text-indigo-300 rounded-full text-xs font-semibold hover:bg-primary/20 dark:hover:bg-primary/30 transition-colors"
          >
            <span className="material-symbols-outlined text-base">edit_square</span>
            <span>Record Result</span>
          </button>
        )}
        {!isCompleted && !isUserMatch && canRecordResult && (
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

  const getRoundName = (roundNum, totalRounds) => {
    if (roundNum === totalRounds) return 'Final';
    if (roundNum === totalRounds - 1) return 'Semifinals';
    if (roundNum === totalRounds - 2) return 'Quarterfinals';
    return `Round ${roundNum}`;
  };

  const renderPlayoffRounds = () => {
    const roundsMap = {};
    playoffMatches.forEach(m => {
      if (!roundsMap[m.round_number]) roundsMap[m.round_number] = [];
      roundsMap[m.round_number].push(m);
    });

    const sortedRounds = Object.keys(roundsMap).sort((a, b) => Number(a) - Number(b));
    const maxRound = Math.max(...sortedRounds.map(Number));

    return (
      <div className="space-y-4">
        {sortedRounds.map(roundNum => {
          const roundMatches = roundsMap[roundNum];
          const allCompleted = roundMatches.every(m => m.status === 'completed');
          const roundName = getRoundName(Number(roundNum), maxRound);
          
          return (
            <div key={roundNum}>
              <div className="px-2 mb-3">
                <h2 className="text-xl font-bold text-slate-900 dark:text-slate-50">{roundName}</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">{roundMatches.length} match{roundMatches.length !== 1 ? 'es' : ''}</p>
              </div>
              <div className="bg-white dark:bg-surface-dark rounded-3xl shadow-sm">
                <div className="p-4 space-y-4 divide-y divide-gray-200 dark:divide-border-dark">
                  {roundMatches.map((match, idx) => (
                    <div key={match.id} className={idx > 0 ? 'pt-4' : ''}>
                      {renderMatch(match)}
                    </div>
                  ))}
                </div>
                {allCompleted && Number(roundNum) < maxRound && (
                  <div className="border-t border-gray-200 dark:border-border-dark flex items-center justify-center gap-2 p-3 bg-green-50 dark:bg-green-900/30 rounded-b-3xl text-sm">
                    <span className="material-symbols-outlined text-green-600 dark:text-green-400 text-base">check_circle</span>
                    <span className="font-medium text-green-800 dark:text-green-300">Round complete</span>
                  </div>
                )}
                {allCompleted && Number(roundNum) === maxRound && (() => {
                  const finalMatch = roundMatches[0];
                  const winner = finalMatch?.winner_id ? participants.find(p => p.id === finalMatch.winner_id) : null;
                  return winner ? (
                    <div className="border-t border-gray-200 dark:border-border-dark">
                      <div className="p-4">
                        <div className="bg-gradient-to-r from-yellow-400 to-orange-500 p-4 rounded-3xl shadow-lg text-center">
                          <div className="text-3xl mb-2">🏆</div>
                          <div className="text-white font-bold text-lg mb-1">Tournament Winner</div>
                          <div className="text-white/90 text-xl font-semibold">{winner.name}</div>
                        </div>
                      </div>
                    </div>
                  ) : null;
                })()}
              </div>
            </div>
          );
        })}
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
              onClick={async () => {
                try {
                  await api.generatePlayoffs(tournament.id);
                  await fetchTournamentData();
                } catch (err) {
                  setError(err.message || 'Failed to generate playoffs');
                }
              }}
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
        {playoffsStarted && tournament.status !== 'completed' && (
          <div className="flex items-center justify-center gap-2 mb-2 px-4 py-2 bg-purple-50/50 dark:bg-purple-900/20 rounded-full border border-purple-200 dark:border-purple-800 w-fit mx-auto">
            <span className="text-sm font-medium text-purple-800 dark:text-purple-300">Playoff on going</span>
          </div>
        )}
        {tournament.status === 'completed' && (
          <div className="flex items-center justify-center gap-2 mb-2 px-4 py-2 bg-yellow-50/50 dark:bg-yellow-900/20 rounded-full border border-yellow-200 dark:border-yellow-800 w-fit mx-auto">
            <span className="material-symbols-outlined text-yellow-600 dark:text-yellow-400 text-base">emoji_events</span>
            <span className="text-sm font-medium text-yellow-800 dark:text-yellow-300">Tournament Completed</span>
          </div>
        )}
      </div>

      {/* Tab Switcher */}
      <div className="px-3 pb-3">
        <div className="p-1 bg-slate-100 dark:bg-slate-800 rounded-3xl flex">
        <button
          onClick={() => {
            setActiveTab('group');
            localStorage.setItem(`tournament-${tournamentId}-tab`, 'group');
          }}
          className={`flex-1 text-center py-2.5 px-4 rounded-2xl text-sm font-semibold cursor-pointer transition-colors duration-300 ${
            activeTab === 'group'
              ? 'bg-indigo-600 text-white'
              : 'text-slate-600 dark:text-slate-300'
          }`}
        >
          Group Stage
        </button>
        <button
          onClick={() => {
            if (canAccessPlayoffs) {
              setActiveTab('playoffs');
              localStorage.setItem(`tournament-${tournamentId}-tab`, 'playoffs');
            }
          }}
          className={`flex-1 py-2.5 px-3 rounded-2xl text-sm font-semibold transition-all duration-300 flex flex-col items-center justify-center ${
            activeTab === 'playoffs'
              ? 'bg-indigo-600 text-white shadow-md'
              : canAccessPlayoffs
              ? 'bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 cursor-pointer'
              : 'text-slate-400 dark:text-slate-500 cursor-not-allowed'
          }`}
        >
          <div className="flex items-center gap-1">
            {!canAccessPlayoffs && <span className="material-symbols-outlined text-sm">lock</span>}
            {canAccessPlayoffs && activeTab !== 'playoffs' && (
              <span className="material-symbols-outlined text-sm">emoji_events</span>
            )}
            <span>Playoffs</span>
          </div>
          {!canAccessPlayoffs && remainingGroupMatches > 0 && (
            <span className="text-[10px] opacity-75 mt-0.5">{remainingGroupMatches} match{remainingGroupMatches !== 1 ? 'es' : ''} left</span>
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
              <p className="text-sm text-slate-600 dark:text-slate-400">
                {tournament?.tournament_type === 'double' 
                  ? 'Form at least 4 teams to start the tournament'
                  : 'Add at least 4 participants to start'
                }
              </p>
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
          tournament={tournament}
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
