import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useWallet } from '../contexts/WalletContext';
import { useToast } from '../hooks/useToast';

const JoinPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { wallet, connectWallet } = useWallet();
  const { showToast } = useToast();

  useEffect(() => {
    // Store the referral code from URL - but don't show toast (handled by global component)
    import('../utils/referralUtils').then(({ extractReferralCodeFromUrl, storeReferralCode }) => {
      // Extract and store the code, but don't trigger toast notifications
      const refCode = extractReferralCodeFromUrl();
      if (refCode) {
        storeReferralCode(refCode);
        console.log('Stored referral code from join page URL:', refCode);
      }
    });

    // Show a welcome toast
    showToast({
      type: 'info',
      title: 'Welcome!',
      message: 'Connect your wallet to join with a referral bonus!'
    });

    // If the user is already connected, redirect to home
    if (wallet.connected) {
      navigate('/');
    } else {
      // Automatically open the wallet connection dialog
      connectWallet();
    }
  }, []);

  // Redirect to home page after a short delay
  useEffect(() => {
    const timer = setTimeout(() => {
      navigate('/');
    }, 3000);

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="container mx-auto px-4 py-16">
      <div className="max-w-md mx-auto bg-slate-800/70 rounded-xl p-8 border border-slate-700/50 backdrop-blur-sm">
        <h1 className="text-2xl font-bold text-white mb-4">Welcome to SolyMarket!</h1>
        <p className="text-slate-300 mb-6">
          You're joining through a referral link. Connect your wallet to get started and receive your bonus!
        </p>
        <div className="flex justify-center">
          <button
            onClick={() => connectWallet()}
            className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            Connect Wallet
          </button>
        </div>
        <p className="text-slate-400 text-sm text-center mt-6">
          Redirecting to home page...
        </p>
      </div>
    </div>
  );
};

export default JoinPage;
