/**
 * Utility to add Kaido LP Token to MetaMask with logo
 */

export const KAIDO_LP_TOKEN = {
  address: '0x9c34729D6C5dE59D85C7Edee2A378C6E916044a5',
  symbol: 'KAIDO',
  decimals: 18,
  name: 'Kaido LP',
  image: 'https://kaidobnb.xyz/kaido.png',
  metadata: 'https://kaidobnb.xyz/kaido-lp-metadata.json'
};

/**
 * Add Kaido LP Token to MetaMask wallet
 */
export const addKaidoLPToWallet = async () => {
  try {
    // Check if MetaMask is available
    if (typeof window.ethereum === 'undefined') {
      throw new Error('MetaMask is not installed');
    }

    // Request to add the token
    const wasAdded = await window.ethereum.request({
      method: 'wallet_watchAsset',
      params: {
        type: 'ERC20',
        options: {
          address: KAIDO_LP_TOKEN.address,
          symbol: KAIDO_LP_TOKEN.symbol,
          decimals: KAIDO_LP_TOKEN.decimals,
          image: KAIDO_LP_TOKEN.image,
        },
      },
    });

    if (wasAdded) {
      console.log('Kaido LP token added to wallet successfully!');
      return true;
    } else {
      console.log('User rejected adding Kaido LP token');
      return false;
    }
  } catch (error) {
    console.error('Error adding Kaido LP token to wallet:', error);
    throw error;
  }
};

/**
 * Check if user is on the correct network (BSC Mainnet)
 */
export const checkBSCNetwork = async () => {
  try {
    if (typeof window.ethereum === 'undefined') {
      throw new Error('MetaMask is not installed');
    }

    const chainId = await window.ethereum.request({ method: 'eth_chainId' });
    const bscChainId = '0x38'; // BSC Mainnet chain ID in hex

    if (chainId !== bscChainId) {
      // Request to switch to BSC Mainnet
      try {
        await window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: bscChainId }],
        });
        return true;
      } catch (switchError: any) {
        // If the chain hasn't been added to MetaMask, add it
        if (switchError.code === 4902) {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [
              {
                chainId: bscChainId,
                chainName: 'BNB Smart Chain Mainnet',
                nativeCurrency: {
                  name: 'BNB',
                  symbol: 'BNB',
                  decimals: 18,
                },
                rpcUrls: ['https://bsc-dataseed.binance.org/'],
                blockExplorerUrls: ['https://bscscan.com/'],
              },
            ],
          });
          return true;
        }
        throw switchError;
      }
    }
    return true;
  } catch (error) {
    console.error('Error checking/switching to BSC network:', error);
    throw error;
  }
};

/**
 * Complete setup: Switch to BSC and add Kaido LP token
 */
export const setupKaidoLPToken = async () => {
  try {
    // First ensure we're on BSC network
    await checkBSCNetwork();

    // Then add the token
    const success = await addKaidoLPToWallet();

    if (success) {
      alert('Kaido LP token has been added to your wallet successfully!');
    }

    return success;
  } catch (error) {
    console.error('Error setting up Kaido LP token:', error);
    alert(`Error setting up Kaido LP token: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return false;
  }
};

/**
 * Add Kaido LP Token to MetaMask
 */
export const addKaidoLPTokenToMetaMask = async (): Promise<boolean> => {
  try {
    // Check if MetaMask is available
    if (!window.ethereum) {
      throw new Error('MetaMask is not installed');
    }

    // Request to add the token
    const wasAdded = await window.ethereum.request({
      method: 'wallet_watchAsset',
      params: {
        type: 'ERC20',
        options: {
          address: KAIDO_LP_TOKEN.address,
          symbol: KAIDO_LP_TOKEN.symbol,
          decimals: KAIDO_LP_TOKEN.decimals,
          image: KAIDO_LP_TOKEN.image,
        },
      },
    });

    if (wasAdded) {
      console.log('✅ Kaido LP Token added to MetaMask successfully!');
      return true;
    } else {
      console.log('❌ User rejected adding Kaido LP Token to MetaMask');
      return false;
    }
  } catch (error) {
    console.error('❌ Error adding Kaido LP Token to MetaMask:', error);
    return false;
  }
};




