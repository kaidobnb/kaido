import React, { useState, useEffect } from 'react';
import Card, { CardContent, CardHeader } from '../ui/Card';
import Button from '../ui/Button';
import Input from '../ui/Input';
import { Bot, Play, Pause, Settings, RefreshCw, AlertCircle, CheckCircle, Cpu, Zap, TrendingUp, Trophy } from 'lucide-react';
import { useToast } from '../../hooks/useToast';
import {
  getAgentStatus,
  getAgentConfig,
  updateAgentConfig,
  toggleAgent,
  pauseAgent,
  triggerAgentCreation,
  triggerAgentResolution
} from '../../services/api';

interface AgentConfig {
  enabled: boolean;
  paused: boolean;
  creationEnabled: boolean;
  resolutionEnabled: boolean;
  cryptoEnabled: boolean;
  sportsEnabled: boolean;
  cryptoAssets: string[];
  sportsCompetitions: string[];
  priorityTeams: string[];
  priorityTeamWeight: number;
  maxPredictionsPerDay: number;
  predictionsCreatedToday: number;
  totalPredictionsCreated: number;
  totalPredictionsResolved: number;
  creationCronSchedule: string;
  resolutionCronSchedule: string;
  aiModel: string;
  aiTemperature: number;
}

interface AgentStatus {
  config: AgentConfig;
  isInitialized: boolean;
  creationJobRunning: boolean;
  resolutionJobRunning: boolean;
}

