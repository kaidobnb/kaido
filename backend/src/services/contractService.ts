import { createWalletClient, createPublicClient, http, parseEther, formatEther, type Abi } from 'viem';
import { bscTestnet, bsc } from 'viem/chains';
import { privateKeyToAccount } from 'viem/accounts';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';
import PredictionFactoryABIJson from '../contracts/abis/PredictionFactory.json';

const PredictionFactoryABI = PredictionFactoryABIJson.abi as Abi;

// Load environment variables
dotenv.config();

const ORACLE_PRIVATE_KEY = process.env.ORACLE_PRIVATE_KEY || '';
const PREDICTION_FACTORY_ADDRESS = process.env.PREDICTION_FACTORY_ADDRESS as `0x${string}`;
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

if (oracleAccount) {
  console.log('🔗 Contract Service Initialized');
  console.log(`   Network: ${IS_TESTNET ? 'BSC Testnet' : 'BSC Mainnet'}`);
  console.log(`   Oracle Address: ${oracleAccount.address}`);
  console.log(`   PredictionFactory: ${PREDICTION_FACTORY_ADDRESS}`);
} else {
  console.warn('⚠️  Oracle account not initialized (missing ORACLE_PRIVATE_KEY)');
}

// Type for prediction data from contract
export type ContractPrediction = readonly [
  string,  // title
  string,  // description
  number,  // predictionType
  number,  // category
  string,  // asset
  bigint,  // targetPrice
  bigint,  // createdAt
  bigint,  // endDate
  bigint,  // lockTime
  bigint,  // totalPool
  number,  // status
  string,  // resolvedChoice
  bigint   // resolvedAt
];

/**
 * Get prediction details from smart contract
 */
export async function getPredictionFromContract(predictionId: number): Promise<ContractPrediction> {
  try {
    const prediction = await publicClient.readContract({
      address: PREDICTION_FACTORY_ADDRESS,
      abi: PredictionFactoryABI,
      functionName: 'predictions',
      args: [BigInt(predictionId)],
    }) as ContractPrediction;

    return prediction;
  } catch (error) {
    console.error(`Error reading prediction ${predictionId} from contract:`, error);
    throw error;
  }
}

/**
 * Get all active prediction IDs from smart contract
 */
export async function getActivePredictionIds(): Promise<number[]> {
  try {
    const predictionIds = await publicClient.readContract({
      address: PREDICTION_FACTORY_ADDRESS,
      abi: PredictionFactoryABI,
      functionName: 'getActivePredictions',
    }) as bigint[];

    return predictionIds.map(id => Number(id));
  } catch (error) {
    console.error('Error reading active predictions from contract:', error);
    throw error;
  }
}

/**
 * Lock a prediction (for sports at kickoff)
 */
export async function lockPrediction(predictionId: number): Promise<string> {
  if (!oracleAccount || !walletClient) {
    throw new Error('Oracle account not initialized');
  }

  try {
    console.log(`🔒 Locking prediction ${predictionId}...`);

    const { request } = await publicClient.simulateContract({
      account: oracleAccount,
      address: PREDICTION_FACTORY_ADDRESS,
      abi: PredictionFactoryABI,
      functionName: 'lockPrediction',
      args: [BigInt(predictionId)],
    });

    const hash = await walletClient.writeContract(request);
    console.log(`   Transaction hash: ${hash}`);

    // Wait for transaction confirmation
    const receipt = await publicClient.waitForTransactionReceipt({ hash });
    console.log(`   ✅ Prediction ${predictionId} locked (block: ${receipt.blockNumber})`);

    return hash;
  } catch (error) {
    console.error(`Error locking prediction ${predictionId}:`, error);
    throw error;
  }
}

/**
 * Resolve a prediction with winning choice and final price
 */
