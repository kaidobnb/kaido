import React from 'react';
import { useLocation } from 'react-router-dom';
import { Home, TrendingUp, Trophy, BarChart3, Gem } from 'lucide-react';
import NavigationLink from './NavigationLink';

interface NavItem {
  path: string;
  icon: React.ElementType;
  label: string;
  matchPaths?: string[]; // Additional paths that should highlight this nav item
}

const MobileBottomNav: React.FC = () => {
  const location = useLocation();

  const navItems: NavItem[] = [
    {
      path: '/',
      icon: Home,
      label: 'Home',
      matchPaths: ['/']
    },
    {
      path: '/predictions',
      icon: TrendingUp,
      label: 'Predictions',
      matchPaths: ['/predictions', '/prediction']
    },
    {
      path: '/leaderboard',
      icon: Trophy,
      label: 'Leaderboard',
      matchPaths: ['/leaderboard']
    },
    {
      path: '/portfolio',
      icon: BarChart3,
      label: 'Portfolio',
      matchPaths: ['/portfolio']
    },
    {
      path: '/staking',
      icon: Gem,
      label: 'LP Vault',
      matchPaths: ['/staking']
    }
  ];

  const isActive = (item: NavItem): boolean => {
    // Exact match for home
    if (item.path === '/' && location.pathname === '/') {
      return true;
    }
    
    // For other paths, check if current path starts with the nav item path
    if (item.path !== '/' && location.pathname.startsWith(item.path)) {
      return true;
    }
    
    // Check additional match paths
    if (item.matchPaths) {
      return item.matchPaths.some(path => {
        if (path === '/') {
          return location.pathname === '/';
        }
        return location.pathname.startsWith(path);
      });
    }
    
    return false;
  };

  return (
    <nav className="mobile-bottom-nav fixed bottom-0 left-0 right-0 z-50 md:hidden bg-black/95 backdrop-blur-md border-t border-yellow-500/30 safe-area-bottom">
      <div className="flex items-center justify-center h-16 px-2 max-w-full">
        <div className="flex items-center justify-around w-full max-w-md mx-auto gap-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item);

            return (
              <NavigationLink
                key={item.path}
                to={item.path}
                className="flex flex-col items-center justify-center flex-1 h-full transition-all duration-200 min-w-0 max-w-[90px]"
              >
                <div className={`flex flex-col items-center justify-center transition-all duration-200 w-full ${
                  active ? 'transform scale-105' : ''
                }`}>
                  <div className={`relative ${active ? 'mb-1' : 'mb-1'}`}>
                    <Icon
                      className={`transition-all duration-200 ${
                        active
                          ? 'w-5 h-5 text-yellow-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.6)]'
                          : 'w-5 h-5 text-slate-400'
                      }`}
                      strokeWidth={active ? 2.5 : 2}
                    />
                    {active && (
                      <div className="absolute inset-0 bg-yellow-400/20 rounded-full blur-md -z-10"></div>
                    )}
                  </div>
                  <span className={`text-[10px] leading-tight font-medium transition-all duration-200 truncate max-w-full text-center px-1 ${
                    active
                      ? 'text-yellow-400 font-semibold'
                      : 'text-slate-400'
                  }`}>
                    {item.label}
                  </span>
                </div>
              </NavigationLink>
            );
          })}
        </div>
      </div>

      {/* Bottom safe area for devices with notches */}
      <div className="h-safe-area-inset-bottom bg-black/95"></div>
    </nav>
  );
};

export default MobileBottomNav;

