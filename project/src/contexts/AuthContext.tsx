import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { getUserProfile } from '../services/api';

// Define the user profile state
export interface UserProfile {
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
  referredBy?: string;
  isAdmin?: boolean;
  isSubAdmin?: boolean;
}

// Define the auth context interface
interface AuthContextType {
  isAuthenticated: boolean;
  token: string | null;
  userProfile: UserProfile | null;
  isAdmin: boolean;
  isSubAdmin: boolean;
  setToken: (token: string | null) => void;
  setUserProfile: (profile: UserProfile | null) => void;
  logout: () => void;
}

// Create the context with default values
const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  token: null,
  userProfile: null,
  isAdmin: false,
  isSubAdmin: false,
  setToken: () => {},
  setUserProfile: () => {},
  logout: () => {},
});

// Hook to use the auth context
export const useAuth = () => useContext(AuthContext);

// Provider component
export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(localStorage.getItem('userToken'));
  const [userProfile, setUserProfileState] = useState<UserProfile | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(!!token);

  // Wrapper for setUserProfile to add logging
  const setUserProfile = (profile: UserProfile | null) => {
    console.log('AuthContext: Setting user profile:', profile ? {
      id: profile.id,
      hasReferralCode: !!profile.referralCode,
      hasReferredBy: !!profile.referredBy,
      isAdmin: !!profile.isAdmin,
      isSubAdmin: !!profile.isSubAdmin
    } : 'null');
    setUserProfileState(profile);
  };

  // Effect to update authentication state when token changes
  useEffect(() => {
    if (token) {
      localStorage.setItem('userToken', token);
      setIsAuthenticated(true);
    } else {
      localStorage.removeItem('userToken');
      setIsAuthenticated(false);
      setUserProfile(null);
    }
  }, [token]);

  // Effect to fetch user profile when authenticated
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (isAuthenticated && token) {
        try {
          console.log('AuthContext: Fetching user profile...');
          const response = await getUserProfile();
          if (response.success && response.user) {
            console.log('AuthContext: User profile fetched successfully:', {
              id: response.user.id,
              hasReferralCode: !!response.user.referralCode,
              hasReferredBy: !!response.user.referredBy,
              isAdmin: !!response.user.isAdmin,
              isSubAdmin: !!response.user.isSubAdmin
            });
            setUserProfile(response.user);
          } else {
            console.error('AuthContext: Failed to fetch user profile:', response);
          }
        } catch (error) {
          console.error('AuthContext: Error fetching user profile:', error);
          // If there's an authentication error, clear the token
          if (error instanceof Error && error.message.includes('Authentication')) {
            setToken(null);
          }
        }
      }
    };

    fetchUserProfile();
  }, [isAuthenticated, token]);

  // Logout function
  const logout = () => {
    setToken(null);
    setUserProfile(null);
    localStorage.removeItem('userToken');
    localStorage.removeItem('walletConnected');
    localStorage.removeItem('walletAddress');
  };

  // Check if user is admin
  const adminWallets = [
    '6rzmRYho7VViFwy6scyyfGvNRT6Y7PudPWtAyT5H8QEs', // Original admin wallet
    '0xac01Ee787F54FB1A2D8a08bA597c4b0a75Da83eb'   // New admin wallet
  ];
  const isAdmin = userProfile?.isAdmin || adminWallets.includes(userProfile?.walletAddress || '');

  // Check if user is sub-admin
  const isSubAdmin = userProfile?.isSubAdmin || false;

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        token,
        userProfile,
        isAdmin: !!isAdmin,
        isSubAdmin: !!isSubAdmin,
        setToken,
        setUserProfile,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
