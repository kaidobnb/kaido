import React from 'react';
import { User } from 'lucide-react';

interface AvatarProps {
  src: string;
  alt: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const Avatar: React.FC<AvatarProps> = ({
  src,
  alt,
  size = 'md',
  className = '',
}) => {
  const sizeClasses = {
    xs: 'w-6 h-6',
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16',
  };

  const iconSizes = {
    xs: 'h-3 w-3',
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6',
    xl: 'h-8 w-8',
  };

  return (
    <div className={`relative rounded-full overflow-hidden bg-gradient-to-br from-yellow-500 to-yellow-600 ${sizeClasses[size]} ${className}`}>
      {src ? (
        <img
          src={src}
          alt={alt}
          className="w-full h-full object-cover"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            // Use a default user icon instead of ui-avatars
            target.style.display = 'none';
            target.parentElement?.classList.add('default-avatar');
          }}
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center text-white">
          <User className={iconSizes[size]} />
        </div>
      )}
    </div>
  );
};

export default Avatar;