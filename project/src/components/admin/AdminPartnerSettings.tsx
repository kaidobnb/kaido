import React, { useState, useEffect } from 'react';
import { Wallet, Plus, Trash2, Save, AlertCircle } from 'lucide-react';
import Card, { CardHeader, CardContent } from '../ui/Card';
import Button from '../ui/Button';
import Input from '../ui/Input';
import { useToast } from '../../hooks/useToast';
import { getAdminSettings, updatePartnerWallets } from '../../services/api';

interface PartnerWallet {
  walletAddress: string;
  feePercentage: number;
  name?: string;
  active: boolean;
  _id?: string; // MongoDB ID if it exists
}

const AdminPartnerSettings: React.FC = () => {
  const { showToast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [partnerWallets, setPartnerWallets] = useState<PartnerWallet[]>([]);
  const [creationFeePercentage, setCreationFeePercentage] = useState(10);
  const [resolutionFeePercentage, setResolutionFeePercentage] = useState(10);
  const [referralRewardPercentage, setReferralRewardPercentage] = useState(2);

  // Load admin settings on component mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        setIsLoading(true);
        const response = await getAdminSettings();

        if (response.success && response.settings) {
          // Set partner wallets
          setPartnerWallets(response.settings.partnerWallets || []);

          // Set fee percentages
          setCreationFeePercentage(response.settings.creationFeePercentage || 10);
          setResolutionFeePercentage(response.settings.resolutionFeePercentage || 10);
          setReferralRewardPercentage(response.settings.referralRewardPercentage || 2);
        }
      } catch (error) {
        console.error('Error loading admin settings:', error);
        showToast({
          title: 'Error',
          message: 'Failed to load admin settings',
          type: 'error'
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadSettings();
  }, [showToast]);

  // Add a new empty partner wallet
  const addPartnerWallet = () => {
    setPartnerWallets([
      ...partnerWallets,
      {
        walletAddress: '',
        feePercentage: 10, // Default to 10% of the creation fee
        name: '',
        active: true
      }
    ]);
  };

  // Remove a partner wallet
  const removePartnerWallet = (index: number) => {
    const updatedWallets = [...partnerWallets];
    updatedWallets.splice(index, 1);
    setPartnerWallets(updatedWallets);
  };

  // Update a partner wallet field
  const updatePartnerWallet = (index: number, field: keyof PartnerWallet, value: any) => {
    const updatedWallets = [...partnerWallets];

    // Handle special case for feePercentage to ensure it's a number
    if (field === 'feePercentage') {
      const numValue = parseFloat(value);
      updatedWallets[index][field] = isNaN(numValue) ? 0 : Math.min(100, Math.max(0, numValue));
    } else {
      updatedWallets[index][field] = value;
    }

    setPartnerWallets(updatedWallets);
  };

  // Save partner wallet settings
  const saveSettings = async () => {
    try {
      setIsSaving(true);

      // Validate wallet addresses
      const invalidWallets = partnerWallets.filter(
        wallet => wallet.walletAddress.trim() === '' || wallet.feePercentage < 0 || wallet.feePercentage > 100
      );

      if (invalidWallets.length > 0) {
        showToast({
          title: 'Validation Error',
          message: 'All partner wallets must have a valid wallet address and fee percentage (0-100%)',
          type: 'error'
        });
        return;
      }

      // Calculate total percentage to ensure it doesn't exceed 100%
      const totalPercentage = partnerWallets.reduce((total, wallet) => {
        return total + (wallet.active ? wallet.feePercentage : 0);
      }, 0);

      if (totalPercentage > 100) {
        showToast({
          title: 'Validation Error',
          message: `Total partner fee percentage (${totalPercentage}%) exceeds 100% of the creation fee`,
          type: 'error'
        });
        return;
      }

      // Save settings
      const response = await updatePartnerWallets({
        partnerWallets,
        creationFeePercentage,
        resolutionFeePercentage,
        referralRewardPercentage
      });

      if (response.success) {
        showToast({
          title: 'Success',
          message: 'Partner wallet settings saved successfully',
          type: 'success'
        });
      } else {
        throw new Error(response.message || 'Failed to save settings');
      }
    } catch (error) {
      console.error('Error saving partner wallet settings:', error);
      showToast({
        title: 'Error',
        message: 'Failed to save partner wallet settings',
        type: 'error'
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Calculate remaining percentage for admin
  const calculateAdminPercentage = () => {
    const totalPartnerPercentage = partnerWallets.reduce((total, wallet) => {
      return total + (wallet.active ? wallet.feePercentage : 0);
    }, 0);

    return Math.max(0, 100 - totalPartnerPercentage);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold text-white">Partner Wallet Settings</h2>
          <Button
            variant="primary"
            size="sm"
            leftIcon={<Save className="h-4 w-4" />}
            onClick={saveSettings}
            disabled={isSaving}
          >
            {isSaving ? 'Saving...' : 'Save Settings'}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-white">Fee Settings</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Creation Fee Percentage
                  </label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    value={creationFeePercentage}
                    onChange={(e) => setCreationFeePercentage(Math.min(100, Math.max(0, parseInt(e.target.value) || 0)))}
                    className="w-full"
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    Percentage fee charged when a prediction is created
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Resolution Fee Percentage
                  </label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    value={resolutionFeePercentage}
                    onChange={(e) => setResolutionFeePercentage(Math.min(100, Math.max(0, parseInt(e.target.value) || 0)))}
                    className="w-full"
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    Percentage fee charged when a prediction is resolved
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Referral Reward Percentage
                  </label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    value={referralRewardPercentage}
                    onChange={(e) => setReferralRewardPercentage(Math.min(100, Math.max(0, parseInt(e.target.value) || 0)))}
                    className="w-full"
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    Percentage of fees that go to referrers (lifetime rewards)
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium text-white">Partner Wallets</h3>
                <Button
                  variant="outline"
                  size="sm"
                  leftIcon={<Plus className="h-4 w-4" />}
                  onClick={addPartnerWallet}
                >
                  Add Partner
                </Button>
              </div>

              <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
                <div className="text-sm text-gray-300 mb-4">
                  <div className="flex items-center">
                    <AlertCircle className="h-4 w-4 text-yellow-400 mr-2" />
                    <span>
                      Partners receive a percentage of the {creationFeePercentage}% creation fee.
                      Admin receives the remaining {calculateAdminPercentage()}% of the creation fee.
                    </span>
                  </div>
                </div>

                {partnerWallets.length === 0 ? (
                  <div className="text-center py-6 text-gray-400">
                    No partner wallets configured. Click "Add Partner" to add one.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {partnerWallets.map((wallet, index) => (
                      <div key={index} className="bg-gray-900 p-4 rounded-lg border border-gray-700">
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                          <div className="md:col-span-3">
                            <label className="block text-xs font-medium text-gray-400 mb-1">
                              Partner Name
                            </label>
                            <Input
                              type="text"
                              placeholder="Partner Name"
                              value={wallet.name || ''}
                              onChange={(e) => updatePartnerWallet(index, 'name', e.target.value)}
                            />
                          </div>
                          <div className="md:col-span-5">
                            <label className="block text-xs font-medium text-gray-400 mb-1">
                              Wallet Address
                            </label>
                            <Input
                              type="text"
                              placeholder="Solana Wallet Address"
                              value={wallet.walletAddress}
                              onChange={(e) => updatePartnerWallet(index, 'walletAddress', e.target.value)}
                            />
                          </div>
                          <div className="md:col-span-2">
                            <label className="block text-xs font-medium text-gray-400 mb-1">
                              Fee Percentage
                            </label>
                            <div className="flex items-center">
                              <Input
                                type="number"
                                min="0"
                                max="100"
                                value={wallet.feePercentage}
                                onChange={(e) => updatePartnerWallet(index, 'feePercentage', e.target.value)}
                              />
                              <span className="ml-2 text-gray-400">%</span>
                            </div>
                          </div>
                          <div className="md:col-span-1">
                            <label className="block text-xs font-medium text-gray-400 mb-1">
                              Active
                            </label>
                            <div className="flex items-center h-10">
                              <input
                                type="checkbox"
                                checked={wallet.active}
                                onChange={(e) => updatePartnerWallet(index, 'active', e.target.checked)}
                                className="h-4 w-4 rounded border-gray-600 text-purple-600 focus:ring-purple-500 bg-gray-700"
                              />
                            </div>
                          </div>
                          <div className="md:col-span-1">
                            <label className="block text-xs font-medium text-gray-400 mb-1">
                              Actions
                            </label>
                            <Button
                              variant="danger"
                              size="sm"
                              onClick={() => removePartnerWallet(index)}
                              className="h-10"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
                <h4 className="text-md font-medium text-white mb-2">Fee Distribution Summary</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-300">Creation Fee:</span>
                    <span className="text-white font-medium">{creationFeePercentage}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">Resolution Fee:</span>
                    <span className="text-white font-medium">{resolutionFeePercentage}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">Referral Reward:</span>
                    <span className="text-white font-medium">{referralRewardPercentage}%</span>
                  </div>
                  <div className="border-t border-gray-700 my-2"></div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">Admin's Share of Creation Fee:</span>
                    <span className="text-white font-medium">{calculateAdminPercentage()}%</span>
                  </div>
                  {partnerWallets.filter(w => w.active).map((wallet, index) => (
                    <div key={index} className="flex justify-between">
                      <span className="text-gray-300">{wallet.name || `Partner ${index + 1}`}'s Share:</span>
                      <span className="text-white font-medium">{wallet.feePercentage}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AdminPartnerSettings;
