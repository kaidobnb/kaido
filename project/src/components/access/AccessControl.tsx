import React from 'react';

interface AccessControlProps {
  children: React.ReactNode;
}

// AccessControl component has been simplified to just render children
// Invite-only access has been completely removed
const AccessControl: React.FC<AccessControlProps> = ({ children }) => {
  console.log('AccessControl: Invite-only access has been completely removed - all users now have access');
  return <>{children}</>;
};

export default AccessControl;
