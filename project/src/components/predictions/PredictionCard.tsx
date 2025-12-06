import React from 'react';
import Card, { CardContent, CardFooter, CardHeader } from '../ui/Card';
import Button from '../ui/Button';
import Progress from '../ui/progress';
import { Calendar, Clock, Users, Award, DollarSign } from 'lucide-react';
import GlowEffect from '../effects/GlowEffect';

interface PredictionCardProps {
  id: string;
  title: string;
  type: 'binary' | 'multi-choice' | 'agent';
  asset: string;
  expiryDate: string;
  poolSize: number;
  poolToken: 'BNB' | 'KAIDO';
  participants: number;
  yesPercentage?: number;
  priceRanges?: Array<{
    range: string;
    percentage: number;
  }>;
  minKaidoRequired?: number;
  maxParticipants?: number;
  rewardPoolAmount?: number;
  onClick?: () => void;
  glowColor?: string; // Add support for custom glow colors
  className?: string; // Add support for custom classes
  isAgentCreated?: boolean; // Whether this prediction was created by KAIDO agent
}

const PredictionCard: React.FC<PredictionCardProps> = ({
  id,
  title,
  type,
  asset,
  expiryDate,
  poolSize,
  poolToken,
  participants,
  yesPercentage,
  priceRanges,
  minKaidoRequired,
  maxParticipants,
  rewardPoolAmount,
  onClick,
  glowColor,
  className = '',
  isAgentCreated = false,
}) => {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Log the props for debugging
  console.log(`PredictionCard ${id} (${title}) - yesPercentage:`, yesPercentage);

  const getTimeRemaining = () => {
    const today = new Date();
    const expiry = new Date(expiryDate);

    // If the expiry date is in the past, return "Expired"
    if (expiry < today) {
      return "Expired";
    }

    const diffTime = expiry.getTime() - today.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor((diffTime % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffTime % (1000 * 60 * 60)) / (1000 * 60));
    const diffSeconds = Math.floor((diffTime % (1000 * 60)) / 1000);

    // Log the time remaining for debugging
    console.log(`Prediction ${id} time remaining: ${diffDays}d ${diffHours}h ${diffMinutes}m ${diffSeconds}s`);

    // Format the time remaining based on the largest unit
    if (diffDays > 0) {
      return `${diffDays} ${diffDays === 1 ? 'day' : 'days'}`;
    } else if (diffHours > 0) {
      return `${diffHours} ${diffHours === 1 ? 'hour' : 'hours'}`;
    } else if (diffMinutes > 0) {
      return `${diffMinutes} ${diffMinutes === 1 ? 'minute' : 'minutes'}`;
    } else {
      // If less than a minute, show "< 1 minute"
      return `< 1 minute`;
    }
  };

  // Determine if this is a homepage card
  const isHomepageCard = className.includes('homepage-card');

  return (
    <GlowEffect glowColor={glowColor}>
      <Card
        className={`border-yellow-500/30 transition-colors flex flex-col overflow-hidden relative ${className} ${
          isHomepageCard ? 'h-auto md:h-[400px]' : 'h-[360px]'
        }`}
        onClick={onClick}
        hover={true}
        style={{
          minHeight: isHomepageCard ? '280px' : '360px',
          width: '100%',
          maxWidth: '100%'
        }}
      >
        {/* Enhanced Background with multiple layers - matching hero section */}
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

        <CardHeader className={`pb-2 relative z-10 ${className.includes('homepage-card') ? 'pt-3 md:pt-5' : ''}`}>
          <div className="flex justify-between items-start mb-1.5 md:mb-2">
            <div className="flex items-center gap-1.5">
              <span
                className={`font-medium px-1.5 md:px-2 py-0.5 md:py-1 rounded-full bg-yellow-500/20 text-yellow-400 ${className.includes('homepage-card') ? 'text-xs md:text-sm' : 'text-xs'}`}
                style={{ minWidth: '35px', textAlign: 'center' }}
              >
                {asset}
              </span>
              {/* Agent/User Badge */}
              {isAgentCreated && (
                <span
                  className={`font-medium px-1.5 md:px-2 py-0.5 md:py-1 rounded-full bg-purple-500/20 text-purple-400 border border-purple-500/30 ${className.includes('homepage-card') ? 'text-xs md:text-sm' : 'text-xs'}`}
                  title="Created by KAIDO Agent"
                >
                  🤖 AI
                </span>
              )}
            </div>
            <span
              className={`font-medium px-1.5 md:px-2 py-0.5 md:py-1 rounded-full ${
                type === 'agent'
                  ? 'bg-green-500/20 text-green-400'
                  : 'bg-yellow-500/20 text-yellow-400'
              } ${className.includes('homepage-card') ? 'text-xs md:text-sm' : 'text-xs'}`}
              style={{ minWidth: '70px', textAlign: 'center' }}
            >
              {type === 'binary'
                ? 'Yes/No'
                : type === 'agent'
                  ? 'Agent'
                  : 'Multi-choice'}
            </span>
          </div>
          <h3 className={`text-white font-medium ${className.includes('homepage-card') ? 'text-base md:text-xl h-10 md:h-14' : 'text-lg h-12'} line-clamp-2`}>{title}</h3>
        </CardHeader>

        <CardContent className={`pb-2 md:pb-3 flex-grow relative z-10 ${className.includes('homepage-card') ? 'pt-2 md:pt-5' : ''}`}>
          <div className={className.includes('homepage-card') ? 'h-auto md:h-[160px]' : 'h-[140px]'}> {/* Auto height on mobile, fixed on desktop */}
            {type === 'binary' ? (
              <div className="space-y-2 md:space-y-3">
                {/* Calculate yes/no percentages with proper fallback to 50/50 */}
                {(() => {
                  // Use the provided yesPercentage or default to 50
                  // Make sure we're using a valid number for the percentage
                  const calculatedYesPercentage = typeof yesPercentage === 'number' && !isNaN(yesPercentage) ?
                    Math.min(100, Math.max(0, yesPercentage)) : 50;
                  const calculatedNoPercentage = 100 - calculatedYesPercentage;

                  console.log(`PredictionCard ${id} - Calculated percentages: Yes=${calculatedYesPercentage}%, No=${calculatedNoPercentage}%`);

                  return (
                    <>
                      <div className="flex justify-between mb-0.5 md:mb-1">
                        <span className={`text-yellow-400 font-medium ${className.includes('homepage-card') ? 'text-sm md:text-base' : 'text-sm'}`}>Yes</span>
                        <span className={`text-white font-medium ${className.includes('homepage-card') ? 'text-sm md:text-base' : 'text-sm'}`}>{calculatedYesPercentage}%</span>
                      </div>
                      <Progress
                        value={calculatedYesPercentage}
                        className={`${className.includes('homepage-card') ? 'h-2 md:h-3' : 'h-2.5'} bg-yellow-900/30`}
                        barClassName="bg-yellow-500"
                      />

                      <div className="flex justify-between mb-0.5 md:mb-1 mt-2 md:mt-3">
                        <span className={`text-white font-medium ${className.includes('homepage-card') ? 'text-sm md:text-base' : 'text-sm'}`}>No</span>
                        <span className={`text-white font-medium ${className.includes('homepage-card') ? 'text-sm md:text-base' : 'text-sm'}`}>{calculatedNoPercentage}%</span>
                      </div>
                      <Progress
                        value={calculatedNoPercentage}
                        className={`${className.includes('homepage-card') ? 'h-2 md:h-3' : 'h-2.5'} bg-white/20`}
                        barClassName="bg-white"
                      />
                    </>
                  );
                })()}
              </div>
            ) : (
              <div className="space-y-1 md:space-y-1.5">
                {/* Ensure we only show up to 4 price ranges to maintain consistent height */}
                {priceRanges && priceRanges.length > 0 ? (
                  priceRanges.slice(0, 4).map((range, index) => {
                    // Different colors for each range
                    const colors = [
                      { bg: 'bg-yellow-900/30', bar: 'bg-yellow-500' },
                      { bg: 'bg-yellow-800/30', bar: 'bg-yellow-400' },
                      { bg: 'bg-yellow-700/30', bar: 'bg-yellow-600' },
                      { bg: 'bg-yellow-600/30', bar: 'bg-yellow-300' }
                    ];
                    const color = colors[index % colors.length];

                    // Ensure percentage is a valid number
                    const percentage = typeof range.percentage === 'number' && !isNaN(range.percentage)
                      ? range.percentage
                      : 0;

                    return (
                      <div key={index} className="mb-1 md:mb-1.5">
                        <div className="flex justify-between mb-0.5 md:mb-1">
                          <span className={`font-medium ${className.includes('homepage-card') ? 'text-sm md:text-base' : 'text-sm'} text-slate-300 truncate mr-2`}>{range.range}</span>
                          <span className={`font-medium ${className.includes('homepage-card') ? 'text-sm md:text-base' : 'text-sm'} text-white flex-shrink-0`}>{percentage.toFixed(1)}%</span>
                        </div>
                        <Progress
                          value={percentage}
                          className={`${className.includes('homepage-card') ? 'h-2 md:h-3' : 'h-2.5'} ${color.bg}`}
                          barClassName={color.bar}
                        />
                      </div>
                    );
                  })
                ) : (
                  // Fallback when no price ranges are available
                  <div className="flex items-center justify-center h-full">
                    <span className="text-slate-400 text-sm">No price ranges available</span>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className={`grid grid-cols-2 gap-1.5 md:gap-2 ${type === 'multi-choice' ? 'mt-3 md:mt-6' : 'mt-2 md:mt-4'}`}>
            <div className="flex items-center text-slate-400">
              <Calendar className={`mr-1 md:mr-1.5 text-slate-500 ${className.includes('homepage-card') ? 'h-4 w-4 md:h-5 md:w-5' : 'h-4 w-4'}`} />
              <span className={`${className.includes('homepage-card') ? 'text-xs md:text-base' : 'text-sm'} truncate`}>{formatDate(expiryDate)}</span>
            </div>
            <div className="flex items-center text-slate-400 justify-end">
              <Clock className={`mr-1 md:mr-1.5 text-slate-500 ${className.includes('homepage-card') ? 'h-4 w-4 md:h-5 md:w-5' : 'h-4 w-4'}`} />
              <span className={`${className.includes('homepage-card') ? 'text-xs md:text-base' : 'text-sm'} truncate`}>
                {getTimeRemaining() === "Expired" ? "Expired" : `${getTimeRemaining()} left`}
              </span>
            </div>
          </div>
        </CardContent>

        <CardFooter className={`border-t border-yellow-500/30 pt-2 md:pt-3 mt-auto relative z-10 ${className.includes('homepage-card') ? 'pb-3 md:pb-5' : ''}`}>
          <div className="flex flex-col w-full">
            <div className="flex justify-between items-center w-full">
              <div className="flex items-center min-w-0 flex-1 mr-2">
                {type === 'agent' ? (
                  <div className="flex items-center bg-gradient-to-r from-amber-500/20 to-yellow-500/20 px-1.5 md:px-2 py-0.5 md:py-1 rounded-md min-w-0">
                    <Award className={`mr-1 md:mr-1.5 text-yellow-500 flex-shrink-0 ${className.includes('homepage-card') ? 'h-4 w-4 md:h-5 md:w-5' : 'h-4 w-4'}`} />
                    <span className={`font-medium text-yellow-400 truncate ${className.includes('homepage-card') ? 'text-xs md:text-base' : 'text-sm'}`}>
                      {(rewardPoolAmount || poolSize).toFixed(2)} {poolToken}
                    </span>
                  </div>
                ) : (
                  <span className={`font-medium text-slate-400 truncate ${className.includes('homepage-card') ? 'text-xs md:text-base' : 'text-sm'}`}>
                    {poolSize.toFixed(2)} {poolToken}
                  </span>
                )}
              </div>
              <div className="flex items-center text-slate-400 flex-shrink-0">
                <Users className={`mr-1 md:mr-1.5 text-slate-500 ${className.includes('homepage-card') ? 'h-4 w-4 md:h-5 md:w-5' : 'h-4 w-4'}`} />
                <span className={`font-medium ${className.includes('homepage-card') ? 'text-xs md:text-base' : 'text-sm'}`}>{participants || 1}</span>
              </div>
            </div>

            {/* Progress counter for agent predictions */}
            {type === 'agent' && (
              <div className="mt-1.5 md:mt-2">
                <div className="flex justify-between mb-0.5 md:mb-1">
                  <span className="text-xs md:text-sm text-slate-400">Participants</span>
                  <span className="text-xs md:text-sm text-slate-300">
                    {participants} {maxParticipants ? `/ ${maxParticipants}` : ''}
                  </span>
                </div>
                <Progress
                  value={maxParticipants ? (participants / maxParticipants) * 100 : Math.min(participants * 10, 100)}
                  className="h-1.5 md:h-2 bg-yellow-900/30"
                  barClassName="bg-yellow-500"
                />
              </div>
            )}
          </div>
        </CardFooter>
      </Card>
    </GlowEffect>
  );
};

export default PredictionCard;
