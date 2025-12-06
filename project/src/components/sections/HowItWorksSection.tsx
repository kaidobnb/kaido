import React from 'react';
import { Brain, Award, Coins } from 'lucide-react';
import GlowEffect from '../effects/GlowEffect';

const HowItWorksSection: React.FC = () => {
  return (
    <section className="py-8 md:py-16 relative overflow-hidden">
      {/* Background with wavy line */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent to-purple-900/20 pointer-events-none"></div>

      <div className="container mx-auto px-4 max-w-6xl">
        <div className="text-center mb-6 md:mb-8">
          <h2 className="handwritten text-2xl md:text-4xl text-white mb-2 md:mb-3">How It Works</h2>
          <p className="regular-font text-base md:text-xl text-white max-w-3xl mx-auto px-2">
            Kaido combines prediction markets with AI to create a powerful platform for forecasting and trading.
          </p>
          <div className="w-full border-b border-gray-300/20 my-4 md:my-6"></div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-6 max-w-5xl mx-auto">
          {/* Step cards with compact, square design */}
          {[
            {
              icon: <Brain className="h-8 w-8 text-purple-400" />,
              title: "Create Predictions",
              description: "Chat with KAIDO AI assistant to create prediction markets on any future sport events or crypto price movement.",
              step: 1,
              bgColor: "bg-purple-500/20",
              borderColor: "border-purple-500/30",
              glowColor: "#8b5cf6"
            },
            {
              icon: <Coins className="h-8 w-8 text-blue-400" />,
              title: "Stake Tokens",
              description: "Stake BNB to create or participate in prediction markets to be able to earn rewards.",
              step: 2,
              bgColor: "bg-blue-500/20",
              borderColor: "border-blue-500/30",
              glowColor: "#3b82f6"
            },
            {
              icon: <Award className="h-8 w-8 text-yellow-400" />,
              title: "Earn Win + Loss-Edge Rewards",
              description: "Collect rewards when your predictions are correct and build your reputation. Plus if you lose your predictions, you can claim compensation from the AI Agent loss-edge fund pool.",
              step: 3,
              bgColor: "bg-yellow-500/20",
              borderColor: "border-yellow-500/30",
              glowColor: "#f59e0b"
            }
          ].map((item, index) => (
            <GlowEffect
              key={index}
              glowColor={item.glowColor}
            >
              <div
                className={`rounded-xl p-4 md:p-6 h-full flex flex-col overflow-hidden relative min-h-[220px] md:min-h-[280px]`}
              >
                {/* Enhanced Background with multiple layers */}
                <div className="absolute inset-0 z-0">
                  {/* Base gradient - rich dark with burgundy undertones */}
                  <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-red-950/30 to-slate-900"></div>

                  {/* Animated gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-tr from-amber-950/20 via-transparent to-orange-950/20"></div>

                  {/* Subtle diagonal pattern */}
                  <div className="absolute inset-0 opacity-10" style={{
                    backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(251, 191, 36, 0.1) 10px, rgba(251, 191, 36, 0.1) 20px)'
                  }}></div>

                  {/* Decorative corner accent - top left */}
                  <div className="absolute -top-20 -left-20 w-40 h-40 bg-yellow-500/10 rounded-full filter blur-3xl"></div>

                  {/* Decorative corner accent - bottom right */}
                  <div className="absolute -bottom-20 -right-20 w-48 h-48 bg-orange-500/10 rounded-full filter blur-3xl"></div>

                  {/* Subtle grid pattern overlay */}
                  <div className="absolute inset-0 opacity-5" style={{
                    backgroundImage: 'linear-gradient(0deg, transparent 24%, rgba(251, 191, 36, 0.05) 25%, rgba(251, 191, 36, 0.05) 26%, transparent 27%, transparent 74%, rgba(251, 191, 36, 0.05) 75%, rgba(251, 191, 36, 0.05) 76%, transparent 77%, transparent), linear-gradient(90deg, transparent 24%, rgba(251, 191, 36, 0.05) 25%, rgba(251, 191, 36, 0.05) 26%, transparent 27%, transparent 74%, rgba(251, 191, 36, 0.05) 75%, rgba(251, 191, 36, 0.05) 76%, transparent 77%, transparent)',
                    backgroundSize: '50px 50px'
                  }}></div>
                </div>

                {/* Border */}
                <div className="absolute inset-0 border-2 border-gray-300/30 rounded-xl z-5"></div>

                <div className="relative z-10 flex flex-col h-full justify-between">
                  <div className={`w-12 h-12 md:w-16 md:h-16 rounded-full ${item.bgColor} flex items-center justify-center mb-2 md:mb-4 mx-auto transition-all duration-300 hover:scale-110`}>
                    <div className="scale-75 md:scale-100">
                      {item.icon}
                    </div>
                  </div>
                  <h3 className="handwritten text-lg md:text-xl text-white text-center mb-2 md:mb-3">{item.title}</h3>
                  <p className="regular-font text-slate-300 text-center text-xs md:text-sm leading-relaxed flex-grow">
                    {item.description}
                  </p>
                  <div className="mt-2 md:mt-4 text-center">
                    <span className="inline-block bg-slate-700/50 text-slate-300 rounded-full px-2 md:px-3 py-0.5 md:py-1 text-xs regular-font font-semibold">Step {item.step}</span>
                  </div>
                </div>
              </div>
            </GlowEffect>
          ))}
        </div>

        {/* 5% Agent Fee Distribution Section */}
        <div className="mt-8 md:mt-16 pt-6 md:pt-12 border-t border-gray-300/20">
          <div className="text-center mb-4 md:mb-8">
            <h3 className="handwritten text-xl md:text-3xl text-white mb-2 md:mb-3">💰 KAIDO 5% Agent Fee Distribution</h3>
            <p className="regular-font text-sm md:text-lg text-white/80 max-w-3xl mx-auto px-2">
              Every prediction pool on KAIDO charges a 5% agent fee in BNB. Winners receive 95% of the total pool, while the 5% fee is automatically distributed by the KAIDO AI Agent at the end of each prediction as follows:
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 max-w-4xl mx-auto">

            {/* Loss Edge Pool */}
            <GlowEffect glowColor="#f59e0b">
              <div className="rounded-xl p-3 md:p-6 h-full flex flex-col overflow-hidden relative">
                <div className="absolute inset-0 z-0">
                  <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-red-950/30 to-slate-900"></div>
                  <div className="absolute inset-0 bg-gradient-to-tr from-amber-950/20 via-transparent to-orange-950/20"></div>
                  <div className="absolute inset-0 opacity-10" style={{backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(251, 191, 36, 0.1) 10px, rgba(251, 191, 36, 0.1) 20px)'}}></div>
                  <div className="absolute -top-20 -left-20 w-40 h-40 bg-yellow-500/10 rounded-full filter blur-3xl"></div>
                  <div className="absolute -bottom-20 -right-20 w-48 h-48 bg-orange-500/10 rounded-full filter blur-3xl"></div>
                  <div className="absolute inset-0 opacity-5" style={{backgroundImage: 'linear-gradient(0deg, transparent 24%, rgba(251, 191, 36, 0.05) 25%, rgba(251, 191, 36, 0.05) 26%, transparent 27%, transparent 74%, rgba(251, 191, 36, 0.05) 75%, rgba(251, 191, 36, 0.05) 76%, transparent 77%, transparent), linear-gradient(90deg, transparent 24%, rgba(251, 191, 36, 0.05) 25%, rgba(251, 191, 36, 0.05) 26%, transparent 27%, transparent 74%, rgba(251, 191, 36, 0.05) 75%, rgba(251, 191, 36, 0.05) 76%, transparent 77%, transparent)', backgroundSize: '50px 50px'}}></div>
                </div>
                <div className="absolute inset-0 border-2 border-gray-300/30 rounded-xl z-5"></div>
                <div className="relative z-10 flex flex-col h-full text-center">
                  <div className="text-2xl md:text-4xl font-bold text-amber-400 mb-1 md:mb-2">2%</div>
                  <h4 className="handwritten text-sm md:text-lg text-white mb-1 md:mb-2">Loss Edge Pool</h4>
                  <p className="regular-font text-xs md:text-sm text-slate-300 flex-grow">Claimable compensation for users who lost predictions</p>
                </div>
              </div>
            </GlowEffect>

            {/* Prediction Creator */}
            <GlowEffect glowColor="#8b5cf6">
              <div className="rounded-xl p-3 md:p-6 h-full flex flex-col overflow-hidden relative">
                <div className="absolute inset-0 z-0">
                  <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-red-950/30 to-slate-900"></div>
                  <div className="absolute inset-0 bg-gradient-to-tr from-amber-950/20 via-transparent to-orange-950/20"></div>
                  <div className="absolute inset-0 opacity-10" style={{backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(251, 191, 36, 0.1) 10px, rgba(251, 191, 36, 0.1) 20px)'}}></div>
                  <div className="absolute -top-20 -left-20 w-40 h-40 bg-yellow-500/10 rounded-full filter blur-3xl"></div>
                  <div className="absolute -bottom-20 -right-20 w-48 h-48 bg-orange-500/10 rounded-full filter blur-3xl"></div>
                  <div className="absolute inset-0 opacity-5" style={{backgroundImage: 'linear-gradient(0deg, transparent 24%, rgba(251, 191, 36, 0.05) 25%, rgba(251, 191, 36, 0.05) 26%, transparent 27%, transparent 74%, rgba(251, 191, 36, 0.05) 75%, rgba(251, 191, 36, 0.05) 76%, transparent 77%, transparent), linear-gradient(90deg, transparent 24%, rgba(251, 191, 36, 0.05) 25%, rgba(251, 191, 36, 0.05) 26%, transparent 27%, transparent 74%, rgba(251, 191, 36, 0.05) 75%, rgba(251, 191, 36, 0.05) 76%, transparent 77%, transparent)', backgroundSize: '50px 50px'}}></div>
                </div>
                <div className="absolute inset-0 border-2 border-gray-300/30 rounded-xl z-5"></div>
                <div className="relative z-10 flex flex-col h-full text-center">
                  <div className="text-2xl md:text-4xl font-bold text-purple-400 mb-1 md:mb-2">1%</div>
                  <h4 className="handwritten text-sm md:text-lg text-white mb-1 md:mb-2">Prediction Creator</h4>
                  <p className="regular-font text-xs md:text-sm text-slate-300 flex-grow">Earned by the user who creates the prediction</p>
                </div>
              </div>
            </GlowEffect>

            {/* Affiliate Reward */}
            <GlowEffect glowColor="#ec4899">
              <div className="rounded-xl p-3 md:p-6 h-full flex flex-col overflow-hidden relative">
                <div className="absolute inset-0 z-0">
                  <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-red-950/30 to-slate-900"></div>
                  <div className="absolute inset-0 bg-gradient-to-tr from-amber-950/20 via-transparent to-orange-950/20"></div>
                  <div className="absolute inset-0 opacity-10" style={{backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(251, 191, 36, 0.1) 10px, rgba(251, 191, 36, 0.1) 20px)'}}></div>
                  <div className="absolute -top-20 -left-20 w-40 h-40 bg-yellow-500/10 rounded-full filter blur-3xl"></div>
                  <div className="absolute -bottom-20 -right-20 w-48 h-48 bg-orange-500/10 rounded-full filter blur-3xl"></div>
                  <div className="absolute inset-0 opacity-5" style={{backgroundImage: 'linear-gradient(0deg, transparent 24%, rgba(251, 191, 36, 0.05) 25%, rgba(251, 191, 36, 0.05) 26%, transparent 27%, transparent 74%, rgba(251, 191, 36, 0.05) 75%, rgba(251, 191, 36, 0.05) 76%, transparent 77%, transparent), linear-gradient(90deg, transparent 24%, rgba(251, 191, 36, 0.05) 25%, rgba(251, 191, 36, 0.05) 26%, transparent 27%, transparent 74%, rgba(251, 191, 36, 0.05) 75%, rgba(251, 191, 36, 0.05) 76%, transparent 77%, transparent)', backgroundSize: '50px 50px'}}></div>
                </div>
                <div className="absolute inset-0 border-2 border-gray-300/30 rounded-xl z-5"></div>
                <div className="relative z-10 flex flex-col h-full text-center">
                  <div className="text-2xl md:text-4xl font-bold text-pink-400 mb-1 md:mb-2">1%</div>
                  <h4 className="handwritten text-sm md:text-lg text-white mb-1 md:mb-2">Affiliate Reward</h4>
                  <p className="regular-font text-xs md:text-sm text-slate-300 flex-grow">Goes to referrers who invited active users</p>
                </div>
              </div>
            </GlowEffect>

            {/* KAIDO Treasury */}
            <GlowEffect glowColor="#3b82f6">
              <div className="rounded-xl p-3 md:p-6 h-full flex flex-col overflow-hidden relative">
                <div className="absolute inset-0 z-0">
                  <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-red-950/30 to-slate-900"></div>
                  <div className="absolute inset-0 bg-gradient-to-tr from-amber-950/20 via-transparent to-orange-950/20"></div>
                  <div className="absolute inset-0 opacity-10" style={{backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(251, 191, 36, 0.1) 10px, rgba(251, 191, 36, 0.1) 20px)'}}></div>
                  <div className="absolute -top-20 -left-20 w-40 h-40 bg-yellow-500/10 rounded-full filter blur-3xl"></div>
                  <div className="absolute -bottom-20 -right-20 w-48 h-48 bg-orange-500/10 rounded-full filter blur-3xl"></div>
                  <div className="absolute inset-0 opacity-5" style={{backgroundImage: 'linear-gradient(0deg, transparent 24%, rgba(251, 191, 36, 0.05) 25%, rgba(251, 191, 36, 0.05) 26%, transparent 27%, transparent 74%, rgba(251, 191, 36, 0.05) 75%, rgba(251, 191, 36, 0.05) 76%, transparent 77%, transparent), linear-gradient(90deg, transparent 24%, rgba(251, 191, 36, 0.05) 25%, rgba(251, 191, 36, 0.05) 26%, transparent 27%, transparent 74%, rgba(251, 191, 36, 0.05) 75%, rgba(251, 191, 36, 0.05) 76%, transparent 77%, transparent)', backgroundSize: '50px 50px'}}></div>
                </div>
                <div className="absolute inset-0 border-2 border-gray-300/30 rounded-xl z-5"></div>
                <div className="relative z-10 flex flex-col h-full text-center">
                  <div className="text-2xl md:text-4xl font-bold text-blue-400 mb-1 md:mb-2">1%</div>
                  <h4 className="handwritten text-sm md:text-lg text-white mb-1 md:mb-2">KAIDO Treasury</h4>
                  <p className="regular-font text-xs md:text-sm text-slate-300 flex-grow">Platform share for AI operations and growth</p>
                </div>
              </div>
            </GlowEffect>
          </div>

          <div className="text-center mt-4 md:mt-8">
            <p className="regular-font text-xs md:text-sm text-white/70">
              ✅ Everything is handled transparently and automatically on-chain.
            </p>
          </div>
        </div>

        {/* How KAIDO LP Works Section */}
        <div className="mt-12 md:mt-20 pt-8 md:pt-12 border-t border-gray-300/20">
          <div className="text-center mb-6 md:mb-10">
            <h3 className="handwritten text-2xl md:text-4xl text-white mb-3 md:mb-4">💎 How KAIDO LP Works</h3>
            <p className="regular-font text-sm md:text-lg text-white/80 max-w-3xl mx-auto px-2">
              The first truly consumer-friendly LP model in prediction markets. Stake once, earn from everything.
            </p>
          </div>

          {/* Flow Diagram */}
          <div className="max-w-5xl mx-auto mb-8 md:mb-12">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-3 md:gap-4 items-center">
              {/* Step 1: Stake BNB */}
              <GlowEffect glowColor="#f59e0b">
                <div className="rounded-xl p-4 md:p-6 text-center relative overflow-hidden min-h-[140px] md:min-h-[160px] flex flex-col justify-center">
                  <div className="absolute inset-0 z-0">
                    <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-red-950/30 to-slate-900"></div>
                    <div className="absolute inset-0 bg-gradient-to-tr from-amber-950/20 via-transparent to-orange-950/20"></div>
                  </div>
                  <div className="absolute inset-0 border-2 border-gray-300/30 rounded-xl z-5"></div>
                  <div className="relative z-10">
                    <div className="text-3xl md:text-4xl mb-2">💰</div>
                    <h4 className="handwritten text-base md:text-lg text-white mb-1">Stake BNB</h4>
                    <p className="regular-font text-xs text-slate-300">Into unified vault</p>
                  </div>
                </div>
              </GlowEffect>

              {/* Arrow */}
              <div className="hidden md:flex justify-center">
                <div className="text-yellow-400 text-2xl">→</div>
              </div>

              {/* Step 2: KAIDO Allocates */}
              <GlowEffect glowColor="#8b5cf6">
                <div className="rounded-xl p-4 md:p-6 text-center relative overflow-hidden min-h-[140px] md:min-h-[160px] flex flex-col justify-center">
                  <div className="absolute inset-0 z-0">
                    <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-red-950/30 to-slate-900"></div>
                    <div className="absolute inset-0 bg-gradient-to-tr from-amber-950/20 via-transparent to-orange-950/20"></div>
                  </div>
                  <div className="absolute inset-0 border-2 border-gray-300/30 rounded-xl z-5"></div>
                  <div className="relative z-10">
                    <div className="text-3xl md:text-4xl mb-2">🤖</div>
                    <h4 className="handwritten text-base md:text-lg text-white mb-1">KAIDO Allocates</h4>
                    <p className="regular-font text-xs text-slate-300">Internally to engines</p>
                  </div>
                </div>
              </GlowEffect>

              {/* Arrow */}
              <div className="hidden md:flex justify-center">
                <div className="text-yellow-400 text-2xl">→</div>
              </div>

              {/* Step 3: Fees Generated */}
              <GlowEffect glowColor="#3b82f6">
                <div className="rounded-xl p-4 md:p-6 text-center relative overflow-hidden min-h-[140px] md:min-h-[160px] flex flex-col justify-center">
                  <div className="absolute inset-0 z-0">
                    <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-red-950/30 to-slate-900"></div>
                    <div className="absolute inset-0 bg-gradient-to-tr from-amber-950/20 via-transparent to-orange-950/20"></div>
                  </div>
                  <div className="absolute inset-0 border-2 border-gray-300/30 rounded-xl z-5"></div>
                  <div className="relative z-10">
                    <div className="text-3xl md:text-4xl mb-2">⚡</div>
                    <h4 className="handwritten text-base md:text-lg text-white mb-1">Fees Generated</h4>
                    <p className="regular-font text-xs text-slate-300">From platform activity</p>
                  </div>
                </div>
              </GlowEffect>
            </div>

            {/* Arrow pointing down on mobile */}
            <div className="md:hidden flex justify-center my-3">
              <div className="text-yellow-400 text-2xl">↓</div>
            </div>

            {/* Step 4: LP Yield (Full width on mobile, centered on desktop) */}
            <div className="mt-4 md:mt-6 max-w-md mx-auto">
              <GlowEffect glowColor="#10b981">
                <div className="rounded-xl p-4 md:p-6 text-center relative overflow-hidden min-h-[140px] md:min-h-[160px] flex flex-col justify-center">
                  <div className="absolute inset-0 z-0">
                    <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-red-950/30 to-slate-900"></div>
                    <div className="absolute inset-0 bg-gradient-to-tr from-amber-950/20 via-transparent to-orange-950/20"></div>
                  </div>
                  <div className="absolute inset-0 border-2 border-gray-300/30 rounded-xl z-5"></div>
                  <div className="relative z-10">
                    <div className="text-3xl md:text-4xl mb-2">💎</div>
                    <h4 className="handwritten text-base md:text-lg text-white mb-1">LP Yield Returned</h4>
                    <p className="regular-font text-xs text-slate-300">Proportional to your stake</p>
                  </div>
                </div>
              </GlowEffect>
            </div>
          </div>

          {/* Three Yield Engines */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 max-w-5xl mx-auto mb-8">
            {/* Boost Vault */}
            <GlowEffect glowColor="#f59e0b">
              <div className="rounded-xl p-4 md:p-6 h-full flex flex-col overflow-hidden relative min-h-[200px]">
                <div className="absolute inset-0 z-0">
                  <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-red-950/30 to-slate-900"></div>
                  <div className="absolute inset-0 bg-gradient-to-tr from-amber-950/20 via-transparent to-orange-950/20"></div>
                </div>
                <div className="absolute inset-0 border-2 border-gray-300/30 rounded-xl z-5"></div>
                <div className="relative z-10 flex flex-col h-full">
                  <div className="text-3xl mb-3">🚀</div>
                  <h4 className="handwritten text-lg md:text-xl text-white mb-2">Boost Vault</h4>
                  <p className="regular-font text-xs md:text-sm text-slate-300 mb-3">Primary Yield Engine</p>
                  <p className="regular-font text-xs md:text-sm text-slate-300 flex-grow">
                    When markets are boosted, KAIDO earns 1% from the 5% agent fee. LPs receive <span className="text-yellow-400 font-semibold">30% of this 1%</span> as their main APY source.
                  </p>
                </div>
              </div>
            </GlowEffect>

            {/* Engagement Support */}
            <GlowEffect glowColor="#8b5cf6">
              <div className="rounded-xl p-4 md:p-6 h-full flex flex-col overflow-hidden relative min-h-[200px]">
                <div className="absolute inset-0 z-0">
                  <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-red-950/30 to-slate-900"></div>
                  <div className="absolute inset-0 bg-gradient-to-tr from-amber-950/20 via-transparent to-orange-950/20"></div>
                </div>
                <div className="absolute inset-0 border-2 border-gray-300/30 rounded-xl z-5"></div>
                <div className="relative z-10 flex flex-col h-full">
                  <div className="text-3xl mb-3">⚡</div>
                  <h4 className="handwritten text-lg md:text-xl text-white mb-2">Engagement Support</h4>
                  <p className="regular-font text-xs md:text-sm text-slate-300 mb-3">Activity Booster</p>
                  <p className="regular-font text-xs md:text-sm text-slate-300 flex-grow">
                    LP liquidity powers engagement boosts (streak bonuses, leaderboards). LPs earn from the <span className="text-purple-400 font-semibold">increased platform fees</span> during boosted periods.
                  </p>
                </div>
              </div>
            </GlowEffect>

            {/* Creator Backing Pool */}
            <GlowEffect glowColor="#3b82f6">
              <div className="rounded-xl p-4 md:p-6 h-full flex flex-col overflow-hidden relative min-h-[200px]">
                <div className="absolute inset-0 z-0">
                  <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-red-950/30 to-slate-900"></div>
                  <div className="absolute inset-0 bg-gradient-to-tr from-amber-950/20 via-transparent to-orange-950/20"></div>
                </div>
                <div className="absolute inset-0 border-2 border-gray-300/30 rounded-xl z-5"></div>
                <div className="relative z-10 flex flex-col h-full">
                  <div className="text-3xl mb-3">👥</div>
                  <h4 className="handwritten text-lg md:text-xl text-white mb-2">Creator Backing Pool</h4>
                  <p className="regular-font text-xs md:text-sm text-slate-300 mb-3">Dual-Earning Stream</p>
                  <p className="regular-font text-xs md:text-sm text-slate-300 flex-grow">
                    KAIDO backs top creators. LPs earn <span className="text-blue-400 font-semibold">30% of Affiliate Fee (1%) + 30% of KAIDO Fee (1%)</span> = 0.60% of all creator-driven volume.
                  </p>
                </div>
              </div>
            </GlowEffect>
          </div>

          {/* Benefits Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4 max-w-4xl mx-auto">
            {[
              { icon: '✨', title: 'Stake Once, Earn From Everything', desc: 'No need to pick between pools - unified vault handles it all' },
              { icon: '🛡️', title: 'No AMM Risk, No Impermanent Loss', desc: 'Your BNB stays BNB - no exposure to volatile token pairs' },
              { icon: '💰', title: 'Real Yield From Real Activity', desc: 'Earn from actual platform fees, not token inflation' },
              { icon: '👤', title: 'Perfect For Everyday Users', desc: 'Consumer-friendly design - not just for DeFi experts' }
            ].map((benefit, index) => (
              <GlowEffect key={index} glowColor="#10b981">
                <div className="rounded-xl p-4 md:p-5 relative overflow-hidden">
                  <div className="absolute inset-0 z-0">
                    <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-red-950/30 to-slate-900"></div>
                    <div className="absolute inset-0 bg-gradient-to-tr from-amber-950/20 via-transparent to-orange-950/20"></div>
                  </div>
                  <div className="absolute inset-0 border-2 border-gray-300/30 rounded-xl z-5"></div>
                  <div className="relative z-10 flex items-start gap-3">
                    <div className="text-2xl flex-shrink-0">{benefit.icon}</div>
                    <div>
                      <h5 className="handwritten text-base md:text-lg text-white mb-1">{benefit.title}</h5>
                      <p className="regular-font text-xs md:text-sm text-slate-300">{benefit.desc}</p>
                    </div>
                  </div>
                </div>
              </GlowEffect>
            ))}
          </div>

          <div className="text-center mt-6 md:mt-8">
            <p className="regular-font text-xs md:text-sm text-white/70">
              🎯 The first truly consumer-friendly LP model in prediction markets
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;
