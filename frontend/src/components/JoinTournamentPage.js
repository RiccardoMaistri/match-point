import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import * as api from '../services/api';

function JoinTournamentPage({ currentUser, globalSetError, globalSetIsLoading, globalIsLoading }) {
  const { inviteCode } = useParams();
  const navigate = useNavigate();
  const [tournament, setTournament] = useState(null);
  const [joinMessage, setJoinMessage] = useState('');
  const [isJoining, setIsJoining] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const redirectTimeoutRef = useRef(null);
  const hasProcessedRef = useRef(false);

  const handleJoinTournament = useCallback(async (tourney) => {
    if (!tourney?.id) {
      globalSetError?.("Tournament details are not loaded.");
      return false;
    }

    setIsJoining(true);
    globalSetError?.(null);
    setJoinMessage('');
    
    try {
      await api.joinTournamentAuthenticated(tourney.id);
      setJoinMessage(`Successfully joined ${tourney.name}!`);
      setShowSuccess(true);
      
      redirectTimeoutRef.current = setTimeout(() => {
        navigate(`/tournaments/${tourney.id}`, { replace: true });
      }, 2000);
      
      return true;
    } catch (err) {
      const errorMessage = err.message || 'Failed to join tournament.';
      if (errorMessage.toLowerCase().includes("already registered")) {
        setJoinMessage(`You are already registered for ${tourney.name}`);
        setShowSuccess(true);
        
        redirectTimeoutRef.current = setTimeout(() => {
          navigate(`/tournaments/${tourney.id}`, { replace: true });
        }, 2000);
        
        return true;
      } else {
        globalSetError?.(errorMessage);
        setJoinMessage('');
        return false;
      }
    } finally {
      setIsJoining(false);
    }
  }, [globalSetError, navigate]);


  useEffect(() => {
    if (!currentUser || !inviteCode || hasProcessedRef.current) {
      return;
    }

    const processInvite = async () => {
      hasProcessedRef.current = true;
      globalSetIsLoading?.(true);
      globalSetError?.(null);
      setJoinMessage('Processing invitation...');

      try {
        const tourney = await api.getTournamentByInviteCode(inviteCode);
        
        if (!tourney?.id) {
          throw new Error('Invalid tournament data received.');
        }
        
        setTournament(tourney);

        if (tourney.status !== 'open') {
          setJoinMessage("Registration for this tournament is currently closed.");
          return;
        }

        const isParticipant = tourney.participants?.some(p => p.id === currentUser.id);
        if (isParticipant) {
          setJoinMessage("You are already in this tournament");
          setShowSuccess(true);
          redirectTimeoutRef.current = setTimeout(() => {
            navigate(`/tournaments/${tourney.id}`, { replace: true });
          }, 1500);
        } else {
          await handleJoinTournament(tourney);
        }
      } catch (err) {
        globalSetError?.(err.message || 'Failed to process invitation. The link may be invalid or expired.');
        setTournament(null);
      } finally {
        globalSetIsLoading?.(false);
      }
    };

    processInvite();

    return () => {
      if (redirectTimeoutRef.current) {
        clearTimeout(redirectTimeoutRef.current);
      }
    };
  }, [inviteCode, currentUser, globalSetError, globalSetIsLoading, navigate, handleJoinTournament]);


  if (globalIsLoading || isJoining) {
    return (
      <div className="p-6 text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <p className="mt-4 text-slate-500 dark:text-slate-400 text-sm">{joinMessage || 'Processing...'}</p>
      </div>
    );
  }

  if (!tournament && !showSuccess) {
    return (
      <div className="p-4 pb-24">
        <div className="bg-white dark:bg-surface-dark rounded-xl shadow-sm p-6 text-center">
          <span className="material-symbols-outlined text-red-500 text-5xl mb-3">error</span>
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-50 mb-2">Error Processing Invitation</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
            {joinMessage || 'The invitation link may be invalid or expired.'}
          </p>
          <Link to="/" className="text-sm font-semibold text-primary hover:text-indigo-700">
            &larr; Back to Homepage
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 pb-24">
      {showSuccess && (
        <div className="fixed top-24 left-1/2 transform -translate-x-1/2 z-50 animate-fade-in-out">
          <div className="bg-green-500 text-white px-6 py-3 rounded-full shadow-lg flex items-center gap-2">
            <span className="material-symbols-outlined">check_circle</span>
            <span className="font-semibold">{joinMessage}</span>
          </div>
        </div>
      )}
      {tournament && (
        <div className="bg-white dark:bg-surface-dark rounded-xl shadow-sm p-6 text-center">
          <span className="material-symbols-outlined text-primary text-5xl mb-3">sports_tennis</span>
          <h1 className="text-lg font-bold text-slate-900 dark:text-slate-50 mb-2">{tournament.name}</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">Processing your invitation...</p>
        </div>
      )}
    </div>
  );
}

export default JoinTournamentPage;