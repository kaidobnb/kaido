import React, { useState } from 'react';
import Card, { CardContent, CardFooter, CardHeader } from '../ui/Card';
import Button from '../ui/Button';
import Input from '../ui/Input';
import { Calendar, DollarSign, Users, Wallet } from 'lucide-react';
import { createPrediction } from '../../services/api';
import { useToast } from '../../hooks/useToast';

interface AgentPredictionData {
  title: string;
  description: string;
  type: 'binary' | 'multiple';
  asset: string;
  targetPrice?: string;
  priceRanges?: string[];
  endDate: string;
  rewardPoolAmount: number;
  tokenType: 'SOL' | 'SOLY';
  resolveDetails: string;
  minSolyRequired: number;
  maxParticipants: number;
}

interface AdminCreateAgentPredictionFormProps {
  onClose: () => void;
  onSuccess?: () => void;
}

const AdminCreateAgentPredictionForm: React.FC<AdminCreateAgentPredictionFormProps> = ({
  onClose,
  onSuccess,
}) => {
  const { showToast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize with default values
  const [predictionData, setPredictionData] = useState<AgentPredictionData>({
    title: '',
    description: '',
    type: 'binary',
    asset: 'BTC',
    targetPrice: '',
    priceRanges: ['', '', '', ''],
    endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Default to 7 days from now
    rewardPoolAmount: 100,
    tokenType: 'SOL',
    resolveDetails: '',
    minSolyRequired: 10,
    maxParticipants: 50
  });

  const handleSubmit = async () => {
    // Validate form
    if (!predictionData.asset) {
      showToast({ type: 'error', title: 'Error', message: 'Please select an asset' });
      return;
    }

    if (predictionData.type === 'binary' && (!predictionData.targetPrice || parseFloat(predictionData.targetPrice) <= 0)) {
      showToast({ type: 'error', title: 'Error', message: 'Please enter a valid target price' });
      return;
    }

    if (predictionData.type === 'multiple') {
      const validRanges = predictionData.priceRanges?.filter(range => range.trim() !== '');
      if (!validRanges || validRanges.length < 2) {
        showToast({ type: 'error', title: 'Error', message: 'Please enter at least two price ranges' });
        return;
      }
    }

    if (!predictionData.endDate) {
      showToast({ type: 'error', title: 'Error', message: 'Please select an expiry date' });
      return;
    }

    if (!predictionData.rewardPoolAmount || predictionData.rewardPoolAmount <= 0) {
      showToast({ type: 'error', title: 'Error', message: 'Please enter a valid reward pool amount' });
      return;
    }

    if (!predictionData.minSolyRequired || predictionData.minSolyRequired <= 0) {
      showToast({ type: 'error', title: 'Error', message: 'Please enter a valid minimum SOLY requirement' });
      return;
    }

    if (!predictionData.maxParticipants || predictionData.maxParticipants <= 0) {
      showToast({ type: 'error', title: 'Error', message: 'Please enter a valid maximum participants limit' });
      return;
    }

    try {
      setIsSubmitting(true);

      // Format data for API
      const apiData: any = {
        title: predictionData.title,
        description: predictionData.description,
        type: 'agent', // Always agent type
        tokenType: predictionData.tokenType,
        endDate: new Date(predictionData.endDate).toISOString(),
        resolveDetails: predictionData.resolveDetails,
        asset: predictionData.asset,
        minSolyRequired: predictionData.minSolyRequired,
        maxParticipants: predictionData.maxParticipants,
        rewardPoolAmount: predictionData.rewardPoolAmount,
        bypassBalanceCheck: true, // Admin can bypass balance check
        useAI: true // Use AI to generate title and description if not provided
      };

      // Add type-specific fields
      if (predictionData.type === 'binary') {
        apiData.targetPrice = parseFloat(predictionData.targetPrice || '0');
      } else if (predictionData.type === 'multiple') {
        // Filter out empty price ranges
        apiData.priceRanges = predictionData.priceRanges?.filter(range => range.trim() !== '');
      }

      const response = await createPrediction(apiData);

      if (response.success) {
        showToast({
          type: 'success',
          title: 'Success',
          message: 'Agent prediction created successfully'
        });
        if (onSuccess) {
          onSuccess();
        }
        onClose();
      } else {
        showToast({
          type: 'error',
          title: 'Error',
          message: response.message || 'Failed to create agent prediction'
        });
      }
    } catch (error) {
      console.error('Error creating agent prediction:', error);
      showToast({
        type: 'error',
        title: 'Error',
        message: 'An error occurred while creating the agent prediction'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const updatePredictionData = (key: keyof AgentPredictionData, value: any) => {
    setPredictionData({
      ...predictionData,
      [key]: value,
    });
  };

  return (
    <Card className="w-full max-w-4xl mx-auto bg-slate-900 border-slate-700 flex flex-col max-h-[90vh]">
      <CardHeader className="border-b border-slate-700 flex-shrink-0">
        <h2 className="text-xl font-bold text-white">Create Agent Prediction</h2>
        <p className="text-sm text-slate-400">
          Create a prediction where users can participate by holding SOLY tokens without committing funds.
        </p>
      </CardHeader>

      <CardContent className="py-6 px-4 pb-8 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-slate-800">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left Column */}
          <div className="space-y-6">
            {/* Asset Selection */}
            <div>
              <h3 className="text-lg font-medium text-white mb-3">Select Asset</h3>
              <div className="space-y-3">
                <div>
                  <h4 className="text-sm text-slate-400 mb-2">Popular</h4>
                  <div className="grid grid-cols-3 gap-2">
                    {['BTC', 'ETH', 'SOL', 'DOGE', 'XRP', 'ADA'].map((asset) => (
                      <Button
                        key={asset}
                        variant={predictionData.asset === asset ? 'default' : 'outline'}
                        onClick={() => updatePredictionData('asset', asset)}
                        className="text-sm"
                      >
                        {asset}
                      </Button>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="text-sm text-slate-400 mb-2">Layer 1</h4>
                  <div className="grid grid-cols-3 gap-2">
                    {['DOT', 'AVAX', 'MATIC', 'ATOM', 'NEAR'].map((asset) => (
                      <Button
                        key={asset}
                        variant={predictionData.asset === asset ? 'default' : 'outline'}
                        onClick={() => updatePredictionData('asset', asset)}
                        className="text-sm"
                      >
                        {asset}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Prediction Type */}
            <div>
              <h3 className="text-lg font-medium text-white mb-3">Prediction Type</h3>
              <div className="grid grid-cols-2 gap-3">
                <Button
                  variant={predictionData.type === 'binary' ? 'default' : 'outline'}
                  className="h-auto py-3 flex flex-col items-center"
                  onClick={() => updatePredictionData('type', 'binary')}
                >
                  <div className="font-bold mb-1">Yes/No</div>
                  <div className="text-xs text-center">
                    Will {predictionData.asset} reach a specific target?
                  </div>
                </Button>
                <Button
                  variant={predictionData.type === 'multiple' ? 'default' : 'outline'}
                  className="h-auto py-3 flex flex-col items-center"
                  onClick={() => updatePredictionData('type', 'multiple')}
                >
                  <div className="font-bold mb-1">Price Ranges</div>
                  <div className="text-xs text-center">
                    What price range will {predictionData.asset} fall into?
                  </div>
                </Button>
              </div>
            </div>

            {/* Price Target or Ranges */}
            <div>
              {predictionData.type === 'binary' ? (
                <div>
                  <h3 className="text-lg font-medium text-white mb-3">Target Price</h3>
                  <div className="flex items-center space-x-2">
                    <span className="text-white">Will {predictionData.asset} reach</span>
                    <div className="relative flex-1">
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
                <div>
                  <h3 className="text-lg font-medium text-white mb-3">Price Ranges</h3>
                  <div className="space-y-2">
                    {[0, 1, 2, 3].map((index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <Input
                          placeholder={index === 3 ? "Above $110,000" : `$${80 + index * 10},000 - $${90 + index * 10},000`}
                          value={predictionData.priceRanges?.[index] || ''}
                          onChange={(e) => {
                            const newRanges = [...(predictionData.priceRanges || [])];
                            newRanges[index] = e.target.value;
                            updatePredictionData('priceRanges', newRanges);
                          }}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Expiry Date */}
            <div>
              <h3 className="text-lg font-medium text-white mb-3">Expiry Date</h3>
              <div className="flex items-center space-x-2 mb-2">
                <Calendar className="text-slate-400" />
                <Input
                  type="date"
                  value={predictionData.endDate}
                  onChange={(e) => updatePredictionData('endDate', e.target.value)}
                />
              </div>
              <div className="grid grid-cols-3 gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const date = new Date();
                    date.setDate(date.getDate() + 7);
                    updatePredictionData('endDate', date.toISOString().split('T')[0]);
                  }}
                >
                  7 days
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const date = new Date();
                    date.setDate(date.getDate() + 30);
                    updatePredictionData('endDate', date.toISOString().split('T')[0]);
                  }}
                >
                  30 days
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const date = new Date();
                    date.setDate(date.getDate() + 90);
                    updatePredictionData('endDate', date.toISOString().split('T')[0]);
                  }}
                >
                  90 days
                </Button>
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Reward Pool Settings */}
            <div>
              <h3 className="text-lg font-medium text-white mb-3">Reward Pool Settings</h3>
              <p className="text-xs text-slate-400 mb-2">
                Set the reward pool amount and token type. Winners will share this pool equally.
              </p>
              <div className="flex items-center space-x-2 mb-2">
                <DollarSign className="text-slate-400" />
                <Input
                  type="number"
                  value={predictionData.rewardPoolAmount}
                  onChange={(e) => updatePredictionData('rewardPoolAmount', parseFloat(e.target.value))}
                  placeholder="Enter reward pool amount"
                />
                <div className="flex border rounded-md overflow-hidden min-w-[120px]">
                  <Button
                    variant={predictionData.tokenType === 'SOL' ? 'default' : 'ghost'}
                    className="rounded-none flex-1 px-3"
                    onClick={() => updatePredictionData('tokenType', 'SOL')}
                  >
                    SOL
                  </Button>
                  <Button
                    variant={predictionData.tokenType === 'SOLY' ? 'default' : 'ghost'}
                    className="rounded-none flex-1 px-3"
                    onClick={() => updatePredictionData('tokenType', 'SOLY')}
                  >
                    SOLY
                  </Button>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 mt-2 mb-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => updatePredictionData('rewardPoolAmount', 100)}
                >
                  100
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => updatePredictionData('rewardPoolAmount', 500)}
                >
                  500
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => updatePredictionData('rewardPoolAmount', 1000)}
                >
                  1000
                </Button>
              </div>
              <p className="text-xs text-slate-400">
                This is the total amount that will be shared among users who predict correctly.
              </p>
            </div>

            {/* Minimum SOLY Required */}
            <div>
              <h3 className="text-lg font-medium text-white mb-3">Minimum SOLY Required</h3>
              <p className="text-xs text-slate-400 mb-2">
                Users must hold at least this many SOLY tokens to participate without committing funds.
              </p>
              <div className="flex items-center space-x-2 mb-2">
                <Wallet className="text-slate-400" />
                <Input
                  type="number"
                  value={predictionData.minSolyRequired}
                  onChange={(e) => updatePredictionData('minSolyRequired', parseFloat(e.target.value))}
                  placeholder="Enter minimum SOLY tokens required"
                />
              </div>
              <div className="grid grid-cols-3 gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => updatePredictionData('minSolyRequired', 10)}
                >
                  10 SOLY
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => updatePredictionData('minSolyRequired', 50)}
                >
                  50 SOLY
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => updatePredictionData('minSolyRequired', 100)}
                >
                  100 SOLY
                </Button>
              </div>
            </div>

            {/* Maximum Participants */}
            <div>
              <h3 className="text-lg font-medium text-white mb-3">Maximum Participants</h3>
              <p className="text-xs text-slate-400 mb-2">
                Limit the total number of users who can participate in this prediction.
              </p>
              <div className="flex items-center space-x-2 mb-2">
                <Users className="text-slate-400" />
                <Input
                  type="number"
                  value={predictionData.maxParticipants}
                  onChange={(e) => updatePredictionData('maxParticipants', parseFloat(e.target.value))}
                  placeholder="Enter maximum number of participants"
                />
              </div>
              <div className="grid grid-cols-3 gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => updatePredictionData('maxParticipants', 10)}
                >
                  10 Users
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => updatePredictionData('maxParticipants', 50)}
                >
                  50 Users
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => updatePredictionData('maxParticipants', 100)}
                >
                  100 Users
                </Button>
              </div>
            </div>

            {/* Prediction Details */}
            <div>
              <h3 className="text-lg font-medium text-white mb-3">Prediction Details</h3>
              <p className="text-xs text-slate-400 mb-2">
                These fields are optional. If left empty, they will be generated using AI based on your inputs.
              </p>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">
                    Title
                  </label>
                  <Input
                    value={predictionData.title}
                    onChange={(e) => updatePredictionData('title', e.target.value)}
                    placeholder="Enter prediction title (or leave empty for AI-generated)"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">
                    Description
                  </label>
                  <Input
                    as="textarea"
                    rows={3}
                    value={predictionData.description}
                    onChange={(e) => updatePredictionData('description', e.target.value)}
                    placeholder="Enter prediction description (or leave empty for AI-generated)"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">
                    Resolution Details
                  </label>
                  <Input
                    as="textarea"
                    rows={2}
                    value={predictionData.resolveDetails}
                    onChange={(e) => updatePredictionData('resolveDetails', e.target.value)}
                    placeholder="How will this prediction be resolved? (or leave empty for AI-generated)"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>

      <CardFooter className="border-t border-slate-700 flex justify-between flex-shrink-0">
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <span className="animate-spin mr-2">⟳</span>
              Creating...
            </>
          ) : (
            'Create Agent Prediction'
          )}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default AdminCreateAgentPredictionForm;
