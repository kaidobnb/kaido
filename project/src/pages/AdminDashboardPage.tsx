import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getAdminStats, getPendingClaims, getAdminPendingReferralClaims } from '../services/api';
import Card, { CardHeader, CardContent } from '../components/ui/Card';
import AdminPredictionsTable from '../components/admin/AdminPredictionsTable';
import AdminUsersTable from '../components/admin/AdminUsersTable';
import AdminTransactionsTable from '../components/admin/AdminTransactionsTable';
import AdminClaimsTable from '../components/admin/AdminClaimsTable';
import ReferralClaimsApproval from '../components/admin/ReferralClaimsApproval';
import AdminStatsCards from '../components/admin/AdminStatsCards';
import AdminCreatePredictionModal from '../components/admin/AdminCreatePredictionModal';
import AdminCreateAgentPredictionModal from '../components/admin/AdminCreateAgentPredictionModal';
import AdminApiSettings from '../components/admin/AdminApiSettings';
import AdminPartnerSettings from '../components/admin/AdminPartnerSettings';
import PartnerRecordsPage from '../components/admin/PartnerRecordsPage';
import AdminAutoPredictionSettings from '../components/admin/AdminAutoPredictionSettings';
import AdminKaidoAgentSettings from '../components/admin/AdminKaidoAgentSettings';
import Button from '../components/ui/Button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/Tabs';
import { AlertCircle, Plus, Bot, Award, DollarSign, Settings, Wallet, Users, Trophy, Cpu } from 'lucide-react';

interface AdminStats {
  userCount: number;
  predictionCount: number;
  activeCount: number;
  resolvedCount: number;
  transactionCount: number;
  totalVolume: number;
  feeTotals: {
    SOL?: number;
    SOLY?: number;
  };
}

