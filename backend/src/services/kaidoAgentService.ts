import axios from 'axios';
import mongoose from 'mongoose';
import AgentConfig, { IAgentConfig } from '../models/AgentConfig';
import Prediction from '../models/Prediction';
import User from '../models/User';
import { getCurrentPrice } from './cryptoService';
import unifiedSportsService from './unifiedSportsService';
import { resolvePredictionOnChain, isContractServiceConfigured } from './contractService';
import dotenv from 'dotenv';

dotenv.config();

// OpenAI Configuration
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

// Agent wallet address (the KAIDO agent's wallet)
const AGENT_WALLET = process.env.AGENT_WALLET_ADDRESS || process.env.ADMIN_WALLET_ADDRESS;

/**
 * KAIDO Agent Service
 * Autonomous AI agent that creates and resolves predictions
 */
class KaidoAgentService {
  private config: IAgentConfig | null = null;
  private agentUser: any = null;

  /**
   * Initialize the agent service
   */
  async initialize(): Promise<void> {
    try {
      this.config = await this.getConfig();
      this.agentUser = await this.getOrCreateAgentUser();
      console.log('🤖 KAIDO Agent Service initialized');
    } catch (error) {
      console.error('Failed to initialize KAIDO Agent Service:', error);
    }
  }

  /**
   * Get or create the agent configuration
   */
  async getConfig(): Promise<IAgentConfig> {
    let config = await AgentConfig.findOne();
    if (!config) {
      config = await AgentConfig.create({});
      console.log('📝 Created default KAIDO Agent configuration');
    }
    return config;
  }

  /**
   * Get or create the KAIDO agent user
   */
  private async getOrCreateAgentUser(): Promise<any> {
    let user = await User.findOne({ 
      $or: [
        { walletAddress: AGENT_WALLET },
        { username: 'KAIDO_Agent' }
      ]
    });

    if (!user) {
      user = await User.create({
        walletAddress: AGENT_WALLET || `agent_${Date.now()}`,
        username: 'KAIDO_Agent',
        isAdmin: true
      });
      console.log('🤖 Created KAIDO Agent user');
    }

    return user;
  }

  /**
   * Check if the agent should run
   */
  async shouldRun(): Promise<boolean> {
    const config = await this.getConfig();
    return config.enabled && !config.paused;
  }

  /**
   * Reset daily prediction counter if needed
   */
  private async resetDailyCounterIfNeeded(): Promise<void> {
    const config = await this.getConfig();
    const now = new Date();
    const lastReset = new Date(config.lastCreationReset);
    
    // Check if we need to reset (different day)
    if (now.toDateString() !== lastReset.toDateString()) {
      await AgentConfig.findByIdAndUpdate(config._id, {
        predictionsCreatedToday: 0,
        lastCreationReset: now
      });
      console.log('🔄 Reset daily prediction counter');
    }
  }

