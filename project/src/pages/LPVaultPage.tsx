import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import * as lpVaultService from '../services/lpVaultService';

export default function LPVaultPage() {
  const { address } = useAccount();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<lpVaultService.VaultStats | null>(null);
  const [userInfo, setUserInfo] = useState<lpVaultService.UserLPInfo | null>(null);

  useEffect(() => {
    loadVaultData();
  }, [address]);

  const loadVaultData = async () => {
    try {
      setLoading(true);
      const vaultStats = await lpVaultService.getVaultStats();
      setStats(vaultStats);

      if (address) {
        const userLPInfo = await lpVaultService.getUserLPInfo(address);
        setUserInfo(userLPInfo);
      }
    } catch (error) {
      console.error('Error loading vault data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading LP Vault...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">
            🏦 LP Vault Dashboard
          </h1>
          <p className="text-gray-300 text-lg">
            Attention Liquidity Pool - Dual Vault System
          </p>
        </div>

        {/* Vault Balances */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
            <div className="text-blue-400 text-sm font-semibold mb-2">Boost Vault (70%)</div>
            <div className="text-3xl font-bold text-white">
              {parseFloat(stats?.balances.boostVault || '0').toFixed(4)} BNB
            </div>
            <div className="text-gray-400 text-sm mt-2">For KAIDO-created markets</div>
          </div>

          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
            <div className="text-orange-400 text-sm font-semibold mb-2">Creator Vault (30%)</div>
            <div className="text-3xl font-bold text-white">
              {parseFloat(stats?.balances.creatorVault || '0').toFixed(4)} BNB
            </div>
            <div className="text-gray-400 text-sm mt-2">For partnerships & campaigns</div>
          </div>

          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
            <div className="text-green-400 text-sm font-semibold mb-2">Total Staked</div>
            <div className="text-3xl font-bold text-white">
              {parseFloat(stats?.balances.total || '0').toFixed(4)} BNB
            </div>
            <div className="text-gray-400 text-sm mt-2">Combined vault balance</div>
          </div>
        </div>

        {/* Yield Breakdown */}
        <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20 mb-8">
          <h2 className="text-2xl font-bold text-white mb-6">💰 Yield Breakdown</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <div className="text-blue-400 text-sm font-semibold mb-1">KAIDO Boost Yield</div>
              <div className="text-2xl font-bold text-white">
                {parseFloat(stats?.yieldBreakdown.boostYield || '0').toFixed(6)} BNB
              </div>
              <div className="text-gray-400 text-xs mt-1">30% of treasury fees</div>
            </div>

            <div>
              <div className="text-orange-400 text-sm font-semibold mb-1">Creator Backing Yield</div>
              <div className="text-2xl font-bold text-white">
                {parseFloat(stats?.yieldBreakdown.creatorYield || '0').toFixed(6)} BNB
              </div>
              <div className="text-gray-400 text-xs mt-1">30% of creator + affiliate fees</div>
            </div>

            <div>
              <div className="text-purple-400 text-sm font-semibold mb-1">Engagement Yield</div>
              <div className="text-2xl font-bold text-white">
                {parseFloat(stats?.yieldBreakdown.engagementYield || '0').toFixed(6)} BNB
              </div>
              <div className="text-gray-400 text-xs mt-1">30% of campaign fees</div>
            </div>

            <div>
              <div className="text-green-400 text-sm font-semibold mb-1">Total Yield</div>
              <div className="text-2xl font-bold text-white">
                {parseFloat(stats?.yieldBreakdown.totalYield || '0').toFixed(6)} BNB
              </div>
              <div className="text-gray-400 text-xs mt-1">All yield sources combined</div>
            </div>
          </div>
        </div>

        {/* User Info (if connected) */}
        {address && userInfo && (
          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
            <h2 className="text-2xl font-bold text-white mb-6">👤 Your LP Position</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <div className="text-gray-400 text-sm mb-1">Your Balance</div>
                <div className="text-xl font-bold text-white">
                  {parseFloat(userInfo.balance).toFixed(4)} BNB
                </div>
              </div>

              <div>
                <div className="text-gray-400 text-sm mb-1">Claimable Rewards</div>
                <div className="text-xl font-bold text-green-400">
                  {parseFloat(userInfo.claimableRewards).toFixed(6)} BNB
                </div>
              </div>

              <div>
                <div className="text-gray-400 text-sm mb-1">Already Claimed</div>
                <div className="text-xl font-bold text-white">
                  {parseFloat(userInfo.claimed).toFixed(6)} BNB
                </div>
              </div>

              <div>
                <button className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold py-3 px-6 rounded-lg hover:from-green-600 hover:to-emerald-700 transition-all">
                  Claim Rewards
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

