import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Card, { CardContent, CardHeader } from '../components/ui/Card';
import Button from '../components/ui/Button';
import { Award, ChevronLeft } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useWallet } from '../contexts/WalletContext';
import { useToast } from '../hooks/useToast';
import BadgeCollection from '../components/profile/BadgeCollection';
import { BadgeData } from '../components/profile/BadgeItem';
import { getMockBadges } from '../services/badgeService';

const BadgesPage: React.FC = () => {
  const { userProfile } = useAuth();
  const { wallet, connectWallet } = useWallet();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [userBadges, setUserBadges] = useState<BadgeData[]>([]);

  // Fetch user badges
  useEffect(() => {
    const fetchBadges = async () => {
      if (!userProfile || !wallet.connected) return;

      setIsLoading(true);
      try {
        // In production, this would be: const badges = await getUserBadges();
        // For now, use mock data
        const badges = getMockBadges();
        setUserBadges(badges);
      } catch (error) {
        console.error('Error fetching badges:', error);
        showToast({
          type: 'error',
          title: 'Error',
          message: 'Failed to load badges. Please try again.'
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchBadges();
  }, [userProfile, wallet.connected]);

  // Group badges by category
  const groupedBadges = userBadges.reduce<Record<string, BadgeData[]>>((acc, badge) => {
    const category = badge.category;
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(badge);
    return acc;
  }, {});

  // If wallet is connected but profile is still loading, show loading state
  if (wallet.connected && !userProfile) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-md mx-auto bg-slate-800/70 rounded-xl p-8 border border-slate-700/50 backdrop-blur-sm text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Loading Profile</h1>
          <p className="text-slate-300 mb-6">Your wallet is connected. Loading your profile data...</p>
          <div className="flex justify-center py-4">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-500"></div>
          </div>
        </div>
      </div>
    );
  }

  // If user is not authenticated, show connect wallet prompt
  if (!userProfile) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-md mx-auto bg-slate-800/70 rounded-xl p-8 border border-slate-700/50 backdrop-blur-sm text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Connect Your Wallet</h1>
          <p className="text-slate-300 mb-6">Connect your wallet to view your badges and achievements.</p>
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
      <div className="mb-6 flex items-center">
        <Button
          variant="tertiary"
          size="sm"
          leftIcon={<ChevronLeft className="h-4 w-4" />}
          onClick={() => navigate('/profile')}
          className="mr-4"
        >
          Back to Profile
        </Button>
        <h1 className="text-2xl font-bold text-white">Your Badges & Achievements</h1>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {/* All Badges */}
        <Card>
          <CardHeader>
            <div className="flex items-center">
              <Award className="h-5 w-5 text-purple-400 mr-2" />
              <h2 className="text-xl font-bold text-white">All Badges</h2>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
                  <h3 className="text-lg font-medium text-white mb-2">Your Progress</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-slate-800 p-3 rounded-lg">
                      <p className="text-slate-400 text-xs mb-1">Unlocked</p>
                      <p className="text-white text-xl font-bold">
                        {userBadges.filter(b => !b.locked).length}/{userBadges.length}
                      </p>
                    </div>
                    <div className="bg-slate-800 p-3 rounded-lg">
                      <p className="text-slate-400 text-xs mb-1">Rare+</p>
                      <p className="text-white text-xl font-bold">
                        {userBadges.filter(b => !b.locked && ['rare', 'epic', 'legendary'].includes(b.rarity)).length}
                      </p>
                    </div>
                    <div className="bg-slate-800 p-3 rounded-lg">
                      <p className="text-slate-400 text-xs mb-1">Gold+</p>
                      <p className="text-white text-xl font-bold">
                        {userBadges.filter(b => !b.locked && ['gold', 'platinum', 'diamond'].includes(b.tier)).length}
                      </p>
                    </div>
                    <div className="bg-slate-800 p-3 rounded-lg">
                      <p className="text-slate-400 text-xs mb-1">Completion</p>
                      <p className="text-white text-xl font-bold">
                        {Math.round((userBadges.filter(b => !b.locked).length / userBadges.length) * 100)}%
                      </p>
                    </div>
                  </div>
                </div>

                {/* Unlocked Badges */}
                <div className="mb-6">
                  <h3 className="text-lg font-medium text-white mb-4">Unlocked Badges</h3>
                  {userBadges.filter(b => !b.locked).length === 0 ? (
                    <div className="text-center py-6 bg-slate-800/50 rounded-lg border border-slate-700">
                      <Award className="h-12 w-12 text-slate-500 mx-auto mb-3" />
                      <p className="text-slate-300 font-medium">No badges unlocked yet</p>
                      <p className="text-slate-400 text-sm mt-1">Keep participating to earn badges!</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {userBadges
                        .filter(badge => !badge.locked)
                        .map(badge => (
                          <div key={badge.id} className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
                            <BadgeItem badge={badge} />
                          </div>
                        ))}
                    </div>
                  )}
                </div>

                {/* Badges In Progress */}
                <div className="mb-6">
                  <h3 className="text-lg font-medium text-white mb-4">Badges In Progress</h3>
                  {userBadges.filter(b => b.locked && b.progress !== undefined && b.progress > 0).length === 0 ? (
                    <div className="text-center py-6 bg-slate-800/50 rounded-lg border border-slate-700">
                      <p className="text-slate-400">No badges in progress</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {userBadges
                        .filter(badge => badge.locked && badge.progress !== undefined && badge.progress > 0)
                        .map(badge => (
                          <div key={badge.id} className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
                            <BadgeItem badge={badge} showProgress />
                          </div>
                        ))}
                    </div>
                  )}
                </div>

                {/* Locked Badges */}
                <div>
                  <h3 className="text-lg font-medium text-white mb-4">Locked Badges</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {userBadges
                      .filter(badge => badge.locked && (!badge.progress || badge.progress === 0))
                      .map(badge => (
                        <div key={badge.id} className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
                          <BadgeItem badge={badge} />
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default BadgesPage;
