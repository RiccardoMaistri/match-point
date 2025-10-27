import React, { useState, useEffect, useCallback } from 'react';
import { Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom';
import TournamentList from './components/TournamentList';
import TournamentForm from './components/TournamentForm';
import TournamentDetail from './components/TournamentDetail';
import LoginPage from './components/LoginPage';
import RegisterPage from './components/RegisterPage';
import JoinTournamentPage from './components/JoinTournamentPage';
import Header from './components/Header';
import BottomNav from './components/BottomNav';
import Standings from './components/Standings';
import Participants from './components/Participants';
import ConfirmModal from './components/ConfirmModal';
import InstallPrompt from './components/InstallPrompt';
import * as api from './services/api';

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
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, title: '', message: '', onConfirm: null });

  const navigate = useNavigate();
  const location = useLocation();

  // Check for token on initial load
  useEffect(() => {
    const verifyTokenAndFetchUser = async () => {
      console.log("App.js: Initializing app, checking token...");
      const token = localStorage.getItem('authToken');
      if (token) {
        console.log("App.js: Auth token found, verifying...");
        try {
          const userDetails = await api.getCurrentUserDetails();
          setCurrentUser(userDetails);
          console.log("App.js: Token valid, currentUser set:", userDetails);
        } catch (error) {
          console.error("App.js: Token validation failed:", error);
          localStorage.removeItem('authToken');
          setCurrentUser(null);
          console.log("App.js: Token invalid, currentUser set to null.");
        }
      } else {
        console.log("App.js: No auth token found, currentUser remains null.");
      }
      setIsInitializing(false);
      console.log("App.js: Initialization complete. isInitializing set to false.");
    };
    verifyTokenAndFetchUser();
  }, []);

  const handleLogin = async (usernameOrEmail, password) => {
    setIsAuthLoading(true);
    setAuthError(null);
    try {
      const loginData = await api.loginUser(usernameOrEmail, password);
      localStorage.setItem('authToken', loginData.access_token);
      const userDetails = await api.getCurrentUserDetails();
      setCurrentUser(userDetails);
      const postLoginRedirect = localStorage.getItem('postLoginRedirect') || '/';
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
      const postLoginRedirect = localStorage.getItem('postLoginRedirect') || '/';
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
      const sorted = data.sort((a, b) => {
        const dateA = new Date(a.start_date || 0);
        const dateB = new Date(b.start_date || 0);
        return dateB - dateA;
      });
      setTournaments(sorted);
    } catch (err) {
      setAppError(err.message || 'Failed to fetch tournaments');
    } finally {
      setAppIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (currentUser) {
        fetchTournaments();
    } else {
        setTournaments([]);
    }
  }, [fetchTournaments, currentUser]);

  const handleCreateTournamentSubmit = async (tournamentData) => {
    setAppIsLoading(true);
    setAppError(null);
    try {
      const newTournament = await api.createTournament(tournamentData);
      setTournaments(prev => [newTournament, ...prev].sort((a, b) => {
        const dateA = new Date(a.start_date || 0);
        const dateB = new Date(b.start_date || 0);
        return dateB - dateA;
      }));
      setShowCreateForm(false);
      navigate(`/tournaments/${newTournament.id}`); // Redirect to the new tournament
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
      const updatedTournament = await api.updateTournament(editingTournament.id, tournamentData);
      setTournaments(prev => prev.map(t => t.id === updatedTournament.id ? updatedTournament : t).sort((a, b) => {
        const dateA = new Date(a.start_date || 0);
        const dateB = new Date(b.start_date || 0);
        return dateB - dateA;
      }));
      setShowCreateForm(false);
      setEditingTournament(null);
    } catch (err) {
      setAppError(err.message || 'Failed to update tournament');
    } finally {
      setAppIsLoading(false);
    }
  };

  const handleDeleteTournament = async (tournamentId) => {
    setConfirmModal({
      isOpen: true,
      title: 'Delete Tournament',
      message: 'Are you sure you want to delete this tournament? This action cannot be undone.',
      onConfirm: async () => {
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
        setConfirmModal({ isOpen: false });
      }
    });
  };

  const ProtectedRoute = ({ children }) => {
    if (isInitializing) {
      return <div className="text-center py-10">Initializing app...</div>;
    }
    if (!currentUser) {
      localStorage.setItem('postLoginRedirect', location.pathname + location.search);
      return <Navigate to="/login" replace />;
    }
    return children;
  };

  const AuthRoute = ({ children }) => {
     if (isInitializing) {
      return <div className="text-center py-10">Initializing app...</div>;
    }
    if (currentUser && !isAuthLoading) {
      const postLoginRedirect = localStorage.getItem('postLoginRedirect') || "/";
      return <Navigate to={postLoginRedirect} replace />;
    }
    return children;
  };


  if (isInitializing) {
    return <div className="text-center py-10">Initializing app...</div>;
  }

  const getCurrentTournamentId = () => {
    const path = location.pathname;
    if (path.startsWith('/tournaments/')) return path.split('/')[2];
    if (path.startsWith('/standings/')) return path.split('/')[2];
    if (path.startsWith('/participants/')) return path.split('/')[2];
    return tournaments.length > 0 ? tournaments[0].id : null;
  };

  const currentTournamentId = getCurrentTournamentId();

  const handleTournamentChange = (tournamentId) => {
    const basePath = location.pathname.split('/')[1];
    const newPath = [`/${basePath}`, tournamentId].filter(Boolean).join('/');
    navigate(newPath);
  };

  return (
    <div className="max-w-md mx-auto min-h-screen flex flex-col font-display bg-background-light dark:bg-background-dark text-text-on-light dark:text-text-on-dark">
        <Header 
          tournaments={currentUser ? tournaments : null}
          currentTournamentId={currentTournamentId}
          onTournamentChange={handleTournamentChange}
          onAdd={currentUser ? () => setShowCreateForm(true) : null}
        />
        {showCreateForm && (
          <TournamentForm
            onSubmit={editingTournament ? handleUpdateTournamentSubmit : handleCreateTournamentSubmit}
            initialData={editingTournament}
            onCancel={() => {
              setShowCreateForm(false);
              setEditingTournament(null);
            }}
          />
        )}
        <main className="flex-grow p-4 space-y-4">
          {appError && (
            <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded-md shadow-md" role="alert">
              <p className="font-bold">Error</p>
              <p className="text-sm">{appError}</p>
            </div>
          )}
          <Routes>
            <Route path="/login" element={
              <AuthRoute>
                <LoginPage onLogin={handleLogin} error={authError} isLoading={isAuthLoading} />
              </AuthRoute>
            } />
            <Route path="/register" element={
              <AuthRoute>
                <RegisterPage onRegister={handleRegister} error={authError} isLoading={isAuthLoading} />
              </AuthRoute>
            } />
            <Route path="/join/:inviteCode" element={
              <ProtectedRoute>
                <JoinTournamentPage
                  currentUser={currentUser}
                  globalSetError={setAppError}
                  globalSetIsLoading={setAppIsLoading}
                  globalIsLoading={appIsLoading}
                  onLoginRequired={() => navigate('/login')}
                />
              </ProtectedRoute>
            } />
             <Route path="/" element={
              <ProtectedRoute>
                <TournamentDetail currentUser={currentUser} />
              </ProtectedRoute>
            } />

            <Route path="/standings/:tournamentId" element={
              <ProtectedRoute>
                <Standings tournaments={tournaments} />
              </ProtectedRoute>
            } />
            <Route path="/standings" element={
              <ProtectedRoute>
                <Standings tournaments={tournaments} />
              </ProtectedRoute>
            } />
            <Route path="/participants/:tournamentId" element={
              <ProtectedRoute>
                <Participants currentUser={currentUser} />
              </ProtectedRoute>
            } />
            <Route path="/participants" element={
              <ProtectedRoute>
                <Participants currentUser={currentUser} />
              </ProtectedRoute>
            } />
            <Route path="/tournaments/:tournamentId" element={
              <ProtectedRoute>
                <TournamentDetail currentUser={currentUser} />
              </ProtectedRoute>
            } />
            <Route path="/tournaments" element={<Navigate to="/" replace />} />
            <Route path="*" element={
                <div className="text-center p-10">
                    <h1 className="text-3xl font-bold text-primary mb-4">404 - Page Not Found</h1>
                    <p>The page you are looking for does not exist.</p>
                    <button onClick={() => navigate('/')} className="mt-6 inline-block px-6 py-2 text-sm font-medium text-white bg-primary rounded-md hover:bg-primary-hover">
                        Go to Homepage
                    </button>
                </div>
            } />
          </Routes>
        </main>
      {currentUser && <BottomNav />}
      <InstallPrompt />
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        onConfirm={confirmModal.onConfirm}
        onCancel={() => setConfirmModal({ isOpen: false })}
      />
    </div>
  );
}

export default App;
