import React from 'react';
import { NavLink } from 'react-router-dom';

const BottomNav = ({ onAdd }) => {
  const navLinkClasses = "flex flex-col items-center justify-center gap-0.5 text-secondary-text hover:text-primary transition-colors w-1/3 h-full";
  const activeLinkClasses = "text-primary bg-accent";

  return (
    <nav className="fixed bottom-0 left-0 right-0 border-t border-accent bg-background shadow-[0_-2px_5px_rgba(0,0,0,0.05)]">
      <div className="flex justify-around items-center h-16 px-2">
        <NavLink to="/" className={({ isActive }) => `${navLinkClasses} ${isActive ? activeLinkClasses : ''}`}>
          <div className="flex h-7 w-7 items-center justify-center">
            <svg fill="currentColor" height="24px" viewBox="0 0 256 256" width="24px" xmlns="http://www.w3.org/2000/svg">
              <path d="M218.83,103.77l-80-75.48a1.14,1.14,0,0,1-.11-.11,16,16,0,0,0-21.53,0l-.11.11L37.17,103.77A16,16,0,0,0,32,115.55V208a16,16,0,0,0,16,16H96a16,16,0,0,0,16-16V160h32v48a16,16,0,0,0,16,16h48a16,16,0,0,0,16-16V115.55A16,16,0,0,0,218.83,103.77ZM208,208H160V160a16,16,0,0,0-16-16H112a16,16,0,0,0-16,16v48H48V115.55l.11-.1L128,40l79.9,75.43.11.1Z"></path>
            </svg>
          </div>
          <p className="text-xs font-medium leading-normal">Home</p>
        </NavLink>

        <div className="w-1/3 flex justify-center">
            <button
                onClick={onAdd}
                className="bg-primary text-white rounded-full w-14 h-14 flex items-center justify-center shadow-lg -mt-8 border-4 border-background hover:bg-primary-hover transition-transform transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background"
                aria-label="Create new tournament"
                >
                <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="5" x2="12" y2="19"></line>
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                </svg>
            </button>
        </div>

        <NavLink to="/matches" className={({ isActive }) => `${navLinkClasses} ${isActive ? activeLinkClasses : ''}`}>
          <div className="flex h-7 w-7 items-center justify-center">
            <svg fill="currentColor" height="24px" viewBox="0 0 256 256" width="24px" xmlns="http://www.w3.org/2000/svg">
              <path d="M201.57,54.46a104,104,0,1,0,0,147.08A103.4,103.4,0,0,0,201.57,54.46ZM65.75,65.77a87.63,87.63,0,0,1,53.66-25.31A87.31,87.31,0,0,1,94,94.06a87.42,87.42,0,0,1-53.62,25.35A87.58,87.58,0,0,1,65.75,65.77ZM40.33,135.48a103.29,103.29,0,0,0,65-30.11,103.24,103.24,0,0,0,30.13-65,87.78,87.78,0,0,1,80.18,80.14,104,104,0,0,0-95.16,95.1,87.78,87.78,0,0,1-80.18-80.14Zm149.92,54.75a87.69,87.69,0,0,1-53.66,25.31,88,88,0,0,1,79-78.95A87.58,87.58,0,0,1,190.25,190.23Z"></path>
            </svg>
          </div>
          <p className="text-xs font-medium leading-normal">Matches</p>
        </NavLink>
      </div>
    </nav>
  );
};

export default BottomNav;
