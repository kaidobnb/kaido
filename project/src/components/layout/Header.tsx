import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Menu, Bell, Wallet, ShieldCheck } from 'lucide-react';
import WalletProfile from '../wallet/WalletProfile';
import NotificationDropdown from '../notifications/NotificationDropdown';
import NavigationLink from './NavigationLink';
import { useWallet } from '../../contexts/WalletContext';
import { useAuth } from '../../contexts/AuthContext';
import { useNotifications } from '../../contexts/NotificationContext';

const Header: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const { wallet, connectWallet, disconnectWallet } = useWallet();
  const { userProfile, isAdmin } = useAuth();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const notificationRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Function to handle navigation directly
  const handleNavigation = (path: string) => {
    // Scroll to top immediately for better UX
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: 'instant'
    });
    navigate(path);
  };

  // Function to ensure navigation works properly
  const handleLinkClick = (path: string, e: React.MouseEvent) => {
    e.preventDefault();

    // Scroll to top immediately for better UX
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: 'instant'
    });

    try {
      navigate(path);
      // Add a fallback in case React Router navigation doesn't work
      setTimeout(() => {
        if (window.location.pathname !== path) {
          window.location.href = path;
          // Also scroll to top when using direct navigation
          window.scrollTo(0, 0);
        }
      }, 100);
    } catch (error) {
      // Direct navigation as fallback
      window.location.href = path;
      // Also scroll to top when using direct navigation
      window.scrollTo(0, 0);
    }
  };

  // Close notifications dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setIsNotificationsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Handle mobile menu close
  const handleMobileMenuClose = () => {
    setIsMenuOpen(false);
  };

  return (
    <header className={`bg-black border-b border-yellow-500/30 fixed top-0 sm:top-[64px] left-0 right-0 py-2 sm:py-4 ${wallet.connected ? 'wallet-connected' : 'wallet-disconnected'}`} style={{ zIndex: 1000 }}>
      <div className="header-border-top"></div>
      <div className="container mx-auto px-4 sm:px-8">
        <div className="h-16 sm:h-20 flex items-center justify-between" style={{ cursor: 'default', position: 'relative', zIndex: 1001 }}>
          {/* Logo and Navigation */}
          <div className="flex items-center flex-shrink-0 max-w-[60%] sm:max-w-none">
            {/* Logo */}
            <div className="logo-container mr-2 md:mr-10">
              <NavigationLink to="/" className="flex flex-row items-center">
                <div className="logo-icon w-9 h-9 sm:w-12 sm:h-12 flex items-center justify-center mr-2 sm:mr-3 flex-shrink-0">
                  <img src="/kaido.png" alt="Kaido Logo" className="w-full h-full rounded-full" />
                </div>
                <div className="logo-text flex items-center">
                  <span className="text-lg sm:text-xl md:text-2xl text-white handwritten whitespace-nowrap">
                    Kaido
                  </span>
                </div>
              </NavigationLink>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex space-x-6 items-center">
              <NavigationLink
                to="/predictions"
                className="nav-button text-slate-200 hover:text-yellow-300 transition-all text-xl handwritten rounded-md px-5 py-2"
              >
                Predictions
              </NavigationLink>
              <NavigationLink
                to="/leaderboard"
                className="nav-button text-slate-200 hover:text-yellow-300 transition-all text-xl handwritten rounded-md px-5 py-2"
              >
                Leaderboard
              </NavigationLink>
              <NavigationLink
                to="/portfolio"
                className="nav-button text-slate-200 hover:text-yellow-300 transition-all text-xl handwritten rounded-md px-5 py-2"
              >
                Portfolio
              </NavigationLink>
              <NavigationLink
                to="/staking"
                className="nav-button text-slate-200 hover:text-yellow-300 transition-all text-xl handwritten rounded-md px-5 py-2"
              >
                LP Vault
              </NavigationLink>
              {isAdmin && (
                <NavigationLink
                  to="/admin"
                  className="nav-button admin-button text-yellow-400 hover:text-yellow-300 transition-all text-xl handwritten rounded-md px-5 py-2 flex items-center"
                >
                  <ShieldCheck className="h-5 w-5 mr-2" />
                  Admin
                </NavigationLink>
              )}
            </nav>
          </div>

          {/* Right Side Actions */}
          <div className="flex items-center space-x-2 sm:space-x-6">
            {/* Network Indicator removed */}

            {/* Wallet Profile - with mobile-specific class */}
            <div className="mobile-wallet-profile">
              <WalletProfile
                username={userProfile?.username || undefined}
                avatar={userProfile?.avatar || undefined}
              />
            </div>

            {/* Token Balances - Only shown when wallet is connected */}
            {wallet.connected && (
              <div className="hidden md:flex items-center space-x-3">
                {/* BNB Balance */}
                <Link
                  to="/wallet"
                  className="flex items-center space-x-2 bg-black/50 hover:bg-yellow-900/20 transition-colors rounded-md px-3 py-2 cursor-pointer border border-yellow-500/30"
                  style={{ minWidth: '100px', height: '42px' }}
                >
                  <Wallet className="h-4 w-4 text-yellow-400 flex-shrink-0" />
                  <div className="flex flex-col">
                    <span className="text-xs text-slate-400 leading-tight">BNB</span>
                    <span className="text-sm font-medium text-white leading-tight">{(wallet.balance?.bnb || 0).toFixed(4)}</span>
                  </div>
                </Link>

                {/* KAIDO Balance */}
                <Link
                  to="/wallet"
                  className="flex items-center space-x-2 bg-black/50 hover:bg-purple-900/20 transition-colors rounded-md px-3 py-2 cursor-pointer border border-purple-500/30"
                  style={{ minWidth: '100px', height: '42px' }}
                >
                  <div className="h-4 w-4 bg-purple-500 rounded-full flex-shrink-0"></div>
                  <div className="flex flex-col">
                    <span className="text-xs text-slate-400 leading-tight">KAIDO</span>
                    <span className="text-sm font-medium text-white leading-tight">{(wallet.balance?.kaido || 0).toFixed(2)}</span>
                  </div>
                </Link>
              </div>
            )}

            {/* Notifications */}
            <div className="relative" ref={notificationRef} style={{ zIndex: 10000, position: 'relative' }}>
              <button
                className="relative hover:text-yellow-400 text-slate-300 transition-colors focus:outline-none focus:ring-0"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  console.log('Notification button clicked!');
                  setIsNotificationsOpen(!isNotificationsOpen);
                }}
                onTouchEnd={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  console.log('Notification button touched!');
                  setIsNotificationsOpen(!isNotificationsOpen);
                }}
                style={{
                  zIndex: 10000,
                  width: '44px',
                  height: '44px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '0',
                  background: 'transparent',
                  position: 'relative',
                  border: 'none',
                  outline: 'none',
                  cursor: 'pointer',
                  WebkitTapHighlightColor: 'rgba(243, 186, 47, 0.2)',
                  touchAction: 'manipulation'
                }}
                aria-label="Notifications"
                type="button"
              >
                <div className="flex items-center justify-center w-full h-full pointer-events-none">
                  <Bell className="h-6 w-6 sm:h-7 sm:w-7 pointer-events-none" />
                </div>
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-yellow-500 text-xs text-black flex items-center justify-center pointer-events-none">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {/* Notification Dropdown */}
              {isNotificationsOpen && (
                <NotificationDropdown
                  notifications={notifications}
                  onClose={() => setIsNotificationsOpen(false)}
                  onMarkAsRead={markAsRead}
                  onMarkAllAsRead={markAllAsRead}
                />
              )}
            </div>

            {/* Mobile Menu Button - Hidden on desktop */}
            <button
              className="block md:hidden text-slate-300 hover:text-white transition-colors"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('Hamburger menu button clicked!');
                setIsMenuOpen(!isMenuOpen);
              }}
              onTouchEnd={(e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('Hamburger menu button touched!');
                setIsMenuOpen(!isMenuOpen);
              }}
              style={{
                width: '44px',
                height: '44px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '0',
                background: 'transparent',
                zIndex: 10000,
                position: 'relative',
                border: 'none',
                cursor: 'pointer',
                WebkitTapHighlightColor: 'rgba(243, 186, 47, 0.2)',
                touchAction: 'manipulation'
              }}
              type="button"
              aria-label="Menu"
            >
              <div className="flex items-center justify-center w-full h-full pointer-events-none">
                <Menu className="h-6 w-6 sm:h-8 sm:w-8 pointer-events-none" />
              </div>
            </button>
          </div>
        </div>

        {isMenuOpen && (
          <>
            {/* Backdrop to close menu when clicking outside */}
            <div
              className="fixed inset-0 bg-black/50"
              style={{ zIndex: 999, pointerEvents: 'auto' }}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('Backdrop clicked - closing menu');
                setIsMenuOpen(false);
              }}
            ></div>
          <div className="md:hidden bg-black/95 py-5 px-6 border-t border-yellow-500/30 backdrop-blur-sm mobile-menu fixed left-0 right-0 max-h-[80vh] overflow-y-auto" style={{ top: 'calc(16px + 2.5rem)', maxHeight: 'calc(100vh - 4rem)', zIndex: 10001, pointerEvents: 'auto', position: 'fixed' }}>
            {/* Close button */}
            <div className="flex justify-end mb-4" style={{ position: 'relative', zIndex: 10003 }}>
              <button
                className="text-slate-300 hover:text-white transition-colors"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  console.log('Close button clicked!');
                  setIsMenuOpen(false);
                }}
                style={{
                  width: '44px',
                  height: '44px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '0',
                  position: 'relative',
                  zIndex: 10003,
                  pointerEvents: 'auto'
                }}
                type="button"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="pointer-events-none">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
            {/* Mobile Navigation */}
            <nav className="flex flex-col space-y-4" style={{ touchAction: 'manipulation', position: 'relative', zIndex: 10002 }}>
              <NavigationLink
                to="/predictions"
                className="nav-button text-slate-200 hover:text-yellow-300 transition-all text-lg handwritten rounded-md px-5 py-3 block mobile-nav-link"
                onClick={handleMobileMenuClose}
              >
                <div className="mobile-link-content" style={{ pointerEvents: 'none' }}>Predictions</div>
              </NavigationLink>
              <NavigationLink
                to="/leaderboard"
                className="nav-button text-slate-200 hover:text-yellow-300 transition-all text-lg handwritten rounded-md px-5 py-3 block mobile-nav-link"
                onClick={handleMobileMenuClose}
              >
                <div className="mobile-link-content" style={{ pointerEvents: 'none' }}>Leaderboard</div>
              </NavigationLink>
              <NavigationLink
                to="/portfolio"
                className="nav-button text-slate-200 hover:text-yellow-300 transition-all text-lg handwritten rounded-md px-5 py-3 block mobile-nav-link"
                onClick={handleMobileMenuClose}
              >
                <div className="mobile-link-content" style={{ pointerEvents: 'none' }}>Portfolio</div>
              </NavigationLink>
              <NavigationLink
                to="/staking"
                className="nav-button text-slate-200 hover:text-yellow-300 transition-all text-lg handwritten rounded-md px-5 py-3 block mobile-nav-link"
                onClick={handleMobileMenuClose}
              >
                <div className="mobile-link-content" style={{ pointerEvents: 'none' }}>💎 LP Vault</div>
              </NavigationLink>
              <NavigationLink
                to="/referrals"
                className="nav-button text-slate-200 hover:text-yellow-300 transition-all text-lg handwritten rounded-md px-5 py-3 block mobile-nav-link"
                onClick={handleMobileMenuClose}
              >
                <div className="mobile-link-content" style={{ pointerEvents: 'none' }}>Referrals</div>
              </NavigationLink>
              {isAdmin && (
                <NavigationLink
                  to="/admin"
                  className="nav-button admin-button text-yellow-400 hover:text-yellow-300 transition-all text-lg handwritten rounded-md px-5 py-3 flex items-center mobile-nav-link"
                  onClick={handleMobileMenuClose}
                >
                  <div className="mobile-link-content" style={{ pointerEvents: 'none' }}>
                    <ShieldCheck className="h-5 w-5 mr-2 inline-block" />
                    Admin Dashboard
                  </div>
                </NavigationLink>
              )}

              {wallet.connected ? (
                <>
                  <hr className="border-yellow-500/30 my-2" />
                  <NavigationLink to="/profile" className="nav-button text-slate-200 hover:text-yellow-300 transition-all text-lg handwritten rounded-md px-5 py-3 block mobile-nav-link" onClick={handleMobileMenuClose}>
                    <div className="mobile-link-content" style={{ pointerEvents: 'none' }}>Profile</div>
                  </NavigationLink>
                  <NavigationLink to="/profile/notifications" className="nav-button text-slate-200 hover:text-yellow-300 transition-all text-lg handwritten rounded-md px-5 py-3 block mobile-nav-link" onClick={handleMobileMenuClose}>
                    <div className="mobile-link-content" style={{ pointerEvents: 'none' }}>
                      Notifications {unreadCount > 0 && <span className="ml-2 px-2 py-0.5 bg-yellow-500 text-black text-xs rounded-full">{unreadCount}</span>}
                    </div>
                  </NavigationLink>
                  {/* Settings and Wallet Debug removed as requested */}
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      console.log('Disconnect wallet clicked!');
                      disconnectWallet();
                      handleMobileMenuClose();
                    }}
                    className="nav-button text-red-400 hover:text-red-300 transition-all text-lg handwritten rounded-md px-5 py-3 block w-full text-left mobile-nav-link"
                    style={{ position: 'relative', zIndex: 10003, pointerEvents: 'auto' }}
                    type="button"
                  >
                    <div className="mobile-link-content" style={{ pointerEvents: 'none' }}>Disconnect Wallet</div>
                  </button>
                </>
              ) : (
                <>
                  <hr className="border-yellow-500/30 my-2" />
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      console.log('Connect wallet clicked!');
                      connectWallet();
                      handleMobileMenuClose();
                    }}
                    className="nav-button admin-button text-yellow-400 hover:text-yellow-300 transition-all text-lg handwritten rounded-md px-5 py-3 block w-full text-left mobile-nav-link mobile-connect-wallet-btn"
                    style={{ position: 'relative', zIndex: 10003, pointerEvents: 'auto' }}
                    type="button"
                  >
                    <div className="mobile-link-content whitespace-nowrap" style={{ pointerEvents: 'none' }}>Connect/Signup</div>
                  </button>
                </>
              )}
            </nav>

            {/* Mobile Balances - Only shown when wallet is connected */}
            {wallet.connected && (
              <div className="mt-6 space-y-3 pb-6">
                <Link
                  to="/wallet"
                  className="flex items-center justify-between bg-black/50 hover:bg-yellow-900/20 transition-colors rounded-md px-5 py-4 border border-yellow-500/30"
                  style={{ height: '52px' }}
                  onClick={handleMobileMenuClose}
                >
                  <div className="flex items-center">
                    <Wallet className="h-6 w-6 text-yellow-400 mr-4 flex-shrink-0" />
                    <span className="text-slate-300 text-lg handwritten">BNB Balance</span>
                  </div>
                  <span className="text-white font-medium text-lg">{(wallet.balance?.bnb || 0).toFixed(4)}</span>
                </Link>

                <Link
                  to="/wallet"
                  className="flex items-center justify-between bg-black/50 hover:bg-purple-900/20 transition-colors rounded-md px-5 py-4 border border-purple-500/30"
                  style={{ height: '52px' }}
                  onClick={handleMobileMenuClose}
                >
                  <div className="flex items-center">
                    <div className="h-6 w-6 bg-purple-500 rounded-full mr-4 flex-shrink-0"></div>
                    <span className="text-slate-300 text-lg handwritten">KAIDO Balance</span>
                  </div>
                  <span className="text-white font-medium text-lg">{(wallet.balance?.kaido || 0).toFixed(2)}</span>
                </Link>
              </div>
            )}

            {/* Add extra padding at the bottom for better scrolling */}
            <div className="h-4"></div>
          </div>
          </>
        )}
      </div>
    </header>
  );
};

export default Header;