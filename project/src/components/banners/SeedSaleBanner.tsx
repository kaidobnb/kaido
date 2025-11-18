import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles, Rocket, Clock, Coins } from 'lucide-react';

const SeedSaleBanner: React.FC = () => {
  return (
    <div className="w-full bg-gradient-to-br from-black via-yellow-900 to-yellow-800 rounded-xl overflow-hidden shadow-2xl my-8 border border-yellow-400/30">
      <div className="relative">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden">
          {/* Glowing orbs */}
          <div className="absolute top-10 left-10 w-32 h-32 bg-yellow-500/30 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-10 right-20 w-40 h-40 bg-yellow-400/30 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
          <div className="absolute top-1/2 left-1/3 w-24 h-24 bg-yellow-600/30 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>

          {/* Grid pattern */}
          <div className="absolute inset-0 bg-[url('/patterns/grid.svg')] bg-repeat opacity-10"></div>

          {/* Particle effect */}
          <div className="absolute inset-0 bg-[url('/patterns/particles.svg')] bg-repeat opacity-20"></div>
        </div>

        <div className="relative z-10 p-6 md:p-8">
          {/* Top section with badge */}
          <div className="flex justify-center mb-4">
            <div className="bg-gradient-to-r from-amber-400 to-orange-500 text-black px-4 py-1 rounded-full font-bold text-sm inline-flex items-center">
              <Sparkles className="h-4 w-4 mr-1" />
              LIMITED TIME OPPORTUNITY
            </div>
          </div>

          {/* Main content */}
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="flex-1 mb-6 md:mb-0 md:mr-8 text-center md:text-left">
              <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-3">
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-amber-300 to-yellow-200">
                  $KAIDO Presale
                </span>
              </h2>
              <p className="text-white/90 mb-5 max-w-2xl text-lg">
                Get early access to the Kaido platform by participating in our presale.
                Secure your $KAIDO tokens at the best price before public listing.
              </p>

              {/* Stats boxes with icons */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                <div className="bg-white/10 backdrop-blur-sm rounded-xl px-4 py-3 border border-white/20 transform hover:scale-105 transition-transform">
                  <div className="flex items-center justify-center md:justify-start mb-1">
                    <Coins className="h-5 w-5 text-amber-300 mr-2" />
                    <p className="text-amber-300 text-sm font-medium">Token Price</p>
                  </div>
                  <p className="text-2xl font-bold text-white text-center md:text-left">$0.0004</p>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-xl px-4 py-3 border border-white/20 transform hover:scale-105 transition-transform">
                  <div className="flex items-center justify-center md:justify-start mb-1">
                    <Rocket className="h-5 w-5 text-amber-300 mr-2" />
                    <p className="text-amber-300 text-sm font-medium">Token Symbol</p>
                  </div>
                  <p className="text-2xl font-bold text-white text-center md:text-left">$KAIDO</p>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-xl px-4 py-3 border border-white/20 transform hover:scale-105 transition-transform">
                  <div className="flex items-center justify-center md:justify-start mb-1">
                    <Clock className="h-5 w-5 text-amber-300 mr-2" />
                    <p className="text-amber-300 text-sm font-medium">Min Purchase</p>
                  </div>
                  <p className="text-2xl font-bold text-white text-center md:text-left">0.1 BNB</p>
                </div>
              </div>

              {/* CTA Button */}
              <div className="flex justify-center md:justify-start">
                <Link
                  to="/presale"
                  className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-amber-400 to-orange-500 text-black rounded-xl font-bold text-lg hover:from-amber-500 hover:to-orange-600 transition-all shadow-lg hover:shadow-amber-500/30 transform hover:-translate-y-1"
                >
                  Participate Now <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </div>
            </div>

            {/* Right side graphic */}
            <div className="flex-shrink-0 relative">
              <div className="relative z-10 bg-gradient-to-br from-amber-400/90 to-orange-500/90 rounded-full p-8 shadow-lg">
                <div className="text-center">
                  <div className="text-4xl font-black text-white">PRESALE</div>
                  <div className="text-5xl font-black text-white">LIVE</div>
                  <div className="text-lg font-bold text-white/80 mt-2">Limited Time</div>
                </div>
              </div>
              {/* Decorative elements */}
              <div className="absolute top-0 left-0 right-0 bottom-0 bg-amber-400/30 rounded-full blur-xl -m-6 animate-pulse"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SeedSaleBanner;
