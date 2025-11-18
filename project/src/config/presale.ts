// Presale configuration
export const PRESALE_CONFIG = {
  totalSupply: 1_000_000_000, // 1 billion KAIDO
  phases: [
    {
      name: 'Presale',
      price: 0.0004, // Presale price
      allocation: 400_000_000, // 400 million KAIDO (40%)
      startDate: new Date(),
      endDate: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000), // 4 days from now
      active: true,
      purchaseEnabled: true, // Users can purchase directly on our platform
    }
  ],
  minPurchase: 0.1, // in BNB
  maxPurchase: 35, // in BNB
  listingPrice: 0.00044, // Listing price
};

// Tokenomics data with vesting information
export const TOKENOMICS = [
  {
    category: 'Presale',
    percentage: 40,
    color: '#F3BA2F',
    description: 'Allocated for token sale to fund initial development and growth.',
    vesting: '50% at TGE, 1 Month cliff and 50% after'
  },
  {
    category: 'KAIDO Referrals & Marketing',
    percentage: 20,
    color: '#FCD34D',
    description: 'Dedicated to referral rewards, promotional activities, community incentives, and marketing initiatives to grow the platform.',
    vesting: '20% at TGE, linear release for 8 Months'
  },
  {
    category: 'KAIDO Airdrop',
    percentage: 10,
    color: '#A855F7',
    description: 'Reserved for community airdrops and user acquisition campaigns to expand the platform reach.',
    vesting: '20% at TGE, then Linearly for 5 Months'
  },
  {
    category: 'Listing / Liquidity',
    percentage: 20,
    color: '#F59E0B',
    description: 'Reserved for exchange listings and providing liquidity to ensure a healthy trading environment.',
    vesting: '100% released at TGE'
  },
  {
    category: 'Team',
    percentage: 10,
    color: '#D97706',
    description: 'Reserved for the founding team and future employees to ensure long-term alignment with project goals.',
    vesting: '20% at TGE, linear release for 12 Months'
  },
];

// FAQ data
export const FAQ_ITEMS = [
  {
    question: 'What is the KAIDO token?',
    answer: 'KAIDO is the native utility token of the Kaido platform, built on the BNB Smart Chain. It powers the prediction markets ecosystem and provides holders with various benefits including no prediction platform fees, governance rights, and access to premium features.'
  },
  {
    question: 'When will I receive my KAIDO tokens?',
    answer: 'KAIDO tokens will be distributed at the Token Generation Event (TGE) which will occur after the completion of the presale. You will be notified and able to claim your tokens through the platform at that time. LP tokens are distributed immediately during the presale for users to hold and use to interact with platform.'
  },
  {
    question: 'What are the benefits of holding KAIDO tokens?',
    answer: 'KAIDO token holders will enjoy no prediction platform fees, access to premium features and exclusive markets, governance voting rights, and staking rewards and incentives.'
  },
  {
    question: 'Is there a vesting period?',
    answer: 'Yes, tokens have specific vesting schedules: Presale tokens (50% at TGE, 1 Month cliff and 50% after), KAIDO Referrals & Marketing (20% at TGE, linear release for 8 Months), KAIDO Airdrop (20% at TGE, then Linearly for 5 Months), Listing/Liquidity (100% released at TGE), and Team tokens (20% at TGE, linear release for 12 Months). TGE refers to Token Generation Event which will occur after the presale concludes.'
  },
];
