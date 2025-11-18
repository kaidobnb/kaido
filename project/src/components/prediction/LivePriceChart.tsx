import React, { useEffect, useState, useRef } from 'react';
import { ArrowUp, ArrowDown, TrendingUp } from 'lucide-react';
import { getCurrentPrice, getHistoricalPriceData } from '../../services/cryptoService';

interface LivePriceChartProps {
  predictionId: string;
  tokenType: string;
  asset: string;
  targetPrice?: number;
  currentProbability?: number;
}

const LivePriceChart: React.FC<LivePriceChartProps> = ({
  predictionId,
  tokenType,
  asset = 'BTC',
  targetPrice = 0,
  currentProbability = 0.5
}) => {
  const [currentPrice, setCurrentPrice] = useState<number>(0);
  const [priceDirection, setPriceDirection] = useState<'up' | 'down' | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [priceHistory, setPriceHistory] = useState<Array<{
    price: number;
    time: string;
    timestamp: number;
  }>>([]);
  const [timeframe, setTimeframe] = useState<'1H' | '6H' | '1D' | '1W' | '1M' | 'ALL'>('1D');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [voteProbability, setVoteProbability] = useState<number>(currentProbability * 100);
  const [recentTrades, setRecentTrades] = useState<Array<{
    type: 'buy' | 'sell';
    amount: number;
    probability: number;
    time: Date;
  }>>([]);

  // Fetch current price
  useEffect(() => {
    const fetchCurrentPrice = async () => {
      try {
        const data = await getCurrentPrice(asset);
        const newPrice = data.USD;
        
        if (currentPrice > 0) {
          setPriceDirection(newPrice > currentPrice ? 'up' : 'down');
        }
        
        setCurrentPrice(newPrice);
        setLastUpdate(new Date());
      } catch (err) {
        console.error('Error fetching current price:', err);
        setError('Failed to fetch current price');
      }
    };

    fetchCurrentPrice();
    
    // Set up interval to fetch price every 30 seconds
    const interval = setInterval(fetchCurrentPrice, 30000);
    
    return () => clearInterval(interval);
  }, [asset, currentPrice]);

  // Fetch historical price data based on selected timeframe
  useEffect(() => {
    const fetchHistoricalData = async () => {
      setIsLoading(true);
      try {
        let limit = 24; // Default for 1D
        let aggregate = 1;
        let timespan: 'minute' | 'hour' | 'day' = 'hour';
        
        switch (timeframe) {
          case '1H':
            limit = 60;
            timespan = 'minute';
            break;
          case '6H':
            limit = 72;
            timespan = 'minute';
            aggregate = 5;
            break;
          case '1D':
            limit = 24;
            timespan = 'hour';
            break;
          case '1W':
            limit = 7;
            timespan = 'day';
            break;
          case '1M':
            limit = 30;
            timespan = 'day';
            break;
          case 'ALL':
            limit = 60;
            timespan = 'day';
            break;
        }
        
        const data = await getHistoricalPriceData(asset, 'USD', limit, aggregate, timespan);
        
        if (data && data.Data) {
          const history = data.Data.map((item: any) => ({
            price: item.close,
            time: new Date(item.time * 1000).toLocaleString([], {
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            }),
            timestamp: item.time
          }));
          
          setPriceHistory(history);
        }
      } catch (err) {
        console.error('Error fetching historical data:', err);
        setError('Failed to fetch historical price data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchHistoricalData();
  }, [asset, timeframe]);

  // Generate simulated trades and update vote probability
  useEffect(() => {
    // Generate some recent trades
    const newTrades = [];
    for (let i = 0; i < 5; i++) {
      const type = Math.random() > 0.5 ? 'buy' : 'sell';
      const amount = parseFloat((Math.random() * 10 + 1).toFixed(2));
      const probability = parseFloat((currentProbability * 100 + (Math.random() * 10 - 5)).toFixed(1));
      const time = new Date();
      time.setMinutes(time.getMinutes() - i * 5);

      newTrades.push({
        type,
        amount,
        probability,
        time
      });
    }
    setRecentTrades(newTrades);
    setVoteProbability(currentProbability * 100);

    // Simulate live updates for votes
    const interval = setInterval(() => {
      // Simulate a new trade
      const type = Math.random() > 0.5 ? 'buy' : 'sell';
      const amount = parseFloat((Math.random() * 10 + 1).toFixed(2));
      const newProbability = parseFloat((voteProbability + (type === 'buy' ? 1 : -1) * Math.random() * 2).toFixed(1));
      
      // Keep probability within bounds
      const boundedProbability = Math.max(5, Math.min(95, newProbability));
      
      // Add to recent trades
      const newTrade = {
        type,
        amount,
        probability: boundedProbability,
        time: new Date()
      };

      setRecentTrades(prev => [newTrade, ...prev.slice(0, 4)]);
      setVoteProbability(boundedProbability);
    }, 8000); // Update every 8 seconds

    return () => clearInterval(interval);
  }, [currentProbability]);

  // Calculate win probability based on current crypto price and target
  const winProbability = targetPrice > 0 ? 
    (currentPrice > targetPrice ?
      Math.min(95, 50 + ((currentPrice - targetPrice) / targetPrice) * 100) :
      Math.max(5, 50 - ((targetPrice - currentPrice) / targetPrice) * 100)) :
    voteProbability;

  // Custom chart component for price data
  const PriceChart = () => {
    const chartRef = useRef<HTMLDivElement>(null);

    if (priceHistory.length === 0) {
      return (
        <div className="h-72 bg-slate-900/90 rounded-lg p-4 flex items-center justify-center">
          {isLoading ? (
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-500"></div>
          ) : error ? (
            <div className="text-red-400">{error}</div>
          ) : (
            <div className="text-slate-400">No price data available</div>
          )}
        </div>
      );
    }

    // Calculate the max and min values for scaling
    const prices = priceHistory.map(p => p.price);
    const maxPrice = Math.max(...prices);
    const minPrice = Math.min(...prices);
    const range = maxPrice - minPrice;
    const padding = range * 0.1; // Add 10% padding

    // Scale a value to fit in the chart height
    const scaleValue = (value: number) => {
      return 100 - ((value - (minPrice - padding)) / ((range + padding * 2) || 1)) * 80;
    };

    return (
      <div className="h-72 bg-slate-900/90 rounded-lg p-4 pt-4 pb-10 relative">
        {/* Y-axis labels */}
        <div className="absolute left-0 top-0 h-full flex flex-col justify-between text-xs text-slate-400 py-2">
          <div className="text-sky-400/80 font-medium">${(maxPrice + padding).toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
          <div className="text-slate-400">${(maxPrice - (range * 0.2)).toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
          <div className="text-slate-400">${(maxPrice - (range * 0.4)).toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
          <div className="text-slate-400">${(maxPrice - (range * 0.6)).toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
          <div className="text-slate-400">${(maxPrice - (range * 0.8)).toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
          <div className="text-sky-400/80 font-medium">${(minPrice - padding).toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
        </div>

        {/* Chart grid lines */}
        <div className="absolute left-8 right-4 top-0 h-full">
          {/* Horizontal grid lines */}
          <div className="border-t border-slate-700/50 absolute top-0 w-full"></div>
          <div className="border-t border-slate-700/50 absolute w-full" style={{ top: '20%' }}></div>
          <div className="border-t border-slate-700/50 absolute w-full" style={{ top: '40%' }}></div>
          <div className="border-t border-slate-700/50 absolute w-full" style={{ top: '60%' }}></div>
          <div className="border-t border-slate-700/50 absolute w-full" style={{ top: '80%' }}></div>
          <div className="border-t border-slate-700/50 absolute bottom-0 w-full"></div>

          {/* Target price line if available */}
          {targetPrice > 0 && targetPrice >= minPrice - padding && targetPrice <= maxPrice + padding && (
            <div 
              className="border-t-2 border-dashed border-yellow-500/70 absolute w-full" 
              style={{ top: `${scaleValue(targetPrice)}%` }}
            >
              <div className="absolute -right-1 -top-3 bg-yellow-500/20 text-yellow-400 text-xs px-1 rounded">
                Target: ${targetPrice.toLocaleString()}
              </div>
            </div>
          )}
        </div>

        {/* Chart line */}
        <div className="absolute left-8 right-4 top-6 bottom-2" ref={chartRef}>
          <svg width="100%" height="100%" className="overflow-visible">
            <defs>
              <linearGradient id="lineGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="rgba(14, 165, 233, 0.5)" />
                <stop offset="100%" stopColor="rgba(14, 165, 233, 0)" />
              </linearGradient>
            </defs>

            {/* Area fill */}
            <path
              d={`
                M 0,${scaleValue(priceHistory[0]?.price || 0)}
                ${priceHistory.map((point, i) => `L ${(i / (priceHistory.length - 1)) * 100}%,${scaleValue(point.price)}`).join(' ')}
                L 100%,100%
                L 0,100%
                Z
              `}
              fill="url(#lineGradient)"
              opacity="0.3"
            />

            {/* Line */}
            <path
              d={`
                M 0,${scaleValue(priceHistory[0]?.price || 0)}
                ${priceHistory.map((point, i) => `L ${(i / (priceHistory.length - 1)) * 100}%,${scaleValue(point.price)}`).join(' ')}
              `}
              stroke="rgba(14, 165, 233, 1)"
              strokeWidth="2"
              fill="none"
            />

            {/* Data points */}
            {priceHistory.map((point, i) => (
              <circle
                key={i}
                cx={`${(i / (priceHistory.length - 1)) * 100}%`}
                cy={scaleValue(point.price)}
                r="2"
                fill="#0ea5e9"
              />
            ))}

            {/* Current price indicator */}
            <circle
              cx="100%"
              cy={scaleValue(currentPrice)}
              r="4"
              fill="#0ea5e9"
            />
          </svg>
        </div>

        {/* X-axis labels with timestamps */}
        <div className="absolute left-8 right-4 bottom-0 flex justify-between text-xs text-slate-400">
          {priceHistory.filter((_, i) => i % Math.ceil(priceHistory.length / 7) === 0 || i === priceHistory.length - 1).map((point, i) => (
            <div key={i} className="flex flex-col items-center">
              <div>{point.time.split(',')[0]}</div>
              <div className="text-sky-400/80">${point.price.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700/50 backdrop-blur-sm">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-xl text-white font-medium">{asset} Live Price</h3>
          <p className="text-slate-400 text-sm">
            Last update: {lastUpdate.toLocaleTimeString()}
          </p>
        </div>
        <div className="flex items-center">
          <div className={`flex items-center px-3 py-1 rounded-md ${
            priceDirection === 'up' ? 'bg-green-500/20 text-green-400' :
            priceDirection === 'down' ? 'bg-red-500/20 text-red-400' :
            'bg-slate-700/50 text-slate-300'
          }`}>
            {priceDirection === 'up' ? (
              <ArrowUp className="h-4 w-4 mr-1" />
            ) : priceDirection === 'down' ? (
              <ArrowDown className="h-4 w-4 mr-1" />
            ) : (
              <TrendingUp className="h-4 w-4 mr-1" />
            )}
            <span className="font-medium">
              ${currentPrice.toLocaleString(undefined, { maximumFractionDigits: 2 })}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <PriceChart />

          <div className="mt-4 flex justify-between items-center">
            <div className="flex items-center">
              <div className="w-3 h-3 rounded-full bg-sky-500 mr-2"></div>
              <span className="text-slate-400 text-sm">Price</span>
            </div>
            <div className="flex space-x-4">
              {(['1H', '6H', '1D', '1W', '1M', 'ALL'] as const).map((tf) => (
                <button 
                  key={tf}
                  className={`text-sm transition-colors ${
                    timeframe === tf 
                      ? 'bg-slate-700 px-3 py-1 rounded-md text-white font-medium' 
                      : 'text-slate-400 hover:text-white'
                  }`}
                  onClick={() => setTimeframe(tf)}
                >
                  {tf}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="md:col-span-1">
          <div className="bg-slate-800 rounded-lg p-4 mb-4">
            <h4 className="text-white text-sm font-medium mb-2">Market Stats</h4>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-400 text-sm">Current Price:</span>
                <span className="text-white text-sm">${currentPrice.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
              </div>
              {targetPrice > 0 && (
                <div className="flex justify-between">
                  <span className="text-slate-400 text-sm">Target Price:</span>
                  <span className="text-white text-sm">${targetPrice.toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-slate-400 text-sm">Win Probability:</span>
                <span className="text-white text-sm">{winProbability.toFixed(1)}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 text-sm">Vote Probability:</span>
                <span className="text-white text-sm">{voteProbability.toFixed(1)}%</span>
              </div>
              {priceHistory.length > 0 && (
                <div className="flex justify-between">
                  <span className="text-slate-400 text-sm">24h Change:</span>
                  {(() => {
                    const oldestPrice = priceHistory[0]?.price || 0;
                    const newestPrice = priceHistory[priceHistory.length - 1]?.price || 0;
                    const change = oldestPrice > 0 ? ((newestPrice - oldestPrice) / oldestPrice) * 100 : 0;
                    const isPositive = change >= 0;
                    
                    return (
                      <span className={`text-sm ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
                        {isPositive ? '+' : ''}{change.toFixed(2)}%
                      </span>
                    );
                  })()}
                </div>
              )}
            </div>
          </div>

          <div>
            <h4 className="text-white text-sm font-medium mb-2">Recent Votes</h4>
            <div className="space-y-2">
              {recentTrades.map((trade, index) => (
                <div key={index} className="flex justify-between items-center bg-slate-800 rounded-lg p-2">
                  <div className="flex items-center">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center mr-2 ${
                      trade.type === 'buy' ? 'bg-green-500/20' : 'bg-red-500/20'
                    }`}>
                      {trade.type === 'buy' ? (
                        <ArrowUp className={`h-3 w-3 text-green-400`} />
                      ) : (
                        <ArrowDown className={`h-3 w-3 text-red-400`} />
                      )}
                    </div>
                    <div>
                      <span className={`text-xs font-medium ${
                        trade.type === 'buy' ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {trade.type === 'buy' ? 'Yes' : 'No'}
                      </span>
                      <p className="text-slate-400 text-xs">
                        {trade.time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-white text-xs font-medium">
                      {trade.amount} {tokenType}
                    </span>
                    <p className="text-slate-400 text-xs">
                      @ {trade.probability}%
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LivePriceChart;
