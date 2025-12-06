import React from 'react';
import { X, AlertTriangle, ArrowDownCircle } from 'lucide-react';
import Button from '../ui/Button';
import Card, { CardContent, CardFooter, CardHeader } from '../ui/Card';
import GlowEffect from '../effects/GlowEffect';
import { Spinner } from '../ui/Spinner';

interface UnstakeConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  amount: number;
  isUnstaking: boolean;
}

const UnstakeConfirmModal: React.FC<UnstakeConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  amount,
  isUnstaking,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm overflow-y-auto">
      <div className="w-full max-w-md my-4">
        <GlowEffect glowColor="#8B5CF6" className="w-full">
          <Card className="w-full bg-slate-900/95 border-purple-500/30 overflow-hidden">
            {/* Header */}
            <CardHeader className="relative border-b border-purple-500/20 pb-6">
              <button
                onClick={onClose}
                disabled={isUnstaking}
                className="absolute right-4 top-4 text-slate-400 hover:text-white transition-colors disabled:opacity-50"
              >
                <X className="h-5 w-5" />
              </button>

              <div className="flex flex-col items-center">
                <div className="w-16 h-16 rounded-full bg-purple-500/20 flex items-center justify-center mb-4">
                  <ArrowDownCircle className="h-8 w-8 text-purple-400" />
                </div>
                <h2 className="text-xl md:text-2xl font-bold text-white mb-1">Confirm Unstake</h2>
                <p className="text-slate-400 text-center text-sm md:text-base">
                  You are about to unstake your BNB
                </p>
              </div>
            </CardHeader>

            {/* Content */}
            <CardContent className="p-4 md:p-6 space-y-4">
              {/* Amount Display */}
              <div className="bg-slate-800/50 rounded-lg p-4 md:p-5 border border-purple-500/20 text-center">
                <p className="text-xs md:text-sm text-slate-400 mb-2">Amount to Unstake</p>
                <p className="text-2xl md:text-3xl font-bold text-white">
                  {amount.toFixed(4)} <span className="text-lg text-yellow-400">BNB</span>
                </p>
              </div>

              {/* Warning Notice */}
              <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3 md:p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-yellow-200/80">
                    <p className="font-medium mb-1">Important Notice</p>
                    <ul className="list-disc list-inside space-y-1 text-yellow-200/60 text-xs md:text-sm">
                      <li>Unstaking will remove all your staked BNB</li>
                      <li>Any unclaimed rewards will be forfeited</li>
                      <li>You can stake again at any time</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Safety Disclaimer */}
              <div className="bg-slate-800/30 rounded-lg p-3 border border-slate-700/50">
                <p className="text-xs text-slate-400 text-center">
                  💎 LP funds are never used for payouts or prediction risk.
                </p>
              </div>
            </CardContent>

            {/* Footer */}
            <CardFooter className="border-t border-purple-500/20 p-4">
              <div className="flex flex-col sm:flex-row gap-3 w-full">
                <Button
                  variant="outline"
                  size="md"
                  fullWidth
                  onClick={onClose}
                  disabled={isUnstaking}
                  className="min-h-[44px]"
                >
                  Cancel
                </Button>

                <Button
                  variant="danger"
                  size="md"
                  fullWidth
                  onClick={onConfirm}
                  disabled={isUnstaking}
                  className="min-h-[44px]"
                >
                  {isUnstaking ? (
                    <span className="flex items-center gap-2">
                      <Spinner size="sm" color="white" />
                      Unstaking...
                    </span>
                  ) : (
                    'Confirm Unstake'
                  )}
                </Button>
              </div>
            </CardFooter>
          </Card>
        </GlowEffect>
      </div>
    </div>
  );
};

export default UnstakeConfirmModal;

