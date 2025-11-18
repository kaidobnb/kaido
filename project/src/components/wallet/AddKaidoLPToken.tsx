import React, { useState } from 'react';
import Button from '../ui/Button';
import { setupKaidoLPToken, KAIDO_LP_TOKEN } from '../../utils/addKaidoLPToken';
import { Copy, ExternalLink, Plus, AlertCircle, CheckCircle } from 'lucide-react';

const AddKaidoLPToken: React.FC = () => {
  const [isAdding, setIsAdding] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const handleAddToken = async () => {
    setIsAdding(true);
    setStatus('idle');
    setErrorMessage('');

    try {
      const success = await setupKaidoLPToken();
      if (success) {
        setStatus('success');
      } else {
        setStatus('error');
        setErrorMessage('User rejected adding the token');
      }
    } catch (error) {
      setStatus('error');
      setErrorMessage(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      setIsAdding(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
      <div className="flex items-center mb-4">
        <img 
          src={KAIDO_LP_TOKEN.image} 
          alt="Kaido LP" 
          className="w-8 h-8 rounded-full mr-3"
        />
        <div>
          <h3 className="text-white font-bold text-lg">Add Kaido LP Token</h3>
          <p className="text-slate-400 text-sm">Add KAIDO LP token to your wallet</p>
        </div>
      </div>

      {/* Token Information */}
      <div className="bg-slate-900 rounded-lg p-4 mb-4">
        <h4 className="text-white font-semibold mb-3">Token Details</h4>
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-slate-400">Contract Address:</span>
            <div className="flex items-center">
              <span className="text-white text-sm font-mono mr-2">
                {KAIDO_LP_TOKEN.address.slice(0, 6)}...{KAIDO_LP_TOKEN.address.slice(-4)}
              </span>
              <button
                onClick={() => copyToClipboard(KAIDO_LP_TOKEN.address)}
                className="text-yellow-400 hover:text-yellow-300 transition-colors"
                title="Copy address"
              >
                <Copy size={16} />
              </button>
            </div>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-400">Symbol:</span>
            <span className="text-white">{KAIDO_LP_TOKEN.symbol}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-400">Decimals:</span>
            <span className="text-white">{KAIDO_LP_TOKEN.decimals}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-400">Network:</span>
            <span className="text-white">BNB Smart Chain</span>
          </div>
        </div>
      </div>

      {/* Status Messages */}
      {status === 'success' && (
        <div className="bg-green-900/30 border border-green-500/30 rounded-lg p-3 mb-4">
          <div className="flex items-center">
            <CheckCircle className="text-green-400 mr-2" size={20} />
            <span className="text-green-300">Token added successfully!</span>
          </div>
        </div>
      )}

      {status === 'error' && (
        <div className="bg-red-900/30 border border-red-500/30 rounded-lg p-3 mb-4">
          <div className="flex items-center">
            <AlertCircle className="text-red-400 mr-2" size={20} />
            <span className="text-red-300">Error: {errorMessage}</span>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Button
          onClick={handleAddToken}
          disabled={isAdding}
          className="flex items-center justify-center"
        >
          {isAdding ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Adding Token...
            </>
          ) : (
            <>
              <Plus className="mr-2" size={16} />
              Add to Wallet
            </>
          )}
        </Button>

        <Button
          variant="outline"
          onClick={() => window.open(`https://bscscan.com/address/${KAIDO_LP_TOKEN.address}`, '_blank')}
          className="flex items-center justify-center"
        >
          <ExternalLink className="mr-2" size={16} />
          View on BSCScan
        </Button>
      </div>

      {/* Manual Instructions */}
      <div className="mt-6 pt-4 border-t border-slate-700">
        <h4 className="text-white font-semibold mb-2">Manual Setup Instructions</h4>
        <p className="text-slate-400 text-sm mb-3">
          If the automatic setup doesn't work, you can manually add the token:
        </p>
        <ol className="text-slate-400 text-sm space-y-1 list-decimal list-inside">
          <li>Open your wallet (MetaMask, Trust Wallet, etc.)</li>
          <li>Go to "Add Token" or "Import Token"</li>
          <li>Select "Custom Token" or "ERC-20"</li>
          <li>Paste the contract address: <code className="bg-slate-700 px-1 rounded text-white">{KAIDO_LP_TOKEN.address}</code></li>
          <li>Ensure decimals is set to <strong>18</strong></li>
          <li>Symbol should auto-fill as <strong>KAIDO</strong></li>
          <li>Click "Add Token" or "Import"</li>
        </ol>
      </div>

      {/* Important Note */}
      <div className="mt-4 p-3 bg-yellow-900/20 border border-yellow-500/30 rounded-lg">
        <div className="flex items-start">
          <AlertCircle className="text-yellow-400 mr-2 mt-0.5 flex-shrink-0" size={16} />
          <div className="text-yellow-200 text-sm">
            <strong>Important:</strong> Make sure you're on BNB Smart Chain Mainnet (Chain ID: 56) 
            and that the decimals are set to exactly <strong>18</strong> to display the correct balance.
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddKaidoLPToken;
