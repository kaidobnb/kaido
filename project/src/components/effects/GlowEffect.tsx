import React, { useEffect, useRef } from 'react';

interface GlowEffectProps {
  children: React.ReactNode;
  className?: string;
  glowColor?: string; // Add support for custom glow colors
}

const GlowEffect: React.FC<GlowEffectProps> = ({ children, className = '', glowColor = '#F3BA2F' }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    const glow = glowRef.current;

    if (!container || !glow) return;

    // Set the data attribute for the GlowyCursor component to use
    container.setAttribute('data-glow-color', glowColor);

    // Convert hex color to RGB for rgba usage
    const hexToRgb = (hex: string) => {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
      } : { r: 139, g: 92, b: 246 }; // Default purple if conversion fails
    };

    const rgb = hexToRgb(glowColor);

    const handleMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      // Update glow position with custom color
      glow.style.background = `radial-gradient(circle at ${x}px ${y}px, rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.15), transparent 50%)`;

      // Add subtle border glow with custom color
      container.style.boxShadow = `0 0 20px rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.3)`;
      container.style.borderColor = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.5)`;
    };

    const handleMouseLeave = () => {
      // Reset glow
      glow.style.background = 'transparent';

      // Reset border
      container.style.boxShadow = '';
      container.style.borderColor = '';
    };

    container.addEventListener('mousemove', handleMouseMove);
    container.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      container.removeEventListener('mousemove', handleMouseMove);
      container.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [glowColor]);

  return (
    <div
      ref={containerRef}
      className={`relative transition-all duration-300 ${className}`}
      data-glow-color={glowColor}
    >
      <div
        ref={glowRef}
        className="absolute inset-0 pointer-events-none transition-all duration-200"
      />
      {children}
    </div>
  );
};

export default GlowEffect;
