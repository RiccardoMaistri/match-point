import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import Layout from '../components/ui/Layout';
import TournamentDetailHeader from '../components/ui/TournamentDetailHeader';
import TournamentDetailTabs from '../components/ui/TournamentDetailTabs';
import * as api from '../services/api';
import Bracket from '../components/Bracket';
import MatchdayView from '../components/MatchdayView';
import RecordResultModal from '../components/RecordResultModal';


const TournamentDetailPage = ({ currentUser }) => {
  const { tournamentId } = useParams();
  const [tournament, setTournament] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [matches, setMatches] = useState([]);
  const [activeTab, setActiveTab] = useState('matches');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedMatchday, setSelectedMatchday] = useState(1);
  const [isRecordModalOpen, setRecordModalOpen] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [isGroupStageVisible, setGroupStageVisible] = useState(true);


  const fetchTournamentDetails = async () => {
    if (!tournamentId) return;
    
    setIsLoading(true);
    setError(null);
    try {
      const [tournamentData, participantsData, matchesData] = await Promise.all([
        api.getTournamentById(tournamentId),
        api.getTournamentParticipants(tournamentId),
        api.getTournamentMatches(tournamentId)
      ]);
      
      setTournament(tournamentData);
      setParticipants(participantsData);
      setMatches(matchesData);
    } catch (err) {
      setError(err.message || 'Failed to fetch tournament details');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTournamentDetails();
  }, [tournamentId]);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };

  const handleOpenRecordModal = (matchId) => {
    const match = matches.find(m => m.id === matchId);
    setSelectedMatch(match);
    setRecordModalOpen(true);
  };

  const handleCloseRecordModal = () => {
    setRecordModalOpen(false);
    setSelectedMatch(null);
  };

  const handleSubmitResult = async (tournamentId, matchId, resultData) => {
    try {
      await api.recordMatchResult(tournamentId, matchId, resultData);
      handleCloseRecordModal();
      fetchTournamentDetails(); // Re-fetch data to show updated results
    } catch (error) {
      console.error('Error recording result:', error);
      alert(error.message || 'Failed to record result');
    }
  };

  const renderTabContent = () => {
    if (activeTab === 'participants') {
      return (
        <div className="p-4">
          <h3 className="text-white text-xl font-bold mb-4">Participants</h3>
          {participants.length === 0 ? (
            <p className="text-gray-400">No participants yet.</p>
          ) : (
            <ul className="space-y-2">
              {participants.map(participant => (
                <li key={participant.id} className="bg-gray-800 p-3 rounded-2xl">
                  <p className="text-white font-medium">{participant.name}</p>
                  <p className="text-gray-400 text-sm">{participant.email}</p>
                  {participant.ranking && (
                    <p className="text-gray-400 text-sm">Ranking: {participant.ranking}</p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      );
    } else {
      const maxMatchday = matches.reduce((max, m) => (m.match_day > max ? m.match_day : max), 0);
      const isBracketView = tournament?.format === 'elimination' || tournament?.status === 'playoffs';

      return (
        <>
          {isBracketView && (
            <h2 className="text-white text-[22px] font-bold leading-tight tracking-[-0.015em] px-4 pb-3 pt-5">
              {tournament?.format === 'elimination' ? 'Bracket' : 'Playoffs'}
            </h2>
          )}
          <div className="flex w-full grow bg-gray-900 p-4">
            <div className="w-full gap-1 overflow-hidden bg-gray-900 rounded-3xl flex flex-col">
              {matches.length === 0 ? (
                <div className="flex items-center justify-center w-full bg-gray-800 rounded-2xl h-40">
                  <p className="text-gray-400">No matches available.</p>
                </div>
              ) : (
                <div className="w-full bg-center bg-no-repeat bg-cover aspect-auto rounded-none flex-1">
                  {isBracketView ? (
                    <Bracket 
                      matches={matches} 
                      participants={participants} 
                      tournament={tournament}
                      currentUser={currentUser}
                      onRecordResult={(tournamentId, matchId) => handleOpenRecordModal(matchId)}
                    />
                  ) : (
                    <div className="bg-gray-800 rounded-2xl">
                      <div 
                        className="flex justify-between items-center p-4 cursor-pointer"
                        onClick={() => setGroupStageVisible(!isGroupStageVisible)}
                      >
                        <h3 className="text-white text-xl font-bold">Group Stage Matches</h3>
                        <button className="text-gray-400 hover:text-white">
                          {isGroupStageVisible ? 'Hide' : 'Show'}
                        </button>
                      </div>
                      {isGroupStageVisible && (
                        <div className="p-4 border-t border-gray-700">
                          {maxMatchday > 0 && (
                            <div className="flex space-x-2 mb-4">
                              {[...Array(maxMatchday).keys()].map(i => (
                                <button 
                                  key={i}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedMatchday(i + 1);
                                  }}
                                  className={`px-3 py-1 text-sm font-semibold rounded-2xl ${selectedMatchday === i + 1 ? 'bg-primary text-white' : 'bg-gray-700 text-gray-300'}`}
                                >
                                  Day {i + 1}
                                </button>
                              ))}
                            </div>
                          )}
                          <MatchdayView
                            tournament={tournament}
                            matches={matches}
                            participants={participants}
                            onMatchUpdate={fetchTournamentDetails}
                            currentUser={currentUser}
                            onRecordResult={(tournamentId, matchId) => handleOpenRecordModal(matchId)}
                            selectedMatchday={selectedMatchday}
                          />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </>
      );
    }
  };

  if (isLoading) {
    return (
      <Layout title="Tournament Details" showBackButton={true}>
        <div className="flex justify-center py-8">
          <p className="text-gray-400">Loading tournament details...</p>
        </div>
      </Layout>
    );
  }

  if (error || !tournament) {
    return (
      <Layout title="Tournament Details" showBackButton={true}>
        <div className="flex justify-center py-8">
          <p className="text-red-500">{error || 'Tournament not found'}</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Tournament Details" showBackButton={true}>
      <TournamentDetailHeader tournament={tournament} />
      <TournamentDetailTabs activeTab={activeTab} onTabChange={handleTabChange} />
      {renderTabContent()}
      <RecordResultModal
        isOpen={isRecordModalOpen}
        onClose={handleCloseRecordModal}
        match={selectedMatch}
        participants={participants}
        onSubmitResult={handleSubmitResult}
        tournamentId={tournamentId}
      />
    </Layout>
  );
};

export default TournamentDetailPage;
