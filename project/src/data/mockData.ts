import { Comment, Prediction, LeaderboardEntry, PredictionSummary, SolyMessage, User } from '../types';

export const currentUser: User = {
  id: 'user-1',
  username: 'CryptoSage',
  avatar: 'https://images.pexels.com/photos/1681010/pexels-photo-1681010.jpeg?auto=compress&cs=tinysrgb&w=200',
  reputation: 9750,
  winRate: 0.68,
  solBalance: 245.8,
  solyBalance: 5000,
  predictions: []
};

export const trendingPredictions: PredictionSummary[] = [
  {
    id: 'pred-1',
    title: 'BTC above $85,000 on April 30?',
    type: 'binary',
    endDate: '2025-04-30T23:59:59Z',
    volume: 986570,
    currentProbability: 0.87,
    userPosition: 'yes'
  },
  {
    id: 'pred-2',
    title: 'ETH price on April 25?',
    type: 'multiple',
    endDate: '2025-04-25T23:59:59Z',
    volume: 802000,
    currentProbability: 0.53,
  },
  {
    id: 'pred-3',
    title: 'Solana above $300 in April?',
    type: 'binary',
    endDate: '2025-04-30T23:59:59Z',
    volume: 405000,
    currentProbability: 0.24,
    userPosition: 'no'
  },
  {
    id: 'pred-4',
    title: 'XRP above $2.10 on April 25?',
    type: 'binary',
    endDate: '2025-04-25T23:59:59Z',
    volume: 345600,
    currentProbability: 0.12,
  },
  {
    id: 'pred-5',
    title: 'What price will BTC hit in May?',
    type: 'multiple',
    endDate: '2025-05-31T23:59:59Z',
    volume: 1245600,
    currentProbability: 0.35,
  },
  {
    id: 'pred-6',
    title: 'Will ETH hard fork before June?',
    type: 'binary',
    endDate: '2025-05-31T23:59:59Z',
    volume: 433000,
    currentProbability: 0.01,
  }
];

export const detailedPrediction: Prediction = {
  id: 'pred-1',
  title: 'BTC above $85,000 on April 30?',
  description: 'This market will resolve to YES if the price of Bitcoin (BTC) is above $85,000 USD at any point on April 30, 2025. The resolution source will be the Binance BTC/USDT 1-minute candle data.',
  type: 'binary',
  tokenType: 'BNB',
  creator: {
    id: 'user-2',
    username: 'SolanaWhale',
    avatar: 'https://images.pexels.com/photos/6624219/pexels-photo-6624219.jpeg?auto=compress&cs=tinysrgb&w=200'
  },
  createdAt: '2025-03-15T10:30:00Z',
  endDate: '2025-04-30T23:59:59Z',
  volume: 986570,
  choices: [
    {
      id: 'yes',
      label: 'Yes',
      price: 0.87,
      percentage: 87
    },
    {
      id: 'no',
      label: 'No',
      price: 0.13,
      percentage: 13
    }
  ],
  resolveDetails: 'Resolution based on Binance BTC/USDT at 11:59 PM UTC on April 30, 2025',
  comments: [
    {
      id: 'comment-1',
      user: {
        id: 'user-3',
        username: 'CryptoSniper',
        avatar: 'https://images.pexels.com/photos/13073595/pexels-photo-13073595.jpeg?auto=compress&cs=tinysrgb&w=200'
      },
      text: 'Going all in on YES! Bitcoin is primed for a breakout!',
      timestamp: '2025-03-16T14:22:00Z',
      position: 'yes'
    },
    {
      id: 'comment-2',
      user: {
        id: 'user-4',
        username: 'BearMarketSage',
        avatar: 'https://images.pexels.com/photos/1382731/pexels-photo-1382731.jpeg?auto=compress&cs=tinysrgb&w=200'
      },
      text: 'NO way we see $85k this month. Market indicators are bearish.',
      timestamp: '2025-03-16T15:45:00Z',
      position: 'no'
    },
    {
      id: 'comment-3',
      user: {
        id: 'user-5',
        username: 'TokenTrader',
        avatar: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=200'
      },
      text: "I think we'll see $80k but not quite $85k by month end.",
      timestamp: '2025-03-17T09:15:00Z',
      position: 'no'
    }
  ],
  participants: 2458
};

