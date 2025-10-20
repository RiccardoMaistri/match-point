import React, { useMemo, useState } from 'react';

const Bracket = ({ matches, participants, tournament, currentUser, onRecordResult }) => {
  const { rounds, maxRounds } = useMemo(() => {
    if (!matches || matches.length === 0) {
      return { rounds: {}, maxRounds: 0 };
    }

    const playoffMatches = matches.filter(m => m.phase === 'playoff');
    
    const roundsData = playoffMatches.reduce((acc, match) => {
      const roundNumber = match.round_number;
      if (roundNumber !== null && roundNumber !== undefined) {
        if (!acc[roundNumber]) {
          acc[roundNumber] = [];
        }
        acc[roundNumber].push(match);
      }
      return acc;
    }, {});

    const calculatedMaxRounds = playoffMatches.length > 0 ? Math.max(...playoffMatches.map(m => m.round_number || 1)) : 1;

    return { rounds: roundsData, maxRounds: calculatedMaxRounds };
  }, [matches]);

  const roundNumbers = Object.keys(rounds).sort((a, b) => a - b).map(r => parseInt(r));
  
  const semifinalsRound = roundNumbers.find(rn => {
    const remaining = maxRounds - rn + 1;
    return remaining === 2;
  });
  const semifinalsCompleted = semifinalsRound && rounds[semifinalsRound]?.every(m => m.status === 'completed');
  
  const finalRound = roundNumbers.find(rn => {
    const remaining = maxRounds - rn + 1;
    return remaining === 1;
  });
  
  const [expandedRounds, setExpandedRounds] = useState(() => {
    const initial = new Set([roundNumbers[0]]);
    if (semifinalsCompleted && semifinalsRound) {
      initial.delete(semifinalsRound);
      if (finalRound) {
        initial.add(finalRound);
      }
    }
    return initial;
  });

  const getParticipantName = (participantId) => {
    if (!participantId) return 'TBD';
    const participant = participants.find(p => p.id === participantId);
    return participant ? participant.name : 'TBD';
  };

  const getRoundName = (roundNumber) => {
    const remaining = maxRounds - roundNumber + 1;
    if (remaining === 1) return 'Final';
    if (remaining === 2) return 'Semifinals';
    if (remaining === 3) return 'Quarterfinals';
    return `Round ${roundNumber}`;
  };

  const isRoundUnlocked = (roundNumber) => {
    if (roundNumber === 1) return true;
    const prevRound = roundNumber - 1;
    const prevRoundMatches = rounds[prevRound] || [];
    return prevRoundMatches.length > 0 && prevRoundMatches.every(m => m.status === 'completed');
  };

  const playoffMatches = matches?.filter(m => m.phase === 'playoff') || [];
  
  if (playoffMatches.length === 0) {
    return (
      <div className="text-center text-gray-500 py-8">
        No playoff matches yet
      </div>
    );
  }

  const toggleRound = (roundNumber) => {
    const newExpanded = new Set(expandedRounds);
    if (newExpanded.has(roundNumber)) {
      newExpanded.delete(roundNumber);
    } else {
      newExpanded.add(roundNumber);
    }
    setExpandedRounds(newExpanded);
  };

  return (
    <div className="space-y-2">
      {roundNumbers.map((roundNumber) => {
        const unlocked = isRoundUnlocked(roundNumber);
        const isExpanded = expandedRounds.has(roundNumber);
        const roundMatches = rounds[roundNumber] || [];
        const completedCount = roundMatches.filter(m => m.status === 'completed').length;
        const isComplete = completedCount === roundMatches.length && roundMatches.length > 0;
        
        return (
          <div key={roundNumber} className={`bg-white rounded-lg shadow-sm border overflow-hidden ${
            isComplete ? 'border-blue-200 bg-blue-50/30' : unlocked ? 'border-gray-200' : 'border-gray-200 bg-gray-50'
          }`}>
            <button
              onClick={() => unlocked && toggleRound(roundNumber)}
              disabled={!unlocked}
              className={`w-full p-3 flex items-center justify-between transition-colors ${
                unlocked ? 'hover:bg-gray-50' : 'cursor-not-allowed'
              }`}
            >
              <div className="flex items-center gap-2">
                {unlocked ? (
                  <svg
                    className={`w-4 h-4 transition-transform text-gray-600 ${isExpanded ? 'rotate-90' : ''}`}
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 6 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                )}
                <div className="text-left">
                  <h3 className={`text-sm font-bold ${unlocked ? 'text-primary-text' : 'text-gray-400'}`}>
                    {getRoundName(roundNumber)}
                  </h3>
                  <p className="text-[10px] text-gray-500">
                    {completedCount}/{roundMatches.length} matches
                  </p>
                </div>
              </div>
              {isComplete && (
                <div className="flex items-center gap-1 text-blue-600">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-xs font-semibold">Complete</span>
                </div>
              )}
            </button>
            
            {isExpanded && unlocked && (
              <div className="p-3 space-y-2 border-t border-gray-100">
                {roundMatches.map((match) => {
                  const participant1 = participants.find(p => p.id === match.participant1_id);
                  const participant2 = participants.find(p => p.id === match.participant2_id);
                  const isUserMatch = currentUser && (participant1?.email === currentUser.email || participant2?.email === currentUser.email);

                  const p1_scores = [];
                  if (match.set1_score_participant1 !== null) p1_scores.push(match.set1_score_participant1);
                  if (match.set2_score_participant1 !== null) p1_scores.push(match.set2_score_participant1);

                  const p2_scores = [];
                  if (match.set1_score_participant2 !== null) p2_scores.push(match.set1_score_participant2);
                  if (match.set2_score_participant2 !== null) p2_scores.push(match.set2_score_participant2);

                  const score1Display = p1_scores.length > 0 
                    ? p1_scores.map((s, i) => <span key={i} className="text-center w-8 font-bold text-lg">{s}</span>) 
                    : <span className="text-center w-8 font-bold text-lg">-</span>;

                  const score2Display = p2_scores.length > 0 
                    ? p2_scores.map((s, i) => <span key={i} className="text-center w-8 font-bold text-lg">{s}</span>) 
                    : <span className="text-center w-8 font-bold text-lg">-</span>;

                  return (
                    <div key={match.id} className="bg-gray-50 rounded-lg border border-gray-200 overflow-hidden">
                      <div className="divide-y divide-gray-200">
                        <div className={`flex justify-between items-center p-2.5 ${
                          match.winner_id === match.participant1_id ? 'bg-blue-50 border-l-4 border-blue-500' : 'bg-white'
                        }`}>
                          <span className="font-semibold text-sm truncate flex-1">{getParticipantName(match.participant1_id)}</span>
                          <div className="flex items-center text-gray-900 ml-3">
                            {score1Display}
                          </div>
                        </div>
                        <div className={`flex justify-between items-center p-2.5 ${
                          match.winner_id === match.participant2_id ? 'bg-blue-50 border-l-4 border-blue-500' : 'bg-white'
                        }`}>
                          <span className="font-semibold text-sm truncate flex-1">{getParticipantName(match.participant2_id)}</span>
                          <div className="flex items-center text-gray-900 ml-3">
                            {score2Display}
                          </div>
                        </div>
                      </div>
                      <div className="flex justify-between items-center px-2.5 py-1.5 bg-white border-t border-gray-200">
                        <div>
                          {match.status === 'in_progress' ? (
                            <span className="text-[10px] text-yellow-600 font-semibold">In Progress</span>
                          ) : match.status !== 'completed' && (
                            <span className="text-[10px] text-gray-400 font-medium">Pending</span>
                          )}
                        </div>
                        {match.status !== 'completed' && isUserMatch && onRecordResult && (
                          <button
                            onClick={() => onRecordResult(tournament.id, match.id)}
                            className="px-3 py-1 text-xs font-semibold text-white bg-primary rounded-lg hover:bg-primary-hover transition-colors shadow-sm"
                          >
                            Record Result
                          </button>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default Bracket;
