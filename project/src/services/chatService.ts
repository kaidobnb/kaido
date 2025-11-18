import { sendMessage, getChatSportsCompetitions, getChatSportsMatches } from './api';
import { getFullPriceData, getCurrentPrice } from './cryptoService';
import { PredictionCreationState, ChatPredictionParams, SolyMessage } from '../types/chat';
import { SUPPORTED_TOKENS, TOKEN_SYMBOLS } from '../config/tokens';

// Types
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface SportsIntent {
  hasSportsIntent: boolean;
  sport?: string;
  team?: string;
  league?: string;
  confidence: number;
}

// Function to send a message to the AI and get a response
export const sendChatMessage = async (content: string): Promise<ChatMessage> => {
  try {
    const response = await sendMessage(content);

    if (!response.success) {
      throw new Error(response.message || 'Failed to get AI response');
    }

    return {
      id: `msg-${Date.now()}`,
      role: 'assistant',
      content: response.content,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error sending chat message:', error);

    // Return a fallback message
    return {
      id: `msg-${Date.now()}`,
      role: 'assistant',
      content: "I'm having trouble connecting to my knowledge base right now. Please try again in a moment.",
      timestamp: new Date().toISOString()
    };
  }
};

// Function to generate price range suggestions based on current price
export const generatePriceRangeSuggestions = (currentPrice: number, _asset: string): string => {
  // Calculate price increments based on the current price
  let increment: number;

  if (currentPrice >= 10000) {
    // For high-value assets like BTC
    increment = 1000;
  } else if (currentPrice >= 1000) {
    // For mid-value assets like ETH
    increment = 100;
  } else if (currentPrice >= 100) {
    // For assets like SOL
    increment = 10;
  } else if (currentPrice >= 10) {
    // For lower-value assets
    increment = 1;
  } else if (currentPrice >= 1) {
    // For very low-value assets
    increment = 0.1;
  } else {
    // For extremely low-value assets
    increment = 0.01;
  }

  // Generate 3 ranges below current price
  const rangesBelow = [];
  for (let i = 3; i > 0; i--) {
    const lowerBound = Math.max(0, currentPrice - (i * increment));
    const upperBound = currentPrice - ((i-1) * increment);
    rangesBelow.push(`$${lowerBound.toFixed(2)} - $${upperBound.toFixed(2)}`);
  }

  // Generate 3 ranges above current price
  const rangesAbove = [];
  for (let i = 1; i <= 3; i++) {
    const lowerBound = currentPrice + ((i-1) * increment);
    const upperBound = currentPrice + (i * increment);
    rangesAbove.push(`$${lowerBound.toFixed(2)} - $${upperBound.toFixed(2)}`);
  }

  // Format the suggestions with special markup for clickable elements
  let suggestions = '';

  // Below current price
  suggestions += "Below current price:\n";
  rangesBelow.forEach((range, index) => {
    suggestions += `<price-range id="${index + 1}" value="${range}">${index + 1}. ${range}</price-range>\n`;
  });

  // Above current price
  suggestions += "\nAbove current price:\n";
  rangesAbove.forEach((range, index) => {
    suggestions += `<price-range id="${index + 4}" value="${range}">${index + 4}. ${range}</price-range>\n`;
  });

  // Add instructions for clickable ranges
  suggestions += "\n<price-range-instructions>Click on the price ranges you want to include in your prediction. You can select multiple ranges.</price-range-instructions>";

  return suggestions;
};

// Function to detect if a message is about creating a prediction
export const detectPredictionIntent = (message: string): {
  hasPredictionIntent: boolean;
  asset?: string;
  type?: 'binary' | 'multi-choice';
} => {
  const lowerMessage = message.toLowerCase();

  // Skip prediction intent detection for simple greetings (including when followed by "soly", "there", etc.)
  if (/^(hi|hello|hey|sup|yo|what's up|greetings)(\s+(there|soly|solyai|ai))?[.!?]?$/i.test(lowerMessage)) {
    return { hasPredictionIntent: false };
  }

  // Skip if this is a sports prediction request
  const sportsKeywords = [
    'sport', 'football', 'soccer', 'match', 'game', 'team', 'league', 'tournament',
    'premier league', 'champions league', 'world cup', 'euro', 'uefa',
    'fifa', 'la liga', 'serie a', 'bundesliga', 'ligue 1'
  ];

  if (sportsKeywords.some(keyword => lowerMessage.includes(keyword))) {
    return { hasPredictionIntent: false };
  }

  // Check for prediction creation intent
  const createKeywords = [
    'create prediction',
    'new prediction',
    'make prediction',
    'start prediction',
    'create a prediction',
    'predict',
    'let\'s create',
    'i want to create',
    'i\'d like to create'
  ];

  const hasPredictionIntent = createKeywords.some(keyword =>
    lowerMessage.includes(keyword)
  );

  if (!hasPredictionIntent) {
    return { hasPredictionIntent: false };
  }

  // Try to detect asset from the supported tokens list
  let asset: string | undefined;

  // First check for exact symbol matches (case insensitive)
  for (const token of SUPPORTED_TOKENS) {
    if (lowerMessage.includes(token.symbol.toLowerCase())) {
      asset = token.symbol;
      break;
    }
  }

  // If no symbol match, check for token names
  if (!asset) {
    for (const token of SUPPORTED_TOKENS) {
      if (lowerMessage.includes(token.name.toLowerCase())) {
        asset = token.symbol;
        break;
      }
    }
  }

  // Try to detect prediction type
  let type: 'binary' | 'multi-choice' | undefined;
  if (lowerMessage.includes('binary') ||
      lowerMessage.includes('yes/no') ||
      lowerMessage.includes('yes or no')) {
    type = 'binary';
  } else if (lowerMessage.includes('multi') ||
             lowerMessage.includes('range') ||
             lowerMessage.includes('multiple choice')) {
    type = 'multi-choice';
  }

  return {
    hasPredictionIntent: true,
    asset,
    type
  };
};

// Function to detect user's response to a step in the prediction flow
export const processPredictionStep = async (
  message: string,
  currentState: PredictionCreationState,
  currentParams: ChatPredictionParams
): Promise<{
  nextState: PredictionCreationState;
  updatedParams: ChatPredictionParams;
  validResponse: boolean;
  responseMessage?: string;
}> => {
  const lowerMessage = message.toLowerCase();
  let nextState = currentState;
  let updatedParams = { ...currentParams };
  let validResponse = true;
  let responseMessage: string | undefined;

  // Check for cancellation
  if (lowerMessage.includes('cancel') ||
      lowerMessage.includes('stop') ||
      lowerMessage.includes('quit') ||
      lowerMessage.includes('exit')) {
    return {
      nextState: 'idle',
      updatedParams,
      validResponse: true,
      responseMessage: "I've cancelled your prediction. Let me know if you want to start over or if there's anything else I can help with."
    };
  }

  // Process based on current state
  switch (currentState) {
    case 'idle':
      // Starting the prediction flow
      if (detectPredictionIntent(message).hasPredictionIntent) {
        nextState = 'asset_selection';

        // Check if we already have an asset from the intent detection
        const intent = detectPredictionIntent(message);
        if (intent.asset) {
          updatedParams.asset = intent.asset;
          nextState = 'type_selection';
          responseMessage = `Nice choice! ${intent.asset} it is! 💯 Now, how do you want to play this?\n\n1. Binary (Yes/No): Will ${intent.asset} pump to a specific price? Simple yes/no bet.\n2. Multi-choice: What price range will ${intent.asset} land in? More options, more strategy!`;
        } else {
          responseMessage = "Which crypto asset are you bullish on for your prediction? BTC? ETH? BNB? Or something else? I'm ready to set up whatever you're feeling! 🚀";
        }
      }
      break;

    case 'asset_selection':
      // Detecting asset from user message using the supported tokens list
      let detectedAsset = '';

      // First check if user entered a number (1-10) to select from the list
      const assetNumber = parseInt(message.trim());
      if (!isNaN(assetNumber) && assetNumber >= 1 && assetNumber <= 10) {
        const topAssets = SUPPORTED_TOKENS.slice(0, 10);
        if (assetNumber <= topAssets.length) {
          detectedAsset = topAssets[assetNumber - 1].symbol;
        }
      }

      // If not a number, check for exact symbol matches (case insensitive)
      if (!detectedAsset) {
        for (const token of SUPPORTED_TOKENS) {
          if (lowerMessage.includes(token.symbol.toLowerCase())) {
            detectedAsset = token.symbol;
            break;
          }
        }
      }

      // If no symbol match, check for token names
      if (!detectedAsset) {
        for (const token of SUPPORTED_TOKENS) {
          if (lowerMessage.includes(token.name.toLowerCase())) {
            detectedAsset = token.symbol;
            break;
          }
        }
      }

      if (detectedAsset) {
        updatedParams.asset = detectedAsset;
        nextState = 'type_selection';

        // Fetch current price and display it before asking for prediction type
        try {
          console.log(`[PRICE FETCH] Fetching price for ${detectedAsset}...`);
          const priceData = await getFullPriceData(detectedAsset);
          console.log(`[PRICE FETCH] Price data received:`, priceData);
          console.log(`[PRICE FETCH] Price data keys:`, priceData ? Object.keys(priceData) : 'null');
          console.log(`[PRICE FETCH] RAW exists:`, priceData?.RAW);
          console.log(`[PRICE FETCH] RAW keys:`, priceData?.RAW ? Object.keys(priceData.RAW) : 'null');
          console.log(`[PRICE FETCH] RAW[${detectedAsset}]:`, priceData?.RAW?.[detectedAsset]);

          if (priceData && priceData.RAW && priceData.RAW[detectedAsset] && priceData.RAW[detectedAsset].USD) {
            const currentPrice = priceData.RAW[detectedAsset].USD.PRICE;
            console.log(`[PRICE FETCH] Current price for ${detectedAsset}: $${currentPrice}`);

            const formattedPrice = currentPrice.toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2
            });

            responseMessage = `${detectedAsset}? Let's go! 🚀\n\n💰 **Current Price:** $${formattedPrice}\n\nNow, how do you want to set this up?\n\n1. Binary (Yes/No): Will ${detectedAsset} hit a specific price? Clean yes/no bet.\n2. Multi-choice: What price range will ${detectedAsset} end up in? More strategic play!`;
            console.log(`[PRICE FETCH] Response message with price:`, responseMessage);
          } else {
            console.warn(`[PRICE FETCH] Price data structure invalid:`, {
              priceData,
              detectedAsset,
              hasRAW: !!priceData?.RAW,
              RAWKeys: priceData?.RAW ? Object.keys(priceData.RAW) : null,
              hasAsset: priceData?.RAW?.[detectedAsset] !== undefined
            });
            // Fallback if price fetch fails
            responseMessage = `${detectedAsset}? Let's go! 🚀 How do you want to set this up?\n\n1. Binary (Yes/No): Will ${detectedAsset} hit a specific price? Clean yes/no bet.\n2. Multi-choice: What price range will ${detectedAsset} end up in? More strategic play!`;
          }
        } catch (error) {
          console.error(`[PRICE FETCH] Error fetching price for ${detectedAsset}:`, error);
          // Fallback if price fetch fails
          responseMessage = `${detectedAsset}? Let's go! 🚀 How do you want to set this up?\n\n1. Binary (Yes/No): Will ${detectedAsset} hit a specific price? Clean yes/no bet.\n2. Multi-choice: What price range will ${detectedAsset} end up in? More strategic play!`;
        }
      } else {
        validResponse = false;
        const topAssets = SUPPORTED_TOKENS.slice(0, 10);
        const assetsList = topAssets.map((token, index) =>
          `${index + 1}. ${token.symbol} (${token.name})`
        ).join('\n');
        responseMessage = `Hmm, not sure I caught that crypto. Let's try again!\n\n${assetsList}\n\n💡 Type the number (1-10) or the crypto symbol to select!`;
      }
      break;

    case 'type_selection':
      // Detecting prediction type
      console.log('Processing type selection:', lowerMessage);
      if (lowerMessage.includes('binary') ||
          lowerMessage.includes('yes/no') ||
          lowerMessage.includes('yes or no') ||
          lowerMessage.includes('1') ||
          lowerMessage.includes('first')) {
        console.log('Binary prediction type detected');
        updatedParams.type = 'binary';
        nextState = 'target_price';

        // Fetch the current price for the asset
        try {
          if (updatedParams.asset) {
            console.log(`Fetching price for ${updatedParams.asset}...`);
            const priceData = await getCurrentPrice(updatedParams.asset);
            console.log(`Price data received for ${updatedParams.asset}:`, priceData);

            if (priceData && priceData.USD) {
              const formattedPrice = priceData.USD.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
              responseMessage = `💰 **Current Price**: $${formattedPrice}\n\nWhat target price would you like to set for ${updatedParams.asset}? Please enter your target price.`;
              console.log('Response message with price:', responseMessage);
            } else {
              // Fallback if price data is not available
              console.warn(`No USD price data for ${updatedParams.asset}`);
              responseMessage = `What target price would you like to set for ${updatedParams.asset}? Please enter your target price.`;
            }
          } else {
            // Fallback if asset is undefined
            responseMessage = `What target price would you like to set? Please enter your target price.`;
          }
        } catch (error) {
          console.error(`Error fetching price for ${updatedParams.asset}:`, error);
          // Fallback if there's an error fetching the price
          responseMessage = `What target price would you like to set for ${updatedParams.asset || 'this asset'}? Please enter your target price.`;
        }
      } else if (lowerMessage.includes('multi') ||
                lowerMessage.includes('range') ||
                lowerMessage.includes('multiple choice') ||
                lowerMessage.includes('2') ||
                lowerMessage.includes('second')) {
        console.log('Multi-choice prediction type detected');
        updatedParams.type = 'multi-choice';
        nextState = 'price_ranges';

        // Fetch current price for the asset to suggest price ranges
        try {
          if (updatedParams.asset) {
            console.log(`Fetching price for ${updatedParams.asset} (multi-choice)...`);
            const priceData = await getCurrentPrice(updatedParams.asset);
            console.log(`Price data received for ${updatedParams.asset}:`, priceData);

            if (priceData && priceData.USD) {
              const currentPrice = priceData.USD;

              // Generate price range suggestions (3 above, 3 below current price)
              const priceRangeSuggestions = generatePriceRangeSuggestions(currentPrice, updatedParams.asset);

              responseMessage = `💰 **Current Price**: $${currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}\n\nHere are some suggested price ranges for your prediction:\n\n${priceRangeSuggestions}\n\nPlease select one of these ranges or type your own price range for your prediction.`;
              console.log('Response message with price ranges:', responseMessage);
            } else {
              console.warn(`No USD price data for ${updatedParams.asset}`);
              responseMessage = `Please specify the price ranges for ${updatedParams.asset}. You can select from suggested ranges or enter your own.`;
            }
          } else {
            responseMessage = `Please specify the price ranges for this asset. You can select from suggested ranges or enter your own.`;
          }
        } catch (error) {
          console.error(`Error fetching price for ${updatedParams.asset}:`, error);
          responseMessage = `Please specify the price ranges for ${updatedParams.asset || 'this asset'}. You can select from suggested ranges or enter your own.`;
        }
      } else {
        console.log('Invalid prediction type input:', lowerMessage);
        validResponse = false;
        responseMessage = `I need to know what type of prediction you want to create for ${updatedParams.asset || 'this asset'}. Please choose one of these options:\n\n1. Binary (Yes/No): Will ${updatedParams.asset || 'this asset'} hit a specific price?\n2. Multi-choice: What price range will ${updatedParams.asset || 'this asset'} end up in?`;
      }
      break;

    case 'target_price':
      // Extracting target price
      const priceMatch = message.match(/\$?(\d+[,\d]*(\.\d+)?)/);
      if (priceMatch) {
        // Remove commas and convert to string
        const price = priceMatch[1].replace(/,/g, '');
        updatedParams.targetPrice = price;
        nextState = 'duration_selection';
        responseMessage = `How long should this prediction last? You can specify in minutes, hours, or days. For example: "5 minutes", "30 minutes", "1 hour", "2 hours", "1 day". The minimum duration is 5 minutes.`;
      } else {
        validResponse = false;
        responseMessage = "I couldn't identify a valid price. Please enter a numeric value (e.g., 100000).";
      }
      break;

    case 'price_ranges':
      // Check if user selected a range by number (1-6)
      const selectedRangeMatch = message.match(/^[1-6]$/);

      if (selectedRangeMatch) {
        // User selected a range by number
        const rangeNumber = parseInt(selectedRangeMatch[0]);

        try {
          // Fetch current price to regenerate the same ranges
          if (updatedParams.asset) {
            const priceData = await getCurrentPrice(updatedParams.asset);
            if (priceData && priceData.USD) {
              const currentPrice = priceData.USD;

              // Calculate increment based on current price (same logic as in generatePriceRangeSuggestions)
              let increment: number;

              if (currentPrice >= 10000) {
                increment = 1000;
              } else if (currentPrice >= 1000) {
                increment = 100;
              } else if (currentPrice >= 100) {
                increment = 10;
              } else if (currentPrice >= 10) {
                increment = 1;
              } else if (currentPrice >= 1) {
                increment = 0.1;
              } else {
                increment = 0.01;
              }

              // Generate the selected range
              let selectedRange: string;

              if (rangeNumber <= 3) {
                // Below current price
                const i = 4 - rangeNumber; // Convert to the correct index (3, 2, 1)
                const lowerBound = Math.max(0, currentPrice - (i * increment));
                const upperBound = currentPrice - ((i-1) * increment);
                selectedRange = `$${lowerBound.toFixed(2)} - $${upperBound.toFixed(2)}`;
              } else {
                // Above current price
                const i = rangeNumber - 3; // Convert to the correct index (1, 2, 3)
                const lowerBound = currentPrice + ((i-1) * increment);
                const upperBound = currentPrice + (i * increment);
                selectedRange = `$${lowerBound.toFixed(2)} - $${upperBound.toFixed(2)}`;
              }

              // Set the selected range as the only price range
              updatedParams.priceRanges = [selectedRange];
              nextState = 'duration_selection';
              responseMessage = `Great! You've selected the price range: ${selectedRange}.\n\nHow long should this prediction last? You can specify in minutes, hours, or days. For example: "5 minutes", "30 minutes", "1 hour", "2 hours", "1 day". The minimum duration is 5 minutes.`;
            }
          }
        } catch (error) {
          console.error(`Error fetching price for ${updatedParams.asset}:`, error);
          validResponse = false;
          responseMessage = "I couldn't process your selection. Please provide a price range in the format '$X-$Y' (e.g., '$0-$10000').";
        }
      } else {
        // Extracting price ranges directly from the message
        const ranges = message.match(/\$\d+[,\d]*(\.\d+)?-\$\d+[,\d]*(\.\d+)?/g);
        if (ranges && ranges.length >= 1) {
          updatedParams.priceRanges = [ranges[0]]; // Use only the first range
          nextState = 'duration_selection';
          responseMessage = `Great! You've selected the price range: ${ranges[0]}.\n\nHow long should this prediction last? You can specify in minutes, hours, or days. For example: "5 minutes", "30 minutes", "1 hour", "2 hours", "1 day". The minimum duration is 5 minutes.`;
        } else {
          validResponse = false;
          responseMessage = "Please select a price range by number (1-6) or provide a price range in the format '$X-$Y' (e.g., '$0-$10000').";
        }
      }
      break;

    case 'duration_selection':
      // Processing duration
      let durationMinutes: number | null = null;

      // Check for minutes format (e.g., "30 minutes", "30 mins", "30min")
      const minutesMatch = lowerMessage.match(/(\d+)\s*(minute|minutes|min|mins)/i);
      if (minutesMatch) {
        durationMinutes = parseInt(minutesMatch[1]);
      }
      // Check for hours format (e.g., "2 hours", "2 hrs", "2hr")
      else if (lowerMessage.match(/(\d+)\s*(hour|hours|hr|hrs)/i)) {
        const hoursMatch = lowerMessage.match(/(\d+)\s*(hour|hours|hr|hrs)/i);
        if (hoursMatch) {
          const hours = parseInt(hoursMatch[1]);
          durationMinutes = hours * 60;
        }
      }
      // Check for days format (e.g., "1 day", "2 days")
      else if (lowerMessage.match(/(\d+)\s*(day|days)/i)) {
        const daysMatch = lowerMessage.match(/(\d+)\s*(day|days)/i);
        if (daysMatch) {
          const days = parseInt(daysMatch[1]);
          durationMinutes = days * 24 * 60;
        }
      }

      // Ensure minimum duration of 5 minutes (for testing purposes)
      if (durationMinutes !== null && durationMinutes < 5) {
        validResponse = false;
        responseMessage = "The minimum prediction duration is 5 minutes. Please specify a longer duration.";
        break;
      }

      if (durationMinutes !== null) {
        // Calculate the end date based on the duration using UTC time
        const now = new Date();

        // Create a new UTC date
        const utcEndDate = new Date(Date.UTC(
          now.getUTCFullYear(),
          now.getUTCMonth(),
          now.getUTCDate(),
          now.getUTCHours(),
          now.getUTCMinutes() + durationMinutes,
          now.getUTCSeconds()
        ));

        console.log(`Setting prediction end time to: ${utcEndDate.toISOString()} (UTC)`);

        // Store both duration and end date
        updatedParams.duration = durationMinutes;
        updatedParams.expiryDate = utcEndDate.toISOString();

        nextState = 'stake_amount';

        // Format duration for display
        let durationText = '';
        if (durationMinutes < 60) {
          durationText = `${durationMinutes} minutes`;
        } else if (durationMinutes < 1440) {
          const hours = Math.floor(durationMinutes / 60);
          durationText = `${hours} hour${hours > 1 ? 's' : ''}`;
        } else {
          const days = Math.floor(durationMinutes / 1440);
          durationText = `${days} day${days > 1 ? 's' : ''}`;
        }

        responseMessage = `Great! Your prediction will last for ${durationText} and resolve at ${utcEndDate.toLocaleString()}.\n\nHow much would you like to stake on this prediction? (e.g., 0.01 BNB)`;
      } else {
        validResponse = false;
        responseMessage = "I couldn't understand that duration format. Please specify a duration using one of these formats:\n• Minutes: '30 minutes', '45 mins'\n• Hours: '1 hour', '2 hrs'\n• Days: '1 day', '3 days'";
      }
      break;

    case 'expiry_date':
      // Legacy support for expiry date - now redirects to duration selection
      // Processing expiry date
      let expiryDate: Date | null = null;
      let duration: number | null = null;

      // Check for minutes format (e.g., "30 minutes", "30 mins", "30min")
      const expMinutesMatch = lowerMessage.match(/(\d+)\s*(minute|minutes|min|mins)/i);
      if (expMinutesMatch) {
        duration = parseInt(expMinutesMatch[1]);
        if (duration >= 30) {
          expiryDate = new Date();
          expiryDate.setMinutes(expiryDate.getMinutes() + duration);
        }
      }
      // Check for hours format
      else if (lowerMessage.match(/(\d+)\s*(hour|hours|hr|hrs)/i)) {
        const hoursMatch = lowerMessage.match(/(\d+)\s*(hour|hours|hr|hrs)/i);
        if (hoursMatch) {
          const hours = parseInt(hoursMatch[1]);
          duration = hours * 60;
          expiryDate = new Date();
          expiryDate.setHours(expiryDate.getHours() + hours);
        }
      }
      // Check for days format
      else if (lowerMessage.match(/(\d+)\s*(day|days)/i)) {
        const daysMatch = lowerMessage.match(/(\d+)\s*(day|days)/i);
        if (daysMatch) {
          const days = parseInt(daysMatch[1]);
          duration = days * 24 * 60;
          expiryDate = new Date();
          expiryDate.setDate(expiryDate.getDate() + days);
        }
      }
      // Check for common time expressions
      else if (lowerMessage.includes('tomorrow')) {
        expiryDate = new Date();
        expiryDate.setDate(expiryDate.getDate() + 1);
        duration = 24 * 60; // 24 hours in minutes
      }
      else if (lowerMessage.includes('today')) {
        // Set to end of current day (11:59:59 PM)
        expiryDate = new Date();
        expiryDate.setHours(23, 59, 59, 999);
        // Calculate minutes from now until end of day
        const now = new Date();
        duration = Math.floor((expiryDate.getTime() - now.getTime()) / (60 * 1000));
      }
      else if (lowerMessage.includes('next week')) {
        expiryDate = new Date();
        expiryDate.setDate(expiryDate.getDate() + 7);
        duration = 7 * 24 * 60; // 7 days in minutes
      }
      // Check for other relative dates (e.g., "in 2 weeks")
      else if (lowerMessage.includes('in ')) {
        const timeMatch = lowerMessage.match(/in\s+(\d+)\s+(week|weeks|month|months)/i);
        if (timeMatch) {
          const amount = parseInt(timeMatch[1]);
          const unit = timeMatch[2].toLowerCase();

          expiryDate = new Date();
          if (unit === 'week' || unit === 'weeks') {
            expiryDate.setDate(expiryDate.getDate() + (amount * 7));
            duration = amount * 7 * 24 * 60; // weeks to minutes
          } else if (unit === 'month' || unit === 'months') {
            expiryDate.setMonth(expiryDate.getMonth() + amount);
            duration = amount * 30 * 24 * 60; // approximate months to minutes
          }
        }
      }
      // Check for specific dates
      else {
        try {
          // Try to parse the date
          expiryDate = new Date(message);

          // Check if it's a valid date in the future
          if (isNaN(expiryDate.getTime()) || expiryDate <= new Date()) {
            expiryDate = null;
          } else {
            // Calculate duration in minutes
            const now = new Date();
            duration = Math.floor((expiryDate.getTime() - now.getTime()) / (60 * 1000));
          }
        } catch (e) {
          expiryDate = null;
        }
      }

      // Ensure minimum duration of 5 minutes (for testing purposes)
      if (duration !== null && duration < 5) {
        validResponse = false;
        responseMessage = "The minimum prediction duration is 5 minutes. Please specify a longer duration.";
        break;
      }

      if (expiryDate && duration !== null) {
        // Convert to UTC time
        const utcExpiryDate = new Date(Date.UTC(
          expiryDate.getUTCFullYear(),
          expiryDate.getUTCMonth(),
          expiryDate.getUTCDate(),
          expiryDate.getUTCHours(),
          expiryDate.getUTCMinutes(),
          expiryDate.getUTCSeconds()
        ));

        console.log(`Setting prediction end time to: ${utcExpiryDate.toISOString()} (UTC)`);

        updatedParams.expiryDate = utcExpiryDate.toISOString();
        updatedParams.duration = duration;
        nextState = 'stake_amount';

        // Format duration for display
        let durationText = '';
        if (duration < 60) {
          durationText = `${duration} minutes`;
        } else if (duration < 1440) {
          const hours = Math.floor(duration / 60);
          durationText = `${hours} hour${hours > 1 ? 's' : ''}`;
        } else {
          const days = Math.floor(duration / 1440);
          durationText = `${days} day${days > 1 ? 's' : ''}`;
        }

        responseMessage = `Great! Your prediction will last for ${durationText} and resolve at ${utcExpiryDate.toLocaleString()}.\n\nHow much would you like to stake on this prediction? (e.g., 0.01 BNB)`;
      } else {
        validResponse = false;
        responseMessage = "I couldn't understand that duration format. Please specify a duration using one of these formats:\n• Minutes: '30 minutes', '45 mins'\n• Hours: '1 hour', '2 hrs'\n• Days: '1 day', '3 days'";
      }
      break;

    case 'stake_amount':
      // Extracting stake amount and token
      const amountMatch = message.match(/(\d+[,\d]*(\.\d+)?)\s*(BNB|KAIDO)?/i);
      if (amountMatch) {
        const amount = parseFloat(amountMatch[1].replace(/,/g, ''));
        const token = amountMatch[3]?.toUpperCase() as 'BNB' | 'KAIDO' | undefined;

        // Validate minimum stake amount (0.01 BNB)
        if (amount < 0.01) {
          validResponse = false;
          responseMessage = "The minimum stake amount is 0.01 BNB. Please enter a higher amount.";
          break;
        }

        updatedParams.stakeAmount = amount;

        // Always set token to BNB and go directly to payment (skip confirmation)
        updatedParams.stakeToken = token || 'BNB';
        nextState = 'payment';

        // Format duration for display
        let durationText = '';
        if (updatedParams.duration) {
          if (updatedParams.duration < 60) {
            durationText = `${updatedParams.duration} minutes`;
          } else if (updatedParams.duration < 1440) {
            const hours = Math.floor(updatedParams.duration / 60);
            durationText = `${hours} hour${hours > 1 ? 's' : ''}`;
          } else {
            const days = Math.floor(updatedParams.duration / 1440);
            durationText = `${days} day${days > 1 ? 's' : ''}`;
          }
        }

        // Format resolve time
        const resolveTime = updatedParams.expiryDate ? new Date(updatedParams.expiryDate).toLocaleString() + ' (your local time)' : 'Not specified';

        responseMessage = `📋 **Prediction Summary**\n\n**Asset:** ${updatedParams.asset}\n**Type:** ${updatedParams.type === 'binary' ? 'Binary (Yes/No)' : 'Multi-choice'}\n${updatedParams.type === 'binary' ? `**Target Price:** $${updatedParams.targetPrice}` : `**Price Ranges:** ${updatedParams.priceRanges?.join(', ')}`}\n**Duration:** ${durationText}\n**Resolves at:** ${resolveTime}\n**Stake:** ${updatedParams.stakeAmount} ${updatedParams.stakeToken}\n\n✅ **Approve the transaction in your wallet to create this prediction!**`;
      } else {
        validResponse = false;
        responseMessage = "Enter a valid stake amount (e.g., '0.01 BNB'). The minimum stake amount is 0.01 BNB.";
      }
      break;

    // Removed stake_token case as we now go directly from stake_amount to confirmation

    case 'confirmation':
      // Processing confirmation
      if (lowerMessage.includes('yes') ||
          lowerMessage.includes('yeah') ||
          lowerMessage.includes('yea') ||
          lowerMessage.includes('yh') ||
          lowerMessage.includes('ye') ||
          lowerMessage.includes('yup') ||
          lowerMessage.includes('proceed') ||
          lowerMessage.includes('confirm') ||
          lowerMessage.includes('fund') ||
          lowerMessage.includes('ok') ||
          lowerMessage.includes('sure')) {
        nextState = 'payment';
        responseMessage = "Perfect! Complete the payment to fund your prediction.";
      } else if (lowerMessage.includes('no') ||
                lowerMessage.includes('cancel') ||
                lowerMessage.includes('change')) {
        nextState = 'idle';
        responseMessage = "I've cancelled your prediction. Let me know if you want to start over or if there's anything else I can help with.";
      } else {
        validResponse = false;
        responseMessage = "Do you want to proceed with funding this prediction? Please answer with yes or no.";
      }
      break;

    default:
      nextState = 'idle';
      validResponse = false;
      responseMessage = "I ran into an issue with your prediction. Let's start over. What would you like to predict?";
  }

  return {
    nextState,
    updatedParams,
    validResponse,
    responseMessage
  };
};

