import React, { useState } from 'react';
import * as api from '../services/api';

const Header = ({ title, tournaments, currentTournamentId, onTournamentChange, onAdd }) => {
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const selectedId = currentTournamentId || (tournaments && tournaments.length > 0 ? tournaments[0].id : null);
  const currentTournament = tournaments?.find(t => t.id === selectedId);

  const handleSubmitFeedback = async () => {
    if (!feedback.trim()) return;
    setIsSubmitting(true);
    try {
      await api.submitFeedback(feedback);
      setFeedback('');
      setShowFeedback(false);
    } catch (error) {
      console.error('Failed to submit feedback:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
    <header className="fixed top-0 left-0 right-0 z-50 px-4 py-3 bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-sm border-b border-border-light dark:border-border-dark">
      <div className="flex items-center justify-between">
        <button onClick={() => setShowFeedback(true)} className="w-10 h-10 flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
          <span className="material-symbols-outlined text-slate-600 dark:text-slate-400">feedback</span>
        </button>
        <div className="text-center">
          {tournaments && tournaments.length > 0 ? (
            <>
              <div className="flex items-center justify-center gap-1">
                <select
                  value={selectedId}
                  onChange={(e) => onTournamentChange(e.target.value)}
                  className="text-lg font-bold text-slate-900 dark:text-slate-50 bg-transparent border-none focus:outline-none cursor-pointer"
                >
                  {tournaments.map(t => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
                <span className="material-symbols-outlined text-slate-500 dark:text-slate-400">expand_more</span>
              </div>
              {currentTournament && (
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {currentTournament.format.replace('_', ' ').split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')} · {currentTournament.participants?.length || 0} player{currentTournament.participants?.length !== 1 ? 's' : ''}
                </p>
              )}
            </>
          ) : (
            <h1 className="text-lg font-bold text-slate-900 dark:text-slate-50">{title}</h1>
          )}
        </div>
        {onAdd && (
          <button
            onClick={onAdd}
            className="w-10 h-10 flex items-center justify-center bg-primary text-white rounded-full shadow-md hover:bg-primary/90 transition-colors"
            aria-label="Create new tournament"
          >
            <span className="material-symbols-outlined text-2xl">add</span>
          </button>
        )}
      </div>
    </header>

    {showFeedback && (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
        <div className="bg-white dark:bg-surface-dark rounded-xl shadow-xl max-w-md w-full p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-50">Send Feedback</h3>
            <button onClick={() => setShowFeedback(false)} className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-300">
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>
          <textarea
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            placeholder="Tell us what you think..."
            className="w-full h-32 px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-50"
          />
          <div className="flex gap-3 mt-4">
            <button
              onClick={() => setShowFeedback(false)}
              className="flex-1 px-4 py-2 text-sm font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmitFeedback}
              disabled={!feedback.trim() || isSubmitting}
              className="flex-1 px-4 py-2 text-sm font-semibold text-white bg-primary rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Sending...' : 'Send'}
            </button>
          </div>
        </div>
      </div>
    )}
    </>
  );
};

export default Header;
