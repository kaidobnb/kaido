import { apiRequest } from './api';

/**
 * Get presale configuration from the backend
 * @returns Presale configuration
 */
export const getPresaleConfig = async () => {
  try {
    const response = await apiRequest('/presale/config', 'GET');
    return response;
  } catch (error) {
    console.error('Error fetching presale config:', error);
    throw error;
  }
};

/**
 * Participate in the presale
 * @param amount Amount of SOL to contribute
 * @param txHash Transaction hash
 * @param phaseIndex Index of the presale phase
 * @returns Response from the backend
 */
export const participateInPresale = async (amount: string, txHash: string, phaseIndex: number) => {
  try {
    const response = await apiRequest('/presale/participate', 'POST', {
      amount,
      txHash,
      phaseIndex
    }, true); // Set requiresAuth to true
    return response;
  } catch (error) {
    console.error('Error participating in presale:', error);
    throw error;
  }
};

/**
 * Get user's presale participation history
 * @returns User's presale history
 */
export const getPresaleHistory = async () => {
  try {
    const response = await apiRequest('/presale/history', 'GET', undefined, true); // Set requiresAuth to true
    return response;
  } catch (error) {
    console.error('Error fetching presale history:', error);
    throw error;
  }
};
