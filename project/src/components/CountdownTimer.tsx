import React, { useState, useEffect } from 'react';

// Simple utility function to merge class names
const mergeClassNames = (...classes: (string | undefined)[]) => {
  return classes.filter(Boolean).join(' ');
};

interface CountdownTimerProps {
  targetDate: Date;
  onComplete: () => void;
  className?: string;
}

const CountdownTimer: React.FC<CountdownTimerProps> = ({
  targetDate,
  onComplete,
  className
}) => {
  const [timeLeft, setTimeLeft] = useState({
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
        onComplete();
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
    return num < 10 ? `0${num}` : num.toString();
  };

  return (
    <div className={mergeClassNames("flex justify-center items-center", className)}>
      <div className="grid grid-cols-4 gap-2 w-full max-w-md">
        {/* Days */}
        <div className="flex flex-col items-center">
          <div className="bg-slate-700/50 backdrop-blur-sm rounded-lg p-3 w-full text-center">
            <span className="text-2xl font-bold text-white">{formatNumber(timeLeft.days)}</span>
          </div>
          <span className="text-xs text-slate-400 mt-1">Days</span>
        </div>

        {/* Hours */}
        <div className="flex flex-col items-center">
          <div className="bg-slate-700/50 backdrop-blur-sm rounded-lg p-3 w-full text-center">
            <span className="text-2xl font-bold text-white">{formatNumber(timeLeft.hours)}</span>
          </div>
          <span className="text-xs text-slate-400 mt-1">Hours</span>
        </div>

        {/* Minutes */}
        <div className="flex flex-col items-center">
          <div className="bg-slate-700/50 backdrop-blur-sm rounded-lg p-3 w-full text-center">
            <span className="text-2xl font-bold text-white">{formatNumber(timeLeft.minutes)}</span>
          </div>
          <span className="text-xs text-slate-400 mt-1">Minutes</span>
        </div>

        {/* Seconds */}
        <div className="flex flex-col items-center">
          <div className="bg-slate-700/50 backdrop-blur-sm rounded-lg p-3 w-full text-center">
            <span className="text-2xl font-bold text-white">{formatNumber(timeLeft.seconds)}</span>
          </div>
          <span className="text-xs text-slate-400 mt-1">Seconds</span>
        </div>
      </div>
    </div>
  );
};

export default CountdownTimer;
