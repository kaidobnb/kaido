import React from 'react';
import { useNavigate } from 'react-router-dom';

interface NavigationLinkProps {
  to: string;
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

const NavigationLink: React.FC<NavigationLinkProps> = ({ to, children, className = '', onClick }) => {
  const navigate = useNavigate();

  const handleClick = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault(); // Prevent default to handle navigation ourselves
    e.stopPropagation(); // Stop event from bubbling

    console.log('NavigationLink clicked:', to);

    // Call the onClick handler if provided
    if (onClick) {
      onClick();
    }

    // Scroll to top immediately for better UX
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: 'instant'
    });

    // Try to use React Router navigation first
    try {
      navigate(to);

      // Fallback to direct navigation if React Router doesn't work
      setTimeout(() => {
        if (window.location.pathname !== to) {
          window.location.href = to;
          // Also scroll to top when using direct navigation
          window.scrollTo(0, 0);
        }
      }, 100);
    } catch (error) {
      // Direct navigation as ultimate fallback
      window.location.href = to;
      // Also scroll to top when using direct navigation
      window.scrollTo(0, 0);
    }
  };

  // Special handling for touch events on mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    const target = e.currentTarget;
    if (target.classList.contains('nav-button')) {
      target.style.backgroundColor = 'rgba(51, 65, 85, 0.9)';
      target.style.borderColor = 'rgba(243, 186, 47, 0.5)';
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const target = e.currentTarget;
    if (target.classList.contains('nav-button')) {
      target.style.backgroundColor = '';
      target.style.borderColor = 'rgba(243, 186, 47, 0.3)';
    }

    // Trigger click handler on touch end
    handleClick(e);
  };

  return (
    <a
      href={to}
      className={`${className} navigation-link`}
      onClick={handleClick}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      style={{
        cursor: 'pointer',
        WebkitTapHighlightColor: 'rgba(243, 186, 47, 0.2)',
        WebkitTouchCallout: 'none',
        WebkitUserSelect: 'none',
        MozUserSelect: 'none',
        msUserSelect: 'none',
        userSelect: 'none',
        position: 'relative',
        zIndex: 10003,
        pointerEvents: 'auto'
      }}
      onMouseEnter={(e) => {
        // Set cursor to pointer for the current element and all its children
        e.currentTarget.style.cursor = 'pointer';
        document.body.style.cursor = 'pointer';

        const children = e.currentTarget.querySelectorAll('*');
        children.forEach(child => {
          (child as HTMLElement).style.cursor = 'pointer';
        });

        // Add a highlight effect
        if (e.currentTarget.classList.contains('nav-button')) {
          e.currentTarget.style.borderColor = 'rgba(243, 186, 47, 0.5)';
        }
      }}
      onMouseLeave={(e) => {
        document.body.style.cursor = 'default';

        // Remove highlight effect
        if (e.currentTarget.classList.contains('nav-button')) {
          e.currentTarget.style.borderColor = 'rgba(243, 186, 47, 0.3)';
        }
      }}
    >
      {children}
    </a>
  );
};

export default NavigationLink;
