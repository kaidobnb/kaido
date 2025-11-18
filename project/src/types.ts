export interface User {
  id: string;
  username: string;
  avatar: string;
  solBalance?: number;
  solyBalance?: number;
}

export interface PredictionChoice {
  id: string;
  label: string;
  price: number;
  percentage: number;
}

export interface Comment {
  id: string;
  user: User;
  text: string;
  timestamp: string;
  position?: 'yes' | 'no';
}

export interface Prediction {
  id: string;
  title: string;
  description: string;
  type: 'binary' | 'multiple';
  tokenType: 'SOL' | 'SOLY' | 'BNB' | 'KAIDO';
  creator: User;
  createdAt: string;
  endDate: string;
  volume: number;
  participants: number;
  choices: PredictionChoice[];
  comments: Comment[];
  resolveDetails: string;
}

export interface AffiliateReferral {
  id: string;
  predictionId: string;
  referrerId: string;
  referredUserId: string;
  amount: number;
  tokenType: 'SOL' | 'SOLY';
  timestamp: string;
  status: 'pending' | 'completed';
}

export interface AffiliateStats {
  totalReferrals: number;
  totalEarned: {
    SOL: number;
    SOLY: number;
  };
  activeReferrals: number;
  pendingRewards: {
    SOL: number;
    SOLY: number;
  };
}
