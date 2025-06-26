import React, { useState, useEffect, useCallback } from 'react';
import './App.css';
import TournamentList from './components/TournamentList';
import TournamentForm from './components/TournamentForm';
import TournamentDetail from './components/TournamentDetail';
import LoginPage from './components/LoginPage';
import RegistrationPage from './components/RegistrationPage';
import * as api from './services/api';

function App() {
  const [tournaments, setTournaments] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Auth state
  const [currentUser, setCurrentUser] = useState(null);
  const [authError, setAuthError] = useState('');
  const [currentView, setCurrentView] = useState('tournaments'); // 'tournaments', 'login', 'register'

  // Stati per la gestione della UI (tornei)
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingTournament, setEditingTournament] = useState(null);
  const [selectedTournament, setSelectedTournament] = useState(null);

  // Check for existing token on app load
  useEffect(() => {
    const checkLoggedInUser = async () => {
      const token = localStorage.getItem('accessToken');
      if (token) {
        try {
          setIsLoading(true);
          const user = await api.getCurrentUser(); // Fetch user details
          setCurrentUser(user);
          setCurrentView('tournaments');
        } catch (err) {
          localStorage.removeItem('accessToken'); // Invalid token
          setAuthError('Session expired. Please log in again.');
          setCurrentView('login');
        } finally {
          setIsLoading(false);
        }
      } else {
        setCurrentView('login'); // No token, show login page
      }
    };
    checkLoggedInUser();
  }, []);


  const fetchTournaments = useCallback(async () => {
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
    if (currentUser) { // Only fetch tournaments if a user is logged in
      fetchTournaments();
    }
  }, [fetchTournaments, currentUser]);

  const handleLoginSuccess = async (userData) => {
    // userData might just be {username} or a full user object depending on LoginPage
    try {
      setIsLoading(true);
      const user = await api.getCurrentUser(); // Fetch full user details after login
      setCurrentUser(user);
      setCurrentView('tournaments');
      setAuthError('');
      fetchTournaments(); // Fetch tournaments after successful login
    } catch (err) {
      setAuthError(err.message || 'Failed to fetch user details after login.');
      localStorage.removeItem('accessToken'); // Clear token if user fetch fails
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegistrationSuccess = (registeredUser) => {
    // After registration, typically redirect to login or auto-login
    setCurrentView('login'); // Redirect to login page
    // Optionally, display a success message
  };

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    setCurrentUser(null);
    setCurrentView('login');
    setTournaments([]); // Clear tournament data
    setAuthError('');
  };

  const handleCreateTournament = async (tournamentData) => {
    setIsLoading(true);
    setError(null);
    try {
      const newTournament = await api.createTournament(tournamentData);
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
    if (isLoading && !currentUser && currentView !== 'login' && currentView !== 'register') { // Initial loading before view is determined
      return <p className="text-blue-500 text-center py-4">Loading application...</p>;
    }

    if (currentView === 'login') {
      return (
        <LoginPage
          onLoginSuccess={handleLoginSuccess}
          onNavigateToRegister={() => setCurrentView('register')}
        />
      );
    }

    if (currentView === 'register') {
      return (
        <RegistrationPage
          onRegistrationSuccess={handleRegistrationSuccess}
          onNavigateToLogin={() => setCurrentView('login')}
        />
      );
    }

    if (!currentUser) {
      // Should ideally be covered by the redirect to login, but as a fallback:
      return <p className="text-red-500 text-center py-4">Please log in to continue.</p>;
    }

    // Logged-in user, viewing tournaments
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
    <div className="min-h-screen bg-gray-100 text-gray-800 font-sans">
      <header className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white p-6 shadow-xl flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">Tournament Manager</h1>
        {currentUser && (
          <div className="flex items-center">
            <span className="mr-4">Welcome, {currentUser.username || currentUser.email}</span>
            <button
              onClick={handleLogout}
              className="px-3 py-2 bg-red-500 text-white rounded hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-700"
            >
              Logout
            </button>
          </div>
        )}
      </header>

      <main className="p-4 md:p-6">
        <div className="container mx-auto max-w-4xl">
          {/* Global Auth Error Display */}
          {authError && currentView !== 'login' && currentView !== 'register' && (
             <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded-md shadow-md" role="alert">
               <p>{authError}</p>
             </div>
          )}
          {/* Tournament specific error (only if logged in and not in detail view) */}
          {currentUser && error && !selectedTournament && (
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

      <footer className="bg-gray-800 text-gray-300 p-6 text-center text-sm mt-12">
        <p>&copy; {new Date().getFullYear()} Tournament App. Crafted with React & FastAPI.</p>
      </footer>
    </div>
  );
}

export default App;
