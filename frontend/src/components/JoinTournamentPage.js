import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import * as api from '../services/api';

function JoinTournamentPage({ currentUser, globalSetError, globalSetIsLoading, globalIsLoading }) {
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

        const isParticipant = tourney.participants?.some(p => p.id === currentUser.id);
        
        if (isParticipant) {
          setJoinMessage(`You are already registered for ${tourney.name}`);
          setShowSuccess(true);
          setTimeout(() => {
            navigate(`/tournaments/${tourney.id}`, { replace: true });
          }, 1500);
          return;
        }

        await api.joinTournamentAuthenticated(tourney.id);
        
        setJoinMessage(`Successfully joined ${tourney.name}!`);
        setShowSuccess(true);
        
        setTimeout(() => {
          navigate(`/tournaments/${tourney.id}`, { replace: true });
        }, 2000);
        
      } catch (err) {
        const errorMessage = err.message || 'Failed to process invitation.';
        if (errorMessage.toLowerCase().includes("already registered")) {
          setJoinMessage(`You are already registered for this tournament`);
          setShowSuccess(true);
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
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
          <div className="flex items-center">
            <span className="mr-2">✓</span>
            <span className="font-semibold">{joinMessage}</span>
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