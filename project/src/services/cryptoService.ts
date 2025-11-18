import axios from 'axios';

// API Configuration
interface ApiConfig {
  baseUrl: string;
  apiKey: string;
}

// API Provider Types
export type ApiProvider = 'cryptocompare' | 'coingecko' | 'coinmarketcap';

// Get API provider from environment or use default
export const getApiProvider = (): ApiProvider => {
  const provider = import.meta.env.VITE_DEFAULT_CRYPTO_API_PROVIDER as ApiProvider || 'cryptocompare';
  // Check localStorage for user-set provider (from admin panel)
  const storedProvider = localStorage.getItem('crypto_api_provider') as ApiProvider;
  return storedProvider || provider;
};

// Set API provider (used by admin panel)
export const setApiProvider = (provider: ApiProvider): void => {
  localStorage.setItem('crypto_api_provider', provider);
};

// API Configuration for different providers
const API_CONFIGS: Record<ApiProvider, ApiConfig> = {
  cryptocompare: {
    baseUrl: 'https://min-api.cryptocompare.com/data',
    apiKey: import.meta.env.VITE_CRYPTOCOMPARE_API_KEY || 'eaefbe41eae1fca7b9ccc8ef4103092df8f1e0330feaee0be27994080dc3e429'
  },
  coingecko: {
    baseUrl: 'https://api.coingecko.com/api/v3',
    apiKey: import.meta.env.VITE_COINGECKO_API_KEY || ''
  },
  coinmarketcap: {
    baseUrl: 'https://pro-api.coinmarketcap.com/v1',
    apiKey: import.meta.env.VITE_COINMARKETCAP_API_KEY || ''
  }
};

// Get current API configuration
const getCurrentApiConfig = (): ApiConfig => {
  const provider = getApiProvider();
  return API_CONFIGS[provider];
};

// Function to get current price of a cryptocurrency
export const getCurrentPrice = async (symbol: string, currency: string = 'USD') => {
  try {
    const { baseUrl, apiKey } = getCurrentApiConfig();
    const provider = getApiProvider();

    // Different implementation based on provider
    switch (provider) {
      case 'cryptocompare':
        // Add a timeout to prevent hanging requests
        const ccResponse = await axios.get(`${baseUrl}/price`, {
          params: {
            fsym: symbol,
            tsyms: currency,
            api_key: apiKey
          },
          timeout: 5000 // 5 second timeout
        });
        return ccResponse.data;

      case 'coingecko':
        // CoinGecko uses different parameter format
        // We need to map the symbol to CoinGecko ID
        const coinId = getCoinGeckoId(symbol);
        const cgResponse = await axios.get(`${baseUrl}/simple/price`, {
          params: {
            ids: coinId,
            vs_currencies: currency.toLowerCase(),
            ...(apiKey ? { x_cg_pro_api_key: apiKey } : {})
          },
          timeout: 5000
        });

        // Transform response to match CryptoCompare format
        if (cgResponse.data[coinId]) {
          return { [currency]: cgResponse.data[coinId][currency.toLowerCase()] };
        }
        throw new Error('Invalid CoinGecko response');

      case 'coinmarketcap':
        // CoinMarketCap uses a different API structure
        const cmcResponse = await axios.get(`${baseUrl}/cryptocurrency/quotes/latest`, {
          params: {
            symbol: symbol
          },
          headers: {
            'X-CMC_PRO_API_KEY': apiKey
          },
          timeout: 5000
        });

        // Transform response to match CryptoCompare format
        if (cmcResponse.data.data && cmcResponse.data.data[symbol]) {
          const price = cmcResponse.data.data[symbol].quote[currency].price;
          return { [currency]: price };
        }
        throw new Error('Invalid CoinMarketCap response');

      default:
        throw new Error(`Unsupported API provider: ${provider}`);
    }
  } catch (error) {
    console.error('Error fetching current price:', error);
    // Return a fallback value instead of throwing to prevent component crashes
    return { [currency]: symbol === 'BTC' ? 68000 : symbol === 'ETH' ? 3500 : symbol === 'SOL' ? 150 : 100 };
  }
};

// Helper function to map crypto symbol to CoinGecko ID
const getCoinGeckoId = (symbol: string): string => {
  const symbolMap: Record<string, string> = {
    'BTC': 'bitcoin',
    'ETH': 'ethereum',
    'SOL': 'solana',
    'ADA': 'cardano',
    'DOGE': 'dogecoin',
    'XRP': 'ripple',
    'DOT': 'polkadot',
    'AVAX': 'avalanche-2',
    'LINK': 'chainlink',
    'MATIC': 'matic-network',
    'UNI': 'uniswap',
    'SHIB': 'shiba-inu',
    'ATOM': 'cosmos',
    'LTC': 'litecoin',
    'BNB': 'binancecoin'
  };

  return symbolMap[symbol] || symbol.toLowerCase();
};

