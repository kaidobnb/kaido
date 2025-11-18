import React, { useState } from 'react';

interface TokenomicsItem {
  category: string;
  percentage: number;
  color: string;
  description?: string;
  vesting?: string;
}

interface TokenomicsDetailsProps {
  data: TokenomicsItem[];
  activeItem: TokenomicsItem | null;
  onItemClick?: (item: TokenomicsItem) => void;
}

const TokenomicsDetails: React.FC<TokenomicsDetailsProps> = ({
  data,
  activeItem,
  onItemClick
}) => {
  const [selectedItem, setSelectedItem] = useState<TokenomicsItem | null>(null);

  // Handle item click
  const handleItemClick = (item: TokenomicsItem) => {
    setSelectedItem(selectedItem?.category === item.category ? null : item);
    if (onItemClick) {
      onItemClick(item);
    }
  };

  // Determine if an item is active (either hovered or selected)
  const isItemActive = (item: TokenomicsItem) => {
    return activeItem?.category === item.category || selectedItem?.category === item.category;
  };

  return (
    <div className="space-y-6 tokenomics-details">
      {/* Tokenomics categories */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {data.map((item) => {
          const isActive = isItemActive(item);

          return (
            <div
              key={item.category}
              className={`flex items-start p-4 rounded-lg border transition-all duration-300 cursor-pointer hover:shadow-lg ${
                isActive
                  ? 'bg-slate-700/70 border-slate-500/50 shadow-lg'
                  : 'bg-slate-800/50 border-slate-700/50 hover:bg-slate-700/30'
              }`}
              onClick={() => handleItemClick(item)}
              style={{
                borderColor: isActive ? item.color : undefined,
                boxShadow: isActive ? `0 0 15px ${item.color}40` : undefined
              }}
            >
              <div
                className={`w-5 h-5 rounded-full mr-3 flex-shrink-0 mt-1 transition-all duration-300 ${
                  isActive ? 'scale-125' : ''
                }`}
                style={{
                  backgroundColor: item.color,
                  boxShadow: isActive ? `0 0 10px ${item.color}` : 'none'
                }}
              />
              <div className="flex-grow">
                <div className="flex justify-between items-center">
                  <p className={`font-medium transition-all duration-300 ${
                    isActive ? 'text-white text-lg' : 'text-slate-200'
                  }`}>
                    {item.category}
                  </p>
                  <p className={`font-bold transition-all duration-300 ${
                    isActive ? 'text-white' : 'text-slate-300'
                  }`}>
                    {item.percentage}%
                  </p>
                </div>

                {/* Description with smooth height transition */}
                <div
                  className={`overflow-hidden transition-all duration-300 ${
                    isActive ? 'max-h-48 mt-2 opacity-100' : 'max-h-0 opacity-0'
                  }`}
                >
                  {item.description && (
                    <p className="text-sm text-slate-400 mb-2">
                      {item.description}
                    </p>
                  )}
                  {item.vesting && (
                    <div className="mt-2">
                      <p className="text-xs font-medium text-yellow-400 mb-1">Vesting Schedule:</p>
                      <div className="text-sm text-slate-300 bg-slate-800/50 p-3 rounded-md border border-slate-700/50 relative overflow-hidden">
                        <div
                          className="absolute inset-0 opacity-20"
                          style={{
                            background: `linear-gradient(90deg, transparent, ${item.color}40, transparent)`,
                            backgroundSize: '200% 100%',
                            animation: 'shimmer 2s infinite'
                          }}
                        ></div>
                        <div className="relative z-10 flex items-center">
                          <span className="inline-block w-2 h-2 rounded-full mr-2" style={{ backgroundColor: item.color }}></span>
                          {item.vesting}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Token utility section */}
      <div className="p-6 bg-slate-800/50 backdrop-blur-sm rounded-lg border border-slate-700/50 hover:border-yellow-500/30 transition-all duration-300">
        <h3 className="text-xl font-bold text-white mb-4 flex items-center">
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-yellow-400 to-yellow-500">
            Token Utility
          </span>
          <span className="ml-2 px-2 py-1 text-xs bg-yellow-500/20 text-yellow-300 rounded-full">
            KAIDO Benefits
          </span>
        </h3>
        <ul className="space-y-4">
          {[
            { text: "No prediction platform fees for token holders", delay: 0 },
            { text: "Access to premium features and exclusive markets", delay: 100 },
            { text: "Governance voting rights", delay: 200 },
            { text: "Staking rewards and incentives", delay: 300 }
          ].map((item, index) => (
            <li
              key={index}
              className={`flex items-start group hover:transform hover:translate-x-1 transition-all duration-300 ${
                item.highlight ? 'bg-purple-900/30 rounded-lg p-3 border border-purple-500/30' : ''
              }`}
            >
              <div className={`h-6 w-6 rounded-full ${
                item.highlight ? 'bg-purple-500/20' : 'bg-green-500/20'
              } flex items-center justify-center mr-3 flex-shrink-0 group-hover:${
                item.highlight ? 'bg-purple-500/30' : 'bg-green-500/30'
              } transition-all duration-300`}>
                <svg className={`h-4 w-4 ${
                  item.highlight ? 'text-purple-400' : 'text-green-400'
                }`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <span className={`${
                item.highlight ? 'text-white font-bold' : 'text-slate-300'
              } group-hover:text-white transition-colors duration-300`}>
                {item.text}
              </span>
            </li>
          ))}
        </ul>
      </div>

      {/* Supply information */}
      <div className="p-4 bg-slate-800/30 backdrop-blur-sm rounded-lg border border-slate-700/50 hover:border-blue-500/30 transition-all duration-300">
        <div className="flex flex-col space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-slate-400">Initial Price:</span>
            <span className="text-white font-medium">$0.0004</span>
          </div>
          <div className="w-full h-px bg-slate-700/50 my-1"></div>
          <div className="flex justify-between items-center">
            <span className="text-slate-400">Listing Price:</span>
            <span className="text-white font-medium">$0.00044</span>
          </div>
          <div className="w-full h-px bg-slate-700/50 my-1"></div>
          <div className="flex justify-between items-center">
            <span className="text-slate-400">ROI from Seed Sale:</span>
            <span className="text-green-400 font-medium">+20%</span>
          </div>
        </div>
      </div>
    </div>
  );
};

// Add keyframe animation for shimmer effect
const shimmerKeyframes = `
  @keyframes shimmer {
    0% { background-position: -100% 0; }
    100% { background-position: 300% 0; }
  }
`;

// Add the keyframes to the document
if (typeof document !== 'undefined') {
  const styleElement = document.createElement('style');
  styleElement.textContent = shimmerKeyframes;
  document.head.appendChild(styleElement);
}

export default TokenomicsDetails;
