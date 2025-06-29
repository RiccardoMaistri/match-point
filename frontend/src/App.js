import React, { useState, useEffect, useCallback } from 'react';
import './App.css';
import TournamentList from './components/TournamentList';
import TournamentForm from './components/TournamentForm';
import TournamentDetail from './components/TournamentDetail'; // Importa il nuovo componente
import * as api from './services/api';

function App() {
  const [tournaments, setTournaments] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Stati per la gestione della UI
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingTournament, setEditingTournament] = useState(null);
  const [selectedTournament, setSelectedTournament] = useState(null); // Per mostrare i dettagli

  const fetchTournaments = useCallback(async () => {
    // Non impostare isLoading a true qui se selectedTournament è attivo,
    // perché il caricamento dei partecipanti ha il suo indicatore.
    if (!selectedTournament) setIsLoading(true);
    setError(null);
    try {
      const data = await api.getTournaments();
      setTournaments(data);
    } catch (err) {
      setError(err.message || 'Failed to fetch tournaments');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [selectedTournament]);

  useEffect(() => {
    fetchTournaments();
  }, [fetchTournaments]);

  const handleCreateTournament = async (tournamentData) => {
    setIsLoading(true);
    setError(null);
    try {
      await api.createTournament(tournamentData);
      // setTournaments(prev => [...prev, newTournament]); // Aggiungi subito alla lista
      await fetchTournaments(); // O ricarica la lista per consistenza
      setShowCreateForm(false); // Nascondi il form dopo la creazione
    } catch (err) {
      setError(err.message || 'Failed to create tournament');
      console.error(err);
      // Non nascondere il form in caso di errore, così l'utente può correggere
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditTournament = (tournamentId) => {
    const tournamentToEdit = tournaments.find(t => t.id === tournamentId);
    if (tournamentToEdit) {
      setEditingTournament(tournamentToEdit);
      setShowCreateForm(true); // Riusa lo stesso form per la modifica
    }
  };

  const handleUpdateTournament = async (tournamentData) => {
    if (!editingTournament || !editingTournament.id) return;
    setIsLoading(true);
    setError(null);
    try {
      // Assicurati che l'ID sia incluso nei dati per l'update se il backend lo richiede nel body
      // Il nostro endpoint PUT lo prende dal path, ma il body deve essere un Tournament completo
      const dataToUpdate = { ...editingTournament, ...tournamentData, id: editingTournament.id };
      await api.updateTournament(editingTournament.id, dataToUpdate);
      await fetchTournaments(); // Ricarica per consistenza
      setShowCreateForm(false);
      setEditingTournament(null);
    } catch (err) {
      setError(err.message || 'Failed to update tournament');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };


  const handleDeleteTournament = async (tournamentId) => {
    if (!window.confirm('Are you sure you want to delete this tournament?')) {
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      await api.deleteTournament(tournamentId);
      // setTournaments(prev => prev.filter(t => t.id !== tournamentId)); // Rimuovi subito dalla lista
      await fetchTournaments(); // O ricarica la lista per consistenza
    } catch (err) {
      setError(err.message || 'Failed to delete tournament');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewTournament = (tournamentId) => {
    const tournamentToView = tournaments.find(t => t.id === tournamentId);
    if (tournamentToView) {
      setSelectedTournament(tournamentToView);
      setShowCreateForm(false); // Nascondi altri form se aperti
      setEditingTournament(null);
      setError(null); // Pulisci errori globali precedenti
    }
  };

  const handleBackToListFromDetail = () => {
    setSelectedTournament(null);
    // Opzionale: ricarica i tornei se, per esempio, il numero di partecipanti
    // visualizzato nella lista principale dovesse cambiare dopo modifiche nel dettaglio.
    // fetchTournaments();
  };

  const handleCancelForm = () => {
    setShowCreateForm(false);
    setEditingTournament(null);
    setError(null);
  };

  // Funzione per renderizzare il contenuto principale (lista tornei o dettaglio)
  const renderMainContent = () => {
    if (selectedTournament) {
      return (
        <TournamentDetail
          tournament={selectedTournament}
          onBackToList={handleBackToListFromDetail}
          // Passiamo setIsLoading e setError a TournamentDetail per gestire stati di loading/error specifici
          // ai partecipanti, mantenendo App.js più pulito per gli stati globali della lista tornei.
          // TournamentDetail userà queste prop come globalSetIsLoading e globalSetError.
          globalIsLoading={isLoading}
          globalSetIsLoading={setIsLoading}
          globalSetError={setError}
        />
      );
    }

    // Altrimenti, mostra la vista principale con lista/form tornei
    return (
      <>
        {/* Questo isLoading è per la lista principale dei tornei */}
        {isLoading && <p className="text-blue-500 text-center py-4">Loading tournaments...</p>}

        {!isLoading && !error && !showCreateForm && (
          <button
            onClick={() => { setShowCreateForm(true); setEditingTournament(null); setSelectedTournament(null); }}
            className="mb-6 px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-700 focus:ring-opacity-50 transition ease-in-out duration-150"
          >
            Create New Tournament
          </button>
        )}

        {showCreateForm && (
          <div className="mb-6 bg-white p-6 rounded-lg shadow-lg"> {/* Stile aggiunto per il form */}
            <TournamentForm
              onSubmit={editingTournament ? handleUpdateTournament : handleCreateTournament}
              initialData={editingTournament}
              onCancel={handleCancelForm}
            />
          </div>
        )}

        {!isLoading && !error && tournaments.length === 0 && !showCreateForm && (
           <p className="text-gray-600 text-center py-4">No tournaments available. Click "Create New Tournament" to get started!</p>
        )}

        {/* Mostra la lista solo se non c'è un torneo selezionato e non si sta creando/editando */}
        {!isLoading && !error && tournaments.length > 0 && !showCreateForm && !selectedTournament && (
          <TournamentList
            tournaments={tournaments}
            onEdit={handleEditTournament}
            onDelete={handleDeleteTournament}
            onView={handleViewTournament}
          />
        )}
      </>
    );
  };


  return (
    <div className="min-h-screen bg-gray-100 text-gray-800 font-sans"> {/* Aggiunto font-sans */}
      <header className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white p-6 shadow-xl"> {/* Stili migliorati */}
        <h1 className="text-3xl font-bold text-center tracking-tight">Tournament Manager</h1>
      </header>

      <main className="p-4 md:p-6"> {/* Responsive padding */}
        <div className="container mx-auto max-w-4xl"> {/* Aumentato max-w per più spazio */}
          {error && !selectedTournament && ( // Mostra errore globale solo se non siamo in dettaglio (dettaglio gestisce i suoi)
            <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded-md shadow-md" role="alert">
              <div className="flex">
                <div className="py-1"><svg className="fill-current h-6 w-6 text-red-500 mr-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M2.93 17.07A10 10 0 1 1 17.07 2.93 10 10 0 0 1 2.93 17.07zM10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16zm-1-13h2v6h-2V5zm0 8h2v2h-2v-2z"/></svg></div>
                <div>
                  <p className="font-bold">Error</p>
                  <p className="text-sm">{error}</p>
                </div>
              </div>
            </div>
          )}

          {renderMainContent()}
        </div>
      </main>

      <footer className="bg-gray-800 text-gray-300 p-6 text-center text-sm mt-12"> {/* Stili migliorati */}
        <p>&copy; {new Date().getFullYear()} Tournament App. Crafted with React & FastAPI.</p>
      </footer>
    </div>
  );
}

export default App;
