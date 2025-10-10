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
  });
  const [error, setError] = useState('');

  const participant1 = match ? getParticipantById(match.participant1_id, participants) : null;
  const participant2 = match ? getParticipantById(match.participant2_id, participants) : null;

  useEffect(() => {
    if (match) {
      setScores({
        score1_set1: match.score_participant1_set1 ?? '',
        score2_set1: match.score_participant2_set1 ?? '',
        score1_set2: match.score_participant1_set2 ?? '',
        score2_set2: match.score_participant2_set2 ?? '',
      });
      setError('');
    } else {
      setScores({
        score1_set1: '',
        score2_set1: '',
        score1_set2: '',
        score2_set2: '',
      });
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

    const resultData = {
        score_participant1_set1: parsedScores.score1_set1,
        score_participant2_set1: parsedScores.score2_set1,
        score_participant1_set2: parsedScores.score1_set2,
        score_participant2_set2: parsedScores.score2_set2,
        winner_id: null,
    };
    onSubmitResult(tournamentId, match.id, resultData);
  };

  const inputClasses = "mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary sm:text-sm";
  const labelClasses = "block text-sm font-medium text-primary-text";

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm z-50 flex justify-center items-center p-3">
      <div className="relative bg-white w-full max-w-lg p-4 rounded-xl shadow-2xl border border-gray-200">
        <div className="flex justify-between items-start mb-3">
          <h3 className="text-lg font-bold text-primary-text">Record Result</h3>
          <button onClick={onClose} className="p-1 text-secondary-text hover:text-primary-text transition-colors rounded-full">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
        </div>

        <div className="text-xs text-secondary-text mb-3">
          <p>Match: <span className="font-semibold text-primary-text">{participant1.name}</span> vs <span className="font-semibold text-primary-text">{participant2.name}</span></p>
          {match.round_number && <p className="text-[10px] mt-0.5">Round: {match.round_number} | Match: {match.match_number}</p>}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <p className="text-xs text-red-700 bg-red-100 p-2 rounded-lg border border-red-200">{error}</p>}

          <div className="space-y-3">
            <h4 className="text-sm font-bold text-primary-text">Set 1</h4>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="score1_set1" className={labelClasses}>{participant1.name}</label>
                <input type="number" inputMode="numeric" name="score1_set1" id="score1_set1" value={scores.score1_set1} onChange={handleScoreChange} min="0" className={inputClasses} placeholder="0" />
              </div>
              <div>
                <label htmlFor="score2_set1" className={labelClasses}>{participant2.name}</label>
                <input type="number" inputMode="numeric" name="score2_set1" id="score2_set1" value={scores.score2_set1} onChange={handleScoreChange} min="0" className={inputClasses} placeholder="0" />
              </div>
            </div>
            <h4 className="text-sm font-bold text-primary-text">Set 2</h4>
            <div className="grid grid-cols-2 gap-3">
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

          <div className="flex gap-2 pt-2">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2 text-sm font-semibold text-secondary-text bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">
              Cancel
            </button>
            <button type="submit" className="flex-1 px-4 py-2 text-sm font-semibold text-white bg-primary rounded-lg hover:bg-primary-hover shadow-sm transition-colors">
              Save Result
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default RecordResultModal;
