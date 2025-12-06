import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import ScrollToTop from './components/utils/ScrollToTop';
import { KaidoChatWidget } from './components/chat';
import HomePage from './pages/HomePage';
import PredictionPage from './pages/PredictionPage';
import AIPredictionPage from './pages/AIPredictionPage';
import AllPredictionsPage from './pages/AllPredictionsPage';
import LeaderboardPage from './pages/LeaderboardPage';
import PortfolioPage from './pages/PortfolioPage';
import ProfilePage from './pages/ProfilePage';
import BadgesPage from './pages/BadgesPage';
import SettingsPage from './pages/SettingsPage';
import ChatPage from './pages/ChatPage';
import ReferralPage from './pages/ReferralPage';
// JoinPage removed - using direct homepage navigation with referral codes
import WalletPage from './pages/WalletPage';
import WalletDebugPage from './pages/WalletDebugPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import AdminCreateSportsPrediction from './pages/admin/AdminCreateSportsPrediction';
import AdminSportsApiSettings from './pages/admin/AdminSportsApiSettings';
import AdminPage from './pages/AdminPage';
import SubAdminWalletsPage from './pages/SubAdminWalletsPage';
import WinningsPage from './pages/profile/WinningsPage';
import NotificationsPage from './pages/profile/NotificationsPage';
import ReferralRewardsPage from './pages/profile/ReferralRewardsPage';
import TermsOfServicePage from './pages/legal/TermsOfServicePage';
import PrivacyPolicyPage from './pages/legal/PrivacyPolicyPage';
import RiskDisclosurePage from './pages/legal/RiskDisclosurePage';
import CookiePolicyPage from './pages/legal/CookiePolicyPage';
import FAQPage from './pages/resources/FAQPage';
import DocumentationPage from './pages/resources/DocumentationPage';
import BlogPage from './pages/resources/BlogPage';
import LinktreePage from './pages/LinktreePage';
import StandaloneLinktreePage from './pages/StandaloneLinktreePage';
import PresalePage from './pages/PresalePage';
import PresaleConfirmationPage from './pages/PresaleConfirmationPage';
import StakingPage from './pages/StakingPage';
import LPVaultPage from './pages/LPVaultPage';
import CreateRealWorldPredictionPage from './pages/CreateRealWorldPredictionPage';
import InviteOnlyPage from './components/access/InviteOnlyPage';
import AccessControl from './components/access/AccessControl';
import { checkAndStoreReferralCode } from './utils/referralUtils';
import Header from './components/layout/Header';
import Footer from './components/layout/Footer';
import MobileBottomNav from './components/layout/MobileBottomNav';
import AnimatedBackground from './components/effects/AnimatedBackground';
import GlowEffect from './components/effects/GlowEffect';
import CryptoTicker from './components/crypto/CryptoTicker';
import SportsFixtures from './components/sports/SportsFixtures';
import SportsFixturesTicker from './components/sports/SportsFixturesTicker';
import SportsFixturesModal from './components/sports/SportsFixturesModal';

// Import mobile-specific styles
import './styles/mobile.css';
import WinningsNotification from './components/notifications/WinningsNotification';
import ReferralRewardsNotification from './components/notifications/ReferralRewardsNotification';
import ReferralNotification from './components/notifications/ReferralNotification';
import ReferralBanner from './components/referrals/ReferralBanner';

import { WalletProvider as AppKitWalletProvider } from './contexts/WalletContext';
import { AuthProvider } from './contexts/AuthContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { ReferralRewardsProvider } from './contexts/ReferralRewardsContext';
import { ToastProvider, useToast } from './hooks/useToast';
import { WalletProvider } from './hooks/useWallet';

// Import BNB Appkit configuration
import { appkitInstance, wagmiAdapter, queryClient } from './config/appkit-bnb';
import { WagmiProvider } from 'wagmi';
import { QueryClientProvider } from '@tanstack/react-query';

// Make appkit instance available globally for debugging
if (typeof window !== 'undefined') {
  window.appkit = appkitInstance;
}

// Import Appkit debug utilities
import './utils/appkitDebug';

// Component to manage sports fixtures modal state
const SportsFixturesWithModal: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <SportsFixturesTicker onOpenModal={() => setIsModalOpen(true)} />
      <SportsFixturesModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </>
  );
};

