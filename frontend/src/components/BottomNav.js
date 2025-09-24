import React from 'react';
import { NavLink } from 'react-router-dom';

const BottomNav = () => {
  const navLinkClasses = "flex flex-col items-center justify-center gap-0.5 text-secondary-text hover:text-primary transition-colors";
  const activeLinkClasses = "text-primary";

  return (
    <nav className="fixed bottom-0 left-0 right-0 border-t border-accent bg-background shadow-[0_-2px_5px_rgba(0,0,0,0.05)]">
      <div className="flex justify-around items-center h-16 px-2">
        <NavLink to="/tournaments" className={({ isActive }) => `${navLinkClasses} ${isActive ? activeLinkClasses : ''}`}>
          <div className="flex h-7 w-7 items-center justify-center">
            <svg fill="currentColor" height="24px" viewBox="0 0 256 256" width="24px" xmlns="http://www.w3.org/2000/svg">
              <path d="M218.83,103.77l-80-75.48a1.14,1.14,0,0,1-.11-.11,16,16,0,0,0-21.53,0l-.11.11L37.17,103.77A16,16,0,0,0,32,115.55V208a16,16,0,0,0,16,16H96a16,16,0,0,0,16-16V160h32v48a16,16,0,0,0,16,16h48a16,16,0,0,0,16-16V115.55A16,16,0,0,0,218.83,103.77ZM208,208H160V160a16,16,0,0,0-16-16H112a16,16,0,0,0-16,16v48H48V115.55l.11-.1L128,40l79.9,75.43.11.1Z"></path>
            </svg>
          </div>
          <p className="text-xs font-medium leading-normal">Home</p>
        </NavLink>
        <NavLink to="/matches" className={({ isActive }) => `${navLinkClasses} ${isActive ? activeLinkClasses : ''}`}>
          <div className="flex h-7 w-7 items-center justify-center">
            <svg fill="currentColor" height="24px" viewBox="0 0 256 256" width="24px" xmlns="http://www.w3.org/2000/svg">
              <path d="M201.57,54.46a104,104,0,1,0,0,147.08A103.4,103.4,0,0,0,201.57,54.46ZM65.75,65.77a87.63,87.63,0,0,1,53.66-25.31A87.31,87.31,0,0,1,94,94.06a87.42,87.42,0,0,1-53.62,25.35A87.58,87.58,0,0,1,65.75,65.77ZM40.33,135.48a103.29,103.29,0,0,0,65-30.11,103.24,103.24,0,0,0,30.13-65,87.78,87.78,0,0,1,80.18,80.14,104,104,0,0,0-95.16,95.1,87.78,87.78,0,0,1-80.18-80.14Zm149.92,54.75a87.69,87.69,0,0,1-53.66,25.31,88,88,0,0,1,79-78.95A87.58,87.58,0,0,1,190.25,190.23Z"></path>
            </svg>
          </div>
          <p className="text-xs font-medium leading-normal">Matches</p>
        </NavLink>
        <NavLink to="/tournaments" className={({ isActive }) => `${navLinkClasses} ${isActive ? activeLinkClasses : ''}`}>
          <div className="flex h-7 w-7 items-center justify-center">
            <svg fill="currentColor" height="24px" viewBox="0 0 256 256" width="24px" xmlns="http://www.w3.org/2000/svg">
              <path d="M232,64H208V56a16,16,0,0,0-16-16H64A16,16,0,0,0,48,56v8H24A16,16,0,0,0,8,80V96a40,40,0,0,0,40,40h3.65A80.13,80.13,0,0,0,120,191.61V216H96a8,8,0,0,0,0,16h64a8,8,0,0,0,0-16H136V191.58c31.94-3.23,58.44-25.64,68.08-55.58H208a40,40,0,0,0,40-40V80A16,16,0,0,0,232,64ZM48,120A24,24,0,0,1,24,96V80H48v32q0,4,.39,8ZM232,96a24,24,0,0,1-24,24h-.5a81.81,81.81,0,0,0,.5-8.9V80h24Z"></path>
            </svg>
          </div>
          <p className="text-xs font-medium leading-normal">Tournaments</p>
        </NavLink>
        <NavLink to="/profile" className={({ isActive }) => `${navLinkClasses} ${isActive ? activeLinkClasses : ''}`}>
          <div className="flex h-7 w-7 items-center justify-center">
            <svg fill="currentColor" height="24px" viewBox="0 0 256 256" width="24px" xmlns="http://www.w3.org/2000/svg">
              <path d="M230.92,212c-15.23-26.33-38.7-45.21-66.09-54.16a72,72,0,1,0-73.66,0C63.78,166.78,40.31,185.66,25.08,212a8,8,0,1,0,13.85,8c18.84-32.56,52.14-52,89.07-52s70.23,19.44,89.07,52a8,8,0,1,0,13.85-8ZM72,96a56,56,0,1,1,56,56A56.06,56.06,0,0,1,72,96Z"></path>
            </svg>
          </div>
          <p className="text-xs font-medium leading-normal">Profile</p>
        </NavLink>
      </div>
    </nav>
  );
};

export default BottomNav;
