import React, { useState } from 'react';
import { ChevronDown, ChevronUp, MessageCircle } from 'lucide-react';
import Button from '../ui/Button';
import GlowEffect from '../effects/GlowEffect';

interface FAQItemProps {
  question: string;
  answer: string;
  isOpen: boolean;
  toggleOpen: () => void;
}

const FAQItem: React.FC<FAQItemProps> = ({ question, answer, isOpen, toggleOpen }) => {
  return (
    <div className="border-b border-gray-300/20 last:border-b-0">
      <button
        className="w-full text-left py-3 md:py-5 flex justify-between items-center focus:outline-none"
        onClick={toggleOpen}
      >
        <h3 className="handwritten text-base md:text-xl text-white pr-2">{question}</h3>
        {isOpen ? (
          <ChevronUp className="h-5 w-5 md:h-6 md:w-6 text-yellow-400 flex-shrink-0" />
        ) : (
          <ChevronDown className="h-5 w-5 md:h-6 md:w-6 text-yellow-400 flex-shrink-0" />
        )}
      </button>
      <div
        className={`overflow-hidden transition-all duration-300 ${
          isOpen ? 'max-h-96 opacity-100 pb-3 md:pb-5' : 'max-h-0 opacity-0'
        }`}
      >
        <p className="text-slate-300 text-sm md:text-lg">{answer}</p>
      </div>
    </div>
  );
};

