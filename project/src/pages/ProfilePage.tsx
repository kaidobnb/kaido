import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Card, { CardContent, CardHeader } from '../components/ui/Card';
import Avatar from '../components/ui/Avatar';
import Button from '../components/ui/Button';
import { Edit, Settings, Award, TrendingUp, History, Copy, Check, Wallet, Gift } from 'lucide-react';
import AffiliateStats from '../components/profile/AffiliateStats';
import { useAuth } from '../contexts/AuthContext';
import { useWallet } from '../contexts/WalletContext';
import { getUserPredictions, getUserTransactions } from '../services/api';
import { useToast } from '../hooks/useToast';
import BadgeItem, { BadgeData } from '../components/profile/BadgeItem';
import BadgeCollection from '../components/profile/BadgeCollection';
import BadgeNotificationManager from '../components/profile/BadgeNotificationManager';
import { getMockBadges } from '../services/badgeService';

const ProfilePage: React.FC = () => {
  const { userProfile } = useAuth();
  const { wallet, connectWallet } = useWallet();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);
  const [userStats, setUserStats] = useState({
    predictions: 0,
    accuracy: 0,
    reputation: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [userActivity, setUserActivity] = useState<any[]>([]);
  const [userBadges, setUserBadges] = useState<BadgeData[]>([]);

  // Listen for wallet connection changes
  useEffect(() => {
    // If wallet is connected but no userProfile, it means we need to wait for the profile to load
    if (wallet.connected && !userProfile) {
      // Show loading state
      setIsLoading(true);

      // We don't need to do anything else here, as the AuthContext will handle loading the user profile
      console.log('Wallet connected, waiting for user profile to load...');
    }
  }, [wallet.connected, userProfile]);

  // Fetch user predictions, transactions, and badges to calculate stats
  useEffect(() => {
    const fetchUserData = async () => {
      if (!userProfile || !wallet.connected) return;

      setIsLoading(true);
      try {
        // Use default values from userProfile if API calls fail
        let predictions = [];
        let transactions = [];

        try {
          // Fetch user predictions
          const predictionsResponse = await getUserPredictions();
          if (predictionsResponse.success) {
            predictions = predictionsResponse.predictions || [];
          } else {
            console.warn('Failed to fetch predictions:', predictionsResponse.message);
          }
        } catch (predError) {
          console.error('Error fetching predictions:', predError);
          // Continue with empty predictions array
        }

        try {
          // Fetch user transactions
          const transactionsResponse = await getUserTransactions();
          if (transactionsResponse.success) {
            transactions = transactionsResponse.transactions || [];
          } else {
            console.warn('Failed to fetch transactions:', transactionsResponse.message);
          }
        } catch (transError) {
          console.error('Error fetching transactions:', transError);
          // Continue with empty transactions array
        }

        // Calculate stats
        const totalPredictions = predictions.length || userProfile.totalPredictions || 0;
        const wonPredictions = predictions.filter((p: any) => p.outcome === 'won').length || userProfile.wonPredictions || 0;
        const accuracy = totalPredictions > 0 ? Math.round((wonPredictions / totalPredictions) * 100) : userProfile.winRate || 0;

        // Set user stats
        setUserStats({
          predictions: totalPredictions,
          accuracy,
          reputation: userProfile.reputation || Math.min(Math.round(accuracy + (totalPredictions / 5)), 100), // Simple reputation formula
        });

        // Combine predictions and transactions for activity feed
        const activity = [
          ...predictions.map((p: any) => ({
            type: 'prediction',
            title: p.title,
            date: new Date(p.createdAt),
            amount: p.amount,
            outcome: p.outcome,
            id: p._id,
          })),
          ...transactions.map((t: any) => ({
            type: 'transaction',
            title: t.type,
            date: new Date(t.createdAt),
            amount: t.amount,
            tokenType: t.tokenType,
            id: t._id,
          })),
        ];

        // Sort by date (newest first) and take the first 5
        activity.sort((a, b) => b.date.getTime() - a.date.getTime());
        setUserActivity(activity.slice(0, 5));

        // Load user badges
        // In production, this would be: const badges = await getUserBadges();
        // For now, use mock data
        const badges = getMockBadges();

        // Determine which badges are unlocked based on user stats
        const updatedBadges = badges.map(badge => {
          // This is a simplified version - in production, this logic would be on the server
          let unlocked = !badge.locked;
          let progress = badge.progress;

          // Example logic for unlocking badges based on stats
          if (badge.id === 'first-prediction' && totalPredictions > 0) {
            unlocked = true;
          } else if (badge.id === 'first-win' && wonPredictions > 0) {
            unlocked = true;
          } else if (badge.id === 'accuracy-king' && accuracy >= 75) {
            unlocked = true;
          } else if (badge.id === 'market-maker') {
            // Calculate progress for market maker badge
            const createdPredictions = predictions.filter((p: any) => p.isCreator).length;
            progress = Math.min(Math.round((createdPredictions / 10) * 100), 100);
            unlocked = createdPredictions >= 10;
          }

          return {
            ...badge,
            locked: !unlocked,
            progress,
          };
        });

        setUserBadges(updatedBadges);
      } catch (error) {
        console.error('Error fetching user data:', error);
        showToast({
          type: 'error',
          title: 'Error',
          message: 'Failed to load profile data. Please try again.'
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserData();
  }, [userProfile, wallet.connected]);

  // Handle wallet address copy
  const handleCopyWalletAddress = () => {
    if (wallet.address) {
      navigator.clipboard.writeText(wallet.address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);

      showToast({
        type: 'success',
        title: 'Copied!',
        message: 'Wallet address copied to clipboard'
      });
    }
  };

  // Format date
  const formatDate = (date: Date) => {
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) return '1 day ago';
    if (diffDays < 30) return `${diffDays} days ago`;

    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  // Format join date
  const formatJoinDate = (dateString?: string) => {
    if (!dateString) return 'New Member';

    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
  };

  // If wallet is connected but profile is still loading, show loading state
  if (wallet.connected && !userProfile) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-md mx-auto bg-black/90 rounded-xl p-8 border border-yellow-500/20 backdrop-blur-sm text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Loading Profile</h1>
          <p className="text-gray-300 mb-6">Your wallet is connected. Loading your profile data...</p>
          <div className="flex justify-center py-4">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-yellow-500"></div>
          </div>
        </div>
      </div>
    );
  }

  // If user is not authenticated, show connect wallet prompt
  if (!userProfile) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-md mx-auto bg-black/90 rounded-xl p-8 border border-yellow-500/20 backdrop-blur-sm text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Connect Your Wallet</h1>
          <p className="text-gray-300 mb-6">Connect your wallet to view your profile and track your predictions.</p>
          <Button
            variant="primary"
            size="lg"
            onClick={connectWallet}
            className="w-full"
          >
            Connect Wallet
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12">
      {/* Badge notification system */}
      <BadgeNotificationManager />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Card */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader className="flex flex-col items-center pb-6">
              <div className="relative">
                <Avatar
                  src={userProfile.avatar || ''}
                  alt={userProfile.username || 'User'}
                  size="xl"
                  className="mb-4 bg-gradient-to-br from-yellow-500 to-yellow-600"
                />
                <div className="absolute bottom-4 right-0 bg-yellow-600 rounded-full w-8 h-8 flex items-center justify-center text-black font-bold">
                  {userProfile.username?.charAt(0).toUpperCase() || 'U'}
                </div>
              </div>
              <h1 className="text-2xl font-bold text-white">{userProfile.username || 'User'}</h1>
              <div
                className="flex items-center text-yellow-400 cursor-pointer hover:text-yellow-300 transition-colors"
                onClick={handleCopyWalletAddress}
              >
                <p className="text-sm font-mono truncate max-w-[150px]">
                  {wallet.address ? `${wallet.address.substring(0, 6)}...${wallet.address.substring(wallet.address.length - 4)}` : 'No wallet connected'}
                </p>
                {copied ? (
                  <Check className="h-4 w-4 ml-1 text-green-400" />
                ) : (
                  <Copy className="h-4 w-4 ml-1" />
                )}
              </div>
              <p className="text-sm text-gray-400 mt-1">Member since {formatJoinDate(userProfile.createdAt)}</p>

              <div className="flex gap-2 mt-4">
                <Button
                  variant="secondary"
                  size="sm"
                  leftIcon={<Edit className="h-4 w-4" />}
                  onClick={() => navigate('/settings')}
                >
                  Edit Profile
                </Button>
                <Button
                  variant="tertiary"
                  size="sm"
                  leftIcon={<Settings className="h-4 w-4" />}
                  onClick={() => navigate('/settings')}
                >
                  Settings
                </Button>
              </div>
            </CardHeader>

            <CardContent>
              <div className="border-t border-slate-700 pt-4">
                <h2 className="text-lg font-medium text-white mb-2">About</h2>
                <p className="text-gray-300 text-sm">
                  {userProfile.bio || 'Passionate about crypto and prediction markets. Always looking for the next big opportunity.'}
                </p>
              </div>

              <div className="border-t border-slate-700 mt-4 pt-4">
                <h2 className="text-lg font-medium text-white mb-3">Stats</h2>
                {isLoading ? (
                  <div className="flex justify-center py-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-yellow-500"></div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-yellow-400 text-xs">Predictions</p>
                      <p className="text-white text-lg font-medium">{userStats.predictions}</p>
                    </div>
                    <div>
                      <p className="text-yellow-400 text-xs">Accuracy</p>
                      <p className="text-white text-lg font-medium">{userStats.accuracy}%</p>
                    </div>
                    <div>
                      <p className="text-yellow-400 text-xs">Reputation</p>
                      <p className="text-white text-lg font-medium">{userStats.reputation}/100</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="border-t border-slate-700 mt-4 pt-4">
                <h2 className="text-lg font-medium text-white mb-3">Badges</h2>
                {isLoading ? (
                  <div className="flex justify-center py-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-yellow-500"></div>
                  </div>
                ) : userBadges.filter(b => !b.locked).length === 0 ? (
                  <div className="text-center py-2">
                    <p className="text-gray-300 text-sm">No badges earned yet. Keep participating to earn badges!</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {userBadges
                      .filter(badge => !badge.locked)
                      .slice(0, 3)
                      .map((badge) => (
                        <BadgeItem key={badge.id} badge={badge} />
                      ))}
                    {userBadges.filter(b => !b.locked).length > 3 && (
                      <div className="text-center mt-2">
                        <Button
                          variant="tertiary"
                          size="sm"
                          onClick={() => navigate('/badges')}
                        >
                          View All Badges
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Wallet Section */}
              <div className="border-t border-slate-700 mt-4 pt-4">
                <h2 className="text-lg font-medium text-white mb-3">Wallet</h2>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center">
                      <div className="w-8 h-8 rounded-full bg-yellow-500/20 flex items-center justify-center mr-3">
                        <Wallet className="h-4 w-4 text-yellow-400" />
                      </div>
                      <p className="text-white text-sm font-medium">BNB Balance</p>
                    </div>
                    <p className="text-white text-sm font-medium">
                      {wallet.balance?.bnb?.toFixed(4) || '0.0000'} BNB
                    </p>
                  </div>
                </div>
              </div>

              {/* Quick Links Section */}
              <div className="border-t border-slate-700 mt-4 pt-4">
                <h2 className="text-lg font-medium text-white mb-3">Quick Links</h2>
                <div className="space-y-2">
                  <Button
                    variant="tertiary"
                    size="sm"
                    fullWidth
                    onClick={() => navigate('/profile/winnings')}
                    className="justify-start"
                  >
                    <Award className="h-4 w-4 mr-2" />
                    Claim Winnings
                  </Button>
                  <Button
                    variant="tertiary"
                    size="sm"
                    fullWidth
                    onClick={() => navigate('/profile/rewards')}
                    className="justify-start"
                  >
                    <Gift className="h-4 w-4 mr-2" />
                    Referral Rewards
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Activity and Predictions */}
        <div className="lg:col-span-2">
          {/* Affiliate Stats */}
          <div className="mb-6">
            <AffiliateStats />
          </div>

          <Card className="mb-6">
            <CardHeader>
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-white">Performance</h2>
                <div className="flex gap-2">
                  <Button variant="tertiary" size="sm">Weekly</Button>
                  <Button variant="tertiary" size="sm">Monthly</Button>
                  <Button variant="secondary" size="sm">All Time</Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-center justify-center bg-black/50 rounded-lg border border-yellow-500/20">
                <div className="text-center">
                  <TrendingUp className="h-12 w-12 text-yellow-400 mx-auto mb-2" />
                  <p className="text-gray-300">Performance chart would go here</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 mt-6">
                <div className="bg-black/90 p-4 rounded-lg border border-yellow-500/20">
                  <p className="text-yellow-400 text-xs mb-1">Win Rate</p>
                  <p className="text-white text-2xl font-bold">{userStats.accuracy}%</p>
                  <p className="text-green-400 text-xs">↑ 12% from last month</p>
                </div>
                <div className="bg-black/90 p-4 rounded-lg border border-yellow-500/20">
                  <p className="text-yellow-400 text-xs mb-1">Total Profit</p>
                  <p className="text-white text-2xl font-bold">-</p>
                  <p className="text-gray-300 text-xs">Coming soon</p>
                </div>
                <div className="bg-black/90 p-4 rounded-lg border border-yellow-500/20">
                  <p className="text-yellow-400 text-xs mb-1">Avg. Return</p>
                  <p className="text-white text-2xl font-bold">32%</p>
                  <p className="text-red-400 text-xs">↓ 5% from last month</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-white">Recent Activity</h2>
                <Button variant="tertiary" size="sm">View All</Button>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-500"></div>
                </div>
              ) : userActivity.length === 0 ? (
                <div className="bg-black/50 rounded-lg border border-yellow-500/20 p-6 text-center">
                  <History className="h-12 w-12 text-yellow-400 mx-auto mb-2" />
                  <p className="text-gray-300 font-medium">No activity yet</p>
                  <p className="text-gray-400 text-sm mt-1">Start creating or joining predictions to see your activity here.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {userActivity.map((item, index) => (
                    <div key={index} className="flex items-start p-3 rounded-lg bg-black/50 border border-yellow-500/20">
                      <div className="w-10 h-10 rounded-full bg-yellow-500/20 flex items-center justify-center mr-3 flex-shrink-0">
                        <History className="h-5 w-5 text-yellow-400" />
                      </div>
                      <div className="flex-grow">
                        <p className="text-white text-sm font-medium">
                          {item.type === 'prediction'
                            ? item.outcome === 'won'
                              ? "Won a prediction"
                              : item.outcome === 'lost'
                                ? "Lost a prediction"
                                : "Participated in prediction"
                            : item.type === 'transaction'
                              ? `${item.title.charAt(0).toUpperCase() + item.title.slice(1)} transaction`
                              : "Activity"}
                        </p>
                        <p className="text-gray-300 text-xs truncate max-w-[300px]">
                          {item.title || "Unknown activity"}
                        </p>
                        <div className="flex justify-between mt-1">
                          <p className="text-gray-400 text-xs">
                            {formatDate(item.date)}
                          </p>
                          {item.type === 'prediction' ? (
                            <p className={`text-xs ${item.outcome === 'won' ? 'text-green-400' : 'text-red-400'}`}>
                              {item.outcome === 'won' ? '+' : '-'}{item.amount} {item.tokenType || 'BNB'}
                            </p>
                          ) : (
                            <p className={`text-xs ${item.amount > 0 ? 'text-green-400' : 'text-red-400'}`}>
                              {item.amount > 0 ? '+' : ''}{item.amount} {item.tokenType || 'BNB'}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
