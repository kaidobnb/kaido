import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAppKit } from '@reown/appkit/react';
import { useToast } from '../../hooks/useToast';
import { checkReferralCode, applyReferralCode, getUserProfile } from '../../services/api';
import { getPresaleHistory } from '../../services/presaleService';
import { useAuth } from '../../contexts/AuthContext';
import { extractReferralCode } from '../../utils/referralUtils';
import Button from '../ui/Button';
import { Spinner } from '../ui/Spinner';
import AnimatedBackground from '../effects/AnimatedBackground';
import GlowEffect from '../effects/GlowEffect';


const InviteOnlyPage: React.FC = () => {
  const { userProfile, isAuthenticated, token, setUserProfile } = useAuth();
  const authLoading = !userProfile && !!token;
  const { showToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const { open } = useAppKit();

  const [referralCode, setReferralCode] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [isApplying, setIsApplying] = useState(false);
  const [referrerInfo, setReferrerInfo] = useState<{ username: string; avatar: string } | null>(null);
  const [hasAccess, setHasAccess] = useState(false);
  const [isCheckingAccess, setIsCheckingAccess] = useState(true);

  // Check if there's a referral code in the URL
  useEffect(() => {
    const urlReferralCode = extractReferralCode(location.search);
    if (urlReferralCode) {
      setReferralCode(urlReferralCode);
      validateReferralCode(urlReferralCode);

      // If user is already authenticated, try to apply the referral code immediately
      if (isAuthenticated && userProfile && !userProfile.referredBy) {
        applyReferralCodeAndRedirect(urlReferralCode);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.search, isAuthenticated, userProfile]);

  // Check for presale participation
  const checkPresaleParticipation = async () => {
    if (!isAuthenticated || !token) return false;

    try {
      const response = await getPresaleHistory();
      if (response.success && response.transactions && response.transactions.length > 0) {
        console.log('User has participated in presale:', response.transactions.length, 'transactions found');
        return true;
      } else {
        console.log('User has not participated in presale');
        return false;
      }
    } catch (error) {
      console.error('Error checking presale participation:', error);
      return false;
    }
  };

  // Create a ref outside of the useEffect to track if we've shown the toast
  const hasShownToastRef = React.useRef(false);

  // Check if the user already has access
  useEffect(() => {
    const checkUserAccess = async () => {
      if (authLoading) return;

      if (isAuthenticated && userProfile) {
        // Log user profile for debugging
        console.log('Checking user access with profile:', {
          id: userProfile.id,
          hasReferralCode: !!userProfile.referralCode,
          hasReferredBy: !!userProfile.referredBy,
          isAdmin: !!userProfile.isAdmin
        });

        // Check if user has participated in presale
        const hasParticipatedInPresale = await checkPresaleParticipation();

        // Invite-only access has been removed - all users now have access
        console.log('Invite-only access has been removed - all users now have access');
        setHasAccess(true);

        // If the user participated in presale, show a success message (only once)
        if (hasParticipatedInPresale &&
            !userProfile.referralCode &&
            !userProfile.referredBy &&
            !userProfile.isAdmin &&
            !hasShownToastRef.current) {

          hasShownToastRef.current = true;
          showToast({
            title: 'Early Access Granted',
            message: 'You have been granted early access for participating in the $SOLY presale!',
            type: 'success'
          });
        }

        // Redirect to the intended page or home
        const intendedPath = sessionStorage.getItem('intendedPath') || '/';
        sessionStorage.removeItem('intendedPath');
        navigate(intendedPath);
      } else {
        // Not authenticated or no user profile yet
        console.log('User not authenticated or no profile yet');
        setHasAccess(false);
      }

      setIsCheckingAccess(false);
    };

    checkUserAccess();
  }, [isAuthenticated, userProfile, authLoading, navigate, token, showToast]);

  const validateReferralCode = async (code: string) => {
    if (!code) return;

    setIsValidating(true);
    try {
      const response = await checkReferralCode(code);

      if (response.success && response.isValid) {
        setReferrerInfo(response.referrer);

        // If user is authenticated, apply the referral code
        if (isAuthenticated && userProfile && !userProfile.referredBy) {
          await applyReferralCodeAndRedirect(code);
        }
      } else {
        setReferrerInfo(null);
        showToast({
          title: 'Invalid Code',
          message: 'The referral code is invalid or has expired.',
          type: 'error'
        });
      }
    } catch (error) {
      console.error('Error validating referral code:', error);
      showToast({
        title: 'Error',
        message: 'Failed to validate the referral code. Please try again.',
        type: 'error'
      });
    } finally {
      setIsValidating(false);
    }
  };

  const applyReferralCodeAndRedirect = async (code: string) => {
    try {
      setIsApplying(true);
      console.log('Applying referral code and refreshing user profile...');
      const response = await applyReferralCode(code);

      if (response.success) {
        // After successfully applying the referral code, refresh the user profile
        try {
          console.log('Refreshing user profile after applying referral code...');
          const profileResponse = await getUserProfile();

          if (profileResponse.success && profileResponse.user) {
            // Update the user profile in the AuthContext
            setUserProfile(profileResponse.user);

            console.log('User profile refreshed successfully:', {
              hasReferredBy: !!profileResponse.user.referredBy,
              referralCode: profileResponse.user.referralCode
            });

            showToast({
              title: 'Success',
              message: 'Referral code applied successfully!',
              type: 'success'
            });

            // Redirect to the intended page or home
            const intendedPath = sessionStorage.getItem('intendedPath') || '/';
            sessionStorage.removeItem('intendedPath');
            navigate(intendedPath);
          } else {
            console.error('Failed to refresh user profile after applying referral code:', profileResponse);
            showToast({
              title: 'Warning',
              message: 'Referral code applied, but please refresh the page to access the site.',
              type: 'info'
            });
          }
        } catch (profileError) {
          console.error('Error refreshing user profile after applying referral code:', profileError);
          showToast({
            title: 'Warning',
            message: 'Referral code applied, but please refresh the page to access the site.',
            type: 'info'
          });
        }
      } else {
        showToast({
          title: 'Error',
          message: response.message || 'Failed to apply referral code.',
          type: 'error'
        });
      }
    } catch (error) {
      console.error('Error applying referral code:', error);
      showToast({
        title: 'Error',
        message: 'Failed to apply referral code. Please try again.',
        type: 'error'
      });
    } finally {
      setIsApplying(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    validateReferralCode(referralCode);
  };

  const handleConnectWallet = () => {
    open();
  };

  if (isCheckingAccess) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-900">
        <Spinner size="lg" />
      </div>
    );
  }

  if (hasAccess) {
    return null; // User has access, will be redirected
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center py-12 px-4 relative overflow-hidden">
      {/* Animated background - full opacity */}
      <AnimatedBackground />

      {/* Background glow effects */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden">
        {/* Top left glow */}
        <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-purple-600/10 rounded-full filter blur-3xl animate-pulse-slow"></div>

        {/* Bottom right glow */}
        <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-blue-600/10 rounded-full filter blur-3xl animate-pulse-slow" style={{ animationDelay: '4s' }}></div>

        {/* Center ambient glow */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-indigo-600/5 rounded-full filter blur-3xl animate-pulse-slow" style={{ animationDelay: '8s' }}></div>
      </div>

      {/* Animated mascot images with enhanced breathing/floating effect */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        {/* Main mascot - right side, showing full body */}
        <div className="absolute right-[-10%] top-[50%] transform translate-y-[-50%] w-[50%] h-[80%] overflow-visible">
          <div className="animate-float" style={{
            animationDuration: '12s',
            animationTimingFunction: 'ease-in-out',
            animationIterationCount: 'infinite',
            transformOrigin: 'center center'
          }}>
            <img
              src="https://i.imgur.com/awiUYmj.png"
              alt="Soly Mascot"
              className="w-full h-full object-contain animate-glow animate-breathing"
              style={{
                opacity: 0.85,
                animationDelay: '0s, 2s'
              }}
            />
          </div>
        </div>

        {/* Secondary mascot - top left, mirrored */}
        <div className="absolute left-[-5%] top-[-5%] w-[40%] h-[50%] overflow-hidden">
          <div className="animate-float" style={{
            animationDuration: '15s',
            animationTimingFunction: 'ease-in-out',
            animationIterationCount: 'infinite',
            animationDelay: '3s',
            transformOrigin: 'center center'
          }}>
            <img
              src="https://i.imgur.com/awiUYmj.png"
              alt=""
              className="w-full h-full object-contain animate-glow animate-breathing"
              style={{
                opacity: 0.7,
                transform: 'scaleX(-1)',
                animationDelay: '1s, 3s'
              }}
            />
          </div>
        </div>
      </div>

      {/* Gradient overlay for better text readability */}
      <div className="absolute inset-0 z-2 bg-gradient-radial from-transparent via-slate-900/30 to-slate-900/60 pointer-events-none"></div>
      <div className="absolute inset-0 z-2 bg-gradient-to-b from-slate-900/40 via-slate-900/10 to-slate-900/40 pointer-events-none"></div>

      <GlowEffect glowColor="#8b5cf6" className="w-full max-w-md z-10">
        <div className="p-6 bg-slate-800/70 backdrop-blur-md rounded-xl border border-slate-700/50 shadow-2xl relative overflow-hidden">
          <div className="flex flex-col items-center mb-8 relative z-10">
            <div className="mb-4">
              <img src="/kaido.png" alt="Kaido Logo" className="h-16 w-16 rounded-full relative z-10" />
            </div>
            <h1 className="text-2xl font-bold text-white handwritten">Welcome to Kaido</h1>
            <p className="text-slate-300 text-center mt-2">
              Kaido is now open to everyone! You can still use a referral code for additional benefits.
            </p>
          </div>

        {isAuthenticated ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <label htmlFor="referralCode" className="block text-sm font-medium text-slate-300 mb-1 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-purple-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M15 7h3a5 5 0 0 1 5 5 5 5 0 0 1-5 5h-3m-6 0H6a5 5 0 0 1-5-5 5 5 0 0 1 5-5h3" />
                  <line x1="8" y1="12" x2="16" y2="12" />
                </svg>
                Referral Code
              </label>
              <div className="relative group">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-500/30 to-blue-500/30 rounded-md opacity-0 group-hover:opacity-100 transition duration-300"></div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none z-10">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-purple-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    </svg>
                  </div>
                  <input
                    id="referralCode"
                    type="text"
                    value={referralCode}
                    onChange={(e) => setReferralCode(e.target.value)}
                    placeholder="Enter referral code"
                    required
                    className="w-full bg-slate-700/50 border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 pl-12 py-3 text-slate-200 placeholder:text-slate-500"
                    style={{ textIndent: '0px' }}
                  />
                </div>
              </div>
              <p className="mt-1 text-xs text-slate-400">Enter the code shared by your referrer</p>
            </div>

            {referrerInfo && (
              <div className="p-3 bg-slate-700/50 backdrop-blur-sm rounded-md border border-slate-600/50">
                <p className="text-sm text-slate-300">
                  Invited by: <span className="font-semibold text-white">{referrerInfo.username}</span>
                </p>
              </div>
            )}

            <div className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg blur opacity-30 group-hover:opacity-100 transition duration-1000 group-hover:duration-200"></div>
              <Button
                type="submit"
                variant="primary"
                className="relative w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 transition-all duration-300 py-3 text-lg font-semibold"
                disabled={isValidating || isApplying}
              >
                <div className="absolute inset-0 overflow-hidden rounded-lg">
                  <div className="absolute -inset-[100%] animate-[spin_5s_linear_infinite] bg-gradient-to-r from-purple-500/0 via-purple-500/50 to-purple-500/0 opacity-30"></div>
                </div>
                <span className="relative z-10 flex items-center justify-center">
                  {isValidating || isApplying ? (
                    <Spinner size="sm" />
                  ) : (
                    <>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M9 12l2 2 4-4" />
                        <circle cx="12" cy="12" r="10" />
                      </svg>
                      Apply Referral Code
                    </>
                  )}
                </span>
              </Button>
            </div>
          </form>
        ) : (
          <div className="space-y-4">
            <p className="text-slate-300 text-center">
              Connect your wallet to apply a referral code and access the platform.
            </p>

            <div className="relative mt-6 group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg blur opacity-30 group-hover:opacity-100 transition duration-1000 group-hover:duration-200"></div>
              <Button
                variant="primary"
                className="relative w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 transition-all duration-300 py-3 text-lg font-semibold"
                onClick={handleConnectWallet}
              >
                <div className="absolute inset-0 overflow-hidden rounded-lg">
                  <div className="absolute -inset-[100%] animate-[spin_5s_linear_infinite] bg-gradient-to-r from-purple-500/0 via-purple-500/50 to-purple-500/0 opacity-30"></div>
                </div>
                <span className="relative z-10 flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="6" width="20" height="12" rx="2" />
                    <path d="M12 12h4" />
                    <path d="M14 9v6" />
                  </svg>
                  Connect Wallet
                </span>
              </Button>
            </div>

            {referralCode && (
              <div className="p-3 mt-4 bg-slate-700/50 backdrop-blur-sm rounded-md border border-slate-600/50">
                <p className="text-sm text-slate-300">
                  Referral code detected: <span className="font-mono text-white">{referralCode}</span>
                </p>
                {referrerInfo && (
                  <p className="text-sm text-slate-300 mt-1">
                    Invited by: <span className="font-semibold text-white">{referrerInfo.username}</span>
                  </p>
                )}
              </div>
            )}
          </div>
        )}
        </div>
      </GlowEffect>

      {/* Early Access Presale Bar */}
      <div className="w-full max-w-md mt-6 z-10 relative group">
        {/* Glow effect */}
        <div className="absolute -inset-0.5 bg-gradient-to-r from-yellow-400 to-purple-600 rounded-lg blur opacity-75 group-hover:opacity-100 transition duration-1000 group-hover:duration-200 animate-tilt"></div>

        <div className="relative overflow-hidden rounded-lg">
          {/* Animated gradient background */}
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500"></div>
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTYiIGhlaWdodD0iMTYiIHZpZXdCb3g9IjAgMCAxNiAxNiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMSIgaGVpZ2h0PSIxIiBmaWxsPSJyZ2JhKDI1NSwgMjU1LCAyNTUsIDAuMDUpIj48L3JlY3Q+PC9zdmc+')] opacity-20"></div>

          {/* Animated shine effect */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute -inset-[100%] animate-[spin_5s_linear_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
          </div>

          {/* Animated particles */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute top-1/4 left-1/4 w-1 h-1 bg-white rounded-full animate-ping" style={{ animationDuration: '3s' }}></div>
            <div className="absolute top-3/4 left-2/3 w-1 h-1 bg-white rounded-full animate-ping" style={{ animationDuration: '2s' }}></div>
            <div className="absolute top-1/2 left-1/3 w-1 h-1 bg-white rounded-full animate-ping" style={{ animationDuration: '4s' }}></div>
            <div className="absolute top-1/3 right-1/4 w-1 h-1 bg-yellow-300 rounded-full animate-ping" style={{ animationDuration: '3.5s' }}></div>
            <div className="absolute bottom-1/4 right-1/3 w-1 h-1 bg-blue-300 rounded-full animate-ping" style={{ animationDuration: '2.7s' }}></div>
          </div>

          {/* Content */}
          <div className="relative p-5 backdrop-blur-sm">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-r from-yellow-300 to-yellow-500 flex items-center justify-center mr-3 shadow-lg shadow-yellow-500/30 animate-pulse">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-slate-900" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"></path>
                    </svg>
                  </div>
                  <h3 className="text-white font-bold text-xl">Get Early Access!</h3>
                </div>
                <p className="text-white/90 text-sm mt-2 ml-1">
                  Participate in $SOLY presale to gain <span className="font-semibold text-yellow-300">immediate platform access</span> <span className="bg-green-500/20 text-green-300 text-xs px-1.5 py-0.5 rounded-full ml-1">Active Now!</span>
                </p>
              </div>
              <a
                href="/presale"
                className="px-5 py-2.5 bg-white text-purple-700 rounded-md font-semibold hover:bg-purple-100 transition-all duration-300 flex items-center whitespace-nowrap shadow-lg shadow-purple-500/20 hover:shadow-purple-500/40 hover:scale-105 transform"
              >
                Join Presale
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14"></path>
                  <path d="M12 5l7 7-7 7"></path>
                </svg>
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Floating elements for visual interest */}
      <div className="absolute inset-0 pointer-events-none z-2">
        {/* Subtle floating orbs */}
        <div className="absolute top-[15%] left-[20%] w-40 h-40 bg-purple-500/8 rounded-full filter blur-xl animate-pulse-slow"></div>
        <div className="absolute top-[60%] right-[25%] w-60 h-60 bg-blue-500/8 rounded-full filter blur-xl animate-pulse-slow" style={{ animationDelay: '2s' }}></div>
        <div className="absolute bottom-[20%] left-[30%] w-50 h-50 bg-indigo-500/8 rounded-full filter blur-xl animate-pulse-slow" style={{ animationDelay: '3s' }}></div>
        <div className="absolute top-[40%] left-[60%] w-40 h-40 bg-cyan-500/8 rounded-full filter blur-xl animate-pulse-slow" style={{ animationDelay: '5s' }}></div>

        {/* Particle effects */}
        <div className="absolute top-[30%] left-[40%] w-2 h-2 bg-purple-500 rounded-full animate-ping" style={{ animationDuration: '3s' }}></div>
        <div className="absolute top-[20%] left-[70%] w-2 h-2 bg-blue-500 rounded-full animate-ping" style={{ animationDuration: '2s' }}></div>
        <div className="absolute top-[70%] left-[30%] w-2 h-2 bg-indigo-500 rounded-full animate-ping" style={{ animationDuration: '4s' }}></div>
        <div className="absolute top-[15%] left-[50%] w-2 h-2 bg-cyan-500 rounded-full animate-ping" style={{ animationDuration: '5s' }}></div>
        <div className="absolute top-[50%] left-[20%] w-2 h-2 bg-purple-500 rounded-full animate-ping" style={{ animationDuration: '3.5s' }}></div>
        <div className="absolute top-[80%] left-[60%] w-2 h-2 bg-blue-500 rounded-full animate-ping" style={{ animationDuration: '2.5s' }}></div>
        <div className="absolute top-[40%] left-[80%] w-2 h-2 bg-indigo-500 rounded-full animate-ping" style={{ animationDuration: '4.5s' }}></div>
        <div className="absolute top-[60%] left-[40%] w-2 h-2 bg-cyan-500 rounded-full animate-ping" style={{ animationDuration: '5.5s' }}></div>
      </div>
    </div>
  );
};

export default InviteOnlyPage;
