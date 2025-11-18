import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Globe,
  MessageCircle,
  TrendingUp,
  Users,
  BookOpen,
  Wallet,
  DollarSign,
  Zap,
  Send
} from 'lucide-react';
import GlowEffect from '../components/effects/GlowEffect';
import Button from '../components/ui/Button';
import XLogo from '../components/icons/XLogo';

interface LinkItem {
  title: string;
  description: string;
  url: string;
  icon: React.ReactNode;
  color: string;
  badge?: {
    text: string;
    color: string;
  };
}

const LinktreePage: React.FC = () => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [animatedBg, setAnimatedBg] = useState<boolean>(true);

  // Links data
  const links: LinkItem[] = [
    {
      title: 'Kaido Platform',
      description: 'AI-powered prediction markets on BNB Smart Chain',
      url: '/',
      icon: <Globe className="h-6 w-6" />,
      color: '#f59e0b' // Yellow
    },
    {
      title: 'Predictions',
      description: 'Explore active prediction markets',
      url: '/predictions',
      icon: <TrendingUp className="h-6 w-6" />,
      color: '#3b82f6' // Blue
    },
    {
      title: 'Ask Kaido AI',
      description: 'Chat with our AI prediction assistant',
      url: '/?openChat=true',
      icon: <MessageCircle className="h-6 w-6" />,
      color: '#10b981' // Green
    },
    {
      title: 'Referrals',
      description: 'Earn 2% BNB rewards by inviting friends',
      url: '/referrals',
      icon: <Users className="h-6 w-6" />,
      color: '#6366f1', // Indigo
      badge: {
        text: 'HOT',
        color: '#f97316' // Orange
      }
    },
    {
      title: 'Documentation',
      description: 'Learn how to use Kaido',
      url: '/docs',
      icon: <BookOpen className="h-6 w-6" />,
      color: '#ef4444' // Red
    },
    {
      title: 'FAQ',
      description: 'Frequently asked questions',
      url: '/faq',
      icon: <DollarSign className="h-6 w-6" />,
      color: '#0ea5e9' // Sky
    }
  ];

  // Social links
  const socialLinks = [
    { name: 'X (Twitter)', url: 'https://x.com/kaidobnb', icon: <XLogo className="h-5 w-5" /> },
    { name: 'Telegram', url: 'https://t.me/kaido', icon: <Send className="h-5 w-5" /> }
  ];

  // Background animation effect
  useEffect(() => {
    if (!animatedBg) return;

    const canvas = document.getElementById('linktree-bg') as HTMLCanvasElement;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas to full size
    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', handleResize);
    handleResize();

    // Create particles
    const particles: {
      x: number;
      y: number;
      radius: number;
      color: string;
      speedX: number;
      speedY: number;
    }[] = [];

    const colors = ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ec4899', '#6366f1'];

    for (let i = 0; i < 50; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        radius: Math.random() * 2 + 0.5,
        color: colors[Math.floor(Math.random() * colors.length)],
        speedX: (Math.random() - 0.5) * 0.3,
        speedY: (Math.random() - 0.5) * 0.3
      });
    }

    // Animation loop
    const animate = () => {
      if (!ctx || !animatedBg) return;

      // Clear canvas with semi-transparent background
      ctx.fillStyle = 'rgba(15, 23, 42, 0.05)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Update and draw particles
      particles.forEach(particle => {
        // Update position
        particle.x += particle.speedX;
        particle.y += particle.speedY;

        // Wrap around edges
        if (particle.x < 0) particle.x = canvas.width;
        if (particle.x > canvas.width) particle.x = 0;
        if (particle.y < 0) particle.y = canvas.height;
        if (particle.y > canvas.height) particle.y = 0;

        // Draw particle
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
        ctx.fillStyle = particle.color;
        ctx.fill();
      });

      requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [animatedBg]);

  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center py-12 px-4 relative overflow-hidden">
      {/* Animated background */}
      <canvas
        id="linktree-bg"
        className="fixed top-0 left-0 w-full h-full z-0 pointer-events-none"
        style={{ opacity: 0.7, mixBlendMode: 'lighten' }}
      />

      {/* Background glow effects */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden">
        <div className="absolute top-10 left-10 w-96 h-96 bg-purple-600/5 rounded-full filter blur-3xl animate-pulse-slow"></div>
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-blue-600/5 rounded-full filter blur-3xl animate-pulse-slow" style={{ animationDelay: '4s' }}></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-indigo-600/3 rounded-full filter blur-3xl animate-pulse-slow" style={{ animationDelay: '8s' }}></div>
      </div>

      {/* Content container */}
      <div className="container max-w-3xl mx-auto z-10 relative">
        {/* Logo and header */}
        <div className="flex flex-col items-center mb-12">
          <div className="w-24 h-24 flex items-center justify-center mb-6 border-4 border-yellow-500/30 shadow-lg shadow-yellow-500/20 rounded-full bg-black/20">
            <img src="/kaido.png" alt="Kaido Logo" className="w-20 h-20 rounded-full" />
          </div>
          <h1 className="handwritten text-4xl md:text-5xl text-white mb-2 text-center">
            Kaido
          </h1>
          <p className="text-slate-300 text-lg md:text-xl text-center max-w-md">
            AI-powered prediction markets on BNB Smart Chain
          </p>
        </div>

        {/* Links */}
        <div className="grid gap-4 mb-12">
          {links.map((link, index) => (
            <GlowEffect key={index} glowColor={link.color}>
              <Link
                to={link.url}
                className="block"
                onMouseEnter={() => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
              >
                <div className="bg-slate-800/80 backdrop-blur-sm border border-slate-700 rounded-xl p-4 flex items-center transition-all duration-300 hover:translate-x-1">
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center mr-4 flex-shrink-0"
                    style={{
                      background: `linear-gradient(135deg, ${link.color}40, ${link.color}10)`,
                      border: `1px solid ${link.color}30`
                    }}
                  >
                    {React.cloneElement(link.icon, {
                      className: `h-6 w-6 text-${link.color}`,
                      style: { color: link.color }
                    })}
                  </div>
                  <div className="flex-grow">
                    <div className="flex items-center">
                      <h3 className="text-white font-medium text-lg">{link.title}</h3>
                      {link.badge && (
                        <span
                          className="ml-2 px-1.5 py-0.5 text-xs font-bold rounded-md"
                          style={{
                            backgroundColor: `${link.badge.color}30`,
                            color: link.badge.color,
                            border: `1px solid ${link.badge.color}50`
                          }}
                        >
                          {link.badge.text}
                        </span>
                      )}
                    </div>
                    <p className="text-slate-400 text-sm">{link.description}</p>
                  </div>
                  <ArrowRight
                    className={`h-5 w-5 text-slate-400 transition-all duration-300 ${
                      hoveredIndex === index ? 'transform translate-x-1 text-white' : ''
                    }`}
                  />
                </div>
              </Link>
            </GlowEffect>
          ))}
        </div>

        {/* Social links */}
        <div className="flex justify-center space-x-6 mb-8">
          {socialLinks.map((social, index) => (
            <a
              key={index}
              href={social.url}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-slate-800 hover:bg-slate-700 p-3 rounded-full transition-all duration-300 hover:scale-110 border border-slate-700 hover:border-purple-500/50 hover:shadow-lg hover:shadow-purple-500/20"
            >
              {React.cloneElement(social.icon, { className: "h-5 w-5 text-purple-400" })}
            </a>
          ))}
        </div>

        {/* Launch app button */}
        <div className="flex justify-center">
          <Button
            variant="primary"
            size="lg"
            className="px-8 py-3 text-lg handwritten"
            onClick={() => window.location.href = '/'}
          >
            <Zap className="h-5 w-5 mr-2" />
            Launch App
          </Button>
        </div>

        {/* Footer */}
        <div className="mt-12 text-center">
          <p className="text-slate-500 text-sm">© 2025 Kaido. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
};

export default LinktreePage;
