/**
 * Utility functions to debug Appkit in the browser console
 */

/**
 * Check if Appkit is properly initialized
 */
export const checkAppkit = () => {
  // @ts-ignore
  const appkit = window.appkit;

  if (!appkit) {
    console.error('Appkit is not initialized or not available globally');
    return false;
  }

  console.log('Appkit instance:', appkit);

  // Check if send functionality is enabled
  try {
    // @ts-ignore
    const features = appkit.options?.features || {};
    console.log('Appkit features:', features);

    if (features.send) {
      console.log('✅ Send functionality is enabled');
    } else {
      console.warn('⚠️ Send functionality is not enabled');
    }

    return true;
  } catch (err) {
    console.error('Error checking Appkit features:', err);
    return false;
  }
};

/**
 * Try to open the send view
 */
export const openSendView = () => {
  // @ts-ignore
  const appkit = window.appkit;

  if (!appkit) {
    console.error('Appkit is not initialized or not available globally');
    return;
  }

  try {
    appkit.open({ view: 'Send' });
    console.log('Opened Send view');
  } catch (err) {
    console.error('Error opening Send view:', err);
  }
};

/**
 * Try to open the account view
 */
export const openAccountView = () => {
  // @ts-ignore
  const appkit = window.appkit;

  if (!appkit) {
    console.error('Appkit is not initialized or not available globally');
    return;
  }

  try {
    appkit.open({ view: 'Account' });
    console.log('Opened Account view');
  } catch (err) {
    console.error('Error opening Account view:', err);
  }
};

/**
 * Try to open the send view with a recipient address
 */
export const openSendWithRecipient = (address?: string, amount?: string) => {
  // @ts-ignore
  const appkit = window.appkit;

  if (!appkit) {
    console.error('Appkit is not initialized or not available globally');
    return;
  }

  try {
    appkit.open({
      view: 'Send',
      options: {
        address: address || '', // Recipient address
        amount: amount || '0.0001', // Small amount for testing
        token: 'SOL' // Solana token
      }
    });
    console.log('Opened Send view with recipient');
  } catch (err) {
    console.error('Error opening Send view with recipient:', err);
  }
};

/**
 * Enable send functionality in Appkit
 */
export const enableSendFunctionality = () => {
  // @ts-ignore
  const appkit = window.appkit;

  if (!appkit) {
    console.error('Appkit is not initialized or not available globally');
    return;
  }

  try {
    // Try to patch the appkit instance to enable send functionality
    if (appkit.options) {
      appkit.options.features = {
        ...(appkit.options.features || {}),
        send: true,
        receive: true,
        swaps: true,
        onramp: true,
        history: true
      };
      console.log('Patched Appkit features:', appkit.options.features);
    }
  } catch (err) {
    console.error('Error patching Appkit features:', err);
  }
};

/**
 * Get the current Appkit version
 */
export const getAppkitVersion = () => {
  // @ts-ignore
  const appkit = window.appkit;

  if (!appkit) {
    console.error('Appkit is not initialized or not available globally');
    return 'Unknown';
  }

  try {
    // @ts-ignore
    const version = appkit.version || 'Unknown';
    console.log('Appkit version:', version);
    return version;
  } catch (err) {
    console.error('Error getting Appkit version:', err);
    return 'Error';
  }
};

// Make these functions available globally for debugging in the console
if (typeof window !== 'undefined') {
  // @ts-ignore
  window.appkitDebug = {
    checkAppkit,
    openSendView,
    openAccountView,
    openSendWithRecipient,
    enableSendFunctionality,
    getAppkitVersion
  };
}
