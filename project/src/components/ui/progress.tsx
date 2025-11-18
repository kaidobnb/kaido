import React from 'react';

interface ProgressProps {
  value?: number;
  max?: number;
  className?: string;
  barClassName?: string;
}

const Progress: React.FC<ProgressProps> = ({
  value = 0,
  max = 100,
  className = '',
  barClassName = ''
}) => {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));

  // Generate a gradient based on the percentage value
  const getGradient = (percentage: number) => {
    if (percentage > 75) {
      return 'bg-gradient-to-r from-green-500 to-emerald-500';
    } else if (percentage > 50) {
      return 'bg-gradient-to-r from-blue-500 to-indigo-500';
    } else if (percentage > 25) {
      return 'bg-gradient-to-r from-yellow-500 to-yellow-600';
    } else {
      return 'bg-gradient-to-r from-orange-500 to-yellow-500';
    }
  };

  return (
    <div className={`w-full bg-slate-800 rounded-full overflow-hidden ${className}`}>
      <div
        className={`${barClassName || getGradient(percentage)} h-full transition-all duration-300 ease-in-out`}
        style={{ width: `${percentage}%` }}
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={max}
      />
    </div>
  );
};

export default Progress;