// Function to generate the next AI message in the prediction flow
export const generatePredictionFlowPrompt = async (
  state: PredictionCreationState,
  params: ChatPredictionParams
): Promise<string> => {
  switch (state) {
    case 'asset_selection':
      // Show top crypto assets with numbered options
      const topAssets = SUPPORTED_TOKENS.slice(0, 10);
      const assetsList = topAssets.map((token, index) =>
        `${index + 1}. ${token.symbol} (${token.name})`
      ).join('\n');
      return `💰 **Choose Your Crypto Asset**\n\nWhich crypto are you bullish on for your prediction?\n\n${assetsList}\n\n💡 **Quick tip:** Just type the number (1-10) or the crypto symbol to select!`;

    case 'type_selection':
      return `Nice choice! ${params.asset} it is! 💯 Now, how do you want to play this?\n\n1. Binary (Yes/No): Will ${params.asset} hit a specific price? Simple yes/no bet.\n2. Multi-choice: What price range will ${params.asset} land in? More options, more strategy!`;

    case 'target_price':
      // Fetch the current price for the asset
      try {
        if (params.asset) {
          console.log('Fetching price for asset:', params.asset);
          const priceData = await getCurrentPrice(params.asset);
          if (priceData && priceData.USD) {
            console.log('Price data received:', priceData);
            return `What target price would you like to set for ${params.asset}? The current price is $${priceData.USD.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}. Please enter your target price.`;
          }
        }
      } catch (error) {
        console.error(`Error fetching price for ${params.asset}:`, error);
      }

      // Fallback if price fetch fails or asset is undefined
      return `What target price would you like to set for ${params.asset || 'this asset'}? Please enter your target price.`;

    case 'price_ranges':
      try {
        if (params.asset) {
          const priceData = await getCurrentPrice(params.asset);
          if (priceData && priceData.USD) {
            const currentPrice = priceData.USD;

            // Generate price range suggestions
            const priceRangeSuggestions = generatePriceRangeSuggestions(currentPrice, params.asset);

            return `The current price of ${params.asset} is $${currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}.\n\nHere are some suggested price ranges for your prediction:\n\n${priceRangeSuggestions}\n\nPlease select one of these ranges by number (1-6) or type your own price range for your prediction.`;
          }
        }
      } catch (error) {
        console.error(`Error fetching price for ${params.asset}:`, error);
      }

      // Fallback if price fetch fails
      return `Specify a price range for ${params.asset || 'this asset'} (e.g., "$0-$10000").`;

    case 'duration_selection':
      return `How long should this prediction last? You can specify in minutes, hours, or days. For example: "5 minutes", "30 minutes", "1 hour", "2 hours", "1 day". The minimum duration is 5 minutes.`;

    case 'expiry_date':
      // Legacy support for expiry date
      return `When should this prediction expire? You can use formats like "30 minutes", "1 hour", "2 hours", "1 day", "tomorrow", or "in 24 hours".`;

    case 'stake_amount':
      return `How much would you like to stake? The minimum amount is 0.01 BNB.`;

    // Removed stake_token case as we now go directly to confirmation

    case 'confirmation':
      // Format duration for display
      const durationText = params.duration
        ? params.duration < 60
          ? `${params.duration} minutes`
          : params.duration < 1440
            ? `${Math.floor(params.duration / 60)} hour${Math.floor(params.duration / 60) > 1 ? 's' : ''}`
            : `${Math.floor(params.duration / 1440)} day${Math.floor(params.duration / 1440) > 1 ? 's' : ''}`
        : '';

      // Calculate and format end time using UTC
      let endTime = 'Not specified';

      if (params.expiryDate) {
        // Use the stored expiry date (already in UTC)
        const expiryDate = new Date(params.expiryDate);
        endTime = expiryDate.toLocaleString() + ' (your local time)';
        console.log(`Confirmation showing end time: ${endTime} from stored date: ${params.expiryDate}`);
      } else if (params.duration) {
        // Calculate from duration using UTC
        const now = new Date();
        const utcEndDate = new Date(Date.UTC(
          now.getUTCFullYear(),
          now.getUTCMonth(),
          now.getUTCDate(),
          now.getUTCHours(),
          now.getUTCMinutes() + params.duration,
          now.getUTCSeconds()
        ));
        endTime = utcEndDate.toLocaleString() + ' (your local time)';
        console.log(`Confirmation showing calculated end time: ${endTime}`);
      }

      return `Here's your prediction summary:\n\nAsset: ${params.asset}\nType: ${params.type === 'binary' ? 'Binary (Yes/No)' : 'Multi-choice'}\n${params.type === 'binary' ? `Target Price: $${params.targetPrice}` : `Price Ranges: ${params.priceRanges?.join(', ')}`}\nDuration: ${durationText}\nResolves at: ${endTime}\nStake: ${params.stakeAmount} ${params.stakeToken}\n\nReady to fund this prediction?`;

    case 'payment':
      return "Complete the payment to fund your prediction.";

    case 'complete':
      return "Your prediction is live! Others can now participate in this market.";

    default:
      return "What would you like to predict today?";
  }
};

