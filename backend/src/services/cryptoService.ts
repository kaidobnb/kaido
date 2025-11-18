import axios from 'axios';
import dotenv from 'dotenv';
import { getCoinGeckoIdMapping, getCryptoCompareIdMapping, TOKEN_SYMBOLS } from '../config/tokens';

// Load environment variables
dotenv.config();

// CoinGecko API configuration (free tier)
const COINGECKO_API_URL = 'https://api.coingecko.com/api/v3';

// CryptoCompare API configuration
const CRYPTOCOMPARE_API_URL = 'https://min-api.cryptocompare.com/data';
const CRYPTOCOMPARE_API_KEY = process.env.CRYPTOCOMPARE_API_KEY || 'eaefbe41eae1fca7b9ccc8ef4103092df8f1e0330feaee0be27994080dc3e429';

// Asset symbol to CoinGecko ID mapping
const ASSET_IDS: Record<string, string> = getCoinGeckoIdMapping();

// Asset symbol to CryptoCompare ID mapping
const CRYPTOCOMPARE_IDS: Record<string, string> = getCryptoCompareIdMapping();

/**
 * Get the current price of a crypto asset
 * @param asset The asset symbol (e.g., BTC, ETH)
 * @returns The current price in USD
 */
export const getCurrentPrice = async (asset: string): Promise<number> => {
  const assetUpper = asset.toUpperCase();

  try {
    // Try CoinGecko first
    try {
      const assetId = ASSET_IDS[assetUpper];

      if (!assetId) {
        throw new Error(`Unsupported asset in CoinGecko: ${asset}`);
      }

      const response = await axios.get(`${COINGECKO_API_URL}/simple/price`, {
        params: {
          ids: assetId,
          vs_currencies: 'usd',
        }
      });

      if (response.data[assetId] && response.data[assetId].usd) {
        console.log(`Got price for ${asset} from CoinGecko: $${response.data[assetId].usd}`);
        return response.data[assetId].usd;
      }

      throw new Error('Invalid response from CoinGecko');
    } catch (coinGeckoError) {
      console.warn(`CoinGecko API failed for ${asset}, trying CryptoCompare as fallback:`, coinGeckoError);

      // Fallback to CryptoCompare
      const cryptoCompareId = CRYPTOCOMPARE_IDS[assetUpper];

      if (!cryptoCompareId) {
        throw new Error(`Unsupported asset in CryptoCompare: ${asset}`);
      }

      const response = await axios.get(`${CRYPTOCOMPARE_API_URL}/price`, {
        params: {
          fsym: cryptoCompareId,
          tsyms: 'USD',
          api_key: CRYPTOCOMPARE_API_KEY
        }
      });

      if (response.data && response.data.USD) {
        console.log(`Got price for ${asset} from CryptoCompare: $${response.data.USD}`);
        return response.data.USD;
      }

      throw new Error('Invalid response from CryptoCompare');
    }
  } catch (error) {
    console.error(`Error fetching price for ${asset} from all sources:`, error);
    throw error;
  }
};

/**
 * Get historical price data for a crypto asset
 * @param asset The asset symbol (e.g., BTC, ETH)
 * @param days Number of days of historical data to fetch
 * @returns Array of [timestamp, price] pairs
 */
export const getHistoricalPrices = async (asset: string, days: number = 30): Promise<[number, number][]> => {
  const assetUpper = asset.toUpperCase();

  try {
    // Try CoinGecko first
    try {
      const assetId = ASSET_IDS[assetUpper];

      if (!assetId) {
        throw new Error(`Unsupported asset in CoinGecko: ${asset}`);
      }

      const response = await axios.get(`${COINGECKO_API_URL}/coins/${assetId}/market_chart`, {
        params: {
          vs_currency: 'usd',
          days: days,
          interval: 'daily',
        }
      });

      if (response.data && response.data.prices && Array.isArray(response.data.prices)) {
        console.log(`Got historical prices for ${asset} from CoinGecko`);
        return response.data.prices;
      }

      throw new Error('Invalid response from CoinGecko');
    } catch (coinGeckoError) {
      console.warn(`CoinGecko API failed for historical data for ${asset}, trying CryptoCompare as fallback:`, coinGeckoError);

      // Fallback to CryptoCompare
      const cryptoCompareId = CRYPTOCOMPARE_IDS[assetUpper];

      if (!cryptoCompareId) {
        throw new Error(`Unsupported asset in CryptoCompare: ${asset}`);
      }

      // Calculate timestamp for start date (days ago)
      const now = Math.floor(Date.now() / 1000);
      const startTime = now - (days * 24 * 60 * 60);

      // Get daily historical data
      const response = await axios.get(`${CRYPTOCOMPARE_API_URL}/v2/histoday`, {
        params: {
          fsym: cryptoCompareId,
          tsym: 'USD',
          limit: days,
          toTs: now,
          api_key: CRYPTOCOMPARE_API_KEY
        }
      });

      if (response.data && response.data.Data && response.data.Data.Data && Array.isArray(response.data.Data.Data)) {
        console.log(`Got historical prices for ${asset} from CryptoCompare`);

        // Convert CryptoCompare format to CoinGecko format [timestamp, price]
        return response.data.Data.Data.map((dataPoint: any) => {
          return [dataPoint.time * 1000, dataPoint.close]; // Convert to milliseconds for consistency
        });
      }

      throw new Error('Invalid response from CryptoCompare');
    }
  } catch (error) {
    console.error(`Error fetching historical prices for ${asset} from all sources:`, error);
    throw error;
  }
};

