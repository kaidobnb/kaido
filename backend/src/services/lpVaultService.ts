import { createPublicClient, createWalletClient, http, parseEther, formatEther, type Abi } from 'viem';
import { bscTestnet, bsc } from 'viem/chains';
import { privateKeyToAccount } from 'viem/accounts';
import * as dotenv from 'dotenv';
import LPVaultABIJson from '../contracts/abis/LPVault.json';

const LPVaultABI = LPVaultABIJson.abi as Abi;

// Load environment variables
dotenv.config();

const ORACLE_PRIVATE_KEY = process.env.ORACLE_PRIVATE_KEY || '';
const LP_VAULT_ADDRESS = process.env.LP_VAULT_ADDRESS as `0x${string}`;
const BSC_TESTNET_RPC = process.env.BSC_TESTNET_RPC || 'https://data-seed-prebsc-1-s1.binance.org:8545/';
const BSC_MAINNET_RPC = process.env.BSC_MAINNET_RPC || 'https://bsc-dataseed.binance.org/';
const IS_TESTNET = process.env.NODE_ENV !== 'production';

// Select chain and RPC based on environment
const chain = IS_TESTNET ? bscTestnet : bsc;
const rpcUrl = IS_TESTNET ? BSC_TESTNET_RPC : BSC_MAINNET_RPC;

// Create oracle account from private key
let oracleAccount: ReturnType<typeof privateKeyToAccount> | null = null;

if (ORACLE_PRIVATE_KEY) {
  const formattedKey = ORACLE_PRIVATE_KEY.startsWith('0x')
    ? ORACLE_PRIVATE_KEY as `0x${string}`
    : `0x${ORACLE_PRIVATE_KEY}` as `0x${string}`;

  oracleAccount = privateKeyToAccount(formattedKey);
}

// Create public client for reading blockchain data
export const publicClient = createPublicClient({
  chain,
  transport: http(rpcUrl),
});

// Create wallet client for writing transactions
export const walletClient = oracleAccount ? createWalletClient({
  account: oracleAccount,
  chain,
  transport: http(rpcUrl),
}) : null;

console.log('🏦 LP Vault Service Initialized');
console.log(`   Network: ${IS_TESTNET ? 'BSC Testnet' : 'BSC Mainnet'}`);
console.log(`   LP Vault: ${LP_VAULT_ADDRESS}`);

/**
 * Get total LP staked in the vault
 */
export async function getTotalLPStaked(): Promise<string> {
  try {
    const total = await publicClient.readContract({
      address: LP_VAULT_ADDRESS,
      abi: LPVaultABI,
      functionName: 'totalLPStaked',
    }) as bigint;

    return formatEther(total);
  } catch (error) {
    console.error('Error getting total LP staked:', error);
    throw error;
  }
}

/**
 * Get vault balances (Boost 70% + Creator 30%)
 */
export async function getVaultBalances(): Promise<{
  boostVault: string;
  creatorVault: string;
  total: string;
}> {
  try {
    const [boostVault, creatorVault, total] = await Promise.all([
      publicClient.readContract({
        address: LP_VAULT_ADDRESS,
        abi: LPVaultABI,
        functionName: 'boostVaultBalance',
      }) as Promise<bigint>,
      publicClient.readContract({
        address: LP_VAULT_ADDRESS,
        abi: LPVaultABI,
        functionName: 'creatorEngagementVaultBalance',
      }) as Promise<bigint>,
      publicClient.readContract({
        address: LP_VAULT_ADDRESS,
        abi: LPVaultABI,
        functionName: 'totalLPStaked',
      }) as Promise<bigint>,
    ]);

    return {
      boostVault: formatEther(boostVault),
      creatorVault: formatEther(creatorVault),
      total: formatEther(total),
    };
  } catch (error) {
    console.error('Error getting vault balances:', error);
    throw error;
  }
}

/**
 * Get user LP balance and claimable rewards
 */
