import React, { useState, useEffect } from 'react';
import Card, { CardContent, CardHeader } from '../ui/Card';
import Button from '../ui/Button';
import Input from '../ui/Input';
import { Bot, Play, Pause, Settings, RefreshCw, AlertCircle, CheckCircle } from 'lucide-react';
import { useToast } from '../../hooks/useToast';

interface AutoPredictionSettings {
  autoPredictionEnabled: boolean;
  maxActivePredictions: number;
  predictionsPerBatch: number;
  autoPredictionInterval: string;
}

const AdminAutoPredictionSettings: React.FC = () => {
  const { showToast } = useToast();
  const [settings, setSettings] = useState<AutoPredictionSettings>({
    autoPredictionEnabled: false,
    maxActivePredictions: 20,
    predictionsPerBatch: 3,
    autoPredictionInterval: '0 */6 * * *'
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isTriggering, setIsTriggering] = useState(false);

  // Load settings on component mount
  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/admin/auto-predictions/settings', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setSettings(data.settings);
      } else {
        throw new Error('Failed to fetch settings');
      }
    } catch (error) {
      console.error('Error fetching auto-prediction settings:', error);
      showToast({
        type: 'error',
        title: 'Error',
        message: 'Failed to load auto-prediction settings'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const saveSettings = async () => {
    try {
      setIsSaving(true);
      const response = await fetch('/api/admin/auto-predictions/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(settings)
      });

      if (response.ok) {
        const data = await response.json();
        showToast({
          type: 'success',
          title: 'Settings Saved',
          message: data.message
        });
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to save settings');
      }
    } catch (error) {
      console.error('Error saving auto-prediction settings:', error);
      showToast({
        type: 'error',
        title: 'Error',
        message: error instanceof Error ? error.message : 'Failed to save settings'
      });
    } finally {
      setIsSaving(false);
    }
  };

  const triggerAutoPrediction = async () => {
    try {
      setIsTriggering(true);
      const response = await fetch('/api/admin/auto-predictions/trigger', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ count: settings.predictionsPerBatch })
      });

      if (response.ok) {
        const data = await response.json();
        showToast({
          type: 'success',
          title: 'Auto-Prediction Triggered',
          message: data.message
        });
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to trigger auto-prediction');
      }
    } catch (error) {
      console.error('Error triggering auto-prediction:', error);
      showToast({
        type: 'error',
        title: 'Error',
        message: error instanceof Error ? error.message : 'Failed to trigger auto-prediction'
      });
    } finally {
      setIsTriggering(false);
    }
  };

  const updateSetting = (key: keyof AutoPredictionSettings, value: any) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <RefreshCw className="h-6 w-6 animate-spin text-yellow-400 mr-2" />
            <span className="text-white">Loading auto-prediction settings...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center space-x-2">
          <Bot className="h-6 w-6 text-yellow-400" />
          <h2 className="text-xl font-bold text-white">Auto-Prediction Settings</h2>
        </div>
        <p className="text-slate-300 text-sm">
          Configure automatic prediction creation to keep the platform active with fresh content.
        </p>
      </CardHeader>
      <CardContent className="p-6 space-y-6">
        {/* Enable/Disable Toggle */}
        <div className="flex items-center justify-between p-4 bg-slate-800/50 rounded-lg border border-slate-700">
          <div className="flex items-center space-x-3">
            {settings.autoPredictionEnabled ? (
              <CheckCircle className="h-5 w-5 text-green-400" />
            ) : (
              <AlertCircle className="h-5 w-5 text-slate-400" />
            )}
            <div>
              <h3 className="text-white font-medium">Auto-Prediction Status</h3>
              <p className="text-slate-400 text-sm">
                {settings.autoPredictionEnabled ? 'Automatically creating predictions' : 'Auto-prediction is disabled'}
              </p>
            </div>
          </div>
          <Button
            variant={settings.autoPredictionEnabled ? 'danger' : 'primary'}
            onClick={() => updateSetting('autoPredictionEnabled', !settings.autoPredictionEnabled)}
            leftIcon={settings.autoPredictionEnabled ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          >
            {settings.autoPredictionEnabled ? 'Disable' : 'Enable'}
          </Button>
        </div>

        {/* Configuration Settings */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Maximum Active Predictions
            </label>
            <Input
              type="number"
              value={settings.maxActivePredictions}
              onChange={(e) => updateSetting('maxActivePredictions', parseInt(e.target.value))}
              min="1"
              max="100"
              className="w-full"
            />
            <p className="text-xs text-slate-400 mt-1">
              Maximum number of active predictions to maintain on the platform
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Predictions Per Batch
            </label>
            <Input
              type="number"
              value={settings.predictionsPerBatch}
              onChange={(e) => updateSetting('predictionsPerBatch', parseInt(e.target.value))}
              min="1"
              max="10"
              className="w-full"
            />
            <p className="text-xs text-slate-400 mt-1">
              Number of predictions to create in each batch
            </p>
          </div>
        </div>

        {/* Interval Setting */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Creation Interval (Cron Expression)
          </label>
          <Input
            type="text"
            value={settings.autoPredictionInterval}
            onChange={(e) => updateSetting('autoPredictionInterval', e.target.value)}
            placeholder="0 */6 * * *"
            className="w-full"
          />
          <p className="text-xs text-slate-400 mt-1">
            Cron expression for how often to create predictions. Default: "0 */6 * * *" (every 6 hours)
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 pt-4 border-t border-slate-700">
          <Button
            variant="primary"
            onClick={saveSettings}
            disabled={isSaving}
            leftIcon={<Settings className="h-4 w-4" />}
            className="flex-1"
          >
            {isSaving ? 'Saving...' : 'Save Settings'}
          </Button>

          <Button
            variant="secondary"
            onClick={triggerAutoPrediction}
            disabled={isTriggering || !settings.autoPredictionEnabled}
            leftIcon={<RefreshCw className={`h-4 w-4 ${isTriggering ? 'animate-spin' : ''}`} />}
            className="flex-1"
          >
            {isTriggering ? 'Creating...' : 'Create Now'}
          </Button>
        </div>

        {/* Info Box */}
        <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <AlertCircle className="h-5 w-5 text-blue-400 mt-0.5" />
            <div>
              <h4 className="text-blue-400 font-medium mb-1">How Auto-Prediction Works</h4>
              <ul className="text-slate-300 text-sm space-y-1">
                <li>• Creates predictions for popular crypto assets (BTC, ETH, BNB, etc.)</li>
                <li>• Generates both binary (Yes/No) and multiple choice predictions</li>
                <li>• Uses real-time price data to set realistic target prices</li>
                <li>• Automatically resolves predictions when they expire</li>
                <li>• Maintains platform activity even when users aren't creating predictions</li>
              </ul>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AdminAutoPredictionSettings;
