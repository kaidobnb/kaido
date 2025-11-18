import React, { useState, useEffect } from 'react';
import { Wallet, ArrowUpRight, ArrowDownRight, Plus, Activity, Clock, AlertCircle } from 'lucide-react';
import Card, { CardHeader, CardContent } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Tabs from '../components/ui/Tabs';
import PredictionCard from '../components/prediction/PredictionCard';
import { useWallet, refreshWalletBalances } from '../contexts/WalletContext';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../hooks/useToast';
import {
  getUserPredictions,
  getUserTransactions,
  getPortfolioSummary
} from '../services/api';

// Define types for our data
interface Transaction {
  id: string;
  type: 'deposit' | 'prediction' | 'win' | 'withdraw';
  amount: number;
  timestamp: string;
  status: string;
  marketTitle?: string;
  position?: string;
}

interface PortfolioSummary {
  bnbBalance: number;
  winRate: number;
  totalProfitLoss: number;
  weeklyChange: {
    bnb: {
      amount: number;
      percentage: number;
    };
  };
}

interface Prediction {
  id: string;
  title: string;
  description?: string;
  asset?: string;
  type: 'binary' | 'multiple';
  endDate: string;
  status: 'active' | 'resolved' | 'cancelled';
  volume: number;
  tokenType: 'BNB' | 'KAIDO';
  currentProbability: number;
  userPosition?: string;
  participants: number;
  createdAt: string;
  createdBy: string;
  totalStaked: number;
  imageUrl?: string;
}