const AdminKaidoAgentSettings: React.FC = () => {
  const { showToast } = useToast();
  const [status, setStatus] = useState<AgentStatus | null>(null);
  const [config, setConfig] = useState<AgentConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isResolving, setIsResolving] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [statusRes, configRes] = await Promise.all([
        getAgentStatus(),
        getAgentConfig()
      ]);
      
      if (statusRes.success) {
        setStatus(statusRes.status);
      }
      if (configRes.success) {
        setConfig(configRes.config);
      }
    } catch (error) {
      console.error('Error fetching agent data:', error);
      showToast({ type: 'error', title: 'Error', message: 'Failed to load agent settings' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleAgent = async () => {
    try {
      const newEnabled = !config?.enabled;
      const response = await toggleAgent(newEnabled);
      if (response.success) {
        showToast({ type: 'success', title: 'Success', message: `Agent ${newEnabled ? 'enabled' : 'disabled'}` });
        fetchData();
      }
    } catch (error) {
      showToast({ type: 'error', title: 'Error', message: 'Failed to toggle agent' });
    }
  };

  const handlePauseAgent = async () => {
    try {
      const newPaused = !config?.paused;
      const response = await pauseAgent(newPaused);
      if (response.success) {
        showToast({ type: 'success', title: 'Success', message: `Agent ${newPaused ? 'paused' : 'resumed'}` });
        fetchData();
      }
    } catch (error) {
      showToast({ type: 'error', title: 'Error', message: 'Failed to pause/resume agent' });
    }
  };

  const handleSaveConfig = async () => {
    if (!config) return;
    try {
      setIsSaving(true);
      const response = await updateAgentConfig(config);
      if (response.success) {
        showToast({ type: 'success', title: 'Saved', message: 'Agent configuration updated' });
        fetchData();
      }
    } catch (error) {
      showToast({ type: 'error', title: 'Error', message: 'Failed to save configuration' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleTriggerCreation = async (category?: 'crypto' | 'sports') => {
    try {
      setIsCreating(true);
      const response = await triggerAgentCreation(category);
      if (response.success) {
        showToast({ type: 'success', title: 'Created', message: response.prediction ? `Created: ${response.prediction.title}` : 'Creation cycle triggered' });
        fetchData();
      } else {
        showToast({ type: 'warning', title: 'Notice', message: response.message || 'Could not create prediction' });
      }
    } catch (error) {
      showToast({ type: 'error', title: 'Error', message: 'Failed to trigger creation' });
    } finally {
      setIsCreating(false);
    }
  };

  const handleTriggerResolution = async () => {
    try {
      setIsResolving(true);
      const response = await triggerAgentResolution();
      if (response.success) {
        showToast({ type: 'success', title: 'Success', message: 'Resolution cycle triggered' });
        fetchData();
      }
    } catch (error) {
      showToast({ type: 'error', title: 'Error', message: 'Failed to trigger resolution' });
    } finally {
      setIsResolving(false);
    }
  };

  const updateConfig = (key: keyof AgentConfig, value: any) => {
    if (!config) return;
    setConfig({ ...config, [key]: value });
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="h-8 w-8 animate-spin text-purple-400 mr-3" />
            <span className="text-white text-lg">Loading KAIDO Agent...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!config) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-slate-400">Failed to load agent configuration</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-purple-500/20 rounded-lg">
                <Cpu className="h-8 w-8 text-purple-400" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">KAIDO AI Agent</h2>
                <p className="text-slate-400">Autonomous prediction creation & resolution</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {config.enabled ? (
                <span className="flex items-center px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-sm">
                  <CheckCircle className="h-4 w-4 mr-1" /> Active
                </span>
              ) : (
                <span className="flex items-center px-3 py-1 bg-slate-500/20 text-slate-400 rounded-full text-sm">
                  <AlertCircle className="h-4 w-4 mr-1" /> Disabled
                </span>
              )}
              {config.paused && (
                <span className="flex items-center px-3 py-1 bg-yellow-500/20 text-yellow-400 rounded-full text-sm">
                  <Pause className="h-4 w-4 mr-1" /> Paused
                </span>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-slate-800/50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-white">{config.predictionsCreatedToday}</div>
              <div className="text-slate-400 text-sm">Created Today</div>
            </div>
            <div className="bg-slate-800/50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-purple-400">{config.totalPredictionsCreated}</div>
              <div className="text-slate-400 text-sm">Total Created</div>
            </div>
            <div className="bg-slate-800/50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-green-400">{config.totalPredictionsResolved}</div>
              <div className="text-slate-400 text-sm">Total Resolved</div>
            </div>
            <div className="bg-slate-800/50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-yellow-400">{config.maxPredictionsPerDay}</div>
              <div className="text-slate-400 text-sm">Max Per Day</div>
            </div>
          </div>

          {/* Control Buttons */}
          <div className="flex flex-wrap gap-3">
            <Button
              variant={config.enabled ? 'danger' : 'primary'}
              onClick={handleToggleAgent}
              leftIcon={config.enabled ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            >
              {config.enabled ? 'Disable Agent' : 'Enable Agent'}
            </Button>
            {config.enabled && (
              <Button
                variant="secondary"
                onClick={handlePauseAgent}
                leftIcon={config.paused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
              >
                {config.paused ? 'Resume' : 'Pause'}
              </Button>
            )}
            <Button
              variant="secondary"
              onClick={() => handleTriggerCreation()}
              disabled={isCreating || !config.enabled}
              leftIcon={<Zap className={`h-4 w-4 ${isCreating ? 'animate-pulse' : ''}`} />}
            >
              {isCreating ? 'Creating...' : 'Create Now'}
            </Button>
            <Button
              variant="secondary"
              onClick={handleTriggerResolution}
              disabled={isResolving || !config.enabled}
              leftIcon={<RefreshCw className={`h-4 w-4 ${isResolving ? 'animate-spin' : ''}`} />}
            >
              {isResolving ? 'Resolving...' : 'Resolve Now'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <TrendingUp className="h-6 w-6 text-blue-400" />
                <div>
                  <h3 className="text-white font-medium">Create Crypto Prediction</h3>
                  <p className="text-slate-400 text-sm">BTC, ETH, BNB, SOL, etc.</p>
                </div>
              </div>
              <Button
                size="sm"
                onClick={() => handleTriggerCreation('crypto')}
                disabled={isCreating || !config.enabled || !config.cryptoEnabled}
              >
                Create
              </Button>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Trophy className="h-6 w-6 text-yellow-400" />
                <div>
                  <h3 className="text-white font-medium">Create Sports Prediction</h3>
                  <p className="text-slate-400 text-sm">Soccer matches</p>
                </div>
              </div>
              <Button
                size="sm"
                onClick={() => handleTriggerCreation('sports')}
                disabled={isCreating || !config.enabled || !config.sportsEnabled}
              >
                Create
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Configuration */}
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Settings className="h-5 w-5 text-purple-400" />
            <h3 className="text-xl font-bold text-white">Configuration</h3>
          </div>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          {/* Category Toggles */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center justify-between p-4 bg-slate-800/50 rounded-lg">
              <div className="flex items-center space-x-3">
                <TrendingUp className="h-5 w-5 text-blue-400" />
                <span className="text-white">Crypto Predictions</span>
              </div>
              <button
                onClick={() => updateConfig('cryptoEnabled', !config.cryptoEnabled)}
                className={`w-12 h-6 rounded-full transition-colors ${config.cryptoEnabled ? 'bg-purple-500' : 'bg-slate-600'}`}
              >
                <div className={`w-5 h-5 bg-white rounded-full transform transition-transform ${config.cryptoEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </div>
            <div className="flex items-center justify-between p-4 bg-slate-800/50 rounded-lg">
              <div className="flex items-center space-x-3">
                <Trophy className="h-5 w-5 text-yellow-400" />
                <span className="text-white">Sports Predictions</span>
              </div>
              <button
                onClick={() => updateConfig('sportsEnabled', !config.sportsEnabled)}
                className={`w-12 h-6 rounded-full transition-colors ${config.sportsEnabled ? 'bg-purple-500' : 'bg-slate-600'}`}
              >
                <div className={`w-5 h-5 bg-white rounded-full transform transition-transform ${config.sportsEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </div>
          </div>

          {/* Settings Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Max Predictions Per Day</label>
              <Input
                type="number"
                value={config.maxPredictionsPerDay}
                onChange={(e) => updateConfig('maxPredictionsPerDay', parseInt(e.target.value))}
                min="1"
                max="50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">AI Temperature</label>
              <Input
                type="number"
                value={config.aiTemperature}
                onChange={(e) => updateConfig('aiTemperature', parseFloat(e.target.value))}
                min="0"
                max="2"
                step="0.1"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Creation Schedule (Cron)</label>
              <Input
                type="text"
                value={config.creationCronSchedule}
                onChange={(e) => updateConfig('creationCronSchedule', e.target.value)}
                placeholder="0 */4 * * *"
              />
              <p className="text-xs text-slate-400 mt-1">Default: every 4 hours</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Resolution Schedule (Cron)</label>
              <Input
                type="text"
                value={config.resolutionCronSchedule}
                onChange={(e) => updateConfig('resolutionCronSchedule', e.target.value)}
                placeholder="* * * * *"
              />
              <p className="text-xs text-slate-400 mt-1">Default: every minute</p>
            </div>
          </div>

          {/* Crypto Assets */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Crypto Assets (comma-separated)</label>
            <Input
              type="text"
              value={config.cryptoAssets.join(', ')}
              onChange={(e) => updateConfig('cryptoAssets', e.target.value.split(',').map(s => s.trim().toUpperCase()))}
              placeholder="BTC, ETH, BNB, SOL"
            />
          </div>

          {/* Priority Teams */}
          <div className="space-y-4 p-4 bg-yellow-500/10 rounded-lg border border-yellow-500/20">
            <div className="flex items-center space-x-2">
              <Trophy className="h-5 w-5 text-yellow-400" />
              <h4 className="text-white font-medium">Priority Teams (Popular Teams)</h4>
            </div>
            <p className="text-slate-400 text-sm">
              Matches featuring these teams will be prioritized for prediction creation. Great for big matches like Man Utd vs Barcelona!
            </p>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Priority Teams (comma-separated)</label>
              <textarea
                className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                rows={3}
                value={config.priorityTeams?.join(', ') || ''}
                onChange={(e) => updateConfig('priorityTeams', e.target.value.split(',').map(s => s.trim()))}
                placeholder="Manchester United, Barcelona, Real Madrid, Liverpool..."
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Priority Weight (1-10)</label>
                <Input
                  type="number"
                  value={config.priorityTeamWeight || 8}
                  onChange={(e) => updateConfig('priorityTeamWeight', Math.min(10, Math.max(1, parseInt(e.target.value) || 8)))}
                  min="1"
                  max="10"
                />
                <p className="text-xs text-slate-400 mt-1">Higher = stronger preference for priority teams</p>
              </div>
              <div className="flex items-end">
                <div className="text-sm text-slate-400">
                  <span className="text-yellow-400 font-medium">{config.priorityTeams?.length || 0}</span> teams configured
                </div>
              </div>
            </div>
          </div>

          {/* Save Button */}
          <div className="pt-4 border-t border-slate-700">
            <Button
              variant="primary"
              onClick={handleSaveConfig}
              disabled={isSaving}
              leftIcon={<Settings className="h-4 w-4" />}
              className="w-full md:w-auto"
            >
              {isSaving ? 'Saving...' : 'Save Configuration'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Info Box */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-start space-x-3">
            <Bot className="h-6 w-6 text-purple-400 mt-0.5" />
            <div>
              <h4 className="text-purple-400 font-medium mb-2">How KAIDO Agent Works</h4>
              <ul className="text-slate-300 text-sm space-y-1">
                <li>• Uses OpenAI GPT-4 to analyze market trends and generate predictions</li>
                <li>• Creates crypto predictions based on real-time price data and market sentiment</li>
                <li>• Creates sports predictions for upcoming soccer matches</li>
                <li>• Automatically resolves expired predictions using live data</li>
                <li>• Respects daily limits and prevents duplicate predictions</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminKaidoAgentSettings;

