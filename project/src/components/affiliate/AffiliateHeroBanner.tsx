import React, { useEffect, useState } from 'react';
import { Share2, DollarSign, ArrowRight } from 'lucide-react';
import Button from '../ui/Button';

const AffiliateHeroBanner: React.FC = () => {
  const [isBlinking, setIsBlinking] = useState(false);
  const [animationStep, setAnimationStep] = useState(0);

  // Create blinking effect
  useEffect(() => {
    const blinkInterval = setInterval(() => {
      setIsBlinking(prev => !prev);
    }, 800);

    return () => clearInterval(blinkInterval);
  }, []);

  // Create animation effect
  useEffect(() => {
    const animationInterval = setInterval(() => {
      setAnimationStep(prev => (prev + 1) % 4);
    }, 2000);

    return () => clearInterval(animationInterval);
  }, []);

  // Get animation class based on current step
  const getAnimationClass = () => {
    switch (animationStep) {
      case 0:
        return 'from-yellow-600 to-yellow-500';
      case 1:
        return 'from-yellow-500 to-yellow-400';
      case 2:
        return 'from-yellow-400 to-yellow-600';
      case 3:
        return 'from-yellow-600 to-yellow-300';
      default:
        return 'from-yellow-600 to-yellow-500';
    }
  };

  return (
    <div className="relative overflow-hidden rounded-xl shadow-lg" data-glow-color="#F3BA2F">
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

      {/* Glowing border */}
      <div
        className={`absolute inset-0 border-2 border-white/30 rounded-xl ${isBlinking ? 'shadow-glow' : ''} transition-shadow duration-300 z-5`}
      ></div>

      <div className="relative z-10 p-4 sm:p-5 flex flex-col items-center justify-center text-center rounded-xl">
        <div className="flex flex-col items-center mb-4">
          <div className={`w-10 h-10 rounded-full bg-white/20 flex items-center justify-center mb-3 ${isBlinking ? 'animate-pulse' : ''}`}>
            <Share2 className="h-5 w-5 text-white" />
          </div>
          <h3 className="handwritten text-xl text-white font-bold">
            <span className={`${isBlinking ? 'animate-pulse' : ''}`}>Refer & Earn</span>
          </h3>
          <p className="text-white/90 text-sm mt-2">
            Share predictions, earn up to <span className="font-bold">1% in BNB</span>
          </p>
        </div>

        <div className="flex flex-col items-center gap-3 w-full">
          <div className="flex items-center bg-white/20 rounded-lg px-3 py-2 w-full justify-center" data-glow-color="#8b5cf6">
            <Share2 className="h-4 w-4 text-white mr-2" />
            <div>
              <div className="text-white font-bold">Earn 1% in BNB</div>
            </div>
          </div>

          <Button
            variant="light"
            className="handwritten text-sm px-4 py-2 font-bold w-full"
            rightIcon={<ArrowRight className="h-4 w-4 ml-2" />}
            onClick={() => window.location.href = '/profile'}
            data-glow-color="#10b981"
          >
            Get Referral Link
          </Button>
        </div>
      </div>

      {/* Add the animation keyframes */}
      <style dangerouslySetInnerHTML={{
        __html: `
        @keyframes float {
          0% {
            transform: translate(0, 0);
            opacity: 0;
          }
          10% {
            opacity: 1;
          }
          90% {
            opacity: 1;
          }
          100% {
            transform: translate(${Math.random() > 0.5 ? '-' : ''}${50 + Math.random() * 100}px, ${Math.random() > 0.5 ? '-' : ''}${50 + Math.random() * 100}px);
            opacity: 0;
          }
        }

        .shadow-glow {
          box-shadow: 0 0 15px 5px rgba(255, 255, 255, 0.3);
        }

        @keyframes glow-pulse {
          0%, 100% {
            box-shadow: 0 0 5px rgba(168, 85, 247, 0.4);
          }
          50% {
            box-shadow: 0 0 20px rgba(168, 85, 247, 0.8), 0 0 30px rgba(168, 85, 247, 0.6);
          }
        }

        .glow-pulse {
          animation: glow-pulse 2s ease-in-out infinite;
        }
      `}} />
    </div>
  );
};

export default AffiliateHeroBanner;
