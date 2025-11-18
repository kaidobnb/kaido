import React, { useState, useEffect } from 'react';
import { useAppKit } from '@reown/appkit/react';
import { useAccount } from 'wagmi';
import { Network } from 'lucide-react';

const NetworkIndicator: React.FC = () => {
  const [networkName, setNetworkName] = useState<string>('Unknown');
  const [networkType, setNetworkType] = useState<'mainnet' | 'testnet' | 'devnet' | 'unknown'>('unknown');
  const { chain } = useAccount();

  useEffect(() => {
    // Function to get the current network
    const getCurrentNetwork = async () => {
      try {
        if (connection) {
          const endpoint = connection.rpcEndpoint;
          console.log('Current endpoint:', endpoint);

          // Determine network type and name based on endpoint
          if (endpoint.includes('devnet')) {
            setNetworkName('Solana Devnet');
            setNetworkType('devnet');
          } else if (endpoint.includes('testnet')) {
            setNetworkName('Solana Testnet');
            setNetworkType('testnet');
          } else if (endpoint.includes('mainnet')) {
            setNetworkName('Solana Mainnet');
            setNetworkType('mainnet');
          } else {
            setNetworkName('Solana');
            setNetworkType('unknown');
          }
        } else {
          setNetworkName('Solana Devnet');
          setNetworkType('devnet');
        }
      } catch (error) {
        console.error('Error getting network:', error);
        setNetworkName('Solana');
        setNetworkType('devnet');
      }
    };

    getCurrentNetwork();

    // Set up an interval to check the network periodically
    const intervalId = setInterval(getCurrentNetwork, 5000);

    return () => {
      clearInterval(intervalId);
    };
  }, [connection]);

  // Get color based on network type
  const getNetworkColor = () => {
    switch (networkType) {
      case 'mainnet':
        return 'text-green-400';
      case 'testnet':
        return 'text-yellow-400';
      case 'devnet':
        return 'text-purple-400';
      default:
        return 'text-slate-400';
    }
  };

  return (
    <div className="flex items-center justify-center bg-slate-800/50 rounded-md w-8 h-8">
      <Network className={`h-4 w-4 ${getNetworkColor()}`} />
    </div>
  );
};

export default NetworkIndicator;
