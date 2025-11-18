import React, { useEffect, useState } from 'react';

interface GlowyCursorProps {
  colors?: string[];
}

const GlowyCursor: React.FC<GlowyCursorProps> = ({
  colors = ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#ec4899']
}) => {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [visible, setVisible] = useState(false);
  const [activeColor, setActiveColor] = useState(colors[0]);
  const [hoveredElement, setHoveredElement] = useState<Element | null>(null);

  useEffect(() => {
    // Add class to body to enable custom cursor styles
    document.body.classList.add('using-custom-cursor');

    const updatePosition = (e: MouseEvent) => {
      setPosition({ x: e.clientX, y: e.clientY });

      // Check if we're hovering over a glowable element
      const target = document.elementFromPoint(e.clientX, e.clientY);
      if (target) {
        const glowableElement = target.closest('.card, .bg-slate-800, .bg-slate-900, .rounded-lg, .rounded-xl, .card-glow');
        setHoveredElement(glowableElement);

        // If we're hovering over a glowable element, get its data-glow-color attribute or use a random color
        if (glowableElement) {
          const dataColor = glowableElement.getAttribute('data-glow-color');
          if (dataColor) {
            setActiveColor(dataColor);
          } else {
            // Assign a random color from our colors array
            const randomColor = colors[Math.floor(Math.random() * colors.length)];
            setActiveColor(randomColor);
            // Store the color so it stays consistent for this element
            glowableElement.setAttribute('data-glow-color', randomColor);
          }
        } else {
          // Reset to default color when not over a glowable element
          setActiveColor(colors[0]);
        }
      } else {
        setHoveredElement(null);
      }
    };

    const handleMouseEnter = () => setVisible(true);
    const handleMouseLeave = () => setVisible(false);

    window.addEventListener('mousemove', updatePosition);
    document.addEventListener('mouseenter', handleMouseEnter);
    document.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      window.removeEventListener('mousemove', updatePosition);
      document.removeEventListener('mouseenter', handleMouseEnter);
      document.removeEventListener('mouseleave', handleMouseLeave);
      document.body.classList.remove('using-custom-cursor');
    };
  }, [colors]);

  if (!visible) return null;

  return (
    <>
      {/* Outer glow effect */}
      <div
        className="fixed pointer-events-none z-50 rounded-full mix-blend-screen"
        style={{
          left: `${position.x}px`,
          top: `${position.y}px`,
          transform: 'translate(-50%, -50%)',
          width: hoveredElement ? '150px' : '40px',
          height: hoveredElement ? '150px' : '40px',
          background: `radial-gradient(circle, ${activeColor}80 0%, rgba(255,255,255,0) 70%)`,
          opacity: hoveredElement ? 0.6 : 0.3,
          transition: 'width 0.3s ease, height 0.3s ease, opacity 0.3s ease, background 0.3s ease',
          filter: 'blur(8px)',
        }}
      />

      {/* Middle glow effect */}
      <div
        className="fixed pointer-events-none z-50 rounded-full mix-blend-screen"
        style={{
          left: `${position.x}px`,
          top: `${position.y}px`,
          transform: 'translate(-50%, -50%)',
          width: hoveredElement ? '80px' : '20px',
          height: hoveredElement ? '80px' : '20px',
          background: `radial-gradient(circle, ${activeColor}90 0%, rgba(255,255,255,0) 70%)`,
          opacity: hoveredElement ? 0.8 : 0.5,
          transition: 'width 0.3s ease, height 0.3s ease, opacity 0.3s ease, background 0.3s ease',
          filter: 'blur(4px)',
        }}
      />

      {/* Inner cursor dot */}
      <div
        className="fixed pointer-events-none z-50 rounded-full"
        style={{
          left: `${position.x}px`,
          top: `${position.y}px`,
          transform: 'translate(-50%, -50%)',
          width: hoveredElement ? '12px' : '8px',
          height: hoveredElement ? '12px' : '8px',
          background: activeColor,
          opacity: 0.9,
          transition: 'width 0.2s ease, height 0.2s ease, background 0.3s ease',
          boxShadow: `0 0 10px ${activeColor}`,
        }}
      />

      {/* Center dot */}
      <div
        className="fixed pointer-events-none z-50 rounded-full bg-white"
        style={{
          left: `${position.x}px`,
          top: `${position.y}px`,
          transform: 'translate(-50%, -50%)',
          width: '4px',
          height: '4px',
          opacity: 0.9,
        }}
      />
    </>
  );
};

export default GlowyCursor;
