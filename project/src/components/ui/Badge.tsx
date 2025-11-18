import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'danger';
  className?: string;
}

const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  className = '',
}) => {
  const variantClasses = {
    default: 'bg-slate-700 text-slate-200',
    primary: 'bg-yellow-600/20 text-yellow-400 border border-yellow-600/20',
    secondary: 'bg-slate-600/20 text-slate-300 border border-slate-600/20',
    success: 'bg-green-600/20 text-green-400 border border-green-600/20',
    warning: 'bg-yellow-600/20 text-yellow-400 border border-yellow-600/20',
    danger: 'bg-red-600/20 text-red-400 border border-red-600/20',
  };

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${variantClasses[variant]} ${className}`}
    >
      {children}
    </span>
  );
};

export default Badge;