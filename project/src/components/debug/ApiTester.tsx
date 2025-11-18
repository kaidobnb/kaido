import React, { useState } from 'react';
import Card, { CardContent, CardHeader } from '../ui/Card';
import Button from '../ui/Button';
import { useAuth } from '../../contexts/AuthContext';
import * as api from '../../services/api';

const ApiTester: React.FC = () => {
  const { isAuthenticated, userProfile } = useAuth();
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedEndpoint, setSelectedEndpoint] = useState<string>('');

  const endpoints = [
    { name: 'Get User Profile', fn: api.getUserProfile, requiresAuth: true },
    { name: 'Get Predictions', fn: api.getPredictions, requiresAuth: false },
    { name: 'Get Leaderboard', fn: api.getLeaderboard, requiresAuth: false },
    { name: 'Get User Rank', fn: api.getUserRank, requiresAuth: true },
    { name: 'Get Portfolio Summary', fn: api.getPortfolioSummary, requiresAuth: true },
    { name: 'Get Chat History', fn: api.getChatHistory, requiresAuth: true },
    { name: 'Get Referral Stats', fn: api.getReferralStats, requiresAuth: true },
  ];

  const handleApiCall = async (endpoint: string, fn: () => Promise<any>, requiresAuth: boolean) => {
    if (requiresAuth && !isAuthenticated) {
      setError('Authentication required for this endpoint');
      return;
    }

    setSelectedEndpoint(endpoint);
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fn();
      setResult(response);
    } catch (err) {
      console.error(`Error calling ${endpoint}:`, err);
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <h2 className="text-xl font-bold text-white">API Tester</h2>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <p className="text-sm text-slate-300 mb-2">
            Authentication Status: <span className={isAuthenticated ? 'text-green-400' : 'text-red-400'}>
              {isAuthenticated ? 'Authenticated' : 'Not Authenticated'}
            </span>
          </p>
          {userProfile && (
            <p className="text-sm text-slate-300">
              Logged in as: <span className="text-purple-400">{userProfile.username || userProfile.walletAddress}</span>
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-6">
          {endpoints.map((endpoint) => (
            <Button
              key={endpoint.name}
              variant={endpoint.requiresAuth ? 'secondary' : 'primary'}
              size="sm"
              onClick={() => handleApiCall(endpoint.name, endpoint.fn, endpoint.requiresAuth)}
              disabled={loading || (endpoint.requiresAuth && !isAuthenticated)}
              className="justify-start"
            >
              <span className="truncate">{endpoint.name}</span>
              {endpoint.requiresAuth && (
                <span className="ml-2 text-xs bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded">Auth</span>
              )}
            </Button>
          ))}
        </div>

        {loading && (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mx-auto"></div>
            <p className="mt-2 text-slate-400">Loading...</p>
          </div>
        )}

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-md p-4 mb-4">
            <h3 className="text-red-400 font-medium mb-1">Error</h3>
            <p className="text-sm text-slate-300">{error}</p>
          </div>
        )}

        {result && (
          <div className="mt-4">
            <h3 className="text-lg font-medium text-white mb-2">Response from {selectedEndpoint}</h3>
            <div className="bg-slate-800/50 rounded-md p-4 overflow-auto max-h-[400px]">
              <pre className="text-xs text-slate-300 whitespace-pre-wrap">
                {JSON.stringify(result, null, 2)}
              </pre>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ApiTester;
