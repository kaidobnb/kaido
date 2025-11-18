import React, { useState, useEffect } from 'react';
import { Check, RefreshCw, Clock, DollarSign, User } from 'lucide-react';
import Card, { CardContent, CardHeader } from '../ui/Card';
import Button from '../ui/Button';
import { getAdminPendingReferralClaims, adminApproveReferralClaim } from '../../services/api';
import { useToast } from '../../hooks/useToast';

interface ReferralClaim {
  id: string;
  amount: number;
  tokenType: 'SOL' | 'SOLY';
  status: string;
  description: string;
  createdAt: string;
  user: {
    id: string;
    username: string;
    walletAddress: string;
  };
  transactionIds: string[];
}

interface ReferralClaimsApprovalProps {
  onClaimsUpdated?: () => void;
}

const ReferralClaimsApproval: React.FC<ReferralClaimsApprovalProps> = ({ onClaimsUpdated }) => {
  const [pendingClaims, setPendingClaims] = useState<ReferralClaim[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [processingClaimIds, setProcessingClaimIds] = useState<string[]>([]);
  const [confirmingClaimId, setConfirmingClaimId] = useState<string | null>(null);
  const { showToast } = useToast();

  const fetchPendingClaims = async () => {
    try {
      setIsLoading(true);
      const response = await getAdminPendingReferralClaims();

      if (response && response.success && response.claims) {
        setPendingClaims(response.claims);
      } else {
        console.warn('Failed to load pending claims:', response);
        setPendingClaims([]);
      }
    } catch (error) {
      console.error('Error fetching pending claims:', error);
      setPendingClaims([]);
    } finally {
      setIsLoading(false);
    }
  };

  const confirmApproval = (claimId: string) => {
    setConfirmingClaimId(claimId);
  };

  const cancelApproval = () => {
    setConfirmingClaimId(null);
  };

  const handleApproveClaim = async (claimId: string) => {
    try {
      setProcessingClaimIds(prev => [...prev, claimId]);
      const response = await adminApproveReferralClaim(claimId);

      if (response && response.success) {
        showToast({
          type: 'success',
          title: 'Claim Approved',
          message: response.message || 'Referral claim has been approved and processed.'
        });

        // Remove the approved claim from the list
        setPendingClaims(prev => prev.filter(claim => claim.id !== claimId));

        // Notify parent component that claims have been updated
        if (onClaimsUpdated) {
          onClaimsUpdated();
        }
      } else {
        showToast({
          type: 'error',
          title: 'Approval Failed',
          message: response?.message || 'Failed to approve referral claim.'
        });
      }
    } catch (error) {
      console.error('Error approving claim:', error);
      showToast({
        type: 'error',
        title: 'Error',
        message: 'Failed to approve referral claim.'
      });
    } finally {
      setProcessingClaimIds(prev => prev.filter(id => id !== claimId));
      setConfirmingClaimId(null);
    }
  };

  useEffect(() => {
    fetchPendingClaims();
  }, []);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div>
      <div className="flex justify-end mb-4">
        <Button
          variant="tertiary"
          size="sm"
          onClick={fetchPendingClaims}
          disabled={isLoading}
        >
          <RefreshCw className={`h-4 w-4 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh Claims
        </Button>
      </div>

      <div>
        {isLoading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
          </div>
        ) : pendingClaims.length === 0 ? (
          <div className="bg-slate-800 rounded-lg p-4 text-center">
            <p className="text-slate-300">No pending referral claims to approve</p>
          </div>
        ) : (
          <div className="space-y-4">
            {pendingClaims.map(claim => (
              <div key={claim.id} className="bg-slate-800 rounded-lg p-4">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <div className="flex items-center">
                      <User className="h-4 w-4 text-slate-400 mr-2" />
                      <span className="text-white font-medium">{claim.user.username || 'Unknown'}</span>
                    </div>
                    <div className="text-sm text-slate-400 mt-1">
                      {claim.user.walletAddress.substring(0, 8)}...{claim.user.walletAddress.substring(claim.user.walletAddress.length - 8)}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-white">
                      {claim.tokenType === 'SOL'
                        ? `${claim.amount.toFixed(4)} SOL`
                        : `${claim.amount.toLocaleString()} SOLY`}
                    </div>
                    <div className="text-xs text-slate-400 mt-1">
                      {formatDate(claim.createdAt)}
                    </div>
                  </div>
                </div>

                <div className="bg-slate-700/50 rounded-lg p-3 mb-4">
                  <div className="flex items-center mb-2">
                    <Clock className="h-4 w-4 text-amber-400 mr-2" />
                    <span className="text-sm text-amber-300">Awaiting Approval</span>
                  </div>
                  <p className="text-xs text-slate-400">{claim.description}</p>
                  <p className="text-xs text-slate-500 mt-1">
                    {claim.transactionIds.length} transaction{claim.transactionIds.length !== 1 ? 's' : ''} included
                  </p>
                  <div className="mt-2 pt-2 border-t border-slate-600/30">
                    <p className="text-xs text-slate-400">
                      <span className="text-slate-500">Requested:</span> {formatDate(claim.createdAt)}
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      <span className="text-slate-500">Wallet:</span> {claim.user.walletAddress.substring(0, 6)}...{claim.user.walletAddress.substring(claim.user.walletAddress.length - 4)}
                    </p>
                  </div>
                </div>

                {confirmingClaimId === claim.id ? (
                  <div className="space-y-2">
                    <p className="text-xs text-amber-300 mb-2 text-center">
                      Are you sure you want to approve this claim?
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={cancelApproval}
                      >
                        Cancel
                      </Button>
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => handleApproveClaim(claim.id)}
                        disabled={processingClaimIds.includes(claim.id)}
                      >
                        {processingClaimIds.includes(claim.id) ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            Processing...
                          </>
                        ) : (
                          <>
                            <Check className="h-4 w-4 mr-2" />
                            Confirm
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Button
                    variant="primary"
                    size="sm"
                    className="w-full"
                    onClick={() => confirmApproval(claim.id)}
                    disabled={processingClaimIds.includes(claim.id)}
                  >
                    <Check className="h-4 w-4 mr-2" />
                    Approve Claim
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ReferralClaimsApproval;
