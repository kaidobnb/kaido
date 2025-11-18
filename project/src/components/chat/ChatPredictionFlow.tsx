import React from 'react';
import { PredictionCreationState, ChatPredictionParams } from '../../types/chat';
import Button from '../ui/Button';
import { ArrowRight, Check, DollarSign } from 'lucide-react';

interface ChatPredictionFlowProps {
  state: PredictionCreationState;
  params: ChatPredictionParams;
  onProceedToPayment: () => void;
  onCancel: () => void;
}

const ChatPredictionFlow: React.FC<ChatPredictionFlowProps> = ({
  state,
  params,
  onProceedToPayment,
  onCancel
}) => {
  // Only show the component when we're in the confirmation or payment state
  if (state !== 'confirmation' && state !== 'payment') {
    return null;
  }

  // Format the expiry date for display
  const formattedExpiryDate = params.expiryDate 
    ? new Date(params.expiryDate).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        timeZoneName: 'short'
      })
    : 'Not set';

  return (
    <div className="bg-slate-800 rounded-lg p-4 border border-slate-700 my-4">
      <h3 className="text-lg font-medium text-white mb-3">Prediction Summary</h3>
      
      <div className="space-y-2 mb-4">
        <div className="flex justify-between">
          <span className="text-slate-400">Asset:</span>
          <span className="text-white font-medium">{params.asset || 'Not selected'}</span>
        </div>
        
        <div className="flex justify-between">
          <span className="text-slate-400">Type:</span>
          <span className="text-white font-medium">
            {params.type === 'binary' ? 'Binary (Yes/No)' : 
             params.type === 'multi-choice' ? 'Multi-choice' : 'Not selected'}
          </span>
        </div>
        
        {params.type === 'binary' && (
          <div className="flex justify-between">
            <span className="text-slate-400">Target Price:</span>
            <span className="text-white font-medium">
              {params.targetPrice ? `$${params.targetPrice}` : 'Not set'}
            </span>
          </div>
        )}
        
        {params.type === 'multi-choice' && params.priceRanges && params.priceRanges.length > 0 && (
          <div className="flex justify-between">
            <span className="text-slate-400">Price Ranges:</span>
            <span className="text-white font-medium text-right">
              {params.priceRanges.join(', ')}
            </span>
          </div>
        )}
        
        <div className="flex justify-between">
          <span className="text-slate-400">Expiry Date:</span>
          <span className="text-white font-medium">{formattedExpiryDate}</span>
        </div>
        
        <div className="flex justify-between">
          <span className="text-slate-400">Stake Amount:</span>
          <span className="text-white font-medium">
            {params.stakeAmount ? `${params.stakeAmount} ${params.stakeToken || 'tokens'}` : 'Not set'}
          </span>
        </div>
      </div>
      
      <div className="flex justify-between mt-4">
        <Button
          variant="outline"
          onClick={onCancel}
          className="text-slate-300"
        >
          Cancel
        </Button>
        
        <Button
          onClick={onProceedToPayment}
          className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
        >
          {state === 'payment' ? (
            <>
              <span className="animate-spin mr-2">⟳</span>
              Processing...
            </>
          ) : (
            <>
              Fund Prediction <DollarSign className="ml-2 h-4 w-4" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

export default ChatPredictionFlow;
