import React, { useState, useEffect } from 'react';
import { useAppKit, useAppKitAccount } from '@reown/appkit/react';
import Button from '../ui/Button';
import { Send, RefreshCw, Info, AlertCircle, ArrowRight } from 'lucide-react';

const SendTest: React.FC = () => {
  const { open, getNetwork } = useAppKit();
  const { address, isConnected } = useAppKitAccount();
  const [currentNetwork, setCurrentNetwork] = useState<string>('Loading...');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [appkitInfo, setAppkitInfo] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [features, setFeatures] = useState<any>(null);

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

    // Try to get Appkit info from window object
    try {
      // @ts-ignore
      const appkitInstance = window.appkit || {};
      setAppkitInfo(appkitInstance);
      console.log('Appkit instance:', appkitInstance);

      // Extract features if available
      if (appkitInstance && appkitInstance.options && appkitInstance.options.features) {
        setFeatures(appkitInstance.options.features);
        console.log('Appkit features:', appkitInstance.options.features);
      }
    } catch (err) {
      console.error('Error getting Appkit info:', err);
    }
  }, [getNetwork]);

  const openSendView = () => {
    try {
      // Try to open the modal directly to the Send view
      open({ view: 'Send' });
      console.log('Opening Send view');
    } catch (err) {
      console.error('Error opening Send view:', err);
      setError('Failed to open Send view. See console for details.');
    }
  };

  const openAccountView = () => {
    try {
      // Try to open the modal to the Account view
      open({ view: 'Account' });
      console.log('Opening Account view');
    } catch (err) {
      console.error('Error opening Account view:', err);
      setError('Failed to open Account view. See console for details.');
    }
  };

  const openDefaultView = () => {
    try {
      // Open the default view
      open();
      console.log('Opening default view');
    } catch (err) {
      console.error('Error opening default view:', err);
      setError('Failed to open default view. See console for details.');
    }
  };

  // Try to directly open the send view with a recipient address
  const openSendWithRecipient = () => {
    try {
      // Try to open the send view with a recipient address
      // This is a different approach that might work if the regular send view doesn't
      open({
        view: 'Send',
        options: {
          address: address, // Use the current address as the recipient for testing
          amount: '0.0001', // Small amount for testing
          token: 'SOL' // Solana token
        }
      });
      console.log('Opening Send view with recipient');
    } catch (err) {
      console.error('Error opening Send view with recipient:', err);
      setError('Failed to open Send view with recipient. See console for details.');
    }
  };

  return (
    <div className="p-6 bg-slate-800 rounded-lg border border-slate-700 mb-8">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Send Functionality Test</h2>
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

      {error && (
        <div className="bg-red-500/20 border border-red-500/40 rounded-lg p-4 mb-6 flex items-start">
          <AlertCircle className="h-5 w-5 text-red-400 mr-2 mt-0.5 flex-shrink-0" />
          <p className="text-red-200 text-sm">{error}</p>
        </div>
      )}

      <div className="mb-6">
        <p className="text-slate-300 mb-4">
          This component tests the Send functionality in Appkit. Make sure your wallet is connected before testing.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
            <div className="flex items-center mb-2">
              <Info className="h-5 w-5 text-purple-400 mr-2" />
              <h4 className="font-medium">Connection Status</h4>
            </div>
            <p className={`text-sm ${isConnected ? "text-green-400" : "text-red-400"}`}>
              {isConnected ? "Connected" : "Disconnected"}
            </p>
            {isConnected && address && (
              <p className="text-xs text-slate-400 mt-1 break-all">
                Address: {address}
              </p>
            )}
          </div>

          <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
            <div className="flex items-center mb-2">
              <Info className="h-5 w-5 text-purple-400 mr-2" />
              <h4 className="font-medium">Current Network</h4>
            </div>
            <p className="text-sm text-purple-400">{currentNetwork}</p>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-4 mb-6">
        <Button
          variant="primary"
          size="md"
          leftIcon={<Send className="h-4 w-4" />}
          onClick={openSendView}
        >
          Open Send View
        </Button>

        <Button
          variant="secondary"
          size="md"
          leftIcon={<Send className="h-4 w-4" />}
          onClick={openAccountView}
        >
          Open Account View
        </Button>

        <Button
          variant="tertiary"
          size="md"
          leftIcon={<Send className="h-4 w-4" />}
          onClick={openDefaultView}
        >
          Open Default View
        </Button>

        <Button
          variant="primary"
          size="md"
          leftIcon={<ArrowRight className="h-4 w-4" />}
          onClick={openSendWithRecipient}
        >
          Send With Recipient
        </Button>
      </div>

      <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700 mb-6">
        <h3 className="text-sm font-semibold text-slate-300 mb-2">Features Status</h3>
        <div className="grid grid-cols-2 gap-2">
          <div className="flex items-center">
            <div className={`w-3 h-3 rounded-full mr-2 ${features?.send ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span className="text-xs">Send: {features?.send ? 'Enabled' : 'Disabled'}</span>
          </div>
          <div className="flex items-center">
            <div className={`w-3 h-3 rounded-full mr-2 ${features?.receive ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span className="text-xs">Receive: {features?.receive ? 'Enabled' : 'Disabled'}</span>
          </div>
          <div className="flex items-center">
            <div className={`w-3 h-3 rounded-full mr-2 ${features?.swaps ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span className="text-xs">Swaps: {features?.swaps ? 'Enabled' : 'Disabled'}</span>
          </div>
          <div className="flex items-center">
            <div className={`w-3 h-3 rounded-full mr-2 ${features?.onramp ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span className="text-xs">Onramp: {features?.onramp ? 'Enabled' : 'Disabled'}</span>
          </div>
        </div>
      </div>

      <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700">
        <h3 className="text-sm font-semibold text-slate-300 mb-2">Debug Information</h3>
        <p className="text-xs text-slate-400 mb-2">
          Check the browser console for more detailed information about the Appkit instance.
        </p>
        <pre className="text-xs bg-black/30 p-3 rounded-lg overflow-x-auto max-h-40 overflow-y-auto">
          {JSON.stringify({
            isConnected,
            address: address || null,
            currentNetwork,
            features: features || null,
            appkitInfo: appkitInfo ? 'Available (see console)' : 'Not available'
          }, null, 2)}
        </pre>
      </div>
    </div>
  );
};

export default SendTest;
