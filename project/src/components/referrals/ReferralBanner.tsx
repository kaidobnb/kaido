import React, { useState, useEffect } from 'react';
import { Gift, X } from 'lucide-react';
import { useWallet } from '../../hooks/useWallet';
import Button from '../ui/Button';

interface ReferralBannerProps {
  referralCode: string;
  onConnect: () => void;
}

const ReferralBanner: React.FC<ReferralBannerProps> = ({ referralCode, onConnect }) => {
  const [isVisible, setIsVisible] = useState(true);
  const { wallet, connectWallet } = useWallet();

  // Hide banner if user is already connected
  useEffect(() => {
    if (wallet.connected) {
      setIsVisible(false);
    }
  }, [wallet.connected]);

  const handleConnect = () => {
    connectWallet();
    onConnect();
  };

  const handleClose = () => {
    setIsVisible(false);
  };

  if (!isVisible || !referralCode) {
    return null;
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-r from-black to-yellow-900 p-4 shadow-lg z-50 animate-slideUp">
      <div className="container mx-auto flex items-center justify-between">
        <div className="flex items-center">
          <div className="bg-yellow-600 rounded-full p-2 mr-3">
            <Gift className="h-6 w-6 text-white" />
          </div>
          <div>
            <h3 className="text-white font-medium">Referral Code Detected!</h3>
            <p className="text-yellow-200 text-sm">
              Connect your wallet to apply referral code <span className="font-bold">{referralCode}</span> and earn rewards!
            </p>
          </div>
        </div>
        <div className="flex items-center">
          <Button
            variant="primary"
            size="sm"
            onClick={handleConnect}
            className="mr-2 animate-pulse-button"
          >
            Connect Wallet
          </Button>
          <button
            onClick={handleClose}
            className="text-yellow-200 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReferralBanner;
