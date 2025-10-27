import React from 'react';
import { NavLink } from 'react-router-dom';

const BottomNav = () => {
  const navItems = [
    { path: '/', icon: 'emoji_events', label: 'Tournaments' },
    { path: '/standings', icon: 'leaderboard', label: 'Standings' },
    { path: '/participants', icon: 'groups', label: 'Players' },
  ];

  return (
    <nav className="sticky bottom-0 z-10 bg-surface-light dark:bg-surface-dark border-t border-border-light dark:border-border-dark">
      <div className="flex justify-around">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center w-full py-2 text-sm font-medium ` +
              (isActive
                ? 'text-primary'
                : 'text-text-on-light dark:text-text-on-dark-secondary')
            }
          >
            <span className="material-icons">{item.icon}</span>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
};

export default BottomNav;
