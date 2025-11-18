import React, { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import { useAppKitAccount, useAppKit } from '@reown/appkit/react';
import { useAccount, useBalance, useReadContract } from 'wagmi';
import { parseEther, formatEther, type Address } from 'viem';
// SOLY token imports removed
import { logWalletConnection, updateUserProfile, getUserProfile } from '../services/api';
import ProfileSetupModal from '../components/profile/ProfileSetupModal';
import { useAuth } from './AuthContext';

// KAIDO LP token configuration for BNB Smart Chain
const KAIDO_LP_TOKEN_ADDRESS = '0x9c34729D6C5dE59D85C7Edee2A378C6E916044a5' as Address;

// ERC-20 ABI for balanceOf function
const ERC20_ABI = [
  {
    constant: true,
    inputs: [{ name: '_owner', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ name: 'balance', type: 'uint256' }],
    type: 'function',
  },
] as const;

// Define the wallet connection state
interface WalletState {
  connected: boolean;
  address: string | null;
  balance: {
    bnb: number;
    kaido: number;
  };
  connecting: boolean;
  error: string | null;
  adapter?: any; // Wallet adapter for sending transactions
}

// Define the user profile state
interface UserProfile {
  id: string;
  walletAddress: string;
  username: string | null;
  email: string | null;
  displayName?: string;
  profileCompleted: boolean;
  avatar?: string;
  bio?: string;
  balances?: {
    SOL: number;
    SOLY: number;
  };
  reputation?: number;
  winRate?: number;
  totalPredictions?: number;
  wonPredictions?: number;
  referralCode?: string;
}

// Define the context interface
interface WalletContextType {
  wallet: WalletState;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
  isPhantomInstalled: boolean;
  userProfile: UserProfile | null;
  token: string | null;
  showProfileSetup: boolean;
  setShowProfileSetup: (show: boolean) => void;
  updateProfile: (profileData: {
    username?: string;
    email?: string;
    displayName?: string;
    bio?: string;
    avatar?: string;
  }) => Promise<void>;
  isInitializing: boolean; // Add loading state for initial wallet check
}

// Create the context with default values
const WalletContext = createContext<WalletContextType>({
  wallet: {
    connected: false,
    address: null,
    balance: {
      bnb: 0,
      kaido: 0,
    },
    connecting: false,
    error: null,
    adapter: undefined,
  },
  connectWallet: async () => {},
  disconnectWallet: () => {},
  isPhantomInstalled: false,
  userProfile: null,
  token: null,
  showProfileSetup: false,
  setShowProfileSetup: () => {},
  updateProfile: async () => {},
  isInitializing: true, // Default to true while checking wallet state
});

// Hook to use the wallet context
export const useWallet = () => {
  const context = useContext(WalletContext);
  return context;
};

// Create a mutable object to hold the refresh function
export const WalletBalanceRefresher = {
  refresh: async () => {
    console.log('Default refresh function called - not yet initialized');
    return;
  }
};

// Convenience function to refresh wallet balances
export const refreshWalletBalances = async () => {
  return WalletBalanceRefresher.refresh();
};

// Provider component
export const WalletProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Use wagmi hooks for BNB Smart Chain
  const wagmiAccount = useAccount();
  const appkitAccount = useAppKitAccount();

  // Get account info from wagmi with proper error handling
  const address = wagmiAccount?.address || appkitAccount?.address || null;
  const isConnected = wagmiAccount?.isConnected || appkitAccount?.isConnected || false;
  const walletConnector = wagmiAccount?.connector || null;

  // Use wagmi balance hook to fetch BNB balance
  const { data: balanceData, refetch: refetchBalance } = useBalance({
    address: address as Address,
    query: {
      enabled: !!address && isConnected,
    },
  });

  // Use wagmi to fetch KAIDO LP token balance
  const { data: kaidoBalanceData, refetch: refetchKaidoBalance } = useReadContract({
    address: KAIDO_LP_TOKEN_ADDRESS,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: [address as Address],
    query: {
      enabled: !!address && isConnected,
    },
  });

  // Use open function from Appkit with error handling
  let open = () => {
    console.error('Appkit not properly initialized');
  };

  try {
    const appkit = useAppKit();
    if (appkit && typeof appkit === 'object' && typeof appkit.open === 'function') {
      open = appkit.open;
    }
  } catch (error) {
    console.error('Error initializing Appkit open function:', error);
  }
  const { setToken: setAuthToken, setUserProfile: setAuthUserProfile } = useAuth();

  // No need for a reference anymore as we're using the WalletBalanceRefresher object

  // Add isInitializing state to track wallet initialization
  const [isInitializing, setIsInitializing] = useState<boolean>(true);

  const [wallet, setWallet] = useState<WalletState>({
    connected: false,
    address: null,
    balance: {
      bnb: 0,
      kaido: 0,
    },
    connecting: false,
    error: null,
    adapter: undefined,
  });

  // User profile state
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [showProfileSetup, setShowProfileSetup] = useState<boolean>(false);

  // We'll keep this for backward compatibility
  const [isPhantomInstalled, setIsPhantomInstalled] = useState<boolean>(true);

  // Listen for Appkit modal events
  useEffect(() => {
    const handleAppkitClose = (event: Event) => {
      // Reset connecting state when modal is closed
      setWallet(prev => ({
        ...prev,
        connecting: false,
      }));
    };

    // Add event listener for appkit modal close
    document.addEventListener('appkit:close', handleAppkitClose);

    return () => {
      document.removeEventListener('appkit:close', handleAppkitClose);
    };
  }, []);

  // Store the last fetched balances to prevent unnecessary updates
  const [lastBalances, setLastBalances] = useState<{ bnb: number; kaido: number }>({ bnb: 0, kaido: 0 });

  // Add a debounce timer reference
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Function to fetch wallet balances with debouncing
  const fetchBalances = async () => {
    if (!isConnected || !address) {
      console.log('Cannot fetch balances: wallet not connected');
      return;
    }

    console.log('Fetching BNB balances for address:', address);

    console.log('Fetching wallet balances...');

    // Initialize balances for BNB Smart Chain
    let bnbBalance = 0;
    let kaidoBalance = 0;

    try {
      // Get BNB balance from wagmi useBalance hook
      if (balanceData && balanceData.value) {
        bnbBalance = parseFloat(formatEther(balanceData.value));
        console.log('Real BNB balance from wagmi:', bnbBalance);
      } else {
        console.log('No balance data available from wagmi');
        // Try to refetch balance
        if (refetchBalance) {
          console.log('Attempting to refetch balance...');
          const refetchResult = await refetchBalance();
          if (refetchResult.data && refetchResult.data.value) {
            bnbBalance = parseFloat(formatEther(refetchResult.data.value));
            console.log('Refetched BNB balance:', bnbBalance);
          }
        }
      }

      // Get KAIDO LP token balance
      if (kaidoBalanceData) {
        kaidoBalance = parseFloat(formatEther(kaidoBalanceData as bigint));
        console.log('KAIDO LP balance from contract:', kaidoBalance);
      } else {
        kaidoBalance = 0;
        console.log('No KAIDO LP balance data available');
      }

      console.log('BNB balance:', bnbBalance, 'KAIDO balance:', kaidoBalance);
    } catch (error) {
      console.error('Error fetching balances:', error);
      console.error('Error details:', error instanceof Error ? error.message : String(error));
    }

    // Check if balances have actually changed (with small epsilon for floating point comparison)
    const epsilon = 0.000001;
    const bnbChanged = Math.abs(bnbBalance - lastBalances.bnb) > epsilon;
    const kaidoChanged = Math.abs(kaidoBalance - lastBalances.kaido) > epsilon;

    if (bnbChanged || kaidoChanged) {
      console.log('Balances changed, updating state...');

      // Clear any existing debounce timer
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      // Set a debounce timer to update the wallet state
      debounceTimerRef.current = setTimeout(() => {
        setWallet(prev => ({
          ...prev,
          balance: {
            bnb: bnbBalance,
            kaido: kaidoBalance,
          }
        }));

        // Update the last balances
        setLastBalances({ bnb: bnbBalance, kaido: kaidoBalance });

        console.log('Wallet balances updated - BNB:', bnbBalance, 'KAIDO:', kaidoBalance);
      }, 500); // 500ms debounce
    } else {
      console.log('Balances unchanged, skipping update');
    }
  };

  // Update the WalletBalanceRefresher object with our implementation
  WalletBalanceRefresher.refresh = async () => {
    console.log('Global refreshWalletBalances called');
    // First refetch from wagmi
    if (refetchBalance) {
      console.log('Refetching BNB balance from wagmi...');
      await refetchBalance();
    }
    if (refetchKaidoBalance) {
      console.log('Refetching KAIDO balance from wagmi...');
      await refetchKaidoBalance();
    }
    // Then update our local state
    return fetchBalances();
  };

  // Watch for balance changes from wagmi and update automatically
  useEffect(() => {
    if ((balanceData || kaidoBalanceData) && isConnected && address) {
      console.log('Balance data changed from wagmi, updating wallet state...');
      fetchBalances();
    }
  }, [balanceData, kaidoBalanceData, isConnected, address]);

  // Clean up debounce timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  // Create a helper function to show toast notifications
  const showToastNotification = (type: 'success' | 'error' | 'info' | 'warning', title: string, message: string, duration: number = 5000) => {
    try {
      // Use a direct import instead of a hook
      const { toast } = require('../utils/toast');
      if (toast) {
        toast({
          type,
          title,
          message,
          duration
        });
        console.log(`[TOAST] Showed ${type} toast: ${title}`);
      }
    } catch (error) {
      console.error('[TOAST] Error showing toast notification:', error);
    }
  };

  // Update wallet state when Appkit connection changes
  useEffect(() => {
    const handleWalletConnection = async () => {
      // Set initializing to true at the start of the connection check
      setIsInitializing(true);

      try {
        if (isConnected && address) {
          console.log('[WALLET] Connection detected - Address:', address, 'Connector:', walletConnector?.name);

          // Validate address format before proceeding
          if (!address || address.trim() === '' || address === 'undefined') {
            console.error('[WALLET] Invalid wallet address detected:', address);

            // For social/email logins, the address might take a moment to be available
            // Wait a bit and check again
            if (walletConnector?.name && (walletConnector.name.toLowerCase().includes('social') || walletConnector.name.toLowerCase().includes('email'))) {
              console.log('[WALLET] Social/email login detected, waiting for address...');
              await new Promise(resolve => setTimeout(resolve, 2000));

              // Check if address is now available
              if (!address || address.trim() === '' || address === 'undefined') {
                console.error('[WALLET] Address still not available after waiting');
                setWallet(prev => ({
                  ...prev,
                  connecting: false,
                  error: 'Failed to retrieve wallet address. Please try again.',
                }));
                setIsInitializing(false);
                return;
              }
            } else {
              setWallet(prev => ({
                ...prev,
                connecting: false,
                error: 'Invalid wallet address. Please try reconnecting.',
              }));
              setIsInitializing(false);
              return;
            }
          }

          // Fetch balances
          await fetchBalances();

          setWallet(prev => ({
            ...prev,
            connected: true,
            address: address,
            connecting: false,
            error: null,
            adapter: walletConnector, // Add the wallet adapter
          }));

          // Save connection state to localStorage for persistence
          localStorage.setItem('walletConnected', 'true');
          localStorage.setItem('walletAddress', address);

          try {
            console.log('[WALLET] Logging wallet connection to backend with address:', address);

            // Show a loading notification for social logins
            const isSocialLogin = walletConnector?.name && (walletConnector.name.toLowerCase().includes('social') || walletConnector.name.toLowerCase().includes('email'));
            if (isSocialLogin) {
              showToastNotification(
                'info',
                'Retrieving User Data',
                'Please wait while we set up your account...',
                5000
              );
            }

            // Log wallet connection to backend with retry logic for social logins
            let response;
            let retries = isSocialLogin ? 3 : 1;
            let lastError;

            for (let attempt = 1; attempt <= retries; attempt++) {
              try {
                console.log(`[WALLET] Attempt ${attempt}/${retries} to log wallet connection`);
                response = await logWalletConnection(address);
                console.log('[WALLET] Backend response received:', response);

                // Validate response
                if (!response || !response.user || !response.token) {
                  throw new Error('Invalid response from server. Please try reconnecting.');
                }

                // Success - break out of retry loop
                break;
              } catch (error) {
                lastError = error;
                console.error(`[WALLET] Attempt ${attempt}/${retries} failed:`, error);

                // If this is not the last attempt, wait before retrying
                if (attempt < retries) {
                  console.log(`[WALLET] Waiting 2 seconds before retry...`);
                  await new Promise(resolve => setTimeout(resolve, 2000));
                }
              }
            }

            // If all retries failed, throw the last error
            if (!response) {
              throw lastError || new Error('Failed to connect to server after multiple attempts');
            }

            // Save user profile and token
            setUserProfile(response.user);
            setToken(response.token);

            // Update AuthContext with the same data
            setAuthToken(response.token);
            setAuthUserProfile(response.user);

            // Check if profile is completed
            console.log('User profile:', response.user);
            if (!response.user.profileCompleted) {
              console.log('Profile not completed, showing setup modal');
              // Show profile setup modal if profile is not completed
              setShowProfileSetup(true);
            } else {
              console.log('Profile already completed');
            }

            // Check for stored referral code and apply it if the user doesn't already have a referrer
            if (!response.user.referredBy) {
              const { getStoredReferralCode, clearStoredReferralCode } = await import('../utils/referralUtils');
              const storedReferralCode = getStoredReferralCode();

              if (storedReferralCode) {
                console.log('Found stored referral code:', storedReferralCode);

                // Show a notification that we're applying the referral code
                showToastNotification(
                  'info',
                  'Applying Referral Code',
                  `Applying referral code "${storedReferralCode}"...`,
                  3000
                );
                console.log('[REFERRAL DEBUG] Showed info toast for referral code application');

                // Function to apply referral code with retries
                const applyReferralCodeWithRetries = async (code: string, maxRetries = 3): Promise<boolean> => {
                  const { applyReferralCode, forceFixReferrals } = await import('../services/api');

                  console.log('[REFERRAL DEBUG] Starting referral code application process with code:', code);
                  console.log('[REFERRAL DEBUG] Will attempt up to', maxRetries, 'times');

                  for (let attempt = 1; attempt <= maxRetries; attempt++) {
                    try {
                      console.log(`[REFERRAL DEBUG] Applying referral code: Attempt ${attempt} of ${maxRetries}`);

                      // If this is not the first attempt, add a delay
                      if (attempt > 1) {
                        const delay = 1500 * attempt;
                        console.log(`[REFERRAL DEBUG] Waiting ${delay}ms before attempt ${attempt}`);
                        await new Promise(resolve => setTimeout(resolve, delay));
                      }

                      // On the second attempt, try to force fix referrals first
                      if (attempt === 2) {
                        console.log('[REFERRAL DEBUG] Running force fix referrals before retry');
                        const fixResult = await forceFixReferrals();
                        console.log('[REFERRAL DEBUG] Force fix result:', fixResult);
                      }

                      console.log('[REFERRAL DEBUG] Calling applyReferralCode API with code:', code);
                      const applyResponse = await applyReferralCode(code);
                      console.log('[REFERRAL DEBUG] API response:', applyResponse);

                      if (applyResponse.success) {
                        console.log(`[REFERRAL DEBUG] Successfully applied referral code on attempt ${attempt}:`, code);

                        // Show success toast
                        showToastNotification(
                          'success',
                          '🎉 Referral Applied Successfully!',
                          applyResponse.message || 'You have successfully joined using a referral code!',
                          8000
                        );
                        console.log('[REFERRAL DEBUG] Showed success toast for referral code application');

                        // Run force fix one more time to ensure everything is consistent
                        console.log('[REFERRAL DEBUG] Running final force fix after successful application');
                        await forceFixReferrals();

                        return true;
                      } else {
                        console.warn(`[REFERRAL DEBUG] Failed to apply referral code on attempt ${attempt}:`, applyResponse.message);

                        // If the error indicates the user already has a referrer, consider it a success
                        if (applyResponse.message && (
                            applyResponse.message.includes('already have a referrer') ||
                            applyResponse.message.includes('already used a referral code') ||
                            applyResponse.message.includes('already referred by')
                        )) {
                          console.log('[REFERRAL DEBUG] User already has a referrer, considering this a success');

                          showToastNotification(
                            'info',
                            'Already Referred',
                            applyResponse.message || 'You already have a referrer',
                            5000
                          );
                          console.log('[REFERRAL DEBUG] Showed info toast for already referred user');

                          return true;
                        }

                        // Only show error toast on the last attempt
                        if (attempt === maxRetries) {
                          showToastNotification(
                            'error',
                            'Referral Code Error',
                            applyResponse.message || 'Failed to apply referral code',
                            5000
                          );
                          console.log('[REFERRAL DEBUG] Showed error toast for failed referral code application');
                        }
                      }
                    } catch (error) {
                      console.error(`[REFERRAL DEBUG] Error applying referral code on attempt ${attempt}:`, error);

                      // Only show error toast on the last attempt
                      if (attempt === maxRetries) {
                        showToastNotification(
                          'error',
                          'Referral Code Error',
                          'An error occurred while applying the referral code',
                          5000
                        );
                        console.log('[REFERRAL DEBUG] Showed error toast for exception during referral code application');
                      }
                    }
                  }

                  console.log('[REFERRAL DEBUG] All attempts to apply referral code failed');
                  return false; // All attempts failed
                };

                // Apply the referral code with retries
                const success = await applyReferralCodeWithRetries(storedReferralCode);

                if (success) {
                  // Clear the stored code after successful application
                  clearStoredReferralCode();

                  // Force a delay to ensure the backend has time to process the referral
                  await new Promise(resolve => setTimeout(resolve, 1500));

                  // Refresh user profile to get updated referral status
                  const updatedProfileResponse = await getUserProfile();
                  if (updatedProfileResponse.success && updatedProfileResponse.user) {
                    setUserProfile(updatedProfileResponse.user);
                    setAuthUserProfile(updatedProfileResponse.user);

                    // Log the updated profile to verify referral was applied
                    console.log('Updated user profile after referral:', {
                      id: updatedProfileResponse.user._id,
                      referredBy: updatedProfileResponse.user.referredBy || 'Not set'
                    });

                    // Force fix referrals to ensure consistency
                    const { forceFixReferrals } = await import('../services/api');
                    await forceFixReferrals();
                  }
                } else {
                  console.warn('All attempts to apply referral code failed');
                }
              }
            }
          } catch (error) {
            console.error('[WALLET] Error logging wallet connection:', error);

            // Show error notification
            const errorMessage = error instanceof Error ? error.message : 'Failed to connect to server';
            showToastNotification(
              'error',
              'Connection Error',
              errorMessage,
              8000
            );

            // Reset wallet state on error
            setWallet(prev => ({
              ...prev,
              connecting: false,
              error: errorMessage,
            }));

            // Don't disconnect the wallet, just show the error
            // The user can try to reconnect or refresh the page
          }
        } else {
          try {
            setWallet({
              connected: false,
              address: null,
              balance: {
                sol: 0,
              },
              connecting: false,
              error: null,
              adapter: undefined,
            });

            // Reset user profile and token
            setUserProfile(null);
            setToken(null);

            // Update AuthContext
            setAuthToken(null);
            setAuthUserProfile(null);

            // Remove connection state from localStorage
            localStorage.removeItem('walletConnected');
            localStorage.removeItem('walletAddress');
            localStorage.removeItem('userToken');
          } catch (error) {
            console.error('Error resetting wallet state:', error);
          }
        }
      } catch (error) {
        console.error('Error in wallet connection handling:', error);
      } finally {
        // Always set initializing to false at the end
        setIsInitializing(false);
      }
    };

    handleWalletConnection();
  }, [isConnected, address, walletConnector]);

  // Connect to wallet using Appkit
  const connectWallet = async () => {
    try {
      setWallet(prev => ({ ...prev, connecting: true, error: null }));

      // Open Appkit modal
      open();

      // Reset connecting state after a short delay if not connected
      // This handles the case when user closes the modal without connecting
      setTimeout(() => {
        if (!isConnected) {
          setWallet(prev => ({
            ...prev,
            connecting: false,
          }));
        }
      }, 1000);

    } catch (error) {
      console.error('Error connecting to wallet:', error);
      setWallet(prev => ({
        ...prev,
        connected: false,
        connecting: false,
        error: error instanceof Error ? error.message : 'Failed to connect wallet',
      }));
    }
  };

  // Disconnect from wallet using Appkit
  const disconnectWallet = async () => {
    try {
      // Disconnect using Appkit
      open({ view: 'Account' });

      setWallet({
        connected: false,
        address: null,
        balance: {
          sol: 0,
        },
        connecting: false,
        error: null,
        adapter: undefined,
      });

      // Remove connection state from localStorage
      localStorage.removeItem('walletConnected');
      localStorage.removeItem('walletAddress');

    } catch (error) {
      console.error('Error disconnecting wallet:', error);
    }
  };

  // Update user profile
  const updateProfile = async (profileData: {
    username?: string;
    email?: string;
    displayName?: string;
    bio?: string;
    avatar?: string;
  }) => {
    if (!token) {
      throw new Error('Not authenticated');
    }

    try {
      const response = await updateUserProfile(profileData);
      setUserProfile(response.user);

      // Update AuthContext
      setAuthUserProfile(response.user);

      setShowProfileSetup(false);
      return response;
    } catch (error) {
      console.error('Error updating profile:', error);
      throw error;
    }
  };

  // Load token from localStorage on initial load
  useEffect(() => {
    const savedToken = localStorage.getItem('userToken');
    if (savedToken) {
      setToken(savedToken);

      // Update AuthContext
      setAuthToken(savedToken);

      // Fetch user profile if token exists
      getUserProfile()
        .then(response => {
          setUserProfile(response.user);

          // Update AuthContext
          setAuthUserProfile(response.user);
        })
        .catch(error => {
          console.error('Error fetching user profile:', error);
          localStorage.removeItem('userToken');
          setToken(null);

          // Update AuthContext
          setAuthToken(null);
        });
    }
  }, []);

  // Save token to localStorage when it changes
  useEffect(() => {
    if (token) {
      localStorage.setItem('userToken', token);
    }
  }, [token]);

  return (
    <WalletContext.Provider
      value={{
        wallet,
        connectWallet,
        disconnectWallet,
        isPhantomInstalled,
        userProfile,
        token,
        showProfileSetup,
        setShowProfileSetup,
        updateProfile,
        isInitializing,
      }}
    >
      {children}
      {showProfileSetup && wallet.connected && (
        <>
          {console.log('Rendering ProfileSetupModal, showProfileSetup:', showProfileSetup, 'wallet.connected:', wallet.connected)}
          <ProfileSetupModal
            onClose={() => setShowProfileSetup(false)}
            onSubmit={updateProfile}
          />
        </>
      )}
    </WalletContext.Provider>
  );
};