const PortfolioPage: React.FC = () => {
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [userPredictions, setUserPredictions] = useState<Prediction[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [portfolioSummary, setPortfolioSummary] = useState<PortfolioSummary>({
    bnbBalance: 0,
    winRate: 0,
    totalProfitLoss: 0,
    weeklyChange: {
      bnb: { amount: 0, percentage: 0 }
    }
  });
  const [error, setError] = useState<string | null>(null);

  const { wallet, connectWallet } = useWallet();
  const { isAuthenticated } = useAuth();
  const { showToast } = useToast();

  // Log wallet data for debugging (safe logging without circular references)
  useEffect(() => {
    console.log('Wallet context data:', {
      connected: wallet.connected,
      address: wallet.address,
      balance: wallet.balance,
      connecting: wallet.connecting,
      error: wallet.error
    });
  }, [wallet]);

  // Define fetchUserData function at component level
  const fetchUserData = async () => {
    if (!isAuthenticated) {
      setIsLoading(false);
      return;
    }

    // Only set loading state if this is the initial load, not for background refreshes
    if (!userPredictions.length && !transactions.length) {
      setIsLoading(true);
    }

    setError(null);

    // Refresh wallet balances first to ensure we have the latest data
    try {
      await refreshWalletBalances();
    } catch (refreshError) {
      console.error('Error refreshing wallet balances:', refreshError);
      // Continue with the rest of the data fetching even if balance refresh fails
    }

    try {
      // Fetch user predictions
      const predictionsResponse = await getUserPredictions();
      console.log('User predictions response:', JSON.stringify(predictionsResponse, null, 2));
      console.log('Raw API response structure:', predictionsResponse);

      if (predictionsResponse.success) {
        const apiPredictions = predictionsResponse.predictions || [];
        console.log('API predictions data:', JSON.stringify(apiPredictions, null, 2));

        // Filter out predictions that don't have valid participation data
        // This ensures we only show predictions the user has actually participated in
        const validPredictions = apiPredictions.filter((pred: any) => {
          // Check if this is a valid prediction with participation data
          return pred &&
                 ((pred.participation && pred.prediction) ||
                  (pred.userPosition && (pred.id || pred._id)));
        });

        console.log('Filtered valid predictions:', validPredictions.length);

        // Map API predictions to our component's expected format for PredictionCard
        const mappedPredictions = validPredictions.map((pred: any) => {
          console.log('Processing prediction item:', pred);

          // Handle different API response formats
          let prediction: any = {};
          let participation: any = {};

          if (pred.prediction) {
            // Format from backend/src/controllers/predictionController.ts
            prediction = pred.prediction || {};
            participation = pred.participation || {};
          } else if (pred.id || pred._id) {
            // Direct prediction object format
            prediction = pred;
            participation = pred.userPosition ? { position: pred.userPosition } : {};
          }

          console.log('Extracted prediction:', prediction);
          console.log('Extracted participation:', participation);

          // Calculate current probability for binary predictions
          let currentProbability = 0.5; // Default to 50%
          if (prediction.choices && prediction.choices.length > 0) {
            const yesChoice = prediction.choices.find((c: any) => c.id === 'yes' || c.label === 'Yes');
            if (yesChoice) {
              currentProbability = yesChoice.percentage ? yesChoice.percentage / 100 : 0.5;
            }
          }

          // Determine user position
          let userPosition: string | undefined;
          if (participation.position) {
            userPosition = participation.position.toLowerCase();
          } else if (pred.userPosition) {
            userPosition = typeof pred.userPosition === 'string'
              ? pred.userPosition.toLowerCase()
              : pred.userPosition.choiceId ? pred.userPosition.choiceId.toLowerCase() : undefined;
          }

          // Get prediction ID
          const id = prediction._id || prediction.id || pred._id || pred.id || `pred-${Math.random().toString(36).substring(2, 11)}`;

          // Get prediction type, ensuring compatibility with PredictionCard
          const type = (prediction.type || pred.type || 'binary').replace('multiple', 'multiple') as 'binary' | 'multiple';

          // Return prediction in the format PredictionCard expects
          return {
            id: id,
            title: prediction.title || pred.title || 'Untitled Prediction',
            description: prediction.description || pred.description,
            asset: prediction.asset || pred.asset,
            type: type,
            endDate: prediction.endDate || pred.endDate || new Date().toISOString(),
            status: prediction.status || pred.status || 'active',
            volume: prediction.volume || participation.amount || pred.volume || pred.totalStaked || 0,
            tokenType: prediction.tokenType || pred.tokenType || 'BNB',
            currentProbability: pred.currentProbability || currentProbability,
            userPosition: userPosition,
            participants: prediction.participants || pred.participants || 0,
            createdAt: prediction.createdAt || pred.createdAt || new Date().toISOString(),
            createdBy: prediction.creator || pred.createdBy || '',
            totalStaked: prediction.volume || pred.totalStaked || 0,
            imageUrl: prediction.imageUrl || pred.imageUrl
          };
        });

        console.log('Mapped predictions:', JSON.stringify(mappedPredictions, null, 2));
        setUserPredictions(mappedPredictions);
      }

      // Fetch user transactions
      const transactionsResponse = await getUserTransactions();
      console.log('Transactions response:', JSON.stringify(transactionsResponse, null, 2));

      if (transactionsResponse.success) {
        const apiTransactions = transactionsResponse.transactions || [];
        console.log('API transactions data:', JSON.stringify(apiTransactions, null, 2));

        // Map API transactions to our component's expected format if needed
        const mappedTransactions = apiTransactions.map((tx: any) => {
          console.log('Processing transaction:', tx);

          // Return transaction in the format our component expects
          return {
            id: tx._id || tx.id || `tx-${Math.random().toString(36).substring(2, 11)}`,
            type: tx.type || 'deposit',
            amount: tx.amount || 0,
            timestamp: tx.timestamp || tx.createdAt || new Date().toISOString(),
            status: tx.status || 'completed',
            marketTitle: tx.marketTitle || tx.predictionTitle || undefined,
            position: tx.position || undefined
          };
        });

        console.log('Mapped transactions:', JSON.stringify(mappedTransactions, null, 2));
        setTransactions(mappedTransactions);
      }

      // Fetch portfolio summary
      const summaryResponse = await getPortfolioSummary();
      console.log('Portfolio summary response:', JSON.stringify(summaryResponse, null, 2));

      if (summaryResponse.success && summaryResponse.portfolio) {
        // Map the API response to our component's expected structure
        const apiPortfolio = summaryResponse.portfolio;
        console.log('API Portfolio data:', JSON.stringify(apiPortfolio, null, 2));

        // Use wallet balances instead of API response to ensure consistency with header
        const bnbBalance = wallet?.balance?.bnb || wallet?.balance?.sol || 0;

        console.log('Using wallet balances - BNB:', bnbBalance);
        console.log('API balances (not used) - BNB:', apiPortfolio.balances?.BNB || apiPortfolio.balances?.SOL || 0);

        // Calculate total profit/loss (winnings - activeParticipations)
        const bnbProfitLoss =
          (apiPortfolio.winnings?.BNB || apiPortfolio.winnings?.SOL || 0) -
          (apiPortfolio.activeParticipations?.BNB || apiPortfolio.activeParticipations?.SOL || 0);

        // Calculate win rate (placeholder - would need actual win/loss data)
        const winRate = 0.68; // 68% placeholder

        // Calculate weekly changes (using real data if available, otherwise placeholders)
        const bnbWeeklyAmount = 45.8; // Placeholder
        const bnbWeeklyPercentage = 23; // Placeholder

        const updatedPortfolio = {
          bnbBalance: bnbBalance,
          winRate: winRate,
          totalProfitLoss: bnbProfitLoss,
          weeklyChange: {
            bnb: {
              amount: bnbWeeklyAmount,
              percentage: bnbWeeklyPercentage
            }
          }
        };

        console.log('Updated portfolio summary:', JSON.stringify(updatedPortfolio, null, 2));
        setPortfolioSummary(updatedPortfolio);
      } else {
        // Fallback to wallet balance if API fails
        // Use placeholder weekly change data for consistent UI
        const bnbWeeklyAmount = 45.8; // Placeholder
        const bnbWeeklyPercentage = 23; // Placeholder

        // Use wallet balances consistently
        const bnbBalance = wallet?.balance?.bnb || wallet?.balance?.sol || 0;

        console.log('Using wallet balances (API fallback) - BNB:', bnbBalance);

        const fallbackPortfolio = {
          bnbBalance: bnbBalance,
          winRate: 0.68, // Placeholder
          totalProfitLoss: 0,
          weeklyChange: {
            bnb: {
              amount: bnbWeeklyAmount,
              percentage: bnbWeeklyPercentage
            }
          }
        };

        console.log('Fallback portfolio summary:', JSON.stringify(fallbackPortfolio, null, 2));
        setPortfolioSummary(fallbackPortfolio);
      }
    } catch (err) {
      console.error('Error fetching portfolio data:', err);
      setError('Failed to load portfolio data. Please try again later.');
      showToast({
        type: 'error',
        title: 'Error',
        message: 'Failed to load portfolio data'
      });

      // Set fallback data on error
      // Use placeholder weekly change data for consistent UI
      const bnbWeeklyAmount = 45.8; // Placeholder
      const bnbWeeklyPercentage = 23; // Placeholder

      // Use wallet balances consistently
      const bnbBalance = wallet?.balance?.bnb || wallet?.balance?.sol || 0;

      console.log('Using wallet balances (error fallback) - BNB:', bnbBalance);

      const errorFallbackPortfolio = {
        bnbBalance: bnbBalance,
        winRate: 0.68, // Placeholder
        totalProfitLoss: 0,
        weeklyChange: {
          bnb: {
            amount: bnbWeeklyAmount,
            percentage: bnbWeeklyPercentage
          }
        }
      };

      console.log('Error fallback portfolio:', JSON.stringify(errorFallbackPortfolio, null, 2));
      setPortfolioSummary(errorFallbackPortfolio);
    } finally {
      setIsLoading(false);
    }
  };

  // Set up polling for portfolio data
  useEffect(() => {
    // Don't poll if not authenticated
    if (!isAuthenticated) return;

    console.log('Setting up portfolio data polling...');

    // Initial fetch is handled by the main useEffect

    // Set up polling interval (every 60 seconds)
    const intervalId = setInterval(() => {
      console.log('Polling for updated portfolio data...');
      // Use a silent refresh that doesn't trigger loading states
      const silentRefresh = async () => {
        try {
          // Don't set loading state for background refreshes
          await refreshWalletBalances();
          const predictionsResponse = await getUserPredictions();
          if (predictionsResponse.success) {
            setUserPredictions(predictionsResponse.predictions.map((pred: any) => {
              // Map prediction data to the format expected by PredictionCard
              // This is a simplified version of the mapping in fetchUserData
              let prediction: any = {};
              let participation: any = {};

              if (pred.prediction) {
                prediction = pred.prediction || {};
                participation = pred.participation || {};
              } else if (pred.id || pred._id) {
                prediction = pred;
                participation = pred.userPosition ? { position: pred.userPosition } : {};
              }

              // Get prediction ID
              const id = prediction._id || prediction.id || pred._id || pred.id || `pred-${Math.random().toString(36).substring(2, 11)}`;

              // Get prediction type
              const type = (prediction.type || pred.type || 'binary').replace('multiple', 'multiple') as 'binary' | 'multiple';

              // Determine user position
              let userPosition: string | undefined;
              if (participation.position) {
                userPosition = participation.position.toLowerCase();
              } else if (pred.userPosition) {
                userPosition = typeof pred.userPosition === 'string'
                  ? pred.userPosition.toLowerCase()
                  : pred.userPosition.choiceId ? pred.userPosition.choiceId.toLowerCase() : undefined;
              }

              return {
                id: id,
                title: prediction.title || pred.title || 'Untitled Prediction',
                description: prediction.description || pred.description,
                asset: prediction.asset || pred.asset,
                type: type,
                endDate: prediction.endDate || pred.endDate || new Date().toISOString(),
                status: prediction.status || pred.status || 'active',
                volume: prediction.volume || participation.amount || pred.volume || pred.totalStaked || 0,
                tokenType: prediction.tokenType || pred.tokenType || 'BNB',
                currentProbability: pred.currentProbability || 0.5,
                userPosition: userPosition,
                participants: prediction.participants || pred.participants || 0,
                createdAt: prediction.createdAt || pred.createdAt || new Date().toISOString(),
                createdBy: prediction.creator || pred.createdBy || '',
                totalStaked: prediction.volume || pred.totalStaked || 0,
                imageUrl: prediction.imageUrl || pred.imageUrl
              };
            }));
          }
        } catch (error) {
          console.error('Silent refresh error:', error);
        }
      };

      silentRefresh();
    }, 60000); // 60 seconds

    // Clean up on unmount
    return () => {
      console.log('Cleaning up portfolio data polling...');
      clearInterval(intervalId);
    };
  }, [isAuthenticated, wallet, showToast]);

  // Fetch user data on initial load
  useEffect(() => {
    // Call the fetchUserData function defined above
    fetchUserData();
  }, [isAuthenticated, wallet, showToast]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };



  // Render the not authenticated state
  const renderNotAuthenticated = () => (
    <div className="bg-black/90 rounded-lg p-8 text-center max-w-md mx-auto border border-yellow-500/20">
      <div className="h-16 w-16 bg-black/50 rounded-full mx-auto mb-4 flex items-center justify-center border border-yellow-500/30">
        <Wallet className="h-8 w-8 text-yellow-400" />
      </div>
      <h2 className="text-2xl text-white font-medium mb-3">Connect Your Wallet</h2>
      <p className="text-gray-300 mb-6">Connect your wallet to view your portfolio, active predictions, and transaction history.</p>
      <Button
        variant="primary"
        size="lg"
        onClick={connectWallet}
        fullWidth
      >
        Connect Wallet
      </Button>
    </div>
  );

  // Render portfolio content
  const renderPortfolioContent = () => (
    <CardContent>
      {isLoading ? (
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500"></div>
        </div>
      ) : error ? (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 flex items-start">
          <AlertCircle className="h-5 w-5 text-red-400 mr-3 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-white font-medium mb-1">Error Loading Portfolio</h3>
            <p className="text-gray-300 text-sm">{error}</p>
          </div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="bg-black/90 rounded-lg p-4 border border-yellow-500/20" style={{ height: '120px' }}>
              <div className="flex items-center mb-3">
                <Wallet className="h-5 w-5 text-yellow-400 mr-2 flex-shrink-0" />
                <h3 className="text-white font-medium">BNB Balance</h3>
              </div>
              <div className="text-2xl font-bold text-white mb-1">{(wallet?.balance?.bnb || wallet?.balance?.sol || 0).toFixed(2)}</div>
              <div className={`flex items-center text-xs ${(portfolioSummary?.weeklyChange?.bnb?.percentage || 0) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {(portfolioSummary?.weeklyChange?.bnb?.percentage || 0) >= 0 ? (
                  <ArrowUpRight className="h-3 w-3 mr-1 flex-shrink-0" />
                ) : (
                  <ArrowDownRight className="h-3 w-3 mr-1 flex-shrink-0" />
                )}
                <span>
                  {(portfolioSummary?.weeklyChange?.bnb?.percentage || 0) >= 0 ? '+' : ''}
                  {(portfolioSummary?.weeklyChange?.bnb?.amount || 0).toFixed(1)}
                  ({Math.abs(portfolioSummary?.weeklyChange?.bnb?.percentage || 0).toFixed(1)}%) this week
                </span>
              </div>
            </div>



            <div className="bg-black/90 rounded-lg p-4 border border-yellow-500/20" style={{ height: '120px' }}>
              <div className="flex items-center mb-3">
                <Activity className="h-5 w-5 text-yellow-400 mr-2 flex-shrink-0" />
                <h3 className="text-white font-medium">Prediction Stats</h3>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="text-xs text-yellow-400">Win Rate</div>
                  <div className="text-lg font-bold text-white">{((portfolioSummary?.winRate || 0) * 100).toFixed(0)}%</div>
                </div>
                <div>
                  <div className="text-xs text-yellow-400">Total P/L</div>
                  <div className={`text-lg font-bold ${(portfolioSummary?.totalProfitLoss || 0) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {(portfolioSummary?.totalProfitLoss || 0) >= 0 ? '+' : ''}
                    {Math.abs(portfolioSummary?.totalProfitLoss || 0).toFixed(1)}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl text-white font-medium">Your Active Predictions</h2>
            {isLoading && (
              <div className="flex items-center text-xs text-yellow-400">
                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-yellow-500 mr-2"></div>
                Updating...
              </div>
            )}
          </div>

          {userPredictions.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {userPredictions.map((prediction) => (
                <PredictionCard key={prediction.id} prediction={prediction} />
              ))}
            </div>
          ) : (
            <div className="bg-black/90 rounded-lg p-6 text-center border border-yellow-500/20">
              <div className="h-16 w-16 bg-black/50 rounded-full mx-auto mb-4 flex items-center justify-center border border-yellow-500/30">
                <Clock className="h-8 w-8 text-yellow-400" />
              </div>
              <h3 className="text-white font-medium mb-2">No Active Predictions</h3>
              <p className="text-gray-300 text-sm mb-4">You haven't joined any prediction markets yet.</p>
              <Button
                variant="primary"
                onClick={() => window.location.href = '/'}
              >
                Explore Markets
              </Button>
            </div>
          )}
        </>
      )}
    </CardContent>
  );

  // Render transaction history tab content
  const renderTransactionHistory = () => (
    <div className="overflow-x-auto">
      {isLoading && transactions.length === 0 ? (
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-yellow-500"></div>
        </div>
      ) : transactions.length === 0 ? (
        <div className="p-6 text-center">
          <div className="h-16 w-16 bg-black/50 rounded-full mx-auto mb-4 flex items-center justify-center border border-yellow-500/30">
            <Wallet className="h-8 w-8 text-yellow-400" />
          </div>
          <h3 className="text-white font-medium mb-2">No Transactions Yet</h3>
          <p className="text-gray-300 text-sm mb-4 max-w-md mx-auto">
            Your transaction history will appear here once you start depositing funds and participating in predictions.
          </p>
        </div>
      ) : (
        <table className="w-full">
          <thead>
            <tr className="bg-black/50 border-b border-yellow-500/20">
              <th className="text-left p-4 text-yellow-400 text-sm font-medium">Transaction</th>
              <th className="text-left p-4 text-yellow-400 text-sm font-medium">Type</th>
              <th className="text-right p-4 text-yellow-400 text-sm font-medium">Amount</th>
              <th className="text-right p-4 text-yellow-400 text-sm font-medium">Date</th>
              <th className="text-right p-4 text-yellow-400 text-sm font-medium">
                <div className="flex items-center justify-end">
                  Status
                  {isLoading && transactions.length > 0 && (
                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-yellow-500 ml-2"></div>
                  )}
                </div>
              </th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((tx) => (
              <tr key={tx.id} className="border-t border-yellow-500/20 hover:bg-black/30 transition-colors">
                <td className="p-4">
                  <div className="flex items-center">
                    <div className={`h-8 w-8 rounded-full flex items-center justify-center mr-3 ${
                      tx.type === 'deposit'
                        ? 'bg-yellow-500/20 text-yellow-400'
                        : tx.type === 'withdraw'
                          ? 'bg-orange-500/20 text-orange-400'
                          : tx.type === 'prediction'
                            ? 'bg-yellow-500/20 text-yellow-400'
                            : 'bg-green-500/20 text-green-400'
                    }`}>
                      {tx.type === 'deposit' && <Wallet className="h-4 w-4" />}
                      {tx.type === 'withdraw' && <Wallet className="h-4 w-4" />}
                      {tx.type === 'prediction' && <Activity className="h-4 w-4" />}
                      {tx.type === 'win' && <ArrowUpRight className="h-4 w-4" />}
                    </div>
                    <div>
                      {tx.type === 'deposit' ? (
                        <span className="font-medium text-white">Deposit</span>
                      ) : tx.type === 'withdraw' ? (
                        <span className="font-medium text-white">Withdraw</span>
                      ) : (
                        <span className="font-medium text-white">{tx.marketTitle}</span>
                      )}
                      {tx.position && (
                        <div className="text-xs text-gray-300">
                          Position: <span className={tx.position === 'YES' ? 'text-green-400' : 'text-gray-300'}>
                            {tx.position}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </td>
                <td className="p-4">
                  <span className="capitalize text-slate-300">{tx.type}</span>
                </td>
                <td className="p-4 text-right">
                  <span className={`font-medium ${
                    tx.type === 'win' ? 'text-green-400' :
                    tx.type === 'withdraw' ? 'text-orange-400' : 'text-white'
                  }`}>
                    {tx.type === 'win' ? '+' : tx.type === 'withdraw' ? '-' : ''}{tx.amount} BNB
                  </span>
                </td>
                <td className="p-4 text-right text-slate-300">
                  {formatDate(tx.timestamp)}
                </td>
                <td className="p-4 text-right">
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    tx.status === 'completed' ? 'bg-green-500/20 text-green-400' :
                    tx.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' :
                    'bg-red-500/20 text-red-400'
                  }`}>
                    {tx.status.charAt(0).toUpperCase() + tx.status.slice(1)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );

  // Render rewards tab content
  const renderRewardsContent = () => (
    <div className="p-6 text-center">
      <div className="h-16 w-16 bg-yellow-500/20 rounded-full mx-auto mb-4 flex items-center justify-center">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
      <h3 className="text-white font-medium mb-2">Earn Rewards</h3>
      <p className="text-slate-400 text-sm mb-4 max-w-md mx-auto">
        Participate in predictions, invite friends, and maintain a high win rate to earn rewards.
      </p>
      <Button
        variant="primary"
        onClick={() => window.location.href = '/referrals'}
      >
        Learn More
      </Button>
    </div>
  );





  // Main render
  return (
    <div className="container mx-auto px-4 py-12">
      {!isAuthenticated ? (
        renderNotAuthenticated()
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {/* Portfolio, predictions, and transactions */}
          <div>
            <Card className="mb-6">
              <CardHeader className="border-b border-slate-700">
                <div className="flex justify-between items-center">
                  <h1 className="text-2xl text-white font-medium">Your Portfolio</h1>
                  {isLoading && (
                    <div className="flex items-center text-xs text-slate-400">
                      <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-yellow-500 mr-2"></div>
                      Updating...
                    </div>
                  )}
                </div>
              </CardHeader>
              {renderPortfolioContent()}
            </Card>

            <Card>
              <CardContent className="p-0">
                <Tabs
                  tabs={[
                    {
                      id: 'transactions',
                      label: 'Transaction History',
                      content: renderTransactionHistory()
                    },
                    {
                      id: 'rewards',
                      label: 'Rewards',
                      content: renderRewardsContent()
                    }
                  ]}
                />
              </CardContent>
            </Card>
          </div>


        </div>
      )}
    </div>
  );
};

export default PortfolioPage;
