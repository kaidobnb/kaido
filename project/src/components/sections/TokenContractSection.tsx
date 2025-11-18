import React from 'react';
import { Copy, ExternalLink, Rocket } from 'lucide-react';
import Button from '../ui/Button';
import GlowEffect from '../effects/GlowEffect';

const TokenContractSection: React.FC = () => {
  const contractAddress = 'SOL123456789abcdefghijklmnopqrstuvwxyz';

  const handleCopyAddress = () => {
    navigator.clipboard.writeText(contractAddress);
    alert('Contract address copied to clipboard!');
  };

  return (
    <section className="py-16 relative overflow-hidden">
      {/* Background with wavy line */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent to-blue-900/20 pointer-events-none"></div>
      <div className="container mx-auto px-6">
        <div className="text-center mb-10">
          <h2 className="handwritten text-5xl text-white mb-4">KAIDO Token</h2>
          <p className="text-xl text-slate-300 max-w-4xl mx-auto">
            The native token powering the KAIDO prediction platform on BNB Chain
          </p>
          <div className="w-full border-b border-gray-300/20 my-8"></div>
        </div>

        {/* Token Info Card - Styled like the prediction boxes */}
        <GlowEffect glowColor="#ec4899">
          <div className="max-w-6xl mx-auto mb-16 bg-white/5 backdrop-blur-sm rounded-xl p-8 border-2 border-gray-300/30">
          <div className="flex flex-col items-center mb-8 gap-6 text-center">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center shadow-lg">
              <span className="handwritten text-white text-4xl">S</span>
            </div>
            <div className="text-center">
              <h3 className="handwritten text-4xl text-white">KAIDO TOKEN</h3>
              <p className="text-slate-300 text-xl">BEP-20 Token on BNB Chain</p>
            </div>
          </div>

          <div className="space-y-8">
            {/* Contract Address - Centered */}
            <div className="mb-6">
              <h4 className="text-base font-medium text-slate-400 mb-3 text-center">Contract Address</h4>
              <div className="max-w-xl mx-auto">
                <div className="flex items-center justify-center">
                  <GlowEffect glowColor="#ec4899" className="w-full max-w-lg">
                    <div className="bg-slate-900/80 rounded-lg p-4 overflow-hidden border border-gray-700">
                      <p className="text-white font-mono text-base truncate text-center">{contractAddress}</p>
                    </div>
                  </GlowEffect>
                  <GlowEffect glowColor="#d946ef">
                    <button
                      className="ml-3 p-4 bg-slate-700 rounded-lg hover:bg-slate-600 transition-colors"
                      onClick={handleCopyAddress}
                    >
                      <Copy className="h-6 w-6 text-slate-300" />
                    </button>
                  </GlowEffect>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <GlowEffect glowColor="#8b5cf6">
                <div className="bg-slate-900/80 rounded-xl p-5 border border-gray-700">
                  <h4 className="text-base font-medium text-slate-400 mb-2">Total Supply</h4>
                  <p className="handwritten text-white text-xl">1,000,000,000 KAIDO</p>
                </div>
              </GlowEffect>
              <GlowEffect glowColor="#3b82f6">
                <div className="bg-slate-900/80 rounded-xl p-5 border border-gray-700">
                  <h4 className="text-base font-medium text-slate-400 mb-2">Launch Platform</h4>
                  <p className="handwritten text-white text-xl">PumpFun</p>
                </div>
              </GlowEffect>
              <GlowEffect glowColor="#10b981">
                <div className="bg-slate-900/80 rounded-xl p-5 border border-gray-700">
                  <h4 className="text-base font-medium text-slate-400 mb-2">Launch Type</h4>
                  <p className="handwritten text-white text-xl">Fair Launch</p>
                </div>
              </GlowEffect>
              <GlowEffect glowColor="#f59e0b">
                <div className="bg-slate-900/80 rounded-xl p-5 border border-gray-700">
                  <h4 className="text-base font-medium text-slate-400 mb-2">Decimals</h4>
                  <p className="handwritten text-white text-xl">9</p>
                </div>
              </GlowEffect>
            </div>

            <div className="pt-4">
              <GlowEffect glowColor="#14b8a6">
                <Button
                  variant="secondary"
                  className="w-full flex items-center justify-center py-4 text-xl handwritten"
                >
                  <Rocket className="h-6 w-6 mr-3" />
                  View on PumpFun
                  <ExternalLink className="h-6 w-6 ml-3" />
                </Button>
              </GlowEffect>
            </div>
          </div>
          </div>
        </GlowEffect>

        {/* Token Utility Section */}
        <div className="mb-8">
          <h3 className="handwritten text-4xl text-white text-center mb-8">Token Utility</h3>
          <div className="w-full border-b border-gray-300/20 mb-10"></div>
        </div>

        {/* Utility Cards - 2x2 Grid with Equal Sizing */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-6xl mx-auto">
          {/* Top Row */}
          <GlowEffect glowColor="#ef4444">
            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-8 border-2 border-gray-300/30 h-full flex flex-col">
              <h4 className="handwritten text-3xl text-white mb-4">Prediction Market Staking</h4>
              <p className="text-slate-300 flex-grow text-lg">
                Stake SOLY tokens to create and participate in prediction markets with reduced fees compared to using SOL.
              </p>
            </div>
          </GlowEffect>

          <GlowEffect glowColor="#6366f1">
            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-8 border-2 border-gray-300/30 h-full flex flex-col">
              <h4 className="handwritten text-3xl text-white mb-4">Governance</h4>
              <p className="text-slate-300 flex-grow text-lg">
                SOLY holders can vote on platform upgrades, fee structures, and new features through our DAO governance system.
              </p>
            </div>
          </GlowEffect>

          {/* Bottom Row */}
          <GlowEffect glowColor="#84cc16">
            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-8 border-2 border-gray-300/30 h-full flex flex-col">
              <h4 className="handwritten text-3xl text-white mb-4">Rewards & Incentives</h4>
              <p className="text-slate-300 flex-grow text-lg">
                Earn SOLY tokens for creating popular prediction markets, maintaining high accuracy, and contributing to the ecosystem.
              </p>
            </div>
          </GlowEffect>

          <GlowEffect glowColor="#14b8a6">
            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-8 border-2 border-gray-300/30 h-full flex flex-col">
              <h4 className="handwritten text-3xl text-white mb-4">Premium Features</h4>
              <p className="text-slate-300 flex-grow text-lg">
                Access advanced analytics, AI-powered insights, and premium features by holding or staking SOLY tokens.
              </p>
            </div>
          </GlowEffect>
        </div>
      </div>
    </section>
  );
};

export default TokenContractSection;
