import React, { useState, useEffect } from 'react';
import { Database, Server, RefreshCw } from 'lucide-react';
import Card, { CardHeader, CardContent } from '../ui/Card';
import Button from '../ui/Button';
import { useToast } from '../../hooks/useToast';
import { getApiProvider, setApiProvider, ApiProvider } from '../../services/cryptoService';

const AdminApiSettings: React.FC = () => {
  const { showToast } = useToast();
  const [currentProvider, setCurrentProvider] = useState<ApiProvider>('cryptocompare');
  const [isChanging, setIsChanging] = useState(false);

  // Get the current API provider on component mount
  useEffect(() => {
    const provider = getApiProvider();
    setCurrentProvider(provider);
  }, []);

  // Handle provider change
  const handleProviderChange = (provider: ApiProvider) => {
    setIsChanging(true);
    
    try {
      // Update the provider in localStorage
      setApiProvider(provider);
      setCurrentProvider(provider);
      
      showToast({
        title: 'API Provider Updated',
        message: `Successfully switched to ${provider.toUpperCase()} API`,
        type: 'success'
      });
    } catch (error) {
      console.error('Error changing API provider:', error);
      showToast({
        title: 'Error',
        message: 'Failed to change API provider',
        type: 'error'
      });
    } finally {
      setIsChanging(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold text-white">Crypto API Provider Settings</h2>
          <Button
            variant="outline"
            size="sm"
            leftIcon={<RefreshCw className="h-4 w-4" />}
            onClick={() => {
              const provider = getApiProvider();
              setCurrentProvider(provider);
              showToast({
                title: 'Refreshed',
                message: `Current provider: ${provider.toUpperCase()}`,
                type: 'info'
              });
            }}
          >
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <p className="text-gray-300">
            Select which API provider to use for cryptocurrency price data. The selected provider will be used for all price-related operations.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            {/* CryptoCompare */}
            <div 
              className={`p-4 rounded-lg border-2 transition-all cursor-pointer ${
                currentProvider === 'cryptocompare' 
                  ? 'border-purple-500 bg-purple-900/20' 
                  : 'border-gray-700 bg-gray-800 hover:border-gray-500'
              }`}
              onClick={() => handleProviderChange('cryptocompare')}
            >
              <div className="flex items-center mb-3">
                <Server className="h-5 w-5 text-purple-400 mr-2" />
                <h3 className="font-medium text-white">CryptoCompare</h3>
              </div>
              <p className="text-sm text-gray-400">
                Comprehensive cryptocurrency data with good historical coverage and multiple endpoints.
              </p>
              {currentProvider === 'cryptocompare' && (
                <div className="mt-3 text-xs px-2 py-1 bg-purple-500/20 text-purple-300 rounded inline-block">
                  Currently Active
                </div>
              )}
            </div>
            
            {/* CoinGecko */}
            <div 
              className={`p-4 rounded-lg border-2 transition-all cursor-pointer ${
                currentProvider === 'coingecko' 
                  ? 'border-purple-500 bg-purple-900/20' 
                  : 'border-gray-700 bg-gray-800 hover:border-gray-500'
              }`}
              onClick={() => handleProviderChange('coingecko')}
            >
              <div className="flex items-center mb-3">
                <Database className="h-5 w-5 text-purple-400 mr-2" />
                <h3 className="font-medium text-white">CoinGecko</h3>
              </div>
              <p className="text-sm text-gray-400">
                Wide range of cryptocurrency data with good coverage of smaller altcoins.
              </p>
              {currentProvider === 'coingecko' && (
                <div className="mt-3 text-xs px-2 py-1 bg-purple-500/20 text-purple-300 rounded inline-block">
                  Currently Active
                </div>
              )}
            </div>
            
            {/* CoinMarketCap */}
            <div 
              className={`p-4 rounded-lg border-2 transition-all cursor-pointer ${
                currentProvider === 'coinmarketcap' 
                  ? 'border-purple-500 bg-purple-900/20' 
                  : 'border-gray-700 bg-gray-800 hover:border-gray-500'
              }`}
              onClick={() => handleProviderChange('coinmarketcap')}
            >
              <div className="flex items-center mb-3">
                <Database className="h-5 w-5 text-purple-400 mr-2" />
                <h3 className="font-medium text-white">CoinMarketCap</h3>
              </div>
              <p className="text-sm text-gray-400">
                Industry standard cryptocurrency data with extensive market information.
              </p>
              {currentProvider === 'coinmarketcap' && (
                <div className="mt-3 text-xs px-2 py-1 bg-purple-500/20 text-purple-300 rounded inline-block">
                  Currently Active
                </div>
              )}
            </div>
          </div>
          
          <div className="mt-6 p-4 bg-gray-800 rounded-lg border border-gray-700">
            <h3 className="text-white font-medium mb-2">API Configuration</h3>
            <p className="text-sm text-gray-400 mb-3">
              API keys are configured in the <code className="bg-gray-700 px-1 py-0.5 rounded">.env</code> file. 
              Current provider: <span className="text-purple-400 font-medium">{currentProvider.toUpperCase()}</span>
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-gray-300 font-medium">CryptoCompare API Key:</p>
                <p className="text-gray-400 truncate">
                  {import.meta.env.VITE_CRYPTOCOMPARE_API_KEY || 'Not configured'}
                </p>
              </div>
              <div>
                <p className="text-gray-300 font-medium">CoinGecko API Key:</p>
                <p className="text-gray-400 truncate">
                  {import.meta.env.VITE_COINGECKO_API_KEY || 'Not configured'}
                </p>
              </div>
              <div>
                <p className="text-gray-300 font-medium">CoinMarketCap API Key:</p>
                <p className="text-gray-400 truncate">
                  {import.meta.env.VITE_COINMARKETCAP_API_KEY || 'Not configured'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AdminApiSettings;
