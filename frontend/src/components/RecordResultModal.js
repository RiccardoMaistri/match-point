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
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-background p-6 rounded-xl shadow-xl max-w-sm w-full">
          <h3 className="text-lg font-semibold text-red-500">Error</h3>
          <p className="text-secondary-text mt-2">Participant data for this match is missing.</p>
          <button onClick={onClose} className="mt-4 px-4 py-2 bg-accent text-secondary-text rounded-lg hover:bg-gray-300">
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

    if (winnerId && winnerId !== match.participant1_id && winnerId !== match.participant2_id) {
      setError('Selected winner is not part of this match.');
      return;
    }

    const resultData = {
      score_participant1: parsedScores.score1,
      score_participant2: parsedScores.score2,
      winner_id: winnerId || null,
    };
    onSubmitResult(tournamentId, match.id, resultData);
  };

  const inputClasses = "mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary sm:text-sm";
  const labelClasses = "block text-sm font-medium text-primary-text";

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm z-50 flex justify-center items-center p-4">
      <div className="relative bg-background w-full max-w-lg p-6 sm:p-8 rounded-xl shadow-2xl border border-accent">
        <div className="flex justify-between items-start mb-4">
          <h3 className="text-2xl font-bold text-primary-text">Record Result</h3>
          <button onClick={onClose} className="p-1 text-secondary-text hover:text-primary-text transition-colors rounded-full">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
        </div>

        <div className="text-sm text-secondary-text mb-4">
          <p>Match: <span className="font-semibold text-primary-text">{participant1.name}</span> vs <span className="font-semibold text-primary-text">{participant2.name}</span></p>
          {match.round_number && <p className="text-xs">Round: {match.round_number} | Match: {match.match_number}</p>}
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && <p className="text-sm text-red-700 bg-red-100 p-3 rounded-lg border border-red-200">{error}</p>}

          <div className="space-y-4">
            <h4 className="text-md font-semibold text-primary-text pt-2">Total Score</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="score1" className={labelClasses}>Score ({participant1.name})</label>
                <input type="number" name="score1" id="score1" value={scores.score1} onChange={handleScoreChange} min="0" className={inputClasses} placeholder="e.g., 2" />
              </div>
              <div>
                <label htmlFor="score2" className={labelClasses}>Score ({participant2.name})</label>
                <input type="number" name="score2" id="score2" value={scores.score2} onChange={handleScoreChange} min="0" className={inputClasses} placeholder="e.g., 0" />
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
            <p className="text-xs text-secondary-text mt-1.5">Select a winner to override auto-detection based on scores.</p>
          </div>

          <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 pt-4">
            <button type="button" onClick={onClose} className="px-6 py-2 text-sm font-semibold text-secondary-text bg-accent rounded-lg hover:bg-gray-300 transition-colors">
              Cancel
            </button>
            <button type="submit" className="px-6 py-2 text-sm font-semibold text-white bg-primary rounded-lg hover:bg-primary-hover shadow-sm transition-colors">
              Save Result
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default RecordResultModal;
