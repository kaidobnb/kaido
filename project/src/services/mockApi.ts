// Mock API service for handling transactions when the backend is not cooperating

import { v4 as uuidv4 } from 'uuid';
import { isValidTransactionSignature, checkTransactionStatus } from '../utils/transactionUtils';

// Store predictions in memory for development purposes
const mockPredictions: any[] = [];

/**
 * Create a prediction without checking balance
 * This is a workaround for when the backend is not respecting the skipBalanceCheck flag
 */
export const mockCreatePrediction = async (predictionData: any): Promise<any> => {
  try {
    console.log('Using mock API to create prediction');

    // Log the transaction data
    console.log('Transaction data:', {
      transactionHash: predictionData.transactionHash,
      walletAddress: predictionData.walletAddress,
      amount: predictionData.stakeAmount,
      tokenType: predictionData.tokenType
    });

    // Validate the transaction signature
    if (predictionData.transactionHash) {
      const isValid = isValidTransactionSignature(predictionData.transactionHash);
      if (!isValid) {
        console.warn('Invalid transaction signature format:', predictionData.transactionHash);
      } else {
        console.log('Valid transaction signature format');

        // Try to check the transaction status
        try {
          const txStatus = await checkTransactionStatus(predictionData.transactionHash);
          console.log('Transaction status:', txStatus);
        } catch (statusError) {
          console.error('Error checking transaction status:', statusError);
        }
      }
    }

    // Create a mock prediction with a unique ID
    const mockPrediction = {
      ...predictionData,
      id: uuidv4(),
      createdAt: new Date().toISOString(),
      status: 'active',
      participants: [],
      comments: [],
      transactionVerified: true // Mark as verified in our mock system
    };

    // Add to in-memory store
    mockPredictions.push(mockPrediction);

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));

    return {
      success: true,
      message: 'Prediction created successfully',
      data: mockPrediction
    };
  } catch (error) {
    console.error('Error in mock create prediction:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};

/**
 * Get all predictions from the mock store
 */
export const mockGetPredictions = async (): Promise<any> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 300));

  return {
    success: true,
    data: mockPredictions
  };
};

/**
 * Get a prediction by ID from the mock store
 */
export const mockGetPredictionById = async (id: string): Promise<any> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 200));

  const prediction = mockPredictions.find(p => p.id === id);

  if (!prediction) {
    return {
      success: false,
      message: 'Prediction not found'
    };
  }

  return {
    success: true,
    data: prediction
  };
};
