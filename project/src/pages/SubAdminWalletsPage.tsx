import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Card, { CardHeader, CardContent } from '../components/ui/Card';
import { Wallet, DollarSign, AlertCircle, ArrowLeft } from 'lucide-react';
import Button from '../components/ui/Button';
import { getSubAdminWallets, getSubAdminStats } from '../services/api';

interface AdminWallet {
  address: string;
  feeTotals: {
    SOL: number;
    SOLY: number;
  };
}

interface PartnerWallet {
  walletAddress: string;
  feePercentage: number;
  name?: string;
  active: boolean;
  _id?: string;
}

interface FeeSettings {
  creationFeePercentage: number;
  resolutionFeePercentage: number;
  referralRewardPercentage: number;
}

interface AdminStats {
  userCount: number;
  predictionCount: number;
  activeCount: number;
  resolvedCount: number;
  transactionCount: number;
  totalVolume: number;
  feeTotals: {
    SOL: number;
    SOLY: number;
  };
}

const SubAdminWalletsPage: React.FC = () => {
  const { isSubAdmin, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [adminWallet, setAdminWallet] = useState<AdminWallet | null>(null);
  const [partnerWallets, setPartnerWallets] = useState<PartnerWallet[]>([]);
  const [feeSettings, setFeeSettings] = useState<FeeSettings | null>(null);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Function to truncate wallet address for display
  const truncateAddress = (address: string) => {
    if (!address) return '';
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  // Calculate admin percentage
  const calculateAdminPercentage = () => {
    if (!feeSettings) return 0;
    
    const totalPartnerPercentage = partnerWallets
      .filter(wallet => wallet.active)
      .reduce((total, wallet) => total + wallet.feePercentage, 0);
    
    return 100 - totalPartnerPercentage;
  };

  // Load admin wallet information
  useEffect(() => {
    const loadWalletInfo = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch admin wallet information
        const response = await getSubAdminWallets();
        if (response.success) {
          setAdminWallet(response.adminWallet);
          setPartnerWallets(response.partnerWallets || []);
          setFeeSettings(response.feeSettings);
        } else {
          setError('Failed to load admin wallet information');
        }

        // Fetch admin stats
        const statsResponse = await getSubAdminStats();
        if (statsResponse.success) {
          setStats(statsResponse.stats);
        }
      } catch (err) {
        console.error('Error loading admin wallet information:', err);
        setError('An error occurred while loading admin wallet information');
      } finally {
        setLoading(false);
      }
    };

    // Only load if user is a sub-admin or admin
    if (isSubAdmin || isAdmin) {
      loadWalletInfo();
    } else {
      navigate('/');
    }
  }, [isSubAdmin, isAdmin, navigate]);

  // Redirect if not sub-admin or admin
  if (!isSubAdmin && !isAdmin) {
    return null; // Will redirect in useEffect
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center mb-6">
        <Button
          variant="ghost"
          size="sm"
          className="mr-4"
          onClick={() => navigate(-1)}
          leftIcon={<ArrowLeft className="h-4 w-4" />}
        >
          Back
        </Button>
        <h1 className="text-3xl font-bold text-white">Admin Wallets</h1>
      </div>

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
        <div className="space-y-6">
          {/* Dashboard Stats */}
          {stats && (
            <Card>
              <CardHeader>
                <h2 className="text-xl font-semibold text-white">Dashboard Metrics</h2>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-gray-800 p-4 rounded-lg">
                    <h3 className="text-sm font-medium text-gray-400 mb-1">Total Users</h3>
                    <p className="text-2xl font-bold text-white">{stats.userCount.toLocaleString()}</p>
                  </div>
                  <div className="bg-gray-800 p-4 rounded-lg">
                    <h3 className="text-sm font-medium text-gray-400 mb-1">Total Predictions</h3>
                    <p className="text-2xl font-bold text-white">{stats.predictionCount.toLocaleString()}</p>
                  </div>
                  <div className="bg-gray-800 p-4 rounded-lg">
                    <h3 className="text-sm font-medium text-gray-400 mb-1">Active Predictions</h3>
                    <p className="text-2xl font-bold text-white">{stats.activeCount.toLocaleString()}</p>
                  </div>
                  <div className="bg-gray-800 p-4 rounded-lg">
                    <h3 className="text-sm font-medium text-gray-400 mb-1">Total Volume</h3>
                    <p className="text-2xl font-bold text-white">{stats.totalVolume.toLocaleString()} SOL</p>
                  </div>
                  <div className="bg-gray-800 p-4 rounded-lg">
                    <h3 className="text-sm font-medium text-gray-400 mb-1">Total Fees (SOL)</h3>
                    <p className="text-2xl font-bold text-white">{(stats.feeTotals.SOL || 0).toLocaleString()} SOL</p>
                  </div>
                  <div className="bg-gray-800 p-4 rounded-lg">
                    <h3 className="text-sm font-medium text-gray-400 mb-1">Total Fees (SOLY)</h3>
                    <p className="text-2xl font-bold text-white">{(stats.feeTotals.SOLY || 0).toLocaleString()} SOLY</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Admin Wallet */}
          {adminWallet && (
            <Card>
              <CardHeader className="flex items-center">
                <div className="flex items-center">
                  <Wallet className="h-5 w-5 text-purple-400 mr-2" />
                  <h2 className="text-xl font-semibold text-white">Admin Wallet</h2>
                </div>
              </CardHeader>
              <CardContent>
                <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h3 className="text-sm font-medium text-gray-400 mb-1">Wallet Address</h3>
                      <p className="text-white font-mono bg-gray-900 p-2 rounded">{adminWallet.address}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-400 mb-1">Total Fees Collected</h3>
                      <div className="space-y-2">
                        <p className="text-white">
                          <span className="font-medium">SOL:</span> {(adminWallet.feeTotals.SOL || 0).toLocaleString()} SOL
                        </p>
                        <p className="text-white">
                          <span className="font-medium">SOLY:</span> {(adminWallet.feeTotals.SOLY || 0).toLocaleString()} SOLY
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Fee Settings */}
          {feeSettings && (
            <Card>
              <CardHeader className="flex items-center">
                <div className="flex items-center">
                  <DollarSign className="h-5 w-5 text-purple-400 mr-2" />
                  <h2 className="text-xl font-semibold text-white">Fee Settings</h2>
                </div>
              </CardHeader>
              <CardContent>
                <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <h3 className="text-sm font-medium text-gray-400 mb-1">Creation Fee</h3>
                      <p className="text-xl font-bold text-white">{feeSettings.creationFeePercentage}%</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-400 mb-1">Resolution Fee</h3>
                      <p className="text-xl font-bold text-white">{feeSettings.resolutionFeePercentage}%</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-400 mb-1">Referral Reward</h3>
                      <p className="text-xl font-bold text-white">{feeSettings.referralRewardPercentage}%</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Partner Wallets */}
          <Card>
            <CardHeader className="flex items-center">
              <div className="flex items-center">
                <Wallet className="h-5 w-5 text-purple-400 mr-2" />
                <h2 className="text-xl font-semibold text-white">Partner Wallets</h2>
              </div>
            </CardHeader>
            <CardContent>
              <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
                <div className="text-sm text-gray-300 mb-4">
                  <div className="flex items-center">
                    <AlertCircle className="h-4 w-4 text-yellow-400 mr-2" />
                    <span>
                      Partners receive a percentage of the {feeSettings?.creationFeePercentage || 10}% creation fee.
                      Admin receives the remaining {calculateAdminPercentage()}% of the creation fee.
                    </span>
                  </div>
                </div>

                {partnerWallets.length === 0 ? (
                  <div className="text-center py-6 text-gray-400">
                    No partner wallets configured.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {partnerWallets.map((wallet, index) => (
                      <div key={index} className="bg-gray-900 p-4 rounded-lg border border-gray-700">
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                          <div className="md:col-span-3">
                            <h4 className="text-xs font-medium text-gray-400 mb-1">
                              Partner Name
                            </h4>
                            <p className="text-white">{wallet.name || 'Unnamed Partner'}</p>
                          </div>
                          <div className="md:col-span-5">
                            <h4 className="text-xs font-medium text-gray-400 mb-1">
                              Wallet Address
                            </h4>
                            <p className="text-white font-mono">{wallet.walletAddress}</p>
                          </div>
                          <div className="md:col-span-2">
                            <h4 className="text-xs font-medium text-gray-400 mb-1">
                              Fee Percentage
                            </h4>
                            <p className="text-white">{wallet.feePercentage}%</p>
                          </div>
                          <div className="md:col-span-2">
                            <h4 className="text-xs font-medium text-gray-400 mb-1">
                              Status
                            </h4>
                            <p className={`${wallet.active ? 'text-green-400' : 'text-red-400'}`}>
                              {wallet.active ? 'Active' : 'Inactive'}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default SubAdminWalletsPage;
