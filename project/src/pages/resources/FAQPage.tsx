import React from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { ArrowLeft } from 'lucide-react';

const FAQPage: React.FC = () => {
  const navigate = useNavigate();

  const handleBack = () => {
    navigate(-1); // Go back to previous page
  };
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

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Mobile Back Button */}
      <div className="md:hidden mb-4">
        <Button
          variant="outline"
          size="sm"
          leftIcon={<ArrowLeft className="h-4 w-4" />}
          onClick={handleBack}
          className="text-yellow-400 border-yellow-500/30 hover:bg-yellow-500/10"
        >
          Back
        </Button>
      </div>

      <Card>
        <div className="p-6 md:p-8">
          <h1 className="text-3xl font-bold text-white mb-6">Frequently Asked Questions</h1>

          <div className="space-y-6">
            {faqs.map((faq, index) => (
              <div key={index} className="border-b border-slate-700 pb-6 last:border-b-0 last:pb-0">
                <h3 className="text-xl font-semibold text-white mb-2">{faq.question}</h3>
                <p className="text-slate-300">{faq.answer}</p>
              </div>
            ))}
          </div>

          <div className="mt-8 pt-6 border-t border-slate-700">
            <h3 className="text-xl font-semibold text-white mb-4">Still have questions?</h3>
            <p className="text-slate-300 mb-4">
              If you couldn't find the answer to your question, feel free to reach out to our support team.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <button
                className="bg-yellow-500 hover:bg-yellow-600 text-black px-6 py-3 rounded-lg transition-colors flex items-center justify-center font-medium"
                onClick={() => {
                  // Open Kaido chat widget
                  const event = new CustomEvent('kaido:open');
                  document.dispatchEvent(event);
                }}
              >
                Ask Kaido
              </button>
              <a
                href="mailto:support@kaido.ai"
                className="bg-slate-700 hover:bg-slate-600 text-white px-6 py-3 rounded-lg transition-colors flex items-center justify-center"
              >
                Email Support
              </a>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default FAQPage;
