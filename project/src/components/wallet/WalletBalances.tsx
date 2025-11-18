import React, { useState, useEffect } from 'react';
import { useAppKitAccount } from '@reown/appkit/react';
import { useAccount, useBalance } from 'wagmi';
import { formatEther, type Address } from 'viem';
import Card, { CardContent, CardHeader } from '../ui/Card';
import Button from '../ui/Button';
import { RefreshCw, Wallet } from 'lucide-react';

// KAIDO token contract address on BNB Smart Chain testnet
const KAIDO_TOKEN_CONTRACT = '0x1234567890123456789012345678901234567890';

const WalletBalances: React.FC = () => {
  const { address, isConnected } = useAppKitAccount();
  const account = useAccount();
  const [bnbBalance, setBnbBalance] = useState<number | null>(null);
  const [kaidoBalance, setKaidoBalance] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchBalances = async () => {
    if (!isConnected || !address || !connection) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Get SOL balance
      const publicKey = new PublicKey(address);
      const balance = await connection.getBalance(publicKey);
      const solBalanceValue = balance / LAMPORTS_PER_SOL;
      setSolBalance(solBalanceValue);

      // Get SOLY token balance
      try {
        console.log('Fetching SOLY token balance...');
        const solyMint = new PublicKey(SOLY_TOKEN_MINT);

        // Get the associated token account address
        const tokenAccountAddress = await getAssociatedTokenAddress(
          solyMint,
          publicKey
        );

        console.log('Token account address:', tokenAccountAddress.toString());

        try {
          // Get the token account info
          const tokenAccount = await getAccount(connection, tokenAccountAddress);

          // Calculate the balance in SOLY (9 decimals like SOL)
          const solyBalanceValue = Number(tokenAccount.amount) / Math.pow(10, 9);
          console.log('SOLY Balance:', solyBalanceValue);
          setSolyBalance(solyBalanceValue);
        } catch (tokenError) {
          // If the token account doesn't exist, the balance is 0
          console.log('No SOLY token account found. Balance is 0.');
          setSolyBalance(0);
        }
      } catch (solyError) {
        console.error('Error fetching SOLY balance:', solyError);
        console.error('Error details:', solyError instanceof Error ? solyError.message : String(solyError));
        setSolyBalance(0);
      }
    } catch (err) {
      console.error('Error fetching balances:', err);
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  // Fetch balances when wallet is connected
  useEffect(() => {
    if (isConnected && address && connection) {
      fetchBalances();
    } else {
      setSolBalance(null);
      setSolyBalance(0);
    }
  }, [isConnected, address, connection]);

  if (!isConnected) {
    return (
      <Card>
        <CardHeader>
          <h2 className="text-xl font-bold text-white">Wallet Balances</h2>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center mx-auto mb-4">
              <Wallet className="h-8 w-8 text-slate-500" />
            </div>
            <h3 className="text-xl font-semibold text-slate-300 mb-2">Wallet Not Connected</h3>
            <p className="text-slate-400 mb-6">Connect your wallet to view your balances</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold text-white">Wallet Balances</h2>
          <Button
            variant="ghost"
            size="sm"
            leftIcon={<RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />}
            onClick={fetchBalances}
            disabled={loading}
          >
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-md p-4 mb-4">
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* SOL Balance Card */}
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-lg p-6 border border-slate-700 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/5 rounded-full filter blur-xl"></div>
            <div className="relative z-10">
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center mr-3">
                  <Wallet className="h-5 w-5 text-purple-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">SOL Balance</h3>
                  <p className="text-sm text-slate-400">Native Solana Token</p>
                </div>
              </div>
              <div className="mt-2">
                {loading ? (
                  <div className="h-8 w-24 bg-slate-700/50 rounded animate-pulse"></div>
                ) : (
                  <div className="text-3xl font-bold text-white">
                    {solBalance !== null ? solBalance.toFixed(4) : '0.0000'}
                  </div>
                )}
                <p className="text-sm text-slate-400 mt-1">SOL</p>
              </div>
            </div>
          </div>

          {/* SOLY Balance Card */}
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-lg p-6 border border-slate-700 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full filter blur-xl"></div>
            <div className="relative z-10">
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 flex items-center justify-center mr-3">
                  <span className="text-white font-bold text-sm">S</span>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">SOLY Balance</h3>
                  <p className="text-sm text-slate-400">SolyMarket Token</p>
                </div>
              </div>
              <div className="mt-2">
                {loading ? (
                  <div className="h-8 w-24 bg-slate-700/50 rounded animate-pulse"></div>
                ) : (
                  <div className="text-3xl font-bold text-white">{solyBalance.toLocaleString()}</div>
                )}
                <p className="text-sm text-slate-400 mt-1">SOLY</p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 p-4 bg-slate-800/30 rounded-lg border border-slate-700/50">
          <h3 className="text-md font-semibold mb-2">Wallet Information</h3>
          <div className="space-y-2 text-sm text-slate-300">
            <p><span className="text-slate-400">Connected Address:</span> {address}</p>
            <p><span className="text-slate-400">Last Updated:</span> {new Date().toLocaleTimeString()}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default WalletBalances;
