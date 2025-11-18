import { createWalletClient, createPublicClient, http, parseEther, formatEther, getContract } from 'viem';
import { bsc, bscTestnet } from 'viem/chains';
import { privateKeyToAccount } from 'viem/accounts';

// Environment variables
const BNB_RPC_URL = process.env.BNB_RPC_URL || 'https://bsc-dataseed1.binance.org/';
const BNB_NETWORK = process.env.BNB_NETWORK || 'mainnet';
const ADMIN_PRIVATE_KEY = process.env.ADMIN_PRIVATE_KEY;
const CLAIM_WALLET_PRIVATE_KEY = process.env.CLAIM_WALLET_PRIVATE_KEY || ADMIN_PRIVATE_KEY;
const KAIDO_TOKEN_ADDRESS = process.env.KAIDO_TOKEN_ADDRESS as `0x${string}`;

// Select the correct chain based on environment
const bnbChain = BNB_NETWORK === 'testnet' ? bscTestnet : bsc;

// ERC20 ABI for KAIDO token interactions
const ERC20_ABI = [
  {
    inputs: [{ name: 'account', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    name: 'transfer',
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'decimals',
    outputs: [{ name: '', type: 'uint8' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const;

// Create public client for reading blockchain data
const publicClient = createPublicClient({
  chain: bnbChain,
  transport: http(BNB_RPC_URL),
});

// Create admin wallet client
const getAdminWalletClient = () => {
  if (!ADMIN_PRIVATE_KEY) {
    throw new Error('ADMIN_PRIVATE_KEY not configured');
  }

  const account = privateKeyToAccount(ADMIN_PRIVATE_KEY as `0x${string}`);
  return createWalletClient({
    account,
    chain: bnbChain,
    transport: http(BNB_RPC_URL),
  });
};

// Create claim wallet client
const getClaimWalletClient = () => {
  if (!CLAIM_WALLET_PRIVATE_KEY) {
    throw new Error('CLAIM_WALLET_PRIVATE_KEY not configured');
  }

  // Ensure private key has 0x prefix
  const privateKey = CLAIM_WALLET_PRIVATE_KEY.startsWith('0x')
    ? CLAIM_WALLET_PRIVATE_KEY
    : `0x${CLAIM_WALLET_PRIVATE_KEY}`;

  const account = privateKeyToAccount(privateKey as `0x${string}`);
  return createWalletClient({
    account,
    chain: bnbChain,
    transport: http(BNB_RPC_URL),
  });
};

/**
 * Get BNB balance for a wallet address
 * @param address Wallet address to check
 * @returns Balance in BNB
 */
export const getBNBBalance = async (address: string): Promise<number> => {
  try {
    const balance = await publicClient.getBalance({ 
      address: address as `0x${string}` 
    });
    return parseFloat(formatEther(balance));
  } catch (error) {
    console.error('Error getting BNB balance:', error);
    throw error;
  }
};

/**
 * Get KAIDO token balance for a wallet address
 * @param address Wallet address to check
 * @returns Balance in KAIDO tokens
 */
export const getKAIDOBalance = async (address: string): Promise<number> => {
  try {
    if (!KAIDO_TOKEN_ADDRESS) {
      throw new Error('KAIDO_TOKEN_ADDRESS not configured');
    }

    const contract = getContract({
      address: KAIDO_TOKEN_ADDRESS,
      abi: ERC20_ABI,
      client: publicClient,
    });

    const [balance, decimals] = await Promise.all([
      contract.read.balanceOf([address as `0x${string}`]),
      contract.read.decimals(),
    ]);

    // Convert from token units to human readable format
    const divisor = BigInt(10 ** decimals);
    return parseFloat((balance / divisor).toString());
  } catch (error) {
    console.error('Error getting KAIDO balance:', error);
    throw error;
  }
};

/**
 * Check if the admin wallet has sufficient BNB balance
 * @param amount Amount to check (in BNB)
 * @returns Boolean indicating if the wallet has sufficient balance
 */
export const hasAdminWalletSufficientBNBBalance = async (amount: number): Promise<boolean> => {
  try {
    const adminClient = getAdminWalletClient();
    const balance = await getBNBBalance(adminClient.account.address);
    
    // Ensure we have enough balance plus a buffer for transaction fees (0.001 BNB)
    return balance >= (amount + 0.001);
  } catch (error) {
    console.error('Error checking admin wallet BNB balance:', error);
    return false;
  }
};

/**
 * Check if the claim wallet has sufficient balance for a token
 * @param amount Amount to check
 * @param tokenType Token type (BNB or KAIDO)
 * @returns Boolean indicating if the wallet has sufficient balance
 */
export const hasClaimWalletSufficientBalance = async (
  amount: number, 
  tokenType: 'BNB' | 'KAIDO'
): Promise<boolean> => {
  try {
    const claimClient = getClaimWalletClient();
    
    if (tokenType === 'BNB') {
      const balance = await getBNBBalance(claimClient.account.address);
      return balance >= (amount + 0.001); // Add buffer for gas fees
    } else if (tokenType === 'KAIDO') {
      const balance = await getKAIDOBalance(claimClient.account.address);
      return balance >= amount;
    }
    
    return false;
  } catch (error) {
    console.error('Error checking claim wallet balance:', error);
    return false;
  }
};

/**
 * Send BNB from admin wallet to a recipient
 * @param recipientAddress Recipient wallet address
 * @param amount Amount to send in BNB
 * @returns Transaction hash if successful
 */
export const sendBNBFromAdminWallet = async (
  recipientAddress: string,
  amount: number
): Promise<string> => {
  try {
    console.log(`Sending ${amount} BNB from admin wallet to ${recipientAddress}`);
    
    const adminClient = getAdminWalletClient();
    
    const hash = await adminClient.sendTransaction({
      to: recipientAddress as `0x${string}`,
      value: parseEther(amount.toString()),
    });

    console.log(`BNB transaction successful: ${amount} BNB sent to ${recipientAddress}`);
    console.log(`Transaction hash: ${hash}`);

    return hash;
  } catch (error) {
    console.error('Error sending BNB from admin wallet:', error);
    throw error;
  }
};

/**
 * Send BNB from claim wallet to a recipient
 * @param recipientAddress Recipient wallet address
 * @param amount Amount to send in BNB
 * @returns Transaction hash if successful
 */
export const sendBNBFromClaimWallet = async (
  recipientAddress: string,
  amount: number
): Promise<string> => {
  try {
    console.log(`Sending ${amount} BNB from claim wallet to ${recipientAddress}`);

    const claimClient = getClaimWalletClient();

    const hash = await claimClient.sendTransaction({
      to: recipientAddress as `0x${string}`,
      value: parseEther(amount.toString()),
    });

    console.log(`BNB transaction sent: ${amount} BNB to ${recipientAddress}`);
    console.log(`Transaction hash: ${hash}`);
    console.log(`Waiting for transaction confirmation...`);

    // Wait for transaction to be mined (confirmed)
    const receipt = await publicClient.waitForTransactionReceipt({ hash });

    if (receipt.status === 'success') {
      console.log(`✅ Transaction confirmed in block ${receipt.blockNumber}`);
    } else {
      throw new Error(`Transaction failed with status: ${receipt.status}`);
    }

    return hash;
  } catch (error) {
    console.error('Error sending BNB from claim wallet:', error);
    throw error;
  }
};

/**
 * Send KAIDO tokens from claim wallet to a recipient
 * @param recipientAddress Recipient wallet address
 * @param amount Amount to send in KAIDO
 * @returns Transaction hash if successful
 */
export const sendKAIDOFromClaimWallet = async (
  recipientAddress: string,
  amount: number
): Promise<string> => {
  try {
    if (!KAIDO_TOKEN_ADDRESS) {
      throw new Error('KAIDO_TOKEN_ADDRESS not configured');
    }

    console.log(`Sending ${amount} KAIDO from claim wallet to ${recipientAddress}`);
    
    const claimClient = getClaimWalletClient();
    
    // Get token decimals
    const contract = getContract({
      address: KAIDO_TOKEN_ADDRESS,
      abi: ERC20_ABI,
      client: publicClient,
    });
    
    const decimals = await contract.read.decimals();
    const tokenAmount = BigInt(Math.floor(amount * (10 ** decimals)));

    const hash = await claimClient.writeContract({
      address: KAIDO_TOKEN_ADDRESS,
      abi: ERC20_ABI,
      functionName: 'transfer',
      args: [recipientAddress as `0x${string}`, tokenAmount],
    });

    console.log(`KAIDO transaction successful: ${amount} KAIDO sent to ${recipientAddress}`);
    console.log(`Transaction hash: ${hash}`);

    return hash;
  } catch (error) {
    console.error('Error sending KAIDO from claim wallet:', error);
    throw error;
  }
};

/**
 * Send tokens from the claim wallet to a recipient
 * @param recipientAddress Recipient wallet address
 * @param amount Amount to send
 * @param tokenType Token type (BNB or KAIDO)
 * @returns Transaction hash if successful
 */
export const sendTokensFromClaimWallet = async (
  recipientAddress: string,
  amount: number,
  tokenType: 'BNB' | 'KAIDO'
): Promise<string> => {
  if (tokenType === 'BNB') {
    return sendBNBFromClaimWallet(recipientAddress, amount);
  } else if (tokenType === 'KAIDO') {
    return sendKAIDOFromClaimWallet(recipientAddress, amount);
  } else {
    throw new Error(`Unsupported token type: ${tokenType}`);
  }
};

/**
 * Send partner fees from admin wallet
 * @param partnerWalletAddress Partner wallet address
 * @param amount Amount to send in BNB
 * @param predictionId ID of the prediction (for logging)
 * @returns Transaction hash if successful
 */
export const sendPartnerFee = async (
  partnerWalletAddress: string,
  amount: number,
  predictionId: string
): Promise<string> => {
  try {
    console.log(`Sending partner fee of ${amount} BNB to ${partnerWalletAddress} for prediction ${predictionId}`);

    // Send BNB from admin wallet to partner wallet
    const hash = await sendBNBFromAdminWallet(partnerWalletAddress, amount);

    console.log(`Partner fee sent successfully: ${hash}`);
    return hash;
  } catch (error) {
    console.error('Error sending partner fee:', error);
    throw error;
  }
};
