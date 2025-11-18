import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Send } from 'lucide-react';
import XLogo from '../icons/XLogo';

const Footer: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleNavigation = (path: string) => {
    navigate(path);
  };

  // Only show footer on homepage
  if (location.pathname !== '/') {
    return null;
  }

  return (
    <footer className="bg-black border-t border-yellow-500 py-3 md:py-8">
      <div className="container mx-auto px-4">
        {/* Mobile: Horizontal compact layout */}
        <div className="md:hidden">
          {/* Top row: Logo + Social + Network Badge */}
          <div className="flex items-center justify-between mb-3">
            <div
              className="flex items-center cursor-pointer"
              onClick={() => handleNavigation('/')}
            >
              <div className="w-6 h-6 flex items-center justify-center mr-2">
                <img src="/kaido.png" alt="Kaido Logo" className="w-full h-full rounded-full" />
              </div>
              <span className="font-bold text-sm text-white">Kaido</span>
            </div>

            <div className="flex items-center space-x-3">
              <a href="https://x.com/kaidobnb" target="_blank" rel="noopener noreferrer" className="text-white hover:text-yellow-400 transition-colors">
                <XLogo className="h-4 w-4" />
              </a>
              <a href="https://t.me/kaido" target="_blank" rel="noopener noreferrer" className="text-white hover:text-yellow-400 transition-colors">
                <Send className="h-4 w-4" />
              </a>
            </div>
          </div>

          {/* Middle row: All links in horizontal layout */}
          <div className="flex flex-wrap gap-x-3 gap-y-1 mb-3 text-xs">
            <Link to="/" className="text-slate-400 hover:text-yellow-400">Predictions</Link>
            <span className="text-slate-600">•</span>
            <Link to="/leaderboard" className="text-slate-400 hover:text-yellow-400">Leaderboard</Link>
            <span className="text-slate-600">•</span>
            <Link to="/portfolio" className="text-slate-400 hover:text-yellow-400">Portfolio</Link>
            <span className="text-slate-600">•</span>
            <Link to="/faq" className="text-slate-400 hover:text-yellow-400">FAQ</Link>
            <span className="text-slate-600">•</span>
            <Link to="/docs" className="text-slate-400 hover:text-yellow-400">Docs</Link>
          </div>

          {/* Bottom row: Copyright + Terms & Privacy */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-800">
            <p className="text-white text-[10px]">© 2025 Kaido</p>
            <div className="flex items-center gap-2">
              <Link to="/terms" className="text-slate-400 hover:text-yellow-400 text-[10px]">Terms</Link>
              <span className="text-slate-600 text-[10px]">•</span>
              <Link to="/privacy" className="text-slate-400 hover:text-yellow-400 text-[10px]">Privacy</Link>
            </div>
          </div>
        </div>

        {/* Desktop: Original 4-column layout */}
        <div className="hidden md:block">
          <div className="grid grid-cols-4 gap-8">
            <div>
              <div
                className="flex items-center mb-4 cursor-pointer"
                onClick={() => handleNavigation('/')}
              >
                <div className="w-8 h-8 flex items-center justify-center mr-2">
                  <img src="/kaido.png" alt="Kaido Logo" className="w-full h-full rounded-full" />
                </div>
                <span className="font-bold text-xl text-white">Kaido</span>
              </div>
              <p className="text-white text-sm mb-4">
                AI-powered prediction markets on BNB Smart Chain
              </p>
              <div className="flex space-x-4">
                <a href="https://x.com/kaidobnb" target="_blank" rel="noopener noreferrer" className="text-white hover:text-yellow-400 transition-colors">
                  <XLogo className="h-5 w-5" />
                </a>
                <a href="https://t.me/kaido" target="_blank" rel="noopener noreferrer" className="text-white hover:text-yellow-400 transition-colors">
                  <Send className="h-5 w-5" />
                </a>
              </div>
            </div>

            <div>
              <h3 className="text-white font-medium mb-4 text-base">Platform</h3>
              <ul className="space-y-2">
                <li>
                  <div
                    className="text-white hover:text-yellow-400 text-sm cursor-pointer"
                    onClick={() => handleNavigation('/')}
                  >
                    Predictions
                  </div>
                </li>
                <li>
                  <div
                    className="text-white hover:text-yellow-400 text-sm cursor-pointer"
                    onClick={() => handleNavigation('/leaderboard')}
                  >
                    Leaderboard
                  </div>
                </li>
                <li>
                  <div
                    className="text-white hover:text-yellow-400 text-sm cursor-pointer"
                    onClick={() => handleNavigation('/portfolio')}
                  >
                    Portfolio
                  </div>
                </li>
                <li>
                  <div
                    className="text-white hover:text-yellow-400 text-sm cursor-pointer"
                    onClick={() => handleNavigation('/chat')}
                  >
                    Ask Kaido
                  </div>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-white font-medium mb-4 text-base">Resources</h3>
              <ul className="space-y-2">
                <li><Link to="/faq" className="text-slate-400 hover:text-yellow-400 text-sm">FAQ</Link></li>
                <li><Link to="/docs" className="text-slate-400 hover:text-yellow-400 text-sm">Documentation</Link></li>
              </ul>
            </div>

            <div>
              <h3 className="text-white font-medium mb-4 text-base">Legal</h3>
              <ul className="space-y-2">
                <li><Link to="/terms" className="text-slate-400 hover:text-yellow-400 text-sm">Terms of Service</Link></li>
                <li><Link to="/privacy" className="text-slate-400 hover:text-yellow-400 text-sm">Privacy Policy</Link></li>
                <li><Link to="/risk" className="text-slate-400 hover:text-yellow-400 text-sm">Risk Disclosure</Link></li>
                <li><Link to="/cookies" className="text-slate-400 hover:text-yellow-400 text-sm">Cookie Policy</Link></li>
              </ul>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-slate-800 flex flex-row justify-between items-center">
            <p className="text-white text-sm">© 2025 Kaido. All rights reserved.</p>
            <div>
              <div className="bg-slate-800 rounded-lg px-3 py-1 inline-flex items-center">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                <span className="text-xs text-white">BNB Smart Chain Testnet</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