// Function to get historical price data for a cryptocurrency
export const getHistoricalPriceData = async (
  symbol: string,
  currency: string = 'USD',
  limit: number = 30, // Number of data points
  aggregate: number = 1, // Data points aggregation
  timespan: 'minute' | 'hour' | 'day' = 'day'
) => {
  try {
    const { baseUrl, apiKey } = getCurrentApiConfig();
    const provider = getApiProvider();

    switch (provider) {
      case 'cryptocompare':
        let endpoint = '';
        switch (timespan) {
          case 'minute':
            endpoint = 'histominute';
            break;
          case 'hour':
            endpoint = 'histohour';
            break;
          case 'day':
          default:
            endpoint = 'histoday';
            break;
        }

        const ccResponse = await axios.get(`${baseUrl}/${endpoint}`, {
          params: {
            fsym: symbol,
            tsym: currency,
            limit,
            aggregate,
            api_key: apiKey
          },
          timeout: 5000 // 5 second timeout
        });
        return ccResponse.data;

      case 'coingecko':
        // CoinGecko uses different parameter format
        const coinId = getCoinGeckoId(symbol);
        let days = limit;
        let interval = 'daily';

        // Adjust interval based on timespan
        if (timespan === 'minute') {
          interval = 'minutely';
          // CoinGecko only supports up to 1 day of minute data
          days = Math.min(1, Math.ceil(limit / (24 * 60)));
        } else if (timespan === 'hour') {
          interval = 'hourly';
          // CoinGecko only supports up to 90 days of hourly data
          days = Math.min(90, Math.ceil(limit / 24));
        }

        const cgResponse = await axios.get(`${baseUrl}/coins/${coinId}/market_chart`, {
          params: {
            vs_currency: currency.toLowerCase(),
            days,
            interval,
            ...(apiKey ? { x_cg_pro_api_key: apiKey } : {})
          },
          timeout: 5000
        });

        // Transform CoinGecko response to match CryptoCompare format
        if (cgResponse.data && cgResponse.data.prices) {
          const data = cgResponse.data.prices.map((item: [number, number], index: number) => {
            const timestamp = Math.floor(item[0] / 1000);
            const price = item[1];

            // Get volume data if available
            const volume = cgResponse.data.total_volumes && cgResponse.data.total_volumes[index] ?
              cgResponse.data.total_volumes[index][1] : 0;

            // For the open/high/low we use approximations since CoinGecko only provides close prices
            return {
              time: timestamp,
              close: price,
              high: price * 1.01, // Approximate
              low: price * 0.99,  // Approximate
              open: index > 0 ? cgResponse.data.prices[index-1][1] : price * 0.995, // Use previous close or approximate
              volumefrom: volume / price, // Approximate
              volumeto: volume
            };
          });

          return {
            Response: "Success",
            Type: 100,
            Aggregated: true,
            Data: data,
            TimeTo: Math.floor(Date.now() / 1000),
            TimeFrom: data.length > 0 ? data[0].time : Math.floor((Date.now() - days * 24 * 60 * 60 * 1000) / 1000),
            FirstValueInArray: true,
            ConversionType: {
              type: "direct",
              conversionSymbol: ""
            }
          };
        }
        throw new Error('Invalid CoinGecko response');

      case 'coinmarketcap':
        // CoinMarketCap historical data requires a different endpoint
        // Note: Free tier has limited historical data
        const cmcResponse = await axios.get(`${baseUrl}/cryptocurrency/quotes/historical`, {
          params: {
            symbol,
            interval: timespan === 'minute' ? '1m' : timespan === 'hour' ? '1h' : '1d',
            count: limit
          },
          headers: {
            'X-CMC_PRO_API_KEY': apiKey
          },
          timeout: 5000
        });

        // Transform CoinMarketCap response to match CryptoCompare format
        if (cmcResponse.data && cmcResponse.data.data && cmcResponse.data.data[symbol]) {
          const quotes = cmcResponse.data.data[symbol].quotes;
          const data = quotes.map((quote: any) => {
            return {
              time: Math.floor(new Date(quote.timestamp).getTime() / 1000),
              close: quote.quote[currency].price,
              high: quote.quote[currency].high || quote.quote[currency].price * 1.01,
              low: quote.quote[currency].low || quote.quote[currency].price * 0.99,
              open: quote.quote[currency].open || quote.quote[currency].price * 0.995,
              volumefrom: quote.quote[currency].volume / quote.quote[currency].price,
              volumeto: quote.quote[currency].volume || 0
            };
          });

          return {
            Response: "Success",
            Type: 100,
            Aggregated: true,
            Data: data,
            TimeTo: data.length > 0 ? data[data.length - 1].time : Math.floor(Date.now() / 1000),
            TimeFrom: data.length > 0 ? data[0].time : Math.floor((Date.now() - limit * 24 * 60 * 60 * 1000) / 1000),
            FirstValueInArray: true,
            ConversionType: {
              type: "direct",
              conversionSymbol: ""
            }
          };
        }
        throw new Error('Invalid CoinMarketCap response');

      default:
        throw new Error(`Unsupported API provider: ${provider}`);
    }
  } catch (error) {
    console.error(`Error fetching historical ${timespan} data:`, error);

    // Generate fallback data instead of throwing
    const fallbackData = {
      Response: "Success",
      Type: 100,
      Aggregated: true,
      Data: Array(limit).fill(0).map((_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - (limit - i));

        // Generate some random price data based on the symbol
        const basePrice = symbol === 'BTC' ? 68000 : symbol === 'ETH' ? 3500 : symbol === 'SOL' ? 150 : 100;
        const randomFactor = 0.95 + (Math.random() * 0.1); // Random factor between 0.95 and 1.05

        return {
          time: Math.floor(date.getTime() / 1000),
          close: basePrice * randomFactor,
          high: basePrice * randomFactor * 1.02,
          low: basePrice * randomFactor * 0.98,
          open: basePrice * randomFactor * 0.99,
          volumefrom: 1000 + Math.random() * 5000,
          volumeto: 10000 + Math.random() * 50000
        };
      }),
      TimeTo: Math.floor(new Date().getTime() / 1000),
      TimeFrom: Math.floor(new Date().setDate(new Date().getDate() - limit) / 1000),
      FirstValueInArray: true,
      ConversionType: {
        type: "direct",
        conversionSymbol: ""
      }
    };

    return fallbackData;
  }
};

