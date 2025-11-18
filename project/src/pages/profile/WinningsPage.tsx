import React, { useState, useEffect } from 'react';
import { Award, CheckCircle, Clock, ArrowRight, Info } from 'lucide-react';
import Card, { CardHeader, CardContent } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { getClaimableWinnings, claimWinnings } from '../../services/api';
import { useToast } from '../../hooks/useToast';
import { useWallet } from '../../contexts/WalletContext';

interface Winning {
  id: string;
  prediction: {
    id: string;
    title: string;
    asset: string;
    resolvedChoice: string;
  };
  position: string;
  amount: number;
  reward: number;
  tokenType: 'SOL' | 'SOLY' | 'BNB' | 'KAIDO';
  pendingApproval?: boolean;
}

const WinningsPage: React.FC = () => {
  const [winnings, setWinnings] = useState<Winning[]>([]);
  const [totals, setTotals] = useState<{ SOL?: number; SOLY?: number; BNB?: number; KAIDO?: number }>({});
  const [isLoading, setIsLoading] = useState(true);
  const [claimingIds, setClaimingIds] = useState<string[]>([]);
  const { showToast } = useToast();
  const { wallet } = useWallet();

  // Fetch claimable winnings
  useEffect(() => {
    const fetchWinnings = async () => {
      setIsLoading(true);
      try {
        const response = await getClaimableWinnings();
        if (response.success) {
          setWinnings(response.winnings || []);
          setTotals(response.totals || {});
        } else {
          showToast({
            type: 'error',
            title: 'Error',
            message: response.message || 'Failed to load winnings'
          });
        }
      } catch (error) {
        console.error('Error fetching winnings:', error);
        showToast({
          type: 'error',
          title: 'Error',
          message: 'Failed to load winnings. Please try again.'
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchWinnings();
  }, [showToast]);

  // Handle claiming a winning
  const handleClaim = async (winningId: string) => {
    setClaimingIds(prev => [...prev, winningId]);
    try {
      const response = await claimWinnings(winningId);
      if (response.success) {
        // If the claim is pending approval, update its status but don't remove it
        if (response.status === 'pending') {
          setWinnings(prev => prev.map(w =>
            w.id === winningId
              ? { ...w, pendingApproval: true }
              : w
          ));

          showToast({
            type: 'info',
            title: 'Claim Submitted',
            message: `Your claim for ${response.amount} ${response.tokenType} is pending admin approval`
          });
        } else {
          // If auto-approved, remove from the list
          setWinnings(prev => prev.filter(w => w.id !== winningId));

          // Update totals
          const claimedWinning = winnings.find(w => w.id === winningId);
          if (claimedWinning) {
            setTotals(prev => ({
              ...prev,
              [claimedWinning.tokenType]: (prev[claimedWinning.tokenType] || 0) - claimedWinning.reward
            }));
          }

          showToast({
            type: 'success',
            title: 'Success',
            message: `Successfully claimed ${response.amount} ${response.tokenType}`
          });
        }
      } else {
        showToast({
          type: 'error',
          title: 'Error',
          message: response.message || 'Failed to claim winning'
        });
      }
    } catch (error) {
      console.error('Error claiming winning:', error);
      showToast({
        type: 'error',
        title: 'Error',
        message: 'Failed to claim winning. Please try again.'
      });
    } finally {
      setClaimingIds(prev => prev.filter(id => id !== winningId));
    }
  };

  // Handle claiming all winnings
  const handleClaimAll = async () => {
    if (winnings.length === 0) return;

    // Filter out any winnings that are already pending approval
    const claimableWinnings = winnings.filter(w => !w.pendingApproval);
    if (claimableWinnings.length === 0) {
      showToast({
        type: 'info',
        title: 'Info',
        message: 'All winnings are already pending approval'
      });
      return;
    }

    // Set all winnings as claiming
    const allIds = claimableWinnings.map(w => w.id);
    setClaimingIds(allIds);

    // Track which winnings are pending approval
    const pendingApprovalIds: string[] = [];

    // Claim each winning one by one
    for (const winning of claimableWinnings) {
      try {
        const response = await claimWinnings(winning.id);
        if (response.success) {
          if (response.status === 'pending') {
            pendingApprovalIds.push(winning.id);
            showToast({
              type: 'info',
              title: 'Claim Submitted',
              message: `Your claim for ${response.amount} ${response.tokenType} is pending admin approval`
            });
          } else {
            showToast({
              type: 'success',
              title: 'Success',
              message: `Claimed ${response.amount} ${response.tokenType}`
            });
          }
        } else {
          showToast({
            type: 'error',
            title: 'Error',
            message: `Failed to claim winning: ${response.message}`
          });
        }
      } catch (error) {
        console.error('Error claiming winning:', error);
        showToast({
          type: 'error',
          title: 'Error',
          message: `Failed to claim winning ${winning.id}`
        });
      }

      // Remove the winning from the claiming list
      setClaimingIds(prev => prev.filter(id => id !== winning.id));
    }

    // Update winnings that are now pending approval
    if (pendingApprovalIds.length > 0) {
      setWinnings(prev => prev.map(w =>
        pendingApprovalIds.includes(w.id)
          ? { ...w, pendingApproval: true }
          : w
      ));
    }

    // Refresh the winnings list for any that were auto-approved
    try {
      const response = await getClaimableWinnings();
      if (response.success) {
        // Merge the new winnings with the pending approval ones
        const newWinnings = response.winnings || [];

        // Keep track of winnings that are pending approval
        const updatedWinnings = newWinnings.map(w => {
          const existingWinning = winnings.find(ew => ew.id === w.id && ew.pendingApproval);
          if (existingWinning) {
            return { ...w, pendingApproval: true };
          }
          return w;
        });

        setWinnings(updatedWinnings);
        setTotals(response.totals || {});
      }
    } catch (error) {
      console.error('Error refreshing winnings:', error);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-white mb-6">Your Winnings</h1>

      {isLoading ? (
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500"></div>
        </div>
      ) : (
        <>
          {/* Summary Card */}
          <Card className="mb-8">
            <CardHeader>
              <h2 className="text-xl font-semibold text-white">Claimable Winnings</h2>
            </CardHeader>
            <CardContent>
              {winnings.length > 0 ? (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    {totals.BNB && totals.BNB > 0 && (
                      <div className="bg-slate-800 rounded-lg p-4 border border-slate-700/50">
                        <div className="flex items-center mb-3">
                          <Award className="h-5 w-5 text-yellow-400 mr-2 flex-shrink-0" />
                          <h3 className="text-white font-medium">BNB Winnings</h3>
                        </div>
                        <div className="text-2xl font-bold text-white mb-1">{totals.BNB.toFixed(2)} BNB</div>
                        <div className="text-xs text-slate-400">From {winnings.filter(w => w.tokenType === 'BNB').length} predictions</div>
                      </div>
                    )}

                    {totals.KAIDO && totals.KAIDO > 0 && (
                      <div className="bg-slate-800 rounded-lg p-4 border border-slate-700/50">
                        <div className="flex items-center mb-3">
                          <Award className="h-5 w-5 text-yellow-400 mr-2 flex-shrink-0" />
                          <h3 className="text-white font-medium">KAIDO Winnings</h3>
                        </div>
                        <div className="text-2xl font-bold text-white mb-1">{totals.KAIDO.toFixed(2)} KAIDO</div>
                        <div className="text-xs text-slate-400">From {winnings.filter(w => w.tokenType === 'KAIDO').length} predictions</div>
                      </div>
                    )}
                  </div>

                  <Button
                    variant="primary"
                    size="lg"
                    fullWidth
                    onClick={handleClaimAll}
                    disabled={claimingIds.length > 0 || winnings.length === 0}
                  >
                    {claimingIds.length > 0 ? (
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                        Claiming...
                      </div>
                    ) : (
                      'Claim All Winnings'
                    )}
                  </Button>

                  <div className="mt-3 text-center">
                    <div className="text-xs text-amber-400/80 flex items-center justify-center">
                      <Info className="h-3 w-3 mr-1" />
                      Claimed winnings require admin approval before being credited to your account
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center py-8">
                  <div className="h-16 w-16 bg-slate-700 rounded-full mx-auto mb-4 flex items-center justify-center">
                    <Clock className="h-8 w-8 text-slate-400" />
                  </div>
                  <h3 className="text-white font-medium mb-2">No Claimable Winnings</h3>
                  <p className="text-slate-400 text-sm mb-4">You don't have any claimable winnings at the moment.</p>
                  <Button variant="secondary" onClick={() => window.location.href = '/'}>
                    Explore Predictions
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Winnings List */}
          {winnings.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-white mb-4">Individual Winnings</h2>

              {winnings.map((winning) => (
                <Card key={winning.id} className="overflow-hidden">
                  <div className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex-1">
                      <h3 className="text-white font-medium mb-1 line-clamp-1">{winning.prediction.title}</h3>
                      <div className="flex flex-wrap gap-2 mb-2">
                        <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-slate-700 text-slate-300">
                          {winning.prediction.asset}
                        </span>
                        <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium ${
                          winning.position === winning.prediction.resolvedChoice
                            ? 'bg-green-500/20 text-green-400'
                            : 'bg-red-500/20 text-red-400'
                        }`}>
                          {winning.position}
                        </span>
                      </div>
                      <div className="flex items-center text-sm text-slate-400">
                        <span>You staked {winning.tokenType === 'BNB' ? winning.amount.toFixed(2) : winning.amount} {winning.tokenType}</span>
                        <ArrowRight className="h-3 w-3 mx-2" />
                        <span className="text-green-400 font-medium">Won {winning.tokenType === 'BNB' ? winning.reward.toFixed(2) : winning.reward} {winning.tokenType}</span>
                      </div>
                    </div>

                    {winning.pendingApproval ? (
                      <div className="flex items-center justify-center px-4 py-2 rounded-md bg-amber-500/20 text-amber-400 min-w-[120px]">
                        <Clock className="h-4 w-4 mr-1" />
                        Pending Approval
                      </div>
                    ) : (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleClaim(winning.id)}
                        disabled={claimingIds.includes(winning.id)}
                        className="min-w-[120px]"
                      >
                        {claimingIds.includes(winning.id) ? (
                          <div className="flex items-center justify-center">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            Claiming...
                          </div>
                        ) : (
                          <>
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Claim
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default WinningsPage;