export async function getUserLPInfo(userAddress: string): Promise<{
  balance: string;
  claimableRewards: string;
  totalYield: string;
  claimed: string;
}> {
  try {
    const address = userAddress as `0x${string}`;
    
    const [balance, claimed, totalYield, totalStaked] = await Promise.all([
      publicClient.readContract({
        address: LP_VAULT_ADDRESS,
        abi: LPVaultABI,
        functionName: 'userLPBalance',
        args: [address],
      }) as Promise<bigint>,
      publicClient.readContract({
        address: LP_VAULT_ADDRESS,
        abi: LPVaultABI,
        functionName: 'lpClaimed',
        args: [address],
      }) as Promise<bigint>,
      publicClient.readContract({
        address: LP_VAULT_ADDRESS,
        abi: LPVaultABI,
        functionName: 'totalLPYield',
      }) as Promise<bigint>,
      publicClient.readContract({
        address: LP_VAULT_ADDRESS,
        abi: LPVaultABI,
        functionName: 'totalLPStaked',
      }) as Promise<bigint>,
    ]);

    // Calculate claimable: (userBalance / totalStaked) * totalYield - claimed
    let claimable = BigInt(0);
    if (totalStaked > BigInt(0) && balance > BigInt(0)) {
      const userShare = (balance * BigInt(1e18)) / totalStaked;
      const totalClaimable = (totalYield * userShare) / BigInt(1e18);
      claimable = totalClaimable > claimed ? totalClaimable - claimed : BigInt(0);
    }

    return {
      balance: formatEther(balance),
      claimableRewards: formatEther(claimable),
      totalYield: formatEther(totalYield),
      claimed: formatEther(claimed),
    };
  } catch (error) {
    console.error('Error getting user LP info:', error);
    throw error;
  }
}

/**
 * Get yield breakdown by source
 */
export async function getYieldBreakdown(): Promise<{
  boostYield: string;
  creatorYield: string;
  engagementYield: string;
  totalYield: string;
}> {
  try {
    const [boostYield, creatorYield, engagementYield, totalYield] = await Promise.all([
      publicClient.readContract({
        address: LP_VAULT_ADDRESS,
        abi: LPVaultABI,
        functionName: 'lpBoostYield',
      }) as Promise<bigint>,
      publicClient.readContract({
        address: LP_VAULT_ADDRESS,
        abi: LPVaultABI,
        functionName: 'lpCreatorYield',
      }) as Promise<bigint>,
      publicClient.readContract({
        address: LP_VAULT_ADDRESS,
        abi: LPVaultABI,
        functionName: 'lpEngagementYield',
      }) as Promise<bigint>,
      publicClient.readContract({
        address: LP_VAULT_ADDRESS,
        abi: LPVaultABI,
        functionName: 'totalLPYield',
      }) as Promise<bigint>,
    ]);

    return {
      boostYield: formatEther(boostYield),
      creatorYield: formatEther(creatorYield),
      engagementYield: formatEther(engagementYield),
      totalYield: formatEther(totalYield),
    };
  } catch (error) {
    console.error('Error getting yield breakdown:', error);
    throw error;
  }
}

/**
 * Get LP deployment info for a prediction
 */
export async function getLPDeploymentInfo(predictionId: number): Promise<{
  isDeployed: boolean;
  totalDeployed: string;
  vaultType: number;
}> {
  try {
    const [totalDeployed, vaultType] = await Promise.all([
      publicClient.readContract({
        address: LP_VAULT_ADDRESS,
        abi: LPVaultABI,
        functionName: 'predictionLPDeployed',
        args: [BigInt(predictionId)],
      }) as Promise<bigint>,
      publicClient.readContract({
        address: LP_VAULT_ADDRESS,
        abi: LPVaultABI,
        functionName: 'predictionVaultType',
        args: [BigInt(predictionId)],
      }) as Promise<number>,
    ]);

    return {
      isDeployed: totalDeployed > BigInt(0),
      totalDeployed: formatEther(totalDeployed),
      vaultType, // 0 = BOOST, 1 = CREATOR_ENGAGEMENT
    };
  } catch (error) {
    console.error('Error getting LP deployment info:', error);
    throw error;
  }
}

