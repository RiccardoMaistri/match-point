import React, { useState, useEffect } from 'react';

const getParticipantById = (participantId, participants) => {
  return participants.find(p => p.id === participantId);
};

function RecordResultModal({ isOpen, onClose, match, participants, onSubmitResult, tournamentId }) {
  const [scores, setScores] = useState({});
  const [winnerId, setWinnerId] = useState('');
  const [error, setError] = useState('');

  const participant1 = match ? getParticipantById(match.participant1_id, participants) : null;
  const participant2 = match ? getParticipantById(match.participant2_id, participants) : null;

  useEffect(() => {
    if (match) {
      setScores({
        score1: match.score_participant1 ?? '',
        score2: match.score_participant2 ?? '',
        set1Score1: match.set1_score_participant1 ?? '',
        set1Score2: match.set1_score_participant2 ?? '',
        set2Score1: match.set2_score_participant1 ?? '',
        set2Score2: match.set2_score_participant2 ?? '',
      });
      setWinnerId(match.winner_id || '');
      setError('');
    } else {
      setScores({});
      setWinnerId('');
      setError('');
    }
  }, [match]);

  if (!isOpen || !match) {
    return null;
  }

  if (!participant1 || !participant2) {
    return (
      <div className="fixed inset-0 bg-gray-900/75 z-50 flex justify-center items-center p-4">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-xl max-w-sm w-full">
          <h3 className="text-lg font-semibold text-red-600 dark:text-red-400">Error</h3>
          <p className="text-gray-700 dark:text-gray-300 mt-2">Participant data for this match is missing.</p>
          <button onClick={onClose} className="mt-4 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600">
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
        setError(`Invalid score entered for ${key}. Scores must be non-negative numbers.`);
        return;
      }
    }

    if ((parsedScores.set2Score1 !== null || parsedScores.set2Score2 !== null) && (parsedScores.set1Score1 === null || parsedScores.set1Score2 === null)) {
      setError('Set 1 scores are required to enter Set 2 scores.');
      return;
    }

    if (winnerId && winnerId !== match.participant1_id && winnerId !== match.participant2_id) {
      setError('Selected winner is not part of this match.');
      return;
    }

    const resultData = {
      score_participant1: parsedScores.score1,
      score_participant2: parsedScores.score2,
      set1_score_participant1: parsedScores.set1Score1,
      set1_score_participant2: parsedScores.set1Score2,
      set2_score_participant1: parsedScores.set2Score1,
      set2_score_participant2: parsedScores.set2Score2,
      winner_id: winnerId || null,
    };
    onSubmitResult(tournamentId, match.id, resultData);
  };

  const inputClasses = "mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 sm:text-sm transition-colors";
  const labelClasses = "block text-sm font-medium text-gray-700 dark:text-gray-300";
  const scoreGroupClasses = "grid grid-cols-1 sm:grid-cols-2 gap-4";
  const scoreHeaderClasses = "text-md font-semibold text-gray-800 dark:text-gray-200 pt-2";

  return (
    <div className="fixed inset-0 bg-gray-900/75 backdrop-blur-sm z-50 flex justify-center items-center p-4 transition-opacity duration-300 ease-in-out">
      <div className="relative bg-white dark:bg-gray-800 w-full max-w-lg p-6 sm:p-8 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 transform transition-all duration-300 ease-in-out">
        <div className="flex justify-between items-start mb-4">
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Record Result</h3>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors rounded-full">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
        </div>

        <div className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          <p>Match: <span className="font-semibold text-gray-800 dark:text-gray-200">{participant1.name}</span> vs <span className="font-semibold text-gray-800 dark:text-gray-200">{participant2.name}</span></p>
          {match.round_number && <p className="text-xs">Round: {match.round_number} | Match: {match.match_number}</p>}
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && <p className="text-sm text-red-700 dark:text-red-300 bg-red-100 dark:bg-red-900/50 p-3 rounded-lg border border-red-200 dark:border-red-800">{error}</p>}

          <div className="space-y-4">
            <h4 className={scoreHeaderClasses}>Total Score</h4>
            <div className={scoreGroupClasses}>
              <div>
                <label htmlFor="score1" className={labelClasses}>Score ({participant1.name})</label>
                <input type="number" name="score1" id="score1" value={scores.score1} onChange={handleScoreChange} min="0" className={inputClasses} placeholder="e.g., 2" />
              </div>
              <div>
                <label htmlFor="score2" className={labelClasses}>Score ({participant2.name})</label>
                <input type="number" name="score2" id="score2" value={scores.score2} onChange={handleScoreChange} min="0" className={inputClasses} placeholder="e.g., 0" />
              </div>
            </div>

            <h4 className={scoreHeaderClasses}>Set 1 (Required)</h4>
            <div className={scoreGroupClasses}>
              <div>
                <label htmlFor="set1Score1" className={labelClasses}>Set 1 ({participant1.name})</label>
                <input type="number" name="set1Score1" id="set1Score1" value={scores.set1Score1} onChange={handleScoreChange} min="0" className={inputClasses} placeholder="e.g., 6" />
              </div>
              <div>
                <label htmlFor="set1Score2" className={labelClasses}>Set 2 ({participant2.name})</label>
                <input type="number" name="set1Score2" id="set1Score2" value={scores.set1Score2} onChange={handleScoreChange} min="0" className={inputClasses} placeholder="e.g., 4" />
              </div>
            </div>

            <h4 className={scoreHeaderClasses}>Set 2 (Optional)</h4>
            <div className={scoreGroupClasses}>
              <div>
                <label htmlFor="set2Score1" className={labelClasses}>Set 2 ({participant1.name})</label>
                <input type="number" name="set2Score1" id="set2Score1" value={scores.set2Score1} onChange={handleScoreChange} min="0" className={inputClasses} placeholder="e.g., 6" />
              </div>
              <div>
                <label htmlFor="set2Score2" className={labelClasses}>Set 2 ({participant2.name})</label>
                <input type="number" name="set2Score2" id="set2Score2" value={scores.set2Score2} onChange={handleScoreChange} min="0" className={inputClasses} placeholder="e.g., 2" />
              </div>
            </div>
          </div>

          <div>
            <label htmlFor="winnerId" className={labelClasses}>Winner</label>
            <select name="winnerId" id="winnerId" value={winnerId} onChange={(e) => setWinnerId(e.target.value)} className={inputClasses}>
              <option value="">-- Auto-detect or select if tied --</option>
              <option value={participant1.id}>{participant1.name}</option>
              <option value={participant2.id}>{participant2.name}</option>
            </select>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5">Select a winner to override auto-detection based on scores.</p>
          </div>

          <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 pt-4">
            <button type="button" onClick={onClose} className="px-6 py-2 text-sm font-semibold text-gray-800 dark:text-gray-200 bg-gray-200 dark:bg-gray-600 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors">
              Cancel
            </button>
            <button type="submit" className="px-6 py-2 text-sm font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 shadow-sm transition-colors">
              Save Result
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default RecordResultModal;