export const multiplePrediction: Prediction = {
  id: 'pred-2',
  title: 'ETH price on April 25?',
  description: 'This market will resolve to the price band that contains the Ethereum (ETH) price on April 25, 2025, at 12:00 PM UTC. The resolution source will be the Binance ETH/USDT 1-minute candle data.',
  type: 'multiple',
  tokenType: 'KAIDO',
  creator: {
    id: 'user-6',
    username: 'ETHmaxi',
    avatar: 'https://images.pexels.com/photos/2379005/pexels-photo-2379005.jpeg?auto=compress&cs=tinysrgb&w=200'
  },
  createdAt: '2025-03-10T08:45:00Z',
  endDate: '2025-04-25T12:00:00Z',
  volume: 802000,
  choices: [
    {
      id: 'range-1',
      label: '>$1.8k',
      price: 0.22,
      percentage: 22
    },
    {
      id: 'range-2',
      label: '$1.7k-$1.8k',
      price: 0.53,
      percentage: 53
    },
    {
      id: 'range-3',
      label: '$1.6k-$1.7k',
      price: 0.22,
      percentage: 22
    },
    {
      id: 'range-4',
      label: '<$1.6k',
      price: 0.03,
      percentage: 3
    }
  ],
  resolveDetails: 'Resolution based on Binance ETH/USDT at 12:00 PM UTC on April 25, 2025',
  comments: [
    {
      id: 'comment-1',
      user: {
        id: 'user-7',
        username: 'MergeMaximalist',
        avatar: 'https://images.pexels.com/photos/614810/pexels-photo-614810.jpeg?auto=compress&cs=tinysrgb&w=200'
      },
      text: 'The $1.7k-$1.8k range seems most likely based on current momentum.',
      timestamp: '2025-03-11T11:30:00Z',
      position: 'range-2'
    },
    {
      id: 'comment-2',
      user: {
        id: 'user-8',
        username: 'LayerTwoEnthusiast',
        avatar: 'https://images.pexels.com/photos/1516680/pexels-photo-1516680.jpeg?auto=compress&cs=tinysrgb&w=200'
      },
      text: "With the upcoming protocol upgrade, I think we'll see >$1.8k easily.",
      timestamp: '2025-03-12T14:15:00Z',
      position: 'range-1'
    }
  ],
  participants: 1589
};

export const leaderboardData: LeaderboardEntry[] = [
  {
    id: 'user-3',
    username: 'CryptoSniper',
    avatar: 'https://images.pexels.com/photos/13073595/pexels-photo-13073595.jpeg?auto=compress&cs=tinysrgb&w=200',
    reputation: 12500,
    winRate: 0.72,
    volume: 2450000,
    rank: 1
  },
  {
    id: 'user-9',
    username: 'PredictionPro',
    avatar: 'https://images.pexels.com/photos/428364/pexels-photo-428364.jpeg?auto=compress&cs=tinysrgb&w=200',
    reputation: 11200,
    winRate: 0.68,
    volume: 1980000,
    rank: 2
  },
  {
    id: 'user-10',
    username: 'TokenWizard',
    avatar: 'https://images.pexels.com/photos/834863/pexels-photo-834863.jpeg?auto=compress&cs=tinysrgb&w=200',
    reputation: 10800,
    winRate: 0.65,
    volume: 1820000,
    rank: 3
  },
  {
    id: 'user-1',
    username: 'CryptoSage',
    avatar: 'https://images.pexels.com/photos/1681010/pexels-photo-1681010.jpeg?auto=compress&cs=tinysrgb&w=200',
    reputation: 9750,
    winRate: 0.68,
    volume: 1650000,
    rank: 4
  },
  {
    id: 'user-11',
    username: 'ChainChampion',
    avatar: 'https://images.pexels.com/photos/733872/pexels-photo-733872.jpeg?auto=compress&cs=tinysrgb&w=200',
    reputation: 9200,
    winRate: 0.62,
    volume: 1580000,
    rank: 5
  }
];

export const chatHistory: SolyMessage[] = [
  {
    id: 'msg-1',
    role: 'assistant',
    content: "Hello! I'm Soly, your AI prediction assistant. I can help you create or join prediction markets. What would you like to predict today?",
    timestamp: '2025-03-18T10:00:00Z'
  },
  {
    id: 'msg-2',
    role: 'user',
    content: 'Will BTC hit $100k by the end of May?',
    timestamp: '2025-03-18T10:01:30Z'
  },
  {
    id: 'msg-3',
    role: 'assistant',
    content: 'I can help you create a binary prediction market for "BTC above $100,000 by May 31st?". This will be a YES/NO market. Would you like to proceed with creating this market?',
    timestamp: '2025-03-18T10:01:45Z'
  },
  {
    id: 'msg-4',
    role: 'user',
    content: "Yes, let's create it",
    timestamp: '2025-03-18T10:02:15Z'
  },
  {
    id: 'msg-5',
    role: 'assistant',
    content: "Great! I've created a binary prediction market: \"BTC above $100,000 by May 31st?\". To fund this market, you'll need to deposit SOL or SOLY tokens. Would you like to use SOL or SOLY to fund this market?",
    timestamp: '2025-03-18T10:02:30Z'
  }
];