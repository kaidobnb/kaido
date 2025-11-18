import React, { useEffect, useState, useRef } from 'react';
import { ArrowUp, ArrowDown, TrendingUp } from 'lucide-react';

interface PredictionChartProps {
  predictionId: string;
  tokenType: string;
  currentProbability?: number;
  cryptoPrice?: number;
  targetPrice?: number;
  asset?: string;
}

const PredictionChart: React.FC<PredictionChartProps> = ({
  predictionId,
  tokenType,
  currentProbability = 0.5,
  cryptoPrice = 68432.51, // Default BTC price
  targetPrice = 85000, // Default target price
  asset = 'BTC'
}) => {
  const [priceDirection, setPriceDirection] = useState<'up' | 'down' | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [currentProb, setCurrentProb] = useState<number>(currentProbability * 100);
  const [recentTrades, setRecentTrades] = useState<Array<{
    type: 'buy' | 'sell';
    amount: number;
    probability: number;
    time: Date;
  }>>([]);
  const [priceHistory, setPriceHistory] = useState<Array<{
    value: number;
    time: string;
  }>>([]);

  // Generate realistic chart data
  useEffect(() => {
    // Generate timestamps for the last 24 hours (1 hour intervals)
    const history = [];
    const baseProb = currentProbability * 100;
    let lastValue = baseProb - (Math.random() * 20);

    for (let i = 0; i < 24; i++) {
      const date = new Date();
      date.setHours(date.getHours() - (23 - i));
      const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      // Add some randomness but trend toward the current probability
      const change = (Math.random() - 0.5) * 5; // Random change between -2.5 and 2.5
      const trendFactor = (baseProb - lastValue) * 0.1; // Pull toward current probability
      lastValue = Math.max(5, Math.min(95, lastValue + change + trendFactor));

      history.push({
        value: lastValue,
        time: timeStr
      });
    }

    setPriceHistory(history);
    setCurrentProb(baseProb);

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
  }, [currentProbability]);

  // Simulate live updates
  useEffect(() => {
    const interval = setInterval(() => {
      // Simulate a new trade
      const type = Math.random() > 0.5 ? 'buy' : 'sell';
      const amount = parseFloat((Math.random() * 10 + 1).toFixed(2));
      const probability = parseFloat((currentProb + (Math.random() * 10 - 5)).toFixed(1));

      // Update price direction based on trade type
      setPriceDirection(type === 'buy' ? 'up' : 'down');

      // Add to recent trades
      const newTrade = {
        type,
        amount,
        probability,
        time: new Date()
      };

      setRecentTrades(prev => [newTrade, ...prev.slice(0, 4)]);
      setLastUpdate(new Date());

      // Update price history
      const newHistory = [...priceHistory];
      newHistory.push({
        value: probability,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      });
      newHistory.shift();

      setPriceHistory(newHistory);
      setCurrentProb(probability);
    }, 8000); // Update every 8 seconds

    return () => clearInterval(interval);
  }, [priceHistory, currentProb]);

  // Calculate win probability based on current crypto price and target
  const winProbability = cryptoPrice > targetPrice ?
    Math.min(95, 50 + ((cryptoPrice - targetPrice) / targetPrice) * 100) :
    Math.max(5, 50 - ((targetPrice - cryptoPrice) / targetPrice) * 100);

  // Custom chart component
  const CustomChart = () => {
    const chartRef = useRef<HTMLDivElement>(null);

    // Calculate the max and min values for scaling
    const maxValue = Math.max(...priceHistory.map(p => p.value));
    const minValue = Math.min(...priceHistory.map(p => p.value));
    const range = maxValue - minValue;

    // Scale a value to fit in the chart height
    const scaleValue = (value: number) => {
      return 100 - ((value - minValue) / (range || 1)) * 80;
    };

    return (
      <div className="h-72 bg-slate-900/90 rounded-lg p-4 pt-4 pb-10 relative">
        {/* Y-axis labels */}
        <div className="absolute left-0 top-0 h-full flex flex-col justify-between text-xs text-slate-400 py-2">
          <div className="text-sky-400/80 font-medium">{Math.ceil(maxValue)}%</div>
          <div className="text-slate-400">{Math.round(maxValue - (range * 0.2))}%</div>
          <div className="text-slate-400">{Math.round(maxValue - (range * 0.4))}%</div>
          <div className="text-slate-400">{Math.round(maxValue - (range * 0.6))}%</div>
          <div className="text-slate-400">{Math.round(maxValue - (range * 0.8))}%</div>
          <div className="text-sky-400/80 font-medium">{Math.floor(minValue)}%</div>
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

          {/* Vertical grid lines with price indicators */}
          <div className="border-l border-slate-700/50 absolute left-0 h-full">
            <div className="absolute -top-3 -translate-x-1/2 text-xs text-sky-400/80">50%</div>
          </div>
          <div className="border-l border-slate-700/50 absolute h-full" style={{ left: '16.67%' }}>
            <div className="absolute -top-3 -translate-x-1/2 text-xs text-sky-400/80">40%</div>
          </div>
          <div className="border-l border-slate-700/50 absolute h-full" style={{ left: '33.33%' }}>
            <div className="absolute -top-3 -translate-x-1/2 text-xs text-sky-400/80">30%</div>
          </div>
          <div className="border-l border-slate-700/50 absolute h-full" style={{ left: '50%' }}>
            <div className="absolute -top-3 -translate-x-1/2 text-xs text-sky-400/80">20%</div>
          </div>
          <div className="border-l border-slate-700/50 absolute h-full" style={{ left: '66.67%' }}>
            <div className="absolute -top-3 -translate-x-1/2 text-xs text-sky-400/80">10%</div>
          </div>
          <div className="border-l border-slate-700/50 absolute h-full" style={{ left: '83.33%' }}>
            <div className="absolute -top-3 -translate-x-1/2 text-xs text-sky-400/80">5%</div>
          </div>
          <div className="border-l border-slate-700/50 absolute right-0 h-full">
            <div className="absolute -top-3 -translate-x-1/2 text-xs text-sky-400/80">0%</div>
          </div>
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
                M 0,${scaleValue(priceHistory[0]?.value || 0)}
                ${priceHistory.map((point, i) => `L ${(i / (priceHistory.length - 1)) * 100}%,${scaleValue(point.value)}`).join(' ')}
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
                M 0,${scaleValue(priceHistory[0]?.value || 0)}
                ${priceHistory.map((point, i) => `L ${(i / (priceHistory.length - 1)) * 100}%,${scaleValue(point.value)}`).join(' ')}
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
                cy={scaleValue(point.value)}
                r="2"
                fill="#0ea5e9"
              />
            ))}

            {/* Current value indicator */}
            <circle
              cx="100%"
              cy={scaleValue(currentProb)}
              r="4"
              fill="#0ea5e9"
            />
          </svg>
        </div>

        {/* X-axis labels with price values */}
        <div className="absolute left-8 right-4 bottom-0 flex justify-between text-xs text-slate-400">
          <div className="flex flex-col items-center">
            <div>Apr 24</div>
            <div className="text-sky-400/80">$67,245</div>
          </div>
          <div className="flex flex-col items-center">
            <div>Apr 25</div>
            <div className="text-sky-400/80">$68,120</div>
          </div>
          <div className="flex flex-col items-center">
            <div>Apr 25</div>
            <div className="text-sky-400/80">$67,890</div>
          </div>
          <div className="flex flex-col items-center">
            <div>Apr 25</div>
            <div className="text-sky-400/80">$68,450</div>
          </div>
          <div className="flex flex-col items-center">
            <div>Apr 26</div>
            <div className="text-sky-400/80">$68,210</div>
          </div>
          <div className="flex flex-col items-center">
            <div>Apr 26</div>
            <div className="text-sky-400/80">$67,980</div>
          </div>
          <div className="flex flex-col items-center">
            <div>Apr 26</div>
            <div className="text-sky-400/80">$67,540</div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-slate-800/50 rounded-xl p-4 sm:p-6 border border-slate-700/50 backdrop-blur-sm">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-xl text-white font-medium">{asset} Prediction Market</h3>
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
              {currentProb.toFixed(1)}%
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
        <div className="md:col-span-2">
          <CustomChart />

          <div className="mt-4 flex justify-between items-center">
            <div className="flex items-center">
              <div className="w-3 h-3 rounded-full bg-sky-500 mr-2"></div>
              <span className="text-slate-400 text-sm">Probability</span>
            </div>
            <div className="flex flex-wrap gap-2 sm:gap-3 md:space-x-4">
              <button className="text-slate-400 text-xs sm:text-sm hover:text-white transition-colors">1H</button>
              <button className="text-slate-400 text-xs sm:text-sm hover:text-white transition-colors">6H</button>
              <button className="text-slate-400 text-xs sm:text-sm hover:text-white transition-colors">1D</button>
              <button className="text-slate-400 text-xs sm:text-sm hover:text-white transition-colors">1W</button>
              <button className="text-slate-400 text-xs sm:text-sm hover:text-white transition-colors">1M</button>
              <button className="bg-slate-700 px-2 sm:px-3 py-1 rounded-md text-white text-xs sm:text-sm font-medium">ALL</button>
            </div>
          </div>
        </div>

        <div className="md:col-span-1">
          <div className="bg-slate-800 rounded-lg p-4 mb-4">
            <h4 className="text-white text-sm font-medium mb-2">Market Stats</h4>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-400 text-sm">Current Price:</span>
                <span className="text-white text-sm">${cryptoPrice.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 text-sm">Target Price:</span>
                <span className="text-white text-sm">${targetPrice.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 text-sm">Win Probability:</span>
                <span className="text-white text-sm">{winProbability.toFixed(1)}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 text-sm">24h Change:</span>
                <span className={`text-sm ${Math.random() > 0.5 ? 'text-green-400' : 'text-red-400'}`}>
                  {Math.random() > 0.5 ? '+' : '-'}{(Math.random() * 10).toFixed(1)}%
                </span>
              </div>
            </div>
          </div>

          <div>
            <h4 className="text-white text-sm font-medium mb-2">Recent Trades</h4>
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
                        {trade.type === 'buy' ? 'Buy' : 'Sell'}
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

export default PredictionChart;
