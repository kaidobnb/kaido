import React, { useState } from 'react';
import Card, { CardContent, CardFooter, CardHeader } from '../ui/Card';
import Button from '../ui/Button';
import Input from '../ui/Input';
import { Calendar, ChevronRight, DollarSign } from 'lucide-react';
import { SUPPORTED_TOKENS, getTokensByCategory } from '../../config/tokens';

interface PredictionCreationFlowProps {
  onClose: () => void;
  onSubmit: (predictionData: PredictionData) => void;
  initialAsset?: string;
  initialType?: 'binary' | 'multi-choice';
  isSubmitting?: boolean;
}

export interface PredictionData {
  type: 'binary' | 'multi-choice';
  asset: string;
  targetPrice?: string;
  priceRanges?: string[];
  expiryDate: string;
  duration?: number; // Duration in minutes
  stakeAmount: number;
  stakeToken: 'BNB' | 'KAIDO';
}

const PredictionCreationFlow: React.FC<PredictionCreationFlowProps> = ({
  onClose,
  onSubmit,
  initialAsset,
  initialType,
  isSubmitting = false
}) => {
  const [step, setStep] = useState<number>(1);
  const [predictionData, setPredictionData] = useState<PredictionData>({
    type: initialType || 'binary',
    asset: initialAsset || 'BTC',
    targetPrice: '',
    priceRanges: [],
    expiryDate: '',
    stakeAmount: 0.01, // Minimum BNB amount is 0.01
    stakeToken: 'BNB',
  });

  const handleNext = () => {
    setStep(step + 1);
  };

  const handleBack = () => {
    setStep(step - 1);
  };

  const handleSubmit = () => {
    onSubmit(predictionData);
  };

  const updatePredictionData = (key: keyof PredictionData, value: any) => {
    setPredictionData({
      ...predictionData,
      [key]: value,
    });
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-white">Select Prediction Type</h3>
            <div className="grid grid-cols-2 gap-4">
              <Button
                variant={predictionData.type === 'binary' ? 'default' : 'outline'}
                className="h-auto py-4 flex flex-col items-center"
                onClick={() => updatePredictionData('type', 'binary')}
              >
                <div className="text-xl font-bold mb-2">Yes/No</div>
                <div className="text-xs text-center">
                  Will the price reach a specific target?
                </div>
              </Button>
              <Button
                variant={predictionData.type === 'multi-choice' ? 'default' : 'outline'}
                className="h-auto py-4 flex flex-col items-center"
                onClick={() => updatePredictionData('type', 'multi-choice')}
              >
                <div className="text-xl font-bold mb-2">Price Ranges</div>
                <div className="text-xs text-center">
                  What price range will it fall into?
                </div>
              </Button>
            </div>
          </div>
        );
      case 2:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-white">Select Asset</h3>

            {/* Popular assets */}
            <div className="mb-4">
              <h4 className="text-sm text-slate-400 mb-2">Popular</h4>
              <div className="grid grid-cols-3 gap-3">
                {['BTC', 'ETH', 'SOL', 'DOGE', 'XRP', 'ADA'].map((asset) => (
                  <Button
                    key={asset}
                    variant={predictionData.asset === asset ? 'default' : 'outline'}
                    onClick={() => updatePredictionData('asset', asset)}
                  >
                    {asset}
                  </Button>
                ))}
              </div>
            </div>

            {/* Layer 1 assets */}
            <div className="mb-4">
              <h4 className="text-sm text-slate-400 mb-2">Layer 1</h4>
              <div className="grid grid-cols-3 gap-3">
                {['DOT', 'AVAX', 'MATIC', 'ATOM', 'NEAR'].map((asset) => (
                  <Button
                    key={asset}
                    variant={predictionData.asset === asset ? 'default' : 'outline'}
                    onClick={() => updatePredictionData('asset', asset)}
                  >
                    {asset}
                  </Button>
                ))}
              </div>
            </div>

            {/* DeFi assets */}
            <div className="mb-4">
              <h4 className="text-sm text-slate-400 mb-2">DeFi</h4>
              <div className="grid grid-cols-3 gap-3">
                {['LINK', 'UNI', 'AAVE'].map((asset) => (
                  <Button
                    key={asset}
                    variant={predictionData.asset === asset ? 'default' : 'outline'}
                    onClick={() => updatePredictionData('asset', asset)}
                  >
                    {asset}
                  </Button>
                ))}
              </div>
            </div>

            {/* Meme assets */}
            <div>
              <h4 className="text-sm text-slate-400 mb-2">Meme</h4>
              <div className="grid grid-cols-3 gap-3">
                {['SHIB', 'PEPE'].map((asset) => (
                  <Button
                    key={asset}
                    variant={predictionData.asset === asset ? 'default' : 'outline'}
                    onClick={() => updatePredictionData('asset', asset)}
                  >
                    {asset}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        );
      case 3:
        return predictionData.type === 'binary' ? (
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-white">Set Target Price</h3>
            <div className="flex items-center space-x-2">
              <span className="text-white">Will {predictionData.asset} reach</span>
              <div className="relative">
                <span className="absolute left-2 top-1/2 transform -translate-y-1/2">$</span>
                <Input
                  type="number"
                  className="pl-6"
                  placeholder="100,000"
                  value={predictionData.targetPrice}
                  onChange={(e) => updatePredictionData('targetPrice', e.target.value)}
                />
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-white">Set Price Ranges</h3>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Input
                  placeholder="$80,000 - $90,000"
                  value={predictionData.priceRanges?.[0] || ''}
                  onChange={(e) => {
                    const newRanges = [...(predictionData.priceRanges || [])];
                    newRanges[0] = e.target.value;
                    updatePredictionData('priceRanges', newRanges);
                  }}
                />
                <Button variant="outline" size="sm">+</Button>
              </div>
              <div className="flex items-center space-x-2">
                <Input
                  placeholder="$90,000 - $100,000"
                  value={predictionData.priceRanges?.[1] || ''}
                  onChange={(e) => {
                    const newRanges = [...(predictionData.priceRanges || [])];
                    newRanges[1] = e.target.value;
                    updatePredictionData('priceRanges', newRanges);
                  }}
                />
                <Button variant="outline" size="sm">+</Button>
              </div>
            </div>
          </div>
        );
      case 4:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-white">Set Duration</h3>
            <p className="text-sm text-slate-400">How long should this prediction last?</p>

            <div className="grid grid-cols-2 gap-3 mt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const now = new Date();
                  const future = new Date(now.getTime() + 30 * 60 * 1000); // 30 minutes
                  updatePredictionData('duration', 30);
                  updatePredictionData('expiryDate', future.toISOString());
                }}
              >
                30 minutes
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const now = new Date();
                  const future = new Date(now.getTime() + 60 * 60 * 1000); // 1 hour
                  updatePredictionData('duration', 60);
                  updatePredictionData('expiryDate', future.toISOString());
                }}
              >
                1 hour
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const now = new Date();
                  const future = new Date(now.getTime() + 2 * 60 * 60 * 1000); // 2 hours
                  updatePredictionData('duration', 120);
                  updatePredictionData('expiryDate', future.toISOString());
                }}
              >
                2 hours
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const now = new Date();
                  const future = new Date(now.getTime() + 4 * 60 * 60 * 1000); // 4 hours
                  updatePredictionData('duration', 240);
                  updatePredictionData('expiryDate', future.toISOString());
                }}
              >
                4 hours
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const now = new Date();
                  const future = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 1 day
                  updatePredictionData('duration', 1440);
                  updatePredictionData('expiryDate', future.toISOString());
                }}
              >
                1 day
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const now = new Date();
                  const future = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days
                  updatePredictionData('duration', 10080);
                  updatePredictionData('expiryDate', future.toISOString());
                }}
              >
                7 days
              </Button>
            </div>

            {predictionData.duration && (
              <div className="mt-4 p-3 bg-slate-800 rounded-md">
                <p className="text-sm text-white">
                  Prediction will resolve at: {new Date(new Date().getTime() + (predictionData.duration * 60 * 1000)).toLocaleString()}
                </p>
              </div>
            )}
          </div>
        );
      case 5:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-white">Choose Token & Stake Amount</h3>

            {/* Token Selection */}
            <div className="space-y-2">
              <label className="text-sm text-slate-300">Select Token</label>
              <div className="grid grid-cols-2 gap-3">
                <Button
                  variant={predictionData.stakeToken === 'BNB' ? 'default' : 'outline'}
                  onClick={() => updatePredictionData('stakeToken', 'BNB')}
                  className="flex items-center justify-center space-x-2"
                >
                  <span>BNB</span>
                  <span className="text-xs text-slate-400">(5% fee)</span>
                </Button>
                <Button
                  variant={predictionData.stakeToken === 'KAIDO' ? 'default' : 'outline'}
                  onClick={() => updatePredictionData('stakeToken', 'KAIDO')}
                  className="flex items-center justify-center space-x-2"
                >
                  <span>KAIDO</span>
                  <span className="text-xs text-slate-400">(Free)</span>
                </Button>
              </div>
            </div>

            {/* Stake Amount */}
            <div className="space-y-2">
              <label className="text-sm text-slate-300">Stake Amount</label>
              <div className="flex items-center space-x-2">
                <DollarSign className="text-slate-400" />
                <Input
                  type="number"
                  value={predictionData.stakeAmount}
                  onChange={(e) => {
                    const value = parseFloat(e.target.value);
                    // Ensure the stake amount is at least 0.01
                    updatePredictionData('stakeAmount', value < 0.01 ? 0.01 : value);
                  }}
                  min="0.01"
                  step="0.01"
                />
                <span className="text-slate-300 min-w-[60px]">{predictionData.stakeToken}</span>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2 mt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => updatePredictionData('stakeAmount', 0.01)}
              >
                0.01
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => updatePredictionData('stakeAmount', predictionData.stakeToken === 'BNB' ? 0.1 : 10)}
              >
                {predictionData.stakeToken === 'BNB' ? '0.1' : '10'}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => updatePredictionData('stakeAmount', predictionData.stakeToken === 'BNB' ? 1 : 100)}
              >
                {predictionData.stakeToken === 'BNB' ? '1' : '100'}
              </Button>
            </div>
            <p className="text-xs text-slate-400 mt-2">
              Minimum stake amount is 0.01 {predictionData.stakeToken}.
              {predictionData.stakeToken === 'KAIDO' && ' Using KAIDO reduces fees from 5% to 2%.'}
            </p>
          </div>
        );
      case 6:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-white">Confirm Prediction</h3>
            <div className="bg-slate-800 p-4 rounded-lg space-y-2" data-glow-color="#d946ef">
              <div className="flex justify-between">
                <span className="text-slate-400">Type:</span>
                <span className="text-white font-medium">
                  {predictionData.type === 'binary' ? 'Yes/No' : 'Price Ranges'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Asset:</span>
                <span className="text-white font-medium">{predictionData.asset}</span>
              </div>
              {predictionData.type === 'binary' ? (
                <div className="flex justify-between">
                  <span className="text-slate-400">Target Price:</span>
                  <span className="text-white font-medium">${predictionData.targetPrice}</span>
                </div>
              ) : (
                <div className="flex justify-between">
                  <span className="text-slate-400">Price Ranges:</span>
                  <div className="text-white font-medium text-right">
                    {predictionData.priceRanges?.map((range, index) => (
                      <div key={index}>{range}</div>
                    ))}
                  </div>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-slate-400">Duration:</span>
                <span className="text-white font-medium">
                  {predictionData.duration
                    ? predictionData.duration < 60
                      ? `${predictionData.duration} minutes`
                      : predictionData.duration < 1440
                        ? `${Math.floor(predictionData.duration / 60)} hour${Math.floor(predictionData.duration / 60) > 1 ? 's' : ''}`
                        : `${Math.floor(predictionData.duration / 1440)} day${Math.floor(predictionData.duration / 1440) > 1 ? 's' : ''}`
                    : 'Not specified'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Resolves At:</span>
                <span className="text-white font-medium">
                  {predictionData.expiryDate ? new Date(predictionData.expiryDate).toLocaleString() : 'Not specified'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Stake:</span>
                <span className="text-white font-medium">
                  {predictionData.stakeAmount} {predictionData.stakeToken}
                </span>
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto bg-slate-900 border-slate-700" data-glow-color="#8b5cf6">
      <CardHeader className="border-b border-slate-700">
        <h2 className="text-xl font-bold text-white">Create Prediction</h2>
      </CardHeader>
      <CardContent className="py-6">{renderStep()}</CardContent>
      <CardFooter className="border-t border-slate-700 flex justify-between">
        {step > 1 ? (
          <Button variant="outline" onClick={handleBack} data-glow-color="#3b82f6">
            Back
          </Button>
        ) : (
          <Button variant="outline" onClick={onClose} data-glow-color="#ef4444">
            Cancel
          </Button>
        )}
        {step < 6 ? (
          <Button onClick={handleNext} data-glow-color="#10b981">
            Next <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
        ) : (
          <Button
            onClick={handleSubmit}
            data-glow-color="#ec4899"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <span className="animate-spin mr-2">⟳</span>
                Creating...
              </>
            ) : (
              'Create Prediction'
            )}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};

export default PredictionCreationFlow;
