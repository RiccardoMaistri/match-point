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
  const [selectedPartner, setSelectedPartner] = useState(null);
  const [isCreatingTeam, setIsCreatingTeam] = useState(false);

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

  const handleCreateTeam = async (partnerId) => {
    if (!currentUser || !partnerId) return;
    
    const currentUserParticipant = participants.find(p => p.email === currentUser.email);
    if (!currentUserParticipant) return;
    
    setIsCreatingTeam(true);
    try {
      await api.createTeam(tournamentId, currentUserParticipant.id, partnerId);
      // Refresh tournament data
      const tournamentData = await api.getTournamentById(tournamentId);
      setTournament(tournamentData);
      setSelectedPartner(null);
    } catch (err) {
      setError(err.message || 'Failed to create team');
    } finally {
      setIsCreatingTeam(false);
    }
  };

  const handleDeleteTeam = async (teamId) => {
    setIsCreatingTeam(true);
    try {
      await api.deleteTeam(tournamentId, teamId);
      // Refresh tournament data
      const tournamentData = await api.getTournamentById(tournamentId);
      setTournament(tournamentData);
    } catch (err) {
      setError(err.message || 'Failed to delete team');
    } finally {
      setIsCreatingTeam(false);
    }
  };

  if (isLoading) return <p className="text-center py-10 text-slate-500 dark:text-slate-400">Loading...</p>;
  if (error) return <p className="text-center py-10 text-red-500">{error}</p>;
  if (!tournament) return <p className="text-center py-10 text-slate-500 dark:text-slate-400">Tournament not found.</p>;

  const isOwner = currentUser && tournament.user_id === currentUser.id;
  const currentUserParticipant = currentUser ? participants.find(p => p.email === currentUser.email) : null;
  const isDoubles = tournament?.tournament_type === 'double';
  const teams = tournament?.teams || [];
  
  // Check if current user is already in a team
  const currentUserTeam = currentUserParticipant ? teams.find(t => 
    t.player1_id === currentUserParticipant.id || t.player2_id === currentUserParticipant.id
  ) : null;
  
  // Get participants not in any team
  const unpairedParticipants = participants.filter(p => 
    !teams.some(t => t.player1_id === p.id || t.player2_id === p.id)
  );
  
  // Available partners (excluding current user)
  const availablePartners = unpairedParticipants.filter(p => 
    currentUserParticipant && p.id !== currentUserParticipant.id
  );

  return (
    <div className="fixed top-[44px] left-0 right-0 bottom-[72px] flex flex-col">
      <div className="px-4 pt-3 pb-3">
        <div className="px-2 flex items-center justify-between">
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
          <div className="mt-3 px-2">
            <p className="text-sm text-green-600 dark:text-green-400">{copyMessage}</p>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-4">
        <div className="pb-6 space-y-6">
          {/* Current User's Team */}
          {isDoubles && currentUserTeam && (
            <div className="bg-green-50 dark:bg-green-900/20 rounded-3xl p-4 border border-green-200 dark:border-green-800">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-green-600 dark:text-green-400">group</span>
                  <h3 className="font-semibold text-green-800 dark:text-green-300">Your Team</h3>
                </div>
                <button
                  onClick={() => handleDeleteTeam(currentUserTeam.id)}
                  disabled={isCreatingTeam}
                  className="w-6 h-6 flex items-center justify-center text-red-500 hover:bg-red-100 dark:hover:bg-red-500/10 rounded-full transition-colors disabled:opacity-50"
                  title="Leave team"
                >
                  <span className="material-symbols-outlined text-sm">close</span>
                </button>
              </div>
              <div className="flex items-center gap-3">
                {[currentUserTeam.player1_id, currentUserTeam.player2_id].map(playerId => {
                  const player = participants.find(p => p.id === playerId);
                  return player ? (
                    <div key={player.id} className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-slate-800 rounded-xl">
                      <div className="w-6 h-6 rounded-full bg-green-100 dark:bg-green-800 flex items-center justify-center">
                        <span className="material-symbols-outlined text-green-600 dark:text-green-400 text-sm">person</span>
                      </div>
                      <span className="text-sm font-medium text-slate-900 dark:text-slate-50">
                        {player.name !== player.email ? player.name : player.email.split('@')[0]}
                      </span>
                    </div>
                  ) : null;
                })}
              </div>
            </div>
          )}

          {/* Other Teams */}
          {isDoubles && teams.length > 0 && teams.filter(t => t.id !== currentUserTeam?.id).length > 0 && (
            <div>
              <div className="px-2 mb-3">
                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-50">Other Teams</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {teams.filter(t => t.id !== currentUserTeam?.id).length} team{teams.filter(t => t.id !== currentUserTeam?.id).length !== 1 ? 's' : ''}
                </p>
              </div>
              <div className="bg-white dark:bg-surface-dark rounded-3xl shadow-sm overflow-hidden">
                <div className="divide-y divide-gray-200 dark:divide-border-dark">
                  {teams.filter(t => t.id !== currentUserTeam?.id).map((team, index) => {
                    const player1 = participants.find(p => p.id === team.player1_id);
                    const player2 = participants.find(p => p.id === team.player2_id);
                    return (
                      <div key={team.id} className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-primary/10 dark:bg-primary/20 flex items-center justify-center">
                            <span className="material-symbols-outlined text-primary text-xl">group</span>
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                              <span>{player1?.name !== player1?.email ? player1?.name : player1?.email?.split('@')[0]}</span>
                              <span>•</span>
                              <span>{player2?.name !== player2?.email ? player2?.name : player2?.email?.split('@')[0]}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Individual Participants */}
          {participants.length === 0 ? (
            <div className="bg-white dark:bg-surface-dark rounded-3xl shadow-sm p-8 text-center">
              <span className="material-symbols-outlined text-slate-400 dark:text-slate-500 text-5xl mb-3">group_off</span>
              <p className="text-slate-500 dark:text-slate-400">No participants yet</p>
            </div>
          ) : (
            <div>
              <div className="px-2 mb-3">
                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-50">Players</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {participants.length} participant{participants.length !== 1 ? 's' : ''}
                  {isDoubles && teams.length > 0 && (
                    <span className="text-green-600 dark:text-green-400"> • {teams.length} team{teams.length !== 1 ? 's' : ''} formed</span>
                  )}
                </p>
              </div>
              <div className="bg-white dark:bg-surface-dark rounded-3xl shadow-sm overflow-hidden">
                <div className="divide-y divide-gray-200 dark:divide-border-dark">
                  {participants.map((participant) => {
                    const isInTeam = isDoubles && teams.some(t => t.player1_id === participant.id || t.player2_id === participant.id);
                    const isCurrentUser = currentUserParticipant && participant.id === currentUserParticipant.id;
                    const canTeamWith = isDoubles && !isCurrentUser && !isInTeam && !currentUserTeam && currentUserParticipant;
                    
                    return (
                      <div key={participant.id} className="flex items-center justify-between p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 relative ${
                            isInTeam ? 'bg-green-100 dark:bg-green-800' : 'bg-primary/10 dark:bg-primary/20'
                          }`}>
                            <span className={`material-symbols-outlined text-xl ${
                              isInTeam ? 'text-green-600 dark:text-green-400' : 'text-primary'
                            }`}>person</span>
                            {canTeamWith && (
                              <button
                                onClick={() => handleCreateTeam(participant.id)}
                                disabled={isCreatingTeam}
                                className="absolute -top-1 -right-1 w-6 h-6 bg-blue-500 hover:bg-blue-600 text-white rounded-full flex items-center justify-center text-sm transition-colors disabled:opacity-50"
                                title="Team up with this player"
                              >
                                <span className="material-symbols-outlined text-sm">add</span>
                              </button>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="font-semibold text-slate-900 dark:text-slate-50 truncate">
                                {participant.name !== participant.email ? participant.name : participant.email.split('@')[0]}
                              </p>
                              {isCurrentUser && (
                                <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-800 text-blue-700 dark:text-blue-300 text-xs font-medium rounded-full">
                                  You
                                </span>
                              )}
                              {isInTeam && !isCurrentUser && (
                                <span className="px-2 py-0.5 bg-green-100 dark:bg-green-800 text-green-700 dark:text-green-300 text-xs font-medium rounded-full">
                                  Teamed
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-slate-500 dark:text-slate-400 truncate">{participant.email}</p>
                          </div>
                        </div>
                        {isOwner && !(isDoubles && teams.length > 0) && (
                          <button
                            onClick={() => handleRemoveParticipant(participant.id)}
                            className="ml-3 w-8 h-8 flex items-center justify-center text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-full transition-colors flex-shrink-0"
                            title="Remove participant"
                          >
                            <span className="material-symbols-outlined text-base">delete</span>
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
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