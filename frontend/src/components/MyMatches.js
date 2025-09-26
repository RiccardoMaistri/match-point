import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import * as api from '../services/api';

const MyMatches = ({ tournaments, currentUser, onResultSubmitted }) => {
  const [editingMatchId, setEditingMatchId] = useState(null);
  const [scores, setScores] = useState({ 
    set1: { score1: '', score2: '' },
    set2: { score1: '', score2: '' },
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  if (!currentUser) {
    return <p className="text-center p-4">Please log in to see your matches.</p>;
  }

  const myOngoingMatches = tournaments
    .flatMap(tournament =>
      (tournament.matches || []).map(match => ({
        ...match,
        tournamentName: tournament.name,
        tournamentId: tournament.id,
        participants: tournament.participants || [],
      }))
    )
    .filter(match => {
      if (match.status === 'completed' || match.is_bye) {
        return false;
      }
      const p1 = match.participants.find(p => p.id === match.participant1_id);
      const p2 = match.participants.find(p => p.id === match.participant2_id);
      return (p1 && p1.email === currentUser.email) || (p2 && p2.email === currentUser.email);
    });

  const groupedMatches = myOngoingMatches.reduce((acc, match) => {
    const { tournamentId, tournamentName } = match;
    if (!acc[tournamentId]) {
      acc[tournamentId] = {
        tournamentName,
        tournamentId,
        matches: [],
      };
    }
    acc[tournamentId].matches.push(match);
    return acc;
  }, {});

  const handleRecordClick = (match) => {
    setEditingMatchId(match.id);
    setScores({ 
      set1: { score1: '', score2: '' },
      set2: { score1: '', score2: '' },
    });
    setSubmitError(null);
  };

  const handleCancel = () => {
    setEditingMatchId(null);
    setSubmitError(null);
  };

  const handleScoreChange = (e) => {
    const { name, value } = e.target;
    const [set, scoreKey] = name.split('-');
    setScores(prev => ({
        ...prev,
        [set]: {
            ...prev[set],
            [scoreKey]: value
        }
    }));
  };

  const handleSubmitResult = async (e, match) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitError(null);

    const s1p1 = parseInt(scores.set1.score1, 10);
    const s1p2 = parseInt(scores.set1.score2, 10);
    const s2p1 = parseInt(scores.set2.score1, 10);
    const s2p2 = parseInt(scores.set2.score2, 10);

    const totalScore1 = (isNaN(s1p1) ? 0 : s1p1) + (isNaN(s2p1) ? 0 : s2p1);
    const totalScore2 = (isNaN(s1p2) ? 0 : s1p2) + (isNaN(s2p2) ? 0 : s2p2);

    if (isNaN(s1p1) && isNaN(s1p2) && isNaN(s2p1) && isNaN(s2p2)) {
        setSubmitError('Please enter a score for at least one set.');
        setIsSubmitting(false);
        return;
    }

    const resultData = {
      score_participant1: totalScore1,
      score_participant2: totalScore2,
    };

    try {
      await api.recordMatchResult(match.tournamentId, match.id, resultData);
      setEditingMatchId(null);
      if (onResultSubmitted) {
        onResultSubmitted();
      }
    } catch (error) {
      setSubmitError(error.message || 'Failed to submit result.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-4">
      
      {Object.keys(groupedMatches).length > 0 ? (
        <div className="space-y-8 max-w-2xl mx-auto">
          {Object.values(groupedMatches).map(group => (
            <div key={group.tournamentId} className="bg-white rounded-lg shadow-md">
              <h2 className="text-xl font-bold text-primary p-4 border-b border-gray-200">{group.tournamentName}</h2>
              <div className="space-y-4 p-4">
                {group.matches.map(match => {
                  const p1 = match.participants.find(p => p.id === match.participant1_id);
                  const p2 = match.participants.find(p => p.id === match.participant2_id);
                  const isEditing = editingMatchId === match.id;

                  return (
                    <div key={match.id} className="bg-gray-50 rounded-lg p-4 border-l-4 border-primary">
                      <div className="mt-2">
                        <p className="text-secondary-text">
                          <span className={p1?.email === currentUser.email ? 'font-bold' : ''}>{p1 ? p1.name : 'N/A'}</span>
                          <span className="mx-2">vs</span>
                          <span className={p2?.email === currentUser.email ? 'font-bold' : ''}>{p2 ? p2.name : 'N/A'}</span>
                        </p>
                        <p className="text-sm text-gray-500 mt-1">
                          Status: <span className="font-semibold capitalize">{match.status.replace('_', ' ')}</span>
                        </p>
                      </div>

                      {isEditing ? (
                        <form onSubmit={(e) => handleSubmitResult(e, match)} className="mt-4 space-y-3">
                          <div className="flex items-center gap-4">
                              <div className="w-12"></div>
                              <div className="flex-1"><label className="block text-sm font-medium text-gray-700">{p1?.name}</label></div>
                              <div className="flex-1"><label className="block text-sm font-medium text-gray-700">{p2?.name}</label></div>
                          </div>
                          <div className="flex items-center gap-4">
                              <p className="text-sm font-medium text-gray-500 w-12">Set 1</p>
                              <div className="flex-1">
                                  <input type="number" name="set1-score1" value={scores.set1.score1} onChange={handleScoreChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm" />
                              </div>
                              <div className="flex-1">
                                  <input type="number" name="set1-score2" value={scores.set1.score2} onChange={handleScoreChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm" />
                              </div>
                          </div>
                          <div className="flex items-center gap-4">
                              <p className="text-sm font-medium text-gray-500 w-12">Set 2</p>
                              <div className="flex-1">
                                  <input type="number" name="set2-score1" value={scores.set2.score1} onChange={handleScoreChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm" />
                              </div>
                              <div className="flex-1">
                                  <input type="number" name="set2-score2" value={scores.set2.score2} onChange={handleScoreChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm" />
                              </div>
                          </div>

                          {submitError && <p className="text-sm text-red-600">{submitError}</p>}
                          <div className="flex items-center gap-2 pt-2">
                            <button type="submit" disabled={isSubmitting} className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-md hover:bg-primary-hover disabled:bg-gray-400">
                              {isSubmitting ? 'Submitting...' : 'Submit Result'}
                            </button>
                            <button type="button" onClick={handleCancel} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300">
                              Cancel
                            </button>
                          </div>
                        </form>
                      ) : (
                        <div className="mt-4 flex gap-2">
                          <button onClick={() => handleRecordClick(match)} className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-md hover:bg-primary-hover">
                              Record Result
                          </button>
                          <Link to={`/tournaments/${match.tournamentId}`} className="px-4 py-2 text-sm font-medium text-primary border border-primary rounded-md hover:bg-primary-lightest">
                              View Tournament
                          </Link>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center p-10 bg-white rounded-lg shadow-md max-w-md mx-auto">
            <p className="text-secondary-text">You have no ongoing matches at the moment.</p>
        </div>
      )}
    </div>
  );
};

export default MyMatches;
