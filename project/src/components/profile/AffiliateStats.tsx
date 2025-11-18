import React, { useState, useEffect } from 'react';
import { Share2, Users, TrendingUp, DollarSign, RefreshCw, HelpCircle, AlertCircle } from 'lucide-react';
import Card, { CardContent, CardHeader } from '../ui/Card';
import Button from '../ui/Button';
import PlatformReferralLink from './PlatformReferralLink';
import ReferralRewards from './ReferralRewards';
import { getReferralStats, checkReferralStatus } from '../../services/api';
import { useToast } from '../../hooks/useToast';
import { useAuth } from '../../contexts/AuthContext';

interface AffiliateStatsProps {
  stats?: {
    totalReferrals: number;
    totalEarned: {
      BNB?: number;
      SOL?: number; // Legacy compatibility
    };
    activeReferrals: number;
    pendingRewards: {
      BNB?: number;
      SOL?: number; // Legacy compatibility
    };
  };
}

const AffiliateStats: React.FC<AffiliateStatsProps> = ({ stats: initialStats }) => {
  const [stats, setStats] = useState(initialStats || {
    totalReferrals: 0,
    totalEarned: { BNB: 0 },
    activeReferrals: 0,
    pendingRewards: { BNB: 0 }
  });
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [hasReferrer, setHasReferrer] = useState<boolean | null>(null);
  const [referrerName, setReferrerName] = useState<string | null>(null);
  const [isCheckingReferral, setIsCheckingReferral] = useState<boolean>(false);
  const { showToast } = useToast();
  const { userProfile } = useAuth();

  const fetchReferralStats = async () => {
    if (!userProfile) return;

    try {
      setIsLoading(true);
      const response = await getReferralStats();

      if (response && response.success && response.stats) {
        setStats(response.stats);
      } else {
        console.warn('Failed to load referral stats:', response);

        // Use default stats if API call fails
        setStats({
          totalReferrals: 0,
          activeReferrals: 0,
          totalEarned: { BNB: 0 },
          pendingRewards: { BNB: 0 }
        });
      }
    } catch (error) {
      console.error('Error fetching referral stats:', error);

      // Use default stats if API call fails
      setStats({
        totalReferrals: 0,
        activeReferrals: 0,
        totalEarned: { BNB: 0 },
        pendingRewards: { BNB: 0 }
      });

      // Only show toast if it's not an authentication error
      if (!(error instanceof Error && error.message.includes('Authentication'))) {
        showToast({
          type: 'error',
          title: 'Error',
          message: 'Failed to load referral statistics'
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const checkUserReferralStatus = async () => {
    if (!userProfile) return;

    try {
      setIsCheckingReferral(true);
      const response = await checkReferralStatus();

      if (response && response.success) {
        setHasReferrer(response.hasReferrer);
        setReferrerName(response.referrer?.username || null);
        console.log('Referral status checked:', response);
      } else {
        console.warn('Failed to check referral status:', response);
        setHasReferrer(false);
      }
    } catch (error) {
      console.error('Error checking referral status:', error);
      setHasReferrer(false);
    } finally {
      setIsCheckingReferral(false);
    }
  };



  useEffect(() => {
    if (userProfile) {
      fetchReferralStats();
      checkUserReferralStatus();
    }
  }, [userProfile]);
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Share2 className="h-5 w-5 text-purple-400 mr-2" />
            <h3 className="text-lg font-medium text-white">Share & Earn Program</h3>
            <div className="relative ml-2 group">
              <HelpCircle className="h-4 w-4 text-slate-400 cursor-help" />
              <div className="absolute left-0 bottom-full mb-2 w-64 bg-slate-800 p-3 rounded-lg shadow-lg border border-slate-700 hidden group-hover:block z-10">
                <p className="text-xs text-slate-300 mb-2">
                  <strong>Total Referrals:</strong> Users who connected their wallet using your referral link.
                </p>
                <p className="text-xs text-slate-300">
                  <strong>Active Referrals:</strong> Users who have made at least one prediction.
                </p>
              </div>
            </div>
          </div>
          <Button
            variant="tertiary"
            size="sm"
            onClick={fetchReferralStats}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        {!userProfile ? (
          <div className="bg-slate-800 rounded-lg p-4 text-center">
            <p className="text-slate-300">Connect your wallet to view your referral stats</p>
          </div>
        ) : isLoading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
          </div>
        ) : (
          <>
            {hasReferrer === true && referrerName && !isCheckingReferral && (
              <div className="bg-green-900/20 border border-green-700/30 rounded-lg p-4 mb-6">
                <div className="flex items-start">
                  <Users className="w-5 h-5 text-green-400 mr-2 mt-0.5 flex-shrink-0" />
                  <div>
                    <h3 className="text-green-300 font-medium">Referred by {referrerName}</h3>
                    <p className="text-green-200/80 text-sm mt-1">
                      You joined using {referrerName}'s referral link. Both of you received bonus tokens!
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-slate-800 rounded-lg p-4">
                <div className="flex items-center mb-2">
                  <Users className="h-4 w-4 text-slate-400 mr-2" />
                  <span className="text-sm text-slate-400">Total Referrals</span>
                  <span className="ml-1 text-xs text-slate-500">(connected wallet)</span>
                </div>
                <span className="text-2xl font-medium text-white">{stats.totalReferrals}</span>
              </div>

              <div className="bg-slate-800 rounded-lg p-4">
                <div className="flex items-center mb-2">
                  <Users className="h-4 w-4 text-green-400 mr-2" />
                  <span className="text-sm text-green-400">Active Referrals</span>
                  <span className="ml-1 text-xs text-slate-500">(made predictions)</span>
                </div>
                <div className="flex items-center">
                  <span className="text-2xl font-medium text-white">{stats.activeReferrals}</span>
                  {stats.totalReferrals > 0 && (
                    <span className="ml-2 text-xs text-slate-400">
                      ({Math.round((stats.activeReferrals / stats.totalReferrals) * 100)}% conversion)
                    </span>
                  )}
                </div>
              </div>
            </div>

            <h4 className="text-md font-medium text-white mb-3">Total Earnings</h4>
            <div className="bg-slate-800 rounded-lg p-4 mb-4">
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center">
                  <DollarSign className="h-4 w-4 text-yellow-400 mr-2" />
                  <span className="text-sm text-slate-400">BNB Earned</span>
                </div>
                <span className="text-lg font-medium text-white">{(stats.totalEarned.BNB || 0).toFixed(4)} BNB</span>
              </div>

            </div>

            <h4 className="text-md font-medium text-white mb-3">Pending Rewards</h4>
            <div className="bg-slate-800 rounded-lg p-4">
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center">
                  <DollarSign className="h-4 w-4 text-yellow-400 mr-2" />
                  <span className="text-sm text-slate-400">Pending BNB</span>
                </div>
                <span className="text-lg font-medium text-white">{(stats.pendingRewards.BNB || 0).toFixed(4)} BNB</span>
              </div>

            </div>


          </>
        )}

        <div className="mt-6 space-y-6">
          <ReferralRewards onRewardsUpdated={fetchReferralStats} />
          <PlatformReferralLink username={userProfile?.username || 'user'} />
        </div>
      </CardContent>
    </Card>
  );
};

export default AffiliateStats;
