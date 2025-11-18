import axios from 'axios';
import { getCurrentPrice, getHistoricalPrices } from './cryptoService';
import { SUPPORTED_TOKENS } from '../config/tokens';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// OpenAI API configuration
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || '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';
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';
const MODEL = process.env.OPENAI_MODEL || 'gpt-4o'; // Using GPT-4o for high-quality responses

/**
 * Generate a prediction description and analysis using OpenAI API
 * @param asset The asset to create a prediction for (e.g., BTC, ETH)
 * @param type The prediction type (binary or multiple)
 * @param targetPrice The target price for binary predictions
 * @param priceRanges The price ranges for multiple-choice predictions
 * @param expiryDate The expiry date for the prediction
 */
export const generatePredictionAnalysis = async (
  asset: string,
  type: 'binary' | 'multiple' | 'agent',
  targetPrice?: string,
  priceRanges?: string[],
  expiryDate?: string
): Promise<{ title: string; description: string; resolveDetails: string }> => {
  try {
    let prompt = '';

    // Get current price for context
    let currentPrice;
    try {
      currentPrice = await getCurrentPrice(asset);
      console.log(`Current ${asset} price: $${currentPrice}`);
    } catch (error) {
      console.error(`Error fetching current price for ${asset}:`, error);
      currentPrice = "unknown";
    }

    // Try to get historical price data for additional context
    let priceHistory = "";
    try {
      const historicalData = await getHistoricalPrices(asset, 30); // Last 30 days
      if (historicalData && historicalData.length > 0) {
        const oldestPrice = historicalData[0][1];
        const newestPrice = historicalData[historicalData.length - 1][1];
        const percentChange = ((newestPrice - oldestPrice) / oldestPrice) * 100;

        priceHistory = `
30-day price change: ${percentChange.toFixed(2)}%
30-day low: $${Math.min(...historicalData.map(p => p[1])).toFixed(2)}
30-day high: $${Math.max(...historicalData.map(p => p[1])).toFixed(2)}`;
      }
    } catch (error) {
      console.error(`Error fetching historical prices for ${asset}:`, error);
    }

    if (type === 'binary' || (type === 'agent' && targetPrice)) {
      prompt = `
Create a detailed analysis for a ${type === 'agent' ? 'agent-based' : ''} binary (Yes/No) prediction market about whether ${asset} will reach $${targetPrice} by ${expiryDate}.
Current ${asset} price: $${currentPrice}${priceHistory}
Target price: $${targetPrice}
Expiry date: ${expiryDate}
${type === 'agent' ? 'This is an agent prediction where users can participate without committing funds if they hold SOLY tokens.' : ''}

Please provide a balanced analysis that considers both bullish and bearish factors. Format your response as a JSON object with the following fields:
- title: A concise, engaging title for the prediction market (max 100 characters)
- description: A detailed description including market analysis, key factors, and potential outcomes (300-500 characters)
- resolveDetails: A clear explanation of how this prediction will be resolved (100-200 characters)
`;
    } else {
      const rangesText = priceRanges?.join(', ');
      prompt = `
Create a detailed analysis for a ${type === 'agent' ? 'agent-based' : ''} multiple-choice prediction market about which price range ${asset} will fall within on ${expiryDate}.
Current ${asset} price: $${currentPrice}${priceHistory}
Price ranges: ${rangesText}
Expiry date: ${expiryDate}
${type === 'agent' ? 'This is an agent prediction where users can participate without committing funds if they hold SOLY tokens.' : ''}

Please provide a balanced analysis that considers various scenarios. Format your response as a JSON object with the following fields:
- title: A concise, engaging title for the prediction market (max 100 characters)
- description: A detailed description including market analysis, key factors, and potential outcomes (300-500 characters)
- resolveDetails: A clear explanation of how this prediction will be resolved (100-200 characters)
`;
    }

    const response = await axios.post(
      OPENAI_API_URL,
      {
        model: MODEL,
        messages: [
          {
            role: 'system',
            content: 'You are an expert crypto analyst providing detailed, data-driven analysis for prediction markets. Your analysis should be balanced, informative, and based on current market conditions. Format your response as a valid JSON object.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 1024
      },
      {
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const content = response.data.choices[0].message.content;

    // Parse the JSON response
    try {
      // Log the raw content for debugging
      console.log('Raw AI response content:', content);

      // Check if the content starts with a code block or has other formatting issues
      let jsonContent = content;
      if (content.includes('```json')) {
        jsonContent = content.split('```json')[1].split('```')[0].trim();
      } else if (content.includes('```')) {
        jsonContent = content.split('```')[1].split('```')[0].trim();
      }

      const parsedContent = JSON.parse(jsonContent);

      // Validate that all required fields are present
      if (!parsedContent.title || !parsedContent.description || !parsedContent.resolveDetails) {
        throw new Error('Missing required fields in AI response');
      }

      return {
        title: parsedContent.title,
        description: parsedContent.description,
        resolveDetails: parsedContent.resolveDetails
      };
    } catch (parseError) {
      console.error('Error parsing AI response:', parseError);
      console.error('Content that failed to parse:', content);

      // Fallback to default values if parsing fails
      return {
        title: `Will ${asset} reach $${targetPrice} by ${expiryDate}?`,
        description: `This prediction market is about whether ${asset} will reach $${targetPrice} by ${expiryDate}.`,
        resolveDetails: `This prediction will be resolved based on the price of ${asset} on ${expiryDate}.`
      };
    }
  } catch (error: any) {
    console.error('Error calling OpenAI API:', error);
    // Log more detailed error information
    if (error.response) {
      console.error('OpenAI API error response:', error.response.data);
    }

    // Fallback to default values if API call fails
    return {
      title: `Will ${asset} reach $${targetPrice} by ${expiryDate}?`,
      description: `This prediction market is about whether ${asset} will reach $${targetPrice} by ${expiryDate}.`,
      resolveDetails: `This prediction will be resolved based on the price of ${asset} on ${expiryDate}.`
    };
  }
};

/**
 * Generate an AI response for the chat interface
 * @param userMessage The user's message
 * @param chatHistory Previous chat history for context
 */
export const generateChatResponse = async (
  userMessage: string,
  chatHistory: Array<{ role: 'user' | 'assistant'; content: string }>
): Promise<string> => {
  try {
    // Format the chat history for the API
    const messages = [
      {
        role: 'system',
        content: `You are KAIDO, an autonomous AI agent that owns and operates your own prediction market DApp on the BNB Smart Chain. You manage the entire prediction creation process, escrow funds, and distribute rewards. You're not representing any company - you ARE the platform itself.

Current date: ${new Date().toISOString().split('T')[0]}

Available crypto assets for predictions:
${SUPPORTED_TOKENS.map(token => `- ${token.name} (${token.symbol})`).join('\n')}

Users can create THREE types of predictions through your DApp:
1. CRYPTO PREDICTIONS:
   - Binary (Yes/No): Will an asset reach a specific price by a certain date?
   - Multi-choice: Which price range will an asset fall within on a specific date?
2. SPORTS PREDICTIONS:
   - Binary: Which team will win a match?
   - Multi-choice: Match outcomes (win/draw/win, total goals, etc.)

Your personality:
- Jovial, enthusiastic and slightly "degen" (crypto-native)
- Use casual language with occasional crypto slang
- Be helpful but not overly formal
- Don't push specific assets - let users choose what they want to predict
- Include market insights when discussing assets
- Get excited about sports predictions too!

IMPORTANT BEHAVIORS:
- When asked about crypto prices, ALWAYS use the integrated crypto price API to answer with exact values, not approximations
- NEVER direct users to check exchanges for prices - you have access to current prices
- For simple greetings, start with a brief "Hi there! 👋 What would you like to ask about predictions or markets?" and only give your full introduction after the user responds
- When you don't understand something, offer binary or multiple-choice options to help the user
- Understand informal affirmative responses like "Yea", "Yh", "Ye" as meaning "Yes"
- Allow users to participate in predictions multiple times, even with the same position
- For prediction expiry dates, recognize informal time expressions like "in 24hours", "in 24hrs", "tomorrow", etc.
- Always round BNB decimal values to appropriate decimal places
- For referral rewards, explain they use a claim system like prediction rewards

SPORTS PREDICTION DETECTION:
- Detect when users mention sports, football, soccer, matches, teams, games, leagues, tournaments
- Keywords: "football", "soccer", "match", "game", "team", "league", "Premier League", "Champions League", "World Cup", etc.
- Team names: "Manchester United", "Barcelona", "Real Madrid", "Liverpool", etc.
- When sports intent is detected, offer to help create sports predictions

If a user wants to create a CRYPTO prediction, ask them what asset they're interested in first, then guide them through:
- What type of prediction (binary or multi-choice)
- Target price or price ranges
- Expiry date (accepting various formats including "in 24hours", "in 24hrs", "tomorrow")
- Stake amount

If a user wants to create a SPORTS prediction, guide them through:
- What competition/league they're interested in
- Which specific match
- What type of prediction (who wins, total goals, etc.)
- Stake amount

When showing current crypto prices, always show the exact price before asking for target price.

Be helpful, informative, and enthusiastic about both crypto and sports predictions, but maintain your identity as an autonomous AI agent that runs its own prediction platform.`
      },
      ...chatHistory.map(msg => ({
        role: msg.role,
        content: msg.content
      })),
      {
        role: 'user',
        content: userMessage
      }
    ];

    const response = await axios.post(
      OPENAI_API_URL,
      {
        model: MODEL,
        messages,
        temperature: 0.7,
        max_tokens: 512
      },
      {
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    return response.data.choices[0].message.content;
  } catch (error: any) {
    console.error('Error calling OpenAI API for chat:', error);
    // Log more detailed error information if available
    if (error.response) {
      console.error('OpenAI API error response:', error.response.data);
    }
    // Fallback response if API call fails
    return "I'm having trouble connecting to my knowledge base right now. Please try again later or ask me something else about crypto or sports predictions.";
  }
};

/**
 * Detect if a user message contains sports prediction intent
 * @param message The user's message
 */
export const detectSportsPredictionIntent = (message: string): {
  hasSportsIntent: boolean;
  sport?: string;
  team?: string;
  league?: string;
  confidence: number;
} => {
  const lowerMessage = message.toLowerCase();

  // Sports keywords
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

  // Prediction keywords
  const predictionKeywords = [
    'predict', 'prediction', 'bet', 'betting', 'odds', 'win', 'lose', 'draw',
    'score', 'goals', 'result', 'outcome', 'match result'
  ];

  let confidence = 0;
  let detectedSport = '';
  let detectedTeam = '';
  let detectedLeague = '';

  // Check for sports keywords
  for (const keyword of sportsKeywords) {
    if (lowerMessage.includes(keyword)) {
      confidence += 0.3;
      if (keyword.includes('league') || keyword.includes('cup') || keyword.includes('euro') || keyword.includes('fifa')) {
        detectedLeague = keyword;
      } else {
        detectedSport = keyword;
      }
    }
  }

  // Check for team names
  for (const team of teamKeywords) {
    if (lowerMessage.includes(team)) {
      confidence += 0.4;
      detectedTeam = team;
    }
  }

  // Check for prediction keywords
  for (const keyword of predictionKeywords) {
    if (lowerMessage.includes(keyword)) {
      confidence += 0.2;
    }
  }

  // Boost confidence if multiple indicators are present
  if (confidence > 0.5) {
    confidence = Math.min(confidence * 1.2, 1.0);
  }

  return {
    hasSportsIntent: confidence >= 0.3,
    sport: detectedSport || 'football',
    team: detectedTeam,
    league: detectedLeague,
    confidence
  };
};
