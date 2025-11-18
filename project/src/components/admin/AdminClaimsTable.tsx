import React, { useState, useEffect } from 'react';
import { CheckCircle, Clock, AlertCircle, ToggleLeft, ToggleRight } from 'lucide-react';
import Button from '../ui/Button';
import { useToast } from '../../hooks/useToast';
import { getPendingClaims, approveClaimById, toggleAutoApprove, getAdminSettings } from '../../services/api';

interface Claim {
  id: string;
  user: {
    id: string;
    username: string;
    walletAddress: string;
  };
  prediction: {
    id: string;
    title: string;
    asset: string;
    tokenType: 'SOL' | 'SOLY';
  };
  position: string;
  amount: number;
  reward: number;
  createdAt: string;
  claimedAt: string;
}

interface Transaction {
  id: string;
  user: {
    id: string;
    username: string;
  };
  prediction: {
    id: string;
    title: string;
  };
  amount: number;
  tokenType: 'SOL' | 'SOLY';
  status: string;
  createdAt: string;
}

interface AdminClaimsTableProps {
  onClaimsUpdated?: () => void;
}

const AdminClaimsTable: React.FC<AdminClaimsTableProps> = ({ onClaimsUpdated }) => {
  const [claims, setClaims] = useState<Claim[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [approvingIds, setApprovingIds] = useState<string[]>([]);
  const [autoApprove, setAutoApprove] = useState(false);
  const [toggleLoading, setToggleLoading] = useState(false);
  const { showToast } = useToast();

  // Fetch pending claims
  const fetchPendingClaims = async () => {
    try {
      setLoading(true);
      const response = await getPendingClaims();

      if (response.success) {
        setClaims(response.claims || []);
        setTransactions(response.transactions || []);
      } else {
        setError(response.message || 'Failed to load pending claims');
      }
    } catch (err) {
      setError('Error loading pending claims');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch admin settings
  const fetchAdminSettings = async () => {
    try {
      const response = await getAdminSettings();

      if (response.success && response.settings) {
        setAutoApprove(response.settings.autoApproveClaims || false);
      }
    } catch (err) {
      console.error('Error loading admin settings:', err);
    }
  };

  // Load data on component mount
  useEffect(() => {
    fetchPendingClaims();
    fetchAdminSettings();
  }, []);

  // Handle approving a claim
  const handleApproveClaim = async (claimId: string) => {
    try {
      // Log the claim ID for debugging
      console.log('Approving claim with ID:', claimId);

      if (!claimId || claimId === 'undefined') {
        showToast({
          type: 'error',
          title: 'Error',
          message: 'Invalid claim ID'
        });
        return;
      }

      setApprovingIds(prev => [...prev, claimId]);

      const response = await approveClaimById(claimId);

      if (response.success) {
        showToast({
          type: 'success',
          title: 'Success',
          message: 'Claim approved successfully'
        });

        // Remove the approved claim from the list
        setClaims(prev => prev.filter(claim => claim.id !== claimId));

        // Notify parent component that claims have been updated
        if (onClaimsUpdated) {
          onClaimsUpdated();
        }
      } else {
        showToast({
          type: 'error',
          title: 'Error',
          message: response.message || 'Failed to approve claim'
        });
      }
    } catch (err) {
      console.error('Error approving claim:', err);
      showToast({
        type: 'error',
        title: 'Error',
        message: 'An error occurred while approving the claim'
      });
    } finally {
      setApprovingIds(prev => prev.filter(id => id !== claimId));
    }
  };

  // Handle toggling auto-approve
  const handleToggleAutoApprove = async () => {
    try {
      setToggleLoading(true);

      const response = await toggleAutoApprove(!autoApprove);

      if (response.success) {
        setAutoApprove(!autoApprove);
        showToast({
          type: 'success',
          title: 'Success',
          message: `Auto-approve ${!autoApprove ? 'enabled' : 'disabled'} successfully`
        });
      } else {
        showToast({
          type: 'error',
          title: 'Error',
          message: response.message || 'Failed to toggle auto-approve'
        });
      }
    } catch (err) {
      console.error('Error toggling auto-approve:', err);
      showToast({
        type: 'error',
        title: 'Error',
        message: 'An error occurred while toggling auto-approve'
      });
    } finally {
      setToggleLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-500/20 border border-red-500 rounded-lg p-4 flex items-center">
        <AlertCircle className="h-5 w-5 mr-2 text-red-500" />
        <p className="text-red-100">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center">
          <h3 className="text-lg font-medium text-white">Pending Prediction Claims</h3>
          {claims.length > 0 && (
            <span className="ml-2 text-sm text-slate-400">({claims.length})</span>
          )}
        </div>

        <Button
          variant="secondary"
          size="sm"
          onClick={handleToggleAutoApprove}
          disabled={toggleLoading}
        >
          {toggleLoading ? (
            <div className="flex items-center">
              <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
              Loading...
            </div>
          ) : (
            <div className="flex items-center">
              {autoApprove ? (
                <ToggleRight className="h-4 w-4 mr-2 text-green-400" />
              ) : (
                <ToggleLeft className="h-4 w-4 mr-2 text-slate-400" />
              )}
              Auto-Approve Claims: {autoApprove ? 'ON' : 'OFF'}
            </div>
          )}
        </Button>
      </div>

      {claims.length === 0 ? (
        <div className="bg-slate-800 rounded-lg p-8 text-center">
          <Clock className="h-12 w-12 mx-auto mb-4 text-slate-500" />
          <h3 className="text-lg font-medium text-white mb-2">No Pending Claims</h3>
          <p className="text-slate-400">All claims have been processed.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-slate-700">
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">User</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Prediction</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Position</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Amount</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Reward</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Claimed At</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
              {claims.map((claim) => (
                <tr key={claim.id} className="hover:bg-slate-800/50">
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="ml-2">
                        <div className="text-sm font-medium text-white">{claim.user.username || 'Anonymous'}</div>
                        <div className="text-xs text-slate-400 truncate max-w-[120px]">{claim.user.walletAddress}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="text-sm text-white truncate max-w-[200px]">{claim.prediction.title}</div>
                    <div className="text-xs text-slate-400">{claim.prediction.asset}</div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className="px-2 py-1 text-xs rounded-full bg-slate-700 text-white">
                      {claim.position}
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-white">
                    {claim.amount} {claim.prediction.tokenType}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className="text-sm font-medium text-green-400">
                      {claim.reward} {claim.prediction.tokenType}
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-300">
                    {new Date(claim.claimedAt).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <Button
                      variant="success"
                      size="sm"
                      onClick={() => handleApproveClaim(claim.id)}
                      disabled={approvingIds.includes(claim.id)}
                    >
                      {approvingIds.includes(claim.id) ? (
                        <div className="flex items-center">
                          <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                          Processing...
                        </div>
                      ) : (
                        <div className="flex items-center">
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Approve & Pay
                        </div>
                      )}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AdminClaimsTable;
