import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import * as api from '../services/api';
import ConfirmModal from './ConfirmModal';

function Participants({ currentUser }) {
  const { tournamentId } = useParams();
  const [tournament, setTournament] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, title: '', message: '', onConfirm: null });
  const [copyMessage, setCopyMessage] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      if (!tournamentId) return;
      setIsLoading(true);
      try {
        const tournamentData = await api.getTournamentById(tournamentId);
        setTournament(tournamentData);
        setParticipants(tournamentData.participants || []);
      } catch (err) {
        setError(err.message || 'Failed to fetch data');
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [tournamentId]);

  const handleInvite = async () => {
    if (!tournament?.invitation_link) return;
    const inviteLink = `${window.location.origin}${tournament.invitation_link}`;

    if (navigator.share && window.isSecureContext) {
      try {
        await navigator.share({
          title: `Join my tournament: ${tournament.name}`,
          text: `Join my tournament '${tournament.name}' on Match Point!`,
          url: inviteLink,
        });
      } catch (error) {
        if (error.name !== 'AbortError') console.error('Share API failed:', error);
      }
    } else if (navigator.clipboard?.writeText && window.isSecureContext) {
      try {
        await navigator.clipboard.writeText(inviteLink);
        setCopyMessage('Link copied!');
        setTimeout(() => setCopyMessage(''), 3000);
      } catch (error) {
        console.error('Clipboard API failed:', error);
        window.prompt('Copy to clipboard failed. Please copy this link manually:', inviteLink);
      }
    } else {
      window.prompt('Please copy this link to invite others:', inviteLink);
    }
  };

  const handleRemoveParticipant = async (participantId) => {
    setConfirmModal({
      isOpen: true,
      title: 'Remove Participant',
      message: 'Are you sure you want to remove this participant?',
      onConfirm: async () => {
        try {
          await api.removeParticipantFromTournament(tournamentId, participantId);
          setParticipants(prev => prev.filter(p => p.id !== participantId));
        } catch (err) {
          setError(err.message || 'Failed to remove participant');
        }
        setConfirmModal({ isOpen: false });
      }
    });
  };

  if (isLoading) return <p className="text-center py-10 text-slate-500 dark:text-slate-400">Loading...</p>;
  if (error) return <p className="text-center py-10 text-red-500">{error}</p>;
  if (!tournament) return <p className="text-center py-10 text-slate-500 dark:text-slate-400">Tournament not found.</p>;

  const isOwner = currentUser && tournament.user_id === currentUser.id;

  return (
    <div className="p-4 pb-24">
      <div className="px-2 mb-3 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-50">Players</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">{participants.length} participants</p>
        </div>
        {isOwner && tournament.registration_open && (
          <button 
            onClick={handleInvite}
            className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white bg-primary rounded-full hover:bg-indigo-700 transition-colors shadow-md"
          >
            <span className="material-symbols-outlined text-base">share</span>
            <span>Invite</span>
          </button>
        )}
      </div>

      {copyMessage && (
        <div className="mb-3 px-2">
          <p className="text-sm text-green-600 dark:text-green-400">{copyMessage}</p>
        </div>
      )}

      {participants.length === 0 ? (
        <div className="bg-white dark:bg-surface-dark rounded-xl shadow-sm p-8 text-center">
          <span className="material-symbols-outlined text-slate-400 dark:text-slate-500 text-5xl mb-3">group_off</span>
          <p className="text-slate-500 dark:text-slate-400">No participants yet</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-surface-dark rounded-xl shadow-sm overflow-hidden">
          <div className="divide-y divide-gray-200 dark:divide-border-dark">
            {participants.map((participant) => (
              <div key={participant.id} className="flex items-center justify-between p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="w-10 h-10 rounded-full bg-primary/10 dark:bg-primary/20 flex items-center justify-center flex-shrink-0">
                    <span className="material-symbols-outlined text-primary text-xl">person</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-900 dark:text-slate-50 truncate">{participant.name}</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400 truncate">{participant.email}</p>
                  </div>
                </div>
                {isOwner && (
                  <button
                    onClick={() => handleRemoveParticipant(participant.id)}
                    className="ml-3 w-8 h-8 flex items-center justify-center text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-full transition-colors flex-shrink-0"
                    title="Remove participant"
                  >
                    <span className="material-symbols-outlined text-base">delete</span>
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

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

export default Participants;