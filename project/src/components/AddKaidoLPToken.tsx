import React, { useState } from 'react';
import { setupKaidoLPToken, KAIDO_LP_TOKEN } from '../utils/addKaidoLPToken';

interface AddKaidoLPTokenProps {
  className?: string;
  variant?: 'button' | 'card';
}

export const AddKaidoLPToken: React.FC<AddKaidoLPTokenProps> = ({ 
  className = '', 
  variant = 'button' 
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const handleAddToken = async () => {
    setIsLoading(true);
    setStatus('idle');

    try {
      const success = await setupKaidoLPToken();
      setStatus(success ? 'success' : 'error');
      
      if (success) {
        setTimeout(() => setStatus('idle'), 3000); // Reset after 3 seconds
      }
    } catch (error) {
      console.error('Error adding token:', error);
      setStatus('error');
    } finally {
      setIsLoading(false);
    }
  };

  if (variant === 'card') {
    return (
      <div className={`bg-white rounded-lg border border-gray-200 p-6 ${className}`}>
        <div className="flex items-center space-x-4">
          <img 
            src="/kaido.png" 
            alt="Kaido LP Token" 
            className="w-12 h-12 rounded-full"
          />
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900">Kaido LP Token</h3>
            <p className="text-sm text-gray-600">Add to MetaMask wallet</p>
            <div className="mt-2 text-xs text-gray-500">
              <div>Contract: {KAIDO_LP_TOKEN.address.slice(0, 6)}...{KAIDO_LP_TOKEN.address.slice(-4)}</div>
              <div>Symbol: {KAIDO_LP_TOKEN.symbol} • Decimals: {KAIDO_LP_TOKEN.decimals}</div>
            </div>
          </div>
          <button
            onClick={handleAddToken}
            disabled={isLoading}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              status === 'success'
                ? 'bg-green-100 text-green-800 border border-green-200'
                : status === 'error'
                ? 'bg-red-100 text-red-800 border border-red-200'
                : 'bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50'
            }`}
          >
            {isLoading ? (
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Adding...</span>
              </div>
            ) : status === 'success' ? (
              '✅ Added!'
            ) : status === 'error' ? (
              '❌ Failed'
            ) : (
              '+ Add to MetaMask'
            )}
          </button>
        </div>
      </div>
    );
  }

  return (
    <button
      onClick={handleAddToken}
      disabled={isLoading}
      className={`inline-flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors ${
        status === 'success'
          ? 'bg-green-100 text-green-800 border border-green-200'
          : status === 'error'
          ? 'bg-red-100 text-red-800 border border-red-200'
          : 'bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50'
      } ${className}`}
    >
      <img 
        src="/kaido.png" 
        alt="Kaido LP" 
        className="w-5 h-5 rounded-full"
      />
      {isLoading ? (
        <>
          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          <span>Adding...</span>
        </>
      ) : status === 'success' ? (
        <span>✅ Added to MetaMask!</span>
      ) : status === 'error' ? (
        <span>❌ Failed to add</span>
      ) : (
        <span>Add KAIDO LP to MetaMask</span>
      )}
    </button>
  );
};

export default AddKaidoLPToken;
