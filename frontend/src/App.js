import React, { useState, useEffect, useCallback } from 'react';
import { Routes, Route, Link, useNavigate, useLocation, Navigate, useParams } from 'react-router-dom';
import './App.css';
import TournamentList from './components/TournamentList';
import TournamentForm from './components/TournamentForm';
import TournamentDetail from './components/TournamentDetail';
import LoginPage from './components/LoginPage';
import RegisterPage from './components/RegisterPage';
import JoinTournamentPage from './components/JoinTournamentPage';
import ThemeToggle from './components/ThemeToggle';
import * as api from './services/api';

// Wrapper for TournamentDetail to fetch data if accessed directly by URL
function TournamentDetailWrapper({ currentUser, globalSetIsLoading, globalSetError, globalIsLoading }) {
  const { tournamentId } = useParams();
  const navigate = useNavigate();
  const [tournament, setTournament] = useState(null);
  const [isLoading, setIsLoading] = useState(true); // Local loading state for this wrapper

  const fetchTournament = useCallback(async () => {
    if (tournamentId) {
      setIsLoading(true);
      try {
        const data = await api.getTournamentById(tournamentId);
        setTournament(data);
      } catch (err) {
        console.error("Failed to fetch tournament details:", err);
        globalSetError(err.message || `Failed to fetch tournament ${tournamentId}`);
        setTournament(null);
      } finally {
        setIsLoading(false);
      }
    }
  }, [tournamentId, globalSetError]);

  useEffect(() => {
    fetchTournament();
  }, [fetchTournament]);

  if (isLoading) {
    return <p className="text-center py-10">Loading tournament details...</p>;
  }

  if (!tournament) {
    return (
        <div className="text-center p-10 bg-white dark:bg-gray-800 shadow-lg rounded-lg max-w-md mx-auto mt-10">
            <h2 className="text-2xl font-semibold text-red-600 dark:text-red-400 mb-4">Tournament Not Found</h2>
            <p className="text-slate-700 dark:text-slate-300 mb-6">
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
      refetchTournament={fetchTournament} // Pass down the refetch function
      onBackToList={() => navigate('/tournaments')}
      globalIsLoading={globalIsLoading}
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
  };

  return (
    <>
      {isLoading && <p className="text-indigo-500 dark:text-indigo-400 text-center py-4">Loading tournaments...</p>}

      {currentUser && !isLoading && !error && !showCreateForm && (
        <div className="mb-6">
          <button
            onClick={() => { setShowCreateForm(true); setEditingTournament(null); }}
            className="px-5 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-700 focus:ring-opacity-50 transition ease-in-out duration-150 shadow-sm"
          >
            Create New Tournament
          </button>
        </div>
      )}

      {currentUser && showCreateForm && (
        <TournamentForm
          onSubmit={editingTournament ? onUpdateTournamentSubmit : onCreateTournamentSubmit}
          initialData={editingTournament}
          onCancel={handleCancelForm}
        />
      )}

      {!isLoading && !error && tournaments.length === 0 && !showCreateForm && (
         <p className="text-gray-600 dark:text-gray-400 text-center py-4">No tournaments available. Click "Create New Tournament" to get started!</p>
      )}

      {!isLoading && !error && tournaments.length > 0 && !showCreateForm && (
        <TournamentList
          tournaments={tournaments}
          onEdit={onEditTournament}
          onDelete={onDeleteTournament}
          onView={handleViewTournament}
        />
      )}
    </>
  );
}


function App() {
  const [tournaments, setTournaments] = useState([]);
  const [appIsLoading, setAppIsLoading] = useState(false);
  const [appError, setAppError] = useState(null);

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingTournament, setEditingTournament] = useState(null);

  const [currentUser, setCurrentUser] = useState(null);
  const [authError, setAuthError] = useState(null);
  const [isAuthLoading, setIsAuthLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();

  // Handle Google OAuth callback
  useEffect(() => {
    const processAuthCallback = async () => {
      if (location.pathname === '/auth/callback') {
        const params = new URLSearchParams(location.search);
        const token = params.get('token');
        if (token) {
          localStorage.setItem('authToken', token);
          try {
            const userDetails = await api.getCurrentUserDetails();
            setCurrentUser(userDetails);
            const postLoginRedirect = localStorage.getItem('postLoginRedirect') || '/tournaments';
            localStorage.removeItem('postLoginRedirect');
            navigate(postLoginRedirect);
          } catch (err) {
            setAuthError("Failed to fetch user details after Google login.");
            localStorage.removeItem('authToken');
            setCurrentUser(null);
            navigate("/login");
          }
        } else {
          setAuthError("Failed to login with Google (token missing).");
          navigate("/login");
        }
      }
    };
    processAuthCallback();
  }, [location, navigate]);

  // Check for token on initial load
  useEffect(() => {
    const verifyTokenAndFetchUser = async () => {
      const token = localStorage.getItem('authToken');
      if (token) {
        try {
          const userDetails = await api.getCurrentUserDetails();
          setCurrentUser(userDetails);
        } catch (error) {
          console.error("Token validation failed:", error);
          localStorage.removeItem('authToken');
          setCurrentUser(null);
        }
      }
      setIsInitializing(false);
    };
    verifyTokenAndFetchUser();
  }, []);

  const handleLogin = async (email, password) => {
    setIsAuthLoading(true);
    setAuthError(null);
    try {
      const loginData = await api.loginUser(email, password);
      localStorage.setItem('authToken', loginData.access_token);
      const userDetails = await api.getCurrentUserDetails();
      setCurrentUser(userDetails);
      const postLoginRedirect = localStorage.getItem('postLoginRedirect') || '/tournaments';
      localStorage.removeItem('postLoginRedirect');
      navigate(postLoginRedirect);
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
      const loginData = await api.loginUser(userData.email, userData.password);
      localStorage.setItem('authToken', loginData.access_token);
      const userDetails = await api.getCurrentUserDetails();
      setCurrentUser(userDetails);
      const postLoginRedirect = localStorage.getItem('postLoginRedirect') || '/tournaments';
      localStorage.removeItem('postLoginRedirect');
      navigate(postLoginRedirect);
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
    } finally {
      setAppIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (currentUser && (location.pathname === '/tournaments' || location.pathname === '/')) {
        fetchTournaments();
    } else if (!currentUser && (location.pathname === '/tournaments' || location.pathname === '/')) {
        setTournaments([]);
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
      setShowCreateForm(true);
    }
  };

  const handleUpdateTournamentSubmit = async (tournamentData) => {
    if (!editingTournament || !editingTournament.id) return;
    setAppIsLoading(true);
    setAppError(null);
    try {
      await api.updateTournament(editingTournament.id, tournamentData);
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

  const ProtectedRoute = ({ children }) => {
    if (isInitializing) {
      return <p className="text-center py-10">Initializing app...</p>;
    }
    if (!currentUser) {
      localStorage.setItem('postLoginRedirect', location.pathname + location.search);
      return <Navigate to="/login" replace />;
    }
    return children;
  };

  const AuthRoute = ({ children }) => {
     if (isInitializing) {
      return <p className="text-center py-10">Initializing app...</p>;
    }
    if (currentUser && !isAuthLoading) {
      const postLoginRedirect = localStorage.getItem('postLoginRedirect') || "/tournaments";
      return <Navigate to={postLoginRedirect} replace />;
    }
    return children;
  };


  if (isInitializing && location.pathname !== '/auth/callback') {
    return <p className="text-center py-10">Initializing app...</p>;
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200 font-sans">
      <header className="bg-white dark:bg-gray-800 shadow-md sticky top-0 z-10">
        <div className="container mx-auto flex justify-between items-center p-4">
          <Link to="/" className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">MatchPoint</Link>
          
          <div className="hidden sm:flex items-center space-x-4">
            <ThemeToggle />
            {currentUser ? (
              <>
                <span className="text-gray-700 dark:text-gray-300">Welcome, {currentUser.name || currentUser.email}</span>
                <button
                  onClick={handleLogout}
                  className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded-lg focus:outline-none focus:shadow-outline"
                >
                  Logout
                </button>
              </>
            ) : (
              location.pathname !== '/login' && location.pathname !== '/register' && (
                <>
                  <Link to="/login" className="hover:text-indigo-600 dark:hover:text-indigo-400">Login</Link>
                  <Link to="/register" className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-lg">Register</Link>
                </>
              )
            )}
          </div>

          <div className="sm:hidden flex items-center">
            <ThemeToggle />
            <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="ml-4 p-2 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16m-7 6h7"></path></svg>
            </button>
          </div>
        </div>

        {isMenuOpen && (
          <div className="sm:hidden bg-white dark:bg-gray-800">
            <div className="flex flex-col items-center space-y-4 py-4">
              {currentUser ? (
                <>
                  <span className="text-gray-700 dark:text-gray-300">Welcome, {currentUser.name || currentUser.email}</span>
                  <button
                    onClick={() => { handleLogout(); setIsMenuOpen(false); }}
                    className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded-lg w-full max-w-xs"
                  >
                    Logout
                  </button>
                </>
              ) : (
                location.pathname !== '/login' && location.pathname !== '/register' && (
                  <>
                    <Link to="/login" onClick={() => setIsMenuOpen(false)} className="hover:text-indigo-600 dark:hover:text-indigo-400 w-full text-center py-2">Login</Link>
                    <Link to="/register" onClick={() => setIsMenuOpen(false)} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-lg w-full max-w-xs text-center">Register</Link>
                  </>
                )
              )}
            </div>
          </div>
        )}
      </header>

      <main className="p-4 sm:p-6">
        <div className="container mx-auto max-w-5xl">
          {appError && (
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
                onLoginRequired={() => navigate('/login')}
              />
            } />
             <Route path="/tournaments" element={
              <ProtectedRoute>
                <MainPage
                  tournaments={tournaments}
                  isLoading={appIsLoading}
                  error={appError}
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
            <Route path="/auth/callback" element={ <p>Processing login...</p> } />
            <Route path="/" element={<Navigate to="/tournaments" replace />} />
            <Route path="*" element={ 
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

      <footer className="bg-gray-200 dark:bg-gray-800 text-gray-600 dark:text-gray-400 p-6 text-center text-sm mt-12">
        <p>&copy; {new Date().getFullYear()} MatchPoint. All rights reserved.</p>
      </footer>
    </div>
  );
}

export default App;
