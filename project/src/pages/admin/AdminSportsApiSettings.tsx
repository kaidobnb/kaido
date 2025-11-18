import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';

interface ProviderInfo {
  current: 'sportradar' | 'football-data';
  available: string[];
  rateLimit: Record<string, string>;
}

const AdminSportsApiSettings: React.FC = () => {
  const { isAdmin } = useAuth();
  const [providerInfo, setProviderInfo] = useState<ProviderInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [switching, setSwitching] = useState(false);
  const [clearingCache, setClearingCache] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (isAdmin) {
      fetchProviderInfo();
    }
  }, [isAdmin]);

  const fetchProviderInfo = async () => {
    try {
      const token = localStorage.getItem('userToken');
      const response = await fetch('/api/admin/sports/provider', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setProviderInfo(data.provider);
      } else {
        throw new Error('Failed to fetch provider info');
      }
    } catch (error) {
      console.error('Error fetching provider info:', error);
      setMessage({ type: 'error', text: 'Failed to load provider information' });
    } finally {
      setLoading(false);
    }
  };

  const switchProvider = async (newProvider: 'sportradar' | 'football-data') => {
    if (!providerInfo || newProvider === providerInfo.current) return;

    setSwitching(true);
    setMessage(null);

    try {
      const token = localStorage.getItem('userToken');
      const response = await fetch('/api/admin/sports/provider', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ provider: newProvider })
      });

      if (response.ok) {
        const data = await response.json();
        setProviderInfo(data.provider);
        setMessage({ type: 'success', text: data.message });
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to switch provider');
      }
    } catch (error) {
      console.error('Error switching provider:', error);
      setMessage({ type: 'error', text: error instanceof Error ? error.message : 'Failed to switch provider' });
    } finally {
      setSwitching(false);
    }
  };

  const clearCache = async () => {
    setClearingCache(true);
    setMessage(null);

    try {
      const token = localStorage.getItem('userToken');
      const response = await fetch('/api/admin/sports/clear-cache', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setMessage({ type: 'success', text: data.message });
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to clear cache');
      }
    } catch (error) {
      console.error('Error clearing cache:', error);
      setMessage({ type: 'error', text: error instanceof Error ? error.message : 'Failed to clear cache' });
    } finally {
      setClearingCache(false);
    }
  };

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-red-400">Access denied. Admin privileges required.</div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Sports API Settings</h1>
          <p className="text-gray-400">Manage sports data API providers and cache settings</p>
        </div>

        {message && (
          <div className={`mb-6 p-4 rounded-lg ${
            message.type === 'success' ? 'bg-green-900 text-green-300' : 'bg-red-900 text-red-300'
          }`}>
            {message.text}
          </div>
        )}

        {providerInfo && (
          <div className="space-y-6">
            {/* Current Provider */}
            <div className="bg-gray-800 rounded-lg p-6">
              <h2 className="text-xl font-semibold text-white mb-4">Current Provider</h2>
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <div className={`w-3 h-3 rounded-full ${
                    providerInfo.current === 'football-data' ? 'bg-green-500' : 'bg-blue-500'
                  }`}></div>
                  <span className="text-white font-medium">
                    {providerInfo.current === 'football-data' ? 'Football-Data.org' : 'Sportradar'}
                  </span>
                </div>
                <span className="text-gray-400">
                  ({providerInfo.rateLimit[providerInfo.current]})
                </span>
              </div>
            </div>

            {/* Provider Selection */}
            <div className="bg-gray-800 rounded-lg p-6">
              <h2 className="text-xl font-semibold text-white mb-4">Switch Provider</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Football-Data.org */}
                <div className={`border-2 rounded-lg p-4 cursor-pointer transition-colors ${
                  providerInfo.current === 'football-data'
                    ? 'border-green-500 bg-green-900/20'
                    : 'border-gray-600 hover:border-green-400'
                }`} onClick={() => switchProvider('football-data')}>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-medium text-white">Football-Data.org</h3>
                    {providerInfo.current === 'football-data' && (
                      <span className="text-green-400 text-sm">ACTIVE</span>
                    )}
                  </div>
                  <p className="text-gray-400 text-sm mb-3">
                    Free tier with generous rate limits. Covers major European leagues.
                  </p>
                  <div className="text-green-400 text-sm font-medium">
                    {providerInfo.rateLimit['football-data']}
                  </div>
                  <div className="mt-3 text-xs text-gray-500">
                    ✓ Premier League, La Liga, Serie A, Bundesliga, Ligue 1<br/>
                    ✓ Champions League, Europa League<br/>
                    ✓ 10 requests per minute (14,400/day)
                  </div>
                </div>

                {/* Sportradar */}
                <div className={`border-2 rounded-lg p-4 cursor-pointer transition-colors ${
                  providerInfo.current === 'sportradar'
                    ? 'border-blue-500 bg-blue-900/20'
                    : 'border-gray-600 hover:border-blue-400'
                }`} onClick={() => switchProvider('sportradar')}>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-medium text-white">Sportradar</h3>
                    {providerInfo.current === 'sportradar' && (
                      <span className="text-blue-400 text-sm">ACTIVE</span>
                    )}
                  </div>
                  <p className="text-gray-400 text-sm mb-3">
                    Trial tier with comprehensive global coverage but limited requests.
                  </p>
                  <div className="text-blue-400 text-sm font-medium">
                    {providerInfo.rateLimit['sportradar']}
                  </div>
                  <div className="mt-3 text-xs text-gray-500">
                    ✓ Global football coverage (1000+ competitions)<br/>
                    ✓ Detailed match statistics<br/>
                    ⚠️ Limited to 1000 requests per month
                  </div>
                </div>
              </div>

              {switching && (
                <div className="mt-4 text-center">
                  <div className="text-yellow-400">Switching provider...</div>
                </div>
              )}
            </div>

            {/* Cache Management */}
            <div className="bg-gray-800 rounded-lg p-6">
              <h2 className="text-xl font-semibold text-white mb-4">Cache Management</h2>
              <p className="text-gray-400 mb-4">
                Clear cached sports data to force fresh API requests. Useful when switching providers or troubleshooting.
              </p>
              <button
                onClick={clearCache}
                disabled={clearingCache}
                className="bg-red-600 hover:bg-red-700 disabled:bg-red-800 text-white px-4 py-2 rounded-lg transition-colors"
              >
                {clearingCache ? 'Clearing Cache...' : 'Clear All Caches'}
              </button>
            </div>

            {/* API Status */}
            <div className="bg-gray-800 rounded-lg p-6">
              <h2 className="text-xl font-semibold text-white mb-4">API Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <h4 className="text-white font-medium mb-2">Available Providers</h4>
                  <ul className="text-gray-400 space-y-1">
                    {providerInfo.available.map(provider => (
                      <li key={provider}>• {provider}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4 className="text-white font-medium mb-2">Features</h4>
                  <ul className="text-gray-400 space-y-1">
                    <li>• Automatic fallback between providers</li>
                    <li>• Intelligent caching system</li>
                    <li>• Rate limit protection</li>
                    <li>• Competition ID mapping</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminSportsApiSettings;
