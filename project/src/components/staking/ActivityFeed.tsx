import React from 'react';
import { Activity, ArrowUpCircle, ArrowDownCircle, Gift, Coins, ExternalLink } from 'lucide-react';
import Card, { CardContent, CardHeader } from '../ui/Card';
import GlowEffect from '../effects/GlowEffect';
import { Spinner } from '../ui/Spinner';
import { useWallet } from '../../contexts/WalletContext';
import { useVaultActivity, ActivityItem } from '../../hooks/useVault';

const ActivityFeed: React.FC = () => {
  const { wallet } = useWallet();
  const { activities, isLoading, error } = useVaultActivity();

  const getActivityIcon = (type: ActivityItem['type']) => {
    switch (type) {
      case 'stake':
        return <ArrowUpCircle className="w-4 h-4 md:w-5 md:h-5 text-yellow-400" />;
      case 'unstake':
        return <ArrowDownCircle className="w-4 h-4 md:w-5 md:h-5 text-purple-400" />;
      case 'claim':
        return <Gift className="w-4 h-4 md:w-5 md:h-5 text-green-400" />;
      case 'reward':
        return <Coins className="w-4 h-4 md:w-5 md:h-5 text-blue-400" />;
      default:
        return <Activity className="w-4 h-4 md:w-5 md:h-5 text-slate-400" />;
    }
  };

  const getActivityLabel = (type: ActivityItem['type']) => {
    switch (type) {
      case 'stake':
        return 'Staked BNB';
      case 'unstake':
        return 'Unstaked BNB';
      case 'claim':
        return 'Claimed Rewards';
      case 'reward':
        return 'Reward Added';
      default:
        return 'Activity';
    }
  };

  const getActivityColor = (type: ActivityItem['type']) => {
    switch (type) {
      case 'stake':
        return 'border-yellow-500/20 bg-yellow-500/5';
      case 'unstake':
        return 'border-purple-500/20 bg-purple-500/5';
      case 'claim':
        return 'border-green-500/20 bg-green-500/5';
      case 'reward':
        return 'border-blue-500/20 bg-blue-500/5';
      default:
        return 'border-slate-700/50 bg-slate-800/50';
    }
  };

  const formatTimeAgo = (date: Date) => {
    const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
    if (seconds < 60) return 'Just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <GlowEffect glowColor="#3B82F6" className="h-full">
      <Card className="h-full bg-slate-900/90 border-blue-500/30">
        <CardHeader className="border-b border-blue-500/20 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-blue-500/20 flex items-center justify-center">
              <Activity className="w-5 h-5 md:w-6 md:h-6 text-blue-400" />
            </div>
            <div>
              <h3 className="text-lg md:text-xl font-bold text-white">Activity</h3>
              <p className="text-xs md:text-sm text-slate-400">Your vault activity history</p>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-4 md:p-6">
          {!wallet.connected ? (
            <div className="text-center py-6 md:py-8">
              <Activity className="w-12 h-12 md:w-16 md:h-16 text-slate-500 mx-auto mb-4" />
              <p className="text-slate-400 text-sm md:text-base">Connect wallet to view activity</p>
            </div>
          ) : isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Spinner size="lg" color="blue" />
            </div>
          ) : error ? (
            <div className="text-center py-6 text-red-400 text-sm">{error}</div>
          ) : activities.length === 0 ? (
            <div className="text-center py-6 md:py-8">
              <Activity className="w-12 h-12 md:w-16 md:h-16 text-slate-500 mx-auto mb-4" />
              <p className="text-slate-400 text-sm md:text-base">No activity yet</p>
              <p className="text-slate-500 text-xs md:text-sm mt-1">Stake BNB to start earning rewards</p>
            </div>
          ) : (
            <div className="space-y-2 md:space-y-3 max-h-[300px] md:max-h-[400px] overflow-y-auto custom-scrollbar">
              {activities.map((activity) => (
                <div
                  key={activity.id}
                  className={`flex items-center justify-between p-3 md:p-4 rounded-lg border ${getActivityColor(activity.type)} transition-all hover:scale-[1.01]`}
                >
                  <div className="flex items-center gap-2 md:gap-3">
                    <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-slate-800/50 flex items-center justify-center">
                      {getActivityIcon(activity.type)}
                    </div>
                    <div>
                      <p className="text-xs md:text-sm font-medium text-white">{getActivityLabel(activity.type)}</p>
                      <p className="text-[10px] md:text-xs text-slate-400">{formatTimeAgo(activity.timestamp)}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-xs md:text-sm font-medium ${activity.type === 'unstake' ? 'text-purple-400' : 'text-green-400'}`}>
                      {activity.type === 'unstake' ? '-' : '+'}{activity.amount.toFixed(4)} BNB
                    </p>
                    {activity.txHash && (
                      <a
                        href={`https://bscscan.com/tx/${activity.txHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[10px] md:text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 justify-end"
                      >
                        View <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </GlowEffect>
  );
};

export default ActivityFeed;

