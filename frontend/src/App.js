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
import MyMatches from './components/MyMatches'; // Import MyMatches
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

  const navigate = useNavigate();
  const location = useLocation();

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
      setTournaments(data);
    } catch (err) {
      setAppError(err.message || 'Failed to fetch tournaments');
    } finally {
      setAppIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (currentUser && (location.pathname === '/' || location.pathname === '/matches')) {
        fetchTournaments();
    } else if (!currentUser && (location.pathname === '/' || location.pathname === '/matches')) {
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
      const postLoginRedirect = localStorage.getItem('postLoginRedirect') || "/";
      return <Navigate to={postLoginRedirect} replace />;
    }
    return children;
  };


  if (isInitializing) {
    return <p className="text-center py-10">Initializing app...</p>;
  }

  return (
    <div className="relative flex size-full min-h-screen flex-col justify-between group/design-root overflow-x-hidden bg-background">
      <div className="flex-grow">
        <Header title="My Tournaments" onAdd={() => setShowCreateForm(true)} />
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
                <TournamentList
                  tournaments={tournaments}
                  onEdit={handleEditTournamentClick}
                  onDelete={handleDeleteTournament}
                  onView={(id) => navigate(`/tournaments/${id}`)}
                />
              </ProtectedRoute>
            } />
            <Route path="/matches" element={
              <ProtectedRoute>
                <MyMatches tournaments={tournaments} currentUser={currentUser} onResultSubmitted={fetchTournaments} />
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
    </div>
  );
}

export default App;
