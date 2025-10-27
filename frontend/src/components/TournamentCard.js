import React from 'react';
import { useNavigate } from 'react-router-dom';

const TournamentCard = ({ tournament }) => {
  const navigate = useNavigate();

  const formatTournamentType = (type, format) => {
    const typeMap = {
      'single': 'Single',
      'double': 'Double'
    };
    
    const formatMap = {
      'elimination': 'Elimination',
      'round_robin': 'Round Robin'
    };
    
    return `${typeMap[type] || type} | ${formatMap[format] || format}`;
  };
  
  const handleViewClick = () => {
    navigate(`/tournaments/${tournament.id}`);
  };
  
  return (
    <div className="bg-surface-light dark:bg-surface-dark rounded-lg shadow-md overflow-hidden" onClick={handleViewClick}>
      <div className="p-4">
        <h3 className="text-lg font-bold text-text-on-light dark:text-text-on-dark">{tournament.name}</h3>
        <p className="text-sm text-text-on-light dark:text-text-on-dark-secondary">{formatTournamentType(tournament.tournament_type, tournament.format)}</p>
      </div>
    </div>
  );
};

export default TournamentCard;
