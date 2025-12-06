import React from 'react';
import { Rocket, Coins, TrendingUp, Users } from 'lucide-react';
import GlowEffect from '../effects/GlowEffect';

const RoadmapSection: React.FC = () => {
  const roadmapItems = [
    {
      icon: <Rocket className="h-8 w-8 text-green-400" />,
      title: "Launch the Present Model",
      description: "Deploy the current KAIDO prediction market consumer layer application with Loss-Edge AI Agent functionality",
      phase: "Phase 1",
      bgColor: "bg-green-500/20",
      glowColor: "#10b981",
      accentColor: "text-green-400"
    },
    {
      icon: <Coins className="h-8 w-8 text-yellow-400" />,
      title: "Launch KAIDO Token with KAIDO Pro",
      description: "Introduce the native KAIDO token along with KAIDO Pro tier, which provides users with AI Agent-powered prediction insights, automatic treasury access and other benefits",
      phase: "Phase 2",
      bgColor: "bg-yellow-500/20",
      glowColor: "#f59e0b",
      accentColor: "text-yellow-400"
    },
    {
      icon: <TrendingUp className="h-8 w-8 text-purple-400" />,
      title: "Expand LLM into Other Markets",
      description: "Scale the AI prediction capabilities beyond the current offerings to include additional sports verticals, esports prediction markets, and other prediction categories",
      phase: "Phase 3",
      bgColor: "bg-purple-500/20",
      glowColor: "#8b5cf6",
      accentColor: "text-purple-400"
    },
    {
      icon: <Users className="h-8 w-8 text-blue-400" />,
      title: "Scaling and Expansion",
      description: "Scale platform infrastructure, expand to new markets and regions, grow user base, and establish strategic partnerships to become the leading consumer prediction market platform",
      phase: "Phase 4",
      bgColor: "bg-blue-500/20",
      glowColor: "#3b82f6",
      accentColor: "text-blue-400"
    }
  ];

  return (
    <section className="py-10 md:py-20 relative overflow-hidden">
      {/* Background with gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent to-blue-900/10 pointer-events-none"></div>

      <div className="container mx-auto px-4 md:px-6">
        <div className="text-center mb-6 md:mb-12">
          <h2 className="handwritten text-2xl md:text-5xl text-white mb-3 md:mb-5">Roadmap</h2>
          <p className="text-sm md:text-xl text-white max-w-4xl mx-auto px-2">
            Our journey to revolutionize prediction markets with AI-powered insights on BNB Chain
          </p>
          <div className="w-full border-b border-gray-300/20 my-4 md:my-8"></div>
        </div>

        {/* Timeline Layout for Desktop, Card Grid for Mobile */}
        <div className="max-w-6xl mx-auto">
          {/* Mobile: Grid Layout */}
          <div className="grid grid-cols-1 md:hidden gap-4">
            {roadmapItems.map((item, index) => (
              <GlowEffect key={index} glowColor={item.glowColor}>
                <div className="rounded-xl p-4 h-full flex flex-col overflow-hidden relative min-h-[200px]">
                  {/* Enhanced Background */}
                  <div className="absolute inset-0 z-0">
                    <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-red-950/30 to-slate-900"></div>
                    <div className="absolute inset-0 bg-gradient-to-tr from-amber-950/20 via-transparent to-orange-950/20"></div>
                    <div className="absolute inset-0 opacity-10" style={{
                      backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(251, 191, 36, 0.1) 10px, rgba(251, 191, 36, 0.1) 20px)'
                    }}></div>
                    <div className="absolute -top-20 -left-20 w-40 h-40 bg-yellow-500/10 rounded-full filter blur-3xl"></div>
                    <div className="absolute -bottom-20 -right-20 w-48 h-48 bg-orange-500/10 rounded-full filter blur-3xl"></div>
                  </div>

                  {/* Border */}
                  <div className="absolute inset-0 border-2 border-gray-300/30 rounded-xl z-5"></div>

                  <div className="relative z-10 flex flex-col h-full">
                    <div className={`w-12 h-12 rounded-full ${item.bgColor} flex items-center justify-center mb-3 transition-all duration-300 hover:scale-110`}>
                      {item.icon}
                    </div>
                    <span className="inline-block bg-slate-700/50 text-slate-300 rounded-full px-3 py-1 text-xs regular-font font-semibold mb-2 w-fit">
                      {item.phase}
                    </span>
                    <h3 className="handwritten text-lg text-white mb-2">{item.title}</h3>
                    <p className="regular-font text-slate-300 text-sm leading-relaxed flex-grow">
                      {item.description}
                    </p>
                  </div>
                </div>
              </GlowEffect>
            ))}
          </div>

          {/* Desktop: Timeline Layout */}
          <div className="hidden md:block relative">
            {/* Timeline Line */}
            <div className="absolute left-1/2 transform -translate-x-1/2 h-full w-1 bg-gradient-to-b from-green-500 via-yellow-500 via-purple-500 to-blue-500 opacity-30"></div>

            <div className="space-y-12">
              {roadmapItems.map((item, index) => (
                <div key={index} className={`flex items-center ${index % 2 === 0 ? 'flex-row' : 'flex-row-reverse'} gap-8`}>
                  {/* Content Card */}
                  <div className="w-5/12">
                    <GlowEffect glowColor={item.glowColor}>
                      <div className="rounded-xl p-6 h-full flex flex-col overflow-hidden relative min-h-[220px]">
                        {/* Enhanced Background */}
                        <div className="absolute inset-0 z-0">
                          <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-red-950/30 to-slate-900"></div>
                          <div className="absolute inset-0 bg-gradient-to-tr from-amber-950/20 via-transparent to-orange-950/20"></div>
                          <div className="absolute inset-0 opacity-10" style={{
                            backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(251, 191, 36, 0.1) 10px, rgba(251, 191, 36, 0.1) 20px)'
                          }}></div>
                          <div className="absolute -top-20 -left-20 w-40 h-40 bg-yellow-500/10 rounded-full filter blur-3xl"></div>
                          <div className="absolute -bottom-20 -right-20 w-48 h-48 bg-orange-500/10 rounded-full filter blur-3xl"></div>
                        </div>

                        {/* Border */}
                        <div className="absolute inset-0 border-2 border-gray-300/30 rounded-xl z-5"></div>

                        <div className="relative z-10 flex flex-col h-full">
                          <span className="inline-block bg-slate-700/50 text-slate-300 rounded-full px-3 py-1 text-xs regular-font font-semibold mb-3 w-fit">
                            {item.phase}
                          </span>
                          <h3 className="handwritten text-2xl text-white mb-3">{item.title}</h3>
                          <p className="regular-font text-slate-300 text-base leading-relaxed flex-grow">
                            {item.description}
                          </p>
                        </div>
                      </div>
                    </GlowEffect>
                  </div>

                  {/* Timeline Node */}
                  <div className="w-2/12 flex justify-center">
                    <div className={`w-16 h-16 rounded-full ${item.bgColor} flex items-center justify-center border-4 border-slate-900 shadow-lg transition-all duration-300 hover:scale-110 z-10`}>
                      {item.icon}
                    </div>
                  </div>

                  {/* Empty space for alternating layout */}
                  <div className="w-5/12"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default RoadmapSection;

