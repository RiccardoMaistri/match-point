import React, { useState, useEffect, useCallback } from 'react';
import * as api from '../services/api';
import ParticipantList from './ParticipantList';
import ParticipantForm from './ParticipantForm';
import MatchList from './MatchList';
import RecordResultModal from './RecordResultModal'; // Importa il modale

function TournamentDetail({ tournament, onBackToList, globalIsLoading, globalSetIsLoading, globalSetError }) {
  const [participants, setParticipants] = useState([]);
  const [matches, setMatches] = useState([]);
  const [showParticipantForm, setShowParticipantForm] = useState(false);

  // Stati per il modale di inserimento risultati
  const [isResultModalOpen, setIsResultModalOpen] = useState(false);
  const [currentMatchForResult, setCurrentMatchForResult] = useState(null);


  const fetchParticipantsAndMatches = useCallback(async () => {
    if (!tournament?.id) return;
    globalSetIsLoading(true); // Loading generale per il dettaglio
    globalSetError(null);
    try {
      // Carica partecipanti e match in parallelo se possibile, o sequenzialmente
      const participantsData = await api.getTournamentParticipants(tournament.id);
      setParticipants(participantsData);

      // Determina quale endpoint chiamare per i match in base al formato del torneo
      let matchesData = [];
      if (tournament.format === 'elimination') {
        // Potremmo avere un endpoint /bracket che restituisce i match formattati o solo i match
        // Per ora usiamo getTournamentMatches come da API backend, che dovrebbe restituire List[Match]
        matchesData = await api.getTournamentMatches(tournament.id);
      } else if (tournament.format === 'round_robin') {
        matchesData = await api.getTournamentMatches(tournament.id);
      }
      // Se l'API backend avesse endpoint /bracket e /schedule che restituiscono direttamente i match:
      // matchesData = tournament.format === 'elimination'
      //    ? await api.getTournamentBracket(tournament.id)
      //    : await api.getTournamentSchedule(tournament.id);
      // Ma dato che getTournamentBracket/Schedule in main.py restituiscono {tournament_id, name, matches},
      // dovremmo accedere a matchesData.matches. Per semplicità, usiamo getTournamentMatches.

      setMatches(matchesData || []); // Assicura che sia un array
    } catch (err) {
      globalSetError(err.message || `Failed to fetch details for tournament ${tournament.name}`);
      console.error(err);
    } finally {
      globalSetIsLoading(false);
    }
  }, [tournament?.id, tournament?.name, tournament?.format, globalSetIsLoading, globalSetError]); // Aggiunto tournament.format

  useEffect(() => {
    if (tournament?.id) { // Assicurati che ci sia un torneo prima di fetchare
        fetchParticipantsAndMatches();
    }
  }, [fetchParticipantsAndMatches, tournament?.id]); // Aggiunto tournament.id come dipendenza

  const handleAddParticipant = async (tournamentId, participantData) => {
    globalSetIsLoading(true);
    globalSetError(null);
    try {
      await api.addParticipantToTournament(tournamentId, participantData);
      await fetchParticipantsAndMatches(); // Ricarica partecipanti (e potenzialmente match se la logica dipendesse dal numero)
      setShowParticipantForm(false);
    } catch (err) {
      globalSetError(err.message || 'Failed to add participant');
      console.error(err);
    } finally {
      globalSetIsLoading(false);
    }
  };

  const handleRemoveParticipant = async (tournamentId, participantId) => {
    if (!window.confirm('Are you sure you want to remove this participant?')) {
      return;
    }
    globalSetIsLoading(true);
    globalSetError(null);
    try {
      await api.removeParticipantFromTournament(tournamentId, participantId);
      await fetchParticipantsAndMatches(); // Ricarica
    } catch (err) {
      globalSetError(err.message || 'Failed to remove participant');
      console.error(err);
    } finally {
      globalSetIsLoading(false);
    }
  };

  const handleGenerateMatches = async () => {
    if (!tournament?.id) return;
    if (!window.confirm('Are you sure you want to generate/regenerate matches? This might overwrite existing matches.')) {
        return;
    }
    globalSetIsLoading(true);
    globalSetError(null);
    try {
        const result = await api.generateMatches(tournament.id);
        alert(result.message || "Matches generated successfully!");
        await fetchParticipantsAndMatches(); // Ricarica per vedere i nuovi match
    } catch (err) {
        globalSetError(err.message || 'Failed to generate matches');
        console.error(err);
    } finally {
        globalSetIsLoading(false);
    }
  };

  const openRecordResultModal = (matchId) => {
    const matchToRecord = matches.find(m => m.id === matchId);
    if (matchToRecord) {
      setCurrentMatchForResult(matchToRecord);
      setIsResultModalOpen(true);
      globalSetError(null); // Pulisce errori precedenti
    }
  };

  const closeRecordResultModal = () => {
    setIsResultModalOpen(false);
    setCurrentMatchForResult(null);
  };

  const handleSubmitMatchResult = async (tournamentId, matchId, resultData) => {
    globalSetIsLoading(true);
    globalSetError(null);
    try {
      await api.recordMatchResult(tournamentId, matchId, resultData);
      await fetchParticipantsAndMatches(); // Ricarica i dati
      closeRecordResultModal();
      alert('Match result recorded successfully!');
    } catch (err) {
      // L'errore specifico dell'API dovrebbe essere mostrato nel modale o globalmente.
      // Per ora, lo impostiamo globalmente, ma potrebbe essere passato al modale.
      globalSetError(err.message || 'Failed to record match result.');
      console.error(err);
      // Non chiudere il modale in caso di errore, così l'utente può vedere il problema
    } finally {
      globalSetIsLoading(false);
    }
  };


  if (!tournament) {
    // Questo caso dovrebbe essere gestito da App.js, ma per sicurezza:
    return (
        <div className="bg-white p-6 rounded-lg shadow-xl text-center">
            <p className="text-lg text-slate-700">Tournament data is not available or not selected.</p>
            <button
                onClick={onBackToList}
                className="mt-4 px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 transition-colors"
            >
                &larr; Back to Tournaments List
            </button>
        </div>
    );
  }

  const canManageParticipants = tournament.registration_open;
  // La generazione dei match potrebbe essere permessa anche se la registrazione è chiusa,
  // ma non se il torneo è già iniziato o completato (logica più avanzata non implementata qui).
  // Per ora, permettiamo la generazione se ci sono partecipanti.
  const canGenerateMatches = participants.length >= 2;


  return (
    <div className="bg-slate-50 p-4 sm:p-6 rounded-xl shadow-2xl space-y-8 border border-slate-200">
      {/* Tournament Info Header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
        <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-indigo-700 leading-tight">{tournament.name}</h2>
            <p className="text-xs text-slate-500">ID: {tournament.id}</p>
        </div>
        <button
          onClick={onBackToList}
          className="self-start sm:self-center px-4 py-2 text-sm font-medium text-indigo-700 bg-indigo-100 rounded-lg hover:bg-indigo-200 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          &larr; Back to List
        </button>
      </div>

      {/* Tournament Details Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-4 text-sm p-4 bg-white rounded-lg shadow border border-slate-100">
        <div><strong className="text-slate-600">Type:</strong> <span className="text-slate-800 capitalize">{tournament.tournament_type}</span></div>
        <div><strong className="text-slate-600">Format:</strong> <span className="text-slate-800 capitalize">{tournament.format.replace('_', ' ')}</span></div>
        <div>
            <strong className="text-slate-600">Status:</strong>
            <span className={`ml-1 px-2 py-0.5 text-xs rounded-full font-semibold ${tournament.registration_open ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                {tournament.registration_open ? 'Registration Open' : 'Registration Closed'}
            </span>
        </div>
        {tournament.start_date && (
          <div><strong className="text-slate-600">Date:</strong> <span className="text-slate-800">{new Date(tournament.start_date).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</span></div>
        )}
        {tournament.invitation_link && (
            <div className="sm:col-span-2 md:col-span-3"><strong className="text-slate-600">Invitation Link:</strong> <a href={tournament.invitation_link} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:text-indigo-800 hover:underline break-all">{tournament.invitation_link}</a></div>
        )}
      </div>

      {/* Global Loading/Error for this detail view can be shown here if needed */}
      {globalIsLoading && (!participants.length && !matches.length) && <p className="text-center text-indigo-600 py-4">Loading tournament details...</p>}
      {/* globalSetError è gestito in App.js per errori globali, ma potremmo mostrare errori specifici qui */}


      {/* Participant Management Section */}
      <div className="p-4 sm:p-5 bg-white rounded-lg shadow border border-slate-100 space-y-4">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
            <h3 className="text-xl font-semibold text-slate-800">Participants</h3>
            {!showParticipantForm && canManageParticipants && (
                <button
                onClick={() => setShowParticipantForm(true)}
                className="self-start sm:self-auto px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 transition-colors focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                + Add Participant
                </button>
            )}
        </div>

        {showParticipantForm && canManageParticipants && (
          <ParticipantForm
            tournamentId={tournament.id}
            onSubmit={handleAddParticipant}
            onCancel={() => { setShowParticipantForm(false); globalSetError(null);}}
            existingParticipants={participants}
          />
        )}
        {!canManageParticipants && <p className="text-sm text-orange-600 bg-orange-50 p-3 rounded-md border border-orange-200">Registration for this tournament is closed. Participants cannot be added or removed at this time.</p>}

        <ParticipantList
          participants={participants}
          tournamentId={tournament.id}
          onRemoveParticipant={canManageParticipants ? handleRemoveParticipant : null} // Passa null se non si può rimuovere
        />
      </div>


      {/* Match Management Section */}
      <div className="p-4 sm:p-5 bg-white rounded-lg shadow border border-slate-100 space-y-4">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
            <h3 className="text-xl font-semibold text-slate-800">Matches / {tournament.format === 'elimination' ? 'Bracket' : 'Schedule'}</h3>
            {canGenerateMatches && (
                 <button
                    onClick={handleGenerateMatches}
                    disabled={globalIsLoading} // Disabilita durante caricamenti globali
                    className="self-start sm:self-auto px-4 py-2 text-sm font-medium text-white bg-cyan-600 rounded-md hover:bg-cyan-700 disabled:bg-slate-400 transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-500"
                >
                    {globalIsLoading ? 'Processing...' : (matches.length > 0 ? 'Regenerate Matches' : 'Generate Matches')}
                </button>
            )}
        </div>
        {!canGenerateMatches && participants.length < 2 && <p className="text-sm text-slate-500 italic">At least 2 participants are needed to generate matches.</p>}

        <MatchList
            matches={matches}
            participants={participants}
            onRecordResult={(tId, mId) => openRecordResultModal(mId)}
            tournamentId={tournament.id}
            tournamentFormat={tournament.format}
        />
      </div>

      {isResultModalOpen && currentMatchForResult && (
        <RecordResultModal
          isOpen={isResultModalOpen}
          onClose={closeRecordResultModal}
          match={currentMatchForResult}
          participants={participants}
          onSubmitResult={handleSubmitMatchResult}
          tournamentId={tournament.id}
        />
      )}
    </div>
  );
}

export default TournamentDetail;