function App() {
  return (
    <WagmiProvider config={wagmiAdapter.wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <AppKitWalletProvider>
            <WalletProvider>
              <NotificationProvider>
                <ToastProvider>
                  <ReferralRewardsProvider>
                    <Router>
                  <ScrollToTop />
                  <Routes>
                    {/* Standalone Linktree routes without header/footer */}
                    <Route path="/links" element={<StandaloneLinktreePage />} />
                    <Route path="/linktree" element={<StandaloneLinktreePage />} />

                    {/* Public pages */}
                    <Route path="/invite" element={<Navigate to="/" replace />} />
                    <Route path="/presale" element={<PresalePage />} />
                    <Route path="/presale/confirmation/:txHash" element={<PresaleConfirmationPage />} />

                    {/* All other routes with standard layout */}
                    <Route path="*" element={
                      <AccessControl>
                        <div className="min-h-screen bg-black text-white flex flex-col relative overflow-hidden">
                          <AnimatedBackground />

                          {/* Additional background elements - reduced opacity and fewer elements */}
                          <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden">
                            <div className="absolute top-10 left-10 w-96 h-96 bg-yellow-600/5 rounded-full filter blur-3xl animate-pulse-slow"></div>
                            <div className="absolute bottom-10 right-10 w-96 h-96 bg-yellow-600/5 rounded-full filter blur-3xl animate-pulse-slow" style={{ animationDelay: '4s' }}></div>
                            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-yellow-600/3 rounded-full filter blur-3xl animate-pulse-slow" style={{ animationDelay: '8s' }}></div>
                          </div>

                          <CryptoTicker />
                          <SportsFixturesWithModal />
                          <Header />
                          <main className="flex-grow relative z-10 pt-[100px] sm:pt-[144px]">
                            <Routes>
                              <Route path="/" element={<HomePage />} />
                              <Route path="/predictions" element={<AllPredictionsPage />} />
                              <Route path="/prediction/:id" element={<AIPredictionPage />} />
                              <Route path="/prediction-legacy/:id" element={<PredictionPage />} />
                              <Route path="/leaderboard" element={<LeaderboardPage />} />
                              <Route path="/portfolio" element={<PortfolioPage />} />
                              <Route path="/staking" element={<StakingPage />} />
                              <Route path="/lp-vault" element={<LPVaultPage />} />
                              <Route path="/create/realworld" element={<CreateRealWorldPredictionPage />} />
                              <Route path="/profile" element={<ProfilePage />} />
                              <Route path="/badges" element={<BadgesPage />} />
                              <Route path="/profile/winnings" element={<WinningsPage />} />
                              <Route path="/profile/notifications" element={<NotificationsPage />} />
                              <Route path="/profile/rewards" element={<ReferralRewardsPage />} />
                              <Route path="/settings" element={<SettingsPage />} />
                              <Route path="/chat" element={<ChatPage />} />
                              <Route path="/referrals" element={<ReferralPage />} />
                              <Route path="/join" element={<Navigate to="/" replace />} />
                              <Route path="/wallet" element={<WalletPage />} />
                              <Route path="/wallet-debug" element={<WalletDebugPage />} />
                              <Route path="/admin" element={<AdminDashboardPage />} />
                              <Route path="/admin/sports/create" element={<AdminCreateSportsPrediction />} />
                              <Route path="/admin/sports-api-settings" element={<AdminSportsApiSettings />} />
                              <Route path="/sub-admin" element={<SubAdminWalletsPage />} />
                              <Route path="/terms" element={<TermsOfServicePage />} />
                              <Route path="/privacy" element={<PrivacyPolicyPage />} />
                              <Route path="/risk" element={<RiskDisclosurePage />} />
                              <Route path="/cookies" element={<CookiePolicyPage />} />
                              <Route path="/faq" element={<FAQPage />} />
                              <Route path="/docs" element={<DocumentationPage />} />
                              <Route path="/blog" element={<BlogPage />} />
                            </Routes>
                          </main>
                          <Footer />
                          <MobileBottomNav />
                          <KaidoChatWidget />
                          <WinningsNotification />
                          <ReferralRewardsNotification />
                          <ReferralNotification />
                          <ReferralCodeCheckerWithToast />
                        </div>
                      </AccessControl>
                    } />
                  </Routes>
                    </Router>
                  </ReferralRewardsProvider>
                </ToastProvider>
              </NotificationProvider>
            </WalletProvider>
          </AppKitWalletProvider>
        </AuthProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}

// Component to check for referral codes on every page
// This is defined after the App component so it can use hooks that depend on providers
const ReferralCodeCheckerWithToast = () => {
  const location = useLocation();
  const { showToast } = useToast();
  const [activeReferralCode, setActiveReferralCode] = useState<string | null>(null);

  // Use a ref to track if we've already shown a toast for this referral code session-wide
  const toastShownRef = React.useRef(false);

  // Use a ref to track the last processed URL to avoid duplicate processing
  const lastProcessedUrlRef = React.useRef('');

  useEffect(() => {
    // Get the full URL including search params
    const currentUrl = window.location.href;

    // Skip if we've already processed this exact URL
    if (currentUrl === lastProcessedUrlRef.current) {
      return;
    }

    // Update the last processed URL
    lastProcessedUrlRef.current = currentUrl;

    // Check for referral code in URL on every route change
    const refCode = checkAndStoreReferralCode();

    // If a referral code was found, set it as active and show a toast (only once per session)
    if (refCode) {
      // Set the active referral code for the banner
      setActiveReferralCode(refCode);

      // Show a toast notification if we haven't shown one yet this session
      if (!toastShownRef.current) {
        // Mark that we've shown the toast for this session
        toastShownRef.current = true;

        // Show the toast notification
        showToast({
          type: 'success',
          title: 'Referral Code Detected',
          message: `Referral code "${refCode}" will be applied when you connect your wallet!`,
          duration: 8000
        });

        // Log for debugging
        console.log('Showing referral code toast for code:', refCode);
      }
    } else {
      // Check if we have a stored referral code
      import('./utils/referralUtils').then(({ getStoredReferralCode }) => {
        const storedCode = getStoredReferralCode();
        if (storedCode) {
          setActiveReferralCode(storedCode);
        }
      });
    }
  }, [location.pathname, location.search, showToast]); // Depend on both pathname and search params

  // Handle connect button click in the banner
  const handleConnect = () => {
    console.log('Connect button clicked in referral banner');
  };

  return activeReferralCode ? (
    <ReferralBanner
      referralCode={activeReferralCode}
      onConnect={handleConnect}
    />
  ) : null;
};

export default App;