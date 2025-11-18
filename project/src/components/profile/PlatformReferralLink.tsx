import React, { useState, useEffect } from 'react';
import { Share2, Copy, Check, Twitter, Mail, Link as LinkIcon } from 'lucide-react';
import Button from '../ui/Button';
import { useAuth } from '../../contexts/AuthContext';
import { generateReferralCode } from '../../services/api';
import { useToast } from '../../hooks/useToast';

interface PlatformReferralLinkProps {
  username: string;
}

const PlatformReferralLink: React.FC<PlatformReferralLinkProps> = ({ username }) => {
  const [copied, setCopied] = useState(false);
  const [showShareOptions, setShowShareOptions] = useState(false);
  const [isGeneratingCode, setIsGeneratingCode] = useState(false);
  const { userProfile, setUserProfile } = useAuth();
  const { showToast } = useToast();

  // Generate referral code if user doesn't have one
  useEffect(() => {
    const generateCode = async () => {
      // Only proceed if:
      // 1. User is logged in
      // 2. User doesn't already have a referral code
      // 3. We're not already in the process of generating a code
      if (userProfile && !isGeneratingCode) {
        // Double-check if the user already has a referral code
        if (userProfile.referralCode) {
          console.log('User already has referral code:', userProfile.referralCode);
          return; // Exit early if user already has a code
        }

        try {
          console.log('Generating referral code for user:', userProfile.id);
          setIsGeneratingCode(true);

          // Check if we've already shown a notification for this user
          const notificationKey = `referralCodeGenerated_${userProfile.id}`;
          const hasShownNotification = localStorage.getItem(notificationKey);

          const response = await generateReferralCode();
          console.log('Referral code generation response:', response);

          if (response && response.success && response.referralCode) {
            // Update user profile with new referral code
            setUserProfile({
              ...userProfile,
              referralCode: response.referralCode
            });

            console.log('Updated user profile with referral code:', response.referralCode);

            // Only show toast if we haven't shown it before
            if (!hasShownNotification) {
              showToast({
                type: 'success',
                title: 'Referral Code Generated',
                message: 'Your referral code has been generated successfully!'
              });

              // Mark that we've shown the notification
              localStorage.setItem(notificationKey, 'true');
            }
          } else {
            console.warn('Failed to generate referral code:', response);
          }
        } catch (error) {
          console.error('Error generating referral code:', error);
          showToast({
            type: 'error',
            title: 'Error',
            message: 'Failed to generate referral code. Please try again later.'
          });
        } finally {
          setIsGeneratingCode(false);
        }
      }
    };

    generateCode();
  }, [userProfile, setUserProfile, showToast, isGeneratingCode]);

  // Generate a unique referral link with the user's referral code
  const baseUrl = window.location.origin;
  const referralCode = userProfile?.referralCode || '';
  const referralLink = `${baseUrl}/?ref=${referralCode}`;

  const handleCopyLink = () => {
    if (!userProfile || !userProfile.referralCode) {
      showToast({
        type: 'info',
        title: 'No Referral Code',
        message: 'Please connect your wallet to generate a referral code.'
      });
      return;
    }

    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);

    showToast({
      type: 'success',
      title: 'Link Copied',
      message: 'Referral link copied to clipboard!'
    });
  };

  const handleTwitterShare = () => {
    if (!userProfile || !userProfile.referralCode) {
      showToast({
        type: 'info',
        title: 'No Referral Code',
        message: 'Please connect your wallet to generate a referral code.'
      });
      return;
    }

    const displayName = userProfile.username || username;
    const text = `Join me on SolyMarket, the best prediction market platform on Solana! Use my referral link to get started and we'll both earn rewards: ${referralLink}`;
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`, '_blank');
  };

  const handleEmailShare = () => {
    if (!userProfile || !userProfile.referralCode) {
      showToast({
        type: 'info',
        title: 'No Referral Code',
        message: 'Please connect your wallet to generate a referral code.'
      });
      return;
    }

    const displayName = userProfile.username || username;
    const subject = `Join me on SolyMarket`;
    const body = `Hey,\n\nI've been using SolyMarket, an amazing prediction market platform on Solana. Join me using my referral link and we can both earn rewards!\n\n${referralLink}\n\nCheers!`;
    window.open(`mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`, '_blank');
  };

  return (
    <div className="bg-slate-800/70 rounded-xl p-6 border border-slate-700/50 backdrop-blur-sm">
      <div className="flex items-center mb-4">
        <Share2 className="h-5 w-5 text-purple-400 mr-2" />
        <h3 className="handwritten text-xl text-white">Share & Earn</h3>
      </div>

      <p className="text-slate-300 mb-4">
        Share your unique referral link with friends to join SolyMarket. Earn up to 2% of stake amounts whenever they participate in predictions.
      </p>

      {!userProfile ? (
        <div className="bg-slate-900/80 rounded-lg p-4 mb-4 text-center">
          <p className="text-slate-300 mb-2">Connect your wallet to get your referral link</p>
          <Button
            variant="primary"
            size="sm"
            className="mt-2"
            onClick={() => {
              showToast({
                type: 'info',
                title: 'Connect Wallet',
                message: 'Please connect your wallet to generate a referral code.'
              });
            }}
          >
            Connect Wallet
          </Button>
        </div>
      ) : !userProfile.referralCode ? (
        <div className="bg-slate-900/80 rounded-lg p-4 mb-4 text-center">
          <p className="text-slate-300 mb-2">Generating your referral code...</p>
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-500 mt-2"></div>
          </div>
        </div>
      ) : (
        <>
          <div className="flex items-center space-x-2 mb-4">
            <div className="bg-slate-900/80 rounded-lg p-3 flex-grow overflow-hidden border border-slate-700">
              <p className="text-white font-mono text-sm truncate">{referralLink}</p>
            </div>
            <button
              className="p-3 bg-slate-700 rounded-lg hover:bg-slate-600 transition-colors"
              onClick={handleCopyLink}
            >
              {copied ? (
                <Check className="h-5 w-5 text-green-400" />
              ) : (
                <Copy className="h-5 w-5 text-slate-300" />
              )}
            </button>
          </div>

          <div className="relative">
            <Button
              variant="secondary"
              className="w-full flex items-center justify-center py-3 text-base handwritten"
              onClick={() => setShowShareOptions(!showShareOptions)}
            >
              <Share2 className="h-5 w-5 mr-2" />
              Share Referral Link
            </Button>

            {showShareOptions && (
              <div className="absolute left-0 right-0 mt-2 bg-slate-800 rounded-lg shadow-lg border border-slate-700 py-2 z-10">
                <button
                  className="w-full text-left px-4 py-2 hover:bg-slate-700 transition-colors flex items-center"
                  onClick={handleTwitterShare}
                >
                  <Twitter className="h-5 w-5 text-blue-400 mr-3" />
                  <span className="text-slate-200">Share on Twitter</span>
                </button>
                <button
                  className="w-full text-left px-4 py-2 hover:bg-slate-700 transition-colors flex items-center"
                  onClick={handleEmailShare}
                >
                  <Mail className="h-5 w-5 text-purple-400 mr-3" />
                  <span className="text-slate-200">Share via Email</span>
                </button>
                <button
                  className="w-full text-left px-4 py-2 hover:bg-slate-700 transition-colors flex items-center"
                  onClick={handleCopyLink}
                >
                  <LinkIcon className="h-5 w-5 text-green-400 mr-3" />
                  <span className="text-slate-200">Copy Link</span>
                </button>
              </div>
            )}
          </div>
        </>
      )}

      <div className="mt-4 pt-4 border-t border-slate-700/50">
        <div className="flex items-center justify-between">
          <span className="text-slate-400 text-sm">SOL Predictions:</span>
          <span className="text-white font-medium">3% of Agent Fees</span>
        </div>
        {userProfile?.referralCode && (
          <div className="flex items-center justify-between mt-2">
            <span className="text-slate-400 text-sm">Your Referral Code:</span>
            <span className="text-white font-medium">{userProfile.referralCode}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default PlatformReferralLink;
