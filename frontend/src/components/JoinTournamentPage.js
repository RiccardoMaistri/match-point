import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import * as api from '../services/api';

function JoinTournamentPage({ currentUser, globalSetError, globalSetIsLoading, globalIsLoading, onJoinSuccess }) {
  const { inviteCode } = useParams();
  const navigate = useNavigate();
  const [tournament, setTournament] = useState(null);
  const [joinMessage, setJoinMessage] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    if (!currentUser || !inviteCode) {
      return;
    }

    const processInvite = async () => {
      setIsProcessing(true);
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

        const isParticipant = tourney.participants?.some(p => p.email === currentUser.email);
        
        if (isParticipant) {
          setJoinMessage(`You are already registered for ${tourney.name}`);
          setShowSuccess(true);
          if (onJoinSuccess) await onJoinSuccess();
          setTimeout(() => {
            navigate(`/tournaments/${tourney.id}`, { replace: true });
          }, 1500);
          return;
        }

        await api.joinTournamentAuthenticated(tourney.id);
        
        setJoinMessage(`Successfully joined ${tourney.name}!`);
        setShowSuccess(true);
        if (onJoinSuccess) await onJoinSuccess();
        
        setTimeout(() => {
          navigate(`/tournaments/${tourney.id}`, { replace: true });
        }, 2000);
        
      } catch (err) {
        const errorMessage = err.message || 'Failed to process invitation.';
        if (errorMessage.toLowerCase().includes("already registered")) {
          setJoinMessage(`You are already registered for this tournament`);
          setShowSuccess(true);
          if (onJoinSuccess) await onJoinSuccess();
          setTimeout(() => {
            if (tournament?.id) {
              navigate(`/tournaments/${tournament.id}`, { replace: true });
            }
          }, 1500);
        } else {
          globalSetError?.(errorMessage + ' The link may be invalid or expired.');
          setTournament(null);
        }
      } finally {
        globalSetIsLoading?.(false);
        setIsProcessing(false);
      }
    };

    processInvite();
  }, [currentUser, inviteCode, globalSetIsLoading, globalSetError, navigate]);

  if (globalIsLoading || isProcessing) {
    return (
      <div className="p-6 text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        <p className="mt-4 text-gray-500 text-sm">{joinMessage || 'Processing...'}</p>
      </div>
    );
  }

  if (!tournament && !showSuccess) {
    return (
      <div className="p-4">
        <div className="bg-white rounded-lg shadow-sm p-6 text-center">
          <div className="text-red-500 text-5xl mb-3">⚠️</div>
          <h2 className="text-lg font-bold text-gray-900 mb-2">Error Processing Invitation</h2>
          <p className="text-sm text-gray-500 mb-4">
            The invitation link may be invalid or expired.
          </p>
          <Link to="/" className="text-sm font-semibold text-indigo-600 hover:text-indigo-700">
            ← Back to Homepage
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4">
      {showSuccess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 backdrop-blur-sm transition-opacity">
            <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl p-8 max-w-sm w-full mx-4 text-center transform scale-100 transition-transform duration-300 border border-white/10">
                <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-tr from-green-400 to-emerald-600 shadow-lg shadow-green-500/30 mb-6 ring-4 ring-green-50 dark:ring-green-900/20">
                    <svg className="h-10 w-10 text-white" fill="none" viewBox="0 0 24 24" strokeWidth="3" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                </div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2 font-display">
                    Success!
                </h2>
                <p className="text-gray-600 dark:text-gray-300 mb-8 leading-relaxed">
                    {joinMessage}
                </p>
                <div className="flex items-center justify-center space-x-2 text-sm font-medium text-emerald-600 dark:text-emerald-400 animate-pulse">
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Taking you to the court...</span>
                </div>
            </div>
        </div>
      )}
      {tournament && (
        <div className="bg-white rounded-lg shadow-sm p-6 text-center">
          <div className="text-indigo-600 text-5xl mb-3">🎾</div>
          <h1 className="text-lg font-bold text-gray-900 mb-2">{tournament.name}</h1>
          <p className="text-sm text-gray-500 mb-4">{joinMessage || 'Processing your invitation...'}</p>
        </div>
      )}
    </div>
  );
}

export default JoinTournamentPage;