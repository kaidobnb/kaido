// Utility functions for handling referral codes

/**
 * Store a referral code in localStorage and sessionStorage for redundancy
 * @param code The referral code to store
 * @returns boolean indicating if a new code was stored (true) or if it was already stored (false)
 */
export const storeReferralCode = (code: string): boolean => {
  if (!code) return false;

  try {
    // Check if we already have this exact code stored
    const existingCode = localStorage.getItem('pendingReferralCode');
    if (existingCode === code) {
      console.log('Referral code already stored, skipping:', code);
      return false;
    }

    // Store the new code in both localStorage and sessionStorage for redundancy
    localStorage.setItem('pendingReferralCode', code);

    // Also store in sessionStorage as a backup
    try {
      sessionStorage.setItem('pendingReferralCode', code);
    } catch (sessionError) {
      console.warn('Could not store referral code in sessionStorage:', sessionError);
    }

    // Store the timestamp when the code was added
    localStorage.setItem('pendingReferralCodeTimestamp', Date.now().toString());

    console.log('Stored new referral code in storage:', code);
    return true;
  } catch (error) {
    console.error('Error storing referral code in localStorage:', error);

    // Try sessionStorage as a fallback
    try {
      sessionStorage.setItem('pendingReferralCode', code);
      sessionStorage.setItem('pendingReferralCodeTimestamp', Date.now().toString());
      console.log('Stored referral code in sessionStorage as fallback:', code);
      return true;
    } catch (sessionError) {
      console.error('Error storing referral code in sessionStorage:', sessionError);
      return false;
    }
  }
};

/**
 * Get the stored referral code from localStorage or sessionStorage
 * @returns The stored referral code or null if none exists
 */
export const getStoredReferralCode = (): string | null => {
  try {
    // Try localStorage first
    const localCode = localStorage.getItem('pendingReferralCode');
    if (localCode) {
      console.log('Retrieved referral code from localStorage:', localCode);
      return localCode;
    }

    // If not in localStorage, try sessionStorage
    try {
      const sessionCode = sessionStorage.getItem('pendingReferralCode');
      if (sessionCode) {
        console.log('Retrieved referral code from sessionStorage:', sessionCode);

        // Sync back to localStorage for future use
        try {
          localStorage.setItem('pendingReferralCode', sessionCode);
          localStorage.setItem('pendingReferralCodeTimestamp', Date.now().toString());
        } catch (syncError) {
          console.warn('Could not sync referral code back to localStorage:', syncError);
        }

        return sessionCode;
      }
    } catch (sessionError) {
      console.warn('Error retrieving referral code from sessionStorage:', sessionError);
    }

    return null;
  } catch (error) {
    console.error('Error retrieving referral code from localStorage:', error);

    // Try sessionStorage as fallback
    try {
      const sessionCode = sessionStorage.getItem('pendingReferralCode');
      if (sessionCode) {
        console.log('Retrieved referral code from sessionStorage as fallback:', sessionCode);
        return sessionCode;
      }
    } catch (sessionError) {
      console.error('Error retrieving referral code from sessionStorage:', sessionError);
    }

    return null;
  }
};

/**
 * Clear the stored referral code from localStorage and sessionStorage
 */
export const clearStoredReferralCode = (): void => {
  try {
    // Clear from localStorage
    localStorage.removeItem('pendingReferralCode');
    localStorage.removeItem('pendingReferralCodeTimestamp');

    // Also clear from sessionStorage
    try {
      sessionStorage.removeItem('pendingReferralCode');
      sessionStorage.removeItem('pendingReferralCodeTimestamp');
    } catch (sessionError) {
      console.warn('Error clearing referral code from sessionStorage:', sessionError);
    }

    console.log('Cleared stored referral code from all storage');
  } catch (error) {
    console.error('Error clearing referral code from localStorage:', error);

    // Try to clear from sessionStorage as fallback
    try {
      sessionStorage.removeItem('pendingReferralCode');
      sessionStorage.removeItem('pendingReferralCodeTimestamp');
      console.log('Cleared referral code from sessionStorage as fallback');
    } catch (sessionError) {
      console.error('Error clearing referral code from sessionStorage:', sessionError);
    }
  }
};

/**
 * Extract referral code from URL parameters
 * @param url The URL to extract from (defaults to current window location)
 * @returns The referral code or null if none exists
 */
