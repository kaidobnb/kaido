import React, { useState } from 'react';
import { Copy, X, QrCode, ExternalLink, AlertCircle, ChevronDown, ChevronUp, RefreshCw } from 'lucide-react';
import Button from '../ui/Button';
import Card, { CardContent, CardFooter, CardHeader } from '../ui/Card';
import { useToast } from '../../hooks/useToast';
import GlowEffect from '../effects/GlowEffect';
import { Spinner } from '../ui/Spinner';
import { formatWalletAddress } from '../../utils/formatters';
import { QRCodeSVG } from 'qrcode.react';

interface InsufficientFundsModalProps {
  isOpen: boolean;
  onClose: () => void;
  walletAddress: string;
  requiredAmount: number;
  currentBalance: number;
  onRefreshBalance?: () => Promise<void>;
}

const InsufficientFundsModal: React.FC<InsufficientFundsModalProps> = ({
  isOpen,
  onClose,
  walletAddress,
  requiredAmount,
  currentBalance,
  onRefreshBalance,
}) => {
  const { showToast } = useToast();
  const [showQR, setShowQR] = useState(false);
  const [showFAQ, setShowFAQ] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  if (!isOpen) return null;

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    showToast({
      type: 'success',
      title: 'Copied',
      message: 'Wallet address copied to clipboard',
    });
  };

  const openExplorer = () => {
    const explorerUrl = `https://explorer.solana.com/address/${walletAddress}`;
    window.open(explorerUrl, '_blank');
  };

  const handleRefreshBalance = async () => {
    if (onRefreshBalance) {
      try {
        setIsRefreshing(true);
        await onRefreshBalance();

        // The onRefreshBalance function will handle closing the modal if needed
        showToast({
          type: 'info',
          title: 'Balance Updated',
          message: 'Your wallet balance has been refreshed.',
        });
      } catch (error) {
        showToast({
          type: 'error',
          title: 'Error',
          message: 'Failed to refresh balance',
        });
      } finally {
        setIsRefreshing(false);
      }
    }
  };

  const shortAddress = formatWalletAddress(walletAddress, 8, 8);
  const amountNeeded = requiredAmount - currentBalance;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm overflow-y-auto custom-scrollbar">
      <div className="w-full max-w-2xl my-4">
        <GlowEffect glowColor="#ef4444" className="w-full">
          <Card className="w-full bg-slate-900/90 border-slate-700/50 overflow-hidden max-h-[85vh] md:max-h-[80vh] flex flex-col">
            {/* Fixed Header */}
            <CardHeader className="relative border-b border-slate-700/50 pb-6 flex-shrink-0">
              <button
                onClick={onClose}
                className="absolute right-4 top-4 text-slate-400 hover:text-white transition-colors"
              >
                <X className="h-5 w-5" />
              </button>

              <div className="flex flex-col items-center">
                <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mb-4">
                  <AlertCircle className="h-8 w-8 text-red-400" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-1">Insufficient SOL Balance</h2>
                <p className="text-slate-300 text-center">
                  You need more SOL in your wallet to participate in the presale.
                </p>
                {/* Scroll indicator */}
                <div className="mt-4 text-slate-400 flex items-center text-xs animate-pulse">
                  <span>Scroll down for wallet details</span>
                  <ChevronDown className="h-4 w-4 ml-1" />
                </div>
              </div>
            </CardHeader>

            {/* Scrollable Content - entire content area is now scrollable */}
            <CardContent className="p-6 overflow-y-auto flex-grow custom-scrollbar">
              <div className="space-y-6">
                {/* Balance Information */}
                <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700/50">
                  <h3 className="text-lg font-semibold text-white mb-3">Balance Details</h3>

                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-300">Current Balance:</span>
                      <span className="text-white font-medium">{currentBalance.toFixed(4)} SOL</span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-slate-300">Required Amount:</span>
                      <span className="text-white font-medium">{requiredAmount.toFixed(4)} SOL</span>
                    </div>

                    <div className="flex justify-between items-center font-medium">
                      <span className="text-red-400">Amount Needed:</span>
                      <span className="text-red-400">{amountNeeded.toFixed(4)} SOL</span>
                    </div>
                  </div>
                </div>

                {/* Wallet Address */}
                <div className="bg-gradient-to-r from-slate-800/70 to-slate-700/50 rounded-lg p-6 border border-slate-700/50">
                  <h3 className="text-lg font-semibold text-white mb-4">Your Wallet Address</h3>

                  <div className="bg-slate-900/70 rounded-lg p-4 mb-4 border border-slate-700/50">
                    <div className="flex items-center justify-between">
                      <div className="text-white font-mono break-all">
                        {showQR ? walletAddress : shortAddress}
                      </div>
                      <div className="flex space-x-2 ml-2 flex-shrink-0">
                        <button
                          onClick={() => copyToClipboard(walletAddress)}
                          className="p-2 rounded-full bg-slate-800 hover:bg-slate-700 transition-colors"
                          title="Copy address"
                        >
                          <Copy className="h-4 w-4 text-slate-300" />
                        </button>
                        <button
                          onClick={() => setShowQR(!showQR)}
                          className={`p-2 rounded-full transition-colors ${
                            showQR ? 'bg-blue-600/30 text-blue-400' : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                          }`}
                          title="Show QR code"
                        >
                          <QrCode className="h-4 w-4" />
                        </button>
                        <button
                          onClick={openExplorer}
                          className="p-2 rounded-full bg-slate-800 hover:bg-slate-700 transition-colors"
                          title="View on explorer"
                        >
                          <ExternalLink className="h-4 w-4 text-slate-300" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* QR Code */}
                  {showQR && (
                    <div className="flex justify-center p-4 bg-white rounded-lg mb-4">
                      <QRCodeSVG
                        value={walletAddress}
                        size={200}
                        level="H"
                        includeMargin={true}
                      />
                    </div>
                  )}

                  <p className="text-slate-300 text-sm">
                    Send at least <span className="text-red-400 font-medium">{amountNeeded.toFixed(4)} SOL</span> to this address to participate in the presale.
                  </p>
                </div>

                {/* FAQ Section */}
                <div className="bg-slate-800/50 rounded-lg border border-slate-700/50 overflow-hidden">
                  <button
                    className="w-full flex justify-between items-center p-4 text-white hover:bg-slate-700/30 transition-colors"
                    onClick={() => setShowFAQ(!showFAQ)}
                  >
                    <span className="font-medium">How to add SOL to your wallet?</span>
                    {showFAQ ? (
                      <ChevronUp className="h-5 w-5 text-slate-400" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-slate-400" />
                    )}
                  </button>

                  {showFAQ && (
                    <div className="p-4 border-t border-slate-700/50 bg-slate-800/30">
                      <div className="space-y-4 text-slate-300">
                        <p>
                          There are several ways to add SOL to your wallet:
                        </p>
                        <ol className="list-decimal pl-5 space-y-2">
                          <li>
                            <strong>From another wallet:</strong> Send SOL from another wallet you own to this address.
                          </li>
                          <li>
                            <strong>From an exchange:</strong> Withdraw SOL from an exchange like Binance, Coinbase, or FTX to this address.
                          </li>
                          <li>
                            <strong>Using a fiat on-ramp:</strong> Purchase SOL directly using a credit card or bank transfer through services integrated with your wallet.
                          </li>
                          <li>
                            <strong>Devnet faucet:</strong> Since we're on Devnet, you can get free test SOL from a Devnet faucet.
                          </li>
                        </ol>
                        <p>
                          After sending SOL to your wallet, it may take a few moments for the transaction to be confirmed on the Solana network.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>

            {/* Fixed Footer */}
            <CardFooter className="border-t border-slate-700/50 p-4 flex-shrink-0">
              <div className="flex flex-col sm:flex-row gap-3 w-full">
                <Button
                  variant="outline"
                  size="md"
                  fullWidth
                  onClick={onClose}
                >
                  Close
                </Button>

                {onRefreshBalance && (
                  <Button
                    variant="secondary"
                    size="md"
                    fullWidth
                    onClick={handleRefreshBalance}
                    disabled={isRefreshing}
                    leftIcon={isRefreshing ? <Spinner size="sm" color="white" /> : <RefreshCw className="h-4 w-4" />}
                  >
                    {isRefreshing ? 'Refreshing...' : 'Refresh Balance'}
                  </Button>
                )}

                <Button
                  variant="primary"
                  size="md"
                  fullWidth
                  onClick={() => {
                    copyToClipboard(walletAddress);
                    showToast({
                      type: 'info',
                      title: 'Address Copied',
                      message: 'Send SOL to this address and try again',
                    });
                  }}
                >
                  Copy Address
                </Button>
              </div>
            </CardFooter>
          </Card>
        </GlowEffect>
      </div>
    </div>
  );
};

export default InsufficientFundsModal;
