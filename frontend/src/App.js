import React, { useState, useEffect, useCallback } from 'react';
import './App.css';
import TournamentList from './components/TournamentList';
import TournamentForm from './components/TournamentForm';
import TournamentDetail from './components/TournamentDetail'; // Importa il nuovo componente
import LoginPage from './components/LoginPage'; // Auth component
import RegisterPage from './components/RegisterPage'; // Auth component
import * as api from './services/api';

function App() {
  const [tournaments, setTournaments] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Stati per la gestione della UI
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingTournament, setEditingTournament] = useState(null);
  const [selectedTournament, setSelectedTournament] = useState(null); // Per mostrare i dettagli

  // --- Authentication State ---
  const [currentUser, setCurrentUser] = useState(null); // Store user info (or token)
  const [authError, setAuthError] = useState(null);
  const [isAuthLoading, setIsAuthLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true); // New state for initial load
  // --- End Authentication State ---

  // Simple router based on pathname
  let route = window.location.pathname;
  // Handle callback from Google OAuth
  if (route.startsWith('/auth/callback')) {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    if (token) {
      localStorage.setItem('authToken', token);
      // TODO: Decode token to get user info or fetch from a /me endpoint
      setCurrentUser({ token }); // Placeholder for user object
      window.history.replaceState({}, document.title, "/"); // Clean URL
      route = "/"; // Redirect to home/dashboard
    } else {
      // Handle error from Google OAuth
      setAuthError("Failed to login with Google.");
      window.history.replaceState({}, document.title, "/login");
      route = "/login";
    }
  }

  // Check for token on initial load
  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (token) {
      // TODO: Validate token with a /users/me endpoint or decode it
      // For now, just assume token means logged in
      setCurrentUser({ token }); // Replace with actual user object later
    }
    setIsInitializing(false); // Set initializing to false after token check
  }, []);

  const handleLogin = async (email, password) => {
    setIsAuthLoading(true);
    setAuthError(null);
    try {
      const data = await api.loginUser(email, password);
      localStorage.setItem('authToken', data.access_token);
      // TODO: Fetch user details from a /users/me endpoint or decode token
      setCurrentUser({ token: data.access_token, email }); // Placeholder
      window.location.href = '/tournaments'; // Redirect to tournaments
    } catch (err) {
      setAuthError(err.message || 'Failed to login');
      setCurrentUser(null);
      localStorage.removeItem('authToken');
    } finally {
      setIsAuthLoading(false);
    }
  };

  const handleRegister = async (userData) => {
    setIsAuthLoading(true);
    setAuthError(null);
    try {
      await api.registerUser(userData);
      // After successful registration, log the user in automatically
      await handleLogin(userData.email, userData.password);
    } catch (err) {
      setAuthError(err.message || 'Failed to register');
      setCurrentUser(null);
      localStorage.removeItem('authToken'); // Ensure no stale token
    } finally {
      setIsAuthLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    // Redirect to backend Google login endpoint
    window.location.href = `${api.API_BASE_URL}/login/google`;
  };

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    setCurrentUser(null);
    // Redirect to login page or home page after logout
    window.location.href = '/login'; // Or '/' if you prefer home
  };


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
    // Handle auth routes first
    if (route === '/login') {
      return <LoginPage onLogin={handleLogin} onGoogleLogin={handleGoogleLogin} error={authError} isLoading={isAuthLoading} />;
    }
    if (route === '/register') {
      return <RegisterPage onRegister={handleRegister} error={authError} isLoading={isAuthLoading} />;
    }

    // If still initializing, show a loading message or spinner
    if (isInitializing) {
      return <p className="text-center py-10">Initializing app...</p>;
    }

    // If not an auth route, and not initializing, proceed with tournament content
    if (!currentUser && route !== '/login' && route !== '/register' && !route.startsWith('/auth/callback')) {
      // If trying to access a protected route without being logged in,
      // and it's not an auth page itself, redirect to login.
      // We also allow /auth/callback for the Google OAuth flow.
      window.location.href = '/login';
      return <p>Redirecting to login...</p>; // Show a message while redirecting
    }

    if (selectedTournament) {
      // Ensure user is logged in to see tournament details (example of protection)
      // Or, details could be public, but actions within are protected.
      // For now, let's assume viewing details is fine, actions within will be checked later.
      return (
        <TournamentDetail
          tournament={selectedTournament}
          onBackToList={handleBackToListFromDetail}
          globalIsLoading={isLoading}
          globalSetIsLoading={setIsLoading}
          globalSetError={setError}
        />
      );
    }

    // Altrimenti, mostra la vista principale con lista/form tornei
    return (
      <>
        {isLoading && <p className="text-blue-500 text-center py-4">Loading tournaments...</p>}

        {currentUser && !isLoading && !error && !showCreateForm && (
          <button
            onClick={() => { setShowCreateForm(true); setEditingTournament(null); setSelectedTournament(null); }}
            className="mb-6 px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-700 focus:ring-opacity-50 transition ease-in-out duration-150"
          >
            Create New Tournament
          </button>
        )}

        {/* Ensure form is only shown if user is logged in and create button was clicked */}
        {currentUser && showCreateForm && (
          <div className="mb-6 bg-white p-6 rounded-lg shadow-lg">
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
      <header className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white p-6 shadow-xl">
        <div className="container mx-auto flex justify-between items-center">
          <a href="/" className="text-3xl font-bold tracking-tight hover:text-gray-200">Tournament Manager</a>
          <div>
            {currentUser ? (
              <>
                {/* Optional: Display user email or name */}
                {/* <span className="mr-4">Welcome, {currentUser.email || 'User'}!</span> */}
                <button
                  onClick={handleLogout}
                  className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                >
                  Logout
                </button>
              </>
            ) : (
              <div>
                <a href="/login" className="text-white hover:text-gray-200 mr-4">Login</a>
                <a href="/register" className="text-white hover:text-gray-200">Register</a>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="p-4 md:p-6">
        <div className="container mx-auto max-w-4xl">
          {error && !selectedTournament && !route.startsWith('/login') && !route.startsWith('/register') && (
            // Show global app error only if not on auth pages and not in tournament detail
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
