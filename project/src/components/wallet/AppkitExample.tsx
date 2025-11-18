import React, { useState, useEffect } from 'react';
import { useAppKit, useAppKitAccount } from '@reown/appkit/react';
import Button from '../ui/Button';
import { Network, RefreshCw, Wallet } from 'lucide-react';

const AppkitExample: React.FC = () => {
  const { open, getNetwork } = useAppKit();
  const { address, isConnected } = useAppKitAccount();
  const [currentNetwork, setCurrentNetwork] = useState<string>('Loading...');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const fetchNetworkInfo = async () => {
    setIsLoading(true);
    try {
      // Get current network
      const network = await getNetwork();
      if (network) {
        setCurrentNetwork(network.name || 'Unknown');
        console.log('Current Appkit network:', network);
      } else {
        setCurrentNetwork('No network selected');
      }
    } catch (error) {
      console.error('Error fetching network info:', error);
      setCurrentNetwork('Error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchNetworkInfo();
    // Set up an interval to refresh network info
    const intervalId = setInterval(fetchNetworkInfo, 10000);
    return () => clearInterval(intervalId);
  }, [getNetwork]);

  return (
    <div className="p-6 bg-slate-800 rounded-lg border border-slate-700 mb-8">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Appkit Integration Example</h2>
        <Button
          variant="ghost"
          size="sm"
          leftIcon={<RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />}
          onClick={fetchNetworkInfo}
          disabled={isLoading}
        >
          Refresh
        </Button>
      </div>

      <div className="mb-6">
        <p className="text-slate-300 mb-4">
          This example demonstrates direct usage of Appkit hooks and components.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
            <div className="flex items-center mb-2">
              <Wallet className="h-5 w-5 text-purple-400 mr-2" />
              <h4 className="font-medium">Connection Status</h4>
            </div>
            <p className={`text-sm ${isConnected ? "text-green-400" : "text-red-400"}`}>
              {isConnected ? "Connected" : "Disconnected"}
            </p>
          </div>

          <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
            <div className="flex items-center mb-2">
              <Network className="h-5 w-5 text-purple-400 mr-2" />
              <h4 className="font-medium">Current Network</h4>
            </div>
            <p className="text-sm text-purple-400">{currentNetwork}</p>
          </div>
        </div>

        {isConnected && address && (
          <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700 mb-4">
            <div className="flex items-center mb-2">
              <Wallet className="h-5 w-5 text-purple-400 mr-2" />
              <h4 className="font-medium">Wallet Address</h4>
            </div>
            <p className="text-sm text-slate-300 break-all">{address}</p>
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-4">
        <Button
          variant="primary"
          size="md"
          leftIcon={<Wallet className="h-4 w-4" />}
          onClick={() => open()}
        >
          Open Appkit Modal
        </Button>

        <Button
          variant="secondary"
          size="md"
          leftIcon={<Network className="h-4 w-4" />}
          onClick={() => open({ view: 'Networks' })}
        >
          Select Network
        </Button>

        {isConnected && (
          <Button
            variant="tertiary"
            size="md"
            leftIcon={<Wallet className="h-4 w-4" />}
            onClick={() => open({ view: 'Account' })}
          >
            Manage Account
          </Button>
        )}
      </div>

      <div className="mt-6 pt-4 border-t border-slate-700">
        <h3 className="text-lg font-semibold mb-2">Web Component Example</h3>
        <p className="text-slate-400 text-sm mb-4">
          Appkit also provides web components that can be used directly in your JSX:
        </p>
        <div className="flex flex-wrap gap-4">
          <appkit-button />
          <appkit-button view="Networks">Select Network</appkit-button>
        </div>

        <div className="mt-4 p-4 bg-slate-800/30 rounded-lg border border-slate-700/50">
          <p className="text-sm text-slate-400">
            <strong>Note:</strong> Make sure your wallet is connected to the same network as selected in Appkit.
            The current network shown above should match your wallet's network (Devnet, Testnet, or Mainnet).
          </p>
        </div>
      </div>
    </div>
  );
};

export default AppkitExample;
