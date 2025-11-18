import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  onClick?: () => void;
  variant?: 'default' | 'burgundy';
}

const Card: React.FC<CardProps> = ({ children, className = '', hover = false, onClick, variant = 'default' }) => {
  // Generate a random color for hover effect if not specified in the className
  const getRandomHoverColor = () => {
    const colors = [
      'hover:border-yellow-500/50 hover:shadow-lg hover:shadow-yellow-500/20',
      'hover:border-yellow-400/50 hover:shadow-lg hover:shadow-yellow-400/20',
      'hover:border-yellow-600/50 hover:shadow-lg hover:shadow-yellow-600/20',
      'hover:border-yellow-300/50 hover:shadow-lg hover:shadow-yellow-300/20',
      'hover:border-yellow-500/50 hover:shadow-lg hover:shadow-yellow-500/20',
      'hover:border-yellow-400/50 hover:shadow-lg hover:shadow-yellow-400/20',
      'hover:border-yellow-600/50 hover:shadow-lg hover:shadow-yellow-600/20',
      'hover:border-cyan-500/50 hover:shadow-lg hover:shadow-cyan-500/20'
    ];

    // Use a hash of the component instance to get a consistent color
    const randomIndex = Math.floor(Math.random() * colors.length);
    return colors[randomIndex];
  };

  // Determine if this is a homepage card based on className
  const isHomepageCard = className.includes('homepage-card');

  if (variant === 'burgundy') {
    return (
      <div
        className={`relative rounded-xl border border-yellow-500/30 overflow-hidden shadow-md transition-all duration-300 ${
          hover ? getRandomHoverColor() : ''
        } ${onClick ? 'cursor-pointer' : ''} ${className} card-glow`}
        onClick={onClick}
        style={{
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.2)',
        }}
      >
        {/* Burgundy gradient background - matching hero section */}
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-red-950/30 to-slate-900"></div>
          <div className="absolute inset-0 bg-gradient-to-tr from-amber-950/20 via-transparent to-orange-950/20"></div>
          <div className="absolute inset-0 opacity-10" style={{
            backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(251, 191, 36, 0.1) 10px, rgba(251, 191, 36, 0.1) 20px)'
          }}></div>
        </div>
        <div className="relative z-10">
          {children}
        </div>
      </div>
    );
  }

  return (
    <div
      className={`bg-black rounded-xl border border-yellow-500/30 overflow-hidden shadow-md transition-all duration-300 ${
        hover ? getRandomHoverColor() : ''
      } ${onClick ? 'cursor-pointer' : ''} ${className} card-glow`}
      onClick={onClick}
      style={{
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.2)',
      }}
    >
      {children}
    </div>
  );
};

export const CardHeader: React.FC<{children: React.ReactNode; className?: string}> = ({
  children,
  className = ''
}) => {
  return (
    <div className={`px-5 py-4 border-b border-yellow-500/20 ${className}`}>
      {children}
    </div>
  );
};

export const CardContent: React.FC<{children: React.ReactNode; className?: string}> = ({
  children,
  className = ''
}) => {
  return (
    <div className={`px-5 py-4 ${className}`}>
      {children}
    </div>
  );
};

export const CardFooter: React.FC<{children: React.ReactNode; className?: string}> = ({
  children,
  className = ''
}) => {
  return (
    <div className={`px-5 py-4 border-t border-yellow-500/20 ${className}`}>
      {children}
    </div>
  );
};

export default Card;