import React, { useState, useEffect } from 'react';
import GlowEffect from '../effects/GlowEffect';

interface CountdownTimerProps {
  targetDate: Date;
  title: string;
  subtitle?: string;
  onComplete?: () => void;
  glowColor?: string;
}

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

const CountdownTimer: React.FC<CountdownTimerProps> = ({
  targetDate,
  title,
  subtitle,
  onComplete,
  glowColor = '#F3BA2F'
}) => {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0
  });

  useEffect(() => {
    const calculateTimeLeft = () => {
      const difference = targetDate.getTime() - new Date().getTime();
      
      if (difference <= 0) {
        // Timer has completed
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        if (onComplete) {
          onComplete();
        }
        return;
      }
      
      // Calculate time units
      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);
      
      setTimeLeft({ days, hours, minutes, seconds });
    };

    // Calculate immediately and then set up interval
    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);
    
    // Clean up interval on unmount
    return () => clearInterval(timer);
  }, [targetDate, onComplete]);

  // Helper function to add leading zeros
  const formatNumber = (num: number): string => {
    return num.toString().padStart(2, '0');
  };

  return (
    <GlowEffect glowColor={glowColor}>
      <div className="bg-slate-800/70 backdrop-blur-sm rounded-xl border border-slate-700/50 p-4 md:p-6">
        <div className="text-center mb-4">
          <h3 className="text-xl md:text-2xl font-bold text-white">{title}</h3>
          {subtitle && <p className="text-slate-300 mt-1">{subtitle}</p>}
        </div>
        
        <div className="grid grid-cols-4 gap-2 md:gap-4">
          {/* Days */}
          <div className="flex flex-col items-center">
            <div className="bg-slate-700/50 rounded-lg w-full aspect-square flex items-center justify-center mb-2">
              <span className="text-2xl md:text-4xl font-bold text-white">{formatNumber(timeLeft.days)}</span>
            </div>
            <span className="text-xs md:text-sm text-slate-400">Days</span>
          </div>
          
          {/* Hours */}
          <div className="flex flex-col items-center">
            <div className="bg-slate-700/50 rounded-lg w-full aspect-square flex items-center justify-center mb-2">
              <span className="text-2xl md:text-4xl font-bold text-white">{formatNumber(timeLeft.hours)}</span>
            </div>
            <span className="text-xs md:text-sm text-slate-400">Hours</span>
          </div>
          
          {/* Minutes */}
          <div className="flex flex-col items-center">
            <div className="bg-slate-700/50 rounded-lg w-full aspect-square flex items-center justify-center mb-2">
              <span className="text-2xl md:text-4xl font-bold text-white">{formatNumber(timeLeft.minutes)}</span>
            </div>
            <span className="text-xs md:text-sm text-slate-400">Minutes</span>
          </div>
          
          {/* Seconds */}
          <div className="flex flex-col items-center">
            <div className="bg-slate-700/50 rounded-lg w-full aspect-square flex items-center justify-center mb-2 relative overflow-hidden">
              <div 
                className="absolute inset-0 bg-purple-500/10 animate-pulse"
                style={{ animationDuration: '2s' }}
              ></div>
              <span className="text-2xl md:text-4xl font-bold text-white relative z-10">{formatNumber(timeLeft.seconds)}</span>
            </div>
            <span className="text-xs md:text-sm text-slate-400">Seconds</span>
          </div>
        </div>
      </div>
    </GlowEffect>
  );
};

export default CountdownTimer;
