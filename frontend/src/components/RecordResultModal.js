import React, { useState, useEffect } from 'react';

// Funzione helper per trovare un partecipante dato il suo ID
const getParticipantById = (participantId, participants) => {
  return participants.find(p => p.id === participantId);
};

function RecordResultModal({ isOpen, onClose, match, participants, onSubmitResult, tournamentId }) {
  const [score1, setScore1] = useState('');
  const [score2, setScore2] = useState('');
  const [winnerId, setWinnerId] = useState('');
  const [error, setError] = useState('');

  const participant1 = match ? getParticipantById(match.participant1_id, participants) : null;
  const participant2 = match ? getParticipantById(match.participant2_id, participants) : null;

  useEffect(() => {
    if (match) {
      setScore1(match.score_participant1 !== null && match.score_participant1 !== undefined ? String(match.score_participant1) : '');
      setScore2(match.score_participant2 !== null && match.score_participant2 !== undefined ? String(match.score_participant2) : '');
      setWinnerId(match.winner_id || '');
      setError(''); // Resetta l'errore quando il match cambia o il modale si apre/ricarica
    } else {
      setScore1('');
      setScore2('');
      setWinnerId('');
      setError('');
    }
  }, [match]); // Dipendenza solo da match, isOpen non serve qui

  if (!isOpen || !match) { // Semplificata la condizione, participant1/2 saranno null se match è null
    return null;
  }

  // Se i partecipanti non sono stati trovati (dovrebbe essere raro se i dati sono consistenti)
  if (!participant1 || !participant2) {
      return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75 z-50 flex justify-center items-center p-4">
            <div className="bg-white p-6 rounded-lg shadow-xl max-w-sm w-full">
                <h3 className="text-lg font-semibold text-red-700">Error</h3>
                <p className="text-gray-700 mt-2">Participant data for this match is missing. Cannot record result.</p>
                <button
                    onClick={onClose}
                    className="mt-4 px-4 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400 transition-colors"
                >
                    Close
                </button>
            </div>
        </div>
      );
  }


  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    const s1 = score1.trim() === '' ? null : parseInt(score1, 10);
    const s2 = score2.trim() === '' ? null : parseInt(score2, 10);

    if ((score1.trim() !== '' && isNaN(s1)) || (score2.trim() !== '' && isNaN(s2))) {
      setError('Scores must be valid numbers or left empty.');
      return;
    }
    if ((s1 !== null && s1 < 0) || (s2 !== null && s2 < 0)) {
        setError('Scores cannot be negative.');
        return;
    }

    if (winnerId && winnerId !== match.participant1_id && winnerId !== match.participant2_id) {
        setError('Selected winner is not part of this match.');
        return;
    }

    // Logica aggiuntiva: se i punteggi sono uguali, il vincitore deve essere specificato
    // Questo dipende dalle regole del torneo/gioco. Per ora, lo rendiamo opzionale.
    // if (s1 !== null && s2 !== null && s1 === s2 && !winnerId) {
    //   setError('For tied scores, please manually select a winner if applicable.');
    //   return;
    // }

    const resultData = {
      score_participant1: s1,
      score_participant2: s2,
      winner_id: winnerId || null,
    };
    onSubmitResult(tournamentId, match.id, resultData);
    // Non chiudere il modale qui; la chiusura avverrà in TournamentDetail dopo il successo della submit.
  };

  return (
    <div className="fixed inset-0 bg-slate-700 bg-opacity-60 backdrop-blur-sm overflow-y-auto h-full w-full z-50 flex justify-center items-center p-4 transition-opacity duration-300 ease-in-out">
      <div className="relative mx-auto p-6 border-0 w-full max-w-lg shadow-2xl rounded-lg bg-white transform transition-all duration-300 ease-in-out scale-100">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold leading-6 text-slate-800">
            Record Match Result
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
        </div>

        <div className="text-sm text-slate-700 mb-2">
            Match: <span className="font-semibold">{participant1.name}</span> vs <span className="font-semibold">{participant2.name}</span>
        </div>
        {match.round_number && <p className="text-xs text-slate-500 mb-4">Round: {match.round_number} | Match No: {match.match_number}</p>}


        <form onSubmit={handleSubmit} className="space-y-5">
          {error && <p className="text-sm text-red-600 bg-red-100 p-3 rounded-md border border-red-300">{error}</p>}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="score1" className="block text-sm font-medium text-slate-600 mb-1">
                Score ({participant1.name})
              </label>
              <input
                type="number"
                name="score1"
                id="score1"
                value={score1}
                onChange={(e) => setScore1(e.target.value)}
                min="0"
                className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition-colors"
                placeholder="e.g., 10"
              />
            </div>
            <div>
              <label htmlFor="score2" className="block text-sm font-medium text-slate-600 mb-1">
                Score ({participant2.name})
              </label>
              <input
                type="number"
                name="score2"
                id="score2"
                value={score2}
                onChange={(e) => setScore2(e.target.value)}
                min="0"
                className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition-colors"
                placeholder="e.g., 8"
              />
            </div>
          </div>

          <div>
            <label htmlFor="winnerId" className="block text-sm font-medium text-slate-600 mb-1">
              Winner <span className="text-xs text-slate-400">(Optional - auto-set if scores differ)</span>
            </label>
            <select
              name="winnerId"
              id="winnerId"
              value={winnerId}
              onChange={(e) => setWinnerId(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-slate-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition-colors"
            >
              <option value="">-- Auto / Select if Tied --</option>
              <option value={participant1.id}>{participant1.name}</option>
              <option value={participant2.id}>{participant2.name}</option>
            </select>
             <p className="text-xs text-slate-500 mt-1">Select a winner if scores are tied or to override auto-detection.</p>
          </div>

          <div className="mt-6 flex flex-col sm:flex-row-reverse sm:items-center sm:justify-start gap-3 pt-2">
            <button
              type="submit"
              className="w-full sm:w-auto inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:text-sm transition-colors"
            >
              Save Result
            </button>
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto mt-3 sm:mt-0 inline-flex justify-center rounded-md border border-slate-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:text-sm transition-colors"
            >
              Save Result
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default RecordResultModal;
