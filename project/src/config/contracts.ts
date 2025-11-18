import { Address } from 'viem';

/**
 * Smart Contract Addresses on BSC Testnet
 * Deployed via Hardhat deployment script
 * Updated: 2025-01-13 - NEW SYSTEM with automatic fee distribution
 */
export const CONTRACTS = {
  // Core prediction system contracts
  PREDICTION_FACTORY: '0xa6a8418fb7553af50B5974B750Bc7b99474cBb99' as Address,
  FEE_DISTRIBUTOR: '0x0CDe93bB9C9c1dc28f6b9a2d8898Ff64e567dD25' as Address,
  LOSS_EDGE_VAULT: '0x28fe36bceAF15f206A35E38b7CF69315A93d5c32' as Address,
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

export const PredictionFactoryABI = PredictionFactoryArtifact.abi;
export const FeeDistributorABI = FeeDistributorArtifact.abi;
export const LossEdgeVaultABI = LossEdgeVaultArtifact.abi;

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

