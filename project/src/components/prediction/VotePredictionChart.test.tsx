import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import VotePredictionChart from './VotePredictionChart';
import * as cryptoService from '../../services/cryptoService';

// Mock the crypto service
jest.mock('../../services/cryptoService', () => ({
  getCurrentPrice: jest.fn()
}));

describe('VotePredictionChart', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock the getCurrentPrice function
    (cryptoService.getCurrentPrice as jest.Mock).mockResolvedValue({
      USD: 68432.51
    });
  });

  it('renders the chart with correct asset name', async () => {
    render(
      <VotePredictionChart
        predictionId="1"
        tokenType="SOL"
        asset="BTC"
        targetPrice={85000}
        currentProbability={0.5}
      />
    );

    // Check if the asset name is displayed
    expect(screen.getByText('BTC Prediction Market')).toBeInTheDocument();
    
    // Wait for the price to be fetched and displayed
    await waitFor(() => {
      expect(cryptoService.getCurrentPrice).toHaveBeenCalledWith('BTC');
    });
  });

  it('displays the current probability', async () => {
    render(
      <VotePredictionChart
        predictionId="1"
        tokenType="SOL"
        asset="ETH"
        targetPrice={3500}
        currentProbability={0.7}
      />
    );

    // The probability should be displayed as 70.0%
    await waitFor(() => {
      const probabilityText = screen.getByText('70.0%');
      expect(probabilityText).toBeInTheDocument();
    });
  });

  it('shows yes and no probabilities in market stats', async () => {
    render(
      <VotePredictionChart
        predictionId="1"
        tokenType="BNB"
        asset="BTC"
        targetPrice={85000}
        currentProbability={0.6}
      />
    );

    // Wait for the component to render
    await waitFor(() => {
      expect(screen.getByText('Yes Probability:')).toBeInTheDocument();
      expect(screen.getByText('No Probability:')).toBeInTheDocument();
    });

    // Check that the probabilities add up to 100%
    const yesProb = parseFloat(screen.getByText('60.0%').textContent!.replace('%', ''));
    const noProb = parseFloat(screen.getByText('40.0%').textContent!.replace('%', ''));
    expect(yesProb + noProb).toBe(100);
  });
});
