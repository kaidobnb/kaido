import React from 'react';
import { TrendingUp, TrendingDown, Newspaper, ExternalLink } from 'lucide-react';

interface CryptoPrice {
  name: string;
  symbol: string;
  price: number;
  change: number;
  volume: string;
}

interface NewsItem {
  title: string;
  source: string;
  time: string;
  url: string;
}

const CryptoNewsPanel: React.FC = () => {
  // Mock data for crypto prices
  const cryptoPrices: CryptoPrice[] = [
    { name: 'Bitcoin', symbol: 'BTC', price: 68432.51, change: 2.4, volume: '$42.8B' },
    { name: 'Ethereum', symbol: 'ETH', price: 3921.76, change: 1.8, volume: '$18.3B' },
    { name: 'Solana', symbol: 'SOL', price: 142.89, change: 5.2, volume: '$8.7B' },
    { name: 'Cardano', symbol: 'ADA', price: 0.58, change: -1.2, volume: '$1.2B' },
    { name: 'Dogecoin', symbol: 'DOGE', price: 0.12, change: -0.5, volume: '$980M' },
  ];

  // Mock data for news
  const newsItems: NewsItem[] = [
    {
      title: 'Solana Surges 5% as DeFi Activity Reaches New Heights',
      source: 'CryptoNews',
      time: '2h ago',
      url: '#'
    },
    {
      title: 'Bitcoin ETF Inflows Hit $500M in Single Day',
      source: 'BlockchainTimes',
      time: '4h ago',
      url: '#'
    },
    {
      title: 'New Prediction Market Protocol Launches on Solana',
      source: 'DeFiPulse',
      time: '6h ago',
      url: '#'
    }
  ];

  return (
    <div className="mb-16">
      <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700/50 overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-3 divide-y lg:divide-y-0 lg:divide-x divide-slate-700/50">
          {/* Crypto Prices Section */}
          <div className="lg:col-span-2 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="handwritten text-2xl text-white">Live Crypto Prices</h3>
              <span className="text-xs text-slate-400">Last updated: {new Date().toLocaleTimeString()}</span>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-slate-400 text-sm border-b border-slate-700/50">
                    <th className="pb-2 font-medium">Asset</th>
                    <th className="pb-2 font-medium">Price</th>
                    <th className="pb-2 font-medium">24h Change</th>
                    <th className="pb-2 font-medium">24h Volume</th>
                  </tr>
                </thead>
                <tbody>
                  {cryptoPrices.map((crypto, index) => (
                    <tr key={index} className="border-b border-slate-700/30 last:border-b-0">
                      <td className="py-3">
                        <div className="flex items-center">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-slate-700 to-slate-600 flex items-center justify-center mr-3">
                            <span className="text-white font-bold text-xs">{crypto.symbol.charAt(0)}</span>
                          </div>
                          <div>
                            <div className="text-white font-medium">{crypto.name}</div>
                            <div className="text-slate-400 text-xs">{crypto.symbol}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 text-white font-mono">${crypto.price.toLocaleString()}</td>
                      <td className="py-3">
                        <div className={`flex items-center ${crypto.change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {crypto.change >= 0 ? (
                            <TrendingUp className="h-4 w-4 mr-1" />
                          ) : (
                            <TrendingDown className="h-4 w-4 mr-1" />
                          )}
                          {Math.abs(crypto.change)}%
                        </div>
                      </td>
                      <td className="py-3 text-slate-300">{crypto.volume}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* News Section */}
          <div className="lg:col-span-1 p-6">
            <div className="flex items-center mb-4">
              <Newspaper className="h-5 w-5 text-purple-400 mr-2" />
              <h3 className="handwritten text-2xl text-white">Crypto News</h3>
            </div>
            
            <div className="space-y-4">
              {newsItems.map((news, index) => (
                <a 
                  key={index} 
                  href={news.url}
                  className="block p-3 rounded-lg hover:bg-slate-700/30 transition-colors"
                >
                  <h4 className="text-white font-medium mb-1">{news.title}</h4>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">{news.source}</span>
                    <span className="text-slate-400 flex items-center">
                      {news.time}
                      <ExternalLink className="h-3 w-3 ml-1" />
                    </span>
                  </div>
                </a>
              ))}
              
              <button className="w-full mt-2 text-center text-sm text-purple-400 hover:text-purple-300 transition-colors">
                View more news
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CryptoNewsPanel;
