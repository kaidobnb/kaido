import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Gift, Coins, RefreshCw, List } from 'lucide-react';
import Card, { CardContent, CardHeader } from '../ui/Card';
import Avatar from '../ui/Avatar';
import Button from '../ui/Button';
import { getReferralStats } from '../../services/api';
import { useToast } from '../../hooks/useToast';
import ReferralListModal from './ReferralListModal';

interface ReferralStatsProps {
  className?: string;
}

interface ReferredUser {
  id: string;
  username: string;
  avatar?: string;
  joinedAt: string;
}

interface ReferralStatsData {
  totalReferrals: number;
  activeReferrals: number;
  totalEarned: {
    SOL: number;
    BNB: number;
    KAIDO: number;
  };
  pendingRewards: {
    SOL: number;
    BNB: number;
    KAIDO: number;
  };
}

const ReferralStats: React.FC<ReferralStatsProps> = ({ className = '' }) => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<ReferralStatsData | null>(null);
  const [referredUsers, setReferredUsers] = useState<ReferredUser[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const { showToast } = useToast();

  const fetchReferralStats = async () => {
    try {
      setIsLoading(true);
      const response = await getReferralStats();

      if (response && response.success) {
        setStats(response.stats);
        setReferredUsers(response.referredUsers || []);
      } else {
        // Only show error toast if there's a specific error message
        if (response && response.message && response.message !== 'User not authenticated') {
          showToast({
            type: 'error',
            title: 'Error',
            message: 'Failed to load referral statistics'
          });
        }
      }
    } catch (error) {
      console.error('Error fetching referral stats:', error);
      // Don't show error toast for authentication errors
      const errorMessage = error instanceof Error ? error.message : '';
      if (!errorMessage.includes('not authenticated') && !errorMessage.includes('unauthorized')) {
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



  useEffect(() => {
    fetchReferralStats();
  }, []);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Users className="h-5 w-5 text-purple-400 mr-2" />
            <h3 className="text-lg font-medium text-white">Your Referrals</h3>
          </div>
          <Button
            variant="tertiary"
            size="sm"
            onClick={fetchReferralStats}
            disabled={isLoading}
          >
            <RefreshCw className="h-4 w-4 mr-1" />
            Refresh
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
          </div>
        ) : !stats ? (
          <div className="text-center py-8">
            <p className="text-slate-400">No referral data available</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-slate-800 rounded-lg p-4">
                <div className="flex items-center mb-2">
                  <Users className="h-5 w-5 text-purple-400 mr-2" />
                  <span className="text-slate-300 text-sm">Total Referrals</span>
                </div>
                <div className="text-2xl font-bold text-white">{stats.totalReferrals}</div>
              </div>

              <div className="bg-slate-800 rounded-lg p-4">
                <div className="flex items-center mb-2">
                  <Gift className="h-5 w-5 text-green-400 mr-2" />
                  <span className="text-slate-300 text-sm">Active Referrals</span>
                </div>
                <div className="text-2xl font-bold text-white">{stats.activeReferrals}</div>
              </div>
            </div>

            <div className="bg-slate-800 rounded-lg p-4 mb-6">
              <h4 className="text-white font-medium mb-3">Earnings</h4>

              <div className="space-y-3">
                {/* KAIDO Rewards (Primary) */}
                <div className="flex justify-between items-center">
                  <span className="text-slate-300">Total KAIDO Earned:</span>
                  <span className="text-white font-medium">{stats.totalEarned.KAIDO.toFixed(0)} KAIDO</span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-slate-300">Pending KAIDO:</span>
                  <span className="text-white font-medium">{stats.pendingRewards.KAIDO.toFixed(0)} KAIDO</span>
                </div>

                {/* BNB Rewards */}
                {(stats.totalEarned.BNB > 0 || stats.pendingRewards.BNB > 0) && (
                  <>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-300">Total BNB Earned:</span>
                      <span className="text-white font-medium">{stats.totalEarned.BNB.toFixed(4)} BNB</span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-slate-300">Pending BNB:</span>
                      <span className="text-white font-medium">{stats.pendingRewards.BNB.toFixed(4)} BNB</span>
                    </div>
                  </>
                )}

                {/* SOL Rewards (Legacy) */}
                {(stats.totalEarned.SOL > 0 || stats.pendingRewards.SOL > 0) && (
                  <>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-300">Total SOL Earned:</span>
                      <span className="text-white font-medium">{stats.totalEarned.SOL.toFixed(4)} SOL</span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-slate-300">Pending SOL:</span>
                      <span className="text-white font-medium">{stats.pendingRewards.SOL.toFixed(4)} SOL</span>
                    </div>
                  </>
                )}

                {(stats.pendingRewards.KAIDO > 0 || stats.pendingRewards.BNB > 0 || stats.pendingRewards.SOL > 0) && (
                  <div className="mt-3 pt-3 border-t border-slate-700">
                    <div className="flex items-center justify-between">
                      <span className="text-emerald-400 text-sm">Rewards Available!</span>
                      <button
                        onClick={() => navigate('/profile/rewards')}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white text-sm py-1 px-3 rounded transition-colors"
                      >
                        Claim Rewards
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between mb-3">
              <h4 className="text-white font-medium">Referred Users</h4>
              {referredUsers.length > 0 && (
                <Button
                  variant="tertiary"
                  size="sm"
                  onClick={() => setIsModalOpen(true)}
                >
                  <List className="h-4 w-4 mr-1" />
                  Show All
                </Button>
              )}
            </div>
            <div className="mb-3 text-center">
              <button
                onClick={() => setIsModalOpen(true)}
                className="text-purple-400 hover:text-purple-300 text-sm underline transition-colors"
              >
                {referredUsers.length > 0 ? 'View all your referrals' : 'Check your referrals'}
              </button>
            </div>

            {referredUsers.length === 0 ? (
              <div className="bg-slate-800 rounded-lg p-4 text-center">
                <p className="text-slate-400">You haven't referred any users yet</p>
              </div>
            ) : (
              <div className="space-y-2">
                {/* Show only the first 3 users in the main view */}
                {referredUsers.slice(0, 3).map(user => (
                  <div key={user.id} className="bg-slate-800 rounded-lg p-3 flex items-center">
                    <Avatar
                      src={user.avatar || '/images/default-avatar.png'}
                      alt={user.username || 'Anonymous'}
                      size="sm"
                      className="mr-3"
                    />
                    <div className="flex-grow">
                      <div className="text-white font-medium">{user.username || 'Anonymous'}</div>
                      <div className="text-xs text-slate-400">Joined {formatDate(user.joinedAt)}</div>
                    </div>
                  </div>
                ))}

                {referredUsers.length > 3 && (
                  <div className="text-center mt-2">
                    <button
                      onClick={() => setIsModalOpen(true)}
                      className="text-sm text-purple-400 hover:text-purple-300 transition-colors"
                    >
                      + {referredUsers.length - 3} more referrals
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Referral List Modal */}
            <ReferralListModal
              isOpen={isModalOpen}
              onClose={() => setIsModalOpen(false)}
              referredUsers={referredUsers}
            />
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default ReferralStats;
