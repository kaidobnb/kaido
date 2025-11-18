import React, { useState, useEffect } from 'react';
import { TrendingUp, Award, ArrowUp, Filter } from 'lucide-react';
import Card, { CardHeader, CardContent } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Avatar from '../components/ui/Avatar';
import { Link } from 'react-router-dom';
import { getLeaderboard, getUserRank } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../hooks/useToast';

// Define the leaderboard user type
interface LeaderboardUser {
  id: string;
  username: string;
  avatar: string | null;
  rank: number;
  winRate: number;
  volume: number;
  reputation: number;
  totalPredictions: number;
  wonPredictions: number;
}

const LeaderboardPage: React.FC = () => {
  const [timeRange, setTimeRange] = useState<'weekly' | 'monthly' | 'allTime'>('allTime');
  const [showFilters, setShowFilters] = useState(false);
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userStats, setUserStats] = useState<{
    rank: number | null;
    reputation: number;
    winRate: number;
    volume: number;
  }>({
    rank: null,
    reputation: 0,
    winRate: 0,
    volume: 0
  });

  const { isAuthenticated, userProfile } = useAuth();
  const { showToast } = useToast();

  // Fetch leaderboard data
  useEffect(() => {
    const fetchLeaderboardData = async () => {
      setIsLoading(true);
      try {
        console.log('Fetching leaderboard data for timeRange:', timeRange);
        const response = await getLeaderboard(timeRange);
        console.log('Leaderboard response in component:', response);

        if (response.success && Array.isArray(response.leaderboard)) {
          // Transform the data to match our component's expected format
          const formattedData = response.leaderboard.map((user: any) => ({
            id: user.id,
            username: user.username || 'Anonymous',
            avatar: user.avatar,
            rank: user.rank,
            winRate: user.winRate || 0,
            volume: user.volume || 0,
            reputation: user.reputation || 0,
            totalPredictions: user.totalPredictions || 0,
            wonPredictions: user.wonPredictions || 0
          }));

          console.log('Formatted leaderboard data:', formattedData.length, 'entries');
          setLeaderboardData(formattedData);
        } else if (response.leaderboard && !Array.isArray(response.leaderboard)) {
          console.error('Leaderboard data is not an array:', response.leaderboard);
          showToast({
            type: 'error',
            title: 'Error',
            message: 'Invalid leaderboard data format'
          });
          setLeaderboardData([]);
        } else {
          console.error('Unexpected API response format:', response);
          // Don't show error toast for empty data
          if (!response.success) {
            showToast({
              type: 'error',
              title: 'Error',
              message: response.message || 'Failed to load leaderboard data'
            });
          }
          setLeaderboardData([]);
        }
      } catch (error) {
        console.error('Error fetching leaderboard data:', error);
        showToast({
          type: 'error',
          title: 'Error',
          message: 'Failed to load leaderboard data'
        });
        setLeaderboardData([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLeaderboardData();
  }, [timeRange, showToast]);

  // Fetch user's rank if authenticated
  useEffect(() => {
    const fetchUserRank = async () => {
      if (!isAuthenticated || !userProfile) return;

      try {
        const response = await getUserRank();

        if (response.success) {
          // Find user in leaderboard to get stats
          const userInLeaderboard = leaderboardData.find(user => user.id === userProfile.id);

          setUserStats({
            rank: response.rank,
            reputation: userProfile.reputation || 0,
            winRate: userProfile.winRate || 0,
            volume: userProfile.totalVolume || 0
          });
        }
      } catch (error) {
        console.error('Error fetching user rank:', error);
      }
    };

    fetchUserRank();
  }, [isAuthenticated, userProfile, leaderboardData]);

  return (
    <div className="container mx-auto px-4 py-12">

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
        <h1 className="text-2xl text-white font-medium mb-4 sm:mb-0 flex items-center">
          <Award className="h-6 w-6 text-yellow-400 mr-2" />
          Leaderboard
        </h1>

        <div className="flex items-center space-x-3">
          <Button
            variant="tertiary"
            size="sm"
            leftIcon={<Filter className="h-4 w-4" />}
            onClick={() => setShowFilters(!showFilters)}
          >
            Filter
          </Button>

          <div className="hidden md:flex space-x-2">
            <Button
              variant={timeRange === 'weekly' ? 'primary' : 'tertiary'}
              size="sm"
              onClick={() => setTimeRange('weekly')}
            >
              Weekly
            </Button>
            <Button
              variant={timeRange === 'monthly' ? 'primary' : 'tertiary'}
              size="sm"
              onClick={() => setTimeRange('monthly')}
            >
              Monthly
            </Button>
            <Button
              variant={timeRange === 'allTime' ? 'primary' : 'tertiary'}
              size="sm"
              onClick={() => setTimeRange('allTime')}
            >
              All Time
            </Button>
          </div>
        </div>
      </div>

      {showFilters && (
        <div className="bg-slate-800 p-4 rounded-lg mb-6 md:hidden">
          <div className="flex space-x-2">
            <Button
              variant={timeRange === 'weekly' ? 'primary' : 'tertiary'}
              size="sm"
              onClick={() => setTimeRange('weekly')}
              fullWidth
            >
              Weekly
            </Button>
            <Button
              variant={timeRange === 'monthly' ? 'primary' : 'tertiary'}
              size="sm"
              onClick={() => setTimeRange('monthly')}
              fullWidth
            >
              Monthly
            </Button>
            <Button
              variant={timeRange === 'allTime' ? 'primary' : 'tertiary'}
              size="sm"
              onClick={() => setTimeRange('allTime')}
              fullWidth
            >
              All Time
            </Button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="border-b border-slate-700">
              <div className="flex justify-between items-center">
                <h2 className="text-xl text-white font-medium">Top Predictors</h2>
                <div className="flex items-center text-slate-400 text-sm">
                  <TrendingUp className="h-4 w-4 mr-1" />
                  <span>
                    {timeRange === 'weekly'
                      ? 'Week of April 18-24, 2025'
                      : timeRange === 'monthly'
                        ? 'April 2025'
                        : 'All Time'}
                  </span>
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-0">
              {isLoading ? (
                <div className="flex justify-center items-center py-20">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
                </div>
              ) : leaderboardData.length === 0 ? (
                <div className="text-center py-20">
                  <p className="text-slate-400">No leaderboard data available</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-slate-800">
                        <th className="text-left p-4 text-slate-400 text-sm font-medium">Rank</th>
                        <th className="text-left p-4 text-slate-400 text-sm font-medium">User</th>
                        <th className="text-right p-4 text-slate-400 text-sm font-medium">Win Rate</th>
                        <th className="text-right p-4 text-slate-400 text-sm font-medium">Volume</th>
                        <th className="text-right p-4 text-slate-400 text-sm font-medium">Reputation</th>
                      </tr>
                    </thead>
                    <tbody>
                      {leaderboardData.map((user) => (
                        <tr key={user.id} className="border-t border-slate-700 hover:bg-slate-800/50 transition-colors">
                          <td className="p-4">
                            <div className="flex items-center">
                              <span className={`h-6 w-6 rounded-full flex items-center justify-center text-sm font-medium mr-2 ${
                                user.rank === 1
                                  ? 'bg-yellow-500 text-slate-900'
                                  : user.rank === 2
                                    ? 'bg-slate-400 text-slate-900'
                                    : user.rank === 3
                                      ? 'bg-amber-700 text-white'
                                      : 'bg-slate-700 text-slate-300'
                              }`}>
                                {user.rank}
                              </span>
                            </div>
                          </td>
                          <td className="p-4">
                            <Link to={`/profile/${user.id}`} className="flex items-center hover:text-purple-400">
                              <Avatar
                                src={user.avatar || undefined}
                                alt={user.username}
                                size="sm"
                                className="mr-3"
                              />
                              <span className="font-medium text-white">{user.username}</span>
                            </Link>
                          </td>
                          <td className="p-4 text-right">
                            <span className="font-medium text-white">{(user.winRate * 100).toFixed(1)}%</span>
                          </td>
                          <td className="p-4 text-right">
                            <span className="font-medium text-white">${user.volume.toLocaleString()}</span>
                          </td>
                          <td className="p-4 text-right">
                            <div className="flex items-center justify-end">
                              <span className="font-medium text-white mr-1">{user.reputation.toLocaleString()}</span>
                              <ArrowUp className="h-3 w-3 text-green-400" />
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-1">
          <Card className="mb-6">
            <CardContent className="p-6">
              <h2 className="text-xl text-white font-medium mb-4">Reputation System</h2>
              <p className="text-slate-300 text-sm mb-4">
                Reputation points are earned based on prediction accuracy, volume, and streak. Higher reputation gives you more visibility and rewards.
              </p>

              <h3 className="text-white font-medium mb-2">How to Earn Points</h3>
              <ul className="space-y-2 text-sm text-slate-300 mb-4">
                <li className="flex items-start">
                  <div className="h-5 w-5 rounded-full bg-green-500 flex items-center justify-center text-white text-xs mr-2 flex-shrink-0 mt-0.5">✓</div>
                  <span>+100 points for each correct prediction</span>
                </li>
                <li className="flex items-start">
                  <div className="h-5 w-5 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs mr-2 flex-shrink-0 mt-0.5">$</div>
                  <span>+1 point per 10 SOL in prediction volume</span>
                </li>
                <li className="flex items-start">
                  <div className="h-5 w-5 rounded-full bg-purple-500 flex items-center justify-center text-white text-xs mr-2 flex-shrink-0 mt-0.5">🔥</div>
                  <span>+50 points for each consecutive win (streak bonus)</span>
                </li>
              </ul>

              <h3 className="text-white font-medium mb-2">Rank Levels</h3>
              <div className="space-y-3">
                <div className="bg-slate-800 rounded-lg p-3 flex justify-between items-center">
                  <div className="flex items-center">
                    <div className="h-6 w-6 rounded-full bg-gradient-to-r from-slate-500 to-slate-700 mr-2"></div>
                    <span className="text-slate-300">Novice</span>
                  </div>
                  <span className="text-slate-400 text-sm">0 - 1,000</span>
                </div>
                <div className="bg-slate-800 rounded-lg p-3 flex justify-between items-center">
                  <div className="flex items-center">
                    <div className="h-6 w-6 rounded-full bg-gradient-to-r from-blue-500 to-blue-700 mr-2"></div>
                    <span className="text-slate-300">Apprentice</span>
                  </div>
                  <span className="text-slate-400 text-sm">1,000 - 5,000</span>
                </div>
                <div className="bg-slate-800 rounded-lg p-3 flex justify-between items-center">
                  <div className="flex items-center">
                    <div className="h-6 w-6 rounded-full bg-gradient-to-r from-purple-500 to-purple-700 mr-2"></div>
                    <span className="text-slate-300">Expert</span>
                  </div>
                  <span className="text-slate-400 text-sm">5,000 - 10,000</span>
                </div>
                <div className="bg-slate-800 rounded-lg p-3 flex justify-between items-center">
                  <div className="flex items-center">
                    <div className="h-6 w-6 rounded-full bg-gradient-to-r from-yellow-500 to-yellow-700 mr-2"></div>
                    <span className="text-slate-300">Master</span>
                  </div>
                  <span className="text-slate-400 text-sm">10,000+</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <h2 className="text-xl text-white font-medium mb-4">Your Stats</h2>

              {!isAuthenticated ? (
                <div className="text-center py-4 mb-4">
                  <p className="text-slate-400 mb-4">Connect your wallet to see your stats</p>
                  <Button
                    variant="primary"
                    size="md"
                    fullWidth
                    onClick={() => window.dispatchEvent(new CustomEvent('wallet-connect'))}
                  >
                    Connect Wallet
                  </Button>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div>
                      <div className="text-xs text-slate-400">Rank</div>
                      <div className="text-xl font-bold text-white">
                        {userStats.rank ? `#${userStats.rank}` : 'N/A'}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-400">Reputation</div>
                      <div className="text-xl font-bold text-white">
                        {userStats.reputation.toLocaleString()}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-400">Win Rate</div>
                      <div className="text-xl font-bold text-white">
                        {(userStats.winRate * 100).toFixed(1)}%
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-400">Volume</div>
                      <div className="text-xl font-bold text-white">
                        ${userStats.volume.toLocaleString()}
                      </div>
                    </div>
                  </div>

                  <Button
                    variant="primary"
                    size="md"
                    fullWidth
                    onClick={() => window.location.href = '/profile'}
                  >
                    View Your Profile
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default LeaderboardPage;