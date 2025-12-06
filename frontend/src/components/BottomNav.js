import React, { useState, useEffect } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import * as api from '../services/api';

const BottomNav = ({ 
  tournamentId, 
  playoffLocked, 
  matchesLeft, 
  groupStageComplete, 
  playoffsStarted,
  tournament,
  currentUser,
  onGeneratePlayoffs 
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [showNewBadge, setShowNewBadge] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const isOwner = currentUser && tournament && tournament.user_id === currentUser.id;
  const showStartButton = groupStageComplete && !playoffsStarted && isOwner;
  const showWaitingForAdmin = groupStageComplete && !playoffsStarted && !isOwner;

  // Check if the NEW badge should be shown
  useEffect(() => {
    if (!tournamentId) return;
    
    const badgeKey = `playoff_badge_seen_${tournamentId}`;
    const badgeSeen = localStorage.getItem(badgeKey);
    
    // Show badge only if playoffs have started AND badge hasn't been seen yet
    setShowNewBadge(playoffsStarted && !badgeSeen);
  }, [tournamentId, playoffsStarted]);

  const handlePlayoffClick = async (e) => {
    e.preventDefault();
    
    // If waiting for admin, do nothing
    if (showWaitingForAdmin) {
      return;
    }
    
    // If admin needs to start playoffs
    if (showStartButton) {
      setIsGenerating(true);
      try {
        await api.generatePlayoffs(tournamentId);
        await onGeneratePlayoffs(); // Refresh tournament data
        // Navigate to playoff after generation
        navigate(`/tournaments/${tournamentId}/playoff`);
      } catch (err) {
        console.error("Failed to generate playoffs", err);
        alert("Failed to generate playoffs");
      } finally {
        setIsGenerating(false);
      }
      return;
    }
    
    // Normal navigation - playoffs already started
    if (!playoffLocked) {
      // Mark badge as seen on first click
      if (showNewBadge && tournamentId) {
        localStorage.setItem(`playoff_badge_seen_${tournamentId}`, 'true');
        setShowNewBadge(false);
      }
      navigate(`/tournaments/${tournamentId}/playoff`);
    }
  };

  if (!tournamentId) return null;

  const isPlayoffActive = location.pathname.includes('/playoff');

  return (
    <footer className="fixed bottom-0 left-0 right-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-t border-border-light dark:border-border-dark safe-area-bottom">
      <nav className="flex justify-around items-center p-2">
        <NavLink 
          to={`/tournaments/${tournamentId}/group-stage`} 
          className={({ isActive }) => `flex flex-col items-center justify-center space-y-1 w-1/3 py-2 ${isActive ? 'bg-primary-light dark:bg-primary/20 rounded-2xl' : ''}`}
        >
          <span className={`material-symbols-outlined ${location.pathname.includes('/group-stage') ? 'text-primary dark:text-indigo-400' : 'text-slate-500 dark:text-slate-400'}`}>view_list</span>
          <span className={`text-xs ${location.pathname.includes('/group-stage') ? 'font-semibold text-primary dark:text-indigo-400' : 'font-medium text-slate-500 dark:text-slate-400'}`}>Group Stage</span>
        </NavLink>
        
        <div className="h-8 w-px bg-slate-300 dark:bg-slate-600"></div>
        
        <button
          onClick={handlePlayoffClick}
          disabled={isGenerating || playoffLocked}
          className={`flex flex-col items-center justify-center min-w-0 w-1/3 py-2 relative min-h-[60px] transition-all duration-300 ${
            playoffLocked ? 'cursor-not-allowed opacity-60' : 
            showStartButton ? 'bg-gradient-to-tr from-amber-400/20 via-orange-400/20 to-red-400/20 dark:from-amber-400/30 dark:via-orange-400/30 dark:to-red-400/30 rounded-2xl shadow-lg shadow-orange-500/20 dark:shadow-orange-500/30 hover:shadow-xl hover:shadow-orange-500/30 dark:hover:shadow-orange-500/40 hover:scale-105 active:scale-100' :
            isPlayoffActive ? 'bg-primary-light dark:bg-primary/20 rounded-2xl' : 
            'hover:bg-slate-100 dark:hover:bg-slate-800 rounded-2xl'
          } ${isGenerating ? 'cursor-wait animate-pulse' : ''}`}
        >
          <div className="relative mb-1">
            {playoffLocked ? (
                <span className={`material-symbols-outlined text-slate-400 dark:text-slate-500`}>
                    lock
                </span>
            ) : showWaitingForAdmin ? (
                <span className={`material-symbols-outlined text-amber-500/70 dark:text-amber-400/70`}>
                    hourglass_top
                </span>
            ) : isGenerating ? (
                <span className={`material-symbols-outlined text-amber-500 dark:text-amber-400 animate-spin`}>
                    progress_activity
                </span>
            ) : showStartButton ? (
                <div className="relative">
                    <span className={`material-symbols-outlined text-transparent bg-clip-text bg-gradient-to-tr from-amber-500 via-orange-500 to-red-500 transition-all duration-300 text-3xl animate-pulse`}>
                        emoji_events
                    </span>
                    {/* Sparkle effect */}
                    <span className="absolute -top-1 -right-1 text-amber-400 text-xs animate-ping">✨</span>
                </div>
            ) : (
                <span className={`material-symbols-outlined ${isPlayoffActive ? 'text-primary dark:text-indigo-400' : 'text-slate-500 dark:text-slate-400'} transition-all duration-300`}>
                    emoji_events
                </span>
            )}
            
            {/* NEW Badge */}
            {showNewBadge && !playoffLocked && playoffsStarted && (
                <span className="absolute -top-1 -right-3 bg-gradient-to-r from-red-500 to-pink-500 text-white text-[8px] font-bold px-1.5 py-0.5 rounded-full shadow-lg animate-pulse">
                    NEW
                </span>
            )}
          </div>
          
          <div className="flex flex-col items-center">
            <span className={`text-sm font-semibold ${
              showStartButton ? 'text-transparent bg-clip-text bg-gradient-to-r from-amber-600 via-orange-600 to-red-600 dark:from-amber-400 dark:via-orange-400 dark:to-red-400' :
              isPlayoffActive ? 'text-primary dark:text-indigo-400' : 
              'font-medium text-slate-500 dark:text-slate-400'
            } transition-all duration-300`}>
              {isGenerating ? 'Starting...' : showStartButton ? 'Start Playoffs' : 'Playoff'}
            </span>
            
            {/* Sub-label for locked state */}
            {playoffLocked && matchesLeft > 0 && (
                <span className="text-[9px] text-slate-400 dark:text-slate-500 font-medium mt-0.5">
                    {matchesLeft} match{matchesLeft !== 1 ? 'es' : ''} left
                </span>
            )}
            
            {/* Sub-label for waiting state */}
            {showWaitingForAdmin && (
                <span className="text-[9px] text-amber-600/70 dark:text-amber-400/70 font-medium mt-0.5 animate-pulse leading-tight text-center px-1">
                    Are about to start
                </span>
            )}
          </div>
        </button>

        <div className="h-8 w-px bg-slate-300 dark:bg-slate-600"></div>

        <NavLink 
          to={`/tournaments/${tournamentId}/players`} 
          className={({ isActive }) => `flex flex-col items-center justify-center space-y-1 w-1/3 py-2 ${isActive ? 'bg-primary-light dark:bg-primary/20 rounded-2xl' : ''}`}
        >
          <span className={`material-symbols-outlined ${location.pathname.includes('/players') ? 'text-primary dark:text-indigo-400' : 'text-slate-500 dark:text-slate-400'}`}>groups</span>
          <span className={`text-xs ${location.pathname.includes('/players') ? 'font-semibold text-primary dark:text-indigo-400' : 'font-medium text-slate-500 dark:text-slate-400'}`}>Players</span>
        </NavLink>
      </nav>
    </footer>
  );
};

export default BottomNav;
