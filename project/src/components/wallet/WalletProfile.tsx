import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown, User, Settings, LogOut, Wallet } from 'lucide-react';
import Avatar from '../ui/Avatar';
import { useWallet } from '../../contexts/WalletContext';
import { useAuth } from '../../contexts/AuthContext';
import ConnectWalletButton from './ConnectWalletButton';

interface WalletProfileProps {
  username?: string;
  avatar?: string;
}

const WalletProfile: React.FC<WalletProfileProps> = ({
  username: propUsername,
  avatar: propAvatar
}) => {
  const { wallet, disconnectWallet, isInitializing } = useWallet();
  const { userProfile } = useAuth();
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  // Use user profile data if available, otherwise use props or defaults
  const username = userProfile?.username || propUsername || 'User';
  // Use a blank avatar as default
  const avatar = userProfile?.avatar || propAvatar || '';

  // If initializing, show a loading state
  if (isInitializing) {
    return (
      <div className="flex items-center space-x-3">
        <div className="w-8 h-8 rounded-full bg-slate-700 animate-pulse"></div>
        <div className="hidden md:block w-24 h-5 bg-slate-700 rounded animate-pulse"></div>
      </div>
    );
  }

  // If wallet is not connected, show the connect button
  if (!wallet.connected) {
    return <ConnectWalletButton />;
  }

  // If wallet is connected, show the profile dropdown
  return (
    <div className="relative">
      <button
        className="flex items-center space-x-3 hover:opacity-80 transition-opacity"
        onClick={() => setIsProfileOpen(!isProfileOpen)}
        onTouchStart={(e) => {
          e.currentTarget.style.backgroundColor = 'rgba(51, 65, 85, 0.5)';
          e.currentTarget.style.borderRadius = '8px';
        }}
        onTouchEnd={(e) => {
          e.currentTarget.style.backgroundColor = '';
          // Toggle profile dropdown on touch end
          setIsProfileOpen(!isProfileOpen);
        }}
        onTouchCancel={(e) => {
          e.currentTarget.style.backgroundColor = '';
        }}
        style={{
          height: '48px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '0 8px',
          background: 'transparent'
        }}
      >
        <div className="flex items-center justify-center pointer-events-none">
          <Avatar src={avatar} alt={username} size="sm" />
        </div>
        <div className="hidden md:block ml-2 text-white text-sm font-medium overflow-hidden text-ellipsis max-w-[120px] pointer-events-none">
          {username}
        </div>
        <ChevronDown className="hidden md:block h-5 w-5 text-slate-400 pointer-events-none ml-1" />
      </button>

      {isProfileOpen && (
        <>
          {/* Backdrop to close profile dropdown when clicking outside */}
          <div
            className="fixed inset-0 bg-black/50 z-30"
            onClick={() => setIsProfileOpen(false)}
          ></div>
          <div className="fixed md:absolute left-4 right-4 md:left-auto md:right-0 md:w-64 top-20 md:top-auto md:mt-3 bg-slate-800 rounded-lg shadow-lg border border-slate-700 py-3" style={{ zIndex: 9999, maxWidth: '90vw' }}>
            <div className="flex justify-end px-4 mb-2 md:hidden">
              <button
                className="text-slate-300 hover:text-white transition-colors"
                onClick={() => setIsProfileOpen(false)}
                style={{
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '0'
                }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="pointer-events-none">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
            <div className="px-4 py-2 border-b border-slate-700">
            <div className="flex items-center space-x-3">
              <Avatar src={avatar} alt={username} size="sm" />
              <div className="text-white font-medium overflow-hidden text-ellipsis max-w-[180px]" title={username}>
                {username}
              </div>
            </div>
          </div>

          <Link
            to="/profile"
            className="flex items-center px-4 py-3 text-slate-200 hover:bg-slate-700 transition-colors"
            onClick={() => setIsProfileOpen(false)}
            style={{ minHeight: '44px' }}
          >
            <User className="h-4 w-4 mr-3 text-slate-400" />
            <span>Profile</span>
          </Link>

          <Link
            to="/wallet"
            className="flex items-center px-4 py-3 text-slate-200 hover:bg-slate-700 transition-colors"
            onClick={() => setIsProfileOpen(false)}
            style={{ minHeight: '44px' }}
          >
            <Wallet className="h-4 w-4 mr-3 text-slate-400" />
            <span>Wallet</span>
          </Link>

          {/* Settings option removed temporarily as requested */}

          <hr className="border-slate-700 my-2" />

          <button
            className="flex items-center w-full text-left px-4 py-3 text-red-400 hover:bg-slate-700 transition-colors"
            onClick={() => {
              disconnectWallet();
              setIsProfileOpen(false);
            }}
            style={{ minHeight: '44px' }}
          >
            <LogOut className="h-4 w-4 mr-3 text-red-400" />
            <span>Disconnect Wallet</span>
          </button>
        </div>
        </>
      )}
    </div>
  );
};

export default WalletProfile;