const FAQSection: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs = [
    {
      question: 'What is KAIDO?',
      answer: 'KAIDO is the first Loss-Edge AI-Agent prediction market built on BNB Chain for crypto and sports predictions. It combines the power of prediction markets with AI assistance to create a seamless platform where users can create, trade, and earn from predictions. The unique Loss-Edge mechanism ensures that even if you lose a prediction, you can claim compensation from the loss-edge fund pool, making it a win-win platform for all participants.'
    },
    {
      question: 'What makes KAIDO different from other prediction platforms?',
      answer: 'KAIDO is unique because of its Loss-Edge mechanism. Unlike traditional prediction markets where losers get nothing, KAIDO redistributes 2% of every prediction pool to users who lost their predictions. Losers can claim their proportional share from the Loss Edge Pool after the prediction resolves. Additionally, KAIDO uses AI to automatically create, manage, and resolve prediction markets, making the entire process transparent, fair, and on-chain. This creates a more inclusive and rewarding ecosystem for all users.'
    },
    {
      question: 'How do I create a prediction market?',
      answer: 'Creating a prediction market is simple! Chat with the KAIDO AI assistant to create prediction markets on any future sport events or crypto price movement. Simply click "Ask KAIDO" and describe what you want to predict (e.g., "Predict BNB above $1550 this week"). KAIDO will guide you through setting up your market, including defining parameters, setting the expiry date, and staking your initial BNB. You earn 1% of the total pool for creating the prediction.'
    },
    {
      question: 'What can I predict on KAIDO?',
      answer: 'You can create predictions on two main categories: (1) Crypto Price Predictions - BNB, Bitcoin, Ethereum, and other cryptocurrencies, and (2) Sports Predictions - upcoming sports events, match outcomes, and other sports-related events. The AI handles market creation and resolution automatically, ensuring fair and transparent outcomes based on real market data and verified sports results.'
    },
    {
      question: 'How does the 5% Agent Fee Distribution work?',
      answer: 'Every prediction pool on KAIDO charges a 5% agent fee in BNB, automatically distributed by the KAIDO AI Agent: 95% goes to winners, 2% to the Loss Edge Pool (claimable compensation for losers), 1% to the prediction creator, 1% to affiliate referrers, and 1% to the KAIDO Treasury for platform operations. This transparent distribution ensures all participants benefit from the ecosystem.'
    },
    {
      question: 'What is the Loss-Edge Pool?',
      answer: 'The Loss-Edge Pool is a unique KAIDO feature where 2% of every prediction pool is reserved to reward users who lost their predictions. Losers can claim their proportional share from the Loss Edge Pool after the prediction resolves by clicking the "Claim Loss-Edge Compensation" button. This means even if your prediction is wrong, you still get rewarded, making KAIDO a truly inclusive platform where everyone benefits.'
    },
    {
      question: 'How do I participate in predictions?',
      answer: 'To participate in predictions: (1) Connect your BNB Chain wallet, (2) Browse available prediction markets or create your own, (3) Stake BNB to participate, (4) Buy and sell positions as market conditions change to maximize profits, (5) When the prediction resolves, winners receive 95% of the pool, and losers can claim their proportional share from the Loss Edge Pool.'
    },
    {
      question: 'How are predictions resolved?',
      answer: 'Predictions are resolved automatically by the KAIDO AI Agent using live market data APIs. For crypto predictions, the system checks the final price at the resolution time using reliable data sources. For sports predictions, verified sports data is used. All resolutions are transparent, on-chain, and handled without human intervention, ensuring fairness and trustlessness.'
    },
    {
      question: 'How does the affiliate program work?',
      answer: 'KAIDO offers a generous affiliate program where you earn 1% in BNB from every transaction your referrals make. Get your unique referral link, share it with your network, and earn instant payouts in BNB directly to your wallet. Climb the referral leaderboard to unlock higher tiers with bigger prizes and rewards from the team. It\'s a lifetime commission structure with no limits.'
    },
    {
      question: 'How do I withdraw my winnings?',
      answer: 'KAIDO uses a simple claiming system. When you win a prediction or receive Loss Edge rewards, you\'ll see a \'Claim\' button in your profile. You can view and claim your winnings from the \'Winnings\' section and referral rewards from the \'Referrals\' section. Once you submit a claim, it\'s processed automatically and the BNB is transferred directly to your connected wallet.'
    },
    {
      question: 'Is KAIDO decentralized and secure?',
      answer: 'Yes, KAIDO is built on BNB Chain and operates as a decentralized application (dApp). All prediction markets, stakes, resolutions, and fee distributions are handled by smart contracts on the blockchain, ensuring complete transparency, security, and trustlessness. Everything is verifiable on-chain, and no single entity controls the platform.'
    },
    {
      question: 'What tokens can I use on KAIDO?',
      answer: 'KAIDO primarily uses BNB (BNB Chain\'s native token) for staking, participating in predictions, and receiving rewards. All fees, payouts, and Loss Edge airdrops are distributed in BNB. This makes the platform simple and efficient, with direct access to the BNB Chain ecosystem.'
    },
    {
      question: 'How does the reputation system work?',
      answer: 'Users build reputation based on their prediction accuracy and market creation activity. Higher reputation gives you more visibility in the community, access to exclusive features, and potential rewards. You can see your reputation score and ranking on your profile page and on the leaderboard. Reputation is earned through successful predictions and active participation.'
    },
    {
      question: 'Can I trade positions after creating a prediction?',
      answer: 'Yes! One of KAIDO\'s key features is the ability to buy and sell positions as market conditions change. This allows you to maximize your profits by trading positions dynamically. You can enter a prediction, monitor market movements, and exit or adjust your position at any time before the prediction resolves.'
    },
    {
      question: 'What happens if I lose a prediction?',
      answer: 'Unlike traditional prediction markets, losing on KAIDO is not a total loss. You can claim compensation from the Loss Edge Pool (2% of every prediction pool). The amount you receive is proportional to your stake. Simply click the "Claim Loss-Edge Compensation" button on resolved predictions where you lost. This unique mechanism ensures that all participants benefit from the ecosystem, making KAIDO a truly inclusive platform.'
    },
    {
      question: 'What is the KAIDO LP Vault?',
      answer: 'The KAIDO LP Vault is the first truly consumer-friendly LP model in prediction markets. Users stake BNB once into a unified vault, and KAIDO handles internal allocation to three yield engines: (1) Boost Vault - earns 30% of the 1% boost fee from boosted markets, (2) Engagement Support - earns from increased platform activity during engagement boosts, and (3) Creator Backing Pool - earns 0.60% of all creator-driven volume (30% of Affiliate Fee + 30% of KAIDO Fee). LPs earn real yield from real platform activity with no impermanent loss, no slippage, and no prediction outcome risk.'
    },
    {
      question: 'How do I earn yield as an LP?',
      answer: 'Simply stake BNB into the KAIDO LP Vault. KAIDO automatically allocates your stake across Boost, Engagement, and Creator engines. You earn yield from: boosted prediction markets (30% of 1% boost fee), engagement-driven platform fees, and creator-backed events (0.60% of creator volume). All yield is distributed proportionally among stakers. There\'s no need to pick between different pools - stake once, earn from everything!'
    }
  ];

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  const handleAskSoly = () => {
    // Find and click the SOLY chat widget button
    const chatButton = document.querySelector('[aria-label="Open chat with Soly"]');
    if (chatButton) {
      (chatButton as HTMLButtonElement).click();
    }
  };

  return (
    <section className="py-10 md:py-20 relative overflow-hidden">
      {/* Background with wavy line */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent to-yellow-900/20 pointer-events-none"></div>

      <div className="container mx-auto px-4 md:px-6">
        <div className="text-center mb-6 md:mb-12">
          <h2 className="handwritten text-2xl md:text-5xl text-white mb-3 md:mb-5">Frequently Asked Questions</h2>
          <p className="text-sm md:text-xl text-white max-w-4xl mx-auto px-2">
            Everything you need to know about KAIDO - the first Loss-Edge AI-Agent prediction market on BNB Chain
          </p>
          <div className="w-full border-b border-gray-300/20 my-4 md:my-8"></div>
        </div>

        <div className="max-w-5xl mx-auto">
          <GlowEffect glowColor="#ec4899">
            <div className="rounded-xl p-4 md:p-8 overflow-hidden relative">
              {/* Enhanced Background with multiple layers */}
              <div className="absolute inset-0 z-0">
                {/* Base gradient - rich dark with burgundy undertones */}
                <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-red-950/30 to-slate-900"></div>

                {/* Animated gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-tr from-amber-950/20 via-transparent to-orange-950/20"></div>

                {/* Subtle diagonal pattern */}
                <div className="absolute inset-0 opacity-10" style={{
                  backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(251, 191, 36, 0.1) 10px, rgba(251, 191, 36, 0.1) 20px)'
                }}></div>

                {/* Decorative corner accent - top left */}
                <div className="absolute -top-20 -left-20 w-40 h-40 bg-yellow-500/10 rounded-full filter blur-3xl"></div>

                {/* Decorative corner accent - bottom right */}
                <div className="absolute -bottom-20 -right-20 w-48 h-48 bg-orange-500/10 rounded-full filter blur-3xl"></div>

                {/* Subtle grid pattern overlay */}
                <div className="absolute inset-0 opacity-5" style={{
                  backgroundImage: 'linear-gradient(0deg, transparent 24%, rgba(251, 191, 36, 0.05) 25%, rgba(251, 191, 36, 0.05) 26%, transparent 27%, transparent 74%, rgba(251, 191, 36, 0.05) 75%, rgba(251, 191, 36, 0.05) 76%, transparent 77%, transparent), linear-gradient(90deg, transparent 24%, rgba(251, 191, 36, 0.05) 25%, rgba(251, 191, 36, 0.05) 26%, transparent 27%, transparent 74%, rgba(251, 191, 36, 0.05) 75%, rgba(251, 191, 36, 0.05) 76%, transparent 77%, transparent)',
                  backgroundSize: '50px 50px'
                }}></div>
              </div>

              {/* Border */}
              <div className="absolute inset-0 border-2 border-gray-300/30 rounded-xl z-5"></div>

              <div className="relative z-10">
                {faqs.map((faq, index) => (
                  <FAQItem
                    key={index}
                    question={faq.question}
                    answer={faq.answer}
                    isOpen={openIndex === index}
                    toggleOpen={() => toggleFAQ(index)}
                  />
                ))}
              </div>
            </div>
          </GlowEffect>

          <div className="mt-6 md:mt-12 text-center">
            <p className="text-slate-300 mb-3 md:mb-6 text-sm md:text-xl px-2">
              Still have questions? Ask our AI assistant for immediate help!
            </p>
            <GlowEffect glowColor="#F3BA2F">
              <Button
                variant="primary"
                size="lg"
                className="px-4 md:px-8 py-2 md:py-4 text-base md:text-xl flex items-center mx-auto handwritten"
                onClick={handleAskSoly}
              >
                <MessageCircle className="h-5 w-5 md:h-6 md:w-6 mr-2 md:mr-3" />
                Ask KAIDO
              </Button>
            </GlowEffect>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FAQSection;
