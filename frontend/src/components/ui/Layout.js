import React from 'react';
import Header from './Header';
import BottomNavigation from './BottomNavigation';

const Layout = ({ 
  children, 
  title, 
  showBackButton = false, 
  actionIcon = null, 
  onActionClick = null,
  hideBottomNav = false,
  currentUser
}) => {
  return (
    <div className="relative flex min-h-screen flex-col bg-gray-900 justify-between overflow-x-hidden">
      <div>
        <Header 
          title={title} 
          showBackButton={showBackButton} 
          actionIcon={actionIcon} 
          onActionClick={onActionClick} 
          currentUser={currentUser}
        />
        <div className="flex-grow">
          {children}
        </div>
      </div>
      
      {!hideBottomNav && (
        <div>
          <BottomNavigation />
          <div className="h-5 bg-gray-800"></div>
        </div>
      )}
    </div>
  );
};

export default Layout;