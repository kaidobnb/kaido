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
              description: "Collect rewards when your predictions are correct and build your reputation. Plus if you lose your predictions, you get an airdrop in BNB from the AI Agent loss-edge fund pool.",
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
                  <p className="regular-font text-xs md:text-sm text-slate-300 flex-grow">Rewards users who lost predictions via daily BNB airdrops</p>
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
      </div>
    </section>
  );
};

export default HowItWorksSection;
