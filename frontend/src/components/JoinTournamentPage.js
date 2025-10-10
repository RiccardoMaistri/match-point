import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import * as api from '../services/api';

function JoinTournamentPage({ currentUser, globalSetError, globalSetIsLoading, globalIsLoading, onLoginRequired }) {
  const { inviteCode } = useParams();
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
      if (data.status !== 'open') {
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
    return <div className="p-6 text-center text-secondary-text text-sm">Loading tournament information...</div>;
  }

  if (!tournament) {
    return (
      <div className="p-3 pb-16">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-center">
          <h2 className="text-lg font-bold text-red-600 mb-2">Tournament Not Found</h2>
          <p className="text-sm text-secondary-text mb-4">
            The invitation link may be invalid or expired.
          </p>
          <Link to="/" className="text-sm font-semibold text-primary hover:text-primary-hover">
            &larr; Back to Homepage
          </Link>
        </div>
      </div>
    );
  }

  const isCurrentUserParticipant = currentUser && tournament.participants.some(p => p.email === currentUser.email);
  const registrationIsOpen = tournament.status === 'open';

  return (
    <div className="p-3 pb-16">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-3 border-b border-gray-100 text-center">
          <p className="text-xs font-semibold text-primary mb-1">You're invited to join</p>
          <h1 className="text-lg font-bold text-primary-text">{tournament.name}</h1>
        </div>

        <div className="p-3 space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm font-semibold text-secondary-text">Type</span>
            <span className="text-sm text-primary-text capitalize">{tournament.tournament_type}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm font-semibold text-secondary-text">Format</span>
            <span className="text-sm text-primary-text capitalize">{tournament.format.replace('_', ' ')}</span>
          </div>
          {tournament.start_date && (
            <div className="flex justify-between items-center">
              <span className="text-sm font-semibold text-secondary-text">Date</span>
              <span className="text-sm text-primary-text">{new Date(tournament.start_date).toLocaleDateString()}</span>
            </div>
          )}
          <div className="flex justify-between items-center">
            <span className="text-sm font-semibold text-secondary-text">Registration</span>
            <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${registrationIsOpen ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
              {registrationIsOpen ? 'Open' : 'Closed'}
            </span>
          </div>
        </div>

        {joinMessage && (
          <div className="p-3 border-t border-gray-100">
            <p className={`p-2 rounded-lg text-center text-xs font-semibold ${joinMessage.includes("Successfully") ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'bg-yellow-50 text-yellow-700 border border-yellow-200'}`}>
              {joinMessage}
            </p>
          </div>
        )}

        <div className="p-3 border-t border-gray-100">
          {isCurrentUserParticipant ? (
            <div className="space-y-2">
              <p className="p-2 rounded-lg bg-blue-50 text-blue-700 border border-blue-200 text-xs text-center font-semibold">You are already part of this tournament.</p>
              <Link to={`/tournaments/${tournament.id}`} className="block w-full px-4 py-2 text-sm font-semibold text-white bg-primary rounded-lg hover:bg-primary-hover transition-colors text-center shadow-sm">View Tournament</Link>
            </div>
          ) : registrationIsOpen ? (
            <button
              onClick={handleJoinTournament}
              disabled={isJoining || globalIsLoading}
              className="w-full px-4 py-2 text-sm font-semibold text-white bg-primary rounded-lg hover:bg-primary-hover disabled:bg-gray-400 transition-colors shadow-sm"
            >
              {isJoining ? 'Processing...' : (currentUser ? 'Confirm & Join' : 'Login to Join')}
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export default JoinTournamentPage;
