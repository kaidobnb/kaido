import React, { useEffect, useState } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { CheckCircle, Copy, ExternalLink, ArrowLeft, Wallet, Clock } from 'lucide-react';
import Button from '../components/ui/Button';
import Card, { CardContent, CardHeader } from '../components/ui/Card';
import { formatNumber, formatWalletAddress } from '../utils/formatters';
import { useToast } from '../hooks/useToast';
import { getPresaleHistory } from '../services/presaleService';
import { Spinner } from '../components/ui/Spinner';
import GlowEffect from '../components/effects/GlowEffect';
import { PRESALE_CONFIG } from '../config/presale';
import { useAppKit } from '@reown/appkit/react';

interface PresaleTransaction {
  _id: string;
  amount: number;
  createdAt: string;
  txHash: string;
  metadata: {
    phase: string;
    solyTokensAllocated: number;
    solyPrice: number;
    tgeDistributed: boolean;
  };
}

const PresaleConfirmationPage: React.FC = () => {
  const { txHash } = useParams<{ txHash: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { open } = useAppKit();

  // Get transaction data from location state or default values
  const transactionData = location.state?.transactionData || {
    solAmount: 0,
    solyTokens: 0,
    phaseName: '',
    transactionHash: txHash || ''
  };

  const [history, setHistory] = useState<PresaleTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [totalSolyAllocated, setTotalSolyAllocated] = useState(0);
  const [currentTransaction, setCurrentTransaction] = useState<PresaleTransaction | null>(null);

  // Fetch presale history
  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      setIsLoading(true);
      const response = await getPresaleHistory();

      if (response.success && response.transactions) {
        setHistory(response.transactions);

        // Find the current transaction
        const current = response.transactions.find((tx: PresaleTransaction) => tx.txHash === txHash);
        if (current) {
          setCurrentTransaction(current);
        }

        // Calculate total SOLY allocated
        const total = response.transactions.reduce(
          (sum: number, tx: PresaleTransaction) =>
            sum + (tx.metadata?.solyTokensAllocated || 0),
          0
        );
        setTotalSolyAllocated(total);
      }
    } catch (error) {
      console.error('Error fetching presale history:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    showToast({
      type: 'success',
      title: 'Copied',
      message: 'Copied to clipboard',
    });
  };

  const openExplorer = (txHash: string) => {
    const explorerUrl = `https://explorer.solana.com/tx/${txHash}`;
    window.open(explorerUrl, '_blank');
  };

  // Add animation styles for the banner
  useEffect(() => {
    // Add the animation keyframes to the document if they don't exist
    if (!document.getElementById('access-banner-animations')) {
      const styleSheet = document.createElement('style');
      styleSheet.id = 'access-banner-animations';
      styleSheet.textContent = `
        @keyframes pulse-slow {
          0% { box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.4); }
          70% { box-shadow: 0 0 0 10px rgba(34, 197, 94, 0); }
          100% { box-shadow: 0 0 0 0 rgba(34, 197, 94, 0); }
        }

        .animate-pulse-slow {
          animation: pulse-slow 2s infinite;
        }
      `;
      document.head.appendChild(styleSheet);
    }

    return () => {
      // Clean up the style element when component unmounts
      const styleElement = document.getElementById('access-banner-animations');
      if (styleElement) {
        styleElement.remove();
      }
    };
  }, []);

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header Section */}
      <div className="mb-8">
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate('/presale')}
          leftIcon={<ArrowLeft className="h-4 w-4" />}
        >
          Back to Seed Sale
        </Button>
      </div>

      <div className="max-w-4xl mx-auto">
        {/* Success Header */}
        <div className="text-center mb-12">
          <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="h-10 w-10 text-green-400" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Seed Sale Participation Successful!
          </h1>
          <p className="text-xl text-slate-300 max-w-2xl mx-auto">
            You have successfully participated in the SOLY token seed sale. Your tokens will be distributed at TGE.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          {/* Current Transaction */}
          <GlowEffect glowColor="#8b5cf6" className="col-span-2">
            <Card className="h-full bg-slate-900/90 border-slate-700/50">
              <CardHeader className="border-b border-slate-700/50">
                <h2 className="text-xl font-bold text-white">Transaction Details</h2>
              </CardHeader>
              <CardContent className="p-6">
                {isLoading ? (
                  <div className="flex justify-center py-8">
                    <Spinner size="md" color="yellow" />
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-300">Amount Contributed:</span>
                      <span className="text-white font-medium">
                        {currentTransaction?.amount || transactionData.solAmount} SOL
                      </span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-slate-300">SOLY Tokens Allocated:</span>
                      <span className="text-white font-medium">
                        {formatNumber(currentTransaction?.metadata?.solyTokensAllocated || transactionData.solyTokens)} SOLY
                      </span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-slate-300">Sale Phase:</span>
                      <span className="text-white font-medium">
                        {currentTransaction?.metadata?.phase || transactionData.phaseName}
                      </span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-slate-300">Date:</span>
                      <span className="text-white font-medium">
                        {currentTransaction ? new Date(currentTransaction.createdAt).toLocaleDateString() : new Date().toLocaleDateString()}
                      </span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-slate-300">Transaction Hash:</span>
                      <div className="flex items-center">
                        <span className="text-white font-medium text-sm truncate max-w-[120px] md:max-w-[200px]">
                          {formatWalletAddress(currentTransaction?.txHash || transactionData.transactionHash, 8, 8)}
                        </span>
                        <button
                          onClick={() => copyToClipboard(currentTransaction?.txHash || transactionData.transactionHash)}
                          className="ml-2 text-slate-400 hover:text-white transition-colors"
                        >
                          <Copy className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => openExplorer(currentTransaction?.txHash || transactionData.transactionHash)}
                          className="ml-2 text-slate-400 hover:text-white transition-colors"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    <div className="mt-6 pt-6 border-t border-slate-700/50">
                      <div className="flex justify-between items-center">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openExplorer(currentTransaction?.txHash || transactionData.transactionHash)}
                          leftIcon={<ExternalLink className="h-4 w-4" />}
                        >
                          View on Explorer
                        </Button>

                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => navigate('/presale')}
                        >
                          Back to Seed Sale
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </GlowEffect>

          {/* Total Allocation */}
          <GlowEffect glowColor="#3b82f6">
            <Card className="h-full bg-slate-900/90 border-slate-700/50">
              <CardHeader className="border-b border-slate-700/50">
                <h2 className="text-xl font-bold text-white">Your Allocation</h2>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-6">
                  <div className="bg-gradient-to-r from-yellow-500/20 to-yellow-600/20 rounded-lg p-6 border border-yellow-500/30">
                    <div className="text-center">
                      <h3 className="text-lg font-bold text-white mb-2">Total KAIDO</h3>
                      <div className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-yellow-500 mb-1">
                        {formatNumber(totalSolyAllocated)} KAIDO
                      </div>
                    </div>
                  </div>

                  <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700/50">
                    <div className="flex items-center mb-3">
                      <Clock className="h-5 w-5 text-blue-400 mr-2" />
                      <h3 className="text-md font-semibold text-white">Token Distribution</h3>
                    </div>
                    <p className="text-slate-300 text-sm mb-3">
                      Tokens will be distributed at Token Generation Event (TGE).
                    </p>

                  </div>

                  {/* Access Platform Banner */}
                  <div className="bg-gradient-to-r from-green-500/20 to-blue-500/20 rounded-lg p-4 border border-green-500/30 animate-pulse-slow">
                    <div className="flex items-center mb-2">
                      <div className="w-8 h-8 rounded-full bg-green-500/30 flex items-center justify-center mr-3">
                        <CheckCircle className="h-4 w-4 text-green-400" />
                      </div>
                      <h3 className="text-md font-bold text-white">Instant Platform Access Unlocked!</h3>
                    </div>
                    <p className="text-slate-300 text-sm mb-3">
                      As a Seed Sale participant, you now have exclusive early access to the Kaido AI platform.
                    </p>
                    <Button
                      variant="primary"
                      size="md"
                      fullWidth
                      onClick={() => navigate('/')}
                      className="bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600"
                    >
                      Visit Platform Now
                    </Button>
                  </div>

                  <Button
                    variant="outline"
                    size="md"
                    fullWidth
                    onClick={() => open()}
                    leftIcon={<Wallet className="h-4 w-4" />}
                  >
                    Connect Wallet
                  </Button>
                </div>
              </CardContent>
            </Card>
          </GlowEffect>
        </div>

        {/* Participation History */}
        <GlowEffect glowColor="#10b981">
          <Card className="bg-slate-900/90 border-slate-700/50 mb-10">
            <CardHeader className="border-b border-slate-700/50">
              <h2 className="text-xl font-bold text-white">Your Participation History</h2>
            </CardHeader>
            <CardContent className="p-6">
              {isLoading ? (
                <div className="flex justify-center py-8">
                  <Spinner size="md" color="green" />
                </div>
              ) : history.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {history.map((tx) => (
                    <div
                      key={tx._id}
                      className={`bg-slate-800/30 rounded-lg p-4 border ${
                        tx.txHash === (currentTransaction?.txHash || transactionData.transactionHash)
                          ? 'border-yellow-500/50 bg-yellow-500/10'
                          : 'border-slate-700/50'
                      }`}
                    >
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-slate-300 text-sm">
                          {new Date(tx.createdAt).toLocaleDateString()} • {tx.metadata.phase}
                        </span>
                        <span className="text-white font-medium">{tx.amount} SOL</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-400 text-xs truncate max-w-[150px]">
                          {formatWalletAddress(tx.txHash, 6, 6)}
                        </span>
                        <span className="text-green-400 font-medium">
                          {formatNumber(tx.metadata.solyTokensAllocated)} SOLY
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-slate-400">
                  No previous participation found
                </div>
              )}
            </CardContent>
          </Card>
        </GlowEffect>
      </div>
    </div>
  );
};

export default PresaleConfirmationPage;
