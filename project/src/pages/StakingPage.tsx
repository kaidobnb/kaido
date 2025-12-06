import React, { useCallback } from 'react';
import { Coins, Users, TrendingUp, Shield, Info, Globe, Layers, Zap } from 'lucide-react';
import { StakeCard, UnstakeCard, RewardsCard, ActivityFeed } from '../components/staking';
import { useVaultTVL, useUserStake, usePendingRewards } from '../hooks/useVault';
import { useWallet } from '../contexts/WalletContext';
import { Spinner } from '../components/ui/Spinner';
import GlowEffect from '../components/effects/GlowEffect';

const StakingPage: React.FC = () => {
  const { wallet } = useWallet();
  const vaultStats = useVaultTVL();
  const userStake = useUserStake();
  const pendingRewards = usePendingRewards();

  const handleRefreshData = useCallback(() => {
    userStake.refetch();
    pendingRewards.refetch();
  }, [userStake, pendingRewards]);

  const stats = [
    {
      label: 'Total Vault TVL',
      value: vaultStats.isLoading ? null : `${vaultStats.totalTVL.toFixed(2)} BNB`,
      icon: Coins,
      color: 'text-yellow-400',
      bgColor: 'bg-yellow-500/10',
      borderColor: 'border-yellow-500/30',
    },
    {
      label: 'Your Staked BNB',
      value: !wallet.connected ? '—' : userStake.isLoading ? null : `${userStake.stakedAmount.toFixed(4)} BNB`,
      icon: TrendingUp,
      color: 'text-purple-400',
      bgColor: 'bg-purple-500/10',
      borderColor: 'border-purple-500/30',
    },
    {
      label: 'Pending Rewards',
      value: !wallet.connected ? '—' : pendingRewards.isLoading ? null : `${pendingRewards.totalRewards.toFixed(4)} BNB`,
      icon: Shield,
      color: 'text-green-400',
      bgColor: 'bg-green-500/10',
      borderColor: 'border-green-500/30',
    },
    {
      label: 'Total Stakers',
      value: vaultStats.isLoading ? null : vaultStats.totalStakers.toLocaleString(),
      icon: Users,
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/10',
      borderColor: 'border-blue-500/30',
    },
  ];

  return (
    <div className="min-h-screen bg-black pb-20 md:pb-8">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-yellow-950/20 to-slate-900"></div>
        <div className="absolute inset-0 bg-gradient-to-tr from-purple-950/20 via-transparent to-blue-950/20"></div>
        
        <div className="relative max-w-7xl mx-auto px-4 py-8 md:py-16">
          {/* Title */}
          <div className="text-center mb-8 md:mb-12">
            <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold text-white mb-3 md:mb-4">
              <span className="text-yellow-400">💎</span> KAIDO LP Vault
            </h1>
            <p className="text-lg md:text-2xl text-slate-300 font-medium">
              Stake BNB. Boost KAIDO. Earn Rewards.
            </p>
            <p className="text-sm md:text-base text-slate-400 mt-2 max-w-2xl mx-auto">
              Deposit BNB into the unified LP vault and earn real yield from three revenue engines
            </p>
          </div>

          {/* Hero Narrative - First Consumer-Layer LP */}
          <div className="w-full mb-6 md:mb-10">
            <GlowEffect glowColor="#eab308">
              <div className="bg-gradient-to-r from-yellow-950/40 via-slate-900/80 to-purple-950/40 border border-yellow-500/30 rounded-xl md:rounded-2xl p-4 md:p-5">
                <div className="flex items-start gap-3 md:gap-4">
                  <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-yellow-500/20 flex items-center justify-center flex-shrink-0">
                    <Zap className="w-5 h-5 md:w-6 md:h-6 text-yellow-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h2 className="text-base md:text-lg lg:text-xl font-bold text-white mb-2">
                      🚀 The First Consumer-Layer LP in Prediction Markets
                    </h2>
                    <p className="text-xs md:text-sm text-slate-300 leading-relaxed">
                      Traditionally, only <span className="text-yellow-400 font-medium">institutional players</span> could be LPs in prediction markets. <span className="text-purple-400 font-medium">KAIDO changes that</span>—we're democratizing LP access through DeFi staking. Now <span className="text-green-400 font-medium">anyone with BNB</span> can stake and earn yields. No minimums, no complex setups—just connect and start earning.
                    </p>
                  </div>
                </div>
              </div>
            </GlowEffect>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
            {stats.map((stat) => {
              const Icon = stat.icon;
              return (
                <GlowEffect key={stat.label} glowColor={stat.color.replace('text-', '#').replace('-400', '')}>
                  <div className={`${stat.bgColor} ${stat.borderColor} border rounded-xl md:rounded-2xl p-3 md:p-5 text-center`}>
                    <div className={`w-8 h-8 md:w-10 md:h-10 rounded-full ${stat.bgColor} flex items-center justify-center mx-auto mb-2 md:mb-3`}>
                      <Icon className={`w-4 h-4 md:w-5 md:h-5 ${stat.color}`} />
                    </div>
                    <p className="text-[10px] md:text-xs text-slate-400 mb-1">{stat.label}</p>
                    {stat.value === null ? (
                      <Spinner size="sm" color="yellow" />
                    ) : (
                      <p className="text-base md:text-xl font-bold text-white truncate">{stat.value}</p>
                    )}
                  </div>
                </GlowEffect>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-6 md:py-10">
        {/* Staking Cards Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6 mb-6 md:mb-8">
          <StakeCard onStakeSuccess={handleRefreshData} />
          <UnstakeCard onUnstakeSuccess={handleRefreshData} />
          <RewardsCard onClaimSuccess={handleRefreshData} />
        </div>

        {/* Activity Feed */}
        <div className="mb-6 md:mb-8">
          <ActivityFeed />
        </div>

        {/* Safety Disclaimer */}
        <div className="bg-slate-900/50 border border-slate-700/50 rounded-xl p-4 md:p-6 mb-6 md:mb-8">
          <div className="flex items-start gap-3 md:gap-4">
            <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0">
              <Info className="w-5 h-5 md:w-6 md:h-6 text-blue-400" />
            </div>
            <div>
              <h3 className="text-base md:text-lg font-semibold text-white mb-2">Safety & Transparency</h3>
              <p className="text-xs md:text-sm text-slate-400 leading-relaxed">
                💎 <strong className="text-slate-300">LP funds are never used for payouts or prediction risk.</strong> Your staked BNB is securely held in the vault smart contract and only earns yield from platform revenue. The vault operates independently from the prediction market payouts, ensuring your principal is protected.
              </p>
            </div>
          </div>
        </div>

        {/* Future Vision Section */}
        <GlowEffect glowColor="#8b5cf6">
          <div className="bg-gradient-to-br from-purple-950/50 via-slate-900/80 to-blue-950/50 border border-purple-500/30 rounded-xl md:rounded-2xl p-4 md:p-5">
            {/* Header */}
            <div className="flex items-start gap-3 md:gap-4 mb-4">
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                <Globe className="w-5 h-5 md:w-6 md:h-6 text-purple-400" />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-base md:text-lg lg:text-xl font-bold text-white mb-1">
                  🌍 Our Vision: The Universal Staking Layer
                </h2>
                <p className="text-xs md:text-sm text-slate-400">
                  KAIDO LP Vault is just the beginning of a much bigger mission
                </p>
              </div>
            </div>

            {/* Phase Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
              <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-6 h-6 rounded-full bg-yellow-500/20 flex items-center justify-center">
                    <span className="text-yellow-400 font-bold text-xs">1</span>
                  </div>
                  <h3 className="text-sm md:text-base font-semibold text-white">Now: KAIDO LP</h3>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Launching with <span className="text-yellow-400">KAIDO prediction market staking</span>—the first consumer-accessible LP. Stake BNB and earn from three revenue engines.
                </p>
              </div>

              <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-6 h-6 rounded-full bg-purple-500/20 flex items-center justify-center">
                    <span className="text-purple-400 font-bold text-xs">2</span>
                  </div>
                  <h3 className="text-sm md:text-base font-semibold text-white">Next: Multi-Platform</h3>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Building partnerships for <span className="text-purple-400">Polymarket, Kalshi, and other markets</span>. One protocol, multiple LP opportunities.
                </p>
              </div>

              <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center">
                    <Layers className="w-3 h-3 text-green-400" />
                  </div>
                  <h3 className="text-sm md:text-base font-semibold text-white">Goal: Universal Layer</h3>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Position <span className="text-green-400">KAIDO as the universal staking layer</span> for the entire prediction market ecosystem.
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="text-center">
              <p className="text-xs md:text-sm text-slate-300">
                🔗 <span className="text-purple-400 font-medium">Stake once, earn everywhere.</span> That's the future we're building.
              </p>
            </div>
          </div>
        </GlowEffect>
      </div>
    </div>
  );
};

export default StakingPage;

