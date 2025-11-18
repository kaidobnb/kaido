import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { ChevronDown, ChevronRight, BookOpen, Code, Zap, Shield, Wallet, BarChart, ArrowLeft } from 'lucide-react';

const DocumentationPage: React.FC = () => {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState<string | null>('getting-started');

  const toggleSection = (section: string) => {
    setActiveSection(activeSection === section ? null : section);
  };

  const handleBack = () => {
    navigate(-1); // Go back to previous page
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Mobile Back Button */}
      <div className="md:hidden mb-4">
        <Button
          variant="outline"
          size="sm"
          leftIcon={<ArrowLeft className="h-4 w-4" />}
          onClick={handleBack}
          className="text-yellow-400 border-yellow-500/30 hover:bg-yellow-500/10"
        >
          Back
        </Button>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar Navigation */}
        <div className="lg:col-span-1">
          <Card>
            <div className="p-4">
              <h2 className="text-xl font-bold text-white mb-4">Documentation</h2>
              <nav className="space-y-1">
                <button 
                  className={`w-full text-left px-3 py-2 rounded-md flex items-center ${activeSection === 'getting-started' ? 'bg-slate-700 text-white' : 'text-slate-300 hover:bg-slate-800'}`}
                  onClick={() => toggleSection('getting-started')}
                >
                  <BookOpen className="h-4 w-4 mr-2" />
                  <span>Getting Started</span>
                </button>
                <button 
                  className={`w-full text-left px-3 py-2 rounded-md flex items-center ${activeSection === 'wallet-guide' ? 'bg-slate-700 text-white' : 'text-slate-300 hover:bg-slate-800'}`}
                  onClick={() => toggleSection('wallet-guide')}
                >
                  <Wallet className="h-4 w-4 mr-2" />
                  <span>Wallet Guide</span>
                </button>
                <button 
                  className={`w-full text-left px-3 py-2 rounded-md flex items-center ${activeSection === 'prediction-markets' ? 'bg-slate-700 text-white' : 'text-slate-300 hover:bg-slate-800'}`}
                  onClick={() => toggleSection('prediction-markets')}
                >
                  <BarChart className="h-4 w-4 mr-2" />
                  <span>Prediction Markets</span>
                </button>
                <button
                  className={`w-full text-left px-3 py-2 rounded-md flex items-center ${activeSection === 'kaido-token' ? 'bg-slate-700 text-white' : 'text-slate-300 hover:bg-slate-800'}`}
                  onClick={() => toggleSection('kaido-token')}
                >
                  <Zap className="h-4 w-4 mr-2" />
                  <span>KAIDO Token</span>
                </button>
                <button 
                  className={`w-full text-left px-3 py-2 rounded-md flex items-center ${activeSection === 'api-reference' ? 'bg-slate-700 text-white' : 'text-slate-300 hover:bg-slate-800'}`}
                  onClick={() => toggleSection('api-reference')}
                >
                  <Code className="h-4 w-4 mr-2" />
                  <span>API Reference</span>
                </button>
                <button 
                  className={`w-full text-left px-3 py-2 rounded-md flex items-center ${activeSection === 'security' ? 'bg-slate-700 text-white' : 'text-slate-300 hover:bg-slate-800'}`}
                  onClick={() => toggleSection('security')}
                >
                  <Shield className="h-4 w-4 mr-2" />
                  <span>Security</span>
                </button>
              </nav>
            </div>
          </Card>
        </div>
        
        {/* Main Content */}
        <div className="lg:col-span-3">
          <Card>
            <div className="p-6 md:p-8">
              {activeSection === 'getting-started' && (
                <div>
                  <h1 className="text-3xl font-bold text-white mb-6">Getting Started with Kaido</h1>

                  <div className="prose prose-invert max-w-none">
                    <p className="text-slate-300 mb-4">
                      Welcome to Kaido.ai, the AI-powered prediction market platform on BNB Smart Chain. This guide will help you get started with our platform.
                    </p>

                    <h2 className="text-xl font-semibold text-white mt-6 mb-4">What is Kaido?</h2>
                    <p className="text-slate-300 mb-4">
                      Kaido.ai is a decentralized prediction market platform built on the BNB Smart Chain. It allows users to create and participate in markets about future events, leveraging the wisdom of crowds and AI-powered insights to predict outcomes.
                    </p>
                    
                    <h2 className="text-xl font-semibold text-white mt-6 mb-4">Key Features</h2>
                    <ul className="list-disc pl-6 text-slate-300 mb-4">
                      <li>Create and participate in prediction markets</li>
                      <li>AI-powered market suggestions and analysis</li>
                      <li>Fast and low-cost transactions on BNB Smart Chain</li>
                      <li>Earn rewards through successful predictions</li>
                      <li>Community governance and staking</li>
                      <li>User-friendly interface for both beginners and experts</li>
                    </ul>
                    
                    <h2 className="text-xl font-semibold text-white mt-6 mb-4">Quick Start Guide</h2>
                    <ol className="list-decimal pl-6 text-slate-300 mb-4">
                      <li className="mb-2"><strong>Connect your wallet</strong> - Click the "Connect Wallet" button in the top right corner to connect your BNB Smart Chain wallet.</li>
                      <li className="mb-2"><strong>Explore markets</strong> - Browse existing markets on the homepage or use the search function to find specific topics.</li>
                      <li className="mb-2"><strong>Make predictions</strong> - Click on a market to view details and place your prediction by buying shares in the outcome you believe will occur.</li>
                      <li className="mb-2"><strong>Create a market</strong> - Click the "Create Market" button to start your own prediction market on any topic.</li>
                      <li className="mb-2"><strong>Track performance</strong> - Visit your portfolio to track your active positions and past performance.</li>
                    </ol>
                    
                    <h2 className="text-xl font-semibold text-white mt-6 mb-4">System Requirements</h2>
                    <p className="text-slate-300 mb-4">
                      Kaido.ai works on most modern web browsers, including Chrome, Firefox, Safari, and Edge. For the best experience, we recommend:
                    </p>
                    <ul className="list-disc pl-6 text-slate-300 mb-4">
                      <li>A BNB Smart Chain-compatible wallet (MetaMask, Trust Wallet, WalletConnect, etc.)</li>
                      <li>A modern web browser with JavaScript enabled</li>
                      <li>A stable internet connection</li>
                      <li>BNB tokens for transaction fees and predictions</li>
                    </ul>
                    
                    <h2 className="text-xl font-semibold text-white mt-6 mb-4">Next Steps</h2>
                    <p className="text-slate-300 mb-4">
                      Once you're familiar with the basics, explore our other documentation sections to learn more about specific features and advanced functionality.
                    </p>
                  </div>
                </div>
              )}
              
              {activeSection === 'wallet-guide' && (
                <div>
                  <h1 className="text-3xl font-bold text-white mb-6">Wallet Guide</h1>

                  <div className="prose prose-invert max-w-none">
                    <p className="text-slate-300 mb-4">
                      This guide explains how to set up and use a BNB Smart Chain wallet with Kaido.ai.
                    </p>

                    <h2 className="text-xl font-semibold text-white mt-6 mb-4">Supported Wallets</h2>
                    <p className="text-slate-300 mb-4">
                      Kaido.ai supports the following BNB Smart Chain wallets:
                    </p>
                    <ul className="list-disc pl-6 text-slate-300 mb-4">
                      <li>MetaMask</li>
                      <li>Trust Wallet</li>
                      <li>Binance Chain Wallet</li>
                      <li>WalletConnect (supports 100+ wallets)</li>
                      <li>Coinbase Wallet</li>
                      <li>1inch Wallet</li>
                      <li>And other BNB Smart Chain-compatible wallets</li>
                    </ul>
                    
                    <h2 className="text-xl font-semibold text-white mt-6 mb-4">Setting Up a Wallet</h2>
                    <p className="text-slate-300 mb-4">
                      If you don't already have a BNB Smart Chain wallet, follow these steps to set one up:
                    </p>
                    <ol className="list-decimal pl-6 text-slate-300 mb-4">
                      <li className="mb-2">Choose a wallet provider (we recommend MetaMask for beginners)</li>
                      <li className="mb-2">Install the wallet extension or app from the official website</li>
                      <li className="mb-2">Create a new wallet and securely store your seed phrase</li>
                      <li className="mb-2">Fund your wallet with BNB from an exchange or another wallet</li>
                    </ol>

                    <div className="bg-slate-800 p-4 rounded-md mb-4">
                      <p className="text-yellow-400 font-medium">Important Security Note:</p>
                      <p className="text-slate-300">Never share your seed phrase or private keys with anyone, including Kaido staff. Store your seed phrase in a secure location, preferably offline.</p>
                    </div>
                    
                    <h2 className="text-xl font-semibold text-white mt-6 mb-4">Connecting Your Wallet</h2>
                    <p className="text-slate-300 mb-4">
                      To connect your wallet to Kaido.ai:
                    </p>
                    <ol className="list-decimal pl-6 text-slate-300 mb-4">
                      <li className="mb-2">Click the "Connect Wallet/Signup" button in the top right corner</li>
                      <li className="mb-2">Select your wallet provider from the list (MetaMask, WalletConnect, etc.)</li>
                      <li className="mb-2">Approve the connection request in your wallet</li>
                      <li className="mb-2">Ensure you're connected to BNB Smart Chain network</li>
                      <li className="mb-2">Complete any additional profile setup if prompted</li>
                    </ol>

                    <h2 className="text-xl font-semibold text-white mt-6 mb-4">Managing Your Wallet</h2>
                    <p className="text-slate-300 mb-4">
                      Once connected, you can manage your wallet by clicking on your wallet address in the top right corner. From there, you can:
                    </p>
                    <ul className="list-disc pl-6 text-slate-300 mb-4">
                      <li>View your BNB and KAIDO token balances</li>
                      <li>Copy your wallet address</li>
                      <li>View your transaction history</li>
                      <li>Switch networks</li>
                      <li>Disconnect your wallet</li>
                    </ul>
                  </div>
                </div>
              )}
              
              {activeSection === 'prediction-markets' && (
                <div>
                  <h1 className="text-3xl font-bold text-white mb-6">Prediction Markets</h1>

                  <div className="prose prose-invert max-w-none">
                    <p className="text-slate-300 mb-4">
                      Learn how prediction markets work on Kaido.ai and how to participate effectively.
                    </p>

                    <h2 className="text-xl font-semibold text-white mt-6 mb-4">What are Prediction Markets?</h2>
                    <p className="text-slate-300 mb-4">
                      Prediction markets are platforms where users can stake on the probability of specific outcomes for future events. Kaido.ai uses AI-powered insights and real-time data to help users make informed predictions on crypto prices, sports events, and other markets.
                    </p>

                    <h2 className="text-xl font-semibold text-white mt-6 mb-4">Market Types</h2>
                    <p className="text-slate-300 mb-4">
                      Kaido.ai supports several types of prediction markets:
                    </p>
                    <ul className="list-disc pl-6 text-slate-300 mb-4">
                      <li><strong>Binary Markets</strong> - Markets with two possible outcomes (Yes/No)</li>
                      <li><strong>Crypto Price Predictions</strong> - Predict whether crypto prices will reach certain levels</li>
                      <li><strong>Sports Predictions</strong> - Predict outcomes of sports matches and events</li>
                      <li><strong>Multiple Choice Markets</strong> - Markets with several possible outcomes</li>
                    </ul>
                    
                    <h2 className="text-xl font-semibold text-white mt-6 mb-4">Participating in Markets</h2>
                    <p className="text-slate-300 mb-4">
                      To participate in a prediction market:
                    </p>
                    <ol className="list-decimal pl-6 text-slate-300 mb-4">
                      <li className="mb-2">Browse active predictions on the homepage or Predictions page</li>
                      <li className="mb-2">Click on a prediction to view details, current odds, and AI insights</li>
                      <li className="mb-2">Select the outcome you want to predict (Yes/No or specific choice)</li>
                      <li className="mb-2">Enter the amount you want to stake (in BNB or KAIDO)</li>
                      <li className="mb-2">Review the potential payout and fees</li>
                      <li className="mb-2">Confirm the transaction in your wallet</li>
                    </ol>

                    <h2 className="text-xl font-semibold text-white mt-6 mb-4">Creating Markets</h2>
                    <p className="text-slate-300 mb-4">
                      To create your own prediction market using our AI assistant:
                    </p>
                    <ol className="list-decimal pl-6 text-slate-300 mb-4">
                      <li className="mb-2">Use the Kaido AI chat widget on the homepage</li>
                      <li className="mb-2">Describe the prediction you want to create (e.g., "Will BNB reach $1550 this week?")</li>
                      <li className="mb-2">The AI will help you define the question, outcomes, and resolution criteria</li>
                      <li className="mb-2">Review and confirm the market details</li>
                      <li className="mb-2">Submit the market for creation</li>
                    </ol>
                    
                    <h2 className="text-xl font-semibold text-white mt-6 mb-4">Market Resolution</h2>
                    <p className="text-slate-300 mb-4">
                      When a prediction market ends, it enters the resolution phase:
                    </p>
                    <ul className="list-disc pl-6 text-slate-300 mb-4">
                      <li><strong>Crypto Price Predictions:</strong> Automatically resolved using live price data from CryptoCompare, CoinGecko, and CoinMarketCap APIs</li>
                      <li><strong>Sports Predictions:</strong> Resolved using official sports data APIs and verified results</li>
                      <li><strong>Manual Markets:</strong> Resolved by our AI agent or team based on predefined criteria</li>
                      <li><strong>Disputed Resolutions:</strong> May be escalated to community governance for final decision</li>
                    </ul>
                    <p className="text-slate-300 mb-4">
                      Once resolved, winners can claim their payouts from the Winnings section in their profile. A 5% fee is charged on the winning pool when predictions are resolved.
                    </p>
                  </div>
                </div>
              )}
              
              {activeSection === 'kaido-token' && (
                <div>
                  <h1 className="text-3xl font-bold text-white mb-6">KAIDO Token</h1>

                  <div className="prose prose-invert max-w-none">
                    <p className="text-slate-300 mb-4">
                      Learn about the KAIDO token, its utility, and how to acquire and use it on the platform.
                    </p>

                    <h2 className="text-xl font-semibold text-white mt-6 mb-4">What is KAIDO?</h2>
                    <p className="text-slate-300 mb-4">
                      KAIDO is the native utility token of the Kaido platform. It's built on the BNB Smart Chain as a BEP-20 token, offering fast and low-cost transactions.
                    </p>
                    
                    <h2 className="text-xl font-semibold text-white mt-6 mb-4">Token Utility</h2>
                    <p className="text-slate-300 mb-4">
                      KAIDO tokens serve several purposes within the ecosystem:
                    </p>
                    <ul className="list-disc pl-6 text-slate-300 mb-4">
                      <li>Participate in prediction markets</li>
                      <li>Earn rewards for successful predictions</li>
                      <li>Stake for platform benefits and governance rights</li>
                      <li>Create and sponsor markets</li>
                      <li>Access premium features and analytics</li>
                      <li>Participate in platform governance</li>
                    </ul>

                    <h2 className="text-xl font-semibold text-white mt-6 mb-4">How to Acquire KAIDO</h2>
                    <p className="text-slate-300 mb-4">
                      There are several ways to acquire KAIDO tokens:
                    </p>
                    <ul className="list-disc pl-6 text-slate-300 mb-4">
                      <li>Purchase from supported DEXs on BNB Smart Chain</li>
                      <li>Earn through successful predictions (lower fees when using KAIDO)</li>
                      <li>Receive as rewards for platform activities</li>
                      <li>Participate in promotional events and airdrops</li>
                      <li>Refer new users to the platform and earn referral rewards</li>
                    </ul>

                    <h2 className="text-xl font-semibold text-white mt-6 mb-4">KAIDO Token Benefits</h2>
                    <p className="text-slate-300 mb-4">
                      Using KAIDO tokens provides several benefits:
                    </p>
                    <ul className="list-disc pl-6 text-slate-300 mb-4">
                      <li><strong>Reduced Fees:</strong> Only 2% fee for KAIDO predictions vs 10% for BNB predictions</li>
                      <li><strong>Platform Rewards:</strong> Earn rewards from platform fees</li>
                      <li><strong>Governance Rights:</strong> Participate in platform governance decisions</li>
                      <li><strong>Premium Features:</strong> Access to advanced analytics and insights</li>
                      <li><strong>Reputation Boost:</strong> Enhanced profile status and leaderboard ranking</li>
                    </ul>
                    <p className="text-slate-300 mb-4">
                      KAIDO tokens are the native currency of the Kaido.ai ecosystem, designed to incentivize participation and reward successful predictors.
                    </p>

                    <h2 className="text-xl font-semibold text-white mt-6 mb-4">Tokenomics</h2>
                    <p className="text-slate-300 mb-4">
                      KAIDO has a fixed supply with the following distribution:
                    </p>
                    <ul className="list-disc pl-6 text-slate-300 mb-4">
                      <li>40% - Community rewards and ecosystem growth</li>
                      <li>20% - Team and advisors (vested over 3 years)</li>
                      <li>15% - Platform development and operations</li>
                      <li>10% - Liquidity provision on DEXs</li>
                      <li>10% - Initial investors (vested over 2 years)</li>
                      <li>5% - Strategic partnerships and marketing</li>
                    </ul>
                    <p className="text-slate-300 mb-4">
                      <strong>Fee Structure:</strong> Kaido.ai charges a 10% fee for BNB predictions and 2% fee for KAIDO predictions. Additionally, a 5% fee is charged on the winning pool when predictions are resolved. These fees support platform development, reward KAIDO holders, and fund the treasury.
                    </p>
                  </div>
                </div>
              )}
              
              {activeSection === 'api-reference' && (
                <div>
                  <h1 className="text-3xl font-bold text-white mb-6">API Reference</h1>
                  
                  <div className="prose prose-invert max-w-none">
                    <p className="text-slate-300 mb-4">
                      This section provides documentation for the Kaido.ai API, allowing developers to integrate with our platform.
                    </p>

                    <div className="bg-slate-800 p-4 rounded-md mb-6">
                      <p className="text-yellow-400 font-medium">Developer Preview</p>
                      <p className="text-slate-300">Our API is currently in developer preview. To request access, please contact api@kaido.ai.</p>
                    </div>
                    
                    <h2 className="text-xl font-semibold text-white mt-6 mb-4">Authentication</h2>
                    <p className="text-slate-300 mb-4">
                      All API requests require authentication using an API key. To obtain an API key, register as a developer in your account settings.
                    </p>
                    <pre className="bg-slate-900 p-4 rounded-md overflow-x-auto">
                      <code className="text-slate-300">
                        {`// Example API request with authentication
fetch('https://api.kaido.ai/v1/markets', {
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json'
  }
})`}
                      </code>
                    </pre>
                    
                    <h2 className="text-xl font-semibold text-white mt-6 mb-4">Endpoints</h2>
                    <p className="text-slate-300 mb-4">
                      The API provides the following main endpoints:
                    </p>
                    
                    <h3 className="text-lg font-semibold text-white mt-4 mb-2">Markets</h3>
                    <ul className="list-disc pl-6 text-slate-300 mb-4">
                      <li><code className="bg-slate-800 px-1 py-0.5 rounded">GET /v1/markets</code> - List all markets</li>
                      <li><code className="bg-slate-800 px-1 py-0.5 rounded">GET /v1/markets/{'{id}'}</code> - Get market details</li>
                      <li><code className="bg-slate-800 px-1 py-0.5 rounded">GET /v1/markets/trending</code> - Get trending markets</li>
                    </ul>
                    
                    <h3 className="text-lg font-semibold text-white mt-4 mb-2">User</h3>
                    <ul className="list-disc pl-6 text-slate-300 mb-4">
                      <li><code className="bg-slate-800 px-1 py-0.5 rounded">GET /v1/user/profile</code> - Get user profile</li>
                      <li><code className="bg-slate-800 px-1 py-0.5 rounded">GET /v1/user/positions</code> - Get user positions</li>
                      <li><code className="bg-slate-800 px-1 py-0.5 rounded">GET /v1/user/transactions</code> - Get user transactions</li>
                    </ul>
                    
                    <h3 className="text-lg font-semibold text-white mt-4 mb-2">Trading</h3>
                    <ul className="list-disc pl-6 text-slate-300 mb-4">
                      <li><code className="bg-slate-800 px-1 py-0.5 rounded">POST /v1/trade</code> - Place a trade</li>
                      <li><code className="bg-slate-800 px-1 py-0.5 rounded">GET /v1/trade/{'{id}'}</code> - Get trade details</li>
                    </ul>
                    
                    <h2 className="text-xl font-semibold text-white mt-6 mb-4">Rate Limits</h2>
                    <p className="text-slate-300 mb-4">
                      API requests are subject to the following rate limits:
                    </p>
                    <ul className="list-disc pl-6 text-slate-300 mb-4">
                      <li>Public endpoints: 60 requests per minute</li>
                      <li>Authenticated endpoints: 120 requests per minute</li>
                      <li>Trading endpoints: 30 requests per minute</li>
                    </ul>
                    <p className="text-slate-300 mb-4">
                      Rate limit headers are included in all API responses.
                    </p>
                    
                    <h2 className="text-xl font-semibold text-white mt-6 mb-4">Webhooks</h2>
                    <p className="text-slate-300 mb-4">
                      You can subscribe to webhooks to receive real-time updates for:
                    </p>
                    <ul className="list-disc pl-6 text-slate-300 mb-4">
                      <li>Market creation and resolution</li>
                      <li>Price changes</li>
                      <li>Trade execution</li>
                      <li>Account events</li>
                    </ul>
                    <p className="text-slate-300 mb-4">
                      Configure webhooks in the developer settings of your account.
                    </p>
                  </div>
                </div>
              )}
              
              {activeSection === 'security' && (
                <div>
                  <h1 className="text-3xl font-bold text-white mb-6">Security</h1>
                  
                  <div className="prose prose-invert max-w-none">
                    <p className="text-slate-300 mb-4">
                      Learn about the security measures in place to protect your assets and data on Kaido.
                    </p>

                    <h2 className="text-xl font-semibold text-white mt-6 mb-4">Platform Security</h2>
                    <p className="text-slate-300 mb-4">
                      Kaido employs multiple layers of security:
                    </p>
                    <ul className="list-disc pl-6 text-slate-300 mb-4">
                      <li>Smart contract audits by leading security firms</li>
                      <li>Regular security assessments and penetration testing</li>
                      <li>Bug bounty program for responsible disclosure</li>
                      <li>Secure infrastructure with redundancy and monitoring</li>
                      <li>Data encryption in transit and at rest</li>
                    </ul>
                    
                    <h2 className="text-xl font-semibold text-white mt-6 mb-4">Wallet Security</h2>
                    <p className="text-slate-300 mb-4">
                      Your wallet security is crucial. We recommend the following best practices:
                    </p>
                    <ul className="list-disc pl-6 text-slate-300 mb-4">
                      <li>Use a hardware wallet for significant holdings</li>
                      <li>Never share your seed phrase or private keys</li>
                      <li>Enable two-factor authentication when available</li>
                      <li>Use a strong, unique password for your wallet</li>
                      <li>Keep your wallet software updated</li>
                      <li>Be cautious of phishing attempts</li>
                    </ul>
                    
                    <div className="bg-slate-800 p-4 rounded-md mb-6">
                      <p className="text-yellow-400 font-medium">Important:</p>
                      <p className="text-slate-300">Kaido will never ask for your seed phrase, private keys, or passwords. Be wary of impersonators.</p>
                    </div>
                    
                    <h2 className="text-xl font-semibold text-white mt-6 mb-4">Smart Contract Security</h2>
                    <p className="text-slate-300 mb-4">
                      Our smart contracts have undergone rigorous security measures:
                    </p>
                    <ul className="list-disc pl-6 text-slate-300 mb-4">
                      <li>Multiple independent audits</li>
                      <li>Formal verification of critical components</li>
                      <li>Extensive testing on testnets</li>
                      <li>Gradual deployment with increasing stake limits</li>
                      <li>Emergency pause functionality for critical issues</li>
                    </ul>
                    <p className="text-slate-300 mb-4">
                      Audit reports are available in our GitHub repository.
                    </p>
                    
                    <h2 className="text-xl font-semibold text-white mt-6 mb-4">Reporting Security Issues</h2>
                    <p className="text-slate-300 mb-4">
                      If you discover a security vulnerability, please report it responsibly:
                    </p>
                    <ol className="list-decimal pl-6 text-slate-300 mb-4">
                      <li className="mb-2">Email security@kaido.app with details</li>
                      <li className="mb-2">Do not disclose the issue publicly until it's resolved</li>
                      <li className="mb-2">Provide sufficient information to reproduce the issue</li>
                    </ol>
                    <p className="text-slate-300 mb-4">
                      We offer bounties for responsible disclosure of security vulnerabilities based on severity.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default DocumentationPage;
