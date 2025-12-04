import React, { useState, useEffect } from 'react';

const getParticipantById = (participantId, participants) => {
  return participants.find(p => p.id === participantId);
};

function RecordResultModal({ isOpen, onClose, match, participants, onSubmitResult, tournamentId, tournament }) {
  const [scores, setScores] = useState({
    score1_set1: '',
    score2_set1: '',
    score1_set2: '',
    score2_set2: '',
    score1_set3: '',
    score2_set3: '',
  });
  const [error, setError] = useState('');

  const getDisplayName = (participantId) => {
    if (!participantId) return null;
    
    if (tournament?.tournament_type === 'double') {
      const team = tournament.teams?.find(t => t.id === participantId);
      if (!team) return null;
      
      const player1 = participants?.find(p => p.id === team.player1_id);
      const player2 = participants?.find(p => p.id === team.player2_id);
      
      const getName = (p) => {
        if (!p) return 'Unknown';
        if (p.name && p.name !== p.email) return p.name;
        return p.email ? p.email.split('@')[0] : 'Unknown';
      };
      
      return { name: `${getName(player1)} / ${getName(player2)}` };
    } else {
      return getParticipantById(participantId, participants);
    }
  };
  
  const participant1 = match ? getDisplayName(match.participant1_id) : null;
  const participant2 = match ? getDisplayName(match.participant2_id) : null;

  useEffect(() => {
    if (match) {
      setScores({
        score1_set1: match.set1_score_participant1 ?? '',
        score2_set1: match.set1_score_participant2 ?? '',
        score1_set2: match.set2_score_participant1 ?? '',
        score2_set2: match.set2_score_participant2 ?? '',
        score1_set3: match.set3_score_participant1 ?? '',
        score2_set3: match.set3_score_participant2 ?? '',
      });
      setError('');
    } else {
      setScores({
        score1_set1: '',
        score2_set1: '',
        score1_set2: '',
        score2_set2: '',
        score1_set3: '',
        score2_set3: '',
      });
      setError('');
    }
  }, [match]);

  if (!isOpen || !match) {
    return null;
  }

  if (!participant1 || !participant2) {
    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
        <div className="bg-white dark:bg-surface-dark p-6 rounded-3xl shadow-2xl max-w-sm w-full" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
              <span className="material-symbols-outlined text-red-600 dark:text-red-400">error</span>
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-50">Error</h3>
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-6 ml-13">Participant data for this match is missing.</p>
          <button onClick={onClose} className="w-full px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-slate-50 rounded-2xl hover:bg-slate-200 dark:hover:bg-slate-600 font-semibold transition-colors">
            Close
          </button>
        </div>
      </div>
    );
  }

  const handleScoreChange = (e) => {
    const { name, value } = e.target;
    setScores(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    const parsedScores = Object.entries(scores).reduce((acc, [key, value]) => {
      acc[key] = value === '' || value === null ? null : parseInt(value, 10);
      return acc;
    }, {});

    for (const key in parsedScores) {
      if (parsedScores[key] !== null && (isNaN(parsedScores[key]) || parsedScores[key] < 0)) {
        setError(`Invalid score entered. Scores must be non-negative numbers.`);
        return;
      }
    }

    // Validate that both scores are filled for each set
    const set1HasScore = parsedScores.score1_set1 !== null || parsedScores.score2_set1 !== null;
    const set1Complete = parsedScores.score1_set1 !== null && parsedScores.score2_set1 !== null;
    const set2HasScore = parsedScores.score1_set2 !== null || parsedScores.score2_set2 !== null;
    const set2Complete = parsedScores.score1_set2 !== null && parsedScores.score2_set2 !== null;
    const set3HasScore = parsedScores.score1_set3 !== null || parsedScores.score2_set3 !== null;
    const set3Complete = parsedScores.score1_set3 !== null && parsedScores.score2_set3 !== null;

    if (set1HasScore && !set1Complete) {
      setError('Please enter both scores for Set 1.');
      return;
    }
    if (set2HasScore && !set2Complete) {
      setError('Please enter both scores for Set 2.');
      return;
    }
    if (set3HasScore && !set3Complete) {
      setError('Please enter both scores for Set 3.');
      return;
    }

    const resultData = {
        set1_score_participant1: parsedScores.score1_set1,
        set1_score_participant2: parsedScores.score2_set1,
        set2_score_participant1: parsedScores.score1_set2,
        set2_score_participant2: parsedScores.score2_set2,
        set3_score_participant1: parsedScores.score1_set3,
        set3_score_participant2: parsedScores.score2_set3,
        winner_id: null,
    };
    onSubmitResult(tournamentId, match.id, resultData);
  };

  const inputClasses = "mt-1 block w-full px-3 py-2 bg-white dark:bg-slate-800 border border-gray-300 dark:border-border-dark rounded-2xl shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary sm:text-sm text-slate-900 dark:text-slate-50";

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex justify-center items-center p-4" onClick={onClose}>
      <div className="relative bg-white dark:bg-surface-dark w-full max-w-lg p-6 rounded-3xl shadow-2xl animate-slide-up" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 dark:bg-primary/20 flex items-center justify-center">
              <span className="material-symbols-outlined text-primary">edit_square</span>
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-slate-50">Record Result</h3>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {error && <p className="text-xs text-red-700 bg-red-100 dark:bg-red-500/20 dark:text-red-400 p-3 rounded-2xl border border-red-200 dark:border-red-500/30">{error}</p>}

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 mb-3">
              <div className="text-sm font-semibold text-slate-900 dark:text-slate-50 text-center">{participant1.name}</div>
              <div className="text-sm font-semibold text-slate-900 dark:text-slate-50 text-center">{participant2.name}</div>
            </div>
            
            <div>
              <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Set 1</h4>
              <div className="grid grid-cols-2 gap-4">
                <input type="number" inputMode="numeric" name="score1_set1" id="score1_set1" value={scores.score1_set1} onChange={handleScoreChange} min="0" className={inputClasses} placeholder="0" />
                <input type="number" inputMode="numeric" name="score2_set1" id="score2_set1" value={scores.score2_set1} onChange={handleScoreChange} min="0" className={inputClasses} placeholder="0" />
              </div>
            </div>
            
            <div>
              <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Set 2</h4>
              <div className="grid grid-cols-2 gap-4">
                <input type="number" inputMode="numeric" name="score1_set2" id="score1_set2" value={scores.score1_set2} onChange={handleScoreChange} min="0" className={inputClasses} placeholder="0" />
                <input type="number" inputMode="numeric" name="score2_set2" id="score2_set2" value={scores.score2_set2} onChange={handleScoreChange} min="0" className={inputClasses} placeholder="0" />
              </div>
            </div>
            
            <div>
              <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Set 3 <span className="text-slate-500 dark:text-slate-400 font-normal">(Optional)</span></h4>
              <div className="grid grid-cols-2 gap-4">
                <input type="number" inputMode="numeric" name="score1_set3" id="score1_set3" value={scores.score1_set3} onChange={handleScoreChange} min="0" className={inputClasses} placeholder="0" />
                <input type="number" inputMode="numeric" name="score2_set3" id="score2_set3" value={scores.score2_set3} onChange={handleScoreChange} min="0" className={inputClasses} placeholder="0" />
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 text-sm font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 rounded-2xl hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors">
              Cancel
            </button>
            <button type="submit" className="flex-1 px-4 py-2.5 text-sm font-semibold text-white bg-primary rounded-2xl hover:bg-indigo-700 shadow-md transition-colors">
              Save Result
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default RecordResultModal;
