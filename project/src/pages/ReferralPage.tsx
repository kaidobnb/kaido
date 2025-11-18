import React, { useState, useEffect } from 'react';
import { Users, Copy, Check, Share2, Gift } from 'lucide-react';
import Card, { CardContent, CardHeader } from '../components/ui/Card';
import Button from '../components/ui/Button';
import ReferralStats from '../components/profile/ReferralStats';
import { useAuth } from '../contexts/AuthContext';
import { generateReferralCode } from '../services/api';
import { useToast } from '../hooks/useToast';
import { useAppKit } from '@reown/appkit/react';

const ReferralPage: React.FC = () => {
  const [copied, setCopied] = useState(false);
  const [isGeneratingCode, setIsGeneratingCode] = useState(false);
  const { userProfile, setUserProfile } = useAuth();
  const { showToast } = useToast();
  const { open } = useAppKit();

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

  const handleCopyCode = () => {
    if (!userProfile || !userProfile.referralCode) {
      showToast({
        type: 'info',
        title: 'No Referral Code',
        message: 'Please connect your wallet to generate a referral code.'
      });
      return;
    }

    navigator.clipboard.writeText(userProfile.referralCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);

    showToast({
      type: 'success',
      title: 'Code Copied',
      message: 'Referral code copied to clipboard!'
    });
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-white mb-6">Referral Program</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center">
                <Gift className="h-5 w-5 text-purple-400 mr-2" />
                <h2 className="text-xl font-medium text-white">Share & Earn</h2>
              </div>
            </CardHeader>

            <CardContent>
              <div className="space-y-6">
                <p className="text-slate-300">
                  Invite your friends to join SolyMarket and earn rewards when they participate in predictions.
                  You'll receive a percentage of the agent fees from all their transactions.
                </p>

                <div className="bg-slate-800 rounded-lg p-6">
                  <h3 className="text-white font-medium mb-4">How It Works</h3>

                  <div className="space-y-4">
                    <div className="flex">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-500 flex items-center justify-center mr-3">
                        <span className="text-white font-bold">1</span>
                      </div>
                      <div>
                        <h4 className="text-white font-medium">Share Your Referral Link</h4>
                        <p className="text-slate-400 text-sm">Send your unique referral link to friends or share it on social media.</p>
                      </div>
                    </div>

                    <div className="flex">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-500 flex items-center justify-center mr-3">
                        <span className="text-white font-bold">2</span>
                      </div>
                      <div>
                        <h4 className="text-white font-medium">Friends Join SolyMarket</h4>
                        <p className="text-slate-400 text-sm">When they sign up using your link, they're connected to your account.</p>
                      </div>
                    </div>

                    <div className="flex">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-500 flex items-center justify-center mr-3">
                        <span className="text-white font-bold">3</span>
                      </div>
                      <div>
                        <h4 className="text-white font-medium">Earn Rewards</h4>
                        <p className="text-slate-400 text-sm">Earn 2% of stake amounts when your referrals participate in predictions.</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-800 rounded-lg p-6">
                  <h3 className="text-white font-medium mb-4">Your Referral Link</h3>

                  {!userProfile ? (
                    <div className="bg-slate-900/80 rounded-lg p-4 text-center">
                      <p className="text-slate-300 mb-2">Connect your wallet to get your referral link</p>
                      <Button
                        variant="primary"
                        size="sm"
                        className="mt-2"
                        onClick={() => {
                          // Open AppKit wallet connection modal
                          open();
                        }}
                      >
                        Connect Wallet
                      </Button>
                    </div>
                  ) : !userProfile.referralCode ? (
                    <div className="bg-slate-900/80 rounded-lg p-4 text-center">
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

                      <div className="flex items-center justify-between bg-slate-900/80 rounded-lg p-4 border border-slate-700">
                        <div>
                          <span className="text-slate-400 text-sm">Your Referral Code:</span>
                          <div className="text-white font-mono">{userProfile.referralCode}</div>
                        </div>
                        <Button
                          variant="tertiary"
                          size="sm"
                          onClick={handleCopyCode}
                        >
                          Copy Code
                        </Button>
                      </div>

                      <div className="mt-4 flex flex-wrap gap-2">
                        <Button
                          variant="secondary"
                          size="sm"
                          leftIcon={<Share2 className="h-4 w-4" />}
                          onClick={() => {
                            const text = `Join me on SolyMarket for predictions on Solana! Use my referral link: ${referralLink}`;
                            window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`, '_blank');
                          }}
                        >
                          Share on Twitter
                        </Button>

                        <Button
                          variant="secondary"
                          size="sm"
                          leftIcon={<Share2 className="h-4 w-4" />}
                          onClick={() => {
                            const subject = `Join me on SolyMarket`;
                            const body = `Hey,\n\nI'm using SolyMarket for predictions on Solana. Join using my referral link!\n\n${referralLink}\n\nCheers!`;
                            window.open(`mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`, '_blank');
                          }}
                        >
                          Share via Email
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-1">
          <ReferralStats />
          <div className="mt-6">
            <Card>
              <CardHeader>
                <div className="flex items-center">
                  <Gift className="h-5 w-5 text-purple-400 mr-2" />
                  <h2 className="text-xl font-medium text-white">Referral Rewards</h2>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-slate-300 mb-4">
                  Check and claim your earned referral rewards from users you've referred.
                </p>
                <Button
                  variant="primary"
                  fullWidth
                  onClick={() => window.location.href = '/profile/rewards'}
                >
                  View & Claim Rewards
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReferralPage;
