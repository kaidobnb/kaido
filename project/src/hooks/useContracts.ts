import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseEther, formatEther, type Address } from 'viem';
import { useState, useCallback } from 'react';
import { CONTRACTS, PredictionFactoryABI, LossEdgeVaultABI } from '../config/contracts';

/**
 * Hook for creating predictions on-chain
 */
export function useCreatePrediction() {
  const { address } = useAccount();
  const { writeContractAsync } = useWriteContract();
  const [isCreating, setIsCreating] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);

  const createPrediction = useCallback(
    async (params: {
      title: string;
      description: string;
      predictionType: number; // 0 = BINARY, 1 = MULTIPLE
      category: number; // 0 = CRYPTO, 1 = SPORTS
      asset: string;
      targetPrice: number;
      endDate: number; // Unix timestamp
      choices: string[];
      creatorStake: number; // Amount in BNB
    }) => {
      if (!address) {
        throw new Error('Wallet not connected');
      }

      setIsCreating(true);
      try {
        // Convert target price to 8 decimals (for crypto prices)
        const targetPriceWei = BigInt(Math.floor(params.targetPrice * 100000000));

        // Call smart contract
        const hash = await writeContractAsync({
          address: CONTRACTS.PREDICTION_FACTORY,
          abi: PredictionFactoryABI,
          functionName: 'createPrediction',
          args: [
            params.title,
            params.description,
            params.predictionType,
            params.category,
            params.asset,
            targetPriceWei,
            BigInt(params.endDate),
            params.choices,
          ],
          value: parseEther(params.creatorStake.toString()),
        });

        setTxHash(hash);
        return hash;
      } catch (error) {
        console.error('Error creating prediction:', error);
        throw error;
      } finally {
        setIsCreating(false);
      }
    },
    [address, writeContractAsync]
  );

  return {
    createPrediction,
    isCreating,
    txHash,
  };
}

/**
 * Hook for participating in predictions
 */
export function useParticipatePrediction() {
  const { address } = useAccount();
  const { writeContractAsync } = useWriteContract();
  const [isParticipating, setIsParticipating] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);

  const participate = useCallback(
    async (predictionId: number, choice: string, amount: number) => {
      if (!address) {
        throw new Error('Wallet not connected');
      }

      setIsParticipating(true);
      try {
        const hash = await writeContractAsync({
          address: CONTRACTS.PREDICTION_FACTORY,
          abi: PredictionFactoryABI,
          functionName: 'participate',
          args: [BigInt(predictionId), choice],
          value: parseEther(amount.toString()),
        });

        setTxHash(hash);
        return hash;
      } catch (error) {
        console.error('Error participating in prediction:', error);
        throw error;
      } finally {
        setIsParticipating(false);
      }
    },
    [address, writeContractAsync]
  );

  return {
    participate,
    isParticipating,
    txHash,
  };
}

/**
 * Hook for exiting predictions before lock
 */
export function useExitPrediction() {
  const { address } = useAccount();
  const { writeContractAsync } = useWriteContract();
  const [isExiting, setIsExiting] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);

  const exitPrediction = useCallback(
    async (predictionId: number) => {
      if (!address) {
        throw new Error('Wallet not connected');
      }

      setIsExiting(true);
      try {
        const hash = await writeContractAsync({
          address: CONTRACTS.PREDICTION_FACTORY,
          abi: PredictionFactoryABI,
          functionName: 'exitPrediction',
          args: [BigInt(predictionId)],
        });

        setTxHash(hash);
        return hash;
      } catch (error) {
        console.error('Error exiting prediction:', error);
        throw error;
      } finally {
        setIsExiting(false);
      }
    },
    [address, writeContractAsync]
  );

  return {
    exitPrediction,
    isExiting,
    txHash,
  };
}

/**
 * Hook for claiming winnings
 */
export function useClaimWinnings() {
  const { address } = useAccount();
  const { writeContractAsync } = useWriteContract();
  const [isClaiming, setIsClaiming] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);

  const claimWinnings = useCallback(
    async (predictionId: number) => {
      if (!address) {
        throw new Error('Wallet not connected');
      }

      setIsClaiming(true);
      try {
        const hash = await writeContractAsync({
          address: CONTRACTS.PREDICTION_FACTORY,
          abi: PredictionFactoryABI,
          functionName: 'claimWinnings',
          args: [BigInt(predictionId)],
        });

        setTxHash(hash);
        return hash;
      } catch (error) {
        console.error('Error claiming winnings:', error);
        throw error;
      } finally {
        setIsClaiming(false);
      }
    },
    [address, writeContractAsync]
  );

  return {
    claimWinnings,
    isClaiming,
    txHash,
  };
}

