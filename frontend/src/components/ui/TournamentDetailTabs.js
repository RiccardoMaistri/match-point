import React from 'react';

const TournamentDetailTabs = ({ activeTab, onTabChange }) => {
  return (
    <div className="pb-3">
      <div className="flex border-b border-gray-700 px-4 gap-8">
        <button 
          className={`flex flex-col items-center justify-center border-b-[3px] ${
            activeTab === 'participants' 
              ? 'border-b-gray-200 text-white' 
              : 'border-b-transparent text-gray-400'
          } pb-[13px] pt-4`}
          onClick={() => onTabChange('participants')}
        >
          <p className={`text-sm font-bold leading-normal tracking-[0.015em] ${
            activeTab === 'participants' ? 'text-white' : 'text-gray-400'
          }`}>
            Participants
          </p>
        </button>
        
        <button 
          className={`flex flex-col items-center justify-center border-b-[3px] ${
            activeTab === 'matches' 
              ? 'border-b-gray-200 text-white' 
              : 'border-b-transparent text-gray-400'
          } pb-[13px] pt-4`}
          onClick={() => onTabChange('matches')}
        >
          <p className={`text-sm font-bold leading-normal tracking-[0.015em] ${
            activeTab === 'matches' ? 'text-white' : 'text-gray-400'
          }`}>
            Matches
          </p>
        </button>
      </div>
    </div>
  );
};

export default TournamentDetailTabs;