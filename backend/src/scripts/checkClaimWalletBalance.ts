import { Connection, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';
import dotenv from 'dotenv';

dotenv.config();

// Load environment variables
const CLAIM_WALLET_ADDRESS = process.env.CLAIM_WALLET_ADDRESS || '';
const SOLANA_RPC_URL = process.env.SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com';

if (!CLAIM_WALLET_ADDRESS) {
  console.error('Claim wallet address not found in environment variables');
  process.exit(1);
}

// Initialize Solana connection
const connection = new Connection(SOLANA_RPC_URL, 'confirmed');

async function checkBalance() {
  try {
    const publicKey = new PublicKey(CLAIM_WALLET_ADDRESS);
    const balance = await connection.getBalance(publicKey);
    const balanceInSol = balance / LAMPORTS_PER_SOL;
    
    console.log('Claim Wallet Address:', CLAIM_WALLET_ADDRESS);
    console.log('Balance:', balanceInSol.toFixed(6), 'SOL');
    console.log('Balance in lamports:', balance);
    
    // Check if balance is low
    if (balanceInSol < 1) {
      console.warn('WARNING: Claim wallet balance is low. Please top up the wallet.');
    }
  } catch (error) {
    console.error('Error checking claim wallet balance:', error);
  }
}

// Run the check
checkBalance().then(() => process.exit(0));
