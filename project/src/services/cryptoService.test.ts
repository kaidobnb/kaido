import axios from 'axios';
import { getCurrentPrice, getHistoricalPriceData, getMultiplePrices, getFullPriceData } from './cryptoService';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('Crypto Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getCurrentPrice', () => {
    it('should fetch current price with correct parameters', async () => {
      // Mock the axios response
      mockedAxios.get.mockResolvedValueOnce({
        data: { USD: 68432.51 }
      });

      // Call the function
      const result = await getCurrentPrice('BTC');

      // Check if axios was called with the correct URL and parameters
      expect(mockedAxios.get).toHaveBeenCalledWith(
        'https://min-api.cryptocompare.com/data/price',
        {
          params: {
            fsym: 'BTC',
            tsyms: 'USD',
            api_key: '0bb48079e29c9de72aef520f5395277a5dc38e86a98d9ab6dfab0c14c8aec09b'
          }
        }
      );

      // Check the result
      expect(result).toEqual({ USD: 68432.51 });
    });

    it('should handle errors', async () => {
      // Mock the axios error
      mockedAxios.get.mockRejectedValueOnce(new Error('API error'));

      // Call the function and expect it to throw
      await expect(getCurrentPrice('BTC')).rejects.toThrow('API error');
    });
  });

  describe('getHistoricalPriceData', () => {
    it('should fetch historical data with correct parameters', async () => {
      // Mock the axios response
      mockedAxios.get.mockResolvedValueOnce({
        data: {
          Data: [
            { time: 1619712000, close: 54000 },
            { time: 1619798400, close: 57000 }
          ]
        }
      });

      // Call the function
      const result = await getHistoricalPriceData('BTC', 'USD', 2, 1, 'day');

      // Check if axios was called with the correct URL and parameters
      expect(mockedAxios.get).toHaveBeenCalledWith(
        'https://min-api.cryptocompare.com/data/histoday',
        {
          params: {
            fsym: 'BTC',
            tsym: 'USD',
            limit: 2,
            aggregate: 1,
            api_key: '0bb48079e29c9de72aef520f5395277a5dc38e86a98d9ab6dfab0c14c8aec09b'
          }
        }
      );

      // Check the result
      expect(result).toEqual({
        Data: [
          { time: 1619712000, close: 54000 },
          { time: 1619798400, close: 57000 }
        ]
      });
    });
  });

  describe('getMultiplePrices', () => {
    it('should fetch multiple prices with correct parameters', async () => {
      // Mock the axios response
      mockedAxios.get.mockResolvedValueOnce({
        data: {
          BTC: { USD: 68432.51 },
          ETH: { USD: 3500.25 }
        }
      });

      // Call the function
      const result = await getMultiplePrices(['BTC', 'ETH']);

      // Check if axios was called with the correct URL and parameters
      expect(mockedAxios.get).toHaveBeenCalledWith(
        'https://min-api.cryptocompare.com/data/pricemulti',
        {
          params: {
            fsyms: 'BTC,ETH',
            tsyms: 'USD',
            api_key: '0bb48079e29c9de72aef520f5395277a5dc38e86a98d9ab6dfab0c14c8aec09b'
          }
        }
      );

      // Check the result
      expect(result).toEqual({
        BTC: { USD: 68432.51 },
        ETH: { USD: 3500.25 }
      });
    });
  });

  describe('getFullPriceData', () => {
    it('should fetch full price data with correct parameters', async () => {
      // Mock the axios response
      mockedAxios.get.mockResolvedValueOnce({
        data: {
          RAW: {
            BTC: {
              USD: {
                PRICE: 68432.51,
                VOLUME24HOUR: 45000000000,
                MKTCAP: 1300000000000
              }
            }
          }
        }
      });

      // Call the function
      const result = await getFullPriceData('BTC');

      // Check if axios was called with the correct URL and parameters
      expect(mockedAxios.get).toHaveBeenCalledWith(
        'https://min-api.cryptocompare.com/data/pricemultifull',
        {
          params: {
            fsyms: 'BTC',
            tsyms: 'USD',
            api_key: '0bb48079e29c9de72aef520f5395277a5dc38e86a98d9ab6dfab0c14c8aec09b'
          }
        }
      );

      // Check the result
      expect(result).toEqual({
        RAW: {
          BTC: {
            USD: {
              PRICE: 68432.51,
              VOLUME24HOUR: 45000000000,
              MKTCAP: 1300000000000
            }
          }
        }
      });
    });
  });
});
