import React, { useState, useEffect } from 'react';
import { Users, DollarSign, RefreshCw, Send } from 'lucide-react';
import Card, { CardHeader, CardContent } from '../ui/Card';
import Button from '../ui/Button';
import { useToast } from '../../hooks/useToast';
import { getPartnerRecords, payoutPartnerFees } from '../../services/api';

interface PartnerRecord {
  _id: string;
  partnerId: string;
  partnerName: string;
  walletAddress: string;
  totalFees: number;
  pendingFees: number;
  paidFees: number;
  lastPayout: string | null;
  transactions: Array<{
    _id: string;
    amount: number;
    createdAt: string;
    predictionId?: string;
    predictionTitle?: string;
    status: 'pending' | 'paid';
  }>;
}

const PartnerRecordsPage: React.FC = () => {
  const { showToast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isPayingOut, setIsPayingOut] = useState(false);
  const [partnerRecords, setPartnerRecords] = useState<PartnerRecord[]>([]);
  const [expandedPartner, setExpandedPartner] = useState<string | null>(null);

  // Load partner records on component mount
  useEffect(() => {
    fetchPartnerRecords();
  }, []);

  // Fetch partner records from API
  const fetchPartnerRecords = async () => {
    try {
      setIsLoading(true);
      const response = await getPartnerRecords();

      if (response && response.success && response.partnerRecords) {
        setPartnerRecords(response.partnerRecords);
      } else {
        console.log('Received response:', response);
        // Don't show error toast, just log it
        console.warn('Failed to load partner records:', response?.message || 'Unknown error');
      }
    } catch (error) {
      console.error('Error loading partner records:', error);
      // Don't show error toast, just log it
      console.warn('Exception while loading partner records:', error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  };

  // Toggle expanded partner
  const toggleExpandPartner = (partnerId: string) => {
    if (expandedPartner === partnerId) {
      setExpandedPartner(null);
    } else {
      setExpandedPartner(partnerId);
    }
  };

  // Format date
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Calculate total pending fees across all partners
  const calculateTotalPendingFees = () => {
    return partnerRecords.reduce((total, partner) => total + partner.pendingFees, 0);
  };

  // Pay out all pending fees to partners
  const handlePayoutAllFees = async () => {
    try {
      setIsPayingOut(true);

      // Confirm with user
      if (!window.confirm(`Are you sure you want to pay out ${calculateTotalPendingFees().toFixed(4)} SOL to all partners?`)) {
        setIsPayingOut(false);
        return;
      }

      const response = await payoutPartnerFees();

      if (response.success) {
        showToast({
          title: 'Success',
          message: 'Successfully paid out all partner fees',
          type: 'success'
        });

        // Refresh partner records
        fetchPartnerRecords();
      } else {
        throw new Error(response.message || 'Failed to pay out partner fees');
      }
    } catch (error) {
      console.error('Error paying out partner fees:', error);
      showToast({
        title: 'Error',
        message: error instanceof Error ? error.message : 'Failed to pay out partner fees',
        type: 'error'
      });
    } finally {
      setIsPayingOut(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <Users className="h-5 w-5 text-purple-400 mr-2" />
            <h2 className="text-xl font-semibold text-white">Partner Records</h2>
          </div>
          <div className="flex space-x-3">
            <Button
              variant="secondary"
              size="sm"
              leftIcon={<RefreshCw className="h-4 w-4" />}
              onClick={fetchPartnerRecords}
              disabled={isLoading}
            >
              Refresh
            </Button>
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Send className="h-4 w-4" />}
              onClick={handlePayoutAllFees}
              disabled={isPayingOut || calculateTotalPendingFees() <= 0}
            >
              {isPayingOut ? 'Processing...' : `Pay All (${calculateTotalPendingFees().toFixed(4)} SOL)`}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
          </div>
        ) : partnerRecords.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            No partner records found.
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-gray-800 p-4 rounded-lg">
              <div className="grid grid-cols-12 gap-4 font-medium text-gray-300 text-sm">
                <div className="col-span-3">Partner</div>
                <div className="col-span-4">Wallet Address</div>
                <div className="col-span-1 text-right">Total</div>
                <div className="col-span-1 text-right">Pending</div>
                <div className="col-span-1 text-right">Paid</div>
                <div className="col-span-2 text-right">Last Payout</div>
              </div>
            </div>

            {partnerRecords.map((partner) => (
              <div key={partner._id} className="space-y-2">
                <div
                  className="bg-gray-800 p-4 rounded-lg cursor-pointer hover:bg-gray-750 transition-colors"
                  onClick={() => toggleExpandPartner(partner._id)}
                >
                  <div className="grid grid-cols-12 gap-4 items-center">
                    <div className="col-span-3 font-medium text-white">{partner.partnerName || 'Unnamed Partner'}</div>
                    <div className="col-span-4 text-gray-300 text-sm truncate">{partner.walletAddress}</div>
                    <div className="col-span-1 text-right text-gray-300">{partner.totalFees.toFixed(4)} SOL</div>
                    <div className="col-span-1 text-right text-green-400">{partner.pendingFees.toFixed(4)} SOL</div>
                    <div className="col-span-1 text-right text-gray-300">{partner.paidFees.toFixed(4)} SOL</div>
                    <div className="col-span-2 text-right text-gray-400 text-sm">{formatDate(partner.lastPayout)}</div>
                  </div>
                </div>

                {expandedPartner === partner._id && partner.transactions.length > 0 && (
                  <div className="bg-gray-900 p-4 rounded-lg border border-gray-700 ml-4">
                    <h4 className="text-white font-medium mb-3">Transaction History</h4>
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {partner.transactions.map((tx) => (
                        <div key={tx._id} className="grid grid-cols-12 gap-4 py-2 border-b border-gray-800 text-sm">
                          <div className="col-span-6 text-gray-300">
                            {tx.predictionTitle || 'Fee Transaction'}
                          </div>
                          <div className="col-span-2 text-gray-400">
                            {new Date(tx.createdAt).toLocaleDateString()}
                          </div>
                          <div className="col-span-2 text-right text-green-400">
                            {tx.amount.toFixed(4)} SOL
                          </div>
                          <div className="col-span-2 text-right">
                            <span className={`px-2 py-1 rounded-full text-xs ${
                              tx.status === 'paid' ? 'bg-green-900 text-green-300' : 'bg-yellow-900 text-yellow-300'
                            }`}>
                              {tx.status === 'paid' ? 'Paid' : 'Pending'}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PartnerRecordsPage;
