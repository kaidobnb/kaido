import React, { useState } from 'react';
import { useWallet } from '../../contexts/WalletContext';
import { useAccount, useBalance } from 'wagmi';
import { formatEther, type Address } from 'viem';
import Button from '../ui/Button';
import Card, { CardContent, CardHeader } from '../ui/Card';
import { RefreshCw, Wallet, Network } from 'lucide-react';

const BalanceDebugger: React.FC = () => {
  const { wallet, refreshBalance } = useWallet();
  const [directBalance, setDirectBalance] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedNetwork, setSelectedNetwork] = useState<'mainnet-beta' | 'testnet' | 'devnet'>('devnet');

  const checkBalanceDirectly = async () => {
    if (!wallet.address) {
      setError('No wallet address available');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Create a direct connection to the selected network
      const connection = new Connection(clusterApiUrl(selectedNetwork), 'confirmed');
      console.log(`Direct connection created to ${selectedNetwork}:`, connection.rpcEndpoint);

      // Get the balance
      const publicKey = new PublicKey(wallet.address);
      console.log(`Checking balance for address ${publicKey.toString()} on ${selectedNetwork}`);

      const balance = await connection.getBalance(publicKey);
      console.log('Raw balance in lamports:', balance);

      // Convert to SOL
      const solBalance = balance / LAMPORTS_PER_SOL;
      console.log(`Converted SOL balance on ${selectedNetwork}:`, solBalance);

      setDirectBalance(solBalance);
    } catch (err) {
      console.error(`Error in direct balance check on ${selectedNetwork}:`, err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const handleRefreshBalance = async () => {
    setLoading(true);
    try {
      await refreshBalance();
    } catch (error) {
      console.error('Error refreshing balance:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 bg-slate-800 rounded-lg border border-slate-700 mb-4">
      <h3 className="text-lg font-semibold mb-2">Balance Debugger</h3>

      <div className="mb-3">
        <p className="text-sm text-slate-300">
          Wallet Address: <span className="text-purple-400">{wallet.address || 'Not connected'}</span>
        </p>
        <p className="text-sm text-slate-300">
          Appkit Balance: <span className="text-green-400">{wallet.balance.sol} SOL</span>
        </p>
        {directBalance !== null && (
          <p className="text-sm text-slate-300">
            Direct Balance: <span className="text-green-400">{directBalance} SOL</span>
          </p>
        )}
        {error && (
          <p className="text-sm text-red-400 mt-1">{error}</p>
        )}
      </div>

      <Button
        variant="secondary"
        size="sm"
        onClick={checkBalanceDirectly}
        disabled={loading || !wallet.connected}
      >
        {loading ? 'Checking...' : 'Check Balance Directly'}
      </Button>
    </div>
  );
};

export default BalanceDebugger;
