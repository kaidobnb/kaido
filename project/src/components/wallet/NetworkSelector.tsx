import React from 'react';
import { useAppKit } from '@reown/appkit/react';
import Button from '../ui/Button';
import { Network } from 'lucide-react';

const NetworkSelector: React.FC = () => {
  const { open } = useAppKit();

  const openNetworkSelector = () => {
    // Open the Appkit modal with the Networks view
    open({ view: 'Networks' });
  };

  return (
    <div className="p-4 bg-slate-800 rounded-lg border border-slate-700 mb-4">
      <h3 className="text-lg font-semibold mb-3">Network Selection</h3>
      
      <p className="text-sm text-slate-300 mb-4">
        You can switch between Solana networks (Devnet, Testnet, Mainnet) to match your wallet's network.
      </p>
      
      <Button
        variant="secondary"
        size="md"
        leftIcon={<Network className="h-4 w-4" />}
        onClick={openNetworkSelector}
      >
        Select Network
      </Button>
      
      <div className="mt-3 text-xs text-slate-400">
        <p>Make sure your wallet is connected to the same network as selected in Appkit.</p>
      </div>
    </div>
  );
};

export default NetworkSelector;
