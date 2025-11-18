export interface User {
  id: string;
  username: string;
  avatar: string;
  reputation: number;
  winRate: number;
  bnbBalance: number;
  kaidoBalance: number;
  predictions: PredictionSummary[];
}

export interface PredictionSummary {
  id: string;
  title: string;
  type: 'binary' | 'multiple' | 'agent';
  endDate: string;
  volume: number;
  tokenType?: 'BNB' | 'KAIDO';
  currentProbability: number;
  userPosition?: 'yes' | 'no' | string;
  participants?: number;
  minKaidoRequired?: number;
  maxParticipants?: number;
  rewardPoolAmount?: number;
  createdBy?: any;
}

export type PredictionChoice = {
  id: string;
  label: string;
  price: number;
  percentage: number;
};

export interface Prediction {
  id: string;
  title: string;
  description: string;
  type: 'binary' | 'multiple' | 'agent';
  creator: {
    id: string;
    username: string;
    avatar: string;
  };
  createdAt: string;
  endDate: string;
  volume: number;
  choices: PredictionChoice[];
  resolveDetails: string;
  comments: Comment[];
  participants: number;
  tokenType?: 'BNB' | 'KAIDO';
  minKaidoRequired?: number;
  maxParticipants?: number;
  rewardPoolAmount?: number;
  status?: 'active' | 'resolved' | 'cancelled';
}

export interface Comment {
  id: string;
  user: {
    id: string;
    username: string;
    avatar: string;
  };
  text: string;
  timestamp: string;
  position?: 'yes' | 'no' | string;
}

export interface KaidoMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface LeaderboardEntry {
  id: string;
  username: string;
  avatar: string;
  reputation: number;
  winRate: number;
  volume: number;
  rank: number;
}