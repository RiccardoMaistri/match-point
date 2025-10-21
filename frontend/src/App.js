import React, { useState, useEffect, useCallback } from 'react';
import { Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom';
import './App.css';
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

  useEffect(() => {
    if (currentUser && tournaments.length > 0 && location.pathname === '/') {
      navigate(`/tournaments/${tournaments[0].id}`, { replace: true });
    }
  }, [currentUser, tournaments, location.pathname, navigate]);

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
    console.log("ProtectedRoute: isInitializing", isInitializing, "currentUser", !!currentUser, "location", location.pathname);
    if (isInitializing) {
      return <p className="text-center py-10">Initializing app...</p>;
    }
    if (!currentUser) {
      console.log("ProtectedRoute: No current user, redirecting to /login");
      localStorage.setItem('postLoginRedirect', location.pathname + location.search);
      return <Navigate to="/login" replace />;
    }
    console.log("ProtectedRoute: Current user exists, rendering children.");
    return children;
  };

  const AuthRoute = ({ children }) => {
     console.log("AuthRoute: isInitializing", isInitializing, "currentUser", !!currentUser, "isAuthLoading", isAuthLoading, "location", location.pathname);
     if (isInitializing) {
      return <p className="text-center py-10">Initializing app...</p>;
    }
    if (currentUser && !isAuthLoading) {
      const postLoginRedirect = localStorage.getItem('postLoginRedirect') || "/";
      console.log("AuthRoute: Current user exists, redirecting to postLoginRedirect:", postLoginRedirect);
      return <Navigate to={postLoginRedirect} replace />;
    }
    console.log("AuthRoute: No current user or auth loading, rendering children.");
    return children;
  };


  if (isInitializing) {
    return <p className="text-center py-10">Initializing app...</p>;
  }

  const getCurrentTournamentId = () => {
    if (location.pathname.startsWith('/tournaments/')) {
      return location.pathname.split('/')[2];
    }
    if (location.pathname.startsWith('/standings/')) {
      return location.pathname.split('/')[2];
    }
    if (location.pathname.startsWith('/participants/')) {
      return location.pathname.split('/')[2];
    }
    return null;
  };

  const currentTournamentId = getCurrentTournamentId();

  const handleTournamentChange = (tournamentId) => {
    if (location.pathname.startsWith('/tournaments/')) {
      navigate(`/tournaments/${tournamentId}`);
    } else if (location.pathname.startsWith('/standings/')) {
      navigate(`/standings/${tournamentId}`);
    } else if (location.pathname.startsWith('/participants/')) {
      navigate(`/participants/${tournamentId}`);
    } else {
      navigate(`/tournaments/${tournamentId}`);
    }
  };

  return (
    <div className="relative flex size-full min-h-screen flex-col justify-between group/design-root overflow-x-hidden bg-background">
      <div className="flex-grow">
        <Header 
          title="MatchPoint" 
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
        <main className="pb-24">
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
              <JoinTournamentPage
                currentUser={currentUser}
                globalSetError={setAppError}
                globalSetIsLoading={setAppIsLoading}
                globalIsLoading={appIsLoading}
                onLoginRequired={() => navigate('/login')}
              />
            } />
             <Route path="/" element={
              <ProtectedRoute>
                <div className="text-center py-10">Loading...</div>
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
                    <p className="text-secondary-text">The page you are looking for does not exist.</p>
                    <button onClick={() => navigate('/')} className="mt-6 inline-block px-6 py-2 text-sm font-medium text-white bg-primary rounded-md hover:bg-primary-hover">
                        Go to Homepage
                    </button>
                </div>
            } />
          </Routes>
        </main>
      </div>
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