// Function to get price data for multiple cryptocurrencies
export const getMultiplePrices = async (symbols: string[], currency: string = 'USD') => {
  try {
    const { baseUrl, apiKey } = getCurrentApiConfig();
    const provider = getApiProvider();

    switch (provider) {
      case 'cryptocompare':
        const ccResponse = await axios.get(`${baseUrl}/pricemulti`, {
          params: {
            fsyms: symbols.join(','),
            tsyms: currency,
            api_key: apiKey
          },
          timeout: 5000 // 5 second timeout
        });
        return ccResponse.data;

      case 'coingecko':
        // Map symbols to CoinGecko IDs
        const coinIds = symbols.map(getCoinGeckoId).join(',');
        const cgResponse = await axios.get(`${baseUrl}/simple/price`, {
          params: {
            ids: coinIds,
            vs_currencies: currency.toLowerCase(),
            ...(apiKey ? { x_cg_pro_api_key: apiKey } : {})
          },
          timeout: 5000
        });

        // Transform response to match CryptoCompare format
        const cgData: Record<string, Record<string, number>> = {};
        symbols.forEach((symbol, index) => {
          const coinId = getCoinGeckoId(symbol);
          if (cgResponse.data[coinId]) {
            cgData[symbol] = {
              [currency]: cgResponse.data[coinId][currency.toLowerCase()]
            };
          }
        });
        return cgData;

      case 'coinmarketcap':
        const cmcResponse = await axios.get(`${baseUrl}/cryptocurrency/quotes/latest`, {
          params: {
            symbol: symbols.join(',')
          },
          headers: {
            'X-CMC_PRO_API_KEY': apiKey
          },
          timeout: 5000
        });

        // Transform response to match CryptoCompare format
        const cmcData: Record<string, Record<string, number>> = {};
        if (cmcResponse.data && cmcResponse.data.data) {
          symbols.forEach(symbol => {
            if (cmcResponse.data.data[symbol]) {
              cmcData[symbol] = {
                [currency]: cmcResponse.data.data[symbol].quote[currency].price
              };
            }
          });
        }
        return cmcData;

      default:
        throw new Error(`Unsupported API provider: ${provider}`);
    }
  } catch (error) {
    console.error('Error fetching multiple prices:', error);

    // Return fallback data for each symbol
    const fallbackData: Record<string, Record<string, number>> = {};
    symbols.forEach(symbol => {
      fallbackData[symbol] = {
        [currency]: symbol === 'BTC' ? 68000 :
                   symbol === 'ETH' ? 3500 :
                   symbol === 'SOL' ? 150 :
                   symbol === 'BNB' ? 1114 : 100
      };
    });

    return fallbackData;
  }
};

