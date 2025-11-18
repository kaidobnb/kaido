import React, { useState, useEffect, useRef } from 'react';

interface TokenomicsItem {
  category: string;
  percentage: number;
  color: string;
  description?: string;
  vesting?: string;
}

interface AnimatedPieChartProps {
  data: TokenomicsItem[];
  size?: number;
  strokeWidth?: number;
  animationDuration?: number;
  hoverEffect?: boolean;
  onSegmentHover?: (item: TokenomicsItem | null) => void;
  onSegmentClick?: (item: TokenomicsItem) => void;
}

const AnimatedPieChart: React.FC<AnimatedPieChartProps> = ({
  data,
  size = 400,
  strokeWidth = 60,
  animationDuration = 1000,
  hoverEffect = true,
  onSegmentHover,
  onSegmentClick
}) => {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [animationProgress, setAnimationProgress] = useState(0);
  const [isAnimating, setIsAnimating] = useState(true);
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerSize, setContainerSize] = useState(size);

  // Calculate total for percentages
  const total = data.reduce((sum, item) => sum + item.percentage, 0);

  // Calculate center and radius
  const center = containerSize / 2;
  const radius = center - strokeWidth / 2;

  // Handle window resize for responsiveness
  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        const parent = containerRef.current.parentElement;
        if (parent) {
          // Get the smaller of parent width or original size
          const newSize = Math.min(parent.clientWidth - 40, size);
          setContainerSize(newSize);
        }
      }
    };

    // Initial size calculation
    handleResize();

    // Add resize listener
    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [size]);

  // Initial animation effect
  useEffect(() => {
    const startTime = Date.now();
    setIsAnimating(true);

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / animationDuration, 1);
      setAnimationProgress(progress);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setIsAnimating(false);
      }
    };

    requestAnimationFrame(animate);
  }, [animationDuration]);

  // Calculate SVG paths for pie segments
  const createPieSegments = () => {
    let segments = [];
    let currentAngle = 0;

    for (let i = 0; i < data.length; i++) {
      const item = data[i];
      const angle = (item.percentage / total) * 360 * animationProgress;

      // Calculate path coordinates
      const startX = center + radius * Math.sin(Math.PI * 2 * currentAngle / 360);
      const startY = center - radius * Math.cos(Math.PI * 2 * currentAngle / 360);

      const endX = center + radius * Math.sin(Math.PI * 2 * (currentAngle + angle) / 360);
      const endY = center - radius * Math.cos(Math.PI * 2 * (currentAngle + angle) / 360);

      // Determine if the arc should be drawn the long way around
      const largeArcFlag = angle > 180 ? 1 : 0;

      // Create SVG path
      const path = `
        M ${center} ${center}
        L ${startX} ${startY}
        A ${radius} ${radius} 0 ${largeArcFlag} 1 ${endX} ${endY}
        Z
      `;

      // Calculate midpoint angle for label positioning
      const midAngle = currentAngle + (angle / 2);
      const labelRadius = radius * 0.7;
      const labelX = center + labelRadius * Math.sin(Math.PI * 2 * midAngle / 360);
      const labelY = center - labelRadius * Math.cos(Math.PI * 2 * midAngle / 360);

      // Add segment to array
      segments.push({
        path,
        color: item.color,
        index: i,
        item,
        startAngle: currentAngle,
        endAngle: currentAngle + angle,
        labelX,
        labelY,
        midAngle
      });

      // Update current angle for next segment
      currentAngle += angle;
    }

    return segments;
  };

  // Handle mouse events for enhanced hover effects
  const handleMouseEnter = (index: number) => {
    if (hoverEffect) {
      setActiveIndex(index);

      // Add a subtle animation to the segment
      const svgElement = svgRef.current;
      if (svgElement) {
        const segmentPaths = svgElement.querySelectorAll('path');
        if (segmentPaths[index * 2 + 1]) {
          const segmentPath = segmentPaths[index * 2 + 1] as SVGPathElement;
          segmentPath.style.transform = 'scale(1.05)';
          segmentPath.style.transformOrigin = 'center';
          segmentPath.style.transition = 'transform 0.3s ease-out';
          segmentPath.style.filter = `drop-shadow(0 0 5px ${data[index].color}80)`;
        }
      }

      if (onSegmentHover) {
        onSegmentHover(data[index]);
      }
    }
  };

  const handleMouseLeave = () => {
    if (hoverEffect) {
      const prevIndex = activeIndex;
      setActiveIndex(null);

      // Reset the animation
      if (prevIndex !== null) {
        const svgElement = svgRef.current;
        if (svgElement) {
          const segmentPaths = svgElement.querySelectorAll('path');
          if (segmentPaths[prevIndex * 2 + 1]) {
            const segmentPath = segmentPaths[prevIndex * 2 + 1] as SVGPathElement;
            segmentPath.style.transform = selectedIndex === prevIndex ? 'scale(1.08)' : 'scale(1)';
            segmentPath.style.transition = 'transform 0.3s ease-in';
            segmentPath.style.filter = selectedIndex === prevIndex ?
              `drop-shadow(0 0 8px ${data[prevIndex].color}80)` : 'none';
          }
        }
      }

      if (onSegmentHover) {
        onSegmentHover(null);
      }
    }
  };

  // Handle click events with enhanced feedback and improved interactivity
  const handleClick = (index: number) => {
    // Toggle selection state
    const newSelectedIndex = selectedIndex === index ? null : index;
    setSelectedIndex(newSelectedIndex);

    // Provide visual feedback with a brief animation
    if (newSelectedIndex !== null) {
      const segment = segments[index];
      const svgElement = svgRef.current;

      if (svgElement) {
        // Create a pulse effect
        const pulseElement = document.createElement('div');
        pulseElement.className = 'absolute rounded-full animate-ping z-20';
        pulseElement.style.backgroundColor = `${segment.color}40`;
        pulseElement.style.width = `${containerSize * 0.8}px`;
        pulseElement.style.height = `${containerSize * 0.8}px`;
        pulseElement.style.left = `${containerSize * 0.1}px`;
        pulseElement.style.top = `${containerSize * 0.1}px`;
        pulseElement.style.animationDuration = '0.8s';
        pulseElement.style.animationIterationCount = '1';

        // Add to container and remove after animation
        if (containerRef.current) {
          containerRef.current.appendChild(pulseElement);
          setTimeout(() => {
            if (containerRef.current && containerRef.current.contains(pulseElement)) {
              containerRef.current.removeChild(pulseElement);
            }
          }, 800);
        }

        // Create a "pop" effect on the segment
        const segmentPaths = svgElement.querySelectorAll('path');
        if (segmentPaths[index * 2 + 1]) {
          const segmentPath = segmentPaths[index * 2 + 1] as SVGPathElement;
          const originalTransform = segmentPath.style.transform;

          // Apply a quick scale animation
          segmentPath.style.transform = `scale(1.15)`;
          segmentPath.style.transformOrigin = 'center';
          segmentPath.style.transition = 'transform 0.2s ease-out';

          // Return to original state
          setTimeout(() => {
            segmentPath.style.transform = originalTransform;
            segmentPath.style.transition = 'transform 0.3s ease-in-out';
          }, 200);
        }
      }
    }

    // Call the callback
    if (onSegmentClick) {
      onSegmentClick(data[index]);

      // Scroll to the tokenomics details if they're below the fold
      const detailsElement = document.querySelector('.tokenomics-details');
      if (detailsElement) {
        const rect = detailsElement.getBoundingClientRect();
        if (rect.top < 0 || rect.bottom > window.innerHeight) {
          detailsElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }
    }
  };

  // Create segments
  const segments = createPieSegments();

  // Calculate dynamic stroke width based on container size
  const dynamicStrokeWidth = Math.max(containerSize * 0.15, 30);

  return (
    <div
      ref={containerRef}
      className="relative mx-auto"
      style={{ width: containerSize, height: containerSize }}
    >
      <svg
        ref={svgRef}
        width={containerSize}
        height={containerSize}
        viewBox={`0 0 ${containerSize} ${containerSize}`}
        className="transform -rotate-90"
      >
        {/* Background circle */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="#1e293b"
          strokeWidth={dynamicStrokeWidth}
          className="opacity-30"
        />

        {/* Pie segments */}
        {segments.map((segment, index) => {
          const isActive = activeIndex === segment.index;
          const isSelected = selectedIndex === segment.index;
          const scale = isActive ? 1.05 : isSelected ? 1.08 : 1;
          const opacity = isActive || isSelected ? 1 : 0.9;
          const zIndex = isActive || isSelected ? 10 : 1;

          return (
            <g key={index} style={{ zIndex }}>
              {/* Segment shadow for depth effect */}
              <path
                d={segment.path}
                fill="rgba(0,0,0,0.3)"
                className="transition-all duration-300"
                style={{
                  transform: `scale(${scale * 0.98})`,
                  transformOrigin: 'center',
                  opacity: isActive || isSelected ? 0.5 : 0,
                  filter: 'blur(4px)',
                }}
              />

              {/* Main segment with enhanced interactivity */}
              <path
                d={segment.path}
                fill={segment.color}
                stroke={segment.color}
                strokeWidth={1}
                className="transition-all duration-300 cursor-pointer"
                onMouseEnter={() => handleMouseEnter(segment.index)}
                onMouseLeave={handleMouseLeave}
                onClick={() => handleClick(segment.index)}
                style={{
                  transform: `scale(${scale})`,
                  transformOrigin: 'center',
                  opacity,
                  filter: isActive || isSelected ? `drop-shadow(0 0 8px ${segment.color}80)` : 'none',
                }}
              />

              {/* Hover indicator - only shows on hover */}
              {isActive && !isSelected && (
                <g className="pointer-events-none">
                  <circle
                    cx={segment.labelX}
                    cy={segment.labelY}
                    r={8}
                    fill={segment.color}
                    className="animate-pulse"
                  />
                  <text
                    x={segment.labelX}
                    y={segment.labelY}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fill="white"
                    fontSize="10"
                    fontWeight="bold"
                  >
                    +
                  </text>
                </g>
              )}

              {/* Segment label for all segments */}
              <text
                x={segment.labelX}
                y={segment.labelY}
                textAnchor="middle"
                dominantBaseline="middle"
                className="text-xs font-medium pointer-events-none select-none transform rotate-90"
                fill="#ffffff"
                style={{
                  opacity: isActive || isSelected ? 1 : 0.85,
                  transition: 'all 0.3s ease',
                  textShadow: '0 1px 3px rgba(0,0,0,0.7)',
                  fontSize: segment.endAngle - segment.startAngle > 30 ? '0.85rem' : '0.7rem',
                  fontWeight: isActive || isSelected ? 'bold' : 'normal',
                }}
              >
                {segment.item.percentage}%
              </text>

              {/* Category label for larger segments */}
              {segment.endAngle - segment.startAngle > 45 && (
                <text
                  x={segment.labelX}
                  y={segment.labelY + 20}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  className="text-xs pointer-events-none select-none transform rotate-90"
                  fill="#ffffff"
                  style={{
                    opacity: isActive || isSelected ? 0.9 : 0.6,
                    transition: 'all 0.3s ease',
                    textShadow: '0 1px 3px rgba(0,0,0,0.7)',
                    fontSize: '0.65rem',
                  }}
                >
                  {segment.item.category}
                </text>
              )}


            </g>
          );
        })}

        {/* Center circle with gradient */}
        <defs>
          <radialGradient id="centerGradient" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
            <stop offset="0%" stopColor="#1e293b" />
            <stop offset="100%" stopColor="#0f172a" />
          </radialGradient>
        </defs>

        <circle
          cx={center}
          cy={center}
          r={radius - dynamicStrokeWidth}
          fill="url(#centerGradient)"
          className="opacity-90"
          stroke="rgba(255, 255, 255, 0.1)"
          strokeWidth={1}
        />

        {/* Animated rings */}
        <circle
          cx={center}
          cy={center}
          r={radius - dynamicStrokeWidth / 2}
          fill="none"
          stroke="rgba(255, 255, 255, 0.05)"
          strokeWidth={1}
          className="animate-pulse"
          style={{ animationDuration: '3s' }}
        />

        <circle
          cx={center}
          cy={center}
          r={radius - dynamicStrokeWidth / 4}
          fill="none"
          stroke="rgba(255, 255, 255, 0.03)"
          strokeWidth={1}
          className="animate-pulse"
          style={{ animationDuration: '5s' }}
        />

        {/* Animated dots around the circle */}
        {Array.from({ length: 12 }).map((_, i) => {
          const angle = (i * 30) * Math.PI / 180;
          const dotRadius = radius - dynamicStrokeWidth / 2;
          const x = center + dotRadius * Math.cos(angle);
          const y = center + dotRadius * Math.sin(angle);

          return (
            <circle
              key={`dot-${i}`}
              cx={x}
              cy={y}
              r={2}
              fill="white"
              className="animate-pulse"
              style={{
                animationDuration: `${2 + i * 0.2}s`,
                opacity: 0.3 + (i % 3) * 0.1
              }}
            />
          );
        })}
      </svg>

      {/* Center content with subtle interactive indicator - no rotation to keep text upright */}
      <div
        className="absolute inset-0 flex items-center justify-center"
        style={{ padding: dynamicStrokeWidth }}
      >
        <div className="text-center relative">
          <div className="absolute -inset-4 rounded-full border border-white/10 animate-pulse"></div>
          <h3 className="text-white font-bold" style={{ fontSize: `${containerSize * 0.06}px` }}>KAIDO</h3>
          <p className="text-slate-300" style={{ fontSize: `${containerSize * 0.03}px` }}>Token</p>
        </div>
      </div>

      {/* Animated pulse effect */}
      {isAnimating && (
        <div className="absolute inset-0 rounded-full animate-ping"
          style={{
            backgroundColor: 'rgba(139, 92, 246, 0.1)',
            animationDuration: '1.5s',
            animationIterationCount: 3
          }}
        />
      )}

      {/* Interaction hint */}
      <div className="absolute bottom-0 left-0 right-0 text-center text-xs text-slate-400 opacity-70">
        Click segments for details
      </div>
    </div>
  );
};

export default AnimatedPieChart;
