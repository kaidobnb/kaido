import { getRecentVotes, getPredictionById, updatePredictionPercentages } from '../services/api';

/**
 * Updates the prediction choices percentages based on the current votes
 * This is a temporary solution until the backend is fixed to update percentages automatically
 */
export const updatePredictionChoices = async (predictionId: string) => {
  try {
    console.log('Manually updating prediction choices for prediction:', predictionId);

    // Step 1: Get the prediction votes
    const votesResponse = await getRecentVotes(predictionId);

    if (!votesResponse.success || !Array.isArray(votesResponse.votes)) {
      console.error('Failed to fetch votes for prediction:', votesResponse);
      return false;
    }

    const votes = votesResponse.votes;
    console.log(`Found ${votes.length} votes for prediction ${predictionId}`);

    // Step 2: Calculate totals for each position
    const positionTotals: { [key: string]: number } = {};
    votes.forEach(vote => {
      const position = vote.position;
      const amount = parseFloat(vote.amount) || 0;

      if (!positionTotals[position]) {
        positionTotals[position] = 0;
      }

      positionTotals[position] += amount;
    });

    console.log('Position totals:', positionTotals);

    // Step 3: Get the prediction details
    const predictionResponse = await getPredictionById(predictionId);

    if (!predictionResponse.success || !predictionResponse.prediction) {
      console.error('Failed to fetch prediction details:', predictionResponse);
      return false;
    }

    const prediction = predictionResponse.prediction;

    // Step 4: Calculate new percentages
    const totalVolume = Object.values(positionTotals).reduce((sum, amount) => sum + amount, 0);
    console.log('Total volume:', totalVolume);

    if (totalVolume === 0) {
      console.log('No volume found, skipping percentage update');
      return false;
    }

    const updatedChoices = prediction.choices.map((choice: any) => {
      const positionVolume = positionTotals[choice.id] || 0;
      const percentage = totalVolume > 0 ? (positionVolume / totalVolume) * 100 : 0;

      return {
        ...choice,
        percentage: Math.round(percentage),
        price: percentage / 100
      };
    });

    console.log('Updated choices:', updatedChoices);

    // Step 5: Update the prediction choices via our API function
    try {
      const updateResponse = await updatePredictionPercentages(predictionId, updatedChoices);
      console.log('Update response:', updateResponse);
      return updateResponse.success;
    } catch (error) {
      console.error('Failed to update prediction choices:', error);
      return false;
    }
  } catch (error) {
    console.error('Error updating prediction choices:', error);
    return false;
  }
};

/**
 * Manually calculates and returns the updated percentages for a prediction based on votes
 * This is used when the backend doesn't update the percentages correctly
 */
export const getUpdatedPercentages = async (predictionId: string) => {
  try {
    // Get the prediction votes
    const votesResponse = await getRecentVotes(predictionId);

    if (!votesResponse.success || !Array.isArray(votesResponse.votes)) {
      console.error('Failed to fetch votes for prediction:', votesResponse);
      return { yesPercentage: 50, noPercentage: 50 };
    }

    const votes = votesResponse.votes;

    // Calculate totals for each position
    let yesAmount = 0;
    let noAmount = 0;

    votes.forEach(vote => {
      const amount = parseFloat(vote.amount) || 0;

      if (vote.position === 'yes') {
        yesAmount += amount;
      } else if (vote.position === 'no') {
        noAmount += amount;
      }
    });

    // Calculate percentages
    const totalAmount = yesAmount + noAmount;
    if (totalAmount > 0) {
      const yesPercentage = Math.round((yesAmount / totalAmount) * 100);
      const noPercentage = 100 - yesPercentage;

      console.log(`Manual calculation: Yes=${yesAmount}, No=${noAmount}, Total=${totalAmount}`);
      console.log(`Manual percentages: Yes=${yesPercentage}%, No=${noPercentage}%`);

      return { yesPercentage, noPercentage };
    }

    // Default to 50/50 if no votes
    return { yesPercentage: 50, noPercentage: 50 };
  } catch (error) {
    console.error('Error calculating updated percentages:', error);
    return { yesPercentage: 50, noPercentage: 50 };
  }
};
