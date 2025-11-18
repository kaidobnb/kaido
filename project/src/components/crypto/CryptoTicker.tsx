import React, { useRef, useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, BarChart2 } from 'lucide-react';
import { getFullPriceData } from '../../services/cryptoService';

interface CryptoPrice {
  name: string;
  symbol: string;
  price: number;
  change: number;
}

const CryptoTicker: React.FC = () => {
  // List of crypto symbols to display
  const cryptoSymbols = [
    'BTC', 'ETH', 'BNB', 'ADA', 'DOGE', 'XRP',
    'DOT', 'AVAX', 'LINK', 'MATIC', 'UNI',
    'SHIB', 'ATOM', 'LTC', 'XLM'
  ];

  // State for crypto prices
  const [cryptoPrices, setCryptoPrices] = useState<CryptoPrice[]>([
    { name: 'Bitcoin', symbol: 'BTC', price: 0, change: 0 },
    { name: 'Ethereum', symbol: 'ETH', price: 0, change: 0 },
    { name: 'BNB', symbol: 'BNB', price: 0, change: 0 },
    { name: 'Cardano', symbol: 'ADA', price: 0, change: 0 },
    { name: 'Dogecoin', symbol: 'DOGE', price: 0, change: 0 },
  ]);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch crypto prices
  useEffect(() => {
    const fetchCryptoPrices = async () => {
      try {
        setIsLoading(true);

        // Join all symbols with commas for the API call
        const symbolsString = cryptoSymbols.join(',');

        // Get full price data including 24h change
        const response = await getFullPriceData(symbolsString);

        if (response && response.RAW) {
          const updatedPrices: CryptoPrice[] = [];

          // Map through each symbol and extract the data
          for (const symbol of cryptoSymbols) {
            if (response.RAW[symbol] && response.RAW[symbol].USD) {
              const data = response.RAW[symbol].USD;

              updatedPrices.push({
                name: getCryptoName(symbol),
                symbol: symbol,
                price: data.PRICE,
                change: data.CHANGEPCT24HOUR
              });
            }
          }

          setCryptoPrices(updatedPrices);
        }
      } catch (err) {
        console.error('Error fetching crypto prices:', err);
        setError('Failed to load crypto prices');
      } finally {
        setIsLoading(false);
      }
    };

    // Helper function to get crypto name from symbol
    const getCryptoName = (symbol: string): string => {
      const nameMap: {[key: string]: string} = {
        'BTC': 'Bitcoin',
        'ETH': 'Ethereum',
        'SOL': 'Solana',
        'ADA': 'Cardano',
        'DOGE': 'Dogecoin',
        'XRP': 'Ripple',
        'DOT': 'Polkadot',
        'AVAX': 'Avalanche',
        'LINK': 'Chainlink',
        'MATIC': 'Polygon',
        'UNI': 'Uniswap',
        'SHIB': 'Shiba Inu',
        'ATOM': 'Cosmos',
        'LTC': 'Litecoin',
        'XLM': 'Stellar'
      };

      return nameMap[symbol] || symbol;
    };

    // Fetch prices immediately
    fetchCryptoPrices();

    // Set up interval to fetch prices every 60 seconds
    const interval = setInterval(fetchCryptoPrices, 60000);

    return () => clearInterval(interval);
  }, []);

  const priceTickerRef = useRef<HTMLDivElement>(null);
  const [pricesPaused, setPricesPaused] = useState(false);

  return (
    <div className="fixed top-0 left-0 right-0 z-30 mb-0 hidden sm:block">
      {/* Prices Ticker - Hidden on mobile, visible on sm screens and up */}
      <div className="bg-black/95 crypto-ticker-border py-1.5 backdrop-blur-sm border-b border-yellow-500/30">
        <div className="ticker-container" style={{ height: '24px' }}>
          {isLoading && cryptoPrices.length <= 5 ? (
            <div className="flex items-center justify-center w-full h-full">
              <span className="text-slate-400 text-xs">Loading crypto prices...</span>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center w-full h-full">
              <span className="text-red-400 text-xs">{error}</span>
            </div>
          ) : (
            <div
              className="ticker-content items-center space-x-6 inline-flex"
              style={{
                animationPlayState: pricesPaused ? 'paused' : 'running',
                animationDuration: '40s',
                minWidth: '300%'
              }}
              ref={priceTickerRef}
              onMouseEnter={() => setPricesPaused(true)}
              onMouseLeave={() => setPricesPaused(false)}
            >
              {/* Market Label */}
              <div className="flex items-center bg-yellow-600/20 rounded-md px-2 py-1 border border-yellow-500/30">
                <BarChart2 className="h-3 w-3 text-yellow-400 mr-1" />
                <span className="text-white text-xs font-medium">MARKET</span>
              </div>

              {/* Crypto Prices */}
              {cryptoPrices.map((crypto, index) => (
                <div key={index} className="flex items-center">
                  <span className="text-white text-sm font-medium">{crypto.symbol}</span>
                  <span className="text-white text-sm ml-1">${crypto.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  <span className={`flex items-center text-xs ml-1 ${crypto.change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {crypto.change >= 0 ? (
                      <TrendingUp className="h-3 w-3 mr-0.5" />
                    ) : (
                      <TrendingDown className="h-3 w-3 mr-0.5" />
                    )}
                    {Math.abs(crypto.change).toFixed(2)}%
                  </span>
                </div>
              ))}

              {/* Duplicate the entire list to ensure continuous scrolling */}
              {cryptoPrices.map((crypto, index) => (
                <div key={`dup-${index}`} className="flex items-center">
                  <span className="text-white text-sm font-medium">{crypto.symbol}</span>
                  <span className="text-white text-sm ml-1">${crypto.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  <span className={`flex items-center text-xs ml-1 ${crypto.change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {crypto.change >= 0 ? (
                      <TrendingUp className="h-3 w-3 mr-0.5" />
                    ) : (
                      <TrendingDown className="h-3 w-3 mr-0.5" />
                    )}
                    {Math.abs(crypto.change).toFixed(2)}%
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CryptoTicker;
