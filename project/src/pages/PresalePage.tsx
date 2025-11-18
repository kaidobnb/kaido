import React, { useState, useEffect } from 'react';
import Button from '../components/ui/Button';
import Card, { CardContent, CardHeader } from '../components/ui/Card';
import Input from '../components/ui/Input';
import GlowEffect from '../components/effects/GlowEffect';
import AnimatedBackground from '../components/effects/AnimatedBackground';
import CountdownTimer from '../components/CountdownTimer';
import AnimatedPieChart from '../components/presale/AnimatedPieChart';
import TokenomicsDetails from '../components/presale/TokenomicsDetails';

import { ArrowRight, ChevronDown, ChevronUp, Coins, Clock, Brain, TrendingUp, Award, RefreshCw } from 'lucide-react';

import { formatNumber } from '../utils/formatters';
import { getCurrentPrice } from '../services/cryptoService';

// Import presale configuration from config file
import { PRESALE_CONFIG, TOKENOMICS, FAQ_ITEMS } from '../config/presale';

const PresalePage: React.FC = () => {

  const [bnbAmount, setBnbAmount] = useState<string>('');
  const [activeFaqIndex, setActiveFaqIndex] = useState<number | null>(null);
  // Import TokenomicsItem type from the component
  type TokenomicsItemType = {
    category: string;
    percentage: number;
    color: string;
    description?: string;
    vesting?: string;
  };

  const [activeTokenomicsItem, setActiveTokenomicsItem] = useState<TokenomicsItemType | null>(null);
  const [selectedTokenomicsItem, setSelectedTokenomicsItem] = useState<TokenomicsItemType | null>(null);

  const [bnbPrice, setBnbPrice] = useState<number>(1114); // Set current market price as default
  const [isLoadingPrice, setIsLoadingPrice] = useState<boolean>(false);
  const [priceError, setPriceError] = useState<string | null>(null);

  // Calculate KAIDO tokens based on BNB amount and current BNB price
  const calculateKaidoTokens = (bnb: number): number => {
    if (bnb <= 0 || bnbPrice <= 0) return 0;

    const currentPhase = PRESALE_CONFIG.phases[0];

    // Calculate based on BNB value in USD divided by KAIDO price in USD
    // bnb * bnbPrice = value in USD
    // value in USD / KAIDO price = number of KAIDO tokens
    return (bnb * bnbPrice) / currentPhase.price;
  };

  // Function to fetch BNB price
  const fetchBnbPrice = async () => {
    setIsLoadingPrice(true);
    setPriceError(null);
    try {
      const priceData = await getCurrentPrice('BNB', 'USD');
      if (priceData && priceData.USD) {
        setBnbPrice(priceData.USD);
      } else {
        throw new Error('Invalid price data received');
      }
    } catch (error) {
      console.error('Error fetching BNB price:', error);
      setPriceError('Failed to fetch current BNB price');
      // Keep the default price of $1114 if fetch fails
    } finally {
      setIsLoadingPrice(false);
    }
  };

  // Fetch BNB price on component mount
  useEffect(() => {
    fetchBnbPrice();
  }, []);

  // Get presale end date
  const presaleEndDate = PRESALE_CONFIG.phases[0].endDate;



  // Handle tokenomics item click - toggle popup display
  const handleTokenomicsItemClick = (item: TokenomicsItemType) => {
    // Toggle selection - if clicking the same item, close the popup
    setSelectedTokenomicsItem(selectedTokenomicsItem?.category === item.category ? null : item);

    // When clicking, also set as active for hover effects
    setActiveTokenomicsItem(item);

    // If we're showing a popup, add a small visual feedback
    if (selectedTokenomicsItem?.category !== item.category) {
      // Play a subtle animation or effect here if desired
    }
  };

  // Handle presale participation - redirect to Telegram DM
  const handleParticipate = () => {
    // Open Telegram DM to @web3laud
    window.open('https://t.me/web3laud', '_blank');
  };



  return (
    <div className="container mx-auto px-4 py-8 relative">
      {/* Animated chart background */}
      <AnimatedBackground />

      {/* Main background glow effects - similar to landing page */}
      <div className="fixed top-0 left-0 w-full h-full pointer-events-none overflow-hidden -z-10">
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-slate-900/50 via-slate-900/30 to-slate-900/80"></div>
        {/* Grid pattern background */}
        <div className="absolute inset-0 bg-grid-pattern opacity-10"></div>

        {/* Top left glow */}
        <div className="absolute top-0 left-0 w-[600px] h-[600px] bg-yellow-600/10 rounded-full filter blur-3xl animate-pulse-slow"></div>

        {/* Bottom right glow */}
        <div className="absolute bottom-0 right-0 w-[700px] h-[700px] bg-yellow-500/10 rounded-full filter blur-3xl animate-pulse-slow" style={{ animationDelay: '4s' }}></div>

        {/* Center ambient glow */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[900px] h-[900px] bg-indigo-600/5 rounded-full filter blur-3xl animate-pulse-slow" style={{ animationDelay: '8s' }}></div>

        {/* Additional glows */}
        <div className="absolute top-1/3 right-1/4 w-[400px] h-[400px] bg-pink-600/5 rounded-full filter blur-3xl animate-pulse-slow" style={{ animationDelay: '6s' }}></div>
        <div className="absolute bottom-1/4 left-1/3 w-[500px] h-[500px] bg-green-600/5 rounded-full filter blur-3xl animate-pulse-slow" style={{ animationDelay: '10s' }}></div>

        {/* Floating particles */}
        <div className="absolute top-1/4 left-1/5 w-2 h-2 bg-yellow-400 rounded-full animate-float" style={{ animationDelay: '0s' }}></div>
        <div className="absolute top-3/4 right-1/4 w-3 h-3 bg-yellow-500 rounded-full animate-float" style={{ animationDelay: '2s' }}></div>
        <div className="absolute top-2/3 left-1/3 w-2 h-2 bg-green-400 rounded-full animate-float" style={{ animationDelay: '4s' }}></div>
        <div className="absolute top-1/2 right-1/3 w-1 h-1 bg-pink-400 rounded-full animate-float" style={{ animationDelay: '6s' }}></div>
      </div>
      {/* Hero Section */}
      <section className="py-12 mb-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          <div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-yellow-400 to-yellow-600">
                KAIDO Token Presale
              </span>
            </h1>
            <p className="text-xl text-slate-300 mb-8">
              Join the future of AI-powered prediction markets on BNB Smart Chain. Participate in KAIDO token presale and be part of the Kaido ecosystem from the beginning. Experience next-generation prediction markets!
            </p>

            {/* Countdown Timer */}
            <div className="mb-8">
              <div className="flex items-center gap-2 mb-3">
                <Clock className="h-5 w-5 text-yellow-400" />
                <h3 className="text-lg font-semibold text-white">
                  Presale ends in:
                </h3>
              </div>
              <CountdownTimer
                targetDate={presaleEndDate}
                onComplete={() => {}}
                className="bg-slate-800/50 p-4 rounded-lg border border-slate-700/50"
              />
            </div>

            <div className="flex flex-wrap gap-4">
              <Button
                variant="primary"
                size="lg"
                onClick={handleParticipate}
                rightIcon={<ArrowRight className="h-5 w-5" />}
              >
                Join Presale
              </Button>
            </div>
          </div>

          <GlowEffect glowColor="#F3BA2F">
            <Card className="bg-slate-800/50 backdrop-blur-sm border-slate-700/50">
              <CardHeader>
                <h2 className="text-2xl font-bold text-white">Presale Details</h2>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div>
                    <h3 className="text-xl font-semibold text-white mb-2">Presale</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-slate-700/50 rounded-lg p-3">
                        <p className="text-sm text-slate-400">Presale Price</p>
                        <p className="text-lg font-medium text-white">${PRESALE_CONFIG.phases[0].price} USD</p>
                      </div>
                      <div className="bg-slate-700/50 rounded-lg p-3">
                        <p className="text-sm text-slate-400">Listing Price</p>
                        <p className="text-lg font-medium text-white">${PRESALE_CONFIG.listingPrice} USD</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mt-4">
                      <div className="bg-slate-700/50 rounded-lg p-3">
                        <p className="text-sm text-slate-400">Allocation</p>
                        <p className="text-lg font-medium text-white">{formatNumber(PRESALE_CONFIG.phases[0].allocation)} KAIDO</p>
                      </div>
                      <div className="bg-slate-700/50 rounded-lg p-3">
                        <p className="text-sm text-slate-400">End Date</p>
                        <p className="text-lg font-medium text-white">{PRESALE_CONFIG.phases[0].endDate.toLocaleDateString()}</p>
                      </div>
                    </div>
                  </div>

                  <div id="presale-form">
                    {PRESALE_CONFIG.phases[0].purchaseEnabled ? (
                      // Regular purchase form for Seed Sale
                      <>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                          Amount to Contribute (BNB)
                        </label>
                        <div className="flex gap-2 mb-4">
                          <Input
                            type="number"
                            value={bnbAmount}
                            onChange={(e) => setBnbAmount(e.target.value)}
                            min={PRESALE_CONFIG.minPurchase}
                            max={PRESALE_CONFIG.maxPurchase}
                            step="0.1"
                            placeholder="Enter BNB amount"
                            className="flex-grow"
                          />
                          <Button
                            variant="outline"
                            onClick={() => setBnbAmount(PRESALE_CONFIG.minPurchase.toString())}
                            className="whitespace-nowrap"
                          >
                            Min
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => setBnbAmount(PRESALE_CONFIG.maxPurchase.toString())}
                            className="whitespace-nowrap"
                          >
                            Max
                          </Button>
                        </div>

                        <div className="bg-slate-700/30 rounded-lg p-4 mb-4">
                          {/* Calculation based on direct BNB to KAIDO conversion */}
                          <div className="flex justify-between mb-2">
                            <span className="text-slate-300">You will receive at TGE:</span>
                            <span className="text-white font-medium">
                              {formatNumber(calculateKaidoTokens(parseFloat(bnbAmount) || 0))} KAIDO
                            </span>
                          </div>

                          {/* Current rate */}
                          <div className="flex justify-between mb-2">
                            <span className="text-slate-300">Current rate:</span>
                            <span className="text-white">1 BNB = {bnbPrice > 0 ? formatNumber(bnbPrice / PRESALE_CONFIG.phases[0].price) : '0'} KAIDO</span>
                          </div>

                          {/* Explanation note */}
                          <div className="bg-slate-800/50 p-2 rounded-md mb-3 text-xs text-slate-300">
                            {bnbPrice > 0 ? (
                              <>
                                <p className="mb-1">Note: KAIDO tokens are priced at <span className="text-white">${PRESALE_CONFIG.phases[0].price.toFixed(6)} USD</span> per token.</p>
                                <p>With current BNB price of <span className="text-white">${bnbPrice.toFixed(2)} USD</span>, your contribution will be converted to KAIDO tokens at the rate of <span className="text-white">1 BNB = {formatNumber(bnbPrice / PRESALE_CONFIG.phases[0].price)} KAIDO</span> tokens.</p>
                              </>
                            ) : (
                              <p>Loading BNB price data... Please click the refresh button to fetch the latest BNB price.</p>
                            )}
                          </div>

                          {/* Current BNB price */}
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-slate-300">Current BNB price:</span>
                            <div className="flex items-center gap-2">
                              <span className="text-white font-medium">
                                ${bnbPrice > 0 ? bnbPrice.toFixed(2) : '-.--'} USD
                              </span>
                              <button
                                onClick={fetchBnbPrice}
                                disabled={isLoadingPrice}
                                className="p-1 text-slate-400 hover:text-white transition-colors disabled:opacity-50"
                                title="Refresh BNB price"
                              >
                                <RefreshCw className={`h-4 w-4 ${isLoadingPrice ? 'animate-spin' : ''}`} />
                              </button>
                            </div>
                          </div>

                          {/* Price error message */}
                          {priceError && (
                            <div className="text-red-400 text-xs mb-2">
                              {priceError}
                            </div>
                          )}

                          {/* USD value of contribution */}
                          {bnbPrice > 0 && parseFloat(bnbAmount) > 0 && (
                            <div className="flex justify-between mb-2">
                              <span className="text-slate-300">Value of contribution:</span>
                              <span className="text-white font-medium">
                                ${(parseFloat(bnbAmount) * bnbPrice).toFixed(2)} USD
                              </span>
                            </div>
                          )}

                          {/* KAIDO price in USD */}
                          {bnbPrice > 0 && (
                            <div className="flex justify-between mb-2">
                              <span className="text-slate-300">KAIDO price in USD:</span>
                              <span className="text-white font-medium">
                                ${PRESALE_CONFIG.phases[0].price.toFixed(6)} USD
                              </span>
                            </div>
                          )}


                        </div>

                        <Button
                          variant="primary"
                          size="lg"
                          fullWidth
                          onClick={handleParticipate}
                        >
                          Join Presale
                        </Button>


                      </>
                    ) : (
                      // Presale not available
                      <div className="bg-gradient-to-r from-yellow-900/30 to-yellow-800/30 rounded-lg p-6 border border-yellow-500/30">
                        <div className="text-center mb-6">
                          <div className="w-20 h-20 rounded-full bg-yellow-500/20 flex items-center justify-center mb-4 mx-auto p-1 border border-yellow-500/30">
                            <Coins className="w-12 h-12 text-yellow-400" />
                          </div>
                          <h3 className="text-xl font-bold text-white mb-2">Presale Not Available</h3>
                          <p className="text-slate-300">
                            The presale is currently not available.
                          </p>
                        </div>

                        {/* Presale button */}
                        <Button
                          variant="primary"
                          size="lg"
                          fullWidth
                          onClick={handleParticipate}
                          className="bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 flex items-center justify-center gap-2"
                        >
                          <Coins className="w-5 h-5" />
                          Contact Us
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </GlowEffect>
        </div>
      </section>

      {/* Early Access Notification Bar */}
      <section className="mb-16 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-yellow-600/20 via-yellow-500/20 to-yellow-600/20 animate-gradient-x"></div>
        <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"></div>

        {/* Animated particles */}
        <div className="absolute inset-0 overflow-hidden">
          {Array.from({ length: 20 }).map((_, i) => (
            <div
              key={i}
              className="absolute rounded-full bg-white/20 animate-float"
              style={{
                width: `${Math.random() * 10 + 5}px`,
                height: `${Math.random() * 10 + 5}px`,
                top: `${Math.random() * 100}%`,
                left: `${Math.random() * 100}%`,
                animationDuration: `${Math.random() * 10 + 10}s`,
                animationDelay: `${Math.random() * 5}s`
              }}
            ></div>
          ))}
        </div>



        {/* Animation keyframes */}
        <style>
          {`
            @keyframes gradient-x {
              0% { background-position: 0% 50%; }
              50% { background-position: 100% 50%; }
              100% { background-position: 0% 50%; }
            }

            @keyframes float {
              0% { transform: translateY(0) translateX(0); opacity: 0; }
              10% { opacity: 1; }
              90% { opacity: 1; }
              100% { transform: translateY(-100px) translateX(20px); opacity: 0; }
            }

            @keyframes ping-slow {
              0% { transform: scale(1); opacity: 1; }
              75%, 100% { transform: scale(2); opacity: 0; }
            }

            @keyframes fadeIn {
              0% { opacity: 0; transform: translateY(10px) scale(0.95); }
              100% { opacity: 1; transform: translateY(0) scale(1); }
            }

            @keyframes pulse-slow {
              0% { transform: scale(1); opacity: 0.8; }
              50% { transform: scale(1.05); opacity: 1; }
              100% { transform: scale(1); opacity: 0.8; }
            }

            .animate-gradient-x {
              background-size: 200% 100%;
              animation: gradient-x 15s ease infinite;
            }

            .animate-float {
              animation: float 15s ease-in-out infinite;
            }

            .animate-pulse-slow {
              animation: pulse-slow 8s ease-in-out infinite;
            }

            .bg-grid-pattern {
              background-image:
                linear-gradient(to right, rgba(255, 255, 255, 0.05) 1px, transparent 1px),
                linear-gradient(to bottom, rgba(255, 255, 255, 0.05) 1px, transparent 1px);
              background-size: 50px 50px;
            }
          `}
        </style>
      </section>

      {/* How It Works Section */}
      <section className="py-16 relative overflow-hidden">
        {/* Background with subtle slate gradient to match site-wide theme */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-slate-900/20 pointer-events-none"></div>

        <div className="container mx-auto px-4 max-w-6xl">
          <div className="text-center mb-8">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-3">How It Works</h2>
            <p className="text-xl text-slate-300 max-w-3xl mx-auto">
              Kaido combines prediction markets with AI to create a powerful platform for forecasting and trading.
            </p>
            <div className="w-full border-b border-gray-300/20 my-6"></div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Step cards with fixed height and structure */}
            <GlowEffect glowColor="#F3BA2F">
              <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border-2 border-gray-300/30 h-full flex flex-col">
                <div className="w-16 h-16 rounded-full bg-yellow-500/20 flex items-center justify-center mb-4 mx-auto transition-all duration-300">
                  <Brain className="h-8 w-8 text-yellow-400" />
                </div>
                <h3 className="text-xl font-bold text-white text-center mb-3">Create Predictions</h3>
                <p className="text-slate-300 text-center flex-grow">
                  Use the AI assistant KAIDO to create prediction markets on any future token price movement.
                </p>
                <div className="mt-4 text-center">
                  <span className="inline-block bg-slate-700/50 text-slate-300 rounded-full px-3 py-1 text-sm">Step 1</span>
                </div>
              </div>
            </GlowEffect>

            <GlowEffect glowColor="#FCD34D">
              <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border-2 border-gray-300/30 h-full flex flex-col">
                <div className="w-16 h-16 rounded-full bg-yellow-600/20 flex items-center justify-center mb-4 mx-auto transition-all duration-300">
                  <Coins className="h-8 w-8 text-yellow-500" />
                </div>
                <h3 className="text-xl font-bold text-white text-center mb-3">Stake Tokens</h3>
                <p className="text-slate-300 text-center flex-grow">
                  Stake BNB or KAIDO to participate in prediction markets and earn rewards.
                </p>
                <div className="mt-4 text-center">
                  <span className="inline-block bg-slate-700/50 text-slate-300 rounded-full px-3 py-1 text-sm">Step 2</span>
                </div>
              </div>
            </GlowEffect>

            <GlowEffect glowColor="#F59E0B">
              <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border-2 border-gray-300/30 h-full flex flex-col">
                <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mb-4 mx-auto transition-all duration-300">
                  <TrendingUp className="h-8 w-8 text-green-400" />
                </div>
                <h3 className="text-xl font-bold text-white text-center mb-3">Trade Positions</h3>
                <p className="text-slate-300 text-center flex-grow">
                  Buy and sell positions as market conditions change to maximize your profits.
                </p>
                <div className="mt-4 text-center">
                  <span className="inline-block bg-slate-700/50 text-slate-300 rounded-full px-3 py-1 text-sm">Step 3</span>
                </div>
              </div>
            </GlowEffect>

            <GlowEffect glowColor="#f59e0b">
              <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border-2 border-gray-300/30 h-full flex flex-col">
                <div className="w-16 h-16 rounded-full bg-yellow-500/20 flex items-center justify-center mb-4 mx-auto transition-all duration-300">
                  <Award className="h-8 w-8 text-yellow-400" />
                </div>
                <h3 className="text-xl font-bold text-white text-center mb-3">Earn Rewards</h3>
                <p className="text-slate-300 text-center flex-grow">
                  Collect rewards when your predictions are correct and build your reputation.
                </p>
                <div className="mt-4 text-center">
                  <span className="inline-block bg-slate-700/50 text-slate-300 rounded-full px-3 py-1 text-sm">Step 4</span>
                </div>
              </div>
            </GlowEffect>
          </div>
        </div>
      </section>

      {/* Tokenomics Section */}
      <section className="py-12 mb-16 relative">
        {/* Background effects for the entire section */}
        <div className="absolute -top-20 -left-20 w-64 h-64 bg-yellow-500/5 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '15s' }}></div>
        <div className="absolute top-40 -right-20 w-80 h-80 bg-yellow-600/5 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '20s' }}></div>
        <div className="absolute bottom-20 left-1/4 w-72 h-72 bg-yellow-400/5 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '18s' }}></div>

        <div className="text-center mb-12 relative z-10">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-600">
              KAIDO Tokenomics
            </span>
          </h2>
          <p className="text-xl text-slate-300 max-w-3xl mx-auto">
            Total Supply: {formatNumber(PRESALE_CONFIG.totalSupply)} KAIDO
          </p>
          <div className="w-full border-b border-gray-300/20 my-6"></div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center relative z-10">
          <div className="flex justify-center">
            <div className="relative">
              {/* Glow effects for pie chart */}
              <div className="absolute inset-0 -m-8 bg-yellow-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '4s' }}></div>
              <div className="absolute inset-0 -m-8 bg-yellow-600/10 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '6s' }}></div>

              {/* Animated SVG Pie Chart - Increased size */}
              <AnimatedPieChart
                data={TOKENOMICS}
                size={500}
                strokeWidth={90}
                animationDuration={1500}
                onSegmentHover={setActiveTokenomicsItem}
                onSegmentClick={handleTokenomicsItemClick}
              />

              {/* Active segment info with vesting details - more compact design */}
              {selectedTokenomicsItem && (
                <div className="absolute -top-16 left-0 right-0 text-center z-20">
                  <div
                    className="inline-block px-4 py-2 rounded-lg text-white font-medium transition-all duration-300 backdrop-blur-md shadow-lg max-w-[280px]"
                    style={{
                      backgroundColor: `${selectedTokenomicsItem.color}90`,
                      boxShadow: `0 8px 16px -4px ${selectedTokenomicsItem.color}40`,
                      border: `1px solid ${selectedTokenomicsItem.color}`,
                      transform: 'translateY(0) scale(1)',
                      animation: 'fadeIn 0.3s ease-out'
                    }}
                  >
                    <div className="flex items-center justify-center gap-2 mb-1">
                      <span className="inline-block w-3 h-3 rounded-full"
                        style={{ backgroundColor: selectedTokenomicsItem.color }}></span>
                      <div className="text-lg font-bold">
                        {selectedTokenomicsItem.category}: {selectedTokenomicsItem.percentage}%
                      </div>
                    </div>
                    {selectedTokenomicsItem.vesting && (
                      <div className="text-xs mt-1 bg-black/30 p-1.5 rounded-md border border-white/10">
                        <div className="font-medium text-white/90 mb-0.5">Vesting:</div>
                        <div className="text-white/90">
                          {selectedTokenomicsItem.vesting}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div>
            {/* Tokenomics Details Component */}
            <TokenomicsDetails
              data={TOKENOMICS}
              activeItem={activeTokenomicsItem || selectedTokenomicsItem}
              onItemClick={handleTokenomicsItemClick}
            />
          </div>
        </div>


      </section>

      {/* FAQ Section */}
      <section className="py-12 mb-16 relative">
        {/* Background effects for the FAQ section */}
        <div className="absolute -top-40 right-0 w-96 h-96 bg-yellow-500/5 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '17s' }}></div>
        <div className="absolute bottom-20 -left-20 w-80 h-80 bg-yellow-600/5 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '22s' }}></div>

        <div className="text-center mb-12 relative z-10">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-600">
              Frequently Asked Questions
            </span>
          </h2>
          <p className="text-xl text-slate-300 max-w-3xl mx-auto">
            Everything you need to know about the KAIDO token presale
          </p>
          <div className="w-full border-b border-gray-300/20 my-6"></div>
        </div>

        <div className="w-full relative z-10">
          <div className="grid grid-cols-1 gap-4">
            {FAQ_ITEMS.map((item, index) => (
              <div key={index} className="mb-4">
                <button
                  className="w-full p-4 bg-slate-800/50 backdrop-blur-sm rounded-lg border border-slate-700/50 flex justify-between items-center text-left hover:border-yellow-500/30 transition-all duration-300"
                  onClick={() => setActiveFaqIndex(activeFaqIndex === index ? null : index)}
                >
                  <span className="text-white font-medium">{item.question}</span>
                  {activeFaqIndex === index ? (
                    <ChevronUp className="h-5 w-5 text-yellow-400" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-slate-400" />
                  )}
                </button>

                {activeFaqIndex === index && (
                  <div className="p-5 bg-slate-800/30 backdrop-blur-sm rounded-b-lg border-t-0 border border-slate-700/50 shadow-lg">
                    <p className="text-slate-300">{item.answer}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>


      </section>



      {/* CTA Section */}
      <section className="py-12">
        <GlowEffect glowColor="#F3BA2F">
          <div className="bg-gradient-to-br from-yellow-900/50 to-yellow-800/50 backdrop-blur-sm rounded-xl p-8 border-2 border-gray-300/30 text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
              Join the KAIDO Token Presale Today
            </h2>
            <p className="text-xl text-slate-300 max-w-3xl mx-auto mb-8">
              Don't miss your chance to be part of the future of AI-powered prediction markets on BNB Smart Chain.
            </p>
            <Button
              variant="primary"
              size="lg"
              onClick={handleParticipate}
            >
              Join Presale
            </Button>
          </div>
        </GlowEffect>
      </section>



    </div>
  );
};

export default PresalePage;
