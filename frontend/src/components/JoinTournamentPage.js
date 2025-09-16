import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import * as api from '../services/api';

function JoinTournamentPage({ currentUser, globalSetError, globalSetIsLoading, globalIsLoading, onLoginRequired }) {
  const { inviteCode } = useParams(); // Re-introduced useParams to get inviteCode from URL
  const navigate = useNavigate();
  const [tournament, setTournament] = useState(null);
  const [joinMessage, setJoinMessage] = useState('');
  const [isJoining, setIsJoining] = useState(false);

  const fetchTournamentByInvite = useCallback(async () => {
    if (!inviteCode) return;
    globalSetIsLoading(true);
    globalSetError(null);
    setJoinMessage('');
    try {
      const data = await api.getTournamentByInviteCode(inviteCode);
      setTournament(data);
      if (!data.registration_open) {
        setJoinMessage("Registration for this tournament is currently closed.");
      }
    } catch (err) {
      globalSetError(err.message || 'Failed to fetch tournament details. The invite link may be invalid or expired.');
      setTournament(null);
    } finally {
      globalSetIsLoading(false);
    }
  }, [inviteCode, globalSetError, globalSetIsLoading]);

  useEffect(() => {
    fetchTournamentByInvite();
  }, [fetchTournamentByInvite]);

  const handleJoinTournament = useCallback(async () => {
    if (!tournament || !tournament.id) {
      globalSetError("Tournament details are not loaded.");
      return;
    }
    if (!currentUser) {
      localStorage.setItem('postLoginRedirect', `/join/${inviteCode}`);
      onLoginRequired();
      return;
    }

    setIsJoining(true);
    globalSetError(null);
    setJoinMessage('');
    try {
      const participant = await api.joinTournamentAuthenticated(tournament.id);
      setJoinMessage(`Successfully joined ${tournament.name}! You will be redirected shortly.`);
      setTimeout(() => navigate(`/tournaments/${tournament.id}`), 2000);
    } catch (err) {
      const errorMessage = err.message || 'Failed to join tournament.';
      globalSetError(errorMessage);
      if (errorMessage.toLowerCase().includes("already registered")) {
        setJoinMessage(`You are already registered for ${tournament.name}.`);
      }
    } finally {
      setIsJoining(false);
    }
  }, [tournament, currentUser, inviteCode, onLoginRequired, globalSetError, navigate]);

  if (globalIsLoading && !tournament) {
    return <div className="text-center p-10"><p className="text-lg text-indigo-600 dark:text-indigo-400">Loading tournament information...</p></div>;
  }

  if (!tournament) {
    return (
      <div className="max-w-md mx-auto mt-8 sm:mt-12">
        <div className="bg-white dark:bg-gray-800 p-6 sm:p-8 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 text-center">
          <h2 className="text-2xl font-bold text-red-600 dark:text-red-400 mb-4">Tournament Not Found</h2>
          <p className="text-gray-700 dark:text-gray-300 mb-6">
            The invitation link may be invalid or expired.
          </p>
          <Link to="/" className="font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300">
            &larr; Back to Homepage
          </Link>
        </div>
      </div>
    );
  }

  const isCurrentUserParticipant = currentUser && tournament.participants.some(p => p.email === currentUser.email);

  return (
    <div className="max-w-lg mx-auto mt-8 sm:mt-12">
      <div className="bg-white dark:bg-gray-800 p-6 sm:p-8 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
        <div className="text-center">
          <p className="text-sm font-medium text-indigo-600 dark:text-indigo-400">You're invited to join</p>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mt-1 mb-6">{tournament.name}</h1>
        </div>

        <div className="space-y-3 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-200 dark:border-gray-700/50 mb-6">
          <p><strong className="font-semibold text-gray-700 dark:text-gray-300">Type:</strong> <span className="text-gray-800 dark:text-gray-200 capitalize">{tournament.tournament_type}</span></p>
          <p><strong className="font-semibold text-gray-700 dark:text-gray-300">Format:</strong> <span className="text-gray-800 dark:text-gray-200 capitalize">{tournament.format.replace('_', ' ')}</span></p>
          {tournament.start_date && <p><strong className="font-semibold text-gray-700 dark:text-gray-300">Date:</strong> <span className="text-gray-800 dark:text-gray-200">{new Date(tournament.start_date).toLocaleDateString()}</span></p>}
          <p className="flex items-center"><strong className="font-semibold text-gray-700 dark:text-gray-300">Registration:</strong>
            <span className={`ml-2 px-2 py-0.5 text-xs font-semibold rounded-full ${tournament.registration_open ? 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300' : 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300'}`}>
              {tournament.registration_open ? 'Open' : 'Closed'}
            </span>
          </p>
        </div>

        {joinMessage && (
          <p className={`mb-6 p-3 rounded-lg text-center text-sm font-medium ${joinMessage.includes("Successfully") ? 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300' : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-300'}`}>
            {joinMessage}
          </p>
        )}

        {isCurrentUserParticipant ? (
          <div className="text-center">
            <p className="p-3 rounded-lg bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-200 text-sm">You are already part of this tournament.</p>
            <Link to={`/tournaments/${tournament.id}`} className="mt-4 inline-block font-semibold text-indigo-600 hover:underline dark:text-indigo-400">View Tournament</Link>
          </div>
        ) : tournament.registration_open ? (
          <button
            onClick={handleJoinTournament}
            disabled={isJoining || globalIsLoading}
            className="w-full px-6 py-3 text-base font-semibold text-white bg-green-600 rounded-lg hover:bg-green-700 focus:outline-none focus:ring-4 focus:ring-green-300 dark:focus:ring-green-800 disabled:bg-gray-400 dark:disabled:bg-gray-600 transition-all"
          >
            {isJoining ? 'Processing...' : (currentUser ? 'Confirm & Join' : 'Login to Join')}
          </button>
        ) : null}

        <div className="mt-8 text-center">
          <Link to="/" className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:underline">
            &larr; Back to safety
          </Link>
        </div>
      </div>
    </div>
  );
}

export default JoinTournamentPage;
