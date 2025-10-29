import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import * as api from '../services/api';

function JoinTournamentPage({ currentUser, globalSetError, globalSetIsLoading, globalIsLoading }) {
  const { inviteCode } = useParams();
  const navigate = useNavigate();
  const [tournament, setTournament] = useState(null);
  const [joinMessage, setJoinMessage] = useState('');
  const [isJoining, setIsJoining] = useState(false);

  const handleJoinTournament = useCallback(async (tourney) => {
    if (!tourney || !tourney.id) {
      globalSetError("Tournament details are not loaded.");
      return;
    }

    setIsJoining(true);
    globalSetError(null);
    setJoinMessage('');
    try {
      await api.joinTournamentAuthenticated(tourney.id);
      setJoinMessage(`Successfully joined ${tourney.name}! You will be redirected shortly.`);
      navigate(`/tournaments/${tourney.id}`);
    } catch (err) {
      const errorMessage = err.message || 'Failed to join tournament.';
      if (errorMessage.toLowerCase().includes("already registered")) {
        setJoinMessage(`You are already registered for ${tourney.name}. Redirecting...`);
        navigate(`/tournaments/${tourney.id}`);
      } else {
        globalSetError(errorMessage);
        setJoinMessage('');
      }
    } finally {
      setIsJoining(false);
    }
  }, [globalSetError, navigate]);


  useEffect(() => {
    // Since this is a protected route, currentUser should be available.
    // If not, we wait until it is.
    if (!currentUser) {
      return;
    }

    const processInvite = async () => {
      if (!inviteCode) return;

      globalSetIsLoading(true);
      globalSetError(null);
      setJoinMessage('Processing invitation...');

      try {
        const tourney = await api.getTournamentByInviteCode(inviteCode);
        setTournament(tourney);

        if (tourney.status !== 'open') {
          setJoinMessage("Registration for this tournament is currently closed.");
          globalSetIsLoading(false);
          return;
        }

        const isParticipant = tourney.participants.some(p => p.id === currentUser.id);
        if (isParticipant) {
          setJoinMessage("You are already in this tournament. Redirecting...");
          navigate(`/tournaments/${tourney.id}`);
        } else {
          await handleJoinTournament(tourney);
        }
      } catch (err) {
        globalSetError(err.message || 'Failed to process invitation. The link may be invalid or expired.');
        setTournament(null);
      } finally {
        globalSetIsLoading(false);
      }
    };

    processInvite();
  }, [inviteCode, currentUser, globalSetError, globalSetIsLoading, navigate, handleJoinTournament]);


  if (globalIsLoading || isJoining) {
    return <div className="p-6 text-center text-secondary-text text-sm">{joinMessage || 'Processing...'}</div>;
  }

  if (!tournament) {
     return (
      <div className="p-3 pb-16">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-center">
          <h2 className="text-lg font-bold text-red-600 mb-2">Error Processing Invitation</h2>
          <p className="text-sm text-secondary-text mb-4">
            {joinMessage || 'The invitation link may be invalid or expired.'}
          </p>
          <Link to="/" className="text-sm font-semibold text-primary hover:text-primary-hover">
            &larr; Back to Homepage
          </Link>
        </div>
      </div>
    );
  }

  return (
     <div className="p-3 pb-16">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-center">
        <h1 className="text-lg font-bold text-primary-text">{tournament.name}</h1>
        <p className="text-sm text-secondary-text my-4">{joinMessage}</p>
        {!joinMessage.toLowerCase().includes('redirecting') && (
             <Link to={`/tournaments/${tournament.id}`} className="text-sm font-semibold text-primary hover:text-primary-hover">
                Go to tournament
             </Link>
        )}
      </div>
    </div>
  )
}

export default JoinTournamentPage;