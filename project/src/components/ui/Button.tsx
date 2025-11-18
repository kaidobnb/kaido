import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'tertiary' | 'danger' | 'success' | 'yes' | 'no' | 'outline' | 'ghost' | 'default' | 'light';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  fullWidth?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  leftIcon,
  rightIcon,
  children,
  className = '',
  ...props
}) => {
  const baseClasses = 'inline-flex items-center justify-center rounded-lg font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-black focus:ring-yellow-500 shadow-sm';

  const variantClasses = {
    primary: 'bg-yellow-500 hover:bg-yellow-600 text-black border border-yellow-400',
    secondary: 'bg-slate-700 hover:bg-slate-600 text-white border border-slate-600',
    tertiary: 'bg-transparent hover:bg-slate-700 text-slate-300 border border-slate-600',
    danger: 'bg-red-600 hover:bg-red-700 text-white border border-red-500',
    success: 'bg-green-600 hover:bg-green-700 text-white border border-green-500',
    yes: 'bg-green-500 hover:bg-green-600 text-white border border-green-400',
    no: 'bg-red-500 hover:bg-red-600 text-white border border-red-400',
    outline: 'bg-transparent hover:bg-slate-800 text-slate-300 border border-slate-600',
    ghost: 'bg-transparent hover:bg-slate-800 text-slate-300',
    default: 'bg-slate-800 hover:bg-slate-700 text-white border border-slate-700',
    light: 'bg-white hover:bg-white/90 text-black border border-white/20 shadow-lg'
  };

  const sizeClasses = {
    sm: 'text-xs px-3 py-1.5',
    md: 'text-sm px-4 py-2',
    lg: 'text-base px-6 py-3',
    icon: 'p-2'
  };

  const widthClass = fullWidth ? 'w-full' : '';

  return (
    <button
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${widthClass} ${className}`}
      {...props}
    >
      {leftIcon && <span className="mr-2">{leftIcon}</span>}
      {children}
      {rightIcon && <span className="ml-2">{rightIcon}</span>}
    </button>
  );
};

export default Button;