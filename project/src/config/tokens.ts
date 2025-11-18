// Token configuration for the application
// This file defines the tokens supported for predictions

export interface TokenInfo {
  symbol: string;
  name: string;
  logo?: string;
  description?: string;
  category?: 'layer1' | 'defi' | 'meme' | 'exchange' | 'other';
}

// List of supported tokens for predictions
export const SUPPORTED_TOKENS: TokenInfo[] = [
  {
    symbol: 'BNB',
    name: 'BNB',
    logo: 'https://cryptologos.cc/logos/bnb-bnb-logo.png',
    description: 'BNB Smart Chain native token',
    category: 'layer1'
  },
  {
    symbol: 'BTC',
    name: 'Bitcoin',
    logo: 'https://cryptologos.cc/logos/bitcoin-btc-logo.png',
    description: 'The original cryptocurrency',
    category: 'layer1'
  },
  {
    symbol: 'ETH',
    name: 'Ethereum',
    logo: 'https://cryptologos.cc/logos/ethereum-eth-logo.png',
    description: 'Smart contract platform',
    category: 'layer1'
  },
  {
    symbol: 'SOL',
    name: 'Solana',
    logo: 'https://cryptologos.cc/logos/solana-sol-logo.png',
    description: 'High-performance blockchain',
    category: 'layer1'
  },
  {
    symbol: 'ADA',
    name: 'Cardano',
    logo: 'https://cryptologos.cc/logos/cardano-ada-logo.png',
    description: 'Proof-of-stake blockchain platform',
    category: 'layer1'
  },
  {
    symbol: 'DOGE',
    name: 'Dogecoin',
    logo: 'https://cryptologos.cc/logos/dogecoin-doge-logo.png',
    description: 'Original meme cryptocurrency',
    category: 'meme'
  },
  {
    symbol: 'XRP',
    name: 'Ripple',
    logo: 'https://cryptologos.cc/logos/xrp-xrp-logo.png',
    description: 'Digital payment protocol',
    category: 'other'
  },
  {
    symbol: 'DOT',
    name: 'Polkadot',
    logo: 'https://cryptologos.cc/logos/polkadot-new-dot-logo.png',
    description: 'Multi-chain network',
    category: 'layer1'
  },
  {
    symbol: 'AVAX',
    name: 'Avalanche',
    logo: 'https://cryptologos.cc/logos/avalanche-avax-logo.png',
    description: 'Layer 1 blockchain',
    category: 'layer1'
  },
  {
    symbol: 'LINK',
    name: 'Chainlink',
    logo: 'https://cryptologos.cc/logos/chainlink-link-logo.png',
    description: 'Decentralized oracle network',
    category: 'other'
  },
  {
    symbol: 'MATIC',
    name: 'Polygon',
    logo: 'https://cryptologos.cc/logos/polygon-matic-logo.png',
    description: 'Ethereum scaling solution',
    category: 'layer1'
  },
  {
    symbol: 'UNI',
    name: 'Uniswap',
    logo: 'https://cryptologos.cc/logos/uniswap-uni-logo.png',
    description: 'Decentralized exchange',
    category: 'defi'
  },
  {
    symbol: 'AAVE',
    name: 'Aave',
    logo: 'https://cryptologos.cc/logos/aave-aave-logo.png',
    description: 'Lending protocol',
    category: 'defi'
  },
  {
    symbol: 'SHIB',
    name: 'Shiba Inu',
    logo: 'https://cryptologos.cc/logos/shiba-inu-shib-logo.png',
    description: 'Meme token',
    category: 'meme'
  },
  {
    symbol: 'LTC',
    name: 'Litecoin',
    logo: 'https://cryptologos.cc/logos/litecoin-ltc-logo.png',
    description: 'Peer-to-peer cryptocurrency',
    category: 'layer1'
  },
  {
    symbol: 'ATOM',
    name: 'Cosmos',
    logo: 'https://cryptologos.cc/logos/cosmos-atom-logo.png',
    description: 'Interoperable blockchain ecosystem',
    category: 'layer1'
  },
  {
    symbol: 'FIL',
    name: 'Filecoin',
    logo: 'https://cryptologos.cc/logos/filecoin-fil-logo.png',
    description: 'Decentralized storage network',
    category: 'other'
  },
  {
    symbol: 'NEAR',
    name: 'NEAR Protocol',
    logo: 'https://cryptologos.cc/logos/near-protocol-near-logo.png',
    description: 'Scalable blockchain platform',
    category: 'layer1'
  },
  {
    symbol: 'APE',
    name: 'ApeCoin',
    logo: 'https://cryptologos.cc/logos/apecoin-ape-logo.png',
    description: 'Governance token for the APE ecosystem',
    category: 'other'
  },
  {
    symbol: 'PEPE',
    name: 'Pepe',
    logo: 'https://cryptologos.cc/logos/pepe-pepe-logo.png',
    description: 'Meme token',
    category: 'meme'
  },

];

// Get token info by symbol
export const getTokenInfo = (symbol: string): TokenInfo | undefined => {
  return SUPPORTED_TOKENS.find(token => token.symbol === symbol);
};

// Get token symbols as an array
export const getTokenSymbols = (): string[] => {
  return SUPPORTED_TOKENS.map(token => token.symbol);
};

// Get tokens by category
export const getTokensByCategory = (category: string): TokenInfo[] => {
  return SUPPORTED_TOKENS.filter(token => token.category === category);
};

// Export token symbols for easy access
export const TOKEN_SYMBOLS = getTokenSymbols();