export async function resolvePredictionOnChain(
  predictionId: number,
  winningChoice: string,
  finalPrice: number
): Promise<string> {
  if (!oracleAccount || !walletClient) {
    throw new Error('Oracle account not initialized');
  }

  try {
    console.log(`🎯 Resolving prediction ${predictionId}...`);
    console.log(`   Winning choice: ${winningChoice}`);
    console.log(`   Final price: ${finalPrice}`);

    // Convert price to wei (assuming 8 decimals for crypto prices)
    const finalPriceWei = BigInt(Math.floor(finalPrice * 100000000));

    const { request } = await publicClient.simulateContract({
      account: oracleAccount,
      address: PREDICTION_FACTORY_ADDRESS,
      abi: PredictionFactoryABI,
      functionName: 'resolvePrediction',
      args: [BigInt(predictionId), winningChoice, finalPriceWei],
    });

    const hash = await walletClient.writeContract(request);
    console.log(`   Transaction hash: ${hash}`);

    // Wait for transaction confirmation
    const receipt = await publicClient.waitForTransactionReceipt({ hash });
    console.log(`   ✅ Prediction ${predictionId} resolved (block: ${receipt.blockNumber})`);
    console.log(`   💰 Creator fee automatically paid by smart contract`);
    console.log(`   💰 Loss-Edge Pool and Treasury received fees during participation`);

    return hash;
  } catch (error) {
    console.error(`Error resolving prediction ${predictionId}:`, error);
    throw error;
  }
}

/**
 * Check if a prediction is locked
 */
export async function isPredictionLocked(predictionId: number): Promise<boolean> {
  try {
    const prediction = await getPredictionFromContract(predictionId);
    const now = Math.floor(Date.now() / 1000);
    
    // Status: 0 = ACTIVE, 1 = LOCKED, 2 = RESOLVED, 3 = CANCELLED
    const status = prediction[10]; // status field
    const lockTime = Number(prediction[8]); // lockTime field

    return status === 1 || now >= lockTime;
  } catch (error) {
    console.error(`Error checking lock status for prediction ${predictionId}:`, error);
    return false;
  }
}

/**
 * Get prediction status from contract
 */
export async function getPredictionStatus(predictionId: number): Promise<{
  status: number;
  isLocked: boolean;
  isResolved: boolean;
  totalPool: string;
  resolvedChoice: string;
}> {
  try {
    const prediction = await getPredictionFromContract(predictionId);
    
    const status = prediction[10]; // status field
    const totalPool = prediction[9]; // totalPool field
    const resolvedChoice = prediction[11]; // resolvedChoice field
    const lockTime = Number(prediction[8]); // lockTime field
    const now = Math.floor(Date.now() / 1000);

    return {
      status: Number(status),
      isLocked: status === 1 || now >= lockTime,
      isResolved: status === 2,
      totalPool: formatEther(totalPool as bigint),
      resolvedChoice: resolvedChoice as string,
    };
  } catch (error) {
    console.error(`Error getting prediction status for ${predictionId}:`, error);
    throw error;
  }
}

/**
 * Get oracle wallet balance
 */
export async function getOracleBalance(): Promise<string> {
  if (!oracleAccount) {
    throw new Error('Oracle account not initialized');
  }

  try {
    const balance = await publicClient.getBalance({
      address: oracleAccount.address,
    });
    return formatEther(balance);
  } catch (error) {
    console.error('Error getting oracle balance:', error);
    throw error;
  }
}

/**
 * Check if contract service is properly configured
 */
export function isContractServiceConfigured(): boolean {
  return !!(
    ORACLE_PRIVATE_KEY &&
    PREDICTION_FACTORY_ADDRESS &&
    PREDICTION_FACTORY_ADDRESS !== '0x' &&
    PREDICTION_FACTORY_ADDRESS.length === 42
  );
}

// Log configuration status on import
if (!isContractServiceConfigured()) {
  console.warn('⚠️  Contract service not fully configured. Check environment variables:');
  console.warn(`   ORACLE_PRIVATE_KEY: ${ORACLE_PRIVATE_KEY ? '✅' : '❌'}`);
  console.warn(`   PREDICTION_FACTORY_ADDRESS: ${PREDICTION_FACTORY_ADDRESS || '❌'}`);
}

