import { Address } from 'viem';

/**
 * Smart Contract Addresses on BSC Testnet
 * Deployed via Hardhat deployment script
 * Updated: 2025-12-05 - COMPLETE SYSTEM with LP Vault
 */
export const CONTRACTS = {
  // Core prediction system contracts
  PREDICTION_FACTORY: '0x7b58731EF525F799b70D9Bfa47481D7245F34D28' as Address,
  FEE_DISTRIBUTOR: '0xD39f58c3b1c8866086Ae28cDDd664B56ebc65859' as Address,
  LOSS_EDGE_VAULT: '0x4F41aC2019F5ee26BCFc93FbB4C4f56278611c4e' as Address,
  LP_VAULT: '0xB239AE245a26A6dfe2eD933e99bf0A64f1694C11' as Address,
};

/**
 * Network configuration
 */
export const NETWORK_CONFIG = {
  chainId: 97, // BSC Testnet
  chainName: 'BNB Smart Chain Testnet',
  rpcUrl: 'https://data-seed-prebsc-1-s1.binance.org:8545/',
  blockExplorer: 'https://testnet.bscscan.com',
  nativeCurrency: {
    name: 'BNB',
    symbol: 'BNB',
    decimals: 18,
  },
};

/**
 * Contract ABIs
 * Import from generated ABI files and extract the abi array
 */
import PredictionFactoryArtifact from '../contracts/abis/PredictionFactory.json';
import FeeDistributorArtifact from '../contracts/abis/FeeDistributor.json';
import LossEdgeVaultArtifact from '../contracts/abis/LossEdgeVault.json';
import LPVaultArtifact from '../contracts/abis/LPVault.json';

export const PredictionFactoryABI = PredictionFactoryArtifact.abi;
export const FeeDistributorABI = FeeDistributorArtifact.abi;
export const LossEdgeVaultABI = LossEdgeVaultArtifact.abi;
export const LPVaultABI = LPVaultArtifact.abi;

/**
 * Helper function to get block explorer URL for transaction
 */
export function getTransactionUrl(txHash: string): string {
  return `${NETWORK_CONFIG.blockExplorer}/tx/${txHash}`;
}

/**
 * Helper function to get block explorer URL for address
 */
export function getAddressUrl(address: string): string {
  return `${NETWORK_CONFIG.blockExplorer}/address/${address}`;
}

/**
 * Helper function to get block explorer URL for contract
 */
export function getContractUrl(contractName: keyof typeof CONTRACTS): string {
  return getAddressUrl(CONTRACTS[contractName]);
}

