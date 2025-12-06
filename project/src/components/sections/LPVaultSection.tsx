import React from 'react';
import GlowEffect from '../effects/GlowEffect';

const LPVaultSection: React.FC = () => {
  return (
    <section className="py-16 md:py-24 relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-purple-950/10 to-transparent pointer-events-none"></div>
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-yellow-900/5 via-transparent to-transparent pointer-events-none"></div>

      <div className="container mx-auto px-4 relative z-10">
        {/* Section Header - Enhanced */}
        <div className="text-center mb-12 md:mb-20">
          <div className="inline-block mb-4">
            <div className="flex items-center gap-3 px-6 py-2 rounded-full bg-gradient-to-r from-yellow-500/10 to-purple-500/10 border border-yellow-500/20">
              <span className="text-2xl">💎</span>
              <span className="handwritten text-lg md:text-xl text-yellow-400">Introducing</span>
            </div>
          </div>
          <h2 className="handwritten text-4xl md:text-7xl text-white mb-6 md:mb-8 bg-gradient-to-r from-yellow-400 via-yellow-200 to-yellow-400 bg-clip-text text-transparent">
            KAIDO LP Vault
          </h2>
          <p className="regular-font text-lg md:text-2xl text-white/90 max-w-4xl mx-auto leading-relaxed mb-4">
            The first truly <span className="text-yellow-400 font-bold">consumer-friendly LP model</span> in prediction markets.
          </p>
          <p className="regular-font text-xl md:text-3xl font-bold text-yellow-400 mb-8">
            Stake once, earn from everything.
          </p>
          <div className="flex flex-wrap justify-center gap-4 text-sm md:text-base text-white/70">
            <div className="flex items-center gap-2">
              <span className="text-green-400">✓</span>
              <span>No Impermanent Loss</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-green-400">✓</span>
              <span>Real Yield</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-green-400">✓</span>
              <span>Consumer-First Design</span>
            </div>
          </div>
        </div>

        {/* How It Works - Redesigned Flow */}
        <div className="max-w-7xl mx-auto mb-16 md:mb-24">
          <h3 className="handwritten text-2xl md:text-4xl text-center text-white mb-12">
            How It Works
          </h3>
          <div className="relative">
            {/* Connection Line - Desktop */}
            <div className="hidden md:block absolute top-1/2 left-0 right-0 h-1 bg-gradient-to-r from-yellow-500/20 via-purple-500/20 to-green-500/20 -translate-y-1/2 z-0"></div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12 relative z-10">
              {/* Step 1 */}
              <div className="relative">
                <GlowEffect glowColor="#f59e0b">
                  <div className="rounded-3xl p-8 md:p-10 text-center relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border-2 border-yellow-500/30 hover:border-yellow-500/60 transition-all duration-300 transform hover:scale-105">
                    <div className="absolute top-4 right-4 w-12 h-12 rounded-full bg-yellow-500/10 flex items-center justify-center border border-yellow-500/30">
                      <span className="handwritten text-yellow-400 font-bold">1</span>
                    </div>
                    <div className="text-7xl mb-6 animate-bounce">💰</div>
                    <h4 className="handwritten text-2xl md:text-3xl text-yellow-400 mb-4">Stake BNB</h4>
                    <p className="regular-font text-base text-slate-300 leading-relaxed">
                      Deposit your BNB into the unified LP vault. Simple, secure, and instant.
                    </p>
                  </div>
                </GlowEffect>
              </div>

              {/* Step 2 */}
              <div className="relative">
                <GlowEffect glowColor="#8b5cf6">
                  <div className="rounded-3xl p-8 md:p-10 text-center relative overflow-hidden bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900 border-2 border-purple-500/30 hover:border-purple-500/60 transition-all duration-300 transform hover:scale-105">
                    <div className="absolute top-4 right-4 w-12 h-12 rounded-full bg-purple-500/10 flex items-center justify-center border border-purple-500/30">
                      <span className="handwritten text-purple-400 font-bold">2</span>
                    </div>
                    <div className="text-7xl mb-6 animate-pulse">⚡</div>
                    <h4 className="handwritten text-2xl md:text-3xl text-purple-400 mb-4">Three Engines Work</h4>
                    <p className="regular-font text-base text-slate-300 leading-relaxed">
                      Your liquidity powers boosts, engagement, and creator backing simultaneously.
                    </p>
                  </div>
                </GlowEffect>
              </div>

              {/* Step 3 */}
              <div className="relative">
                <GlowEffect glowColor="#10b981">
                  <div className="rounded-3xl p-8 md:p-10 text-center relative overflow-hidden bg-gradient-to-br from-slate-900 via-green-900/20 to-slate-900 border-2 border-green-500/30 hover:border-green-500/60 transition-all duration-300 transform hover:scale-105">
                    <div className="absolute top-4 right-4 w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center border border-green-500/30">
                      <span className="handwritten text-green-400 font-bold">3</span>
                    </div>
                    <div className="text-7xl mb-6 animate-bounce">💎</div>
                    <h4 className="handwritten text-2xl md:text-3xl text-green-400 mb-4">Earn Real Yield</h4>
                    <p className="regular-font text-base text-slate-300 leading-relaxed">
                      Collect BNB rewards from all three revenue streams. No token inflation.
                    </p>
                  </div>
                </GlowEffect>
              </div>
            </div>
          </div>
        </div>

        {/* Three Yield Engines - Premium Design */}
        <div className="max-w-7xl mx-auto mb-16 md:mb-24">
          <h3 className="handwritten text-2xl md:text-4xl text-center text-white mb-4">
            Three Revenue Engines
          </h3>
          <p className="regular-font text-center text-slate-400 mb-12 max-w-2xl mx-auto">
            Your staked BNB works across multiple yield-generating mechanisms simultaneously
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
            {/* Boost Vault */}
            <GlowEffect glowColor="#f59e0b">
              <div className="group rounded-3xl p-8 md:p-10 h-full flex flex-col overflow-hidden relative bg-gradient-to-br from-slate-900 via-orange-950/20 to-slate-900 border-2 border-yellow-500/30 hover:border-yellow-500/60 transition-all duration-300">
                {/* Animated background effect */}
                <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

                <div className="relative z-10 flex flex-col h-full">
                  <div className="flex items-start justify-between mb-6">
                    <div className="text-6xl">🚀</div>
                    <div className="px-3 py-1 rounded-full bg-yellow-500/10 border border-yellow-500/30">
                      <span className="text-xs font-bold text-yellow-400">PRIMARY</span>
                    </div>
                  </div>

                  <h3 className="handwritten text-3xl md:text-4xl text-yellow-400 mb-3">Boost Vault</h3>
                  <p className="regular-font text-sm text-yellow-400/80 mb-4 font-semibold uppercase tracking-wide">Main Yield Source</p>

                  <div className="flex-grow mb-6">
                    <p className="regular-font text-base text-slate-300 leading-relaxed mb-4">
                      When markets are boosted, KAIDO earns 1% from the 5% agent fee.
                    </p>
                    <div className="p-4 rounded-xl bg-yellow-500/5 border border-yellow-500/20">
                      <p className="regular-font text-sm text-white">
                        LPs receive <span className="text-yellow-400 font-bold text-lg">30%</span> of this 1% as their main APY source
                      </p>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-yellow-500/20">
                    <div className="flex items-center gap-2 text-sm text-slate-400">
                      <span className="text-green-400">●</span>
                      <span>Active on boosted markets</span>
                    </div>
                  </div>
                </div>
              </div>
            </GlowEffect>

            {/* Engagement Support */}
            <GlowEffect glowColor="#8b5cf6">
              <div className="group rounded-3xl p-8 md:p-10 h-full flex flex-col overflow-hidden relative bg-gradient-to-br from-slate-900 via-purple-950/20 to-slate-900 border-2 border-purple-500/30 hover:border-purple-500/60 transition-all duration-300">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

                <div className="relative z-10 flex flex-col h-full">
                  <div className="flex items-start justify-between mb-6">
                    <div className="text-6xl">⚡</div>
                    <div className="px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/30">
                      <span className="text-xs font-bold text-purple-400">ACTIVITY</span>
                    </div>
                  </div>

                  <h3 className="handwritten text-3xl md:text-4xl text-purple-400 mb-3">Engagement Support</h3>
                  <p className="regular-font text-sm text-purple-400/80 mb-4 font-semibold uppercase tracking-wide">Platform Growth</p>

                  <div className="flex-grow mb-6">
                    <p className="regular-font text-base text-slate-300 leading-relaxed mb-4">
                      LP liquidity powers engagement boosts like streak bonuses and leaderboards.
                    </p>
                    <div className="p-4 rounded-xl bg-purple-500/5 border border-purple-500/20">
                      <p className="regular-font text-sm text-white">
                        Earn from <span className="text-purple-400 font-bold">increased platform fees</span> during boosted activity periods
                      </p>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-purple-500/20">
                    <div className="flex items-center gap-2 text-sm text-slate-400">
                      <span className="text-green-400">●</span>
                      <span>Scales with platform usage</span>
                    </div>
                  </div>
                </div>
              </div>
            </GlowEffect>

            {/* Creator Backing */}
            <GlowEffect glowColor="#3b82f6">
              <div className="group rounded-3xl p-8 md:p-10 h-full flex flex-col overflow-hidden relative bg-gradient-to-br from-slate-900 via-blue-950/20 to-slate-900 border-2 border-blue-500/30 hover:border-blue-500/60 transition-all duration-300">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

                <div className="relative z-10 flex flex-col h-full">
                  <div className="flex items-start justify-between mb-6">
                    <div className="text-6xl">👥</div>
                    <div className="px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/30">
                      <span className="text-xs font-bold text-blue-400">DUAL STREAM</span>
                    </div>
                  </div>

                  <h3 className="handwritten text-3xl md:text-4xl text-blue-400 mb-3">Creator Backing</h3>
                  <p className="regular-font text-sm text-blue-400/80 mb-4 font-semibold uppercase tracking-wide">Influencer Revenue</p>

                  <div className="flex-grow mb-6">
                    <p className="regular-font text-base text-slate-300 leading-relaxed mb-4">
                      KAIDO backs top creators and influencers driving platform volume.
                    </p>
                    <div className="p-4 rounded-xl bg-blue-500/5 border border-blue-500/20">
                      <p className="regular-font text-sm text-white mb-2">
                        <span className="text-blue-400 font-bold">30%</span> of Affiliate Fee (1%) +<br/>
                        <span className="text-blue-400 font-bold">30%</span> of KAIDO Fee (1%)
                      </p>
                      <p className="regular-font text-xs text-blue-300">
                        = <span className="font-bold text-lg">0.60%</span> of creator volume
                      </p>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-blue-500/20">
                    <div className="flex items-center gap-2 text-sm text-slate-400">
                      <span className="text-green-400">●</span>
                      <span>Grows with partnerships</span>
                    </div>
                  </div>
                </div>
              </div>
            </GlowEffect>
          </div>
        </div>

        {/* Why Choose KAIDO LP - Enhanced Benefits */}
        <div className="max-w-6xl mx-auto mb-16 md:mb-20">
          <h3 className="handwritten text-2xl md:text-4xl text-center text-white mb-4">
            Why Choose KAIDO LP?
          </h3>
          <p className="regular-font text-center text-slate-400 mb-12">
            Built for everyone, not just DeFi experts
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              {
                icon: '✨',
                title: 'Unified Vault System',
                desc: 'Stake once and earn from all three revenue engines automatically. No complex strategies needed.',
                color: '#10b981',
                gradient: 'from-green-500/10'
              },
              {
                icon: '🛡️',
                title: 'Zero Impermanent Loss',
                desc: 'Your BNB stays BNB. No exposure to volatile token pairs or AMM risks.',
                color: '#3b82f6',
                gradient: 'from-blue-500/10'
              },
              {
                icon: '💰',
                title: 'Real Yield, Real Revenue',
                desc: 'Earn from actual platform fees and activity. No token inflation or artificial APY.',
                color: '#f59e0b',
                gradient: 'from-yellow-500/10'
              },
              {
                icon: '👤',
                title: 'Consumer-First Design',
                desc: 'Simple, transparent, and accessible. Perfect for everyday users entering DeFi.',
                color: '#8b5cf6',
                gradient: 'from-purple-500/10'
              }
            ].map((benefit, index) => (
              <GlowEffect key={index} glowColor={benefit.color}>
                <div className={`group rounded-2xl p-6 md:p-8 relative overflow-hidden bg-gradient-to-br ${benefit.gradient} to-transparent border-2 border-white/10 hover:border-white/30 transition-all duration-300`}>
                  <div className="flex items-start gap-5">
                    <div className="text-5xl flex-shrink-0 transform group-hover:scale-110 transition-transform duration-300">
                      {benefit.icon}
                    </div>
                    <div className="flex-grow">
                      <h4 className="handwritten text-xl md:text-2xl text-white mb-3 group-hover:text-yellow-400 transition-colors duration-300">
                        {benefit.title}
                      </h4>
                      <p className="regular-font text-sm md:text-base text-slate-300 leading-relaxed">
                        {benefit.desc}
                      </p>
                    </div>
                  </div>
                </div>
              </GlowEffect>
            ))}
          </div>
        </div>

        {/* CTA Section - Enhanced */}
        <div className="text-center max-w-3xl mx-auto">
          <div className="mb-8">
            <p className="regular-font text-lg md:text-xl text-white/90 mb-3">
              🎯 Ready to earn real yield from prediction markets?
            </p>
            <p className="regular-font text-sm md:text-base text-slate-400">
              Be among the first to access the most consumer-friendly LP vault in DeFi
            </p>
          </div>

          <GlowEffect glowColor="#f59e0b">
            <button className="group px-10 py-5 rounded-2xl text-xl font-bold text-black bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-600 hover:from-yellow-500 hover:via-yellow-600 hover:to-yellow-700 transition-all duration-300 transform hover:scale-105 relative overflow-hidden shadow-2xl shadow-yellow-500/20">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
              <div className="absolute inset-0 border-2 border-yellow-300/50 rounded-2xl"></div>
              <span className="relative z-10 flex items-center gap-3 justify-center">
                <span>Coming Soon - Join Waitlist</span>
                <span className="text-2xl">→</span>
              </span>
            </button>
          </GlowEffect>

          <p className="regular-font text-xs md:text-sm text-slate-500 mt-6">
            Launch expected Q1 2026 • Early supporters get priority access
          </p>
        </div>
      </div>
    </section>
  );
};

export default LPVaultSection;

