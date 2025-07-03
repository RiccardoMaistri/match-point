import React, { useState, useEffect, useCallback } from 'react';
import { Routes, Route, Link, useNavigate, useLocation, Navigate, useParams } from 'react-router-dom';
import './App.css';
import TournamentList from './components/TournamentList';
import TournamentForm from './components/TournamentForm';
import TournamentDetail from './components/TournamentDetail';
import LoginPage from './components/LoginPage';
import RegisterPage from './components/RegisterPage';
import JoinTournamentPage from './components/JoinTournamentPage';
import * as api from './services/api';

// Wrapper for TournamentDetail to fetch data if accessed directly by URL
function TournamentDetailWrapper({ currentUser, globalSetIsLoading, globalSetError, globalIsLoading }) {
  const { tournamentId } = useParams();
  const navigate = useNavigate();
  const [tournament, setTournament] = useState(null);
  const [isLoading, setIsLoading] = useState(true); // Local loading state for this wrapper

  useEffect(() => {
    const fetchTournament = async () => {
      if (tournamentId) {
        setIsLoading(true);
        globalSetError(null); // Clear global errors before new fetch
        try {
          const data = await api.getTournamentById(tournamentId);
          setTournament(data);
        } catch (err) {
          console.error("Failed to fetch tournament details:", err);
          globalSetError(err.message || `Failed to fetch tournament ${tournamentId}`);
          setTournament(null); // Ensure tournament is null on error
        } finally {
          setIsLoading(false);
        }
      }
    };
    fetchTournament();
  }, [tournamentId, globalSetError]);

  if (isLoading) {
    return <p className="text-center py-10">Loading tournament details...</p>;
  }

  if (!tournament) {
     // Error is handled by globalSetError and displayed in App's main layout
     // Or show a specific message here if preferred
    return (
        <div className="text-center p-10 bg-white shadow-lg rounded-lg max-w-md mx-auto mt-10">
            <h2 className="text-2xl font-semibold text-red-600 mb-4">Tournament Not Found</h2>
            <p className="text-slate-700 mb-6">
                The tournament with ID <span className="font-mono">{tournamentId}</span> could not be found or loaded.
            </p>
            <button
                onClick={() => navigate('/tournaments')}
                className="mt-4 px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 transition-colors"
            >
                &larr; Back to Tournaments List
            </button>
        </div>
    );
  }

  return (
    <TournamentDetail
      tournament={tournament}
      onBackToList={() => navigate('/tournaments')}
      globalIsLoading={globalIsLoading} // This might be overall app loading
      globalSetIsLoading={globalSetIsLoading}
      globalSetError={globalSetError}
      currentUser={currentUser}
    />
  );
}


// Component to handle the main tournament view (list, create/edit form)
function MainPage({
  tournaments,
  isLoading,
  error,
  currentUser,
  fetchTournaments,
  onEditTournament,
  onDeleteTournament,
  onCreateTournamentSubmit,
  onUpdateTournamentSubmit,
  editingTournament,
  showCreateForm,
  setShowCreateForm,
  setEditingTournament
}) {
  const navigate = useNavigate();

  const handleViewTournament = (tournamentId) => {
    navigate(`/tournaments/${tournamentId}`);
  };

  const handleCancelForm = () => {
    setShowCreateForm(false);
    setEditingTournament(null);
    // Optionally clear error related to form if needed
  };

  return (
    <>
      {isLoading && <p className="text-blue-500 text-center py-4">Loading tournaments...</p>}
      {/* Error is displayed globally in App component */}

      {currentUser && !isLoading && !error && !showCreateForm && (
        <button
          onClick={() => { setShowCreateForm(true); setEditingTournament(null); }}
          className="mb-6 px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-700 focus:ring-opacity-50 transition ease-in-out duration-150"
        >
          Create New Tournament
        </button>
      )}

      {currentUser && showCreateForm && (
        <div className="mb-6 bg-white p-6 rounded-lg shadow-lg">
          <TournamentForm
            onSubmit={editingTournament ? onUpdateTournamentSubmit : onCreateTournamentSubmit}
            initialData={editingTournament}
            onCancel={handleCancelForm}
          />
        </div>
      )}

      {!isLoading && !error && tournaments.length === 0 && !showCreateForm && (
         <p className="text-gray-600 text-center py-4">No tournaments available. Click "Create New Tournament" to get started!</p>
      )}

      {!isLoading && !error && tournaments.length > 0 && !showCreateForm && (
        <TournamentList
          tournaments={tournaments}
          onEdit={onEditTournament} // This will set editingTournament and showCreateForm
          onDelete={onDeleteTournament}
          onView={handleViewTournament} // Navigates to detail page
        />
      )}
    </>
  );
}