export const extractReferralCodeFromUrl = (url: string = window.location.href): string | null => {
  try {
    console.log('[REFERRAL DEBUG] Extracting referral code from URL:', url);

    // First try the standard way with URL object
    try {
      const urlObj = new URL(url);
      const refCode = urlObj.searchParams.get('ref');

      if (refCode) {
        console.log('[REFERRAL DEBUG] Extracted referral code from URL using URL object:', refCode);
        return refCode;
      } else {
        console.log('[REFERRAL DEBUG] No ref parameter found in URL using URL object');
      }
    } catch (urlError) {
      console.warn('[REFERRAL DEBUG] Error parsing URL with URL object, trying manual extraction:', urlError);
    }

    // Fallback to manual extraction in case URL object fails
    const refParam = url.match(/[?&]ref=([^&#]*)/);
    if (refParam && refParam[1]) {
      const refCode = decodeURIComponent(refParam[1]);
      console.log('[REFERRAL DEBUG] Manually extracted referral code from URL:', refCode);
      return refCode;
    } else {
      console.log('[REFERRAL DEBUG] No ref parameter found in URL using manual extraction');
    }

    // Additional check for other URL formats
    console.log('[REFERRAL DEBUG] Checking for alternative URL formats');

    // Check for /join?ref=CODE format
    const joinRefParam = url.match(/\/join\?ref=([^&#]*)/);
    if (joinRefParam && joinRefParam[1]) {
      const refCode = decodeURIComponent(joinRefParam[1]);
      console.log('[REFERRAL DEBUG] Extracted referral code from /join?ref= format:', refCode);
      return refCode;
    }

    // Check for /ref/CODE format
    const refPathParam = url.match(/\/ref\/([^\/&#]*)/);
    if (refPathParam && refPathParam[1]) {
      const refCode = decodeURIComponent(refPathParam[1]);
      console.log('[REFERRAL DEBUG] Extracted referral code from /ref/ path format:', refCode);
      return refCode;
    }

    console.log('[REFERRAL DEBUG] No referral code found in URL');
    return null;
  } catch (error) {
    console.error('[REFERRAL DEBUG] Error extracting referral code from URL:', error);
    return null;
  }
};

/**
 * Extract referral code from search params string
 * @param search The search params string (e.g., "?ref=CODE")
 * @returns The referral code or null if none exists
 */
export const extractReferralCode = (search: string): string | null => {
  try {
    if (!search) return null;

    // First try with URLSearchParams
    try {
      const searchParams = new URLSearchParams(search);
      const refCode = searchParams.get('ref');

      if (refCode) {
        console.log('[REFERRAL DEBUG] Extracted referral code from search params:', refCode);
        return refCode;
      }
    } catch (error) {
      console.warn('[REFERRAL DEBUG] Error parsing search params with URLSearchParams:', error);
    }

    // Fallback to regex
    const refParam = search.match(/[?&]ref=([^&#]*)/);
    if (refParam && refParam[1]) {
      const refCode = decodeURIComponent(refParam[1]);
      console.log('[REFERRAL DEBUG] Manually extracted referral code from search params:', refCode);
      return refCode;
    }

    return null;
  } catch (error) {
    console.error('[REFERRAL DEBUG] Error extracting referral code from search params:', error);
    return null;
  }
};

/**
 * Check for referral code in URL and store it if found
 * @returns The referral code if found and newly stored, null otherwise
 */
export const checkAndStoreReferralCode = (): string | null => {
  const refCode = extractReferralCodeFromUrl();
  if (refCode) {
    // Only return the code if it was newly stored (not already in localStorage)
    const wasNewlyStored = storeReferralCode(refCode);
    return wasNewlyStored ? refCode : null;
  }
  return null;
};

/**
 * Check if a user has a referral code applied to their account
 * @param user The user object from the authentication context
 * @returns Boolean indicating if the user has a referral code applied
 */
export const hasAppliedReferralCode = (user: any): boolean => {
  if (!user) return false;

  // If the user has a referredBy field, they have a referral code applied
  return !!user.referredBy;
};

/**
 * Format a referral reward amount for display
 * @param amount The reward amount
 * @param tokenType The token type (SOL)
 * @returns Formatted string with amount and token type
 */
export const formatReferralReward = (amount: number, tokenType: string = 'SOL'): string => {
  if (tokenType === 'SOL') {
    // Format SOL with 4 decimal places
    return `${amount.toFixed(4)} SOL`;
  }

  // Default formatting
  return `${amount.toFixed(2)} ${tokenType}`;
};
