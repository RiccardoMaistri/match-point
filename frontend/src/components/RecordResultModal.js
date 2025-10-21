import React, { useState, useEffect } from 'react';

const getParticipantById = (participantId, participants) => {
  return participants.find(p => p.id === participantId);
};

function RecordResultModal({ isOpen, onClose, match, participants, onSubmitResult, tournamentId }) {
  const [scores, setScores] = useState({
    score1_set1: '',
    score2_set1: '',
    score1_set2: '',
    score2_set2: '',
    score1_set3: '',
    score2_set3: '',
  });
  const [error, setError] = useState('');

  const participant1 = match ? getParticipantById(match.participant1_id, participants) : null;
  const participant2 = match ? getParticipantById(match.participant2_id, participants) : null;

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
      <div className="fixed inset-0 bg-background-dark bg-opacity-75 flex items-center justify-center z-50 p-4">
        <div className="bg-card-light dark:bg-card-dark p-6 rounded-lg shadow-xl max-w-sm w-full">
          <h3 className="text-lg font-semibold text-red-500">Error</h3>
          <p className="text-subtext-light dark:text-subtext-dark mt-2">Participant data for this match is missing.</p>
          <button onClick={onClose} className="mt-4 px-4 py-2 bg-border-light dark:bg-border-dark text-text-light dark:text-text-dark rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600">
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

    const resultData = {
        set1_score_participant1: parsedScores.score1_set1,
        set1_score_participant2: parsedScores.score2_set1,
        set2_score_participant1: parsedScores.score1_set2,
        set2_score_participant2: parsedScores.score2_set2,
        set3_score_participant1: parsedScores.score1_set3,
        set3_score_participant2: parsedScores.score2_set3,
        winner_id: null, // Winner calculation is done on the backend
    };
    onSubmitResult(tournamentId, match.id, resultData);
  };

  const inputClasses = "mt-1 block w-full px-3 py-2 bg-card-light dark:bg-card-dark border border-border-light dark:border-border-dark rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary sm:text-sm text-text-light dark:text-text-dark";
  const labelClasses = "block text-sm font-medium text-text-light dark:text-text-dark";

  return (
    <div className="fixed inset-0 bg-background-dark bg-opacity-75 backdrop-blur-sm z-50 flex justify-center items-center p-4 animate-slide-up">
      <div className="relative bg-card-light dark:bg-card-dark w-full max-w-lg p-6 rounded-lg shadow-xl border border-border-light dark:border-border-dark">
        <div className="flex justify-between items-start mb-4">
          <h3 className="text-xl font-bold text-text-light dark:text-text-dark">Record Result</h3>
          <button onClick={onClose} className="p-1 text-subtext-light dark:text-subtext-dark hover:text-text-light dark:hover:text-text-dark transition-colors rounded-full -mt-1 -mr-1">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="text-sm text-subtext-light dark:text-subtext-dark mb-6">
          <p>Match: <span className="font-semibold text-text-light dark:text-text-dark">{participant1.name}</span> vs <span className="font-semibold text-text-light dark:text-text-dark">{participant2.name}</span></p>
          {match.round_number && <p className="text-xs mt-0.5">Round: {match.round_number} | Match: {match.match_number}</p>}
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && <p className="text-xs text-red-700 bg-red-100 dark:bg-red-500/20 dark:text-red-400 p-3 rounded-lg border border-red-200 dark:border-red-500/30">{error}</p>}

          <div className="space-y-4">
            <div>
                <h4 className="text-base font-bold text-text-light dark:text-text-dark">Set 1</h4>
                <div className="grid grid-cols-2 gap-4 mt-2">
                <div>
                    <label htmlFor="score1_set1" className={labelClasses}>{participant1.name}</label>
                    <input type="number" inputMode="numeric" name="score1_set1" id="score1_set1" value={scores.score1_set1} onChange={handleScoreChange} min="0" className={inputClasses} placeholder="0" />
                </div>
                <div>
                    <label htmlFor="score2_set1" className={labelClasses}>{participant2.name}</label>
                    <input type="number" inputMode="numeric" name="score2_set1" id="score2_set1" value={scores.score2_set1} onChange={handleScoreChange} min="0" className={inputClasses} placeholder="0" />
                </div>
                </div>
            </div>
            <div>
                <h4 className="text-base font-bold text-text-light dark:text-text-dark">Set 2</h4>
                <div className="grid grid-cols-2 gap-4 mt-2">
                <div>
                    <label htmlFor="score1_set2" className={labelClasses}>{participant1.name}</label>
                    <input type="number" inputMode="numeric" name="score1_set2" id="score1_set2" value={scores.score1_set2} onChange={handleScoreChange} min="0" className={inputClasses} placeholder="0" />
                </div>
                <div>
                    <label htmlFor="score2_set2" className={labelClasses}>{participant2.name}</label>
                    <input type="number" inputMode="numeric" name="score2_set2" id="score2_set2" value={scores.score2_set2} onChange={handleScoreChange} min="0" className={inputClasses} placeholder="0" />
                </div>
                </div>
            </div>
            <div>
                <h4 className="text-base font-bold text-text-light dark:text-text-dark">Set 3 (Optional)</h4>
                <div className="grid grid-cols-2 gap-4 mt-2">
                <div>
                    <label htmlFor="score1_set3" className={labelClasses}>{participant1.name}</label>
                    <input type="number" inputMode="numeric" name="score1_set3" id="score1_set3" value={scores.score1_set3} onChange={handleScoreChange} min="0" className={inputClasses} placeholder="0" />
                </div>
                <div>
                    <label htmlFor="score2_set3" className={labelClasses}>{participant2.name}</label>
                    <input type="number" inputMode="numeric" name="score2_set3" id="score2_set3" value={scores.score2_set3} onChange={handleScoreChange} min="0" className={inputClasses} placeholder="0" />
                </div>
                </div>
            </div>
          </div>

          <div className="flex gap-4 pt-4">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-3 text-sm font-semibold text-subtext-light dark:text-subtext-dark bg-border-light dark:bg-border-dark rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors">
              Cancel
            </button>
            <button type="submit" className="flex-1 px-4 py-3 text-sm font-semibold text-white bg-primary rounded-lg hover:bg-indigo-700 shadow-lg transition-colors">
              Save Result
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default RecordResultModal;
