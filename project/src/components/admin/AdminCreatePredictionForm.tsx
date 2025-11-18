import React, { useState } from 'react';
import Card, { CardContent, CardFooter, CardHeader } from '../ui/Card';
import Button from '../ui/Button';
import Input from '../ui/Input';
import { Calendar, ChevronRight, DollarSign, Users, Wallet } from 'lucide-react';
import { createPrediction } from '../../services/api';
import { useToast } from '../../hooks/useToast';
import CreatePredictionWithContract from '../prediction/CreatePredictionWithContract';

interface PredictionData {
  title: string;
  description: string;
  type: 'binary' | 'multiple' | 'agent';
  isAgent?: boolean;
  asset: string;
  targetPrice?: string;
  priceRanges?: string[];
  endDate: string;
  stakeAmount: number;
  rewardPoolAmount?: number; // Added for agent predictions
  tokenType: 'SOL' | 'SOLY' | 'BNB' | 'KAIDO';
  resolveDetails: string;
  minSolyRequired?: number;
  maxParticipants?: number;
  useOnChain?: boolean; // Flag for on-chain predictions
}

interface AdminCreatePredictionFormProps {
  onClose: () => void;
  onSuccess?: () => void;
}

const AdminCreatePredictionForm: React.FC<AdminCreatePredictionFormProps> = ({
  onClose,
  onSuccess
}) => {
  const { showToast } = useToast();
  const [step, setStep] = useState<number>(1);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [predictionData, setPredictionData] = useState<PredictionData>({
    title: '',
    description: '',
    type: 'binary',
    asset: 'BTC',
    targetPrice: '',
    priceRanges: [],
    endDate: '',
    stakeAmount: 0.01, // Minimum BNB amount is 0.01
    rewardPoolAmount: 100, // Default reward pool amount for agent predictions
    tokenType: 'SOL',
    resolveDetails: 'This prediction will be resolved based on market data.',
    minSolyRequired: 10, // Default to 10 SOLY required
    maxParticipants: 50,  // Default to 50 participants
    useOnChain: false // Default to off-chain
  });

  const handleNext = () => {
    // Validate current step
    if (step === 1) {
      if (!predictionData.type && !predictionData.isAgent) {
        showToast({
          type: 'error',
          title: 'Error',
          message: 'Please select a prediction type'
        });
        return;
      }
    } else if (step === 2) {
      if (predictionData.isAgent && !predictionData.type) {
        showToast({
          type: 'error',
          title: 'Error',
          message: 'Please select an agent prediction type'
        });
        return;
      }
      if (!predictionData.isAgent && !predictionData.asset) {
        showToast({
          type: 'error',
          title: 'Error',
          message: 'Please select an asset'
        });
        return;
      }
    } else if (step === 3) {
      if (!predictionData.asset) {
        showToast({
          type: 'error',
          title: 'Error',
          message: 'Please select an asset'
        });
        return;
      }
    } else if (step === 4) {
      if (predictionData.type === 'binary' && !predictionData.targetPrice) {
        showToast({
          type: 'error',
          title: 'Error',
          message: 'Please enter a target price'
        });
        return;
      } else if (predictionData.type === 'multiple' && (!predictionData.priceRanges || predictionData.priceRanges.length < 2)) {
        showToast({
          type: 'error',
          title: 'Error',
          message: 'Please enter at least two price ranges'
        });
        return;
      }
    } else if (step === 5) {
      if (!predictionData.endDate) {
        showToast({
          type: 'error',
          title: 'Error',
          message: 'Please select an end date'
        });
        return;
      }
    } else if (step === 6) {
      if (predictionData.isAgent) {
        if (!predictionData.minSolyRequired || predictionData.minSolyRequired <= 0) {
          showToast({
            type: 'error',
            title: 'Error',
            message: 'Please enter a minimum SOLY requirement'
          });
          return;
        }
        if (!predictionData.maxParticipants || predictionData.maxParticipants <= 0) {
          showToast({
            type: 'error',
            title: 'Error',
            message: 'Please enter a maximum number of participants'
          });
          return;
        }
        if (!predictionData.rewardPoolAmount || predictionData.rewardPoolAmount <= 0) {
          showToast({
            type: 'error',
            title: 'Error',
            message: 'Please enter a reward pool amount'
          });
          return;
        }
      } else {
        if (!predictionData.stakeAmount || predictionData.stakeAmount < 0.01) {
          showToast({
            type: 'error',
            title: 'Error',
            message: 'Please enter a stake amount of at least 0.01 SOL'
          });
          return;
        }
      }
    } else if (step === 7) {
      if (!predictionData.title) {
        showToast({
          type: 'error',
          title: 'Error',
          message: 'Please enter a title'
        });
        return;
      }
      if (!predictionData.description) {
        showToast({
          type: 'error',
          title: 'Error',
          message: 'Please enter a description'
        });
        return;
      }
      if (!predictionData.resolveDetails) {
        showToast({
          type: 'error',
          title: 'Error',
          message: 'Please enter resolution details'
        });
        return;
      }
    }

    setStep(step + 1);
  };

  const handleBack = () => {
    setStep(step - 1);
  };

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);

      // Format data for API
      const apiData: any = {
        title: predictionData.title,
        description: predictionData.description,
        tokenType: predictionData.tokenType,
        endDate: new Date(predictionData.endDate).toISOString(),
        resolveDetails: predictionData.resolveDetails,
        asset: predictionData.asset,
        stakeAmount: predictionData.stakeAmount,
        bypassBalanceCheck: true, // Admin can bypass balance check
        useAI: true // Use AI to generate title and description if not provided
      };

      // Set the type based on isAgent flag
      if (predictionData.isAgent) {
        apiData.type = 'agent';
        apiData.minSolyRequired = predictionData.minSolyRequired;
        apiData.maxParticipants = predictionData.maxParticipants;
        apiData.rewardPoolAmount = predictionData.rewardPoolAmount;
        // For agent predictions, we don't use stakeAmount
        delete apiData.stakeAmount;
      } else {
        apiData.type = predictionData.type;
      }

      // Add type-specific fields
      if (predictionData.type === 'binary') {
        apiData.targetPrice = parseFloat(predictionData.targetPrice || '0');
      } else if (predictionData.type === 'multiple') {
        apiData.priceRanges = predictionData.priceRanges;
      }

      const response = await createPrediction(apiData);

      if (response.success) {
        showToast({
          type: 'success',
          title: 'Success',
          message: 'Prediction created successfully'
        });
        if (onSuccess) {
          onSuccess();
        }
        onClose();
      } else {
        showToast({
          type: 'error',
          title: 'Error',
          message: response.message || 'Failed to create prediction'
        });
      }
    } catch (error) {
      console.error('Error creating prediction:', error);
      showToast({
        type: 'error',
        title: 'Error',
        message: 'An error occurred while creating the prediction'
      });
    } finally {
      setIsSubmitting(false);
    }
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

            {/* On-Chain Toggle */}
            <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4 mb-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-white font-medium mb-1">Use Smart Contract (On-Chain)</h4>
                  <p className="text-xs text-slate-400">
                    Deploy prediction to BSC blockchain with automatic resolution
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => updatePredictionData('useOnChain', !predictionData.useOnChain)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    predictionData.useOnChain ? 'bg-green-500' : 'bg-slate-600'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      predictionData.useOnChain ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
              {predictionData.useOnChain && (
                <div className="mt-3 text-xs text-green-400 bg-green-500/10 border border-green-500/20 rounded p-2">
                  ✓ Prediction will be created on BSC Testnet with 5% entry fee
                </div>
              )}
            </div>

            <div className="grid grid-cols-3 gap-4">
              <Button
                variant={predictionData.type === 'binary' && !predictionData.isAgent ? 'default' : 'outline'}
                className="h-auto py-4 flex flex-col items-center"
                onClick={() => {
                  setPredictionData({
                    ...predictionData,
                    type: 'binary',
                    isAgent: false
                  });
                }}
              >
                <div className="text-xl font-bold mb-2">Yes/No</div>
                <div className="text-xs text-center">
                  Will the price reach a specific target?
                </div>
              </Button>
              <Button
                variant={predictionData.type === 'multiple' && !predictionData.isAgent ? 'default' : 'outline'}
                className="h-auto py-4 flex flex-col items-center"
                onClick={() => {
                  setPredictionData({
                    ...predictionData,
                    type: 'multiple',
                    isAgent: false
                  });
                }}
              >
                <div className="text-xl font-bold mb-2">Price Ranges</div>
                <div className="text-xs text-center">
                  What price range will it fall into?
                </div>
              </Button>
              <Button
                variant={predictionData.isAgent ? 'default' : 'outline'}
                className="h-auto py-4 flex flex-col items-center"
                onClick={() => {
                  setPredictionData({
                    ...predictionData,
                    isAgent: true,
                    minSolyRequired: 10, // Default to 10 SOLY required
                    maxParticipants: 50,  // Default to 50 participants
                    rewardPoolAmount: 100 // Default to 100 token reward pool
                  });
                }}
              >
                <div className="text-xl font-bold mb-2">Agent</div>
                <div className="text-xs text-center">
                  Free to join with SOLY token holding
                </div>
              </Button>
            </div>
          </div>
        );
      case 2:
        // For both regular and agent predictions, select the asset first
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
        // If it's an agent prediction, select the prediction type
        if (predictionData.isAgent) {
          return (
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-white">Select Agent Prediction Type</h3>
              <p className="text-sm text-slate-300 mb-4">
                Choose the type of agent prediction you want to create for {predictionData.asset}.
              </p>
              <div className="grid grid-cols-2 gap-4">
                <Button
                  variant={predictionData.type === 'binary' ? 'default' : 'outline'}
                  className="h-auto py-4 flex flex-col items-center"
                  onClick={() => updatePredictionData('type', 'binary')}
                >
                  <div className="text-xl font-bold mb-2">Yes/No</div>
                  <div className="text-xs text-center">
                    Will {predictionData.asset} reach a specific target?
                  </div>
                </Button>
                <Button
                  variant={predictionData.type === 'multiple' ? 'default' : 'outline'}
                  className="h-auto py-4 flex flex-col items-center"
                  onClick={() => updatePredictionData('type', 'multiple')}
                >
                  <div className="text-xl font-bold mb-2">Price Ranges</div>
                  <div className="text-xs text-center">
                    What price range will {predictionData.asset} fall into?
                  </div>
                </Button>
              </div>
            </div>
          );
        }
        // For regular predictions, select the prediction type
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-white">Select Prediction Type for {predictionData.asset}</h3>
            <div className="grid grid-cols-2 gap-4">
              <Button
                variant={predictionData.type === 'binary' ? 'default' : 'outline'}
                className="h-auto py-4 flex flex-col items-center"
                onClick={() => updatePredictionData('type', 'binary')}
              >
                <div className="text-xl font-bold mb-2">Yes/No</div>
                <div className="text-xs text-center">
                  Will {predictionData.asset} reach a specific target?
                </div>
              </Button>
              <Button
                variant={predictionData.type === 'multiple' ? 'default' : 'outline'}
                className="h-auto py-4 flex flex-col items-center"
                onClick={() => updatePredictionData('type', 'multiple')}
              >
                <div className="text-xl font-bold mb-2">Price Ranges</div>
                <div className="text-xs text-center">
                  What price range will {predictionData.asset} fall into?
                </div>
              </Button>
            </div>
          </div>
        );
      case 4:
        // For binary predictions (both regular and agent)
        if (predictionData.type === 'binary') {
          return (
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-white">Set Target Price</h3>
              {predictionData.isAgent && (
                <p className="text-sm text-slate-300 mb-4">
                  For agent predictions, users will be able to vote Yes/No without committing funds.
                </p>
              )}
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
          );
        }
        // For multiple-choice predictions (both regular and agent)
        else if (predictionData.type === 'multiple') {
          return (
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-white">Set Price Ranges</h3>
            {predictionData.isAgent && (
              <p className="text-sm text-slate-300 mb-4">
                For agent predictions, users will be able to select these price ranges without committing funds.
              </p>
            )}
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
              <div className="flex items-center space-x-2">
                <Input
                  placeholder="$100,000 - $110,000"
                  value={predictionData.priceRanges?.[2] || ''}
                  onChange={(e) => {
                    const newRanges = [...(predictionData.priceRanges || [])];
                    newRanges[2] = e.target.value;
                    updatePredictionData('priceRanges', newRanges);
                  }}
                />
                <Button variant="outline" size="sm">+</Button>
              </div>
              <div className="flex items-center space-x-2">
                <Input
                  placeholder="Above $110,000"
                  value={predictionData.priceRanges?.[3] || ''}
                  onChange={(e) => {
                    const newRanges = [...(predictionData.priceRanges || [])];
                    newRanges[3] = e.target.value;
                    updatePredictionData('priceRanges', newRanges);
                  }}
                />
                <Button variant="outline" size="sm">+</Button>
              </div>
            </div>
          </div>
          );
        } else {
          return (
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-white">Error</h3>
              <p className="text-slate-300">
                Unknown prediction type. Please go back and select a valid prediction type.
              </p>
            </div>
          );
        }
      case 5:
        // Set the expiry date for both regular and agent predictions
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-white">Set Expiry Date</h3>
            {predictionData.isAgent && (
              <p className="text-sm text-slate-300 mb-4">
                Set when this agent prediction will expire and be resolved.
              </p>
            )}
            <div className="flex items-center space-x-2">
              <Calendar className="text-slate-400" />
              <Input
                type="date"
                value={predictionData.endDate}
                onChange={(e) => updatePredictionData('endDate', e.target.value)}
              />
            </div>
            <div className="grid grid-cols-3 gap-2 mt-2">
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
        );

      case 6:
        // For agent predictions, we need to add the agent settings
        if (predictionData.isAgent) {
          // Agent prediction settings
          return (
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-white">Agent Prediction Settings</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">
                    Reward Pool Settings
                  </label>
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
                  <div className="grid grid-cols-3 gap-2 mt-2 mb-4">
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
                  <p className="text-xs text-slate-400 mt-1">
                    This is the total amount that will be shared among users who predict correctly.
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">
                    Minimum SOLY Required to Participate
                  </label>
                  <p className="text-xs text-slate-400 mb-2">
                    Users must hold at least this many SOLY tokens to participate in this prediction without committing funds.
                  </p>
                  <div className="flex items-center space-x-2">
                    <Wallet className="text-slate-400" />
                    <Input
                      type="number"
                      value={predictionData.minSolyRequired}
                      onChange={(e) => updatePredictionData('minSolyRequired', parseFloat(e.target.value))}
                      placeholder="Enter minimum SOLY tokens required"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2 mt-2">
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
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">
                    Maximum Number of Participants
                  </label>
                  <p className="text-xs text-slate-400 mb-2">
                    Limit the total number of users who can participate in this agent prediction.
                  </p>
                  <div className="flex items-center space-x-2">
                    <Users className="text-slate-400" />
                    <Input
                      type="number"
                      value={predictionData.maxParticipants}
                      onChange={(e) => updatePredictionData('maxParticipants', parseFloat(e.target.value))}
                      placeholder="Enter maximum number of participants"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2 mt-2">
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
            </div>
          );
        }

        // For regular predictions, set the stake amount
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-white">Stake Amount</h3>
            <div className="flex items-center space-x-2">
              <DollarSign className="text-slate-400" />
              <Input
                type="number"
                value={predictionData.stakeAmount}
                onChange={(e) => updatePredictionData('stakeAmount', parseFloat(e.target.value))}
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
                onClick={() => updatePredictionData('stakeAmount', 1)}
              >
                1
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => updatePredictionData('stakeAmount', 5)}
              >
                5
              </Button>
            </div>
          </div>
        );
      case 7:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-white">Prediction Details</h3>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">
                Title
              </label>
              <Input
                value={predictionData.title}
                onChange={(e) => updatePredictionData('title', e.target.value)}
                placeholder="Enter prediction title"
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
                placeholder="Enter prediction description"
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
                placeholder="How will this prediction be resolved?"
              />
            </div>
          </div>
        );
      case 8:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-white">Confirm Prediction</h3>
            <div className="bg-slate-800 p-4 rounded-lg space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-400">Type:</span>
                <span className="text-white font-medium">
                  {predictionData.type === 'binary'
                    ? 'Yes/No'
                    : predictionData.type === 'multiple'
                      ? 'Price Ranges'
                      : 'Agent'}
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
              ) : (predictionData.type === 'multiple' || predictionData.type === 'agent') ? (
                <div className="flex justify-between">
                  <span className="text-slate-400">Price Ranges:</span>
                  <div className="text-white font-medium text-right">
                    {predictionData.priceRanges?.map((range, index) => (
                      <div key={index}>{range}</div>
                    ))}
                  </div>
                </div>
              ) : null}
              <div className="flex justify-between">
                <span className="text-slate-400">Expiry Date:</span>
                <span className="text-white font-medium">{predictionData.endDate}</span>
              </div>
              {predictionData.isAgent ? (
                <>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Reward Pool:</span>
                    <span className="text-white font-medium">
                      {predictionData.rewardPoolAmount} {predictionData.tokenType}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Min SOLY Required:</span>
                    <span className="text-white font-medium">
                      {predictionData.minSolyRequired} SOLY
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Max Participants:</span>
                    <span className="text-white font-medium">
                      {predictionData.maxParticipants}
                    </span>
                  </div>
                </>
              ) : (
                <div className="flex justify-between">
                  <span className="text-slate-400">Stake:</span>
                  <span className="text-white font-medium">
                    {predictionData.stakeAmount} {predictionData.tokenType}
                  </span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-slate-400">Title:</span>
                <span className="text-white font-medium">{predictionData.title}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Description:</span>
                <span className="text-white font-medium">{predictionData.description}</span>
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  // If on-chain and at final step, show the contract component
  if (predictionData.useOnChain && step === 9) {
    return (
      <Card className="w-full max-w-md mx-auto bg-slate-900 border-slate-700">
        <CardHeader className="border-b border-slate-700">
          <h2 className="text-xl font-bold text-white">Create On-Chain Prediction</h2>
          <p className="text-sm text-slate-400 mt-1">
            This will create a prediction on BSC Testnet
          </p>
        </CardHeader>
        <CardContent className="py-6">
          <CreatePredictionWithContract
            predictionData={{
              title: predictionData.title,
              description: predictionData.description,
              type: predictionData.type,
              asset: predictionData.asset,
              targetPrice: parseFloat(predictionData.targetPrice || '0'),
              priceRanges: predictionData.priceRanges || [],
              endDate: predictionData.endDate,
              stakeAmount: predictionData.stakeAmount,
              tokenType: 'BNB', // On-chain only supports BNB
              resolveDetails: predictionData.resolveDetails,
            }}
            onSuccess={(id, txHash) => {
              showToast({
                type: 'success',
                title: 'Success',
                message: 'Prediction created on blockchain!'
              });
              if (onSuccess) {
                onSuccess();
              }
              onClose();
            }}
            onError={(error) => {
              showToast({
                type: 'error',
                title: 'Error',
                message: error
              });
            }}
            onCancel={handleBack}
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto bg-slate-900 border-slate-700">
      <CardHeader className="border-b border-slate-700">
        <h2 className="text-xl font-bold text-white">Create Prediction</h2>
      </CardHeader>
      <CardContent className="py-6">{renderStep()}</CardContent>
      <CardFooter className="border-t border-slate-700 flex justify-between">
        {step > 1 ? (
          <Button variant="outline" onClick={handleBack}>
            Back
          </Button>
        ) : (
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
        )}
        {step < 9 ? (
          <Button onClick={handleNext}>
            Next <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
        ) : (
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
              'Create Prediction'
            )}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};

export default AdminCreatePredictionForm;
