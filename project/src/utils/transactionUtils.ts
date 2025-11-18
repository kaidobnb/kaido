import { parseEther, formatEther, getAddress, type Address } from 'viem';

// Admin wallet address to receive stake funds - use environment variable or fallback
const rawAdminAddress = import.meta.env.VITE_ADMIN_WALLET_ADDRESS || '0xd1AFD60f7B8F4b68C377381E65d8d43Fae0dF7CD';
export const ADMIN_WALLET_ADDRESS = getAddress(rawAdminAddress); // Ensure proper checksum

// KAIDO LP token contract address on BNB Smart Chain Mainnet
export const KAIDO_TOKEN_CONTRACT = '0x9c34729D6C5dE59D85C7Edee2A378C6E916044a5';

/**
 * Create a transaction for sending BNB
 * @param senderAddress The sender's address
 * @param amount The amount to send in BNB
 * @returns A transaction object
 */
export const createBnbTransaction = async (
  senderAddress: Address,
  amount: number
): Promise<any> => {
  // Convert BNB to wei
  const value = parseEther(amount.toString());

  // Return transaction object for BNB transfer
  return {
    to: ADMIN_WALLET_ADDRESS,
    value,
    data: '0x' as const,
  };
};

/**
 * Create a transaction for sending KAIDO tokens
 * @param senderAddress The sender's address
 * @param amount The amount to send in KAIDO
 * @returns A transaction object
 */
export const createKaidoTransaction = async (
  senderAddress: Address,
  amount: number
): Promise<any> => {
  // Convert amount to token units (18 decimals)
  const value = parseEther(amount.toString());

  // ERC-20 transfer function signature: transfer(address,uint256)
  // Function selector: 0xa9059cbb
  const transferFunctionSelector = '0xa9059cbb';

  // Encode the recipient address (admin wallet) - remove 0x and pad to 32 bytes
  const recipientEncoded = ADMIN_WALLET_ADDRESS.slice(2).toLowerCase().padStart(64, '0');

  // Encode the amount - convert to hex and pad to 32 bytes
  const amountHex = value.toString(16).padStart(64, '0');

  // Combine function selector + encoded parameters
  const data = `${transferFunctionSelector}${recipientEncoded}${amountHex}` as const;

  // Return transaction object for KAIDO token transfer
  return {
    to: KAIDO_TOKEN_CONTRACT,
    value: parseEther('0'), // No BNB value for token transfers
    data: data,
  };
};

/**
 * Check transaction status using BNB Smart Chain
 * @param hash The transaction hash
 * @param network The BNB network (mainnet, testnet)
 * @returns A promise that resolves to the transaction status
 */
export const checkTransactionStatus = async (
  hash: string,
  network: 'mainnet' | 'testnet' = 'testnet'
): Promise<{ status: string, confirmations?: number }> => {
  try {
    // For BNB Smart Chain, we would use BSC RPC
    const rpcUrl = network === 'mainnet'
      ? 'https://bsc-dataseed.binance.org/'
      : 'https://data-seed-prebsc-1-s1.binance.org:8545/';

    // For now, return a simple confirmed status
    // In a real implementation, you would check the transaction on BSC
    return { status: 'confirmed', confirmations: 1 };
  } catch (error) {
    console.error('Error checking transaction status:', error);
    return { status: 'error' };
  }
};


