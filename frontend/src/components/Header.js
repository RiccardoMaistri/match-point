import React from 'react';

const Header = ({ title, onAdd }) => {
  return (
    <header className="sticky top-0 z-10 bg-background shadow-sm">
      <div className="flex items-center p-4">
        <h1 className="text-primary-text text-xl font-bold leading-tight tracking-tight flex-1 text-center">{title}</h1>
        {onAdd && (
          <button
            onClick={onAdd}
            className="flex items-center justify-center rounded-full h-10 w-10 bg-primary text-white hover:bg-primary-hover transition-colors duration-150"
          >
            <svg fill="currentColor" height="24px" viewBox="0 0 256 256" width="24px" xmlns="http://www.w3.org/2000/svg">
              <path d="M224,128a8,8,0,0,1-8,8H136v80a8,8,0,0,1-16,0V136H40a8,8,0,0,1,0-16h80V40a8,8,0,0,1,16,0v80h80A8,8,0,0,1,224,128Z"></path>
            </svg>
          </button>
        )}
      </div>
    </header>
  );
};

export default Header;