/**
 * Hook for reading prediction data from contract
 */
export function usePrediction(predictionId: number | null) {
  const { data, isLoading, error, refetch } = useReadContract({
    address: CONTRACTS.PREDICTION_FACTORY,
    abi: PredictionFactoryABI,
    functionName: 'predictions',
    args: predictionId !== null ? [BigInt(predictionId)] : undefined,
    query: {
      enabled: predictionId !== null,
    },
  });

  // Parse prediction data
  const prediction = data
    ? {
        title: (data as any)[0] as string,
        description: (data as any)[1] as string,
        predictionType: (data as any)[2] as number,
        category: (data as any)[3] as number,
        asset: (data as any)[4] as string,
        targetPrice: Number((data as any)[5]) / 100000000,
        createdAt: Number((data as any)[6]),
        endDate: Number((data as any)[7]),
        lockTime: Number((data as any)[8]),
        totalPool: formatEther((data as any)[9]),
        status: (data as any)[10] as number, // 0=ACTIVE, 1=LOCKED, 2=RESOLVED, 3=CANCELLED
        resolvedChoice: (data as any)[11] as string,
        resolvedAt: Number((data as any)[12]),
      }
    : null;

  return {
    prediction,
    isLoading,
    error,
    refetch,
  };
}

/**
 * Hook for getting active prediction IDs
 */
export function useActivePredictions() {
  const { data, isLoading, error, refetch } = useReadContract({
    address: CONTRACTS.PREDICTION_FACTORY,
    abi: PredictionFactoryABI,
    functionName: 'getActivePredictions',
  });

  const predictionIds = data ? (data as bigint[]).map((id) => Number(id)) : [];

  return {
    predictionIds,
    isLoading,
    error,
    refetch,
  };
}

/**
 * Hook for claiming Loss-Edge compensation
 */
export function useClaimLossEdge() {
  const { address } = useAccount();
  const { writeContractAsync } = useWriteContract();
  const [isClaiming, setIsClaiming] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);

  const claimLossEdge = useCallback(
    async (predictionId: number) => {
      if (!address) {
        throw new Error('Wallet not connected');
      }

      setIsClaiming(true);
      try {
        const hash = await writeContractAsync({
          address: CONTRACTS.PREDICTION_FACTORY,
          abi: PredictionFactoryABI,
          functionName: 'claimLossEdge',
          args: [BigInt(predictionId)],
        });

        setTxHash(hash);
        return hash;
      } catch (error) {
        console.error('Error claiming Loss-Edge compensation:', error);
        throw error;
      } finally {
        setIsClaiming(false);
      }
    },
    [address, writeContractAsync]
  );

  return {
    claimLossEdge,
    isClaiming,
    txHash,
  };
}

/**
 * Hook for getting Loss-Edge compensation amount
 */
export function useLossEdgeCompensation(predictionId: number | null, userLoss: number) {
  const { data, isLoading, error, refetch } = useReadContract({
    address: CONTRACTS.LOSS_EDGE_VAULT,
    abi: LossEdgeVaultABI,
    functionName: 'calculateCompensation',
    args: predictionId !== null ? [BigInt(predictionId), parseEther(userLoss.toString())] : undefined,
    query: {
      enabled: predictionId !== null && userLoss > 0,
    },
  });

  const compensation = data ? Number(formatEther(data as bigint)) : 0;

  return {
    compensation,
    isLoading,
    error,
    refetch,
  };
}

/**
 * Hook for waiting for transaction confirmation
 */
export function useTransactionStatus(hash: string | null) {
  const { data, isLoading, isSuccess, isError } = useWaitForTransactionReceipt({
    hash: hash as `0x${string}` | undefined,
    query: {
      enabled: !!hash,
    },
  });

  return {
    receipt: data,
    isConfirming: isLoading,
    isConfirmed: isSuccess,
    isError,
  };
}

