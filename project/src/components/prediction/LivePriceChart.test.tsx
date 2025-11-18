import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import LivePriceChart from './LivePriceChart';
import * as cryptoService from '../../services/cryptoService';

// Mock the crypto service
jest.mock('../../services/cryptoService', () => ({
  getCurrentPrice: jest.fn(),
  getHistoricalPriceData: jest.fn()
}));

describe('LivePriceChart', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock the getCurrentPrice function
    (cryptoService.getCurrentPrice as jest.Mock).mockResolvedValue({
      USD: 68432.51
    });
    
    // Mock the getHistoricalPriceData function
    (cryptoService.getHistoricalPriceData as jest.Mock).mockResolvedValue({
      Data: Array(24).fill(0).map((_, i) => ({
        time: Math.floor(Date.now() / 1000) - (23 - i) * 3600,
        close: 68000 + Math.random() * 1000
      }))
    });
  });

  it('renders the chart with correct asset name', async () => {
    render(
      <LivePriceChart
        predictionId="1"
        tokenType="SOL"
        asset="BTC"
        targetPrice={85000}
        currentProbability={0.5}
      />
    );

    // Check if the asset name is displayed
    expect(screen.getByText('BTC Live Price')).toBeInTheDocument();
    
    // Wait for the price to be fetched and displayed
    await waitFor(() => {
      expect(cryptoService.getCurrentPrice).toHaveBeenCalledWith('BTC');
    });
  });

  it('displays the current price', async () => {
    render(
      <LivePriceChart
        predictionId="1"
        tokenType="SOL"
        asset="ETH"
        targetPrice={3500}
        currentProbability={0.7}
      />
    );

    // Wait for the price to be fetched and displayed
    await waitFor(() => {
      expect(cryptoService.getCurrentPrice).toHaveBeenCalledWith('ETH');
    });
    
    // The price should be displayed in the format $68,432.51
    await waitFor(() => {
      const priceText = screen.getByText('$68,432.51');
      expect(priceText).toBeInTheDocument();
    });
  });

  it('fetches historical data with correct parameters', async () => {
    render(
      <LivePriceChart
        predictionId="1"
        tokenType="SOL"
        asset="BTC"
        targetPrice={85000}
        currentProbability={0.5}
      />
    );

    // Wait for the historical data to be fetched
    await waitFor(() => {
      expect(cryptoService.getHistoricalPriceData).toHaveBeenCalledWith(
        'BTC',
        'USD',
        24,
        1,
        'hour'
      );
    });
  });
});
