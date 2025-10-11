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
        const [tournamentData, participantsData] = await Promise.all([
          api.getTournamentById(tournamentId),
          api.getTournamentParticipants(tournamentId)
        ]);
        setTournament(tournamentData);
        setParticipants(participantsData);
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

    // Construct the full URL at runtime using the current host.
    const inviteLink = `${window.location.origin}${tournament.invitation_link}`;

    // The Web Share API and modern Clipboard API require a secure context (HTTPS).
    // When on an insecure context (like a local network IP), they will not be available.
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
      // Fallback for insecure contexts or older browsers
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
          const updatedParticipants = await api.getTournamentParticipants(tournamentId);
          setParticipants(updatedParticipants);
        } catch (err) {
          setError(err.message || 'Failed to remove participant');
        }
        setConfirmModal({ isOpen: false });
      }
    });
  };

  if (isLoading) return <p className="text-center py-10">Loading...</p>;
  if (error) return <p className="text-center py-10 text-red-500">{error}</p>;
  if (!tournament) return <p className="text-center py-10">Tournament not found.</p>;

  const isOwner = currentUser && tournament.user_id === currentUser.id;
  const canManageParticipants = tournament.registration_open;

  return (
    <div className="p-3 pb-16">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="flex items-center justify-between p-3 border-b border-gray-100">
          <h3 className="text-base font-bold text-primary-text">Participants ({participants.length})</h3>
          {isOwner && canManageParticipants && (
            <button 
              onClick={handleInvite}
              className="px-3 py-1.5 text-xs font-semibold text-white bg-primary rounded-lg hover:bg-primary-hover transition-colors shadow-sm"
            >
              Invite
            </button>
          )}
        </div>
        {copyMessage && <p className="text-xs text-blue-600 px-3 py-2">{copyMessage}</p>}
        {participants.length === 0 ? (
          <p className="text-sm text-secondary-text py-8 text-center">No participants yet.</p>
        ) : (
          <div className="divide-y divide-gray-100">
            {participants.map((participant) => (
              <div key={participant.id} className="flex justify-between items-center p-3 hover:bg-gray-50 transition-colors">
                <div className="flex-grow min-w-0">
                  <p className="font-semibold text-primary-text text-sm truncate">{participant.name}</p>
                  <p className="text-[11px] text-secondary-text truncate">{participant.email}</p>
                </div>
                {isOwner && (
                  <button
                    onClick={() => handleRemoveParticipant(participant.id)}
                    className="ml-3 w-8 h-8 flex items-center justify-center text-red-500 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0"
                    title="Remove participant"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
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
