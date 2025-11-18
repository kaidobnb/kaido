// Token configuration for the backend
// This file defines the tokens supported for predictions

export interface TokenInfo {
  symbol: string;
  name: string;
  coinGeckoId?: string;
  cryptoCompareId?: string;
}

// List of supported tokens for predictions
export const SUPPORTED_TOKENS: TokenInfo[] = [
  {
    symbol: 'BTC',
    name: 'Bitcoin',
    coinGeckoId: 'bitcoin',
    cryptoCompareId: 'BTC'
  },
  {
    symbol: 'ETH',
    name: 'Ethereum',
    coinGeckoId: 'ethereum',
    cryptoCompareId: 'ETH'
  },
  {
    symbol: 'SOL',
    name: 'Solana',
    coinGeckoId: 'solana',
    cryptoCompareId: 'SOL'
  },
  {
    symbol: 'ADA',
    name: 'Cardano',
    coinGeckoId: 'cardano',
    cryptoCompareId: 'ADA'
  },
  {
    symbol: 'DOGE',
    name: 'Dogecoin',
    coinGeckoId: 'dogecoin',
    cryptoCompareId: 'DOGE'
  },
  {
    symbol: 'XRP',
    name: 'Ripple',
    coinGeckoId: 'ripple',
    cryptoCompareId: 'XRP'
  },
  {
    symbol: 'DOT',
    name: 'Polkadot',
    coinGeckoId: 'polkadot',
    cryptoCompareId: 'DOT'
  },
  {
    symbol: 'AVAX',
    name: 'Avalanche',
    coinGeckoId: 'avalanche-2',
    cryptoCompareId: 'AVAX'
  },
  {
    symbol: 'LINK',
    name: 'Chainlink',
    coinGeckoId: 'chainlink',
    cryptoCompareId: 'LINK'
  },
  {
    symbol: 'MATIC',
    name: 'Polygon',
    coinGeckoId: 'matic-network',
    cryptoCompareId: 'MATIC'
  },
  {
    symbol: 'UNI',
    name: 'Uniswap',
    coinGeckoId: 'uniswap',
    cryptoCompareId: 'UNI'
  },
  {
    symbol: 'AAVE',
    name: 'Aave',
    coinGeckoId: 'aave',
    cryptoCompareId: 'AAVE'
  },
  {
    symbol: 'SHIB',
    name: 'Shiba Inu',
    coinGeckoId: 'shiba-inu',
    cryptoCompareId: 'SHIB'
  },
  {
    symbol: 'LTC',
    name: 'Litecoin',
    coinGeckoId: 'litecoin',
    cryptoCompareId: 'LTC'
  },
  {
    symbol: 'ATOM',
    name: 'Cosmos',
    coinGeckoId: 'cosmos',
    cryptoCompareId: 'ATOM'
  },
  {
    symbol: 'FIL',
    name: 'Filecoin',
    coinGeckoId: 'filecoin',
    cryptoCompareId: 'FIL'
  },
  {
    symbol: 'NEAR',
    name: 'NEAR Protocol',
    coinGeckoId: 'near',
    cryptoCompareId: 'NEAR'
  },
  {
    symbol: 'APE',
    name: 'ApeCoin',
    coinGeckoId: 'apecoin',
    cryptoCompareId: 'APE'
  },
  {
    symbol: 'PEPE',
    name: 'Pepe',
    coinGeckoId: 'pepe',
    cryptoCompareId: 'PEPE'
  },
  {
    symbol: 'BNB',
    name: 'Binance Coin',
    coinGeckoId: 'binancecoin',
    cryptoCompareId: 'BNB'
  }
];

// Get token info by symbol
export const getTokenInfo = (symbol: string): TokenInfo | undefined => {
  return SUPPORTED_TOKENS.find(token => token.symbol === symbol);
};

// Get token symbols as an array
export const getTokenSymbols = (): string[] => {
  return SUPPORTED_TOKENS.map(token => token.symbol);
};

// Get CoinGecko ID mapping
export const getCoinGeckoIdMapping = (): Record<string, string> => {
  const mapping: Record<string, string> = {};
  SUPPORTED_TOKENS.forEach(token => {
    if (token.coinGeckoId) {
      mapping[token.symbol] = token.coinGeckoId;
    }
  });
  return mapping;
};

// Get CryptoCompare ID mapping
export const getCryptoCompareIdMapping = (): Record<string, string> => {
  const mapping: Record<string, string> = {};
  SUPPORTED_TOKENS.forEach(token => {
    if (token.cryptoCompareId) {
      mapping[token.symbol] = token.cryptoCompareId;
    }
  });
  return mapping;
};

// Export token symbols for easy access
export const TOKEN_SYMBOLS = getTokenSymbols();