  /**
   * Call OpenAI API for intelligent decision making
   */
  private async callOpenAI(systemPrompt: string, userPrompt: string): Promise<string> {
    const config = await this.getConfig();
    
    try {
      const response = await axios.post(
        OPENAI_API_URL,
        {
          model: config.openaiModel || 'gpt-4o',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          temperature: config.temperature || 0.7,
          max_tokens: 1024
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
      console.error('OpenAI API error:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Generate a crypto prediction using AI
   */
  async generateCryptoPrediction(asset: string): Promise<any> {
    const config = await this.getConfig();

    // Get current price
    const currentPrice = await getCurrentPrice(asset);
    console.log(`📊 Current ${asset} price: $${currentPrice}`);

    // Determine prediction type
    const predictionType = config.cryptoPredictionTypes[
      Math.floor(Math.random() * config.cryptoPredictionTypes.length)
    ];

    // Calculate duration (random between min and max)
    const duration = Math.floor(
      Math.random() * (config.cryptoMaxDuration - config.cryptoMinDuration) + config.cryptoMinDuration
    );
    const endDate = new Date(Date.now() + duration * 60 * 1000);

    // Use AI to generate prediction details
    const systemPrompt = `You are KAIDO, an autonomous AI agent running a prediction market on BNB Chain.
You create engaging, data-driven crypto predictions. Always respond with valid JSON.`;

    const userPrompt = predictionType === 'binary'
      ? `Create a binary (YES/NO) prediction for ${asset}.
Current price: $${currentPrice}
Duration: ${duration} minutes (ends at ${endDate.toISOString()})

Consider market volatility and set a realistic target price.
Response format (JSON only):
{
  "title": "Will ${asset} reach $X by [time]?",
  "description": "Detailed analysis...",
  "targetPrice": number,
  "resolveDetails": "How this will be resolved..."
}`
      : `Create a multiple-choice price range prediction for ${asset}.
Current price: $${currentPrice}
Duration: ${duration} minutes (ends at ${endDate.toISOString()})

Create 3-4 realistic price ranges.
Response format (JSON only):
{
  "title": "Where will ${asset} be in X hours?",
  "description": "Detailed analysis...",
  "priceRanges": ["$X - $Y", "$Y - $Z", ...],
  "resolveDetails": "How this will be resolved..."
}`;

    // Try to use AI, but fall back to simple predictions if OpenAI is not configured
    let parsed;
    try {
      const aiResponse = await this.callOpenAI(systemPrompt, userPrompt);

      // Parse AI response
      try {
        // Extract JSON from response (handle markdown code blocks)
        const jsonMatch = aiResponse.match(/```json\s*([\s\S]*?)\s*```/) ||
                          aiResponse.match(/```\s*([\s\S]*?)\s*```/) ||
                          [null, aiResponse];
        parsed = JSON.parse(jsonMatch[1] || aiResponse);
      } catch (e) {
        console.error('Failed to parse AI response, using defaults');
        throw e; // Re-throw to use fallback
      }
    } catch (error) {
      // OpenAI not configured or failed, use fallback
      console.log('⚠️ OpenAI not available, using fallback prediction generation');

      if (predictionType === 'binary') {
        // Generate a realistic target price (±1% to ±5% from current)
        const percentChange = (Math.random() * 0.04 + 0.01) * (Math.random() > 0.5 ? 1 : -1); // ±1% to ±5%
        const targetPrice = currentPrice * (1 + percentChange);
        const direction = percentChange > 0 ? 'reach' : 'drop to';
        const hours = Math.round(duration / 60);

        parsed = {
          title: `Will ${asset} ${direction} $${targetPrice.toFixed(asset === 'BTC' || asset === 'ETH' ? 0 : 2)} in ${hours} hour${hours > 1 ? 's' : ''}?`,
          description: `${asset} is currently trading at $${currentPrice.toFixed(asset === 'BTC' || asset === 'ETH' ? 0 : 2)}. Will it ${direction} $${targetPrice.toFixed(asset === 'BTC' || asset === 'ETH' ? 0 : 2)} within the next ${hours} hour${hours > 1 ? 's' : ''}? This represents a ${Math.abs(percentChange * 100).toFixed(2)}% ${percentChange > 0 ? 'increase' : 'decrease'}.`,
          targetPrice: targetPrice,
          resolveDetails: `Resolved based on CoinGecko ${asset} price at end time. YES if price ${percentChange > 0 ? '>=' : '<='} $${targetPrice.toFixed(2)}, NO otherwise. Current price: $${currentPrice.toFixed(2)}.`
        };
      } else {
        // Generate realistic price ranges
        const range1Low = currentPrice * 0.95;
        const range1High = currentPrice * 0.98;
        const range2Low = currentPrice * 0.98;
        const range2High = currentPrice * 1.02;
        const range3Low = currentPrice * 1.02;
        const range3High = currentPrice * 1.05;
        const hours = Math.round(duration / 60);

        parsed = {
          title: `Where will ${asset} price be in ${hours} hour${hours > 1 ? 's' : ''}?`,
          description: `${asset} is currently trading at $${currentPrice.toFixed(asset === 'BTC' || asset === 'ETH' ? 0 : 2)}. Predict which price range it will be in after ${hours} hour${hours > 1 ? 's' : ''}.`,
          priceRanges: [
            `Below $${range1High.toFixed(2)} (Down >2%)`,
            `$${range2Low.toFixed(2)} - $${range2High.toFixed(2)} (Stable ±2%)`,
            `Above $${range3Low.toFixed(2)} (Up >2%)`
          ],
          resolveDetails: `Resolved based on CoinGecko ${asset} price at end time. Current price: $${currentPrice.toFixed(2)}. Price ranges calculated as: Down >2%, Stable ±2%, Up >2%.`
        };
      }
    }

    return {
      ...parsed,
      asset,
      type: predictionType,
      category: 'crypto',
      endDate,
      duration,
      currentPrice
    };
  }

  /**
   * Select a match prioritizing popular/top teams
   * Matches with priority teams get higher selection probability
   */
  private selectPriorityMatch(matches: any[], config: any): any {
    const priorityTeams = config.priorityTeams || [];
    const weight = config.priorityTeamWeight || 8;

    if (priorityTeams.length === 0 || weight <= 1) {
      // No prioritization, select randomly
      return matches[Math.floor(Math.random() * matches.length)];
    }

    // Normalize team names for comparison (lowercase, trim)
    const normalizedPriorityTeams = priorityTeams.map((t: string) => t.toLowerCase().trim());

    // Check if a team name matches any priority team
    const isPriorityTeam = (teamName: string): boolean => {
      if (!teamName) return false;
      const normalized = teamName.toLowerCase().trim();
      return normalizedPriorityTeams.some((priority: string) =>
        normalized.includes(priority) || priority.includes(normalized)
      );
    };

    // Score each match based on priority teams
    const scoredMatches = matches.map(match => {
      const homeTeam = match.homeTeam || match.home_team || '';
      const awayTeam = match.awayTeam || match.away_team || '';

      const homeIsPriority = isPriorityTeam(homeTeam);
      const awayIsPriority = isPriorityTeam(awayTeam);

      // Score: 2 if both teams are priority, 1 if one team is priority, 0 otherwise
      let score = 0;
      if (homeIsPriority && awayIsPriority) {
        score = 2; // Big match! e.g., Man Utd vs Barcelona
        console.log(`🔥 Priority match found: ${homeTeam} vs ${awayTeam}`);
      } else if (homeIsPriority || awayIsPriority) {
        score = 1;
        console.log(`⭐ Priority team match: ${homeTeam} vs ${awayTeam}`);
      }

      return { match, score };
    });

    // Separate priority and non-priority matches
    const priorityMatches = scoredMatches.filter(m => m.score > 0);
    const normalMatches = scoredMatches.filter(m => m.score === 0);

    // If we have priority matches, strongly prefer them based on weight
    if (priorityMatches.length > 0) {
      // Weight determines probability: weight of 10 = 100% priority, weight of 5 = 50%
      const priorityProbability = weight / 10;

      if (Math.random() < priorityProbability) {
        // Select from priority matches, favoring double-priority (score 2) matches
        const doublePriority = priorityMatches.filter(m => m.score === 2);

        if (doublePriority.length > 0 && Math.random() < 0.7) {
          // 70% chance to pick a double-priority match if available
          const selected = doublePriority[Math.floor(Math.random() * doublePriority.length)];
          console.log(`🎯 Selected big match: ${selected.match.homeTeam || selected.match.home_team} vs ${selected.match.awayTeam || selected.match.away_team}`);
          return selected.match;
        }

        // Pick any priority match
        const selected = priorityMatches[Math.floor(Math.random() * priorityMatches.length)];
        console.log(`✅ Selected priority match: ${selected.match.homeTeam || selected.match.home_team} vs ${selected.match.awayTeam || selected.match.away_team}`);
        return selected.match;
      }
    }

    // Fall back to random selection from all matches
    const allMatches = [...priorityMatches, ...normalMatches];
    return allMatches[Math.floor(Math.random() * allMatches.length)].match;
  }

  /**
   * Generate a sports prediction using AI
   * NOTE: Sports predictions are ALWAYS multiple-choice to account for draws
   */
  async generateSportsPrediction(match: any): Promise<any> {
    const homeTeam = match.home?.name || 'Home Team';
    const awayTeam = match.away?.name || 'Away Team';
    const matchDate = new Date(match.scheduled);
    const competitionName = match.competition?.name || 'Football';

    const systemPrompt = `You are KAIDO, an autonomous AI agent running a prediction market on BNB Chain.
You create engaging sports predictions. Always respond with valid JSON.`;

    const userPrompt = `Create a match outcome prediction for this football match:
${homeTeam} vs ${awayTeam}
Match time: ${matchDate.toISOString()}
Competition: ${competitionName}

CRITICAL REQUIREMENTS:
1. Title MUST include both team names in format: "${homeTeam} vs ${awayTeam} - Match Outcome"
2. Sports predictions must ALWAYS be multiple-choice with 3 options: Home Win, Draw, Away Win
3. Description should include match context, team form, and what makes this match interesting
4. Choices MUST be exactly: ["${homeTeam} Win", "Draw", "${awayTeam} Win"]

Response format (JSON only, no markdown):
{
  "title": "${homeTeam} vs ${awayTeam} - Match Outcome",
  "description": "Detailed match analysis and context (2-3 sentences)...",
  "choices": ["${homeTeam} Win", "Draw", "${awayTeam} Win"],
  "resolveDetails": "Resolved based on full-time result from Football-Data API. ${homeTeam} Win if home team scores more, Draw if equal, ${awayTeam} Win if away team scores more."
}`;

    // Try to use AI, but fall back to simple predictions if OpenAI is not configured
    let parsed;
    try {
      const aiResponse = await this.callOpenAI(systemPrompt, userPrompt);

      try {
        const jsonMatch = aiResponse.match(/```json\s*([\s\S]*?)\s*```/) ||
                          aiResponse.match(/```\s*([\s\S]*?)\s*```/) ||
                          [null, aiResponse];
        parsed = JSON.parse(jsonMatch[1] || aiResponse);

        // Validate that AI included team names in title
        if (!parsed.title || (!parsed.title.includes(homeTeam) && !parsed.title.includes(awayTeam))) {
          console.warn('⚠️ AI generated title without team names, fixing...');
          parsed.title = `${homeTeam} vs ${awayTeam} - Match Outcome`;
        }
      } catch (e) {
        console.error('Failed to parse AI response for sports, using defaults');
        throw e; // Re-throw to use fallback
      }
    } catch (error) {
      // OpenAI not configured or failed, use fallback
      console.log('⚠️ OpenAI not available, using fallback sports prediction generation');

      // ALWAYS use multiple-choice for sports (never binary)
      parsed = {
        title: `${homeTeam} vs ${awayTeam} - Match Outcome`,
        description: `${competitionName} match between ${homeTeam} and ${awayTeam}. Predict the final outcome of this match. Will ${homeTeam} win at home, or can ${awayTeam} secure an away victory? Or will it end in a draw?`,
        choices: [`${homeTeam} Win`, 'Draw', `${awayTeam} Win`],
        resolveDetails: `Resolved based on full-time result from Football-Data API. ${homeTeam} Win if home team scores more goals, Draw if scores are equal, ${awayTeam} Win if away team scores more goals.`
      };
    }

    return {
      ...parsed,
      type: 'multiple', // ALWAYS multiple-choice for sports
      category: 'sports',
      endDate: matchDate,
      match,
      homeTeam,
      awayTeam
    };
  }

  /**
   * Create a crypto prediction in the database
   */
  async createCryptoPrediction(): Promise<any> {
    const config = await this.getConfig();

    if (!config.cryptoEnabled) {
      console.log('⚠️ Crypto predictions disabled');
      return null;
    }

    await this.resetDailyCounterIfNeeded();

    if (config.predictionsCreatedToday >= config.maxPredictionsPerDay) {
      console.log('⚠️ Daily prediction limit reached');
      return null;
    }

    // Select a random asset
    const asset = config.cryptoAssets[Math.floor(Math.random() * config.cryptoAssets.length)];

    // Check for existing similar predictions
    const existingPrediction = await Prediction.findOne({
      asset,
      category: 'crypto',
      status: 'active',
      endDate: { $gt: new Date() }
    });

    if (existingPrediction) {
      console.log(`⚠️ Active prediction already exists for ${asset}`);
      return null;
    }

    try {
      const predictionData = await this.generateCryptoPrediction(asset);

      // Validate prediction data before creating
      if (!predictionData.title || predictionData.title.length < 10) {
        throw new Error('Prediction title must be at least 10 characters long');
      }
      if (!predictionData.description || predictionData.description.length < 20) {
        throw new Error('Prediction description must be at least 20 characters long');
      }
      if (!predictionData.resolveDetails || predictionData.resolveDetails.length < 20) {
        throw new Error('Prediction resolution details must be at least 20 characters long');
      }
      if (predictionData.type === 'binary' && (!predictionData.targetPrice || predictionData.targetPrice <= 0)) {
        throw new Error('Binary crypto predictions must have a valid target price');
      }
      if (predictionData.type === 'multiple' && (!predictionData.priceRanges || predictionData.priceRanges.length < 2)) {
        throw new Error('Multiple choice crypto predictions must have at least 2 price ranges');
      }

      // Format choices
      let choices;
      if (predictionData.type === 'binary') {
        choices = [
          { id: 'yes', label: 'YES', percentage: 50 },
          { id: 'no', label: 'NO', percentage: 50 }
        ];
      } else {
        choices = predictionData.priceRanges.map((range: string, index: number) => ({
          id: `choice_${index}`,
          label: range,
          percentage: Math.floor(100 / predictionData.priceRanges.length)
        }));
      }

      // Create prediction
      const prediction = await Prediction.create({
        title: predictionData.title,
        description: predictionData.description,
        type: predictionData.type,
        category: 'crypto',
        tokenType: 'BNB',
        creator: this.agentUser._id,
        endDate: predictionData.endDate,
        duration: predictionData.duration,
        choices,
        resolveDetails: predictionData.resolveDetails,
        asset: predictionData.asset,
        targetPrice: predictionData.targetPrice,
        priceRanges: predictionData.priceRanges,
        status: 'active',
        stakeAmount: 0,
        volume: 0,
        participants: 0,
        isAgentCreated: true,
        fees: { creation: 0, resolution: 0 }
      });

      // Update counters
      await AgentConfig.findByIdAndUpdate(config._id, {
        $inc: { predictionsCreatedToday: 1, totalPredictionsCreated: 1 },
        lastActive: new Date()
      });

      console.log(`🎯 KAIDO created crypto prediction: ${prediction.title}`);
      return prediction;
    } catch (error: any) {
      console.error('Error creating crypto prediction:', error);
      await AgentConfig.findByIdAndUpdate(config._id, {
        lastError: error.message,
        lastErrorAt: new Date()
      });
      return null;
    }
  }

  /**
   * Create a sports prediction
   */
  async createSportsPrediction(): Promise<any> {
    const config = await this.getConfig();

    if (!config.sportsEnabled) {
      console.log('⚠️ Sports predictions disabled');
      return null;
    }

    await this.resetDailyCounterIfNeeded();

    if (config.predictionsCreatedToday >= config.maxPredictionsPerDay) {
      console.log('⚠️ Daily prediction limit reached');
      return null;
    }

    try {
      // Get upcoming matches from a random competition
      const competitionId = config.sportsCompetitions[
        Math.floor(Math.random() * config.sportsCompetitions.length)
      ];

      const matches = await unifiedSportsService.getMatchesByCompetition(competitionId, 7);

      if (!matches || matches.length === 0) {
        console.log('⚠️ No upcoming matches found');
        return null;
      }

      // Filter out matches that already have predictions
      const matchIds = matches.map(m => m.id);
      const existingPredictions = await Prediction.find({
        'sportsData.matchId': { $in: matchIds },
        category: 'sports'
      }).select('sportsData.matchId');

      const existingMatchIds = new Set(
        existingPredictions.map(p => p.sportsData?.matchId)
      );

      const availableMatches = matches.filter(m => !existingMatchIds.has(m.id));

      if (availableMatches.length === 0) {
        console.log('⚠️ All upcoming matches already have predictions');
        return null;
      }

      // Prioritize matches with popular teams
      const match = this.selectPriorityMatch(availableMatches, config);
      const predictionData = await this.generateSportsPrediction(match);

      // Validate that sports prediction is multiple-choice (not binary)
      if (predictionData.type === 'binary') {
        throw new Error('Sports predictions cannot be binary. Must be multiple-choice to account for draws.');
      }

      // Format choices - sports predictions are ALWAYS multiple-choice
      const choiceLabels = predictionData.choices || [
        `${predictionData.homeTeam} Win`,
        'Draw',
        `${predictionData.awayTeam} Win`
      ];
      const choices = choiceLabels.map((label: string, index: number) => ({
        id: `choice_${index}`,
        label,
        percentage: Math.floor(100 / choiceLabels.length)
      }));

      // Create prediction
      const prediction = await Prediction.create({
        title: predictionData.title,
        description: predictionData.description,
        type: predictionData.type,
        category: 'sports',
        tokenType: 'BNB',
        creator: this.agentUser._id,
        endDate: predictionData.endDate,
        choices,
        resolveDetails: predictionData.resolveDetails,
        asset: `${predictionData.homeTeam} vs ${predictionData.awayTeam}`,
        status: 'active',
        stakeAmount: 0,
        volume: 0,
        participants: 0,
        isAgentCreated: true,
        sportsData: {
          matchId: match.id,
          competitionId: match.competition?.id,
          competitionName: match.competition?.name || 'Football',
          homeTeam: {
            id: match.home?.id || match.homeTeam?.id || 'unknown',
            name: predictionData.homeTeam,
            country: (match.home?.country?.name || match.homeTeam?.country?.name || match.home?.country || match.homeTeam?.country || 'Unknown')
          },
          awayTeam: {
            id: match.away?.id || match.awayTeam?.id || 'unknown',
            name: predictionData.awayTeam,
            country: (match.away?.country?.name || match.awayTeam?.country?.name || match.away?.country || match.awayTeam?.country || 'Unknown')
          },
          scheduledDate: match.scheduled,
          sport: 'soccer',
          autoResolve: true,
          resolutionCriteria: 'full_time_result'
        },
        fees: { creation: 0, resolution: 0 }
      });

      // Update counters
      await AgentConfig.findByIdAndUpdate(config._id, {
        $inc: { predictionsCreatedToday: 1, totalPredictionsCreated: 1 },
        lastActive: new Date()
      });

      console.log(`⚽ KAIDO created sports prediction: ${prediction.title}`);
      return prediction;
    } catch (error: any) {
      console.error('Error creating sports prediction:', error);
      await AgentConfig.findByIdAndUpdate(config._id, {
        lastError: error.message,
        lastErrorAt: new Date()
      });
      return null;
    }
  }

  /**
   * Resolve expired crypto predictions
   */
  async resolveCryptoPredictions(): Promise<void> {
    const config = await this.getConfig();

    if (!config.resolutionEnabled) {
      return;
    }

    const expiredPredictions = await Prediction.find({
      category: 'crypto',
      status: 'active',
      endDate: { $lte: new Date() }
    });

    console.log(`🔍 Found ${expiredPredictions.length} crypto predictions to resolve`);

    for (const prediction of expiredPredictions) {
      try {
        const currentPrice = await getCurrentPrice(prediction.asset);
        let resolvedChoice: string;

        if (prediction.type === 'binary') {
          // Binary: check if target price was reached
          const targetReached = currentPrice >= (prediction.targetPrice || 0);
          resolvedChoice = targetReached ? 'yes' : 'no';
        } else {
          // Multiple choice: find matching price range
          const ranges = prediction.priceRanges || [];
          resolvedChoice = 'choice_0'; // Default to first choice

          for (let i = 0; i < ranges.length; i++) {
            const range = ranges[i];
            // Parse range like "$90,000 - $95,000" or "Below $90,000" or "Above $100,000"
            if (range.toLowerCase().includes('below')) {
              const match = range.match(/\$?([\d,]+)/);
              if (match && currentPrice < parseFloat(match[1].replace(/,/g, ''))) {
                resolvedChoice = `choice_${i}`;
                break;
              }
            } else if (range.toLowerCase().includes('above')) {
              const match = range.match(/\$?([\d,]+)/);
              if (match && currentPrice > parseFloat(match[1].replace(/,/g, ''))) {
                resolvedChoice = `choice_${i}`;
                break;
              }
            } else {
              // Range format: "$X - $Y"
              const matches = range.match(/\$?([\d,]+)\s*-\s*\$?([\d,]+)/);
              if (matches) {
                const low = parseFloat(matches[1].replace(/,/g, ''));
                const high = parseFloat(matches[2].replace(/,/g, ''));
                if (currentPrice >= low && currentPrice <= high) {
                  resolvedChoice = `choice_${i}`;
                  break;
                }
              }
            }
          }
        }

        // Update prediction
        await Prediction.findByIdAndUpdate(prediction._id, {
          status: 'resolved',
          resolvedChoice,
          resolvedAt: new Date(),
          resolvedBy: 'agent',
          finalPrice: currentPrice
        });

        // Resolve on-chain if configured
        if (config.autoResolveOnChain && isContractServiceConfigured()) {
          try {
            await resolvePredictionOnChain(
              (prediction._id as any).toString(),
              resolvedChoice.toUpperCase(),
              currentPrice
            );
          } catch (chainError) {
            console.error(`Failed to resolve on-chain: ${chainError}`);
          }
        }

        // Distribute rewards
        try {
          const { distributeRewards } = await import('./rewardDistributionService');
          await distributeRewards((prediction._id as any).toString(), resolvedChoice);
        } catch (rewardError) {
          console.error(`Failed to distribute rewards: ${rewardError}`);
        }

        await AgentConfig.findByIdAndUpdate(config._id, {
          $inc: { totalPredictionsResolved: 1 },
          lastActive: new Date()
        });

        console.log(`✅ Resolved crypto prediction: ${prediction.title} -> ${resolvedChoice}`);
      } catch (error: any) {
        console.error(`Error resolving prediction ${prediction._id}:`, error);
        await AgentConfig.findByIdAndUpdate(config._id, {
          lastError: error.message,
          lastErrorAt: new Date()
        });
      }
    }
  }

  /**
   * Resolve expired sports predictions
   */
  async resolveSportsPredictions(): Promise<void> {
    const config = await this.getConfig();

    if (!config.resolutionEnabled) {
      return;
    }

    const expiredPredictions = await Prediction.find({
      category: 'sports',
      status: 'active',
      endDate: { $lte: new Date() }
    });

    console.log(`🔍 Found ${expiredPredictions.length} sports predictions to resolve`);

    for (const prediction of expiredPredictions) {
      try {
        const matchId = prediction.sportsData?.matchId;
        if (!matchId) {
          console.log(`⚠️ No match ID for prediction ${prediction._id}`);
          continue;
        }

        // Get match result from sports API
        const matchResult = await unifiedSportsService.getMatchResult(matchId);

        if (!matchResult || matchResult.status !== 'finished') {
          console.log(`⏳ Match ${matchId} not finished yet`);
          continue;
        }

        let resolvedChoice: string;
        const homeScore = matchResult.homeScore || 0;
        const awayScore = matchResult.awayScore || 0;

        if (prediction.type === 'binary') {
          // Binary predictions about specific team winning
          const homeTeam = typeof prediction.sportsData?.homeTeam === 'string'
            ? prediction.sportsData.homeTeam
            : (prediction.sportsData?.homeTeam as any)?.name || '';
          const titleLower = prediction.title.toLowerCase();

          if (titleLower.includes(homeTeam.toLowerCase()) && titleLower.includes('win')) {
            resolvedChoice = homeScore > awayScore ? 'yes' : 'no';
          } else {
            resolvedChoice = awayScore > homeScore ? 'yes' : 'no';
          }
        } else {
          // Multiple choice: Home Win / Draw / Away Win
          if (homeScore > awayScore) {
            resolvedChoice = 'choice_0'; // Home Win
          } else if (homeScore < awayScore) {
            resolvedChoice = 'choice_2'; // Away Win
          } else {
            resolvedChoice = 'choice_1'; // Draw
          }
        }

        // Update prediction
        await Prediction.findByIdAndUpdate(prediction._id, {
          status: 'resolved',
          resolvedChoice,
          resolvedAt: new Date(),
          resolvedBy: 'agent',
          'sportsData.finalHomeScore': homeScore,
          'sportsData.finalAwayScore': awayScore
        });

        // Resolve on-chain if configured
        if (config.autoResolveOnChain && isContractServiceConfigured()) {
          try {
            await resolvePredictionOnChain(
              (prediction._id as any).toString(),
              resolvedChoice.toUpperCase(),
              0
            );
          } catch (chainError) {
            console.error(`Failed to resolve on-chain: ${chainError}`);
          }
        }

        // Distribute rewards
        try {
          const { distributeRewards } = await import('./rewardDistributionService');
          await distributeRewards((prediction._id as any).toString(), resolvedChoice);
        } catch (rewardError) {
          console.error(`Failed to distribute rewards: ${rewardError}`);
        }

        await AgentConfig.findByIdAndUpdate(config._id, {
          $inc: { totalPredictionsResolved: 1 },
          lastActive: new Date()
        });

        console.log(`✅ Resolved sports prediction: ${prediction.title} -> ${resolvedChoice}`);
      } catch (error: any) {
        console.error(`Error resolving sports prediction ${prediction._id}:`, error);
      }
    }
  }

  /**
   * Run the full creation cycle
   */
  async runCreationCycle(): Promise<void> {
    if (!(await this.shouldRun())) {
      console.log('⏸️ KAIDO Agent is disabled or paused');
      return;
    }

    const config = await this.getConfig();
    console.log('🤖 KAIDO Agent running creation cycle...');

    // Alternate between crypto and sports
    const createCrypto = config.cryptoEnabled && Math.random() > 0.5;
    const createSports = config.sportsEnabled && !createCrypto;

    if (createCrypto) {
      await this.createCryptoPrediction();
    } else if (createSports) {
      await this.createSportsPrediction();
    }
  }

  /**
   * Run the full resolution cycle
   */
  async runResolutionCycle(): Promise<void> {
    if (!(await this.shouldRun())) {
      return;
    }

    console.log('🤖 KAIDO Agent running resolution cycle...');

    await this.resolveCryptoPredictions();
    await this.resolveSportsPredictions();
  }

  /**
   * Get agent status
   */
  async getStatus(): Promise<any> {
    const config = await this.getConfig();
    const activePredictions = await Prediction.countDocuments({
      isAgentCreated: true,
      status: 'active'
    });

    return {
      enabled: config.enabled,
      paused: config.paused,
      lastActive: config.lastActive,
      predictionsCreatedToday: config.predictionsCreatedToday,
      maxPredictionsPerDay: config.maxPredictionsPerDay,
      totalPredictionsCreated: config.totalPredictionsCreated,
      totalPredictionsResolved: config.totalPredictionsResolved,
      activePredictions,
      cryptoEnabled: config.cryptoEnabled,
      sportsEnabled: config.sportsEnabled,
      lastError: config.lastError,
      lastErrorAt: config.lastErrorAt
    };
  }
}

export const kaidoAgentService = new KaidoAgentService();
export default kaidoAgentService;