const AdminDashboardPage: React.FC = () => {
  const { isAdmin } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [isCreateAgentModalOpen, setIsCreateAgentModalOpen] = useState<boolean>(false);
  const [pendingPredictionClaimsCount, setPendingPredictionClaimsCount] = useState<number>(0);
  const [pendingReferralClaimsCount, setPendingReferralClaimsCount] = useState<number>(0);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const response = await getAdminStats();
      if (response.success) {
        setStats(response.stats);
      } else {
        setError(response.message || 'Failed to load admin stats');
      }
    } catch (err) {
      setError('Error loading admin stats');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch pending claims counts
  const fetchPendingClaimsCounts = async () => {
    try {
      // Fetch prediction claims
      const predictionClaimsResponse = await getPendingClaims();
      if (predictionClaimsResponse.success) {
        setPendingPredictionClaimsCount(predictionClaimsResponse.claims?.length || 0);
      }

      // Fetch referral claims
      const referralClaimsResponse = await getAdminPendingReferralClaims();
      if (referralClaimsResponse.success) {
        setPendingReferralClaimsCount(referralClaimsResponse.claims?.length || 0);
      }
    } catch (err) {
      console.error('Error fetching pending claims counts:', err);
    }
  };

  useEffect(() => {
    // Redirect if not admin
    if (!isAdmin) {
      navigate('/');
      return;
    }

    // Fetch admin stats and pending claims counts
    fetchStats();
    fetchPendingClaimsCounts();

    // Set up polling to refresh claims counts every 30 seconds
    const intervalId = setInterval(fetchPendingClaimsCounts, 30000);

    return () => clearInterval(intervalId);
  }, [isAdmin, navigate]);

  if (!isAdmin) {
    return null; // Will redirect in useEffect
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-white">Admin Dashboard</h1>
        <div className="flex space-x-4">
          <a
            href="/admin/wallets"
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
          >
            Admin Wallets
          </a>
        </div>
      </div>

      {/* Create Prediction Modals */}
      <AdminCreatePredictionModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={fetchStats}
      />

      {/* Create Agent Prediction Modal */}
      <AdminCreateAgentPredictionModal
        isOpen={isCreateAgentModalOpen}
        onClose={() => setIsCreateAgentModalOpen(false)}
        onSuccess={fetchStats}
      />

      {error && (
        <div className="bg-red-500/20 border border-red-500 rounded-lg p-4 mb-6 flex items-center">
          <AlertCircle className="h-5 w-5 mr-2 text-red-500" />
          <p className="text-red-100">{error}</p>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
        </div>
      ) : (
        <>
          {stats && <AdminStatsCards stats={stats} />}

          <Tabs defaultValue="predictions" className="mt-8">
            <TabsList className="mb-6">
              <TabsTrigger value="predictions">Predictions</TabsTrigger>
              <TabsTrigger value="sports">
                <Trophy className="h-4 w-4 mr-1" />
                Sports
              </TabsTrigger>
              <TabsTrigger value="users">Users</TabsTrigger>
              <TabsTrigger value="transactions">Transactions</TabsTrigger>
              <TabsTrigger value="claims">
                Claims
                {(pendingPredictionClaimsCount + pendingReferralClaimsCount) > 0 && (
                  <span className="ml-2 px-2 py-0.5 text-xs bg-purple-600 rounded-full">
                    {pendingPredictionClaimsCount + pendingReferralClaimsCount}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="partners">
                <Users className="h-4 w-4 mr-1" />
                Partner Records
              </TabsTrigger>
              <TabsTrigger value="kaido-agent">
                <Cpu className="h-4 w-4 mr-1" />
                KAIDO Agent
              </TabsTrigger>
              <TabsTrigger value="auto-predictions">
                <Bot className="h-4 w-4 mr-1" />
                Auto-Predictions
              </TabsTrigger>
              <TabsTrigger value="settings">
                <Settings className="h-4 w-4 mr-1" />
                Settings
              </TabsTrigger>
            </TabsList>

            <TabsContent value="predictions">
              <Card>
                <CardHeader className="flex justify-between items-center">
                  <h2 className="text-xl font-semibold text-white">Predictions</h2>
                  <div className="flex space-x-3">
                    <Button
                      onClick={() => setIsCreateAgentModalOpen(true)}
                      leftIcon={<Bot className="h-4 w-4" />}
                      variant="secondary"
                    >
                      Create Agent Prediction
                    </Button>
                    <Button
                      onClick={() => setIsCreateModalOpen(true)}
                      leftIcon={<Plus className="h-4 w-4" />}
                    >
                      Create Prediction
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <AdminPredictionsTable />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="sports">
              <Card>
                <CardHeader className="flex justify-between items-center">
                  <h2 className="text-xl font-semibold text-white flex items-center">
                    <Trophy className="h-5 w-5 mr-2" />
                    Sports Predictions
                  </h2>
                  <Button
                    onClick={() => navigate('/admin/sports/create')}
                    leftIcon={<Plus className="h-4 w-4" />}
                  >
                    Create Sports Prediction
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8 text-slate-400">
                    <Trophy className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <h3 className="text-lg font-semibold text-white mb-2">Sports Predictions</h3>
                    <p className="mb-4">Create predictions for soccer matches using real-time data from Sportradar.</p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl mx-auto text-sm">
                      <div className="bg-slate-800 rounded-lg p-4">
                        <div className="text-purple-400 font-semibold mb-1">1. Select League</div>
                        <div>Choose from major soccer competitions worldwide</div>
                      </div>
                      <div className="bg-slate-800 rounded-lg p-4">
                        <div className="text-purple-400 font-semibold mb-1">2. Pick Match</div>
                        <div>Browse upcoming matches and select one for prediction</div>
                      </div>
                      <div className="bg-slate-800 rounded-lg p-4">
                        <div className="text-purple-400 font-semibold mb-1">3. Configure</div>
                        <div>Set prediction type, options, and auto-resolution</div>
                      </div>
                    </div>
                    <Button
                      onClick={() => navigate('/admin/sports/create')}
                      className="mt-6"
                      leftIcon={<Trophy className="h-4 w-4" />}
                    >
                      Get Started
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="users">
              <Card>
                <CardHeader>
                  <h2 className="text-xl font-semibold text-white">Users</h2>
                </CardHeader>
                <CardContent>
                  <AdminUsersTable />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="transactions">
              <Card>
                <CardHeader>
                  <h2 className="text-xl font-semibold text-white">Transactions</h2>
                </CardHeader>
                <CardContent>
                  <AdminTransactionsTable />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="claims">
              <div className="space-y-6">
                <Card>
                  <CardHeader className="flex items-center">
                    <div className="flex items-center">
                      <Award className="h-5 w-5 text-purple-400 mr-2" />
                      <h2 className="text-xl font-semibold text-white">Prediction Claim Approvals</h2>
                      {pendingPredictionClaimsCount > 0 && (
                        <span className="ml-3 px-2 py-0.5 text-xs bg-purple-600 rounded-full">
                          {pendingPredictionClaimsCount}
                        </span>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <AdminClaimsTable onClaimsUpdated={() => fetchPendingClaimsCounts()} />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex items-center">
                    <div className="flex items-center">
                      <DollarSign className="h-5 w-5 text-purple-400 mr-2" />
                      <h2 className="text-xl font-semibold text-white">Referral Claim Approvals</h2>
                      {pendingReferralClaimsCount > 0 && (
                        <span className="ml-3 px-2 py-0.5 text-xs bg-purple-600 rounded-full">
                          {pendingReferralClaimsCount}
                        </span>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <ReferralClaimsApproval onClaimsUpdated={() => fetchPendingClaimsCounts()} />
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="partners">
              <PartnerRecordsPage />
            </TabsContent>

            <TabsContent value="kaido-agent">
              <AdminKaidoAgentSettings />
            </TabsContent>

            <TabsContent value="auto-predictions">
              <AdminAutoPredictionSettings />
            </TabsContent>

            <TabsContent value="settings">
              <div className="space-y-6">
                <AdminPartnerSettings />
                <AdminApiSettings />
              </div>
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
};

export default AdminDashboardPage;
