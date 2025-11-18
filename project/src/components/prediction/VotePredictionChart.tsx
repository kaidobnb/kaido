import React, { useEffect, useState, useRef } from 'react';
import { ArrowUp, ArrowDown, TrendingUp } from 'lucide-react';
import { getCurrentPrice } from '../../services/cryptoService';
import { getRecentVotes } from '../../services/api';

interface VotePredictionChartProps {
  predictionId: string;
  tokenType: string;
  asset: string;
  targetPrice?: number;
  currentProbability?: number;
  externalRecentVotes?: Array<{
    position: string;
    amount: number;
    createdAt: string;
    user?: {
      username: string;
      avatar: string;
    };
  }>;
}

const VotePredictionChart: React.FC<VotePredictionChartProps> = ({
  predictionId,
  tokenType,
  asset = 'BTC',
  targetPrice = 0,
  currentProbability = 0.5,
  externalRecentVotes = []
}) => {
  const [currentPrice, setCurrentPrice] = useState<number>(0);
  const [bnbPrice, setBnbPrice] = useState<number>(0.50); // Default BNB price
  const [voteDirection, setVoteDirection] = useState<'up' | 'down' | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [voteProbability, setVoteProbability] = useState<number>(currentProbability * 100);
  const [yesVotes, setYesVotes] = useState<number>(0);
  const [noVotes, setNoVotes] = useState<number>(0);
  const [yesAmount, setYesAmount] = useState<number>(0);
  const [noAmount, setNoAmount] = useState<number>(0);
  const [voteHistory, setVoteHistory] = useState<Array<{
    value: number;
    time: string;
    timestamp: number;
  }>>([]);
  const [recentVotes, setRecentVotes] = useState<Array<{
    type: 'yes' | 'no';
    amount: number;
    probability: number;
    time: Date;
  }>>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Refs to prevent excessive API calls
  const isFetchingRef = useRef<boolean>(false);
  const lastFetchTimeRef = useRef<number>(0);
  const apiEndpointMissingRef = useRef<boolean>(false);

  // Fetch votes directly when component mounts
  useEffect(() => {
    const fetchVotesDirectly = async () => {
      if (!predictionId) return;

      try {
        console.log('Directly fetching votes for prediction:', predictionId);
        const response = await getRecentVotes(predictionId);

        if (response && response.success && Array.isArray(response.votes)) {
          // Count yes/no votes and track stake amounts
          let yesCount = 0;
          let noCount = 0;
          let yesStakeAmount = 0;
          let noStakeAmount = 0;

          response.votes.forEach(vote => {
            const amount = parseFloat(vote.amount) || 0;

            if (vote.position === 'yes') {
              yesCount++;
              yesStakeAmount += amount;
            } else if (vote.position === 'no') {
              noCount++;
              noStakeAmount += amount;
            }
          });

          // Update vote counts and stake amounts
          setYesVotes(yesCount);
          setNoVotes(noCount);
          setYesAmount(yesStakeAmount);
          setNoAmount(noStakeAmount);

          console.log(`Direct API call found ${response.votes.length} votes: Yes=${yesCount} (${yesStakeAmount} ${tokenType}), No=${noCount} (${noStakeAmount} ${tokenType})`);

          // If we have votes, update the probability based on stake amounts
          const totalStake = yesStakeAmount + noStakeAmount;
          if (totalStake > 0) {
            const yesPercentage = (yesStakeAmount / totalStake) * 100;
            // Apply a damping factor to make changes more gradual
            const currentProbability = voteProbability;
            const dampingFactor = 0.7; // 70% of the new value, 30% of the old value
            const newProbability = (yesPercentage * dampingFactor) + (currentProbability * (1 - dampingFactor));

            // Ensure the probability stays within reasonable bounds (10-90%)
            const boundedProbability = Math.max(10, Math.min(90, newProbability));
            setVoteProbability(boundedProbability);
          }
        } else {
          console.log('No votes found from direct API call');
        }
      } catch (error) {
        console.error('Error fetching votes directly:', error);
      }
    };

    // Call the function
    fetchVotesDirectly();
  }, [predictionId]);

  // Fetch current crypto prices for reference
  useEffect(() => {
    const fetchCurrentPrices = async () => {
      try {
        // Fetch the asset price (BTC, ETH, etc.)
        const assetData = await getCurrentPrice(asset);
        setCurrentPrice(assetData.USD);

        // Fetch BNB price as well
        if (asset.toUpperCase() !== 'BNB') {
          const bnbData = await getCurrentPrice('BNB');
          setBnbPrice(bnbData.USD);
        } else {
          // If the asset is BNB, use the same price
          setBnbPrice(assetData.USD);
        }

        setLastUpdate(new Date());
      } catch (err) {
        console.error('Error fetching current prices:', err);
      }
    };

    fetchCurrentPrices();

    // Set up interval to fetch prices every 30 seconds
    const interval = setInterval(fetchCurrentPrices, 30000);

    return () => clearInterval(interval);
  }, [asset]);

  // Generate vote history data and fetch recent votes
  useEffect(() => {
    // Skip initial chart generation if we're still waiting for external votes to be processed
    if (externalRecentVotes && externalRecentVotes.length > 0 && yesVotes === 0 && noVotes === 0) {
      console.log('Delaying chart generation until external votes are processed');
      return;
    }

    console.log('Generating chart data with current vote counts:', { yesVotes, noVotes });

    // Generate timestamps for the last 24 hours (1 hour intervals)
    const history = [];

    // Calculate the probability based on votes if available, otherwise use the provided probability
    const totalVotes = yesVotes + noVotes;
    const baseProb = totalVotes > 0
      ? (yesVotes / totalVotes) * 100
      : currentProbability * 100;

    // Start with a value of 0 for the first point to ensure chart starts from zero
    let lastValue = 0;

    // Generate dates for the x-axis (past 3 weeks)
    const dates = [];
    const today = new Date();
    for (let i = 21; i >= 0; i--) {
      const date = new Date();
      date.setDate(today.getDate() - i);
      dates.push(date);
    }

    // Generate vote probability data with a more pronounced trend
    for (let i = 0; i < dates.length; i++) {
      const date = dates[i];
      const timeStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

      // For the first point, always start at zero
      if (i === 0) {
        history.push({
          value: 0, // Start at zero
          time: timeStr,
          timestamp: date.getTime()
        });
        continue;
      }

      // Calculate progress from start to end (0 to 1)
      const progress = (i - 1) / (dates.length - 2); // Adjusted for zero start

      // Create a more pronounced trend toward the current probability
      // Start at 0 and gradually move toward the current probability
      const targetValue = baseProb * progress;

      // Add some randomness but with stronger trend toward target
      const randomFactor = (Math.random() - 0.5) * 5; // Random change between -2.5 and 2.5
      const trendFactor = (targetValue - lastValue) * 0.3; // Stronger pull toward target

      lastValue = Math.max(5, Math.min(95, lastValue + randomFactor + trendFactor));

      history.push({
        value: lastValue,
        time: timeStr,
        timestamp: date.getTime()
      });
    }

    // Make sure the final value is very close to the current probability
    if (history.length > 0) {
      history[history.length - 1].value = baseProb;
    }

    setVoteHistory(history);

    // Set the probability based on actual votes if available
    if (totalVotes > 0) {
      setVoteProbability((yesVotes / totalVotes) * 100);
    } else {
      setVoteProbability(baseProb);
    }

    console.log(`Initialized chart with probability: ${baseProb.toFixed(1)}%, Yes votes: ${yesVotes}, No votes: ${noVotes}`);

    // Fetch real recent votes from the API
    const fetchRecentVotes = async () => {
      // Prevent multiple simultaneous API calls
      if (isFetchingRef.current) {
        generateSimulatedVotes();
        setIsLoading(false);
        return;
      }

      // If we already know the API endpoint is missing, don't try to call it again
      if (apiEndpointMissingRef.current) {
        console.log('Skipping API call - endpoint known to be missing');
        generateSimulatedVotes();
        setIsLoading(false);
        return;
      }

      // Throttle API calls - don't call more than once every 10 seconds
      const now = Date.now();
      const timeSinceLastFetch = now - lastFetchTimeRef.current;
      if (timeSinceLastFetch < 10000 && lastFetchTimeRef.current !== 0) {
        console.log('Throttling API call - too soon since last call');
        generateSimulatedVotes();
        setIsLoading(false);
        return;
      }

      isFetchingRef.current = true;

      try {
        // Note: This API endpoint doesn't exist yet in the backend
        // This is expected to fail and fall back to simulated data
        console.log('Attempting to fetch real votes (API endpoint may not exist yet)');
        const response = await getRecentVotes(predictionId);

        if (response && response.success) {
          if (Array.isArray(response.votes) && response.votes.length > 0) {
            // Transform the API response to match our expected format
            const formattedVotes = response.votes.map(vote => ({
              type: vote.position === 'yes' ? 'yes' : 'no',
              amount: parseFloat(vote.amount),
              probability: parseFloat(vote.probability),
              time: new Date(vote.timestamp)
            }));

            setRecentVotes(formattedVotes.slice(0, 5));
            console.log('Fetched real votes:', formattedVotes);

            // If we have real votes, use the latest probability
            if (formattedVotes.length > 0) {
              setVoteProbability(formattedVotes[0].probability);
            }
          } else {
            // API endpoint exists but no votes are available yet
            console.log('API endpoint exists but no votes available yet');
            generateSimulatedVotes();
          }
        } else {
          console.log('No real votes available from API, using simulated votes');
          // Mark the API endpoint as missing to avoid future calls
          apiEndpointMissingRef.current = true;
          generateSimulatedVotes();
        }
      } catch (error) {
        // This is expected since the API endpoint doesn't exist yet
        console.log('API endpoint for votes not implemented yet, using simulated votes');
        // Mark the API endpoint as missing to avoid future calls
        apiEndpointMissingRef.current = true;
        generateSimulatedVotes();
      } finally {
        setIsLoading(false);
        isFetchingRef.current = false;
        lastFetchTimeRef.current = Date.now();
      }
    };

    // Helper function to generate simulated votes
    const generateSimulatedVotes = () => {
      const newVotes = [];
      let currentProb = currentProbability * 100;
      let yesCount = 0;
      let noCount = 0;

      for (let i = 0; i < 5; i++) {
        const bias = currentProb > 50 ? 0.6 : 0.4;
        const type = Math.random() > bias ? 'no' : 'yes';
        const amount = parseFloat((Math.random() * 15 + 1).toFixed(2));
        const probChange = (type === 'yes' ? 0.5 : -0.5) + (Math.random() * 1 - 0.5);
        currentProb = Math.max(5, Math.min(95, currentProb + probChange));

        // Count votes by type
        if (type === 'yes') {
          yesCount++;
        } else {
          noCount++;
        }

        const time = new Date();
        time.setMinutes(time.getMinutes() - i * (3 + Math.floor(Math.random() * 5)));

        newVotes.push({
          type,
          amount,
          probability: parseFloat(currentProb.toFixed(1)),
          time
        });
      }

      console.log('Generated simulated votes:', newVotes);
      setRecentVotes(newVotes);
      setYesVotes(yesCount);
      setNoVotes(noCount);
    };

    fetchRecentVotes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [predictionId, currentProbability, externalRecentVotes, yesVotes, noVotes]);

  // Update chart when vote counts or amounts change
  useEffect(() => {
    // Only update if we have votes and avoid infinite loops with the other effect
    if ((yesVotes > 0 || noVotes > 0)) {
      // Force a small delay to ensure this runs after the vote counts are updated
      setTimeout(() => {
      // Use stake amounts for percentage calculation, not just vote counts
      const totalStake = yesAmount + noAmount;
      const yesPercentage = totalStake > 0 ? (yesAmount / totalStake) * 100 : 50;

      // Update the vote probability based on actual vote counts
      setVoteProbability(yesPercentage);

      // Update the vote history to reflect the new probability
      const newHistoryPoint = {
        value: yesPercentage,
        time: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        timestamp: new Date().getTime()
      };

      setVoteHistory(prev => {
        // If we have an empty history or the first point is not at zero, create a new history
        if (prev.length === 0 || prev[0].value !== 0) {
          // Create a new history starting from zero
          const newHistory = [];

          // Add the zero point
          newHistory.push({
            value: 0,
            time: new Date(Date.now() - 86400000 * 21).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            timestamp: Date.now() - 86400000 * 21
          });

          // Add intermediate points with a trend toward the current percentage
          for (let i = 1; i < 21; i++) {
            const progress = i / 21;
            newHistory.push({
              value: yesPercentage * progress,
              time: new Date(Date.now() - 86400000 * (21 - i)).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
              timestamp: Date.now() - 86400000 * (21 - i)
            });
          }

          // Add the current point
          newHistory.push({
            value: yesPercentage,
            time: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            timestamp: Date.now()
          });

          return newHistory;
        } else {
          // Create a new history that trends toward the current vote percentage
          const newHistory = [...prev];

          // Keep the first point at zero
          if (newHistory.length > 0) {
            newHistory[0].value = 0;
          }

          // Update the last few points to create a trend toward the current percentage
          const pointsToUpdate = Math.min(5, newHistory.length - 1); // -1 to avoid updating the zero point
          for (let i = 1; i <= pointsToUpdate; i++) {
            const index = newHistory.length - i;
            if (index > 0) { // Skip the zero point
              // Create a gradual trend toward the current percentage
              const weight = (pointsToUpdate - i + 1) / pointsToUpdate;
              const targetValue = yesPercentage * weight;
              newHistory[index].value = targetValue;
            }
          }

          return newHistory;
        }
      });

      console.log(`Updated chart based on votes: Yes=${yesVotes} (${yesAmount.toFixed(2)} ${tokenType}), No=${noVotes} (${noAmount.toFixed(2)} ${tokenType}), Percentage=${yesPercentage.toFixed(1)}%`);
      }, 100); // 100ms delay
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [yesVotes, noVotes, yesAmount, noAmount]);

  // Process all existing votes when the component mounts or when external votes change
  useEffect(() => {
    // Process all votes to count yes/no votes
    if (externalRecentVotes && externalRecentVotes.length > 0) {
      console.log('Processing external votes:', externalRecentVotes);

      // Count yes/no votes and track stake amounts from all external votes
      let yesCount = 0;
      let noCount = 0;
      let yesStakeAmount = 0;
      let noStakeAmount = 0;

      externalRecentVotes.forEach(vote => {
        const amount = parseFloat(vote.amount.toString()) || 0;

        if (vote.position === 'yes') {
          yesCount++;
          yesStakeAmount += amount;
        } else if (vote.position === 'no') {
          noCount++;
          noStakeAmount += amount;
        }
      });

      // Update vote counts and stake amounts with the total counts from all votes
      setYesVotes(yesCount);
      setNoVotes(noCount);
      setYesAmount(yesStakeAmount);
      setNoAmount(noStakeAmount);

      console.log(`Processed ${externalRecentVotes.length} existing votes: Yes=${yesCount} (${yesStakeAmount.toFixed(2)} ${tokenType}), No=${noCount} (${noStakeAmount.toFixed(2)} ${tokenType})`);

      // Process the latest vote for chart updates

      // Get the latest vote
      const latestVote = externalRecentVotes[0];

      // Calculate a more significant probability change based on vote amount
      // Larger stake amounts should have more impact on the probability
      const amount = parseFloat(latestVote.amount.toString());
      const baseChange = latestVote.position === 'yes' ? 2.5 : -2.5; // Base change direction

      // Scale the change based on amount (larger amounts = larger changes)
      // Use a logarithmic scale to prevent extremely large amounts from dominating
      const scaleFactor = Math.log10(amount + 1) * 1.5;
      const probabilityChange = baseChange * scaleFactor;

      // Convert external vote format to internal format
      const formattedVote = {
        type: latestVote.position === 'yes' ? 'yes' : 'no',
        amount: amount,
        probability: Math.max(5, Math.min(95, voteProbability + probabilityChange)), // Adjust probability based on vote with bounds
        time: new Date(latestVote.createdAt)
      };

      // Update vote direction based on vote type
      setVoteDirection(formattedVote.type === 'yes' ? 'up' : 'down');

      // Update recent votes list - only add if it's not already there
      const voteExists = recentVotes.some(v =>
        v.time && formattedVote.time &&
        Math.abs(v.time.getTime() - formattedVote.time.getTime()) < 1000 &&
        v.amount === formattedVote.amount
      );

      if (!voteExists) {
        setRecentVotes(prev => [formattedVote, ...prev.slice(0, 4)]);

        // Update probability
        const newProbability = Math.max(5, Math.min(95, formattedVote.probability));
        setVoteProbability(newProbability);

        // Update last update time
        setLastUpdate(new Date());

        // Update vote history with new data point
        const newHistoryPoint = {
          value: newProbability,
          time: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          timestamp: new Date().getTime()
        };

        setVoteHistory(prev => {
          // If we have an empty history or the first point is not at zero, create a new history
          if (prev.length === 0 || prev[0].value !== 0) {
            // Create a new history starting from zero
            const newHistory = [];

            // Add the zero point
            newHistory.push({
              value: 0,
              time: new Date(Date.now() - 86400000 * 21).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
              timestamp: Date.now() - 86400000 * 21
            });

            // Add intermediate points with a trend toward the new probability
            for (let i = 1; i < 21; i++) {
              const progress = i / 21;
              newHistory.push({
                value: newProbability * progress,
                time: new Date(Date.now() - 86400000 * (21 - i)).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                timestamp: Date.now() - 86400000 * (21 - i)
              });
            }

            // Add the current point
            newHistory.push(newHistoryPoint);

            return newHistory;
          } else {
            // Remove oldest point (but keep the zero point) and add new one at the end
            const updatedHistory = [...prev];
            if (updatedHistory.length > 2) { // Keep at least the zero point and one more
              updatedHistory.splice(1, 1); // Remove the second point (keep the zero point)
            }
            updatedHistory.push(newHistoryPoint);
            return updatedHistory;
          }
        });

        // Update vote counts based on vote type
        if (formattedVote.type === 'yes') {
          setYesVotes(prev => prev + 1);
        } else {
          setNoVotes(prev => prev + 1);
        }

        console.log('Added new vote to chart:', formattedVote);
      }
    }
  }, [externalRecentVotes]);

  // Fetch real-time vote updates
  useEffect(() => {
    // Function to fetch the latest votes
    const fetchLatestVotes = async () => {
      // Prevent multiple simultaneous API calls
      if (isFetchingRef.current) {
        return;
      }

      // If we already know the API endpoint is missing, don't try to call it again
      if (apiEndpointMissingRef.current) {
        simulateVote();
        return;
      }

      // Throttle API calls - don't call more than once every 10 seconds
      const now = Date.now();
      const timeSinceLastFetch = now - lastFetchTimeRef.current;
      if (timeSinceLastFetch < 10000 && lastFetchTimeRef.current !== 0) {
        return;
      }

      isFetchingRef.current = true;

      try {
        // Call the API to get recent votes
        const response = await getRecentVotes(predictionId);

        if (response && response.success) {
          if (Array.isArray(response.votes) && response.votes.length > 0) {
            // Transform the API response to match our expected format
            const formattedVotes = response.votes.map(vote => ({
              type: vote.position === 'yes' ? 'yes' : 'no',
              amount: parseFloat(vote.amount),
              probability: parseFloat(vote.probability),
              time: new Date(vote.timestamp)
            }));

            // Get the latest vote
            const latestVote = formattedVotes[0];

            // Check if this is a new vote (not already in our list)
            const isNewVote = recentVotes.length === 0 ||
              (recentVotes[0].time && latestVote.time &&
               latestVote.time.getTime() > recentVotes[0].time.getTime());

            if (isNewVote) {
              // Update vote direction based on vote type
              setVoteDirection(latestVote.type === 'yes' ? 'up' : 'down');

              // Update recent votes list
              setRecentVotes(prev => [latestVote, ...prev.slice(0, 4)]);

              // Update probability
              setVoteProbability(latestVote.probability);

              // Update last update time
              setLastUpdate(new Date());

              console.log('New vote detected:', latestVote);
            }
          } else {
            // API endpoint exists but no votes are available yet
            console.log('API endpoint exists but no votes available yet');

            // If we don't have any votes yet, simulate some
            if (recentVotes.length === 0) {
              console.log('No existing votes, generating simulated votes');
              simulateVote();
            }
          }
        } else {
          // If API response is not successful, simulate one
          if (!apiEndpointMissingRef.current) {
            console.log('API response not successful, using simulated votes');
            simulateVote();
          }
        }
      } catch (error) {
        // Mark the API endpoint as missing to avoid future calls
        if (!apiEndpointMissingRef.current) {
          console.log('API endpoint for votes not implemented yet, using simulated votes');
          apiEndpointMissingRef.current = true;
          simulateVote();
        }
      } finally {
        isFetchingRef.current = false;
        lastFetchTimeRef.current = Date.now();
      }
    };

    // Function to simulate a vote when real data isn't available
    const simulateVote = () => {
      // If this is the first vote, initialize with a specific pattern
      // to ensure consistent behavior on page reload
      if (yesVotes === 0 && noVotes === 0) {
        // Start with a fixed ratio to establish a consistent baseline
        // 60% NO, 40% YES
        setYesVotes(4);
        setNoVotes(6);
        setYesAmount(4);
        setNoAmount(6);
        setVoteProbability(40);

        // Add initial votes to the recent votes list
        const initialVotes = [
          {
            type: 'no',
            amount: 5,
            probability: 60,
            time: new Date(Date.now() - 30000) // 30 seconds ago
          },
          {
            type: 'no',
            amount: 3,
            probability: 58,
            time: new Date(Date.now() - 60000) // 1 minute ago
          },
          {
            type: 'yes',
            amount: 4,
            probability: 42,
            time: new Date(Date.now() - 90000) // 1.5 minutes ago
          },
          {
            type: 'no',
            amount: 6,
            probability: 55,
            time: new Date(Date.now() - 120000) // 2 minutes ago
          },
          {
            type: 'yes',
            amount: 5,
            probability: 45,
            time: new Date(Date.now() - 150000) // 2.5 minutes ago
          }
        ];

        setRecentVotes(initialVotes);
        setLastUpdate(new Date());

        return;
      }

      // Calculate current YES and NO percentages based on stake amounts
      const totalStake = yesAmount + noAmount;
      const currentYesPercentage = totalStake > 0 ? (yesAmount / totalStake) * 100 : 50;
      const currentNoPercentage = totalStake > 0 ? (noAmount / totalStake) * 100 : 50;

      // Determine which side is currently winning
      const isYesWinning = currentYesPercentage > currentNoPercentage;

      // Create a more predictable voting pattern that maintains the current trend
      // with occasional shifts to create interest
      let type;

      // Use a seeded random approach to make the pattern more consistent
      // between page reloads
      const seed = Math.floor(Date.now() / 5000); // Changes every 5 seconds
      const pseudoRandom = (seed * 9301 + 49297) % 233280 / 233280;

      if (isYesWinning) {
        // If YES is winning, 70% chance to continue the trend, 30% chance to vote NO
        type = pseudoRandom < 0.7 ? 'yes' : 'no';
      } else {
        // If NO is winning, 70% chance to continue the trend, 30% chance to vote YES
        type = pseudoRandom < 0.7 ? 'no' : 'yes';
      }

      // More consistent BNB amounts based on the seed
      const amount = parseFloat(((seed % 5) + 3).toFixed(2)); // 3-8 BNB

      // Calculate new probability with smaller, more consistent changes
      // Use smaller changes to avoid wild swings
      const baseChange = type === 'yes' ? 2.0 : -2.0;

      // Scale the change based on amount (larger amounts = larger changes)
      // Use a logarithmic scale to prevent extremely large amounts from dominating
      const scaleFactor = Math.log10(amount + 1) * 0.8; // Reduced from 1.5 to 0.8 for more gradual changes
      const probabilityChange = baseChange * scaleFactor;

      // Apply damping factor to make changes more gradual
      const dampingFactor = 0.7; // 70% of the new value, 30% of the old value
      const dampedChange = probabilityChange * dampingFactor;

      // Calculate new probability percentage (0-100)
      const newProbability = parseFloat((currentYesPercentage + dampedChange).toFixed(1));

      // Keep probability within bounds (10-90%) to avoid extreme values
      const boundedProbability = Math.max(10, Math.min(90, newProbability));

      // Update vote direction based on vote type
      setVoteDirection(type === 'yes' ? 'up' : 'down');

      // Add to recent votes
      const newVote = {
        type,
        amount,
        probability: type === 'yes' ? boundedProbability : 100 - boundedProbability,
        time: new Date()
      };

      // Update UI state
      setRecentVotes(prev => [newVote, ...prev.slice(0, 4)]);
      setVoteProbability(boundedProbability);
      setLastUpdate(new Date());

      // Update vote history with new data point
      const newHistoryPoint = {
        value: boundedProbability,
        time: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        timestamp: new Date().getTime()
      };

      // Update vote history to ensure it starts from zero
      setVoteHistory(prev => {
        // If we have an empty history or the first point is not at zero, create a new history
        if (prev.length === 0 || prev[0].value !== 0) {
          // Create a new history starting from zero
          const newHistory = [];

          // Add the zero point
          newHistory.push({
            value: 0,
            time: new Date(Date.now() - 86400000 * 21).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            timestamp: Date.now() - 86400000 * 21
          });

          // Add intermediate points with a trend toward the new probability
          for (let i = 1; i < 21; i++) {
            const progress = i / 21;
            newHistory.push({
              value: boundedProbability * progress,
              time: new Date(Date.now() - 86400000 * (21 - i)).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
              timestamp: Date.now() - 86400000 * (21 - i)
            });
          }

          // Add the current point
          newHistory.push(newHistoryPoint);

          return newHistory;
        } else {
          // Remove oldest point (but keep the zero point) and add new one at the end
          const updatedHistory = [...prev];
          if (updatedHistory.length > 2) { // Keep at least the zero point and one more
            updatedHistory.splice(1, 1); // Remove the second point (keep the zero point)
          }
          updatedHistory.push(newHistoryPoint);
          return updatedHistory;
        }
      });

      // Update vote counts and stake amounts - this will trigger the gauge to update
      if (type === 'yes') {
        setYesVotes(prev => prev + 1);
        setYesAmount(prev => prev + amount);
      } else {
        setNoVotes(prev => prev + 1);
        setNoAmount(prev => prev + amount);
      }

      console.log('Generated new simulated vote:', newVote, 'YES percentage:', boundedProbability, 'NO percentage:', 100 - boundedProbability);
    };

    // Set up interval to fetch latest votes - use a shorter interval for better demonstration
    const interval = setInterval(fetchLatestVotes, 10000); // Check for updates every 10 seconds

    // Also set up a more frequent simulation interval for demonstration purposes
    const simulationInterval = setInterval(() => {
      // Only simulate if we're using simulated data
      if (apiEndpointMissingRef.current) {
        simulateVote();
      }
    }, 5000); // Simulate a new vote every 5 seconds

    // Initial fetch - delay by 1 second to avoid race condition with initial data load
    const initialFetchTimeout = setTimeout(() => {
      fetchLatestVotes();
    }, 1000);

    return () => {
      clearInterval(interval);
      clearInterval(simulationInterval);
      clearTimeout(initialFetchTimeout);
    };
  }, [predictionId]);

  // Custom gauge chart component for vote data
  const VoteChart = () => {
    // Show loading state
    if (isLoading) {
      return (
        <div className="w-full h-64 bg-slate-800 rounded-lg p-4 flex flex-col items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-500 mb-3"></div>
          <p className="text-slate-400 text-sm">Loading chart data...</p>
        </div>
      );
    }

    // Calculate the percentage based on stake amounts, not just vote counts
    const totalStake = yesAmount + noAmount;

    // Default to 50/50 if no stakes yet
    let yesPercentage = 50;
    let noPercentage = 50;

    if (totalStake > 0) {
      yesPercentage = (yesAmount / totalStake) * 100;
      noPercentage = (noAmount / totalStake) * 100;
    }

    // Determine which side has the higher percentage
    const isYesHigher = yesPercentage >= noPercentage;

    // The percentage to display is the higher of the two
    const displayPercentage = Math.round(isYesHigher ? yesPercentage : noPercentage);

    try {
      return (
        <div className="w-full bg-black/80 rounded-lg p-4 relative mb-6 border border-yellow-500/30">
          <div className="flex flex-col items-center">
            {/* Asset name and prediction market title */}
            <div className="text-xl font-bold text-white mb-1">
              {asset.toUpperCase()} Prediction Market
            </div>
            <div className="text-sm text-slate-400 mb-4">
              Created on {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </div>

            {/* Gauge chart */}
            <div className="w-full max-w-md mx-auto">
              <svg viewBox="0 0 220 140" className="w-full" preserveAspectRatio="xMidYMid meet">
                <defs>
                  {/* Green gradient (for YES votes) - left side */}
                  <linearGradient id="greenGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#10b981" />
                    <stop offset="100%" stopColor="#84cc16" />
                  </linearGradient>

                  {/* Yellow gradient (for neutral) */}
                  <linearGradient id="yellowGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#84cc16" />
                    <stop offset="100%" stopColor="#f97316" />
                  </linearGradient>

                  {/* Red gradient (for NO votes) - right side */}
                  <linearGradient id="redGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#f97316" />
                    <stop offset="100%" stopColor="#ef4444" />
                  </linearGradient>
                </defs>

                {/* Gauge background */}
                <g transform="translate(110, 100)">
                  {/* Green section (YES) - left side */}
                  <path
                    d="M-80,0 A80,80 0 0,1 -40,-69.28"
                    stroke="url(#greenGradient)"
                    strokeWidth="14"
                    fill="none"
                    strokeLinecap="round"
                  />

                  {/* Yellow section (neutral) */}
                  <path
                    d="M-40,-69.28 A80,80 0 0,1 40,-69.28"
                    stroke="url(#yellowGradient)"
                    strokeWidth="14"
                    fill="none"
                    strokeLinecap="round"
                  />

                  {/* Red section (NO) - right side */}
                  <path
                    d="M40,-69.28 A80,80 0 0,1 80,0"
                    stroke="url(#redGradient)"
                    strokeWidth="14"
                    fill="none"
                    strokeLinecap="round"
                  />

                  {/* Gauge labels */}
                  <text x="-80" y="20" textAnchor="middle" fill="#10b981" fontSize="12" fontWeight="bold">YES</text>
                  <text x="80" y="20" textAnchor="middle" fill="#ef4444" fontSize="12" fontWeight="bold">NO</text>

                  {/* Decorative center point */}
                  <circle cx="0" cy="0" r="8" fill="#1e293b" stroke="#ffffff" strokeWidth="2" />
                  <circle cx="0" cy="0" r="4" fill="#ffffff" />
                </g>
              </svg>
            </div>

            {/* Current price display */}
            <div className="mt-4 text-center">
              <div className="text-sm text-slate-400">Current price</div>
              <div className="text-lg font-bold text-white">
                {asset.toUpperCase() === 'BNB'
                  ? `${(bnbPrice || 0).toFixed(2)} BNB`
                  : `${(currentPrice || 0).toFixed(2)} ${asset.toUpperCase()}`}
              </div>
            </div>
          </div>
        </div>
      );
    } catch (error) {
      console.error('Error rendering gauge chart:', error);
      // Fallback UI when chart rendering fails
      return (
        <div className="w-full h-64 bg-slate-800 rounded-lg p-4 flex flex-col items-center justify-center">
          <p className="text-slate-300 mb-2">Unable to display chart</p>
          <p className="text-slate-400 text-sm">Please try refreshing the page</p>
        </div>
      );
    }
  };

  return (
    <div className="space-y-6">
      {/* Main gauge chart */}
      <VoteChart />

      {/* Yes/No Counter with Progress Bars - Based on Vote Counts */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-4 mt-8 gap-4">
        {/* Calculate percentages based on stake amounts rather than vote counts */}
        {(() => {
          const totalStake = yesAmount + noAmount;
          // If no stakes yet, default to 50/50
          const yesPercentage = totalStake > 0 ? (yesAmount / totalStake) * 100 : 50;
          const noPercentage = totalStake > 0 ? (noAmount / totalStake) * 100 : 50;

          return (
            <>
              {/* YES side */}
              <div className="flex items-center w-full">
                <span className="text-green-400 font-bold text-lg mr-2 min-w-[40px]">Yes</span>
                <div className="bg-black/60 h-4 flex-1 rounded-full overflow-hidden border border-yellow-500/20">
                  <div
                    className="h-full bg-green-500 rounded-full transition-all duration-500"
                    style={{ width: `${yesPercentage}%` }}
                  ></div>
                </div>
                <span className="text-green-400 font-bold text-lg ml-2 min-w-[50px] text-right">
                  {Math.round(yesPercentage)}%
                </span>
                <div className="ml-2 text-xs text-slate-400">
                  {yesVotes} votes / {yesAmount.toFixed(2)} {tokenType}
                </div>
              </div>

              {/* NO side */}
              <div className="flex items-center w-full">
                <span className="text-red-400 font-bold text-lg mr-2 min-w-[40px]">No</span>
                <div className="bg-black/60 h-4 flex-1 rounded-full overflow-hidden border border-yellow-500/20">
                  <div
                    className="h-full bg-red-500 rounded-full transition-all duration-500 ml-auto"
                    style={{ width: `${noPercentage}%`, float: 'right' }}
                  ></div>
                </div>
                <span className="text-red-400 font-bold text-lg ml-2 min-w-[50px] text-right">
                  {Math.round(noPercentage)}%
                </span>
                <div className="ml-2 text-xs text-slate-400">
                  {noVotes} votes / {noAmount.toFixed(2)} {tokenType}
                </div>
              </div>
            </>
          );
        })()}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <div className="bg-black/80 rounded-lg p-4 border border-yellow-500/30">
            <h4 className="text-white text-sm font-medium mb-2">Market Stats</h4>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-400 text-sm">Current Asset Price:</span>
                <span className="text-white text-sm">${(currentPrice || 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
              </div>
              {targetPrice > 0 && (
                <div className="flex justify-between">
                  <span className="text-slate-400 text-sm">Target Price:</span>
                  <span className="text-white text-sm">${(targetPrice || 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-slate-400 text-sm">Yes Votes:</span>
                <span className="text-white text-sm">{yesVotes} ({yesAmount.toFixed(2)} {tokenType})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 text-sm">No Votes:</span>
                <span className="text-white text-sm">{noVotes} ({noAmount.toFixed(2)} {tokenType})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 text-sm">Total Votes:</span>
                <span className="text-white text-sm">{yesVotes + noVotes} ({(yesAmount + noAmount).toFixed(2)} {tokenType})</span>
              </div>
            </div>
          </div>
        </div>

        <div className="md:col-span-1">
          <div>
            <h4 className="text-white text-sm font-medium mb-2">Recent Votes</h4>
            <div className="space-y-2 overflow-x-hidden">
              {recentVotes.map((vote, index) => (
                <div key={index} className="flex justify-between items-center bg-black/80 rounded-lg p-2 border border-yellow-500/20">
                  <div className="flex items-center min-w-0">
                    <div className={`w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center mr-2 ${
                      vote.type === 'yes' ? 'bg-green-500/20' : 'bg-red-500/20'
                    }`}>
                      {vote.type === 'yes' ? (
                        <ArrowUp className={`h-3 w-3 text-green-400`} />
                      ) : (
                        <ArrowDown className={`h-3 w-3 text-red-400`} />
                      )}
                    </div>
                    <div className="min-w-0 overflow-hidden">
                      <span className={`text-xs font-medium ${
                        vote.type === 'yes' ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {vote.type === 'yes' ? 'Yes' : 'No'}
                      </span>
                      <p className="text-slate-400 text-xs truncate">
                        {vote.time ? vote.time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Unknown time'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0 ml-2">
                    <span className="text-white text-xs font-medium whitespace-nowrap">
                      {vote.amount !== undefined ? vote.amount : 0} {tokenType}
                    </span>
                    <p className="text-slate-400 text-xs whitespace-nowrap">
                      @ {vote.probability !== undefined ? vote.probability : 50}%
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VotePredictionChart;