function App() {
  const [tournaments, setTournaments] = useState([]);
  const [appIsLoading, setAppIsLoading] = useState(false); // Global loading state
  const [appError, setAppError] = useState(null); // Global error state

  // UI states for form visibility, previously in App, now more localized or passed to MainPage
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingTournament, setEditingTournament] = useState(null);

  const [currentUser, setCurrentUser] = useState(null);
  const [authError, setAuthError] = useState(null);
  const [isAuthLoading, setIsAuthLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);

  const navigate = useNavigate();
  const location = useLocation();

  // Handle Google OAuth callback
  useEffect(() => {
    if (location.pathname === '/auth/callback') {
      const params = new URLSearchParams(location.search);
      const token = params.get('token');
      if (token) {
        localStorage.setItem('authToken', token);
        // TODO: Decode token or fetch /me
        setCurrentUser({ token }); // Placeholder
        navigate("/"); // Redirect to home/dashboard after storing token
      } else {
        setAuthError("Failed to login with Google.");
        navigate("/login"); // Redirect to login on error
      }
    }
  }, [location, navigate]);

  // Check for token on initial load
  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (token) {
      // TODO: Validate token with a /users/me endpoint or decode it
      setCurrentUser({ token }); // Replace with actual user object later
    }
    setIsInitializing(false);
  }, []);

  const handleLogin = async (email, password) => {
    setIsAuthLoading(true);
    setAuthError(null);
    try {
      const data = await api.loginUser(email, password);
      localStorage.setItem('authToken', data.access_token);
      setCurrentUser({ token: data.access_token, email });

      const postLoginRedirect = localStorage.getItem('postLoginRedirect');
      if (postLoginRedirect) {
        localStorage.removeItem('postLoginRedirect');
        navigate(postLoginRedirect);
      } else {
        navigate('/tournaments');
      }
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
      const registeredUser = await api.registerUser(userData);
      const loginData = await api.loginUser(userData.email, userData.password);
      localStorage.setItem('authToken', loginData.access_token);
      setCurrentUser({ token: loginData.access_token, email: registeredUser.email });

      const postLoginRedirect = localStorage.getItem('postLoginRedirect');
      if (postLoginRedirect) {
        localStorage.removeItem('postLoginRedirect');
        navigate(postLoginRedirect);
      } else {
        navigate('/tournaments');
      }
    } catch (err) {
      setAuthError(err.message || 'Failed to register');
      setCurrentUser(null);
      localStorage.removeItem('authToken');
    } finally {
      setIsAuthLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    window.location.href = `${api.API_BASE_URL}/login/google`;
  };

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('postLoginRedirect');
    localStorage.removeItem('postLoginAction');
    setCurrentUser(null);
    navigate('/login');
  };

  const fetchTournaments = useCallback(async () => {
    setAppIsLoading(true);
    setAppError(null);
    try {
      const data = await api.getTournaments();
      setTournaments(data);
    } catch (err) {
      setAppError(err.message || 'Failed to fetch tournaments');
      console.error(err);
    } finally {
      setAppIsLoading(false);
    }
  }, []);

  useEffect(() => {
    // Fetch tournaments if user is logged in and on a page that needs them
    // Or if tournaments are public and we are on the main list page.
    // For now, fetch if on /tournaments or /
    if (currentUser && (location.pathname === '/tournaments' || location.pathname === '/')) {
        fetchTournaments();
    } else if (!currentUser && (location.pathname === '/tournaments' || location.pathname === '/')) {
        // If tournaments can be public, fetch them. Otherwise, this might be guarded by ProtectedRoute.
        // For now, assuming they are fetched if on the path.
        // If list is protected, this useEffect should depend on currentUser.
        // fetchTournaments(); // Uncomment if list is public
        setTournaments([]); // Clear if not logged in and list is protected
    }
  }, [fetchTournaments, currentUser, location.pathname]);

  const handleCreateTournamentSubmit = async (tournamentData) => {
    setAppIsLoading(true);
    setAppError(null);
    try {
      await api.createTournament(tournamentData);
      await fetchTournaments();
      setShowCreateForm(false);
    } catch (err) {
      setAppError(err.message || 'Failed to create tournament');
    } finally {
      setAppIsLoading(false);
    }
  };

  const handleEditTournamentClick = (tournamentId) => {
    const tournamentToEdit = tournaments.find(t => t.id === tournamentId);
    if (tournamentToEdit) {
      setEditingTournament(tournamentToEdit);
      setShowCreateForm(true); // Show form for editing
      // No navigation needed here, form opens on the same page /tournaments
    }
  };

  const handleUpdateTournamentSubmit = async (tournamentData) => {
    if (!editingTournament || !editingTournament.id) return;
    setAppIsLoading(true);
    setAppError(null);
    try {
      const dataToUpdate = { ...editingTournament, ...tournamentData, id: editingTournament.id };
      await api.updateTournament(editingTournament.id, dataToUpdate);
      await fetchTournaments();
      setShowCreateForm(false);
      setEditingTournament(null);
    } catch (err) {
      setAppError(err.message || 'Failed to update tournament');
    } finally {
      setAppIsLoading(false);
    }
  };

  const handleDeleteTournament = async (tournamentId) => {
    if (!window.confirm('Are you sure you want to delete this tournament?')) {
      return;
    }
    setAppIsLoading(true);
    setAppError(null);
    try {
      await api.deleteTournament(tournamentId);
      await fetchTournaments();
    } catch (err) {
      setAppError(err.message || 'Failed to delete tournament');
    } finally {
      setAppIsLoading(false);
    }
  };

  // ProtectedRoute component
  const ProtectedRoute = ({ children }) => {
    if (isInitializing) {
      return <p className="text-center py-10">Initializing app...</p>;
    }
    if (!currentUser) {
      // Store the current location to redirect back after login
      localStorage.setItem('postLoginRedirect', location.pathname + location.search);
      return <Navigate to="/login" replace />;
    }
    return children;
  };

  const AuthRoute = ({ children }) => {
     if (isInitializing) {
      return <p className="text-center py-10">Initializing app...</p>;
    }
    if (currentUser && !isAuthLoading) { // If user is already logged in, redirect from login/register
      const postLoginRedirect = localStorage.getItem('postLoginRedirect');
      return <Navigate to={postLoginRedirect || "/tournaments"} replace />;
    }
    return children;
  };


  if (isInitializing && location.pathname !== '/auth/callback') { // Avoid flicker during auth callback
    return <p className="text-center py-10">Initializing app...</p>;
  }

  return (
    <div className="min-h-screen bg-gray-100 text-gray-800 font-sans">
      <header className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white p-6 shadow-xl">
        <div className="container mx-auto flex justify-between items-center">
          <Link to="/" className="text-3xl font-bold tracking-tight hover:text-gray-200">Tournament Manager</Link>
          <div>
            {currentUser ? (
              <>
                <button
                  onClick={handleLogout}
                  className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                >
                  Logout
                </button>
              </>
            ) : (
              location.pathname !== '/login' && location.pathname !== '/register' && (
                <div>
                  <Link to="/login" className="text-white hover:text-gray-200 mr-4">Login</Link>
                  <Link to="/register" className="text-white hover:text-gray-200">Register</Link>
                </div>
              )
            )}
          </div>
        </div>
      </header>

      <main className="p-4 md:p-6">
        <div className="container mx-auto max-w-4xl">
          {appError && ( // Display global errors here
            <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded-md shadow-md" role="alert">
              <div className="flex">
                <div className="py-1"><svg className="fill-current h-6 w-6 text-red-500 mr-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M2.93 17.07A10 10 0 1 1 17.07 2.93 10 10 0 0 1 2.93 17.07zM10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16zm-1-13h2v6h-2V5zm0 8h2v2h-2v-2z"/></svg></div>
                <div>
                  <p className="font-bold">Error</p>
                  <p className="text-sm">{appError}</p>
                </div>
              </div>
            </div>
          )}

          <Routes>
            <Route path="/login" element={
              <AuthRoute>
                <LoginPage onLogin={handleLogin} onGoogleLogin={handleGoogleLogin} error={authError} isLoading={isAuthLoading} />
              </AuthRoute>
            } />
            <Route path="/register" element={
              <AuthRoute>
                <RegisterPage onRegister={handleRegister} error={authError} isLoading={isAuthLoading} />
              </AuthRoute>
            } />
            <Route path="/join/:inviteCode" element={
              <JoinTournamentPage
                currentUser={currentUser}
                globalSetError={setAppError}
                globalSetIsLoading={setAppIsLoading}
                globalIsLoading={appIsLoading}
                onLoginRequired={() => {
                    localStorage.setItem('postLoginRedirect', location.pathname + location.search);
                    navigate('/login');
                }}
              />
            } />
             <Route path="/tournaments" element={
              <ProtectedRoute>
                <MainPage
                  tournaments={tournaments}
                  isLoading={appIsLoading}
                  error={appError} // Pass global error to MainPage if it needs to display contextually
                  currentUser={currentUser}
                  fetchTournaments={fetchTournaments}
                  onEditTournament={handleEditTournamentClick}
                  onDeleteTournament={handleDeleteTournament}
                  onCreateTournamentSubmit={handleCreateTournamentSubmit}
                  onUpdateTournamentSubmit={handleUpdateTournamentSubmit}
                  editingTournament={editingTournament}
                  showCreateForm={showCreateForm}
                  setShowCreateForm={setShowCreateForm}
                  setEditingTournament={setEditingTournament}
                />
              </ProtectedRoute>
            } />
            <Route path="/tournaments/:tournamentId" element={
              <ProtectedRoute>
                <TournamentDetailWrapper
                  currentUser={currentUser}
                  globalSetIsLoading={setAppIsLoading}
                  globalSetError={setAppError}
                  globalIsLoading={appIsLoading}
                />
              </ProtectedRoute>
            } />
            <Route path="/auth/callback" element={ <p>Processing login...</p> /* Path handled by useEffect */} />
            <Route path="/" element={<Navigate to="/tournaments" replace />} />
            <Route path="*" element={ // Fallback for unmatched routes
                <div className="text-center p-10">
                    <h1 className="text-3xl font-bold text-indigo-700 mb-4">404 - Page Not Found</h1>
                    <p className="text-slate-600">The page you are looking for does not exist.</p>
                    <Link to="/" className="mt-6 inline-block px-6 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700">
                        Go to Homepage
                    </Link>
                </div>
            } />
          </Routes>
        </div>
      </main>

      <footer className="bg-gray-800 text-gray-300 p-6 text-center text-sm mt-12">
        <p>&copy; {new Date().getFullYear()} Tournament App. Crafted with React & FastAPI.</p>
      </footer>
    </div>
  );
}

export default App;
