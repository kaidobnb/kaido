import React, { useState, useEffect } from 'react';
import { useAppKit } from '@reown/appkit/react';
import Button from '../ui/Button';
import { Wallet, ExternalLink, RefreshCw } from 'lucide-react';

interface WalletInfo {
  id: string;
  name: string;
  homepage?: string;
  image_id?: string;
  mobile?: {
    native?: string;
    universal?: string;
  };
  desktop?: {
    native?: string;
    universal?: string;
  };
}

const WalletOptions: React.FC = () => {
  const { open, getWallets } = useAppKit();
  const [wallets, setWallets] = useState<WalletInfo[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchWallets = async () => {
    setLoading(true);
    try {
      const availableWallets = await getWallets();
      console.log('Available wallets:', availableWallets);
      setWallets(availableWallets);
    } catch (error) {
      console.error('Error fetching wallets:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWallets();
  }, [getWallets]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Available Wallet Options</h3>
        <Button
          variant="ghost"
          size="sm"
          leftIcon={<RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />}
          onClick={fetchWallets}
          disabled={loading}
        >
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {wallets.map((wallet) => (
          <div
            key={wallet.id}
            className="bg-black/50 rounded-lg p-4 border border-yellow-500/30 hover:border-yellow-500/70 transition-colors"
          >
            <div className="flex items-center mb-3">
              <div className="w-10 h-10 rounded-lg bg-slate-700 flex items-center justify-center mr-3 overflow-hidden">
                {wallet.image_id ? (
                  <img
                    src={`https://explorer-api.walletconnect.com/v3/logo/lg/${wallet.image_id}`}
                    alt={wallet.name}
                    className="w-full h-full object-contain"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png';
                    }}
                  />
                ) : (
                  <Wallet className="h-5 w-5 text-slate-400" />
                )}
              </div>
              <div>
                <h4 className="font-medium text-white">{wallet.name}</h4>
                <div className="flex items-center mt-1">
                  {wallet.homepage && (
                    <a
                      href={wallet.homepage}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-purple-400 hover:text-purple-300 flex items-center"
                    >
                      Website <ExternalLink className="h-3 w-3 ml-1" />
                    </a>
                  )}
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 mt-3">
              {wallet.mobile?.native && (
                <span className="text-xs bg-green-500/20 text-green-300 px-2 py-0.5 rounded">Mobile</span>
              )}
              {wallet.desktop?.native && (
                <span className="text-xs bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded">Desktop</span>
              )}
              {(wallet.mobile?.universal || wallet.desktop?.universal) && (
                <span className="text-xs bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded">Web</span>
              )}
            </div>
          </div>
        ))}
      </div>

      {wallets.length === 0 && !loading && (
        <div className="text-center py-8 bg-black/30 rounded-lg border border-yellow-500/30">
          <p className="text-white">No wallets found. Try refreshing or check your connection.</p>
        </div>
      )}

      {loading && (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mx-auto"></div>
          <p className="mt-2 text-slate-400">Loading available wallets...</p>
        </div>
      )}

      <div className="mt-6 pt-4 border-t border-slate-700">
        <Button
          variant="primary"
          size="lg"
          leftIcon={<Wallet className="h-5 w-5" />}
          onClick={() => open()}
          className="w-full"
        >
          Open Wallet Selector
        </Button>
        <p className="text-sm text-slate-400 mt-3">
          Click the button above to open the Appkit wallet selector modal with all available options.
        </p>
      </div>
    </div>
  );
};

export default WalletOptions;
