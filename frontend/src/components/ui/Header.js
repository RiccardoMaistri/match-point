import React from 'react';
import { useNavigate } from 'react-router-dom';

const Header = ({ title, showBackButton = false, actionIcon = null, onActionClick = null, currentUser }) => {
  const navigate = useNavigate();

  const handleBackClick = () => {
    navigate(-1);
  };

  return (
    <div className="flex items-center bg-gray-900 p-4 pb-2 justify-between">
      <div className="flex-1 flex justify-start">
        {showBackButton ? (
          <div 
            className="text-white flex size-12 shrink-0 items-center cursor-pointer -ml-4"
            onClick={handleBackClick}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 256 256">
              <path d="M224,128a8,8,0,0,1-8,8H59.31l58.35,58.34a8,8,0,0,1-11.32,11.32l-72-72a8,8,0,0,1,0-11.32l72-72a8,8,0,0,1,11.32,11.32L59.31,120H216A8,8,0,0,1,224,128Z"></path>
            </svg>
          </div>
        ) : currentUser ? (
          <div className="text-white text-xs truncate">
            {currentUser.email}
          </div>
        ) : (
          <div/>
        )}
      </div>
      
      <div className="flex-shrink-0">
        <h2 className="text-white text-lg font-bold leading-tight tracking-[-0.015em] text-center">
          {title}
        </h2>
      </div>
      
      <div className="flex flex-1 items-center justify-end">
        {actionIcon ? (
          <button
            className="flex cursor-pointer items-center justify-center overflow-hidden rounded-xl h-12 bg-transparent text-white gap-2 text-base font-bold leading-normal tracking-[0.015em] min-w-0 p-0"
            onClick={onActionClick}
          >
            {actionIcon}
          </button>
        ) : (
          <div/>
        )}
      </div>
    </div>
  );
};

export default Header;