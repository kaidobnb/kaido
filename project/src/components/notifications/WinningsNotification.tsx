import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Award, X } from 'lucide-react';
import { getClaimableWinnings } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../hooks/useToast';

interface WinningsData {
  count: number;
  totals: {
    SOL?: number;
    SOLY?: number;
  };
  winnings: Array<{
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
    tokenType: 'SOL' | 'SOLY';
  }>;
}

const WinningsNotification: React.FC = () => {
  const [winningsData, setWinningsData] = useState<WinningsData | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [hasChecked, setHasChecked] = useState(false);
  const { isAuthenticated } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  // Check for claimable winnings when the component mounts or auth state changes
  useEffect(() => {
    const checkClaimableWinnings = async () => {
      if (isAuthenticated && !hasChecked) {
        try {
          const response = await getClaimableWinnings();
          if (response.success && response.count > 0) {
            setWinningsData(response);
            setIsVisible(true);
            
            // Show a toast notification
            showToast({
              type: 'success',
              title: 'Winnings Available!',
              message: `You have ${response.count} claimable winnings waiting for you.`,
              duration: 8000
            });
          }
        } catch (error) {
          console.error('Error checking claimable winnings:', error);
        } finally {
          setHasChecked(true);
        }
      }
    };

    checkClaimableWinnings();
  }, [isAuthenticated, hasChecked, showToast]);

  // Handle close button click
  const handleClose = () => {
    setIsVisible(false);
  };

  // Handle view winnings button click
  const handleViewWinnings = () => {
    navigate('/profile/winnings');
    setIsVisible(false);
  };

  // If there are no winnings or the notification is not visible, don't render anything
  if (!winningsData || !isVisible) {
    return null;
  }

  // Format the total winnings amount
  const formatTotals = () => {
    const { totals } = winningsData;
    const parts = [];
    
    if (totals.SOL) {
      parts.push(`${totals.SOL.toFixed(2)} SOL`);
    }
    
    if (totals.SOLY) {
      parts.push(`${totals.SOLY.toFixed(2)} SOLY`);
    }
    
    return parts.join(' and ');
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-sm w-full bg-slate-800 rounded-lg shadow-lg border border-yellow-500/30 overflow-hidden">
      <div className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center">
            <div className="bg-yellow-500/20 p-2 rounded-full mr-3">
              <Award className="h-6 w-6 text-yellow-400" />
            </div>
            <div>
              <h3 className="text-white font-medium">Winnings Available!</h3>
              <p className="text-slate-300 text-sm mt-1">
                You have {winningsData.count} claimable {winningsData.count === 1 ? 'winning' : 'winnings'} totaling {formatTotals()}.
              </p>
            </div>
          </div>
          <button 
            onClick={handleClose}
            className="text-slate-400 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <div className="mt-4">
          <button
            onClick={handleViewWinnings}
            className="w-full py-2 px-4 bg-yellow-600 hover:bg-yellow-700 text-white rounded-md transition-colors"
          >
            View & Claim Winnings
          </button>
        </div>
      </div>
    </div>
  );
};

export default WinningsNotification;
