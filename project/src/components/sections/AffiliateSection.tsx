import React from 'react';
import { Share2, DollarSign, Users, TrendingUp, ArrowRight } from 'lucide-react';
import Button from '../ui/Button';
import GlowEffect from '../effects/GlowEffect';

const AffiliateSection: React.FC = () => {
  return (
    <section className="py-10 md:py-20 relative overflow-hidden">
      {/* Background with gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent to-purple-900/10 pointer-events-none"></div>

      <div className="container mx-auto px-4 md:px-6">
        <div className="text-center mb-6 md:mb-12">
          <h2 className="handwritten text-2xl md:text-5xl text-white mb-2 md:mb-4">Affiliate Program</h2>
          <p className="text-sm md:text-xl text-slate-300 max-w-4xl mx-auto px-2">
            Earn 1% in BNB from every transaction your referrals make. Share your unique KAIDO referral link and get paid instantly in BNB.
          </p>
          <div className="w-full border-b border-gray-300/20 my-4 md:my-8 relative">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-12 h-12 md:w-20 md:h-20 bg-pastel-purple rounded-full flex items-center justify-center">
                <Share2 className="h-5 w-5 md:h-8 md:w-8 text-white" />
              </div>
            </div>
          </div>
        </div>

        {/* How It Works */}
        <div className="max-w-6xl mx-auto mb-8 md:mb-16">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-8">
            <GlowEffect glowColor="#F3BA2F">
              <div className="rounded-xl p-4 md:p-8 h-full flex flex-col items-center text-center overflow-hidden relative">
                {/* Enhanced Background */}
                <div className="absolute inset-0 z-0">
                  <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-red-950/30 to-slate-900"></div>
                  <div className="absolute inset-0 bg-gradient-to-tr from-amber-950/20 via-transparent to-orange-950/20"></div>
                  <div className="absolute inset-0 opacity-10" style={{backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(251, 191, 36, 0.1) 10px, rgba(251, 191, 36, 0.1) 20px)'}}></div>
                  <div className="absolute -top-20 -left-20 w-40 h-40 bg-yellow-500/10 rounded-full filter blur-3xl"></div>
                  <div className="absolute -bottom-20 -right-20 w-48 h-48 bg-orange-500/10 rounded-full filter blur-3xl"></div>
                  <div className="absolute inset-0 opacity-5" style={{backgroundImage: 'linear-gradient(0deg, transparent 24%, rgba(251, 191, 36, 0.05) 25%, rgba(251, 191, 36, 0.05) 26%, transparent 27%, transparent 74%, rgba(251, 191, 36, 0.05) 75%, rgba(251, 191, 36, 0.05) 76%, transparent 77%, transparent), linear-gradient(90deg, transparent 24%, rgba(251, 191, 36, 0.05) 25%, rgba(251, 191, 36, 0.05) 26%, transparent 27%, transparent 74%, rgba(251, 191, 36, 0.05) 75%, rgba(251, 191, 36, 0.05) 76%, transparent 77%, transparent)', backgroundSize: '50px 50px'}}></div>
                </div>
                <div className="absolute inset-0 border-2 border-gray-300/30 rounded-xl z-5"></div>
                <div className="relative z-10 w-full">
                  <div className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-gradient-to-br from-yellow-500 to-yellow-600 flex items-center justify-center mb-3 md:mb-6 mx-auto">
                    <Share2 className="h-5 w-5 md:h-7 md:w-7 text-white" />
                  </div>
                  <h3 className="handwritten text-lg md:text-2xl text-white mb-2 md:mb-4">Get Your Referral Link</h3>
                  <p className="text-slate-300 text-sm md:text-lg">
                    Generate your unique KAIDO referral link and share it with your network.
                  </p>
                </div>
              </div>
            </GlowEffect>

            <GlowEffect glowColor="#F3BA2F">
              <div className="rounded-xl p-4 md:p-8 h-full flex flex-col items-center text-center overflow-hidden relative">
                {/* Enhanced Background */}
                <div className="absolute inset-0 z-0">
                  <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-red-950/30 to-slate-900"></div>
                  <div className="absolute inset-0 bg-gradient-to-tr from-amber-950/20 via-transparent to-orange-950/20"></div>
                  <div className="absolute inset-0 opacity-10" style={{backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(251, 191, 36, 0.1) 10px, rgba(251, 191, 36, 0.1) 20px)'}}></div>
                  <div className="absolute -top-20 -left-20 w-40 h-40 bg-yellow-500/10 rounded-full filter blur-3xl"></div>
                  <div className="absolute -bottom-20 -right-20 w-48 h-48 bg-orange-500/10 rounded-full filter blur-3xl"></div>
                  <div className="absolute inset-0 opacity-5" style={{backgroundImage: 'linear-gradient(0deg, transparent 24%, rgba(251, 191, 36, 0.05) 25%, rgba(251, 191, 36, 0.05) 26%, transparent 27%, transparent 74%, rgba(251, 191, 36, 0.05) 75%, rgba(251, 191, 36, 0.05) 76%, transparent 77%, transparent), linear-gradient(90deg, transparent 24%, rgba(251, 191, 36, 0.05) 25%, rgba(251, 191, 36, 0.05) 26%, transparent 27%, transparent 74%, rgba(251, 191, 36, 0.05) 75%, rgba(251, 191, 36, 0.05) 76%, transparent 77%, transparent)', backgroundSize: '50px 50px'}}></div>
                </div>
                <div className="absolute inset-0 border-2 border-gray-300/30 rounded-xl z-5"></div>
                <div className="relative z-10 w-full">
                  <div className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-gradient-to-br from-yellow-500 to-yellow-600 flex items-center justify-center mb-3 md:mb-6 mx-auto">
                    <Users className="h-5 w-5 md:h-7 md:w-7 text-white" />
                  </div>
                  <h3 className="handwritten text-lg md:text-2xl text-white mb-2 md:mb-4">Instant Payouts in BNB</h3>
                  <p className="text-slate-300 text-sm md:text-lg">
                    Earn 1% in BNB from every transaction your referrals make. Payouts go directly to your wallet instantly.
                  </p>
                </div>
              </div>
            </GlowEffect>

            <GlowEffect glowColor="#F3BA2F">
              <div className="rounded-xl p-4 md:p-8 h-full flex flex-col items-center text-center overflow-hidden relative">
                {/* Enhanced Background */}
                <div className="absolute inset-0 z-0">
                  <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-red-950/30 to-slate-900"></div>
                  <div className="absolute inset-0 bg-gradient-to-tr from-amber-950/20 via-transparent to-orange-950/20"></div>
                  <div className="absolute inset-0 opacity-10" style={{backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(251, 191, 36, 0.1) 10px, rgba(251, 191, 36, 0.1) 20px)'}}></div>
                  <div className="absolute -top-20 -left-20 w-40 h-40 bg-yellow-500/10 rounded-full filter blur-3xl"></div>
                  <div className="absolute -bottom-20 -right-20 w-48 h-48 bg-orange-500/10 rounded-full filter blur-3xl"></div>
                  <div className="absolute inset-0 opacity-5" style={{backgroundImage: 'linear-gradient(0deg, transparent 24%, rgba(251, 191, 36, 0.05) 25%, rgba(251, 191, 36, 0.05) 26%, transparent 27%, transparent 74%, rgba(251, 191, 36, 0.05) 75%, rgba(251, 191, 36, 0.05) 76%, transparent 77%, transparent), linear-gradient(90deg, transparent 24%, rgba(251, 191, 36, 0.05) 25%, rgba(251, 191, 36, 0.05) 26%, transparent 27%, transparent 74%, rgba(251, 191, 36, 0.05) 75%, rgba(251, 191, 36, 0.05) 76%, transparent 77%, transparent)', backgroundSize: '50px 50px'}}></div>
                </div>
                <div className="absolute inset-0 border-2 border-gray-300/30 rounded-xl z-5"></div>
                <div className="relative z-10 w-full">
                  <div className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-gradient-to-br from-yellow-500 to-yellow-600 flex items-center justify-center mb-3 md:mb-6 mx-auto">
                    <DollarSign className="h-5 w-5 md:h-7 md:w-7 text-white" />
                  </div>
                  <h3 className="handwritten text-lg md:text-2xl text-white mb-2 md:mb-4">Climb the Leaderboard</h3>
                  <p className="text-slate-300 text-sm md:text-lg">
                    Climb the referral leaderboard to earn bigger prizes and rewards from the team. The more you refer, the higher you climb.
                  </p>
                </div>
              </div>
            </GlowEffect>
          </div>
        </div>

        {/* Benefits */}
        <div className="max-w-6xl mx-auto mb-8 md:mb-16">
          <h3 className="handwritten text-xl md:text-3xl text-white text-center mb-4 md:mb-8">Benefits of Our Affiliate Program</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8">
            <div className="h-full">
              <GlowEffect glowColor="#f59e0b" className="h-full">
                <div className="rounded-xl p-4 md:p-8 h-full overflow-hidden relative">
                  {/* Enhanced Background */}
                  <div className="absolute inset-0 z-0">
                    <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-red-950/30 to-slate-900"></div>
                    <div className="absolute inset-0 bg-gradient-to-tr from-amber-950/20 via-transparent to-orange-950/20"></div>
                    <div className="absolute inset-0 opacity-10" style={{backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(251, 191, 36, 0.1) 10px, rgba(251, 191, 36, 0.1) 20px)'}}></div>
                    <div className="absolute -top-20 -left-20 w-40 h-40 bg-yellow-500/10 rounded-full filter blur-3xl"></div>
                    <div className="absolute -bottom-20 -right-20 w-48 h-48 bg-orange-500/10 rounded-full filter blur-3xl"></div>
                    <div className="absolute inset-0 opacity-5" style={{backgroundImage: 'linear-gradient(0deg, transparent 24%, rgba(251, 191, 36, 0.05) 25%, rgba(251, 191, 36, 0.05) 26%, transparent 27%, transparent 74%, rgba(251, 191, 36, 0.05) 75%, rgba(251, 191, 36, 0.05) 76%, transparent 77%, transparent), linear-gradient(90deg, transparent 24%, rgba(251, 191, 36, 0.05) 25%, rgba(251, 191, 36, 0.05) 26%, transparent 27%, transparent 74%, rgba(251, 191, 36, 0.05) 75%, rgba(251, 191, 36, 0.05) 76%, transparent 77%, transparent)', backgroundSize: '50px 50px'}}></div>
                  </div>
                  <div className="absolute inset-0 border-2 border-gray-300/30 rounded-xl z-5"></div>
                  <div className="relative z-10">
                    <h4 className="handwritten text-lg md:text-2xl text-white mb-3 md:mb-4">For Affiliates</h4>
                    <ul className="space-y-2 md:space-y-3">
                      <li className="flex items-start">
                        <TrendingUp className="h-4 w-4 md:h-5 md:w-5 text-green-400 mr-2 md:mr-3 flex-shrink-0 mt-0.5" />
                        <p className="text-slate-300 text-sm md:text-lg">Earn passive income from your network's activity</p>
                      </li>
                      <li className="flex items-start">
                        <TrendingUp className="h-4 w-4 md:h-5 md:w-5 text-green-400 mr-2 md:mr-3 flex-shrink-0 mt-0.5" />
                        <p className="text-slate-300 text-sm md:text-lg">No cap on earnings - the more you share, the more you earn</p>
                      </li>
                      <li className="flex items-start">
                        <TrendingUp className="h-4 w-4 md:h-5 md:w-5 text-green-400 mr-2 md:mr-3 flex-shrink-0 mt-0.5" />
                        <p className="text-slate-300 text-sm md:text-lg">Earn regardless of prediction outcomes</p>
                      </li>
                      <li className="flex items-start">
                        <TrendingUp className="h-4 w-4 md:h-5 md:w-5 text-green-400 mr-2 md:mr-3 flex-shrink-0 mt-0.5" />
                        <p className="text-slate-300 text-sm md:text-lg">Detailed tracking of all your referrals and earnings</p>
                      </li>
                    </ul>
                  </div>
                </div>
              </GlowEffect>
            </div>

            <div className="h-full">
              <GlowEffect glowColor="#F3BA2F" className="h-full">
                <div className="rounded-xl p-4 md:p-8 h-full overflow-hidden relative">
                  {/* Enhanced Background */}
                  <div className="absolute inset-0 z-0">
                    <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-red-950/30 to-slate-900"></div>
                    <div className="absolute inset-0 bg-gradient-to-tr from-amber-950/20 via-transparent to-orange-950/20"></div>
                    <div className="absolute inset-0 opacity-10" style={{backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(251, 191, 36, 0.1) 10px, rgba(251, 191, 36, 0.1) 20px)'}}></div>
                    <div className="absolute -top-20 -left-20 w-40 h-40 bg-yellow-500/10 rounded-full filter blur-3xl"></div>
                    <div className="absolute -bottom-20 -right-20 w-48 h-48 bg-orange-500/10 rounded-full filter blur-3xl"></div>
                    <div className="absolute inset-0 opacity-5" style={{backgroundImage: 'linear-gradient(0deg, transparent 24%, rgba(251, 191, 36, 0.05) 25%, rgba(251, 191, 36, 0.05) 26%, transparent 27%, transparent 74%, rgba(251, 191, 36, 0.05) 75%, rgba(251, 191, 36, 0.05) 76%, transparent 77%, transparent), linear-gradient(90deg, transparent 24%, rgba(251, 191, 36, 0.05) 25%, rgba(251, 191, 36, 0.05) 26%, transparent 27%, transparent 74%, rgba(251, 191, 36, 0.05) 75%, rgba(251, 191, 36, 0.05) 76%, transparent 77%, transparent)', backgroundSize: '50px 50px'}}></div>
                  </div>
                  <div className="absolute inset-0 border-2 border-gray-300/30 rounded-xl z-5"></div>
                  <div className="relative z-10">
                    <h4 className="handwritten text-lg md:text-2xl text-white mb-3 md:mb-4">For Referred Users</h4>
                    <ul className="space-y-2 md:space-y-3">
                      <li className="flex items-start">
                        <TrendingUp className="h-4 w-4 md:h-5 md:w-5 text-yellow-400 mr-2 md:mr-3 flex-shrink-0 mt-0.5" />
                        <p className="text-slate-300 text-sm md:text-lg">Same platform experience with no additional fees</p>
                      </li>
                      <li className="flex items-start">
                        <TrendingUp className="h-4 w-4 md:h-5 md:w-5 text-yellow-400 mr-2 md:mr-3 flex-shrink-0 mt-0.5" />
                        <p className="text-slate-300 text-sm md:text-lg">Discover high-quality predictions curated by friends</p>
                      </li>
                      <li className="flex items-start">
                        <TrendingUp className="h-4 w-4 md:h-5 md:w-5 text-yellow-400 mr-2 md:mr-3 flex-shrink-0 mt-0.5" />
                        <p className="text-slate-300 text-sm md:text-lg">Become an affiliate yourself and start earning</p>
                      </li>
                      <li className="flex items-start">
                        <TrendingUp className="h-4 w-4 md:h-5 md:w-5 text-yellow-400 mr-2 md:mr-3 flex-shrink-0 mt-0.5" />
                        <p className="text-slate-300 text-sm md:text-lg">Join a community of like-minded predictors</p>
                      </li>
                    </ul>
                  </div>
                </div>
              </GlowEffect>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center">
          <GlowEffect glowColor="#ec4899">
            <Button
              variant="primary"
              size="lg"
              className="px-4 md:px-8 py-2 md:py-4 text-base md:text-xl handwritten"
              rightIcon={<ArrowRight className="h-4 w-4 md:h-5 md:w-5 ml-2" />}
              onClick={() => window.location.href = '/profile'}
            >
              Start Sharing & Earning
            </Button>
          </GlowEffect>
          <p className="text-slate-400 mt-2 md:mt-4 text-sm md:text-base">
            View your affiliate dashboard in your profile to track earnings
          </p>
        </div>
      </div>
    </section>
  );
};

export default AffiliateSection;