// Function to get full price data (price, volume, market cap, etc.)
export const getFullPriceData = async (symbols: string, currency: string = 'USD') => {
  try {
    const { baseUrl, apiKey } = getCurrentApiConfig();
    const provider = getApiProvider();

    switch (provider) {
      case 'cryptocompare':
        const ccResponse = await axios.get(`${baseUrl}/pricemultifull`, {
          params: {
            fsyms: symbols, // This can be a single symbol or a comma-separated list
            tsyms: currency,
            api_key: apiKey
          },
          timeout: 5000 // 5 second timeout
        });
        return ccResponse.data;

      case 'coingecko':
        // Check if symbols is a comma-separated list
        const symbolsArray = symbols.split(',');

        // Map symbols to CoinGecko IDs
        const coinIds = symbolsArray.map(s => getCoinGeckoId(s.trim())).join(',');

        // Get detailed coin data
        const cgResponse = await axios.get(`${baseUrl}/coins/markets`, {
          params: {
            ids: coinIds,
            vs_currency: currency.toLowerCase(),
            price_change_percentage: '24h',
            ...(apiKey ? { x_cg_pro_api_key: apiKey } : {})
          },
          timeout: 5000
        });

        // Transform CoinGecko response to match CryptoCompare format
        const cgData: any = {
          RAW: {},
          DISPLAY: {}
        };

        if (cgResponse.data) {
          cgResponse.data.forEach((coin: any) => {
            // Find the original symbol from our input
            const originalSymbol = symbolsArray.find(s =>
              getCoinGeckoId(s.trim()) === coin.id
            )?.trim() || coin.symbol.toUpperCase();

            cgData.RAW[originalSymbol] = {
              [currency]: {
                PRICE: coin.current_price,
                VOLUME24HOUR: coin.total_volume,
                VOLUME24HOURTO: coin.total_volume,
                OPEN24HOUR: coin.current_price / (1 + (coin.price_change_percentage_24h / 100)),
                HIGH24HOUR: coin.high_24h,
                LOW24HOUR: coin.low_24h,
                CHANGE24HOUR: coin.price_change_24h,
                CHANGEPCT24HOUR: coin.price_change_percentage_24h,
                MKTCAP: coin.market_cap,
                LASTUPDATE: Math.floor(Date.now() / 1000)
              }
            };

            cgData.DISPLAY[originalSymbol] = {
              [currency]: {
                PRICE: `$${coin.current_price.toLocaleString()}`,
                VOLUME24HOUR: `$${coin.total_volume.toLocaleString()}`,
                VOLUME24HOURTO: `$${coin.total_volume.toLocaleString()}`,
                OPEN24HOUR: `$${(coin.current_price / (1 + (coin.price_change_percentage_24h / 100))).toLocaleString()}`,
                HIGH24HOUR: `$${coin.high_24h.toLocaleString()}`,
                LOW24HOUR: `$${coin.low_24h.toLocaleString()}`,
                CHANGE24HOUR: `$${coin.price_change_24h.toLocaleString()}`,
                CHANGEPCT24HOUR: coin.price_change_percentage_24h.toFixed(2),
                MKTCAP: `$${coin.market_cap.toLocaleString()}`
              }
            };
          });
        }
        return cgData;

      case 'coinmarketcap':
        const cmcResponse = await axios.get(`${baseUrl}/cryptocurrency/quotes/latest`, {
          params: {
            symbol: symbols
          },
          headers: {
            'X-CMC_PRO_API_KEY': apiKey
          },
          timeout: 5000
        });

        // Transform CoinMarketCap response to match CryptoCompare format
        const cmcData: any = {
          RAW: {},
          DISPLAY: {}
        };

        if (cmcResponse.data && cmcResponse.data.data) {
          Object.keys(cmcResponse.data.data).forEach(symbol => {
            const coin = cmcResponse.data.data[symbol];
            const quote = coin.quote[currency];

            cmcData.RAW[symbol] = {
              [currency]: {
                PRICE: quote.price,
                VOLUME24HOUR: quote.volume_24h,
                VOLUME24HOURTO: quote.volume_24h,
                OPEN24HOUR: quote.price / (1 + (quote.percent_change_24h / 100)),
                HIGH24HOUR: quote.price * 1.05, // Approximation
                LOW24HOUR: quote.price * 0.95,  // Approximation
                CHANGE24HOUR: quote.price * (quote.percent_change_24h / 100),
                CHANGEPCT24HOUR: quote.percent_change_24h,
                MKTCAP: quote.market_cap,
                LASTUPDATE: Math.floor(new Date(coin.last_updated).getTime() / 1000)
              }
            };

            cmcData.DISPLAY[symbol] = {
              [currency]: {
                PRICE: `$${quote.price.toLocaleString()}`,
                VOLUME24HOUR: `$${quote.volume_24h.toLocaleString()}`,
                VOLUME24HOURTO: `$${quote.volume_24h.toLocaleString()}`,
                OPEN24HOUR: `$${(quote.price / (1 + (quote.percent_change_24h / 100))).toLocaleString()}`,
                HIGH24HOUR: `$${(quote.price * 1.05).toLocaleString()}`,
                LOW24HOUR: `$${(quote.price * 0.95).toLocaleString()}`,
                CHANGE24HOUR: `$${(quote.price * (quote.percent_change_24h / 100)).toLocaleString()}`,
                CHANGEPCT24HOUR: quote.percent_change_24h.toFixed(2),
                MKTCAP: `$${quote.market_cap.toLocaleString()}`
              }
            };
          });
        }
        return cmcData;

      default:
        throw new Error(`Unsupported API provider: ${provider}`);
    }
  } catch (error) {
    console.error('Error fetching full price data:', error);

    // Check if symbols is a comma-separated list
    const symbolsArray = symbols.split(',');

    // Create a fallback response that matches the structure of the API response
    const fallbackData: any = {
      RAW: {},
      DISPLAY: {}
    };

    // Generate fallback data for each symbol
    symbolsArray.forEach(symbol => {
      const trimmedSymbol = symbol.trim();
      const basePrice = trimmedSymbol === 'BTC' ? 68000 :
                       trimmedSymbol === 'ETH' ? 3500 :
                       trimmedSymbol === 'SOL' ? 150 :
                       trimmedSymbol === 'ADA' ? 0.58 :
                       trimmedSymbol === 'DOGE' ? 0.12 :
                       trimmedSymbol === 'XRP' ? 0.52 :
                       trimmedSymbol === 'DOT' ? 7.5 :
                       trimmedSymbol === 'AVAX' ? 35 :
                       trimmedSymbol === 'LINK' ? 15 :
                       trimmedSymbol === 'MATIC' ? 0.85 :
                       trimmedSymbol === 'UNI' ? 10 :
                       trimmedSymbol === 'SHIB' ? 0.00002 :
                       trimmedSymbol === 'ATOM' ? 8.5 :
                       trimmedSymbol === 'LTC' ? 80 :
                       trimmedSymbol === 'XLM' ? 0.12 :
                       trimmedSymbol === 'BNB' ? 1114 : 100;

      fallbackData.RAW[trimmedSymbol] = {
        [currency]: {
          PRICE: basePrice,
          VOLUME24HOUR: 1000000,
          VOLUME24HOURTO: 10000000,
          OPEN24HOUR: basePrice * 0.98,
          HIGH24HOUR: basePrice * 1.05,
          LOW24HOUR: basePrice * 0.95,
          CHANGE24HOUR: basePrice * 0.02,
          CHANGEPCT24HOUR: 2,
          MKTCAP: basePrice * 1000000,
          LASTUPDATE: Math.floor(Date.now() / 1000)
        }
      };

      fallbackData.DISPLAY[trimmedSymbol] = {
        [currency]: {
          PRICE: `$${basePrice.toLocaleString()}`,
          VOLUME24HOUR: `$${(1000000).toLocaleString()}`,
          VOLUME24HOURTO: `$${(10000000).toLocaleString()}`,
          OPEN24HOUR: `$${(basePrice * 0.98).toLocaleString()}`,
          HIGH24HOUR: `$${(basePrice * 1.05).toLocaleString()}`,
          LOW24HOUR: `$${(basePrice * 0.95).toLocaleString()}`,
          CHANGE24HOUR: `$${(basePrice * 0.02).toLocaleString()}`,
          CHANGEPCT24HOUR: "2.00",
          MKTCAP: `$${(basePrice * 1000000).toLocaleString()}`
        }
      };
    });

    return fallbackData;
  }
};
