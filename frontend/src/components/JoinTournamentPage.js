import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom'; // Removed useParams
import * as api from '../services/api';

// Added inviteCode to props destructuring
function JoinTournamentPage({ inviteCode, currentUser, globalSetError, globalSetIsLoading, globalIsLoading, onLoginRequired }) {
  // const { inviteCode } = useParams(); // Removed: inviteCode will come from props
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

  const handleJoinTournament = async () => {
    if (!tournament || !tournament.id) {
      globalSetError("Tournament details are not loaded.");
      return;
    }
    if (!currentUser) {
      // Store intent to join and redirect to login
      localStorage.setItem('postLoginRedirect', `/join/${inviteCode}`);
      localStorage.setItem('postLoginAction', JSON.stringify({ type: 'joinTournament', tournamentId: tournament.id, inviteCode: inviteCode }));
      onLoginRequired(); // This should trigger App.js to show LoginPage
      return;
    }

    setIsJoining(true);
    globalSetError(null);
    setJoinMessage('');
    try {
      const participant = await api.joinTournamentAuthenticated(tournament.id);
      setJoinMessage(`Successfully joined ${tournament.name} as ${participant.name}!`);
      // Consider redirecting to the tournament detail page or dashboard
      setTimeout(() => navigate(`/tournaments/${tournament.id}`), 2000); // Redirect after a short delay
    } catch (err) {
      globalSetError(err.message || 'Failed to join tournament.');
      // If error indicates already joined, update message accordingly
      if (err.message && err.message.toLowerCase().includes("already registered")) {
        setJoinMessage(`You are already registered for ${tournament.name}.`);
      }
    } finally {
      setIsJoining(false);
    }
  };

  // Effect to handle post-login action
  useEffect(() => {
    const postLoginAction = localStorage.getItem('postLoginAction');
    if (currentUser && postLoginAction) {
      const action = JSON.parse(postLoginAction);
      if (action.type === 'joinTournament' && action.inviteCode === inviteCode) {
        localStorage.removeItem('postLoginAction'); // Clear action
        // Ensure tournament data is loaded before attempting to join
        if (tournament && tournament.id === action.tournamentId) {
          handleJoinTournament();
        } else if (!tournament && inviteCode === action.inviteCode) {
          // If tournament hasn't loaded yet but codes match, fetch it then join
          // This might happen if JoinTournamentPage re-mounts after login
          // For simplicity, we can just call handleJoinTournament, it will re-check current user
          // and tournament details. A more robust way might involve waiting for tournament to load.
          fetchTournamentByInvite().then(() => {
            // Check again now that tournament might be loaded
            if(tournament && tournament.id === action.tournamentId) { // Re-check tournament after fetch
                 handleJoinTournament();
            } else if (action.tournamentId) { // Fallback if tournament state not updated yet
                // This is tricky. For now, let's assume if currentUser is present, and action matches, try joining.
                // The tournament ID from action is crucial.
                api.joinTournamentAuthenticated(action.tournamentId)
                    .then(participant => {
                        setJoinMessage(`Successfully joined a tournament as ${participant.name}! You will be redirected.`);
                        setTimeout(() => navigate(`/tournaments/${action.tournamentId}`), 2000);
                    })
                    .catch(err => globalSetError(err.message || 'Failed to join tournament post-login.'));
            }
          });
        }
      }
    }
  }, [currentUser, inviteCode, tournament, fetchTournamentByInvite, globalSetError, navigate]);


  if (globalIsLoading && !tournament) {
    return <div className="text-center p-10"><p className="text-lg text-indigo-600">Loading tournament information...</p></div>;
  }

  if (!tournament) {
    // Error is handled by globalSetError, which should be displayed by App.js
    // But a local message can also be useful.
    return (
      <div className="text-center p-10 bg-white shadow-lg rounded-lg max-w-md mx-auto mt-10">
        <h2 className="text-2xl font-semibold text-red-600 mb-4">Tournament Not Found</h2>
        <p className="text-slate-700 mb-6">
          The invitation link seems to be invalid, expired, or the tournament could not be found.
        </p>
        <Link to="/" className="px-6 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 transition-colors">
          Go to Homepage
        </Link>
      </div>
    );
  }

  // Check if current user is already a participant
  const isCurrentUserParticipant = currentUser && tournament.participants.some(p => p.email === currentUser.email);


  return (
    <div className="container mx-auto p-4 sm:p-6 max-w-2xl">
      <div className="bg-white shadow-xl rounded-lg p-6 sm:p-8">
        <h1 className="text-3xl font-bold text-indigo-700 mb-2 text-center">{tournament.name}</h1>
        <p className="text-sm text-slate-500 mb-6 text-center">ID: {tournament.id}</p>

        <div className="mb-6 space-y-3 p-4 bg-slate-50 rounded-md border border-slate-200">
          <p><strong className="text-slate-700">Type:</strong> <span className="text-slate-800 capitalize">{tournament.tournament_type}</span></p>
          <p><strong className="text-slate-700">Format:</strong> <span className="text-slate-800 capitalize">{tournament.format.replace('_', ' ')}</span></p>
          {tournament.start_date && (
            <p><strong className="text-slate-700">Date:</strong> <span className="text-slate-800">{new Date(tournament.start_date).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</span></p>
          )}
          <p>
            <strong className="text-slate-700">Registration:</strong>
            <span className={`ml-1 px-2 py-0.5 text-xs rounded-full font-semibold ${tournament.registration_open ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
              {tournament.registration_open ? 'Open' : 'Closed'}
            </span>
          </p>
        </div>

        {joinMessage && (
          <p className={`mb-4 p-3 rounded-md text-center ${globalIsLoading || isJoining ? 'bg-blue-50 text-blue-700' : (joinMessage.includes("Successfully") ? 'bg-green-50 text-green-700' : 'bg-yellow-50 text-yellow-700')}`}>
            {joinMessage}
          </p>
        )}

        {/* Display error from globalSetError if specifically for this page's action */}
        {/* This is tricky as globalSetError is usually for App level. Consider passing a local error setter */}

        {tournament.registration_open && !isCurrentUserParticipant && !joinMessage.includes("Successfully") && (
          <button
            onClick={handleJoinTournament}
            disabled={isJoining || globalIsLoading}
            className="w-full px-6 py-3 text-lg font-semibold text-white bg-green-600 rounded-lg hover:bg-green-700 focus:outline-none focus:ring-4 focus:ring-green-300 disabled:bg-slate-400 transition-all duration-150 ease-in-out"
          >
            {isJoining ? 'Processing...' : (currentUser ? 'Confirm & Join Tournament' : 'Login to Join Tournament')}
          </button>
        )}

        {isCurrentUserParticipant && (
            <p className="mt-4 p-3 rounded-md text-center bg-blue-50 text-blue-700">
                You are already a participant in this tournament.
                <Link to={`/tournaments/${tournament.id}`} className="ml-2 font-semibold text-indigo-600 hover:underline">View Tournament</Link>
            </p>
        )}

        {!currentUser && !joinMessage.includes("Successfully") && tournament.registration_open && (
          <div className="mt-4 text-center">
            <p className="text-slate-600">You need to be logged in to join.</p>
            <button
                onClick={() => {
                    localStorage.setItem('postLoginRedirect', `/join/${inviteCode}`);
                    localStorage.setItem('postLoginAction', JSON.stringify({ type: 'joinTournament', tournamentId: tournament.id, inviteCode: inviteCode }));
                    onLoginRequired();
                }}
                className="mt-2 text-indigo-600 hover:text-indigo-800 hover:underline font-medium"
            >
                Login or Register
            </button>
          </div>
        )}

        <div className="mt-8 text-center">
          <Link to="/" className="text-sm text-indigo-600 hover:text-indigo-800 hover:underline">
            &larr; Back to Homepage
          </Link>
        </div>
      </div>
    </div>
  );
}

export default JoinTournamentPage;
