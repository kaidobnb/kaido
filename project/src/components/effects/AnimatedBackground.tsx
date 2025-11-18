import React, { useEffect, useRef } from 'react';

const AnimatedBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Force immediate resize to ensure canvas is properly sized
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    // Set canvas to full screen
    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', handleResize);
    handleResize();

    // Create trading chart-like lines
    class ChartLine {
      points: {x: number, y: number}[];
      color: string;
      width: number;
      opacity: number;
      speed: number;
      type: 'candlestick' | 'line' | 'area';
      candles: {open: number, close: number, high: number, low: number, x: number}[];
      chartHeight: number;
      yOffset: number;

      constructor(startX: number, startY: number, chartType?: 'candlestick' | 'line' | 'area') {
        this.points = [{ x: startX, y: startY }];
        this.color = this.getRandomColor();
        this.width = Math.random() * 1.5 + 0.5; // Thinner lines
        this.opacity = Math.random() * 0.4 + 0.1; // Lower opacity
        this.speed = Math.random() * 0.4 + 0.1; // Slower speed
        this.type = chartType || (Math.random() > 0.5 ? 'line' : 'candlestick');
        this.candles = [];
        this.chartHeight = Math.random() * 150 + 100; // Random chart height
        this.yOffset = Math.random() * (canvas.height - this.chartHeight - 100) + 50; // Random vertical position

        // Generate initial points with more realistic price movements
        let currentX = startX;
        let prevY = startY;
        let trend = 0;
        let trendDuration = Math.floor(Math.random() * 10) + 5; // Random trend duration
        let trendCounter = 0;

        for (let i = 0; i < 100; i++) {
          currentX += 20; // Wider spacing

          // Create more realistic price movements with trends
          trendCounter++;
          if (trendCounter >= trendDuration) {
            trend = (Math.random() - 0.5) * 2; // Change trend direction
            trendDuration = Math.floor(Math.random() * 10) + 5; // New random trend duration
            trendCounter = 0;
          }

          // Add some randomness but follow the trend
          const randomFactor = (Math.random() - 0.5) * 8;
          const trendFactor = trend * 3;
          const newY = prevY + randomFactor + trendFactor;

          // Ensure it stays within the chart's bounds
          const boundedY = Math.max(
            this.yOffset,
            Math.min(this.yOffset + this.chartHeight, newY)
          );

          this.points.push({ x: currentX, y: boundedY });

          // Create candle data if this is a candlestick chart
          if (this.type === 'candlestick' && i % 4 === 0) {
            const open = boundedY;
            const close = boundedY + (Math.random() - 0.5) * 15;
            const boundedClose = Math.max(
              this.yOffset,
              Math.min(this.yOffset + this.chartHeight, close)
            );
            const high = Math.min(open, boundedClose) - Math.random() * 8;
            const low = Math.max(open, boundedClose) + Math.random() * 8;

            const boundedHigh = Math.max(this.yOffset, high);
            const boundedLow = Math.min(this.yOffset + this.chartHeight, low);

            this.candles.push({
              open,
              close: boundedClose,
              high: boundedHigh,
              low: boundedLow,
              x: currentX
            });
          }

          prevY = boundedY;
        }
      }

      getRandomColor() {
        // BNB-themed trading chart colors
        const colors = ['#F3BA2F', '#FCD34D', '#FBBF24', '#F59E0B'];
        return colors[Math.floor(Math.random() * colors.length)];
      }

      update() {
        // Move points to the left (slower)
        for (let i = 0; i < this.points.length; i++) {
          this.points[i].x -= this.speed;
        }

        // Update candles if this is a candlestick chart
        if (this.type === 'candlestick') {
          for (let i = 0; i < this.candles.length; i++) {
            this.candles[i].x -= this.speed;
          }

          // Remove off-screen candles
          if (this.candles.length > 0 && this.candles[0].x < -20) {
            this.candles.shift();
          }
        }

        // Remove points that are off-screen
        if (this.points[0].x < -20) {
          this.points.shift();
        }

        // Add new point at the right (less frequently)
        if (this.points.length > 0) {
          const lastPoint = this.points[this.points.length - 1];
          if (lastPoint.x < canvas.width + 20) {
            // More realistic price movement
            const prevY = lastPoint.y;
            const randomFactor = (Math.random() - 0.5) * 8;
            const trendFactor = (Math.random() > 0.6 ? 1 : -1) * Math.random() * 4;
            const newY = prevY + randomFactor + trendFactor;

            // Ensure it stays within the chart's bounds
            const boundedY = Math.max(
              this.yOffset,
              Math.min(this.yOffset + this.chartHeight, newY)
            );

            this.points.push({
              x: lastPoint.x + 20, // Wider spacing
              y: boundedY
            });

            // Add new candle if needed
            if (this.type === 'candlestick' && this.points.length % 4 === 0) {
              const open = boundedY;
              const close = boundedY + (Math.random() - 0.5) * 15;
              const boundedClose = Math.max(
                this.yOffset,
                Math.min(this.yOffset + this.chartHeight, close)
              );
              const high = Math.min(open, boundedClose) - Math.random() * 8;
              const low = Math.max(open, boundedClose) + Math.random() * 8;

              const boundedHigh = Math.max(this.yOffset, high);
              const boundedLow = Math.min(this.yOffset + this.chartHeight, low);

              this.candles.push({
                open,
                close: boundedClose,
                high: boundedHigh,
                low: boundedLow,
                x: lastPoint.x + 20
              });
            }
          }
        }
      }

      draw() {
        if (!ctx) return;

        if (this.type === 'line') {
          // Draw line chart
          if (this.points.length < 2) return;

          ctx.beginPath();
          ctx.moveTo(this.points[0].x, this.points[0].y);

          for (let i = 1; i < this.points.length; i++) {
            ctx.lineTo(this.points[i].x, this.points[i].y);
          }

          ctx.strokeStyle = this.color;
          ctx.lineWidth = this.width;
          ctx.globalAlpha = this.opacity;
          ctx.stroke();

          // Add subtle volume bars below the line
          ctx.globalAlpha = this.opacity * 0.3;
          for (let i = 1; i < this.points.length; i += 4) {
            const volumeHeight = Math.random() * 15 + 5;
            ctx.fillStyle = this.color;
            ctx.fillRect(
              this.points[i].x - 2,
              this.yOffset + this.chartHeight + 5,
              4,
              -volumeHeight
            );
          }

          ctx.globalAlpha = 1;
        } else if (this.type === 'area') {
          // Draw area chart
          if (this.points.length < 2) return;

          ctx.beginPath();
          ctx.moveTo(this.points[0].x, this.points[0].y);

          for (let i = 1; i < this.points.length; i++) {
            ctx.lineTo(this.points[i].x, this.points[i].y);
          }

          // Complete the area by drawing to the bottom
          ctx.lineTo(this.points[this.points.length - 1].x, this.yOffset + this.chartHeight);
          ctx.lineTo(this.points[0].x, this.yOffset + this.chartHeight);
          ctx.closePath();

          const gradient = ctx.createLinearGradient(0, this.yOffset, 0, this.yOffset + this.chartHeight);
          gradient.addColorStop(0, this.color);
          gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

          ctx.fillStyle = gradient;
          ctx.globalAlpha = this.opacity * 0.3;
          ctx.fill();

          // Draw the line on top
          ctx.beginPath();
          ctx.moveTo(this.points[0].x, this.points[0].y);
          for (let i = 1; i < this.points.length; i++) {
            ctx.lineTo(this.points[i].x, this.points[i].y);
          }
          ctx.strokeStyle = this.color;
          ctx.lineWidth = this.width;
          ctx.globalAlpha = this.opacity;
          ctx.stroke();

          ctx.globalAlpha = 1;
        } else {
          // Draw candlestick chart
          ctx.globalAlpha = this.opacity;

          // Draw candles
          for (const candle of this.candles) {
            const isGreen = candle.close < candle.open;
            const candleColor = isGreen ? '#10b981' : '#ef4444';

            // Draw the wick (high to low)
            ctx.beginPath();
            ctx.moveTo(candle.x, candle.high);
            ctx.lineTo(candle.x, candle.low);
            ctx.strokeStyle = candleColor;
            ctx.lineWidth = 1;
            ctx.stroke();

            // Draw the body (open to close)
            const bodyHeight = Math.abs(candle.open - candle.close);
            const bodyY = Math.min(candle.open, candle.close);

            ctx.fillStyle = candleColor;
            ctx.fillRect(candle.x - 3, bodyY, 6, bodyHeight || 1); // Ensure at least 1px height
          }

          // Draw volume bars below candlesticks
          ctx.globalAlpha = this.opacity * 0.3;
          for (let i = 0; i < this.candles.length; i++) {
            const candle = this.candles[i];
            const volumeHeight = Math.random() * 15 + 5;
            const isGreen = candle.close < candle.open;
            const volumeColor = isGreen ? '#10b981' : '#ef4444';

            ctx.fillStyle = volumeColor;
            ctx.fillRect(
              candle.x - 3,
              this.yOffset + this.chartHeight + 5,
              6,
              -volumeHeight
            );
          }

          ctx.globalAlpha = 1;
        }

        // Draw price axis labels
        ctx.globalAlpha = 0.3;
        ctx.font = '10px Arial';
        ctx.fillStyle = '#ffffff';

        // Draw min and max price labels
        const maxPrice = Math.floor(1000 + Math.random() * 9000);
        const minPrice = Math.floor(maxPrice * (0.7 + Math.random() * 0.2));

        ctx.fillText(`$${maxPrice}`, 5, this.yOffset + 10);
        ctx.fillText(`$${minPrice}`, 5, this.yOffset + this.chartHeight - 5);

        // Draw time labels
        const now = new Date();
        const timeStr = now.getHours() + ':' + now.getMinutes().toString().padStart(2, '0');
        ctx.fillText(timeStr, this.points[this.points.length - 1].x - 20, this.yOffset + this.chartHeight + 15);

        ctx.globalAlpha = 1;
      }
    }

    // Create chart lines (only chart lines, no particles)
    const chartLines: ChartLine[] = [];

    // Create a mix of chart types
    // 1. Create some candlestick charts
    for (let i = 0; i < 3; i++) {
      const startX = Math.random() * canvas.width;
      const startY = Math.random() * (canvas.height * 0.7) + (canvas.height * 0.15);
      chartLines.push(new ChartLine(startX, startY, 'candlestick'));
    }

    // 2. Create some line charts
    for (let i = 0; i < 3; i++) {
      const startX = Math.random() * canvas.width;
      const startY = Math.random() * (canvas.height * 0.7) + (canvas.height * 0.15);
      chartLines.push(new ChartLine(startX, startY, 'line'));
    }

    // 3. Create some area charts
    for (let i = 0; i < 2; i++) {
      const startX = Math.random() * canvas.width;
      const startY = Math.random() * (canvas.height * 0.7) + (canvas.height * 0.15);
      chartLines.push(new ChartLine(startX, startY, 'area'));
    }

    // Create grid pattern
    const drawGrid = () => {
      if (!ctx) return;

      const gridSize = 50;
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)'; // More subtle grid
      ctx.lineWidth = 0.5; // Thinner lines

      // Vertical lines
      for (let x = 0; x < canvas.width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }

      // Horizontal lines
      for (let y = 0; y < canvas.height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }
    };

    // Animation loop
    const animate = () => {
      if (!ctx) return;

      // Clear canvas with semi-transparent background to create trail effect
      ctx.fillStyle = 'rgba(0, 0, 0, 0.9)'; // Black background to match theme
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw grid
      drawGrid();

      // Update and draw chart lines
      chartLines.forEach(line => {
        line.update();
        line.draw();
      });

      requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed top-0 left-0 w-full h-full z-0 pointer-events-none"
      style={{ opacity: 0.7, mixBlendMode: 'lighten' }} // Reduced opacity
    />
  );
};

export default AnimatedBackground;
