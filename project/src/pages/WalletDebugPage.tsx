import React from 'react';
import Card, { CardContent, CardHeader } from '../components/ui/Card';
import { useWallet } from '../contexts/WalletContext';
import BalanceDebugger from '../components/wallet/BalanceDebugger';
import NetworkSelector from '../components/wallet/NetworkSelector';
import AppkitExample from '../components/wallet/AppkitExample';
import SendTest from '../components/wallet/SendTest';
import WalletOptions from '../components/wallet/WalletOptions';
import WalletBalances from '../components/wallet/WalletBalances';
import ApiTester from '../components/debug/ApiTester';
import { Wallet, Network } from 'lucide-react';

const WalletDebugPage: React.FC = () => {
  const { wallet } = useWallet();

  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold text-white mb-8">Wallet Debugging</h1>

      <div className="grid grid-cols-1 gap-6">
        <Card>
          <CardHeader>
            <h2 className="text-xl font-bold text-white">Wallet Connection Status</h2>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center">
                <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center mr-3">
                  <Wallet className="h-5 w-5 text-purple-400" />
                </div>
                <div>
                  <p className="text-white text-sm font-medium">Connection Status</p>
                  <p className={`text-sm ${wallet.connected ? 'text-green-400' : 'text-red-400'}`}>
                    {wallet.connected ? 'Connected' : 'Disconnected'}
                  </p>
                </div>
              </div>

              {wallet.connected && (
                <>
                  <div className="flex items-center">
                    <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center mr-3">
                      <Network className="h-5 w-5 text-purple-400" />
                    </div>
                    <div>
                      <p className="text-white text-sm font-medium">Wallet Address</p>
                      <p className="text-sm text-slate-300 break-all">{wallet.address}</p>
                    </div>
                  </div>

                  <div className="flex items-center">
                    <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center mr-3">
                      <svg className="h-5 w-5 text-purple-400" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M15 9H9V15H15V9Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                    <div>
                      <p className="text-white text-sm font-medium">SOL Balance (from Appkit)</p>
                      <p className="text-sm text-slate-300">{wallet.balance.sol} SOL</p>
                    </div>
                  </div>

                  <div className="flex items-center">
                    <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center mr-3">
                      <svg className="h-5 w-5 text-purple-400" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M8 14L12 10L16 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                    <div>
                      <p className="text-white text-sm font-medium">SOLY Balance</p>
                      <p className="text-sm text-slate-300">{wallet.balance.soly} SOLY</p>
                    </div>
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        <NetworkSelector />

        <WalletBalances />

        <BalanceDebugger />

        <Card>
          <CardHeader>
            <h2 className="text-xl font-bold text-white">Appkit Integration</h2>
          </CardHeader>
          <CardContent>
            <AppkitExample />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="text-xl font-bold text-white">Send Functionality Test</h2>
          </CardHeader>
          <CardContent>
            <SendTest />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="text-xl font-bold text-white">Wallet Options</h2>
          </CardHeader>
          <CardContent>
            <WalletOptions />
          </CardContent>
        </Card>

        <ApiTester />
      </div>
    </div>
  );
};

export default WalletDebugPage;
