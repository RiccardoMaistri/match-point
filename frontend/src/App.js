import React, { useState, useEffect, useCallback } from 'react';
import { Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom';
import './App.css';
import TournamentForm from './components/TournamentForm';
import TournamentLayout from './components/TournamentLayout';
import GroupStage from './components/GroupStage';
import Playoff from './components/Playoff';
import LoginPage from './components/LoginPage';
import RegisterPage from './components/RegisterPage';
import JoinTournamentPage from './components/JoinTournamentPage';
import Header from './components/Header';
import Participants from './components/Participants';
import ConfirmModal from './components/ConfirmModal';
import InstallPrompt from './components/InstallPrompt';
import Logout from './components/Logout';
import TournamentsPage from './pages/TournamentsPage';
import * as api from './services/api';
import AuthRoute from './components/AuthRoute';
import ProtectedRoute from './components/ProtectedRoute';

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
        } finally {
          setIsInitializing(false);
          console.log("App.js: Initialization complete. isInitializing set to false.");
        }
      } else {
        console.log("App.js: No auth token found, currentUser remains null.");
        setIsInitializing(false);
        console.log("App.js: Initialization complete. isInitializing set to false.");
      }
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
      return true;
    } catch (err) {
      setAuthError(err.message || 'Failed to login');
      setCurrentUser(null);
      localStorage.removeItem('authToken');
      return false;
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
      return true;
    } catch (err) {
      setAuthError(err.message || 'Failed to register');
      setCurrentUser(null);
      localStorage.removeItem('authToken');
      return false;
    } finally {
      setIsAuthLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('authToken');
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
    if (currentUser && tournaments.length > 0 && location.pathname === '/' && !isAuthLoading) {
      const lastTournamentId = localStorage.getItem('lastTournamentId');
      const lastTournamentPath = localStorage.getItem('lastTournamentPath');
      
      if (lastTournamentId && tournaments.some(t => t.id === lastTournamentId) && lastTournamentPath) {
        navigate(lastTournamentPath, { replace: true });
      } else if (tournaments.length === 1) {
        navigate(`/tournaments/${tournaments[0].id}`, { replace: true });
      }
    }
  }, [currentUser, tournaments, location.pathname, navigate, isAuthLoading]);

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

  // Save current tournament page to localStorage
  useEffect(() => {
    if (currentTournamentId) {
      localStorage.setItem('lastTournamentId', currentTournamentId);
      localStorage.setItem('lastTournamentPath', location.pathname);
    }
  }, [currentTournamentId, location.pathname]);

  if (isInitializing) {
    return <p className="text-center py-10">Initializing app...</p>;
  }

  return (
    <div className="relative flex size-full min-h-screen flex-col justify-between group/design-root overflow-x-hidden bg-background-light dark:bg-background-dark">
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

        <main className="pt-20 pb-20 flex-grow">
          {appError && (
            <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded-md shadow-md" role="alert">
              <p className="font-bold">Error</p>
              <p className="text-sm">{appError}</p>
            </div>
          )}
          <Routes>
            <Route path="/login" element={
              <AuthRoute currentUser={currentUser} isInitializing={isInitializing} isAuthLoading={isAuthLoading}>
                <LoginPage onLogin={handleLogin} error={authError} isLoading={isAuthLoading} />
              </AuthRoute>
            } />
            <Route path="/register" element={
              <AuthRoute currentUser={currentUser} isInitializing={isInitializing} isAuthLoading={isAuthLoading}>
                <RegisterPage onRegister={handleRegister} error={authError} isLoading={isAuthLoading} />
              </AuthRoute>
            } />
            <Route path="/logout" element={<Logout onLogout={handleLogout} />} />
              <Route path="/join/:inviteCode" element={
              <ProtectedRoute currentUser={currentUser} isInitializing={isInitializing}>
                <JoinTournamentPage 
                  currentUser={currentUser} 
                  globalSetIsLoading={setAppIsLoading} 
                  globalIsLoading={appIsLoading} 
                  globalSetError={setAppError}
                  onJoinSuccess={fetchTournaments}
                />
              </ProtectedRoute>
            } />
             <Route path="/" element={
              <ProtectedRoute currentUser={currentUser} isInitializing={isInitializing}>
                <TournamentsPage currentUser={currentUser} onCreateTournament={() => setShowCreateForm(true)} />
              </ProtectedRoute>
            } />

            <Route path="/tournaments/:tournamentId" element={
              <ProtectedRoute currentUser={currentUser} isInitializing={isInitializing}>
                <TournamentLayout currentUser={currentUser} />
              </ProtectedRoute>
            }>
                <Route index element={<Navigate to="group-stage" replace />} />
                <Route path="group-stage" element={<GroupStage />} />
                <Route path="playoff" element={<Playoff />} />
                <Route path="players" element={<Participants currentUser={currentUser} />} />
            </Route>

            <Route path="/standings/:tournamentId" element={<Navigate to={`/tournaments/${location.pathname.split('/')[2]}/group-stage`} replace />} />
            <Route path="/participants/:tournamentId" element={<Navigate to={`/tournaments/${location.pathname.split('/')[2]}/players`} replace />} />
            
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
      {/* BottomNav is now handled inside TournamentLayout for tournament views */}
      {/* {currentUser && <BottomNav />} */}
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