export interface ActivityEvent {
  id: string;
  type: 'stake' | 'unstake' | 'claim' | 'reward';
  amount: string;
  timestamp: number;
  txHash: string;
  blockNumber: number;
}

/**
 * Get total number of unique stakers
 * Note: For now, we return 1 if there's any TVL, 0 otherwise
 * TODO: Implement proper staker counting when we have a better RPC or indexer
 */
export async function getTotalStakers(): Promise<number> {
  try {
    const totalStaked = await publicClient.readContract({
      address: LP_VAULT_ADDRESS,
      abi: LPVaultABI,
      functionName: 'totalLPStaked',
    }) as bigint;

    // Simple heuristic: if there's any TVL, assume at least 1 staker
    // This is a temporary solution until we have proper event indexing
    return totalStaked > BigInt(0) ? 1 : 0;
  } catch (error) {
    console.error('Error getting total stakers:', error);
    return 0;
  }
}

/**
 * Get user activity events from the LP Vault
 */
export async function getUserActivity(userAddress: string, limit: number = 50): Promise<ActivityEvent[]> {
  try {
    const address = userAddress as `0x${string}`;
    const currentBlock = await publicClient.getBlockNumber();
    const fromBlock = currentBlock - BigInt(50); // Last 50 blocks (~2.5 minutes on BSC) to avoid rate limits

    // Fetch all relevant events
    const [stakeEvents, unstakeEvents, claimEvents] = await Promise.all([
      publicClient.getLogs({
        address: LP_VAULT_ADDRESS,
        event: {
          type: 'event',
          name: 'LPStaked',
          inputs: [
            { type: 'address', indexed: true, name: 'user' },
            { type: 'uint256', indexed: false, name: 'amount' }
          ]
        },
        args: { user: address },
        fromBlock,
        toBlock: currentBlock,
      }),
      publicClient.getLogs({
        address: LP_VAULT_ADDRESS,
        event: {
          type: 'event',
          name: 'LPUnstaked',
          inputs: [
            { type: 'address', indexed: true, name: 'user' },
            { type: 'uint256', indexed: false, name: 'amount' }
          ]
        },
        args: { user: address },
        fromBlock,
        toBlock: currentBlock,
      }),
      publicClient.getLogs({
        address: LP_VAULT_ADDRESS,
        event: {
          type: 'event',
          name: 'LPRewardsClaimed',
          inputs: [
            { type: 'address', indexed: true, name: 'user' },
            { type: 'uint256', indexed: false, name: 'amount' }
          ]
        },
        args: { user: address },
        fromBlock,
        toBlock: currentBlock,
      }),
    ]);

    // Convert events to activity items
    const activities: ActivityEvent[] = [];

    for (const event of stakeEvents) {
      const block = await publicClient.getBlock({ blockNumber: event.blockNumber });
      activities.push({
        id: `${event.transactionHash}-${event.logIndex}`,
        type: 'stake',
        amount: formatEther(event.args.amount as bigint),
        timestamp: Number(block.timestamp),
        txHash: event.transactionHash,
        blockNumber: Number(event.blockNumber),
      });
    }

    for (const event of unstakeEvents) {
      const block = await publicClient.getBlock({ blockNumber: event.blockNumber });
      activities.push({
        id: `${event.transactionHash}-${event.logIndex}`,
        type: 'unstake',
        amount: formatEther(event.args.amount as bigint),
        timestamp: Number(block.timestamp),
        txHash: event.transactionHash,
        blockNumber: Number(event.blockNumber),
      });
    }

    for (const event of claimEvents) {
      const block = await publicClient.getBlock({ blockNumber: event.blockNumber });
      activities.push({
        id: `${event.transactionHash}-${event.logIndex}`,
        type: 'claim',
        amount: formatEther(event.args.amount as bigint),
        timestamp: Number(block.timestamp),
        txHash: event.transactionHash,
        blockNumber: Number(event.blockNumber),
      });
    }

    // Sort by timestamp descending and limit
    return activities
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit);
  } catch (error) {
    console.error('Error getting user activity:', error);
    // Return empty array on error (likely RPC rate limit)
    // This is better than throwing an error for the frontend
    return [];
  }
}

