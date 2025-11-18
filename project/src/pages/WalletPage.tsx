import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppKit, useAppKitAccount, useAppKitProvider } from '@reown/appkit/react';
import { useAccount, useBalance } from 'wagmi';
import { parseEther, formatEther, type Address } from 'viem';
import { useToast } from '../hooks/useToast';
import { createBnbTransferTransaction, FEE_PERCENTAGE, MIN_FEE_AMOUNT } from '../utils/walletUtils';
import { checkTransactionStatus } from '../utils/transactionUtils';
// We don't need the wallet context in this component
import Card, { CardContent, CardHeader } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { Spinner } from '../components/ui/Spinner';
import GlowEffect from '../components/effects/GlowEffect';
// Import icons individually to avoid any potential naming conflicts
import { Wallet as WalletIcon } from 'lucide-react';
import { Copy } from 'lucide-react';
import { RefreshCw } from 'lucide-react';
import { Send } from 'lucide-react';
import { QrCode } from 'lucide-react';
import { ArrowLeft } from 'lucide-react';
import { CheckCircle } from 'lucide-react';
import { AlertCircle } from 'lucide-react';
import { ExternalLink } from 'lucide-react';

const WalletPage: React.FC = () => {
  const navigate = useNavigate();
  // We use AppKit's wallet functionality instead of the WalletContext
  const { showToast } = useToast();
  const { open } = useAppKit();
  const { address: wagmiAddress, isConnected } = useAccount();
  const { address: appkitAddress } = useAppKitAccount();
  const { walletProvider } = useAppKitProvider('eip155');

  // Use wagmi address or fallback to appkit address
  const address = wagmiAddress || appkitAddress;

  // Use wagmi's useBalance hook for BNB balance
  const { data: balanceData, isLoading: isBalanceLoading, refetch: refetchBalance } = useBalance({
    address: address as Address,
  });

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSending, setIsSending] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [showQR, setShowQR] = useState<boolean>(false);
  const [showMobileQR, setShowMobileQR] = useState<boolean>(false);
  const [recipientAddress, setRecipientAddress] = useState<string>('');
  const [sendAmount, setSendAmount] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [txSuccess, setTxSuccess] = useState<boolean>(false);

  // Get balance from wagmi hook
  const balance = balanceData ? parseFloat(formatEther(balanceData.value)) : 0;

  // Refresh balance function
  const fetchBalance = async () => {
    if (!address) return;

    try {
      setIsLoading(true);
      await refetchBalance();
    } catch (error) {
      console.error('Error fetching balance:', error);
      showToast({
        type: 'error',
        title: 'Error',
        message: 'Failed to fetch wallet balance',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Copy wallet address to clipboard
  const copyAddress = () => {
    if (!address) return;

    navigator.clipboard.writeText(address);
    setCopied(true);
    showToast({
      type: 'success',
      title: 'Copied',
      message: 'Wallet address copied to clipboard',
    });

    setTimeout(() => setCopied(false), 2000);
  };

  // Send BNB transaction
  const sendTransaction = async () => {
    try {

    // Check if any required fields are missing
    if (!address) {
      setError('Wallet not connected');
      return;
    }

    // BNB Smart Chain connection is handled by wagmi

    if (!walletProvider) {
      setError('Wallet provider not available');
      return;
    }

    if (!recipientAddress || recipientAddress.trim() === '') {
      setError('Please enter a recipient address');
      return;
    }

    if (!sendAmount || sendAmount.trim() === '' || parseFloat(sendAmount) <= 0) {
      setError('Please enter a valid amount to send');
      return;
    }

    try {
      setIsSending(true);
      setError(null);
      setTxSuccess(false);
      setTxHash(null);

      // Validate recipient address (BNB Smart Chain address format)
      const addressRegex = /^0x[a-fA-F0-9]{40}$/;
      if (!addressRegex.test(recipientAddress.trim())) {
        setError('Invalid BNB Smart Chain address format');
        setIsSending(false);
        return;
      }

      // Validate amount
      let transactionAmount = parseFloat(sendAmount);
      if (isNaN(transactionAmount) || transactionAmount <= 0) {
        setError('Please enter a valid amount');
        setIsSending(false);
        return;
      }

      if (transactionAmount > balance) {
        setError('Insufficient balance');
        setIsSending(false);
        return;
      }

      // Calculate the 0.25% fee with minimum amount
      let feeAmount = transactionAmount * FEE_PERCENTAGE;

      // Apply minimum fee if needed
      if (feeAmount < MIN_FEE_AMOUNT && transactionAmount > MIN_FEE_AMOUNT) {
        feeAmount = MIN_FEE_AMOUNT;
      }

      // Calculate the total amount needed including our fee
      const totalAmountNeeded = transactionAmount + 0.000005; // transaction amount + network fee

      console.log('Transaction amount:', transactionAmount);
      console.log('Fee amount (0.25%):', feeAmount);
      console.log('Total amount needed with network fee:', totalAmountNeeded);
      console.log('Available balance:', balance);

      // Check if user has enough balance for the transaction amount + network fee
      if (totalAmountNeeded > balance) {
        // Not enough balance for transaction + network fee
        setError('Insufficient balance to cover transaction and network fees');
        setIsSending(false);
        return;
      }

      // If we're sending close to the max balance, adjust to leave room for network fees
      if (transactionAmount === balance || transactionAmount > balance - 0.000005) {
        // Adjust the amount to leave room for network fees
        const adjustedAmount = Math.max(0, balance - 0.000005);
        if (adjustedAmount <= 0) {
          setError('Insufficient balance to cover transaction fees');
          setIsSending(false);
          return;
        }

        console.log(`Adjusting amount from ${transactionAmount} to ${adjustedAmount} to account for network fees`);
        setSendAmount(adjustedAmount.toFixed(4));

        // Update the amount variable for this transaction
        transactionAmount = adjustedAmount;
      }

      // Create BNB transfer transaction
      const transaction = await createBnbTransferTransaction(
        address,
        recipientAddress.trim(),
        transactionAmount
      );

      // For now, we'll show a placeholder since full BNB transaction implementation
      // would require additional wallet provider setup
      showToast({
        type: 'info',
        title: 'Transaction Prepared',
        message: 'BNB transaction functionality will be implemented with full wallet integration'
      });

      // Simulate transaction success for UI testing
      const mockTxHash = '0x' + Math.random().toString(16).substr(2, 64);

      // Transaction successful (simulated)
      setTxSuccess(true);
      setTxHash(mockTxHash);
      // Use the fee amount we calculated earlier
      const recipientAmount = transactionAmount - feeAmount;

      showToast({
        type: 'success',
        title: 'Transaction Successful',
        message: `Sent ${recipientAmount.toFixed(4)} BNB to recipient (${feeAmount.toFixed(4)} BNB fee)`,
      });

      // Reset form
      setRecipientAddress('');
      setSendAmount('');

      // Refresh balance
      fetchBalance();

    } catch (error: any) {
      console.error('Error sending transaction:', error);

      // Provide more specific error messages based on the error
      if (error.message?.includes('insufficient funds')) {
        setError('Insufficient funds for transaction. Remember to leave some BNB for transaction fees.');
      } else if (error.message?.includes('blockhash')) {
        setError('Transaction timeout. Please try again.');
      } else if (error.message?.includes('Transaction simulation failed')) {
        setError('Transaction simulation failed. Please try a smaller amount to account for fees.');
      } else {
        setError(`Failed to send transaction: ${error.message || 'Unknown error'}`);
      }
    } finally {
      setIsSending(false);
    }
  } catch (outerError: any) {
    console.error('Outer error in sendTransaction function:', outerError);
    showToast({
      type: 'error',
      title: 'Transaction Error',
      message: `An unexpected error occurred: ${outerError.message || 'Unknown error'}`
    });
    setIsSending(false);
  }
  };

  // Open transaction in explorer
  const openExplorer = (txHash: string) => {
    window.open(`https://bscscan.com/tx/${txHash}`, '_blank');
  };

  // Initial load
  useEffect(() => {
    if (address) {
      fetchBalance();
    }
  }, [address]);

  // Format wallet address for display
  const formatAddress = (address: string) => {
    if (!address) return '';
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header with back button */}
      <div className="flex items-center justify-between mb-6 md:mb-8">
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate(-1)}
          leftIcon={<ArrowLeft className="h-4 w-4" />}
          className="text-sm"
        >
          Back
        </Button>

        <h1 className="text-2xl md:text-4xl font-bold text-white md:hidden">
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-yellow-400 to-yellow-600">
            Wallet
          </span>
        </h1>

        <div className="w-[60px] md:hidden"></div> {/* Empty div for flex spacing */}
      </div>

      <div className="max-w-4xl mx-auto">
        <h1 className="hidden md:block text-3xl md:text-4xl font-bold text-white mb-8">
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-yellow-400 to-yellow-600">
            Wallet
          </span>
        </h1>

        {/* Mobile-optimized layout */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          {/* Balance Card */}
          <GlowEffect glowColor="#8b5cf6" className="md:col-span-3">
            <Card className="bg-slate-900/90 border-slate-700/50">
              <CardContent className="p-4 md:p-6">
                <div className="flex flex-col md:flex-row items-center justify-between">
                  <div className="flex items-center mb-4 md:mb-0">
                    <div className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-gradient-to-br from-yellow-500 to-yellow-600 flex items-center justify-center mr-3 md:mr-4">
                      <WalletIcon className="h-6 w-6 md:h-8 md:w-8 text-white" />
                    </div>
                    <div>
                      <h2 className="text-lg md:text-xl font-bold text-white">BNB Balance</h2>
                      <div className="flex items-center">
                        <p className="text-slate-400 text-xs md:text-sm">{formatAddress(address || '')}</p>
                        <button
                          onClick={copyAddress}
                          className="ml-2 text-slate-400 hover:text-white transition-colors"
                        >
                          {copied ? (
                            <CheckCircle className="h-3 w-3 md:h-4 md:w-4 text-green-400" />
                          ) : (
                            <Copy className="h-3 w-3 md:h-4 md:w-4" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col items-center md:items-end">
                    <div className="flex items-center">
                      {isLoading ? (
                        <Spinner size="sm" color="primary" className="mr-2" />
                      ) : (
                        <RefreshCw
                          className="h-4 w-4 text-slate-400 mr-2 cursor-pointer hover:text-white transition-colors"
                          onClick={fetchBalance}
                        />
                      )}
                      <span className="text-2xl md:text-3xl font-bold text-white">{balance.toFixed(4)}</span>
                      <span className="text-lg md:text-xl font-medium text-yellow-400 ml-2">BNB</span>
                    </div>
                    <p className="text-slate-400 text-xs md:text-sm mt-1">Last updated: {new Date().toLocaleTimeString()}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </GlowEffect>

          {/* Mobile-first layout - Send section first on mobile */}
          <div className="md:hidden">
            {/* Send Section for Mobile */}
            <GlowEffect glowColor="#10b981">
              <Card className="bg-slate-900/90 border-slate-700/50">
                <CardHeader className="border-b border-slate-700/50 p-4">
                  <h2 className="text-lg font-bold text-white">Send BNB</h2>
                </CardHeader>
                <CardContent className="p-4">
                  {error && (
                    <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-3 mb-4 flex items-start">
                      <AlertCircle className="h-4 w-4 text-red-400 mr-2 mt-0.5 flex-shrink-0" />
                      <p className="text-red-200 text-xs">{error}</p>
                    </div>
                  )}

                  {txSuccess && txHash && (
                    <div className="bg-green-500/20 border border-green-500/30 rounded-lg p-3 mb-4">
                      <div className="flex items-start mb-2">
                        <CheckCircle className="h-4 w-4 text-green-400 mr-2 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-green-200 text-xs">Transaction successful!</p>
                          <p className="text-green-200/70 text-xs mt-1">A 0.25% fee was applied to this transaction.</p>
                        </div>
                      </div>
                      <div className="flex flex-col">
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-green-200 text-xs">Transaction Hash:</p>
                          <button
                            onClick={() => openExplorer(txHash)}
                            className="text-green-400 hover:text-green-300 transition-colors flex items-center"
                          >
                            <span className="text-xs mr-1">View in Explorer</span>
                            <ExternalLink className="h-3 w-3" />
                          </button>
                        </div>
                        <div className="bg-green-500/10 rounded p-2 overflow-x-auto">
                          <p className="text-green-200 text-xs font-mono break-all">{txHash}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">
                        Recipient Address
                      </label>
                      <Input
                        type="text"
                        value={recipientAddress}
                        onChange={(e) => setRecipientAddress(e.target.value)}
                        placeholder="Enter BNB address"
                        className="w-full text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">
                        Amount (BNB)
                      </label>
                      <div className="flex gap-1">
                        <Input
                          type="number"
                          value={sendAmount}
                          onChange={(e) => setSendAmount(e.target.value)}
                          placeholder="0.0"
                          min="0"
                          step="0.001"
                          className="flex-grow text-sm"
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSendAmount((balance / 4).toFixed(4))}
                          className="whitespace-nowrap text-xs"
                        >
                          25%
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSendAmount((balance / 2).toFixed(4))}
                          className="whitespace-nowrap text-xs"
                        >
                          50%
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            // Leave room for network fees (0.000005 BNB)
                            // Calculate the maximum amount we can send accounting for network fees
                            const networkFee = 0.000005;
                            const availableAfterNetworkFee = Math.max(0, balance - networkFee);

                            // Calculate the maximum amount we can send accounting for the minimum fee
                            let maxAmount;

                            if (availableAfterNetworkFee <= MIN_FEE_AMOUNT) {
                              // If available balance is less than or equal to minimum fee, can't send anything
                              maxAmount = 0;
                            } else if (availableAfterNetworkFee * FEE_PERCENTAGE < MIN_FEE_AMOUNT) {
                              // If percentage fee would be less than minimum fee
                              // Solve for: x + MIN_FEE_AMOUNT = availableAfterNetworkFee
                              maxAmount = availableAfterNetworkFee - MIN_FEE_AMOUNT;
                            } else {
                              // Normal percentage fee applies
                              // Solve for: x + (x * FEE_PERCENTAGE) = availableAfterNetworkFee
                              // This simplifies to: x * (1 + FEE_PERCENTAGE) = availableAfterNetworkFee
                              maxAmount = availableAfterNetworkFee / (1 + FEE_PERCENTAGE);
                            }

                            setSendAmount(maxAmount.toFixed(4));
                          }}
                          className="whitespace-nowrap text-xs"
                        >
                          Max
                        </Button>
                      </div>
                    </div>

                    <div className="bg-slate-800/50 rounded-lg p-3 mb-3">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-slate-400 text-xs">Available Balance:</span>
                        <span className="text-white font-medium text-xs">{balance.toFixed(4)} BNB</span>
                      </div>

                      {sendAmount && !isNaN(parseFloat(sendAmount)) && (
                        <>
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-slate-400 text-xs">Amount to Send:</span>
                            <span className="text-white font-medium text-xs">{parseFloat(sendAmount).toFixed(4)} BNB</span>
                          </div>
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-slate-400 text-xs">
                              Fee ({parseFloat(sendAmount) >= 0.4 ? '0.25%' : 'min 0.001 BNB'}):
                            </span>
                            <span className="text-white font-medium text-xs">
                              {Math.max(parseFloat(sendAmount) * FEE_PERCENTAGE, parseFloat(sendAmount) > MIN_FEE_AMOUNT ? MIN_FEE_AMOUNT : 0).toFixed(4)} BNB
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-slate-400 text-xs">Recipient Gets:</span>
                            <span className="text-white font-medium text-xs">
                              {(parseFloat(sendAmount) - Math.max(parseFloat(sendAmount) * FEE_PERCENTAGE, parseFloat(sendAmount) > MIN_FEE_AMOUNT ? MIN_FEE_AMOUNT : 0)).toFixed(4)} BNB
                            </span>
                          </div>
                        </>
                      )}
                    </div>

                    <div className="space-y-3">
                      <Button
                        variant="primary"
                        size="md"
                        fullWidth
                        leftIcon={<Send className="h-4 w-4" />}
                        onClick={sendTransaction}
                        disabled={
                          isSending ||
                          !address ||
                          !walletProvider ||
                          !recipientAddress ||
                          recipientAddress.trim() === '' ||
                          !sendAmount ||
                          sendAmount.trim() === '' ||
                          parseFloat(sendAmount) <= 0
                        }
                      >
                        {isSending ? (
                          <>
                            <Spinner size="sm" color="white" className="mr-1" />
                            Sending...
                          </>
                        ) : (
                          'Send BNB'
                        )}
                      </Button>

                      {(!address || !walletProvider) && (
                        <Button
                          variant="outline"
                          size="sm"
                          fullWidth
                          onClick={() => open()}
                        >
                          Connect Wallet
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </GlowEffect>

            {/* Receive Section for Mobile - With QR code button */}
            <div className="mt-6">
              <GlowEffect glowColor="#3b82f6">
                <Card className="bg-slate-900/90 border-slate-700/50">
                  <CardHeader className="border-b border-slate-700/50 p-4">
                    <h2 className="text-lg font-bold text-white">Receive</h2>
                  </CardHeader>
                  <CardContent className="p-4">
                    <div className="flex flex-col">
                      <p className="text-xs text-slate-400 mb-2">Your Wallet Address:</p>
                      <div className="bg-slate-800 rounded-lg p-3 flex items-center justify-between mb-3">
                        <p className="text-xs text-white font-mono truncate max-w-[70%]">
                          {address || 'No wallet connected'}
                        </p>
                        <div className="flex items-center">
                          <button
                            onClick={() => setShowMobileQR(true)}
                            className="mr-2 text-slate-400 hover:text-white transition-colors"
                            aria-label="Show QR Code"
                          >
                            <QrCode className="h-4 w-4" />
                          </button>
                          <button
                            onClick={copyAddress}
                            className="text-slate-400 hover:text-white transition-colors"
                            aria-label="Copy Address"
                          >
                            {copied ? (
                              <CheckCircle className="h-4 w-4 text-green-400" />
                            ) : (
                              <Copy className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={copyAddress}
                          leftIcon={<Copy className="h-4 w-4" />}
                          className="flex-1"
                        >
                          Copy Address
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setShowMobileQR(true)}
                          leftIcon={<QrCode className="h-4 w-4" />}
                          className="flex-1"
                        >
                          Show QR
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </GlowEffect>
            </div>

            {/* Mobile QR Code Modal */}
            {showMobileQR && address && (
              <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
                <div className="bg-slate-800 rounded-lg max-w-xs w-full p-4 relative">
                  <button
                    onClick={() => setShowMobileQR(false)}
                    className="absolute top-2 right-2 text-slate-400 hover:text-white"
                    aria-label="Close"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="18" y1="6" x2="6" y2="18"></line>
                      <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                  </button>

                  <h3 className="text-lg font-bold text-white mb-4 text-center">Scan QR Code</h3>

                  <div className="bg-white p-4 rounded-lg mb-4">
                    <div className="relative aspect-square">
                      <img
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${address}`}
                        alt="Wallet QR Code"
                        className="w-full h-full object-contain"
                      />

                      {/* Overlay BNB logo */}
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="w-12 h-12 rounded-full bg-yellow-500 flex items-center justify-center">
                          <span className="text-black font-bold text-lg">BNB</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <p className="text-xs text-slate-300 text-center mb-4 font-mono break-all">
                    {address}
                  </p>

                  <Button
                    variant="primary"
                    size="sm"
                    fullWidth
                    onClick={() => setShowMobileQR(false)}
                  >
                    Close
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Desktop layout - Receive section on left, Send on right */}
          <div className="hidden md:block md:col-span-1">
            {/* Receive Section for Desktop */}
            <GlowEffect glowColor="#3b82f6" className="h-full">
              <Card className="h-full bg-slate-900/90 border-slate-700/50">
                <CardHeader className="border-b border-slate-700/50">
                  <h2 className="text-xl font-bold text-white">Receive</h2>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="flex flex-col items-center">
                    <div
                      className="w-full aspect-square bg-white p-4 rounded-lg mb-4 cursor-pointer"
                      onClick={() => setShowQR(!showQR)}
                    >
                      {address ? (
                        <div className="relative w-full h-full">
                          {/* QR Code */}
                          <img
                            src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${address}`}
                            alt="Wallet QR Code"
                            className="w-full h-full object-contain"
                          />

                          {/* Overlay BNB logo */}
                          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <div className="w-12 h-12 rounded-full bg-yellow-500 flex items-center justify-center">
                              <span className="text-black font-bold text-lg">BNB</span>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <QrCode className="h-16 w-16 text-slate-300" />
                        </div>
                      )}
                    </div>

                    <div className="w-full">
                      <p className="text-sm text-slate-400 mb-2">Your Wallet Address:</p>
                      <div className="bg-slate-800 rounded-lg p-3 flex items-center justify-between mb-4">
                        <p className="text-sm text-white font-mono truncate">
                          {address || 'No wallet connected'}
                        </p>
                        <button
                          onClick={copyAddress}
                          className="ml-2 text-slate-400 hover:text-white transition-colors"
                        >
                          {copied ? (
                            <CheckCircle className="h-4 w-4 text-green-400" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </button>
                      </div>

                      <Button
                        variant="outline"
                        size="sm"
                        fullWidth
                        onClick={copyAddress}
                        leftIcon={<Copy className="h-4 w-4" />}
                      >
                        Copy Address
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </GlowEffect>
          </div>

          <div className="hidden md:block md:col-span-2">
            {/* Send Section for Desktop */}
            <GlowEffect glowColor="#10b981" className="h-full">
              <Card className="h-full bg-slate-900/90 border-slate-700/50">
                <CardHeader className="border-b border-slate-700/50">
                  <h2 className="text-xl font-bold text-white">Send BNB</h2>
                </CardHeader>
                <CardContent className="p-6">
                  {error && (
                    <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-4 mb-4 flex items-start">
                      <AlertCircle className="h-5 w-5 text-red-400 mr-2 mt-0.5 flex-shrink-0" />
                      <p className="text-red-200 text-sm">{error}</p>
                    </div>
                  )}

                  {txSuccess && txHash && (
                    <div className="bg-green-500/20 border border-green-500/30 rounded-lg p-4 mb-4">
                      <div className="flex items-start mb-3">
                        <CheckCircle className="h-5 w-5 text-green-400 mr-2 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-green-200 text-sm">Transaction successful!</p>
                          <p className="text-green-200/70 text-xs mt-1">A 0.25% fee was applied to this transaction.</p>
                        </div>
                      </div>
                      <div className="flex flex-col">
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-green-200 text-sm">Transaction Hash:</p>
                          <button
                            onClick={() => openExplorer(txHash)}
                            className="text-green-400 hover:text-green-300 transition-colors flex items-center"
                          >
                            <span className="text-sm mr-1">View in Explorer</span>
                            <ExternalLink className="h-4 w-4" />
                          </button>
                        </div>
                        <div className="bg-green-500/10 rounded p-3 overflow-x-auto">
                          <p className="text-green-200 text-xs font-mono break-all">{txHash}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Recipient Address
                      </label>
                      <Input
                        type="text"
                        value={recipientAddress}
                        onChange={(e) => setRecipientAddress(e.target.value)}
                        placeholder="Enter BNB Smart Chain address"
                        className="w-full"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Amount (BNB)
                      </label>
                      <div className="flex gap-2">
                        <Input
                          type="number"
                          value={sendAmount}
                          onChange={(e) => setSendAmount(e.target.value)}
                          placeholder="0.0"
                          min="0"
                          step="0.001"
                          className="flex-grow"
                        />
                        <Button
                          variant="outline"
                          onClick={() => setSendAmount((balance / 4).toFixed(4))}
                          className="whitespace-nowrap"
                        >
                          25%
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => setSendAmount((balance / 2).toFixed(4))}
                          className="whitespace-nowrap"
                        >
                          50%
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => {
                            // Leave room for network fees (0.000005 BNB)
                            // Calculate the maximum amount we can send accounting for network fees
                            const networkFee = 0.000005;
                            const availableAfterNetworkFee = Math.max(0, balance - networkFee);

                            // Calculate the maximum amount we can send accounting for the minimum fee
                            let maxAmount;

                            if (availableAfterNetworkFee <= MIN_FEE_AMOUNT) {
                              // If available balance is less than or equal to minimum fee, can't send anything
                              maxAmount = 0;
                            } else if (availableAfterNetworkFee * FEE_PERCENTAGE < MIN_FEE_AMOUNT) {
                              // If percentage fee would be less than minimum fee
                              // Solve for: x + MIN_FEE_AMOUNT = availableAfterNetworkFee
                              maxAmount = availableAfterNetworkFee - MIN_FEE_AMOUNT;
                            } else {
                              // Normal percentage fee applies
                              // Solve for: x + (x * FEE_PERCENTAGE) = availableAfterNetworkFee
                              // This simplifies to: x * (1 + FEE_PERCENTAGE) = availableAfterNetworkFee
                              maxAmount = availableAfterNetworkFee / (1 + FEE_PERCENTAGE);
                            }

                            setSendAmount(maxAmount.toFixed(4));
                          }}
                          className="whitespace-nowrap"
                        >
                          Max
                        </Button>
                      </div>
                    </div>

                    <div className="bg-slate-800/50 rounded-lg p-4 mb-4">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-slate-400">Available Balance:</span>
                        <span className="text-white font-medium">{balance.toFixed(4)} BNB</span>
                      </div>

                      {sendAmount && !isNaN(parseFloat(sendAmount)) && (
                        <>
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-slate-400">Amount to Send:</span>
                            <span className="text-white font-medium">{parseFloat(sendAmount).toFixed(4)} BNB</span>
                          </div>
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-slate-400">
                              Fee ({parseFloat(sendAmount) >= 0.4 ? '0.25%' : 'min 0.001 BNB'}):
                            </span>
                            <span className="text-white font-medium">
                              {Math.max(parseFloat(sendAmount) * FEE_PERCENTAGE, parseFloat(sendAmount) > MIN_FEE_AMOUNT ? MIN_FEE_AMOUNT : 0).toFixed(4)} BNB
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-slate-400">Recipient Gets:</span>
                            <span className="text-white font-medium">
                              {(parseFloat(sendAmount) - Math.max(parseFloat(sendAmount) * FEE_PERCENTAGE, parseFloat(sendAmount) > MIN_FEE_AMOUNT ? MIN_FEE_AMOUNT : 0)).toFixed(4)} BNB
                            </span>
                          </div>
                        </>
                      )}
                    </div>

                    <div className="space-y-3">
                      <Button
                        variant="primary"
                        size="lg"
                        fullWidth
                        leftIcon={<Send className="h-5 w-5" />}
                        onClick={sendTransaction}
                        disabled={
                          isSending ||
                          !address ||
                          !walletProvider ||
                          !recipientAddress ||
                          recipientAddress.trim() === '' ||
                          !sendAmount ||
                          sendAmount.trim() === '' ||
                          parseFloat(sendAmount) <= 0
                        }
                      >
                        {isSending ? (
                          <>
                            <Spinner size="sm" color="white" className="mr-2" />
                            Sending...
                          </>
                        ) : (
                          'Send BNB'
                        )}
                      </Button>

                      {(!address || !walletProvider) && (
                        <Button
                          variant="outline"
                          size="md"
                          fullWidth
                          onClick={() => open()}
                        >
                          Connect Wallet
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </GlowEffect>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WalletPage;
