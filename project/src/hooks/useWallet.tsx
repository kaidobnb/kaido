import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAppKitAccount, useAppKit } from '@reown/appkit/react';
import { useAccount, useBalance } from 'wagmi';

interface WalletContextType {
  wallet: {
    connected: boolean;
    address: string | null;
    balance: {
      BNB: number;
      KAIDO: number;
    };
  };
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
  isConnecting: boolean;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export const WalletProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { address, isConnected } = useAppKitAccount();
  const { open } = useAppKit();
  const account = useAccount();

  const [isConnecting, setIsConnecting] = useState<boolean>(false);
  const [wallet, setWallet] = useState<WalletContextType['wallet']>({
    connected: false,
    address: null,
    balance: {
      BNB: 0,
      KAIDO: 100, // Default KAIDO balance for testing
    },
  });

  // Update wallet state when connection changes
  useEffect(() => {
    if (isConnected && address) {
      setWallet(prev => ({
        ...prev,
        connected: true,
        address,
      }));
    } else {
      setWallet(prev => ({
        ...prev,
        connected: false,
        address: null,
      }));
    }
  }, [isConnected, address]);

  const connectWallet = async () => {
    try {
      setIsConnecting(true);
      // Open Appkit modal
      open();
    } catch (error) {
      console.error('Error connecting wallet:', error);
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnectWallet = () => {
    try {
      // Open account view to disconnect
      open({ view: 'Account' });

      setWallet({
        connected: false,
        address: null,
        balance: {
          BNB: 0,
          KAIDO: 0,
        },
      });
    } catch (error) {
      console.error('Error disconnecting wallet:', error);
    }
  };

  return (
    <WalletContext.Provider value={{ wallet, connectWallet, disconnectWallet, isConnecting }}>
      {children}
    </WalletContext.Provider>
  );
};

export const useWallet = (): WalletContextType => {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
};

export default useWallet;
