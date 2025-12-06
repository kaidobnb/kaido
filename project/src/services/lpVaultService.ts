import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

export interface VaultBalances {
  boostVault: string;
  creatorVault: string;
  total: string;
}

export interface UserLPInfo {
  balance: string;
  claimableRewards: string;
  totalYield: string;
  claimed: string;
}

export interface YieldBreakdown {
  boostYield: string;
  creatorYield: string;
  engagementYield: string;
  totalYield: string;
}

export interface PredictionLPInfo {
  isDeployed: boolean;
  totalDeployed: string;
  vaultType: number; // 0 = BOOST, 1 = CREATOR_ENGAGEMENT
}

export interface VaultStats {
  balances: VaultBalances;
  yieldBreakdown: YieldBreakdown;
  totalStakers: number;
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
 * Get total LP staked in the vault
 */
export async function getTotalStaked(): Promise<string> {
  try {
    const response = await axios.get(`${API_BASE_URL}/lp-vault/total-staked`);
    return response.data.data.totalStaked;
  } catch (error) {
    console.error('Error fetching total staked:', error);
    throw error;
  }
}

/**
 * Get vault balances (Boost 70% + Creator 30%)
 */
export async function getVaultBalances(): Promise<VaultBalances> {
  try {
    const response = await axios.get(`${API_BASE_URL}/lp-vault/balances`);
    return response.data.data;
  } catch (error) {
    console.error('Error fetching vault balances:', error);
    throw error;
  }
}

/**
 * Get user LP balance and claimable rewards
 */
export async function getUserLPInfo(address: string): Promise<UserLPInfo> {
  try {
    const response = await axios.get(`${API_BASE_URL}/lp-vault/user/${address}`);
    return response.data.data;
  } catch (error) {
    console.error('Error fetching user LP info:', error);
    throw error;
  }
}

/**
 * Get yield breakdown by source
 */
export async function getYieldBreakdown(): Promise<YieldBreakdown> {
  try {
    const response = await axios.get(`${API_BASE_URL}/lp-vault/yield-breakdown`);
    return response.data.data;
  } catch (error) {
    console.error('Error fetching yield breakdown:', error);
    throw error;
  }
}

/**
 * Get LP deployment info for a prediction
 */
export async function getPredictionLPInfo(predictionId: number): Promise<PredictionLPInfo> {
  try {
    const response = await axios.get(`${API_BASE_URL}/lp-vault/prediction/${predictionId}`);
    return response.data.data;
  } catch (error) {
    console.error('Error fetching prediction LP info:', error);
    throw error;
  }
}

/**
 * Get complete LP vault stats
 */
export async function getVaultStats(): Promise<VaultStats> {
  try {
    const response = await axios.get(`${API_BASE_URL}/lp-vault/stats`);
    return response.data.data;
  } catch (error) {
    console.error('Error fetching vault stats:', error);
    throw error;
  }
}

/**
 * Format vault type to human-readable string
 */
export function formatVaultType(vaultType: number): string {
  return vaultType === 0 ? 'Boost Vault' : 'Creator/Engagement Vault';
}

/**
 * Get vault type color for UI
 */
export function getVaultTypeColor(vaultType: number): string {
  return vaultType === 0 ? 'blue' : 'orange';
}

/**
 * Get user activity events
 */
export async function getUserActivity(address: string, limit: number = 50): Promise<ActivityEvent[]> {
  try {
    const response = await axios.get(`${API_BASE_URL}/lp-vault/activity/${address}`, {
      params: { limit },
    });
    return response.data.data;
  } catch (error) {
    console.error('Error fetching user activity:', error);
    return []; // Return empty array on error
  }
}

