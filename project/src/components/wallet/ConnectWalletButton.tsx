import React, { useState } from 'react';
import { Wallet, ChevronDown, LogOut, ExternalLink, Copy, Check, Network } from 'lucide-react';
import Button from '../ui/Button';
import { useWallet } from '../../contexts/WalletContext';
import { useAppKit } from '@reown/appkit/react';

interface ConnectWalletButtonProps {
  className?: string;
}

const ConnectWalletButton: React.FC<ConnectWalletButtonProps> = ({ className = '' }) => {
  const { wallet, connectWallet, disconnectWallet, isPhantomInstalled, isInitializing } = useWallet();
  const { open } = useAppKit();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleConnect = async () => {
    // We can use either our custom connectWallet function or directly open the Appkit modal
    // Using our custom function maintains compatibility with existing code
    await connectWallet();

    // Alternative: directly use Appkit
    // open();
  };

  const handleDisconnect = () => {
    disconnectWallet();
    setIsDropdownOpen(false);
  };

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  const copyAddress = () => {
    if (wallet.address) {
      navigator.clipboard.writeText(wallet.address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const formatAddress = (address: string) => {
    return `${address.substring(0, 4)}...${address.substring(address.length - 4)}`;
  };

  const openExplorer = () => {
    if (wallet.address) {
      window.open(`https://explorer.solana.com/address/${wallet.address}`, '_blank');
    }
  };

  const openAppkitModal = (view: string) => {
    open({ view });
    setIsDropdownOpen(false);
  };

  // Show loading state during initialization
  if (isInitializing) {
    return (
      <div className={`h-10 w-28 sm:w-36 bg-slate-700 rounded-md animate-pulse ${className}`}></div>
    );
  }

  if (!wallet.connected) {
    return (
      <Button
        variant="primary"
        size="sm"
        leftIcon={<Wallet className="h-4 w-4" />}
        onClick={handleConnect}
        className={`connect-wallet-btn text-xs sm:text-sm md:text-base ${className}`}
        style={{ padding: '0.5rem 0.75rem' }}
      >
        {wallet.connecting ? (
          <span className="whitespace-nowrap">Connecting...</span>
        ) : (
          <>
            <span className="hidden md:inline whitespace-nowrap">Connect Wallet/Signup</span>
            <span className="md:hidden whitespace-nowrap">Connect/Signup</span>
          </>
        )}
      </Button>
    );
  }

  return (
    <div className="relative">
      <Button
        variant="secondary"
        size="md"
        className={`flex items-center ${className}`}
        onClick={toggleDropdown}
      >
        <Wallet className="h-4 w-4 mr-2 text-yellow-400" />
        <span className="mr-1">{formatAddress(wallet.address)}</span>
        <ChevronDown className="h-4 w-4 text-slate-400" />
      </Button>

      {isDropdownOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-slate-800 rounded-lg shadow-lg border border-slate-700 py-3 z-50">
          <div className="px-4 py-2">
            <div className="text-sm text-slate-400">Connected Wallet</div>
            <div className="flex items-center justify-between mt-1">
              <div className="text-white font-medium truncate max-w-[150px]">
                {formatAddress(wallet.address)}
              </div>
              <div className="flex space-x-1">
                <button
                  className="p-1 hover:bg-slate-700 rounded-md transition-colors"
                  onClick={copyAddress}
                  title="Copy address"
                >
                  {copied ? (
                    <Check className="h-4 w-4 text-green-400" />
                  ) : (
                    <Copy className="h-4 w-4 text-slate-400" />
                  )}
                </button>
                <button
                  className="p-1 hover:bg-slate-700 rounded-md transition-colors"
                  onClick={openExplorer}
                  title="View on explorer"
                >
                  <ExternalLink className="h-4 w-4 text-slate-400" />
                </button>
              </div>
            </div>
          </div>

          <div className="px-4 py-2 border-t border-slate-700 mt-2">
            <div className="flex justify-between items-center mb-2">
              <div className="flex items-center">
                <Wallet className="h-4 w-4 text-yellow-400 mr-2" />
                <span className="text-sm text-slate-400">SOL</span>
              </div>
              <span className="text-white font-medium">{wallet.balance.sol.toFixed(4)}</span>
            </div>
            <div className="flex justify-between items-center">
              <div className="flex items-center">
                <div className="h-4 w-4 rounded-full bg-gradient-to-r from-yellow-500 to-yellow-600 mr-2"></div>
                <span className="text-sm text-slate-400">SOLY</span>
              </div>
              <span className="text-white font-medium">{wallet.balance.soly.toLocaleString()}</span>
            </div>
          </div>

          <div className="px-4 py-2 border-t border-slate-700 mt-2">
            <div className="space-y-2">
              <Button
                variant="tertiary"
                size="sm"
                fullWidth
                leftIcon={<Network className="h-4 w-4" />}
                onClick={() => openAppkitModal('Networks')}
                className="justify-start text-slate-300 hover:text-white"
              >
                Switch Network
              </Button>

              <Button
                variant="tertiary"
                size="sm"
                fullWidth
                leftIcon={<Wallet className="h-4 w-4" />}
                onClick={() => openAppkitModal('Account')}
                className="justify-start text-slate-300 hover:text-white"
              >
                Manage Wallet
              </Button>

              <Button
                variant="tertiary"
                size="sm"
                fullWidth
                leftIcon={<LogOut className="h-4 w-4" />}
                onClick={handleDisconnect}
                className="justify-start text-red-400 hover:text-red-300"
              >
                Disconnect
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ConnectWalletButton;
