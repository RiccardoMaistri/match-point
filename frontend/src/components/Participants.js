import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import * as api from '../services/api';
import ConfirmModal from './ConfirmModal';

function Participants({ currentUser }) {
  const { tournamentId } = useParams();
  const navigate = useNavigate();
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
    if (!tournament?.invitation_link) {
        console.error("No invitation link found for this tournament.");
        return;
    }

    const inviteLink = `${window.location.origin}${tournament.invitation_link}`;

    if (navigator.share && window.isSecureContext) {
      try {
        await navigator.share({
          title: `Join my tournament: ${tournament.name}`,
          text: `Join my tournament '${tournament.name}' on Match Point!`,
          url: inviteLink,
        });
      } catch (error) {
        if (error.name !== 'AbortError') {
          console.error('Share API failed:', error);
        }
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
          setParticipants(prevParticipants => prevParticipants.filter(p => p.id !== participantId));
        } catch (err) {
          setError(err.message || 'Failed to remove participant');
        }
        setConfirmModal({ isOpen: false });
      }
    });
  };

  if (isLoading) return <p className="text-center py-10 text-subtext-light dark:text-subtext-dark">Loading...</p>;
  if (error) return <p className="text-center py-10 text-red-500">{error}</p>;
  if (!tournament) return <p className="text-center py-10 text-subtext-light dark:text-subtext-dark">Tournament not found.</p>;

  const isOwner = currentUser && tournament.user_id === currentUser.id;
  const canManageParticipants = tournament.registration_open;

  return (
    <div className="max-w-md mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-24">
      <div className="space-y-4">
        <div className="bg-card-light dark:bg-card-dark rounded-lg shadow-md overflow-hidden">
            <div className="p-4">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-text-light dark:text-text-dark">Participants ({participants.length})</h3>
                    {isOwner && canManageParticipants && (
                        <button 
                        onClick={handleInvite}
                        className="px-4 py-2 text-sm font-semibold text-white bg-primary rounded-lg hover:bg-indigo-700 transition-colors shadow-lg"
                        >
                        Invite
                        </button>
                    )}
                </div>
                {copyMessage && <p className="text-sm text-primary dark:text-primary mb-4">{copyMessage}</p>}
                {participants.length === 0 ? (
                <p className="text-sm text-subtext-light dark:text-subtext-dark py-8 text-center">No participants yet.</p>
                ) : (
                <div className="space-y-3">
                    {participants.map((participant, index) => (
                    <div key={participant.id} className={`flex justify-between items-center p-3 rounded-lg ${index % 2 === 0 ? 'bg-gray-50 dark:bg-gray-800/50' : ''}`}>
                        <div className="flex-grow min-w-0">
                        <p className="font-semibold text-text-light dark:text-text-dark truncate">{participant.name}</p>
                        <p className="text-sm text-subtext-light dark:text-subtext-dark truncate">{participant.email}</p>
                        </div>
                        {isOwner && (
                        <button
                            onClick={() => handleRemoveParticipant(participant.id)}
                            className="ml-3 w-8 h-8 flex items-center justify-center text-red-500 hover:bg-red-100 dark:hover:bg-red-500/10 rounded-full transition-colors flex-shrink-0"
                            title="Remove participant"
                        >
                            <span className="material-symbols-outlined text-base">delete</span>
                        </button>
                        )}
                    </div>
                    ))}
                </div>
                )}
            </div>
        </div>
      </div>

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