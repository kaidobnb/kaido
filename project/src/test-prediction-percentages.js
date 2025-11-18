import { updatePredictionChoices, getUpdatedPercentages } from './utils/predictionUtils';

// Test function to update prediction percentages
async function testUpdatePredictionPercentages(predictionId) {
  console.log('Testing updatePredictionChoices for prediction:', predictionId);
  
  try {
    // First, get the current percentages
    const currentPercentages = await getUpdatedPercentages(predictionId);
    console.log('Current percentages:', currentPercentages);
    
    // Then, update the percentages
    const updateResult = await updatePredictionChoices(predictionId);
    console.log('Update result:', updateResult);
    
    // Finally, get the updated percentages
    const updatedPercentages = await getUpdatedPercentages(predictionId);
    console.log('Updated percentages:', updatedPercentages);
    
    return {
      success: true,
      before: currentPercentages,
      after: updatedPercentages
    };
  } catch (error) {
    console.error('Error testing prediction percentages:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// Export the test function
export default testUpdatePredictionPercentages;
