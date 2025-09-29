import React from 'react';

const Header = ({ title }) => {
  return (
    <header className="sticky top-0 z-10 bg-background shadow-sm">
      <div className="flex items-center justify-center p-4 h-16">
        <h1 className="text-primary-text text-xl font-bold leading-tight tracking-tight">{title}</h1>
      </div>
    </header>
  );
};

export default Header;