/**
 * Check if a price target was reached within a specific time period
 * @param asset The asset symbol (e.g., BTC, ETH)
 * @param targetPrice The target price to check
 * @param startDate The start date of the period
 * @param endDate The end date of the period
 * @returns Boolean indicating if the target price was reached
 */
export const checkPriceTargetReached = async (
  asset: string,
  targetPrice: number | undefined,
  startDate: Date,
  endDate: Date
): Promise<boolean> => {
  // If targetPrice is undefined, return false
  if (targetPrice === undefined) {
    return false;
  }
  try {
    // Log the dates for debugging
    console.log(`Checking if ${asset} reached $${targetPrice} between ${startDate.toISOString()} and ${endDate.toISOString()}`);

    // For short-term predictions (less than 1 day), just use the current price
    const timeDiffMinutes = (endDate.getTime() - startDate.getTime()) / (1000 * 60);

    if (timeDiffMinutes <= 1440) { // 24 hours or less
      // Get the current price
      const currentPrice = await getCurrentPrice(asset);
      console.log(`Short-term prediction (${timeDiffMinutes.toFixed(2)} minutes): Using current price $${currentPrice} for ${asset}`);

      // Compare with target price
      const result = currentPrice >= targetPrice;
      console.log(`Target price $${targetPrice} ${result ? 'was' : 'was not'} reached. Current price: $${currentPrice}`);
      return result;
    } else {
      // For longer-term predictions, use historical data
      const assetId = ASSET_IDS[asset.toUpperCase()];

      if (!assetId) {
        throw new Error(`Unsupported asset: ${asset}`);
      }

      // Calculate days between start and end dates
      const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      console.log(`Long-term prediction (${daysDiff} days): Using historical data for ${asset}`);

      // Get historical prices
      const prices = await getHistoricalPrices(asset, daysDiff);

      // Check if any price point is above the target price
      const result = prices.some(([timestamp, price]) => {
        const priceDate = new Date(timestamp);
        return price >= targetPrice && priceDate >= startDate && priceDate <= endDate;
      });

      console.log(`Target price $${targetPrice} ${result ? 'was' : 'was not'} reached based on historical data`);
      return result;
    }
  } catch (error) {
    console.error(`Error checking price target for ${asset}:`, error);
    throw error;
  }
};

/**
 * Determine which price range a crypto asset falls into at a specific date
 * @param asset The asset symbol (e.g., BTC, ETH)
 * @param priceRanges Array of price range strings (e.g., ["$0-$1000", "$1000-$2000"])
 * @param date The date to check
 * @returns The matching price range or null if none match
 */
export const determinePriceRange = async (
  asset: string,
  priceRanges: string[],
  date: Date
): Promise<string | null> => {
  try {
    // Get the price at the specified date
    // For now, we use the current price, but in the future we could use historical price at exact time
    const currentPrice = await getCurrentPrice(asset);

    console.log(`Determining price range for ${asset} at ${date.toISOString()}, current price: $${currentPrice}`);

    // Parse price ranges and find the matching one
    for (const range of priceRanges) {
      const rangeMatch = range.match(/\$([0-9,.]+)-\$([0-9,.]+)/);

      if (rangeMatch) {
        const lowerBound = parseFloat(rangeMatch[1].replace(/,/g, ''));
        const upperBound = parseFloat(rangeMatch[2].replace(/,/g, ''));

        if (currentPrice >= lowerBound && currentPrice < upperBound) {
          console.log(`${asset} price $${currentPrice} falls in range ${range}`);
          return range;
        }
      } else if (range.toLowerCase().includes('above')) {
        // Handle "Above $X" format
        const aboveMatch = range.match(/above\s*\$([0-9,.]+)/i);
        if (aboveMatch) {
          const threshold = parseFloat(aboveMatch[1].replace(/,/g, ''));
          if (currentPrice >= threshold) {
            console.log(`${asset} price $${currentPrice} is above $${threshold}`);
            return range;
          }
        }
      } else if (range.toLowerCase().includes('below')) {
        // Handle "Below $X" format
        const belowMatch = range.match(/below\s*\$([0-9,.]+)/i);
        if (belowMatch) {
          const threshold = parseFloat(belowMatch[1].replace(/,/g, ''));
          if (currentPrice < threshold) {
            console.log(`${asset} price $${currentPrice} is below $${threshold}`);
            return range;
          }
        }
      }
    }

    console.log(`${asset} price $${currentPrice} does not match any range`);
    return null;
  } catch (error) {
    console.error(`Error determining price range for ${asset}:`, error);
    throw error;
  }
};