// Function to get crypto price information for the chat
export const getCryptoPriceInfo = async (symbol: string): Promise<string> => {
  try {
    const data = await getFullPriceData(symbol);

    if (data && data.RAW && data.RAW[symbol] && data.RAW[symbol].USD) {
      const priceData = data.RAW[symbol].USD;
      const price = priceData.PRICE;
      const change24h = priceData.CHANGEPCT24HOUR;
      const high24h = priceData.HIGH24HOUR;
      const low24h = priceData.LOW24HOUR;
      const volume24h = priceData.VOLUME24HOUR;
      const marketCap = priceData.MKTCAP;

      // Get crypto full name
      let cryptoName = symbol;
      switch(symbol) {
        case 'BTC': cryptoName = 'Bitcoin'; break;
        case 'ETH': cryptoName = 'Ethereum'; break;
        case 'BNB': cryptoName = 'BNB'; break;
        case 'LTC': cryptoName = 'Litecoin'; break;
        case 'ADA': cryptoName = 'Cardano'; break;
        case 'DOGE': cryptoName = 'Dogecoin'; break;
        case 'XRP': cryptoName = 'Ripple'; break;
        case 'DOT': cryptoName = 'Polkadot'; break;
        case 'AVAX': cryptoName = 'Avalanche'; break;
        case 'LINK': cryptoName = 'Chainlink'; break;
        case 'MATIC': cryptoName = 'Polygon'; break;
      }

      // Generate market insight based on price change
      let marketInsight = '';
      if (change24h > 5) {
        marketInsight = `${cryptoName} is showing strong bullish momentum with a significant ${change24h.toFixed(2)}% gain in the last 24 hours.`;
      } else if (change24h > 2) {
        marketInsight = `${cryptoName} is trending upward with a positive ${change24h.toFixed(2)}% movement over the past day.`;
      } else if (change24h > 0) {
        marketInsight = `${cryptoName} is slightly up by ${change24h.toFixed(2)}% in the last 24 hours, showing modest positive movement.`;
      } else if (change24h > -2) {
        marketInsight = `${cryptoName} is relatively stable with a small ${Math.abs(change24h).toFixed(2)}% decline in the past day.`;
      } else if (change24h > -5) {
        marketInsight = `${cryptoName} is experiencing some downward pressure, down ${Math.abs(change24h).toFixed(2)}% in the last 24 hours.`;
      } else {
        marketInsight = `${cryptoName} is showing significant bearish movement, dropping ${Math.abs(change24h).toFixed(2)}% over the past day.`;
      }

      return `
Current ${cryptoName} (${symbol}) price: $${price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
24h change: ${change24h.toFixed(2)}%
24h high: $${high24h.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
24h low: $${low24h.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
24h volume: $${(volume24h / 1000000).toFixed(2)}M
Market cap: $${(marketCap / 1000000000).toFixed(2)}B

${marketInsight}
      `.trim();
    }

    throw new Error('Invalid price data format');
  } catch (error) {
    console.error(`Error fetching price info for ${symbol}:`, error);

    // Try to get at least the current price as fallback
    try {
      const priceData = await getCurrentPrice(symbol);
      if (priceData && priceData.USD) {
        // Get crypto full name
        let cryptoName = symbol;
        switch(symbol) {
          case 'BTC': cryptoName = 'Bitcoin'; break;
          case 'ETH': cryptoName = 'Ethereum'; break;
          case 'BNB': cryptoName = 'BNB'; break;
          case 'LTC': cryptoName = 'Litecoin'; break;
          case 'ADA': cryptoName = 'Cardano'; break;
          case 'DOGE': cryptoName = 'Dogecoin'; break;
          case 'XRP': cryptoName = 'Ripple'; break;
          case 'DOT': cryptoName = 'Polkadot'; break;
          case 'AVAX': cryptoName = 'Avalanche'; break;
          case 'LINK': cryptoName = 'Chainlink'; break;
          case 'MATIC': cryptoName = 'Polygon'; break;
        }
        return `Current ${cryptoName} (${symbol}) price: $${priceData.USD.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
      }
    } catch (err) {
      console.error('Error fetching fallback price:', err);
    }

    return `I couldn't fetch the current price information for ${symbol}. Please try again later.`;
  }
};

// Detect crypto prediction intent
export const detectCryptoPredictionIntent = (message: string): { hasCryptoIntent: boolean; asset?: string } => {
  const lowerMessage = message.toLowerCase();

  // Crypto keywords that indicate user wants to create a crypto prediction
  const cryptoIntentKeywords = [
    'crypto', 'cryptocurrency', 'coin', 'token', 'altcoin',
    'bitcoin', 'ethereum', 'btc', 'eth', 'bnb', 'doge', 'shib', 'pepe',
    'solana', 'cardano', 'polkadot', 'ripple', 'litecoin', 'chainlink',
    'uniswap', 'aave', 'xrp', 'ada', 'dot', 'avax', 'matic', 'uni',
    'blockchain', 'defi'
  ];

  // Check if message contains crypto keywords
  const hasCryptoIntent = cryptoIntentKeywords.some(keyword => lowerMessage.includes(keyword));

  if (!hasCryptoIntent) {
    return { hasCryptoIntent: false };
  }

  // Try to detect specific asset
  let asset: string | undefined;

  // Check for exact symbol matches (case insensitive)
  for (const token of SUPPORTED_TOKENS) {
    if (lowerMessage.includes(token.symbol.toLowerCase())) {
      asset = token.symbol;
      break;
    }
  }

  // If no symbol match, check for token names
  if (!asset) {
    for (const token of SUPPORTED_TOKENS) {
      if (lowerMessage.includes(token.name.toLowerCase())) {
        asset = token.symbol;
        break;
      }
    }
  }

  return {
    hasCryptoIntent: true,
    asset
  };
};

// Detect sports prediction intent
export const detectSportsPredictionIntent = (message: string): SportsIntent => {
  const lowerMessage = message.toLowerCase();

  // Crypto keywords to EXCLUDE (to prevent false positives)
  const cryptoKeywords = [
    'bitcoin', 'ethereum', 'btc', 'eth', 'bnb', 'crypto', 'coin', 'token',
    'blockchain', 'defi', 'nft', 'altcoin', 'pump', 'dump', 'price', 'bull',
    'bear', 'hodl', 'moon', 'lambo', 'rug pull', 'doge', 'shib', 'pepe',
    'solana', 'cardano', 'polkadot', 'ripple', 'litecoin', 'chainlink',
    'uniswap', 'aave', 'curve', 'yearn', 'compound', 'maker', 'lido'
  ];

  // Check if message contains crypto keywords - if so, it's NOT a sports prediction
  for (const keyword of cryptoKeywords) {
    if (lowerMessage.includes(keyword)) {
      return {
        hasSportsIntent: false,
        confidence: 0
      };
    }
  }

  // Sports keywords - MUST have at least one of these
  const sportsKeywords = [
    'football', 'soccer', 'match', 'game', 'team', 'league', 'tournament',
    'premier league', 'champions league', 'world cup', 'euro', 'uefa',
    'fifa', 'la liga', 'serie a', 'bundesliga', 'ligue 1'
  ];

  // Team names (common ones)
  const teamKeywords = [
    'manchester united', 'manchester city', 'liverpool', 'chelsea', 'arsenal',
    'tottenham', 'barcelona', 'real madrid', 'atletico madrid', 'bayern munich',
    'psg', 'juventus', 'inter milan', 'ac milan', 'napoli', 'roma'
  ];

  // Prediction keywords (secondary indicators)
  const predictionKeywords = [
    'predict', 'prediction', 'bet', 'betting', 'odds', 'win', 'lose', 'draw',
    'score', 'goals', 'result', 'outcome', 'match result'
  ];

  let confidence = 0;
  let detectedSport = '';
  let detectedTeam = '';
  let detectedLeague = '';
  let hasSportsKeyword = false;

  // Check for sports keywords (REQUIRED)
  for (const keyword of sportsKeywords) {
    if (lowerMessage.includes(keyword)) {
      confidence += 0.5;
      hasSportsKeyword = true;
      if (keyword.includes('league') || keyword.includes('cup') || keyword.includes('euro') || keyword.includes('fifa')) {
        detectedLeague = keyword;
      } else {
        detectedSport = keyword;
      }
    }
  }

  // If no sports keyword found, return false immediately
  if (!hasSportsKeyword) {
    return {
      hasSportsIntent: false,
      confidence: 0
    };
  }

  // Check for team names
  for (const team of teamKeywords) {
    if (lowerMessage.includes(team)) {
      confidence += 0.3;
      detectedTeam = team;
    }
  }

  // Check for prediction keywords
  for (const keyword of predictionKeywords) {
    if (lowerMessage.includes(keyword)) {
      confidence += 0.15;
    }
  }

  // Boost confidence if multiple indicators are present
  if (confidence > 0.5) {
    confidence = Math.min(confidence * 1.1, 1.0);
  }

  return {
    hasSportsIntent: confidence >= 0.5 && hasSportsKeyword,
    sport: detectedSport || 'football',
    team: detectedTeam,
    league: detectedLeague,
    confidence
  };
};

// Get sports competitions for chat widget
export const getSportsCompetitions = async () => {
  try {
    const response = await getChatSportsCompetitions();
    return response.success ? response.competitions : [];
  } catch (error) {
    console.error('Error fetching sports competitions:', error);
    return [];
  }
};

// Get sports matches for chat widget
export const getSportsMatches = async (competitionId: string, days: number = 7) => {
  try {
    const response = await getChatSportsMatches(competitionId, days);
    return response.success ? response.matches : [];
  } catch (error) {
    console.error('Error fetching sports matches:', error);
    return [];
  }
};
